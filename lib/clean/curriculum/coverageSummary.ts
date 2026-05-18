import type {
  CurriculumFrameworkElement,
  CurriculumFrameworkEvidenceArea,
  CurriculumFrameworkLearningArea,
  ResolvedCurriculumFrameworkMap,
} from "@/lib/clean/curriculum/frameworkMaps";
import {
  parseCurriculumContextFromNodeIds,
  type CleanCurriculumCaptureContext,
} from "@/lib/clean/evidence/curriculumContext";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";

export type CurriculumCoverageStatus =
  | "No evidence yet"
  | "Evidence started"
  | "Evidence building";

export type CurriculumCoverageMatchSummary = {
  count: number;
  status: CurriculumCoverageStatus;
  latestEntry: CleanEvidenceEntry | null;
  matchedEntries: CleanEvidenceEntry[];
};

export type CurriculumCoverageElementSummary = CurriculumCoverageMatchSummary & {
  element: CurriculumFrameworkElement;
};

export type CurriculumCoverageAreaSummary = CurriculumCoverageMatchSummary & {
  area: CurriculumFrameworkLearningArea;
  elementSummaries: CurriculumCoverageElementSummary[];
};

export type CurriculumCoverageEvidenceAreaSummary = CurriculumCoverageMatchSummary & {
  area: CurriculumFrameworkEvidenceArea;
};

export type CurriculumCoverageLinkedEvidence = {
  entry: CleanEvidenceEntry;
  curriculumContext: CleanCurriculumCaptureContext | null;
  learningAreaLabel: string | null;
  curriculumElementLabel: string | null;
  authorityEvidenceAreaLabel: string | null;
};

export type CurriculumCoverageSummary = {
  resolvedFramework: ResolvedCurriculumFrameworkMap;
  areaSummaries: CurriculumCoverageAreaSummary[];
  supplementaryAreaSummaries: CurriculumCoverageEvidenceAreaSummary[];
  linkedEvidenceEntries: CurriculumCoverageLinkedEvidence[];
  learningAreasWithEvidenceCount: number;
  areasToRevisitCount: number;
  supplementaryAreasWithEvidenceCount: number;
  totalLinkedEvidenceCount: number;
  hasLinkedEvidence: boolean;
};

type EvidenceEntryWithCurriculumContext = {
  entry: CleanEvidenceEntry;
  curriculumContext: CleanCurriculumCaptureContext | null;
};

