import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const WIX_API_KEY = Deno.env.get("WIX_PAYMENTS_API_KEY");
    const WIX_SITE_ID = Deno.env.get("WIX_PAYMENTS_SITE_ID");

    const base44 = createClientFromRequest(req);
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { subscriptionId } = await req.json();
    if (!subscriptionId) return Response.json({ error: "Missing subscriptionId" }, { status: 400 });

    const response = await fetch(
      `https://www.wixapis.com/payments/base44/v1/subscriptions/${subscriptionId}/cancel`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": WIX_API_KEY,
          "wix-site-id": WIX_SITE_ID,
        },
        body: JSON.stringify({ subscription_id: subscriptionId, immediate: false }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      console.error("Cancel subscription error:", JSON.stringify(data));
      // Try immediate cancel if soft cancel fails
      const retry = await fetch(
        `https://www.wixapis.com/payments/base44/v1/subscriptions/${subscriptionId}/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": WIX_API_KEY,
            "wix-site-id": WIX_SITE_ID,
          },
          body: JSON.stringify({ subscription_id: subscriptionId, immediate: true }),
        }
      );
      if (!retry.ok) {
        return Response.json({ error: "Failed to cancel subscription" }, { status: 502 });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("cancel-subscription error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});