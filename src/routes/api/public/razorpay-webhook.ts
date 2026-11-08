import { createFileRoute } from "@tanstack/react-router";

// Razorpay calls this address itself when a payment succeeds or fails.
// Its signature is checked before any payment state is changed.
export const Route = createFileRoute("/api/public/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { webhookFlow } = await import("@/lib/payments-core.server");
        const { makePaymentDb } = await import("@/lib/payments-db.server");
        const keyId = process.env["RAZORPAY_KEY_ID"];
        const keySecret = process.env["RAZORPAY_KEY_SECRET"];
        const webhookSecret = process.env["RAZORPAY_WEBHOOK_SECRET"];
        if (!keyId || !keySecret || !webhookSecret) return new Response("Payments are not configured", { status: 500 });

        const rawBody = await request.text();
        const signature = request.headers.get("x-razorpay-signature") ?? "";
        try {
          const result = await webhookFlow(makePaymentDb(), { keyId, keySecret, webhookSecret }, rawBody, signature);
          return new Response(result.body, { status: result.status });
        } catch (cause) {
          console.error("[Payments] webhook failed", cause instanceof Error ? cause.message : cause);
          return new Response("Try again", { status: 500 });
        }
      },
    },
  },
});