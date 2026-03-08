import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-hotmart-hottok",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify Hotmart token
    const hottok = req.headers.get("x-hotmart-hottok");
    const expectedToken = Deno.env.get("HOTMART_HOTTOK");
    if (expectedToken && hottok !== expectedToken) {
      console.error("Invalid hottok token");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    console.log("Hotmart webhook received:", JSON.stringify(body));

    const event = body.event;
    const buyerEmail = body.data?.buyer?.email;
    const transactionId = body.data?.purchase?.transaction;
    const subscriptionId =
      body.data?.subscription?.subscriber?.code ||
      body.data?.purchase?.subscription?.subscriber?.code;

    if (!buyerEmail) {
      console.error("No buyer email in webhook payload");
      return new Response(JSON.stringify({ error: "No buyer email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find user by email in profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", buyerEmail)
      .maybeSingle();

    if (!profile) {
      console.error(`No user found for email: ${buyerEmail}`);
      return new Response(
        JSON.stringify({ error: "User not found", email: buyerEmail }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userId = profile.user_id;

    if (
      event === "PURCHASE_APPROVED" ||
      event === "PURCHASE_COMPLETE" ||
      event === "SUBSCRIPTION_REACTIVATION"
    ) {
      // Activate or create subscription
      const { data: existing } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("subscriptions")
          .update({
            status: "active",
            plan: "pro",
            hotmart_transaction_id: transactionId,
            hotmart_subscription_id: subscriptionId,
            started_at: new Date().toISOString(),
            expires_at: null,
          })
          .eq("user_id", userId);
      } else {
        await supabase.from("subscriptions").insert({
          user_id: userId,
          status: "active",
          plan: "pro",
          hotmart_transaction_id: transactionId,
          hotmart_subscription_id: subscriptionId,
          started_at: new Date().toISOString(),
        });
      }

      console.log(`Subscription activated for user ${userId}`);
    } else if (
      event === "PURCHASE_REFUNDED" ||
      event === "PURCHASE_CHARGEBACK" ||
      event === "SUBSCRIPTION_CANCELLATION" ||
      event === "PURCHASE_CANCELED"
    ) {
      await supabase
        .from("subscriptions")
        .update({
          status: event.includes("CANCEL") ? "cancelled" : "inactive",
          plan: "free",
          expires_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      console.log(`Subscription deactivated for user ${userId}`);
    } else if (event === "PURCHASE_DELAYED" || event === "PURCHASE_PROTEST") {
      await supabase
        .from("subscriptions")
        .update({ status: "past_due" })
        .eq("user_id", userId);

      console.log(`Subscription set to past_due for user ${userId}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
