"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

export interface EmployeeDirectoryItem {
  id: string;
  full_name: string;
  employee_id: string;
  email: string;
  phone: string | null;
  role: string;
  job_title: string | null;
  department: string | null;
  date_of_joining: string | null;
  profile_picture_url: string | null;
  location: string | null;
  todayStatus?: string | null;
}

interface Props {
  employees: EmployeeDirectoryItem[];
  initialView?: "grid" | "table";
}

export function EmployeeDirectory({ employees, initialView = "table" }: Props) {
  const [view, setView] = useState<"grid" | "table">(initialView);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  function toggleSelectAll() {
    if (selectedIds.size === employees.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(employees.map((e) => e.id)));
    }
  }

  function toggleSelect(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function handleBulkExport() {
    const selectedEmployees = employees.filter((e) => selectedIds.has(e.id));
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Employee ID,Name,Email,Role,Department,Date of Joining"]
        .concat(
          selectedEmployees.map(
            (e) =>
              `"${e.employee_id}","${e.full_name}","${e.email}","${e.role}","${
                e.department || ""
              }","${e.date_of_joining || ""}"`
          )
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `employees_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${selectedEmployees.length} employees to CSV`);
  }

  function getInitials(name: string): string {
    const parts = name.trim().split(" ");
    return ((parts[0]?.[0] || "") + (parts[parts.length - 1]?.[0] || "")).toUpperCase();
  }

  return (
    <div className="space-y-4">
      {/* View Toggle & Bulk Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border bg-[var(--surface-container-lowest)] border-[var(--outline-variant)]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("table")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              view === "table"
                ? "bg-[var(--primary)] text-[var(--on-primary)]"
                : "bg-transparent text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)]"
            }`}
          >
            <span className="material-symbols-outlined text-base">table_rows</span>
            Dense Table
          </button>
          <button
            onClick={() => setView("grid")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              view === "grid"
                ? "bg-[var(--primary)] text-[var(--on-primary)]"
                : "bg-transparent text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)]"
            }`}
          >
            <span className="material-symbols-outlined text-base">grid_view</span>
            Grid Cards
          </button>
        </div>

        {/* Bulk Action Controls */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 animate-fade-in">
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-[var(--primary-container)] text-[var(--on-primary-container)]">
              {selectedIds.size} Selected
            </span>
            <button
              onClick={handleBulkExport}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--surface-container-high)] hover:bg-[var(--surface-container-highest)] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">file_download</span>
              Export CSV
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-[var(--on-surface-variant)] hover:underline ml-1 cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* DENSE TABLE VIEW */}
      {view === "table" ? (
        <div
          className="border rounded-2xl overflow-hidden shadow-sm"
          style={{
            background: "var(--surface-container-lowest)",
            borderColor: "var(--outline-variant)",
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-body-sm">
              <thead>
                <tr
                  className="border-b text-[11px] font-mono uppercase tracking-wider font-semibold"
                  style={{
                    background: "var(--surface-container-low)",
                    borderColor: "var(--outline-variant)",
                    color: "var(--on-surface-variant)",
                  }}
                >
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      checked={employees.length > 0 && selectedIds.size === employees.length}
                      onChange={toggleSelectAll}
                      className="rounded border-[var(--outline-variant)] accent-[var(--primary)] cursor-pointer"
                    />
                  </th>
                  <th className="p-4">Employee</th>
                  <th className="p-4">ID</th>
                  <th className="p-4">Role & Dept</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Joining Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--outline-variant)" }}>
                {employees.map((emp) => {
                  const isSelected = selectedIds.has(emp.id);
                  const isDropdownOpen = openDropdownId === emp.id;
                  return (
                    <tr
                      key={emp.id}
                      className={`hover:bg-[var(--surface-container-low)] transition-colors ${
                        isSelected ? "bg-[var(--surface-container-high)]/40" : ""
                      }`}
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(emp.id)}
                          className="rounded border-[var(--outline-variant)] accent-[var(--primary)] cursor-pointer"
                        />
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/admin/employees/${emp.id}`}
                          className="flex items-center gap-3 group"
                        >
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                            style={{
                              background: "var(--primary-container)",
                              color: "var(--on-primary-container)",
                            }}
                          >
                            {getInitials(emp.full_name)}
                          </div>
                          <div>
                            <p className="font-semibold text-body-sm group-hover:text-[var(--primary)] transition-colors">
                              {emp.full_name}
                            </p>
                            <p className="text-xs text-[var(--on-surface-variant)]">{emp.email}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="p-4 font-mono text-xs text-[var(--on-surface-variant)] font-semibold">
                        {emp.employee_id}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[var(--primary-container)] text-[var(--on-primary-container)]">
                            {emp.role}
                          </span>
                          <span className="text-xs text-[var(--on-surface-variant)]">
                            {emp.department || "General"}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-xs font-mono text-[var(--on-surface-variant)]">
                        {emp.phone || "—"}
                      </td>
                      <td className="p-4 text-xs font-mono text-[var(--on-surface-variant)]">
                        {emp.date_of_joining || "—"}
                      </td>
                      <td className="p-4 text-right relative">
                        <button
                          onClick={() => setOpenDropdownId(isDropdownOpen ? null : emp.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--surface-container-high)] transition-colors cursor-pointer ml-auto"
                        >
                          <span className="material-symbols-outlined text-base">more_vert</span>
                        </button>

                        {isDropdownOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-30"
                              onClick={() => setOpenDropdownId(null)}
                            />
                            <div
                              className="absolute right-4 top-12 z-40 w-44 rounded-xl shadow-xl border py-1 text-left"
                              style={{
                                background: "var(--surface-container-lowest)",
                                borderColor: "var(--outline-variant)",
                              }}
                            >
                              <Link
                                href={`/admin/employees/${emp.id}`}
                                className="flex items-center gap-2 px-3.5 py-2 text-xs hover:bg-[var(--surface-container-high)] transition-colors"
                              >
                                <span className="material-symbols-outlined text-sm">visibility</span>
                                View Profile
                              </Link>
                              <Link
                                href={`/admin/payroll?user=${emp.id}`}
                                className="flex items-center gap-2 px-3.5 py-2 text-xs hover:bg-[var(--surface-container-high)] transition-colors"
                              >
                                <span className="material-symbols-outlined text-sm">payments</span>
                                Salary Structure
                              </Link>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {employees.map((emp) => {
            const isSelected = selectedIds.has(emp.id);
            return (
              <div
                key={emp.id}
                className={`border rounded-2xl p-5 relative transition-all hover:shadow-md ${
                  isSelected ? "ring-2 ring-[var(--primary)]" : ""
                }`}
                style={{
                  background: "var(--surface-container-lowest)",
                  borderColor: "var(--outline-variant)",
                }}
              >
                <div className="absolute top-4 right-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(emp.id)}
                    className="rounded border-[var(--outline-variant)] accent-[var(--primary)] cursor-pointer"
                  />
                </div>

                <div className="flex flex-col items-center text-center pt-2 pb-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-bold shadow-sm mb-3"
                    style={{
                      background: "var(--primary-container)",
                      color: "var(--on-primary-container)",
                    }}
                  >
                    {getInitials(emp.full_name)}
                  </div>
                  <h4 className="font-bold text-body-md truncate w-full">{emp.full_name}</h4>
                  <p className="text-xs text-[var(--on-surface-variant)] mb-2">
                    {emp.job_title || emp.role}
                  </p>
                  <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[var(--primary-container)] text-[var(--on-primary-container)]">
                    {emp.department || "General"}
                  </span>
                </div>

                <div className="pt-3 border-t border-[var(--outline-variant)] space-y-1.5 text-xs text-[var(--on-surface-variant)]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono">ID:</span>
                    <span className="font-mono font-semibold text-[var(--on-surface)]">
                      {emp.employee_id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Joined:</span>
                    <span className="font-mono">{emp.date_of_joining || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between truncate">
                    <span>Email:</span>
                    <span className="truncate ml-2 text-[var(--on-surface)]">{emp.email}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--outline-variant)] flex items-center justify-between">
                  <Link
                    href={`/admin/employees/${emp.id}`}
                    className="w-full py-1.5 rounded-xl text-xs font-semibold text-center bg-[var(--surface-container-high)] hover:bg-[var(--primary)] hover:text-white transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
