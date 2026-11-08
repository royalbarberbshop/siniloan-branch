-- Royal Barber Shop Phase 5: database-backed POS transactions.
-- Run after the initial schema and the prior admin/walk-in migrations.

alter table public.pos_transactions
  add column if not exists customer_name_snapshot text;

create or replace function public.admin_record_pos_transaction(
  p_appointment_id uuid,
  p_service_name_snapshot text,
  p_customer_name_snapshot text,
  p_amount_pesos numeric,
  p_payment_method text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_transaction_id uuid;
  v_appointment public.appointments%rowtype;
  v_customer_id uuid;
  v_method public.payment_method;
begin
  if v_actor is null or not coalesce(public.is_staff_or_admin(), false) then
    raise exception 'Only authenticated staff or administrators can record POS transactions.';
  end if;

  if p_service_name_snapshot is null or btrim(p_service_name_snapshot) = '' then
    raise exception 'Add at least one service to the transaction.';
  end if;
  if p_amount_pesos is null or p_amount_pesos < 0 then
    raise exception 'Transaction amount must be zero or greater.';
  end if;

  begin
    v_method := lower(p_payment_method)::public.payment_method;
  exception when others then
    raise exception 'Unsupported payment method.';
  end;

  if p_appointment_id is not null then
    select * into v_appointment
    from public.appointments
    where id = p_appointment_id
    for update;

    if not found then
      raise exception 'The linked appointment could not be found.';
    end if;
    if v_appointment.status not in ('in_service', 'completed') then
      raise exception 'Only appointments marked In Service or Completed can be checked out.';
    end if;
    if v_appointment.payment_status = 'paid' then
      raise exception 'This appointment has already been paid.';
    end if;
    v_customer_id := v_appointment.customer_id;
  else
    v_customer_id := null;
  end if;

  insert into public.pos_transactions (
    appointment_id,
    customer_id,
    staff_id,
    service_name_snapshot,
    customer_name_snapshot,
    amount_pesos,
    payment_method,
    payment_status
  ) values (
    p_appointment_id,
    v_customer_id,
    v_actor,
    btrim(p_service_name_snapshot),
    nullif(btrim(coalesce(p_customer_name_snapshot, '')), ''),
    p_amount_pesos,
    v_method,
    'paid'
  )
  returning id into v_transaction_id;

  if p_appointment_id is not null then
    update public.appointments
    set status = 'completed', payment_status = 'paid', updated_at = now()
    where id = p_appointment_id;
  end if;

  insert into public.audit_log (actor_id, action, entity_table, entity_id, metadata)
  values (
    v_actor,
    'pos_payment_recorded',
    'pos_transactions',
    v_transaction_id::text,
    jsonb_build_object(
      'appointment_id', p_appointment_id,
      'amount_pesos', p_amount_pesos,
      'payment_method', v_method
    )
  );

  return v_transaction_id;
end;
$$;

revoke all on function public.admin_record_pos_transaction(uuid, text, text, numeric, text) from public;
grant execute on function public.admin_record_pos_transaction(uuid, text, text, numeric, text) to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'pos_transactions'
  ) then
    alter publication supabase_realtime add table public.pos_transactions;
  end if;
end
$$;
