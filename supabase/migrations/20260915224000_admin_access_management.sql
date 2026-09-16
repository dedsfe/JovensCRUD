begin;

alter table public.profiles
  add column email text;

update public.profiles as profile
set email = auth_user.email
from auth.users as auth_user
where auth_user.id = profile.id
  and profile.email is null;

alter table public.profiles
  add constraint profiles_email_length
    check (email is null or char_length(email) <= 320) not valid;

create unique index profiles_email_unique
on public.profiles (lower(email))
where email is not null;

create index profiles_access_queue
on public.profiles (status, role, created_at desc);

create table public.profile_access_audit (
  id bigint generated always as identity primary key,
  target_user_id uuid not null,
  changed_by uuid not null,
  previous_role text not null check (previous_role in ('member', 'leader', 'admin')),
  next_role text not null check (next_role in ('member', 'leader', 'admin')),
  previous_status text not null check (previous_status in ('pending', 'active', 'blocked')),
  next_status text not null check (next_status in ('pending', 'active', 'blocked')),
  created_at timestamptz not null default now()
);

alter table public.profile_access_audit enable row level security;

revoke all on table public.profile_access_audit from anon, authenticated;
grant select on table public.profile_access_audit to authenticated;

create policy "active admins can read access audit"
on public.profile_access_audit
for select
to authenticated
using ((select public.is_active_admin()));

revoke update (role, status) on table public.profiles from authenticated;

drop policy if exists "active admins can update profiles" on public.profiles;

create policy "users can update their own name"
on public.profiles
for update
to authenticated
using ((select auth.uid()) is not null and id = (select auth.uid()))
with check ((select auth.uid()) is not null and id = (select auth.uid()));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, role, status)
  values (
    new.id,
    coalesce(
      nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(pg_catalog.split_part(new.email, '@', 1), ''),
      'Usuário'
    ),
    new.email,
    'member',
    'pending'
  );
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create function public.handle_user_email_updated()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set email = new.email
  where id = new.id;
  return new;
end;
$$;

revoke all on function public.handle_user_email_updated()
from public, anon, authenticated;

create trigger on_auth_user_email_updated
after update of email on auth.users
for each row
when (old.email is distinct from new.email)
execute function public.handle_user_email_updated();

create function public.admin_update_profile_access(
  target_user_id uuid,
  next_role text,
  next_status text
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := (select auth.uid());
  current_profile public.profiles%rowtype;
  updated_profile public.profiles%rowtype;
  remaining_active_admins integer;
begin
  if actor_user_id is null or not (select public.is_active_admin()) then
    raise exception using
      errcode = '42501',
      message = 'Somente administradores ativos podem gerenciar acessos.';
  end if;

  if next_role not in ('member', 'leader', 'admin') then
    raise exception using
      errcode = '22023',
      message = 'A função selecionada é inválida.';
  end if;

  if next_status not in ('pending', 'active', 'blocked') then
    raise exception using
      errcode = '22023',
      message = 'A situação selecionada é inválida.';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('umadeb-profile-access-management')
  );

  select *
  into current_profile
  from public.profiles
  where id = target_user_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'A conta selecionada não foi encontrada.';
  end if;

  if current_profile.role = 'admin'
    and current_profile.status = 'active'
    and not (next_role = 'admin' and next_status = 'active') then
    select count(*)
    into remaining_active_admins
    from public.profiles
    where id <> target_user_id
      and role = 'admin'
      and status = 'active';

    if remaining_active_admins = 0 then
      raise exception using
        errcode = '23514',
        message = 'A UMADEB precisa manter pelo menos um administrador ativo.';
    end if;
  end if;

  if current_profile.role = next_role and current_profile.status = next_status then
    return current_profile;
  end if;

  update public.profiles
  set role = next_role,
      status = next_status
  where id = target_user_id
  returning * into updated_profile;

  insert into public.profile_access_audit (
    target_user_id,
    changed_by,
    previous_role,
    next_role,
    previous_status,
    next_status
  ) values (
    target_user_id,
    actor_user_id,
    current_profile.role,
    next_role,
    current_profile.status,
    next_status
  );

  return updated_profile;
end;
$$;

revoke all on function public.admin_update_profile_access(uuid, text, text)
from public, anon;
grant execute on function public.admin_update_profile_access(uuid, text, text)
to authenticated;

commit;
