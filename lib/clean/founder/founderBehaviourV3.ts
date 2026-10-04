import type { FounderProductEvent, FounderTrackedEventName } from "./founderPosthog";

export type FounderConfidence = "high" | "directional" | "insufficient";

export type FounderMetricV3 = {
  label: string;
  value: number | null;
  note: string;
  confidence: FounderConfidence;
};

export type FounderSignalV3 = {
  headline: string;
  evidence: string;
  journey: string;
  confidence: FounderConfidence;
  investigation: string;
};

export type FounderFunnelStepV3 = {
  label: string;
  actors: number;
  events: number;
  progression: number | null;
  dropOff: number | null;
  medianMinutes: number | null;
  confidence: FounderConfidence;
};

export type FounderBreakdownV3 = { label: string; actors: number; events: number };
export type FounderCohortV3 = {
  label: string;
  sample: number;
  value: number | null;
  note: string;
  confidence: FounderConfidence;
};

export type FounderDetailedAnalyticsV3 = {
  featureUsage: FounderBreakdownV3[];
  areaUsage: FounderBreakdownV3[];
  entryBehaviour: FounderBreakdownV3[];
  activityDistribution: FounderMetricV3[];
  recentActivity: FounderBreakdownV3[];
  deviceMix: FounderBreakdownV3[];
  conversionObservations: FounderMetricV3[];
  privacyNote: string;
};

export type FounderBehaviourV3 = {
  generatedAt: string;
  rangeDays: 7 | 30 | 90;
  includeInternal: boolean;
  includeSuspicious: boolean;
  posthogAvailable: boolean;
  summary: FounderMetricV3[];
  signals: FounderSignalV3[];
  funnel: FounderFunnelStepV3[];
  returning: FounderMetricV3[];
  activation: FounderMetricV3[];
  paths: FounderBreakdownV3[];
  capture: FounderMetricV3[];
  captureModes: FounderBreakdownV3[];
  captureSources: FounderBreakdownV3[];
  media: FounderMetricV3[];
  attachmentSources: FounderBreakdownV3[];
  mobile: FounderMetricV3[];
  portfolioReports: FounderMetricV3[];
  retention: FounderMetricV3[];
  cohorts: FounderCohortV3[];
  friction: FounderMetricV3[];
  dataQuality: Array<{ label: string; detail: string; confidence: FounderConfidence }>;
  detailed: FounderDetailedAnalyticsV3;
};

const PUBLIC_EVENTS = new Set<FounderTrackedEventName>([
  "public_page_viewed", "public_session_source", "public_demo_started", "public_signup_started",
  "public_report_viewed", "public_report_downloaded",
]);
const PRODUCT_EVENTS = new Set<FounderTrackedEventName>([
  "product_signed_in", "app_page_viewed", "daily_plan_viewed", "pathway_viewed", "capture_opened",
  "quick_capture_opened", "capture_save_succeeded", "quick_capture_saved", "evidence_created",
  "portfolio_viewed", "portfolio_viewed_after_capture", "report_previewed", "learning_record_pdf_generated",
]);
const CAPTURE_OPEN = new Set<FounderTrackedEventName>(["capture_opened", "quick_capture_opened"]);
const CAPTURE_SAVE = new Set<FounderTrackedEventName>(["capture_save_succeeded", "quick_capture_saved", "evidence_created"]);
const PRODUCT_REPORT_EVENTS = new Set<FounderTrackedEventName>([
  "report_previewed", "learning_record_pdf_generated",
]);
const MIN_SAMPLE = 5;

function actors(events: FounderProductEvent[]) {
  return new Set(events.map((event) => event.userId));
}

function select(events: FounderProductEvent[], names: Set<FounderTrackedEventName> | FounderTrackedEventName) {
  return events.filter((event) => typeof names === "string" ? event.event === names : names.has(event.event));
}

function metric(label: string, events: FounderProductEvent[], note: string, confidence: FounderConfidence = "high"): FounderMetricV3 {
  return { label, value: actors(events).size, note: `${events.length} events. ${note}`, confidence };
}

