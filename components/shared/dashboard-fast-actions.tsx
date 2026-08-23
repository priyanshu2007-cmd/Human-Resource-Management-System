"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Props {
  userId: string;
  orgId: string;
  todayStatus: string | null;
  checkIn: string | null;
  checkOut: string | null;
}

export function DashboardFastActions({
  userId,
  orgId,
  todayStatus,
  checkIn,
  checkOut,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(todayStatus);
  const [checkedIn, setCheckedIn] = useState(checkIn);
  const [checkedOut, setCheckedOut] = useState(checkOut);

  // Leave form state
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveType, setLeaveType] = useState<"paid" | "sick" | "unpaid">("paid");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submittingLeave, setSubmittingLeave] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  async function handleCheckIn() {
    setLoading(true);
    const supabase = createClient();
    const now = new Date().toISOString();

    const { error } = await supabase.from("attendance").upsert(
      {
        user_id: userId,
        organization_id: orgId,
        date: today,
        check_in: now,
        status: "present",
      },
      { onConflict: "user_id,date" }
    );

    setLoading(false);
    if (error) {
      toast.error("Failed to check in: " + error.message);
    } else {
      setStatus("present");
      setCheckedIn(now);
      toast.success("Checked in successfully!");
      router.refresh();
    }
  }

  async function handleCheckOut() {
    setLoading(true);
    const supabase = createClient();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("attendance")
      .update({ check_out: now })
      .eq("user_id", userId)
      .eq("date", today);

    setLoading(false);
    if (error) {
      toast.error("Failed to check out: " + error.message);
    } else {
      setCheckedOut(now);
      toast.success("Checked out successfully!");
      router.refresh();
    }
  }

  async function handleApplyLeave(e: React.FormEvent) {
    e.preventDefault();
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates.");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast.error("Start date must be before end date.");
      return;
    }

    setSubmittingLeave(true);
    const supabase = createClient();

    const { error } = await supabase.from("leave_requests").insert({
      user_id: userId,
      organization_id: orgId,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      remarks: remarks || null,
      status: "pending",
    });

    setSubmittingLeave(false);
    if (error) {
      toast.error("Failed to submit: " + error.message);
    } else {
      toast.success("Leave request submitted!");
      setShowLeaveForm(false);
      setStartDate("");
      setEndDate("");
      setRemarks("");
      router.refresh();
    }
  }

  function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <>
      {/* Fast Action Buttons */}
      <div
        className="border rounded-lg p-5 mb-4"
        style={{
          background: "var(--surface-container-lowest)",
          borderColor: "var(--outline-variant)",
        }}
      >
        <h3 className="text-body-md font-semibold mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          {/* Check In / Out */}
          {!status ? (
            <button
              onClick={handleCheckIn}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded text-body-sm font-semibold cursor-pointer disabled:opacity-60 transition-colors"
              style={{
                background: "var(--status-approved)",
                color: "#fff",
              }}
            >
              <span className="material-symbols-outlined text-lg">login</span>
              {loading ? "Checking in…" : "Check In"}
            </button>
          ) : checkedIn && !checkedOut ? (
            <button
              onClick={handleCheckOut}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded text-body-sm font-semibold cursor-pointer disabled:opacity-60 transition-colors"
              style={{
                background: "var(--status-rejected)",
                color: "#fff",
              }}
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              {loading ? "Checking out…" : "Check Out"}
            </button>
          ) : (
            <div
              className="flex items-center gap-2 px-4 py-2.5 rounded text-body-sm font-semibold"
              style={{
                background: "var(--surface-container-low)",
                color: "var(--on-surface-variant)",
              }}
            >
              <span className="material-symbols-outlined text-lg">check_circle</span>
              Done for today
              {checkedIn && (
                <span className="font-mono text-xs ml-1">
                  {formatTime(checkedIn)} – {checkedOut ? formatTime(checkedOut) : "…"}
                </span>
              )}
            </div>
          )}

          {/* Apply Leave */}
          <button
            onClick={() => setShowLeaveForm(!showLeaveForm)}
            className="flex items-center gap-2 px-4 py-2.5 rounded text-body-sm font-semibold cursor-pointer transition-colors border"
            style={{
              borderColor: "var(--primary)",
              color: "var(--primary)",
              background: showLeaveForm ? "var(--surface-container-low)" : "transparent",
            }}
          >
            <span className="material-symbols-outlined text-lg">event_busy</span>
            Apply Leave
          </button>
        </div>

        {/* Today's status chip */}
        {status && (
          <div className="mt-3 flex items-center gap-2 text-body-sm">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background:
                  status === "present"
                    ? "var(--status-approved)"
                    : status === "absent"
                      ? "var(--status-rejected)"
                      : "var(--status-pending)",
              }}
            />
            <span style={{ color: "var(--on-surface-variant)" }}>
              Today: <span className="capitalize font-medium">{status}</span>
              {checkedIn && (
                <span className="font-mono text-xs ml-2">
                  In {formatTime(checkedIn)}
                  {checkedOut && ` · Out ${formatTime(checkedOut)}`}
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Inline Leave Form */}
      {showLeaveForm && (
        <form
          onSubmit={handleApplyLeave}
          className="border rounded-lg p-5 mb-4 space-y-4"
          style={{
            background: "var(--surface-container-lowest)",
            borderColor: "var(--outline-variant)",
          }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-body-md font-semibold">Quick Leave Request</h3>
            <button
              type="button"
              onClick={() => setShowLeaveForm(false)}
              className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer hover:bg-[var(--surface-container-high)] transition-colors"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                className="block text-xs font-mono uppercase mb-1"
                style={{ color: "var(--on-surface-variant)" }}
              >
                Leave Type
              </label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as "paid" | "sick" | "unpaid")}
                className="w-full border rounded-lg px-3 py-2 text-body-sm"
                style={{
                  background: "var(--surface-container-lowest)",
                  borderColor: "var(--outline-variant)",
                }}
              >
                <option value="paid">Paid Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="unpaid">Unpaid Leave</option>
              </select>
            </div>
            <div>
              <label
                className="block text-xs font-mono uppercase mb-1"
                style={{ color: "var(--on-surface-variant)" }}
              >
                From
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-body-sm"
                style={{
                  background: "var(--surface-container-lowest)",
                  borderColor: "var(--outline-variant)",
                }}
              />
            </div>
            <div>
              <label
                className="block text-xs font-mono uppercase mb-1"
                style={{ color: "var(--on-surface-variant)" }}
              >
                To
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-body-sm"
                style={{
                  background: "var(--surface-container-lowest)",
                  borderColor: "var(--outline-variant)",
                }}
              />
            </div>
          </div>

          <div>
            <label
              className="block text-xs font-mono uppercase mb-1"
              style={{ color: "var(--on-surface-variant)" }}
            >
              Reason (Optional)
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Brief reason for leave"
              className="w-full border rounded-lg px-3 py-2 text-body-sm"
              style={{
                background: "var(--surface-container-lowest)",
                borderColor: "var(--outline-variant)",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={submittingLeave}
            className="flex items-center gap-2 px-4 py-2 rounded text-body-sm font-semibold cursor-pointer disabled:opacity-60 transition-colors"
            style={{
              background: "var(--primary)",
              color: "var(--on-primary)",
            }}
          >
            <span className="material-symbols-outlined text-base">send</span>
            {submittingLeave ? "Submitting…" : "Submit Request"}
          </button>
        </form>
      )}
    </>
  );
}
