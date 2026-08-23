"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface DepartmentItem {
  department: string;
  count: number;
}

interface Props {
  data?: DepartmentItem[];
}

const DEFAULT_DEPTS: DepartmentItem[] = [
  { department: "Engineering", count: 8 },
  { department: "Product & Design", count: 4 },
  { department: "Human Resources", count: 3 },
  { department: "Marketing & Sales", count: 3 },
  { department: "Operations", count: 2 },
];

const COLORS = [
  "#6366f1", // Electric Indigo
  "#10b981", // Emerald
  "#8b5cf6", // Violet
  "#0ea5e9", // Sky
  "#f59e0b", // Amber
  "#f43f5e", // Rose
];

export default function DepartmentDonutChart({ data = DEFAULT_DEPTS }: Props) {
  const chartData = (data.length > 0 ? data : DEFAULT_DEPTS).map((item, idx) => ({
    name: item.department,
    value: item.count,
    color: COLORS[idx % COLORS.length],
  }));

  const total = chartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div
      className="border rounded-2xl p-5 shadow-sm dark:shadow-none flex flex-col justify-between transition-all"
      style={{
        background: "var(--surface-container-lowest)",
        borderColor: "var(--outline-variant)",
      }}
    >
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-title-md font-bold tracking-tight">Department Mix</h3>
          <span className="font-mono text-label-caps uppercase px-2 py-0.5 rounded-full bg-[var(--surface-container-high)] text-[var(--on-surface-variant)] text-xs font-semibold">
            {chartData.length} Teams
          </span>
        </div>
        <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
          Headcount allocation by team
        </p>
      </div>

      <div className="relative h-[200px] w-full my-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              formatter={(value, name) => [`${value} Members`, name]}
              contentStyle={{
                background: "var(--surface-container-lowest, #ffffff)",
                borderColor: "var(--outline-variant, #e2e8f0)",
                borderRadius: "12px",
                fontSize: "12px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={80}
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
          <span className="text-2xl font-bold font-mono tracking-tight">{total}</span>
          <span className="text-[10px] uppercase font-mono tracking-widest text-[var(--on-surface-variant)]">
            Staff
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-1.5 pt-3 border-t border-[var(--outline-variant)] text-xs max-h-[100px] overflow-y-auto">
        {chartData.map((d) => (
          <div key={d.name} className="flex items-center justify-between py-0.5">
            <div className="flex items-center gap-2 truncate">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
              <span className="truncate text-[var(--on-surface-variant)]">{d.name}</span>
            </div>
            <span className="font-mono font-bold shrink-0 ml-2">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
