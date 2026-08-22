"use client";

import { Sidebar, type NavItem } from "@/components/shared/sidebar";
import { Navbar } from "@/components/shared/navbar";

const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "dashboard" },
  { label: "Employees", href: "/admin/employees", icon: "group" },
  { label: "Attendance", href: "/admin/attendance", icon: "schedule" },
  { label: "Time Off", href: "/admin/leave-approvals", icon: "event_busy" },
  { label: "Holidays", href: "/admin/holidays", icon: "celebration" },
  { label: "Payroll", href: "/admin/payroll", icon: "payments" },
];

interface AdminShellProps {
  user: {
    name: string;
    role: string;
    initials: string;
  };
  children: React.ReactNode;
}

export function AdminShell({ user, children }: AdminShellProps) {
  return (
    <div className="flex h-screen" style={{ background: "var(--background)" }}>
      <Sidebar items={ADMIN_NAV} user={user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar user={user} mobileNavItems={ADMIN_NAV} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
