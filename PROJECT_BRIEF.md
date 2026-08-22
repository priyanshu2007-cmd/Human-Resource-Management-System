# Dayflow — Build Brief for Claude Code

**Product:** Dayflow — Human Resource Management System (HRMS), built as multi-tenant software: multiple companies can each sign up and run their own isolated workspace.
**Tagline:** Every workday, perfectly aligned.

---

## Decisions made for this build (read first)

These override the corresponding sections below — the rest of the document is kept as originally written for context.

1. **Project root:** this directory (`/Users/priyanshu/Documents/Odoo`, package name `dayflow`), not the separately-cloned `Human-Resource-Management-System` repo. This folder already has its own git history tied to `github.com/priyanshu2007-cmd/Human-Resource-Management-System.git` as `origin`.
2. **Onboarding model:** follows the Claude Design mockup, not Section 5's invite-code flow. **Employees never self-register, even with a code.** An admin/HR officer creates each employee's record directly (`/admin/employees` → "New"); Dayflow auto-generates:
   - a **Login ID**: `[first 2 letters of first name][first 2 letters of last name][joining year][4-digit serial, per-org]`, e.g. `OIJODO20220001`
   - a **one-time password**, which the employee must change on first sign-in
   - Sign-in accepts either the Login ID or the employee's email.
   - **Practical effect on Section 4's schema:** drop the `invites` table and the `join_organization_via_invite()` RPC entirely. `create_organization_and_admin()` is unchanged — that's still how a brand-new company signs up. Employee creation instead goes through a service-role Route Handler (`/api/admin/employees`, built in Phase 8) that calls `supabase.auth.admin.createUser()` to create the auth user + temp password, then inserts the `profiles` row with the generated Login ID as `employee_id` — this is the trusted entry point, same pattern as the bootstrapping RPCs. A SQL helper for generating the next Login ID (collision-safe, per `organization_id` + joining year) will be added in Phase 2's migration. Section 6.3 (`/admin/invites`) is replaced by this employee-creation flow — no separate invites screen.

---

## How to use this document

1. Save this file as `PROJECT_BRIEF.md` in the root of your project folder (or paste its full contents as your first message to Claude Code).
2. Have these ready to hand to Claude Code alongside it:
   - The **Dayflow logo** file
   - Screenshots or exported code from your **Stitch** project and any **Claude Design** mockups — these are the real design source of truth, not the fallback palette in Section 2
   - Your **Supabase project URL, anon key, and service role key** (or ask Claude Code to walk you through `npx supabase init` first)
3. Tell Claude Code to work through **Section 8 (Build Order)** one phase at a time and check in with you after each phase, rather than generating the whole app in one pass — much easier to steer.
4. This is built as **multi-tenant SaaS** — every company that signs up gets its own isolated data. Section 10 covers why; Section 4 covers how that's enforced at the database level.

## Assumptions made in this brief — change these before you start if they're wrong

- **Frontend framework:** Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui — not specified in the original requirements, chosen because it pairs directly with Supabase's SSR auth helpers and Tailwind-based Stitch output. Swap Section 1's stack table for something else if preferred.
- **"Switch between employees"** (admin dashboard) means: an admin selects an employee *within their own company* and views/edits that employee's profile, attendance, and leave — never across companies.
- ~~**Employee invites are shareable codes/links**, copied and sent by the admin themselves — not automated emails.~~ **Superseded by Decision 2 above** — no invite codes at all; admins create employee records directly and Dayflow issues a Login ID + one-time password.
- **Password rules** and a few other unspecified details are given reasonable defaults below — flagged inline, adjust freely.

---

## 1. Project Overview

**Purpose:** Dayflow is HR software that companies sign up for and run their own workspace on — onboarding, profile management, attendance tracking, leave management, payroll visibility, and approval workflows, all isolated per company.

**Default tech stack:**

