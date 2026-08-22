import { createClient } from "@/lib/supabase/server";

interface AttendanceRow {
  id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  user_id: string;
  profiles: {
    full_name: string;
    employee_id: string;
    department: string | null;
  } | null;
}

export default async function AdminAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; status?: string; q?: string }>;
}) {
  const { date, status, q } = await searchParams;
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
  const selectedDate = date || new Date().toISOString().split("T")[0];

  let query = supabase
    .from("attendance")
    .select(
      "id, date, check_in, check_out, status, user_id, profiles!inner(full_name, employee_id, department)"
    )
    .eq("organization_id", orgId ?? "")
    .eq("date", selectedDate)
    .order("date", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data: rawRecords } = await query;
  let records = (rawRecords as unknown as AttendanceRow[]) || [];

  if (q && q.trim()) {
    const term = q.trim().toLowerCase();
    records = records.filter(
      (r) =>
        r.profiles?.full_name.toLowerCase().includes(term) ||
        r.profiles?.employee_id.toLowerCase().includes(term) ||
        r.profiles?.department?.toLowerCase().includes(term)
    );
  }

  const statusColors: Record<string, string> = {
    present: "var(--status-approved)",
    absent: "var(--status-rejected)",
    "half-day": "var(--status-pending)",
    leave: "var(--outline)",
  };

  const statusBg: Record<string, string> = {
    present: "rgba(34,197,94,0.1)",
    absent: "rgba(239,68,68,0.1)",
    "half-day": "rgba(234,179,8,0.1)",
    leave: "rgba(123,116,135,0.1)",
  };

  function formatTime(iso: string | null): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const presentCount = records.filter((r) => r.status === "present").length;
  const absentCount = records.filter((r) => r.status === "absent").length;
  const halfDayCount = records.filter((r) => r.status === "half-day").length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-headline-lg font-semibold">Attendance</h1>
        <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
          {presentCount} present · {absentCount} absent · {halfDayCount} half-day
        </p>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap items-end gap-3 mb-6">
        <div>
          <label
            className="block font-mono text-label-caps uppercase tracking-widest mb-1"
            style={{ color: "var(--on-surface-variant)" }}
          >
            Date
          </label>
          <input
            type="date"
            name="date"
            defaultValue={selectedDate}
            className="border rounded px-3 py-2 text-body-sm focus:outline-none focus:ring-1 transition-colors"
            style={{
              background: "var(--surface-container-lowest)",
              borderColor: "var(--outline-variant)",
            }}
          />
        </div>
        <div>
          <label
            className="block font-mono text-label-caps uppercase tracking-widest mb-1"
            style={{ color: "var(--on-surface-variant)" }}
          >
            Status
          </label>
          <select
            name="status"
            defaultValue={status || ""}
            className="border rounded px-3 py-2 text-body-sm focus:outline-none focus:ring-1 transition-colors"
            style={{
              background: "var(--surface-container-lowest)",
              borderColor: "var(--outline-variant)",
            }}
          >
            <option value="">All</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="half-day">Half-day</option>
            <option value="leave">Leave</option>
          </select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label
            className="block font-mono text-label-caps uppercase tracking-widest mb-1"
            style={{ color: "var(--on-surface-variant)" }}
          >
            Employee
          </label>
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Name, ID, department…"
            className="w-full border rounded px-3 py-2 text-body-sm focus:outline-none focus:ring-1 transition-colors"
            style={{
              background: "var(--surface-container-lowest)",
              borderColor: "var(--outline-variant)",
            }}
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded text-body-sm font-semibold transition-colors cursor-pointer"
          style={{ background: "var(--primary)", color: "var(--on-primary)" }}
        >
          Filter
        </button>
      </form>

      {/* Table */}
      <div
        className="border rounded-lg overflow-hidden"
        style={{
          background: "var(--surface-container-lowest)",
          borderColor: "var(--outline-variant)",
        }}
      >
        {records.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--outline-variant)" }}>
                  <th className="px-5 py-3 font-mono text-label-caps uppercase" style={{ color: "var(--on-surface-variant)" }}>
                    Employee
                  </th>
                  <th className="px-5 py-3 font-mono text-label-caps uppercase hidden sm:table-cell" style={{ color: "var(--on-surface-variant)" }}>
                    Department
                  </th>
                  <th className="px-5 py-3 font-mono text-label-caps uppercase" style={{ color: "var(--on-surface-variant)" }}>
                    Check In
                  </th>
                  <th className="px-5 py-3 font-mono text-label-caps uppercase" style={{ color: "var(--on-surface-variant)" }}>
                    Check Out
                  </th>
                  <th className="px-5 py-3 font-mono text-label-caps uppercase" style={{ color: "var(--on-surface-variant)" }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--outline-variant)" }}>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td className="px-5 py-3">
                      <p className="text-body-sm font-semibold">{record.profiles?.full_name}</p>
                      <p className="font-mono text-body-sm" style={{ color: "var(--outline)" }}>
                        {record.profiles?.employee_id}
                      </p>
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <span className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
                        {record.profiles?.department || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-body-sm">{formatTime(record.check_in)}</td>
                    <td className="px-5 py-3 text-body-sm">{formatTime(record.check_out)}</td>
                    <td className="px-5 py-3">
                      <span
                        className="font-mono text-label-caps uppercase px-2 py-0.5 rounded-sm"
                        style={{ color: statusColors[record.status], background: statusBg[record.status] }}
                      >
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <span
              className="material-symbols-outlined text-5xl mb-3 block"
              style={{ color: "var(--outline-variant)" }}
            >
              event_busy
            </span>
            <p className="text-body-md font-semibold mb-1">No attendance records</p>
            <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
              No records match the selected filters for {selectedDate}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
