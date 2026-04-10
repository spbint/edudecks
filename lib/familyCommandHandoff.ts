"use client";

export const FAMILY_SHELL_HANDOFF_QUERY_PARAM = "shellIntent";

const FAMILY_SHELL_HANDOFF_KEY = "edudecks_family_shell_handoff_v1";
const FAMILY_SHELL_HANDOFF_TTL_MS = 1000 * 60 * 45;

export type FamilyShellHandoffIntent =
  | "start-record"
  | "refresh-week"
  | "widen-subject-mix"
  | "steady-rhythm"
  | "reset-after-quiet-patch"
  | "plan-broader-next-step"
  | "round-out-story"
  | "refresh-story"
  | "start-report-draft"
  | "strengthen-draft"
  | "refresh-before-report"
  | "enable-readiness-guidance"
  | "strengthen-before-readiness"
  | "check-readiness";

export type FamilyShellHandoffPayload = {
  intent: FamilyShellHandoffIntent;
  href: string;
  title: string;
  detail: string;
  firstAction: string;
  followUpAction: string;
  createdAt: number;
};

type HandoffSignal = {
  label?: string;
  suggestion?: string;
  why?: string;
  blocker?: string;
} | null;

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function includesAny(text: string, needles: string[]) {
  return needles.some((needle) => text.includes(needle));
}

function handoffCopy(intent: FamilyShellHandoffIntent) {
  switch (intent) {
    case "start-record":
      return {
        title: "Suggested next move",
        detail: "Start with one simple learning moment so the weekly record has a clear first anchor.",
        firstAction: "Begin with a short title, one clear summary, and the learning area that fits best.",
        followUpAction: "From here, check whether this first capture gives the weekly record a clear starting point.",
      };
    case "refresh-week":
      return {
        title: "Suggested next move",
        detail: "Add one fresh learning moment here so the weekly record feels current again.",
        firstAction: "Capture one recent example from this week before it slips out of view.",
        followUpAction: "From here, check whether the record now feels current enough for this week.",
      };
    case "widen-subject-mix":
      return {
        title: "Suggested next move",
        detail: "Use this capture to add a different subject and round out the week a little more.",
        firstAction: "Choose one quieter subject area and add a single example from it.",
        followUpAction: "From here, check whether the weekly mix now feels a little broader.",
      };
    case "steady-rhythm":
      return {
        title: "Suggested next move",
        detail: "A small capture here will help steady the rhythm after a quieter patch.",
        firstAction: "Add one recent moment now, even if it is small, to get the rhythm moving again.",
        followUpAction: "From here, look at whether this gives the week a steadier feel again.",
      };
    case "reset-after-quiet-patch":
      return {
        title: "Suggested next move",
        detail: "Use the planner to reset the next calm step after a quieter stretch.",
        firstAction: "Choose one gentle focus for the week and set the next session in motion.",
        followUpAction: "From here, check whether the next session now feels clear and light enough to follow through.",
      };
    case "plan-broader-next-step":
      return {
        title: "Suggested next move",
        detail: "Shape the next session around a learning area that has been quieter recently.",
        firstAction: "Plan the next session around a subject that has had less attention lately.",
        followUpAction: "From here, check whether the plan now gives a quieter subject some space.",
      };
    case "round-out-story":
      return {
        title: "Suggested next move",
        detail: "Review the portfolio with breadth in mind and round out the story where it still feels thin.",
        firstAction: "Scan the recent story and check whether one important learning area still feels missing.",
        followUpAction: "From here, review whether the story now feels broad enough across recent learning.",
      };
    case "refresh-story":
      return {
        title: "Suggested next move",
        detail: "A quick portfolio review here should help refresh the story before it feels dated.",
        firstAction: "Start by checking whether the most recent evidence still reflects what is happening now.",
        followUpAction: "From here, review whether the portfolio still feels current and representative.",
      };
    case "start-report-draft":
      return {
        title: "Suggested next move",
        detail: "Open the report builder and shape a first draft from the evidence already in place.",
        firstAction: "Begin by selecting the clearest evidence anchors that already represent the learning well.",
        followUpAction: "From here, review whether the draft has enough substance to support a calm first pass.",
      };
    case "strengthen-draft":
      return {
        title: "Suggested next move",
        detail: "Use this report pass to strengthen the draft with a broader, calmer evidence base.",
        firstAction: "Check whether the draft draws on enough varied evidence before refining the wording.",
        followUpAction: "From here, review whether the draft now feels broad and balanced enough to trust.",
      };
    case "refresh-before-report":
      return {
        title: "Suggested next move",
        detail: "Check the report draft with freshness in mind before you lean on it too heavily.",
        firstAction: "Look first for any stale or missing recent evidence that should be reflected in the draft.",
        followUpAction: "From here, review whether the draft now reflects the most recent learning clearly enough.",
      };
    case "enable-readiness-guidance":
      return {
        title: "Suggested next move",
        detail: "Open readiness to confirm the posture and turn guidance back on before relying on later steps.",
        firstAction: "Start by checking the current readiness posture and whether guidance support is switched on.",
        followUpAction: "From here, review whether the readiness posture now gives you a clearer path forward.",
      };
    case "strengthen-before-readiness":
      return {
        title: "Suggested next move",
        detail: "Use readiness as a quick posture check, then strengthen the evidence base where it still looks light.",
        firstAction: "Check freshness, breadth, and draft support first so you can see what still needs strengthening.",
        followUpAction: "From here, review which part of freshness, breadth, or draft support still needs the next lift.",
      };
    case "check-readiness":
    default:
      return {
        title: "Suggested next move",
        detail: "Use readiness to check whether the current evidence base is calm and usable enough for review.",
        firstAction: "Start with freshness, breadth, and draft support to see whether the record is ready for review.",
        followUpAction: "From here, review whether freshness, breadth, and draft support look settled enough for a calm check.",
      };
  }
}

