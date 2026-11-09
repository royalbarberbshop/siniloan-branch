# Royal Barbershop customer-page media

Place image files in these folders. The customer page is served from the repository's GitHub Pages subpath, so reference files with paths beginning `/media/...` in the source (Vite's configured base rewrites public assets at build time where applicable).

- `logo/royal-barber-logo.png` — optional transparent shop logo (PNG or WebP).
- `banners/shop-banner.jpg` — optional wide hero/background photo (JPG/WebP, landscape recommended).
- `services/` — service photos, e.g. `classic-haircut.jpg`, `fade-haircut.jpg`, `beard-trim.jpg`.
- `barbers/` — barber portraits, preferably square JPG/WebP.
- `icons/` — optional small decorative icons.

The logo and banner are optional; the page displays a text/letter mark and a solid navy fallback when they are missing. Keep filenames lowercase and use hyphens. Do not put private customer images or payment screenshots in this public folder: everything in `public/` is publicly downloadable.
