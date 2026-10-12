import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, CircleAlert, ImagePlus, MapPin, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarketplaceFrame, PageIntro } from "@/lib/marketplace-ui";
import { fetchListings, inr, marketplaceError, type MarketplaceListing } from "@/lib/marketplace";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/requests")({
  component: RequestsPage,
  head: () => ({ meta: [
    { title: "Rental requests for your wardrobe | indrobe" },
    { name: "description", content: "Respond to rental requests and manage dispatch, return, and issue reporting for your indrobe listings." },
    { property: "og:title", content: "Your rental requests | indrobe" },
    { property: "og:description", content: "Manage requests for the pieces you share." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
});

type Request = { id: string; listing_id: string; owner_id: string; renter_id: string; start_date: string; end_date: string; days: number; rental_fee: number; deposit: number; status: string; expires_at: string | null; created_at: string };

const statusLabel: Record<string, string> = { pending: "Reply within 48 hours", accepted: "Accepted · payment pending", paid: "Ready to dispatch", dispatched: "In transit", received: "Rented", returned: "Return confirmation needed", completed: "Complete", cancelled: "Cancelled", declined: "Declined", expired: "Expired", disputed: "Under review" };

function RequestsPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<Request[]>([]); const [listings, setListings] = useState<MarketplaceListing[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [busyId, setBusyId] = useState(""); const [photos, setPhotos] = useState<Record<string, File | undefined>>({}); const [cleaned, setCleaned] = useState<Record<string, boolean>>({}); const [disputeText, setDisputeText] = useState<Record<string, string>>({});

  const reload = useCallback(async () => {
    const [result, ownListings] = await Promise.all([
      supabase.from("rental_requests").select("id,listing_id,owner_id,renter_id,start_date,end_date,days,rental_fee,deposit,status,expires_at,created_at").eq("owner_id", user.id).order("created_at", { ascending: false }),
      fetchListings({ ownerId: user.id }),
    ]);
    if (result.error) throw result.error;
    const rows = result.data ?? [];
    const ids = rows.map(({ listing_id }) => listing_id).filter((id) => !ownListings.some((listing) => listing.id === id));
    const linkedRows = await fetchListingsForIds(ids);
    setRequests(rows); setListings([...ownListings, ...linkedRows]);
  }, [user.id]);

  useEffect(() => {
    let active = true;
    reload().catch((cause: unknown) => { if (active) setError(marketplaceError(cause)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);

  const listingById = useMemo(() => new Map(listings.map((listing) => [listing.id, listing])), [listings]);

  const action = async (request: Request, name: string, note?: string, photoKind?: "dispatch" | "receipt" | "return") => {
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
      const { error: actionError } = await supabase.rpc("rental_action", { _id: request.id, _action: name, _note: note ?? null });
      if (actionError) throw actionError;
      await reload();
      setNotice("Rental updated.");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "";
      if (message.includes("VERIFY_REQUIRED")) { setError("Identity review is needed before accepting. Submit your details in your account first."); void navigate({ to: "/profile" }); }
      else setError(marketplaceError(cause));
    } finally { setBusyId(""); }
  };

  return <MarketplaceFrame><section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16"><PageIntro eyebrow="Giver" title="Requests for your pieces" description="Review each request, then capture the hand-off and return as they happen." action={<Button asChild variant="outline" className="rounded-full"><Link to="/list">List a piece <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>} />
    {notice && <p role="status" className="mt-6 border-l-2 border-gold pl-3 text-sm">{notice}</p>}{error && <p role="alert" className="mt-6 flex gap-2 text-sm text-destructive"><CircleAlert className="h-4 w-4 shrink-0" />{error}</p>}
    {loading ? <p className="py-16 text-sm text-muted-foreground">Loading your requests…</p> : requests.length === 0 ? <div className="mt-8 border-y border-border py-16 text-center"><Truck className="mx-auto h-6 w-6 text-muted-foreground" /><h2 className="mt-5 text-xl font-medium">No requests just yet.</h2><p className="mt-2 text-sm text-muted-foreground">When someone asks to rent a piece, you will see it here.</p><Button asChild variant="outline" className="mt-6 rounded-full"><Link to="/list">Share a piece</Link></Button></div> : <div className="mt-8 divide-y divide-border border-y border-border">{requests.map((request) => {
      const listing = listingById.get(request.listing_id); const active = !["completed", "cancelled", "declined", "expired"].includes(request.status); const busy = busyId === request.id; const daysLeft = request.expires_at ? Math.ceil((new Date(request.expires_at).getTime() - Date.now()) / 3600000) : null;
      const photoPrompt = request.status === "paid" ? "Add a photo before dispatch" : request.status === "dispatched" ? "Add a photo when the renter receives it" : request.status === "received" ? "Add a photo before confirming the return" : "";
      const photoKind = request.status === "paid" ? "dispatch" : request.status === "dispatched" ? "receipt" : request.status === "received" ? "return" : undefined;
      return <article key={request.id} className="grid gap-5 py-7 lg:grid-cols-[144px_minmax(0,1fr)_minmax(240px,0.85fr)] lg:items-start"><Link to="/items/$id" params={{ id: request.listing_id }} className="aspect-[4/3] overflow-hidden bg-muted lg:aspect-square">{listing?.photos[0] && <img src={listing.photos[0]} alt={listing.title} width={1600} height={1008} loading="lazy" className="h-full w-full object-cover" />}</Link><div><p className="text-xs font-medium uppercase tracking-wider text-gold">{statusLabel[request.status] ?? request.status}</p><h2 className="mt-2 text-lg font-medium">{listing?.title ?? "Wardrobe piece"}</h2><p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{listing?.city ?? "India"}<span>·</span>{formatDate(request.start_date)} – {formatDate(request.end_date)}</p><p className="mt-3 text-sm">{inr(request.rental_fee)} rental <span className="text-muted-foreground">+ {inr(request.deposit)} deposit</span></p><p className="mt-3 text-xs text-muted-foreground">Request placed {formatDate(request.created_at.slice(0, 10))}{request.status === "pending" && daysLeft !== null ? ` · ${Math.max(0, daysLeft)}h left to reply` : ""}</p></div><div className="space-y-3 lg:border-l lg:border-border lg:pl-6">
        {request.status === "pending" && <div className="flex gap-2"><Button disabled={busy} onClick={() => void action(request, "accept")} className="flex-1 rounded-full">Accept</Button><Button disabled={busy} variant="outline" onClick={() => void action(request, "decline")} className="flex-1 rounded-full">Decline</Button></div>}
        {request.status === "accepted" && <p className="border-l-2 border-gold pl-3 text-xs leading-5 text-muted-foreground">The renter must complete payment before the hand-off can begin. Checkout setup is not connected yet.</p>}
        {photoKind && <div className="space-y-2"><Label htmlFor={`photo-${request.id}`} className="text-xs">{photoPrompt}</Label><Input id={`photo-${request.id}`} type="file" accept="image/*" onChange={(event) => setPhotos((current) => ({ ...current, [request.id]: event.target.files?.[0] }))} className="h-10 text-xs" /></div>}
        {request.status === "paid" && <Button disabled={busy || !photos[request.id]} onClick={() => void action(request, "dispatch", undefined, "dispatch")} className="w-full rounded-full"><Truck className="mr-2 h-4 w-4" />Mark dispatched</Button>}
        {request.status === "dispatched" && <Button disabled={busy || !photos[request.id]} onClick={() => void action(request, "receive", undefined, "receipt")} className="w-full rounded-full"><Check className="mr-2 h-4 w-4" />Confirm renter received</Button>}
        {request.status === "received" && <><label className="flex items-start gap-2 text-xs leading-5"><Checkbox checked={cleaned[request.id] ?? false} onCheckedChange={(checked) => setCleaned((current) => ({ ...current, [request.id]: checked === true }))} /><span>The piece has been cleaned as agreed.</span></label><Button disabled={busy || !photos[request.id] || !cleaned[request.id]} onClick={() => void action(request, "return", "cleaned", "return")} className="w-full rounded-full">Confirm return received</Button></>}
        {request.status === "returned" && <Button disabled={busy} onClick={() => void action(request, "complete")} className="w-full rounded-full"><Check className="mr-2 h-4 w-4" />Confirm return & deposit release</Button>}
        {active && !["disputed", "pending", "accepted"].includes(request.status) && <details className="border-t border-border pt-3"><summary className="cursor-pointer text-xs text-muted-foreground">Report an issue</summary><div className="mt-3 space-y-2"><Input aria-label="Issue details" value={disputeText[request.id] ?? ""} onChange={(event) => setDisputeText((current) => ({ ...current, [request.id]: event.target.value }))} placeholder="Describe the issue" /><Button variant="outline" size="sm" disabled={busy || !(disputeText[request.id] ?? "").trim()} onClick={() => void action(request, "dispute", disputeText[request.id])}>Report issue</Button></div></details>}
        {request.status === "disputed" && <p className="flex gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0" />Manual review is pending.</p>}
      </div></article>;
    })}</div>}
  </section></MarketplaceFrame>;
}

async function fetchListingsForIds(ids: string[]) {
  const rows = await Promise.all(ids.map((id) => fetchListings({ id })));
  return rows.flat();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}