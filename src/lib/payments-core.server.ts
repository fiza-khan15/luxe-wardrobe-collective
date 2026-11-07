// Server-only payment logic. It talks to the database and Razorpay only through the small
// interfaces below, so every rule here can be tested without either of them.
import {
  captureRazorpayPayment,
  createRazorpayOrder,
  fetchRazorpayPayment,
  toPaise,
  verifyCheckoutSignature,
  verifyWebhookSignature,
  type FetchLike,
} from "./razorpay.server";

export type PaymentEnv = { keyId: string; keySecret: string; webhookSecret?: string };

export type PaymentDb = {
  /** Runs prepare_payment as the signed-in renter. Returns the total in whole rupees. */
  prepareAsRenter(requestId: string): Promise<number>;
  insertPayment(row: { request_id: string; razorpay_order_id: string; amount: number }): Promise<void>;
  findPayment(orderId: string): Promise<{ request_id: string; amount: number } | null>;
  renterOf(requestId: string): Promise<string | null>;
  /** Runs confirm_payment with the service role. Returns "paid", "already_paid" or "needs_refund". */
  confirm(orderId: string, paymentId: string, amountPaise: number): Promise<string>;
  fail(orderId: string): Promise<void>;
};

/** Renter taps pay: check the request, create a Razorpay order for the exact total, remember it. */
export async function createOrderFlow(db: PaymentDb, env: PaymentEnv, input: { requestId: string }, fetchImpl?: FetchLike) {
  const totalRupees = await db.prepareAsRenter(input.requestId);
  const amountPaise = toPaise(totalRupees);
  const order = await createRazorpayOrder({
    keyId: env.keyId,
    keySecret: env.keySecret,
    amountPaise,
    receipt: input.requestId,
    requestId: input.requestId,
    fetchImpl,
  });
  await db.insertPayment({ request_id: input.requestId, razorpay_order_id: order.id, amount: totalRupees });
  return { orderId: order.id, amountPaise, currency: order.currency, keyId: env.keyId };
}

/** Browser reports a finished payment: never trust it until Razorpay itself confirms it. */
export async function verifyFlow(
  db: PaymentDb,
  env: PaymentEnv,
  input: { userId: string; requestId: string; orderId: string; paymentId: string; signature: string },
  fetchImpl?: FetchLike,
) {
  const signatureOk = await verifyCheckoutSignature({ orderId: input.orderId, paymentId: input.paymentId, signature: input.signature, secret: env.keySecret });
  if (!signatureOk) throw new Error("The payment could not be verified.");

  const payment = await db.findPayment(input.orderId);
  if (!payment || payment.request_id !== input.requestId) throw new Error("The payment could not be verified.");
  if ((await db.renterOf(input.requestId)) !== input.userId) throw new Error("Not allowed");

  const expectedPaise = toPaise(payment.amount);
  const credentials = { keyId: env.keyId, keySecret: env.keySecret, fetchImpl };
  let razorpayPayment = await fetchRazorpayPayment({ ...credentials, paymentId: input.paymentId });
  if (razorpayPayment.order_id !== input.orderId || razorpayPayment.amount !== expectedPaise || razorpayPayment.currency !== "INR") {
    throw new Error("The payment could not be verified.");
  }
  if (razorpayPayment.status === "authorized") {
    razorpayPayment = await captureRazorpayPayment({ ...credentials, paymentId: input.paymentId, amountPaise: expectedPaise });
  }
  if (razorpayPayment.status !== "captured") throw new Error("The payment was not completed.");

  return db.confirm(input.orderId, input.paymentId, razorpayPayment.amount);
}

type WebhookPayload = {
  event?: string;
  payload?: { payment?: { entity?: { id?: string; order_id?: string; amount?: number; status?: string } } };
};

/** Razorpay tells us directly. This catches payments whose browser never reported back. */
export async function webhookFlow(db: PaymentDb, env: PaymentEnv, rawBody: string, signature: string): Promise<{ status: number; body: string }> {
  if (!env.webhookSecret) return { status: 500, body: "Webhook is not configured" };
  const signatureOk = await verifyWebhookSignature({ rawBody, signature, secret: env.webhookSecret });
  if (!signatureOk) return { status: 400, body: "Invalid signature" };

  let parsed: WebhookPayload;
  try {
    parsed = JSON.parse(rawBody) as WebhookPayload;
  } catch {
    return { status: 400, body: "Invalid body" };
  }

  const entity = parsed.payload?.payment?.entity;
  const handled = ["payment.captured", "order.paid", "payment.failed"];
  if (!parsed.event || !handled.includes(parsed.event) || !entity?.id || !entity.order_id) return { status: 200, body: "Ignored" };

  const known = await db.findPayment(entity.order_id);
  if (!known) return { status: 200, body: "Unknown order" };

  if (parsed.event === "payment.failed") {
    await db.fail(entity.order_id);
    return { status: 200, body: "Recorded failure" };
  }

  if (entity.status !== "captured" || typeof entity.amount !== "number") return { status: 200, body: "Not captured yet" };
  try {
    const result = await db.confirm(entity.order_id, entity.id, entity.amount);
    return { status: 200, body: result };
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "";
    // A wrong amount will never become right, so stop Razorpay retrying. Anything else may be temporary: ask for a retry.
    if (message.includes("Amount mismatch")) {
      console.error("[Payments] webhook amount mismatch for order", entity.order_id);
      return { status: 200, body: "Amount mismatch" };
    }
    throw cause;
  }
}