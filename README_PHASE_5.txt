ROYAL BARBER SHOP — PHASE 5: POINT OF SALE

Before deploying, run this migration in Supabase SQL Editor:
supabase/migrations/202611080007_connect_pos_transactions.sql

Then replace the matching project files, keep .github/workflows/static.yml deleted,
commit and push to GitHub, and wait for the GitHub Actions deployment.

Full notes and test steps: docs/POS_SUPABASE_PHASE.md

This phase records payments entered by authorized staff. It does not process a
card charge or independently verify GCash. Do not expose a Supabase service-role key.
