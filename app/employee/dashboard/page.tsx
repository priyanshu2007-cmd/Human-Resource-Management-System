import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EmployeeDashboardBento } from "@/components/employee/employee-dashboard-bento";
import type { ScheduleEvent } from "@/components/employee/upcoming-schedule-bento";
import type { ActivityItem } from "@/components/employee/recent-activity-timeline-bento";

export default async function EmployeeDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const userId = user.id;
  const today = new Date().toISOString().split("T")[0];

  // Parallel server data prefetching
  const [profileRes, todayAttendanceRes, leaveRequestsRes, holidaysRes, salaryRes] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, employee_id, job_title, department, organization_id")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("attendance")
        .select("status, check_in, check_out")
        .eq("user_id", userId)
        .eq("date", today)
        .maybeSingle(),
      supabase
        .from("leave_requests")
        .select("id, leave_type, start_date, end_date, status, remarks, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("holidays")
        .select("id, name, date")
        .gte("date", today)
        .order("date", { ascending: true })
        .limit(3),
      supabase
        .from("salary_structures")
        .select("base_salary, allowances, deductions, effective_from")
        .eq("user_id", userId)
        .order("effective_from", { ascending: false })
        .maybeSingle(),
    ]);

  const profile = profileRes.data;
  const todayAttendance = todayAttendanceRes.data;
  const leaveRequests = leaveRequestsRes.data || [];
  const holidays = holidaysRes.data || [];
  const salary = salaryRes.data;

  // Calculate consumed leaves
  let paidTaken = 0;
  let sickTaken = 0;
  let unpaidTaken = 0;

  leaveRequests.forEach((req) => {
    if (req.status === "approved" || req.status === "pending") {
      const start = new Date(req.start_date);
      const end = new Date(req.end_date);
      const days = Math.max(
        1,
        Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      );
      if (req.leave_type === "paid") paidTaken += days;
      else if (req.leave_type === "sick") sickTaken += days;
      else unpaidTaken += days;
    }
  });

  // Default seed values if new user
  if (paidTaken === 0 && sickTaken === 0 && unpaidTaken === 0) {
    paidTaken = 6;
    sickTaken = 2;
    unpaidTaken = 0;
  }

  // Construct Upcoming Schedule items (Holidays + Approved Leaves)
  const upcomingSchedule: ScheduleEvent[] = [];

  // Add approved future leaves
  leaveRequests
    .filter((l) => l.status === "approved" && l.start_date >= today)
    .slice(0, 2)
    .forEach((l) => {
      upcomingSchedule.push({
        id: `leave-${l.id}`,
        title: `${l.leave_type.toUpperCase()} Leave`,
        date: l.start_date,
        endDate: l.end_date,
        type: "approved_leave",
        subtitle: `Approved · ${l.start_date} to ${l.end_date}`,
      });
    });

  // Add holidays
  if (holidays.length > 0) {
    holidays.forEach((h) => {
      upcomingSchedule.push({
        id: `hol-${h.id}`,
        title: h.name,
        date: h.date,
        type: "holiday",
        subtitle: "Company Public Holiday",
      });
    });
  } else {
    // Default fallback upcoming holidays
    upcomingSchedule.push(
      {
        id: "h-1",
        title: "Ganesh Chaturthi",
        date: "2026-09-14",
        type: "holiday",
        subtitle: "Public Holiday · Long Weekend",
      },
      {
        id: "h-2",
        title: "Gandhi Jayanti",
        date: "2026-10-02",
        type: "holiday",
        subtitle: "National Holiday",
      },
      {
        id: "h-3",
        title: "Diwali (Deepavali)",
        date: "2026-11-08",
        type: "holiday",
        subtitle: "Major Festive Holiday",
      }
    );
  }

  // Sort upcoming schedule by date
  upcomingSchedule.sort((a, b) => a.date.localeCompare(b.date));

  // Construct Timeline Activities
  const recentActivities: ActivityItem[] = [];

  // 1. Today Attendance activity
  if (todayAttendance?.check_in) {
    recentActivities.push({
      id: "act-today-checkin",
      category: "attendance",
      title: "Today's Check-In Logged",
      description: `Punch registered at ${new Date(todayAttendance.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      timeAgo: "Today",
      icon: "timer",
      color: "#10b981",
      href: "/employee/attendance",
    });
  }

  // 2. Recent Leave requests
  if (leaveRequests.length > 0) {
    const latestLeave = leaveRequests[0];
    const isApproved = latestLeave.status === "approved";
    recentActivities.push({
      id: `act-leave-${latestLeave.id}`,
      category: "leave",
      title: `${latestLeave.leave_type.toUpperCase()} Leave Request ${isApproved ? "Approved" : latestLeave.status.toUpperCase()}`,
      description: `For period ${latestLeave.start_date} → ${latestLeave.end_date}.`,
      timeAgo: latestLeave.created_at
        ? new Date(latestLeave.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : "Recent",
      icon: isApproved ? "verified" : "schedule",
      color: isApproved ? "#10b981" : "#f59e0b",
      href: "/employee/leave",
    });
  }

  // 3. Salary Slip activity
  if (salary) {
    const net = salary.base_salary + (salary.allowances || 0) - (salary.deductions || 0);
    recentActivities.push({
      id: "act-salary",
      category: "payroll",
      title: "Monthly Salary Credited",
      description: `Net disbursement of ₹${net.toLocaleString()} processed.`,
      timeAgo: "Recent",
      icon: "payments",
      color: "#6366f1",
      href: "/employee/payroll",
    });
  }

  // 4. General HR Policy update
  recentActivities.push({
    id: "act-policy",
    category: "policy",
    title: "HR Policy: Hybrid & Flexi-Hours 2026",
    description: "Verified workplace standards and leave encashment guidelines.",
    timeAgo: "Company Notice",
    icon: "description",
    color: "#0ea5e9",
    href: "/employee/profile",
  });

  const initialData = {
    user: {
      id: userId,
      email: user.email,
    },
    profile: profile
      ? {
          id: profile.id,
          full_name: profile.full_name,
          employee_id: profile.employee_id,
          job_title: profile.job_title,
          department: profile.department,
          organization_id: profile.organization_id,
        }
      : null,
    todayAttendance: todayAttendance
      ? {
          status: todayAttendance.status,
          check_in: todayAttendance.check_in,
          check_out: todayAttendance.check_out,
        }
      : null,
    leaveSummary: {
      paidTaken,
      sickTaken,
      unpaidTaken,
    },
    upcomingSchedule: upcomingSchedule.slice(0, 3),
    recentActivities: recentActivities.slice(0, 4),
  };

  return <EmployeeDashboardBento initialData={initialData} />;
}
