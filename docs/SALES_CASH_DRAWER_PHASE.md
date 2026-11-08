# Royal Barber Shop — Phase 6: Sales & Cash Drawer

This phase builds on the working Supabase POS transaction module.

## Included

- Sales list filtered by Philippine-local business date and payment method.
- Revenue, cash-sales, and non-cash-sales summaries.
- Persistent cash drawer sessions with opening float.
- Cash-in and cash-out movements with mandatory reason.
- Closing reconciliation with expected cash, actual counted cash, and discrepancy.
- Server-side calculation and audit-log records for opening, movement, and closing.
- Database policies restrict reads to authenticated staff/admin; writes happen through security-definer RPCs.

## Apply the migration

Run `supabase/migrations/202611080008_sales_cash_drawer.sql` in Supabase SQL Editor after the earlier POS migration.

## Deploy

Replace the matching files in the existing repository, keep `.github/workflows/static.yml` deleted, commit, and push. GitHub Actions should deploy the Vite `dist` folder.

## First-use test

1. Open Sales & Cash Drawer and open a session with the actual opening cash float.
2. Record one POS sale paid in Cash; verify expected cash increases by that amount.
3. Record a GCash/Card sale; verify expected cash does not increase.
4. Record Cash In and Cash Out movements with reasons; verify expected cash changes accordingly.
5. Count the physical cash, enter actual cash, and close the drawer.
6. Verify the closing summary shows expected cash, actual cash, and discrepancy.
7. Refresh the page and verify the latest closed session summary remains visible.

## Important accounting behavior

Expected cash is computed by the database at close time as:

`opening cash + paid cash POS transactions during the session + cash-in - cash-out`

GCash, Maya, QRPH, card, and bank-transfer payments are not included in physical cash. A session is single-open per project database. Refund processing, voids, multiple tills/branches, and manager approval workflows are not included in this phase.

## Verification status

A local production build could not be run in the provided environment because the Vite executable is missing from `node_modules`. Confirm the GitHub Actions build succeeds before testing the deployed app.
