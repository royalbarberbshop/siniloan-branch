-- Royal Barber Shop: initial production schema
-- Apply in Supabase SQL Editor or with the Supabase CLI after reviewing.
-- Do not expose a service-role key in the browser.

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create type public.app_role as enum ('customer', 'staff', 'admin');
create type public.appointment_status as enum
  ('booked', 'checked_in', 'waiting', 'in_service', 'completed', 'cancelled', 'no_show');
create type public.payment_status as enum ('unpaid', 'pending', 'paid', 'failed', 'refunded');
create type public.payment_method as enum ('cash', 'gcash', 'maya', 'qrph', 'card', 'bank_transfer', 'other');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role public.app_role not null default 'customer',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  duration_minutes integer not null check (duration_minutes between 5 and 360),
  price_pesos numeric(10,2) not null check (price_pesos >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.barbers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete set null,
  display_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.barber_working_hours (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references public.barbers(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  opens_at time not null,
  closes_at time not null,
  is_closed boolean not null default false,
  unique (barber_id, weekday),
  check (closes_at > opens_at)
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  barber_id uuid references public.barbers(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  queue_date date not null,
  queue_number integer not null check (queue_number > 0),
  status public.appointment_status not null default 'booked',
  payment_status public.payment_status not null default 'unpaid',
  -- Store only a hash of a random QR token; never put customer data in the QR code.
  qr_token_hash text not null unique,
  customer_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  unique (queue_date, queue_number)
);

-- Prevent two active appointments for the same barber from overlapping.
-- The application should assign a barber before confirmation; null barber IDs
-- are not covered by this constraint and require server-side capacity checks.
alter table public.appointments
  add constraint no_overlapping_barber_appointments
  exclude using gist (
    barber_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  )
  where (barber_id is not null and status not in ('cancelled', 'no_show'));

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete restrict,
  customer_id uuid not null references public.profiles(id) on delete restrict,
  amount_pesos numeric(10,2) not null check (amount_pesos > 0),
  method public.payment_method not null,
  status public.payment_status not null default 'pending',
  provider text,
  provider_reference text unique,
  idempotency_key text unique,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.pos_transactions (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id) on delete set null,
  customer_id uuid references public.profiles(id) on delete set null,
  staff_id uuid not null references public.profiles(id) on delete restrict,
  service_name_snapshot text not null,
  amount_pesos numeric(10,2) not null check (amount_pesos >= 0),
  payment_method public.payment_method not null,
  payment_status public.payment_status not null default 'paid',
  notes text,
  created_at timestamptz not null default now(),
  unique (appointment_id)
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_table text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index appointments_starts_at_idx on public.appointments(starts_at);
create index appointments_customer_idx on public.appointments(customer_id, starts_at desc);
create index appointments_status_queue_idx on public.appointments(queue_date, status, queue_number);
create index payments_appointment_idx on public.payments(appointment_id);
create index pos_transactions_created_at_idx on public.pos_transactions(created_at desc);

create or replace function public.current_app_role()
returns public.app_role
language sql stable security definer
set search_path = ''
as $$
  select p.role from public.profiles p
  where p.id = (select auth.uid()) and p.is_active = true
$$;

create or replace function public.is_staff_or_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() in ('staff', 'admin'), false)
$$;

alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.barbers enable row level security;
alter table public.barber_working_hours enable row level security;
alter table public.appointments enable row level security;
alter table public.payments enable row level security;
alter table public.pos_transactions enable row level security;
alter table public.audit_log enable row level security;

-- Profiles: users can see/update only their own basic profile. Role changes are
-- intentionally not allowed through this policy; provision roles via trusted admin tooling.
create policy "profile read own or staff" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_staff_or_admin());
create policy "profile update own basic fields" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and role = (select public.current_app_role()));

-- Active services and barbers can be shown to the public/customer booking page.
create policy "read active services" on public.services
  for select to anon, authenticated using (is_active or public.is_staff_or_admin());
create policy "staff manage services" on public.services
  for all to authenticated using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());

create policy "read active barbers" on public.barbers
  for select to anon, authenticated using (is_active or public.is_staff_or_admin());
create policy "staff manage barbers" on public.barbers
  for all to authenticated using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());

create policy "read working hours" on public.barber_working_hours
  for select to anon, authenticated using (true);
create policy "staff manage working hours" on public.barber_working_hours
  for all to authenticated using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());

-- Appointment writes should go through trusted RPC/Edge Functions so availability,
-- queue numbering, QR token creation and status transitions are validated atomically.
create policy "customer and staff read appointments" on public.appointments
  for select to authenticated
  using (customer_id = (select auth.uid()) or public.is_staff_or_admin());

create policy "customer read own payments or staff" on public.payments
  for select to authenticated
  using (customer_id = (select auth.uid()) or public.is_staff_or_admin());

create policy "staff manage payments" on public.payments
  for all to authenticated using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());

create policy "staff manage POS transactions" on public.pos_transactions
  for all to authenticated using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());

create policy "admin read audit log" on public.audit_log
  for select to authenticated
  using (public.current_app_role() = 'admin');

-- New customer profile on signup. All new accounts default to customer; users
-- cannot choose their own staff/admin role from signup metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'New customer'),
    new.raw_user_meta_data ->> 'phone',
    'customer'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- NOTE: Admin bootstrap and booking/payment RPCs are intentionally not created
-- as insecure client-side shortcuts. Add trusted server-side functions before launch.
