"use client";

import { useState } from "react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "leave" | "attendance" | "payroll" | "system";
  unread: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    title: "New Leave Application",
    message: "Elena Vance requested 3 days of Paid Leave.",
    time: "10m ago",
    type: "leave",
    unread: true,
  },
  {
    id: "2",
    title: "Attendance Anomaly",
    message: "2 employees checked in late today.",
    time: "1h ago",
    type: "attendance",
    unread: true,
  },
  {
    id: "3",
    title: "Payroll Processed",
    message: "Monthly payroll run for August is finalized.",
    time: "1d ago",
    type: "payroll",
    unread: false,
  },
];

export function HeaderNotifications() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => n.unread).length;

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  }

  function getIcon(type: NotificationItem["type"]) {
    switch (type) {
      case "leave":
        return { icon: "event_busy", color: "#f59e0b" };
      case "attendance":
        return { icon: "schedule", color: "#f43f5e" };
      case "payroll":
        return { icon: "payments", color: "#10b981" };
      default:
        return { icon: "info", color: "#6366f1" };
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-[var(--surface-container-high)] transition-colors cursor-pointer"
        style={{ color: "var(--on-surface-variant)" }}
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined text-xl">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-[var(--surface-container-lowest)]" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 rounded-2xl shadow-2xl border overflow-hidden"
            style={{
              background: "var(--surface-container-lowest)",
              borderColor: "var(--outline-variant)",
            }}
          >
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--outline-variant)" }}>
              <div className="flex items-center gap-2">
                <h4 className="text-body-md font-bold">Notifications</h4>
                {unreadCount > 0 && (
                  <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs font-semibold text-[var(--primary)] hover:underline cursor-pointer"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="divide-y max-h-[340px] overflow-y-auto" style={{ borderColor: "var(--outline-variant)" }}>
              {notifications.map((n) => {
                const { icon, color } = getIcon(n.type);
                return (
                  <div
                    key={n.id}
                    className={`p-3.5 flex items-start gap-3 transition-colors ${
                      n.unread ? "bg-[var(--surface-container-low)]" : ""
                    } hover:bg-[var(--surface-container-high)]`}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: `${color}20`, color }}
                    >
                      <span className="material-symbols-outlined text-base">{icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-body-sm font-semibold truncate">{n.title}</p>
                        <span className="text-[11px] text-[var(--on-surface-variant)] font-mono">{n.time}</span>
                      </div>
                      <p className="text-xs text-[var(--on-surface-variant)] mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-2.5 text-center border-t border-[var(--outline-variant)] bg-[var(--surface-container-low)]">
              <span className="text-xs text-[var(--on-surface-variant)]">
                All alerts up to date
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
