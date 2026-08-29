export type FamilySetupRouteState = {
  authenticated: boolean;
  pathname: string;
  loading: boolean;
  setupLoading: boolean;
  error: string | null;
  schemaMissing: boolean;
  hasProfile: boolean;
  learnerCount: number;
};

export function isFamilyProfileRoute(pathname: string) {
  return pathname === "/my-profile" || pathname === "/clean-my-profile";
}

export function shouldHoldForFamilySetup(state: FamilySetupRouteState) {
  return Boolean(
    state.authenticated &&
      !isFamilyProfileRoute(state.pathname) &&
      state.loading,
  );
}

export function getFamilySetupRedirectPath(state: FamilySetupRouteState) {
  if (
    !state.authenticated ||
    isFamilyProfileRoute(state.pathname) ||
    state.loading ||
    state.setupLoading ||
    state.error ||
    state.schemaMissing ||
    (state.hasProfile && state.learnerCount > 0)
  ) {
    return null;
  }

  return state.pathname.startsWith("/clean-") ? "/clean-my-profile" : "/my-profile";
}
