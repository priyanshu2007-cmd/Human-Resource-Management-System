# design.md — Dayflow

## Philosophy
Clean enterprise SaaS, not playful. Violet as the single accent color against neutral surfaces. Monospace labels give it a slightly technical/precise feel appropriate for HR/payroll data.

## Typography
- **Sans (body, headings, UI text):** Inter — variable weight, loaded via `next/font/google`, CSS var `--font-hanken` (name is legacy, value is Inter — see memory.md).
- **Mono (field labels, uppercase small labels like "COMPANY NAME"):** JetBrains Mono, CSS var `--font-jetbrains`.
- Don't introduce a third typeface. Don't use JetBrains Mono for body copy or headings — it's for labels only.

## Color tokens (from `app/globals.css`)
- Primary: `#630ed4` (violet)
- Status: present/approved = green (`--status-success` family), absent/rejected = red (`--status-error`/`status-rejected`), half-day/pending = amber (`--status-warning`/`status-pending`), leave = primary violet
- Surfaces: `--surface`, `--surface-container-lowest/low/high/highest` — layer cards/panels using these, not arbitrary grays
- Full palette (light + dark) already defined as CSS custom properties — use `var(--token-name)`, don't hardcode hex values in new components

## Spacing & radius
- Border radius scale: `0.125rem` (default) / `0.25rem` (lg) / `0.5rem` (xl) / `0.75rem` (full)
- Margins: `margin-desktop` 40px, `margin-mobile` 16px, `gutter` 24px, `base` 4px — use these spacing tokens over arbitrary padding values where a screen already establishes the pattern

## Component conventions
- **Buttons/inputs/cards:** shadcn/ui primitives (`components/ui/*`) — extend via `className`, don't fork new implementations.
- **Status badges:** `components/shared/status-badge.tsx` — one component, color driven by status value. Reuse everywhere a status appears (attendance, leave, employee active/pending).
- **Lists of people/records:** card-grid pattern (avatar/initials circle, name, role, status dot top-right, pill tags below) — established in the employee list and admin dashboard; reuse rather than defaulting to a plain table for new list views.
- **Hover states:** Tailwind `hover:` classes only. Never a JS `onMouseEnter`/`onMouseLeave` handler for a purely visual effect — see rules.md.
- **Forms:** label in JetBrains Mono uppercase, input with visible border, focus ring in primary color.

## Responsive breakpoints
Tailwind defaults (`sm`/`md`/`lg`). Sidebar nav collapses to a bottom nav bar or simplified header below `md`. Every screen must be checked at both a mobile width and desktop width before being considered done — not desktop-only with mobile deferred.

## Motion
Minimal — `transition-colors` on interactive elements, no elaborate animation. This is a data-entry tool, not a marketing site.
