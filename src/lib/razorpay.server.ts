// Server-only Razorpay helpers. No framework imports, so they can be tested on their own.
// Never import this file from browser code: it works with the secret key.

export type FetchLike = typeof fetch;

const API = "https://api.razorpay.com/v1";
const encoder = new TextEncoder();

/** Whole rupees to paise (Razorpay's unit). Rejects anything that is not a positive whole number. */
export function toPaise(rupees: number): number {
  if (!Number.isInteger(rupees) || rupees <= 0) throw new Error("Invalid payment amount");
  return rupees * 100;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
}

/** Compares two strings without stopping at the first difference. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}

/** Checks the signature Razorpay Checkout returns in the browser after a payment. */
export async function verifyCheckoutSignature(input: { orderId: string; paymentId: string; signature: string; secret: string }): Promise<boolean> {
  if (!input.orderId || !input.paymentId || !input.signature || !input.secret) return false;
  const expected = await hmacSha256Hex(input.secret, `${input.orderId}|${input.paymentId}`);
  return safeEqual(expected, input.signature.toLowerCase());
}

/** Checks the X-Razorpay-Signature header on a webhook against the raw request body. */
export async function verifyWebhookSignature(input: { rawBody: string; signature: string; secret: string }): Promise<boolean> {
  if (!input.rawBody || !input.signature || !input.secret) return false;
  const expected = await hmacSha256Hex(input.secret, input.rawBody);
  return safeEqual(expected, input.signature.toLowerCase());
}

type Credentials = { keyId: string; keySecret: string; fetchImpl?: FetchLike };

/** Anything Razorpay sends back is logged only after the keys are hidden, so logs never hold a secret. */
const redact = (text: string | undefined, { keyId, keySecret }: Credentials) =>
  [keySecret, keyId].reduce((out, secret) => (secret ? out.split(secret).join("[hidden]") : out), text ?? "");

const authorization = ({ keyId, keySecret }: Credentials) => `Basic ${btoa(`${keyId}:${keySecret}`)}`;

export type RazorpayPayment = { id: string; order_id: string; status: string; amount: number; currency: string };

export async function createRazorpayOrder(input: Credentials & { amountPaise: number; receipt: string; requestId: string }) {
  const response = await (input.fetchImpl ?? fetch)(`${API}/orders`, {
    method: "POST",
    headers: { Authorization: authorization(input), "Content-Type": "application/json" },
    body: JSON.stringify({ amount: input.amountPaise, currency: "INR", receipt: input.receipt, notes: { request_id: input.requestId } }),
  });
  const json = (await response.json().catch(() => null)) as { id?: string; amount?: number; currency?: string; error?: { description?: string } } | null;
  if (!response.ok || !json?.id) {
    console.error("[Razorpay] could not create order", response.status, redact(json?.error?.description, input));
    throw new Error("Could not start the payment. Please try again.");
  }
  if (json.amount !== input.amountPaise || json.currency !== "INR") throw new Error("The payment order did not match the amount.");
  return { id: json.id, amount: json.amount, currency: json.currency };
}

export async function fetchRazorpayPayment(input: Credentials & { paymentId: string }): Promise<RazorpayPayment> {
  const response = await (input.fetchImpl ?? fetch)(`${API}/payments/${encodeURIComponent(input.paymentId)}`, {
    headers: { Authorization: authorization(input) },
  });
  const json = (await response.json().catch(() => null)) as (Partial<RazorpayPayment> & { error?: { description?: string } }) | null;
  if (!response.ok || !json?.id || !json.order_id || typeof json.amount !== "number" || !json.status || !json.currency) {
    console.error("[Razorpay] could not read payment", response.status, redact(json?.error?.description, input));
    throw new Error("Could not confirm the payment with the payment provider.");
  }
  return { id: json.id, order_id: json.order_id, status: json.status, amount: json.amount, currency: json.currency };
}

/** Only needed when the Razorpay account is set to manual capture; a payment then stays "authorized" until captured. */
export async function captureRazorpayPayment(input: Credentials & { paymentId: string; amountPaise: number }): Promise<RazorpayPayment> {
  const response = await (input.fetchImpl ?? fetch)(`${API}/payments/${encodeURIComponent(input.paymentId)}/capture`, {
    method: "POST",
    headers: { Authorization: authorization(input), "Content-Type": "application/json" },
    body: JSON.stringify({ amount: input.amountPaise, currency: "INR" }),
  });
  const json = (await response.json().catch(() => null)) as (Partial<RazorpayPayment> & { error?: { description?: string } }) | null;
  if (!response.ok || !json?.id || !json.order_id || typeof json.amount !== "number" || !json.status || !json.currency) {
    console.error("[Razorpay] could not capture payment", response.status, redact(json?.error?.description, input));
    throw new Error("Could not complete the payment with the payment provider.");
  }
  return { id: json.id, order_id: json.order_id, status: json.status, amount: json.amount, currency: json.currency };
}