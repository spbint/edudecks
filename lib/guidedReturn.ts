export type GuidedContext = {
  page:
    | "capture"
    | "portfolio"
    | "planner"
    | "reports"
    | "output"
    | "authority";
  hasStudents?: boolean;
  evidenceCount?: number;
  lastActiveDays?: number;
  reportReady?: boolean;
  portfolioItems?: number;
};

export type GuidedReturnState = {
  isFirstVisit: boolean;
  isReturning: boolean;
  inactivityDays: number;
  momentum: "starting" | "building" | "consistent" | "stalled";
};

const STORAGE_KEY = "edudecks_guided_state";

export function getGuidedReturnState(): GuidedReturnState {
  if (typeof window === "undefined") {
    return {
      isFirstVisit: true,
      isReturning: false,
      inactivityDays: 0,
      momentum: "starting",
    };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    const now = new Date().toISOString();
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        firstVisit: now,
        lastVisit: now,
        visits: 1,
      })
    );

    return {
      isFirstVisit: true,
      isReturning: false,
      inactivityDays: 0,
      momentum: "starting",
    };
  }

  try {
    const data = JSON.parse(raw) as {
      firstVisit?: string;
      lastVisit?: string;
      visits?: number;
    };

    const now = new Date();
    const last = data.lastVisit ? new Date(data.lastVisit) : now;
    const diffDays = Math.max(
      0,
      Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
    );
    const visits = Math.max(1, Number(data.visits || 1)) + 1;

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...data,
        lastVisit: now.toISOString(),
        visits,
      })
    );

    let momentum: GuidedReturnState["momentum"] = "starting";

    if (visits > 5 && diffDays <= 1) momentum = "consistent";
    else if (visits > 2 && diffDays <= 2) momentum = "building";
    else if (diffDays >= 3) momentum = "stalled";

    return {
      isFirstVisit: false,
      isReturning: true,
      inactivityDays: diffDays,
      momentum,
    };
  } catch {
    return {
      isFirstVisit: false,
      isReturning: true,
      inactivityDays: 0,
      momentum: "starting",
    };
  }
}

export function getReturnGuidance(
  ctx: GuidedContext,
  state: GuidedReturnState
): string {
  const { page } = ctx;

  if (state.isFirstVisit) {
    return "Start with one small step - you don't need everything at once.";
  }

  if (state.momentum === "stalled") {
    if (page === "capture") {
      return "It's been a few days - try capturing one small learning moment to get back into flow.";
    }
    if (page === "planner") {
      return "Reset gently - choose one simple focus for this week.";
    }
    if (page === "reports") {
      return "You're close - adding one more piece of evidence will strengthen your report.";
    }
  }

  if (state.momentum === "consistent") {
    return "You're building strong momentum - keep going with your next step.";
  }

  switch (page) {
    case "capture":
      return "Capture one small learning moment - that's enough to keep things moving.";
    case "portfolio":
      return "Your portfolio is growing - add a few meaningful moments to shape the story.";
    case "planner":
      return "Stay focused on your weekly plan - simple and consistent is enough.";
    case "reports":
      return "Your report is taking shape - refine it step by step.";
    case "output":
      return "Review your work and prepare to share what matters most.";
    case "authority":
      return "You're nearing submission - review, refine, and export with confidence.";
    default:
      return "Keep moving forward - one step at a time.";
  }
}

export function getCompletionMessage(ctx: GuidedContext): string | null {
  if (ctx.page === "output" && ctx.reportReady) {
    return "You've built something meaningful - this reflects real learning and progress.";
  }

  if (ctx.page === "authority" && ctx.reportReady) {
    return "You're ready to submit with confidence - your preparation shows.";
  }

  return null;
}

export function buildGuidedContext(partial: Partial<GuidedContext>): GuidedContext {
  return {
    page: partial.page || "capture",
    hasStudents: partial.hasStudents ?? false,
    evidenceCount: partial.evidenceCount ?? 0,
    lastActiveDays: partial.lastActiveDays ?? 0,
    reportReady: partial.reportReady ?? false,
    portfolioItems: partial.portfolioItems ?? 0,
  };
}
