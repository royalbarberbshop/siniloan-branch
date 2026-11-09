ROYAL BARBER SHOP — DEMO + LIVE MODE PATCH

Adds Settings > Data Environment selector. LIVE remains the existing project; DEMO requires a second Supabase project.

Before switching to DEMO:
1. Create the separate DEMO Supabase project.
2. Run all migrations in supabase/migrations in filename order.
3. Create a separate admin Auth user and active admin profile in DEMO.
4. Add all four GitHub Actions Variables listed in docs/DUAL_DEMO_LIVE_MODE.md.
5. Never expose service-role keys or database passwords.

Deploy by replacing corresponding project files, keeping .github/workflows/static.yml deleted, then commit and push to main. Verify GitHub Actions and test both modes.
