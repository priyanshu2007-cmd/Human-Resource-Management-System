"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PayrollPoint {
  month: string;
  amount: number;
  employees: number;
}

interface Props {
  data?: PayrollPoint[];
}

const DEFAULT_DATA: PayrollPoint[] = [
  { month: "Mar", amount: 48500, employees: 14 },
  { month: "Apr", amount: 52000, employees: 15 },
  { month: "May", amount: 54200, employees: 16 },
  { month: "Jun", amount: 59000, employees: 18 },
  { month: "Jul", amount: 62500, employees: 19 },
  { month: "Aug", amount: 68000, employees: 20 },
];

function formatCurrency(val: number): string {
  return `₹${(val / 1000).toFixed(1)}k`;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: PayrollPoint }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-xl p-3 shadow-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 text-xs">
        <p className="font-semibold text-sm mb-1">{label}</p>
        <p className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
          <span className="font-medium text-slate-700 dark:text-slate-300">Total Spend:</span>
          <span className="font-mono font-bold">₹{data.amount.toLocaleString()}</span>
        </p>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
          {data.employees} Active Employees
        </p>
      </div>
    );
  }
  return null;
}

export default function PayrollTrendChart({ data = DEFAULT_DATA }: Props) {
  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-none transition-all h-full bg-white dark:bg-slate-900 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">Payroll Expense Trend</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Monthly salary distribution and growth over last 6 months
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
          <span className="material-symbols-outlined text-sm">trending_up</span>
          +8.8% Growth
        </div>
      </div>

      <div className="flex-1 w-full min-h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="payrollGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e2e8f0"
              strokeOpacity={0.5}
            />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={formatCurrency}
              tick={{ fill: "#64748b", fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#6366f1"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#payrollGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

