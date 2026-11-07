# Appointments Supabase phase

## Apply the migration first

Run `supabase/migrations/202611070003_admin_appointment_status_rpc.sql` in the Supabase SQL Editor. It creates a staff/admin-only RPC for valid appointment status transitions and records each change in `audit_log`.

## Deploy

Replace the corresponding project files with this archive, commit, and push to `main`. Keep `.github/workflows/static.yml` deleted; deploy through `.github/workflows/deploy.yml` only.

## What's connected

- Appointment list reads from `public.appointments` with customer, service, and barber details.
- Status actions call the secure RPC. The database validates role and allowed status transitions.
- Appointment data is no longer read from or written to browser local storage.

## Not included yet

- Creating appointments or walk-ins. The current schema requires an authenticated customer profile, a service, a queue number, a QR-token hash, and trusted availability/queue validation. Those writes must be implemented in a server-side booking function, not by direct browser inserts.
- Payment verification, customer booking page, and appointment notifications.
