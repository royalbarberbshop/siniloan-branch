-- Public, privacy-safe snapshot of today's active queue.
-- Only queue number, service, barber, appointment time and status are exposed.
create or replace function public.customer_get_today_live_queue()
returns table (
  queue_number integer,
  status text,
  service_name text,
  barber_name text,
  starts_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    a.queue_number,
    a.status::text,
    coalesce(s.name, 'Service'),
    coalesce(b.display_name, 'To be assigned'),
    a.starts_at
  from public.appointments a
  left join public.services s on s.id = a.service_id
  left join public.barbers b on b.id = a.barber_id
  where a.queue_date = (pg_catalog.now() at time zone 'Asia/Manila')::date
    and a.status::text in ('checked_in', 'waiting', 'in_service')
  order by
    case a.status::text when 'in_service' then 0 when 'waiting' then 1 else 2 end,
    a.queue_number asc;
$$;

revoke all on function public.customer_get_today_live_queue() from public;
grant execute on function public.customer_get_today_live_queue() to anon, authenticated;
