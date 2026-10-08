create type public.app_role as enum ('admin','user');
create type public.verification_status as enum ('none','pending','approved','rejected');
create type public.request_status as enum ('pending','accepted','paid','dispatched','received','returned','completed','cancelled','declined','expired','disputed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  city text not null default '',
  address text,
  pincode text,
  is_18_plus boolean not null default false,
  agreement_accepted_at timestamptz,
  kyc_consent_at timestamptz,
  verification_status public.verification_status not null default 'none',
  rejection_reason text,
  suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
grant execute on function public.has_role(uuid,public.app_role) to authenticated;
create policy "own roles readable" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin')) with check (id = auth.uid() or public.has_role(auth.uid(),'admin'));

create or replace function public.protect_profile_fields() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.has_role(auth.uid(),'admin') or auth.uid() is null then new.updated_at := now(); return new; end if;
  if new.suspended is distinct from old.suspended or new.rejection_reason is distinct from old.rejection_reason then raise exception 'not allowed'; end if;
  if new.verification_status is distinct from old.verification_status then raise exception 'Use the verification review process'; end if;
  if new.agreement_accepted_at is distinct from old.agreement_accepted_at or new.kyc_consent_at is distinct from old.kyc_consent_at then raise exception 'Use the verification form'; end if;
  new.updated_at := now(); return new;
end $$;
create trigger profiles_protect before update on public.profiles for each row execute function public.protect_profile_fields();

create or replace function public.create_profile_on_signup() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id,full_name) values(new.id,coalesce(new.raw_user_meta_data->>'full_name','')) on conflict(id) do nothing;
  return new;
end $$;
create trigger indrobe_profile_signup after insert on auth.users for each row execute function public.create_profile_on_signup();

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  category text not null,
  size text not null,
  measurements text not null default '',
  city text not null,
  item_value integer not null check (item_value > 0 and item_value <= 5000),
  price_per_day integer not null check (price_per_day > 0),
  deposit integer not null,
  condition text not null,
  cleaning_method text not null check (cleaning_method in ('hand_wash','machine_wash','dry_clean')),
  cleaning_instructions text not null default '',
  ownership_confirmed boolean not null check (ownership_confirmed = true),
  status text not null default 'draft' check (status in ('draft','active','paused')),
  created_at timestamptz not null default now(),
  check (deposit = item_value)
);
grant select on public.listings to anon;
grant select, insert, update, delete on public.listings to authenticated;
grant all on public.listings to service_role;
alter table public.listings enable row level security;

create table public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  path text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.listing_photos to anon;
grant select, insert, delete on public.listing_photos to authenticated;
grant all on public.listing_photos to service_role;
alter table public.listing_photos enable row level security;
create policy "active listings public" on public.listings for select to anon, authenticated using (status = 'active' or owner_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "owner insert draft" on public.listings for insert to authenticated with check (owner_id = auth.uid() and deposit = item_value and status = 'draft');
create policy "owner update listing" on public.listings for update to authenticated using (owner_id = auth.uid() or public.has_role(auth.uid(),'admin')) with check ((owner_id = auth.uid() or public.has_role(auth.uid(),'admin')) and deposit = item_value and (status <> 'active' or (select count(*) from public.listing_photos p where p.listing_id = id) >= 3));
create policy "owner delete draft listing" on public.listings for delete to authenticated using (owner_id = auth.uid() and status = 'draft');
create policy "listing photos readable" on public.listing_photos for select to anon, authenticated using (exists (select 1 from public.listings l where l.id = listing_id and (l.status = 'active' or l.owner_id = auth.uid() or public.has_role(auth.uid(),'admin'))));
create policy "owner photos insert" on public.listing_photos for insert to authenticated with check (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = auth.uid() and l.status = 'draft'));
create policy "owner photos delete" on public.listing_photos for delete to authenticated using (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = auth.uid() and l.status = 'draft'));

