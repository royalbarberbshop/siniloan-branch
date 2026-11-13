# Customer page - corrected layout, v3 (fixes the Vite "minifyCSS" build failure)

Overwrite these 4 files in your project (same folders). Only src/customer-corrected.css differs from v2.
- src/CustomerPage.jsx
- src/customer-corrected.css   <- THE FIX
- public/royal-logo.png
- public/haircut.jpg

## Cause of the build failure
src/customer-corrected.css (new in v2) began with leftover text from a removed Google Fonts @import:
    500;600;700;800&display=swap');
My @import-stripping pattern stopped at the first ";" inside the font URL (wght@400;500;600;...). The stray
text + unterminated quote is invalid CSS and made Vite's CSS minifier abort. src/styles.css (admin) was NOT the problem.
The font is still loaded (the page's own style block keeps the @import).

## Checked
- Strict scan: both CSS files have balanced braces/quotes and no stray text; browser (Chromium) parses 215/215 rules.
- The same scan flags the v2 file (stray ";" statements + unterminated string).
- Page renders; CSS variables (--gold, --navy) resolve.
## NOT checked
The real `npm run build` (needs a full npm install; not possible in the AI sandbox). Please run it or push to a DEMO branch / Actions.
