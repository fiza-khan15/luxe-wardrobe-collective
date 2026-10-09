import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, ChevronLeft, ChevronRight, MapPin, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarketplaceFrame } from "@/lib/marketplace-ui";
import { fetchListings, inr, marketplaceError, type MarketplaceListing } from "@/lib/marketplace";
import { supabase } from "@/integrations/supabase/client";
import wardrobeImage from "@/assets/indrobe-wardrobe.jpg";

export const Route = createFileRoute("/items/$id")({
  component: ItemPage,
  head: ({ params }) => ({ meta: [
    { title: `Clothing rental | indrobe` },
    { name: "description", content: "Explore a peer-owned wardrobe piece and request the dates that work for you." },
    { property: "og:title", content: "A peer-owned wardrobe piece | indrobe" },
    { property: "og:description", content: "Rent a special piece directly from its owner." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
});

function ItemPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [profile, setProfile] = useState<{ full_name: string; phone: string; city: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    let active = true;
    fetchListings({ id }).then((rows) => { if (active) setListing(rows[0] ?? null); }).catch((cause: unknown) => { if (active) setError(marketplaceError(cause)); }).finally(() => { if (active) setLoading(false); });
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { if (active) setAuthChecked(true); return; }
      const { data } = await supabase.from("profiles").select("full_name,phone,city").eq("id", user.id).maybeSingle();
      if (active) { setProfile(data); setAuthChecked(true); }
    });
    return () => { active = false; };
  }, [id]);

  const imageUrls = useMemo(() => listing?.photos.length ? listing.photos : [wardrobeImage], [listing]);
  const minimumStart = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
  const days = start && end ? Math.floor((new Date(`${end}T00:00:00`).getTime() - new Date(`${start}T00:00:00`).getTime()) / 86400000) + 1 : 0;
  const rentalTotal = listing ? Math.max(days, 0) * listing.price_per_day : 0;

  const submitRequest = async () => {
    setError(""); setNotice("");
    if (!listing || !start || !end || days < 1 || days > 10) { setError("Choose a rental period from 1 to 10 days."); return; }
    if (!profile) { await navigate({ to: "/auth" }); return; }
    if (!profile.full_name || !profile.phone || !profile.city) { setError("Add your name, phone number and city in your account before requesting."); return; }
    setRequesting(true);
    const { data, error: requestError } = await supabase.rpc("create_rental_request", { _listing: listing.id, _start: start, _end: end });
    setRequesting(false);
    if (requestError) { setError(marketplaceError(requestError)); return; }
    if (data) setNotice("Request sent. The owner has 48 hours to respond; payment setup will follow once your request is accepted.");
  };

  if (loading) return <MarketplaceFrame backTo="/browse"><div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">Loading piece…</div></MarketplaceFrame>;
  if (!listing) return <MarketplaceFrame backTo="/browse"><div className="mx-auto max-w-7xl px-5 py-24 text-center sm:px-8"><h1 className="text-3xl font-semibold">This piece isn't available.</h1><Button asChild className="mt-6 rounded-full"><Link to="/browse">Back to discover</Link></Button></div></MarketplaceFrame>;

  return <MarketplaceFrame backTo="/browse"><section className="mx-auto grid max-w-7xl gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)] lg:gap-16 lg:py-12">
    <div><div className="relative overflow-hidden bg-muted"><img src={imageUrls[activePhoto] || wardrobeImage} alt={listing.title} width={1600} height={1008} className="aspect-[4/5] w-full object-cover sm:aspect-[5/4]" />{imageUrls.length > 1 && <><Button variant="secondary" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full" aria-label="Previous photo" onClick={() => setActivePhoto((activePhoto + imageUrls.length - 1) % imageUrls.length)}><ChevronLeft className="h-4 w-4" /></Button><Button variant="secondary" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full" aria-label="Next photo" onClick={() => setActivePhoto((activePhoto + 1) % imageUrls.length)}><ChevronRight className="h-4 w-4" /></Button></>}</div><div className="mt-8 flex items-center gap-3 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{listing.city}<span>·</span>Size {listing.size}<span>·</span>{listing.condition}</div><div className="mt-8 border-t border-border pt-8"><h2 className="text-lg font-medium">About this piece</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">{listing.description || "A much-loved piece, ready for its next outing."}</p><div className="mt-8 grid gap-4 border-t border-border pt-6 sm:grid-cols-2"><div><p className="text-xs uppercase tracking-wider text-muted-foreground">Care</p><p className="mt-2 text-sm">{listing.cleaning_method.replaceAll("_", " ")}{listing.cleaning_instructions ? ` · ${listing.cleaning_instructions}` : ""}</p></div><div><p className="text-xs uppercase tracking-wider text-muted-foreground">Owner's value</p><p className="mt-2 text-sm">{inr(listing.item_value)} refundable deposit</p></div></div></div></div>
    <aside className="lg:sticky lg:top-24 lg:self-start"><p className="text-xs font-medium uppercase tracking-[0.16em] text-gold">{listing.category} / {listing.size}</p><h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{listing.title}</h1><p className="mt-4 text-sm leading-6 text-muted-foreground">Shared directly by its owner in {listing.city}.</p><div className="mt-7 border-y border-border py-5"><p className="text-2xl font-semibold">{inr(listing.price_per_day)} <span className="text-sm font-normal text-muted-foreground">/ day</span></p><p className="mt-2 text-sm text-muted-foreground">{inr(listing.item_value)} refundable deposit, collected with the rental fee.</p></div><div className="mt-6 grid grid-cols-2 gap-3"><div className="space-y-2"><Label htmlFor="rental-start">From</Label><Input id="rental-start" type="date" min={minimumStart} value={start} onChange={(event) => { setStart(event.target.value); if (end && event.target.value > end) setEnd(""); }} className="h-12" /></div><div className="space-y-2"><Label htmlFor="rental-end">To</Label><Input id="rental-end" type="date" min={start || minimumStart} value={end} onChange={(event) => setEnd(event.target.value)} className="h-12" /></div></div>{days > 10 && <p className="mt-2 text-xs text-destructive">Rentals can be up to 10 days.</p>}{days > 0 && days <= 10 && <div className="mt-5 flex justify-between border-t border-border pt-4 text-sm"><span>{days} days × {inr(listing.price_per_day)} + deposit</span><span className="font-medium">{inr(rentalTotal + listing.item_value)}</span></div>}<Button className="mt-6 h-12 w-full rounded-full" onClick={submitRequest} disabled={requesting || !authChecked || (Boolean(profile) && (!profile?.full_name || !profile.phone || !profile.city))}>{requesting ? "Sending request…" : profile ? "Request these dates" : "Sign in to request"}</Button>{!profile && authChecked && <p className="mt-3 text-center text-xs text-muted-foreground">A free account is needed to send a request.</p>}{error && <p className="mt-4 text-sm text-destructive" role="alert">{error}</p>}{notice && <p className="mt-4 border-l-2 border-gold pl-3 text-sm leading-6" role="status">{notice}</p>}<div className="mt-7 space-y-4 border-t border-border pt-6 text-sm"><p className="flex gap-3"><ShieldCheck className="h-4 w-4 shrink-0 text-gold" />Identity is checked when a rental request is ready to move forward.</p><p className="flex gap-3"><CalendarDays className="h-4 w-4 shrink-0 text-gold" />Your dates include delivery and the return journey.</p><p className="flex gap-3"><Check className="h-4 w-4 shrink-0 text-gold" />Rental payment and deposit are shown before checkout.</p></div></aside>
  </section></MarketplaceFrame>;
}