| Layer | Choice |
|---|---|
| Frontend | Next.js 14+ (App Router), TypeScript |
| Styling | Tailwind CSS + shadcn/ui components |
| Backend / database | Supabase — Postgres, Auth, Storage, Row Level Security |
| Supabase client | `@supabase/supabase-js` + `@supabase/ssr` (for server + client auth in Next.js) |
| Hosting (mention only, don't set up) | Vercel (frontend) + Supabase Cloud (backend) |

---

## 2. Visual Design Direction

Source of truth, in priority order:

1. **Stitch screenshots/exports** — attach these to the session
2. **Claude Design mockups**, if any — attach these too
3. **Dayflow logo** — attach the file; pull the palette from it if nothing else is given
4. **Fallback design system** below — only if none of the above are provided

**Design tokens actually used (pulled from the Claude Design mockup `DayFlow design system update` → `Dayflow HR.dc.html`), implemented in `app/globals.css`:**
- Fonts: **Archivo** (400–800) for UI text, **JetBrains Mono** (400–700) for IDs/codes/currency
- Light: bg `#F5F4F8`, surface `#FFFFFF`, text `#1A1524`, accent (violet) `#5F249F`
- Dark: bg `#0B0910`, surface `#14111C`, text `#F5F3F9`, accent `#9D62E8`
- Status colors: green `#12A46B` = Present/Approved, red `#D23A30` = Absent/Rejected, amber `#C98A00` = Half-day/Pending, neutral surface = Leave/Inactive
- Radii: 8px inputs/buttons, 16px large cards, 999px pills/avatars, 2px status badges
- Stitch itself needs separate OAuth authorization before its MCP tools work (hit an auth error when queried) — the Claude Design file was comprehensive enough to build the token set from directly.

**Fallback design system (superseded — kept for reference only):**
- Palette: calm slate-blue primary, soft neutral background, one accent color reserved for primary actions
- Status colors: green = Present/Approved, red = Absent/Rejected, amber = Half-day/Pending, gray = Leave/Inactive
- Typography: clean sans-serif (Inter or similar), generous whitespace, card-based layout
- Overall feel: calm and orderly, matching the "everything aligned" tagline

Build a **shared component library first** — button, card, badge, table, input, modal — styled once, then compose every screen from those. Don't style each page one-off; it'll drift from the reference designs fast.

---

## 3. Roles & Access

Every role is scoped to one company — an admin manages their own company's employees only, never another company's data.

| Role | Can do |
|---|---|
| **Admin / HR Officer** | Manage all employees *in their company*, invite new employees, approve/reject leave and attendance, view + edit payroll, view all documents |
| **Employee** | View/edit own profile (limited fields), view own attendance, apply for leave, view own payroll (read-only) |

Enforce role and company scope **both** in the UI (hide/disable what a role can't do) **and** in the database via Row Level Security. Never rely on the client alone for anything sensitive — a hidden button isn't access control, and neither is a client-side filter on `organization_id`.

---

## 4. Database Schema

Concrete SQL so nothing has to be guessed at build time. Every table carries `organization_id` — that's the boundary that keeps one company's data invisible to another.

**Note:** the `invites` table and `join_organization_via_invite()` RPC below are **superseded by Decision 2** — not part of the actual Phase 2 migration. Kept here for context on what changed and why.

```sql
-- organizations: one row per company using Dayflow
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- profiles: one row per user, 1:1 with auth.users, always tied to one organization
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  employee_id text not null,
  full_name text not null,
  email text not null,
  role text not null check (role in ('admin','employee')) default 'employee',
  phone text,
  address text,
  profile_picture_url text,
  job_title text,
  department text,
  date_of_joining date,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (organization_id, employee_id)
);

-- invites: how an admin brings new employees into their company
create table invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  code text unique not null,
  role text not null check (role in ('admin','employee')) default 'employee',
  created_by uuid references profiles(id),
  expires_at timestamptz,
  used_by uuid references profiles(id),
  used_at timestamptz,
  created_at timestamptz default now()
);

-- salary_structures: new row per change, so history is preserved (never overwrite in place)
create table salary_structures (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  base_salary numeric not null,
  allowances numeric default 0,
  deductions numeric default 0,
  effective_from date not null,
  updated_by uuid references profiles(id),
  updated_at timestamptz default now()
);

-- documents: metadata only; actual files live in Supabase Storage
create table documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  document_type text not null,
  file_url text not null,
  uploaded_at timestamptz default now()
);

-- attendance: one row per employee per day
create table attendance (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  date date not null,
  check_in timestamptz,
  check_out timestamptz,
  status text not null check (status in ('present','absent','half-day','leave')),
  created_at timestamptz default now(),
  unique (user_id, date)
);

-- leave_requests
create table leave_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  leave_type text not null check (leave_type in ('paid','sick','unpaid')),
  start_date date not null,
  end_date date not null,
  remarks text,
  status text not null check (status in ('pending','approved','rejected')) default 'pending',
  admin_comment text,
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz default now()
);
```

**Helper functions** (`security definer`, so they can safely perform the checks every policy below relies on):

```sql
create or replace function my_organization_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select organization_id from profiles where id = auth.uid();
$$;

create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$;
```

**Row Level Security — enable on every table above, then scope every policy by organization first, role second:**

- `organizations`: a user can `select` only the row matching `my_organization_id()`; no client-side `insert` (see bootstrapping note below)
- `profiles`: user can `select`/`update` their own row (`id = auth.uid()`); admins can `select`/`update` any row where `organization_id = my_organization_id() and is_admin()`
- `attendance`, `leave_requests`, `documents`: user can `select`/`insert` their own rows (`user_id = auth.uid()`); admins can `select`/`insert`/`update` all rows where `organization_id = my_organization_id() and is_admin()`
- `salary_structures`: user can `select` their own row only (read-only, no insert/update); admins can do all within `organization_id = my_organization_id()`
- `invites`: only admins can `select`/`insert`/`update`, scoped to `organization_id = my_organization_id() and is_admin()`

**Bootstrapping problem, and how to handle it:** the first user of a new company doesn't have a `profiles` row yet, so the usual RLS checks (which all read from `profiles`) can't apply to "create a company." Handle both onboarding paths as `security definer` RPC functions that run as a single transaction and bypass RLS by design, since they *are* the trusted entry point:

```sql
-- called right after auth.users sign-up, for "create a new company"
create or replace function create_organization_and_admin(
  org_name text, emp_id text, name text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
begin
  insert into organizations (name) values (org_name) returning id into new_org_id;
  insert into profiles (id, organization_id, employee_id, full_name, email, role)
  values (auth.uid(), new_org_id, emp_id, name, auth.email(), 'admin');
  return new_org_id;
end;
$$;

-- called after auth.users sign-up, for "join a company via invite code"
create or replace function join_organization_via_invite(
  invite_code text, emp_id text, name text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inv invites;
begin
  select * into inv from invites where code = invite_code and used_by is null
    and (expires_at is null or expires_at > now());
  if inv is null then
    raise exception 'Invalid or expired invite code';
  end if;
  insert into profiles (id, organization_id, employee_id, full_name, email, role)
  values (auth.uid(), inv.organization_id, emp_id, name, auth.email(), inv.role);
  update invites set used_by = auth.uid(), used_at = now() where id = inv.id;
  return inv.organization_id;
end;
$$;
```

Have Claude Code write all of this — tables, functions, policies — as a proper migration file under `/supabase/migrations/`.

Also create two Storage buckets: `profile-pictures` and `documents`, with policies mirroring the table rules above (owner can read/write their own files, admins can read all files within their own organization).

---

## 5. Authentication & Onboarding

**Sign up** happens in two steps: create the `auth.users` row (email + password), then immediately follow with one of:
- **Create a company** — company name, Employee ID, full name → calls `create_organization_and_admin()`, becomes admin of a brand-new organization
- ~~**Join a company** — invite code, Employee ID, full name → calls `join_organization_via_invite()`, joins with the role the invite specifies (default employee)~~ **Superseded by Decision 2** — no self-service join path. Admins create employee records directly; see the decision note at the top of this document.

- Password rule (default — adjust freely): minimum 8 characters, at least one uppercase letter, one number, one special character
- Require email confirmation before either onboarding step runs (enable "Confirm email" in Supabase Auth settings, handle the callback route)

**Sign in**
- Login ID or email + password (per the design mockup's sign-in form)
- Clear inline error messages for wrong credentials and for unconfirmed email
- First sign-in with a one-time password forces a password-change screen before continuing
- On success, redirect by role: `/admin/dashboard` or `/employee/dashboard`

**Route protection**
- Next.js middleware (now `proxy.ts` — Next 16 renamed the file convention) checks for a valid Supabase session on every protected route and redirects unauthenticated users to `/sign-in`
- Admin-only routes additionally check `profiles.role` before rendering
- Every data fetch is implicitly scoped by RLS to the caller's own `organization_id` — there's no separate "which company" check needed beyond that, since the database itself won't return another company's rows

---

## 6. Screens & Features

### 6.1 Employee Dashboard — `/employee/dashboard`
Quick-access cards: Profile, Attendance, Leave Requests, Logout. A "recent activity" panel showing the last few attendance entries and any leave status changes.

### 6.2 Admin / HR Dashboard — `/admin/dashboard`
Employee list *for their own company* (searchable by name/ID/department), today's attendance overview, a pending-leave-approvals count. Clicking an employee opens their detail page (profile/attendance/leave, per 6.4–6.6).

### 6.3 Employee creation (admin only) — `/admin/employees` → "New"
- **Superseded Decision 2 replacement for the old invites screen.** Admin fills in the employee's details (name, job title, department, joining date, etc.); Dayflow generates the Login ID and a one-time password, and creates the auth user server-side.
- No automated email sending for MVP — the admin shares the Login ID and one-time password with the employee themselves.

### 6.4 Profile Management
- **View** (`/employee/profile` or `/admin/employees/[id]`): personal details, job details, salary structure, documents, profile picture
- **Edit**: employee can edit `phone`, `address`, `profile_picture_url` only; admin can edit every field on any employee in their own company
- Profile picture → `profile-pictures` bucket; documents → `documents` bucket

### 6.5 Attendance
- Employee: check-in / check-out button (writes today's `check_in`/`check_out`); daily view (today's status) and weekly view (last 7 days, color-coded by status)
- Admin: same views for any employee in their company, plus a table filterable by employee, date range, and status

### 6.6 Leave & Time-Off
- Employee: "Apply for Leave" form (type: Paid/Sick/Unpaid, date range, remarks); a history list of their own requests with status badges
- Admin: table of all leave requests in their company, filterable by status/employee; Approve/Reject with an optional comment. Approving or rejecting should reflect on the employee's side without a manual refresh — Supabase Realtime or a simple refetch-on-focus is enough, doesn't need to be elaborate

### 6.7 Payroll
- Employee: read-only breakdown (base, allowances, deductions, net)
- Admin: view payroll for everyone in their company; editing salary **inserts a new `salary_structures` row** rather than overwriting, so history is kept

### 6.8 Explicitly out of scope for now (from the original doc's "Future Enhancements")
Email/notification alerts (including automated invite emails), and an analytics/reports dashboard (salary slips, attendance reports). Don't build either yet — just keep the schema and folder structure clean enough that they can be added later without a rewrite.

---

## 7. Suggested Project Structure

```
/app
  /(auth)/sign-in
  /(auth)/sign-up          → "create a company workspace" only; no join-company path
  /(auth)/callback          → email confirmation handler
  /(auth)/change-password  → forced on first sign-in with a one-time password
  /employee/dashboard
  /employee/profile
  /employee/attendance
  /employee/leave
  /admin/dashboard
  /admin/employees
  /admin/employees/[id]
  /admin/employees/new
  /admin/attendance
  /admin/leave-approvals
  /admin/payroll
  /api/admin/employees      → service-role route: create auth user + profile for a new employee
/components
  /ui                        → shared primitives: button, card, badge, table, input, modal
  /shared                    → Navbar, Sidebar, StatusBadge, EmployeeCard, Logo, etc.
/lib
  /supabase/client.ts
  /supabase/server.ts
  /supabase/middleware.ts
  /supabase/admin.ts         → service-role client, server-only
  /types/database.types.ts   → generated via `supabase gen types typescript`
/supabase
  /migrations
```

---

## 8. Build Order

Work through these in order; pause for a check-in after each one.

1. ✅ **Done.** Scaffold Next.js + Tailwind + shadcn/ui; wire up the Supabase client/server/admin helpers and proxy.ts session middleware; drop in the logo and design tokens from the Claude Design reference.
2. Database migration: `organizations`, `profiles`, and every other table from Section 4 (minus `invites`), plus the helper functions, the `create_organization_and_admin` RPC, a Login-ID-generation helper, and all RLS policies
3. Auth + onboarding: sign up (create-company only), email verification, Login ID / email sign-in, forced password change on first login, role-based redirect, route protection in `proxy.ts`
4. Employee dashboard + profile view/edit + picture upload
5. Attendance: check-in/out, daily/weekly views, employee and admin sides
6. Leave: apply flow, employee history, admin approve/reject queue
7. Payroll: employee read-only view, admin edit view
8. Admin: employee list, **employee creation flow (Login ID + one-time password generation)**, employee detail page, cross-links between sections
9. Final pass: responsive check, loading/empty/error states everywhere, consistent status-badge colors across attendance and leave, and a quick manual test that a second company's data never shows up in the first company's screens

---

## 9. Non-negotiables

- Every table has RLS enabled, and **every policy scopes by `organization_id`, not just role** — a policy that checks role but forgets the organization is a cross-tenant data leak, not a smaller bug
- The Supabase **service role key** never touches client-side code (`lib/supabase/admin.ts` is server-only — Route Handlers and Server Actions, never a Client Component)
- No page trusts a `role` or `organization_id` value from client state for anything sensitive — always re-check server-side / via RLS
- TypeScript throughout, using the generated Supabase types
- Reuse the shared component library — no per-page one-off buttons or cards

**What to revisit as this grows:** the two "future enhancement" items (notifications, reports/exports), and — once enough companies are signed up — pagination on the admin employee table and some kind of plan/billing layer, neither of which is needed yet.

---

## 10. Architecture check: single-tenant vs SaaS, and is Supabase the right call

### Single-tenant or multi-tenant SaaS?

**Confirmed: multi-tenant SaaS.** This is built as real software other companies can sign up and use, each with their own isolated workspace — not a tool for one internal HR department. That decision is threaded through Sections 4–8 above: every table carries `organization_id`, sign-up creates a company, and every RLS policy scopes by organization first, role second.

### Is Supabase actually the right backend, or should something else be used?

| | Supabase | Custom backend (Node/Express + Postgres or Prisma) | Firebase |
|---|---|---|---|
| Auth + role-based access | Built-in auth plus Postgres RLS — a strong fit for "employees see only their own data, admins see everyone's in their company" | You build auth yourself (or bolt on Auth.js) — more control, more work | Built-in auth, but no relational RLS; access control lives in security rules, which get awkward for admin-approves-employee-data patterns like leave approval |
| Multi-tenancy | RLS scoped by `organization_id` is one of the most common, well-supported patterns for exactly this | Also very doable, but you're writing the tenant-isolation checks by hand instead of getting them from the database layer | Firestore tenant isolation is possible but has to be built into every query path yourself — easy to get wrong once |
| Data shape | This app is fundamentally relational — employees ↔ attendance ↔ leave ↔ payroll, with joins and history — a natural fit for Postgres | Also a natural fit — you'd likely reach for Postgres here too | Firestore is document-based; modeling relational HR data in it fights the database more than it helps |
| Time to build | Fast — auth, storage, and hosted Postgres with a generated client, out of the box | Slower — you own the server, deployment, and auth | Fast for simple apps, slower here specifically because of the data-shape mismatch above |
| Cost at scale | Free tier is generous early on; becomes a real line-item once there are many companies/users | Cheapest at real scale if you're comfortable running your own server | Similar story to Supabase, without the relational fit |
| Lock-in | Some — leaning on Supabase Auth + RLS conventions | Low — plain Postgres, portable | Higher — Firestore's data model doesn't port cleanly elsewhere |

**Recommendation: keep Supabase.** The access pattern here — employees see only their own rows, admins see and approve everyone's *within their own company* — is a textbook fit for Postgres RLS, and multi-tenancy via an `organization_id` column checked in every policy is one of the most common, well-supported RLS patterns there is. A custom backend would give more control but means building auth, tenant isolation, and RLS-equivalent checks by hand; Firebase's document model fights both the relational data shape and clean tenant isolation. Going multi-tenant doesn't change this call — if anything, it's exactly the case RLS was built for.
