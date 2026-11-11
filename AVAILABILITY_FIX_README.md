# Royal Barber Shop — Customer Availability Fix

This patch updates the customer booking date/time step so it loads 30-minute appointment start times from Supabase instead of showing a hard-coded 9:00 AM–5:30 PM list.

## What changes
- The customer selects a service, barber (or Any available barber), and date.
- The page calls `customer_get_available_slots` for that exact selection.
- Each returned time is labelled **Available** or **Booked**; booked times are disabled.
- The list respects active barbers' `barber_working_hours`, the selected service duration, existing non-cancelled/non-no-show appointments, and Asia/Manila time.
- Continue/submit is blocked when no available slot is selected.
- The final booking RPC still performs its own atomic availability check, so a slot taken by another customer after the list loads is rejected safely.

## Files
- `src/CustomerPage.jsx`
- `supabase/migrations/202611110012_customer_slot_availability.sql`

## Apply safely
1. Commit the files to a DEMO/testing branch first.
2. In the DEMO Supabase SQL Editor, run migration `202611110012_customer_slot_availability.sql`.
3. Ensure active barbers have rows in `barber_working_hours` for their working weekdays. A missing/closed schedule correctly returns no available times.
4. Test several dates, barbers, and services with different durations.
5. Test that an existing appointment makes the overlapping slot display as Booked.
6. Test two customers trying to submit the same slot; only one should succeed.
7. After DEMO testing, merge/deploy and apply the same migration to LIVE.

Run this migration after the existing customer booking/payment migrations. It does not modify or delete existing appointments or payments.
