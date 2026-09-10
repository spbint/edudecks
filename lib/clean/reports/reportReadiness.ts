import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import { parsePathwayContextFromNodeIds } from "@/lib/clean/evidence/curriculumContext";

export type ReportReadinessSubject = { label: string; count: number };

export type ReportReadinessSummary = {
  recordCount: number;
  reportIncludedCount: number;
  mediaRecordCount: number;
  subjects: ReportReadinessSubject[];
};

const KNOWN_SUBJECTS = new Map([
  ["mathematics", "Mathematics"],
  ["english", "English"],
  ["science", "Science"],
  ["humanities and social sciences", "Humanities and Social Sciences"],
  ["technologies", "Technologies"],
  ["the arts", "The Arts"],
  ["health and physical education", "Health and Physical Education"],
]);

function subjectLabel(entry: Pick<CleanEvidenceEntry, "learningArea" | "curriculumNodeIds">) {
  const explicitArea = String(entry.learningArea ?? "").trim().toLowerCase();
  if (explicitArea) return KNOWN_SUBJECTS.get(explicitArea) ?? "Other learning";

  const pathway = parsePathwayContextFromNodeIds(entry.curriculumNodeIds);
  const pathwaySubject = String(pathway?.subjectLabel || pathway?.subjectKey || "")
    .trim()
    .toLowerCase();
  return KNOWN_SUBJECTS.get(pathwaySubject) ?? "Other learning";
}

export function buildReportReadinessSummary(
  entries: readonly CleanEvidenceEntry[],
): ReportReadinessSummary {
  const uniqueEntries = [...new Map(entries.map((entry) => [entry.id, entry])).values()];
  const subjectCounts = new Map<string, number>();

  for (const entry of uniqueEntries) {
    const label = subjectLabel(entry);
    subjectCounts.set(label, (subjectCounts.get(label) ?? 0) + 1);
  }

  return {
    recordCount: uniqueEntries.length,
    reportIncludedCount: uniqueEntries.filter((entry) => entry.includeInReport).length,
    mediaRecordCount: uniqueEntries.filter(
      (entry) => entry.attachmentUrls.length > 0 || Boolean(entry.imageUrl),
    ).length,
    subjects: [...subjectCounts.entries()]
      .filter(([label]) => label !== "Other learning")
      .map(([label, count]) => ({ label, count }))
      .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label)),
  };
}
