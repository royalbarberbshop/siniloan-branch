# Appointment availability schedule fix

## What this fixes
The customer availability query now generates 30-minute candidate times from each eligible barber's own saved schedule row, rather than generating one shared range from the earliest opening to the latest closing time. The selected calendar date is interpreted in `Asia/Manila`, and the barber's saved weekday is matched using PostgreSQL's weekday numbering (Sunday = 0 through Saturday = 6).

The customer booking page now shows the actual Supabase RPC error instead of disguising an RPC failure as an empty schedule.

## Important: schedules are weekly recurring
The Admin → Barbers & Staff → Working Schedule editor stores one recurring row per weekday (Sunday through Saturday). It does not store a unique schedule for a specific calendar date. When a customer selects a date, the system uses that date's weekday to find the corresponding recurring schedule.

For example, if the selected date is a Wednesday, Wednesday must be enabled in that barber's saved working schedule.

## Apply
1. Test in DEMO first.
2. Run `supabase/migrations/202611150017_fix_customer_barber_schedule_availability.sql` in the DEMO Supabase SQL Editor.
3. Deploy the updated frontend.
4. Test a date for each weekday and a specific barber.
5. After DEMO verification, run the same migration in LIVE and deploy to production.

This migration replaces the existing `customer_get_available_slots` function only. It does not modify appointments, payments, barber schedules, or customer records.
