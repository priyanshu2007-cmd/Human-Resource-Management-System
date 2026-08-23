import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { DashboardFastActions } from "@/components/shared/dashboard-fast-actions";

export default async function EmployeeDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id ?? "";
  const today = new Date().toISOString().split("T")[0];

  const [profileResult, todayAttendanceResult, recentLeavesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, employee_id, job_title, department, organization_id")
      .eq("id", userId)
      .single(),
    supabase
      .from("attendance")
      .select("status, check_in, check_out")
      .eq("user_id", userId)
      .eq("date", today)
      .maybeSingle(),
    supabase
      .from("leave_requests")
      .select("id, leave_type, start_date, end_date, status")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const { data: profile } = profileResult;
  const { data: todayAttendance } = todayAttendanceResult;
  const { data: recentLeaves } = recentLeavesResult;

  const quickCards = [
    {
      label: "My Profile",
      icon: "person",
      href: "/employee/profile",
      description: "View and edit your details",
      color: "var(--primary)",
    },
    {
      label: "Attendance",
      icon: "schedule",
      href: "/employee/attendance",
      description: todayAttendance
        ? `Today: ${todayAttendance.status}`
        : "Not checked in today",
      color: "var(--status-approved)",
    },
    {
      label: "Time Off",
      icon: "event_busy",
      href: "/employee/leave",
      description: `${recentLeaves?.filter((l) => l.status === "pending").length || 0} pending requests`,
      color: "var(--status-pending)",
    },
    {
      label: "Payroll",
      icon: "payments",
      href: "/employee/payroll",
      description: "View salary & payslips",
      color: "var(--secondary)",
    },
  ];

  const statusColors: Record<string, { bg: string; text: string }> = {
    present: { bg: "rgba(16, 185, 129, 0.12)", text: "#10b981" },
    approved: { bg: "rgba(16, 185, 129, 0.12)", text: "#10b981" },
    absent: { bg: "rgba(244, 63, 94, 0.12)", text: "#f43f5e" },
    rejected: { bg: "rgba(244, 63, 94, 0.12)", text: "#f43f5e" },
    "half-day": { bg: "rgba(245, 158, 11, 0.12)", text: "#f59e0b" },
    pending: { bg: "rgba(245, 158, 11, 0.12)", text: "#f59e0b" },
    leave: { bg: "rgba(99, 102, 241, 0.12)", text: "#6366f1" },
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-headline-lg font-bold tracking-tight">
          Welcome back, {profile?.full_name?.split(" ")[0] || "there"}
        </h1>
        <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
          {profile?.job_title || "Employee"}
          {profile?.department ? ` · ${profile.department}` : ""}
        </p>
      </div>

      {/* Fast Actions: Check In/Out + Apply Leave */}
      <DashboardFastActions
        userId={user?.id ?? ""}
        orgId={profile?.organization_id ?? ""}
        todayStatus={todayAttendance?.status ?? null}
        checkIn={todayAttendance?.check_in ?? null}
        checkOut={todayAttendance?.check_out ?? null}
      />

      {/* Quick access cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="border rounded-2xl p-5 shadow-sm dark:shadow-none transition-all group hover:border-[var(--primary)] hover:-translate-y-0.5 cursor-pointer"
            style={{
              background: "var(--surface-container-lowest)",
              borderColor: "var(--outline-variant)",
            }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-105"
              style={{
                background: `${card.color}18`,
                color: card.color,
              }}
            >
              <span className="material-symbols-outlined text-2xl">{card.icon}</span>
            </div>
            <p className="text-body-md font-bold mb-0.5 tracking-tight group-hover:text-[var(--primary)] transition-colors">
              {card.label}
            </p>
            <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
              {card.description}
            </p>
          </Link>
        ))}
      </div>

      {/* Recent activity */}
      <div
        className="border rounded-2xl shadow-sm dark:shadow-none transition-all"
        style={{
          background: "var(--surface-container-lowest)",
          borderColor: "var(--outline-variant)",
        }}
      >
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--outline-variant)" }}>
          <h2 className="text-title-md font-bold tracking-tight">Recent Leave Requests</h2>
          <Link
            href="/employee/leave"
            className="text-xs font-semibold text-[var(--primary)] hover:underline flex items-center gap-1"
          >
            View all <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
        {recentLeaves && recentLeaves.length > 0 ? (
          <div className="divide-y" style={{ borderColor: "var(--outline-variant)" }}>
            {recentLeaves.map((leave) => {
              const badge = statusColors[leave.status] || {
                bg: "var(--surface-container-high)",
                text: "var(--on-surface-variant)",
              };
              return (
                <div
                  key={leave.id}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-[var(--surface-container-low)] transition-colors"
                >
                  <div>
                    <p className="text-body-sm font-bold capitalize">
                      {leave.leave_type} Leave
                    </p>
                    <p
                      className="text-body-sm text-xs font-mono"
                      style={{ color: "var(--on-surface-variant)" }}
                    >
                      {leave.start_date} → {leave.end_date}
                    </p>
                  </div>
                  <span
                    className="font-mono text-label-caps uppercase px-2.5 py-1 rounded-full text-xs font-bold"
                    style={{
                      color: badge.text,
                      background: badge.bg,
                    }}
                  >
                    {leave.status}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <span
              className="material-symbols-outlined text-4xl mb-2 block"
              style={{ color: "var(--outline-variant)" }}
            >
              event_available
            </span>
            <p
              className="text-body-sm font-medium"
              style={{ color: "var(--on-surface-variant)" }}
            >
              No leave requests submitted yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
