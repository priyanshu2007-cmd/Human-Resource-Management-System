"use client";

import { useState, useEffect, useCallback } from "react";
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
              <span
                className="font-mono text-label-caps uppercase"
                style={{ color: "var(--on-surface-variant)" }}
              >
                Effective {formatDate(current.effective_from)}
              </span>
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
    </div>
  );
}
