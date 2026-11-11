-- Allow authenticated admins/staff to manage the existing weekly barber schedules.
-- Existing RLS policies from the initial schema continue to enforce public read
-- and public.is_staff_or_admin() for all writes.
grant select on table public.barber_working_hours to anon, authenticated;
grant insert, update, delete on table public.barber_working_hours to authenticated;

-- The admin schedule editor upserts one row per barber per weekday.
-- The initial schema already defines UNIQUE (barber_id, weekday).
