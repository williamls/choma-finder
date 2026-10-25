-- Only needed if you ALREADY ran schema.sql before manual approval was added. Skip on a fresh project.
alter table vendors add column approved boolean not null default false;
update vendors set approved = true;  -- keep existing test listings visible

create or replace view listings as
select v.id, v.name, v.phone, a.name as area, v.sells, v.note, v.delivers,
       coalesce(v.available_date = today_local(), false) as available,
       coalesce(v.featured_until >= today_local(), false) as featured
from vendors v join areas a on a.id = v.area_id
where v.approved and not v.hidden;

drop view my_listing;
create view my_listing with (security_invoker = true) as
select v.*, coalesce(v.available_date = today_local(), false) as available_today
from vendors v;
grant select on my_listing to authenticated;

create or replace function reset_approval() returns trigger
language plpgsql as $$
begin
  if auth.uid() = old.owner_id and (new.name <> old.name or new.phone <> old.phone) then
    new.approved := false;
  end if;
  return new;
end $$;
create trigger vendors_reset_approval before update on vendors
for each row execute function reset_approval();

create or replace function log_call(vendor bigint) returns void
language sql security definer set search_path = public as $$
  insert into call_taps (vendor_id) select id from vendors where id = vendor and approved and not hidden;
$$;
