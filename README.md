# Royal Barber Shop — Admin Frontend Prototype

A responsive React + Vite prototype based on the supplied Royal Barber Shop admin mockup.

## Included screens
- Dashboard
- Appointments and queue management
- Live queue
- Register walk-in
- Customer directory
- Barbers and staff roster
- Services and pricing
- Point of Sale (POS)
- Sales and cash drawer
- Reports and analytics
- Settings

## Requirements
- Node.js 20+ recommended
- npm

## Run locally
```bash
npm install
npm run dev
```
Open the local URL printed by Vite (usually http://localhost:5173).

## Create a production build
```bash
npm run build
npm run preview
```
The production files are created in `dist/`.

## Deploy to GitHub Pages (free static frontend)
This repository includes `.github/workflows/deploy.yml` and `vite.config.js` for GitHub Pages. The workflow builds the Vite app and publishes `dist/` whenever you push to `main`.

1. Create a GitHub repository for this project and push the project files to the `main` branch.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions**.
4. Open the **Actions** tab and wait for **Build and deploy Royal Barber Shop to GitHub Pages** to succeed.
5. The deployed URL appears in the workflow run or under **Settings → Pages**. For a project repository, it is usually `https://YOUR-USERNAME.github.io/REPOSITORY-NAME/`.

The Vite config automatically uses the repository-name path in GitHub Actions, so you do not need to edit the base path for the normal project-site URL. Push future changes to `main` to redeploy.

For a Vite single-page application, if you later add client-side URL routing, add a GitHub Pages-compatible fallback strategy or use hash-based routing to avoid refreshes on nested paths.

## Important limitations
This is a frontend prototype, not a production-ready booking/POS system.
- It uses sample data and browser `localStorage`.
- Data is only stored in the current browser; it is not shared across staff devices.
- Login and real authentication are not implemented.
- Booking availability is not calculated from real barber schedules.
- QR codes are represented by the check-in workflow but are not actually generated/scanned.
- No real payment is processed.
- Reports are calculated from demo transactions.
- No database or backend API is connected.

Before public launch with real customer data, add a backend/database, secure authentication and role-based authorization, server-side booking conflict prevention, real QR token validation, backups, and proper payment/accounting rules. Never store real passwords or payment details in this demo.


## Production architecture foundation (in progress)
This project now includes:
- `.env.example` for frontend-safe Supabase configuration
- `src/lib/supabase.js` client initialization (requires `@supabase/supabase-js`)
- `supabase/migrations/202610130001_initial_schema.sql` initial database/RLS schema
- `docs/PRODUCTION_ARCHITECTURE.md` architecture and deployment plan

Install project dependencies with `npm install`. The Supabase client dependency is already declared in `package.json`.

This migration is a reviewed starting point, not a complete production backend. Booking writes, QR verification, online payment creation/webhooks, and trusted role provisioning must be implemented server-side before public launch. Apply it to a development Supabase project first and test all RLS policies.
