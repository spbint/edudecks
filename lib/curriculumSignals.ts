import {
  type CurriculumOutcomeMeta,
  type FrameworkPreset,
  findOutcomeMeta,
  getCurriculumOutcomeLibrary,
} from "@/lib/curriculumFrameworks";

export type CurriculumStatus = "not_started" | "in_progress" | "understood" | "needs_support";

export type CurriculumEvidenceSignalRow = {
  id: string;
  occurred_on?: string | null;
  created_at?: string | null;
  learning_area?: string | null;
  evidence_type?: string | null;
  curriculum_outcome_ids?: string[] | null;
  outcome_status_by_id?: Record<string, "understood" | "in_progress" | "needs_support"> | null;
};

export type CurriculumPlannerSignalBlock = {
  id: string;
  date?: string | null;
  subject?: string | null;
  curriculumOutcomeIds?: string[] | null;
};

export type OutcomeSignal = {
  meta: CurriculumOutcomeMeta;
  status: CurriculumStatus;
  evidenceCount: number;
  lastTouchedAt: string | null;
  evidenceIds: string[];
  explicit: boolean;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeSubjectKey(value: string) {
  return safe(value).toLowerCase();
}

function recentCutoffTimestamp() {
  return Date.now() - 1000 * 60 * 60 * 24 * 30;
}

function parseDateValue(value?: string | null) {
  const trimmed = safe(value);
  if (!trimmed) return null;
  const parsed = new Date(trimmed.includes("T") ? trimmed : `${trimmed}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function latestIso(values: Array<string | null | undefined>) {
  const sorted = values
    .map((value) => safe(value))
    .filter(Boolean)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  return sorted[0] || null;
}

function subjectSignalMap(args: {
  evidenceRows: CurriculumEvidenceSignalRow[];
  plannerBlocks: CurriculumPlannerSignalBlock[];
  preset: FrameworkPreset;
}) {
  const evidenceMap = new Map<string, { count: number; recentCount: number; lastTouchedAt?: string | null }>();
  const plannerMap = new Map<string, number>();

  for (const subject of args.preset.subjects) {
    evidenceMap.set(subject.id, { count: 0, recentCount: 0, lastTouchedAt: null });
    plannerMap.set(subject.id, 0);
  }

  args.evidenceRows.forEach((row) => {
    const area = normalizeSubjectKey(safe(row.learning_area));
    const subject = args.preset.subjects.find((item) => item.aliases.some((alias) => area.includes(alias)));
    if (!subject) return;

    const next = evidenceMap.get(subject.id)!;
    next.count += 1;
    const touchedAt = safe(row.occurred_on) || safe(row.created_at) || null;
    if (touchedAt) {
      const parsed = parseDateValue(touchedAt);
      if (parsed && parsed.getTime() >= recentCutoffTimestamp()) next.recentCount += 1;
      next.lastTouchedAt = touchedAt;
    }
  });

  args.plannerBlocks.forEach((block) => {
    const normalized = normalizeSubjectKey(safe(block.subject));
    const subject = args.preset.subjects.find((item) => item.aliases.some((alias) => normalized.includes(alias)));
    if (!subject) return;
    plannerMap.set(subject.id, (plannerMap.get(subject.id) ?? 0) + 1);
  });

  return { evidenceMap, plannerMap };
}

function deriveOutcomeStatusPlan(args: {
  outcomeCount: number;
  evidenceCount: number;
  recentCount: number;
  planCount: number;
}) {
  const signal = args.evidenceCount * 2 + args.recentCount + args.planCount;
  const understood = signal <= 0 ? 0 : Math.min(args.outcomeCount, Math.floor(signal / 3));
  const inProgress = signal <= 0 ? 0 : Math.min(args.outcomeCount - understood, Math.max(1, args.planCount > 0 ? 1 : 0));
  const needsSupport =
    args.evidenceCount > 0 && args.recentCount === 0 && args.planCount === 0 && args.outcomeCount - understood - inProgress > 0
      ? 1
      : 0;

  return { understood, inProgress, needsSupport };
}

function statusForOutcome(index: number, plan: { understood: number; inProgress: number; needsSupport: number }): CurriculumStatus {
  if (index < plan.understood) return "understood";
  if (index < plan.understood + plan.inProgress) return "in_progress";
  if (index < plan.understood + plan.inProgress + plan.needsSupport) return "needs_support";
  return "not_started";
}

function resolveExplicitStatus(args: {
  explicitEvidenceStatuses: Array<{
    status: "understood" | "in_progress" | "needs_support" | null;
    touchedAt: string | null;
  }>;
  hasPlannerLink: boolean;
}): CurriculumStatus {
  const entries = args.explicitEvidenceStatuses
    .filter((item) => item.status)
    .sort((a, b) => {
      const at = parseDateValue(a.touchedAt)?.getTime() ?? 0;
      const bt = parseDateValue(b.touchedAt)?.getTime() ?? 0;
      return bt - at;
    });

  const newest = entries[0]?.status ?? null;
  if (newest === "needs_support") return "needs_support";

  const latestUnderstood = entries.find((item) => item.status === "understood");
  const latestSupport = entries.find((item) => item.status === "needs_support");

  if (latestUnderstood) {
    const understoodAt = parseDateValue(latestUnderstood.touchedAt)?.getTime() ?? 0;
    const supportAt = parseDateValue(latestSupport?.touchedAt)?.getTime() ?? -1;
    if (understoodAt >= supportAt) return "understood";
  }

  if (entries.some((item) => item.status === "in_progress")) return "in_progress";
  if (entries.length) return newest || "in_progress";
  if (args.hasPlannerLink) return "in_progress";
  return "not_started";
}

export function buildCurriculumOutcomeSignals(args: {
  preset: FrameworkPreset;
  evidenceRows: CurriculumEvidenceSignalRow[];
  plannerBlocks: CurriculumPlannerSignalBlock[];
}) {
  const library = getCurriculumOutcomeLibrary(args.preset);
  const { evidenceMap, plannerMap } = subjectSignalMap(args);

  const explicitPlannerMap = new Map<string, Array<{ blockId: string; touchedAt: string | null }>>();
  const explicitEvidenceMap = new Map<
    string,
    Array<{
      evidenceId: string;
      touchedAt: string | null;
      status: "understood" | "in_progress" | "needs_support" | null;
    }>
  >();

  args.plannerBlocks.forEach((block) => {
    const ids = Array.isArray(block.curriculumOutcomeIds)
      ? block.curriculumOutcomeIds.map((item) => safe(item)).filter(Boolean)
      : [];
    ids.forEach((id) => {
      explicitPlannerMap.set(id, [
        ...(explicitPlannerMap.get(id) ?? []),
        { blockId: block.id, touchedAt: safe(block.date) || null },
      ]);
    });
  });

  args.evidenceRows.forEach((row) => {
    const ids = Array.isArray(row.curriculum_outcome_ids)
      ? row.curriculum_outcome_ids.map((item) => safe(item)).filter(Boolean)
      : [];
    ids.forEach((id) => {
      const statuses = row.outcome_status_by_id ?? {};
      explicitEvidenceMap.set(id, [
        ...(explicitEvidenceMap.get(id) ?? []),
        {
          evidenceId: row.id,
          touchedAt: safe(row.occurred_on) || safe(row.created_at) || null,
          status: statuses[id] ?? null,
        },
      ]);
    });
  });

  const signals = new Map<string, OutcomeSignal>();

  args.preset.subjects.forEach((subject) => {
    const evidenceSignal = evidenceMap.get(subject.id) ?? { count: 0, recentCount: 0, lastTouchedAt: null };
    const planSignal = plannerMap.get(subject.id) ?? 0;

    subject.strands.forEach((strand) => {
      const fallbackPlan = deriveOutcomeStatusPlan({
        outcomeCount: strand.outcomes.length,
        evidenceCount: evidenceSignal.count,
        recentCount: evidenceSignal.recentCount,
        planCount: planSignal,
      });

      strand.outcomes.forEach((outcome, index) => {
        const meta = findOutcomeMeta(args.preset, outcome.code)!;
        const plannerLinks = explicitPlannerMap.get(outcome.code) ?? [];
        const evidenceLinks = explicitEvidenceMap.get(outcome.code) ?? [];
        const explicit = plannerLinks.length > 0 || evidenceLinks.length > 0;
        const status = explicit
          ? resolveExplicitStatus({
              explicitEvidenceStatuses: evidenceLinks.map((item) => ({
                status: item.status,
                touchedAt: item.touchedAt,
              })),
              hasPlannerLink: plannerLinks.length > 0,
            })
          : statusForOutcome(index, fallbackPlan);

        signals.set(outcome.code, {
          meta,
          status,
          evidenceCount: explicit
            ? evidenceLinks.length
            : status === "not_started"
              ? 0
              : Math.max(0, Math.min(2, evidenceSignal.count)),
          lastTouchedAt: explicit
            ? latestIso([
                ...evidenceLinks.map((item) => item.touchedAt),
                ...plannerLinks.map((item) => item.touchedAt),
              ])
            : status === "not_started"
              ? null
              : evidenceSignal.lastTouchedAt || plannerLinks[0]?.touchedAt || null,
          evidenceIds: evidenceLinks.map((item) => item.evidenceId),
          explicit,
        });
      });
    });
  });

  return signals;
}

export function summarizeCurriculumSignals(
  signals: Map<string, OutcomeSignal>,
) {
  const counts: Record<CurriculumStatus, number> = {
    not_started: 0,
    in_progress: 0,
    understood: 0,
    needs_support: 0,
  };
  let explicitCount = 0;
  let explicitEvidenceCount = 0;

  signals.forEach((signal) => {
    counts[signal.status] += 1;
    if (signal.explicit) explicitCount += 1;
    explicitEvidenceCount += signal.evidenceCount;
  });

  const total = counts.not_started + counts.in_progress + counts.understood + counts.needs_support;
  const confidence = total
    ? Math.round(((counts.understood + counts.in_progress * 0.6 + explicitCount * 0.2) / total) * 100)
    : 0;

  return {
    counts,
    total,
    explicitCount,
    explicitEvidenceCount,
    confidence: Math.min(100, confidence),
  };
}
