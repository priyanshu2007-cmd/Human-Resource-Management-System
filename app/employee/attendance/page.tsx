"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export default function EmployeeAttendance() {
  const [todayRecord, setTodayRecord] = useState<{
    status: string;
    check_in: string | null;
    check_out: string | null;
  } | null>(null);
  const [weekRecords, setWeekRecords] = useState<
    Array<{
      date: string;
      status: string;
      check_in: string | null;
      check_out: string | null;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Today's record
    const { data: todayData } = await supabase
      .from("attendance")
      .select("status, check_in, check_out")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle();

    setTodayRecord(todayData);

    // Last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    const { data: weekData } = await supabase
      .from("attendance")
      .select("date, status, check_in, check_out")
      .eq("user_id", user.id)
      .gte("date", weekAgo.toISOString().split("T")[0])
      .lte("date", today)
      .order("date", { ascending: false });

    setWeekRecords(weekData || []);
    setLoading(false);
  }, [today]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleCheckIn() {
    setActionLoading(true);
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

    const now = new Date().toISOString();

    await supabase.from("attendance").insert({
      user_id: user.id,
      organization_id: profile.organization_id,
      date: today,
      check_in: now,
      status: "present",
    });

    await fetchData();
    setActionLoading(false);
  }

  async function handleCheckOut() {
    setActionLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const now = new Date().toISOString();

    await supabase
      .from("attendance")
      .update({ check_out: now })
      .eq("user_id", user.id)
      .eq("date", today);

    await fetchData();
    setActionLoading(false);
  }

  function formatTime(iso: string | null): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  }

  const statusColors: Record<string, string> = {
    present: "var(--status-approved)",
    absent: "var(--status-rejected)",
    "half-day": "var(--status-pending)",
    leave: "var(--outline)",
  };

  const statusBg: Record<string, string> = {
    present: "rgba(34,197,94,0.1)",
    absent: "rgba(239,68,68,0.1)",
    "half-day": "rgba(234,179,8,0.1)",
    leave: "rgba(123,116,135,0.1)",
  };

  const isCheckedIn = todayRecord?.check_in && !todayRecord?.check_out;
  const isCheckedOut = todayRecord?.check_in && todayRecord?.check_out;

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-headline-lg font-semibold">Attendance</h1>
        <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
          {todayFormatted}
        </p>
      </div>

      {/* Check-in/out card */}
      <div
        className="border rounded-lg p-6 mb-6"
        style={{
          background: "var(--surface-container-lowest)",
          borderColor: "var(--outline-variant)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-title-md font-semibold">Today</p>
            {todayRecord ? (
              <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
                In: {formatTime(todayRecord.check_in)}{" "}
                {todayRecord.check_out && `· Out: ${formatTime(todayRecord.check_out)}`}
              </p>
            ) : (
              <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
                Not checked in yet
              </p>
            )}
          </div>
          {todayRecord && (
            <span
              className="font-mono text-label-caps uppercase px-2 py-0.5 rounded-sm"
              style={{
                color: statusColors[todayRecord.status],
                background: statusBg[todayRecord.status],
              }}
            >
              {todayRecord.status}
            </span>
          )}
        </div>

        {!todayRecord && (
          <button
            type="button"
            onClick={handleCheckIn}
            disabled={loading || actionLoading}
            className="flex items-center gap-2 px-5 py-3 rounded text-body-md font-semibold transition-colors cursor-pointer disabled:opacity-60"
            style={{
              background: "var(--status-approved)",
              color: "#ffffff",
            }}
          >
            <span className="material-symbols-outlined">login</span>
            {actionLoading ? "Checking in…" : "Check In"}
          </button>
        )}

        {isCheckedIn && (
          <button
            type="button"
            onClick={handleCheckOut}
            disabled={actionLoading}
            className="flex items-center gap-2 px-5 py-3 rounded text-body-md font-semibold transition-colors cursor-pointer disabled:opacity-60"
            style={{
              background: "var(--status-rejected)",
              color: "#ffffff",
            }}
          >
            <span className="material-symbols-outlined">logout</span>
            {actionLoading ? "Checking out…" : "Check Out"}
          </button>
        )}

        {isCheckedOut && (
          <div className="flex items-center gap-2 text-body-sm" style={{ color: "var(--status-approved)" }}>
            <span className="material-symbols-outlined text-lg">check_circle</span>
            You&apos;re done for today
          </div>
        )}
      </div>

      {/* Weekly view */}
      <div
        className="border rounded-lg overflow-hidden"
        style={{
          background: "var(--surface-container-lowest)",
          borderColor: "var(--outline-variant)",
        }}
      >
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--outline-variant)" }}>
          <h2 className="text-title-md font-semibold">This week</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
              Loading…
            </p>
          </div>
        ) : weekRecords.length > 0 ? (
          <div className="divide-y" style={{ borderColor: "var(--outline-variant)" }}>
            {weekRecords.map((record) => (
              <div
                key={record.date}
                className="flex items-center justify-between px-5 py-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: statusColors[record.status] }}
                  />
                  <p className="text-body-sm font-medium">
                    {formatDate(record.date)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className="text-body-sm"
                    style={{ color: "var(--on-surface-variant)" }}
                  >
                    {formatTime(record.check_in)} — {formatTime(record.check_out)}
                  </span>
                  <span
                    className="font-mono text-label-caps uppercase px-2 py-0.5 rounded-sm min-w-[70px] text-center"
                    style={{
                      color: statusColors[record.status],
                      background: statusBg[record.status],
                    }}
                  >
                    {record.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <span
              className="material-symbols-outlined text-4xl mb-2 block"
              style={{ color: "var(--outline-variant)" }}
            >
              event_available
            </span>
            <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
              No attendance records this week.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
