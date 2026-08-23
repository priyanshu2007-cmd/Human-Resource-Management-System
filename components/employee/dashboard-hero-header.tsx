"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Props {
  userName: string;
  jobTitle?: string | null;
  department?: string | null;
  onOpenLeaveModal?: () => void;
}

const TICKER_ANNOUNCEMENTS = [
  { icon: "✨", text: "Dayflow HRMS: Every workday, perfectly aligned." },
  { icon: "🚀", text: "Q3 Workforce Innovation Sprint is now in progress." },
  { icon: "🌴", text: "Planning time off? Check holiday calendar for long weekends." },
  { icon: "📄", text: "August salary slips and tax breakdown are now available in Payroll." },
];

export function DashboardHeroHeader({
  userName,
  jobTitle,
  department,
  onOpenLeaveModal,
}: Props) {
  const router = useRouter();
  const [greeting, setGreeting] = useState("Welcome");
  const [currentDateStr, setCurrentDateStr] = useState("");
  const [tickerIndex, setTickerIndex] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    const now = new Date();
    setCurrentDateStr(
      now.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    );

    // Rotate ticker every 7 seconds
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % TICKER_ANNOUNCEMENTS.length);
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  const firstName = userName ? userName.split(" ")[0] : "there";
  const ticker = TICKER_ANNOUNCEMENTS[tickerIndex];

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Dynamic Greeting */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-headline-lg font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50">
              {greeting}, {firstName}! 👋
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-body-sm text-neutral-500 dark:text-neutral-400">
            <span>{jobTitle || "Team Member"}</span>
            {department && (
              <>
                <span className="opacity-40">•</span>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  {department}
                </span>
              </>
            )}
            <span className="opacity-40">•</span>
            <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-neutral-200/60 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
              <span className="material-symbols-outlined text-xs">calendar_today</span>
              {currentDateStr || "Today"}
            </span>
          </div>
        </div>

        {/* Right: Quick Action Floating Dropdown */}
        <div className="relative inline-block text-left shrink-0">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-body-sm font-semibold bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-400 dark:hover:bg-indigo-500 text-white dark:text-neutral-950 shadow-sm transition-all hover:shadow-md cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">bolt</span>
            <span>Quick Actions</span>
            <span className="material-symbols-outlined text-sm">
              {dropdownOpen ? "expand_less" : "expand_more"}
            </span>
          </button>

          {dropdownOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-30"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 z-40 w-56 p-1.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    if (onOpenLeaveModal) onOpenLeaveModal();
                    else router.push("/employee/leave");
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-body-sm font-medium rounded-xl text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg text-emerald-500">
                    event_busy
                  </span>
                  Apply for Leave
                </button>

                <Link
                  href="/employee/payroll"
                  onClick={() => setDropdownOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-body-sm font-medium rounded-xl text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg text-indigo-500">
                    receipt_long
                  </span>
                  Download Payslip
                </Link>

                <Link
                  href="/employee/attendance"
                  onClick={() => setDropdownOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-body-sm font-medium rounded-xl text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg text-amber-500">
                    history
                  </span>
                  Attendance Timesheet
                </Link>

                <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />

                <Link
                  href="/employee/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-body-sm font-medium rounded-xl text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg text-neutral-400">
                    badge
                  </span>
                  My Profile & Documents
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Motivational Ticker / Announcement Ribbon */}
      <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 text-xs text-neutral-600 dark:text-neutral-400 shadow-2xs">
        <span className="flex h-2 w-2 relative shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
        </span>
        <span className="font-semibold text-neutral-900 dark:text-neutral-200 uppercase tracking-wider text-[10px] font-mono">
          Notice
        </span>
        <span className="text-neutral-300 dark:text-neutral-700">|</span>
        <span className="truncate transition-all duration-300">
          {ticker.icon} {ticker.text}
        </span>
      </div>
    </div>
  );
}
