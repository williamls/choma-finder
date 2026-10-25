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

## Admin (you)
1. Run `supabase/admin.sql` in the SQL Editor (after schema.sql).
2. Authentication > Users > Add user: your email and a strong password, tick "Auto Confirm User".
3. Run: `insert into admins select id from auth.users where email = 'you@example.com';`
4. Open `/admin.html`, log in. There you approve new listings (call the vendor first), hide or delete listings,
   set a Featured end date (max 3 per area), and add, rename, reorder or delete areas.
The admin password lives in Supabase, never in this code. Do not put it in `.env`.
If a vendor forgets their password: Authentication > Users, find `2567...@vendors.example.com`, set a new one.

## Deploy to Cloudflare Pages
Connect the git repo. Build command `node build.js`, output folder `dist`.
Add `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `DEFAULT_COUNTRY_CODE` under Settings > Variables.
