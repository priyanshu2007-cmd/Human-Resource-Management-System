"use client";

import { lazy, Suspense } from "react";
import { ChartSkeleton } from "@/components/shared/skeleton";

const PayrollTrendChart = lazy(() => import("./payroll-trend-chart"));
const DepartmentAttendanceDonutChart = lazy(() => import("./department-attendance-donut-chart"));

interface Props {
  departmentAttendanceData?: Array<{
    department: string;
    rate: number;
  }>;
  overallAttendanceRate?: number;
}

export function DashboardAnalyticsWrapper({
  departmentAttendanceData,
  overallAttendanceRate,
}: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Payroll Area Chart (2 cols) */}
      <div className="lg:col-span-2">
        <Suspense fallback={<ChartSkeleton height={370} />}>
          <PayrollTrendChart />
        </Suspense>
      </div>

      {/* Department Attendance Donut (1 col) */}
      <div className="lg:col-span-1 h-full">
        <Suspense fallback={<ChartSkeleton height={370} />}>
          <DepartmentAttendanceDonutChart 
            data={departmentAttendanceData} 
            overallRate={overallAttendanceRate} 
          />
        </Suspense>
      </div>
    </div>
  );
}
