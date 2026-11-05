-- Payments: the only way a rental can become "paid".
-- Amounts in public.payments.amount are whole rupees (same unit as rental_fee and deposit).
-- Razorpay amounts are in paise (rupees x 100); conversion happens in server code and is re-checked here.

alter table public.payments add column if not exists needs_refund boolean not null default false;

-- One successful payment per request. Late or duplicate payments are kept for refund, so they are excluded.
create unique index if not exists payments_one_paid_per_request
  on public.payments (request_id) where status = 'paid' and not needs_refund;

create unique index if not exists payments_payment_id_unique
  on public.payments (razorpay_payment_id) where razorpay_payment_id is not null;

-- Step 1 (renter, from their own signed-in session): check everything, hold the dates for 30 minutes, return the total in rupees.
create or replace function public.prepare_payment(_request uuid)
returns integer
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); r record; p record;
begin
  if me is null then raise exception 'Sign in required'; end if;
  select * into r from public.rental_requests where id = _request for update;
  if r is null then raise exception 'Not found'; end if;
  if r.renter_id <> me then raise exception 'Not allowed'; end if;
  if r.status <> 'accepted' then raise exception 'This request is not ready for payment'; end if;
  if r.expires_at is not null and r.expires_at < now() then raise exception 'This request has expired'; end if;

  select * into p from public.profiles where id = me;
  if p is null then raise exception 'VERIFY_REQUIRED'; end if;
  if p.suspended then raise exception 'Your account is suspended'; end if;
  if p.verification_status is distinct from 'approved' then raise exception 'VERIFY_REQUIRED'; end if;
  if coalesce(trim(p.address), '') = '' then raise exception 'Add your delivery address in your profile first'; end if;

  -- Keep the dates reserved while the renter is in the payment window.
  update public.rental_requests
     set expires_at = greatest(coalesce(expires_at, now()), now() + interval '30 minutes'), updated_at = now()
   where id = _request;

  return r.rental_fee + r.deposit;
end $$;
revoke execute on function public.prepare_payment(uuid) from public, anon;
grant execute on function public.prepare_payment(uuid) to authenticated;

-- Step 2 (server only): confirm a payment that Razorpay has verified. Safe to call many times for the same order.
create or replace function public.confirm_payment(_order_id text, _payment_id text, _amount_paise integer)
returns text
language plpgsql security definer set search_path = public as $$
declare pay record; r record;
begin
  select * into pay from public.payments where razorpay_order_id = _order_id for update;
  if pay is null then raise exception 'Order not found'; end if;
  if pay.status = 'paid' then return 'already_paid'; end if;
  if _amount_paise <> pay.amount * 100 then raise exception 'Amount mismatch'; end if;

  select * into r from public.rental_requests where id = pay.request_id for update;
  if r is null then raise exception 'Request not found'; end if;

  if r.status = 'accepted' and (r.expires_at is null or r.expires_at >= now()) then
    update public.payments set status = 'paid', razorpay_payment_id = _payment_id, updated_at = now() where id = pay.id;
    -- expires_at is cleared so the dates stay blocked for the whole rental.
    update public.rental_requests set status = 'paid', paid_at = now(), expires_at = null, updated_at = now() where id = r.id;
    perform public.notify(r.owner_id, 'Payment received', 'The renter has paid. Dispatch the piece and add a photo.', '/requests');
    perform public.notify(r.renter_id, 'Payment confirmed', 'Your rental is confirmed. The owner will dispatch the piece.', '/rentals');
    return 'paid';
  end if;

  -- Money arrived but the booking can no longer be honoured (cancelled, expired, or already paid another way).
  update public.payments set status = 'paid', razorpay_payment_id = _payment_id, needs_refund = true, updated_at = now() where id = pay.id;
  perform public.notify(r.renter_id, 'Payment will be refunded', 'We could not confirm this booking. Your payment will be refunded.', '/rentals');
  return 'needs_refund';
end $$;
revoke execute on function public.confirm_payment(text, text, integer) from public, anon, authenticated;
grant execute on function public.confirm_payment(text, text, integer) to service_role;

-- Records a failed attempt. The request stays "accepted" so the renter can try again.
create or replace function public.fail_payment(_order_id text)
returns void
language sql security definer set search_path = public as $$
  update public.payments set status = 'failed', updated_at = now() where razorpay_order_id = _order_id and status = 'created';
$$;
revoke execute on function public.fail_payment(text) from public, anon, authenticated;
grant execute on function public.fail_payment(text) to service_role;