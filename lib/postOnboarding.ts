export type PostOnboardingStage =
  | "capture"
  | "portfolio"
  | "planning"
  | "reports"
  | "output"
  | "authority";

export type PostOnboardingContent = {
  title: string;
  reassurance: string;
  next: string;
  state: string;
};

export type WeeklyRhythmCue = {
  label: string;
  text: string;
};

export const postOnboardingConfig: Record<PostOnboardingStage, PostOnboardingContent> = {
  capture: {
    title: "Capture one useful learning moment",
    reassurance: "You don't need perfect records - one moment is enough to begin.",
    next: "Add a short title, what it showed, and one learning area.",
    state: "Getting started",
  },
  portfolio: {
    title: "Build your child's learning story",
    reassurance: "A few moments are enough to begin seeing real progress.",
    next: "Add 2-3 learning moments to start shaping the story.",
    state: "Building momentum",
  },
  planning: {
    title: "Keep the week simple and purposeful",
    reassurance: "You don't need to plan everything - just choose a few meaningful steps.",
    next: "Choose one focus and one simple action for the week.",
    state: "Shaping direction",
  },
  reports: {
    title: "Build a calm, trustworthy report",
    reassurance: "You already have enough to start - refine as you go.",
    next: "Select your strongest evidence and generate a first draft.",
    state: "Ready for report",
  },
  output: {
    title: "Review and prepare to share",
    reassurance: "This is your work coming together - adjust only what matters.",
    next: "Review, export, or save your report.",
    state: "Ready to share",
  },
  authority: {
    title: "Prepare, review, and export with confidence",
    reassurance: "Your evidence is already structured - this step brings it together.",
    next: "Check readiness -> build pack -> export.",
    state: "Submission ready",
  },
};

export function getPostOnboardingStage(pathname: string): PostOnboardingStage | null {
  if (pathname === "/capture") return "capture";
  if (pathname === "/portfolio") return "portfolio";
  if (pathname === "/planner") return "planning";
  if (pathname === "/reports") return "reports";
  if (pathname === "/reports/output") return "output";
  if (pathname === "/authority") return "authority";
  return null;
}

export function getWeeklyRhythmCue(date = new Date()): WeeklyRhythmCue {
  const day = date.getDay();

  if (day === 1 || day === 2) {
    return {
      label: "Weekly rhythm",
      text: "Keep this week simple and purposeful.",
    };
  }

  if (day === 3 || day === 4) {
    return {
      label: "Weekly rhythm",
      text: "Capture one useful learning moment.",
    };
  }

  return {
    label: "Weekly rhythm",
    text: "Reflect and build your learning story.",
  };
}