create table public.rental_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete restrict,
  renter_id uuid not null references public.profiles(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  days integer not null,
  rental_fee integer not null,
  deposit integer not null,
  same_city boolean not null,
  blocked_start date not null,
  blocked_end date not null,
  status public.request_status not null default 'pending',
  expires_at timestamptz,
  cleaning_attested boolean not null default false,
  cancel_reason text,
  accepted_at timestamptz, paid_at timestamptz, dispatched_at timestamptz,
  received_at timestamptz, returned_at timestamptz, completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.rental_requests to authenticated;
grant all on public.rental_requests to service_role;
alter table public.rental_requests enable row level security;
create policy "parties read requests" on public.rental_requests for select to authenticated using (renter_id = auth.uid() or owner_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table public.condition_photos (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.rental_requests(id) on delete cascade,
  kind text not null check (kind in ('dispatch','receipt','return')),
  path text not null,
  uploaded_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now()
);
grant select, insert on public.condition_photos to authenticated;
grant all on public.condition_photos to service_role;
alter table public.condition_photos enable row level security;
create policy "parties read condition photos" on public.condition_photos for select to authenticated using (exists (select 1 from public.rental_requests r where r.id = request_id and (r.renter_id = auth.uid() or r.owner_id = auth.uid())) or public.has_role(auth.uid(),'admin'));
create policy "stage photo insert" on public.condition_photos for insert to authenticated with check (uploaded_by = auth.uid() and exists (select 1 from public.rental_requests r where r.id = request_id and ((kind = 'dispatch' and r.owner_id = auth.uid() and r.status = 'paid') or (kind = 'receipt' and r.renter_id = auth.uid() and r.status = 'dispatched') or (kind = 'return' and r.renter_id = auth.uid() and r.status = 'received'))));

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.rental_requests(id) on delete cascade,
  razorpay_order_id text not null unique,
  razorpay_payment_id text,
  amount integer not null,
  status text not null default 'created' check (status in ('created','paid','failed','refunded')),
  refunded_amount integer not null default 0,
  giver_payout_status text not null default 'held' check (giver_payout_status in ('held','due','settled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.payments to authenticated;
grant all on public.payments to service_role;
alter table public.payments enable row level security;
create policy "parties read payments" on public.payments for select to authenticated using (exists (select 1 from public.rental_requests r where r.id = request_id and (r.renter_id = auth.uid() or r.owner_id = auth.uid())) or public.has_role(auth.uid(),'admin'));

create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.rental_requests(id) on delete cascade,
  raised_by uuid not null references public.profiles(id),
  reason text not null,
  status text not null default 'open' check (status in ('open','resolved')),
  resolution text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.disputes to authenticated;
grant all on public.disputes to service_role;
alter table public.disputes enable row level security;
create policy "parties read disputes" on public.disputes for select to authenticated using (raised_by = auth.uid() or exists (select 1 from public.rental_requests r where r.id = request_id and (r.renter_id = auth.uid() or r.owner_id = auth.uid())) or public.has_role(auth.uid(),'admin'));
create policy "parties open disputes" on public.disputes for insert to authenticated with check (raised_by = auth.uid() and status = 'open' and exists (select 1 from public.rental_requests r where r.id = request_id and (r.renter_id = auth.uid() or r.owner_id = auth.uid()) and r.status in ('paid','dispatched','received','returned')));
create policy "admin update disputes" on public.disputes for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null default '',
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, update on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "own notifications read" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "own notifications update" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.notify(_user uuid, _title text, _body text, _link text)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications(user_id,title,body,link) values (_user,_title,_body,_link);
$$;
revoke execute on function public.notify(uuid,text,text,text) from public, anon, authenticated;

create or replace function public.submit_profile_verification(_full_name text,_phone text,_city text,_address text,_pincode text,_is_18_plus boolean,_agreement boolean,_kyc_consent boolean)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); current_status public.verification_status;
begin
  if me is null then raise exception 'Sign in required'; end if;
  if not _is_18_plus then raise exception 'You must be 18 or older to use Indrobe'; end if;
  if not _agreement or not _kyc_consent then raise exception 'Accept both the rental agreement and identity-check consent'; end if;
  if length(trim(coalesce(_full_name,''))) < 2 or length(trim(coalesce(_phone,''))) < 8 or length(trim(coalesce(_city,''))) < 2 or length(trim(coalesce(_address,''))) < 5 then raise exception 'Complete all required details'; end if;
  select verification_status into current_status from public.profiles where id=me for update;
  if current_status not in ('none','rejected','pending') then raise exception 'Verification is already approved'; end if;
  update public.profiles set full_name=trim(_full_name),phone=trim(_phone),city=trim(_city),address=trim(_address),pincode=trim(_pincode),is_18_plus=true,agreement_accepted_at=case when _agreement then coalesce(agreement_accepted_at,now()) else null end,kyc_consent_at=case when _kyc_consent then now() else null end,verification_status='pending',rejection_reason=null,updated_at=now() where id=me;
  perform public.notify(me,'Verification submitted','Your account is awaiting manual review.','/profile');
end $$;
grant execute on function public.submit_profile_verification(text,text,text,text,text,boolean,boolean,boolean) to authenticated;

create or replace function public.admin_set_verification(_user uuid,_status public.verification_status,_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
 if not public.has_role(auth.uid(),'admin') then raise exception 'Forbidden'; end if;
 if _status not in ('approved','rejected') then raise exception 'Invalid review status'; end if;
 update public.profiles set verification_status=_status,rejection_reason=case when _status='rejected' then _reason else null end,updated_at=now() where id=_user;
 perform public.notify(_user,case when _status='approved' then 'Identity approved' else 'Identity needs another try' end,coalesce(_reason,'Your identity check was approved.'),'/profile');
end $$;
grant execute on function public.admin_set_verification(uuid,public.verification_status,text) to authenticated;

create or replace function public.admin_suspend_user(_user uuid,_suspended boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
 if not public.has_role(auth.uid(),'admin') then raise exception 'Forbidden'; end if;
 update public.profiles set suspended=_suspended,updated_at=now() where id=_user;
end $$;
grant execute on function public.admin_suspend_user(uuid,boolean) to authenticated;

create or replace function public.admin_resolve_dispute(_id uuid,_resolution text)
returns void language plpgsql security definer set search_path = public as $$
begin
 if not public.has_role(auth.uid(),'admin') then raise exception 'Forbidden'; end if;
 update public.disputes set status='resolved',resolution=_resolution where id=_id;
end $$;
grant execute on function public.admin_resolve_dispute(uuid,text) to authenticated;

create or replace function public.get_blocked_ranges(_listing uuid)
returns table(blocked_start date,blocked_end date) language sql stable security definer set search_path = public as $$
  select r.blocked_start,r.blocked_end from public.rental_requests r where r.listing_id=_listing and r.status in ('pending','accepted','paid','dispatched','received','returned','disputed') and (r.expires_at is null or r.expires_at>now())
$$;
grant execute on function public.get_blocked_ranges(uuid) to anon,authenticated;

create or replace function public.create_rental_request(_listing uuid,_start date,_end date)
returns uuid language plpgsql security definer set search_path = public as $$
declare l record; p record; d integer; same boolean; transit integer; clean integer; bs date; be date; new_id uuid;
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 select * into p from public.profiles where id=auth.uid();
 if p is null or p.full_name='' or p.phone='' or p.city='' then raise exception 'Complete your profile with your name, phone and city first'; end if;
 if p.suspended then raise exception 'Your account is suspended'; end if;
 select * into l from public.listings where id=_listing and status='active';
 if l is null then raise exception 'Listing not available'; end if;
 if l.owner_id=auth.uid() then raise exception 'You cannot rent your own item'; end if;
 if _start<current_date+2 then raise exception 'Start date must be at least 2 days from today'; end if;
 d:=(_end-_start)+1;
 if d<1 or d>10 then raise exception 'Rentals must be 1 to 10 days'; end if;
 same:=lower(trim(p.city))=lower(trim(l.city)); transit:=case when same then 1 else 4 end; clean:=case when l.cleaning_method='dry_clean' then 1 else 0 end;
 bs:=_start-transit-1; be:=_end+transit+clean;
 perform pg_advisory_xact_lock(hashtext(_listing::text));
 if exists(select 1 from public.rental_requests r where r.listing_id=_listing and r.status in ('pending','accepted','paid','dispatched','received','returned','disputed') and (r.expires_at is null or r.expires_at>now()) and daterange(r.blocked_start,r.blocked_end,'[]') && daterange(bs,be,'[]')) then raise exception 'Those dates are not available'; end if;
 insert into public.rental_requests(listing_id,renter_id,owner_id,start_date,end_date,days,rental_fee,deposit,same_city,blocked_start,blocked_end,expires_at)
 values(_listing,auth.uid(),l.owner_id,_start,_end,d,d*l.price_per_day,l.deposit,same,bs,be,now()+interval '48 hours') returning id into new_id;
 perform public.notify(l.owner_id,'New rental request',l.title||' · '||d||' days','/requests');
 return new_id;
end $$;
grant execute on function public.create_rental_request(uuid,date,date) to authenticated;

create or replace function public.rental_action(_id uuid,_action text,_note text default null)
returns public.request_status language plpgsql security definer set search_path = public as $$
declare r record; me uuid:=auth.uid(); ns public.request_status; gp record; rp record;
begin
 if me is null then raise exception 'Sign in required'; end if;
 select * into r from public.rental_requests where id=_id for update;
 if r is null then raise exception 'Not found'; end if;
 if r.expires_at is not null and r.expires_at<now() and r.status in ('pending','accepted') then
   update public.rental_requests set status='expired',updated_at=now() where id=_id;
   perform public.notify(r.renter_id,'Request expired','The request window ended.','/rentals');
   raise exception 'This request has expired';
 end if;
 select * into gp from public.profiles where id=r.owner_id; select * into rp from public.profiles where id=r.renter_id;
 if _action='accept' then
   if me<>r.owner_id or r.status<>'pending' then raise exception 'Not allowed'; end if;
   if gp.verification_status<>'approved' then raise exception 'VERIFY_REQUIRED'; end if;
   ns:='accepted'; update public.rental_requests set status=ns,accepted_at=now(),expires_at=now()+interval '24 hours' where id=_id;
   perform public.notify(r.renter_id,'Request accepted','Verify and pay within 24 hours to confirm.','/rentals');
 elsif _action='decline' then
   if me<>r.owner_id or r.status<>'pending' then raise exception 'Not allowed'; end if;
   ns:='declined'; update public.rental_requests set status=ns,expires_at=null where id=_id;
   perform public.notify(r.renter_id,'Request declined','The owner declined your request.','/rentals');
 elsif _action='cancel' then
   if me not in (r.renter_id,r.owner_id) or r.status not in ('pending','accepted') then raise exception 'Not allowed'; end if;
   ns:='cancelled'; update public.rental_requests set status=ns,cancel_reason=_note,expires_at=null where id=_id;
   perform public.notify(case when me=r.renter_id then r.owner_id else r.renter_id end,'Request cancelled',coalesce(_note,''),'/rentals');
 elsif _action='dispatch' then
   if me<>r.owner_id or r.status<>'paid' then raise exception 'Not allowed'; end if;
   if gp.verification_status<>'approved' or rp.verification_status<>'approved' then raise exception 'Both accounts must be approved before dispatch'; end if;
   if not exists(select 1 from public.condition_photos where request_id=_id and kind='dispatch') then raise exception 'Upload a dispatch photo first'; end if;
   ns:='dispatched'; update public.rental_requests set status=ns,dispatched_at=now() where id=_id;
   perform public.notify(r.renter_id,'Item dispatched','Your item is on its way.','/rentals');
 elsif _action='receive' then
   if me<>r.renter_id or r.status<>'dispatched' then raise exception 'Not allowed'; end if;
   if not exists(select 1 from public.condition_photos where request_id=_id and kind='receipt') then raise exception 'Upload a receipt photo first'; end if;
   ns:='received'; update public.rental_requests set status=ns,received_at=now() where id=_id;
   update public.payments set giver_payout_status='due' where request_id=_id and status='paid';
   perform public.notify(r.owner_id,'Item received','The renter confirmed receipt in good condition.','/requests');
 elsif _action='return' then
   if me<>r.renter_id or r.status<>'received' then raise exception 'Not allowed'; end if;
   if _note is distinct from 'cleaned' then raise exception 'Please confirm you cleaned the item'; end if;
   if not exists(select 1 from public.condition_photos where request_id=_id and kind='return') then raise exception 'Upload a return photo first'; end if;
   ns:='returned'; update public.rental_requests set status=ns,returned_at=now(),cleaning_attested=true where id=_id;
   perform public.notify(r.owner_id,'Item returned','Confirm the return to release the deposit.','/requests');
 elsif _action='complete' then
   if me<>r.owner_id or r.status<>'returned' then raise exception 'Not allowed'; end if;
   ns:='completed'; update public.rental_requests set status=ns,completed_at=now() where id=_id;
   perform public.notify(r.renter_id,'Deposit release initiated','The owner confirmed the return. Refund processing is pending.','/rentals');
 elsif _action='dispute' then
   if me not in (r.renter_id,r.owner_id) or r.status not in ('paid','dispatched','received','returned') then raise exception 'Not allowed'; end if;
   if coalesce(trim(_note),'')='' then raise exception 'Describe the issue'; end if;
   insert into public.disputes(request_id,raised_by,reason) values(_id,me,_note);
   ns:='disputed'; update public.rental_requests set status=ns where id=_id;
   perform public.notify(case when me=r.renter_id then r.owner_id else r.renter_id end,'Issue reported',_note,'/rentals');
 else raise exception 'Unknown action'; end if;
 update public.rental_requests set updated_at=now() where id=_id;
 return ns;
end $$;
grant execute on function public.rental_action(uuid,text,text) to authenticated;

create policy "condition photos private reads" on storage.objects for select to authenticated using (bucket_id='condition-photos' and (public.has_role(auth.uid(),'admin') or exists(select 1 from public.rental_requests r where r.id::text=(storage.foldername(name))[1] and (r.renter_id=auth.uid() or r.owner_id=auth.uid()))));
create policy "condition photos upload" on storage.objects for insert to authenticated with check (bucket_id='condition-photos' and exists(select 1 from public.rental_requests r where r.id::text=(storage.foldername(name))[1] and ((r.owner_id=auth.uid() and r.status='paid') or (r.renter_id=auth.uid() and r.status in ('dispatched','received')))));
create policy "listing photos signed read" on storage.objects for select to anon,authenticated using (bucket_id='listing-photos');
create policy "listing photos own upload" on storage.objects for insert to authenticated with check (bucket_id='listing-photos' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "listing photos own delete" on storage.objects for delete to authenticated using (bucket_id='listing-photos' and (storage.foldername(name))[1]=auth.uid()::text);