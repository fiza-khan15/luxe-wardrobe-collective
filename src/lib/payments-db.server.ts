// Server-only: connects the payment logic to the database.
// `userClient` is the signed-in renter's own session (rules apply to it). The admin client bypasses rules,
// so it is used only for the few steps that must not be callable from the browser.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { PaymentDb } from "./payments-core.server";

export function makePaymentDb(userClient?: SupabaseClient<Database>): PaymentDb {
  return {
    async prepareAsRenter(requestId) {
      if (!userClient) throw new Error("Sign in required");
      const { data, error } = await userClient.rpc("prepare_payment", { _request: requestId });
      if (error) throw new Error(error.message);
      return data as number;
    },
    async insertPayment(row) {
      const { error } = await supabaseAdmin.from("payments").insert({ ...row, status: "created" });
      if (error) throw new Error(error.message);
    },
    async findPayment(orderId) {
      const { data, error } = await supabaseAdmin.from("payments").select("request_id,amount").eq("razorpay_order_id", orderId).maybeSingle();
      if (error) throw new Error(error.message);
      return data ?? null;
    },
    async renterOf(requestId) {
      const { data, error } = await supabaseAdmin.from("rental_requests").select("renter_id").eq("id", requestId).maybeSingle();
      if (error) throw new Error(error.message);
      return data?.renter_id ?? null;
    },
    async confirm(orderId, paymentId, amountPaise) {
      const { data, error } = await supabaseAdmin.rpc("confirm_payment", { _order_id: orderId, _payment_id: paymentId, _amount_paise: amountPaise });
      if (error) throw new Error(error.message);
      return data as string;
    },
    async fail(orderId) {
      const { error } = await supabaseAdmin.rpc("fail_payment", { _order_id: orderId });
      if (error) throw new Error(error.message);
    },
  };
}

export function readPaymentEnv() {
  const keyId = process.env["RAZORPAY_KEY_ID"];
  const keySecret = process.env["RAZORPAY_KEY_SECRET"];
  if (!keyId || !keySecret) throw new Error("Payments are not set up yet.");
  return { keyId, keySecret, webhookSecret: process.env["RAZORPAY_WEBHOOK_SECRET"] };
}