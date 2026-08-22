"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

interface SidebarProps {
  items: NavItem[];
  user: {
    name: string;
    role: string;
    initials: string;
  };
}

export function Sidebar({ items, user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className="hidden md:flex flex-col w-[260px] h-screen sticky top-0 border-r"
      style={{
        background: "var(--surface-container-lowest)",
        borderColor: "var(--outline-variant)",
      }}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: "var(--outline-variant)" }}>
        <Logo markSize={28} />
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-body-sm font-medium transition-colors"
              style={{
                background: isActive ? "var(--primary)" : "transparent",
                color: isActive ? "var(--on-primary)" : "var(--on-surface-variant)",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "var(--surface-container-high)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <span
                className="material-symbols-outlined text-xl"
                style={{
                  fontVariationSettings: isActive
                    ? "'FILL' 1, 'wght' 500"
                    : "'FILL' 0, 'wght' 400",
                }}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info at bottom */}
      <div
        className="px-4 py-4 border-t"
        style={{ borderColor: "var(--outline-variant)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-body-sm font-semibold shrink-0"
            style={{
              background: "var(--primary-container)",
              color: "var(--on-primary-container)",
            }}
          >
            {user.initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-body-sm font-semibold truncate">{user.name}</p>
            <p
              className="text-label-caps font-mono uppercase truncate"
              style={{ color: "var(--on-surface-variant)" }}
            >
              {user.role}
            </p>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
