begin;

alter table public.youths
  drop constraint youths_status_check;

alter table public.youths
  add constraint youths_status_check
  check (status in ('active', 'inactive', 'archived'));

commit;
