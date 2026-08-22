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

      {/* Table */}
      <div
        className="border rounded-lg overflow-hidden"
        style={{
          background: "var(--surface-container-lowest)",
          borderColor: "var(--outline-variant)",
        }}
      >
        {employees && employees.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr
                  className="border-b"
                  style={{ borderColor: "var(--outline-variant)" }}
                >
                  <th className="px-5 py-3 font-mono text-label-caps uppercase" style={{ color: "var(--on-surface-variant)" }}>
                    Name
                  </th>
                  <th className="px-5 py-3 font-mono text-label-caps uppercase hidden sm:table-cell" style={{ color: "var(--on-surface-variant)" }}>
                    Login ID
                  </th>
                  <th className="px-5 py-3 font-mono text-label-caps uppercase hidden md:table-cell" style={{ color: "var(--on-surface-variant)" }}>
                    Email
                  </th>
                  <th className="px-5 py-3 font-mono text-label-caps uppercase hidden lg:table-cell" style={{ color: "var(--on-surface-variant)" }}>
                    Department
                  </th>
                  <th className="px-5 py-3 font-mono text-label-caps uppercase" style={{ color: "var(--on-surface-variant)" }}>
                    Status
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--outline-variant)" }}>
                {employees.map((emp) => {
                  const nameParts = emp.full_name.split(" ");
                  const initials = (
                    (nameParts[0]?.[0] || "") +
                    (nameParts[nameParts.length - 1]?.[0] || "")
                  ).toUpperCase();

                  return (
                    <tr key={emp.id} className="group">
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/employees/${emp.id}`}
                          className="flex items-center gap-3"
                        >
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-body-sm font-semibold shrink-0"
                            style={{
                              background: "var(--primary-container)",
                              color: "var(--on-primary-container)",
                            }}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-body-sm font-semibold truncate">
                              {emp.full_name}
                            </p>
                            <p
                              className="text-body-sm truncate"
                              style={{ color: "var(--on-surface-variant)" }}
                            >
                              {emp.job_title || (emp.role === "admin" ? "Admin" : "Employee")}
                            </p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <span
                          className="font-mono text-body-sm"
                          style={{ color: "var(--outline)" }}
                        >
                          {emp.employee_id}
                        </span>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        <span
                          className="text-body-sm truncate"
                          style={{ color: "var(--on-surface-variant)" }}
                        >
                          {emp.email}
                        </span>
                      </td>
                      <td className="px-5 py-3 hidden lg:table-cell">
                        <span
                          className="text-body-sm"
                          style={{ color: "var(--on-surface-variant)" }}
                        >
                          {emp.department || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {emp.must_change_password ? (
                          <span
                            className="font-mono text-label-caps uppercase px-2 py-0.5 rounded-sm"
                            style={{
                              color: "var(--status-pending)",
                              background: "rgba(234,179,8,0.1)",
                            }}
                          >
                            Pending Setup
                          </span>
                        ) : (
                          <span
                            className="font-mono text-label-caps uppercase px-2 py-0.5 rounded-sm"
                            style={{
                              color: "var(--status-approved)",
                              background: "rgba(34,197,94,0.1)",
                            }}
                          >
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link href={`/admin/employees/${emp.id}`}>
                          <span
                            className="material-symbols-outlined text-lg"
                            style={{ color: "var(--outline)" }}
                          >
                            chevron_right
                          </span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
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
    </div>
  );
}
