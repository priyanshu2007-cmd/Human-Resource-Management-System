"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface LeaveRequest {
  id: string;
  leave_type: "paid" | "sick" | "unpaid";
  start_date: string;
  end_date: string;
  status: "pending" | "approved" | "rejected";
  remarks: string | null;
  admin_comment: string | null;
  created_at: string;
}

export default function EmployeeLeavePage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [employeeName, setEmployeeName] = useState<string>("Employee");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [leaveType, setLeaveType] = useState<"paid" | "sick" | "unpaid">("paid");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Get profile name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    if (profile) setEmployeeName(profile.full_name);

    // Get leave requests
    const { data } = await supabase
      .from("leave_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setRequests((data as LeaveRequest[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute Days difference (Allocation) auto-calculated in real time
  const allocationDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");
    if (end < start) return 0;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }, [startDate, endDate]);

  // Calculate balances (Total vs Taken)
  const paidTaken = requests
    .filter((r) => r.leave_type === "paid" && r.status === "approved")
    .reduce((acc, r) => {
      const s = new Date(r.start_date);
      const e = new Date(r.end_date);
      const d = Math.ceil(Math.abs(e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return acc + (isNaN(d) ? 1 : d);
    }, 0);

  const sickTaken = requests
    .filter((r) => r.leave_type === "sick" && r.status === "approved")
    .reduce((acc, r) => {
      const s = new Date(r.start_date);
      const e = new Date(r.end_date);
      const d = Math.ceil(Math.abs(e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return acc + (isNaN(d) ? 1 : d);
    }, 0);

  const unpaidTaken = requests
    .filter((r) => r.leave_type === "unpaid" && r.status === "approved")
    .reduce((acc, r) => {
      const s = new Date(r.start_date);
      const e = new Date(r.end_date);
      const d = Math.ceil(Math.abs(e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return acc + (isNaN(d) ? 1 : d);
    }, 0);

  const TOTAL_PAID = 18;
  const TOTAL_SICK = 12;

  function openModal() {
    setError(null);
    setSuccess(null);
    setLeaveType("paid");
    setStartDate("");
    setEndDate("");
    setRemarks("");
    setAttachmentName(null);
    setIsModalOpen(true);
  }

  function handleDiscard() {
    setIsModalOpen(false);
    setError(null);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentName(file.name);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!startDate || !endDate) {
      setError("Please select both 'From' and 'To' dates.");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError("'To' date cannot be before 'From' date.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSubmitting(false);
      setError("User not authenticated.");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      setSubmitting(false);
      setError("Profile not found.");
      return;
    }

    let remarkWithAttachment = remarks;
    if (attachmentName) {
      remarkWithAttachment = remarks
        ? `${remarks} [Attachment: ${attachmentName}]`
        : `[Attachment: ${attachmentName}]`;
    }

    const { error: insertError } = await supabase.from("leave_requests").insert({
      user_id: user.id,
      organization_id: profile.organization_id,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      remarks: remarkWithAttachment || null,
      status: "pending",
    });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
    } else {
      setIsModalOpen(false);
      setSuccess("Time off request submitted successfully.");
      await fetchData();
    }
  }

  const statusColors = {
    pending: "var(--status-pending)",
    approved: "var(--status-approved)",
    rejected: "var(--status-rejected)",
  };

  const statusBg = {
    pending: "rgba(234,179,8,0.12)",
    approved: "rgba(34,197,94,0.12)",
    rejected: "rgba(239,68,68,0.12)",
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-lg font-semibold">Time Off & Leaves</h1>
          <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
            View your personal leave quotas, request new time off, and track approvals
          </p>
        </div>
        <button
          type="button"
          onClick={openModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-body-sm shadow-md transition-all hover:scale-105 cursor-pointer self-start sm:self-auto"
          style={{
            background: "var(--primary)",
            color: "var(--on-primary)",
          }}
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          Apply for Leave
        </button>
      </div>

      {success && (
        <div className="p-3 rounded-lg text-body-sm bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">check_circle</span>
          {success}
        </div>
      )}

      {/* Leave Balances: Total vs Taken */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Paid Time Off */}
        <div
          className="border rounded-2xl p-5 shadow-sm"
          style={{
            background: "var(--surface-container-lowest)",
            borderColor: "var(--outline-variant)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-label-caps uppercase text-xs" style={{ color: "var(--on-surface-variant)" }}>
              Paid Time Off
            </span>
            <span className="material-symbols-outlined text-xl" style={{ color: "var(--primary)" }}>
              flight_takeoff
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-headline-xl font-bold font-mono text-[var(--primary)]">
              {Math.max(0, TOTAL_PAID - paidTaken)}
            </p>
            <span className="text-xs text-[var(--on-surface-variant)]">days available</span>
          </div>
          <div className="w-full bg-[var(--surface-container-high)] rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-[var(--primary)] h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, (paidTaken / TOTAL_PAID) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-[var(--on-surface-variant)] mt-2 flex justify-between">
            <span>Taken: <b>{paidTaken}</b> days</span>
            <span>Total Quota: <b>{TOTAL_PAID}</b></span>
          </p>
        </div>

        {/* Sick Leave */}
        <div
          className="border rounded-2xl p-5 shadow-sm"
          style={{
            background: "var(--surface-container-lowest)",
            borderColor: "var(--outline-variant)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-label-caps uppercase text-xs" style={{ color: "var(--on-surface-variant)" }}>
              Sick Leave
            </span>
            <span className="material-symbols-outlined text-xl text-emerald-600 dark:text-emerald-400">
              medical_services
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-headline-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {Math.max(0, TOTAL_SICK - sickTaken)}
            </p>
            <span className="text-xs text-[var(--on-surface-variant)]">days available</span>
          </div>
          <div className="w-full bg-[var(--surface-container-high)] rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, (sickTaken / TOTAL_SICK) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-[var(--on-surface-variant)] mt-2 flex justify-between">
            <span>Taken: <b>{sickTaken}</b> days</span>
            <span>Total Quota: <b>{TOTAL_SICK}</b></span>
          </p>
        </div>

        {/* Unpaid Leaves */}
        <div
          className="border rounded-2xl p-5 shadow-sm"
          style={{
            background: "var(--surface-container-lowest)",
            borderColor: "var(--outline-variant)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-label-caps uppercase text-xs" style={{ color: "var(--on-surface-variant)" }}>
              Unpaid Leaves
            </span>
            <span className="material-symbols-outlined text-xl text-amber-600 dark:text-amber-400">
              event_busy
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-headline-xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {unpaidTaken}
            </p>
            <span className="text-xs text-[var(--on-surface-variant)]">days taken this year</span>
          </div>
          <p className="text-xs text-[var(--on-surface-variant)] mt-5">
            Requires manager approval · Deducted from payroll cycle
          </p>
        </div>
      </div>

      {/* Leave Request History Table */}
      <div
        className="border rounded-2xl overflow-hidden shadow-sm"
        style={{
          background: "var(--surface-container-lowest)",
          borderColor: "var(--outline-variant)",
        }}
      >
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: "var(--outline-variant)" }}>
          <div>
            <h2 className="text-title-md font-bold">Personal Leave History</h2>
            <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
              Your past applied time-off requests and approval feedback
            </p>
          </div>
          <span className="material-symbols-outlined text-xl text-[var(--outline)]">
            history
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
            Loading leave records…
          </div>
        ) : requests.length > 0 ? (
          <div className="divide-y" style={{ borderColor: "var(--outline-variant)" }}>
            {requests.map((req) => {
              const start = new Date(req.start_date + "T00:00:00");
              const end = new Date(req.end_date + "T00:00:00");
              const diff = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

              return (
                <div
                  key={req.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--surface-container-low)] transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-body-md capitalize">
                        {req.leave_type === "paid" ? "Paid Time Off" : req.leave_type === "sick" ? "Sick Leave" : "Unpaid Leave"}
                      </span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[var(--surface-container-high)] font-semibold">
                        {diff} {diff === 1 ? "day" : "days"}
                      </span>
                    </div>

                    <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
                      {new Date(req.start_date + "T00:00:00").toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      →{" "}
                      {new Date(req.end_date + "T00:00:00").toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>

                    {req.remarks && (
                      <p className="text-xs italic text-[var(--outline)]">
                        Reason: {req.remarks}
                      </p>
                    )}

                    {req.admin_comment && (
                      <p className="text-xs font-medium text-[var(--primary)] mt-1">
                        Admin Note: &ldquo;{req.admin_comment}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="shrink-0">
                    <span
                      className="font-mono text-label-caps uppercase px-3 py-1 rounded-full text-xs font-bold"
                      style={{
                        color: statusColors[req.status],
                        background: statusBg[req.status],
                      }}
                    >
                      {req.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-5xl mb-2 text-[var(--outline-variant)]">
              beach_access
            </span>
            <p className="text-body-md font-semibold">No leave requests yet</p>
            <p className="text-body-sm mt-1" style={{ color: "var(--on-surface-variant)" }}>
              Click &quot;Apply for Leave&quot; above to submit your first time-off request.
            </p>
          </div>
        )}
      </div>

      {/* Leave Request Popup Modal (With Exact Specified Fields) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg rounded-2xl border shadow-2xl p-6 sm:p-8"
            style={{
              background: "var(--surface-container-lowest)",
              borderColor: "var(--outline-variant)",
            }}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b mb-6" style={{ borderColor: "var(--outline-variant)" }}>
              <div>
                <h2 className="text-headline-sm font-bold">Apply for Time Off</h2>
                <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
                  Submit a leave request for admin approval
                </p>
              </div>
              <button
                onClick={handleDiscard}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer hover:bg-black/10 dark:hover:bg-white/10"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg text-body-sm mb-4 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 1. Employee Name (Auto-filled / Read-only) */}
              <div>
                <label className="block font-mono text-label-caps uppercase tracking-widest mb-1.5" style={{ color: "var(--on-surface-variant)" }}>
                  Employee Name (Auto-filled)
                </label>
                <input
                  type="text"
                  value={employeeName}
                  readOnly
                  disabled
                  className="w-full border rounded-lg px-3.5 py-2.5 text-body-md font-semibold opacity-80 cursor-not-allowed"
                  style={{
                    background: "var(--surface-container-high)",
                    borderColor: "var(--outline-variant)",
                  }}
                />
              </div>

              {/* 2. Time off Type (Dropdown: Paid time off, Sick Leave, Unpaid Leaves) */}
              <div>
                <label className="block font-mono text-label-caps uppercase tracking-widest mb-1.5" style={{ color: "var(--on-surface-variant)" }}>
                  Time off Type *
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as "paid" | "sick" | "unpaid")}
                  className="w-full border rounded-lg px-3.5 py-2.5 text-body-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  style={{
                    background: "var(--surface-container-lowest)",
                    borderColor: "var(--outline-variant)",
                  }}
                >
                  <option value="paid">Paid time off (Vacation / Casual)</option>
                  <option value="sick">Sick Leave (Medical / Illness)</option>
                  <option value="unpaid">Unpaid Leaves (Loss of Pay)</option>
                </select>
              </div>

              {/* 3. Validity Period (Date picker for 'From' and 'To' dates) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-label-caps uppercase tracking-widest mb-1.5" style={{ color: "var(--on-surface-variant)" }}>
                    From Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-body-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    style={{
                      background: "var(--surface-container-lowest)",
                      borderColor: "var(--outline-variant)",
                    }}
                  />
                </div>

                <div>
                  <label className="block font-mono text-label-caps uppercase tracking-widest mb-1.5" style={{ color: "var(--on-surface-variant)" }}>
                    To Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-body-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    style={{
                      background: "var(--surface-container-lowest)",
                      borderColor: "var(--outline-variant)",
                    }}
                  />
                </div>
              </div>

              {/* 4. Allocation (Auto-calculated number of Days) */}
              <div
                className="p-3.5 rounded-xl border flex items-center justify-between"
                style={{
                  background: "var(--surface-container-low)",
                  borderColor: "var(--outline-variant)",
                }}
              >
                <div>
                  <span className="font-mono text-label-caps uppercase text-xs block text-[var(--on-surface-variant)]">
                    Allocation (Auto-calculated)
                  </span>
                  <span className="text-xs text-[var(--outline)]">
                    Inclusive working duration
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono font-bold text-headline-sm text-[var(--primary)]">
                  <span className="material-symbols-outlined text-lg">date_range</span>
                  <span>{allocationDays} {allocationDays === 1 ? "Day" : "Days"}</span>
                </div>
              </div>

              {/* Remarks / Reason */}
              <div>
                <label className="block font-mono text-label-caps uppercase tracking-widest mb-1.5" style={{ color: "var(--on-surface-variant)" }}>
                  Reason / Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Family function, doctor appointment..."
                  className="w-full border rounded-lg px-3.5 py-2 text-body-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                  style={{
                    background: "var(--surface-container-lowest)",
                    borderColor: "var(--outline-variant)",
                  }}
                />
              </div>

              {/* 5. Attachment (Upload button specifically noted for things like sick leave certificates) */}
              <div>
                <label className="block font-mono text-label-caps uppercase tracking-widest mb-1.5" style={{ color: "var(--on-surface-variant)" }}>
                  Attachment (Sick Certificate / Medical Proof)
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-lg border text-body-sm font-semibold flex items-center gap-2 hover:border-[var(--primary)] transition-colors cursor-pointer"
                    style={{
                      borderColor: "var(--outline-variant)",
                      background: "var(--surface-container-low)",
                    }}
                  >
                    <span className="material-symbols-outlined text-lg">attach_file</span>
                    Choose Document
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <span className="text-xs text-[var(--on-surface-variant)] truncate max-w-[200px]">
                    {attachmentName || "No file attached (optional)"}
                  </span>
                </div>
              </div>

              {/* 6. Submit and Discard Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: "var(--outline-variant)" }}>
                <button
                  type="button"
                  onClick={handleDiscard}
                  className="px-5 py-2.5 rounded-lg text-body-sm font-semibold border transition-colors cursor-pointer"
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
                  className="px-6 py-2.5 rounded-lg text-body-sm font-bold shadow-md transition-all cursor-pointer disabled:opacity-60 flex items-center gap-2"
                  style={{
                    background: "var(--primary)",
                    color: "var(--on-primary)",
                  }}
                >
                  {submitting ? "Submitting…" : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
