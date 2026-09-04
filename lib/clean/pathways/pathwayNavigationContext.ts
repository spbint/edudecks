export type PathwayNavigationContext = {
  pathname: string;
  subjectKey: string;
  strandKey: string;
  stageKey?: string | null;
  pathwayStepId?: string | null;
  stepKey?: string | null;
  learnerId?: string | null;
  detailPanelId: string;
};

export function buildPathwayStepReturnHref({
  pathname,
  subjectKey,
  strandKey,
  stageKey,
  pathwayStepId,
  stepKey,
  learnerId,
  detailPanelId,
}: PathwayNavigationContext) {
  const params = new URLSearchParams();
  params.set("subjectKey", subjectKey);
  params.set("strandKey", strandKey);
  if (learnerId) params.set("learnerId", learnerId);
  if (stageKey) params.set("stageKey", stageKey);
  if (pathwayStepId) params.set("pathwayStepId", pathwayStepId);
  if (stepKey) params.set("stepKey", stepKey);

  return `${pathname}?${params.toString()}#${detailPanelId}`;
}

/**
 * Adds an already-canonical Pathways return location to a Capture URL.
 *
 * Callers must build `returnTo` with `buildPathwayStepReturnHref` so Capture
 * receives the same learner, pathway identity, and expanded-card hash used by
 * practice and assessment. Capture remains responsible for accepting only
 * safe internal return paths when it consumes this value.
 */
export function appendPathwayCaptureReturnTo(href: string, returnTo: string) {
  const [pathname, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  params.set("returnTo", returnTo);
  return `${pathname}?${params.toString()}`;
}
