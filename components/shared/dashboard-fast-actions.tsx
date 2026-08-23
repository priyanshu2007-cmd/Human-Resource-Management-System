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
      toast.success("Checked in successfully at " + new Date(now).toLocaleTimeString());
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
      toast.success("Checked out successfully at " + new Date(now).toLocaleTimeString());
      router.refresh();
    }
  }

  async function handleApplyLeave(e: React.FormEvent) {
    e.preventDefault();
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates.");
      return;
    }
    if (endDate < startDate) {
      toast.error("End date must be on or after start date.");
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
      remarks: remarks.trim() || null,
      status: "pending",
    });

    setSubmittingLeave(false);
    if (error) {
      toast.error("Failed to submit leave: " + error.message);
    } else {
      toast.success("Leave request submitted for approval!");
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
      hour12: true,
    });
  }

  return (
    <>
      {/* Fast Action Buttons */}
      <div
        className="border rounded-2xl p-5 mb-6 shadow-sm dark:shadow-none transition-all"
        style={{
          background: "var(--surface-container-lowest)",
          borderColor: "var(--outline-variant)",
        }}
      >
        <h3 className="text-body-md font-bold tracking-tight mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          {/* Check In / Out */}
          {!status ? (
            <button
              onClick={handleCheckIn}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-body-sm font-semibold cursor-pointer disabled:opacity-60 transition-all hover:opacity-95 shadow-xs"
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
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-body-sm font-semibold cursor-pointer disabled:opacity-60 transition-all hover:opacity-95 shadow-xs"
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
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-body-sm font-semibold"
              style={{
                background: "var(--surface-container-low)",
                color: "var(--on-surface-variant)",
              }}
            >
              <span className="material-symbols-outlined text-lg text-emerald-500">check_circle</span>
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
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-body-sm font-semibold cursor-pointer transition-all border shadow-xs"
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
              className="w-2.5 h-2.5 rounded-full"
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
              Today: <span className="capitalize font-semibold text-[var(--on-surface)]">{status}</span>
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
          className="border rounded-2xl p-5 mb-6 space-y-4 shadow-sm dark:shadow-none transition-all"
          style={{
            background: "var(--surface-container-lowest)",
            borderColor: "var(--outline-variant)",
          }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-body-md font-bold">Quick Leave Request</h3>
            <button
              type="button"
              onClick={() => setShowLeaveForm(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-[var(--surface-container-high)] transition-colors"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                className="block text-xs font-mono uppercase mb-1 font-semibold"
                style={{ color: "var(--on-surface-variant)" }}
              >
                Leave Type
              </label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as "paid" | "sick" | "unpaid")}
                className="w-full px-3 py-2 rounded-xl text-body-sm border focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                style={{
                  background: "var(--surface-container-low)",
                  borderColor: "var(--outline-variant)",
                  color: "var(--on-surface)",
                }}
              >
                <option value="paid">Paid Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="unpaid">Unpaid Leave</option>
              </select>
            </div>

            <div>
              <label
                className="block text-xs font-mono uppercase mb-1 font-semibold"
                style={{ color: "var(--on-surface-variant)" }}
              >
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={today}
                className="w-full px-3 py-2 rounded-xl text-body-sm border focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                style={{
                  background: "var(--surface-container-low)",
                  borderColor: "var(--outline-variant)",
                  color: "var(--on-surface)",
                }}
              />
            </div>

            <div>
              <label
                className="block text-xs font-mono uppercase mb-1 font-semibold"
                style={{ color: "var(--on-surface-variant)" }}
              >
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || today}
                className="w-full px-3 py-2 rounded-xl text-body-sm border focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                style={{
                  background: "var(--surface-container-low)",
                  borderColor: "var(--outline-variant)",
                  color: "var(--on-surface)",
                }}
              />
            </div>
          </div>

          <div>
            <label
              className="block text-xs font-mono uppercase mb-1 font-semibold"
              style={{ color: "var(--on-surface-variant)" }}
            >
              Reason / Remarks (Optional)
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g., Annual family vacation"
              className="w-full px-3 py-2 rounded-xl text-body-sm border focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              style={{
                background: "var(--surface-container-low)",
                borderColor: "var(--outline-variant)",
                color: "var(--on-surface)",
              }}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowLeaveForm(false)}
              className="px-4 py-2 rounded-xl text-body-sm font-semibold cursor-pointer hover:bg-[var(--surface-container-high)] transition-colors"
              style={{ color: "var(--on-surface-variant)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingLeave}
              className="px-4 py-2 rounded-xl text-body-sm font-semibold cursor-pointer disabled:opacity-60 transition-all hover:opacity-95 shadow-xs"
              style={{
                background: "var(--primary)",
                color: "var(--on-primary)",
              }}
            >
              {submittingLeave ? "Submitting…" : "Submit Request"}
            </button>
          </div>
        </form>
      )}
    </>
  );
}
