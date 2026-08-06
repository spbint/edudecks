import type { CoachRecommendation } from "./types";

export function shouldShowAutomaticCoachCard({
  recommendation,
  guidanceEnabled,
  guidedStartVisible,
  guidanceSetupStatus,
  route,
  focusedRoute,
  stateRefreshing = false,
}: {
  recommendation: CoachRecommendation | null;
  guidanceEnabled: boolean;
  guidedStartVisible: boolean;
  guidanceSetupStatus: "not_started" | "active" | "skipped" | "completed";
  route: string;
  focusedRoute: boolean;
  stateRefreshing?: boolean;
}) {
  if (!recommendation || !guidanceEnabled || focusedRoute || stateRefreshing) return false;
  if (!recommendation.mandatorySetup) return true;
  if (guidedStartVisible) return false;

  const guidedStartRoute = route === "/my-profile" || route === "/clean-my-profile" ||
    route === "/my-settings" || route === "/clean-my-settings";
  return !guidedStartRoute || guidanceSetupStatus === "skipped";
}
