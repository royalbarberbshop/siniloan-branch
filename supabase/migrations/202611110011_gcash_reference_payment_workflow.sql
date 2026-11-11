-- Royal Barber Shop: reference-number-only GCash verification.
-- Apply to DEMO first. Apply to LIVE only after end-to-end testing.

alter table public.appointments
  add column if not exists payment_choice text check (payment_choice in ('deposit','full')),
  add column if not exists service_price_snapshot numeric(10,2) check (service_price_snapshot is null or service_price_snapshot >= 0),
  add column if not exists amount_due_online numeric(10,2) check (amount_due_online is null or amount_due_online >= 0),
  add column if not exists payment_verified_at timestamptz;

create unique index if not exists payments_provider_reference_unique_nonnull
  on public.payments(provider_reference) where provider_reference is not null;

create or replace function public.customer_create_paid_appointment(
  p_service_id uuid,
  p_barber_id uuid,
  p_starts_at timestamptz,
  p_payment_choice text,
  p_provider_reference text
)
returns table (id uuid, queue_number integer, queue_date date, starts_at timestamptz, status text, amount_due numeric)
language plpgsql security definer set search_path = '' as $$
declare
  v_customer uuid := auth.uid(); v_duration integer; v_price numeric(10,2); v_due numeric(10,2);
  v_end timestamptz; v_queue_date date; v_queue_number integer; v_barber uuid;
  v_appointment uuid; v_weekday smallint; v_local_start time; v_local_end time; v_payment uuid;
begin
  if v_customer is null then raise exception 'Please sign in before booking.' using errcode='42501'; end if;
  if p_payment_choice not in ('deposit','full') then raise exception 'Choose a valid payment option.'; end if;
  if p_provider_reference is null or btrim(p_provider_reference) !~ '^[0-9]{6,25}$' then raise exception 'Enter a valid GCash reference number.'; end if;
  if p_starts_at is null or p_starts_at <= now() then raise exception 'Choose an appointment time in the future.'; end if;
  select s.duration_minutes,s.price_pesos into v_duration,v_price from public.services s where s.id=p_service_id and s.is_active=true;
  if not found then raise exception 'The selected service is no longer available.'; end if;
  v_due := case when p_payment_choice='full' then v_price else round(v_price/2,2) end;
  if v_due <= 0 then raise exception 'Online payment amount must be greater than zero.'; end if;
  v_end:=p_starts_at+make_interval(mins=>v_duration); v_queue_date:=(p_starts_at at time zone 'Asia/Manila')::date;
  v_weekday:=extract(dow from (p_starts_at at time zone 'Asia/Manila'))::smallint;
  v_local_start:=(p_starts_at at time zone 'Asia/Manila')::time; v_local_end:=(v_end at time zone 'Asia/Manila')::time;
  perform pg_advisory_xact_lock(hashtext('customer-booking-'||v_queue_date::text)::bigint);
  if p_barber_id is not null then
    select b.id into v_barber from public.barbers b join public.barber_working_hours h on h.barber_id=b.id
    where b.id=p_barber_id and b.is_active and h.weekday=v_weekday and not h.is_closed
      and v_local_start>=h.opens_at and v_local_end<=h.closes_at
      and not exists(select 1 from public.appointments a where a.barber_id=b.id and a.status not in ('cancelled','no_show') and tstzrange(a.starts_at,a.ends_at,'[)') && tstzrange(p_starts_at,v_end,'[)')) for update of b;
  else
    select b.id into v_barber from public.barbers b join public.barber_working_hours h on h.barber_id=b.id
    where b.is_active and h.weekday=v_weekday and not h.is_closed and v_local_start>=h.opens_at and v_local_end<=h.closes_at
      and not exists(select 1 from public.appointments a where a.barber_id=b.id and a.status not in ('cancelled','no_show') and tstzrange(a.starts_at,a.ends_at,'[)') && tstzrange(p_starts_at,v_end,'[)'))
    order by b.display_name limit 1 for update of b;
  end if;
  if v_barber is null then raise exception 'That time is unavailable. Please choose another time or barber.' using errcode='23P01'; end if;
  select coalesce(max(a.queue_number),0)+1 into v_queue_number from public.appointments a where a.queue_date=v_queue_date;
  insert into public.appointments(customer_id,service_id,barber_id,starts_at,ends_at,queue_date,queue_number,status,payment_status,qr_token_hash,payment_choice,service_price_snapshot,amount_due_online)
  values(v_customer,p_service_id,v_barber,p_starts_at,v_end,v_queue_date,v_queue_number,'booked','pending',encode(extensions.digest(extensions.gen_random_bytes(32),'sha256'),'hex'),p_payment_choice,v_price,v_due)
  returning appointments.id into v_appointment;
  insert into public.payments(appointment_id,customer_id,amount_pesos,method,status,provider,provider_reference)
  values(v_appointment,v_customer,v_due,'gcash','pending','GCash',btrim(p_provider_reference)) returning id into v_payment;
  insert into public.audit_log(actor_id,action,entity_table,entity_id,metadata)
  values(v_customer,'customer_appointment_payment_submitted','appointments',v_appointment::text,jsonb_build_object('payment_id',v_payment,'amount_due',v_due,'payment_choice',p_payment_choice));
  return query select v_appointment,v_queue_number,v_queue_date,p_starts_at,'waiting_for_confirmation'::text,v_due;
exception when unique_violation then raise exception 'This GCash reference number has already been submitted.' using errcode='23505';
  when exclusion_violation then raise exception 'That time was just booked. Please choose another available time.' using errcode='23P01';
