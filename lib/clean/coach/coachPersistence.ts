export type CoachPersistenceState = {
  snoozedRecommendationId?: string;
  snoozedUntil?: number;
  pausedMission?: boolean;
  panelOpen?: boolean;
};

function hashScope(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function getCoachStorageKey(userId: string | null | undefined) {
  return userId ? `mylearna.coach.v1.${hashScope(userId)}` : null;
}

export function readCoachPersistence(storage: Storage | null, key: string | null) {
  if (!storage || !key) return {} as CoachPersistenceState;
  try {
    const parsed = JSON.parse(storage.getItem(key) || "{}");
    return parsed && typeof parsed === "object" ? (parsed as CoachPersistenceState) : {};
  } catch {
    return {} as CoachPersistenceState;
  }
}

export function writeCoachPersistence(
  storage: Storage | null,
  key: string | null,
  state: CoachPersistenceState,
) {
  if (!storage || !key) return;
  try {
    storage.setItem(key, JSON.stringify(state));
  } catch {
    // Coach preferences are optional and must never block product use.
  }
}

export function isCoachRecommendationSnoozed(
  state: CoachPersistenceState,
  recommendationId: string,
  now = Date.now(),
) {
  return state.snoozedRecommendationId === recommendationId && (state.snoozedUntil ?? 0) > now;
}
