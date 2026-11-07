-- Enable Supabase Realtime for appointment/queue changes.
-- The dashboard still reads through the existing RLS-protected SELECT policy.
do $$
begin
  if not exists (
    select 1
      from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'appointments'
  ) then
    alter publication supabase_realtime add table public.appointments;
  end if;
end
$$;
