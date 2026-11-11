-- Royal Barber Shop: customer GCash/QR payment options
-- Apply to BOTH LIVE and DEMO only after reviewing and testing.
-- This migration records online payment submissions and admin approval.

alter table public.appointments
  add column if not exists payment_option text,
  add column if not exists service_price_snapshot numeric(10,2),
  add column if not exists amount_paid_pesos numeric(10,2) not null default 0;

alter table public.appointments
  drop constraint if exists appointments_payment_option_check;
alter table public.appointments
  add constraint appointments_payment_option_check
  check (payment_option is null or payment_option in ('deposit_50', 'full_100'));

alter table public.payments
  add column if not exists payment_option text,
  add column if not exists proof_path text,
  add column if not exists verified_by uuid references public.profiles(id),
  add column if not exists verified_at timestamptz;

alter table public.payments
  drop constraint if exists payments_payment_option_check;
alter table public.payments
  add constraint payments_payment_option_check
  check (payment_option is null or payment_option in ('deposit_50', 'full_100', 'balance'));

-- Customer chooses 50% deposit or 100% full payment. The existing atomic
-- booking RPC still performs working-hours, barber-conflict and queue checks.
create or replace function public.customer_create_appointment_with_payment(
  p_service_id uuid,
  p_barber_id uuid,
  p_starts_at timestamptz,
  p_payment_option text
)
returns table (id uuid, queue_number integer, queue_date date, starts_at timestamptz, status public.appointment_status, total_price numeric, amount_due numeric)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking record;
  v_price numeric(10,2);
  v_due numeric(10,2);
  v_payment_id uuid;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Please sign in before booking.' using errcode = '42501';
  end if;
  if p_payment_option not in ('deposit_50', 'full_100') then
    raise exception 'Choose either 50% downpayment or full payment.' using errcode = '22023';
  end if;

  select s.price_pesos into v_price
  from public.services s
  where s.id = p_service_id and s.is_active = true;
  if not found or v_price is null or v_price <= 0 then
    raise exception 'The selected service is unavailable or has an invalid price.' using errcode = '22023';
  end if;

  v_due := case when p_payment_option = 'deposit_50'
    then round(v_price * 0.50, 2) else v_price end;

  select * into v_booking
  from public.customer_create_appointment(p_service_id, p_barber_id, p_starts_at);

  update public.appointments
  set payment_status = 'pending',
      payment_option = p_payment_option,
      service_price_snapshot = v_price,
      amount_paid_pesos = 0,
      updated_at = now()
  where appointments.id = v_booking.id;

  insert into public.payments (
    appointment_id, customer_id, amount_pesos, method, status,
    provider, payment_option
  ) values (
    v_booking.id, v_uid, v_due, 'qrph', 'pending',
    'InstaPay QR', p_payment_option
  ) returning id into v_payment_id;

  insert into public.audit_log(actor_id, action, entity_table, entity_id, metadata)
  values(v_uid, 'customer_payment_submitted_for_verification', 'payments', v_payment_id::text,
    jsonb_build_object('appointment_id', v_booking.id, 'payment_option', p_payment_option,
      'service_price', v_price, 'amount_due', v_due));

  return query select v_booking.id, v_booking.queue_number, v_booking.queue_date,
    v_booking.starts_at, v_booking.status, v_price, v_due;
end;
$$;

revoke all on function public.customer_create_appointment_with_payment(uuid,uuid,timestamptz,text) from public;
grant execute on function public.customer_create_appointment_with_payment(uuid,uuid,timestamptz,text) to authenticated;

-- Customers can submit a proof path/reference only for their own pending payment.
create or replace function public.customer_submit_payment_proof(
  p_appointment_id uuid,
  p_payment_reference text,
  p_proof_path text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_payment_id uuid;
begin
  if v_uid is null then raise exception 'Please sign in.' using errcode = '42501'; end if;
  if nullif(btrim(p_payment_reference), '') is null or nullif(btrim(p_proof_path), '') is null then
    raise exception 'Enter the GCash reference number and upload the payment screenshot.' using errcode = '22023';
  end if;
  if length(btrim(p_payment_reference)) > 100 then raise exception 'Invalid reference number.' using errcode = '22023'; end if;
  if p_proof_path not like v_uid::text || '/%' then raise exception 'Invalid payment proof location.' using errcode = '42501'; end if;

  select p.id into v_payment_id
  from public.payments p
  where p.appointment_id = p_appointment_id
    and p.customer_id = v_uid and p.status = 'pending'
  order by p.created_at desc limit 1 for update;
  if v_payment_id is null then raise exception 'No pending payment was found for this appointment.'; end if;

  update public.payments
  set provider_reference = btrim(p_payment_reference), proof_path = btrim(p_proof_path),
      provider = 'InstaPay QR', method = 'qrph'
  where id = v_payment_id;

  insert into public.audit_log(actor_id, action, entity_table, entity_id, metadata)
  values(v_uid, 'customer_payment_proof_uploaded', 'payments', v_payment_id::text,
    jsonb_build_object('appointment_id', p_appointment_id));
end;
$$;
revoke all on function public.customer_submit_payment_proof(uuid,text,text) from public;
grant execute on function public.customer_submit_payment_proof(uuid,text,text) to authenticated;

-- Only an administrator may verify an online customer payment.
create or replace function public.admin_verify_customer_payment(p_payment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_payment public.payments%rowtype;
  v_total numeric(10,2);
begin
  if v_actor is null or public.current_app_role() <> 'admin' then
    raise exception 'Only an administrator can verify customer payments.' using errcode = '42501';
  end if;
  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then raise exception 'Payment not found.'; end if;
  if v_payment.status <> 'pending' or v_payment.proof_path is null or v_payment.provider_reference is null then
    raise exception 'Payment must have a submitted screenshot and reference number before approval.';
  end if;
  select a.service_price_snapshot into v_total
  from public.appointments a where a.id = v_payment.appointment_id for update;

  update public.payments set status = 'paid', paid_at = now(), verified_by = v_actor, verified_at = now()
  where id = p_payment_id;
  update public.appointments
  set amount_paid_pesos = coalesce(amount_paid_pesos,0) + v_payment.amount_pesos,
      payment_status = case
        when coalesce(amount_paid_pesos,0) + v_payment.amount_pesos >= coalesce(v_total,0) then 'paid'::public.payment_status
        else 'pending'::public.payment_status end,
      updated_at = now()
  where id = v_payment.appointment_id;

  insert into public.audit_log(actor_id, action, entity_table, entity_id, metadata)
  values(v_actor, 'admin_customer_payment_verified', 'payments', p_payment_id::text,
    jsonb_build_object('appointment_id',v_payment.appointment_id,'amount',v_payment.amount_pesos,
      'payment_option',v_payment.payment_option));
end;
$$;
revoke all on function public.admin_verify_customer_payment(uuid) from public;
grant execute on function public.admin_verify_customer_payment(uuid) to authenticated;

-- Private bucket: customers upload only into their own folder. Admin/staff can read proofs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('customer-payment-proofs', 'customer-payment-proofs', false, 5242880,
        array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 5242880,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "customers upload own payment proof"
on storage.objects for insert to authenticated
with check (bucket_id = 'customer-payment-proofs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "customers read own payment proof"
on storage.objects for select to authenticated
using (bucket_id = 'customer-payment-proofs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff_or_admin()));
create policy "admins delete payment proof"
on storage.objects for delete to authenticated
using (bucket_id = 'customer-payment-proofs' and public.current_app_role() = 'admin');
