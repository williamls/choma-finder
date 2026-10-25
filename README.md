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
4. Authentication > Sign In / Providers > Email: keep Email on, turn OFF "Confirm email". (Vendors log in with phone number + password, so no SMS is paid for. Do not enable the Phone provider.)
5. If you ran an older schema.sql before manual approval existed, also run `supabase/migrate-manual-approval.sql`.

## Approving vendors (by hand, no SMS)
A new listing is hidden until approved. Call or WhatsApp the number they gave, then in Supabase
Table Editor > vendors, tick `approved` on that row. (The admin screen in step 3 will do this for you.)
If a vendor forgets their password: Authentication > Users, find `2567...@vendors.example.com`, and set a new one.

## Deploy to Cloudflare Pages
Connect the git repo. Build command `node build.js`, output folder `dist`.
Add `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `DEFAULT_COUNTRY_CODE` under Settings > Variables.
