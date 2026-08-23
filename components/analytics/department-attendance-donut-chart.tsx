"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface DepartmentAttendanceItem {
  department: string;
  rate: number;
}

interface Props {
  data?: DepartmentAttendanceItem[];
  overallRate?: number;
}

const DEFAULT_DATA: DepartmentAttendanceItem[] = [
  { department: "Engineering", rate: 96 },
  { department: "Product & Design", rate: 92 },
  { department: "Human Resources", rate: 98 },
  { department: "Marketing & Sales", rate: 89 },
  { department: "Operations", rate: 95 },
];

const COLORS = [
  "#6366f1", // Electric Indigo
  "#10b981", // Emerald
  "#8b5cf6", // Violet
  "#0ea5e9", // Sky
  "#f59e0b", // Amber
  "#f43f5e", // Rose
];

export default function DepartmentAttendanceDonutChart({ data = DEFAULT_DATA, overallRate = 94 }: Props) {
  const chartData = (data && data.length > 0 ? data : DEFAULT_DATA).map((item, idx) => ({
    name: item.department,
    value: item.rate,
    color: COLORS[idx % COLORS.length],
  }));

  return (
    <div
      className="border rounded-2xl p-5 shadow-sm dark:shadow-none flex flex-col justify-between transition-all h-full"
      style={{
        background: "var(--surface-container-lowest, #ffffff)",
        borderColor: "var(--outline-variant, #e2e8f0)",
      }}
    >
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-title-md font-bold tracking-tight text-slate-900 dark:text-slate-50">Department Attendance</h3>
          <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold tracking-widest">
            Today
          </span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Attendance rates by team
        </p>
      </div>

      <div className="relative h-[220px] w-full my-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              formatter={(value, name) => [`${value}% Present`, name]}
              contentStyle={{
                background: "var(--surface-container-lowest, #ffffff)",
                borderColor: "var(--outline-variant, #e2e8f0)",
                borderRadius: "12px",
                fontSize: "12px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                color: "var(--on-surface, #0f172a)",
              }}
              itemStyle={{ color: "var(--on-surface, #0f172a)" }}
            />
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={90}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Center count */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold font-mono tracking-tight text-slate-900 dark:text-slate-50">{overallRate}%</span>
          <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500">
            Avg Rate
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-1.5 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs max-h-[90px] overflow-y-auto">
        {chartData.map((d) => (
          <div key={d.name} className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2 truncate">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
              <span className="truncate text-slate-600 dark:text-slate-300 font-medium">{d.name}</span>
            </div>
            <span className="font-mono font-bold shrink-0 ml-2 text-slate-900 dark:text-slate-50">{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
