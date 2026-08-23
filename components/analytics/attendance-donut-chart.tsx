"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface AttendanceData {
  present: number;
  absent: number;
  halfDay: number;
  leave: number;
}

interface Props {
  data?: AttendanceData;
}

const DEFAULT_ATTENDANCE: AttendanceData = {
  present: 16,
  absent: 2,
  halfDay: 1,
  leave: 1,
};

export default function AttendanceDonutChart({ data = DEFAULT_ATTENDANCE }: Props) {
  const chartData = [
    { name: "Present", value: data.present, color: "#10b981" },     // Emerald
    { name: "Absent", value: data.absent, color: "#f43f5e" },       // Rose
    { name: "Half-Day", value: data.halfDay, color: "#f59e0b" },    // Amber
    { name: "On Leave", value: data.leave, color: "#3b82f6" },      // Blue
  ].filter((item) => item.value > 0);

  const total = data.present + data.absent + data.halfDay + data.leave;
  const attendanceRate = total > 0 ? Math.round((data.present / total) * 100) : 0;

  return (
    <div
      className="border rounded-2xl p-5 flex flex-col justify-between"
      style={{
        background: "var(--surface-container-lowest)",
        borderColor: "var(--outline-variant)",
      }}
    >
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-title-md font-bold tracking-tight">Today&apos;s Attendance</h3>
          <span className="font-mono text-label-caps uppercase px-2 py-0.5 rounded bg-[var(--surface-container-high)] text-[var(--on-surface-variant)] text-xs">
            Live
          </span>
        </div>
        <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
          Presence and leave distribution
        </p>
      </div>

      <div className="relative h-[200px] w-full my-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              formatter={(value, name) => [`${value} Employees`, name]}
              contentStyle={{
                background: "var(--surface-container-lowest, #ffffff)",
                borderColor: "var(--outline-variant, #e2e8f0)",
                borderRadius: "8px",
                fontSize: "12px",
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
        {/* Center rate */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold font-mono tracking-tight">{attendanceRate}%</span>
          <span className="text-[10px] uppercase font-mono tracking-widest text-[var(--on-surface-variant)]">
            Present
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[var(--outline-variant)] text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-[var(--on-surface-variant)]">Present:</span>
          <span className="font-mono font-bold ml-auto">{data.present}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
          <span className="text-[var(--on-surface-variant)]">Absent:</span>
          <span className="font-mono font-bold ml-auto">{data.absent}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
          <span className="text-[var(--on-surface-variant)]">Half-Day:</span>
          <span className="font-mono font-bold ml-auto">{data.halfDay}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
          <span className="text-[var(--on-surface-variant)]">On Leave:</span>
          <span className="font-mono font-bold ml-auto">{data.leave}</span>
        </div>
      </div>
    </div>
  );
}
