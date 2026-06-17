import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, Music, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { loadSubscriptionStatus } from "@/lib/subscription";

export default function ThankYou() {
  const [status, setStatus] = useState("confirming"); // confirming | active | pending
  
  useEffect(() => {
    // Poll for subscription activation (webhook may arrive shortly after redirect)
    let attempts = 0;
    const maxAttempts = 12; // 12 × 3s = 36s max wait

    async function checkStatus() {
      try {
        const subscriptionStatus = await loadSubscriptionStatus();
        if (subscriptionStatus.isSubscribed) {
          setStatus("active");
          return;
        }
      } catch (e) {}

      attempts++;
      if (attempts >= maxAttempts) {
        setStatus("pending");
      } else {
        setTimeout(checkStatus, 3000);
      }
    }

    setTimeout(checkStatus, 2000);
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        {status === "confirming" ? (
          <>
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            <h1 className="font-display text-3xl mb-3">Confirming your payment…</h1>
            <p className="text-muted-foreground">Just a moment while we set up your account.</p>
          </>
        ) : status === "active" ? (
          <>
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            <h1 className="font-display text-4xl mb-3">Welcome to Noteably!</h1>
            <p className="text-muted-foreground mb-8 text-lg">
              Your subscription is active. Time to start your first practice session.
            </p>
            <Link
              to="/practice"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-8 py-4 rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              <Music className="w-5 h-5" />
              Start Practicing
            </Link>
            <div className="mt-6">
              <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                View my dashboard →
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-primary" />
            </div>
            <h1 className="font-display text-3xl mb-3">Payment received</h1>
            <p className="text-muted-foreground mb-8 text-lg">
              Your subscription is still syncing. This usually finishes in a moment.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-8 py-4 rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              <Music className="w-5 h-5" />
              Go to Dashboard
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
}
