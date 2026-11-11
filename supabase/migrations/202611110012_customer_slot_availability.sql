-- Customer-facing appointment availability.
-- Returns 30-minute start times and marks slots unavailable when no eligible
-- active barber is working and free for the full selected service duration.
create or replace function public.customer_get_available_slots(
  p_service_id uuid,
  p_date date,
  p_barber_id uuid default null
)
returns table (slot_time time, is_available boolean)
language sql
stable
security definer
set search_path = ''
as $$
  with service as (
    select s.duration_minutes
    from public.services s
    where s.id = p_service_id and s.is_active = true
  ), eligible_barbers as (
    select b.id, h.opens_at, h.closes_at
    from public.barbers b
    join public.barber_working_hours h on h.barber_id = b.id
    where b.is_active = true
      and (p_barber_id is null or b.id = p_barber_id)
      and h.weekday = extract(dow from p_date)::smallint
      and h.is_closed = false
  ), bounds as (
    select min(opens_at) as opens_at, max(closes_at) as closes_at
    from eligible_barbers
  ), candidate_slots as (
    select gs as local_start
    from bounds bd
    cross join lateral generate_series(
      p_date::timestamp + bd.opens_at,
      p_date::timestamp + bd.closes_at - interval '1 minute',
      interval '30 minutes'
    ) gs
    where bd.opens_at is not null
  )
  select
    cs.local_start::time as slot_time,
    exists (
      select 1
      from eligible_barbers eb
      cross join service sv
      where cs.local_start::time >= eb.opens_at
        and (cs.local_start + make_interval(mins => sv.duration_minutes))::time <= eb.closes_at
        and (cs.local_start at time zone 'Asia/Manila') > now()
        and not exists (
          select 1
          from public.appointments a
          where a.barber_id = eb.id
            and a.status not in ('cancelled', 'no_show')
            and tstzrange(a.starts_at, a.ends_at, '[)') && tstzrange(
              cs.local_start at time zone 'Asia/Manila',
              (cs.local_start + make_interval(mins => sv.duration_minutes)) at time zone 'Asia/Manila',
              '[)'
            )
        )
    ) as is_available
  from candidate_slots cs
  order by cs.local_start;
$$;

revoke all on function public.customer_get_available_slots(uuid, date, uuid) from public;
grant execute on function public.customer_get_available_slots(uuid, date, uuid) to authenticated;
