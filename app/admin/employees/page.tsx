import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ServerPagination } from "@/components/shared/pagination";
import { EmployeeDirectory, type EmployeeDirectoryItem } from "@/components/admin/employee-directory";

const PAGE_SIZE = 12;

export default async function AdminEmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; view?: string; page?: string }>;
}) {
  const { q, status, view = "table", page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1", 10));
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
      "id, full_name, employee_id, email, phone, role, job_title, department, date_of_joining, must_change_password, profile_picture_url, location",
      { count: "exact" }
    )
    .eq("organization_id", orgId ?? "")
    .order("full_name", { ascending: true });

  if (q && q.trim()) {
    const term = q.trim();
    query = query.or(
      `full_name.ilike.%${term}%,employee_id.ilike.%${term}%,department.ilike.%${term}%,email.ilike.%${term}%`
    );
  }

  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data: rawEmployees, count: totalCount } = await query;
  const totalPages = Math.ceil((totalCount ?? 0) / PAGE_SIZE);

  // Today's attendance status for each employee
  const today = new Date().toISOString().split("T")[0];
  const { data: todayAttendanceRows } = await supabase
    .from("attendance")
    .select("user_id, status")
    .eq("organization_id", orgId ?? "")
    .eq("date", today);

  const attendanceMap = new Map<string, string>();
  todayAttendanceRows?.forEach((row) => {
    if (row.user_id) {
      attendanceMap.set(row.user_id, row.status);
    }
  });

  const employees: EmployeeDirectoryItem[] = (rawEmployees || []).map((emp) => ({
    ...emp,
    todayStatus: attendanceMap.get(emp.id) || "not-checked-in",
  }));

  // Filter in memory if status query param passed
  const filteredEmployees = status
    ? employees.filter((e) => e.todayStatus === status)
    : employees;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-lg font-bold tracking-tight">Employee Directory</h1>
          <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
            Manage staff profiles, department assignments, and access permissions ({totalCount ?? 0} Total).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/employees/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-body-sm font-semibold shadow-sm transition-all hover:opacity-90 cursor-pointer"
            style={{
              background: "var(--primary)",
              color: "var(--on-primary)",
            }}
          >
            <span className="material-symbols-outlined text-lg">person_add</span>
            Add Employee
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <form method="GET" className="w-full sm:w-80 relative">
          <span
            className="material-symbols-outlined absolute left-3 top-2.5 text-lg pointer-events-none"
            style={{ color: "var(--on-surface-variant)" }}
          >
            search
          </span>
          <input
            type="text"
            name="q"
            defaultValue={q || ""}
            placeholder="Search by name, ID, email..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-body-sm border focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            style={{
              background: "var(--surface-container-lowest)",
              borderColor: "var(--outline-variant)",
            }}
          />
        </form>

        {/* Quick status tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { label: "All", value: "" },
            { label: "Present", value: "present" },
            { label: "Absent", value: "absent" },
            { label: "Half-day", value: "half-day" },
            { label: "Leave", value: "leave" },
          ].map((tab) => {
            const isActive = (status || "") === tab.value;
            const params = new URLSearchParams();
            if (q) params.set("q", q);
            if (tab.value) params.set("status", tab.value);
            return (
              <Link
                key={tab.label}
                href={`/admin/employees?${params.toString()}`}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-[var(--primary)] text-[var(--on-primary)]"
                    : "bg-[var(--surface-container-low)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)]"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Interactive Directory (Dense Table vs Grid Cards) */}
      {filteredEmployees.length > 0 ? (
        <EmployeeDirectory
          employees={filteredEmployees}
          initialView={view === "grid" ? "grid" : "table"}
        />
      ) : (
        <div
          className="border rounded-2xl p-12 text-center"
          style={{
            background: "var(--surface-container-lowest)",
            borderColor: "var(--outline-variant)",
          }}
        >
          <span className="material-symbols-outlined text-5xl text-[var(--outline-variant)] mb-2 block">
            search_off
          </span>
          <p className="text-body-md font-bold">No employees found</p>
          <p className="text-body-sm text-[var(--on-surface-variant)] mt-1">
            {q
              ? "No records match your search query."
              : "No employees match the selected status filter."}
          </p>
        </div>
      )}

      {/* Server Pagination */}
      <ServerPagination
        currentPage={currentPage}
        totalPages={totalPages}
        baseHref="/admin/employees"
        searchParams={{
          ...(q ? { q } : {}),
          ...(status ? { status } : {}),
          ...(view !== "table" ? { view } : {}),
        }}
      />
    </div>
  );
}
