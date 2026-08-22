import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function EmployeeDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, employee_id, job_title, department")
    .eq("id", user?.id ?? "")
    .single();

  // Today's attendance
  const today = new Date().toISOString().split("T")[0];
  const { data: todayAttendance } = await supabase
    .from("attendance")
    .select("status, check_in, check_out")
    .eq("user_id", user?.id ?? "")
    .eq("date", today)
    .maybeSingle();

  // Recent leave requests
  const { data: recentLeaves } = await supabase
    .from("leave_requests")
    .select("id, leave_type, start_date, end_date, status")
    .eq("user_id", user?.id ?? "")
    .order("created_at", { ascending: false })
    .limit(3);

  const quickCards = [
    {
      label: "My Profile",
      icon: "person",
      href: "/employee/profile",
      description: "View and edit your details",
    },
    {
      label: "Attendance",
      icon: "schedule",
      href: "/employee/attendance",
      description: todayAttendance
        ? `Today: ${todayAttendance.status}`
        : "Not checked in today",
    },
    {
      label: "Time Off",
      icon: "event_busy",
      href: "/employee/leave",
      description: `${recentLeaves?.filter((l) => l.status === "pending").length || 0} pending requests`,
    },
    {
      label: "Payroll",
      icon: "payments",
      href: "/employee/payroll",
      description: "View salary breakdown",
    },
  ];

  const statusColors: Record<string, string> = {
    present: "var(--status-approved)",
    absent: "var(--status-rejected)",
    "half-day": "var(--status-pending)",
    leave: "var(--outline)",
    pending: "var(--status-pending)",
    approved: "var(--status-approved)",
    rejected: "var(--status-rejected)",
  };

  return (
    <div>
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-headline-lg font-semibold">
          Welcome back, {profile?.full_name?.split(" ")[0] || "there"}
        </h1>
        <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
          {profile?.job_title || "Employee"}
          {profile?.department ? ` · ${profile.department}` : ""}
        </p>
      </div>

      {/* Quick access cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {quickCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="border rounded-lg p-5 transition-colors group border-[var(--outline-variant)] hover:border-[var(--primary)]"
            style={{
              background: "var(--surface-container-lowest)",
            }}
          >
            <span
              className="material-symbols-outlined text-2xl mb-3 block"
              style={{ color: "var(--primary)" }}
            >
              {card.icon}
            </span>
            <p className="text-body-md font-semibold mb-0.5">{card.label}</p>
            <p
              className="text-body-sm"
              style={{ color: "var(--on-surface-variant)" }}
            >
              {card.description}
            </p>
          </Link>
        ))}
      </div>

      {/* Recent activity */}
      <div
        className="border rounded-lg"
        style={{
          background: "var(--surface-container-lowest)",
          borderColor: "var(--outline-variant)",
        }}
      >
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--outline-variant)" }}>
          <h2 className="text-title-md font-semibold">Recent Leave Requests</h2>
        </div>
        {recentLeaves && recentLeaves.length > 0 ? (
          <div className="divide-y" style={{ borderColor: "var(--outline-variant)" }}>
            {recentLeaves.map((leave) => (
              <div
                key={leave.id}
                className="flex items-center justify-between px-5 py-3"
              >
                <div>
                  <p className="text-body-sm font-semibold capitalize">
                    {leave.leave_type} Leave
                  </p>
                  <p
                    className="text-body-sm"
                    style={{ color: "var(--on-surface-variant)" }}
                  >
                    {leave.start_date} → {leave.end_date}
                  </p>
                </div>
                <span
                  className="font-mono text-label-caps uppercase px-2 py-0.5 rounded-sm"
                  style={{
                    color: statusColors[leave.status] || "var(--outline)",
                    background:
                      leave.status === "approved"
                        ? "rgba(34,197,94,0.1)"
                        : leave.status === "rejected"
                          ? "rgba(239,68,68,0.1)"
                          : "rgba(234,179,8,0.1)",
                  }}
                >
                  {leave.status}
                </span>
              </div>
            ))}
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
              className="text-body-sm"
              style={{ color: "var(--on-surface-variant)" }}
            >
              No leave requests yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
