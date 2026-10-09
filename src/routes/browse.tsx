import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MarketplaceFrame, PageIntro } from "@/lib/marketplace-ui";
import { fetchListings, inr, marketplaceError, type MarketplaceListing } from "@/lib/marketplace";
import wardrobeImage from "@/assets/indrobe-wardrobe.jpg";

export const Route = createFileRoute("/browse")({
  component: BrowsePage,
  head: () => ({ meta: [
    { title: "Browse peer-owned occasionwear | indrobe" },
    { name: "description", content: "Discover peer-owned Indian occasionwear and everyday pieces available to rent through indrobe." },
    { property: "og:title", content: "Browse clothes to rent | indrobe" },
    { property: "og:description", content: "Find a special piece from someone's real wardrobe." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
});

function BrowsePage() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    let active = true;
    fetchListings().then((rows) => { if (active) setListings(rows); }).catch((cause: unknown) => {
      if (active) setError(marketplaceError(cause));
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const cities = useMemo(() => [...new Set(listings.map((listing) => listing.city.trim()).filter(Boolean))].sort(), [listings]);
  const visible = listings.filter((listing) => {
    const term = search.trim().toLowerCase();
    return (!term || `${listing.title} ${listing.category} ${listing.description}`.toLowerCase().includes(term)) && (!city || listing.city === city);
  });

  return <MarketplaceFrame>
    <section className="mx-auto max-w-7xl px-5 pb-20 pt-12 sm:px-8 sm:pt-16">
      <PageIntro eyebrow="The indrobe wardrobe" title="Good clothes deserve another story." description="Discover unique pieces, shared by people in your city. Every listing is owned and cared for by a real person." action={<Button asChild className="rounded-full"><Link to="/list">List a piece <ArrowUpRight className="ml-2 h-4 w-4" /></Link></Button>} />
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by piece or occasion" aria-label="Search listings" className="h-12 rounded-full pl-11" /></div>
        <div className="relative min-w-52"><MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><select aria-label="Filter by city" value={city} onChange={(event) => setCity(event.target.value)} className="h-12 w-full appearance-none rounded-full border border-input bg-background pl-11 pr-10 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="">Every city</option>{cities.map((place) => <option key={place} value={place}>{place}</option>)}</select><SlidersHorizontal className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /></div>
      </div>
      <div className="mt-7 flex items-center justify-between text-sm text-muted-foreground"><span>{loading ? "Finding pieces…" : `${visible.length} ${visible.length === 1 ? "piece" : "pieces"}`}</span><span>Prices shown per day</span></div>
      {error ? <div className="mt-10 border-y border-destructive/30 py-8 text-sm text-destructive" role="alert">{error}</div> : loading ? <div className="mt-7 grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="animate-pulse"><div className="aspect-[4/5] bg-muted" /><div className="mt-4 h-4 w-2/3 bg-muted" /><div className="mt-3 h-4 w-1/3 bg-muted" /></div>)}</div> : visible.length === 0 ? <div className="mt-10 border-y border-border py-20 text-center"><p className="text-xl font-medium">{listings.length ? "No pieces match those filters." : "The first pieces are on their way."}</p><p className="mt-2 text-sm text-muted-foreground">{listings.length ? "Try another search or city." : "Be the first to share something you love."}</p><Button asChild variant="outline" className="mt-6 rounded-full"><Link to="/list">List the first piece</Link></Button></div> : <div className="mt-7 grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{visible.map((listing) => <Link key={listing.id} to="/items/$id" params={{ id: listing.id }} className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><div className="relative aspect-[4/5] overflow-hidden bg-muted"><img src={listing.photos[0] || wardrobeImage} alt={listing.title} width={1600} height={1008} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]" /><span className="absolute bottom-3 left-3 bg-background/90 px-3 py-1.5 text-xs font-medium">{listing.category}</span></div><div className="mt-4 flex items-start justify-between gap-4"><div className="min-w-0"><h2 className="truncate font-medium">{listing.title}</h2><p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{listing.city} · Size {listing.size}</p></div><p className="shrink-0 text-right font-medium">{inr(listing.price_per_day)}<span className="block text-xs font-normal text-muted-foreground">per day</span></p></div></Link>)}</div>}
    </section>
  </MarketplaceFrame>;
}