# prd.md — Dayflow

## Product
Dayflow — "Every workday, perfectly aligned." A multi-tenant HR Management System: any company can sign up and run its own isolated HR workspace (onboarding, profiles, attendance, leave, payroll).

## Problem
Small/mid companies need attendance, leave, and payroll visibility without buying enterprise HR software. Dayflow gives each company its own workspace with two roles: **Admin/HR Officer** and **Employee**.

## Users
- **Admin/HR Officer** — creates employee records, approves leave, views/edits payroll, sees org-wide attendance.
- **Employee** — views own profile/attendance/payroll, applies for leave, checks in/out.

## Core features
1. **Auth & onboarding** — a company signs up (creates org + admin). Employees are **never self-registered**: an admin creates each employee record, and the system auto-generates a Login ID (`[2 letters first name][2 letters last name][join year][4-digit serial]`, e.g. `OIJODO20220001`) plus a one-time password, forced to change on first login. Sign-in accepts Login ID or email.
2. **Dashboards** — role-based landing page. Employee: quick-access cards (profile, attendance, leave, payroll) + recent activity. Admin: employee roster, attendance/leave at a glance, quick actions.
3. **Profile management** — employees edit phone/address/profile picture only. Admin edits any field on any employee in their org.
4. **Attendance** — check-in/out, daily + history views. Status: `present | absent | half-day | leave`. Employees see only their own; admin sees org-wide.
5. **Leave & time-off** — employee applies (type: paid/sick/unpaid, date range, remarks) → `pending`. Admin approves/rejects with an optional comment. Status change must be visible to the employee without a manual refresh mechanism beyond normal navigation (no stale cached state).
6. **Payroll** — employee: read-only current + historical salary structure. Admin: create new salary structure rows (full history preserved, never overwritten) — no negative values.

## Explicitly out of scope
- Email/notification alerts on events (leave approved, etc.)
- Analytics/reports dashboards, salary slip generation, attendance reports
- Leave balance tracking (no `leave_balances` table exists — do not fabricate quotas/progress bars against non-existent data)
- Invite-code or self-service employee registration of any kind

## Success criteria
- An employee can never read or write another employee's data, in any org (enforced at the DB layer via RLS, not just hidden in the UI).
- Admin actions (approve leave, edit salary, create employee) take effect immediately for the employee on next page load — no stale reads.
- Every screen works at both mobile and desktop widths.
