import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/shared/status-badge";

export default async function AdminEmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; view?: string }>;
}) {
  const { q, status, view = "grid" } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user?.id ?? "")
    .single();

  const orgId = adminProfile?.organization_id;

  let query = supabase
    .from("profiles")
    .select(
      "id, full_name, employee_id, email, phone, role, job_title, department, date_of_joining, must_change_password, profile_picture_url, location"
    )
    .eq("organization_id", orgId ?? "")
    .order("full_name", { ascending: true });

  if (q && q.trim()) {
    const term = q.trim();
    query = query.or(
      `full_name.ilike.%${term}%,employee_id.ilike.%${term}%,department.ilike.%${term}%,email.ilike.%${term}%`
    );
  }

  const { data: employees } = await query;

  // Today's attendance status for each employee
  const today = new Date().toISOString().split("T")[0];
  const { data: todayAttendanceRows } = await supabase
    .from("attendance")
    .select("user_id, status")
    .eq("organization_id", orgId ?? "")
    .eq("date", today);

  const attendanceMap = new Map<string, string>();
  (todayAttendanceRows ?? []).forEach((r) => {
    if (r.user_id) {
      attendanceMap.set(r.user_id, r.status);
    }
  });

  // Approved leaves for today
  const { data: todayApprovedLeaves } = await supabase
    .from("leave_requests")
    .select("user_id")
    .eq("organization_id", orgId ?? "")
    .eq("status", "approved")
    .lte("start_date", today)
    .gte("end_date", today);

  const onLeaveIds = new Set(
    (todayApprovedLeaves ?? [])
      .map((r) => r.user_id)
      .filter((id): id is string => Boolean(id))
  );

  // Compute live current status for each employee: Present, On Leave, Absent, or Pending Setup
  const withStatus = (employees ?? []).map((emp) => {
    const attStatus = attendanceMap.get(emp.id);
    let liveStatus: "present" | "leave" | "absent" | "pending" = "absent";
    let liveLabel = "Absent";

    if (emp.must_change_password) {
      liveStatus = "pending";
      liveLabel = "Pending Setup";
    } else if (onLeaveIds.has(emp.id) || attStatus === "leave") {
      liveStatus = "leave";
      liveLabel = "On Leave";
    } else if (attStatus === "present" || attStatus === "half-day") {
      liveStatus = "present";
      liveLabel = attStatus === "half-day" ? "Half-day" : "Present";
    } else {
      liveStatus = "absent";
      liveLabel = "Absent Today";
    }

    return {
      ...emp,
      liveStatus,
      liveLabel,
    };
  });

  const presentCount = withStatus.filter((e) => e.liveStatus === "present").length;
  const onLeaveCount = withStatus.filter((e) => e.liveStatus === "leave").length;
  const absentCount = withStatus.filter((e) => e.liveStatus === "absent").length;

  const visibleEmployees =
    status === "present"
      ? withStatus.filter((e) => e.liveStatus === "present")
      : status === "leave"
        ? withStatus.filter((e) => e.liveStatus === "leave")
        : status === "absent"
          ? withStatus.filter((e) => e.liveStatus === "absent")
          : withStatus;

  const tabHref = (nextStatus?: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (view) params.set("view", view);
    if (nextStatus) params.set("status", nextStatus);
    const qs = params.toString();
    return qs ? `?${qs}` : "?";
  };

  const viewHref = (nextView: "grid" | "list") => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    params.set("view", nextView);
    return `?${params.toString()}`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-lg font-semibold">Employees Directory</h1>
          <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
            {employees?.length ?? 0} team members · {presentCount} Working Today · {onLeaveCount} On Leave
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Grid / List Toggle */}
          <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: "var(--outline-variant)" }}>
            <Link
              href={viewHref("grid")}
              className="p-2 transition-colors"
              style={{
                background: view === "grid" ? "var(--primary)" : "var(--surface-container-lowest)",
                color: view === "grid" ? "var(--on-primary)" : "var(--on-surface-variant)",
              }}
              aria-label="Grid view"
            >
              <span className="material-symbols-outlined text-lg block">grid_view</span>
            </Link>
            <Link
              href={viewHref("list")}
              className="p-2 transition-colors"
              style={{
                background: view === "list" ? "var(--primary)" : "var(--surface-container-lowest)",
                color: view === "list" ? "var(--on-primary)" : "var(--on-surface-variant)",
              }}
              aria-label="List view"
            >
              <span className="material-symbols-outlined text-lg block">view_list</span>
            </Link>
          </div>

          <Link
            href="/admin/employees/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-body-sm shadow-md transition-all hover:scale-105"
            style={{
              background: "var(--primary)",
              color: "var(--on-primary)",
            }}
          >
            <span className="material-symbols-outlined text-lg">person_add</span>
            New Employee
          </Link>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <form method="GET" className="flex-1 max-w-md">
          {status && <input type="hidden" name="status" value={status} />}
          {view && <input type="hidden" name="view" value={view} />}
          <div className="relative">
            <span
              className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-lg"
              style={{ color: "var(--outline)" }}
            >
              search
            </span>
            <input
              type="text"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search by name, ID, department, email…"
              className="w-full border rounded-xl pl-10 pr-4 py-2.5 text-body-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
              style={{
                background: "var(--surface-container-lowest)",
                borderColor: "var(--outline-variant)",
              }}
            />
          </div>
        </form>

        {/* Live Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Link
            href={tabHref()}
            className="text-xs font-mono font-semibold uppercase px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap"
            style={
              !status
                ? { background: "var(--primary)", color: "var(--on-primary)" }
                : {
                    background: "var(--surface-container-high)",
                    color: "var(--on-surface-variant)",
                  }
            }
          >
            All ({withStatus.length})
          </Link>
          <Link
            href={tabHref("present")}
            className="text-xs font-mono font-semibold uppercase px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap"
            style={
              status === "present"
                ? { background: "var(--status-approved)", color: "#ffffff" }
                : {
                    background: "var(--surface-container-high)",
                    color: "var(--on-surface-variant)",
                  }
            }
          >
            Present ({presentCount})
          </Link>
          <Link
            href={tabHref("leave")}
            className="text-xs font-mono font-semibold uppercase px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap"
            style={
              status === "leave"
                ? { background: "var(--secondary)", color: "#ffffff" }
                : {
                    background: "var(--surface-container-high)",
                    color: "var(--on-surface-variant)",
                  }
            }
          >
            On Leave ({onLeaveCount})
          </Link>
          <Link
            href={tabHref("absent")}
            className="text-xs font-mono font-semibold uppercase px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap"
            style={
              status === "absent"
                ? { background: "var(--status-rejected)", color: "#ffffff" }
                : {
                    background: "var(--surface-container-high)",
                    color: "var(--on-surface-variant)",
                  }
            }
          >
            Absent ({absentCount})
          </Link>
        </div>
      </div>

      {/* Grid View */}
      {view === "grid" && visibleEmployees.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleEmployees.map((emp) => {
            const nameParts = emp.full_name.split(" ");
            const initials = (
              (nameParts[0]?.[0] || "") +
              (nameParts[nameParts.length - 1]?.[0] || "")
            ).toUpperCase();

            return (
              <Link
                key={emp.id}
                href={`/admin/employees/${emp.id}`}
                className="group relative border rounded-2xl p-5 transition-all hover:border-[var(--primary)] hover:shadow-md flex flex-col justify-between"
                style={{
                  background: "var(--surface-container-lowest)",
                  borderColor: "var(--outline-variant)",
                }}
              >
                <div>
                  {/* Top Header inside card */}
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3.5">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-body-md font-bold shrink-0 shadow-inner border border-[var(--primary)]"
                        style={{
                          background: "var(--primary-container)",
                          color: "var(--on-primary-container)",
                        }}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-body-md font-bold truncate group-hover:text-[var(--primary)] transition-colors">
                          {emp.full_name}
                        </p>
                        <p className="text-body-sm truncate text-[var(--on-surface-variant)]">
                          {emp.job_title || (emp.role === "admin" ? "Admin" : "Employee")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <StatusBadge status={emp.liveStatus === "present" ? "approved" : emp.liveStatus === "leave" ? "leave" : emp.liveStatus === "pending" ? "pending" : "rejected"}>
                      {emp.liveLabel}
                    </StatusBadge>
                    {emp.department && (
                      <span
                        className="font-mono text-label-caps uppercase px-2.5 py-0.5 rounded-md text-xs font-semibold"
                        style={{
                          background: "var(--surface-container-high)",
                          color: "var(--on-surface-variant)",
                        }}
                      >
                        {emp.department}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer details */}
                <div
                  className="flex flex-col gap-1.5 pt-3.5 border-t text-xs font-mono"
                  style={{ borderColor: "var(--outline-variant)", color: "var(--on-surface-variant)" }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[var(--outline)]">{emp.employee_id}</span>
                    <span>{emp.location || "Bangalore"}</span>
                  </div>
                  <div className="truncate text-[var(--on-surface-variant)]">
                    {emp.email}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* List / Table View */}
      {view === "list" && visibleEmployees.length > 0 && (
        <div
          className="border rounded-2xl overflow-hidden shadow-sm"
          style={{
            background: "var(--surface-container-lowest)",
            borderColor: "var(--outline-variant)",
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--outline-variant)", background: "var(--surface-container-high)" }}>
                  <th className="px-5 py-3.5 font-mono text-label-caps uppercase text-xs" style={{ color: "var(--on-surface-variant)" }}>
                    Employee
                  </th>
                  <th className="px-5 py-3.5 font-mono text-label-caps uppercase text-xs" style={{ color: "var(--on-surface-variant)" }}>
                    Department & Role
                  </th>
                  <th className="px-5 py-3.5 font-mono text-label-caps uppercase text-xs" style={{ color: "var(--on-surface-variant)" }}>
                    Today&apos;s Live Status
                  </th>
                  <th className="px-5 py-3.5 font-mono text-label-caps uppercase text-xs hidden sm:table-cell" style={{ color: "var(--on-surface-variant)" }}>
                    Contact
                  </th>
                  <th className="px-5 py-3.5 font-mono text-label-caps uppercase text-xs text-right" style={{ color: "var(--on-surface-variant)" }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--outline-variant)" }}>
                {visibleEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-[var(--surface-container-low)] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-body-sm font-bold shrink-0"
                          style={{
                            background: "var(--primary-container)",
                            color: "var(--on-primary-container)",
                          }}
                        >
                          {emp.full_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-body-sm font-semibold">{emp.full_name}</p>
                          <p className="font-mono text-xs text-[var(--outline)]">{emp.employee_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-body-sm">
                      <p className="font-medium">{emp.job_title || emp.role}</p>
                      <p className="text-xs text-[var(--on-surface-variant)]">{emp.department || "General"}</p>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={emp.liveStatus === "present" ? "approved" : emp.liveStatus === "leave" ? "leave" : emp.liveStatus === "pending" ? "pending" : "rejected"}>
                        {emp.liveLabel}
                      </StatusBadge>
                    </td>
                    <td className="px-5 py-4 text-xs font-mono hidden sm:table-cell text-[var(--on-surface-variant)]">
                      <p className="truncate max-w-[200px]">{emp.email}</p>
                      {emp.phone && <p>{emp.phone}</p>}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/employees/${emp.id}`}
                        className="px-3 py-1.5 rounded-lg border text-xs font-semibold hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors inline-block"
                        style={{ borderColor: "var(--outline-variant)" }}
                      >
                        View Profile
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {visibleEmployees.length === 0 && (
        <div
          className="border rounded-2xl p-12 text-center"
          style={{
            background: "var(--surface-container-lowest)",
            borderColor: "var(--outline-variant)",
          }}
        >
          <span className="material-symbols-outlined text-5xl mb-2 text-[var(--outline-variant)]">
            group_off
          </span>
          <p className="text-body-md font-bold">No employees found</p>
          <p className="text-body-sm text-[var(--on-surface-variant)] mt-1">
            {q ? "No employees match your search query." : "No records match the selected status filter."}
          </p>
        </div>
      )}
    </div>
  );
}
