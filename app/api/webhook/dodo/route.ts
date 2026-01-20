export const runtime = "nodejs";
export const dynamic = "force-dynamic";


import { NextResponse } from "next/server";
import DodoPayments from "dodopayments";

const client = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY_LIVE!,
  environment: "live_mode",
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY_LIVE!,
});

export async function POST(req: Request) {
  try {
      const { adminDb } = await import("@/lib/firebase-admin");

    // 1️⃣ Raw body exactly as received for signature verification
    const rawBody = await req.text();

    // 2️⃣ Extract required webhook headers
    const headers = {
      "webhook-id": req.headers.get("webhook-id") || "",
      "webhook-signature": req.headers.get("webhook-signature") || "",
      "webhook-timestamp": req.headers.get("webhook-timestamp") || "",
    };

    // 3️⃣ Verify the signature and parse the event
    const event = client.webhooks.unwrap(rawBody, { headers });
    const data = event.data as any;

    const customerEmail = data.customer?.email?.toLowerCase();

    if (!customerEmail) {
      console.error("❌ No customer email found in payload");
      return NextResponse.json({ received: true }); 
    }

    // Search for your existing user document by email
    const userQuery = await adminDb
      .collection("users")
      .where("email", "==", customerEmail)
      .limit(1)
      .get();

    if (userQuery.empty) {
      console.error(`❌ No user found in Firebase with email: ${customerEmail}`);
      return NextResponse.json({ received: true }); // Return 200 so Dodo stops retrying
    }

    // This is your actual Firebase UID (e.g., aT4GXZ...)
    const userId = userQuery.docs[0].id; 

    console.log(`✅ Found User: ${userId} for Email: ${customerEmail}`);
    console.log(data)
    console.log(event.type)
    

    // 5️⃣ Handle the lifecycle events
    switch (event.type) {
        case "payment.succeeded":
     case "subscription.active":
case "subscription.renewed":
case "subscription.plan_changed":
case "subscription.updated": {


  const allowedStatuses = ["active", "cancelled"];
        const shouldBePro = allowedStatuses.includes(data.status);

const isCancelIntent = 
  data.cancel_at_next_billing_date === true || 
  data.cancelled_at != null || 
  data.status === "cancelled"; 

  const PLAN_MAP: Record<string, string> = {
    "pdt_0NVTHGayLXd7ghjE3rTXA": "pro_monthly",
    "pdt_0NVTHUn903k4Yb0fJk0Gf": "pro_yearly",
  };

  const planName = PLAN_MAP[data.product_id] || "unknown_plan";

  await adminDb.collection("users").doc(userId).set(
    {
      email: data.customer?.email,
      name: data.customer?.name,
      dodoCustomerId: data.customer?.customer_id,
      subscriptionId: data.subscription_id,
      plan: planName,

      subscriptionStatus: data.status,
      isPro: shouldBePro,


      address: {
        street: data.billing?.street || null,
        city: data.billing?.city || null,
        state: data.billing?.state || null,
        zip: data.billing?.zipcode || null,
        country: data.billing?.country || null,
      },

      planInterval: data.payment_frequency_interval,
      currency: data.currency,

      // 🧠 Store cancel info, but DO NOT act on it
      cancel_at_next_billing_date: isCancelIntent
        ? data.cancel_at_next_billing_date
        : false,

      cancelled_at: isCancelIntent
        ? data.cancelled_at
          ? new Date(data.cancelled_at)
          : null
        : null,

      next_billing_date: data.next_billing_date
        ? new Date(data.next_billing_date)
        : null,

      expire: data.expires_at
        ? new Date(data.expires_at)
        : null,

      lastUpdated: new Date(),
      provider: "dodo",
    },
    { merge: true }
  );

  break;
}


      case "subscription.cancelled":
        // User clicked cancel. They keep access until nextBillingDate.
        await adminDb.collection("users").doc(userId).update({
           cancel_at_next_billing_date:true,
          cancelled_at: data.cancelled_at ? new Date(data.cancelled_at) : new Date(),
          lastUpdated: new Date(),
        });
        break;

case "payment.failed":
      case "subscription.on_hold":
      case "subscription.expired":      
        await adminDb.collection("users").doc(userId).update({
          subscriptionStatus: data.status,
          lastUpdated: new Date(),
          isPro: false,
        });
        break;

      default:
        console.log("ℹ️ Event type not explicitly handled:", event.type);
    }

    // 6️⃣ Always return 2xx to acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (err: any) {
    console.error("❌ Dodo webhook verification failed:", err.message);
    // Return 401 for signature failures so Dodo knows to retry (if applicable)
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
}