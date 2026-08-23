"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Props {
  userId: string;
  orgId: string;
  initialStatus: string | null;
  initialCheckIn: string | null;
  initialCheckOut: string | null;
  onStatusChange?: (status: string | null, checkIn: string | null, checkOut: string | null) => void;
}

const WORKDAY_HOURS = 8; // 8-hour standard workday

export function TimeTrackerBentoWidget({
  userId,
  orgId,
  initialStatus,
  initialCheckIn,
  initialCheckOut,
  onStatusChange,
}: Props) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(initialStatus);
  const [checkIn, setCheckIn] = useState<string | null>(initialCheckIn);
  const [checkOut, setCheckOut] = useState<string | null>(initialCheckOut);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const today = new Date().toISOString().split("T")[0];

  // 1. Live Digital Clock
  useEffect(() => {
    setCurrentTime(new Date());
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // 2. Calculate and tick elapsed seconds if checked in and not checked out
  const calculateElapsed = useCallback(() => {
    if (checkIn && !checkOut) {
      const start = new Date(checkIn).getTime();
      const now = Date.now();
      const diffInSecs = Math.max(0, Math.floor((now - start) / 1000));
      setElapsedSeconds(diffInSecs);
    } else if (checkIn && checkOut) {
      const start = new Date(checkIn).getTime();
      const end = new Date(checkOut).getTime();
      const diffInSecs = Math.max(0, Math.floor((end - start) / 1000));
      setElapsedSeconds(diffInSecs);
    } else {
      setElapsedSeconds(0);
    }
  }, [checkIn, checkOut]);

  useEffect(() => {
    calculateElapsed();
    if (checkIn && !checkOut) {
      const timer = setInterval(() => {
        calculateElapsed();
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [checkIn, checkOut, calculateElapsed]);

  // Handle Check In
  async function handleCheckIn() {
    if (!userId || !orgId) {
      toast.error("User session missing. Please sign in again.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const nowIso = new Date().toISOString();

    const { error } = await supabase.from("attendance").upsert(
      {
        user_id: userId,
        organization_id: orgId,
        date: today,
        check_in: nowIso,
        status: "present",
      },
      { onConflict: "user_id,date" }
    );

    setLoading(false);
    if (error) {
      toast.error("Failed to check in: " + error.message);
    } else {
      setStatus("present");
      setCheckIn(nowIso);
      setCheckOut(null);
      if (onStatusChange) onStatusChange("present", nowIso, null);
      toast.success("Checked in successfully at " + new Date(nowIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  }

  // Handle Check Out
  async function handleCheckOut() {
    if (!userId) return;
    setLoading(true);
    const supabase = createClient();
    const nowIso = new Date().toISOString();

    const { error } = await supabase
      .from("attendance")
      .update({ check_out: nowIso })
      .eq("user_id", userId)
      .eq("date", today);

    setLoading(false);
    if (error) {
      toast.error("Failed to check out: " + error.message);
    } else {
      setCheckOut(nowIso);
      if (onStatusChange) onStatusChange(status, checkIn, nowIso);
      toast.success("Checked out successfully at " + new Date(nowIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  }

  // Helpers
  const formatTimeStr = (date: Date | null) => {
    if (!date) return "--:--:--";
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const formatShortTime = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDuration = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hours).padStart(2, "0")}h ${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
  };

  // Progress Calculations (8 hour target)
  const targetSecs = WORKDAY_HOURS * 3600;
  const progressPercent = Math.min(100, Math.round((elapsedSeconds / targetSecs) * 100));
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Expected shift end
  const expectedEnd = checkIn
    ? new Date(new Date(checkIn).getTime() + WORKDAY_HOURS * 60 * 60 * 1000).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "—";

  return (
    <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm dark:shadow-none relative overflow-hidden transition-all">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-500/10 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Row: Title & Live Digital Clock */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-neutral-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <h2 className="text-title-md font-bold text-neutral-900 dark:text-slate-50 tracking-tight">
              Live Workday Tracker
            </h2>
          </div>
          <p className="text-xs text-neutral-500 dark:text-slate-400 mt-0.5">
            Standard shift: 8h 00m · Location: Office / Verified Network
          </p>
        </div>

        {/* Live Digital Clock Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-slate-800/80 border border-neutral-200/80 dark:border-slate-700/80 font-mono text-sm font-bold text-neutral-800 dark:text-slate-200">
          <span className="material-symbols-outlined text-base text-indigo-500">schedule</span>
          <span>{formatTimeStr(currentTime)}</span>
        </div>
      </div>

      {/* Main Content: Circular Progress & Big Interactive Action Button */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center py-6">
        {/* Left: SVG Circular Workday Progress (5 cols) */}
        <div className="md:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 130 130">
              {/* Background Track */}
              <circle
                cx="65"
                cy="65"
                r={radius}
                className="stroke-neutral-100 dark:stroke-neutral-800"
                strokeWidth="10"
                fill="none"
              />
              {/* Animated Progress Ring */}
              <circle
                cx="65"
                cy="65"
                r={radius}
                stroke={checkOut ? "#10b981" : checkIn ? "#6366f1" : "#94a3b8"}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-700 ease-out"
              />
            </svg>

            {/* Inner Ring Text */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-extrabold font-mono text-neutral-900 dark:text-slate-50 tracking-tight">
                {progressPercent}%
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                Workday
              </span>
            </div>
          </div>

          <div className="mt-3 text-center">
            <p className="font-mono text-xs font-bold text-neutral-700 dark:text-slate-300">
              {formatDuration(elapsedSeconds)}
            </p>
            <p className="text-[11px] text-neutral-400">Target: 08h 00m</p>
          </div>
        </div>

        {/* Right: Massive Glow Button & Quick Stats (7 cols) */}
        <div className="md:col-span-7 flex flex-col justify-center space-y-5">
          {/* Glowing Action Button State */}
          {!checkIn ? (
            <button
              type="button"
              onClick={handleCheckIn}
              disabled={loading}
              className="relative group w-full py-4 px-6 rounded-2xl font-bold text-base text-white shadow-lg transition-all duration-300 transform active:scale-98 cursor-pointer disabled:opacity-70 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 hover:shadow-indigo-500/25 hover:shadow-xl"
            >
              <div className="flex items-center justify-center gap-3">
                <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs">
                  <span className="material-symbols-outlined text-2xl">fingerprint</span>
                </div>
                <div className="text-left">
                  <div className="text-lg leading-tight">
                    {loading ? "Recording Check-In…" : "Punch In For Today"}
                  </div>
                  <div className="text-xs text-indigo-100 font-normal">
                    Click to register official arrival time
                  </div>
                </div>
              </div>
            </button>
          ) : !checkOut ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleCheckOut}
                disabled={loading}
                className="relative group w-full py-4 px-6 rounded-2xl font-bold text-base text-white shadow-lg transition-all duration-300 transform active:scale-98 cursor-pointer disabled:opacity-70 bg-gradient-to-r from-rose-500 to-amber-600 hover:from-rose-600 hover:to-amber-700 hover:shadow-rose-500/25 hover:shadow-xl"
              >
                <div className="flex items-center justify-center gap-3">
                  <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs">
                    <span className="material-symbols-outlined text-2xl">logout</span>
                  </div>
                  <div className="text-left">
                    <div className="text-lg leading-tight">
                      {loading ? "Recording Check-Out…" : "Punch Out (End Shift)"}
                    </div>
                    <div className="text-xs text-rose-100 font-normal">
                      Elapsed: <span className="font-mono font-semibold">{formatDuration(elapsedSeconds)}</span>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-2xl">task_alt</span>
              </div>
              <div>
                <p className="text-body-sm font-bold text-emerald-900 dark:text-emerald-300">
                  Shift Completed Successfully
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                  Total logged today: <strong className="font-mono">{formatDuration(elapsedSeconds)}</strong>. Have a great evening!
                </p>
              </div>
            </div>
          )}

          {/* Sub-Metrics Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-slate-800/60 border border-neutral-200/70 dark:border-slate-800 text-left">
              <span className="text-[10px] font-mono uppercase text-neutral-400 font-semibold block">
                Punch In
              </span>
              <span className="text-sm font-mono font-bold text-neutral-800 dark:text-slate-200 mt-0.5 block">
                {formatShortTime(checkIn)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-slate-800/60 border border-neutral-200/70 dark:border-slate-800 text-left">
              <span className="text-[10px] font-mono uppercase text-neutral-400 font-semibold block">
                Target Out
              </span>
              <span className="text-sm font-mono font-bold text-neutral-800 dark:text-slate-200 mt-0.5 block">
                {expectedEnd}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-slate-800/60 border border-neutral-200/70 dark:border-slate-800 text-left">
              <span className="text-[10px] font-mono uppercase text-neutral-400 font-semibold block">
                Status
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {status ? status.toUpperCase() : "NOT IN"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
