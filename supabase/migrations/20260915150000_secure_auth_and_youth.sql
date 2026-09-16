begin;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  role text not null default 'member' check (role in ('member', 'leader', 'admin')),
  status text not null default 'pending' check (status in ('pending', 'active', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.youths (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 120),
  preferred_name text check (preferred_name is null or char_length(preferred_name) <= 80),
  birth_date date,
  phone text check (phone is null or char_length(phone) <= 30),
  status text not null default 'active' check (status in ('active', 'inactive')),
  photo_path text,
  notes text check (notes is null or char_length(notes) <= 2000),
  created_by uuid not null references auth.users (id),
  updated_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.youths enable row level security;

revoke all on table public.profiles from anon;
revoke all on table public.youths from anon;
revoke all on table public.profiles from authenticated;
revoke all on table public.youths from authenticated;

grant select on table public.profiles to authenticated;
grant update (full_name, role, status) on table public.profiles to authenticated;
grant select, delete on table public.youths to authenticated;
grant insert (
  full_name,
  preferred_name,
  birth_date,
  phone,
  status,
  photo_path,
  notes,
  created_by,
  updated_by
) on table public.youths to authenticated;
grant update (
  full_name,
  preferred_name,
  birth_date,
  phone,
  status,
  photo_path,
  notes,
  updated_by
) on table public.youths to authenticated;

create function public.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
      and status = 'active'
  );
$$;

create function public.is_active_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role in ('admin', 'leader')
      and status = 'active'
  );
$$;

revoke all on function public.is_active_admin() from public, anon;
revoke all on function public.is_active_staff() from public, anon;
grant execute on function public.is_active_admin() to authenticated;
grant execute on function public.is_active_staff() to authenticated;

create policy "users can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) is not null and id = (select auth.uid()));

create policy "active admins can read all profiles"
on public.profiles
for select
to authenticated
using ((select public.is_active_admin()));

create policy "active admins can update profiles"
on public.profiles
for update
to authenticated
using ((select public.is_active_admin()))
with check ((select public.is_active_admin()));

create policy "active staff can read youths"
on public.youths
for select
to authenticated
using ((select public.is_active_staff()));

create policy "active staff can create youths"
on public.youths
for insert
to authenticated
with check (
  (select public.is_active_staff())
  and created_by = (select auth.uid())
  and updated_by = (select auth.uid())
);

create policy "active staff can update youths"
on public.youths
for update
to authenticated
using ((select public.is_active_staff()))
with check (
  (select public.is_active_staff())
  and updated_by = (select auth.uid())
);

create policy "active staff can delete youths"
on public.youths
for delete
to authenticated
using ((select public.is_active_staff()));

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger youths_set_updated_at
before update on public.youths
for each row execute function public.set_updated_at();

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role, status)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(new.email, '@', 1), ''),
      'Usuário'
    ),
    'member',
    'pending'
  );
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, full_name)
select
  id,
  coalesce(
    nullif(trim(raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(email, '@', 1), ''),
    'Usuário'
  )
from auth.users
on conflict (id) do nothing;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'youth-photos',
  'youth-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "active staff can read youth photos"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'youth-photos'
  and (select public.is_active_staff())
);

create policy "active staff can upload youth photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'youth-photos'
  and (select public.is_active_staff())
);

create policy "active staff can update youth photos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'youth-photos'
  and (select public.is_active_staff())
)
with check (
  bucket_id = 'youth-photos'
  and (select public.is_active_staff())
);

create policy "active staff can delete youth photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'youth-photos'
  and (select public.is_active_staff())
);

commit;
