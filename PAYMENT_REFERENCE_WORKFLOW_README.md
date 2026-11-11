# Royal Barber Shop — GCash reference payment workflow

This patch changes online customer booking to require a GCash transaction reference number (no screenshot upload), with either a 50% downpayment or 100% full payment.

## Files in this patch
- `src/CustomerPage.jsx` — customer payment choice, QR display, reference number submission, waiting-for-confirmation receipt.
- `src/App.jsx` — admin reference display and approve/reject actions; POS amount calculation subtracts the verified online payment.
- `supabase/migrations/202611110011_gcash_reference_payment_workflow.sql` — atomic booking/payment creation, unique reference enforcement, admin-only verification, and POS remaining-balance validation.
- `public/media/gcash-qr.jpg` — supplied QR image copied without modification.

## Before committing
1. Copy the files into the matching paths in your repository (or extract this patch over a clean copy of the same project version).
2. Check that `public/media/gcash-qr.jpg` is the QR image you intend customers to scan. Scan-test it with another phone. The supplied photo is slightly soft; use a clearer original if available.
3. Review the SQL migration. Apply it to the DEMO Supabase project first, not LIVE.
4. Build and test in DEMO before deploying. The build could not be verified in this environment because `npm ci` repeatedly timed out while downloading dependencies.
5. Test a 50% deposit, a full payment, duplicate reference rejection, admin approve/reject, and POS balance collection. Then test LIVE only after DEMO passes.

## Customer workflow
- The customer selects 50% deposit or 100% full payment.
- The customer scans the shop QR and enters the numeric transaction reference (6–25 digits).
- The database creates the appointment and pending GCash payment in one transaction.
- The appointment displays **Waiting for Confirmation** until an active administrator approves the payment.
- Approval records the payment as paid and sets `payment_verified_at`. Full payment marks the appointment paid; a deposit leaves the balance outstanding.
- Rejection marks the payment failed and cancels the appointment.
- Reference numbers are unique; a duplicate submission is rejected.

## Important limitations to verify before production
- The existing project does not yet expose a customer self-service reschedule control. This patch does not implement a new rescheduling screen or reschedule RPC. Do not advertise customer rescheduling as newly implemented until that is added and tested. Existing payment rows remain linked to their original appointment; rescheduling must move/relink the appointment safely without asking for another payment.
- The admin approval function is restricted to an active `admin` role. Staff may view the reference only if existing RLS permits it, but cannot approve.
- The POS RPC validates the outstanding amount against the appointment's stored service price minus approved online payments. Verify that the POS screen uses the appointment's original service price when linked.
- `payment_status='pending'` means an approved 50% deposit still has a balance. `payment_verified_at` distinguishes that approved deposit from a payment awaiting review.
- The admin approval controls are in Appointments. Ensure the Supabase payment read policy allows admins to read linked `payments` rows.
- This is manual reference checking; the app cannot independently verify GCash transfers. The administrator must compare the submitted reference and amount against the actual received transaction in GCash.

## Deployment caution
Do not run this migration on LIVE until DEMO has passed the tests above and the rescheduling workflow has been completed. Never add a Supabase service-role key to frontend code or GitHub Pages variables.