function dateKey(value: string) {
  return value.slice(0, 10);
}

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function grouped(events: FounderProductEvent[], value: (event: FounderProductEvent) => string | null): FounderBreakdownV3[] {
  const groups = new Map<string, { actors: Set<string>; events: number }>();
  for (const event of events) {
    const label = value(event) || "Unknown";
    const current = groups.get(label) ?? { actors: new Set<string>(), events: 0 };
    current.actors.add(event.userId);
    current.events += 1;
    groups.set(label, current);
  }
  return [...groups].map(([label, group]) => ({ label, actors: group.actors.size, events: group.events }))
    .sort((left, right) => right.actors - left.actors || right.events - left.events);
}

function thresholdedGrouped(
  events: FounderProductEvent[],
  value: (event: FounderProductEvent) => string | null,
): FounderBreakdownV3[] {
  return grouped(events, value).filter((group) => group.actors >= MIN_SAMPLE);
}

function thresholdedRelationshipCount(
  label: string,
  parentLabel: string,
  parentActors: Set<string>,
  matchedActors: Set<string>,
): FounderMetricV3 {
  const matchedCount = [...parentActors].filter((actor) => matchedActors.has(actor)).length;
  if (parentActors.size < MIN_SAMPLE) {
    return {
      label,
      value: null,
      note: `Insufficient ${parentLabel} sample (${parentActors.size}; minimum ${MIN_SAMPLE}).`,
      confidence: "insufficient",
    };
  }
  if (matchedCount < MIN_SAMPLE) {
    return {
      label,
      value: null,
      note: `Matched cohort is below the minimum ${MIN_SAMPLE}; count withheld. Parent cohort: ${parentActors.size}.`,
      confidence: "insufficient",
    };
  }
  return {
    label,
    value: matchedCount,
    note: `Among ${parentActors.size} ${parentLabel} actors.`,
    confidence: "directional",
  };
}

function feature(event: FounderProductEvent) {
  if (event.event === "daily_plan_viewed") return "My Day";
  if (event.event === "pathway_viewed") return "Pathways";
  if (CAPTURE_OPEN.has(event.event) || CAPTURE_SAVE.has(event.event)) return "Capture";
  if (event.event === "portfolio_viewed" || event.event === "portfolio_viewed_after_capture") return "Portfolio";
  if (PRODUCT_REPORT_EVENTS.has(event.event)) return "Reports";
  return null;
}

function coarseArea(event: FounderProductEvent) {
  const knownArea = event.area?.trim();
  if (knownArea && ["My Day", "Pathways", "Capture", "Portfolio", "Reports", "Authentication", "Public"].includes(knownArea)) {
    return knownArea;
  }
  const route = event.route?.toLowerCase() ?? "";
  if (route.includes("my-day") || route.includes("daily")) return "My Day";
  if (route.includes("pathway")) return "Pathways";
  if (route.includes("capture") || route.includes("evidence")) return "Capture";
  if (route.includes("portfolio")) return "Portfolio";
  if (route.includes("report")) return "Reports";
  if (route.includes("auth") || route.includes("login") || route.includes("signup")) return "Authentication";
  return feature(event) ?? null;
}

function entryLabel(event: FounderProductEvent) {
  if (event.event === "public_page_viewed" || event.event === "public_session_source") return "Public visit";
  if (event.event === "public_demo_started") return "Demo started";
  if (event.event === "public_signup_started") return "Signup started";
  if (event.event.startsWith("auth_")) return "Authentication";
  if (event.event === "product_signed_in") return "Product entry";
  return null;
}

