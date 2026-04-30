import { familyYearLevelToStoredNumber } from "@/lib/familyLearnerYearLevel";

const FAMILY_CHILDREN_CACHE_KEY = "edudecks_children_seed_v1";

export function safeFamilyValue(value: unknown) {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

export function isMissingLearnerColumnError(error: unknown) {
  const message = String(
    (error as { message?: unknown })?.message ?? "",
  ).toLowerCase();
  return message.includes("does not exist") && message.includes("column");
}

export function isMissingLearnerRelationOrColumn(error: unknown) {
  const message = String(
    (error as { message?: unknown })?.message ?? "",
  ).toLowerCase();
  return (
    message.includes("does not exist") &&
    (message.includes("column") || message.includes("relation"))
  );
}

type LocalFamilyLearnerRow = {
  id: string;
  label?: string | null;
  name?: string | null;
  preferred_name?: string | null;
  first_name?: string | null;
  surname?: string | null;
  family_name?: string | null;
  year_level?: number | string | null;
  yearLabel?: string | null;
  created_at?: string | null;
  connectedAt?: string | null;
  photo_url?: string | null;
  [key: string]: unknown;
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readLocalLearnerRows(): LocalFamilyLearnerRow[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(FAMILY_CHILDREN_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const rows = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object"
        ? Object.values(parsed)
        : [];

    return rows
      .map((item, index): LocalFamilyLearnerRow | null => {
        if (!item || typeof item !== "object") return null;
        const row = item as Record<string, unknown>;
        const id = safeFamilyValue(row.id) || `local-${index + 1}`;
        const label =
          safeFamilyValue(row.label) ||
          safeFamilyValue(row.name) ||
          safeFamilyValue(row.preferred_name) ||
          safeFamilyValue(row.first_name) ||
          `Learner ${index + 1}`;
        const yearLevel = familyYearLevelToStoredNumber(row.year_level ?? row.yearLabel);

        return {
          ...row,
          id,
          label,
          name: label,
          preferred_name: safeFamilyValue(row.preferred_name) || label,
          first_name: safeFamilyValue(row.first_name) || label,
          surname: safeFamilyValue(row.surname) || null,
          family_name: safeFamilyValue(row.family_name) || null,
          year_level: yearLevel,
          yearLabel: safeFamilyValue(row.yearLabel),
          created_at: safeFamilyValue(row.created_at ?? row.connectedAt) || null,
          connectedAt: safeFamilyValue(row.connectedAt ?? row.created_at) || null,
        };
      })
      .filter(Boolean) as LocalFamilyLearnerRow[];
  } catch {
    return [];
  }
}

function writeLocalLearnerRows(rows: LocalFamilyLearnerRow[]) {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(
      FAMILY_CHILDREN_CACHE_KEY,
      JSON.stringify(
        rows.map((row) => ({
          ...row,
          label: safeFamilyValue(row.label || row.name || row.preferred_name || row.first_name),
          name: safeFamilyValue(row.label || row.name || row.preferred_name || row.first_name),
        })),
      ),
    );
  } catch {
    // local cache writes are best-effort
  }
}

export function orderLearnerRowsByIds<T extends { id?: unknown }>(
  rows: T[],
  orderedIds: string[],
) {
  const rowMap = new Map(
    rows.map((row) => [safeFamilyValue(row.id), row] as const),
  );

  return orderedIds
    .map((id) => rowMap.get(id) ?? null)
    .filter((row): row is T => row !== null);
}

export async function loadLinkedFamilyLearnerIds(): Promise<string[] | null> {
  return readLocalLearnerRows()
    .map((row) => safeFamilyValue(row.id))
    .filter(Boolean);
}

export async function loadFamilyLearnersWithVariants<T>(
  selectVariants: string[],
  options?: {
    orderedIds?: string[] | null;
    orderByCreatedAt?: boolean;
  },
): Promise<T[]> {
  void selectVariants;
  void options?.orderByCreatedAt;

  const rows = readLocalLearnerRows();
  const orderedIds = options?.orderedIds ?? null;

  if (Array.isArray(orderedIds)) {
    if (orderedIds.length === 0) return [];
    return orderLearnerRowsByIds(rows as Array<{ id?: unknown }>, orderedIds) as T[];
  }

  return rows as T[];
}

export function patchLocalFamilyLearner(
  learnerId: string,
  patch: Partial<LocalFamilyLearnerRow>,
) {
  const cleanId = safeFamilyValue(learnerId);
  if (!cleanId) return;

  writeLocalLearnerRows(
    readLocalLearnerRows().map((row) =>
      row.id === cleanId
        ? {
            ...row,
            ...patch,
          }
        : row,
    ),
  );
}
