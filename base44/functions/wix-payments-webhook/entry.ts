import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return atob(padded);
}

async function verifyJwt(token, publicKeyPem) {
  const pemHeader = "-----BEGIN PUBLIC KEY-----";
  const pemFooter = "-----END PUBLIC KEY-----";
  const pemContents = publicKeyPem
    .replace(pemHeader, "")
    .replace(pemFooter, "")
    .replace(/\s/g, "");

  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "spki",
    binaryDer.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT format");

  const headerPayload = `${parts[0]}.${parts[1]}`;

  // Decode payload
  const payloadJson = decodeBase64Url(parts[1]);
  const payload = JSON.parse(payloadJson);

  // Verify signature
  const encoder = new TextEncoder();
  const data = encoder.encode(headerPayload);
  const sigBytes = Uint8Array.from(
    decodeBase64Url(parts[2]),
    (c) => c.charCodeAt(0)
  );

  const valid = await crypto.subtle.verify(
    { name: "RSASSA-PKCS1-v1_5" },
    cryptoKey,
    sigBytes,
    data
  );

  if (!valid) throw new Error("JWT signature verification failed");
  return payload;
}

Deno.serve(async (req) => {
  try {
    const WEBHOOK_PUBLIC_KEY = Deno.env.get("WIX_PAYMENTS_WEBHOOK_PUBLIC_KEY");
    if (!WEBHOOK_PUBLIC_KEY) {
      console.error("Missing WIX_PAYMENTS_WEBHOOK_PUBLIC_KEY");
      return new Response("Missing public key", { status: 500 });
    }

    const requestBody = await req.text();

    // Verify JWT
    let rawPayload;
    try {
      rawPayload = await verifyJwt(requestBody, WEBHOOK_PUBLIC_KEY);
    } catch (err) {
      console.error("JWT verification failed:", err.message);
      return new Response("Unauthorized", { status: 401 });
    }

    // Double-parse
    const event = JSON.parse(rawPayload.data);
    const eventData = JSON.parse(event.data);

    const base44 = createClientFromRequest(req);

    if (event.eventType === "wix.ecom.v1.order_approved") {
      const order = eventData.actionEvent.body.order;
      const checkoutId = order.checkoutId;
      console.log("Order approved, checkoutId:", checkoutId);

      // Find subscription ID from line items
      let subscriptionId = null;
      for (const lineItem of order.lineItems || []) {
        if (lineItem.subscriptionInfo?.id) {
          subscriptionId = lineItem.subscriptionInfo.id;
          break;
        }
      }

      // Find pending record by checkoutId and activate it
      const records = await base44.asServiceRole.entities.Subscription.filter({ checkout_id: checkoutId });
      if (records.length > 0) {
        const record = records[0];
        await base44.asServiceRole.entities.Subscription.update(record.id, {
          status: "active",
          ...(subscriptionId ? { subscription_id: subscriptionId } : {}),
        });
        console.log("Activated subscription for checkout:", checkoutId, "sub:", subscriptionId);
      } else {
        // No pending record (user wasn't logged in) — create one from buyer info
        if (subscriptionId) {
          await base44.asServiceRole.entities.Subscription.create({
            checkout_id: checkoutId,
            subscription_id: subscriptionId,
            user_email: order.buyerInfo?.email || "",
            status: "active",
          });
        }
      }

    } else if (
      event.eventType === "wix.ecom.subscription_contracts.v1.subscription_contract_canceled" ||
      event.eventType === "wix.ecom.subscription_contracts.v1.subscription_contract_expired"
    ) {
      const subscriptionContract = eventData.actionEvent.body.subscriptionContract;
      const subscriptionId = subscriptionContract.id;
      const newStatus = event.eventType.includes("canceled") ? "canceled" : "ended";
      console.log(`Subscription ${newStatus}:`, subscriptionId);

      const records = await base44.asServiceRole.entities.Subscription.filter({ subscription_id: subscriptionId });
      for (const record of records) {
        await base44.asServiceRole.entities.Subscription.update(record.id, { status: newStatus });
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook handler error:", error.message);
    return new Response("Internal error", { status: 500 });
  }
});
