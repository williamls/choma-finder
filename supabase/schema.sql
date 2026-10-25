-- Choma Finder database. Paste into Supabase > SQL Editor > Run (safe to run once on a new project).

-- Change this if your town is not in East Africa Time. It decides when "Available today" rolls over.
create function today_local() returns date
language sql stable as $$ select (now() at time zone 'Africa/Nairobi')::date $$;

create table areas (
  id   int generated always as identity primary key,
  name text not null unique,
  sort int not null default 0
);

create table vendors (
  id             bigint generated always as identity primary key,
  owner_id       uuid not null unique default auth.uid() references auth.users(id) on delete cascade,
  name           text not null check (char_length(name) between 1 and 80),
  phone          text not null check (phone ~ '^[0-9+ ()-]{7,20}$'),
  area_id        int  not null references areas(id),
  sells          text[] not null check (
                   cardinality(sells) > 0
                   and sells <@ array['chicken','goat','pork','beef','fish','local']::text[]),
  note           text not null default '' check (char_length(note) <= 280),
  delivers       boolean not null default false,
  available_date date,          -- "Available today" means this equals today_local(), so it resets itself
  featured_until date,          -- set by admin (step 3)
  hidden         boolean not null default false,  -- set by admin (step 3)
  created_at     timestamptz not null default now()
);

create table call_taps (
  id         bigint generated always as identity primary key,
  vendor_id  bigint not null references vendors(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table areas     enable row level security;
alter table vendors   enable row level security;
alter table call_taps enable row level security;

create policy "anyone reads areas" on areas for select using (true);

create policy "owner reads own vendor"   on vendors for select to authenticated using (owner_id = auth.uid());
create policy "owner inserts own vendor" on vendors for insert to authenticated with check (owner_id = auth.uid());
create policy "owner updates own vendor" on vendors for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner deletes own vendor" on vendors for delete to authenticated using (owner_id = auth.uid());

-- Vendors may only touch their own listing fields, never hidden / featured_until / available_date.
revoke all on vendors from anon, authenticated;
grant select on vendors to authenticated;
grant insert (name, phone, area_id, sells, note, delivers) on vendors to authenticated;
grant update (name, phone, area_id, sells, note, delivers) on vendors to authenticated;
grant delete on vendors to authenticated;

grant select on areas to anon, authenticated;
revoke all on call_taps from anon, authenticated;

-- What customers see: no owner ids, hidden listings left out.
-- (Runs with the view owner's rights on purpose, so customers never read the vendors table directly.)
create view listings as
select v.id, v.name, v.phone, a.name as area, v.sells, v.note, v.delivers,
       coalesce(v.available_date = today_local(), false) as available,
       coalesce(v.featured_until >= today_local(), false) as featured
from vendors v join areas a on a.id = v.area_id
where not v.hidden;
grant select on listings to anon, authenticated;

-- A vendor's own listing, plus whether it is switched on today.
create view my_listing with (security_invoker = true) as
select v.*, coalesce(v.available_date = today_local(), false) as available_today
from vendors v;
grant select on my_listing to authenticated;

create function set_available(on_ boolean) returns void
language sql security definer set search_path = public as $$
  update vendors set available_date = case when on_ then today_local() end
  where owner_id = auth.uid();
$$;
revoke execute on function set_available(boolean) from public, anon;
grant execute on function set_available(boolean) to authenticated;

create function log_call(vendor bigint) returns void
language sql security definer set search_path = public as $$
  insert into call_taps (vendor_id) select id from vendors where id = vendor and not hidden;
$$;
grant execute on function log_call(bigint) to anon, authenticated;

-- Placeholder areas. Edit here, or wait for the admin screen in step 3.
insert into areas (name, sort) values
  ('Town Centre', 1), ('Northside', 2), ('Riverside', 3), ('Hilltop', 4);
