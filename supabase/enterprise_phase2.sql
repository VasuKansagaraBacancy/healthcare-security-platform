do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'training_completion_status'
  ) then
    create type public.training_completion_status as enum (
      'assigned',
      'in_progress',
      'completed',
      'overdue'
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'security_alert_status'
  ) then
    create type public.security_alert_status as enum (
      'open',
      'acknowledged',
      'resolved'
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'backup_job_status'
  ) then
    create type public.backup_job_status as enum (
      'success',
      'warning',
      'failed',
      'running'
    );
  end if;
end $$;

create table if not exists public.risk_assessments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  risk_score integer not null check (risk_score >= 0),
  critical_vulnerabilities integer not null default 0 check (critical_vulnerabilities >= 0),
  high_vulnerabilities integer not null default 0 check (high_vulnerabilities >= 0),
  medium_vulnerabilities integer not null default 0 check (medium_vulnerabilities >= 0),
  open_incidents integer not null default 0 check (open_incidents >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.user_activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  action text not null,
  module text not null,
  ip_address text,
  created_at timestamptz not null default now()
);

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  risk_level public.risk_level not null default 'medium',
  compliance_status public.compliance_status not null default 'in_progress',
  contact_email text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.training_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  training_name text not null,
  completion_status public.training_completion_status not null default 'assigned',
  completion_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.security_alerts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  severity public.vulnerability_severity not null,
  message text not null,
  status public.security_alert_status not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists public.backup_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  status public.backup_job_status not null,
  last_backup_time timestamptz not null,
  backup_size numeric(12,2) not null default 0 check (backup_size >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_risk_assessments_org_created
  on public.risk_assessments (organization_id, created_at desc);
create index if not exists idx_user_activity_logs_user_created
  on public.user_activity_logs (user_id, created_at desc);
create index if not exists idx_vendors_org_created
  on public.vendors (organization_id, created_at desc);
create index if not exists idx_training_records_user_created
  on public.training_records (user_id, created_at desc);
create index if not exists idx_security_alerts_org_status
  on public.security_alerts (organization_id, status, created_at desc);
create index if not exists idx_backup_jobs_org_created
  on public.backup_jobs (organization_id, created_at desc);

alter table public.risk_assessments enable row level security;
alter table public.user_activity_logs enable row level security;
alter table public.vendors enable row level security;
alter table public.training_records enable row level security;
alter table public.security_alerts enable row level security;
alter table public.backup_jobs enable row level security;

create policy "risk_assessments_select_same_org"
on public.risk_assessments
for select
to authenticated
using (organization_id = public.current_org_id());

create policy "risk_assessments_insert_same_org"
on public.risk_assessments
for insert
to authenticated
with check (organization_id = public.current_org_id());

create policy "vendors_select_same_org"
on public.vendors
for select
to authenticated
using (organization_id = public.current_org_id());

create policy "vendors_insert_same_org"
on public.vendors
for insert
to authenticated
with check (organization_id = public.current_org_id());

create policy "vendors_update_same_org"
on public.vendors
for update
to authenticated
using (organization_id = public.current_org_id())
with check (organization_id = public.current_org_id());

create policy "vendors_delete_admin_only"
on public.vendors
for delete
to authenticated
using (organization_id = public.current_org_id() and public.is_org_admin());

create policy "user_activity_logs_select_same_org"
on public.user_activity_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.users
    where users.id = user_activity_logs.user_id
      and users.organization_id = public.current_org_id()
  )
);

create policy "user_activity_logs_insert_self"
on public.user_activity_logs
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.users
    where users.id = user_activity_logs.user_id
      and users.organization_id = public.current_org_id()
  )
);

create policy "training_records_select_same_org"
on public.training_records
for select
to authenticated
using (
  exists (
    select 1
    from public.users
    where users.id = training_records.user_id
      and users.organization_id = public.current_org_id()
  )
);

create policy "training_records_insert_same_org"
on public.training_records
for insert
to authenticated
with check (
  exists (
    select 1
    from public.users
    where users.id = training_records.user_id
      and users.organization_id = public.current_org_id()
  )
);

create policy "training_records_update_same_org"
on public.training_records
for update
to authenticated
using (
  exists (
    select 1
    from public.users
    where users.id = training_records.user_id
      and users.organization_id = public.current_org_id()
  )
)
with check (
  exists (
    select 1
    from public.users
    where users.id = training_records.user_id
      and users.organization_id = public.current_org_id()
  )
);

create policy "training_records_delete_admin_only"
on public.training_records
for delete
to authenticated
using (
  public.is_org_admin()
  and exists (
    select 1
    from public.users
    where users.id = training_records.user_id
      and users.organization_id = public.current_org_id()
  )
);

create policy "security_alerts_select_same_org"
on public.security_alerts
for select
to authenticated
using (organization_id = public.current_org_id());

create policy "security_alerts_insert_same_org"
on public.security_alerts
for insert
to authenticated
with check (organization_id = public.current_org_id());

create policy "security_alerts_update_same_org"
on public.security_alerts
for update
to authenticated
using (organization_id = public.current_org_id())
with check (organization_id = public.current_org_id());

create policy "backup_jobs_select_same_org"
on public.backup_jobs
for select
to authenticated
using (organization_id = public.current_org_id());

create policy "backup_jobs_insert_same_org"
on public.backup_jobs
for insert
to authenticated
with check (organization_id = public.current_org_id());

create policy "backup_jobs_update_same_org"
on public.backup_jobs
for update
to authenticated
using (organization_id = public.current_org_id())
with check (organization_id = public.current_org_id());
