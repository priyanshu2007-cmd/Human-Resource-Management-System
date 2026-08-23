"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  orgId: string;
  onSuccess?: () => void;
}

export function QuickLeaveModal({
  isOpen,
  onClose,
  userId,
  orgId,
  onSuccess,
}: Props) {
  const router = useRouter();
  const [leaveType, setLeaveType] = useState<"paid" | "sick" | "unpaid">("paid");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startDate || !endDate) {
      toast.error("Please pick both start and end dates.");
      return;
    }
    if (endDate < startDate) {
      toast.error("End date must be on or after start date.");
      return;
    }

    setLoading(true);
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

    setLoading(false);
    if (error) {
      toast.error("Failed to submit request: " + error.message);
    } else {
      toast.success("Leave request submitted for manager approval!");
      setStartDate("");
      setEndDate("");
      setRemarks("");
      onClose();
      if (onSuccess) onSuccess();
      router.refresh();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-slate-800 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">event_busy</span>
            </div>
            <div>
              <h3 className="text-title-md font-bold text-neutral-900 dark:text-slate-50 tracking-tight">
                Apply for Leave
              </h3>
              <p className="text-xs text-neutral-500 dark:text-slate-400">
                Submit request to HR & Team Lead
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-slate-200 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase font-bold text-neutral-500 dark:text-slate-400 mb-1.5">
              Leave Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: "paid", label: "Paid Leave", icon: "beach_access" },
                { type: "sick", label: "Sick Leave", icon: "local_hospital" },
                { type: "unpaid", label: "Unpaid / Opt", icon: "event_repeat" },
              ].map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setLeaveType(opt.type as any)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                    leaveType === opt.type
                      ? "bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500"
                      : "bg-neutral-50 dark:bg-slate-800/60 border-neutral-200 dark:border-slate-800 text-neutral-600 dark:text-slate-400 hover:border-neutral-300"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg mb-1">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase font-bold text-neutral-500 dark:text-slate-400 mb-1.5">
                From Date *
              </label>
              <input
                type="date"
                required
                value={startDate}
                min={today}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-body-sm bg-neutral-50 dark:bg-slate-800/80 border border-neutral-200 dark:border-slate-700 text-neutral-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase font-bold text-neutral-500 dark:text-slate-400 mb-1.5">
                To Date *
              </label>
              <input
                type="date"
                required
                value={endDate}
                min={startDate || today}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-body-sm bg-neutral-50 dark:bg-slate-800/80 border border-neutral-200 dark:border-slate-700 text-neutral-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase font-bold text-neutral-500 dark:text-slate-400 mb-1.5">
              Reason / Justification (Optional)
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g., Attending family wedding, medical checkup..."
              className="w-full px-3.5 py-2.5 rounded-xl text-body-sm bg-neutral-50 dark:bg-slate-800/80 border border-neutral-200 dark:border-slate-700 text-neutral-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-body-sm font-semibold text-neutral-600 dark:text-slate-400 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-body-sm font-bold bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-400 dark:hover:bg-indigo-500 text-white dark:text-slate-950 shadow-sm transition-all hover:shadow-md cursor-pointer disabled:opacity-60"
            >
              {loading ? "Submitting…" : "Confirm Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
