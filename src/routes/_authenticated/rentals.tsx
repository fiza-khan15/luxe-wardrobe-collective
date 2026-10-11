import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketplaceFrame, PageIntro } from "@/lib/marketplace-ui";
import { fetchListings, inr, marketplaceError, type MarketplaceListing } from "@/lib/marketplace";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/rentals")({
  component: RentalsPage,
  head: () => ({ meta: [
    { title: "My rentals | indrobe" },
    { name: "description", content: "Track your indrobe rental requests, dates, payments, and return steps." },
    { property: "og:title", content: "My rentals | indrobe" },
    { property: "og:description", content: "Keep track of your clothing rental journey." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
});

type Request = { id: string; listing_id: string; owner_id: string; renter_id: string; start_date: string; end_date: string; days: number; rental_fee: number; deposit: number; status: string; created_at: string };

const statusLabel: Record<string, string> = { pending: "Waiting for owner", accepted: "Accepted · payment pending", paid: "Confirmed", dispatched: "On the way", received: "With you", returned: "Return sent", completed: "Complete", cancelled: "Cancelled", declined: "Declined", expired: "Expired", disputed: "Under review" };

function RentalsPage() {
  const { user } = Route.useRouteContext();
  const [requests, setRequests] = useState<Request[]>([]); const [listings, setListings] = useState<MarketplaceListing[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      supabase.from("rental_requests").select("id,listing_id,owner_id,renter_id,start_date,end_date,days,rental_fee,deposit,status,created_at").eq("renter_id", user.id).order("created_at", { ascending: false }),
      fetchListings({ ownerId: user.id }),
    ]).then(async ([requestResult, myListings]) => {
      if (requestResult.error) throw requestResult.error;
      const requestRows = requestResult.data ?? [];
      const foreignIds = requestRows.map((row) => row.listing_id).filter((id) => !myListings.some((listing) => listing.id === id));
      const foreign = foreignIds.length ? await fetchListingsForIds(foreignIds) : [];
      if (active) { setRequests(requestRows); setListings([...myListings, ...foreign]); }
    }).catch((cause: unknown) => { if (active) setError(marketplaceError(cause)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user.id]);

  const listingById = new Map(listings.map((listing) => [listing.id, listing]));

  return <MarketplaceFrame><section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16"><PageIntro eyebrow="Renter" title="Your rentals" description="See where each request is in its journey, from the owner's reply to the return." action={<Button asChild className="rounded-full"><Link to="/browse">Find a piece <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>} />
    {error && <p role="alert" className="mt-6 border-l-2 border-destructive pl-3 text-sm text-destructive">{error}</p>}
    {loading ? <p className="py-16 text-sm text-muted-foreground">Loading your rentals…</p> : requests.length === 0 ? <div className="mt-8 border-y border-border py-16 text-center"><CalendarDays className="mx-auto h-6 w-6 text-muted-foreground" /><h2 className="mt-5 text-xl font-medium">Nothing booked yet.</h2><p className="mt-2 text-sm text-muted-foreground">Your requests and their next steps will appear here.</p><Button asChild variant="outline" className="mt-6 rounded-full"><Link to="/browse">Browse the wardrobe</Link></Button></div> : <div className="mt-8 divide-y divide-border border-y border-border">{requests.map((request) => { const listing = listingById.get(request.listing_id); return <article key={request.id} className="grid gap-5 py-6 sm:grid-cols-[128px_1fr_auto] sm:items-center"><div className="aspect-[4/3] overflow-hidden bg-muted sm:aspect-square">{listing?.photos[0] && <img src={listing.photos[0]} alt={listing.title} width={1600} height={1008} loading="lazy" className="h-full w-full object-cover" />}</div><div><p className="text-xs font-medium uppercase tracking-wider text-gold">{statusLabel[request.status] ?? request.status}</p><h2 className="mt-2 text-lg font-medium">{listing?.title ?? "Wardrobe piece"}</h2><p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{listing?.city ?? "India"}<span>·</span>Size {listing?.size ?? "—"}</p><p className="mt-2 text-sm text-muted-foreground">{formatDate(request.start_date)} – {formatDate(request.end_date)} · {request.days} days</p></div><div className="sm:text-right"><p className="text-sm font-medium">{inr(request.rental_fee)} rental</p><p className="mt-1 text-xs text-muted-foreground">{inr(request.deposit)} refundable deposit</p>{request.status === "accepted" && <p className="mt-3 max-w-48 text-xs leading-5 text-muted-foreground sm:ml-auto">Checkout will be available when payment is connected.</p>}</div></article>; })}</div>}
  </section></MarketplaceFrame>;
}

async function fetchListingsForIds(ids: string[]) {
  const rows = await Promise.all(ids.map((id) => fetchListings({ id })));
  return rows.flat();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}