function paths(events: FounderProductEvent[]) {
  const byActor = new Map<string, FounderProductEvent[]>();
  for (const event of events) {
    if (!feature(event)) continue;
    const list = byActor.get(event.userId) ?? [];
    list.push(event);
    byActor.set(event.userId, list);
  }
  const transitions = new Map<string, { actors: Set<string>; events: number }>();
  for (const [actor, list] of byActor) {
    const ordered = list.sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt));
    const areas = ordered
      .map(feature)
      .filter((value): value is NonNullable<ReturnType<typeof feature>> => value !== null);
    const compact = areas.filter((value, index) => index === 0 || value !== areas[index - 1]);
    for (let index = 1; index < compact.length; index += 1) {
      const key = `${compact[index - 1]} → ${compact[index]}`;
      const current = transitions.get(key) ?? { actors: new Set<string>(), events: 0 };
      current.actors.add(actor);
      current.events += 1;
      transitions.set(key, current);
    }
  }
  return [...transitions].map(([label, value]) => ({ label, actors: value.actors.size, events: value.events }))
    .sort((a, b) => b.actors - a.actors || b.events - a.events).slice(0, 8);
}

function buildFunnel(events: FounderProductEvent[]): FounderFunnelStepV3[] {
  const definitions: Array<[string, Set<FounderTrackedEventName>]> = [
    ["Public visit", new Set(["public_page_viewed", "public_session_source"])],
    ["Demo", new Set(["public_demo_started"])],
    ["Start signup", new Set(["public_signup_started"])],
    ["Auth email submitted", new Set(["auth_email_submitted"])],
    ["Challenge sent", new Set(["auth_challenge_sent"])],
    ["Verification started", new Set(["auth_verification_started"])],
    ["Verification succeeded", new Set(["auth_verification_succeeded"])],
    ["Session ready", new Set(["auth_session_ready"])],
    ["Product entry", new Set(["auth_product_entry", "product_signed_in"])],
    ["My Day", new Set(["daily_plan_viewed"])],
    ["Pathways", new Set(["pathway_viewed"])],
    ["Capture", CAPTURE_OPEN],
    ["Evidence saved", CAPTURE_SAVE],
    ["Portfolio", new Set(["portfolio_viewed", "portfolio_viewed_after_capture"])],
    ["Report", PRODUCT_REPORT_EVENTS],
  ];
  return definitions.map(([label, names], index) => {
    const current = select(events, names);
    const previous = index ? select(events, definitions[index - 1][1]) : [];
    const currentActors = actors(current);
    const previousActors = actors(previous);
    const linked = index ? [...currentActors].filter((actor) => previousActors.has(actor)) : [];
    const durations = index ? linked.flatMap((actor) => {
      const from = previous.filter((event) => event.userId === actor).sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt))[0];
      const to = current.filter((event) => event.userId === actor && Date.parse(event.occurredAt) >= Date.parse(from.occurredAt))
        .sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt))[0];
      return to ? [(Date.parse(to.occurredAt) - Date.parse(from.occurredAt)) / 60000] : [];
    }) : [];
    const progression = index && previousActors.size ? linked.length / previousActors.size : null;
    return {
      label,
      actors: currentActors.size,
      events: current.length,
      progression,
      dropOff: progression === null ? null : 1 - progression,
      medianMinutes: durations.length >= 3 ? median(durations) : null,
      confidence: index === 0 ? "high" : linked.length >= MIN_SAMPLE ? "directional" : "insufficient",
    };
  });
}

function cohort(label: string, numerator: Set<string>, denominator: Set<string>, note: string): FounderCohortV3 {
  const sample = denominator.size;
  return {
    label,
    sample,
    value: sample >= MIN_SAMPLE ? [...numerator].filter((id) => denominator.has(id)).length / sample : null,
    note: sample >= MIN_SAMPLE ? note : `Insufficient sample (${sample}; minimum ${MIN_SAMPLE}).`,
    confidence: sample >= MIN_SAMPLE ? "directional" : "insufficient",
  };
}

