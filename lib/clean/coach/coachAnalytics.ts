import { trackProductEvent } from "@/lib/clean/analytics/productAnalytics";

export function trackCoachEvent(
  eventName:
    | "coach_recommendation_shown"
    | "coach_opened"
    | "coach_primary_action_selected"
    | "coach_snoozed"
    | "coach_dismissed"
    | "coach_resumed"
    | "coach_recommendation_completed"
    | "coach_no_recommendation",
  properties: {
    recommendationId?: string;
    recommendationCategory?: string;
    route?: string;
    supportMode?: "automatic" | "help";
    hasMultipleLearners?: boolean;
    completionSource?: string;
  } = {},
) {
  trackProductEvent(eventName, properties);
}
