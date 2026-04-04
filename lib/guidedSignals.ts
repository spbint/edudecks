import type { GuidedModeStage } from "@/lib/guidedMode";

export type GuidedSignals = {
  step: GuidedModeStage | null;
  evidenceCount: number;
  distinctLearningAreas: number;
  daysSinceLastEvidence: number | null;
  hasDraft: boolean;
  selectedEvidenceCount: number;
  openedOutput: boolean;
  enteredAuthorityFlow: boolean;
};

type GuidedSignalsInput = {
  step?: unknown;
  pathname?: unknown;
  evidenceCount?: unknown;
  evidence?: unknown;
  distinctLearningAreas?: unknown;
  learningAreas?: unknown;
  areas?: unknown;
  daysSinceLastEvidence?: unknown;
  lastEvidenceAt?: unknown;
  lastEvidenceDate?: unknown;
  hasDraft?: unknown;
  draftId?: unknown;
  draft?: unknown;
  selectedEvidenceCount?: unknown;
  selectedEvidenceIds?: unknown;
  openedOutput?: unknown;
  outputOpened?: unknown;
  enteredAuthorityFlow?: unknown;
  authorityFlowEntered?: unknown;
};

function safeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function safeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function safeBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }
  return false;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => safeText(item)).filter(Boolean);
}

function parseDate(value: unknown): Date | null {
  const text = safeText(value);
  if (!text) return null;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function daysSince(value: unknown): number | null {
  const date = parseDate(value);
  if (!date) return null;
  const diff = Date.now() - date.getTime();
  if (!Number.isFinite(diff)) return null;
  return Math.max(0, Math.floor(diff / 86400000));
}

function normalizeStep(value: unknown): GuidedModeStage | null {
  const text = safeText(value).toLowerCase();
  if (
    text === "capture" ||
    text === "portfolio" ||
    text === "planning" ||
    text === "reports" ||
    text === "output" ||
    text === "authority"
  ) {
    return text;
  }
  if (text === "/capture") return "capture";
  if (text === "/portfolio") return "portfolio";
  if (text === "/planner") return "planning";
  if (text === "/reports") return "reports";
  if (text === "/reports/output") return "output";
  if (text === "/authority") return "authority";
  return null;
}

function countDistinctLearningAreas(input: GuidedSignalsInput): number {
  const explicit = safeNumber(input.distinctLearningAreas, -1);
  if (explicit >= 0) return explicit;

  const areaList = [
    ...asStringArray(input.learningAreas),
    ...asStringArray(input.areas),
  ];

  if (areaList.length > 0) {
    return new Set(areaList.map((item) => item.toLowerCase())).size;
  }

  if (Array.isArray(input.evidence)) {
    const distinct = new Set<string>();

    input.evidence.forEach((row) => {
      if (!row || typeof row !== "object") return;
      const learningArea = safeText((row as Record<string, unknown>).learning_area);
      if (learningArea) distinct.add(learningArea.toLowerCase());
    });

    return distinct.size;
  }

  return 0;
}

function countEvidence(input: GuidedSignalsInput): number {
  const explicit = safeNumber(input.evidenceCount, -1);
  if (explicit >= 0) return explicit;
  if (Array.isArray(input.evidence)) return input.evidence.length;
  return 0;
}

function countSelectedEvidence(input: GuidedSignalsInput): number {
  const explicit = safeNumber(input.selectedEvidenceCount, -1);
  if (explicit >= 0) return explicit;
  if (Array.isArray(input.selectedEvidenceIds)) return input.selectedEvidenceIds.length;
  return 0;
}

export function buildGuidedSignals(data?: GuidedSignalsInput | null): GuidedSignals {
  const input = data || {};
  const step = normalizeStep(input.step) ?? normalizeStep(input.pathname);
  const evidenceCount = Math.max(0, countEvidence(input));
  const distinctLearningAreas = Math.max(0, countDistinctLearningAreas(input));
  const daysSinceLastEvidenceValue =
    typeof input.daysSinceLastEvidence === "number" && Number.isFinite(input.daysSinceLastEvidence)
      ? Math.max(0, input.daysSinceLastEvidence)
      : daysSince(input.lastEvidenceAt ?? input.lastEvidenceDate);
  const hasDraft =
    safeBoolean(input.hasDraft) ||
    Boolean(safeText(input.draftId)) ||
    Boolean(input.draft && typeof input.draft === "object");
  const selectedEvidenceCount = Math.max(0, countSelectedEvidence(input));
  const openedOutput = safeBoolean(input.openedOutput) || safeBoolean(input.outputOpened);
  const enteredAuthorityFlow =
    safeBoolean(input.enteredAuthorityFlow) || safeBoolean(input.authorityFlowEntered);

  return {
    step,
    evidenceCount,
    distinctLearningAreas,
    daysSinceLastEvidence: daysSinceLastEvidenceValue,
    hasDraft,
    selectedEvidenceCount,
    openedOutput,
    enteredAuthorityFlow,
  };
}
