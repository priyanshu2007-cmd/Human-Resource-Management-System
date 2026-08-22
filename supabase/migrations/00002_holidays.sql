-- Dayflow HRMS — Holidays
-- Org-wide holiday calendar. Any org member can read; only admins manage entries.

-- ============================================================================
-- TABLE
-- ============================================================================

create table public.holidays (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  date date not null,
  created_at timestamptz default now(),
  unique (organization_id, date)
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.holidays enable row level security;

create policy "Users can view holidays in their organization"
  on public.holidays for select
  using (organization_id = public.my_organization_id());

create policy "Admins can insert holidays in their org"
  on public.holidays for insert
  with check (organization_id = public.my_organization_id() and public.is_admin());

create policy "Admins can update holidays in their org"
  on public.holidays for update
  using (organization_id = public.my_organization_id() and public.is_admin())
  with check (organization_id = public.my_organization_id() and public.is_admin());

create policy "Admins can delete holidays in their org"
  on public.holidays for delete
  using (organization_id = public.my_organization_id() and public.is_admin());

-- ============================================================================
-- INDEXES
-- ============================================================================

create index idx_holidays_org_date on public.holidays (organization_id, date);
