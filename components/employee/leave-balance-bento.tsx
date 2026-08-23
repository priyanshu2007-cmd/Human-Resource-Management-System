"use client";

interface Props {
  paidTaken?: number;
  sickTaken?: number;
  unpaidTaken?: number;
  onApplyLeave?: () => void;
}

const TOTAL_PAID = 18;
const TOTAL_SICK = 12;
const TOTAL_OPTIONAL = 5;

export function LeaveBalanceBento({
  paidTaken = 12,
  sickTaken = 2,
  unpaidTaken = 1,
  onApplyLeave,
}: Props) {
  const paidRemaining = Math.max(0, TOTAL_PAID - paidTaken);
  const sickRemaining = Math.max(0, TOTAL_SICK - sickTaken);
  const optionalRemaining = Math.max(0, TOTAL_OPTIONAL - unpaidTaken);

  const cards = [
    {
      type: "Paid / Casual Leave",
      code: "PL",
      icon: "beach_access",
      consumed: paidTaken,
      total: TOTAL_PAID,
      remaining: paidRemaining,
      color: "#10b981", // Emerald
      bgLight: "bg-emerald-500/10",
      borderLight: "border-emerald-500/20",
      textAccent: "text-emerald-600 dark:text-emerald-400",
      progressBg: "bg-emerald-500",
      description: "For vacations & personal time",
    },
    {
      type: "Sick / Medical Leave",
      code: "SL",
      icon: "local_hospital",
      consumed: sickTaken,
      total: TOTAL_SICK,
      remaining: sickRemaining,
      color: "#f59e0b", // Amber
      bgLight: "bg-amber-500/10",
      borderLight: "border-amber-500/20",
      textAccent: "text-amber-600 dark:text-amber-400",
      progressBg: "bg-amber-500",
      description: "Medical & health recovery",
    },
    {
      type: "Optional / Floating",
      code: "FL",
      icon: "event_repeat",
      consumed: unpaidTaken,
      total: TOTAL_OPTIONAL,
      remaining: optionalRemaining,
      color: "#8b5cf6", // Violet
      bgLight: "bg-violet-500/10",
      borderLight: "border-violet-500/20",
      textAccent: "text-violet-600 dark:text-violet-400",
      progressBg: "bg-violet-500",
      description: "Festive & floating holidays",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-title-md font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
            Leave Quotas & Balances
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Annual allocation for financial year 2026-27
          </p>
        </div>
        {onApplyLeave && (
          <button
            type="button"
            onClick={onApplyLeave}
            className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            Apply Leave
          </button>
        )}
      </div>

      {/* Mini Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((c) => {
          const percentUsed = Math.min(100, Math.round((c.consumed / c.total) * 100));
          return (
            <div
              key={c.code}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm dark:shadow-none hover:border-neutral-300 dark:hover:border-neutral-700 transition-all group relative overflow-hidden"
            >
              {/* Header inside card */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.bgLight} ${c.textAccent} transition-transform group-hover:scale-105`}
                  >
                    <span className="material-symbols-outlined text-xl">{c.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-body-sm font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
                      {c.type}
                    </h3>
                    <span className="text-[10px] font-mono uppercase font-bold text-neutral-400">
                      Quota: {c.total} Days
                    </span>
                  </div>
                </div>

                {/* Remaining Pill */}
                <div className="text-right">
                  <span className="text-xl font-extrabold font-mono text-neutral-900 dark:text-neutral-50 block leading-tight">
                    {c.remaining}
                  </span>
                  <span className="text-[10px] font-mono uppercase font-semibold text-neutral-400">
                    Left
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5 pt-2">
                <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                  <div
                    className={`h-full ${c.progressBg} rounded-full transition-all duration-500`}
                    style={{ width: `${percentUsed}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                  <span>Used: {c.consumed}d ({percentUsed}%)</span>
                  <span>Total: {c.total}d</span>
                </div>
              </div>

              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 truncate">
                {c.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