export function buildFounderBehaviourV3(input: {
  events: FounderProductEvent[];
  rangeDays: 7 | 30 | 90;
  includeInternal: boolean;
  includeSuspicious?: boolean;
  posthogAvailable: boolean;
  internalUserIds?: Set<string>;
  suspiciousUserIds?: Set<string>;
  currentUserIds?: Set<string>;
  now?: Date;
}): FounderBehaviourV3 {
  const now = input.now ?? new Date();
  const internalIds = input.internalUserIds ?? new Set<string>();
  const suspiciousIds = input.suspiciousUserIds ?? new Set<string>();
  const currentUserIds = input.currentUserIds ?? new Set<string>();
  const includeSuspicious = input.includeSuspicious ?? true;
  const personIdsFor = (userIds: Set<string>) => new Set(
    input.events
      .filter((event) => userIds.has(event.userId) && event.personId)
      .map((event) => event.personId as string),
  );
  const internalPersonIds = personIdsFor(internalIds);
  const suspiciousPersonIds = personIdsFor(suspiciousIds);
  const currentPersonIds = personIdsFor(currentUserIds);
  const belongsTo = (event: FounderProductEvent, userIds: Set<string>, personIds: Set<string>) =>
    userIds.has(event.userId) || Boolean(event.personId && personIds.has(event.personId));
  const populationEvents = input.events.filter((event) =>
    (input.includeInternal || !belongsTo(event, internalIds, internalPersonIds))
    && (includeSuspicious || !belongsTo(event, suspiciousIds, suspiciousPersonIds)),
  );
  const isPublicOrAuthEvent = (event: FounderProductEvent) =>
    event.event.startsWith("public_") || event.event.startsWith("auth_");
  const events = currentUserIds.size
    ? populationEvents.filter((event) =>
        isPublicOrAuthEvent(event) || belongsTo(event, currentUserIds, currentPersonIds),
      )
    : populationEvents;
  const unmatchedProductActors = currentUserIds.size
    ? actors(populationEvents.filter((event) =>
        PRODUCT_EVENTS.has(event.event) && !belongsTo(event, currentUserIds, currentPersonIds),
      )).size
    : 0;
  const publicEvents = events.filter((event) => PUBLIC_EVENTS.has(event.event));
  const productEvents = events.filter((event) => PRODUCT_EVENTS.has(event.event));
  const publicActors = actors(publicEvents);
  const productActors = actors(productEvents);
  const demos = select(events, "public_demo_started");
  const signups = select(events, "public_signup_started");
  const authComplete = select(events, "auth_session_ready");
  const captureOpen = select(events, CAPTURE_OPEN);
  const captureSave = select(events, CAPTURE_SAVE);
  const portfolio = select(events, new Set(["portfolio_viewed", "portfolio_viewed_after_capture"]));
  const reports = select(events, PRODUCT_REPORT_EVENTS);
  const phoneEvents = productEvents.filter((event) => event.viewportCategory === "phone");
  const pwaEvents = events.filter((event) => event.displayMode === "standalone" || event.event === "pwa_session_started");
  const activeDays = new Map<string, Set<string>>();
  for (const event of productEvents) {
    const days = activeDays.get(event.userId) ?? new Set<string>();
    days.add(dateKey(event.occurredAt));
    activeDays.set(event.userId, days);
  }
  const publicDays = new Map<string, Set<string>>();
  for (const event of publicEvents) {
    const days = publicDays.get(event.userId) ?? new Set<string>();
    days.add(dateKey(event.occurredAt));
    publicDays.set(event.userId, days);
  }
  const returningPublic = new Set([...publicDays].filter(([, days]) => days.size >= 2).map(([id]) => id));
  const returningProduct = new Set([...activeDays].filter(([, days]) => days.size >= 2).map(([id]) => id));
  const retained7 = new Set([...activeDays].filter(([, days]) => {
    const sorted = [...days].sort();
    return sorted.length >= 2 && (Date.parse(sorted.at(-1)!) - Date.parse(sorted[0])) / 86400000 >= 7;
  }).map(([id]) => id));
  const captureActors = actors(captureOpen);
  const captureSaveActors = actors(captureSave);
  const portfolioActors = actors(portfolio);
  const reportActors = actors(reports);
  const failures = select(events, "capture_attachment_upload_failed");
  const authFailures = select(events, new Set(["auth_challenge_send_failed", "auth_verification_failed", "auth_callback_failed", "auth_callback_missing_pkce"]));
  const topActorCount = Math.max(0, ...[...activeDays.keys()].map((id) => productEvents.filter((event) => event.userId === id).length));
  const topActorShare = productEvents.length ? topActorCount / productEvents.length : 0;
  const funnel = buildFunnel(events);
  const recentCutoff = now.getTime() - Math.min(7, input.rangeDays) * 86400000;
  const recentProductEvents = productEvents.filter((event) => Date.parse(event.occurredAt) >= recentCutoff);
  const productEventCounts = new Map<string, number>();
  for (const event of productEvents) {
    productEventCounts.set(event.userId, (productEventCounts.get(event.userId) ?? 0) + 1);
  }
  const frequencyBands = new Map<string, Set<string>>([
    ["1–4 actions", new Set<string>()],
    ["5–19 actions", new Set<string>()],
    ["20+ actions", new Set<string>()],
  ]);
  for (const [actor, count] of productEventCounts) {
    const band = count >= 20 ? "20+ actions" : count >= 5 ? "5–19 actions" : "1–4 actions";
    frequencyBands.get(band)!.add(actor);
  }

  const signals: FounderSignalV3[] = [];
  if (publicActors.size >= MIN_SAMPLE && actors(signups).size / publicActors.size < 0.1) signals.push({
    headline: "Most public visitors are not progressing to signup.",
    evidence: `${actors(signups).size} of ${publicActors.size} observed public actors started signup.`,
    journey: "Acquisition",
    confidence: "directional",
    investigation: "Review public calls-to-action and compare demo-to-signup paths; anonymous identity stitching remains incomplete.",
  });
  if (returningPublic.size > 0) signals.push({
    headline: "Some prospects return without starting signup.",
    evidence: `${[...returningPublic].filter((id) => !actors(signups).has(id)).length} returning public actors have no linked signup start.`,
    journey: "Returning visitors",
    confidence: "directional",
    investigation: "Inspect second-visit page paths and CTA clarity without treating anonymous actors as known people.",
  });
  if (phoneEvents.some((event) => CAPTURE_OPEN.has(event.event))) signals.push({
    headline: "Phone visitors are using Capture.",
    evidence: `${actors(phoneEvents.filter((event) => CAPTURE_OPEN.has(event.event))).size} phone actors opened Capture.`,
    journey: "Capture",
    confidence: "high",
    investigation: "Compare phone save completion with larger-screen completion once both cohorts meet the minimum sample.",
  });
  if (failures.length) signals.push({
    headline: "Attachment uploads have failed.",
    evidence: `${failures.length} failures affected ${actors(failures).size} anonymised actors.`,
    journey: "Camera & uploads",
    confidence: "high",
    investigation: "Break failures down by stage, online hint, viewport and retry sequence.",
  });
  if (topActorShare >= 0.35) signals.push({
    headline: "One high-activity actor is dominating product telemetry.",
    evidence: `The busiest actor generated ${Math.round(topActorShare * 100)}% of product events in this window.`,
    journey: "Data quality",
    confidence: "high",
    investigation: "Use the internal/test exclusion toggle and validate the server-side exclusion list.",
  });
  if (captureActors.size && portfolioActors.size) signals.push({
    headline: "Capture is leading some actors into Portfolio.",
    evidence: `${[...captureActors].filter((id) => portfolioActors.has(id)).length} Capture actors also reached Portfolio.`,
    journey: "Capture → Portfolio",
    confidence: captureActors.size >= MIN_SAMPLE ? "directional" : "insufficient",
    investigation: "Review ordered Capture-to-Portfolio transitions; shared identity is required for this relationship.",
  });

  return {
    generatedAt: now.toISOString(),
    rangeDays: input.rangeDays,
    includeInternal: input.includeInternal,
    includeSuspicious,
    posthogAvailable: input.posthogAvailable,
    summary: [
      { label: "Public visitors", value: publicActors.size, note: "Anonymous public actors, not people or households.", confidence: "directional" },
      { label: "Returning visitors", value: returningPublic.size, note: "Observed on two or more UTC visit days.", confidence: "directional" },
      metric("Demo starters", demos, "Unique actors that started the demo."),
      metric("Signup starters", signups, "Unique actors that selected signup."),
      metric("Successful auth", authComplete, "Session-ready events; not account creations."),
      { label: "Product users", value: productActors.size, note: "Unique authenticated product actors.", confidence: "high" },
      { label: "Activated families", value: captureSaveActors.size, note: "Conservatively defined as saving evidence.", confidence: "directional" },
      { label: "Capture users", value: captureActors.size, note: "Opened standard or Quick Capture.", confidence: "high" },
      { label: "Portfolio users", value: portfolioActors.size, note: "Viewed Portfolio.", confidence: "high" },
      { label: "Report users", value: reportActors.size, note: "Authenticated actors who previewed or generated a report.", confidence: "high" },
      { label: "7-day retained", value: retained7.size, note: "Product activity spanning at least seven days; directional, not a PostHog retention insight.", confidence: "directional" },
      { label: "Phone share", value: productEvents.length ? actors(phoneEvents).size / Math.max(1, productActors.size) : null, note: "Share of product actors with a phone-classified event.", confidence: productActors.size >= MIN_SAMPLE ? "directional" : "insufficient" },
      { label: "PWA share", value: productEvents.length ? actors(pwaEvents).size / Math.max(1, productActors.size) : null, note: "Standalone display mode only; phone browser is not PWA.", confidence: actors(pwaEvents).size ? "directional" : "insufficient" },
    ],
    signals,
    funnel,
    returning: [
      { label: "First-time public visitors", value: Math.max(0, publicActors.size - returningPublic.size), note: "One observed visit day.", confidence: "directional" },
      { label: "Returning public visitors", value: returningPublic.size, note: "Two or more observed visit days.", confidence: "directional" },
      { label: "Returning after demo", value: [...returningPublic].filter((id) => actors(demos).has(id)).length, note: "Same stitched analytics actor.", confidence: "directional" },
      { label: "Returning product users", value: returningProduct.size, note: "Product activity on two or more days.", confidence: "high" },
    ],
    activation: [
      metric("Account verified", select(events, "auth_verification_succeeded"), "Auth telemetry milestone."),
      metric("First My Day", select(events, "daily_plan_viewed"), "First-event timing is bounded by retained telemetry."),
      metric("First Pathway", select(events, "pathway_viewed"), "First-event timing is bounded by retained telemetry."),
      metric("First Capture open", captureOpen, "Standard or Quick Capture."),
      metric("First evidence save", captureSave, "Evidence/save events."),
      metric("First Portfolio", portfolio, "Portfolio view."),
      metric("First Report", reports, "Authenticated report preview or learning-record PDF generation."),
    ],
    paths: paths(productEvents),
    capture: [
      metric("Capture opened", captureOpen, "Standard and Quick Capture."),
      metric("Attachment selected", select(events, "capture_first_attachment_selected"), "Any attachment category."),
      metric("Attachment finalised", select(events, "capture_attachment_finalised"), "Storage upload and record link completed."),
      metric("Evidence saved", captureSave, "Save/evidence-created events."),
      metric("Portfolio after Capture", select(events, "portfolio_viewed_after_capture"), "Explicit handoff event."),
    ],
    captureModes: grouped(captureOpen, (event) => event.captureMode || (event.event === "quick_capture_opened" ? "quick" : "standard")),
    captureSources: grouped(captureOpen, (event) => event.sourceSurface ?? null),
    media: [
      metric("Attachment source selected", select(events, "capture_attachment_source_selected"), "Records picker intent, not guaranteed physical media provenance."),
      metric("Attachment finalised", select(events, "capture_attachment_finalised"), "Successful upload/finalisation."),
      metric("Attachment upload failed", failures, "Failure stage and online hint are privacy-safe."),
    ],
    attachmentSources: grouped(select(events, "capture_attachment_source_selected"), (event) => event.attachmentSource ?? null),
    mobile: [
      { label: "Phone product users", value: actors(phoneEvents).size, note: "Viewport category is phone.", confidence: "high" },
      { label: "Standalone PWA users", value: actors(pwaEvents).size, note: "Standalone display mode or PWA session event.", confidence: actors(pwaEvents).size ? "directional" : "insufficient" },
      metric("Install prompt shown", select(events, "pwa_install_prompt_shown"), "Browser exposed install eligibility."),
      metric("PWA installed", select(events, "pwa_installed"), "Browser appinstalled event."),
    ],
    portfolioReports: [
      metric("Portfolio visits", portfolio, "Portfolio views."),
      metric("Portfolio after Capture", select(events, "portfolio_viewed_after_capture"), "Explicit Capture handoff."),
      metric("Evidence opened", select(events, "portfolio_evidence_opened"), "Portfolio evidence open."),
      metric("Report previews", select(events, "report_previewed"), "Report route previews."),
      metric("PDF generated", select(events, "learning_record_pdf_generated"), "Learning-record PDF generation."),
      metric("Public report viewed", select(events, "public_report_viewed"), "Anonymous public report view."),
      metric("Public report downloaded", select(events, "public_report_downloaded"), "Anonymous public report download."),
    ],
    retention: [
      { label: "Active one day", value: [...activeDays.values()].filter((days) => days.size === 1).length, note: "Authenticated product actors.", confidence: "high" },
      { label: "Active 2+ days", value: [...activeDays.values()].filter((days) => days.size >= 2).length, note: "Authenticated product actors.", confidence: "high" },
      { label: "Active 3+ days", value: [...activeDays.values()].filter((days) => days.size >= 3).length, note: "Authenticated product actors.", confidence: "high" },
      { label: "7-day return", value: retained7.size, note: "Activity span reaches at least seven days.", confidence: "directional" },
      { label: "30-day return", value: input.rangeDays >= 30 ? [...activeDays.values()].filter((days) => {
        const sorted = [...days].sort(); return sorted.length >= 2 && (Date.parse(sorted.at(-1)!) - Date.parse(sorted[0])) / 86400000 >= 30;
      }).length : null, note: "Requires a 30- or 90-day window.", confidence: input.rangeDays >= 30 ? "directional" : "insufficient" },
    ],
    cohorts: [
      cohort("Phone Capture conversion", captureSaveActors, actors(phoneEvents.filter((event) => CAPTURE_OPEN.has(event.event))), "Share of phone Capture actors who saved evidence."),
      cohort("Desktop Capture conversion", captureSaveActors, actors(captureOpen.filter((event) => event.viewportCategory === "desktop" || event.viewportCategory === "laptop")), "Share of larger-screen Capture actors who saved evidence."),
      cohort("Capture → Portfolio", portfolioActors, captureActors, "Share of Capture actors who also reached Portfolio."),
      cohort("Portfolio → Report", reportActors, portfolioActors, "Share of Portfolio actors who also reached Reports."),
      cohort("Returners who Capture", captureActors, returningProduct, "Share of repeat product actors who opened Capture."),
    ],
    friction: [
      metric("Upload failures", failures, "Attachment upload/finalisation failures."),
      metric("Auth failures", authFailures, "Challenge, verification, callback and PKCE failures."),
      { label: "Capture opened without save", value: [...captureActors].filter((id) => !captureSaveActors.has(id)).length, note: "Actor-level abandonment proxy; cross-session intent is unknown.", confidence: "directional" },
      { label: "Attachment selected without finalisation", value: [...actors(select(events, "capture_first_attachment_selected"))].filter((id) => !actors(select(events, "capture_attachment_finalised")).has(id)).length, note: "Actor-level proxy, not attempt-level proof.", confidence: "directional" },
      { label: "Signup without verification", value: [...actors(signups)].filter((id) => !actors(select(events, "auth_verification_succeeded")).has(id)).length, note: "Only valid where anonymous/auth identity stitching succeeds.", confidence: "directional" },
    ],
    dataQuality: [
      { label: "Standard pageviews missing", detail: "No reliable standard $pageview stream exists; v3 uses explicit public_page_viewed and app_page_viewed events.", confidence: "high" },
      { label: "Virtual traffic classification", detail: "$virt_traffic_type currently labels genuine product activity as Automation and is not used as the human filter.", confidence: "high" },
      { label: "Identity stitching", detail: "Anonymous-to-authenticated relationships are directional unless PostHog has merged the actor through $identify. Account exclusions follow PostHog person identity where that merge is available.", confidence: "directional" },
      { label: "Internal/test traffic", detail: input.includeInternal ? "Internal/test authenticated activity is included." : "Known internal/test authenticated IDs are excluded; anonymous internal browsing cannot be identified safely.", confidence: "directional" },
      { label: "Suspicious/unknown accounts", detail: includeSuspicious ? "Accounts flagged for review remain included; they are not assumed to be fake or internal." : "Accounts explicitly flagged for review are excluded from this comparison without deleting their data.", confidence: "high" },
      { label: "Current account verification", detail: currentUserIds.size ? `${unmatchedProductActors} historical or unmatched product actors are excluded from current-account product metrics.` : "Current-account verification was not supplied for this calculation.", confidence: currentUserIds.size ? "high" : "insufficient" },
      { label: "Camera source", detail: "Camera/library/file values describe the picker selected by the user; browsers may still offer another source and no image content or filename is collected.", confidence: "directional" },
      { label: "Missing activation milestones", detail: "Profile completion, learner creation and planning setup lack timestamped analytics events and are not invented.", confidence: "insufficient" },
      { label: "Sample policy", detail: `Cohort rates require at least ${MIN_SAMPLE} actors; smaller samples display insufficient data.`, confidence: "high" },
    ],
    detailed: {
      featureUsage: thresholdedGrouped(productEvents, feature),
      areaUsage: thresholdedGrouped(productEvents, coarseArea),
      entryBehaviour: thresholdedGrouped(events, entryLabel),
      activityDistribution: [...frequencyBands].map(([label, bandActors]) => ({
        label,
        value: bandActors.size >= MIN_SAMPLE ? bandActors.size : null,
        note: bandActors.size >= MIN_SAMPLE
          ? "Anonymous product actors in this frequency band."
          : `Insufficient sample (minimum ${MIN_SAMPLE}); count withheld.`,
        confidence: bandActors.size >= MIN_SAMPLE ? "high" : "insufficient",
      })),
      recentActivity: thresholdedGrouped(recentProductEvents, feature),
      deviceMix: thresholdedGrouped(productEvents, (event) => {
        if (event.displayMode === "standalone") return "Standalone PWA";
        if (event.viewportCategory === "phone") return "Phone browser";
        if (event.viewportCategory === "tablet") return "Tablet browser";
        if (event.viewportCategory === "desktop" || event.viewportCategory === "laptop") return "Desktop browser";
        return null;
      }),
      conversionObservations: [
        thresholdedRelationshipCount("Capture users also reaching Portfolio", "Capture", captureActors, portfolioActors),
        thresholdedRelationshipCount("Portfolio users also reaching Reports", "Portfolio", portfolioActors, reportActors),
        thresholdedRelationshipCount("Capture actors saving evidence", "Capture", captureActors, captureSaveActors),
      ],
      privacyNote: `Only anonymous aggregate categories with at least ${MIN_SAMPLE} actors are shown. Raw routes, identities, learner records and person-level activity are omitted.`,
    },
  };
}

export const founderBehaviourV3Internals = { MIN_SAMPLE, feature, paths, coarseArea, thresholdedGrouped, thresholdedRelationshipCount };
