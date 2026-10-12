import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarketplaceFrame, PageIntro } from "@/lib/marketplace-ui";
import { marketplaceError } from "@/lib/marketplace";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
  head: () => ({ meta: [
    { title: "Private marketplace review | indrobe" },
    { name: "description", content: "Review identity submissions and marketplace issues for indrobe." },
    { property: "og:title", content: "Marketplace review | indrobe" },
    { property: "og:description", content: "Private operations tools for indrobe." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
});

type ProfileRow = { id: string; full_name: string; phone: string; city: string; verification_status: string; created_at: string };
type DisputeRow = { id: string; request_id: string; raised_by: string; reason: string; status: string; created_at: string };

function AdminPage() {
  const { user } = Route.useRouteContext();
  const [authorized, setAuthorized] = useState<boolean | null>(null); const [profiles, setProfiles] = useState<ProfileRow[]>([]); const [disputes, setDisputes] = useState<DisputeRow[]>([]); const [reasons, setReasons] = useState<Record<string, string>>({}); const [resolutions, setResolutions] = useState<Record<string, string>>({}); const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [busy, setBusy] = useState("");

  const reload = async () => {
    const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (roleError) throw roleError;
    setAuthorized(Boolean(isAdmin));
    if (!isAdmin) return;
    const [profileResult, disputeResult] = await Promise.all([
      supabase.from("profiles").select("id,full_name,phone,city,verification_status,created_at").order("created_at", { ascending: false }).limit(200),
      supabase.from("disputes").select("id,request_id,raised_by,reason,status,created_at").order("created_at", { ascending: false }).limit(100),
    ]);
    if (profileResult.error) throw profileResult.error;
    if (disputeResult.error) throw disputeResult.error;
    setProfiles(profileResult.data ?? []); setDisputes(disputeResult.data ?? []);
  };

  useEffect(() => {
    let active = true;
    reload().catch((cause: unknown) => { if (active) { setAuthorized(false); setError(marketplaceError(cause)); } });
    return () => { active = false; };
  }, [user.id]);

  const changeVerification = async (profile: ProfileRow, status: "approved" | "rejected") => {
    setBusy(profile.id); setError(""); setNotice("");
    const { error: actionError } = await supabase.rpc("admin_set_verification", { _user: profile.id, _status: status, _reason: status === "rejected" ? reasons[profile.id] || "Please contact support to retry." : null });
    if (actionError) setError(marketplaceError(actionError));
    else { setNotice(`Identity review updated for ${profile.full_name || "the member"}.`); await reload(); }
    setBusy("");
  };

  const suspend = async (profile: ProfileRow, suspended: boolean) => {
    setBusy(profile.id); setError("");
    const { error: actionError } = await supabase.rpc("admin_suspend_user", { _user: profile.id, _suspended: suspended });
    if (actionError) setError(marketplaceError(actionError)); else { setNotice(suspended ? "Account suspended." : "Account restored."); await reload(); }
    setBusy("");
  };

  const resolve = async (dispute: DisputeRow) => {
    const resolution = (resolutions[dispute.id] ?? "").trim();
    if (!resolution) return;
    setBusy(dispute.id); setError("");
    const { error: actionError } = await supabase.rpc("admin_resolve_dispute", { _id: dispute.id, _resolution: resolution });
    if (actionError) setError(marketplaceError(actionError)); else { setNotice("Issue marked as resolved."); await reload(); }
    setBusy("");
  };

  return <MarketplaceFrame><section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16"><PageIntro eyebrow="Private operations" title="Marketplace review" description="Identity decisions and dispute handling are restricted to approved indrobe administrators." action={<Button asChild variant="outline" className="rounded-full"><Link to="/browse"><ArrowLeft className="mr-2 h-4 w-4" />Marketplace</Link></Button>} />
    {error && <p role="alert" className="mt-6 text-sm text-destructive">{error}</p>}{notice && <p role="status" className="mt-6 text-sm text-gold">{notice}</p>}
    {authorized === null ? <p className="py-16 text-sm text-muted-foreground">Checking private access…</p> : !authorized ? <div className="mt-10 flex gap-4 border-y border-border py-10"><ShieldCheck className="h-5 w-5 shrink-0 text-muted-foreground" /><div><h2 className="font-medium">Private access only.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">This account is not assigned the indrobe administrator role. Ask the project owner to grant access to the correct account.</p></div></div> : <div className="mt-10 space-y-16">
      <section><div className="mb-6 flex items-baseline justify-between"><h2 className="text-xl font-semibold">Identity review</h2><span className="text-xs text-muted-foreground">{profiles.filter((profile) => profile.verification_status === "pending").length} awaiting review</span></div><div className="divide-y divide-border border-y border-border">{profiles.filter((profile) => profile.verification_status !== "none").map((profile) => <article key={profile.id} className="grid gap-4 py-5 md:grid-cols-[1fr_auto]"><div><p className="font-medium">{profile.full_name || "Member"}</p><p className="mt-1 text-sm text-muted-foreground">{profile.phone} · {profile.city}</p><p className="mt-2 text-xs uppercase tracking-wider text-gold">{profile.verification_status}</p></div><div className="flex flex-col gap-2 md:min-w-56"><Input aria-label={`Reason for ${profile.full_name}`} placeholder="Reason, if declining" value={reasons[profile.id] ?? ""} onChange={(event) => setReasons((current) => ({ ...current, [profile.id]: event.target.value }))} /><div className="flex gap-2"><Button size="sm" disabled={busy === profile.id || profile.verification_status === "approved"} onClick={() => void changeVerification(profile, "approved")}>Approve</Button><Button size="sm" variant="outline" disabled={busy === profile.id || profile.verification_status === "rejected"} onClick={() => void changeVerification(profile, "rejected")}>Request retry</Button><Button size="sm" variant="ghost" disabled={busy === profile.id} onClick={() => void suspend(profile, true)}>Suspend</Button></div></div></article>)}{profiles.every((profile) => profile.verification_status === "none") && <p className="py-8 text-sm text-muted-foreground">No identity submissions.</p>}</div></section>
      <section><div className="mb-6 flex items-baseline justify-between"><h2 className="text-xl font-semibold">Disputes</h2><span className="text-xs text-muted-foreground">{disputes.filter((dispute) => dispute.status === "open").length} open</span></div><div className="divide-y divide-border border-y border-border">{disputes.map((dispute) => <article key={dispute.id} className="grid gap-4 py-5 md:grid-cols-[1fr_auto]"><div><p className="text-xs uppercase tracking-wider text-gold">{dispute.status} · Request {dispute.request_id.slice(0, 8)}</p><p className="mt-2 text-sm leading-6">{dispute.reason}</p><p className="mt-2 text-xs text-muted-foreground">Raised {formatDate(dispute.created_at)}</p></div>{dispute.status === "open" && <div className="flex gap-2 md:min-w-80"><Input aria-label="Resolution" value={resolutions[dispute.id] ?? ""} onChange={(event) => setResolutions((current) => ({ ...current, [dispute.id]: event.target.value }))} placeholder="Resolution note" /><Button disabled={busy === dispute.id || !(resolutions[dispute.id] ?? "").trim()} onClick={() => void resolve(dispute)}>Resolve</Button></div>}</article>)}{disputes.length === 0 && <p className="py-8 text-sm text-muted-foreground">No reported issues.</p>}</div></section>
      <section><h2 className="text-xl font-semibold">Member access</h2><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Suspend controls are available with each member's identity review. Restoring a suspended member needs an explicit review and can be handled by the indrobe operations owner.</p></section>
    </div>}
  </section></MarketplaceFrame>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}