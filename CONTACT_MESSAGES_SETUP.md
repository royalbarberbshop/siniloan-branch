# Royal Barbershop Contact Messages

## What changed
- The customer Contact Us form now inserts submissions into `public.contact_messages` in the active Supabase project.
- The admin sidebar now includes **Contact Messages**. It lists newest submissions first and updates live through Supabase Realtime.
- Admin/staff can mark a message **Read**, **Replied**, or return it to **New**.
- Public visitors can submit messages but cannot read, edit, or delete submitted messages. Only authenticated staff/admin roles can read and update them through Row Level Security.

## Required Supabase setup
Apply this migration to **each** Supabase project/environment that will receive contact messages (LIVE and DEMO separately):

`supabase/migrations/202611130016_customer_contact_messages.sql`

In the Supabase SQL Editor, open the migration file, copy its full contents, and run it. Do not use a service-role key in the frontend. The existing Vite public anon key is used with the table's RLS policies.

## Test
1. Deploy the updated app and open the customer site at `/book#contact` (or select Contact in the navigation).
2. Submit a test name, contact number, and message.
3. Confirm the customer sees the success notice.
4. Sign in to the admin site using an account with the `admin` or `staff` profile role.
5. Open **Contact Messages**. The test message should appear at the top with status **New**.
6. Mark it **Read**, then **Replied**. Refresh the admin page and confirm the status is retained.
7. Verify that a customer/anonymous session cannot query the inbox; only staff/admin can view it.

Messages are stored separately from customer profiles and appointment records. This implementation does not automatically email or text a reply to the customer; the status is an internal tracking label.
