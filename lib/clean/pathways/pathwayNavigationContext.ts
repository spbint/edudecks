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
