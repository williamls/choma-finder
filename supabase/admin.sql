-- Admin screen support. Run once in Supabase > SQL Editor, AFTER schema.sql (and the migration, if you needed it).
-- Then make yourself admin (see the bottom of this file).

create table admins (user_id uuid primary key references auth.users(id) on delete cascade);
alter table admins enable row level security;  -- no policies: nobody reads this table directly
revoke all on admins from anon, authenticated;

create function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid())
$$;
revoke execute on function is_admin() from public, anon;
grant execute on function is_admin() to authenticated;

-- Every vendor, including unapproved and hidden ones. Returns nothing for non-admins.
create function admin_vendors() returns table (
  id bigint, name text, phone text, area text, sells text[], note text, delivers boolean,
  approved boolean, hidden boolean, featured boolean, featured_until date, available boolean, taps_7d bigint
)
language sql stable security definer set search_path = public as $$
  select v.id, v.name, v.phone, a.name, v.sells, v.note, v.delivers,
         v.approved, v.hidden,
         coalesce(v.featured_until >= today_local(), false),
         v.featured_until,
         coalesce(v.available_date = today_local(), false),
         (select count(*) from call_taps t where t.vendor_id = v.id and t.created_at > now() - interval '7 days')
  from vendors v join areas a on a.id = v.area_id
  where is_admin()
  order by v.approved, a.sort, a.name, v.name
$$;

-- Approve, hide, and Featured end date in one go. Max 3 Featured per area.
create function admin_set_vendor(vendor bigint, approve boolean, hide boolean, feature_until date)
returns void language plpgsql security definer set search_path = public as $$
declare
  area bigint;
  others int;
begin
  if not is_admin() then raise exception 'Not allowed'; end if;
  if feature_until is not null and feature_until >= today_local() then
    select area_id into area from vendors where id = vendor;
    select count(*) into others from vendors
      where area_id = area and id <> vendor and not hidden and featured_until >= today_local();
    if others >= 3 then raise exception 'This area already has 3 Featured vendors.'; end if;
  end if;
  update vendors set approved = approve, hidden = hide, featured_until = feature_until where id = vendor;
end $$;

create function admin_delete_vendor(vendor bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Not allowed'; end if;
  delete from vendors where id = vendor;
end $$;

-- Pass area_id null to add a new area.
create function admin_save_area(area_id int, area_name text, area_sort int) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Not allowed'; end if;
  if char_length(trim(area_name)) = 0 then raise exception 'Area name is empty.'; end if;
  if area_id is null then
    insert into areas (name, sort) values (trim(area_name), area_sort);
  else
    update areas set name = trim(area_name), sort = area_sort where id = area_id;
  end if;
exception when unique_violation then raise exception 'There is already an area with that name.';
end $$;

create function admin_delete_area(area_id int) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Not allowed'; end if;
  delete from areas where id = area_id;
exception when foreign_key_violation then raise exception 'Vendors still use this area. Remove or move them first.';
end $$;

revoke execute on function admin_vendors(), admin_set_vendor(bigint, boolean, boolean, date),
  admin_delete_vendor(bigint), admin_save_area(int, text, int), admin_delete_area(int) from public, anon;
grant execute on function admin_vendors(), admin_set_vendor(bigint, boolean, boolean, date),
  admin_delete_vendor(bigint), admin_save_area(int, text, int), admin_delete_area(int) to authenticated;

-- Make yourself admin:
-- 1. Authentication > Users > Add user > your email and a strong password (tick "Auto Confirm User").
-- 2. Run this with your email:
--    insert into admins select id from auth.users where email = 'you@example.com';
