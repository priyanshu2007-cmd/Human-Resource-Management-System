"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DEMO_USERS = [
  { name: "Admin (HR Officer)", email: "spec.priyanshu@gmail.com", role: "Admin", dept: "HR & Exec", id: "ADM-001" },
  { name: "Aditi Sharma", email: "aditi.sharma@dayflowdemo.io", role: "Manager", dept: "Engineering", id: "ADSH20230005" },
  { name: "Priya Nair", email: "priya.nair@dayflowdemo.io", role: "Manager", dept: "Sales", id: "PRNA20220003" },
  { name: "Rohan Mehta", email: "rohan.mehta@dayflowdemo.io", role: "Employee", dept: "Engineering", id: "ROME20240005" },
  { name: "Kavya Iyer", email: "kavya.iyer@dayflowdemo.io", role: "Employee", dept: "Engineering", id: "KAIY20240006" },
  { name: "Aryan Verma", email: "aryan.verma@dayflowdemo.io", role: "Employee", dept: "Design", id: "ARVE20230006" },
  { name: "Neha Kapoor", email: "neha.kapoor@dayflowdemo.io", role: "Employee", dept: "Design", id: "NEKA20230007" },
  { name: "Karan Malhotra", email: "karan.malhotra@dayflowdemo.io", role: "Employee", dept: "Sales", id: "KAMA20240007" },
  { name: "Simran Kaur", email: "simran.kaur@dayflowdemo.io", role: "Employee", dept: "Marketing", id: "SIKA20230008" },
  { name: "Vikram Rao", email: "vikram.rao@dayflowdemo.io", role: "Employee", dept: "Marketing", id: "VIRA20240008" },
  { name: "Ishaan Gupta", email: "ishaan.gupta@dayflowdemo.io", role: "Employee", dept: "HR", id: "ISGU20220004" },
];

export function DemoSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const router = useRouter();

  async function handleSwitch(email: string) {
    setSwitching(email);
    try {
      const res = await fetch("/api/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (data.redirectUrl) {
        globalThis.location.href = data.redirectUrl;
      } else {
        alert(data.error || "Failed to switch user");
        setSwitching(null);
      }
    } catch {
      alert("Network error switching user");
      setSwitching(null);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full shadow-lg text-body-sm font-semibold transition-all hover:scale-105 cursor-pointer border"
          style={{
            background: "var(--primary-container)",
            color: "var(--on-primary-container)",
            borderColor: "var(--primary)",
          }}
        >
          <span className="material-symbols-outlined text-base animate-pulse">
            swap_horiz
          </span>
          <span>Switch Demo Role</span>
        </button>
      ) : (
        <div
          className="w-80 sm:w-96 max-h-[460px] flex flex-col rounded-xl shadow-2xl border overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-200"
          style={{
            background: "var(--surface-container-lowest)",
            borderColor: "var(--outline-variant)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{
              background: "var(--surface-container-high)",
              borderColor: "var(--outline-variant)",
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-lg"
                style={{ color: "var(--primary)" }}
              >
                manage_accounts
              </span>
              <p className="text-body-sm font-bold">1-Click Demo Role Switcher</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-6 h-6 rounded-full flex items-center justify-center transition-colors cursor-pointer hover:bg-black/10 dark:hover:bg-white/10"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          {/* User List */}
          <div className="p-2 space-y-1.5 overflow-y-auto flex-1 max-h-[360px]">
            {DEMO_USERS.map((user) => {
              const isCurrentSwitching = switching === user.email;
              const isAdmin = user.role === "Admin";
              const isManager = user.role === "Manager";

              return (
                <button
                  type="button"
                  key={user.email}
                  disabled={!!switching}
                  onClick={() => handleSwitch(user.email)}
                  className="w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between gap-2 hover:border-[var(--primary)] hover:bg-[var(--surface-container-low)] disabled:opacity-60 cursor-pointer"
                  style={{
                    borderColor: isAdmin ? "var(--primary)" : "var(--outline-variant)",
                    background: isAdmin
                      ? "rgba(99, 14, 212, 0.04)"
                      : "var(--surface-container-lowest)",
                  }}
                >
                  <div className="min-w-0 flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-label-caps font-bold shrink-0"
                      style={{
                        background: isAdmin
                          ? "var(--primary)"
                          : isManager
                            ? "var(--secondary-container)"
                            : "var(--surface-container-high)",
                        color: isAdmin
                          ? "var(--on-primary)"
                          : isManager
                            ? "var(--on-secondary-container)"
                            : "var(--on-surface)",
                      }}
                    >
                      {user.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-body-sm font-semibold truncate leading-tight">
                        {user.name}
                      </p>
                      <p
                        className="text-label-caps font-mono truncate"
                        style={{ color: "var(--on-surface-variant)" }}
                      >
                        {user.dept} · {user.id}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5">
                    <span
                      className="font-mono text-label-caps uppercase px-2 py-0.5 rounded-sm text-[10px]"
                      style={{
                        background: isAdmin
                          ? "rgba(99,14,212,0.12)"
                          : "var(--surface-container-high)",
                        color: isAdmin ? "var(--primary)" : "var(--on-surface-variant)",
                      }}
                    >
                      {user.role}
                    </span>
                    {isCurrentSwitching ? (
                      <span className="material-symbols-outlined text-sm animate-spin text-[var(--primary)]">
                        progress_activity
                      </span>
                    ) : (
                      <span className="material-symbols-outlined text-sm text-[var(--outline)]">
                        arrow_forward
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
