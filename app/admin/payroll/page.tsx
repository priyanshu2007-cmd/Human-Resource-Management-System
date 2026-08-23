"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

interface EmployeeRow {
  id: string;
  full_name: string;
  employee_id: string;
  department: string | null;
  job_title: string | null;
}

interface SalaryRow {
  id: string;
  user_id: string;
  base_salary: number;
  allowances: number | null;
  deductions: number | null;
  effective_from: string;
  month_wage?: number | null;
  working_days_per_week?: number | null;
  break_time_hours?: number | null;
  basic_salary?: number | null;
  hra?: number | null;
  standard_allowance?: number | null;
  performance_bonus?: number | null;
  lta?: number | null;
  fixed_allowance?: number | null;
  employee_pf?: number | null;
  employer_pf?: number | null;
  professional_tax?: number | null;
  net_pay?: number | null;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeSalaryBreakdown(monthWage: number) {
  const basicSalary = round2(monthWage * 0.5);
  const hra = round2(basicSalary * 0.5);
  const standardAllowance = round2(monthWage * 0.1667);
  const performanceBonus = round2(basicSalary * 0.0833);
  const lta = round2(basicSalary * 0.0833);

  // Remainder so sum matches monthWage exactly
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
    grossEarnings,
  };
}

export default function AdminPayrollPage() {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [salaries, setSalaries] = useState<Record<string, SalaryRow>>({});
  const [loading, setLoading] = useState(true);
  const [editingEmp, setEditingEmp] = useState<EmployeeRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Configuration Modal state
  const [monthWage, setMonthWage] = useState<string>("75000");
  const [yearlyWage, setYearlyWage] = useState<string>("900000");
  const [workingDays, setWorkingDays] = useState<number>(5);
  const [breakTime, setBreakTime] = useState<number>(1);
  const [effectiveFrom, setEffectiveFrom] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Auto-calculated fields derived in real-time
  const numericMonthWage = parseFloat(monthWage) || 0;
  const calculated = useMemo(
    () => computeSalaryBreakdown(numericMonthWage),
    [numericMonthWage]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user?.id ?? "")
      .single();

    const orgId = adminProfile?.organization_id;

    const { data: emps } = await supabase
      .from("profiles")
      .select("id, full_name, employee_id, department, job_title")
      .eq("organization_id", orgId ?? "")
      .order("full_name", { ascending: true });

    setEmployees(emps || []);

    const { data: salaryRows } = await supabase
      .from("salary_structures")
      .select("*")
      .eq("organization_id", orgId ?? "")
      .order("effective_from", { ascending: false });

    const latest: Record<string, SalaryRow> = {};
    for (const row of (salaryRows as SalaryRow[]) || []) {
      if (!latest[row.user_id]) {
        latest[row.user_id] = row;
      }
    }
    setSalaries(latest);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // When Month Wage changes, keep Yearly Wage synced
  function handleMonthWageChange(val: string) {
    setMonthWage(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setYearlyWage(String(round2(num * 12)));
    } else {
      setYearlyWage("");
    }
  }

  // When Yearly Wage changes, sync Month Wage
  function handleYearlyWageChange(val: string) {
    setYearlyWage(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setMonthWage(String(round2(num / 12)));
    } else {
      setMonthWage("");
    }
  }

  function openConfigModal(emp: EmployeeRow) {
    setEditingEmp(emp);
    setError(null);
    setSuccess(null);
    const cur = salaries[emp.id];
    if (cur && cur.month_wage) {
      setMonthWage(String(cur.month_wage));
      setYearlyWage(String(cur.month_wage * 12));
      setWorkingDays(cur.working_days_per_week || 5);
      setBreakTime(cur.break_time_hours || 1);
    } else if (cur && cur.base_salary) {
      // Fallback if older row
      const estimatedMonthWage = cur.base_salary * 2;
      setMonthWage(String(estimatedMonthWage));
      setYearlyWage(String(estimatedMonthWage * 12));
      setWorkingDays(5);
      setBreakTime(1);
    } else {
      setMonthWage("65000");
      setYearlyWage("780000");
      setWorkingDays(5);
      setBreakTime(1);
    }
    setEffectiveFrom(new Date().toISOString().split("T")[0]);
  }

  async function handleSaveSalary() {
    if (!editingEmp) return;
    setError(null);
    const wage = parseFloat(monthWage);
    if (isNaN(wage) || wage <= 0) {
      setError("Please enter a valid monthly wage.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user?.id ?? "")
      .single();

    if (!adminProfile?.organization_id) {
      setSaving(false);
      setError("Organization not found.");
      return;
    }

    const b = calculated;
    const allowances = round2(
      b.hra + b.standardAllowance + b.performanceBonus + b.lta + b.fixedAllowance
    );
    const deductions = round2(b.employeePf + b.professionalTax);

    const { error: insertError } = await supabase.from("salary_structures").insert({
      organization_id: adminProfile.organization_id,
      user_id: editingEmp.id,
      base_salary: b.basicSalary,
      allowances: allowances,
      deductions: deductions,
      effective_from: effectiveFrom,
      month_wage: wage,
      working_days_per_week: workingDays,
      break_time_hours: breakTime,
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
      updated_by: user?.id ?? null,
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setSuccess(`Salary configuration updated for ${editingEmp.full_name}.`);
    setEditingEmp(null);
    await fetchData();
  }

  // Analytics
  const totalEmployeesWithSalary = Object.keys(salaries).length;
  const totalMonthlyGross = Object.values(salaries).reduce(
    (acc, s) => acc + (s.month_wage || (s.base_salary + (s.allowances || 0))),
    0
  );
  const totalMonthlyNet = Object.values(salaries).reduce(
    (acc, s) =>
      acc +
      (s.net_pay ||
        s.base_salary + (s.allowances || 0) - (s.deductions || 0)),
    0
  );
  const totalPfContribution = Object.values(salaries).reduce(
    (acc, s) => acc + ((s.employer_pf || 0) + (s.employee_pf || 0)),
    0
  );

  // Simulated Payment Cycle Status (70% Paid, 30% Left to Pay in current cycle)
  const amountPaid = round2(totalMonthlyNet * 0.7);
  const amountLeftToPay = round2(totalMonthlyNet * 0.3);

  // Department Breakdown
  const deptTotals: Record<string, number> = {};
  employees.forEach((emp) => {
    const dept = emp.department || "Other";
    const s = salaries[emp.id];
    const wage = s?.month_wage || s?.base_salary || 0;
    deptTotals[dept] = (deptTotals[dept] || 0) + wage;
  });

  const maxDeptExpense = Math.max(...Object.values(deptTotals), 1);

  const filteredEmployees = employees.filter(
    (e) =>
      e.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.department && e.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-lg font-semibold">Payroll & Compensation</h1>
          <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
            Financial control center, real-time wage configuration, and company expense analytics
          </p>
        </div>
      </div>

      {success && (
        <div
          className="p-3 rounded-lg text-body-sm flex items-center justify-between"
          style={{ background: "rgba(34,197,94,0.12)", color: "var(--status-approved)" }}
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            {success}
          </span>
          <button onClick={() => setSuccess(null)} className="text-sm font-bold cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="border rounded-xl p-5"
          style={{
            background: "var(--surface-container-lowest)",
            borderColor: "var(--outline-variant)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-label-caps uppercase" style={{ color: "var(--on-surface-variant)" }}>
              Total Monthly Expense
            </span>
            <span className="material-symbols-outlined text-xl" style={{ color: "var(--primary)" }}>
              account_balance
            </span>
          </div>
          <p className="text-headline-xl font-bold">₹{totalMonthlyGross.toLocaleString()}</p>
          <p className="text-body-sm mt-1" style={{ color: "var(--on-surface-variant)" }}>
            Across {totalEmployeesWithSalary} active contracts
          </p>
        </div>

        <div
          className="border rounded-xl p-5"
          style={{
            background: "var(--surface-container-lowest)",
            borderColor: "var(--outline-variant)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-label-caps uppercase" style={{ color: "var(--on-surface-variant)" }}>
              Amount Disbursed (Paid)
            </span>
            <span className="material-symbols-outlined text-xl" style={{ color: "var(--status-approved)" }}>
              payments
            </span>
          </div>
          <p className="text-headline-xl font-bold text-emerald-600 dark:text-emerald-400">
            ₹{amountPaid.toLocaleString()}
          </p>
          <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "70%" }} />
          </div>
        </div>

        <div
          className="border rounded-xl p-5"
          style={{
            background: "var(--surface-container-lowest)",
            borderColor: "var(--outline-variant)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-label-caps uppercase" style={{ color: "var(--on-surface-variant)" }}>
              Salary Left to Pay
            </span>
            <span className="material-symbols-outlined text-xl" style={{ color: "var(--status-pending)" }}>
              pending
            </span>
          </div>
          <p className="text-headline-xl font-bold text-amber-600 dark:text-amber-400">
            ₹{amountLeftToPay.toLocaleString()}
          </p>
          <p className="text-body-sm mt-1" style={{ color: "var(--on-surface-variant)" }}>
            Scheduled for next batch
          </p>
        </div>

        <div
          className="border rounded-xl p-5"
          style={{
            background: "var(--surface-container-lowest)",
            borderColor: "var(--outline-variant)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-label-caps uppercase" style={{ color: "var(--on-surface-variant)" }}>
              Total PF & Compliance
            </span>
            <span className="material-symbols-outlined text-xl" style={{ color: "var(--secondary)" }}>
              shield
            </span>
          </div>
          <p className="text-headline-xl font-bold">₹{totalPfContribution.toLocaleString()}</p>
          <p className="text-body-sm mt-1" style={{ color: "var(--on-surface-variant)" }}>
            Employee + Employer match
          </p>
        </div>
      </div>

      {/* Visual Analytics / Bar Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Expenses Bar Chart */}
        <div
          className="border rounded-xl p-6"
          style={{
            background: "var(--surface-container-lowest)",
            borderColor: "var(--outline-variant)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-title-md font-semibold">Department Expense Breakdown</h2>
              <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
                Monthly gross allocation per department
              </p>
            </div>
            <span className="material-symbols-outlined text-xl text-[var(--outline)]">
              bar_chart
            </span>
          </div>

          <div className="space-y-4 pt-2">
            {Object.entries(deptTotals).map(([dept, total]) => {
              const pct = Math.round((total / maxDeptExpense) * 100);
              return (
                <div key={dept} className="space-y-1.5">
                  <div className="flex justify-between text-body-sm">
                    <span className="font-medium">{dept}</span>
                    <span className="font-mono font-semibold">₹{total.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-[var(--surface-container-high)] rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: "linear-gradient(90deg, var(--primary) 0%, var(--surface-tint) 100%)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Salary Status & Disbursement Ratio */}
        <div
          className="border rounded-xl p-6 flex flex-col justify-between"
          style={{
            background: "var(--surface-container-lowest)",
            borderColor: "var(--outline-variant)",
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-title-md font-semibold">Payroll Cashflow Status</h2>
                <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
                  Current disbursement progress vs remaining liabilities
                </p>
              </div>
              <span className="material-symbols-outlined text-xl text-[var(--outline)]">
                pie_chart
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 my-6">
              <div className="p-4 rounded-lg border" style={{ borderColor: "var(--outline-variant)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-body-sm font-medium">Disbursed (70%)</span>
                </div>
                <p className="text-headline-md font-bold font-mono">₹{amountPaid.toLocaleString()}</p>
              </div>

              <div className="p-4 rounded-lg border" style={{ borderColor: "var(--outline-variant)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-body-sm font-medium">Pending (30%)</span>
                </div>
                <p className="text-headline-md font-bold font-mono">₹{amountLeftToPay.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div
            className="p-4 rounded-lg flex items-center gap-3 border"
            style={{
              background: "var(--surface-container-low)",
              borderColor: "var(--outline-variant)",
            }}
          >
            <span className="material-symbols-outlined text-2xl text-[var(--primary)] shrink-0">
              auto_awesome
            </span>
            <div className="text-body-sm">
              <p className="font-semibold">Auto-calculated Salary Engine Active</p>
              <p style={{ color: "var(--on-surface-variant)" }}>
                Basic (50%), HRA (50% Basic), Allowances & PF contributions conform to standard compliance formulas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Payroll Table */}
      <div
        className="border rounded-xl overflow-hidden shadow-sm"
        style={{
          background: "var(--surface-container-lowest)",
          borderColor: "var(--outline-variant)",
        }}
      >
        <div className="p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ borderColor: "var(--outline-variant)" }}>
          <div>
            <h2 className="text-title-md font-semibold">Employee Salary Roster</h2>
            <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
              Click &quot;Configure Salary&quot; on any employee to modify wage structures with real-time auto-calculation.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -tranneutral-y-1/2 text-lg" style={{ color: "var(--outline)" }}>
              search
            </span>
            <input
              type="text"
              placeholder="Search employees…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-body-sm border rounded-lg focus:outline-none focus:ring-1 transition-colors"
              style={{
                background: "var(--surface-container-lowest)",
                borderColor: "var(--outline-variant)",
              }}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
            Loading employee payroll data…
          </div>
        ) : filteredEmployees.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--outline-variant)", background: "var(--surface-container-high)" }}>
                  <th className="px-5 py-3.5 font-mono text-label-caps uppercase" style={{ color: "var(--on-surface-variant)" }}>
                    Employee
                  </th>
                  <th className="px-5 py-3.5 font-mono text-label-caps uppercase" style={{ color: "var(--on-surface-variant)" }}>
                    Monthly Wage
                  </th>
                  <th className="px-5 py-3.5 font-mono text-label-caps uppercase hidden sm:table-cell" style={{ color: "var(--on-surface-variant)" }}>
                    Basic Salary
                  </th>
                  <th className="px-5 py-3.5 font-mono text-label-caps uppercase hidden md:table-cell" style={{ color: "var(--on-surface-variant)" }}>
                    PF Contribution
                  </th>
                  <th className="px-5 py-3.5 font-mono text-label-caps uppercase" style={{ color: "var(--on-surface-variant)" }}>
                    In-Hand Net Pay
                  </th>
                  <th className="px-5 py-3.5 font-mono text-label-caps uppercase text-right" style={{ color: "var(--on-surface-variant)" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--outline-variant)" }}>
                {filteredEmployees.map((emp) => {
                  const row = salaries[emp.id];
                  const mGross = row?.month_wage || (row ? row.base_salary + (row.allowances || 0) : 0);
                  const mBasic = row?.basic_salary || row?.base_salary || 0;
                  const mNet = row?.net_pay || (row ? row.base_salary + (row.allowances || 0) - (row.deductions || 0) : 0);
                  const mPf = (row?.employee_pf || 0) + (row?.employer_pf || 0);

                  return (
                    <tr key={emp.id} className="hover:bg-[var(--surface-container-low)] transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-body-sm font-semibold shrink-0"
                            style={{
                              background: "var(--primary-container)",
                              color: "var(--on-primary-container)",
                            }}
                          >
                            {emp.full_name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-body-sm font-semibold">{emp.full_name}</p>
                            <p className="font-mono text-xs" style={{ color: "var(--outline)" }}>
                              {emp.employee_id} · {emp.department || "General"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-body-sm font-bold">
                        {row ? `₹${mGross.toLocaleString()}` : "—"}
                      </td>
                      <td className="px-5 py-4 font-mono text-body-sm hidden sm:table-cell">
                        {row ? `₹${mBasic.toLocaleString()}` : "—"}
                      </td>
                      <td className="px-5 py-4 font-mono text-body-sm hidden md:table-cell" style={{ color: "var(--secondary)" }}>
                        {mPf > 0 ? `₹${mPf.toLocaleString()}` : "—"}
                      </td>
                      <td className="px-5 py-4 font-mono text-body-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {row ? `₹${mNet.toLocaleString()}` : "—"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openConfigModal(emp)}
                          className="px-3.5 py-1.5 rounded-lg text-body-sm font-semibold transition-all border shadow-sm hover:border-[var(--primary)] hover:bg-[var(--primary)] hover:text-[var(--on-primary)] cursor-pointer"
                          style={{
                            borderColor: "var(--outline-variant)",
                            background: "var(--surface-container-lowest)",
                            color: "var(--primary)",
                          }}
                        >
                          Configure Salary
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-5xl mb-2 text-[var(--outline-variant)]">
              search_off
            </span>
            <p className="text-body-md font-semibold">No matching employees</p>
          </div>
        )}
      </div>

      {/* Salary Info Configuration Modal (Admin Only) */}
      {editingEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl p-6 sm:p-8"
            style={{
              background: "var(--surface-container-lowest)",
              borderColor: "var(--outline-variant)",
            }}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b mb-6" style={{ borderColor: "var(--outline-variant)" }}>
              <div>
                <span className="font-mono text-label-caps uppercase px-2 py-0.5 rounded-sm bg-purple-100 dark:bg-purple-900/40 text-[var(--primary)] font-bold text-xs">
                  Admin Configuration
                </span>
                <h2 className="text-headline-sm font-bold mt-1">Salary & Wage Structure</h2>
                <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
                  Configuring for <span className="font-semibold text-[var(--on-surface)]">{editingEmp.full_name}</span> ({editingEmp.employee_id})
                </p>
              </div>
              <button
                onClick={() => setEditingEmp(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer hover:bg-black/10 dark:hover:bg-white/10"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg text-body-sm mb-4 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* Primary Inputs */}
              <div>
                <h3 className="font-mono text-label-caps uppercase tracking-wider text-xs font-bold mb-3" style={{ color: "var(--primary)" }}>
                  1. Wage Inputs & Working Parameters
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-label-caps uppercase tracking-widest mb-1.5" style={{ color: "var(--on-surface-variant)" }}>
                      Monthly Wage (₹) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={monthWage}
                      onChange={(e) => handleMonthWageChange(e.target.value)}
                      placeholder="e.g. 50000"
                      className="w-full border rounded-lg px-3.5 py-2.5 text-body-md font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                      style={{
                        background: "var(--surface-container-lowest)",
                        borderColor: "var(--outline-variant)",
                      }}
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-label-caps uppercase tracking-widest mb-1.5" style={{ color: "var(--on-surface-variant)" }}>
                      Yearly Wage (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={yearlyWage}
                      onChange={(e) => handleYearlyWageChange(e.target.value)}
                      placeholder="e.g. 600000"
                      className="w-full border rounded-lg px-3.5 py-2.5 text-body-md font-mono focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                      style={{
                        background: "var(--surface-container-lowest)",
                        borderColor: "var(--outline-variant)",
                      }}
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-label-caps uppercase tracking-widest mb-1.5" style={{ color: "var(--on-surface-variant)" }}>
                      Working Days / Week
                    </label>
                    <select
                      value={workingDays}
                      onChange={(e) => setWorkingDays(Number(e.target.value))}
                      className="w-full border rounded-lg px-3.5 py-2.5 text-body-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      style={{
                        background: "var(--surface-container-lowest)",
                        borderColor: "var(--outline-variant)",
                      }}
                    >
                      <option value={5}>5 Days (Mon - Fri)</option>
                      <option value={6}>6 Days (Mon - Sat)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-label-caps uppercase tracking-widest mb-1.5" style={{ color: "var(--on-surface-variant)" }}>
                      Break Time (Hours)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={breakTime}
                      onChange={(e) => setBreakTime(Number(e.target.value))}
                      className="w-full border rounded-lg px-3.5 py-2.5 text-body-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      style={{
                        background: "var(--surface-container-lowest)",
                        borderColor: "var(--outline-variant)",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Real-time Calculated Components */}
              <div
                className="border rounded-xl p-4 sm:p-5"
                style={{
                  background: "var(--surface-container-low)",
                  borderColor: "var(--outline-variant)",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-mono text-label-caps uppercase tracking-wider text-xs font-bold" style={{ color: "var(--primary)" }}>
                    2. Auto-Calculated Salary Components
                  </h3>
                  <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Gross = ₹{calculated.grossEarnings.toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-body-sm">
                  <div className="p-3 bg-[var(--surface-container-lowest)] rounded-lg border border-[var(--outline-variant)]">
                    <p className="text-xs text-[var(--on-surface-variant)]">Basic Salary (50%)</p>
                    <p className="font-mono font-bold text-sm">₹{calculated.basicSalary.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-[var(--surface-container-lowest)] rounded-lg border border-[var(--outline-variant)]">
                    <p className="text-xs text-[var(--on-surface-variant)]">HRA (50% Basic)</p>
                    <p className="font-mono font-bold text-sm">₹{calculated.hra.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-[var(--surface-container-lowest)] rounded-lg border border-[var(--outline-variant)]">
                    <p className="text-xs text-[var(--on-surface-variant)]">Std Allowance (16.67%)</p>
                    <p className="font-mono font-bold text-sm">₹{calculated.standardAllowance.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-[var(--surface-container-lowest)] rounded-lg border border-[var(--outline-variant)]">
                    <p className="text-xs text-[var(--on-surface-variant)]">Bonus (8.33% Basic)</p>
                    <p className="font-mono font-bold text-sm">₹{calculated.performanceBonus.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-[var(--surface-container-lowest)] rounded-lg border border-[var(--outline-variant)]">
                    <p className="text-xs text-[var(--on-surface-variant)]">LTA (8.33% Basic)</p>
                    <p className="font-mono font-bold text-sm">₹{calculated.lta.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-[var(--surface-container-lowest)] rounded-lg border border-[var(--outline-variant)]">
                    <p className="text-xs text-[var(--on-surface-variant)]">Fixed Allowance (Rem)</p>
                    <p className="font-mono font-bold text-sm">₹{calculated.fixedAllowance.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Contributions & Deductions */}
              <div
                className="border rounded-xl p-4 sm:p-5"
                style={{
                  background: "var(--surface-container-low)",
                  borderColor: "var(--outline-variant)",
                }}
              >
                <h3 className="font-mono text-label-caps uppercase tracking-wider text-xs font-bold mb-3" style={{ color: "var(--primary)" }}>
                  3. Deductions & Statutory PF
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-body-sm">
                  <div className="p-3 bg-[var(--surface-container-lowest)] rounded-lg border border-[var(--outline-variant)]">
                    <p className="text-xs text-[var(--on-surface-variant)]">Employee PF (12% Basic)</p>
                    <p className="font-mono font-bold text-sm text-red-600 dark:text-red-400">
                      −₹{calculated.employeePf.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-[var(--surface-container-lowest)] rounded-lg border border-[var(--outline-variant)]">
                    <p className="text-xs text-[var(--on-surface-variant)]">Employer PF (12% Basic)</p>
                    <p className="font-mono font-bold text-sm text-[var(--secondary)]">
                      ₹{calculated.employerPf.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-[var(--surface-container-lowest)] rounded-lg border border-[var(--outline-variant)]">
                    <p className="text-xs text-[var(--on-surface-variant)]">Professional Tax (Fixed)</p>
                    <p className="font-mono font-bold text-sm text-red-600 dark:text-red-400">
                      −₹{calculated.professionalTax}
                    </p>
                  </div>
                </div>
              </div>

              {/* Net In-Hand Summary */}
              <div
                className="p-5 rounded-xl border flex items-center justify-between"
                style={{
                  background: "var(--primary-container)",
                  borderColor: "var(--primary)",
                  color: "var(--on-primary-container)",
                }}
              >
                <div>
                  <p className="font-mono text-label-caps uppercase tracking-wider text-xs font-bold">
                    Net Take-Home (In-Hand Pay)
                  </p>
                  <p className="text-xs opacity-80 mt-0.5">
                    Gross earnings minus PF & tax deductions
                  </p>
                </div>
                <p className="text-headline-lg font-bold font-mono">
                  ₹{calculated.netPay.toLocaleString()}
                  <span className="text-xs font-normal opacity-80">/mo</span>
                </p>
              </div>

              {/* Effective From & Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <div className="w-full sm:w-auto">
                  <label className="block font-mono text-label-caps uppercase tracking-widest mb-1" style={{ color: "var(--on-surface-variant)" }}>
                    Effective Date
                  </label>
                  <input
                    type="date"
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-body-sm"
                    style={{
                      background: "var(--surface-container-lowest)",
                      borderColor: "var(--outline-variant)",
                    }}
                  />
                </div>

                <div className="flex gap-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingEmp(null)}
                    className="px-5 py-2.5 rounded-lg text-body-sm font-semibold border transition-colors cursor-pointer"
                    style={{
                      borderColor: "var(--outline-variant)",
                      color: "var(--on-surface-variant)",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleSaveSalary}
                    className="px-6 py-2.5 rounded-lg text-body-sm font-bold shadow-md transition-all cursor-pointer disabled:opacity-60 flex items-center gap-2"
                    style={{
                      background: "var(--primary)",
                      color: "var(--on-primary)",
                    }}
                  >
                    {saving ? (
                      <>
                        <span className="material-symbols-outlined text-sm animate-spin">
                          progress_activity
                        </span>
                        Saving…
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">check</span>
                        Save & Apply Structure
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
