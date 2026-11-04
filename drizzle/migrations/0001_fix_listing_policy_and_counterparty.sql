DROP POLICY "owner update listing" ON public.listings;

CREATE POLICY "owner update listing" ON public.listings
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (
    (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    AND deposit = item_value
    AND (status <> 'active' OR (SELECT count(*) FROM public.listing_photos p WHERE p.listing_id = listings.id) >= 3)
  );

CREATE OR REPLACE FUNCTION public.get_counterparty(_request uuid)
RETURNS TABLE (full_name text, city text, verified boolean, phone text, address text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare r record; cp uuid;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  select * into r from public.rental_requests where id = _request;
  if r is null then raise exception 'Not found'; end if;
  if auth.uid() <> r.renter_id and auth.uid() <> r.owner_id then raise exception 'Not allowed'; end if;
  cp := case when auth.uid() = r.renter_id then r.owner_id else r.renter_id end;
  select p.full_name, p.city, (p.verification_status = 'approved')
    into full_name, city, verified
  from public.profiles p where p.id = cp;
  if r.status in ('pending','accepted','declined','cancelled','expired') then
    phone := null; address := null;
  else
    select p.phone, p.address into phone, address from public.profiles p where p.id = cp;
  end if;
  return next;
end $function$;

GRANT EXECUTE ON FUNCTION public.get_counterparty(uuid) TO authenticated;