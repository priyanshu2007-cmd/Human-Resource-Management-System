# phases.md — Dayflow build order

Status reflects actual current state, verified in-browser and via `tsc --noEmit`, not just "written."

- [x] **Phase 1 — Scaffold.** Next.js + Tailwind + shadcn/ui wired up with design tokens. Supabase client/server/admin helpers + session middleware in place.
- [x] **Phase 2 — Database migration.** All 6 tables (`organizations`, `profiles`, `salary_structures`, `documents`, `attendance`, `leave_requests`), helper functions (`my_organization_id`, `is_admin`, `generate_login_id`), bootstrap RPC (`create_organization_and_admin`), full RLS, storage buckets. Applied directly to the live project.
- [x] **Phase 3 — Auth & onboarding.** Sign-up (company + admin), sign-in (Login ID or email), forced password change on first login, role-based route protection in each section's layout.
- [x] **Phase 4 — Employee dashboard + profile.** Profile view/edit (phone/address/photo upload to Storage), dashboard quick-access cards.
- [x] **Phase 5 — Attendance.** Employee check-in/out + own history; admin org-wide table with summary stat row (Total/Present/Half-day/Absent-Leave).
- [x] **Phase 6 — Leave.** Employee apply flow; admin approval queue (card-based, approve/reject + comment) at `/admin/leave-approvals`.
- [x] **Phase 7 — Payroll.** Employee read-only view (current + history); admin insert-new-structure form (history preserved, never overwritten).
- [x] **Phase 8 — Admin employee management.** List (card grid), creation (generates Login ID + temp password, shown once), detail view + edit (job title/department/phone).
- [ ] **Phase 9 — Cross-role security pass.** RLS policies exist and were checked against each query at write-time, but there has been **no adversarial test** — e.g. actually attempting to read a second org's data with a real second account. Not yet done.
- [~] **Phase 10 — Polish.** Responsive layouts done per-screen as built (not a separate pass). Stitch visual alignment done for employee list/attendance/leave/sign-in. Not done: full loading/empty/error-state audit across every screen; the root `/` route was a leftover dev-scaffold page until this was caught and fixed (now redirects by role).

## Known gaps (see prd.md "explicitly out of scope")
- No leave balance/quota tracking — schema doesn't have it, employee leave page deliberately has no balance progress bars.
- No email confirmation currently enforced in the live Supabase project (toggled off during dev troubleshooting) — **revisit before any real deployment**, since the PRD's own sign-up flow assumes it.
