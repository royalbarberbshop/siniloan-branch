# Phase 5 — Point of Sale connected to Supabase

## Included
- POS now reads the active service catalog from Supabase.
- Staff can select one or more services and record a Cash, GCash, Card, or Other payment.
- Transactions are created through the `admin_record_pos_transaction` database function. Direct browser inserts are not used.
- The function requires an authenticated staff/admin profile, stores the authenticated staff ID, records a customer-name snapshot, and writes an audit-log event.
- When linked to an appointment, checkout only accepts `In Service` or unpaid `Completed` appointments, locks the appointment row, prevents a second paid checkout, and atomically marks the appointment Completed/Paid.
- Walk-in checkout can be recorded without a profile customer or linked appointment.
- Sales & Cash Drawer, Dashboard, and Reports now read actual POS transaction records rather than the old demo sales array.
- POS transaction inserts are added to Supabase Realtime for cross-session sales refresh.

## Apply
1. In Supabase SQL Editor, run `supabase/migrations/202611080007_connect_pos_transactions.sql`.
2. Replace the corresponding project files with this archive's files.
3. Keep `.github/workflows/static.yml` deleted. The project should deploy only with `.github/workflows/deploy.yml`.
4. Commit and push to `main`, then wait for the GitHub Actions deployment.

## Test
1. Open Point of Sale and confirm active services appear.
2. Put an appointment into `In Service` using Live Queue. Select it in POS, add its service, and record a Cash test payment.
3. Confirm the appointment changes to Completed and Paid.
4. Refresh. Confirm the transaction appears in Sales & Cash Drawer and remains there.
5. Open a second admin session and confirm the new transaction appears after Realtime notification.
6. Try paying the same appointment again; the database should reject the duplicate.
7. Record a walk-in sale without linking an appointment and confirm it persists.

## Boundaries
- This records a payment declared received by staff. It does not charge cards, contact a payment gateway, or verify a GCash transfer automatically.
- Cash drawer opening/closing, cash count reconciliation, refunds, discounts, and itemized line-item storage are not part of this phase.
- The current schema stores the service names as a transaction snapshot string and total amount, not separate POS line items.
