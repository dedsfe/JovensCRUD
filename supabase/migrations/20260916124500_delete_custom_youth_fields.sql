begin;

create or replace function public.delete_youth_custom_field(p_field_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_active_admin() then
    raise exception 'Apenas administradores ativos podem apagar campos.';
  end if;

  update public.youths
  set custom_data = custom_data - p_field_id::text
  where custom_data ? p_field_id::text;

  delete from public.youth_custom_fields
  where id = p_field_id;

  if not found then
    raise exception 'Campo não encontrado.';
  end if;
end;
$$;

revoke all on function public.delete_youth_custom_field(uuid) from public, anon;
grant execute on function public.delete_youth_custom_field(uuid) to authenticated;

commit;
