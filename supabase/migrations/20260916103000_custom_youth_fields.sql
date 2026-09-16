begin;

alter table public.youths
  add column custom_data jsonb not null default '{}'::jsonb,
  add constraint youths_custom_data_object check (jsonb_typeof(custom_data) = 'object');

grant insert (custom_data) on table public.youths to authenticated;
grant update (custom_data) on table public.youths to authenticated;

create table public.youth_custom_fields (
  id uuid primary key default gen_random_uuid(),
  label text not null check (char_length(label) between 2 and 80),
  field_type text not null check (field_type in ('text', 'textarea', 'number', 'date', 'boolean', 'select')),
  required boolean not null default false,
  options jsonb not null default '[]'::jsonb check (jsonb_typeof(options) = 'array'),
  position integer not null default 0 check (position >= 0),
  is_active boolean not null default true,
  created_by uuid not null references auth.users (id),
  updated_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index youth_custom_fields_label_unique on public.youth_custom_fields (lower(label));
create index youth_custom_fields_display_order on public.youth_custom_fields (is_active desc, position, created_at);

alter table public.youth_custom_fields enable row level security;
revoke all on table public.youth_custom_fields from anon, authenticated;
grant select on table public.youth_custom_fields to authenticated;
grant insert (label, field_type, required, options, position, is_active, created_by, updated_by)
  on table public.youth_custom_fields to authenticated;
grant update (label, field_type, required, options, position, is_active, updated_by)
  on table public.youth_custom_fields to authenticated;

create policy "active staff can read active custom fields"
on public.youth_custom_fields for select to authenticated
using (is_active and (select public.is_active_staff()));

create policy "active admins can read all custom fields"
on public.youth_custom_fields for select to authenticated
using ((select public.is_active_admin()));

create policy "active admins can create custom fields"
on public.youth_custom_fields for insert to authenticated
with check (
  (select public.is_active_admin())
  and created_by = (select auth.uid())
  and updated_by = (select auth.uid())
);

create policy "active admins can update custom fields"
on public.youth_custom_fields for update to authenticated
using ((select public.is_active_admin()))
with check ((select public.is_active_admin()) and updated_by = (select auth.uid()));

create trigger youth_custom_fields_set_updated_at
before update on public.youth_custom_fields
for each row execute function public.set_updated_at();

commit;
