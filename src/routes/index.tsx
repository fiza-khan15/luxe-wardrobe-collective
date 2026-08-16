import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check, ShieldCheck, Truck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "indrobe — An infinite wardrobe. Zero fast fashion." },
      {
        name: "description",
        content:
          "Premium peer-to-peer wardrobe subscription for creators and students. Rent high-end aesthetics for a flat monthly fee, or monetize your closet with zero risk.",
      },
      { property: "og:title", content: "indrobe — An infinite wardrobe." },
      {
        property: "og:description",
        content:
          "Rent high-end fashion or earn from your closet. Insured, verified, peer-to-peer.",
      },
    ],
  }),
});

function Nav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="#" className="text-lg font-semibold tracking-tight">
          indrobe<span className="text-gold">.</span>
        </a>
        <a
          href="#waitlist"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-gold focus-visible:bg-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
        >
          Join Waitlist
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="mx-auto max-w-6xl px-6 pt-24 pb-32 sm:pt-32 sm:pb-40">
        <div className="mx-auto max-w-4xl text-center">
          <div className="animate-rise mb-6 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            Founding Members open · 50 spots
          </div>
          <h1 className="animate-rise delay-100 text-balance text-5xl font-semibold tracking-tightest sm:text-7xl md:text-8xl">
            An infinite wardrobe.
            <br />
            <span className="text-muted-foreground">Zero fast fashion.</span>
          </h1>
          <p className="animate-rise delay-200 mx-auto mt-8 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
            The premium peer-to-peer wardrobe subscription for creators and
            students. Rent high-end aesthetics for a flat monthly fee, or
            monetize your own closet with zero risk.
          </p>
          <div className="animate-rise delay-300 mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#waitlist"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-all hover:-translate-y-0.5 hover:bg-gold focus-visible:bg-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 sm:w-auto"
            >
              I want to Rent
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#waitlist"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border-strong bg-background px-6 py-3.5 text-sm font-medium text-foreground transition-colors hover:border-gold hover:text-gold focus-visible:border-gold focus-visible:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/30 sm:w-auto"
            >
              I want to Earn
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProblemSolution() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-3xl px-6 py-32 text-center sm:py-40">
        <h2 className="text-balance text-4xl font-semibold tracking-tightest sm:text-5xl">
          The wardrobe paradox, solved.
        </h2>
        <p className="mt-8 text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
          Buying outfits for a single event is expensive. Letting your best
          clothes sit unworn is a waste. We connect the two through a secure,
          tech-driven platform. You refresh your style daily, or get paid for
          what you already own—we handle the trust.
        </p>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: Sparkles,
      title: "Subscribe & Select.",
      body: "Pick a tier, from Weekend Passes to Creator Packs. Browse a curated, high-aesthetic digital catalog of verified items.",
    },
    {
      icon: Truck,
      title: "Secure & Insured Delivery.",
      body: "Every piece is shipped via professional, fully insured 3PL couriers. Unbox on video, wear it, and pack it back up.",
    },
    {
      icon: ShieldCheck,
      title: "Peer-to-Peer Care.",
      body: "Return it to the original owner who handles the garment care. Zero hidden platform fees, just pure fashion rotation.",
    },
  ];

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-32 sm:py-40">
        <div className="mb-20 max-w-2xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            How it works
          </p>
          <h2 className="text-balance text-4xl font-semibold tracking-tightest sm:text-5xl">
            Three steps. No friction.
          </h2>
        </div>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="bg-background p-10">
              <div className="mb-8 flex items-center justify-between">
                <s.icon className="h-6 w-6" strokeWidth={1.5} />
                <span className="text-xs font-mono text-muted-foreground">
                  0{i + 1}
                </span>
              </div>
              <h3 className="mb-3 text-xl font-semibold tracking-tight">
                {s.title}
              </h3>
              <p className="text-pretty leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustLayer() {
  const items = [
    "Verified University ID & Social Profiles required.",
    "Professional transit insurance on every shipment.",
    "Mandatory unboxing/boxing video verification for dispute protection.",
  ];
  return (
    <section className="border-b border-border bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-32 sm:py-40">
        <div className="grid gap-16 md:grid-cols-2 md:gap-24">
          <div>
            <p className="mb-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">
              Trust layer
            </p>
            <h2 className="text-balance text-4xl font-semibold tracking-tightest sm:text-5xl">
              100% Backed.
              <br />
              <span className="text-gold">Zero Risk.</span>
            </h2>
          </div>
          <ul className="space-y-6 md:pt-4">
            {items.map((item) => (
              <li
                key={item}
                className="flex items-start gap-4 border-t border-border pt-6 first:border-t-0 first:pt-0"
              >
                <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
                <p className="text-lg leading-relaxed">{item}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Waitlist() {
  const [intent, setIntent] = useState<"renter" | "giver" | "both">("renter");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || saving) return;
    setSaving(true);
    setError(null);
    const { error: insertError } = await supabase.from("waitlist_signups").insert({
      email: email.trim(),
      instagram: instagram.trim() || null,
      linkedin: linkedin.trim() || null,
      intent,
    });
    setSaving(false);
    if (insertError) {
      setError("Something went wrong. Please try again.");
      return;
    }
    setSubmitted(true);
  };

  const intents: { id: typeof intent; label: string }[] = [
    { id: "renter", label: "Renter" },
    { id: "giver", label: "Giver" },
    { id: "both", label: "Both" },
  ];


  return (
    <section id="waitlist" className="border-b border-border">
      <div className="mx-auto max-w-2xl px-6 py-32 text-center sm:py-40">
        <h2 className="text-balance text-4xl font-semibold tracking-tightest sm:text-5xl">
          Get early access.
        </h2>
        <p className="mt-6 text-pretty text-lg text-muted-foreground">
          We are securing our first 50 Founding Members. Lock in your spot.
        </p>

        {submitted ? (
          <div className="mt-12 rounded-2xl border border-border bg-secondary p-10">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="h-5 w-5" strokeWidth={3} />
            </div>
            <p className="text-lg font-medium">You're on the list.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              We'll be in touch as a {intent === "both" ? "Renter & Giver" : intent}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-12 space-y-6 text-left">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                maxLength={255}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@example.com"
                className="w-full rounded-full border border-border-strong bg-background px-6 py-4 text-base outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
              />
            </div>

            <div>
              <label htmlFor="instagram" className="sr-only">
                Instagram handle
              </label>
              <input
                id="instagram"
                type="text"
                maxLength={50}
                value={instagram}
                onChange={(e) => setInstagram(e.target.value.replace(/[^a-zA-Z0-9._]/g, ""))}
                placeholder="Your Instagram handle"
                className="w-full rounded-full border border-border-strong bg-background px-6 py-4 text-base outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
              />
            </div>

            <div>
              <label htmlFor="linkedin" className="sr-only">
                LinkedIn profile
              </label>
              <input
                id="linkedin"
                type="text"
                maxLength={100}
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="Your LinkedIn profile (optional)"
                className="w-full rounded-full border border-border-strong bg-background px-6 py-4 text-base outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
              />
            </div>

            <div>
              <p className="mb-3 text-center text-sm font-medium text-muted-foreground">
                Join as
              </p>
              <div className="grid grid-cols-3 gap-2 rounded-full border border-border bg-secondary p-1">
                {intents.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setIntent(opt.id)}
                    className={`rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
                      intent === opt.id
                        ? "bg-background text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-sm font-medium text-primary-foreground transition-all hover:-translate-y-0.5 hover:bg-gold focus-visible:bg-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
            >
              Secure My Spot
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-12 sm:flex-row sm:items-center">
        <p className="text-sm font-semibold tracking-tight">
          indrobe<span className="text-gold">.</span>
        </p>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} indrobe. An infinite wardrobe.
        </p>
      </div>
    </footer>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <Nav />
      <main>
        <Hero />
        <ProblemSolution />
        <HowItWorks />
        <TrustLayer />
        <Waitlist />
      </main>
      <Footer />
    </div>
  );
}
