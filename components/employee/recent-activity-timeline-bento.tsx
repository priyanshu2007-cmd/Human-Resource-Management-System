"use client";

import { useState } from "react";
import Link from "next/link";

export interface ActivityItem {
  id: string;
  category: "leave" | "payroll" | "policy" | "attendance";
  title: string;
  description: string;
  timeAgo: string;
  icon: string;
  color: string;
  href?: string;
}

interface Props {
  activities?: ActivityItem[];
}

const DEFAULT_ACTIVITIES: ActivityItem[] = [
  {
    id: "act-1",
    category: "leave",
    title: "Casual Leave Approved",
    description: "Your 2-day leave request for Sep 18–19 was approved by HR Admin.",
    timeAgo: "2 hours ago",
    icon: "verified",
    color: "#10b981", // Emerald
    href: "/employee/leave",
  },
  {
    id: "act-2",
    category: "payroll",
    title: "August Salary Slip Generated",
    description: "Net disbursement of ₹68,000 processed to HDFC Bank A/C.",
    timeAgo: "1 day ago",
    icon: "payments",
    color: "#6366f1", // Indigo
    href: "/employee/payroll",
  },
  {
    id: "act-3",
    category: "attendance",
    title: "On-Time Check-In Verified",
    description: "Punch recorded at 09:14 AM via Office WiFi (8h shift target).",
    timeAgo: "Today, 09:14 AM",
    icon: "timer",
    color: "#10b981", // Emerald
    href: "/employee/attendance",
  },
  {
    id: "act-4",
    category: "policy",
    title: "Policy Update: Hybrid Work 2026",
    description: "Updated remote work guidelines and equipment allowance rules.",
    timeAgo: "3 days ago",
    icon: "description",
    color: "#0ea5e9", // Sky
    href: "/employee/profile",
  },
];

export function RecentActivityTimelineBento({ activities = DEFAULT_ACTIVITIES }: Props) {
  const [filter, setFilter] = useState<string>("all");

  const items = activities && activities.length > 0 ? activities : DEFAULT_ACTIVITIES;
  const filtered = filter === "all" ? items : items.filter((i) => i.category === filter);

  return (
    <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-none flex flex-col justify-between transition-all h-full">
      <div>
        {/* Card Header & Filter Chips */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">notifications_active</span>
            </div>
            <div>
              <h3 className="text-title-md font-bold text-neutral-900 dark:text-slate-50 tracking-tight">
                Activity & Updates
              </h3>
              <p className="text-xs text-neutral-500 dark:text-slate-400">
                Timeline of recent organizational events
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-slate-800/80 rounded-xl border border-neutral-200/60 dark:border-slate-700/60 text-xs">
            {["all", "leave", "payroll"].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-lg font-semibold capitalize transition-colors cursor-pointer ${
                  filter === f
                    ? "bg-white dark:bg-slate-900 text-neutral-900 dark:text-slate-100 shadow-2xs"
                    : "text-neutral-500 dark:text-slate-400 hover:text-neutral-800 dark:hover:text-slate-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Items */}
        <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200 dark:before:bg-neutral-800">
          {filtered.map((item) => (
            <div key={item.id} className="relative group">
              {/* Timeline Bullet */}
              <div
                className="absolute -left-5 top-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center"
                style={{ background: item.color }}
              />

              <div className="p-3.5 rounded-2xl bg-neutral-50/50 dark:bg-slate-800/40 border border-neutral-100 dark:border-slate-800/80 hover:bg-neutral-100/70 dark:hover:bg-slate-800/80 transition-colors">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="material-symbols-outlined text-base shrink-0"
                      style={{ color: item.color }}
                    >
                      {item.icon}
                    </span>
                    <h4 className="text-body-sm font-bold text-neutral-900 dark:text-slate-100 truncate">
                      {item.title}
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400 shrink-0">
                    {item.timeAgo}
                  </span>
                </div>

                <p className="text-xs text-neutral-500 dark:text-slate-400 pl-6 leading-relaxed">
                  {item.description}
                </p>

                {item.href && (
                  <div className="pl-6 mt-2">
                    <Link
                      href={item.href}
                      className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5"
                    >
                      View details <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer link */}
      <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-slate-800 flex items-center justify-between text-xs text-neutral-400">
        <span>Real-time system events</span>
        <span className="text-emerald-500 font-semibold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Live Sync
        </span>
      </div>
    </div>
  );
}
