begin;

-- NOT VALID preserves older incomplete rows while enforcing these rules for
-- every new insert and every row updated from now on.
alter table public.youths
  add constraint youths_preferred_name_required
    check (
      preferred_name is not null
      and char_length(btrim(preferred_name)) between 2 and 80
    ) not valid,
  add constraint youths_birth_date_required
    check (birth_date is not null and birth_date <= current_date) not valid,
  add constraint youths_phone_required
    check (
      phone is not null
      and char_length(regexp_replace(phone, '[^0-9]', '', 'g')) between 10 and 11
    ) not valid;

commit;
