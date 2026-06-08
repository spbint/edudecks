export type GuidanceTourStep = {
  anchorId?: string;
  title: string;
  body: string;
};

export const WELCOME_TOUR_ID = "welcome";

export const WELCOME_TOUR_STEPS: GuidanceTourStep[] = [
  {
    title: "Welcome to MyLearna",
    body: "MyLearna helps homeschool families plan learning, capture evidence, build portfolios and prepare clearer records and reports.",
  },
  {
    anchorId: "profile-family-setup",
    title: "Start with your family profile",
    body: "Add your family and learner details first so MyLearna can organise learning around your children.",
  },
  {
    anchorId: "settings-region-curriculum",
    title: "Choose your learning context",
    body: "Set your country, region and curriculum context. You can keep this simple and adjust it later.",
  },
  {
    anchorId: "calendar-week-plan",
    title: "Plan the week",
    body: "Use My Calendar to map out learning across the week without needing everything to be perfect.",
  },
  {
    anchorId: "my-day-today-plan",
    title: "Use My Day",
    body: "My Day helps you focus on what is happening now and what needs attention today.",
  },
  {
    anchorId: "pathways-current-step",
    title: "Follow learning pathways",
    body: "My Pathways helps you see possible next steps, worksheets, practice and assessment support.",
  },
  {
    anchorId: "capture-add-evidence",
    title: "Capture learning evidence",
    body: "Add notes, photos or work samples as learning happens. Small captures can become useful records later.",
  },
  {
    anchorId: "portfolio-review-evidence",
    title: "Build a portfolio over time",
    body: "My Portfolio gathers learning evidence into a clearer picture of progress.",
  },
  {
    anchorId: "reports-preview-output",
    title: "Prepare reports when needed",
    body: "Reports become easier when plans, notes, evidence and portfolio items have grown across the year.",
  },
  {
    title: "You are ready to start",
    body: "You can turn guidance tips off or restart this walkthrough any time from My Settings.",
  },
];

export function getWelcomeTourStepIndexForAnchor(anchorId: string) {
  const stepIndex = WELCOME_TOUR_STEPS.findIndex((step) => step.anchorId === anchorId);
  return stepIndex >= 0 ? stepIndex : 0;
}
