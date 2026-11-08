-- Walk-ins join the waiting queue; they do not reserve a barber time slot.
-- Keep the customer's barber preference separately from the actual assignment.

alter table public.appointments
  add column if not exists preferred_barber_id uuid
    references public.barbers(id) on delete set null;

create or replace function public.admin_register_walk_in(
  p_customer_name text,
  p_customer_phone text,
  p_service_id uuid,
  p_barber_id uuid default null
)
returns table (id uuid, queue_number integer, queue_date date, starts_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid;
  v_service_duration integer;
  v_queue_date date;
  v_queue_number integer;
  v_starts_at timestamptz;
  v_appointment_id uuid;
  v_phone text;
begin
  if not coalesce(public.is_staff_or_admin(), false) then
    raise exception 'Only active staff or administrators may register walk-ins.'
      using errcode = '42501';
  end if;

  if nullif(trim(p_customer_name), '') is null or nullif(trim(p_customer_phone), '') is null then
    raise exception 'Customer name and phone number are required.' using errcode = '22023';
  end if;

  select s.duration_minutes into v_service_duration
    from public.services s
   where s.id = p_service_id and s.is_active = true;
  if not found then
    raise exception 'Selected service is unavailable.' using errcode = '22023';
  end if;

  if p_barber_id is not null and not exists (
    select 1 from public.barbers b where b.id = p_barber_id and b.is_active = true
  ) then
    raise exception 'Selected barber is unavailable.' using errcode = '22023';
  end if;

  v_phone := regexp_replace(trim(p_customer_phone), '\s+', '', 'g');
  insert into public.walk_in_customers(full_name, phone)
  values (trim(p_customer_name), v_phone)
  on conflict (phone) do update
    set full_name = excluded.full_name, updated_at = now()
  returning walk_in_customers.id into v_customer_id;

  v_starts_at := now();
  v_queue_date := (now() at time zone 'Asia/Manila')::date;
  perform pg_advisory_xact_lock(hashtext(v_queue_date::text)::bigint);
  select coalesce(max(a.queue_number), 0) + 1 into v_queue_number
    from public.appointments a
   where a.queue_date = v_queue_date;

  -- barber_id stays NULL while waiting, so the exclusion constraint does not
  -- treat a queue entry as a scheduled appointment reservation.
  insert into public.appointments (
    walk_in_customer_id, service_id, barber_id, preferred_barber_id,
    starts_at, ends_at, queue_date, queue_number, status, payment_status, qr_token_hash
  ) values (
    v_customer_id, p_service_id, null, p_barber_id,
    v_starts_at, v_starts_at + make_interval(mins => v_service_duration),
    v_queue_date, v_queue_number, 'waiting', 'unpaid',
    encode(extensions.digest(extensions.gen_random_bytes(32), 'sha256'), 'hex')
  ) returning appointments.id into v_appointment_id;

  insert into public.audit_log(actor_id, action, entity_table, entity_id, metadata)
  values (auth.uid(), 'walk_in_registered', 'appointments', v_appointment_id::text,
          jsonb_build_object('queue_number', v_queue_number,
                             'walk_in_customer_id', v_customer_id,
                             'preferred_barber_id', p_barber_id));

  return query select v_appointment_id, v_queue_number, v_queue_date, v_starts_at;
end;
$$;

revoke all on function public.admin_register_walk_in(text, text, uuid, uuid) from public;
grant execute on function public.admin_register_walk_in(text, text, uuid, uuid) to authenticated;
