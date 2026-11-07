# Walk-in persistence and appointment UUID fix

This patch replaces browser-only walk-in records with a database-backed flow.

1. Apply `supabase/migrations/202611070004_persist_walk_in_customers.sql` in the Supabase SQL Editor.
2. Deploy the updated React app.
3. Register a walk-in with a valid active service (and optionally a barber).
4. Confirm the new queue entry appears in Live Queue, refresh, and confirm it remains.
5. Call the customer. The app now sends the appointment's real UUID to `admin_update_appointment_status`; the `APT-XXXXXXXX` text is display-only.

The migration adds a separate `walk_in_customers` table so walk-in guests do not need Supabase Auth accounts. Existing authenticated customer appointments continue using `profiles`.
