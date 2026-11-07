# Live Queue Supabase Phase

## Included
- Live Queue now shows the current Philippine business date only.
- Queue cards are ordered by the database queue number (numeric order).
- The admin dashboard subscribes to Supabase Realtime appointment changes and reloads the appointment list when a walk-in is registered or an appointment status changes from another session/device.
- Existing status actions continue to use `admin_update_appointment_status`, preserving the server-side status transition checks and audit log.

## Apply migration
Run `supabase/migrations/202611070005_enable_live_queue_realtime.sql` in the Supabase SQL Editor. This adds `public.appointments` to the `supabase_realtime` publication if it is not already present.

The existing `appointments` SELECT RLS policy remains in force. Do not disable RLS or expose a service-role key.

## Deploy
Replace the project files with this archive, keep `.github/workflows/static.yml` deleted, then commit and push. Confirm the GitHub Actions Pages deployment succeeds.

## Test
1. Open the admin dashboard in two browser sessions, signing in as an authorized admin/staff user in both.
2. Register a walk-in in session A. It should appear in Live Queue in session B without a manual refresh.
3. Call the customer in either session. The status should update in the other session.
4. Refresh both sessions. The current-day queue and statuses should remain.
5. Check that a prior-day appointment does not appear in today's Live Queue, but remains in the Appointments page.

If Realtime is not enabled for the project, the initial list still loads and status actions still work; cross-session automatic refresh requires this migration and the `supabase_realtime` publication.
