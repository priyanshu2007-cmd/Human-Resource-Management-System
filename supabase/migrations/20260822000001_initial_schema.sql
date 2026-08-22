-- Dayflow HRMS — Initial Schema Migration
-- Tables, helper functions, RPCs, RLS policies, and storage buckets.
-- No `invites` table — employee creation is admin-driven via service-role API.

-- ============================================================================
-- TABLES
-- ============================================================================

-- organizations: one row per company using Dayflow
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  created_at timestamptz default now()
);

-- profiles: one row per user, 1:1 with auth.users, always tied to one organization
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  employee_id text not null,          -- generated Login ID, e.g. OIJODO20220001
  full_name text not null,
  email text not null,
  role text not null check (role in ('admin','employee')) default 'employee',
  phone text,
  address text,
  profile_picture_url text,
  job_title text,
  department text,
  date_of_joining date,
  must_change_password boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (organization_id, employee_id)
);

-- salary_structures: new row per change, history is preserved
create table public.salary_structures (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  base_salary numeric not null,
  allowances numeric default 0,
  deductions numeric default 0,
  effective_from date not null,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz default now()
);

-- documents: metadata only; actual files live in Supabase Storage
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  document_type text not null,
  file_url text not null,
  uploaded_at timestamptz default now()
);

-- attendance: one row per employee per day
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  date date not null,
  check_in timestamptz,
  check_out timestamptz,
  status text not null check (status in ('present','absent','half-day','leave')),
  created_at timestamptz default now(),
  unique (user_id, date)
);

-- leave_requests
create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  leave_type text not null check (leave_type in ('paid','sick','unpaid')),
  start_date date not null,
  end_date date not null,
  remarks text,
  status text not null check (status in ('pending','approved','rejected')) default 'pending',
  admin_comment text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Returns the caller's organization_id (from profiles). Used in every RLS policy.
create or replace function public.my_organization_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select organization_id from profiles where id = auth.uid();
$$;

-- Returns true if the caller is an admin. Used to gate admin-only operations.
create or replace function public.is_admin()
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

-- ============================================================================
-- LOGIN ID GENERATOR
-- Collision-safe per (organization_id, joining_year).
-- Format: [first 2 of first_name][first 2 of last_name][year][4-digit serial]
-- Example: OIJODO20220001
-- ============================================================================

