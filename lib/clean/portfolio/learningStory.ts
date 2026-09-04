import type { CleanPortfolioItem } from "@/lib/clean/portfolio/types";

export type PortfolioLearningAreaSnapshot = {
  learningArea: string;
  recordCount: number;
};

export type PortfolioLearningStory = {
  evidenceCount: number;
  learningAreaCount: number;
  learningAreas: PortfolioLearningAreaSnapshot[];
  latestObservedOn: string | null;
  highlights: CleanPortfolioItem[];
  recentItems: CleanPortfolioItem[];
};

function compareRecentEvidence(left: CleanPortfolioItem, right: CleanPortfolioItem) {
  const observedCompare = right.evidence.observedOn.localeCompare(left.evidence.observedOn);
  if (observedCompare !== 0) return observedCompare;

  const leftCreated = Date.parse(left.evidence.createdAt || left.evidence.updatedAt || "");
  const rightCreated = Date.parse(right.evidence.createdAt || right.evidence.updatedAt || "");
  if (!Number.isNaN(leftCreated) || !Number.isNaN(rightCreated)) {
    if (Number.isNaN(leftCreated)) return 1;
    if (Number.isNaN(rightCreated)) return -1;
    if (leftCreated !== rightCreated) return rightCreated - leftCreated;
  }

  return left.evidence.id.localeCompare(right.evidence.id);
}

/**
 * Purely describes records already in Portfolio. It deliberately makes no
 * judgement about progress, mastery, coverage, or missing learning areas.
 */
export function buildPortfolioLearningStory(
  items: CleanPortfolioItem[],
  learnerId?: string | null,
): PortfolioLearningStory {
  const learnerItems = items.filter(
    (item) =>
      item.evidence.includeInPortfolio &&
      (!learnerId || item.evidence.learnerId === learnerId),
  );
  const recentItems = [...learnerItems].sort(compareRecentEvidence);
  const areaCounts = new Map<string, number>();

  for (const item of learnerItems) {
    const learningArea = String(item.evidence.learningArea ?? "").trim();
    if (!learningArea) continue;
    areaCounts.set(learningArea, (areaCounts.get(learningArea) ?? 0) + 1);
  }

  return {
    evidenceCount: learnerItems.length,
    learningAreaCount: areaCounts.size,
    learningAreas: [...areaCounts.entries()]
      .map(([learningArea, recordCount]) => ({ learningArea, recordCount }))
      .sort((left, right) => right.recordCount - left.recordCount || left.learningArea.localeCompare(right.learningArea)),
    latestObservedOn: recentItems[0]?.evidence.observedOn || null,
    highlights: recentItems.filter((item) => item.isHighlighted),
    recentItems,
  };
}
