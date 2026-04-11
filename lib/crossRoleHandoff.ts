"use client";

export const CROSS_ROLE_HANDOFF_QUERY_PARAM = "roleIntent";

const CROSS_ROLE_HANDOFF_KEY = "edudecks_cross_role_handoff_v1";
const CROSS_ROLE_HANDOFF_TTL_MS = 1000 * 60 * 45;

export const CROSS_ROLE_HANDOFF_INTENTS = [
  "class-pressure",
  "class-visibility",
  "class-intervention",
  "learner-follow-up",
] as const;

export const CROSS_ROLE_HANDOFF_ROLES = [
  "leadership",
  "teacher",
  "learner",
] as const;

export type CrossRoleHandoffIntent = (typeof CROSS_ROLE_HANDOFF_INTENTS)[number];
export type CrossRoleHandoffRole = (typeof CROSS_ROLE_HANDOFF_ROLES)[number];

export type CrossRoleHandoffPayload = {
  intent: CrossRoleHandoffIntent;
  fromRole: CrossRoleHandoffRole;
  toRole: CrossRoleHandoffRole;
  contextId: string;
  href: string;
  title: string;
  reason: string;
  detail: string;
  firstAction: string;
  followUpAction: string;
  timestamp: number;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function isIntent(value: string): value is CrossRoleHandoffIntent {
  return (CROSS_ROLE_HANDOFF_INTENTS as readonly string[]).includes(value);
}

function isRole(value: string): value is CrossRoleHandoffRole {
  return (CROSS_ROLE_HANDOFF_ROLES as readonly string[]).includes(value);
}

function leadershipToTeacherCopy(intent: CrossRoleHandoffIntent, className: string, reason: string) {
  switch (intent) {
    case "class-intervention":
      return {
        title: "Suggested next move",
        detail: `Leadership sent you here because ${className} is carrying support pressure. ${reason}`,
        firstAction: "Start with this class and check which review or support item is drifting first.",
        followUpAction: "From here, decide whether this needs a support review, teacher follow-up, or one fresh class example.",
      };
    case "class-visibility":
      return {
        title: "Suggested next move",
        detail: `Leadership sent you here because visibility in ${className} is still too thin. ${reason}`,
        firstAction: "Start with this class and look for the first learner or subject area that needs a fresh example.",
        followUpAction: "From here, decide whether the next lift is one fresh capture or one targeted learner check-in.",
      };
    case "class-pressure":
    default:
      return {
        title: "Suggested next move",
        detail: `Leadership sent you here because ${className} needs a steadier class-level check-in. ${reason}`,
        firstAction: "Start with this class and identify the first learner, review, or evidence gap that needs attention.",
        followUpAction: "From here, decide whether the next move is learner follow-up, fresh evidence, or a support review.",
      };
  }
}

function teacherToLearnerCopy(learnerName: string, reason: string) {
  return {
    title: "Suggested next move",
    detail: `Teacher triage sent you here because ${learnerName} needs a clearer follow-up. ${reason}`,
    firstAction: "Start with the clearest issue on the page and choose one small next move for this learner.",
    followUpAction: "From here, check whether the learner picture now feels steadier or whether one more step is still needed.",
  };
}

export function buildCrossRoleHandoff(args: {
  intent: CrossRoleHandoffIntent;
  fromRole: CrossRoleHandoffRole;
  toRole: CrossRoleHandoffRole;
  contextId: string;
  href: string;
  title?: string;
  reason: string;
  detail: string;
  firstAction: string;
  followUpAction: string;
}): CrossRoleHandoffPayload | null {
  const contextId = safe(args.contextId);
  const href = safe(args.href);
  if (!contextId || !href) return null;

  return {
    intent: args.intent,
    fromRole: args.fromRole,
    toRole: args.toRole,
    contextId,
    href,
    title: safe(args.title) || "Suggested next move",
    reason: safe(args.reason),
    detail: safe(args.detail),
    firstAction: safe(args.firstAction),
    followUpAction: safe(args.followUpAction),
    timestamp: Date.now(),
  };
}

export function buildLeadershipTeacherHandoff(args: {
  classId: string;
  className: string;
  reason: string;
  href?: string;
  intent?: CrossRoleHandoffIntent;
}) {
  const className = safe(args.className) || "this class";
  const reason = safe(args.reason) || "This class needs a clearer next step.";
  const intent =
    args.intent ||
    (reason.toLowerCase().includes("review") || reason.toLowerCase().includes("support")
      ? "class-intervention"
      : reason.toLowerCase().includes("evidence") || reason.toLowerCase().includes("visibility")
        ? "class-visibility"
        : "class-pressure");
  const copy = leadershipToTeacherCopy(intent, className, reason);
  return buildCrossRoleHandoff({
    intent,
    fromRole: "leadership",
    toRole: "teacher",
    contextId: args.classId,
    href: args.href || "/teacher",
    reason,
    ...copy,
  });
}

export function buildTeacherLearnerHandoff(args: {
  learnerId: string;
  learnerName: string;
  reason: string;
  href?: string;
}) {
  const learnerName = safe(args.learnerName) || "this learner";
  const reason = safe(args.reason) || "This learner needs a clearer next step.";
  const copy = teacherToLearnerCopy(learnerName, reason);
  return buildCrossRoleHandoff({
    intent: "learner-follow-up",
    fromRole: "teacher",
    toRole: "learner",
    contextId: args.learnerId,
    href: args.href || `/teacher/students/${safe(args.learnerId)}`,
    reason,
    ...copy,
  });
}

export function withCrossRoleHandoffQuery(
  href: string,
  payload: CrossRoleHandoffPayload | null
) {
  if (!payload) return href;
  const [path, hash = ""] = href.split("#");
  const [pathname, existingQuery = ""] = path.split("?");
  const params = new URLSearchParams(existingQuery);
  params.set(CROSS_ROLE_HANDOFF_QUERY_PARAM, payload.intent);
  const nextQuery = params.toString();
  return `${pathname}${nextQuery ? `?${nextQuery}` : ""}${hash ? `#${hash}` : ""}`;
}

export function writeCrossRoleHandoff(payload: CrossRoleHandoffPayload | null) {
  if (!payload || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CROSS_ROLE_HANDOFF_KEY, JSON.stringify(payload));
  } catch {
    // best effort only
  }
}

