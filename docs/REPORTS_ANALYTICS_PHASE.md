# Phase 7 — Reports & Analytics

This update enhances the existing Reports & Analytics page using the POS transaction and appointment data already loaded by the admin app. No database migration is required.

## Included
- Reporting periods: Today, Last 7 days, Last 30 days, and All recorded dates.
- Revenue, paid transaction count, average transaction value, and appointment count.
- Payment-method value breakdown.
- Top services by recorded transaction count and value.
- Appointment status summary.
- Completed appointments grouped by barber.
- Recent transaction list and CSV export for the selected period.

## Data definitions / limitations
- Revenue is the sum of records currently loaded from `public.pos_transactions`; the current POS loader represents paid transactions.
- Appointment activity is grouped using the appointment `queue_date` returned by the existing appointments loader.
- Barber performance counts completed appointments by assigned/preferred barber label. It does not claim barber-attributed revenue because the current POS transaction display query does not include barber attribution.
- Customer count is intentionally omitted because the Customers module is not yet a fully database-backed reporting source.
- Cash drawer reconciliation remains in Sales & Cash Drawer.

## Deployment
No SQL migration is required. Replace the corresponding project files, commit, and push. Keep `.github/workflows/static.yml` deleted; deploy with the existing GitHub Actions workflow.
