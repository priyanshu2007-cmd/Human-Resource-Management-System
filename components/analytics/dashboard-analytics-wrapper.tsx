"use client";

import { lazy, Suspense } from "react";
import { ChartSkeleton } from "@/components/shared/skeleton";

const PayrollTrendChart = lazy(() => import("./payroll-trend-chart"));
const AttendanceDonutChart = lazy(() => import("./attendance-donut-chart"));
const DepartmentDonutChart = lazy(() => import("./department-donut-chart"));

interface Props {
  attendanceData?: {
    present: number;
    absent: number;
    halfDay: number;
    leave: number;
  };
  departmentData?: Array<{
    department: string;
    count: number;
  }>;
}

export function DashboardAnalyticsWrapper({
  attendanceData,
  departmentData,
}: Props) {
  return (
    <div className="space-y-6 mb-8">
      {/* 2-column Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Payroll Area Chart (2 cols) */}
        <div className="lg:col-span-2">
          <Suspense fallback={<ChartSkeleton height={260} />}>
            <PayrollTrendChart />
          </Suspense>
        </div>

        {/* Live Attendance Donut (1 col) */}
        <div>
          <Suspense fallback={<ChartSkeleton height={200} />}>
            <AttendanceDonutChart data={attendanceData} />
          </Suspense>
        </div>
      </div>

      {/* Department Breakdown Bar / Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Suspense fallback={<ChartSkeleton height={200} />}>
            <DepartmentDonutChart data={departmentData} />
          </Suspense>
        </div>
        <div className="lg:col-span-2 border rounded-2xl p-5 flex flex-col justify-between"
             style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-title-md font-bold tracking-tight">Key Operational Insights</h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                Optimal
              </span>
            </div>
            <p className="text-body-sm mb-4" style={{ color: "var(--on-surface-variant)" }}>
              AI-driven workforce health and resource utilization summary
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)]">
              <div className="flex items-center gap-2 mb-1 text-xs font-semibold text-[var(--on-surface-variant)] uppercase font-mono">
                <span className="material-symbols-outlined text-base text-emerald-500">task_alt</span>
                Punctuality Rate
              </div>
              <p className="text-2xl font-bold font-mono">94.2%</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">↑ 2.4% vs last week</p>
            </div>

            <div className="p-3.5 rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)]">
              <div className="flex items-center gap-2 mb-1 text-xs font-semibold text-[var(--on-surface-variant)] uppercase font-mono">
                <span className="material-symbols-outlined text-base text-indigo-500">avg_time</span>
                Avg Working Hours
              </div>
              <p className="text-2xl font-bold font-mono">8.4 hrs</p>
              <p className="text-xs text-[var(--on-surface-variant)] mt-0.5">Aligned with 40h workweek</p>
            </div>

            <div className="p-3.5 rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)]">
              <div className="flex items-center gap-2 mb-1 text-xs font-semibold text-[var(--on-surface-variant)] uppercase font-mono">
                <span className="material-symbols-outlined text-base text-amber-500">calendar_month</span>
                Leave Utilization
              </div>
              <p className="text-2xl font-bold font-mono">14.8%</p>
              <p className="text-xs text-[var(--on-surface-variant)] mt-0.5">Within annual quota</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
