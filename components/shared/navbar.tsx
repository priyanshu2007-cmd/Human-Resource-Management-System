"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { NavItem } from "@/components/shared/sidebar";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { HeaderNotifications } from "@/components/shared/header-notifications";

interface NavbarProps {
  user: {
    name: string;
    initials: string;
    role?: string;
  };
  /** Mobile-only nav items */
  mobileNavItems?: NavItem[];
}

export function Navbar({ user, mobileNavItems }: NavbarProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/admin/employees?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  return (
    <>
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4 md:px-6 h-16 border-b backdrop-blur-md"
        style={{
          background: "var(--surface-container-lowest)",
          borderColor: "var(--outline-variant)",
        }}
      >
        {/* Left: Mobile hamburger */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-[var(--surface-container-high)] cursor-pointer transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ color: "var(--on-surface)" }}
            aria-label="Toggle navigation"
          >
            <span className="material-symbols-outlined text-2xl">
              {menuOpen ? "close" : "menu"}
            </span>
          </button>

          {/* Global Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden sm:flex items-center relative">
            <span
              className="material-symbols-outlined absolute left-3 text-lg pointer-events-none"
              style={{ color: "var(--on-surface-variant)" }}
            >
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employees, requests..."
              className="w-64 md:w-80 pl-9 pr-12 py-2 rounded-xl text-body-sm transition-all focus:w-96 border focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              style={{
                background: "var(--surface-container-low)",
                borderColor: "var(--outline-variant)",
                color: "var(--on-surface)",
              }}
            />
            <kbd className="absolute right-3 hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono rounded border border-[var(--outline-variant)] bg-[var(--surface-container-high)] text-[var(--on-surface-variant)]">
              ⌘K
            </kbd>
          </form>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <HeaderNotifications />
          <ThemeToggle />

          <div className="h-5 w-px bg-[var(--outline-variant)] mx-1" />

          {/* User Profile dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-[var(--surface-container-high)] transition-colors cursor-pointer"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-body-sm font-bold shadow-sm"
                style={{
                  background: "var(--primary-container)",
                  color: "var(--on-primary-container)",
                }}
              >
                {user.initials}
              </div>
              <div className="hidden lg:block text-left pr-1">
                <p className="text-body-sm font-semibold leading-tight">{user.name}</p>
                <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--on-surface-variant)] leading-tight">
                  {user.role || "Member"}
                </p>
              </div>
              <span className="material-symbols-outlined text-base text-[var(--on-surface-variant)] hidden sm:block">
                expand_more
              </span>
            </button>

            {profileOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setProfileOpen(false)}
                />
                <div
                  className="absolute right-0 top-full mt-2 z-50 w-56 py-1.5 rounded-2xl shadow-2xl border overflow-hidden"
                  style={{
                    background: "var(--surface-container-lowest)",
                    borderColor: "var(--outline-variant)",
                  }}
                >
                  <div className="px-4 py-3 border-b" style={{ borderColor: "var(--outline-variant)" }}>
                    <p className="text-body-sm font-bold truncate">{user.name}</p>
                    <span className="inline-block mt-1 text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded-full bg-[var(--primary-container)] text-[var(--on-primary-container)]">
                      {user.role || "Employee"}
                    </span>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/employee/profile"
                      className="flex items-center gap-2.5 px-4 py-2 text-body-sm transition-colors hover:bg-[var(--surface-container-high)]"
                      style={{ color: "var(--on-surface)" }}
                      onClick={() => setProfileOpen(false)}
                    >
                      <span className="material-symbols-outlined text-lg">person</span>
                      My Profile
                    </Link>
                    <Link
                      href="/employee/dashboard"
                      className="flex items-center gap-2.5 px-4 py-2 text-body-sm transition-colors hover:bg-[var(--surface-container-high)]"
                      style={{ color: "var(--on-surface)" }}
                      onClick={() => setProfileOpen(false)}
                    >
                      <span className="material-symbols-outlined text-lg">dashboard</span>
                      My Workspace
                    </Link>
                  </div>

                  <div className="border-t pt-1" style={{ borderColor: "var(--outline-variant)" }}>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex items-center gap-2.5 px-4 py-2 text-body-sm w-full text-left transition-colors cursor-pointer hover:bg-[var(--surface-container-high)]"
                      style={{ color: "var(--error)" }}
                    >
                      <span className="material-symbols-outlined text-lg">logout</span>
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile navigation drawer */}
      {menuOpen && mobileNavItems && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => setMenuOpen(false)}
          />
          <nav
            className="fixed top-16 left-0 bottom-0 z-30 w-72 border-r md:hidden p-4 space-y-1.5 overflow-y-auto shadow-2xl"
            style={{
              background: "var(--surface-container-lowest)",
              borderColor: "var(--outline-variant)",
            }}
          >
            <div className="pb-3 mb-2 border-b border-[var(--outline-variant)]">
              <p className="text-xs font-mono uppercase text-[var(--on-surface-variant)] px-3">
                Navigation
              </p>
            </div>
            {mobileNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-body-sm font-semibold transition-colors hover:bg-[var(--surface-container-high)]"
                style={{ color: "var(--on-surface)" }}
              >
                <span className="material-symbols-outlined text-xl text-[var(--primary)]">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            ))}
          </nav>
        </>
      )}
    </>
  );
}
