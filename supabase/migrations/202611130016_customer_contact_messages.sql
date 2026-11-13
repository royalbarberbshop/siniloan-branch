-- Customer Contact Us messages. Public visitors may submit messages; only staff/admin may read or update them.
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null check (char_length(trim(customer_name)) between 1 and 120),
  contact_number text not null check (char_length(trim(contact_number)) between 1 and 40),
  message text not null check (char_length(trim(message)) between 1 and 5000),
  status text not null default 'new' check (status in ('new', 'read', 'replied')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;

drop policy if exists "public submit contact messages" on public.contact_messages;
create policy "public submit contact messages" on public.contact_messages
  for insert to anon, authenticated
  with check (status = 'new');

drop policy if exists "staff read contact messages" on public.contact_messages;
create policy "staff read contact messages" on public.contact_messages
  for select to authenticated
  using (public.is_staff_or_admin());

drop policy if exists "staff update contact message status" on public.contact_messages;
create policy "staff update contact message status" on public.contact_messages
  for update to authenticated
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin() and status in ('new', 'read', 'replied'));

grant insert on public.contact_messages to anon, authenticated;
grant select, update on public.contact_messages to authenticated;

-- Enable instant inbox refresh when a customer submits a message.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'contact_messages'
  ) then
    alter publication supabase_realtime add table public.contact_messages;
  end if;
end
$$;
