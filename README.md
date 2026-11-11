# Royal Barbershop – Admin Working Schedule + Customer Availability

This patch adds an admin-controlled weekly schedule editor to **Barbers & Staff** and connects the customer booking calendar to the saved barber working hours.

## Included
- `src/App.jsx` – adds a **Working Schedule** action to every barber card. Admins can enable/disable each weekday and set opening/closing times. Defaults are 7:00 AM–7:00 PM.
- `src/CustomerPage.jsx` – customer booking page with availability loaded from the `customer_get_available_slots` RPC.
- `supabase/migrations/202611110012_customer_slot_availability.sql` – availability RPC.
- `supabase/migrations/202611110013_admin_barber_working_schedule.sql` – grants required for authenticated admin schedule editing; existing RLS policies still enforce admin/staff write access.

## Apply
1. Back up your current GitHub repository branch.
2. Replace `src/App.jsx` and `src/CustomerPage.jsx` with the files in this patch.
3. Run both SQL migration files in Supabase SQL Editor, in numerical order (012, then 013). If migration 012 was already applied, do not rerun it unless you intend to replace that function definition.
4. Commit and push the changed files. Wait for GitHub Actions to finish.
5. Sign in to the admin page, open **Barbers & Staff**, choose **Working Schedule** for KAEL, enable his working days, leave rest days unchecked, and save. Hours default to 7:00 AM–7:00 PM.
6. Open the customer booking page, select a service, choose KAEL or Any Available Barber, and test a future date/time.

## Important
- This patch does not insert a schedule automatically. The admin must explicitly choose working days for each barber.
- It does not change existing appointment, payment, or customer records.
- Customer availability will remain empty for a barber/date until that barber has an enabled schedule for that weekday.
- The availability RPC expects `services.duration_minutes`, `barbers.is_active`, `appointments.starts_at`, `appointments.ends_at`, and `appointments.status`, matching this project's schema.
- Test in the DEMO Supabase environment first if configured. Do not apply to LIVE until you have reviewed and approved it.
