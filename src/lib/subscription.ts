import { User } from "firebase/auth";

const FREE_POST_LIMIT = 5;

export interface SubscriptionStatus {
  isSubscribed: boolean;
  postsRemaining: number;
  hasExceededLimit: boolean;
}

export function checkSubscriptionStatus(user: User | null, postCount: number): SubscriptionStatus {
  if (!user) {
    return {
      isSubscribed: false,
      postsRemaining: 0,
      hasExceededLimit: true,
    };
  }

  // In a real app, you would check the user's subscription status from your backend
  // For now, we'll just check if they've exceeded the free post limit
  const postsRemaining = Math.max(0, FREE_POST_LIMIT - postCount);
  const hasExceededLimit = postCount >= FREE_POST_LIMIT;

  return {
    isSubscribed: false, // This would be true if they have an active subscription
    postsRemaining,
    hasExceededLimit,
  };
}

export function getSubscriptionErrorMessage(status: SubscriptionStatus): string {
  if (status.hasExceededLimit) {
    return "You've reached your free post limit. Please upgrade to continue posting.";
  }
  return "";
} 