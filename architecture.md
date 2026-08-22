# architecture.md — Dayflow

## Stack (already in use — do not change without a documented reason)
| Layer | Choice |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Fonts | Inter (sans, variable weight) + JetBrains Mono (labels only) |
| Backend | Supabase — Postgres 17, Auth, Storage, RLS |
| Client libs | `@supabase/supabase-js`, `@supabase/ssr` |
| Project | `sjbyazwtokihprndebxh` (live, connected via `.env.local`) |

React + Vite was the brief's suggested default; not adopted because Next.js was already fully built out (auth, routing, 20+ pages) and working before this brief arrived. Switching frameworks now would be a full rewrite for no functional gain.

## Tenancy model
**Multi-tenant.** Every data table carries `organization_id`. A company's sign-up creates one `organizations` row + one admin `profiles` row via the `create_organization_and_admin` RPC. All RLS policies scope by `organization_id` first, role second — this is the actual enforcement point for "employee A can't see employee B's data," not a UI-level filter.

## App structure
```
app/
  (auth)/          sign-up, sign-in, change-password, email callback
  admin/           dashboard, employees (list/new/[id] detail+edit), attendance, leave-approvals, payroll
  employee/        dashboard, profile, attendance, leave, payroll
  api/admin/employees/route.ts   service-role endpoint: creates auth user + profile for a new employee
lib/
  supabase/        client.ts (browser), server.ts (RSC/server actions), admin.ts (service-role, server-only), middleware.ts
  types/database.types.ts   generated via `supabase gen types typescript --linked` — regenerate after every schema change, never hand-edit
supabase/migrations/00001_initial_schema.sql
```

## Auth flow
1. Sign-up form → `supabase.auth.signUp()` → `create_organization_and_admin` RPC (creates org + admin profile in one transaction-like pair of calls).
2. Employee creation is **admin-only**: `POST /api/admin/employees` (service role) → `supabase.auth.admin.createUser()` + `generate_login_id()` SQL function → insert `profiles` row with `must_change_password = true`.
3. Sign-in accepts Login ID or email (resolved server-side before calling `signInWithPassword`).
4. Session/role check happens in each section's `layout.tsx` (`app/admin/layout.tsx`, `app/employee/layout.tsx`) — redirects to `/sign-in` if no session, cross-redirects if role doesn't match the section.

## Data flow
- Server Components (`page.tsx` files under `admin/`, `employee/`) fetch via `lib/supabase/server.ts` at request time — no client-side loading spinners for initial data.
- Mutations (check-in, leave apply, leave approve/reject, payroll insert, profile edit) go through client components using `lib/supabase/client.ts`, relying on RLS to authorize — confirmed against actual policies in the migration before wiring, not assumed.
- Admin employee creation is the one path that needs to bypass RLS (creating another user's row) — that's exactly and only what `lib/supabase/admin.ts` (service role) is for. Never import it into a Client Component.

## Deployment
Not yet deployed. Local dev only (`npm run dev`, port 3000). Vercel + Supabase Cloud mentioned as the intended target but not set up.
