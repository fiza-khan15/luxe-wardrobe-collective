import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, CircleAlert, ImagePlus, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MarketplaceFrame, PageIntro } from "@/lib/marketplace-ui";
import { canPublishListing, friendlyError, inr, MAX_LISTING_VALUE, MIN_LISTING_PHOTOS } from "@/lib/marketplace";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/list")({
  component: ListPage,
  head: () => ({ meta: [
    { title: "Share a piece from your wardrobe | indrobe" },
    { name: "description", content: "List an owned clothing piece for rent on indrobe. Add at least three photos and set your daily price." },
    { property: "og:title", content: "Share your wardrobe | indrobe" },
    { property: "og:description", content: "Give a piece you love its next outing." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
});

function ListPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState(""); const [category, setCategory] = useState("Indian occasionwear"); const [size, setSize] = useState(""); const [description, setDescription] = useState(""); const [city, setCity] = useState(""); const [itemValue, setItemValue] = useState(""); const [price, setPrice] = useState(""); const [condition, setCondition] = useState("Excellent"); const [cleaning, setCleaning] = useState("dry_clean"); const [care, setCare] = useState(""); const [ownership, setOwnership] = useState(false);
  const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [published, setPublished] = useState(false);
  const estimate = Number(itemValue) > 0 ? Math.round(Number(itemValue) * 0.09) : 0;

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data: { user } }) => { if (active) { setUserId(user?.id ?? null); setLoadingAuth(false); } });
    return () => { active = false; };
  }, []);

  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const addFiles = (selected: FileList | null) => {
    if (!selected) return;
    const remaining = Math.max(0, 8 - files.length);
    const next = Array.from(selected).filter((file) => file.type.startsWith("image/") && file.size <= 8 * 1024 * 1024).slice(0, remaining);
    setFiles((current) => [...current, ...next].slice(0, 8));
    if (Array.from(selected).some((file) => !file.type.startsWith("image/") || file.size > 8 * 1024 * 1024)) setError("Use image files under 8 MB each.");
    else setError("");
  };

  const publish = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError("");
    const value = Number(itemValue); const dailyPrice = Number(price);
    if (!userId) { setError("Sign in before creating a listing."); return; }
    if (!ownership) { setError("Confirm that this piece belongs to you before listing it."); return; }
    if (!canPublishListing(value, files.length)) { setError(`A listing needs at least ${MIN_LISTING_PHOTOS} photos and an item value between ₹1 and ₹${MAX_LISTING_VALUE.toLocaleString("en-IN")} .`); return; }
    if (!Number.isInteger(dailyPrice) || dailyPrice < 1) { setError("Enter a whole-number daily rental price."); return; }
    setSaving(true);
    const { data: created, error: createError } = await supabase.from("listings").insert({ owner_id: userId, title: title.trim(), description: description.trim(), category, size: size.trim(), city: city.trim(), item_value: value, price_per_day: dailyPrice, deposit: value, condition, cleaning_method: cleaning, cleaning_instructions: care.trim(), ownership_confirmed: true, status: "draft" }).select("id").single();
    if (createError || !created) { setSaving(false); setError(friendlyError(createError?.message ?? "Could not create the listing.")); return; }
    const photoRows: { listing_id: string; path: string; position: number }[] = [];
    for (const [position, file] of files.entries()) {
      const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${userId}/${created.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("listing-photos").upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) { setSaving(false); setError(`Photo upload failed: ${friendlyError(uploadError.message)} Your draft was kept; you can try again with another listing.`); return; }
      photoRows.push({ listing_id: created.id, path, position });
    }
    const { error: photoError } = await supabase.from("listing_photos").insert(photoRows);
    if (photoError) { setSaving(false); setError(`The photos could not be added: ${friendlyError(photoError.message)}`); return; }
    const { error: publishError } = await supabase.from("listings").update({ status: "active" }).eq("id", created.id);
    setSaving(false);
    if (publishError) { setError(friendlyError(publishError.message)); return; }
    setPublished(true);
  };

  return <MarketplaceFrame backTo="/browse"><section className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
    <PageIntro eyebrow="Give it another outing" title="Share something you love." description="List one piece at a time. You choose the daily price; the full item value stays as a refundable deposit." />
    {!loadingAuth && !userId ? <div className="mt-10 border-y border-border py-10"><p className="text-lg font-medium">Create an account to list a piece.</p><p className="mt-2 text-sm text-muted-foreground">You can browse without signing in; a free account is needed to manage your wardrobe.</p><Button asChild className="mt-6 rounded-full"><Link to="/auth">Create account <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div> : published ? <div className="mt-10 border-y border-border py-14 text-center"><Check className="mx-auto h-8 w-8 text-gold" /><h2 className="mt-5 text-2xl font-semibold">Your piece is now in the wardrobe.</h2><p className="mt-3 text-sm text-muted-foreground">It is visible to renters in {city}.</p><Button asChild className="mt-7 rounded-full"><Link to="/browse">See the wardrobe <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div> : <form onSubmit={publish} className="mt-9 grid gap-12 lg:grid-cols-[1fr_0.62fr]">
      <div className="space-y-7"><div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2 sm:col-span-2"><Label htmlFor="listing-title">Name your piece</Label><Input id="listing-title" required maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Emerald embroidered kurta" /></div><div className="space-y-2"><Label htmlFor="listing-category">Category</Label><select id="listing-category" value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option>Indian occasionwear</option><option>Western occasionwear</option><option>Everyday clothing</option><option>Outerwear</option><option>Accessories</option></select></div><div className="space-y-2"><Label htmlFor="listing-size">Size</Label><Input id="listing-size" required value={size} onChange={(event) => setSize(event.target.value)} placeholder="e.g. M, 38, Free size" /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="listing-city">City</Label><Input id="listing-city" required value={city} onChange={(event) => setCity(event.target.value)} placeholder="Your city" /></div></div>
        <div className="space-y-2"><Label htmlFor="listing-description">Details</Label><Textarea id="listing-description" required minLength={10} maxLength={2000} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What makes it special? Add fit or measurement notes." className="min-h-28" /></div>
        <div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="listing-condition">Condition</Label><select id="listing-condition" value={condition} onChange={(event) => setCondition(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option>New with tags</option><option>Like new</option><option>Excellent</option><option>Good</option></select></div><div className="space-y-2"><Label htmlFor="listing-cleaning">Cleaning method</Label><select id="listing-cleaning" value={cleaning} onChange={(event) => setCleaning(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="dry_clean">Dry clean</option><option value="hand_wash">Hand wash</option><option value="machine_wash">Machine wash</option></select></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="listing-care">Care instructions <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="listing-care" value={care} onChange={(event) => setCare(event.target.value)} placeholder="e.g. Dry clean only; store flat" /></div></div>
      </div>
      <aside className="space-y-8 lg:border-l lg:border-border lg:pl-8"><div><div className="flex items-center justify-between"><Label>Photos</Label><span className="text-xs text-muted-foreground">{files.length} / 8</span></div><p className="mt-2 text-xs leading-5 text-muted-foreground">Show the full piece and its details. At least 3 photos, each under 8 MB.</p><div className="mt-4 grid grid-cols-3 gap-2">{previews.map((url, index) => <div key={url} className="group relative aspect-square overflow-hidden bg-muted"><img src={url} alt={`Photo ${index + 1} preview`} className="h-full w-full object-cover" /><button type="button" aria-label={`Remove photo ${index + 1}`} onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} className="absolute right-1 top-1 grid h-7 w-7 place-items-center bg-background/90 text-foreground"><X className="h-4 w-4" /></button></div>)}{files.length < 8 && <label className="flex aspect-square cursor-pointer flex-col items-center justify-center border border-dashed border-border-strong text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"><ImagePlus className="h-5 w-5" /><span className="mt-2 text-xs">Add photo</span><input type="file" accept="image/*" multiple className="sr-only" onChange={(event) => { addFiles(event.target.files); event.target.value = ""; }} /></label>}</div></div>
        <div className="space-y-4 border-y border-border py-6"><div className="space-y-2"><Label htmlFor="listing-value">What is it worth?</Label><Input id="listing-value" type="number" min="1" max={MAX_LISTING_VALUE} step="1" required value={itemValue} onChange={(event) => { setItemValue(event.target.value); if (!price && Number(event.target.value)) setPrice(String(Math.round(Number(event.target.value) * 0.09)); }} placeholder="Up to ₹5,000" /><p className="text-xs text-muted-foreground">For the first collection: maximum ₹{MAX_LISTING_VALUE.toLocaleString("en-IN")}.</p></div><div className="space-y-2"><Label htmlFor="listing-price">Rental price per day</Label><Input id="listing-price" type="number" min="1" step="1" required value={price} onChange={(event) => setPrice(event.target.value)} placeholder={estimate ? String(estimate) : "Your price in ₹"} /><p className="text-xs text-muted-foreground">A suggested starting point is about 9% of item value per day.</p></div><div className="flex justify-between border-t border-border pt-4 text-sm"><span>Refundable deposit</span><span className="font-medium">{itemValue ? inr(Number(itemValue)) : "Set by item value"}</span></div></div>
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-6"><Checkbox checked={ownership} onCheckedChange={(checked) => setOwnership(checked === true)} /><span>I own this piece and have the right to rent it out.</span></label>
        {error && <p role="alert" className="flex gap-2 text-sm text-destructive"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>}
        <div className="border-t border-border pt-5"><Button type="submit" disabled={saving || loadingAuth || !userId} className="h-12 w-full rounded-full">{saving ? "Publishing your piece…" : "Publish listing"}<ArrowRight className="ml-2 h-4 w-4" /></Button><p className="mt-3 flex gap-2 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />Your identity is not needed to list. It is checked only when you accept a real request.</p></div>
      </aside>
    </form>}
  </section></MarketplaceFrame>;
}