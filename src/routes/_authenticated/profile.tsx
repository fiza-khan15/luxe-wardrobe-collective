import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Check, CircleAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarketplaceFrame, PageIntro } from "@/lib/marketplace-ui";
import { marketplaceError } from "@/lib/marketplace";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
  head: () => ({ meta: [
    { title: "Your profile and verification | indrobe" },
    { name: "description", content: "Manage your indrobe account and submit the information needed for identity review." },
    { property: "og:title", content: "Your profile | indrobe" },
    { property: "og:description", content: "Manage account details and verification status." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
});

type Profile = { full_name: string; phone: string; city: string; address: string | null; pincode: string | null; is_18_plus: boolean; verification_status: string; rejection_reason: string | null };

function ProfilePage() {
  const { user } = Route.useRouteContext();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState(""); const [phone, setPhone] = useState(""); const [city, setCity] = useState(""); const [address, setAddress] = useState(""); const [pincode, setPincode] = useState("");
  const [adult, setAdult] = useState(false); const [agreement, setAgreement] = useState(false); const [kycConsent, setKycConsent] = useState(false);
  const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    supabase.from("profiles").select("full_name,phone,city,address,pincode,is_18_plus,verification_status,rejection_reason").eq("id", user.id).maybeSingle().then(({ data, error: loadError }) => {
      if (!active) return;
      if (loadError) { setError(marketplaceError(loadError)); return; }
      if (data) { setProfile(data); setFullName(data.full_name); setPhone(data.phone); setCity(data.city); setAddress(data.address ?? ""); setPincode(data.pincode ?? ""); setAdult(data.is_18_plus); }
    });
    return () => { active = false; };
  }, [user.id]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    const { error: submitError } = await supabase.rpc("submit_profile_verification", { _full_name: fullName.trim(), _phone: phone.trim(), _city: city.trim(), _address: address.trim(), _pincode: pincode.trim(), _is_18_plus: adult, _agreement: agreement, _kyc_consent: kycConsent });
    setSaving(false);
    if (submitError) { setError(marketplaceError(submitError)); return; }
    setProfile((previous) => previous ? { ...previous, full_name: fullName, phone, city, address, pincode, is_18_plus: adult, verification_status: "pending", rejection_reason: null } : previous);
    setNotice("Your details are submitted. Indrobe will review your identity before a rental is confirmed.");
  };

  const verification = profile?.verification_status ?? "none";
  return <MarketplaceFrame><section className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
    <PageIntro eyebrow="Account" title="Your profile" description="Your contact and delivery details stay private to your account and active rental." action={<Button asChild variant="outline" className="rounded-full"><Link to="/rentals">My rentals <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>} />
    {profile && <div className="mt-8 flex flex-col gap-3 border-y border-border py-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-gold" /><div><p className="font-medium">Identity review</p><p className="mt-1 text-sm text-muted-foreground">{verification === "approved" ? "Approved" : verification === "pending" ? "Under review" : verification === "rejected" ? "Needs another try" : "Not started"}</p>{verification === "rejected" && profile.rejection_reason && <p className="mt-2 text-sm text-destructive">{profile.rejection_reason}</p>}</div></div>{verification === "approved" && <span className="inline-flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-gold" />Verified</span>}</div>}
    <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_0.7fr]"><form onSubmit={submit} className="space-y-6"><div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="profile-name">Full name</Label><Input id="profile-name" autoComplete="name" required minLength={2} value={fullName} onChange={(event) => setFullName(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="profile-phone">Phone number</Label><Input id="profile-phone" autoComplete="tel" type="tel" required minLength={8} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91" /></div><div className="space-y-2"><Label htmlFor="profile-city">City</Label><Input id="profile-city" required value={city} onChange={(event) => setCity(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="profile-pincode">PIN code</Label><Input id="profile-pincode" autoComplete="postal-code" value={pincode} onChange={(event) => setPincode(event.target.value)} /></div></div><div className="space-y-2"><Label htmlFor="profile-address">Delivery address</Label><Input id="profile-address" autoComplete="street-address" required minLength={5} value={address} onChange={(event) => setAddress(event.target.value)} /></div><div className="space-y-4 border-y border-border py-5"><label className="flex cursor-pointer items-start gap-3 text-sm leading-6"><Checkbox checked={adult} onCheckedChange={(checked) => setAdult(checked === true)} /><span>I confirm I am 18 or older.</span></label><label className="flex cursor-pointer items-start gap-3 text-sm leading-6"><Checkbox checked={agreement} onCheckedChange={(checked) => setAgreement(checked === true)} /><span>I agree to the rental terms for my rentals.</span></label><label className="flex cursor-pointer items-start gap-3 text-sm leading-6"><Checkbox checked={kycConsent} onCheckedChange={(checked) => setKycConsent(checked === true)} /><span>I consent to an identity check through a licensed provider when a rental is ready. Indrobe does not request or store raw Aadhaar details.</span></label></div>{error && <p role="alert" className="flex gap-2 text-sm text-destructive"><CircleAlert className="h-4 w-4 shrink-0" />{error}</p>}{notice && <p role="status" className="flex gap-2 border-l-2 border-gold pl-3 text-sm leading-6"><Check className="mt-1 h-4 w-4 shrink-0 text-gold" />{notice}</p>}<Button type="submit" disabled={saving || verification === "approved"} className="h-12 rounded-full px-6">{saving ? "Submitting…" : verification === "pending" ? "Update and resubmit" : verification === "approved" ? "Identity approved" : "Submit for identity review"}</Button></form><aside className="border-t border-border pt-6 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0"><p className="text-xs font-medium uppercase tracking-[0.16em] text-gold">Private by design</p><h2 className="mt-3 text-xl font-medium">Only when a rental is real.</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">You can browse and list without identity review. We ask for it when a rental is about to move ahead—not just for looking around.</p><div className="mt-7 space-y-4 border-t border-border pt-6 text-sm leading-6"><p className="flex gap-3"><ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />We never ask for your Aadhaar number in this form.</p><p className="flex gap-3"><Check className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />Your delivery details are used for your rental journey.</p></div></aside></div>
  </section></MarketplaceFrame>;
}