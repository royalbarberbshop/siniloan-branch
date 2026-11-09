-- Customer self-service booking. All writes are validated atomically in the database.
-- Run this migration in BOTH LIVE and DEMO Supabase projects before enabling /book.

create or replace function public.customer_create_appointment(
  p_service_id uuid,
  p_barber_id uuid,
  p_starts_at timestamptz
)
returns table (id uuid, queue_number integer, queue_date date, starts_at timestamptz, status public.appointment_status)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer uuid := auth.uid();
  v_duration integer;
  v_end timestamptz;
  v_queue_date date;
  v_queue_number integer;
  v_barber uuid;
  v_appointment uuid;
  v_weekday smallint;
  v_local_start time;
  v_local_end time;
begin
  if v_customer is null then
    raise exception 'Please sign in before booking.' using errcode = '42501';
  end if;
  if p_starts_at is null or p_starts_at <= now() then
    raise exception 'Choose an appointment time in the future.' using errcode = '22023';
  end if;

  select s.duration_minutes into v_duration
    from public.services s where s.id = p_service_id and s.is_active = true;
  if not found then raise exception 'The selected service is no longer available.' using errcode = '22023'; end if;

  v_end := p_starts_at + make_interval(mins => v_duration);
  v_queue_date := (p_starts_at at time zone 'Asia/Manila')::date;
  v_weekday := extract(dow from (p_starts_at at time zone 'Asia/Manila'))::smallint;
  v_local_start := (p_starts_at at time zone 'Asia/Manila')::time;
  v_local_end := (v_end at time zone 'Asia/Manila')::time;

  -- Serialize same-date booking attempts so queue numbers remain unique.
  perform pg_advisory_xact_lock(hashtext('customer-booking-' || v_queue_date::text)::bigint);

  if p_barber_id is not null then
    select b.id into v_barber
      from public.barbers b
      join public.barber_working_hours h on h.barber_id = b.id
     where b.id = p_barber_id and b.is_active = true
       and h.weekday = v_weekday and h.is_closed = false
       and v_local_start >= h.opens_at and v_local_end <= h.closes_at
       and not exists (
         select 1 from public.appointments a
          where a.barber_id = b.id
            and a.status not in ('cancelled','no_show')
            and tstzrange(a.starts_at,a.ends_at,'[)') && tstzrange(p_starts_at,v_end,'[)')
       )
     for update of b;
  else
    select b.id into v_barber
      from public.barbers b
      join public.barber_working_hours h on h.barber_id = b.id
     where b.is_active = true and h.weekday = v_weekday and h.is_closed = false
       and v_local_start >= h.opens_at and v_local_end <= h.closes_at
       and not exists (
         select 1 from public.appointments a
          where a.barber_id = b.id
            and a.status not in ('cancelled','no_show')
            and tstzrange(a.starts_at,a.ends_at,'[)') && tstzrange(p_starts_at,v_end,'[)')
       )
     order by b.display_name
     limit 1
     for update of b;
  end if;

  if v_barber is null then
    raise exception 'That time is unavailable for the selected barber. Please choose another time or barber.' using errcode = '23P01';
  end if;

  select coalesce(max(a.queue_number),0)+1 into v_queue_number
    from public.appointments a where a.queue_date = v_queue_date;

  insert into public.appointments (
    customer_id, service_id, barber_id, starts_at, ends_at,
    queue_date, queue_number, status, payment_status, qr_token_hash
  ) values (
    v_customer, p_service_id, v_barber, p_starts_at, v_end,
    v_queue_date, v_queue_number, 'booked', 'unpaid',
    encode(extensions.digest(extensions.gen_random_bytes(32),'sha256'),'hex')
  ) returning appointments.id into v_appointment;

  insert into public.audit_log(actor_id,action,entity_table,entity_id,metadata)
  values(v_customer,'customer_appointment_created','appointments',v_appointment::text,
    jsonb_build_object('queue_number',v_queue_number,'service_id',p_service_id,'barber_id',v_barber));

  return query select v_appointment,v_queue_number,v_queue_date,p_starts_at,'booked'::public.appointment_status;
exception
  when exclusion_violation or unique_violation then
    raise exception 'That time was just booked. Please choose another available time.' using errcode = '23P01';
end;
$$;

revoke all on function public.customer_create_appointment(uuid,uuid,timestamptz) from public;
grant execute on function public.customer_create_appointment(uuid,uuid,timestamptz) to authenticated;
