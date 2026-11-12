# Customer page redesign (matches "Costumer page.pdf" mockup)

Changed file (only one): src/CustomerPage.jsx
No SQL migration. No admin files changed. Original saved by you in GitHub history.

## Build status
NOT verified with `npm run build` (npm install fails in the AI sandbox). Verified only: JSX syntax parses, no undefined variable names.
Run `npm install && npm run build` locally, then test in DEMO before LIVE.

## Requires in the DEMO/LIVE database (already in repo migrations; confirm they are applied)
- customer_get_today_live_queue      (202611110015)
- customer_get_available_slots       (202611110012)
- customer_create_paid_appointment   (202611110011_gcash_reference_payment_workflow)

## Things to confirm / replace
- Phone +63 912 345 6789 and email royalbarbers@gmail.com came from the mockup (SHOP constant, top of file).
- Hours shown: 7:00 AM - 7:00 PM (handover). Mockup said 9-8. Real availability comes from barber_working_hours.
- Wait estimate = 15 min x customers ahead (MIN_PER_CUSTOMER constant).
- Optional images: public/media/logo/royal-barber-logo.png (falls back to a drawn R crest).
- Map is a Google Maps link, not an embedded image. Contact form opens the visitor's email app (mailto).
