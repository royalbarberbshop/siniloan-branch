-- Secure admin/staff appointment status changes.
-- Appointment creation remains server-side only; do not add direct client INSERT policies.

create or replace function public.admin_update_appointment_status(
  p_appointment_id uuid,
  p_new_status public.appointment_status
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old_status public.appointment_status;
begin
  if not coalesce(public.is_staff_or_admin(), false) then
    raise exception 'Only active staff or administrators may update appointment status.'
      using errcode = '42501';
  end if;

  select a.status
    into v_old_status
    from public.appointments a
   where a.id = p_appointment_id
   for update;

  if not found then
    raise exception 'Appointment not found.' using errcode = 'P0002';
  end if;

  if not (
    (v_old_status = 'booked' and p_new_status in ('checked_in', 'cancelled', 'no_show')) or
    (v_old_status = 'checked_in' and p_new_status in ('waiting', 'cancelled')) or
    (v_old_status = 'waiting' and p_new_status in ('in_service', 'cancelled')) or
    (v_old_status = 'in_service' and p_new_status in ('completed', 'cancelled'))
  ) then
    raise exception 'Invalid appointment status transition: % to %.', v_old_status, p_new_status
      using errcode = '22023';
  end if;

  update public.appointments
     set status = p_new_status,
         updated_at = now()
   where id = p_appointment_id;

  insert into public.audit_log (actor_id, action, entity_table, entity_id, metadata)
  values (
    auth.uid(),
    'appointment_status_changed',
    'appointments',
    p_appointment_id::text,
    jsonb_build_object('from', v_old_status, 'to', p_new_status)
  );
end;
$$;

revoke all on function public.admin_update_appointment_status(uuid, public.appointment_status) from public;
grant execute on function public.admin_update_appointment_status(uuid, public.appointment_status) to authenticated;