export function buildFamilyShellHandoff(
  href: string,
  signal: HandoffSignal
): FamilyShellHandoffPayload | null {
  const normalizedHref = safe(href);
  if (!normalizedHref) return null;

  const signalText = [
    safe(signal?.label),
    safe(signal?.suggestion),
    safe(signal?.why),
    safe(signal?.blocker),
  ]
    .join(" ")
    .toLowerCase();

  let intent: FamilyShellHandoffIntent;

  if (normalizedHref.startsWith("/capture")) {
    if (includesAny(signalText, ["science"])) {
      intent = "widen-subject-mix";
    } else if (includesAny(signalText, ["wider mix", "different subject", "broader", "one area"])) {
      intent = "widen-subject-mix";
    } else if (includesAny(signalText, ["rhythm", "quiet"])) {
      intent = "steady-rhythm";
    } else if (includesAny(signalText, ["fresh", "this week", "weekly", "stale"])) {
      intent = "refresh-week";
    } else {
      intent = "start-record";
    }
  } else if (normalizedHref.startsWith("/planner")) {
    intent = includesAny(signalText, ["quiet", "reset"])
      ? "reset-after-quiet-patch"
      : "plan-broader-next-step";
  } else if (normalizedHref.startsWith("/portfolio")) {
    intent = includesAny(signalText, ["dated", "stale", "freshness"])
      ? "refresh-story"
      : "round-out-story";
  } else if (normalizedHref.startsWith("/reports")) {
    if (includesAny(signalText, ["no draft", "first draft"])) {
      intent = "start-report-draft";
    } else if (includesAny(signalText, ["refresh", "stale"])) {
      intent = "refresh-before-report";
    } else {
      intent = "strengthen-draft";
    }
  } else if (includesAny(signalText, ["guidance is off", "guidance off"])) {
    intent = "enable-readiness-guidance";
  } else if (includesAny(signalText, ["not ready", "wider evidence", "coverage", "no draft", "still light"])) {
    intent = "strengthen-before-readiness";
  } else {
    intent = "check-readiness";
  }

  return {
    intent,
    href: normalizedHref,
    createdAt: Date.now(),
    ...handoffCopy(intent),
  };
}

export function withFamilyShellHandoffQuery(
  href: string,
  payload: FamilyShellHandoffPayload | null
) {
  if (!payload) return href;
  const [path, hash = ""] = href.split("#");
  const [pathname, existingQuery = ""] = path.split("?");
  const params = new URLSearchParams(existingQuery);
  params.set(FAMILY_SHELL_HANDOFF_QUERY_PARAM, payload.intent);
  const nextQuery = params.toString();
  return `${pathname}${nextQuery ? `?${nextQuery}` : ""}${hash ? `#${hash}` : ""}`;
}

export function writeFamilyShellHandoff(payload: FamilyShellHandoffPayload | null) {
  if (!payload || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FAMILY_SHELL_HANDOFF_KEY, JSON.stringify(payload));
  } catch {
    // best-effort only
  }
}

export function resolveFamilyShellHandoff(
  intentValue: string | null | undefined,
  expectedHref: string
) {
  const normalizedIntent = safe(intentValue) as FamilyShellHandoffIntent;
  if (!normalizedIntent) return null;

  const fallback = {
    intent: normalizedIntent,
    href: expectedHref,
    createdAt: Date.now(),
    ...handoffCopy(normalizedIntent),
  } satisfies FamilyShellHandoffPayload;

  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(FAMILY_SHELL_HANDOFF_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<FamilyShellHandoffPayload>;
    const createdAt =
      typeof parsed.createdAt === "number" && Number.isFinite(parsed.createdAt)
        ? parsed.createdAt
        : 0;

    if (!createdAt || Date.now() - createdAt > FAMILY_SHELL_HANDOFF_TTL_MS) {
      window.localStorage.removeItem(FAMILY_SHELL_HANDOFF_KEY);
      return fallback;
    }

    if (parsed.intent !== normalizedIntent) return fallback;
    if (safe(parsed.href) && safe(parsed.href) !== expectedHref) return fallback;

    return {
      intent: normalizedIntent,
      href: expectedHref,
      title: safe(parsed.title) || fallback.title,
      detail: safe(parsed.detail) || fallback.detail,
      firstAction: safe(parsed.firstAction) || fallback.firstAction,
      followUpAction: safe(parsed.followUpAction) || fallback.followUpAction,
      createdAt,
    } satisfies FamilyShellHandoffPayload;
  } catch {
    return fallback;
  }
}
