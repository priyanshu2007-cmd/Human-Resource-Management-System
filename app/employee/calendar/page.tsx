"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type CellType = "present" | "absent" | "half-day" | "leave" | "holiday" | "none";

interface DayInfo {
  day: number;
  dateStr: string;
  type: CellType;
  holidayName?: string;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function expandRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(start + "T00:00:00");
  const last = new Date(end + "T00:00:00");
  while (cur <= last) {
    dates.push(`${cur.getFullYear()}-${pad(cur.getMonth() + 1)}-${pad(cur.getDate())}`);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

const CELL_STYLES: Record<CellType, string> = {
  present: "bg-success-soft text-success",
  absent: "bg-danger-soft text-danger",
  "half-day": "bg-warning-soft text-warning",
  leave: "bg-secondary text-muted-foreground",
  holiday: "bg-primary text-primary-foreground",
  none: "",
};

const LEGEND: { type: CellType; label: string }[] = [
  { type: "present", label: "Present" },
  { type: "half-day", label: "Half-day" },
  { type: "absent", label: "Absent" },
  { type: "leave", label: "Leave" },
  { type: "holiday", label: "Holiday" },
  { type: "none", label: "No data" },
];

export default function EmployeeCalendarPage() {
  const today = new Date();
  const [cursor, setCursor] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [loading, setLoading] = useState(true);
  const [attendanceByDate, setAttendanceByDate] = useState<Record<string, string>>({});
  const [leaveDates, setLeaveDates] = useState<Set<string>>(new Set());
  const [holidaysByDate, setHolidaysByDate] = useState<Record<string, string>>({});

  const { year, month } = cursor;

  const monthStartStr = toDateStr(year, month, 1);
  const monthEndStr = toDateStr(year, month, daysInMonth(year, month));

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

    const [{ data: attendanceRows }, { data: leaveRows }, { data: holidayRows }] =
      await Promise.all([
        supabase
          .from("attendance")
          .select("date, status")
          .eq("user_id", user.id)
          .gte("date", monthStartStr)
          .lte("date", monthEndStr),
        supabase
          .from("leave_requests")
          .select("start_date, end_date")
          .eq("user_id", user.id)
          .eq("status", "approved")
          .lte("start_date", monthEndStr)
          .gte("end_date", monthStartStr),
        supabase
          .from("holidays")
          .select("date, name")
          .gte("date", monthStartStr)
          .lte("date", monthEndStr),
      ]);

    const attendanceMap: Record<string, string> = {};
    (attendanceRows ?? []).forEach((row) => {
      attendanceMap[row.date] = row.status;
    });
    setAttendanceByDate(attendanceMap);

    const leaveSet = new Set<string>();
    (leaveRows ?? []).forEach((row) => {
      expandRange(row.start_date, row.end_date).forEach((d) => {
        if (d >= monthStartStr && d <= monthEndStr) leaveSet.add(d);
      });
    });
    setLeaveDates(leaveSet);

    const holidayMap: Record<string, string> = {};
    (holidayRows ?? []).forEach((row) => {
      holidayMap[row.date] = row.name;
    });
    setHolidaysByDate(holidayMap);

    setLoading(false);
  }, [monthStartStr, monthEndStr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const days: DayInfo[] = useMemo(() => {
    const total = daysInMonth(year, month);
    const result: DayInfo[] = [];
    for (let day = 1; day <= total; day++) {
      const dateStr = toDateStr(year, month, day);
      let type: CellType = "none";
      let holidayName: string | undefined;

      if (holidaysByDate[dateStr]) {
        type = "holiday";
        holidayName = holidaysByDate[dateStr];
      } else if (attendanceByDate[dateStr]) {
        type = attendanceByDate[dateStr] as CellType;
      } else if (leaveDates.has(dateStr)) {
        type = "leave";
      }

      result.push({ day, dateStr, type, holidayName });
    }
    return result;
  }, [year, month, attendanceByDate, leaveDates, holidaysByDate]);

  const leadingBlanks = new Date(year, month, 1).getDay();
  const trailingBlanks = (7 - ((leadingBlanks + days.length) % 7)) % 7;

  const workedCount = days.filter(
    (d) => d.type === "present" || d.type === "half-day",
  ).length;
  const leaveCount = days.filter((d) => d.type === "leave").length;
  const holidayCount = days.filter((d) => d.type === "holiday").length;

  const summaryStats = [
    { label: "Days Worked", value: workedCount, icon: "check_circle", color: "var(--status-approved)" },
    { label: "Days on Leave", value: leaveCount, icon: "beach_access", color: "var(--secondary)" },
    { label: "Holidays", value: holidayCount, icon: "celebration", color: "var(--primary)" },
  ];

  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  function shiftMonth(delta: number) {
    setCursor((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-headline-lg font-semibold">Calendar</h1>
          <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
            Your attendance, leave, and holidays at a glance
          </p>
        </div>
      </div>

      {/* Calendar card */}
      <div
        className="border rounded-lg overflow-hidden mb-6"
        style={{
          background: "var(--surface-container-lowest)",
          borderColor: "var(--outline-variant)",
        }}
      >
        {/* Month navigation */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "var(--outline-variant)" }}
        >
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="flex items-center justify-center w-8 h-8 rounded-full transition-colors cursor-pointer hover:bg-[var(--surface-container-high)]"
            style={{ color: "var(--on-surface-variant)" }}
            aria-label="Previous month"
          >
            <span className="material-symbols-outlined text-xl">chevron_left</span>
          </button>
          <h2 className="text-title-md font-semibold">
            {monthLabel}
            {isCurrentMonth && (
              <span
                className="ml-2 font-mono text-label-caps uppercase align-middle px-2 py-0.5 rounded-sm"
                style={{ background: "var(--surface-container-high)", color: "var(--on-surface-variant)" }}
              >
                Today
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="flex items-center justify-center w-8 h-8 rounded-full transition-colors cursor-pointer hover:bg-[var(--surface-container-high)]"
            style={{ color: "var(--on-surface-variant)" }}
            aria-label="Next month"
          >
            <span className="material-symbols-outlined text-xl">chevron_right</span>
          </button>
        </div>

        {/* Weekday header */}
        <div className="grid grid-cols-7 px-3 pt-3">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="text-center font-mono text-label-caps uppercase py-1"
              style={{ color: "var(--on-surface-variant)" }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
              Loading…
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1.5 p-3">
            {Array.from({ length: leadingBlanks }).map((_, i) => (
              <div key={`lead-${i}`} />
            ))}
            {days.map((d) => {
              const isToday = isCurrentMonth && d.day === today.getDate();
              return (
                <div
                  key={d.dateStr}
                  title={d.holidayName ?? undefined}
                  className={`aspect-square rounded-md flex items-center justify-center text-body-sm font-semibold border ${
                    d.type !== "none" ? CELL_STYLES[d.type] : ""
                  } ${isToday ? "ring-2 ring-[var(--primary)]" : ""}`}
                  style={
                    d.type === "none"
                      ? {
                          borderColor: "var(--outline-variant)",
                          background: "var(--surface-container-low)",
                          color: "var(--on-surface-variant)",
                          opacity: 0.6,
                        }
                      : { borderColor: "transparent" }
                  }
                >
                  {d.day}
                </div>
              );
            })}
            {Array.from({ length: trailingBlanks }).map((_, i) => (
              <div key={`trail-${i}`} />
            ))}
          </div>
        )}

        {/* Legend */}
        <div
          className="flex flex-wrap gap-x-4 gap-y-2 px-5 py-4 border-t"
          style={{ borderColor: "var(--outline-variant)" }}
        >
          {LEGEND.map((item) => (
            <div key={item.type} className="flex items-center gap-1.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${item.type !== "none" ? CELL_STYLES[item.type] : ""}`}
                style={
                  item.type === "none"
                    ? { background: "var(--surface-container-high)", border: "1px solid var(--outline-variant)" }
                    : undefined
                }
              />
              <span className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary stat row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryStats.map((stat) => (
          <div
            key={stat.label}
            className="border rounded-lg p-4"
            style={{
              background: "var(--surface-container-lowest)",
              borderColor: "var(--outline-variant)",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-xl" style={{ color: stat.color }}>
                {stat.icon}
              </span>
              <span
                className="font-mono text-label-caps uppercase"
                style={{ color: "var(--on-surface-variant)" }}
              >
                {stat.label}
              </span>
            </div>
            <p className="text-headline-lg font-bold">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
