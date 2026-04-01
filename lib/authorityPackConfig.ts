export type AuthorityPackSectionKey =
  | "cover"
  | "overview"
  | "coverage"
  | "evidence"
  | "appendix"
  | "action-plan"
  | "weekly-plan"
  | "readiness-notes"
  | "parent-note";

export type AuthorityPackConfig = {
  draftId: string;
  jurisdiction: "au" | "uk" | "us";
  title: string;
  includeSections: Record<AuthorityPackSectionKey, boolean>;
  selectedEvidenceIds: string[];
  emphasisNote: string;
  reviewerNote: string;
  includeOnlyRequiredEvidence: boolean;
  includeOnlyCoreEvidence: boolean;
  updatedAt: string;
};

const STORAGE_PREFIX = "edudecks_authority_pack_config_v1:";

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((x) => safe(x)).filter(Boolean);
}

function asBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const s = value.trim().toLowerCase();
    if (s === "true") return true;
    if (s === "false") return false;
  }
  if (typeof value === "number") return value !== 0;
  return fallback;
}

function getStorageKey(draftId: string) {
  return `${STORAGE_PREFIX}${safe(draftId)}`;
}

function normalizeIncludeSections(
  value: unknown
): Record<AuthorityPackSectionKey, boolean> {
  const raw =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  return {
    cover: asBoolean(raw.cover, true),
    overview: asBoolean(raw.overview, true),
    coverage: asBoolean(raw.coverage, true),
    evidence: asBoolean(raw.evidence, true),
    appendix: asBoolean(raw.appendix, true),
    "action-plan": asBoolean(raw["action-plan"], true),
    "weekly-plan": asBoolean(raw["weekly-plan"], true),
    "readiness-notes": asBoolean(raw["readiness-notes"], true),
    "parent-note": asBoolean(raw["parent-note"], false),
  };
}

function normalizeConfig(value: unknown): AuthorityPackConfig | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const draftId = safe(raw.draftId);
  if (!draftId) return null;

  const jurisdictionRaw = safe(raw.jurisdiction).toLowerCase();
  const jurisdiction =
    jurisdictionRaw === "uk" || jurisdictionRaw === "us" ? jurisdictionRaw : "au";

  return {
    draftId,
    jurisdiction,
    title: safe(raw.title) || "Authority Pack",
    includeSections: normalizeIncludeSections(raw.includeSections),
    selectedEvidenceIds: asStringArray(raw.selectedEvidenceIds),
    emphasisNote: safe(raw.emphasisNote),
    reviewerNote: safe(raw.reviewerNote),
    includeOnlyRequiredEvidence: asBoolean(raw.includeOnlyRequiredEvidence, false),
    includeOnlyCoreEvidence: asBoolean(raw.includeOnlyCoreEvidence, false),
    updatedAt: safe(raw.updatedAt) || new Date().toISOString(),
  };
}

export function loadAuthorityPackConfig(
  draftId: string
): AuthorityPackConfig | null {
  const safeDraftId = safe(draftId);
  if (!safeDraftId) return null;

  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(getStorageKey(safeDraftId));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return normalizeConfig(parsed);
  } catch (err) {
    console.warn("Failed to load authority pack config:", err);
    return null;
  }
}

export function saveAuthorityPackConfig(config: AuthorityPackConfig): void {
  const normalized = normalizeConfig(config);
  if (!normalized) return;

  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      getStorageKey(normalized.draftId),
      JSON.stringify({
        ...normalized,
        updatedAt: new Date().toISOString(),
      })
    );
  } catch (err) {
    console.warn("Failed to save authority pack config:", err);
  }
}

export function deleteAuthorityPackConfig(draftId: string): void {
  const safeDraftId = safe(draftId);
  if (!safeDraftId) return;

  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(getStorageKey(safeDraftId));
  } catch (err) {
    console.warn("Failed to delete authority pack config:", err);
  }
}

export function duplicateAuthorityPackConfig(
  sourceDraftId: string,
  nextDraftId: string
): AuthorityPackConfig | null {
  const existing = loadAuthorityPackConfig(sourceDraftId);
  if (!existing) return null;

  const duplicated: AuthorityPackConfig = {
    ...existing,
    draftId: safe(nextDraftId),
    updatedAt: new Date().toISOString(),
  };

  saveAuthorityPackConfig(duplicated);
  return duplicated;
}