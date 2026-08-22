import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmployeeEditDetails } from "./edit-details";

export default async function AdminEmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { data: employee } = await supabase
    .from("profiles")
    .select(
      "id, full_name, employee_id, email, role, phone, address, job_title, department, date_of_joining, must_change_password, profile_picture_url"
    )
    .eq("id", id)
    .eq("organization_id", orgId ?? "")
    .single();

  if (!employee) {
    notFound();
  }

  // Attendance: last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  const todayStr = new Date().toISOString().split("T")[0];

  const { data: attendanceRecords } = await supabase
    .from("attendance")
    .select("date, status, check_in, check_out")
    .eq("user_id", id)
    .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
    .lte("date", todayStr)
    .order("date", { ascending: false });

  const attendance = attendanceRecords || [];
  const presentDays = attendance.filter((a) => a.status === "present").length;
  const absentDays = attendance.filter((a) => a.status === "absent").length;
  const halfDays = attendance.filter((a) => a.status === "half-day").length;
  const leaveDays = attendance.filter((a) => a.status === "leave").length;

  // Leave requests: full history, most recent first
  const { data: leaveRequestsData } = await supabase
    .from("leave_requests")
    .select(
      "id, leave_type, start_date, end_date, status, remarks, admin_comment, created_at"
    )
    .eq("user_id", id)
    .order("created_at", { ascending: false });

  const leaveRequests = leaveRequestsData || [];

  // Latest salary structure (for a quick payroll glance)
  const { data: salaryRows } = await supabase
    .from("salary_structures")
    .select("base_salary, allowances, deductions, effective_from")
    .eq("user_id", id)
    .order("effective_from", { ascending: false })
    .limit(1);

  const salary = salaryRows?.[0] ?? null;

  const nameParts = employee.full_name.split(" ");
  const initials = (
    (nameParts[0]?.[0] || "") + (nameParts[nameParts.length - 1]?.[0] || "")
  ).toUpperCase();

  const statusColors: Record<string, string> = {
    present: "var(--status-approved)",
    absent: "var(--status-rejected)",
    "half-day": "var(--status-pending)",
    leave: "var(--outline)",
    pending: "var(--status-pending)",
    approved: "var(--status-approved)",
    rejected: "var(--status-rejected)",
  };

  const statusBg: Record<string, string> = {
    present: "rgba(34,197,94,0.1)",
    absent: "rgba(239,68,68,0.1)",
    "half-day": "rgba(234,179,8,0.1)",
    leave: "rgba(123,116,135,0.1)",
    pending: "rgba(234,179,8,0.1)",
    approved: "rgba(34,197,94,0.1)",
    rejected: "rgba(239,68,68,0.1)",
  };

  const cardStyle: React.CSSProperties = {
    background: "var(--surface-container-lowest)",
    borderColor: "var(--outline-variant)",
  };

  return (
    <div>
      <Link
        href="/admin/employees"
        className="text-body-sm inline-flex items-center gap-1 mb-4"
        style={{ color: "var(--on-surface-variant)" }}
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Employees
      </Link>

      {/* Profile header */}
      <div className="border rounded-lg p-6 mb-6" style={cardStyle}>
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-title-md font-semibold shrink-0"
            style={{
              background: "var(--primary-container)",
              color: "var(--on-primary-container)",
            }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <h1 className="text-headline-lg font-semibold truncate">
              {employee.full_name}
            </h1>
            <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
              {employee.job_title || (employee.role === "admin" ? "Admin" : "Employee")}
              {employee.department && ` · ${employee.department}`}
            </p>
          </div>
          <div className="ml-auto text-right">
            {employee.must_change_password ? (
              <span
                className="font-mono text-label-caps uppercase px-2 py-0.5 rounded-sm"
                style={{ color: "var(--status-pending)", background: "rgba(234,179,8,0.1)" }}
              >
                Pending Setup
              </span>
            ) : (
              <span
                className="font-mono text-label-caps uppercase px-2 py-0.5 rounded-sm"
                style={{ color: "var(--status-approved)", background: "rgba(34,197,94,0.1)" }}
              >
                Active
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t" style={{ borderColor: "var(--outline-variant)" }}>
          <div>
            <p className="font-mono text-label-caps uppercase mb-1" style={{ color: "var(--on-surface-variant)" }}>
              Login ID
            </p>
            <p className="font-mono text-body-sm font-semibold">{employee.employee_id}</p>
          </div>
          <div>
            <p className="font-mono text-label-caps uppercase mb-1" style={{ color: "var(--on-surface-variant)" }}>
              Email
            </p>
            <p className="text-body-sm truncate">{employee.email}</p>
          </div>
          <div>
            <p className="font-mono text-label-caps uppercase mb-1" style={{ color: "var(--on-surface-variant)" }}>
              Joined
            </p>
            <p className="text-body-sm">
              {employee.date_of_joining
                ? new Date(employee.date_of_joining + "T00:00:00").toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "—"}
            </p>
          </div>
        </div>

        {employee.address && (
          <div className="pt-4 mt-4 border-t" style={{ borderColor: "var(--outline-variant)" }}>
            <p className="font-mono text-label-caps uppercase mb-1" style={{ color: "var(--on-surface-variant)" }}>
              Address
            </p>
            <p className="text-body-sm">{employee.address}</p>
          </div>
        )}
      </div>

      <EmployeeEditDetails
        employeeId={employee.id}
        initialJobTitle={employee.job_title}
        initialDepartment={employee.department}
        initialPhone={employee.phone}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance summary */}
        <div className="border rounded-lg overflow-hidden" style={cardStyle}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--outline-variant)" }}>
            <h2 className="text-title-md font-semibold">Attendance (last 30 days)</h2>
            <Link
              href={`/admin/attendance?q=${encodeURIComponent(employee.full_name)}`}
              className="text-body-sm"
              style={{ color: "var(--primary)" }}
            >
              View all
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-2 p-5">
            <div className="text-center">
              <p className="text-headline-lg font-bold" style={{ color: statusColors.present }}>
                {presentDays}
              </p>
              <p className="font-mono text-label-caps uppercase" style={{ color: "var(--on-surface-variant)" }}>
                Present
              </p>
            </div>
            <div className="text-center">
              <p className="text-headline-lg font-bold" style={{ color: statusColors.absent }}>
                {absentDays}
              </p>
              <p className="font-mono text-label-caps uppercase" style={{ color: "var(--on-surface-variant)" }}>
                Absent
              </p>
            </div>
            <div className="text-center">
              <p className="text-headline-lg font-bold" style={{ color: statusColors["half-day"] }}>
                {halfDays}
              </p>
              <p className="font-mono text-label-caps uppercase" style={{ color: "var(--on-surface-variant)" }}>
                Half-day
              </p>
            </div>
            <div className="text-center">
              <p className="text-headline-lg font-bold" style={{ color: statusColors.leave }}>
                {leaveDays}
              </p>
              <p className="font-mono text-label-caps uppercase" style={{ color: "var(--on-surface-variant)" }}>
                Leave
              </p>
            </div>
          </div>

          {attendance.length > 0 ? (
            <div className="divide-y max-h-72 overflow-y-auto" style={{ borderColor: "var(--outline-variant)" }}>
              {attendance.slice(0, 10).map((record) => (
                <div key={record.date} className="flex items-center justify-between px-5 py-2.5">
                  <p className="text-body-sm">
                    {new Date(record.date + "T00:00:00").toLocaleDateString("en-US", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                  <span
                    className="font-mono text-label-caps uppercase px-2 py-0.5 rounded-sm"
                    style={{ color: statusColors[record.status], background: statusBg[record.status] }}
                  >
                    {record.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 pb-5 text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
              No attendance records in this period.
            </div>
          )}
        </div>

        {/* Leave history */}
        <div className="border rounded-lg overflow-hidden" style={cardStyle}>
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--outline-variant)" }}>
            <h2 className="text-title-md font-semibold">Leave History</h2>
          </div>

          {leaveRequests.length > 0 ? (
            <div className="divide-y max-h-96 overflow-y-auto" style={{ borderColor: "var(--outline-variant)" }}>
              {leaveRequests.map((req) => (
                <div key={req.id} className="px-5 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-body-sm font-semibold capitalize">{req.leave_type} Leave</p>
                    <span
                      className="font-mono text-label-caps uppercase px-2 py-0.5 rounded-sm"
                      style={{ color: statusColors[req.status], background: statusBg[req.status] }}
                    >
                      {req.status}
                    </span>
                  </div>
                  <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
                    {req.start_date} → {req.end_date}
                  </p>
                  {req.admin_comment && (
                    <p className="text-body-sm mt-1 italic" style={{ color: "var(--outline)" }}>
                      &ldquo;{req.admin_comment}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
              No leave requests on file.
            </div>
          )}
        </div>
      </div>

      {/* Payroll glance */}
      <div className="border rounded-lg p-5 mt-6" style={cardStyle}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-title-md font-semibold">Current Payroll</h2>
          <Link href="/admin/payroll" className="text-body-sm" style={{ color: "var(--primary)" }}>
            Manage payroll
          </Link>
        </div>
        {salary ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="font-mono text-label-caps uppercase mb-1" style={{ color: "var(--on-surface-variant)" }}>
                Base
              </p>
              <p className="font-mono text-body-md font-semibold">
                {salary.base_salary.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="font-mono text-label-caps uppercase mb-1" style={{ color: "var(--on-surface-variant)" }}>
                Allowances
              </p>
              <p className="font-mono text-body-md font-semibold">
                {(salary.allowances ?? 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="font-mono text-label-caps uppercase mb-1" style={{ color: "var(--on-surface-variant)" }}>
                Deductions
              </p>
              <p className="font-mono text-body-md font-semibold">
                {(salary.deductions ?? 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="font-mono text-label-caps uppercase mb-1" style={{ color: "var(--on-surface-variant)" }}>
                Effective From
              </p>
              <p className="text-body-md font-semibold">{salary.effective_from}</p>
            </div>
          </div>
        ) : (
          <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
            No salary structure on file yet.
          </p>
        )}
      </div>
    </div>
  );
}
