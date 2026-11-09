-- Customer Directory: allow active staff/admin to create walk-in/customer-only records.
-- Authenticated customers remain in profiles; guest/walk-in records remain in walk_in_customers.
create or replace function public.admin_create_customer_directory_entry(
  p_customer_name text,
  p_customer_phone text
)
returns table (id uuid, full_name text, phone text, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone text;
begin
  if not coalesce(public.is_staff_or_admin(), false) then
    raise exception 'Only active staff or administrators may add customer records.'
      using errcode = '42501';
  end if;
  if nullif(trim(p_customer_name), '') is null or nullif(trim(p_customer_phone), '') is null then
    raise exception 'Customer name and phone number are required.' using errcode = '22023';
  end if;
  v_phone := regexp_replace(trim(p_customer_phone), '\s+', '', 'g');
  return query
    insert into public.walk_in_customers as w(full_name, phone)
    values (trim(p_customer_name), v_phone)
    on conflict (phone) do update
      set full_name = excluded.full_name, updated_at = now()
    returning w.id, w.full_name, w.phone, w.created_at;
end;
$$;
revoke all on function public.admin_create_customer_directory_entry(text, text) from public;
grant execute on function public.admin_create_customer_directory_entry(text, text) to authenticated;
