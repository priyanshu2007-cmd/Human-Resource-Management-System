"use client";

import { Sidebar, type NavItem } from "@/components/shared/sidebar";
import { Navbar } from "@/components/shared/navbar";

const EMPLOYEE_NAV: NavItem[] = [
  { label: "Dashboard", href: "/employee/dashboard", icon: "dashboard" },
  { label: "Profile", href: "/employee/profile", icon: "person" },
  { label: "Attendance", href: "/employee/attendance", icon: "schedule" },
  { label: "Calendar", href: "/employee/calendar", icon: "calendar_month" },
  { label: "Time Off", href: "/employee/leave", icon: "event_busy" },
  { label: "Payroll", href: "/employee/payroll", icon: "payments" },
];

interface EmployeeShellProps {
  user: {
    name: string;
    role: string;
    initials: string;
  };
  isAdmin: boolean;
  children: React.ReactNode;
}

export function EmployeeShell({ user, children }: EmployeeShellProps) {
  return (
    <div className="flex h-screen" style={{ background: "var(--background)" }}>
      <Sidebar items={EMPLOYEE_NAV} user={user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar user={user} mobileNavItems={EMPLOYEE_NAV} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
