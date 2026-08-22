/**
 * One-off dummy-data seed script for Dayflow HRMS.
 *
 * Seeds 10 employees (with realistic varied profile data, a 2-manager
 * hierarchy, bank/PAN/UAN fields), ~2 months of attendance history, a mix
 * of past + pending leave requests, one current salary_structures row each
 * (computed via the same formulas as migration 00003_hr_expansion.sql), and
 * a couple of upcoming holidays — all into the existing "Creative" org
 * (the user's real working admin account), so they show up immediately on
 * next admin login.
 *
 * Usage: npx tsx scripts/seed-dummy-data.ts
 *
 * Uses the service-role key (same client-creation pattern as
 * lib/supabase/admin.ts / app/api/admin/employees/route.ts) — never import
 * this script's approach into client-side code.
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import crypto from "crypto";
import type { Database } from "../lib/types/database.types";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
}

const supabase = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// The existing org with a real working admin account (found via profiles
// lookup before writing this script: "Creative" org, admin
// spec.priyanshu@gmail.com). "QA Test Co" was excluded — it's the leftover
// second-org account created for the not-yet-run adversarial RLS test in
// phases.md, not a real workspace.
const ORG_ID = "ca951de2-9253-4fe0-98fd-921467ea7954";
const ADMIN_ID = "1eef0f9f-b8b0-44f1-8657-152adeaf561e";

// ============================================================================
// Salary breakdown — reusable formula (also usable by a future admin
// salary-config UI). Mirrors the exact formulas from
// supabase/migrations/00003_hr_expansion.sql.
// ============================================================================

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeSalaryBreakdown(monthWage: number) {
  const basicSalary = round2(monthWage * 0.5);
  const hra = round2(basicSalary * 0.5);
  const standardAllowance = round2(monthWage * 0.1667);
  const performanceBonus = round2(basicSalary * 0.0833);
  const lta = round2(basicSalary * 0.0833);

  // TRUE REMAINDER — not a hardcoded 11.67% of month_wage. Computed after
  // rounding the other four components so gross earnings reconcile EXACTLY
  // to month_wage with zero drift, even after per-field rounding.
  const fixedAllowance = round2(
    monthWage - (basicSalary + hra + standardAllowance + performanceBonus + lta)
  );

  const employeePf = round2(basicSalary * 0.12);
  const employerPf = round2(basicSalary * 0.12);
  const professionalTax = 200;

  const grossEarnings = round2(
    basicSalary + hra + standardAllowance + performanceBonus + lta + fixedAllowance
  );
  const netPay = round2(grossEarnings - employeePf - professionalTax);

  return {
    basicSalary,
    hra,
    standardAllowance,
    performanceBonus,
    lta,
    fixedAllowance,
    employeePf,
    employerPf,
    professionalTax,
    netPay,
    grossEarnings, // should always equal monthWage
  };
}

// ============================================================================
// Helpers
// ============================================================================

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(8);
  let pw = "Df-";
  for (let i = 0; i < 8; i++) {
    pw += chars[bytes[i] % chars.length];
    if (i === 3) pw += "-";
  }
  return pw;
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function isWeekday(d: Date): boolean {
  const day = d.getUTCDay();
  return day !== 0 && day !== 6;
}

function fakeBankAccount(): string {
  let s = "";
  for (let i = 0; i < 14; i++) s += randInt(0, 9);
  return s;
}

function fakeIfsc(bankPrefix: string): string {
  return `${bankPrefix}0${randInt(100000, 999999)}`;
}

function fakePan(): string {
  const letters = () =>
    Array.from({ length: 5 }, () =>
      String.fromCharCode(65 + randInt(0, 25))
    ).join("");
  const l1 = letters().slice(0, 5);
  return `${l1}${randInt(1000, 9999)}${String.fromCharCode(65 + randInt(0, 25))}`;
}

function fakeUan(): string {
  let s = "";
  for (let i = 0; i < 12; i++) s += randInt(0, 9);
  return s;
}

const BANKS: [string, string][] = [
  ["HDFC Bank", "HDFC"],
  ["ICICI Bank", "ICIC"],
  ["State Bank of India", "SBIN"],
  ["Axis Bank", "UTIB"],
  ["Kotak Mahindra Bank", "KKBK"],
];

// ============================================================================
// Employee roster — 10 employees, 2 of them managers, forming a simple
// hierarchy. Spread across Engineering/Design/Sales/Marketing/HR.
// ============================================================================

type EmployeeDef = {
  key: string;
  full_name: string;
  email: string;
  job_title: string;
  department: string;
  location: string;
  managerKey: string | null;
  gender: string;
  marital_status: string;
  nationality: string;
  date_of_birth: string;
  date_of_joining: string;
  residing_address: string;
  monthWage: number;
};

const EMPLOYEES: EmployeeDef[] = [
  {
    key: "aditi",
    full_name: "Aditi Sharma",
    email: "aditi.sharma@dayflowdemo.io",
    job_title: "Engineering Manager",
    department: "Engineering",
    location: "Bangalore",
    managerKey: null,
    gender: "Female",
    marital_status: "Married",
    nationality: "Indian",
    date_of_birth: "1988-04-12",
    date_of_joining: "2023-02-01",
    residing_address: "204 Whitefield Residency, Bangalore, Karnataka",
    monthWage: 145000,
  },
  {
    key: "priya",
    full_name: "Priya Nair",
    email: "priya.nair@dayflowdemo.io",
    job_title: "Sales Manager",
    department: "Sales",
    location: "Mumbai",
    managerKey: null,
    gender: "Female",
    marital_status: "Married",
    nationality: "Indian",
    date_of_birth: "1985-09-23",
    date_of_joining: "2022-11-15",
    residing_address: "12B Andheri Heights, Mumbai, Maharashtra",
    monthWage: 138000,
  },
  {
    key: "rohan",
    full_name: "Rohan Mehta",
    email: "rohan.mehta@dayflowdemo.io",
    job_title: "Software Engineer",
    department: "Engineering",
    location: "Bangalore",
    managerKey: "aditi",
    gender: "Male",
    marital_status: "Single",
    nationality: "Indian",
    date_of_birth: "1996-01-15",
    date_of_joining: "2024-06-10",
    residing_address: "45 Koramangala 4th Block, Bangalore, Karnataka",
    monthWage: 78000,
  },
  {
    key: "kavya",
    full_name: "Kavya Iyer",
    email: "kavya.iyer@dayflowdemo.io",
    job_title: "Software Engineer",
    department: "Engineering",
    location: "Bangalore",
    managerKey: "aditi",
    gender: "Female",
    marital_status: "Single",
    nationality: "Indian",
    date_of_birth: "1998-07-30",
    date_of_joining: "2024-08-19",
    residing_address: "9 Indiranagar 100ft Road, Bangalore, Karnataka",
    monthWage: 74000,
  },
  {
    key: "aryan",
    full_name: "Aryan Verma",
    email: "aryan.verma@dayflowdemo.io",
    job_title: "UI/UX Designer",
    department: "Design",
    location: "Pune",
    managerKey: "aditi",
    gender: "Male",
    marital_status: "Single",
    nationality: "British",
    date_of_birth: "1994-11-02",
    date_of_joining: "2023-09-04",
    residing_address: "78 Koregaon Park, Pune, Maharashtra",
    monthWage: 68000,
  },
  {
    key: "neha",
    full_name: "Neha Kapoor",
    email: "neha.kapoor@dayflowdemo.io",
    job_title: "Product Designer",
    department: "Design",
    location: "Pune",
    managerKey: "aditi",
    gender: "Female",
    marital_status: "Married",
    nationality: "Indian",
    date_of_birth: "1992-03-19",
    date_of_joining: "2023-01-23",
    residing_address: "22 Baner Road, Pune, Maharashtra",
    monthWage: 92000,
  },
  {
    key: "karan",
    full_name: "Karan Malhotra",
    email: "karan.malhotra@dayflowdemo.io",
    job_title: "Sales Executive",
    department: "Sales",
    location: "Delhi",
    managerKey: "priya",
    gender: "Male",
    marital_status: "Single",
    nationality: "Indian",
    date_of_birth: "1995-06-08",
    date_of_joining: "2024-03-11",
    residing_address: "16 Connaught Place, New Delhi",
    monthWage: 52000,
  },
  {
    key: "simran",
    full_name: "Simran Kaur",
    email: "simran.kaur@dayflowdemo.io",
    job_title: "Marketing Specialist",
    department: "Marketing",
    location: "Delhi",
    managerKey: "priya",
    gender: "Female",
    marital_status: "Married",
    nationality: "Indian",
    date_of_birth: "1993-12-25",
    date_of_joining: "2023-07-17",
    residing_address: "31 Rajouri Garden, New Delhi",
    monthWage: 61000,
  },
  {
    key: "vikram",
    full_name: "Vikram Rao",
    email: "vikram.rao@dayflowdemo.io",
    job_title: "Content Strategist",
    department: "Marketing",
    location: "Mumbai",
    managerKey: "priya",
    gender: "Male",
    marital_status: "Single",
    nationality: "American",
    date_of_birth: "1997-02-14",
    date_of_joining: "2024-05-06",
    residing_address: "5 Bandra West, Mumbai, Maharashtra",
    monthWage: 58000,
  },
  {
    key: "ishaan",
    full_name: "Ishaan Gupta",
    email: "ishaan.gupta@dayflowdemo.io",
    job_title: "HR Executive",
    department: "HR",
    location: "Bangalore",
    managerKey: "priya",
    gender: "Male",
    marital_status: "Married",
    nationality: "Indian",
    date_of_birth: "1991-08-05",
    date_of_joining: "2022-10-02",
    residing_address: "63 HSR Layout, Bangalore, Karnataka",
    monthWage: 65000,
  },
];

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log(`Seeding into organization ${ORG_ID} ("Creative")...\n`);

  const profileIdByKey: Record<string, string> = {};
  const credentials: { employee_id: string; email: string; password: string }[] =
    [];

  // 1. Create employees (managers first — EMPLOYEES array is already ordered
  // so managerKey always resolves to an already-created profile).
  for (const emp of EMPLOYEES) {
    const tempPassword = generateTempPassword();
    const joiningYear = new Date(emp.date_of_joining).getFullYear();
    const nameParts = emp.full_name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];

    const { data: loginIdResult, error: loginIdError } = await supabase.rpc(
      "generate_login_id",
      {
        p_org_id: ORG_ID,
        p_first_name: firstName,
        p_last_name: lastName,
        p_joining_year: joiningYear,
      }
    );
    if (loginIdError) throw new Error(`generate_login_id failed for ${emp.full_name}: ${loginIdError.message}`);
    const employeeId = loginIdResult as string;

    // Look up if user already exists
    let userId: string;
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((u) => u.email === emp.email);

    if (existing) {
      userId = existing.id;
      // Update password so credentials match
      await supabase.auth.admin.updateUserById(userId, {
        password: tempPassword,
        user_metadata: { full_name: emp.full_name, employee_id: employeeId },
      });
      console.log(`  reusing existing auth user for ${emp.full_name} (${employeeId})`);
    } else {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: emp.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: emp.full_name, employee_id: employeeId },
      });
      if (createError) throw new Error(`createUser failed for ${emp.full_name}: ${createError.message}`);
      userId = newUser.user.id;
    }

    const [bankName, ifscPrefix] = pick(BANKS);

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: userId,
      organization_id: ORG_ID,
      employee_id: employeeId,
      full_name: emp.full_name,
      email: emp.email,
      role: "employee",
      job_title: emp.job_title,
      department: emp.department,
      date_of_joining: emp.date_of_joining,
      must_change_password: false,
      date_of_birth: emp.date_of_birth,
      residing_address: emp.residing_address,
      nationality: emp.nationality,
      gender: emp.gender,
      marital_status: emp.marital_status,
      manager_id: emp.managerKey ? profileIdByKey[emp.managerKey] : null,
      location: emp.location,
      bank_account_number: fakeBankAccount(),
      bank_name: bankName,
      ifsc_code: fakeIfsc(ifscPrefix),
      pan_no: fakePan(),
      uan_no: fakeUan(),
      phone: `+91 ${randInt(70000, 99999)}${randInt(10000, 99999)}`,
      address: emp.residing_address,
    });
    if (profileError) {
      throw new Error(`profile upsert failed for ${emp.full_name}: ${profileError.message}`);
    }

    profileIdByKey[emp.key] = userId;
    credentials.push({ employee_id: employeeId, email: emp.email, password: tempPassword });
    console.log(`  synced ${emp.full_name} (${employeeId})`);
  }

  const allUserIds = Object.values(profileIdByKey);

  // Clean old attendance, leaves, salary for these users to keep seed clean
  console.log("\nCleaning previous dummy data for seeded users...");
  await supabase.from("attendance").delete().in("user_id", allUserIds);
  await supabase.from("leave_requests").delete().in("user_id", allUserIds);
  await supabase.from("salary_structures").delete().in("user_id", allUserIds);

  // 2. Attendance — past ~2 months, weekdays only.
  console.log("\nSeeding attendance...");
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const twoMonthsAgo = new Date(today);
  twoMonthsAgo.setUTCDate(twoMonthsAgo.getUTCDate() - 60);

  let attendanceRows: Database["public"]["Tables"]["attendance"]["Insert"][] = [];

  for (const emp of EMPLOYEES) {
    const userId = profileIdByKey[emp.key];
    for (
      let d = new Date(twoMonthsAgo);
      d <= today;
      d.setUTCDate(d.getUTCDate() + 1)
    ) {
      if (!isWeekday(d)) continue;
      const dateStr = fmtDate(d);

      const roll = Math.random();
      let status: string;
      if (roll < 0.85) status = "present";
      else if (roll < 0.92) status = "half-day";
      else if (roll < 0.96) status = "absent";
      else status = "leave";

      let check_in: string | null = null;
      let check_out: string | null = null;
      if (status === "present" || status === "half-day") {
        const inH = 9;
        const inM = randInt(0, 30);
        check_in = `${dateStr}T${String(inH).padStart(2, "0")}:${String(inM).padStart(2, "0")}:00Z`;
        if (status === "present") {
          const outH = randInt(17, 18);
          const outM = randInt(0, 59);
          check_out = `${dateStr}T${String(outH).padStart(2, "0")}:${String(outM).padStart(2, "0")}:00Z`;
        } else {
          // half-day: shorter day
          const outH = randInt(13, 14);
          const outM = randInt(0, 59);
          check_out = `${dateStr}T${String(outH).padStart(2, "0")}:${String(outM).padStart(2, "0")}:00Z`;
        }
      }

      attendanceRows.push({
        organization_id: ORG_ID,
        user_id: userId,
        date: dateStr,
        check_in,
        check_out,
        status,
      });
    }
  }

  for (let i = 0; i < attendanceRows.length; i += 500) {
    const batch = attendanceRows.slice(i, i + 500);
    const { error } = await supabase.from("attendance").insert(batch);
    if (error) throw new Error(`attendance insert failed: ${error.message}`);
  }
  console.log(`  inserted ${attendanceRows.length} attendance rows`);

  // 3. Leave requests — 2-4 past (approved/rejected) + 1-2 pending (near future).
  console.log("\nSeeding leave requests...");
  const leaveTypes = ["paid", "sick", "unpaid"] as const;
  const pastRemarks = [
    "Family function",
    "Not feeling well",
    "Personal work",
    "Attending a wedding",
    "Travel back to hometown",
    "Medical appointment",
  ];
  const rejectComments = [
    "Insufficient notice given for this period.",
    "Team has a critical deadline during these dates — please reschedule.",
    "Too many overlapping leave requests this week.",
  ];

  let leaveRows: Database["public"]["Tables"]["leave_requests"]["Insert"][] = [];

  for (const emp of EMPLOYEES) {
    const userId = profileIdByKey[emp.key];

    // Past requests
    const pastCount = randInt(2, 4);
    for (let i = 0; i < pastCount; i++) {
      const daysAgo = randInt(3, 58);
      const start = new Date(today);
      start.setUTCDate(start.getUTCDate() - daysAgo);
      const span = randInt(1, 5);
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + span - 1);

      const approved = Math.random() < 0.7;
      const createdAt = new Date(start);
      createdAt.setUTCDate(createdAt.getUTCDate() - randInt(2, 6));
      const reviewedAt = new Date(createdAt);
      reviewedAt.setUTCDate(reviewedAt.getUTCDate() + randInt(1, 2));

      leaveRows.push({
        organization_id: ORG_ID,
        user_id: userId,
        leave_type: pick([...leaveTypes]),
        start_date: fmtDate(start),
        end_date: fmtDate(end),
        remarks: pick(pastRemarks),
        status: approved ? "approved" : "rejected",
        admin_comment: approved ? null : pick(rejectComments),
        reviewed_by: ADMIN_ID,
        reviewed_at: reviewedAt.toISOString(),
        created_at: createdAt.toISOString(),
      });
    }

    // Pending near-future requests
    const pendingCount = randInt(1, 2);
    for (let i = 0; i < pendingCount; i++) {
      const daysAhead = randInt(3, 28);
      const start = new Date(today);
      start.setUTCDate(start.getUTCDate() + daysAhead);
      const span = randInt(1, 5);
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + span - 1);

      leaveRows.push({
        organization_id: ORG_ID,
        user_id: userId,
        leave_type: pick([...leaveTypes]),
        start_date: fmtDate(start),
        end_date: fmtDate(end),
        remarks: pick(pastRemarks),
        status: "pending",
        admin_comment: null,
        reviewed_by: null,
        reviewed_at: null,
      });
    }
  }

  for (let i = 0; i < leaveRows.length; i += 200) {
    const batch = leaveRows.slice(i, i + 200);
    const { error } = await supabase.from("leave_requests").insert(batch);
    if (error) throw new Error(`leave_requests insert failed: ${error.message}`);
  }
  console.log(`  inserted ${leaveRows.length} leave requests`);

  // 4. Salary structures — one current row per employee.
  console.log("\nSeeding salary structures...");
  const salaryRows: Database["public"]["Tables"]["salary_structures"]["Insert"][] =
    EMPLOYEES.map((emp) => {
      const b = computeSalaryBreakdown(emp.monthWage);
      const otherAllowances = round2(
        b.hra + b.standardAllowance + b.performanceBonus + b.lta + b.fixedAllowance
      );
      const totalDeductions = round2(b.employeePf + b.professionalTax);
      return {
        organization_id: ORG_ID,
        user_id: profileIdByKey[emp.key],
        // Old columns kept populated for backward compatibility.
        base_salary: b.basicSalary,
        allowances: otherAllowances,
        deductions: totalDeductions,
        effective_from: emp.date_of_joining,
        // New breakdown columns.
        month_wage: emp.monthWage,
        working_days_per_week: 5,
        break_time_hours: 1,
        basic_salary: b.basicSalary,
        hra: b.hra,
        standard_allowance: b.standardAllowance,
        performance_bonus: b.performanceBonus,
        lta: b.lta,
        fixed_allowance: b.fixedAllowance,
        employee_pf: b.employeePf,
        employer_pf: b.employerPf,
        professional_tax: b.professionalTax,
        net_pay: b.netPay,
        updated_by: ADMIN_ID,
      };
    });

  const { error: salaryError } = await supabase
    .from("salary_structures")
    .insert(salaryRows);
  if (salaryError) throw new Error(`salary_structures insert failed: ${salaryError.message}`);
  console.log(`  inserted ${salaryRows.length} salary structure rows`);

  // Sanity-check the true-remainder reconciliation for one employee.
  const sample = computeSalaryBreakdown(EMPLOYEES[0].monthWage);
  console.log(
    `  reconciliation check (${EMPLOYEES[0].full_name}): gross=${sample.grossEarnings} vs month_wage=${EMPLOYEES[0].monthWage}`
  );

  // 5. Holidays — only if none exist yet for this org.
  console.log("\nChecking holidays...");
  const { count: holidayCount } = await supabase
    .from("holidays")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", ORG_ID);

  if (!holidayCount) {
    const { error: holidaysError } = await supabase.from("holidays").insert([
      { organization_id: ORG_ID, name: "Gandhi Jayanti", date: "2026-10-02" },
      { organization_id: ORG_ID, name: "Diwali", date: "2026-11-08" },
      { organization_id: ORG_ID, name: "Christmas", date: "2026-12-25" },
    ]);
    if (holidaysError) throw new Error(`holidays insert failed: ${holidaysError.message}`);
    console.log("  inserted 3 holiday rows");
  } else {
    console.log(`  org already has ${holidayCount} holiday(s), skipping`);
  }

  // 6. Print credentials for reference.
  console.log("\n=== Seeded employee credentials (must_change_password=true) ===");
  for (const c of credentials) {
    console.log(`  ${c.employee_id.padEnd(14)}  ${c.email.padEnd(30)}  ${c.password}`);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("\nSeed script failed:", err);
  process.exit(1);
});
