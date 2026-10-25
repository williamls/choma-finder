# Choma Finder

See SPEC.md. Customer page: `index.html`. Vendor page: `vendor.html`.

## Run on your phone
```
node build.js
npx serve -l 3000 dist
```
Phone on the same Wi-Fi: open `http://<your-PC-IP>:3000` (find the IP with `ipconfig`).
Run `node build.js` again after any change. With no `.env`, the customer page shows sample data (`data.js`).

## Set up Supabase (once)
1. Create a project at supabase.com.
2. SQL Editor: paste and run `supabase/schema.sql`. Check the time zone at the top first.
3. Project Settings > API: copy the Project URL and `anon` key into `.env` (see `.env.example`).
4. Authentication > Sign In / Providers > Phone: turn it on and choose your SMS provider.
   For testing without paying for SMS, add your own number under "Test Phone Numbers and OTPs".
5. Authentication > URL Configuration: add your site address (local and Cloudflare) if asked.

## Deploy to Cloudflare Pages
Connect the git repo. Build command `node build.js`, output folder `dist`.
Add `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `DEFAULT_COUNTRY_CODE` under Settings > Variables.
