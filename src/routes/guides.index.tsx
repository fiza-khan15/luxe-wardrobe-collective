import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { MarketplaceFrame, PageIntro } from "@/lib/marketplace-ui";

export const Route = createFileRoute("/guides/")({
  component: GuidesPage,
  head: () => ({
    meta: [
      { title: "Guides — indrobe" },
      { name: "description", content: "Practical guides for giving and renting on indrobe — packing, shipping and caring for shared pieces." },
      { property: "og:title", content: "Guides — indrobe" },
      { property: "og:description", content: "Short, practical guides for peer-owned style rotation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://style-exchange-luxe.lovable.app/guides" }],
  }),
});

const guides = [
  {
    to: "/guides/packing",
    title: "How to pack your item",
    summary: "Pack it with what you already have at home. No need to buy anything.",
    tag: "Shipping",
    meta: "7 steps",
  },
];

function GuidesPage() {
  return (
    <MarketplaceFrame backTo="/">
      <section className="mx-auto max-w-5xl px-5 pb-24 pt-12 sm:px-8 sm:pt-16">
        <PageIntro
          eyebrow="Guides"
          title="Ship with confidence."
          description="Short, practical guides for giving and renting on indrobe — written for real homes, not warehouses."
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {guides.map((guide) => (
            <Link
              key={guide.to}
              to={guide.to}
              className="group flex flex-col border border-border p-7 transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="mb-6 flex items-center justify-between text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                <span className="flex items-center gap-2"><BookOpen className="h-3.5 w-3.5" />{guide.tag}</span>
                <span>{guide.meta}</span>
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">{guide.title}</h2>
              <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{guide.summary}</p>
              <span className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                Read guide
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </MarketplaceFrame>
  );
}
