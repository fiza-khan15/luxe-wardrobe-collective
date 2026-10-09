# Architecture decisions

- Keep the existing public landing page at `/` and implement each marketplace surface as a separate TanStack file route, because the marketing entry point remains part of the approved MVP.
- Keep customer browsing public and place account-only marketplace routes under a single client-gated, `ssr: false` pathless layout, because browser sessions cannot be read during server rendering.
- Use the existing browser Supabase client for RLS-protected reads and writes, and use database RPCs for state transitions; this keeps permissions enforced by the user's session and centralizes rental rules.
- Keep payment-provider operations out of browser code and do not mark a rental as paid without a verified provider callback, because payment confirmation must be authoritative.