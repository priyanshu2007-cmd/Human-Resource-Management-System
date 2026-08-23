"use client";

import Link from "next/link";

export interface ScheduleEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  type: "holiday" | "approved_leave" | "company_event";
  subtitle?: string;
}

interface Props {
  events?: ScheduleEvent[];
}

const DEFAULT_EVENTS: ScheduleEvent[] = [
  {
    id: "h-1",
    title: "Ganesh Chaturthi",
    date: "2026-09-14",
    type: "holiday",
    subtitle: "Public Holiday · Office Closed",
  },
  {
    id: "h-2",
    title: "Mahatma Gandhi Jayanti",
    date: "2026-10-02",
    type: "holiday",
    subtitle: "National Holiday · Long Weekend",
  },
  {
    id: "h-3",
    title: "Diwali (Deepavali)",
    date: "2026-11-08",
    type: "holiday",
    subtitle: "Major Festive Holiday",
  },
];

export function UpcomingScheduleBento({ events = DEFAULT_EVENTS }: Props) {
  const displayEvents = events && events.length > 0 ? events : DEFAULT_EVENTS;

  function getDaysRemaining(dateStr: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + "T00:00:00");
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays > 1) return `In ${diffDays} days`;
    return "Past";
  }

  function formatDisplayDate(dateStr: string) {
    const d = new Date(dateStr + "T00:00:00");
    return {
      month: d.toLocaleDateString("en-US", { month: "short" }),
      day: d.getDate(),
      weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
    };
  }

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm dark:shadow-none flex flex-col justify-between transition-all h-full">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">event</span>
            </div>
            <div>
              <h3 className="text-title-md font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
                Upcoming Schedule
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Holidays & planned time off
              </p>
            </div>
          </div>

          <Link
            href="/employee/calendar"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            Calendar
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        {/* List of Events */}
        <div className="space-y-3">
          {displayEvents.map((evt) => {
            const dateObj = formatDisplayDate(evt.date);
            const remaining = getDaysRemaining(evt.date);
            const isHoliday = evt.type === "holiday";

            return (
              <div
                key={evt.id}
                className="flex items-center justify-between p-3 rounded-2xl border border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-800/40 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/80 transition-colors"
              >
                {/* Date Badge */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 flex flex-col items-center justify-center shrink-0 shadow-2xs">
                    <span className="text-[10px] font-mono uppercase font-bold text-indigo-600 dark:text-indigo-400 leading-none">
                      {dateObj.month}
                    </span>
                    <span className="text-base font-extrabold font-mono text-neutral-900 dark:text-neutral-50 leading-none mt-0.5">
                      {dateObj.day}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <div className="min-w-0">
                    <p className="text-body-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
                      {evt.title}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                      {evt.subtitle || dateObj.weekday}
                    </p>
                  </div>
                </div>

                {/* Tag / Countdown */}
                <div className="text-right shrink-0">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                      isHoliday
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {remaining}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
        <span>Showing next 3 occurrences</span>
        <span className="font-mono text-[11px]">FY 2026-27</span>
      </div>
    </div>
  );
}
