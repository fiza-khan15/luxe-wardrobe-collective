import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Check, CircleAlert, MapPin, Phone, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarketplaceFrame, PageIntro } from "@/lib/marketplace-ui";
import { fetchCounterparties, fetchListings, inr, marketplaceError, type Counterparty, type MarketplaceListing } from "@/lib/marketplace";
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

type Request = { id: string; listing_id: string; start_date: string; end_date: string; days: number; rental_fee: number; deposit: number; status: string; created_at: string };

const statusLabel: Record<string, string> = { pending: "Waiting for owner", accepted: "Accepted · payment pending", paid: "Confirmed", dispatched: "On the way", received: "With you", returned: "Return sent", completed: "Complete", cancelled: "Cancelled", declined: "Declined", expired: "Expired", disputed: "Under review" };

function RentalsPage() {
  const { user } = Route.useRouteContext();
  const [requests, setRequests] = useState<Request[]>([]); const [listings, setListings] = useState<MarketplaceListing[]>([]); const [people, setPeople] = useState<Map<string, Counterparty>>(new Map()); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [busyId, setBusyId] = useState(""); const [photos, setPhotos] = useState<Record<string, File | undefined>>({}); const [cleaned, setCleaned] = useState<Record<string, boolean>>({}); const [disputeText, setDisputeText] = useState<Record<string, string>>({});

  const reload = useCallback(async () => {
    const [result, ownListings] = await Promise.all([
      supabase.from("rental_requests").select("id,listing_id,start_date,end_date,days,rental_fee,deposit,status,created_at").eq("renter_id", user.id).order("created_at", { ascending: false }),
      fetchListings({ ownerId: user.id }),
    ]);
    if (result.error) throw result.error;
    const rows = result.data ?? [];
    const foreignIds = rows.map(({ listing_id }) => listing_id).filter((id) => !ownListings.some((listing) => listing.id === id));
    const foreign = foreignIds.length ? await fetchListingsForIds(foreignIds) : [];
    const people = await fetchCounterparties(rows.map(({ id }) => id));
    setRequests(rows); setListings([...ownListings, ...foreign]); setPeople(people);
  }, [user.id]);

  useEffect(() => {
    let active = true;
    reload().catch((cause: unknown) => { if (active) setError(marketplaceError(cause)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);

  const listingById = new Map(listings.map((listing) => [listing.id, listing]));

  const action = async (request: Request, name: string, note?: string, photoKind?: "receipt" | "return") => {
    setBusyId(request.id); setError(""); setNotice("");
    try {
      if (photoKind) {
        const file = photos[request.id];
        if (!file) throw new Error("Choose a condition photo before continuing.");
        const path = `${request.id}/${user.id}/${crypto.randomUUID()}.${file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "jpg"}`;
        const { error: uploadError } = await supabase.storage.from("condition-photos").upload(path, file, { contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;
        const { error: recordError } = await supabase.from("condition_photos").insert({ request_id: request.id, kind: photoKind, path, uploaded_by: user.id });
        if (recordError) throw recordError;
      }
      const { error: actionError } = await supabase.rpc("rental_action", { _id: request.id, _action: name, _note: note ?? undefined });
      if (actionError) throw actionError;
      await reload();
      setNotice("Rental updated.");
    } catch (cause) {
      setError(marketplaceError(cause));
    } finally { setBusyId(""); }
  };

  return <MarketplaceFrame><section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16"><PageIntro eyebrow="Renter" title="Your rentals" description="See where each request is in its journey, from the owner's reply to the return." action={<Button asChild className="rounded-full"><Link to="/browse">Find a piece <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>} />
    {notice && <p role="status" className="mt-6 border-l-2 border-gold pl-3 text-sm">{notice}</p>}{error && <p role="alert" className="mt-6 flex gap-2 text-sm text-destructive"><CircleAlert className="h-4 w-4 shrink-0" />{error}</p>}
    {loading ? <p className="py-16 text-sm text-muted-foreground">Loading your rentals…</p> : requests.length === 0 ? <div className="mt-8 border-y border-border py-16 text-center"><CalendarDays className="mx-auto h-6 w-6 text-muted-foreground" /><h2 className="mt-5 text-xl font-medium">Nothing booked yet.</h2><p className="mt-2 text-sm text-muted-foreground">Your requests and their next steps will appear here.</p><Button asChild variant="outline" className="mt-6 rounded-full"><Link to="/browse">Browse the wardrobe</Link></Button></div> : <div className="mt-8 divide-y divide-border border-y border-border">{requests.map((request) => {
      const listing = listingById.get(request.listing_id); const person = people.get(request.id); const busy = busyId === request.id;
      const photoPrompt = request.status === "dispatched" ? "Add a photo when the piece arrives" : request.status === "received" ? "Add a photo after returning the piece" : "";
      const photoKind = request.status === "dispatched" ? "receipt" : request.status === "received" ? "return" : undefined;
      return <article key={request.id} className="grid gap-5 py-7 lg:grid-cols-[128px_minmax(0,1fr)_minmax(240px,0.85fr)] lg:items-start"><Link to="/items/$id" params={{ id: request.listing_id }} className="aspect-[4/3] overflow-hidden bg-muted lg:aspect-square">{listing?.photos[0] && <img src={listing.photos[0]} alt={listing.title} width={1600} height={1008} loading="lazy" className="h-full w-full object-cover" />}</Link><div><p className="text-xs font-medium uppercase tracking-wider text-gold">{statusLabel[request.status] ?? request.status}</p><h2 className="mt-2 text-lg font-medium">{listing?.title ?? "Wardrobe piece"}</h2><p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{listing?.city ?? "India"}<span>·</span>Size {listing?.size ?? "—"}</p><p className="mt-2 text-sm text-muted-foreground">{formatDate(request.start_date)} – {formatDate(request.end_date)} · {request.days} days</p><p className="mt-3 text-sm">{inr(request.rental_fee)} rental <span className="text-muted-foreground">+ {inr(request.deposit)} refundable deposit</span></p>{person && <div className="mt-4 space-y-1 text-xs text-muted-foreground"><p className="font-medium text-foreground">{person.full_name}{person.verified && <span className="ml-2 inline-flex items-center gap-1 text-gold"><ShieldCheck className="h-3 w-3" />Verified</span>}</p><p>{person.city}</p>{person.phone && <p className="flex items-center gap-1"><Phone className="h-3 w-3" />{person.phone}</p>}{person.address && <p><span className="font-medium text-foreground">Return address:</span> {person.address}</p>}</div>}</div><div className="space-y-3 lg:border-l lg:border-border lg:pl-6">
        {request.status === "pending" && <p className="text-xs text-muted-foreground">The owner has 48 hours to reply. You can cancel any time before payment.</p>}
        {request.status === "accepted" && <p className="border-l-2 border-gold pl-3 text-xs leading-5 text-muted-foreground">Checkout will be available when payment is connected.</p>}
        {request.status === "paid" && <p className="text-xs text-muted-foreground">The owner is preparing dispatch. You will see the delivery details above once the piece is on its way.</p>}
        {photoKind && <div className="space-y-2"><Label htmlFor={`photo-${request.id}`} className="text-xs">{photoPrompt}</Label><Input id={`photo-${request.id}`} type="file" accept="image/*" onChange={(event) => setPhotos((current) => ({ ...current, [request.id]: event.target.files?.[0] }))} className="h-10 text-xs" /></div>}
        {request.status === "dispatched" && <Button disabled={busy || !photos[request.id]} onClick={() => void action(request, "receive", undefined, "receipt")} className="w-full rounded-full"><Check className="mr-2 h-4 w-4" />Mark as received</Button>}
        {request.status === "received" && <><label className="flex items-start gap-2 text-xs leading-5"><Checkbox checked={cleaned[request.id] ?? false} onCheckedChange={(checked) => setCleaned((current) => ({ ...current, [request.id]: checked === true }))} /><span>I have cleaned this item as instructed</span></label><Button disabled={busy || !photos[request.id] || !cleaned[request.id]} onClick={() => void action(request, "return", "cleaned", "return")} className="w-full rounded-full"><Truck className="mr-2 h-4 w-4" />Return item</Button></>}
        {request.status === "returned" && <p className="text-xs text-muted-foreground">The owner will confirm the return to start your deposit refund.</p>}
        {["pending", "accepted"].includes(request.status) && <Button disabled={busy} variant="outline" onClick={() => void action(request, "cancel")} className="w-full rounded-full">Cancel request</Button>}
        {["paid", "dispatched", "received", "returned"].includes(request.status) && <details className="border-t border-border pt-3"><summary className="cursor-pointer text-xs text-muted-foreground">Report an issue</summary><div className="mt-3 space-y-2"><Input aria-label="Issue details" value={disputeText[request.id] ?? ""} onChange={(event) => setDisputeText((current) => ({ ...current, [request.id]: event.target.value }))} placeholder="Describe the issue" /><Button variant="outline" size="sm" disabled={busy || !(disputeText[request.id] ?? "").trim()} onClick={() => void action(request, "dispute", disputeText[request.id])}>Report issue</Button></div></details>}
        {request.status === "disputed" && <p className="flex gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0" />Manual review is pending.</p>}
      </div></article>; })}</div>}
  </section></MarketplaceFrame>;
}

async function fetchListingsForIds(ids: string[]) {
  const rows = await Promise.all(ids.map((id) => fetchListings({ id })));
  return rows.flat();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}
