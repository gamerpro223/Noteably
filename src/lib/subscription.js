import { base44 } from "@/api/base44Client";

export const ACTIVE_SUBSCRIPTION_STATUS = "active";

export function isActiveSubscription(subscription) {
  return subscription?.status === ACTIVE_SUBSCRIPTION_STATUS;
}

export async function loadSubscriptionStatus() {
  const isAuthenticated = await base44.auth.isAuthenticated();
  if (!isAuthenticated) {
    return {
      isAuthenticated: false,
      isSubscribed: false,
      subscription: null,
      subscriptions: [],
      user: null,
    };
  }

  const user = await base44.auth.me();
  if (!user?.email) {
    return {
      isAuthenticated: true,
      isSubscribed: false,
      subscription: null,
      subscriptions: [],
      user,
    };
  }

  const subscriptions = await base44.entities.Subscription.filter({ user_email: user.email });
  const subscription = subscriptions.find(isActiveSubscription) || null;

  return {
    isAuthenticated: true,
    isSubscribed: Boolean(subscription),
    subscription,
    subscriptions,
    user,
  };
}
