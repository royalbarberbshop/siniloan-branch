# Customer payment options phase (review build)

This patch adds the customer-facing payment choice and the database objects for payment proof submission and administrator-only approval.

## Payment rules
- `deposit_50`: customer pays 50% online; the remaining 50% is due at the shop.
- `full_100`: customer pays 100% online.
- Online proof is stored privately. A payment remains `pending` until an administrator verifies it.
- The appointment is not described as confirmed on the customer screen until verification.
- Rescheduling is not implemented by this patch; existing booking rescheduling behavior must be reviewed before enabling it.
- The current POS RPC still assumes one final payment per appointment. It must be updated to collect only the outstanding balance for deposit bookings before collecting balances through POS.

## Files
- `src/CustomerPage.jsx`: payment choice, QR display, reference number and proof upload.
- `public/media/payment/instapay-gcash-qr.jpg`: user-provided QR photo. QR image was not machine-decodable in validation; test the original QR with a second phone before accepting live payments.
- `supabase/migrations/202611110011_customer_payment_options.sql`: payment columns, booking/payment RPCs, private Storage bucket and administrator-only approval RPC.

## Apply safely
1. Back up each Supabase project.
2. Review and run the migration in DEMO first, then LIVE only after testing.
3. Confirm the `customer-payment-proofs` private Storage bucket exists.
4. Test deposit and full-payment submissions using a low-value test service and a test customer.
5. Verify that a customer cannot call `admin_verify_customer_payment` successfully.
6. Verify an admin can approve only after proof and reference number are submitted.

## Known integration work before production
- Admin UI to list pending online payment submissions, preview private proof using signed URLs, and call `admin_verify_customer_payment` is not yet added.
- POS balance-only collection and multiple payment entries per appointment are not yet added. Do not use the existing POS checkout to collect a deposit appointment's remaining balance until this is implemented.
- Customer reschedule workflow retaining the verified payment is not yet added.
- Current Appointments/Live Queue admin screens may display a `booked` appointment while payment is pending; staff must treat `payment_status = pending` as awaiting verification, not confirmed.
- The QR photo is included unchanged. It could not be decoded by the local QR reader; validate scan reliability and recipient identity before live use.

## Security
- Never put Supabase service-role keys or Meta App Secret in the frontend.
- Payment proof bucket is private; use authenticated signed URLs for admin review.
- Only the database admin role can approve payments.
