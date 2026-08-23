"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Pagination } from "@/components/shared/pagination";

const PAGE_SIZE = 10;

interface LeaveRequestRow {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: string;
  remarks: string | null;
  admin_comment: string | null;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    employee_id: string;
    department: string | null;
    job_title: string | null;
    role: string;
  } | null;
}

type Filter = "pending" | "all";

export default function AdminLeaveApprovalsPage() {
  const [requests, setRequests] = useState<LeaveRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("pending");
  const [currentPage, setCurrentPage] = useState(1);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from("leave_requests")
      .select(
        "id, leave_type, start_date, end_date, status, remarks, admin_comment, created_at, user_id, profiles(full_name, employee_id, department, job_title, role)"
      )
      .order("created_at", { ascending: false });

    if (filter === "pending") {
      query = query.eq("status", "pending");
    }

    const { data } = await query;
    setRequests((data as unknown as LeaveRequestRow[]) || []);
    setCurrentPage(1);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch when the tab regains focus, so approvals/rejections from
  // elsewhere (or the employee side) stay in sync without a hard refresh.
  useEffect(() => {
    function onFocus() {
      fetchData();
    }
    globalThis.addEventListener("focus", onFocus);
    return () => globalThis.removeEventListener("focus", onFocus);
  }, [fetchData]);

  async function handleDecision(
    id: string,
    decision: "approved" | "rejected",
    comment?: string
  ) {
    setError(null);
    setActioningId(id);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: updateError } = await supabase
      .from("leave_requests")
      .update({
        status: decision,
        admin_comment: comment || null,
        reviewed_by: user?.id ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
      setActioningId(null);
      return;
    }

    setRejectingId(null);
    setCommentDraft((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    await fetchData();
    setActioningId(null);
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

  const cardStyle: React.CSSProperties = {
    background: "var(--surface-container-lowest)",
    borderColor: "var(--outline-variant)",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-headline-lg font-semibold">Time Off Approvals</h1>
          <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
            Review and act on leave requests across your organization
          </p>
        </div>
        <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: "var(--outline-variant)" }}>
          <button
            type="button"
            onClick={() => setFilter("pending")}
            className="px-4 py-2 text-body-sm font-semibold transition-colors cursor-pointer"
            style={{
              background: filter === "pending" ? "var(--primary)" : "transparent",
              color: filter === "pending" ? "var(--on-primary)" : "var(--on-surface-variant)",
            }}
          >
            Pending
          </button>
          <button
            type="button"
            onClick={() => setFilter("all")}
            className="px-4 py-2 text-body-sm font-semibold transition-colors cursor-pointer"
            style={{
              background: filter === "all" ? "var(--primary)" : "transparent",
              color: filter === "all" ? "var(--on-primary)" : "var(--on-surface-variant)",
            }}
          >
            All
          </button>
        </div>
      </div>

      {error && (
        <div
          className="p-3 rounded text-body-sm mb-4"
          style={{ background: "var(--error-container)", color: "var(--on-error-container)" }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div
          className="border rounded-lg p-8 text-center text-body-sm"
          style={{ ...cardStyle, color: "var(--on-surface-variant)" }}
        >
          Loading…
        </div>
      ) : requests.length > 0 ? (
        <div className="space-y-3">
          {requests.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((req) => {
            const nameParts = (req.profiles?.full_name || "").split(" ");
            const initials = (
              (nameParts[0]?.[0] || "") +
              (nameParts[nameParts.length - 1]?.[0] || "")
            ).toUpperCase();

            return (
              <div key={req.id} className="border rounded-xl p-5" style={cardStyle}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-body-sm font-semibold shrink-0"
                      style={{
                        background: "var(--primary-container)",
                        color: "var(--on-primary-container)",
                      }}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-body-sm font-semibold">
                        {req.profiles?.full_name || "Unknown"}{" "}
                        <span className="font-mono text-body-sm font-normal" style={{ color: "var(--outline)" }}>
                          {req.profiles?.employee_id}
                        </span>
                      </p>
                      <p className="text-body-sm capitalize" style={{ color: "var(--on-surface-variant)" }}>
                        {req.profiles?.job_title ||
                          (req.profiles?.role === "admin" ? "Admin" : "Employee")}
                        {req.profiles?.department && ` · ${req.profiles.department}`}
                      </p>
                      <p className="text-body-sm capitalize mt-1" style={{ color: "var(--on-surface-variant)" }}>
                        {req.leave_type} leave · {req.start_date} → {req.end_date}
                      </p>
                      {req.remarks && (
                        <p className="text-body-sm mt-1 italic" style={{ color: "var(--outline)" }}>
                          &ldquo;{req.remarks}&rdquo;
                        </p>
                      )}
                      {req.admin_comment && (
                        <p className="text-body-sm mt-1" style={{ color: "var(--on-surface-variant)" }}>
                          Admin note: {req.admin_comment}
                        </p>
                      )}
                    </div>
                  </div>
                  <span
                    className="font-mono text-label-caps uppercase px-2 py-0.5 rounded-sm shrink-0"
                    style={{ color: statusColors[req.status], background: statusBg[req.status] }}
                  >
                    {req.status}
                  </span>
                </div>

                {req.status === "pending" && (
                  <div className="mt-3 pl-[52px]">
                    {rejectingId === req.id ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={commentDraft[req.id] || ""}
                          onChange={(e) =>
                            setCommentDraft((prev) => ({ ...prev, [req.id]: e.target.value }))
                          }
                          placeholder="Reason for rejection (optional)"
                          className="flex-1 min-w-[200px] border rounded px-3 py-2 text-body-sm focus:outline-none focus:ring-1 transition-colors"
                          style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
                        />
                        <button
                          type="button"
                          disabled={actioningId === req.id}
                          onClick={() => handleDecision(req.id, "rejected", commentDraft[req.id])}
                          className="px-3 py-2 rounded text-body-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
                          style={{ background: "var(--status-rejected)", color: "#ffffff" }}
                        >
                          Confirm Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejectingId(null)}
                          className="px-3 py-2 rounded text-body-sm font-semibold transition-colors cursor-pointer border"
                          style={{ borderColor: "var(--outline-variant)", color: "var(--on-surface-variant)" }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={actioningId === req.id}
                          onClick={() => handleDecision(req.id, "approved")}
                          className="flex items-center gap-1.5 px-3 py-2 rounded text-body-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
                          style={{ background: "var(--status-approved)", color: "#ffffff" }}
                        >
                          <span className="material-symbols-outlined text-lg">check</span>
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={actioningId === req.id}
                          onClick={() => setRejectingId(req.id)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded text-body-sm font-semibold transition-colors cursor-pointer border disabled:opacity-60"
                          style={{ borderColor: "var(--outline-variant)", color: "var(--on-surface-variant)" }}
                        >
                          <span className="material-symbols-outlined text-lg">close</span>
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border rounded-lg p-12 text-center" style={cardStyle}>
          <span
            className="material-symbols-outlined text-5xl mb-3 block"
            style={{ color: "var(--outline-variant)" }}
          >
            task_alt
          </span>
          <p className="text-body-md font-semibold mb-1">
            {filter === "pending" ? "No pending requests" : "No leave requests"}
          </p>
          <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
            {filter === "pending"
              ? "You're all caught up."
              : "Nothing has been submitted yet."}
          </p>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(requests.length / PAGE_SIZE)}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
