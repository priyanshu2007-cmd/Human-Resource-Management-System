"use client";

import { Fragment, useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface EmployeeRow {
  id: string;
  full_name: string;
  employee_id: string;
  department: string | null;
}

interface SalaryRow {
  id: string;
  user_id: string;
  base_salary: number;
  allowances: number | null;
  deductions: number | null;
  effective_from: string;
}

export default function AdminPayrollPage() {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [salaries, setSalaries] = useState<Record<string, SalaryRow>>({});
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [baseSalary, setBaseSalary] = useState("");
  const [allowances, setAllowances] = useState("");
  const [deductions, setDeductions] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(
    new Date().toISOString().split("T")[0]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user?.id ?? "")
      .single();

    const orgId = adminProfile?.organization_id;

    const { data: emps } = await supabase
      .from("profiles")
      .select("id, full_name, employee_id, department")
      .eq("organization_id", orgId ?? "")
      .order("full_name", { ascending: true });

    setEmployees(emps || []);

    const { data: salaryRows } = await supabase
      .from("salary_structures")
      .select("id, user_id, base_salary, allowances, deductions, effective_from")
      .eq("organization_id", orgId ?? "")
      .order("effective_from", { ascending: false });

    // Keep only the latest row per employee (history is preserved in the
    // table, but the admin view only needs the current structure).
    const latest: Record<string, SalaryRow> = {};
    for (const row of (salaryRows as SalaryRow[]) || []) {
      if (!latest[row.user_id]) {
        latest[row.user_id] = row;
      }
    }
    setSalaries(latest);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function openEditor(empId: string) {
    const current = salaries[empId];
    setBaseSalary(current ? String(current.base_salary) : "");
    setAllowances(current ? String(current.allowances ?? 0) : "0");
    setDeductions(current ? String(current.deductions ?? 0) : "0");
    setEffectiveFrom(new Date().toISOString().split("T")[0]);
    setError(null);
    setEditingId(empId);
  }

  async function handleSave(empId: string) {
    setError(null);
    const base = parseFloat(baseSalary);
    if (isNaN(base) || base < 0) {
      setError("Base salary must be a valid positive number.");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user?.id ?? "")
      .single();

    const { error: insertError } = await supabase.from("salary_structures").insert({
      organization_id: adminProfile?.organization_id,
      user_id: empId,
      base_salary: base,
      allowances: parseFloat(allowances) || 0,
      deductions: parseFloat(deductions) || 0,
      effective_from: effectiveFrom,
      updated_by: user?.id ?? null,
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    setEditingId(null);
    setSaving(false);
    await fetchData();
  }

  function net(row: SalaryRow | undefined): number {
    if (!row) return 0;
    return row.base_salary + (row.allowances ?? 0) - (row.deductions ?? 0);
  }

  const inputStyle: React.CSSProperties = {
    background: "var(--surface-container-lowest)",
    borderColor: "var(--outline-variant)",
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-headline-lg font-semibold">Payroll</h1>
        <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
          Editing a salary creates a new record — history is always preserved.
        </p>
      </div>

      {error && (
        <div
          className="p-3 rounded text-body-sm mb-4"
          style={{ background: "var(--error-container)", color: "var(--on-error-container)" }}
        >
          {error}
        </div>
      )}

      <div
        className="border rounded-lg overflow-hidden"
        style={{
          background: "var(--surface-container-lowest)",
          borderColor: "var(--outline-variant)",
        }}
      >
        {loading ? (
          <div className="p-8 text-center text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
            Loading…
          </div>
        ) : employees.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--outline-variant)" }}>
                  <th className="px-5 py-3 font-mono text-label-caps uppercase" style={{ color: "var(--on-surface-variant)" }}>
                    Employee
                  </th>
                  <th className="px-5 py-3 font-mono text-label-caps uppercase" style={{ color: "var(--on-surface-variant)" }}>
                    Base
                  </th>
                  <th className="px-5 py-3 font-mono text-label-caps uppercase hidden sm:table-cell" style={{ color: "var(--on-surface-variant)" }}>
                    Allowances
                  </th>
                  <th className="px-5 py-3 font-mono text-label-caps uppercase hidden sm:table-cell" style={{ color: "var(--on-surface-variant)" }}>
                    Deductions
                  </th>
                  <th className="px-5 py-3 font-mono text-label-caps uppercase" style={{ color: "var(--on-surface-variant)" }}>
                    Net
                  </th>
                  <th className="px-5 py-3 font-mono text-label-caps uppercase hidden md:table-cell" style={{ color: "var(--on-surface-variant)" }}>
                    Effective From
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--outline-variant)" }}>
                {employees.map((emp) => {
                  const row = salaries[emp.id];
                  const isEditing = editingId === emp.id;

                  return (
                    <Fragment key={emp.id}>
                      <tr>
                        <td className="px-5 py-3">
                          <p className="text-body-sm font-semibold">{emp.full_name}</p>
                          <p className="font-mono text-body-sm" style={{ color: "var(--outline)" }}>
                            {emp.employee_id}
                          </p>
                        </td>
                        <td className="px-5 py-3 font-mono text-body-sm">
                          {row ? row.base_salary.toLocaleString() : "—"}
                        </td>
                        <td className="px-5 py-3 font-mono text-body-sm hidden sm:table-cell">
                          {row ? (row.allowances ?? 0).toLocaleString() : "—"}
                        </td>
                        <td className="px-5 py-3 font-mono text-body-sm hidden sm:table-cell">
                          {row ? (row.deductions ?? 0).toLocaleString() : "—"}
                        </td>
                        <td className="px-5 py-3 font-mono text-body-sm font-semibold">
                          {row ? net(row).toLocaleString() : "—"}
                        </td>
                        <td className="px-5 py-3 text-body-sm hidden md:table-cell">
                          {row ? row.effective_from : "—"}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => (isEditing ? setEditingId(null) : openEditor(emp.id))}
                            className="px-3 py-1.5 rounded text-body-sm font-semibold transition-colors cursor-pointer border"
                            style={{ borderColor: "var(--outline-variant)", color: "var(--on-surface-variant)" }}
                          >
                            {isEditing ? "Cancel" : row ? "Edit" : "Set Salary"}
                          </button>
                        </td>
                      </tr>
                      {isEditing && (
                        <tr>
                          <td colSpan={7} className="px-5 py-4" style={{ background: "var(--surface-container-low)" }}>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
                              <div>
                                <label className="block font-mono text-label-caps uppercase tracking-widest mb-1" style={{ color: "var(--on-surface-variant)" }}>
                                  Base Salary
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={baseSalary}
                                  onChange={(e) => setBaseSalary(e.target.value)}
                                  className="w-full border rounded px-3 py-2 text-body-sm focus:outline-none focus:ring-1 transition-colors"
                                  style={inputStyle}
                                />
                              </div>
                              <div>
                                <label className="block font-mono text-label-caps uppercase tracking-widest mb-1" style={{ color: "var(--on-surface-variant)" }}>
                                  Allowances
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={allowances}
                                  onChange={(e) => setAllowances(e.target.value)}
                                  className="w-full border rounded px-3 py-2 text-body-sm focus:outline-none focus:ring-1 transition-colors"
                                  style={inputStyle}
                                />
                              </div>
                              <div>
                                <label className="block font-mono text-label-caps uppercase tracking-widest mb-1" style={{ color: "var(--on-surface-variant)" }}>
                                  Deductions
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={deductions}
                                  onChange={(e) => setDeductions(e.target.value)}
                                  className="w-full border rounded px-3 py-2 text-body-sm focus:outline-none focus:ring-1 transition-colors"
                                  style={inputStyle}
                                />
                              </div>
                              <div>
                                <label className="block font-mono text-label-caps uppercase tracking-widest mb-1" style={{ color: "var(--on-surface-variant)" }}>
                                  Effective From
                                </label>
                                <input
                                  type="date"
                                  value={effectiveFrom}
                                  onChange={(e) => setEffectiveFrom(e.target.value)}
                                  className="w-full border rounded px-3 py-2 text-body-sm focus:outline-none focus:ring-1 transition-colors"
                                  style={inputStyle}
                                />
                              </div>
                            </div>
                            <div className="mt-3">
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() => handleSave(emp.id)}
                                className="px-4 py-2 rounded text-body-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
                                style={{ background: "var(--primary)", color: "var(--on-primary)" }}
                              >
                                {saving ? "Saving…" : "Save New Record"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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
              payments
            </span>
            <p className="text-body-md font-semibold mb-1">No employees yet</p>
            <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
              Add employees to start setting up payroll.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
