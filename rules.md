# rules.md — Dayflow

## Code style
- TypeScript strict; no `any` without a comment explaining why.
- Server Components by default; add `"use client"` only when the component genuinely needs interactivity/state/browser APIs.
- **Never pass event handlers (`onMouseEnter`, `onClick`, etc.) as props from a Server Component.** Use Tailwind `hover:`/`focus:` classes for pure visual states instead. (This broke twice in this build — see memory.md.)
- When mixing an inline `style` prop with a Tailwind `hover:` class on the *same* CSS property (e.g. `borderColor`), the inline style wins and the hover class silently does nothing. Put anything with a hover/focus variant into `className`, never `style`.

## Tech constraints
- Stack is fixed: Next.js + Tailwind v4 + shadcn/ui + Supabase. No new frontend framework, no new CSS system.
- No new npm dependency without checking `package.json` first for an existing one that already does the job (icons: `lucide-react`, already installed — don't add another icon set).
- `lib/types/database.types.ts` is generated, not hand-written. Regenerate with `supabase gen types typescript --linked` after any schema change; never manually add fields to it.

## Reuse / no duplication
- One `Tables<"leave_requests">` etc. import from `database.types.ts` per file that needs it — don't hand-write parallel interfaces that drift from the real schema (this caused 3 of our TS errors after types were generated).
- Shared visual patterns (stat-card row, status dot, avatar/initials circle) should match the existing implementation in `app/admin/dashboard/page.tsx` — check there before inventing a new pattern for the same concept elsewhere.

## Data & security
- Every table-scoping check goes through `organization_id` + RLS, never a client-side `.filter()` alone. If a new query needs a new access pattern, write the RLS policy first, then the query.
- Never call `lib/supabase/admin.ts` (service role) from a Client Component or expose the service role key to the browser. It exists only for the one legitimate case: creating another user's auth account.
- Don't invent data that isn't in the schema (e.g. leave balances/quotas) — if a UI pattern needs data that doesn't exist, skip that part and say so, don't fabricate placeholder numbers that look real.

## Responsive & consistency
- Build both mobile and desktop layout for a screen in the same pass — not desktop first with mobile as an afterthought.
- Status colors are fixed: `present`/`approved` = green, `absent`/`rejected` = red/status-error, `half-day`/`pending` = amber, `leave` = primary violet. Reuse across attendance and leave screens — don't invent new colors per screen.

## Git / env
- `.env*` is gitignored — never commit `.env.local`, never print its contents, never put a real key in a commit message or code comment.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only. Confirm any file importing it is never a Client Component before adding code there.
- Commit only when explicitly asked. Never force-push without explicit confirmation of the exact tradeoff.

## AI-specific rules
- Inspect the actual current file before editing it — don't assume prior structure from memory.
- Never assume a task is done without verifying: run `tsc --noEmit`, check the actual route in-browser or via curl, confirm the specific behavior asked for (e.g. "does an employee actually see another org's data" — check the RLS policy, don't just assume the query looks scoped).
- If a request conflicts with an existing decision in these docs, flag the conflict and ask — don't silently overwrite architecture or scope.
