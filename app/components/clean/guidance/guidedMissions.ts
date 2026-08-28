export const GUIDED_START_FAMILY_SETUP_ID = "guided-start-family-setup" as const;

export type GuidedMissionStatus = "not_started" | "active" | "paused" | "completed";

export type GuidedStartStep =
  | "welcome"
  | "family-details"
  | "first-learner"
  | "activation-choice"
  | "complete";

export type GuidedStartPresentation = "mobile" | "desktop";

export type GuidedStartPersistedState = {
  status: GuidedMissionStatus;
  step: GuidedStartStep;
  welcomeDismissed: boolean;
};

export function shouldAutoOfferGuidedStart({
  guidanceEnabled,
  guidanceHydrated,
  workspaceLoading,
  setupLoading,
  schemaMissing,
  error,
  hasProfile,
  learnerCount,
  persistedState,
}: {
  guidanceEnabled: boolean;
  guidanceHydrated: boolean;
  workspaceLoading: boolean;
  setupLoading: boolean;
  schemaMissing: boolean;
  error: string | null;
  hasProfile: boolean;
  learnerCount: number;
  persistedState: GuidedStartPersistedState | null;
}) {
  if (
    !guidanceEnabled ||
    !guidanceHydrated ||
    workspaceLoading ||
    setupLoading ||
    schemaMissing ||
    error
  ) {
    return false;
  }

  if (hasProfile && learnerCount > 0 && persistedState?.status === "completed") return false;
  return persistedState === null || persistedState.status === "not_started";
}

export const GUIDED_START_STEP_COUNT = 4;

export const GUIDED_START_TARGETS: Record<Exclude<GuidedStartStep, "welcome" | "complete">, string> = {
  "family-details": "profile-family-details",
  "first-learner": "profile-add-learner",
  "activation-choice": "profile-activation-fork",
};

function hashScope(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

export function getGuidedStartStorageKey(userId: string) {
  return `mylearna.guidedMission.${hashScope(userId)}.${GUIDED_START_FAMILY_SETUP_ID}`;
}

export function isGuidedStartSettingsRoute(pathname: string) {
  return pathname === "/my-settings" || pathname === "/clean-my-settings";
}

export function isGuidedStartProfileRoute(pathname: string) {
  return pathname === "/my-profile" || pathname === "/clean-my-profile";
}

export function deriveGuidedStartStep({
  hasProfile,
  learnerCount,
  pathname,
}: {
  hasProfile: boolean;
  learnerCount: number;
  pathname: string;
}): Exclude<GuidedStartStep, "welcome"> {
  if (!hasProfile) return "family-details";
  if (learnerCount < 1) return "first-learner";
  if (isGuidedStartSettingsRoute(pathname)) return "complete";
  return "activation-choice";
}

export function reconcileGuidedStartState({
  persistedState,
  hasProfile,
  learnerCount,
  pathname,
}: {
  persistedState: GuidedStartPersistedState | null;
  hasProfile: boolean;
  learnerCount: number;
  pathname: string;
}): GuidedStartPersistedState {
  const realStep = deriveGuidedStartStep({ hasProfile, learnerCount, pathname });
  const realSetupComplete = isGuidedStartComplete({ hasProfile, learnerCount, pathname });

  if (realSetupComplete) {
    return {
      status: "completed",
      step: "complete",
      welcomeDismissed: true,
    };
  }

  if (!persistedState) {
    return {
      status: "not_started",
      step: realStep,
      welcomeDismissed: false,
    };
  }

  if (persistedState.status === "paused") {
    return { ...persistedState, step: realStep };
  }

  if (persistedState.status === "completed" && hasProfile && learnerCount > 0) {
    return { ...persistedState, step: "complete", welcomeDismissed: true };
  }
  if (persistedState.status === "completed") {
    return {
      status: "not_started",
      step: realStep,
      welcomeDismissed: false,
    };
  }

  return {
    ...persistedState,
    step: realStep,
  };
}

export function getGuidedStartStepNumber(step: GuidedStartStep) {
  if (step === "welcome") return 1;
  if (step === "family-details") return 2;
  if (step === "first-learner") return 3;
  return 4;
}

export function isGuidedStartComplete({
  hasProfile,
  learnerCount,
  pathname,
}: {
  hasProfile: boolean;
  learnerCount: number;
  pathname: string;
}) {
  return hasProfile && learnerCount > 0 && isGuidedStartSettingsRoute(pathname);
}

export function readGuidedStartState(
  storage: Storage,
  key: string,
): GuidedStartPersistedState | null {
  const raw = storage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<GuidedStartPersistedState>;
    if (
      parsed.status !== "not_started" &&
      parsed.status !== "active" &&
      parsed.status !== "paused" &&
      parsed.status !== "completed"
    ) {
      return null;
    }
    const step =
      parsed.step === "welcome" ||
      parsed.step === "family-details" ||
      parsed.step === "first-learner" ||
      parsed.step === "activation-choice" ||
      parsed.step === "complete"
        ? parsed.step
        : "welcome";
    return {
      status: parsed.status,
      step,
      welcomeDismissed: parsed.welcomeDismissed === true,
    };
  } catch {
    return null;
  }
}

export function writeGuidedStartState(
  storage: Storage,
  key: string,
  state: GuidedStartPersistedState,
) {
  storage.setItem(key, JSON.stringify(state));
}
