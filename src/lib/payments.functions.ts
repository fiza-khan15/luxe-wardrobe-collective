import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Step 1: the renter taps "Verify and pay". Checks the request and creates the Razorpay order.
export const createPaymentOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ requestId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { createOrderFlow } = await import("./payments-core.server");
    const { makePaymentDb, readPaymentEnv } = await import("./payments-db.server");
    return createOrderFlow(makePaymentDb(context.supabase), readPaymentEnv(), { requestId: data.requestId });
  });

// Step 2: Razorpay Checkout finished in the browser. Confirm it with Razorpay before marking anything paid.
export const verifyPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      requestId: z.string().uuid(),
      orderId: z.string().min(1).max(100),
      paymentId: z.string().min(1).max(100),
      signature: z.string().min(1).max(200),
    }),
  )
  .handler(async ({ data, context }) => {
    const { verifyFlow } = await import("./payments-core.server");
    const { makePaymentDb, readPaymentEnv } = await import("./payments-db.server");
    return verifyFlow(makePaymentDb(context.supabase), readPaymentEnv(), { ...data, userId: context.userId });
  });