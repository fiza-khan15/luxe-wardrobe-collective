import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { MarketplaceFrame } from "@/lib/marketplace-ui";

export const Route = createFileRoute("/guides/packing")({
  component: PackingGuide,
  head: () => ({
    meta: [
      { title: "How to pack your item — indrobe Guides" },
      { name: "description", content: "Pack a rental item with what you already have at home. Seven simple steps, no purchases needed." },
      { property: "og:title", content: "How to pack your item — indrobe Guides" },
      { property: "og:description", content: "Seven steps to bag, wrap, seal, label and photograph a rental shipment using everyday materials." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://style-exchange-luxe.lovable.app/guides/packing" }],
  }),
});

const svgProps = {
  viewBox: "0 0 240 180",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

function ArtFoldBag() {
  return (
    <svg {...svgProps} className="h-40 w-auto max-w-full text-foreground">
      <g className="text-gold">
        <path d="M86 30h68v20l-8 5v19H94V55l-8-5V30z" />
        <path d="M94 47h52" />
      </g>
      <path d="M120 86v22" />
      <path d="M112 100l8 8 8-8" />
      <path d="M98 128q22 9 44 0" />
      <path d="M98 128l-8 30h60l-8-30" />
      <path d="M108 122c-7-4-5-13 2-12s4 9-2 12z" />
      <path d="M132 122c7-4 5-13-2-12s-4 9 2 12z" />
    </svg>
  );
}

function ArtBoxEnvelope() {
  return (
    <svg {...svgProps} className="h-40 w-auto max-w-full text-foreground">
      <path d="M38 94l34-16 34 16v44l-34 16-34-16V94z" />
      <path d="M38 94l34 16 34-16" />
      <path d="M72 110v44" />
      <rect x="126" y="78" width="90" height="58" rx="6" />
      <path d="M126 90l45 26 45-26" />
      <g className="text-gold" fill="currentColor" stroke="none">
        <circle cx="140" cy="126" r="1.6" />
        <circle cx="152" cy="130" r="1.6" />
        <circle cx="164" cy="126" r="1.6" />
        <circle cx="176" cy="130" r="1.6" />
        <circle cx="188" cy="126" r="1.6" />
        <circle cx="200" cy="130" r="1.6" />
      </g>
    </svg>
  );
}

function ArtWrapDelicate() {
  return (
    <svg {...svgProps} className="h-40 w-auto max-w-full text-foreground">
      <circle cx="120" cy="84" r="30" />
      <g className="text-gold">
        <path d="M112 72l8-6 8 6v16l-8 6-8-6V72z" />
      </g>
      <path d="M97 63c14 13 29 29 45 43" />
      <path d="M143 63c-14 13-29 29-45 43" />
      <path d="M46 132l7-11 11 3 6-9 9 10-4 11-13 4-8-6-8-2z" />
      <path d="M168 136l6-9 11 2 7-7 5 10-6 9-11 2-6-4-6-3z" />
    </svg>
  );
}

function ArtSealBox() {
  return (
    <svg {...svgProps} className="h-40 w-auto max-w-full text-foreground">
      <rect x="58" y="42" width="124" height="96" rx="4" />
      <path d="M58 42l62 48 62-48" />
      <path d="M58 138l62-48 62 48" />
      <g className="text-gold">
        <rect x="110" y="38" width="20" height="104" rx="2" />
      </g>
      <path d="M110 38l20 5-20 5" />
    </svg>
  );
}

function ArtHandLabel() {
  return (
    <svg {...svgProps} className="h-40 w-auto max-w-full text-foreground">
      <rect x="50" y="58" width="140" height="84" rx="4" />
      <path d="M50 100h140" />
      <g className="text-gold">
        <rect x="74" y="72" width="92" height="52" rx="3" />
      </g>
      <path d="M84 84c8-3 15 3 23 0s15-3 23 0 12 2 20 0" />
      <path d="M84 96c10-2 18 2 28 0s18-2 28 0 14 2 22 0" />
      <path d="M84 108c8-2 12 2 18 0s10-2 16 0" />
    </svg>
  );
}

function ArtReturnNote() {
  return (
    <svg {...svgProps} className="h-40 w-auto max-w-full text-foreground">
      <g className="text-gold">
        <rect x="94" y="42" width="60" height="64" rx="3" />
        <path d="M104 56h34" />
        <path d="M104 66h40" />
        <path d="M104 76h24" />
      </g>
      <path d="M86 110h76l-8 38H94l-8-38z" />
      <path d="M86 110l-18-20" />
      <path d="M162 110l18-20" />
    </svg>
  );
}

function ArtPhotoPackage() {
  return (
    <svg {...svgProps} className="h-40 w-auto max-w-full text-foreground">
      <rect x="46" y="88" width="68" height="52" rx="4" />
      <path d="M80 88v52" />
      <rect x="58" y="100" width="44" height="26" rx="2" />
      <g className="text-gold">
        <path d="M34 78v-8h10" />
        <path d="M126 70h10v8" />
        <path d="M34 152v8h10" />
        <path d="M136 152v8h-10" />
        <rect x="162" y="64" width="46" height="86" rx="9" />
        <circle cx="175" cy="76" r="3" />
      </g>
      <path d="M175 140h20" />
    </svg>
  );
}

type Step = {
  title: string;
  body: string;
  art: ReactNode;
};

const steps: Step[] = [
  {
    title: "Fold and bag the item",
    body: "Fold the item neatly as you'd fold it for your own wardrobe. Place it inside a clean polythene bag or a repurposed courier/shopping bag — anything that fully seals and keeps moisture, dust and odour out. Never ship an item loose or uncovered, even inside a box.",
    art: <ArtFoldBag />,
  },
  {
    title: "Reuse a box or padded envelope",
    body: "Use any sturdy box you already have at home (an old shoe box, delivery box, or Amazon/Flipkart box) sized close to the item — not much bigger, so it doesn't move around in transit. For lightweight items like a dupatta, scarf, or accessory, a padded envelope or a thick courier bag works fine and is cheaper to ship than a box.",
    art: <ArtBoxEnvelope />,
  },
  {
    title: "Add a protective layer for delicate items",
    body: "For jewellery, embellished or embroidered pieces, or anything with sequins or delicate trims, wrap in an old newspaper, bubble wrap, or a soft cloth before placing in the bag — scrunched newspaper in the gaps stops it shifting around during transit.",
    art: <ArtWrapDelicate />,
  },
  {
    title: "Seal it properly",
    body: "Close the polythene bag with a knot or tape, then seal the outer box or envelope completely with packing tape or any strong tape you have. Make sure there are no open flaps — a half-sealed package is the most common reason items arrive damaged or lost.",
    art: <ArtSealBox />,
  },
  {
    title: "Write the shipping label by hand",
    body: "On a plain sheet of paper or a sticky note, write clearly: renter's name, full delivery address, phone number, and the Indrobe request ID (shown in your dispatch screen). Tape this securely to the top of the package. No printer needed — handwritten is fine as long as it's legible.",
    art: <ArtHandLabel />,
  },
  {
    title: "Add a return label inside the package",
    body: "Include a second note inside the package (not on the outside) with your own name, address and phone number, labeled \"Return to\". This makes it easy for the renter to send it back to the right place without needing to open the app again.",
    art: <ArtReturnNote />,
  },
  {
    title: "Photograph the sealed package before handing it to courier",
    body: "Take one photo of the fully sealed, labeled package before dispatch — this is your proof that it left your hands in good condition and properly packed, separate from the item-condition photo you already take for the dispatch record.",
    art: <ArtPhotoPackage />,
  },
];

function PackingGuide() {
  return (
    <MarketplaceFrame backTo="/guides">
      <article className="mx-auto max-w-4xl px-5 pb-24 pt-12 sm:px-8 sm:pt-16">
        <header className="border-b border-border pb-10">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-gold">Guide</p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">How to pack your item</h1>
          <p className="mt-5 max-w-2xl text-lg leading-7 text-muted-foreground">
            Pack it with what you already have at home. No need to buy anything.
          </p>
        </header>
        <ol className="list-none">
          {steps.map((step, index) => (
            <li key={step.title} className="border-b border-border py-12 last:border-b-0">
              <div className="grid items-center gap-8 sm:grid-cols-2 sm:gap-12">
                <div className={`flex aspect-[5/4] items-center justify-center rounded-xl border border-border bg-surface p-6 ${index % 2 === 1 ? "sm:order-2" : ""}`}>
                  {step.art}
                </div>
                <div>
                  <p className="font-mono text-sm text-gold">{String(index + 1).padStart(2, "0")}</p>
                  <h2 className="mt-2 text-balance text-xl font-semibold tracking-tight sm:text-2xl">{step.title}</h2>
                  <p className="mt-4 text-pretty text-[15px] leading-7 text-muted-foreground">{step.body}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </article>
    </MarketplaceFrame>
  );
}
