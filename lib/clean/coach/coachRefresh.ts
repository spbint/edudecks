export const COACH_REFRESH_EVENT = "mylearna:coach-state-refresh";

export type CoachRefreshSource =
  | "profile-saved"
  | "learner-created"
  | "learner-updated"
  | "learner-deleted"
  | "settings-saved"
  | "learning-year-created"
  | "learning-year-updated"
  | "learning-year-deleted"
  | "learning-period-created"
  | "learning-period-updated"
  | "learning-period-deleted"
  | "weekly-block-created"
  | "weekly-block-updated"
  | "weekly-block-deleted"
  | "pathway-updated"
  | "evidence-created"
  | "evidence-updated"
  | "evidence-deleted"
  | "portfolio-updated"
  | "report-created"
  | "report-updated"
  | "report-deleted"
  | "route-revalidation";

export type CoachRefreshDetail = {
  source: CoachRefreshSource;
  refreshAlreadyApplied?: boolean;
};

export function requestCoachStateRefresh(
  source: CoachRefreshSource,
  options: { refreshAlreadyApplied?: boolean } = {},
) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<CoachRefreshDetail>(COACH_REFRESH_EVENT, {
      detail: { source, refreshAlreadyApplied: options.refreshAlreadyApplied === true },
    }),
  );
}

export function subscribeToCoachStateRefresh(
  listener: (detail: CoachRefreshDetail) => void,
) {
  if (typeof window === "undefined") return () => undefined;
  const handle = (event: Event) => {
    const detail = (event as CustomEvent<CoachRefreshDetail>).detail;
    if (!detail || typeof detail.source !== "string") return;
    listener(detail);
  };
  window.addEventListener(COACH_REFRESH_EVENT, handle);
  return () => window.removeEventListener(COACH_REFRESH_EVENT, handle);
}
