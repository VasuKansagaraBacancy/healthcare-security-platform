do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'invite_status'
  ) then
    create type public.invite_status as enum ('pending', 'accepted', 'revoked');
  end if;
end $$;

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

create index if not exists idx_org_invites_org_status on public.organization_invites (organization_id, status, invited_at desc);
create unique index if not exists idx_org_invites_pending_email on public.organization_invites (organization_id, lower(email))
where status = 'pending';

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

alter table public.organization_invites enable row level security;

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
