export const GUIDED_START_FAMILY_SETUP_ID = "guided-start-family-setup" as const;

export type GuidedMissionStatus = "not_started" | "active" | "paused" | "completed";

export type GuidedStartStep =
  | "welcome"
  | "family-details"
  | "first-learner"
  | "continue-settings"
  | "complete";

export type GuidedStartPresentation = "mobile" | "desktop";

export type GuidedStartPersistedState = {
  status: GuidedMissionStatus;
  step: GuidedStartStep;
  welcomeDismissed: boolean;
};

export const GUIDED_START_STEP_COUNT = 4;

export const GUIDED_START_TARGETS: Record<Exclude<GuidedStartStep, "welcome" | "complete">, string> = {
  "family-details": "profile-family-details",
  "first-learner": "profile-add-learner",
  "continue-settings": "profile-next-settings",
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
  return "continue-settings";
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
      parsed.step === "continue-settings" ||
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
