# Dual Environment: DEMO and LIVE

## Safety model
- LIVE uses the existing production Supabase project.
- DEMO uses a second, separate Supabase project.
- LIVE is the default unless this browser previously selected DEMO.
- The selected environment is stored only in this browser local storage.
- Each project has separate Auth users, profiles, tables, policies, and records.
- Switching reloads the app and requires signing in to the selected project's admin account.
- Switching does not copy, merge, delete, or reset data.

## Create the DEMO project
1. Create a new Supabase project, e.g. `royal-barber-demo`.
2. In its SQL Editor, run every migration in `supabase/migrations/` in filename order, beginning with `202610130001_initial_schema.sql`.
3. Create a separate demo admin user in DEMO Authentication > Users.
4. Assign the matching profile `role='admin'` and `is_active=true`, using the admin provisioning procedure.
5. Add demo-only sample barbers, services, appointments, and transactions to DEMO only.
6. Test all connected modules in DEMO before staff training.

## GitHub Actions repository Variables
Set these in Settings > Secrets and variables > Actions > Variables:
- `VITE_LIVE_SUPABASE_URL` — existing LIVE project URL
- `VITE_LIVE_SUPABASE_ANON_KEY` — existing LIVE anon/publishable key
- `VITE_DEMO_SUPABASE_URL` — DEMO project URL
- `VITE_DEMO_SUPABASE_ANON_KEY` — DEMO anon/publishable key

These are public browser client values. Supabase RLS and policies must protect data. Never add a service-role key or database password. Existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are accepted as LIVE fallbacks.

## Switching in the admin page
1. Deploy the updated app and sign in.
2. Open Settings > Data Environment.
3. Choose Use Demo Data or Use Live Data and confirm.
4. The app reloads. Sign in with the admin account belonging to that Supabase project.
5. Confirm the environment label before entering data.

## Operating rules
- DEMO is for training, walkthroughs, sample queues, and demonstrations.
- LIVE is for real customers, appointments, payments, and cash drawer activity.
- Never put sample records in LIVE.
- Perform demo resets only in the DEMO project. Never run wipe/reset SQL against LIVE.
- Browser-only Customers and Settings data may remain local to each browser and are not automatically synchronized.
- The environment selector does not replace RLS; keep policies enabled and reviewed in both projects.
