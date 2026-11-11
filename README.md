# Royal Barbershop — Public Today's Live Queue patch

This is a customer-page-only patch based on `siniloan-branch-main(2).zip`. It adds a public queue panel to the customer page, visible whether or not a customer is signed in. It shows only today's active queue (`checked_in`, `waiting`, `in_service`) and exposes queue number, service, barber, time, and status. It does not expose customer names, phone numbers, payment references, or future appointments.

## Apply
1. In your project, replace `src/CustomerPage.jsx` with the file in this patch. Keep your other files unchanged.
2. In Supabase **SQL Editor**, open `supabase/migrations/202611110015_public_today_live_queue.sql`, paste the full contents, and click **Run** in the correct project (DEMO first, then LIVE after testing).
3. Commit and push the changed customer page to GitHub. The existing GitHub Actions workflow should deploy it.
4. Open the `/book` customer page in a private/incognito window without signing in. Confirm the queue is visible and changes within 15 seconds after an admin changes a queue status.

## Notes
- The RPC uses a restricted `SECURITY DEFINER` function and returns only the fields needed for the public display. It does not grant anonymous table access to `appointments`.
- Only active queue statuses appear. `booked`, `completed`, `cancelled`, and `no_show` are excluded.
- This patch does not modify admin files, appointment booking logic, payments, or working-hours settings.
- The source ZIP supplied for this patch is the basis; merge carefully if your GitHub branch has newer customer-page changes not present in that ZIP.
