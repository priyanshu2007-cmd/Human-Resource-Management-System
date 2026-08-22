import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Get current user's org
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user?.id ?? "")
    .single();

  const orgId = profile?.organization_id;

  // Fetch employee count
  const { count: headcount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId ?? "");

  // Today's attendance stats
  const today = new Date().toISOString().split("T")[0];

  const { data: todayAttendance } = await supabase
    .from("attendance")
    .select("status")
    .eq("organization_id", orgId ?? "")
    .eq("date", today);

  const presentCount =
    todayAttendance?.filter((a) => a.status === "present").length ?? 0;
  const halfDayCount =
    todayAttendance?.filter((a) => a.status === "half-day").length ?? 0;
  const absentCount =
    todayAttendance?.filter((a) => a.status === "absent").length ?? 0;
  const onLeaveCount =
    todayAttendance?.filter((a) => a.status === "leave").length ?? 0;
  const todayAttendanceTotal = todayAttendance?.length ?? 0;

  // Pending leave requests
  const { count: pendingLeaves } = await supabase
    .from("leave_requests")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId ?? "")
    .eq("status", "pending");

  // A few most-recent pending leave requests, for the approvals widget
  interface PendingLeaveRow {
    id: string;
    leave_type: string;
    start_date: string;
    end_date: string;
    profiles: { full_name: string } | null;
  }

  const { data: rawRecentPendingLeaves } = await supabase
    .from("leave_requests")
    .select("id, leave_type, start_date, end_date, profiles(full_name)")
    .eq("organization_id", orgId ?? "")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(3);

  const recentPendingLeaves =
    (rawRecentPendingLeaves as unknown as PendingLeaveRow[]) || [];

  const attendanceStats = [
    {
      label: "Total",
      value: todayAttendanceTotal,
      icon: "groups",
      color: "var(--primary)",
    },
    {
      label: "Present",
      value: presentCount,
      icon: "check_circle",
      color: "var(--status-approved)",
    },
    {
      label: "Half-day",
      value: halfDayCount,
      icon: "schedule",
      color: "var(--status-pending)",
    },
    {
      label: "Absent / Leave",
      value: absentCount + onLeaveCount,
      icon: "event_busy",
      color: "var(--status-rejected)",
    },
  ];

  // Recent employees
  const { data: employees } = await supabase
    .from("profiles")
    .select("id, full_name, role, employee_id, job_title, department")
    .eq("organization_id", orgId ?? "")
    .order("created_at", { ascending: false })
    .limit(8);

  const stats = [
    {
      label: "Total Employees",
      value: headcount ?? 0,
      icon: "group",
      color: "var(--primary)",
    },
    {
      label: "Checked In Today",
      value: presentCount,
      icon: "check_circle",
      color: "var(--status-approved)",
    },
    {
      label: "Pending Requests",
      value: pendingLeaves ?? 0,
      icon: "pending_actions",
      color: "var(--status-pending)",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-headline-lg font-semibold">Employees</h1>
          <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
            {headcount ?? 0} people · {presentCount} checked in today
          </p>
        </div>
        <Link
          href="/admin/employees/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded text-body-sm font-semibold transition-colors"
          style={{
            background: "var(--primary)",
            color: "var(--on-primary)",
          }}
        >
          <span className="material-symbols-outlined text-lg">add</span>
          New
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="border rounded-lg p-5"
            style={{
              background: "var(--surface-container-lowest)",
              borderColor: "var(--outline-variant)",
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <span
                className="material-symbols-outlined text-2xl"
                style={{ color: stat.color }}
              >
                {stat.icon}
              </span>
              <span
                className="font-mono text-label-caps uppercase"
                style={{ color: "var(--on-surface-variant)" }}
              >
                {stat.label}
              </span>
            </div>
            <p className="text-headline-xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Today's attendance + leave approvals widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Attendance overview */}
        <div className="lg:col-span-2">
          <h2 className="text-body-md font-semibold mb-3">Today&apos;s Attendance</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {attendanceStats.map((stat) => (
              <div
                key={stat.label}
                className="border rounded-lg p-4"
                style={{
                  background: "var(--surface-container-lowest)",
                  borderColor: "var(--outline-variant)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="material-symbols-outlined text-xl"
                    style={{ color: stat.color }}
                  >
                    {stat.icon}
                  </span>
                  <span
                    className="font-mono text-label-caps uppercase"
                    style={{ color: "var(--on-surface-variant)" }}
                  >
                    {stat.label}
                  </span>
                </div>
                <p className="text-headline-lg font-bold">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Leave approvals summary */}
        <div>
          <h2 className="text-body-md font-semibold mb-3">Leave Approvals</h2>
          <Link
            href="/admin/leave-approvals"
            className="block border rounded-lg p-4 mb-3 transition-colors hover:bg-[var(--surface-container-low)]"
            style={{
              background: "var(--surface-container-lowest)",
              borderColor: "var(--outline-variant)",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="material-symbols-outlined text-xl"
                style={{ color: "var(--status-pending)" }}
              >
                pending_actions
              </span>
              <span
                className="font-mono text-label-caps uppercase"
                style={{ color: "var(--on-surface-variant)" }}
              >
                Pending Requests
              </span>
            </div>
            <p className="text-headline-lg font-bold">{pendingLeaves ?? 0}</p>
          </Link>

          {recentPendingLeaves.length > 0 && (
            <div
              className="border rounded-lg divide-y overflow-hidden"
              style={{
                background: "var(--surface-container-lowest)",
                borderColor: "var(--outline-variant)",
              }}
            >
              {recentPendingLeaves.map((req) => (
                <Link
                  key={req.id}
                  href="/admin/leave-approvals"
                  className="block px-4 py-3 transition-colors hover:bg-[var(--surface-container-low)]"
                  style={{ borderColor: "var(--outline-variant)" }}
                >
                  <p className="text-body-sm font-semibold truncate">
                    {req.profiles?.full_name ?? "Unknown employee"}
                  </p>
                  <p
                    className="text-body-sm capitalize truncate"
                    style={{ color: "var(--on-surface-variant)" }}
                  >
                    {req.leave_type} leave · {req.start_date} → {req.end_date}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Employee list */}
      <div
        className="border rounded-lg overflow-hidden"
        style={{
          background: "var(--surface-container-lowest)",
          borderColor: "var(--outline-variant)",
        }}
      >
        {employees && employees.length > 0 ? (
          <div className="divide-y" style={{ borderColor: "var(--outline-variant)" }}>
            {employees.map((emp) => {
              const nameParts = emp.full_name.split(" ");
              const initials = (
                (nameParts[0]?.[0] || "") +
                (nameParts[nameParts.length - 1]?.[0] || "")
              ).toUpperCase();

              return (
                <Link
                  key={emp.id}
                  href={`/admin/employees/${emp.id}`}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--surface-container-low)]"
                  style={{ borderColor: "var(--outline-variant)" }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-body-sm font-semibold shrink-0"
                    style={{
                      background: "var(--primary-container)",
                      color: "var(--on-primary-container)",
                    }}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-md font-semibold truncate">
                      {emp.full_name}
                    </p>
                    <p
                      className="text-body-sm truncate"
                      style={{ color: "var(--on-surface-variant)" }}
                    >
                      {emp.job_title || emp.role}
                      {emp.department && ` · ${emp.department}`}
                    </p>
                  </div>
                  <span
                    className="font-mono text-label-caps hidden sm:block"
                    style={{ color: "var(--outline)" }}
                  >
                    {emp.employee_id}
                  </span>
                  <span
                    className="material-symbols-outlined text-lg"
                    style={{ color: "var(--outline)" }}
                  >
                    chevron_right
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <span
              className="material-symbols-outlined text-5xl mb-3 block"
              style={{ color: "var(--outline-variant)" }}
            >
              group_add
            </span>
            <p className="text-body-md font-semibold mb-1">No employees yet</p>
            <p
              className="text-body-sm mb-4"
              style={{ color: "var(--on-surface-variant)" }}
            >
              Create your first employee to get started.
            </p>
            <Link
              href="/admin/employees/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded text-body-sm font-semibold"
              style={{
                background: "var(--primary)",
                color: "var(--on-primary)",
              }}
            >
              <span className="material-symbols-outlined text-lg">add</span>
              New Employee
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
