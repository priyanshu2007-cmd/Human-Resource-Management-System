"use client";

import { useState } from "react";
import Link from "next/link";
import { DashboardHeroHeader } from "@/components/employee/dashboard-hero-header";
import { TimeTrackerBentoWidget } from "@/components/employee/time-tracker-bento-widget";
import { LeaveBalanceBento } from "@/components/employee/leave-balance-bento";
import { UpcomingScheduleBento, ScheduleEvent } from "@/components/employee/upcoming-schedule-bento";
import { RecentActivityTimelineBento, ActivityItem } from "@/components/employee/recent-activity-timeline-bento";
import { QuickLeaveModal } from "@/components/employee/quick-leave-modal";

interface InitialData {
  user: {
    id: string;
    email?: string;
  };
  profile: {
    id: string;
    full_name: string;
    employee_id: string;
    job_title: string | null;
    department: string | null;
    organization_id: string;
  } | null;
  todayAttendance: {
    status: string;
    check_in: string | null;
    check_out: string | null;
  } | null;
  leaveSummary: {
    paidTaken: number;
    sickTaken: number;
    unpaidTaken: number;
  };
  upcomingSchedule: ScheduleEvent[];
  recentActivities: ActivityItem[];
}

interface Props {
  initialData: InitialData;
}

export function EmployeeDashboardBento({ initialData }: Props) {
  const { user, profile, todayAttendance, leaveSummary, upcomingSchedule, recentActivities } = initialData;

  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [attendance, setAttendance] = useState(todayAttendance);
  const [leaveCounts, setLeaveCounts] = useState(leaveSummary);

  const handleStatusChange = (
    newStatus: string | null,
    newCheckIn: string | null,
    newCheckOut: string | null
  ) => {
    setAttendance({
      status: newStatus || "not_checked_in",
      check_in: newCheckIn,
      check_out: newCheckOut,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Hero Greeting & Context Header */}
      <DashboardHeroHeader
        userName={profile?.full_name || "Colleague"}
        jobTitle={profile?.job_title}
        department={profile?.department}
        onOpenLeaveModal={() => setLeaveModalOpen(true)}
      />

      {/* 2. Bento Grid: Time Tracking Hero & Key Workspace Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Large Time Tracker Focal Point Widget (8 cols) */}
        <div className="lg:col-span-8">
          <TimeTrackerBentoWidget
            userId={user.id}
            orgId={profile?.organization_id || ""}
            initialStatus={attendance?.status ?? null}
            initialCheckIn={attendance?.check_in ?? null}
            initialCheckOut={attendance?.check_out ?? null}
            onStatusChange={handleStatusChange}
          />
        </div>

        {/* Fast Workspace Nav & Quick Links (4 cols) */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-4">
          {/* Quick Access Card 1: My Profile */}
          <Link
            href="/employee/profile"
            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm dark:shadow-none hover:border-indigo-500/50 hover:shadow-md transition-all group relative overflow-hidden flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-2xl">badge</span>
              </div>
              <div>
                <p className="text-xs font-mono uppercase font-bold text-indigo-600 dark:text-indigo-400">
                  Profile & ID: {profile?.employee_id || "EMP"}
                </p>
                <h3 className="text-body-md font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  My Employee Card
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Banking, emergency & documents
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-slate-300 dark:text-slate-700 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all">
              chevron_right
            </span>
          </Link>

          {/* Quick Access Card 2: Payroll & Compensation */}
          <Link
            href="/employee/payroll"
            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm dark:shadow-none hover:border-emerald-500/50 hover:shadow-md transition-all group relative overflow-hidden flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-2xl">payments</span>
              </div>
              <div>
                <p className="text-xs font-mono uppercase font-bold text-emerald-600 dark:text-emerald-400">
                  Compensation & Slip
                </p>
                <h3 className="text-body-md font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Monthly Payslips
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  In-hand pay & tax breakdowns
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-slate-300 dark:text-slate-700 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all">
              chevron_right
            </span>
          </Link>

          {/* Quick Access Card 3: Attendance History */}
          <Link
            href="/employee/attendance"
            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm dark:shadow-none hover:border-amber-500/50 hover:shadow-md transition-all group relative overflow-hidden flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-2xl">history_toggle_off</span>
              </div>
              <div>
                <p className="text-xs font-mono uppercase font-bold text-amber-600 dark:text-amber-400">
                  Timesheet & Logs
                </p>
                <h3 className="text-body-md font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Attendance History
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Monthly presence & shift hours
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-slate-300 dark:text-slate-700 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all">
              chevron_right
            </span>
          </Link>
        </div>
      </div>

      {/* 3. Quick-Glance Balance Cards (Row of 3 Leave Mini-Cards) */}
      <LeaveBalanceBento
        paidTaken={leaveCounts.paidTaken}
        sickTaken={leaveCounts.sickTaken}
        unpaidTaken={leaveCounts.unpaidTaken}
        onApplyLeave={() => setLeaveModalOpen(true)}
      />

      {/* 4. Interactive Activity & Schedule Feeds (Two Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Upcoming Schedule & Holidays */}
        <UpcomingScheduleBento events={upcomingSchedule} />

        {/* Right Column: Recent Notifications & Activity Timeline */}
        <RecentActivityTimelineBento activities={recentActivities} />
      </div>

      {/* 5. Quick In-Dashboard Leave Application Modal */}
      <QuickLeaveModal
        isOpen={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        userId={user.id}
        orgId={profile?.organization_id || ""}
        onSuccess={() => {
          setLeaveCounts((prev) => ({
            ...prev,
            paidTaken: prev.paidTaken + 1,
          }));
        }}
      />
    </div>
  );
}
