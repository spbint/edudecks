export type FamilyWorkflowStageKey = "home" | "calendar" | "capture" | "reports";

export type WorkflowGuideStep = {
  id: string;
  label: string;
  detail: string;
};

export const FAMILY_WORKFLOW_STAGES: Array<{
  key: FamilyWorkflowStageKey;
  label: string;
  href: string;
  detail: string;
}> = [
  {
    key: "home",
    label: "My Day",
    href: "/my-day",
    detail: "Start with today, the current learner, and your next best move.",
  },
  {
    key: "calendar",
    label: "My Calendar",
    href: "/calendar",
    detail: "See what is coming next and shape the learning rhythm over time.",
  },
  {
    key: "capture",
    label: "My Capture",
    href: "/capture",
    detail: "Record learning moments and evidence while they are still fresh.",
  },
  {
    key: "reports",
    label: "My Reports",
    href: "/my-reports",
    detail: "Turn learning into a clear family record over time.",
  },
];

export const FAMILY_WORKFLOW_PAGE_STEPS: Record<string, WorkflowGuideStep[]> = {
  family: [
    {
      id: "family-overview",
      label: "Family overview",
      detail: "Start with the family snapshot and the current learner.",
    },
    {
      id: "family-actions",
      label: "Quick actions",
      detail: "Open the next workspace you need from one place.",
    },
    {
      id: "learner-management",
      label: "Manage learners",
      detail: "Add learners, switch the current learner, and update details.",
    },
    {
      id: "family-activity",
      label: "Review activity",
      detail: "Check recent learning and reporting movement.",
    },
  ],
  calendar: [
    {
      id: "calendar-overview",
      label: "Calendar overview",
      detail: "See what this page is for before placing the next block.",
    },
    {
      id: "calendar-guidance",
      label: "Weekly guidance",
      detail: "Use the suggestions to start the week lightly.",
    },
    {
      id: "calendar-builder",
      label: "Build the plan",
      detail: "Add blocks, choose the learner, and shape the schedule.",
    },
    {
      id: "calendar-view",
      label: "Review the calendar",
      detail: "Read the day, week, or month view as the plan settles.",
    },
    {
      id: "calendar-next-step",
      label: "Move forward",
      detail: "Continue into capture, portfolio, or reports.",
    },
  ],
  capture: [
    {
      id: "capture-overview",
      label: "Capture overview",
      detail: "See the quick purpose of this page first.",
    },
    {
      id: "capture-form",
      label: "Write the moment",
      detail: "Record what happened and what it showed.",
    },
    {
      id: "capture-guide",
      label: "Use the guide",
      detail: "Keep the prompts close so capture stays easy to trust.",
    },
    {
      id: "capture-next-step",
      label: "Move into reports",
      detail: "Carry the saved moment into portfolio or reports.",
    },
  ],
  reports: [
    {
      id: "reports-builder",
      label: "Builder overview",
      detail: "See where the draft is up to before making changes.",
    },
    {
      id: "reports-settings",
      label: "Set the report",
      detail: "Choose the preset, period, and reporting posture.",
    },
    {
      id: "reports-evidence",
      label: "Choose evidence",
      detail: "Select the clearest pieces to anchor the draft.",
    },
    {
      id: "reports-draft",
      label: "Save the draft",
      detail: "Check draft position and save.",
    },
    {
      id: "reports-library",
      label: "Review saved reports",
      detail: "Open saved drafts and outputs without losing the thread.",
    },
  ],
};

export function resolveFamilyWorkflowStage(pathname: string): FamilyWorkflowStageKey | null {
  if (!pathname) return null;
  if (pathname === "/family" || pathname === "/home" || pathname === "/my-day") return "home";
  if (
    pathname.startsWith("/calendar") ||
    pathname.startsWith("/planner") ||
    pathname.startsWith("/my-plan")
  ) {
    return "calendar";
  }
  if (pathname.startsWith("/capture")) return "capture";
  if (
    pathname.startsWith("/reports") ||
    pathname.startsWith("/my-reports") ||
    pathname.startsWith("/portfolio") ||
    pathname.startsWith("/my-portfolio") ||
    pathname.startsWith("/my-progress") ||
    pathname.startsWith("/exports") ||
    pathname.startsWith("/authority")
  ) {
    return "reports";
  }
  return null;
}