create or replace function public.generate_login_id(
  p_org_id uuid,
  p_first_name text,
  p_last_name text,
  p_joining_year int default extract(year from now())::int
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  prefix text;
  year_str text;
  max_serial int;
  new_serial text;
begin
  -- Build the name prefix (uppercase, first 2 chars of each, padded if short)
  prefix := upper(
    lpad(left(regexp_replace(p_first_name, '[^A-Za-z]', '', 'g'), 2), 2, 'X') ||
    lpad(left(regexp_replace(p_last_name,  '[^A-Za-z]', '', 'g'), 2), 2, 'X')
  );

  year_str := p_joining_year::text;

  -- Find the highest existing serial for this org + year
  select coalesce(
    max(
      nullif(
        right(employee_id, 4), ''
      )::int
    ), 0
  )
  into max_serial
  from profiles
  where organization_id = p_org_id
    and employee_id like '%' || year_str || '____'
    and length(employee_id) >= 8;

  new_serial := lpad((max_serial + 1)::text, 4, '0');

  return prefix || year_str || new_serial;
end;
$$;

-- ============================================================================
-- BOOTSTRAP RPC
-- Called right after auth.users sign-up, for "create a new company"
-- ============================================================================

create or replace function public.create_organization_and_admin(
  org_name text,
  emp_id text,
  name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
begin
  insert into organizations (name)
    values (org_name)
    returning id into new_org_id;

  insert into profiles (id, organization_id, employee_id, full_name, email, role)
    values (auth.uid(), new_org_id, emp_id, name, auth.email(), 'admin');

  return new_org_id;
end;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- Every policy scopes by organization_id first, role second.
-- ============================================================================

-- organizations
alter table public.organizations enable row level security;

create policy "Users can view their own organization"
  on public.organizations for select
  using (id = public.my_organization_id());

-- No client-side insert — bootstrapping goes through the RPC above.

-- profiles
alter table public.profiles enable row level security;

create policy "Users can view profiles in their organization"
  on public.profiles for select
  using (organization_id = public.my_organization_id());

create policy "Users can update their own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Admins can update any profile in their org"
  on public.profiles for update
  using (organization_id = public.my_organization_id() and public.is_admin())
  with check (organization_id = public.my_organization_id() and public.is_admin());

-- Admin insert is done via service-role (bypasses RLS), so no insert policy needed.

-- salary_structures
alter table public.salary_structures enable row level security;

create policy "Users can view their own salary"
  on public.salary_structures for select
  using (user_id = auth.uid() and organization_id = public.my_organization_id());

create policy "Admins can view all salaries in their org"
  on public.salary_structures for select
  using (organization_id = public.my_organization_id() and public.is_admin());

create policy "Admins can insert salary structures in their org"
  on public.salary_structures for insert
  with check (organization_id = public.my_organization_id() and public.is_admin());

create policy "Admins can update salary structures in their org"
  on public.salary_structures for update
  using (organization_id = public.my_organization_id() and public.is_admin())
  with check (organization_id = public.my_organization_id() and public.is_admin());

-- documents
alter table public.documents enable row level security;

create policy "Users can view their own documents"
  on public.documents for select
  using (user_id = auth.uid() and organization_id = public.my_organization_id());

create policy "Users can insert their own documents"
  on public.documents for insert
  with check (user_id = auth.uid() and organization_id = public.my_organization_id());

create policy "Admins can view all documents in their org"
  on public.documents for select
  using (organization_id = public.my_organization_id() and public.is_admin());

create policy "Admins can insert documents in their org"
  on public.documents for insert
  with check (organization_id = public.my_organization_id() and public.is_admin());

-- attendance
alter table public.attendance enable row level security;

create policy "Users can view their own attendance"
  on public.attendance for select
  using (user_id = auth.uid() and organization_id = public.my_organization_id());

create policy "Users can insert their own attendance"
  on public.attendance for insert
  with check (user_id = auth.uid() and organization_id = public.my_organization_id());

create policy "Users can update their own attendance"
  on public.attendance for update
  using (user_id = auth.uid() and organization_id = public.my_organization_id())
  with check (user_id = auth.uid() and organization_id = public.my_organization_id());

create policy "Admins can view all attendance in their org"
  on public.attendance for select
  using (organization_id = public.my_organization_id() and public.is_admin());

create policy "Admins can insert attendance in their org"
  on public.attendance for insert
  with check (organization_id = public.my_organization_id() and public.is_admin());

create policy "Admins can update attendance in their org"
  on public.attendance for update
  using (organization_id = public.my_organization_id() and public.is_admin())
  with check (organization_id = public.my_organization_id() and public.is_admin());

-- leave_requests
alter table public.leave_requests enable row level security;

create policy "Users can view their own leave requests"
  on public.leave_requests for select
  using (user_id = auth.uid() and organization_id = public.my_organization_id());

create policy "Users can insert their own leave requests"
  on public.leave_requests for insert
  with check (user_id = auth.uid() and organization_id = public.my_organization_id());

create policy "Admins can view all leave requests in their org"
  on public.leave_requests for select
  using (organization_id = public.my_organization_id() and public.is_admin());

create policy "Admins can update leave requests in their org"
  on public.leave_requests for update
  using (organization_id = public.my_organization_id() and public.is_admin())
  with check (organization_id = public.my_organization_id() and public.is_admin());

-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================

insert into storage.buckets (id, name, public)
  values ('profile-pictures', 'profile-pictures', true)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('documents', 'documents', false)
  on conflict (id) do nothing;

-- Storage policies: profile-pictures
create policy "Users can upload their own profile picture"
  on storage.objects for insert
  with check (
    bucket_id = 'profile-pictures'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own profile picture"
  on storage.objects for update
  using (
    bucket_id = 'profile-pictures'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Profile pictures are publicly readable"
  on storage.objects for select
  using (bucket_id = 'profile-pictures');

-- Storage policies: documents
create policy "Users can upload their own documents"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can view their own documents"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins can view all documents (simplified — checks role from profiles)
create policy "Admins can view all org documents"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and public.is_admin()
  );

-- ============================================================================
-- INDEXES
-- ============================================================================

create index idx_profiles_org on public.profiles (organization_id);
create index idx_attendance_org_date on public.attendance (organization_id, date);
create index idx_attendance_user_date on public.attendance (user_id, date);
create index idx_leave_requests_org on public.leave_requests (organization_id, status);
create index idx_salary_structures_user on public.salary_structures (user_id, effective_from desc);

-- ============================================================================
-- UPDATED_AT TRIGGER (auto-set updated_at on profiles changes)
-- ============================================================================

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();
