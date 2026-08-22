# memory.md — Dayflow current state

## Current Status
Phase: 9 (cross-role security pass) — not started. Phases 1–8 built and functioning against a live Supabase project. Priority: verify RLS actually isolates orgs (adversarial test), then a real polish pass.

## Completed (verified, not just written)
- [x] Schema applied to live project (`sjbyazwtokihprndebxh`), real types generated, `tsc --noEmit` → 0 errors
- [x] Sign-up → creates org + admin, confirmed working end-to-end in-browser
- [x] Sign-in (Login ID or email), confirmed working
- [x] Root `/` redirects by role/session (was a leftover dev-scaffold page — fixed)
- [x] Employee: dashboard, profile (view/edit + photo upload), attendance (check-in/out + history), leave apply, payroll (read-only)
- [x] Admin: dashboard, employee list (card grid)/create/detail+edit, attendance (org-wide + stats), leave-approvals (card-based approve/reject), payroll (insert new structure)
- [x] Typography swapped to Inter site-wide (was Hanken Grotesk)
- [x] Two Server-Component "event handler in props" runtime crashes fixed (admin dashboard, admin employees list, employee dashboard) — root cause was JS-based hover effects; replaced with Tailwind `hover:` classes

## Currently Working On
Nothing mid-flight. Docs (this set) were just created/backfilled from the existing build per explicit user decision — see Important Decisions.

## Next Tasks
1. Adversarial RLS test: create a second org/admin, confirm it cannot read the first org's employees/attendance/leave/payroll via any query
2. Confirm leave-approval status change is visible on the employee's dashboard on next load (no caching issue) — logic looks correct (server-fetched on each request) but not explicitly re-tested after recent changes
3. Full loading/empty/error-state audit across all screens (not done as a dedicated pass)
4. Decide whether to re-enable Supabase email confirmation before any real deployment (currently OFF — was toggled during dev troubleshooting, see Known Issues)

## Recent Changes
- Deleted a stray duplicate git clone (empty, no unique data) that was confusing the project root
- Wrote `.mcp.json` entries for Stitch, Supabase (project-scoped), Figma
- Connected real Supabase credentials (URL, anon key, service role key) to `.env.local`; regenerated types from the live schema
- Backfilled `prd.md`, `architecture.md`, `rules.md`, `phases.md`, `design.md`, this file — previously only `PROJECT_BRIEF.md` existed

## Known Issues
- **Email confirmation is OFF** on the live Supabase project. Was toggled off mid-session to unblock local sign-up testing, and a follow-up mistake also briefly disabled email signups entirely (re-enabled). This is a real gap vs. prd.md's stated requirement ("require email verification before first login") — currently not enforced. Revisit before production.
- No leave-balance data model exists — any future request for balance/quota UI needs a schema addition first, not a hardcoded number.
- `database.types.ts` variable names still say `--font-hanken` for what is now the Inter font (renamed the font, not the CSS variable, to minimize diff). Cosmetic only.

## Important Decisions (+ why)
- **Kept the existing multi-tenant, admin-creates-employee architecture** rather than pivoting to a later-arriving brief's self-service-signup-with-role-picker model. Reason: the existing system was already fully built, live, and verified working; the two models are architecturally incompatible (shared-table vs. per-org RLS), and a pivot would have meant discarding tested work for no stated functional benefit. User explicitly confirmed this choice when the conflict was flagged.
- **Kept Next.js** over the same brief's suggested React+Vite default, per that brief's own stated rule ("default to X unless the repo already shows a different stack") — Next.js was already fully in use.
- Employee creation deliberately stays admin-only (no self-registration, no invite codes) — an explicit decision carried over from `PROJECT_BRIEF.md`, reconfirmed during the conflict flag above.

## Files Modified (this session, doc-backfill pass)
`prd.md`, `architecture.md`, `rules.md`, `phases.md`, `design.md`, `memory.md` — all newly created.
