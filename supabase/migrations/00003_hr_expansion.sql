-- Dayflow HRMS — HR Expansion
-- Adds extended profile fields, a leave-attachment column + private storage
-- bucket, and a full salary-breakdown redesign of salary_structures.
-- No existing columns are dropped or renamed — old salary_structures columns
-- (base_salary, allowances, deductions, effective_from) stay as-is for
-- backward compatibility with any existing rows.

-- ============================================================================
-- PROFILES — extended HR fields
-- ============================================================================
-- All covered by the existing profiles RLS policies from 00001
-- ("Users can view profiles in their organization", "Users can update their
-- own profile", "Admins can update any profile in their org") — those
-- policies scope by row (organization_id / id = auth.uid()), not by column,
-- so adding columns here needs no new policy.

alter table public.profiles
  add column date_of_birth date,
  add column residing_address text,
  add column nationality text,
  add column gender text,
  add column marital_status text,
  add column manager_id uuid references public.profiles(id),
  add column location text,
  add column bank_account_number text,
  add column bank_name text,
  add column ifsc_code text,
  add column pan_no text,
  add column uan_no text;

create index idx_profiles_manager on public.profiles (manager_id);

-- ============================================================================
-- LEAVE_REQUESTS — optional attachment (sick-leave certificates etc.)
-- ============================================================================
-- Covered by existing leave_requests RLS policies (owner insert/select,
-- admin select/update all scope by row, not column) — no new policy needed.

alter table public.leave_requests
  add column attachment_url text;

-- ============================================================================
-- SALARY_STRUCTURES — full monthly breakdown
-- ============================================================================
-- These are plain nullable numeric columns populated by the application at
-- insert time (not Postgres GENERATED columns) so the admin UI can show a
-- live recalculation before the row is ever submitted. Old columns
-- (base_salary, allowances, deductions, effective_from) are untouched.
-- Covered by existing salary_structures RLS policies (owner/admin select,
-- admin insert/update — all scope by row, not column) — no new policy needed.

alter table public.salary_structures
  add column month_wage numeric check (month_wage >= 0),
  add column working_days_per_week int default 5,
  add column break_time_hours numeric default 1,
  add column basic_salary numeric,          -- 50% of month_wage
  add column hra numeric,                   -- 50% of basic_salary
  add column standard_allowance numeric,    -- 16.67% of month_wage
  add column performance_bonus numeric,     -- 8.33% of basic_salary
  add column lta numeric,                   -- 8.33% of basic_salary
  -- fixed_allowance is the TRUE REMAINDER of gross pay, not a hardcoded
  -- 11.67% of month_wage. The other four earning components above are
  -- percentages that only approximate to ~100% of month_wage once rounded
  -- (50 + 16.67 + 8.33 + 8.33 = 83.33% on top of the 50% basic = 133.33%,
  -- i.e. the named components sum to month_wage only if fixed_allowance
  -- absorbs whatever is left). Computing fixed_allowance as
  -- month_wage - (basic_salary + hra + standard_allowance + performance_bonus + lta)
  -- guarantees gross earnings reconcile EXACTLY to month_wage with zero
  -- rounding drift, which is a hard payroll-accuracy requirement. Do not
  -- replace this with a fixed percentage constant.
  add column fixed_allowance numeric,
  add column employee_pf numeric,           -- 12% of basic_salary
  add column employer_pf numeric,           -- 12% of basic_salary (employer-side, not deducted from net pay)
  add column professional_tax numeric default 200,
  add column net_pay numeric;               -- gross earnings - employee_pf - professional_tax

-- ============================================================================
-- STORAGE — leave-attachments bucket
-- Mirrors the 'documents' bucket policy pattern from 00001 exactly:
-- users upload/view their own files under {user_id}/..., admins can view
-- all files for their org (checked via is_admin(), same as 'documents').
-- ============================================================================

insert into storage.buckets (id, name, public)
  values ('leave-attachments', 'leave-attachments', false)
  on conflict (id) do nothing;

create policy "Users can upload their own leave attachments"
  on storage.objects for insert
  with check (
    bucket_id = 'leave-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can view their own leave attachments"
  on storage.objects for select
  using (
    bucket_id = 'leave-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Admins can view all org leave attachments"
  on storage.objects for select
  using (
    bucket_id = 'leave-attachments'
    and public.is_admin()
  );
