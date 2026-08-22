"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export default function EmployeeLeavePage() {
  const [requests, setRequests] = useState<
    Array<{
      id: string;
      leave_type: string;
      start_date: string;
      end_date: string;
      status: string;
      remarks: string | null;
      admin_comment: string | null;
      created_at: string;
    }>
  >([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [leaveType, setLeaveType] = useState<"paid" | "sick" | "unpaid">("paid");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("leave_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setRequests(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!startDate || !endDate) {
      setError("Start and end dates are required.");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError("End date must be after start date.");
      return;
    }

    setSubmitting(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) return;

    const { error: insertError } = await supabase.from("leave_requests").insert({
      user_id: user.id,
      organization_id: profile.organization_id,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      remarks: remarks || null,
    });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    // Reset form
    setLeaveType("paid");
    setStartDate("");
    setEndDate("");
    setRemarks("");
    setShowForm(false);
    setSubmitting(false);
    await fetchData();
  }

  const statusColors: Record<string, string> = {
    pending: "var(--status-pending)",
    approved: "var(--status-approved)",
    rejected: "var(--status-rejected)",
  };

  const statusBg: Record<string, string> = {
    pending: "rgba(234,179,8,0.1)",
    approved: "rgba(34,197,94,0.1)",
    rejected: "rgba(239,68,68,0.1)",
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-headline-lg font-semibold">Time Off</h1>
          <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
            Manage your leave requests
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded text-body-sm font-semibold transition-colors cursor-pointer"
          style={{
            background: "var(--primary)",
            color: "var(--on-primary)",
          }}
        >
          <span className="material-symbols-outlined text-lg">add</span>
          New
        </button>
      </div>

      {/* New request form */}
      {showForm && (
        <div
          className="border rounded-lg p-6 mb-6"
          style={{
            background: "var(--surface-container-lowest)",
            borderColor: "var(--outline-variant)",
          }}
        >
          <h2 className="text-title-md font-semibold mb-4">
            New time off request
          </h2>
          <p className="text-body-sm mb-4" style={{ color: "var(--on-surface-variant)" }}>
            Approvals usually land within 24 hours.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                className="p-3 rounded text-body-sm"
                style={{
                  background: "var(--error-container)",
                  color: "var(--on-error-container)",
                }}
              >
                {error}
              </div>
            )}

            <div>
              <label
                className="block font-mono text-label-caps uppercase tracking-widest mb-1"
                style={{ color: "var(--on-surface-variant)" }}
              >
                Time Off Type
              </label>
              <select
                value={leaveType}
                onChange={(e) =>
                  setLeaveType(e.target.value as "paid" | "sick" | "unpaid")
                }
                className="w-full border rounded px-3 py-2.5 text-body-md focus:outline-none focus:ring-1 transition-colors"
                style={{
                  background: "var(--surface-container-lowest)",
                  borderColor: "var(--outline-variant)",
                }}
              >
                <option value="paid">Paid Time Off</option>
                <option value="sick">Sick Leave</option>
                <option value="unpaid">Unpaid Leave</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="block font-mono text-label-caps uppercase tracking-widest mb-1"
                  style={{ color: "var(--on-surface-variant)" }}
                >
                  From
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full border rounded px-3 py-2.5 text-body-md focus:outline-none focus:ring-1 transition-colors"
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
                  To
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full border rounded px-3 py-2.5 text-body-md focus:outline-none focus:ring-1 transition-colors"
                  style={{
                    background: "var(--surface-container-lowest)",
                    borderColor: "var(--outline-variant)",
                  }}
                />
              </div>
            </div>

            <div>
              <label
                className="block font-mono text-label-caps uppercase tracking-widest mb-1"
                style={{ color: "var(--on-surface-variant)" }}
              >
                Remarks
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional reason for leave"
                rows={3}
                className="w-full border rounded px-3 py-2.5 text-body-md focus:outline-none focus:ring-1 transition-colors resize-none"
                style={{
                  background: "var(--surface-container-lowest)",
                  borderColor: "var(--outline-variant)",
                }}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 rounded text-body-sm font-semibold transition-colors cursor-pointer border"
                style={{
                  borderColor: "var(--outline-variant)",
                  color: "var(--on-surface-variant)",
                }}
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2.5 rounded text-body-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
                style={{
                  background: "var(--primary)",
                  color: "var(--on-primary)",
                }}
              >
                {submitting ? "Submitting…" : "Submit"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Request list */}
      <div
        className="border rounded-lg overflow-hidden"
        style={{
          background: "var(--surface-container-lowest)",
          borderColor: "var(--outline-variant)",
        }}
      >
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--outline-variant)" }}>
          <h2 className="text-title-md font-semibold">Request History</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
              Loading…
            </p>
          </div>
        ) : requests.length > 0 ? (
          <div className="divide-y" style={{ borderColor: "var(--outline-variant)" }}>
            {requests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between px-5 py-4"
              >
                <div>
                  <p className="text-body-sm font-semibold capitalize">
                    {req.leave_type} Leave
                  </p>
                  <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
                    {req.start_date} → {req.end_date}
                  </p>
                  {req.admin_comment && (
                    <p
                      className="text-body-sm mt-1 italic"
                      style={{ color: "var(--outline)" }}
                    >
                      &ldquo;{req.admin_comment}&rdquo;
                    </p>
                  )}
                </div>
                <span
                  className="font-mono text-label-caps uppercase px-2 py-0.5 rounded-sm"
                  style={{
                    color: statusColors[req.status],
                    background: statusBg[req.status],
                  }}
                >
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <span
              className="material-symbols-outlined text-4xl mb-2 block"
              style={{ color: "var(--outline-variant)" }}
            >
              beach_access
            </span>
            <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
              No leave requests yet. Click &quot;New&quot; to submit one.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
