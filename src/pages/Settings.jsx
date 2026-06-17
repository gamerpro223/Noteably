import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CreditCard, LogOut } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { loadSubscriptionStatus } from "@/lib/subscription";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelMsg, setCancelMsg] = useState("");
  const [goalMinutes, setGoalMinutes] = useState(10);
  const [savingGoal, setSavingGoal] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const subscriptionStatus = await loadSubscriptionStatus();
        if (!subscriptionStatus.isAuthenticated) { setLoading(false); return; }
        setUser(subscriptionStatus.user);
        setSubscription(subscriptionStatus.subscription);

        const progRecords = await base44.entities.UserProgress.list();
        if (progRecords.length > 0) {
          setGoalMinutes(progRecords[0].daily_goal_minutes || 10);
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  async function handleCancelSubscription() {
    if (!subscription?.subscription_id) {
      setCancelMsg("No active subscription found to cancel.");
      return;
    }
    setCancelLoading(true);
    setCancelMsg("");
    try {
      const response = await base44.functions.invoke("cancel-subscription", {
        subscriptionId: subscription.subscription_id,
      });
      if (response.data?.success) {
        setCancelMsg("Your subscription has been canceled. You'll retain access until the end of your billing cycle.");
      } else {
        setCancelMsg("Could not cancel subscription. Please contact support.");
      }
    } catch {
      setCancelMsg("Something went wrong. Please try again.");
    } finally {
      setCancelLoading(false);
    }
  }

  async function saveGoal() {
    setSavingGoal(true);
    try {
      const records = await base44.entities.UserProgress.list();
      if (records.length > 0) {
        await base44.entities.UserProgress.update(records[0].id, { daily_goal_minutes: goalMinutes });
      } else {
        await base44.entities.UserProgress.create({ daily_goal_minutes: goalMinutes, current_level: 1, total_xp: 0, current_streak: 0, longest_streak: 0, total_puzzles_completed: 0 });
      }
    } catch {}
    setSavingGoal(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/40 px-6 py-4 flex items-center gap-3">
        <Link to="/dashboard" className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <span className="font-heading text-lg">Settings</span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Account */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-heading text-base mb-4">Account</h2>
          {user ? (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Name</span>
                <span>{user.full_name || "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Email</span>
                <span>{user.email}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Not signed in. <Link to="/login" className="text-primary hover:underline">Sign in</Link></p>
          )}
        </div>

        {/* Daily goal */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-heading text-base mb-4">Daily Practice Goal</h2>
          <div className="flex items-center gap-3">
            {[5, 10, 15, 20].map(m => (
              <button
                key={m}
                onClick={() => setGoalMinutes(m)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${goalMinutes === m ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
              >
                {m} min
              </button>
            ))}
          </div>
          <button
            onClick={saveGoal}
            disabled={savingGoal}
            className="mt-4 w-full bg-secondary text-foreground text-sm font-medium py-2.5 rounded-xl hover:bg-secondary/80 transition-all"
          >
            {savingGoal ? "Saved!" : "Save Goal"}
          </button>
        </div>

        {/* Subscription */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-primary" />
            <h2 className="font-heading text-base">Subscription</h2>
          </div>
          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-sm font-medium text-primary">Active — $5/month</span>
              </div>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelLoading}
                className="w-full py-2.5 rounded-xl border border-destructive/40 text-destructive text-sm font-medium hover:bg-destructive/5 transition-all"
              >
                {cancelLoading ? "Canceling…" : "Cancel Subscription"}
              </button>
              {cancelMsg && <p className="text-xs text-muted-foreground">{cancelMsg}</p>}
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground mb-4">No active subscription.</p>
              <Link to="/" className="block w-full bg-primary text-primary-foreground text-sm font-semibold py-2.5 rounded-xl text-center hover:bg-primary/90 transition-all">
                Subscribe — $5/month
              </Link>
            </div>
          )}
        </div>

        {/* Sign out */}
        {user && (
          <button
            onClick={() => base44.auth.logout("/")}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-muted-foreground text-sm hover:border-primary/40 hover:text-foreground transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        )}
      </div>
    </div>
  );
}