export function resolveCrossRoleHandoff(args: {
  intentValue: string | null | undefined;
  expectedHref: string;
  expectedToRole: CrossRoleHandoffRole;
  expectedContextId?: string | null;
}): CrossRoleHandoffPayload | null {
  const rawIntent = safe(args.intentValue);
  if (!rawIntent || !isIntent(rawIntent)) return null;

  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(CROSS_ROLE_HANDOFF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CrossRoleHandoffPayload>;
    const timestamp =
      typeof parsed.timestamp === "number" && Number.isFinite(parsed.timestamp)
        ? parsed.timestamp
        : 0;

    if (!timestamp || Date.now() - timestamp > CROSS_ROLE_HANDOFF_TTL_MS) {
      window.localStorage.removeItem(CROSS_ROLE_HANDOFF_KEY);
      return null;
    }

    if (!isIntent(safe(parsed.intent)) || parsed.intent !== rawIntent) return null;
    if (!isRole(safe(parsed.fromRole)) || !isRole(safe(parsed.toRole))) return null;
    if (parsed.toRole !== args.expectedToRole) return null;
    const fromRole = parsed.fromRole as CrossRoleHandoffRole;
    const toRole = parsed.toRole as CrossRoleHandoffRole;
    if (safe(parsed.href) && safe(parsed.href) !== args.expectedHref) {
      window.localStorage.removeItem(CROSS_ROLE_HANDOFF_KEY);
      return null;
    }

    const expectedContextId = safe(args.expectedContextId);
    const parsedContextId = safe(parsed.contextId);
    if (expectedContextId && parsedContextId && expectedContextId !== parsedContextId) {
      window.localStorage.removeItem(CROSS_ROLE_HANDOFF_KEY);
      return null;
    }

    return {
      intent: parsed.intent,
      fromRole,
      toRole,
      contextId: parsedContextId,
      href: args.expectedHref,
      title: safe(parsed.title) || "Suggested next move",
      reason: safe(parsed.reason),
      detail: safe(parsed.detail),
      firstAction: safe(parsed.firstAction),
      followUpAction: safe(parsed.followUpAction),
      timestamp,
    } satisfies CrossRoleHandoffPayload;
  } catch {
    return null;
  }
}
