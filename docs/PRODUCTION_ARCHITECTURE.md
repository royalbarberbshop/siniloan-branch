# Royal Barber Shop — Production Architecture (Phase 1)

## Confirmed decisions
- Zero monthly subscription cost initially; use free tiers and monitor limits.
- Customer and staff accounts are required.
- One physical shop location.
- Accept in-shop payments and online payments.
- Appointment confirmation must include a QR code for check-in.
- Admin UI should retain the supplied dark navy sidebar, gold accents, and light dashboard content.

## Recommended stack
- Frontend: React + Vite (keep the current admin UI), deployed as static assets to Cloudflare Pages.
- Authentication and PostgreSQL: Supabase Auth + Postgres + Row Level Security (RLS).
- Backend-only logic: Supabase Edge Functions for booking, cancellation, payment initiation/webhooks, QR token validation, and admin provisioning.
- Payments: integrate a Philippines-supported provider such as PayMongo only after merchant onboarding. Provider fees apply per transaction; online payments are not literally cost-free.
- QR scanning: browser camera API through a QR scanning library. QR contains an opaque random token or booking URL, never a customer's name, phone number, or payment data.
- Source control: GitHub private repository. Keep `.env.local` and provider secrets out of Git.

## Architecture diagram

```text
Customer booking site / Admin dashboard (React + Vite)
                 |
                 | Supabase Auth session + publishable key
                 v
       Supabase Postgres + RLS
       - profiles / roles
       - services / barbers / working hours
       - appointments / queue
       - payments / POS transactions / audit log
                 ^
                 |
       Supabase Edge Functions
       - create/cancel booking atomically
       - allocate queue number
       - create and verify QR token
       - create payment session
       - validate payment webhooks
       - protected staff/admin actions
                 |
                 v
       Payment provider hosted checkout
       (provider secret stays server-side)
```

## Required user roles
- `customer`: manage their own profile; view active services/barbers; book and view only their own appointments/payments.
- `staff`: view and operate shop appointments/queue, check in QR, record POS transactions, view customers as required for operations.
- `admin`: staff access, service/pricing, barber schedules, settings, reports, audit log.

New signups must always default to `customer`. Do not let a browser request assign `staff` or `admin`. Provision staff roles through a trusted admin-only process.

## Booking and queue rules
1. Customer signs in and chooses an active service, barber (optional if assignment is supported), and slot.
2. Server calculates service duration and availability from active barber working hours and existing active appointments.
3. A server-side transaction locks the relevant queue/schedule resource, rejects conflicts, inserts the appointment, and assigns a queue number unique for the shop/date.
4. Server creates a high-entropy random QR token; database stores only its hash. QR contains an opaque token or short booking URL.
5. Staff scans QR; Edge Function verifies token, shop date and current status, then transitions `booked -> checked_in -> waiting -> in_service -> completed`.
6. Cancellation/no-show and transitions must be validated server-side. The browser must not directly set arbitrary appointment status.
7. Use idempotency keys for booking/payment requests to avoid duplicates on retries.

## Payment rules
- In-shop cash/GCash/Maya/card: staff records method, amount, and status in POS; do not store card numbers, CVVs, or wallet credentials.
- Online: create a hosted checkout/payment intent on the server, then mark paid only after a verified provider webhook. Never trust a browser redirect alone as proof of payment.
- Store provider reference, amount, status and timestamps, not payment credentials.
- Keep payment events idempotent and reconcile provider status.
- Expect transaction processing fees. “Free launch” means no required monthly platform spend while inside free quotas, not zero fees on paid transactions.

## Data model
- `profiles`: Supabase auth user, name, phone, role and active flag.
- `services`: price and duration.
- `barbers`, `barber_working_hours`: service staff and opening hours.
- `appointments`: customer, service, barber, times, queue number, status, QR token hash.
- `payments`: payment attempts, method, provider reference, status.
- `pos_transactions`: completed in-shop transaction snapshot and staff member.
- `audit_log`: important admin/staff actions.

The initial SQL migration is a schema and RLS foundation, not a complete launch-ready backend. It intentionally leaves booking/payment writes to Edge Functions/RPCs so browser clients cannot bypass scheduling, QR, or payment validation. Review policies and test them before using real customer data.

## Deployment plan
1. Create a private GitHub repository and commit this project without secrets.
2. Create a Supabase project on the free tier; save project URL and publishable/anon key in local `.env.local`.
3. Apply `supabase/migrations/202610130001_initial_schema.sql` in a development project first. Review/test policies before production.
4. Add Supabase client dependency and implement auth screens, session handling, protected routes, and role-based navigation.
5. Implement Edge Functions: `create-booking`, `cancel-booking`, `check-in-qr`, `update-appointment-status`, `create-payment`, and `payment-webhook`.
6. Replace all localStorage demo data with typed service calls to Supabase. Keep localStorage only for non-sensitive UI preferences.
7. Build customer booking screens and a QR confirmation page; then integrate real camera scanning on the staff check-in screen.
8. Integrate payment provider sandbox and verify webhook signatures. Complete merchant onboarding before enabling live payments.
9. Deploy frontend to Cloudflare Pages with `npm run build`, output `dist`. Add SPA fallback if URL routing is used.
10. Test with separate customer/staff/admin accounts, two simultaneous bookings, cancelled slots, duplicate webhook delivery, QR replay, and permission bypass attempts.
11. Before public launch: confirm privacy notice/data retention, backups/export plan, error monitoring, production domain, and payment-provider approval.

## Free-tier caveats
- Supabase free projects can pause after inactivity and have quotas; free tier does not replace a backup strategy. Check current limits before launch.
- Cloudflare Pages static assets are free within the published terms/limits; any server functions are subject to request quotas.
- Payment processing incurs per-transaction fees even when the platform has no monthly fee.
- A custom domain generally costs money. Start with the free host subdomain.

## Immediate next coding milestone
Implement Supabase authentication and replace the admin dashboard's demo reads with database queries. Do not enable live bookings or live payments until server-side booking and payment functions are complete and tested.
