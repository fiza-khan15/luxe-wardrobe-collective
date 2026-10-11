import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarketplaceFrame } from "@/lib/marketplace-ui";
import { friendlyError } from "@/lib/marketplace";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({ meta: [
    { title: "Sign in or create an account | indrobe" },
    { name: "description", content: "Sign in or create an indrobe account to request a rental or manage your wardrobe listing." },
    { property: "og:title", content: "Your indrobe account" },
    { property: "og:description", content: "Join indrobe to rent or share clothes from real wardrobes." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (active && user) void navigate({ to: "/browse" });
    });
    return () => { active = false; };
  }, [navigate]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setWorking(true); setError(""); setMessage("");
    if (mode === "signup") {
      const { data, error: authError } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: fullName.trim() } } });
      setWorking(false);
      if (authError) { setError(friendlyError(authError.message)); return; }
      if (!data.session) { setMessage("Check your email for a confirmation link. Then come back here to sign in."); return; }
      await navigate({ to: "/profile" });
      return;
    }
    const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setWorking(false);
    if (authError) { setError(friendlyError(authError.message)); return; }
    await navigate({ to: "/browse" });
  };

  return <MarketplaceFrame backTo="/browse"><section className="mx-auto max-w-xl px-5 py-14 sm:px-8 sm:py-20">
    <div className="mb-8"><p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-gold">Your indrobe account</p><h1 className="text-4xl font-semibold tracking-tight">{mode === "signup" ? "Make room for more." : "Welcome back."}</h1><p className="mt-4 text-sm leading-6 text-muted-foreground">{mode === "signup" ? "Create an account to request a piece or share something from your wardrobe." : "Sign in to see your rentals and wardrobe."}</p></div>
    <div className="grid grid-cols-2 border-b border-border" role="tablist" aria-label="Account action"><button type="button" role="tab" aria-selected={mode === "signup"} onClick={() => { setMode("signup"); setError(""); setMessage(""); }} className={`border-b-2 px-4 py-3 text-sm ${mode === "signup" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"}`}>Create account</button><button type="button" role="tab" aria-selected={mode === "signin"} onClick={() => { setMode("signin"); setError(""); setMessage(""); }} className={`border-b-2 px-4 py-3 text-sm ${mode === "signin" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"}`}>Sign in</button></div>
    <form className="mt-7 space-y-5" onSubmit={submit}>
      {mode === "signup" && <div className="space-y-2"><Label htmlFor="auth-name">Name</Label><Input id="auth-name" autoComplete="name" required value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your name" /></div>}
      <div className="space-y-2"><Label htmlFor="auth-email">Email</Label><Input id="auth-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></div>
      <div className="space-y-2"><Label htmlFor="auth-password">Password</Label><Input id="auth-password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" /></div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {message && <p role="status" className="flex gap-2 border-l-2 border-gold pl-3 text-sm leading-6"><Check className="mt-1 h-4 w-4 shrink-0 text-gold" />{message}</p>}
      <Button type="submit" disabled={working} className="h-12 w-full rounded-full">{working ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}<ArrowRight className="ml-2 h-4 w-4" /></Button>
    </form>
    <p className="mt-7 border-t border-border pt-5 text-xs leading-5 text-muted-foreground">By continuing, you agree to create an account for use by adults aged 18 and above.</p>
    <Link to="/" className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Return to indrobe</Link>
  </section></MarketplaceFrame>;
}