type BuildCurriculumCoverageSummaryInput = {
  resolvedFramework: ResolvedCurriculumFrameworkMap;
  entries: CleanEvidenceEntry[];
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function buildEvidenceSearchText(entry: CleanEvidenceEntry) {
  return [
    safe(entry.learningArea),
    safe(entry.title),
    safe(entry.whatHappened),
    safe(entry.reflection),
  ]
    .join(" ")
    .toLowerCase();
}

function matchesAnyKeyword(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
}

function evidenceSortValue(entry: CleanEvidenceEntry) {
  return Date.parse(`${entry.observedOn}T00:00:00`) || Date.parse(entry.updatedAt || "") || 0;
}

export function getCoverageStatus(count: number): CurriculumCoverageStatus {
  if (count <= 0) return "No evidence yet";
  if (count === 1) return "Evidence started";
  return "Evidence building";
}

function buildDetailedMatchSummary(entries: CleanEvidenceEntry[]): CurriculumCoverageMatchSummary {
  const matchedEntries = [...entries].sort(
    (left, right) => evidenceSortValue(right) - evidenceSortValue(left),
  );

  return {
    matchedEntries,
    count: matchedEntries.length,
    status: getCoverageStatus(matchedEntries.length),
    latestEntry: matchedEntries[0] ?? null,
  };
}

function matchesLearningAreaConfig(
  entry: CleanEvidenceEntry,
  curriculumContext: CleanCurriculumCaptureContext | null,
  area: CurriculumFrameworkLearningArea,
) {
  if (safe(curriculumContext?.learningAreaKey)) {
    const learningAreaKey = safe(curriculumContext?.learningAreaKey);
    return learningAreaKey === area.key || area.legacyKeys?.includes(learningAreaKey) === true;
  }

  if (safe(curriculumContext?.learningAreaLabel)) {
    const learningAreaLabel = safe(curriculumContext?.learningAreaLabel);
    return (
      learningAreaLabel === area.label ||
      area.legacyLabels?.includes(learningAreaLabel) === true
    );
  }

  if (curriculumContext) {
    return false;
  }

  if (
    safe(entry.learningArea).toLowerCase() === area.label.toLowerCase() ||
    area.legacyLabels?.some(
      (legacyLabel) => safe(entry.learningArea).toLowerCase() === legacyLabel.toLowerCase(),
    )
  ) {
    return true;
  }

  return matchesAnyKeyword(buildEvidenceSearchText(entry), area.keywords);
}

function matchesCurriculumElementConfig(
  entry: CleanEvidenceEntry,
  curriculumContext: CleanCurriculumCaptureContext | null,
  area: CurriculumFrameworkLearningArea,
  element: CurriculumFrameworkElement,
) {
  if (safe(curriculumContext?.curriculumElementKey)) {
    const curriculumElementKey = safe(curriculumContext?.curriculumElementKey);
    return (
      curriculumElementKey === element.key ||
      element.legacyKeys?.includes(curriculumElementKey) === true
    );
  }

  if (safe(curriculumContext?.curriculumElementLabel)) {
    const curriculumElementLabel = safe(curriculumContext?.curriculumElementLabel);
    return (
      curriculumElementLabel === element.label ||
      element.legacyLabels?.includes(curriculumElementLabel) === true
    );
  }

  if (!matchesLearningAreaConfig(entry, curriculumContext, area)) {
    return false;
  }

  return matchesAnyKeyword(buildEvidenceSearchText(entry), element.keywords);
}

function matchesAuthorityEvidenceAreaConfig(
  entry: CleanEvidenceEntry,
  curriculumContext: CleanCurriculumCaptureContext | null,
  area: CurriculumFrameworkEvidenceArea,
) {
  if (safe(curriculumContext?.authorityEvidenceAreaKey)) {
    const authorityEvidenceAreaKey = safe(curriculumContext?.authorityEvidenceAreaKey);
    return (
      authorityEvidenceAreaKey === area.key ||
      area.legacyKeys?.includes(authorityEvidenceAreaKey) === true
    );
  }

  if (safe(curriculumContext?.authorityEvidenceAreaLabel)) {
    const authorityEvidenceAreaLabel = safe(curriculumContext?.authorityEvidenceAreaLabel);
    return (
      authorityEvidenceAreaLabel === area.label ||
      area.legacyLabels?.includes(authorityEvidenceAreaLabel) === true
    );
  }

  if (curriculumContext) {
    return false;
  }

  return matchesAnyKeyword(buildEvidenceSearchText(entry), area.keywords);
}

function pushUnique(list: string[], value: string | null) {
  const normalizedValue = safe(value);
  if (!normalizedValue || list.includes(normalizedValue)) {
    return;
  }
  list.push(normalizedValue);
}

export function buildCurriculumCoverageSummary(
  input: BuildCurriculumCoverageSummaryInput,
): CurriculumCoverageSummary {
  const entriesWithCurriculumContext: EvidenceEntryWithCurriculumContext[] = input.entries.map(
    (entry) => ({
      entry,
      curriculumContext: parseCurriculumContextFromNodeIds(entry.curriculumNodeIds),
    }),
  );
  const curriculumContextByEntryId = new Map(
    entriesWithCurriculumContext.map((item) => [item.entry.id, item.curriculumContext]),
  );

  const areaSummaries: CurriculumCoverageAreaSummary[] = input.resolvedFramework.map.learningAreas.map(
    (area) => {
      const matchedAreaEntries = entriesWithCurriculumContext
        .filter(({ entry, curriculumContext }) =>
          matchesLearningAreaConfig(entry, curriculumContext, area),
        )
        .map(({ entry }) => entry);

      const elementSummaries = area.elements.map((element) => {
        const matchedElementEntries = entriesWithCurriculumContext
          .filter(({ entry, curriculumContext }) =>
            matchesCurriculumElementConfig(entry, curriculumContext, area, element),
          )
          .map(({ entry }) => entry);

        return {
          element,
          ...buildDetailedMatchSummary(matchedElementEntries),
        };
      });

      return {
        area,
        elementSummaries,
        ...buildDetailedMatchSummary(matchedAreaEntries),
      };
    },
  );

  const supplementaryAreaSummaries: CurriculumCoverageEvidenceAreaSummary[] =
    input.resolvedFramework.supplementaryEvidenceAreas.map((area) => {
      const matchedEntries = entriesWithCurriculumContext
        .filter(({ entry, curriculumContext }) =>
          matchesAuthorityEvidenceAreaConfig(entry, curriculumContext, area),
        )
        .map(({ entry }) => entry);

      return {
        area,
        ...buildDetailedMatchSummary(matchedEntries),
      };
    });

  const linkedEvidenceMap = new Map<
    string,
    {
      entry: CleanEvidenceEntry;
      curriculumContext: CleanCurriculumCaptureContext | null;
      learningAreaLabels: string[];
      curriculumElementLabels: string[];
      authorityEvidenceAreaLabels: string[];
    }
  >();

  function registerLinkedEntry(
    entry: CleanEvidenceEntry,
    curriculumContext: CleanCurriculumCaptureContext | null,
  ) {
    const existing = linkedEvidenceMap.get(entry.id);
    if (existing) {
      return existing;
    }

    const created = {
      entry,
      curriculumContext,
      learningAreaLabels: [] as string[],
      curriculumElementLabels: [] as string[],
      authorityEvidenceAreaLabels: [] as string[],
    };
    linkedEvidenceMap.set(entry.id, created);
    return created;
  }

  areaSummaries.forEach((summary) => {
    summary.matchedEntries.forEach((entry) => {
      const curriculumContext = curriculumContextByEntryId.get(entry.id) ?? null;
      const linked = registerLinkedEntry(entry, curriculumContext);
      pushUnique(linked.learningAreaLabels, summary.area.label);
    });

    summary.elementSummaries.forEach((elementSummary) => {
      elementSummary.matchedEntries.forEach((entry) => {
        const curriculumContext = curriculumContextByEntryId.get(entry.id) ?? null;
        const linked = registerLinkedEntry(entry, curriculumContext);
        pushUnique(linked.learningAreaLabels, summary.area.label);
        pushUnique(linked.curriculumElementLabels, elementSummary.element.label);
      });
    });
  });

  supplementaryAreaSummaries.forEach((summary) => {
    summary.matchedEntries.forEach((entry) => {
      const curriculumContext = curriculumContextByEntryId.get(entry.id) ?? null;
      const linked = registerLinkedEntry(entry, curriculumContext);
      pushUnique(linked.authorityEvidenceAreaLabels, summary.area.label);
    });
  });

  const linkedEvidenceEntries: CurriculumCoverageLinkedEvidence[] = [
    ...linkedEvidenceMap.values(),
  ]
    .map((linked) => ({
      entry: linked.entry,
      curriculumContext: linked.curriculumContext,
      learningAreaLabel:
        safe(linked.curriculumContext?.learningAreaLabel) ||
        linked.learningAreaLabels[0] ||
        safe(linked.entry.learningArea) ||
        null,
      curriculumElementLabel:
        safe(linked.curriculumContext?.curriculumElementLabel) ||
        linked.curriculumElementLabels[0] ||
        null,
      authorityEvidenceAreaLabel:
        safe(linked.curriculumContext?.authorityEvidenceAreaLabel) ||
        linked.authorityEvidenceAreaLabels[0] ||
        null,
    }))
    .sort((left, right) => evidenceSortValue(right.entry) - evidenceSortValue(left.entry));

  const learningAreasWithEvidenceCount = areaSummaries.filter(
    (summary) => summary.count > 0,
  ).length;
  const areasToRevisitCount = areaSummaries.filter((summary) => summary.count === 0).length;
  const supplementaryAreasWithEvidenceCount = supplementaryAreaSummaries.filter(
    (summary) => summary.count > 0,
  ).length;

  return {
    resolvedFramework: input.resolvedFramework,
    areaSummaries,
    supplementaryAreaSummaries,
    linkedEvidenceEntries,
    learningAreasWithEvidenceCount,
    areasToRevisitCount,
    supplementaryAreasWithEvidenceCount,
    totalLinkedEvidenceCount: linkedEvidenceEntries.length,
    hasLinkedEvidence: linkedEvidenceEntries.length > 0,
  };
}
