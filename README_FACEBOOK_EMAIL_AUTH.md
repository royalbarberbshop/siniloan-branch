# Royal Barber Shop — Facebook + Email Sign-in Update

Replace `src/CustomerPage.jsx` in the existing same-repository customer booking phase with this file.

## Sign-in options
- Facebook OAuth via Supabase Auth (`provider: "facebook"`).
- Email/password registration and sign-in remain available.

## Required Supabase / Meta configuration
1. In Supabase Dashboard, open **Authentication → Providers → Facebook** and enable Facebook.
2. Create/configure a Facebook app in Meta for Developers, add the Facebook Login product, and use the OAuth callback URL displayed by Supabase as the Valid OAuth Redirect URI in Meta.
3. Paste the Meta App ID and App Secret into the Supabase Facebook provider settings. Do not put the App Secret in the React app or GitHub repository.
4. In Supabase **Authentication → URL Configuration**, add the deployed customer URL to Redirect URLs, for example:
   `https://royalbarberbshop.github.io/siniloan-branch/book`
   Also add the local development URL if needed, e.g. `http://localhost:5173/book`.
5. Ensure the Facebook app requests the `email` permission and is switched to Live mode when ready for public customers. Meta may require app review/business verification depending on the permissions and use case.

## Notes
- Email sign-up/login continues to use Supabase `signUp` and `signInWithPassword`.
- Facebook login returns to `/book`.
- First-time Facebook users are expected to be provisioned by the existing Supabase `handle_new_user` trigger, with role `customer`.
- Build/deployment must be tested in the repository after applying the patch.
