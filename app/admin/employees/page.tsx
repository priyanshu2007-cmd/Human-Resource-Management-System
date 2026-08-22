import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminEmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
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
      "id, full_name, employee_id, email, role, job_title, department, date_of_joining, must_change_password"
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

  // Who's on leave today, so the status dot can reflect it alongside
  // "pending setup" (must_change_password).
  const today = new Date().toISOString().split("T")[0];
  const { data: onLeaveRows } = await supabase
    .from("attendance")
    .select("user_id")
    .eq("organization_id", orgId ?? "")
    .eq("date", today)
    .eq("status", "leave");

  const onLeaveIds = new Set((onLeaveRows ?? []).map((r) => r.user_id));

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-headline-lg font-semibold">Employees</h1>
          <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
            {employees?.length ?? 0} people in your organization
          </p>
        </div>
        <Link
          href="/admin/employees/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded text-body-sm font-semibold transition-colors self-start"
          style={{
            background: "var(--primary)",
            color: "var(--on-primary)",
          }}
        >
          <span className="material-symbols-outlined text-lg">add</span>
          New Employee
        </Link>
      </div>

      {/* Search */}
      <form method="GET" className="mb-6">
        <div className="relative max-w-sm">
          <span
            className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg"
            style={{ color: "var(--outline)" }}
          >
            search
          </span>
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search by name, ID, department…"
            className="w-full border rounded pl-10 pr-3 py-2.5 text-body-sm focus:outline-none focus:ring-1 transition-colors"
            style={{
              background: "var(--surface-container-lowest)",
              borderColor: "var(--outline-variant)",
            }}
          />
        </div>
      </form>

      {/* Card grid */}
      {employees && employees.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => {
            const nameParts = emp.full_name.split(" ");
            const initials = (
              (nameParts[0]?.[0] || "") +
              (nameParts[nameParts.length - 1]?.[0] || "")
            ).toUpperCase();

            const isPending = emp.must_change_password;
            const isOnLeave = onLeaveIds.has(emp.id);
            const dotColor = isPending
              ? "var(--status-pending)"
              : isOnLeave
                ? "var(--status-pending)"
                : "var(--status-approved)";
            const dotLabel = isPending
              ? "Pending setup"
              : isOnLeave
                ? "On leave today"
                : "Active";

            return (
              <Link
                key={emp.id}
                href={`/admin/employees/${emp.id}`}
                className="relative border rounded-xl p-5 transition-colors border-[var(--outline-variant)] hover:border-[var(--primary)]"
                style={{
                  background: "var(--surface-container-lowest)",
                }}
              >
                <span
                  className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full"
                  style={{ background: dotColor }}
                  title={dotLabel}
                />

                <div className="flex items-center gap-3 mb-4 pr-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-body-md font-semibold shrink-0"
                    style={{
                      background: "var(--primary-container)",
                      color: "var(--on-primary-container)",
                    }}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-body-md font-semibold truncate">
                      {emp.full_name}
                    </p>
                    <p
                      className="text-body-sm truncate"
                      style={{ color: "var(--on-surface-variant)" }}
                    >
                      {emp.job_title || (emp.role === "admin" ? "Admin" : "Employee")}
                    </p>
                    <p
                      className="font-mono text-label-caps uppercase mt-0.5"
                      style={{ color: "var(--outline)" }}
                    >
                      {emp.employee_id}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {emp.department && (
                    <span
                      className="font-mono text-label-caps uppercase px-2.5 py-1 rounded-full"
                      style={{
                        background: "var(--surface-container-high)",
                        color: "var(--on-surface-variant)",
                      }}
                    >
                      {emp.department}
                    </span>
                  )}
                  <span
                    className="font-mono text-label-caps uppercase px-2.5 py-1 rounded-full capitalize"
                    style={{
                      background: "var(--surface-container-high)",
                      color: "var(--on-surface-variant)",
                    }}
                  >
                    {emp.role}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div
          className="border rounded-lg p-12 text-center"
          style={{
            background: "var(--surface-container-lowest)",
            borderColor: "var(--outline-variant)",
          }}
        >
          <span
            className="material-symbols-outlined text-5xl mb-3 block"
            style={{ color: "var(--outline-variant)" }}
          >
            group_add
          </span>
          <p className="text-body-md font-semibold mb-1">
            {q ? "No employees match your search" : "No employees yet"}
          </p>
          <p
            className="text-body-sm mb-4"
            style={{ color: "var(--on-surface-variant)" }}
          >
            {q
              ? "Try a different name, ID, or department."
              : "Create your first employee to get started."}
          </p>
          {!q && (
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
          )}
        </div>
      )}
    </div>
  );
}
