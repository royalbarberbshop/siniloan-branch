-- Phase 6: Sales & Cash Drawer reconciliation.
-- Apply after 202611080007_connect_pos_transactions.sql.
-- Expected cash = opening float + paid cash POS sales + cash-in - cash-out.
-- Non-cash methods are deliberately excluded.

create table if not exists public.cash_drawer_sessions (
  id uuid primary key default gen_random_uuid(),
  opened_by uuid not null references public.profiles(id) on delete restrict,
  opened_at timestamptz not null default now(),
  opening_cash_pesos numeric(12,2) not null check (opening_cash_pesos >= 0),
  status text not null default 'open' check (status in ('open','closed')),
  closed_by uuid references public.profiles(id) on delete restrict,
  closed_at timestamptz,
  expected_cash_pesos numeric(12,2),
  actual_cash_pesos numeric(12,2),
  discrepancy_pesos numeric(12,2),
  notes text,
  created_at timestamptz not null default now(),
  check (
    (status = 'open' and closed_at is null and actual_cash_pesos is null)
    or (status = 'closed' and closed_at is not null and actual_cash_pesos is not null)
  )
);

create unique index if not exists one_open_cash_drawer_session
  on public.cash_drawer_sessions ((status)) where status = 'open';

create table if not exists public.cash_drawer_movements (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.cash_drawer_sessions(id) on delete restrict,
  movement_type text not null check (movement_type in ('cash_in','cash_out')),
  amount_pesos numeric(12,2) not null check (amount_pesos > 0),
  reason text not null check (length(btrim(reason)) between 2 and 240),
  recorded_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists cash_drawer_movements_session_idx
  on public.cash_drawer_movements(session_id, created_at desc);

alter table public.cash_drawer_sessions enable row level security;
alter table public.cash_drawer_movements enable row level security;

drop policy if exists "staff read cash drawer sessions" on public.cash_drawer_sessions;
create policy "staff read cash drawer sessions" on public.cash_drawer_sessions
  for select to authenticated using (public.is_staff_or_admin());

drop policy if exists "staff read cash drawer movements" on public.cash_drawer_movements;
create policy "staff read cash drawer movements" on public.cash_drawer_movements
  for select to authenticated using (public.is_staff_or_admin());

revoke all on public.cash_drawer_sessions from anon, authenticated;
revoke all on public.cash_drawer_movements from anon, authenticated;
grant select on public.cash_drawer_sessions, public.cash_drawer_movements to authenticated;

create or replace function public.admin_open_cash_drawer(p_opening_cash_pesos numeric)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_id uuid;
begin
  if v_actor is null or not coalesce(public.is_staff_or_admin(), false) then
    raise exception 'Only authenticated staff or administrators can open the cash drawer.';
  end if;
  if p_opening_cash_pesos is null or p_opening_cash_pesos < 0 then
    raise exception 'Opening cash must be zero or greater.';
  end if;
  perform pg_advisory_xact_lock(hashtext('royal_barber_cash_drawer_open'));
  if exists (select 1 from public.cash_drawer_sessions where status = 'open') then
    raise exception 'A cash drawer session is already open.';
  end if;
  insert into public.cash_drawer_sessions(opened_by, opening_cash_pesos)
  values (v_actor, p_opening_cash_pesos)
  returning id into v_id;
  insert into public.audit_log(actor_id, action, entity_table, entity_id, metadata)
  values(v_actor, 'cash_drawer_opened', 'cash_drawer_sessions', v_id::text,
    jsonb_build_object('opening_cash_pesos', p_opening_cash_pesos));
  return v_id;
end;
$$;

create or replace function public.admin_record_cash_movement(
  p_movement_type text, p_amount_pesos numeric, p_reason text
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_session public.cash_drawer_sessions%rowtype;
  v_id uuid;
  v_type text := lower(coalesce(p_movement_type, ''));
begin
  if v_actor is null or not coalesce(public.is_staff_or_admin(), false) then
    raise exception 'Only authenticated staff or administrators can record cash movements.';
  end if;
  if v_type not in ('cash_in','cash_out') then raise exception 'Movement must be cash_in or cash_out.'; end if;
  if p_amount_pesos is null or p_amount_pesos <= 0 then raise exception 'Amount must be greater than zero.'; end if;
  if p_reason is null or length(btrim(p_reason)) < 2 or length(btrim(p_reason)) > 240 then
    raise exception 'Provide a reason between 2 and 240 characters.';
  end if;
  select * into v_session from public.cash_drawer_sessions where status = 'open' for update;
  if not found then raise exception 'Open the cash drawer before recording a movement.'; end if;
  insert into public.cash_drawer_movements(session_id, movement_type, amount_pesos, reason, recorded_by)
  values(v_session.id, v_type, p_amount_pesos, btrim(p_reason)) returning id into v_id;
  insert into public.audit_log(actor_id, action, entity_table, entity_id, metadata)
  values(v_actor, 'cash_drawer_movement_recorded', 'cash_drawer_movements', v_id::text,
    jsonb_build_object('session_id', v_session.id, 'movement_type', v_type,
      'amount_pesos', p_amount_pesos, 'reason', btrim(p_reason)));
  return v_id;
end;
$$;

create or replace function public.admin_close_cash_drawer(p_actual_cash_pesos numeric)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_session public.cash_drawer_sessions%rowtype;
  v_cash_sales numeric(12,2);
  v_cash_in numeric(12,2);
  v_cash_out numeric(12,2);
  v_expected numeric(12,2);
  v_difference numeric(12,2);
begin
  if v_actor is null or not coalesce(public.is_staff_or_admin(), false) then
    raise exception 'Only authenticated staff or administrators can close the cash drawer.';
  end if;
  if p_actual_cash_pesos is null or p_actual_cash_pesos < 0 then
    raise exception 'Actual cash must be zero or greater.';
  end if;
  select * into v_session from public.cash_drawer_sessions where status = 'open' for update;
  if not found then raise exception 'There is no open cash drawer session.'; end if;

  select coalesce(sum(amount_pesos),0) into v_cash_sales
  from public.pos_transactions
  where payment_status = 'paid' and payment_method = 'cash'
    and created_at >= v_session.opened_at and created_at <= now();
  select coalesce(sum(amount_pesos) filter (where movement_type = 'cash_in'),0),
         coalesce(sum(amount_pesos) filter (where movement_type = 'cash_out'),0)
    into v_cash_in, v_cash_out
  from public.cash_drawer_movements where session_id = v_session.id;
  v_expected := v_session.opening_cash_pesos + v_cash_sales + v_cash_in - v_cash_out;
  v_difference := p_actual_cash_pesos - v_expected;

  update public.cash_drawer_sessions
  set status = 'closed', closed_by = v_actor, closed_at = now(),
      expected_cash_pesos = v_expected, actual_cash_pesos = p_actual_cash_pesos,
      discrepancy_pesos = v_difference
  where id = v_session.id;

  insert into public.audit_log(actor_id, action, entity_table, entity_id, metadata)
  values(v_actor, 'cash_drawer_closed', 'cash_drawer_sessions', v_session.id::text,
    jsonb_build_object('expected_cash_pesos', v_expected,
      'actual_cash_pesos', p_actual_cash_pesos, 'discrepancy_pesos', v_difference));

  return jsonb_build_object('session_id', v_session.id,
    'expected_cash_pesos', v_expected, 'actual_cash_pesos', p_actual_cash_pesos,
    'discrepancy_pesos', v_difference);
end;
$$;

revoke all on function public.admin_open_cash_drawer(numeric) from public;
revoke all on function public.admin_record_cash_movement(text,numeric,text) from public;
revoke all on function public.admin_close_cash_drawer(numeric) from public;
grant execute on function public.admin_open_cash_drawer(numeric) to authenticated;
grant execute on function public.admin_record_cash_movement(text,numeric,text) to authenticated;
grant execute on function public.admin_close_cash_drawer(numeric) to authenticated;

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='cash_drawer_sessions') then
    alter publication supabase_realtime add table public.cash_drawer_sessions;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='cash_drawer_movements') then
    alter publication supabase_realtime add table public.cash_drawer_movements;
  end if;
end $$;
