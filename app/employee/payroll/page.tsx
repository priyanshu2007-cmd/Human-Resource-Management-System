"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface SalaryRecord {
  id: string;
  base_salary: number;
  allowances: number | null;
  deductions: number | null;
  effective_from: string;
}

export default function EmployeePayrollPage() {
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPayslip, setShowPayslip] = useState(false);
  const [employeeName, setEmployeeName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [department, setDepartment] = useState("");
  const payslipRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error: fetchError } = await supabase
      .from("salary_structures")
      .select("id, base_salary, allowances, deductions, effective_from")
      .eq("user_id", user.id)
      .order("effective_from", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setRecords(data || []);
    setLoading(false);

    // Fetch profile info for payslip header
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, employee_id, department")
      .eq("id", user.id)
      .single();
    if (profile) {
      setEmployeeName(profile.full_name || "");
      setEmployeeId(profile.employee_id || "");
      setDepartment(profile.department || "");
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function formatAmount(value: number): string {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function netPay(r: SalaryRecord): number {
    return r.base_salary + (r.allowances || 0) - (r.deductions || 0);
  }

  function handlePrint() {
    const content = payslipRef.current;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Payslip - ${employeeName}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; color: #1a1c1c; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; }
            th, td { padding: 10px 14px; text-align: left; border-bottom: 1px solid #e2e2e2; font-size: 14px; }
            th { font-weight: 600; color: #4a4455; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; }
            .header { text-align: center; margin-bottom: 32px; }
            .header h1 { font-size: 24px; margin: 0; }
            .header p { color: #7b7487; margin: 4px 0; font-size: 13px; }
            .total { font-weight: 700; font-size: 16px; }
            .positive { color: #12a46b; }
            .negative { color: #d23a30; }
            .net { color: #630ed4; }
            hr { border: none; border-top: 2px solid #630ed4; margin: 24px 0; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  }

  const current = records[0];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-headline-lg font-semibold">Payroll</h1>
        <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
          Your salary breakdown and history
        </p>
      </div>

      {error && (
        <div
          className="p-3 rounded text-body-sm mb-4"
          style={{
            background: "var(--error-container)",
            color: "var(--on-error-container)",
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center">
          <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
            Loading…
          </p>
        </div>
      ) : !current ? (
        <div
          className="border rounded-lg p-8 text-center"
          style={{
            background: "var(--surface-container-lowest)",
            borderColor: "var(--outline-variant)",
          }}
        >
          <span
            className="material-symbols-outlined text-4xl mb-2 block"
            style={{ color: "var(--outline-variant)" }}
          >
            payments
          </span>
          <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
            No salary structure has been set up for you yet. Contact your admin.
          </p>
        </div>
      ) : (
        <>
          {/* Current breakdown */}
          <div
            className="border rounded-lg p-6 mb-6"
            style={{
              background: "var(--surface-container-lowest)",
              borderColor: "var(--outline-variant)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-title-md font-semibold">Current Structure</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowPayslip(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-body-sm font-semibold cursor-pointer transition-colors"
                  style={{
                    background: "var(--primary)",
                    color: "var(--on-primary)",
                  }}
                >
                  <span className="material-symbols-outlined text-base">receipt_long</span>
                  View Payslip
                </button>
                <span
                  className="font-mono text-label-caps uppercase"
                  style={{ color: "var(--on-surface-variant)" }}
                >
                  Effective {formatDate(current.effective_from)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              <div>
                <p
                  className="font-mono text-label-caps uppercase tracking-widest mb-1"
                  style={{ color: "var(--on-surface-variant)" }}
                >
                  Base
                </p>
                <p className="font-mono text-body-md font-semibold">
                  {formatAmount(current.base_salary)}
                </p>
              </div>
              <div>
                <p
                  className="font-mono text-label-caps uppercase tracking-widest mb-1"
                  style={{ color: "var(--on-surface-variant)" }}
                >
                  Allowances
                </p>
                <p
                  className="font-mono text-body-md font-semibold"
                  style={{ color: "var(--status-approved)" }}
                >
                  +{formatAmount(current.allowances || 0)}
                </p>
              </div>
              <div>
                <p
                  className="font-mono text-label-caps uppercase tracking-widest mb-1"
                  style={{ color: "var(--on-surface-variant)" }}
                >
                  Deductions
                </p>
                <p
                  className="font-mono text-body-md font-semibold"
                  style={{ color: "var(--status-rejected)" }}
                >
                  −{formatAmount(current.deductions || 0)}
                </p>
              </div>
              <div>
                <p
                  className="font-mono text-label-caps uppercase tracking-widest mb-1"
                  style={{ color: "var(--on-surface-variant)" }}
                >
                  Net Pay
                </p>
                <p className="font-mono text-body-md font-semibold" style={{ color: "var(--primary)" }}>
                  {formatAmount(netPay(current))}
                </p>
              </div>
            </div>
          </div>

          {/* History */}
          <div
            className="border rounded-lg overflow-hidden"
            style={{
              background: "var(--surface-container-lowest)",
              borderColor: "var(--outline-variant)",
            }}
          >
            <div className="px-5 py-4 border-b" style={{ borderColor: "var(--outline-variant)" }}>
              <h2 className="text-title-md font-semibold">History</h2>
            </div>

            {records.length > 0 ? (
              <div className="divide-y" style={{ borderColor: "var(--outline-variant)" }}>
                {records.map((record, idx) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          background: idx === 0 ? "var(--status-approved)" : "var(--outline-variant)",
                        }}
                      />
                      <div>
                        <p className="text-body-sm font-medium">
                          {formatDate(record.effective_from)}
                        </p>
                        <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
                          Base {formatAmount(record.base_salary)} · Allowances{" "}
                          {formatAmount(record.allowances || 0)} · Deductions{" "}
                          {formatAmount(record.deductions || 0)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {idx === 0 && (
                        <span
                          className="font-mono text-label-caps uppercase px-2 py-0.5 rounded-sm"
                          style={{
                            color: "var(--status-approved)",
                            background: "rgba(34,197,94,0.1)",
                          }}
                        >
                          Current
                        </span>
                      )}
                      <span className="font-mono text-body-sm font-semibold">
                        {formatAmount(netPay(record))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
                  No history yet.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Payslip Modal */}
      {showPayslip && current && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowPayslip(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-8 shadow-xl"
            style={{
              background: "var(--surface-container-lowest)",
              border: "1px solid var(--outline-variant)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with close & print */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-title-md font-bold">Payslip</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-body-sm font-semibold cursor-pointer transition-colors"
                  style={{
                    background: "var(--primary)",
                    color: "var(--on-primary)",
                  }}
                >
                  <span className="material-symbols-outlined text-base">print</span>
                  Print / Download
                </button>
                <button
                  onClick={() => setShowPayslip(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors hover:bg-[var(--surface-container-high)]"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            </div>

            {/* Printable content */}
            <div ref={payslipRef}>
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>Dayflow</h1>
                <p style={{ color: "#7b7487", margin: "4px 0", fontSize: "13px" }}>Every workday, perfectly aligned.</p>
                <p style={{ color: "#7b7487", margin: "4px 0", fontSize: "13px" }}>
                  Payslip for {new Date(current.effective_from + "T00:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </p>
              </div>

              <hr style={{ border: "none", borderTop: "2px solid #630ed4", margin: "16px 0" }} />

              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px" }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "6px 14px", fontSize: "13px", color: "#7b7487" }}>Employee Name</td>
                    <td style={{ padding: "6px 14px", fontSize: "14px", fontWeight: 600 }}>{employeeName}</td>
                    <td style={{ padding: "6px 14px", fontSize: "13px", color: "#7b7487" }}>Employee ID</td>
                    <td style={{ padding: "6px 14px", fontSize: "14px", fontWeight: 600, fontFamily: "monospace" }}>{employeeId}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "6px 14px", fontSize: "13px", color: "#7b7487" }}>Department</td>
                    <td style={{ padding: "6px 14px", fontSize: "14px", fontWeight: 600 }}>{department || "General"}</td>
                    <td style={{ padding: "6px 14px", fontSize: "13px", color: "#7b7487" }}>Effective From</td>
                    <td style={{ padding: "6px 14px", fontSize: "14px", fontWeight: 600 }}>{formatDate(current.effective_from)}</td>
                  </tr>
                </tbody>
              </table>

              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e2e2" }}>
                    <th style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", color: "#4a4455", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Component</th>
                    <th style={{ padding: "10px 14px", textAlign: "right", fontSize: "11px", color: "#4a4455", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #e2e2e2" }}>
                    <td style={{ padding: "10px 14px", fontSize: "14px" }}>Base Salary</td>
                    <td style={{ padding: "10px 14px", fontSize: "14px", textAlign: "right", fontFamily: "monospace" }}>{formatAmount(current.base_salary)}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e2e2e2" }}>
                    <td style={{ padding: "10px 14px", fontSize: "14px", color: "#12a46b" }}>Allowances</td>
                    <td style={{ padding: "10px 14px", fontSize: "14px", textAlign: "right", fontFamily: "monospace", color: "#12a46b" }}>+{formatAmount(current.allowances || 0)}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e2e2e2" }}>
                    <td style={{ padding: "10px 14px", fontSize: "14px", color: "#d23a30" }}>Deductions</td>
                    <td style={{ padding: "10px 14px", fontSize: "14px", textAlign: "right", fontFamily: "monospace", color: "#d23a30" }}>−{formatAmount(current.deductions || 0)}</td>
                  </tr>
                  <tr style={{ borderTop: "2px solid #630ed4" }}>
                    <td style={{ padding: "12px 14px", fontSize: "16px", fontWeight: 700 }}>Net Pay</td>
                    <td style={{ padding: "12px 14px", fontSize: "16px", fontWeight: 700, textAlign: "right", fontFamily: "monospace", color: "#630ed4" }}>{formatAmount(netPay(current))}</td>
                  </tr>
                </tbody>
              </table>

              <p style={{ textAlign: "center", fontSize: "11px", color: "#7b7487", marginTop: "24px" }}>
                This is a system-generated payslip. For any discrepancies, please contact your HR department.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
