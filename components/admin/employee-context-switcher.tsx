"use client";

import { useRouter } from "next/navigation";

interface EmployeeOption {
  id: string;
  full_name: string;
  employee_id: string;
}

interface Props {
  employees: EmployeeOption[];
}

export function EmployeeContextSwitcher({ employees }: Props) {
  const router = useRouter();

  if (!employees || employees.length === 0) return null;

  return (
    <div className="relative inline-block text-left">
      <select
        aria-label="Switch employee profile context"
        onChange={(e) => {
          if (e.target.value) {
            router.push(`/admin/employees/${e.target.value}`);
          }
        }}
        defaultValue=""
        className="px-3.5 py-2.5 rounded-xl border text-body-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary)] cursor-pointer transition-all shadow-xs"
        style={{
          background: "var(--surface-container-low)",
          borderColor: "var(--outline-variant)",
          color: "var(--on-surface)",
        }}
      >
        <option value="" disabled>
          🔍 Jump to Employee…
        </option>
        {employees.map((emp) => (
          <option key={emp.id} value={emp.id}>
            {emp.full_name} ({emp.employee_id})
          </option>
        ))}
      </select>
    </div>
  );
}
