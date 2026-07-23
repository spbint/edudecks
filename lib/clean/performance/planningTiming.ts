export type CleanPlanningTimingCriticality =
  | "bootstrap-critical"
  | "page-primary"
  | "section-secondary"
  | "interaction-on-demand"
  | "background-prefetch";

export type CleanPlanningTimingOutcome = "success" | "error" | "cancelled";

export type CleanPlanningTimingEvent = {
  operation: string;
  criticality: CleanPlanningTimingCriticality;
  gatesPage: boolean;
  outcome: CleanPlanningTimingOutcome;
  durationMs: number;
  requestNumber: number;
  duplicateNumber: number;
};

const timingEvents: CleanPlanningTimingEvent[] = [];
const requestCounts = new Map<string, number>();
const activeRequests = new Map<string, number>();

function timingEnabled() {
  return process.env.NODE_ENV !== "production";
}

export function clearCleanPlanningTiming() {
  timingEvents.length = 0;
  requestCounts.clear();
  activeRequests.clear();
}

export function getCleanPlanningTimingEvents() {
  return [...timingEvents];
}

export function beginCleanPlanningTiming(input: {
  operation: string;
  criticality: CleanPlanningTimingCriticality;
  gatesPage: boolean;
  requestKey?: string;
}) {
  if (!timingEnabled()) return () => undefined;

  const requestKey = input.requestKey || input.operation;
  const requestNumber = (requestCounts.get(requestKey) ?? 0) + 1;
  requestCounts.set(requestKey, requestNumber);
  const duplicateNumber = activeRequests.get(requestKey) ?? 0;
  activeRequests.set(requestKey, duplicateNumber + 1);
  const performanceApi = typeof performance !== "undefined" ? performance : null;
  const markName = `mylearna:${input.operation}:${requestNumber}`;
  if (performanceApi) {
    performanceApi.mark(`${markName}:start`);
  }
  const startedAt = performanceApi ? performanceApi.now() : Date.now();
  let finished = false;

  return (outcome: CleanPlanningTimingOutcome = "success") => {
    if (finished) return;
    finished = true;
    const finishedAt = performanceApi ? performanceApi.now() : Date.now();
    if (performanceApi) {
      performanceApi.mark(`${markName}:finish`);
      performanceApi.measure(markName, `${markName}:start`, `${markName}:finish`);
      performanceApi.clearMarks(`${markName}:start`);
      performanceApi.clearMarks(`${markName}:finish`);
      performanceApi.clearMeasures(markName);
    }
    const activeCount = activeRequests.get(requestKey) ?? 1;
    if (activeCount <= 1) activeRequests.delete(requestKey);
    else activeRequests.set(requestKey, activeCount - 1);

    timingEvents.push({
      operation: input.operation,
      criticality: input.criticality,
      gatesPage: input.gatesPage,
      outcome,
      durationMs: Math.max(0, finishedAt - startedAt),
      requestNumber,
      duplicateNumber,
    });
  };
}

export function recordCleanPlanningMilestone(input: {
  operation: string;
  criticality: CleanPlanningTimingCriticality;
  gatesPage: boolean;
}) {
  const finish = beginCleanPlanningTiming(input);
  finish("success");
}
