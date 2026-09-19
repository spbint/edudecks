import {
  getAllPathwaySteps,
  normalizePathwayStepId,
  type PathwayStepRegistryItem,
} from "@/lib/clean/pathways/pathwayStepRegistry";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export function isSafeInternalPathwayReturnTo(value: string | null | undefined) {
  const path = safe(value);
  return /^\/(?:my-pathways|clean-my-pathways)(?:[/?#]|$)/.test(path);
}

export function resolvePathwayCalendarHandoff(input: {
  pathwayStepId: string | null | undefined;
  learnerId: string | null | undefined;
  learnerIds: readonly string[];
  returnTo: string | null | undefined;
}) {
  const learnerId = safe(input.learnerId);
  const pathwayStepId = normalizePathwayStepId(input.pathwayStepId);
  const registryItem = getAllPathwaySteps().find((item) => item.id === pathwayStepId) || null;

  if (!learnerId || !input.learnerIds.includes(learnerId) || !registryItem) {
    return null;
  }

  return {
    learnerId,
    registryItem,
    returnTo: isSafeInternalPathwayReturnTo(input.returnTo)
      ? safe(input.returnTo)
      : "/my-pathways",
  };
}

export function buildPathwayCalendarHandoffHref(input: {
  calendarPathname: "/my-calendar" | "/clean-my-calendar";
  learnerId: string | null | undefined;
  registryItem: PathwayStepRegistryItem | null | undefined;
  returnTo: string | null | undefined;
}) {
  const canonicalStep = input.registryItem
    ? getAllPathwaySteps().find(
        (item) => item.id === normalizePathwayStepId(input.registryItem?.id),
      ) || null
    : null;
  const learnerId = safe(input.learnerId);

  if (!canonicalStep || !learnerId || !isSafeInternalPathwayReturnTo(input.returnTo)) {
    return "";
  }

  const params = new URLSearchParams({
    learner_id: learnerId,
    pathwayStepId: canonicalStep.id,
    returnTo: safe(input.returnTo),
    pathwayPlan: "1",
  });
  return `${input.calendarPathname}?${params.toString()}`;
}