end; $$;

revoke all on function public.customer_create_paid_appointment(uuid,uuid,timestamptz,text,text) from public;
grant execute on function public.customer_create_paid_appointment(uuid,uuid,timestamptz,text,text) to authenticated;

create or replace function public.admin_review_gcash_payment(p_appointment_id uuid,p_approve boolean)
returns void language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid(); v_payment public.payments%rowtype; v_appointment public.appointments%rowtype;
begin
 if v_actor is null or not coalesce(public.is_staff_or_admin(),false) then raise exception 'Only authorized staff or administrators may review payments.' using errcode='42501'; end if;
 if not exists(select 1 from public.profiles p where p.id=v_actor and p.role='admin' and p.is_active) then raise exception 'Only an active administrator may approve GCash payments.' using errcode='42501'; end if;
 select * into v_appointment from public.appointments where id=p_appointment_id for update;
 if not found then raise exception 'Appointment not found.'; end if;
 select * into v_payment from public.payments where appointment_id=p_appointment_id and status='pending' order by created_at desc limit 1 for update;
 if not found then raise exception 'No pending GCash payment was found.'; end if;
 if p_approve then
   update public.payments set status='paid',paid_at=now() where id=v_payment.id;
   update public.appointments set payment_status=case when payment_choice='full' then 'paid'::public.payment_status else 'pending'::public.payment_status end,payment_verified_at=now(),updated_at=now() where id=p_appointment_id;
   insert into public.audit_log(actor_id,action,entity_table,entity_id,metadata) values(v_actor,'gcash_payment_approved','payments',v_payment.id::text,jsonb_build_object('appointment_id',p_appointment_id,'reference',v_payment.provider_reference,'amount',v_payment.amount_pesos));
 else
   update public.payments set status='failed' where id=v_payment.id;
   update public.appointments set status='cancelled',payment_status='failed',updated_at=now() where id=p_appointment_id;
   insert into public.audit_log(actor_id,action,entity_table,entity_id,metadata) values(v_actor,'gcash_payment_rejected','payments',v_payment.id::text,jsonb_build_object('appointment_id',p_appointment_id,'reference',v_payment.provider_reference));
 end if;
end; $$;
revoke all on function public.admin_review_gcash_payment(uuid,boolean) from public;
grant execute on function public.admin_review_gcash_payment(uuid,boolean) to authenticated;

-- Keep payment proof private: this workflow stores no screenshot or uploaded file.

-- POS balance protection: for linked online appointments, collect only the
-- unpaid remainder after approved online GCash payments.
create or replace function public.admin_record_pos_transaction(
  p_appointment_id uuid, p_service_name_snapshot text, p_customer_name_snapshot text,
  p_amount_pesos numeric, p_payment_method text
) returns uuid language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid(); v_transaction_id uuid; v_appointment public.appointments%rowtype;
 v_customer_id uuid; v_method public.payment_method; v_paid_online numeric(10,2); v_due numeric(10,2);
begin
 if v_actor is null or not coalesce(public.is_staff_or_admin(),false) then raise exception 'Only authenticated staff or administrators can record POS transactions.'; end if;
 if p_service_name_snapshot is null or btrim(p_service_name_snapshot)='' or p_amount_pesos is null or p_amount_pesos<0 then raise exception 'Invalid POS transaction.'; end if;
 begin v_method:=lower(p_payment_method)::public.payment_method; exception when others then raise exception 'Unsupported payment method.'; end;
 if p_appointment_id is not null then
  select * into v_appointment from public.appointments where id=p_appointment_id for update;
  if not found then raise exception 'The linked appointment could not be found.'; end if;
  if v_appointment.status not in ('in_service','completed') then raise exception 'Only appointments marked In Service or Completed can be checked out.'; end if;
  if v_appointment.payment_status='paid' then raise exception 'This appointment has already been paid.'; end if;
  v_customer_id:=v_appointment.customer_id;
  select coalesce(sum(amount_pesos),0) into v_paid_online from public.payments where appointment_id=p_appointment_id and status='paid';
  v_due:=greatest(coalesce(v_appointment.service_price_snapshot,0)-v_paid_online,0);
  if v_appointment.service_price_snapshot is not null and abs(p_amount_pesos-v_due)>0.01 then raise exception 'Collect only the remaining balance of %.',v_due; end if;
 else v_customer_id:=null; end if;
 insert into public.pos_transactions(appointment_id,customer_id,staff_id,service_name_snapshot,customer_name_snapshot,amount_pesos,payment_method,payment_status)
 values(p_appointment_id,v_customer_id,v_actor,btrim(p_service_name_snapshot),nullif(btrim(coalesce(p_customer_name_snapshot,'')),''),p_amount_pesos,v_method,'paid') returning id into v_transaction_id;
 if p_appointment_id is not null then update public.appointments set status='completed',payment_status='paid',updated_at=now() where id=p_appointment_id; end if;
 insert into public.audit_log(actor_id,action,entity_table,entity_id,metadata) values(v_actor,'pos_payment_recorded','pos_transactions',v_transaction_id::text,jsonb_build_object('appointment_id',p_appointment_id,'amount_pesos',p_amount_pesos,'payment_method',v_method));
 return v_transaction_id;
end; $$;
revoke all on function public.admin_record_pos_transaction(uuid,text,text,numeric,text) from public;
grant execute on function public.admin_record_pos_transaction(uuid,text,text,numeric,text) to authenticated;
