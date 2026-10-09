import type { PropsWithChildren } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Bell, CircleUserRound, Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MarketplaceHeader({ backTo }: { backTo?: "/browse" | "/" } = {}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link to="/browse" className="text-lg font-semibold text-foreground">
          indrobe<span className="text-gold">.</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-3" aria-label="Marketplace">
          <Link to="/browse" className="px-2 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">Discover</Link>
          <Link to="/list" className="hidden px-2 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:block">List a piece</Link>
          <Button asChild variant="ghost" size="icon" aria-label="My rentals" title="My rentals">
            <Link to="/rentals"><Bell className="h-4 w-4" /></Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-2 rounded-full">
            <Link to="/profile"><CircleUserRound className="h-4 w-4" /><span className="hidden sm:inline">Account</span></Link>
          </Button>
        </nav>
      </div>
      {backTo && (
        <div className="mx-auto max-w-7xl px-5 pb-3 sm:px-8">
          <Link to={backTo} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" />Back</Link>
        </div>
      )}
    </header>
  );
}

export function MarketplaceFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <span className="font-semibold text-foreground">indrobe<span className="text-gold">.</span></span>
        <span>Peer-owned style, worn again.</span>
        <Link to="/" className="hover:text-foreground">About indrobe <ArrowRight className="ml-1 inline h-3 w-3" /></Link>
      </div>
    </footer>
  );
}

export function MarketplaceFrame({ children, backTo }: PropsWithChildren<{ backTo?: "/browse" | "/" }>) {
  return <div className="min-h-screen bg-background"><MarketplaceHeader backTo={backTo} /><main>{children}</main><MarketplaceFooter /></div>;
}

export function EmptyState({ icon = "shirt", title, body, action }: { icon?: "shirt" | "bell"; title: string; body: string; action?: React.ReactNode }) {
  const Icon = icon === "bell" ? Bell : Shirt;
  return <div className="flex min-h-64 flex-col items-center justify-center border-y border-border py-16 text-center">
    <Icon className="mb-5 h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
    <h2 className="text-xl font-medium">{title}</h2>
    <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{body}</p>
    {action && <div className="mt-6">{action}</div>}
  </div>;
}

export function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
    <div><p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-gold">{eyebrow}</p><h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1><p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">{description}</p></div>
    {action}
  </div>;
}