create extension if not exists pgcrypto;

create type public.user_role as enum ('admin', 'analyst', 'auditor');
create type public.device_type as enum (
  'medical_device',
  'server',
  'workstation',
  'network',
  'cloud_service',
  'application'
);
create type public.risk_level as enum ('low', 'medium', 'high', 'critical');
create type public.vulnerability_severity as enum ('low', 'medium', 'high', 'critical');
create type public.vulnerability_status as enum ('open', 'investigating', 'remediated', 'accepted_risk');
create type public.incident_severity as enum ('low', 'medium', 'high', 'critical');
create type public.incident_status as enum ('open', 'investigating', 'mitigated', 'closed');
create type public.compliance_status as enum ('compliant', 'in_progress', 'at_risk', 'non_compliant');
create type public.invite_status as enum ('pending', 'accepted', 'revoked');

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) >= 2),
  created_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role public.user_role not null default 'analyst',
  organization_id uuid references public.organizations(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.organization_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role public.user_role not null,
  invited_by uuid references public.users(id) on delete set null,
  token uuid not null unique default gen_random_uuid(),
  status public.invite_status not null default 'pending',
  invited_at timestamptz not null default now(),
  accepted_at timestamptz
);

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type public.device_type not null,
  risk_level public.risk_level not null default 'medium',
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.vulnerabilities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  severity public.vulnerability_severity not null,
  status public.vulnerability_status not null default 'open',
  device_id uuid not null references public.devices(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  severity public.incident_severity not null,
  status public.incident_status not null default 'open',
  organization_id uuid not null references public.organizations(id) on delete cascade,
  reported_by uuid references public.users(id) on delete set null,
  owner_user_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.compliance_checks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status public.compliance_status not null default 'in_progress',
  score numeric(5,2) not null default 0 check (score >= 0 and score <= 100),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete cascade,
  action text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_users_organization_id on public.users (organization_id);
create index if not exists idx_org_invites_org_status on public.organization_invites (organization_id, status, invited_at desc);
create unique index if not exists idx_org_invites_pending_email on public.organization_invites (organization_id, lower(email))
where status = 'pending';
create index if not exists idx_devices_organization_created on public.devices (organization_id, created_at desc);
create index if not exists idx_vulnerabilities_device_status on public.vulnerabilities (device_id, status, severity);
create index if not exists idx_incidents_org_status on public.incidents (organization_id, status, severity);
create index if not exists idx_compliance_org_status on public.compliance_checks (organization_id, status);
create index if not exists idx_audit_logs_org_created on public.audit_logs (organization_id, created_at desc);

create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id
  from public.users
  where id = auth.uid();
$$;

create or replace function public.is_org_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.get_pending_invite_details(invite_token uuid)
returns table (
  email text,
  role public.user_role,
  organization_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select invites.email, invites.role, organizations.name
  from public.organization_invites invites
  join public.organizations on organizations.id = invites.organization_id
  where invites.token = invite_token
    and invites.status = 'pending'
  limit 1;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  requested_role public.user_role;
  invite_token uuid;
  matched_invite public.organization_invites;
begin
  invite_token := nullif(new.raw_user_meta_data ->> 'invite_token', '')::uuid;

  if invite_token is not null then
    select *
    into matched_invite
    from public.organization_invites
    where token = invite_token
      and status = 'pending'
      and lower(email) = lower(new.email)
    limit 1;
  end if;

  if matched_invite.id is not null then
    new_org_id := matched_invite.organization_id;
    requested_role := matched_invite.role;
  else
    requested_role := 'admin'::public.user_role;

    insert into public.organizations (name)
    values (
      coalesce(
        nullif(new.raw_user_meta_data ->> 'organization_name', ''),
        split_part(new.email, '@', 1) || ' Health'
      )
    )
    returning id into new_org_id;
  end if;

  insert into public.users (id, email, role, organization_id)
  values (new.id, new.email, requested_role, new_org_id)
  on conflict (id) do update
  set email = excluded.email,
      role = excluded.role,
      organization_id = coalesce(public.users.organization_id, excluded.organization_id);

  if matched_invite.id is not null then
    update public.organization_invites
    set status = 'accepted',
        accepted_at = now()
    where id = matched_invite.id;
  end if;

  insert into public.audit_logs (user_id, organization_id, action)
  values (
    new.id,
    new_org_id,
    case
      when matched_invite.id is not null then 'user_joined_via_invite'
      else 'user_registered'
    end
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.organizations enable row level security;
alter table public.users enable row level security;
alter table public.organization_invites enable row level security;
alter table public.devices enable row level security;
alter table public.vulnerabilities enable row level security;
alter table public.incidents enable row level security;
alter table public.compliance_checks enable row level security;
alter table public.audit_logs enable row level security;

create policy "organizations_select_same_org"
on public.organizations
for select
to authenticated
using (id = public.current_org_id());

create policy "users_select_same_org"
on public.users
for select
to authenticated
using (organization_id = public.current_org_id());

create policy "users_update_self_or_admin"
on public.users
for update
to authenticated
using (id = auth.uid() or public.is_org_admin())
with check (organization_id = public.current_org_id());

create policy "organization_invites_select_same_org_admin"
on public.organization_invites
for select
to authenticated
using (organization_id = public.current_org_id() and public.is_org_admin());

create policy "organization_invites_insert_same_org_admin"
on public.organization_invites
for insert
to authenticated
with check (organization_id = public.current_org_id() and public.is_org_admin());

create policy "organization_invites_update_same_org_admin"
on public.organization_invites
for update
to authenticated
using (organization_id = public.current_org_id() and public.is_org_admin())
with check (organization_id = public.current_org_id() and public.is_org_admin());

create policy "devices_select_same_org"
on public.devices
for select
to authenticated
using (organization_id = public.current_org_id());

create policy "devices_insert_same_org"
on public.devices
for insert
to authenticated
with check (organization_id = public.current_org_id());

create policy "devices_update_same_org"
on public.devices
for update
to authenticated
using (organization_id = public.current_org_id())
with check (organization_id = public.current_org_id());

create policy "devices_delete_admin_only"
on public.devices
for delete
to authenticated
using (organization_id = public.current_org_id() and public.is_org_admin());

create policy "vulnerabilities_select_same_org"
on public.vulnerabilities
for select
to authenticated
using (
  exists (
    select 1
    from public.devices
    where devices.id = vulnerabilities.device_id
      and devices.organization_id = public.current_org_id()
  )
);

create policy "vulnerabilities_insert_same_org"
on public.vulnerabilities
for insert
to authenticated
with check (
  exists (
    select 1
    from public.devices
    where devices.id = vulnerabilities.device_id
      and devices.organization_id = public.current_org_id()
  )
);

create policy "vulnerabilities_update_same_org"
on public.vulnerabilities
for update
to authenticated
using (
  exists (
    select 1
    from public.devices
    where devices.id = vulnerabilities.device_id
      and devices.organization_id = public.current_org_id()
  )
)
with check (
  exists (
    select 1
    from public.devices
    where devices.id = vulnerabilities.device_id
      and devices.organization_id = public.current_org_id()
  )
);

create policy "vulnerabilities_delete_admin_only"
on public.vulnerabilities
for delete
to authenticated
using (
  public.is_org_admin()
  and exists (
    select 1
    from public.devices
    where devices.id = vulnerabilities.device_id
      and devices.organization_id = public.current_org_id()
  )
);

create policy "incidents_select_same_org"
on public.incidents
for select
to authenticated
using (organization_id = public.current_org_id());

create policy "incidents_insert_same_org"
on public.incidents
for insert
to authenticated
with check (organization_id = public.current_org_id());

create policy "incidents_update_same_org"
on public.incidents
for update
to authenticated
using (organization_id = public.current_org_id())
with check (organization_id = public.current_org_id());

create policy "incidents_delete_admin_only"
on public.incidents
for delete
to authenticated
using (organization_id = public.current_org_id() and public.is_org_admin());

create policy "compliance_select_same_org"
on public.compliance_checks
for select
to authenticated
using (organization_id = public.current_org_id());

create policy "compliance_insert_same_org"
on public.compliance_checks
for insert
to authenticated
with check (organization_id = public.current_org_id());

create policy "compliance_update_same_org"
on public.compliance_checks
for update
to authenticated
using (organization_id = public.current_org_id())
with check (organization_id = public.current_org_id());

create policy "compliance_delete_admin_only"
on public.compliance_checks
for delete
to authenticated
using (organization_id = public.current_org_id() and public.is_org_admin());

create policy "audit_logs_select_same_org"
on public.audit_logs
for select
to authenticated
using (organization_id = public.current_org_id());

create policy "audit_logs_insert_same_org"
on public.audit_logs
for insert
to authenticated
with check (organization_id = public.current_org_id());
