"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { NavItem } from "@/components/shared/sidebar";
import { ThemeToggle } from "@/components/shared/theme-toggle";

interface NavbarProps {
  user: {
    name: string;
    initials: string;
  };
  /** Mobile-only nav items */
  mobileNavItems?: NavItem[];
}

export function Navbar({ user, mobileNavItems }: NavbarProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
  }

  return (
    <>
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4 md:px-6 h-14 border-b"
        style={{
          background: "var(--surface-container-lowest)",
          borderColor: "var(--outline-variant)",
        }}
      >
        {/* Mobile hamburger */}
        <button
          type="button"
          className="md:hidden cursor-pointer"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ color: "var(--on-surface)" }}
        >
          <span className="material-symbols-outlined text-2xl">
            {menuOpen ? "close" : "menu"}
          </span>
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        <ThemeToggle className="mr-2" />

        {/* Profile dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-body-sm font-semibold"
              style={{
                background: "var(--primary-container)",
                color: "var(--on-primary-container)",
              }}
            >
              {user.initials}
            </div>
          </button>

          {profileOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setProfileOpen(false)}
              />
              <div
                className="absolute right-0 top-full mt-2 z-50 w-48 py-1 rounded-md shadow-lg border"
                style={{
                  background: "var(--surface-container-lowest)",
                  borderColor: "var(--outline-variant)",
                }}
              >
                <div className="px-4 py-2 border-b" style={{ borderColor: "var(--outline-variant)" }}>
                  <p className="text-body-sm font-semibold">{user.name}</p>
                </div>
                <Link
                  href="/employee/profile"
                  className="flex items-center gap-2 px-4 py-2 text-body-sm transition-colors"
                  style={{ color: "var(--on-surface)" }}
                  onClick={() => setProfileOpen(false)}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "var(--surface-container-high)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <span className="material-symbols-outlined text-lg">
                    person
                  </span>
                  My Profile
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 text-body-sm w-full text-left transition-colors cursor-pointer"
                  style={{ color: "var(--error)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "var(--surface-container-high)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <span className="material-symbols-outlined text-lg">
                    logout
                  </span>
                  Log Out
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Mobile navigation drawer */}
      {menuOpen && mobileNavItems && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/30 md:hidden"
            onClick={() => setMenuOpen(false)}
          />
          <nav
            className="fixed top-14 left-0 bottom-0 z-30 w-64 border-r md:hidden p-3 space-y-1 overflow-y-auto"
            style={{
              background: "var(--surface-container-lowest)",
              borderColor: "var(--outline-variant)",
            }}
          >
            {mobileNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md text-body-sm font-medium transition-colors"
                style={{ color: "var(--on-surface-variant)" }}
              >
                <span className="material-symbols-outlined text-xl">
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
