import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const WIX_API_KEY = Deno.env.get("WIX_PAYMENTS_API_KEY");
    const WIX_SITE_ID = Deno.env.get("WIX_PAYMENTS_SITE_ID");

    if (!WIX_API_KEY || !WIX_SITE_ID) {
      console.error("Missing WIX_PAYMENTS_API_KEY or WIX_PAYMENTS_SITE_ID");
      return Response.json({ error: "Payment configuration missing" }, { status: 500 });
    }

    const base44 = createClientFromRequest(req);
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      return Response.json({ error: "Sign in before starting checkout" }, { status: 401 });
    }

    const origin = req.headers.get("Origin") || "https://app.base44.com";
    const user = await base44.auth.me();
    const userEmail = user?.email || null;

    if (!userEmail) {
      return Response.json({ error: "User email missing" }, { status: 400 });
    }

    // Create the checkout session
    const wixResponse = await fetch(
      "https://www.wixapis.com/payments/platform/v1/checkout-sessions/construct",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": WIX_API_KEY,
          "wix-site-id": WIX_SITE_ID,
        },
        body: JSON.stringify({
          cart: {
            items: [
              {
                name: "Noteably Premium — Monthly",
                quantity: 1,
                price: "5.00",
                subscriptionInfo: {
                  subscriptionSettings: {
                    frequency: "MONTH",
                  },
                  title: "Noteably Premium",
                  description: "Unlimited daily piano puzzles, streak tracking, and progress analytics.",
                },
              },
            ],
            customerInfo: { email: userEmail },
          },
          callbackUrls: {
            postFlowUrl: `${origin}/`,
            thankYouPageUrl: `${origin}/thank-you`,
          },
        }),
      }
    );

    const wixData = await wixResponse.json();

    if (!wixResponse.ok) {
      console.error("Wix checkout error:", JSON.stringify(wixData));
      return Response.json({ error: "Failed to create checkout session", details: wixData }, { status: 502 });
    }

    const checkoutSession = wixData.checkoutSession;

    // Persist a pending subscription record linked to the user
    await base44.asServiceRole.entities.Subscription.create({
      checkout_id: checkoutSession.id,
      user_email: userEmail,
      status: "pending",
    });

    return Response.json({ redirectUrl: checkoutSession.redirectUrl, checkoutId: checkoutSession.id });
  } catch (error) {
    console.error("create-checkout error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
