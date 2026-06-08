export type CleanSetupStepId =
  | "profile"
  | "settings"
  | "calendar"
  | "day"
  | "pathways"
  | "capture"
  | "portfolio"
  | "reports"
  | "outputs";

export type CleanSetupStep = {
  id: CleanSetupStepId;
  route: string;
  cleanRoute: string;
  label: string;
  requirement: string;
  canSkip: boolean;
};

export const CLEAN_SETUP_STEPS: CleanSetupStep[] = [
  {
    id: "profile",
    route: "/my-profile",
    cleanRoute: "/clean-my-profile",
    label: "Profile",
    requirement: "Create family profile",
    canSkip: false,
  },
  {
    id: "settings",
    route: "/my-settings",
    cleanRoute: "/clean-my-settings",
    label: "Settings",
    requirement: "Save learning settings",
    canSkip: false,
  },
  {
    id: "calendar",
    route: "/my-calendar",
    cleanRoute: "/clean-my-calendar",
    label: "Calendar",
    requirement: "Plan first week",
    canSkip: true,
  },
  {
    id: "day",
    route: "/my-day",
    cleanRoute: "/clean-my-day",
    label: "My Day",
    requirement: "Review today",
    canSkip: false,
  },
  {
    id: "pathways",
    route: "/my-pathways",
    cleanRoute: "/clean-my-pathways",
    label: "Pathways",
    requirement: "Explore learning pathways",
    canSkip: true,
  },
  {
    id: "capture",
    route: "/my-capture",
    cleanRoute: "/clean-my-capture",
    label: "Capture",
    requirement: "Capture first evidence",
    canSkip: true,
  },
  {
    id: "portfolio",
    route: "/my-portfolio",
    cleanRoute: "/clean-my-portfolio",
    label: "Portfolio",
    requirement: "Review portfolio",
    canSkip: false,
  },
  {
    id: "reports",
    route: "/my-reports",
    cleanRoute: "/clean-my-reports",
    label: "Reports",
    requirement: "Preview reports",
    canSkip: true,
  },
  {
    id: "outputs",
    route: "/my-outputs",
    cleanRoute: "/clean-my-outputs",
    label: "Outputs",
    requirement: "Prepare outputs",
    canSkip: false,
  },
];

export const SETUP_STATUS_KEY = "mylearna.guidance.setupStatus";
export const CURRENT_SETUP_STEP_KEY = "mylearna.guidance.currentSetupStep";
export const BLOCKED_SETUP_ROUTE_KEY = "mylearna.guidance.blockedSetupRoute";

export function getSetupStep(stepId: string | null | undefined) {
  return CLEAN_SETUP_STEPS.find((step) => step.id === stepId) ?? CLEAN_SETUP_STEPS[0];
}

export function getSetupStepNumber(stepId: string | null | undefined) {
  const index = CLEAN_SETUP_STEPS.findIndex((step) => step.id === stepId);
  return index >= 0 ? index + 1 : 1;
}

export function getSetupRoute(stepId: string, cleanRoute = false) {
  const step = getSetupStep(stepId);
  return cleanRoute ? step.cleanRoute : step.route;
}

export function getNextSetupStep(stepId: string) {
  const index = CLEAN_SETUP_STEPS.findIndex((step) => step.id === stepId);
  return index >= 0 ? CLEAN_SETUP_STEPS[index + 1] ?? null : null;
}

export function hasRequiredLearningSettings(profile: {
  countryCode?: string | null;
  curriculumFrameworkId?: string | null;
  jurisdictionCode?: string | null;
  reportingMode?: string | null;
} | null) {
  if (!profile) return false;
  const countryCode = String(profile.countryCode ?? "").trim();
  const curriculumFrameworkId = String(profile.curriculumFrameworkId ?? "").trim();
  const reportingMode = String(profile.reportingMode ?? "").trim();
  const jurisdictionCode = String(profile.jurisdictionCode ?? "").trim();
  const needsJurisdiction = countryCode === "AU" || countryCode === "US" || countryCode === "UK";

  return Boolean(
    countryCode &&
      curriculumFrameworkId &&
      reportingMode &&
      (!needsJurisdiction || jurisdictionCode),
  );
}
