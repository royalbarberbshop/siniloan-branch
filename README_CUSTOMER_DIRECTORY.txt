ROYAL BARBER SHOP — CUSTOMER DIRECTORY SUPABASE PATCH

WHAT THIS PATCH CHANGES
- Removes the hardcoded browser-only sample customer list.
- Loads registered customer profiles from public.profiles (role = customer).
- Loads walk-in/customer-only records from public.walk_in_customers.
- Derives visit counts and last-visit dates from public.appointments.
- Refreshes the directory when profiles, walk-in customers, or appointments change.
- Saves Add Customer entries through a protected Supabase RPC.
- Keeps customer records in whichever Supabase project is currently selected (LIVE or DEMO).

APPLY THE PATCH
1. Back up or commit your current GitHub repository first.
2. Replace your project's src/App.jsx with the src/App.jsx included here.
3. Upload/run supabase/migrations/202611090009_connect_customer_directory.sql in the SQL Editor of BOTH Supabase projects (LIVE and DEMO), so the feature works in either environment.
4. Deploy the updated project through your existing GitHub Actions workflow.
5. Sign in and open Management > Customers. The sample browser list should be gone.

DATA NOTES
- This does not delete or modify existing customer records.
- Authenticated customer accounts remain in public.profiles.
- Walk-in and manually added directory entries remain in public.walk_in_customers.
- Duplicate phone numbers are displayed as one directory entry where profile and walk-in records share the same phone number.
- Visits exclude appointments marked cancelled or no_show.
- The migration creates a SECURITY DEFINER RPC that checks public.is_staff_or_admin() before inserting/updating a customer record. It does not expose a service-role key.

TESTING
- Confirm the SQL migration succeeds in each project.
- Open the Customers page and check that the sample names are no longer displayed unless they exist in Supabase.
- Add a test customer and refresh the page; the record should remain.
- Register a walk-in with that same phone number; it should remain a single directory entry and its visit count should increase.
- Switch LIVE/DEMO and confirm each directory reflects only that project's records.

BUILD STATUS
A production build was not verified in this environment because npm dependency installation timed out. Run `npm ci` and `npm run build` locally or let the GitHub Actions deployment build validate it before relying on the update.
