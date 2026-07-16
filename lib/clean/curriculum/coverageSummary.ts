import type {
  CurriculumFrameworkElement,
  CurriculumFrameworkEvidenceArea,
  CurriculumFrameworkLearningArea,
  ResolvedCurriculumFrameworkMap,
} from "@/lib/clean/curriculum/frameworkMaps";
import {
  parseCurriculumContextFromNodeIds,
  parsePathwayContextFromNodeIds,
  type CleanCurriculumCaptureContext,
  type CleanPathwayCaptureContext,
} from "@/lib/clean/evidence/curriculumContext";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import type {
  CleanAssessmentSkillStatus,
} from "@/lib/clean/assessments/types";
import {
  buildUnifiedPathwayStepStateIndex,
  getUnifiedPathwayStepState,
  resolveEffectiveAssessmentConfidence,
} from "@/lib/clean/pathways/pathwayStepState";
import {
  getAllPathwaySteps,
  type PathwayStepRegistryItem,
} from "@/lib/clean/pathways/pathwayStepRegistry";

export type CurriculumCoverageStatus =
  | "No evidence yet"
  | "Evidence started"
  | "Evidence building";

export type CurriculumCoverageMatchSummary = {
  count: number;
  status: CurriculumCoverageStatus;
  latestEntry: CleanEvidenceEntry | null;
  matchedEntries: CleanEvidenceEntry[];
  assessmentSummary: CurriculumCoverageAssessmentSummary;
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
  pathwayContext: CleanPathwayCaptureContext | null;
  learningAreaLabel: string | null;
  curriculumElementLabel: string | null;
  authorityEvidenceAreaLabel: string | null;
};

export type CurriculumCoverageAssessmentSummary = {
  totalSteps: number;
  evidenceLinkedStepCount: number;
  assessedCount: number;
  notAssessedYet: number;
  stillDeveloping: number;
  developing: number;
  secure: number;
  strong: number;
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
  pathwayContext: CleanPathwayCaptureContext | null;
};

type BuildCurriculumCoverageSummaryInput = {
  resolvedFramework: ResolvedCurriculumFrameworkMap;
  entries: CleanEvidenceEntry[];
  assessmentStatuses?: CleanAssessmentSkillStatus[];
};

type PathwayMatchDescriptor = {
  subjectKey: string;
  subjectLabel: string;
  pathwayKey: string;
  pathwayLabel: string;
  stepKey: string;
  stepLabel: string;
  stepMeaning: string;
  skillFocus: string;
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

function buildPathwayAreaSearchText(descriptor: PathwayMatchDescriptor) {
  return [
    descriptor.subjectKey,
    descriptor.subjectLabel,
    descriptor.pathwayKey,
    descriptor.pathwayLabel,
  ]
    .join(" ")
    .toLowerCase();
}

function buildPathwayElementSearchText(descriptor: PathwayMatchDescriptor) {
  return [
    descriptor.subjectKey,
    descriptor.subjectLabel,
    descriptor.pathwayKey,
    descriptor.pathwayLabel,
    descriptor.stepKey,
    descriptor.stepLabel,
    descriptor.stepMeaning,
    descriptor.skillFocus,
  ]
    .join(" ")
    .toLowerCase();
}

function matchesAnyKeyword(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
}

function matchesPathwayKeyword(text: string, keywords: string[]) {
  const normalizedText = ` ${safe(text).toLowerCase().replace(/[^a-z0-9]+/g, " ")} `;
  return keywords.some((keyword) => {
    const normalizedKeyword = safe(keyword).toLowerCase().replace(/[^a-z0-9]+/g, " ");
    if (!normalizedKeyword) return false;
    return normalizedText.includes(` ${normalizedKeyword} `);
  });
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
    assessmentSummary: {
      totalSteps: 0,
      evidenceLinkedStepCount: 0,
      assessedCount: 0,
      notAssessedYet: 0,
      stillDeveloping: 0,
      developing: 0,
      secure: 0,
      strong: 0,
    },
  };
}

function buildPathwayDescriptorFromContext(
  context: CleanPathwayCaptureContext | null,
): PathwayMatchDescriptor | null {
  if (!context) return null;

  return {
    subjectKey: safe(context.subjectKey),
    subjectLabel: safe(context.subjectLabel),
    pathwayKey: safe(context.pathwayKey),
    pathwayLabel: safe(context.pathwayLabel),
    stepKey: safe(context.stepKey),
    stepLabel: safe(context.stepTitle),
    stepMeaning: safe(context.stepMeaning),
    skillFocus: safe(context.skillFocus),
  };
}

function buildPathwayDescriptorFromRegistryItem(
  item: PathwayStepRegistryItem,
): PathwayMatchDescriptor {
  return {
    subjectKey: safe(item.subjectKey),
    subjectLabel: safe(item.subjectTitle),
    pathwayKey: safe(item.strandKey),
    pathwayLabel: safe(item.strandTitle),
    stepKey: safe(item.stepKey),
    stepLabel: safe(item.stepTitle),
    stepMeaning: safe(item.stepDescription),
    skillFocus: safe(item.skillFocus),
  };
}

function matchesAreaDescriptor(
  key: string,
  label: string,
  area: CurriculumFrameworkLearningArea,
) {
  const normalizedKey = key.toLowerCase();
  const normalizedLabel = label.toLowerCase();
  return (
    (normalizedKey && normalizedKey === area.key.toLowerCase()) ||
    area.legacyKeys?.some((legacyKey) => normalizedKey === legacyKey.toLowerCase()) === true ||
    (normalizedLabel && normalizedLabel === area.label.toLowerCase()) ||
    area.legacyLabels?.some(
      (legacyLabel) => normalizedLabel === legacyLabel.toLowerCase(),
    ) === true
  );
}

function matchesElementDescriptor(
  key: string,
  label: string,
  element: CurriculumFrameworkElement,
) {
  const normalizedKey = key.toLowerCase();
  const normalizedLabel = label.toLowerCase();
  return (
    (normalizedKey && normalizedKey === element.key.toLowerCase()) ||
    element.legacyKeys?.some((legacyKey) => normalizedKey === legacyKey.toLowerCase()) === true ||
    (normalizedLabel && normalizedLabel === element.label.toLowerCase()) ||
    element.legacyLabels?.some(
      (legacyLabel) => normalizedLabel === legacyLabel.toLowerCase(),
    ) === true
  );
}

function matchesLearningAreaFromPathwayDescriptor(
  descriptor: PathwayMatchDescriptor,
  area: CurriculumFrameworkLearningArea,
) {
  if (
    matchesAreaDescriptor(descriptor.subjectKey, descriptor.subjectLabel, area) ||
    matchesAreaDescriptor(descriptor.pathwayKey, descriptor.pathwayLabel, area)
  ) {
    return true;
  }

  return matchesPathwayKeyword(buildPathwayAreaSearchText(descriptor), area.keywords);
}

function matchesCurriculumElementFromPathwayDescriptor(
  descriptor: PathwayMatchDescriptor,
  element: CurriculumFrameworkElement,
) {
  if (matchesElementDescriptor(descriptor.pathwayKey, descriptor.pathwayLabel, element)) {
    return true;
  }

  return matchesPathwayKeyword(buildPathwayElementSearchText(descriptor), element.keywords);
}

function matchesLearningAreaConfig(
  entry: CleanEvidenceEntry,
  curriculumContext: CleanCurriculumCaptureContext | null,
  pathwayContext: CleanPathwayCaptureContext | null,
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

  const pathwayDescriptor = buildPathwayDescriptorFromContext(pathwayContext);
  if (pathwayDescriptor) {
    return matchesLearningAreaFromPathwayDescriptor(pathwayDescriptor, area);
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
  pathwayContext: CleanPathwayCaptureContext | null,
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

  const pathwayDescriptor = buildPathwayDescriptorFromContext(pathwayContext);
  if (pathwayDescriptor) {
    if (!matchesLearningAreaFromPathwayDescriptor(pathwayDescriptor, area)) {
      return false;
    }

    return matchesCurriculumElementFromPathwayDescriptor(pathwayDescriptor, element);
  }

  if (!matchesLearningAreaConfig(entry, curriculumContext, pathwayContext, area)) {
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

function buildAssessmentSummary(
  registryItems: PathwayStepRegistryItem[],
  unifiedStateIndex: ReturnType<typeof buildUnifiedPathwayStepStateIndex>,
): CurriculumCoverageAssessmentSummary {
  return registryItems.reduce(
    (totals, item) => {
      const unifiedState = getUnifiedPathwayStepState(unifiedStateIndex, item.id);
      const assessmentConfidence = resolveEffectiveAssessmentConfidence(unifiedState);

      totals.totalSteps += 1;
      if ((unifiedState?.linkedEvidenceCount || 0) > 0) {
        totals.evidenceLinkedStepCount += 1;
      }

      if (assessmentConfidence === "Not assessed yet") {
        totals.notAssessedYet += 1;
        return totals;
      }

      totals.assessedCount += 1;

      if (assessmentConfidence === "Still developing") {
        totals.stillDeveloping += 1;
      } else if (assessmentConfidence === "Developing") {
        totals.developing += 1;
      } else if (assessmentConfidence === "Secure") {
        totals.secure += 1;
      } else if (assessmentConfidence === "Strong") {
        totals.strong += 1;
      }

      return totals;
    },
    {
      totalSteps: 0,
      evidenceLinkedStepCount: 0,
      assessedCount: 0,
      notAssessedYet: 0,
      stillDeveloping: 0,
      developing: 0,
      secure: 0,
      strong: 0,
    },
  );
}

export function buildCurriculumCoverageSummary(
  input: BuildCurriculumCoverageSummaryInput,
): CurriculumCoverageSummary {
  const registryItems = getAllPathwaySteps();
  const unifiedStateIndex = buildUnifiedPathwayStepStateIndex({
    assessmentStatuses: input.assessmentStatuses,
    evidenceEntries: input.entries,
  });
  const entriesWithCurriculumContext: EvidenceEntryWithCurriculumContext[] = input.entries.map(
    (entry) => ({
      entry,
      curriculumContext: parseCurriculumContextFromNodeIds(entry.curriculumNodeIds),
      pathwayContext: parsePathwayContextFromNodeIds(entry.curriculumNodeIds),
    }),
  );
  const contextByEntryId = new Map(
    entriesWithCurriculumContext.map((item) => [
      item.entry.id,
      {
        curriculumContext: item.curriculumContext,
        pathwayContext: item.pathwayContext,
      },
    ]),
  );

  const areaSummaries: CurriculumCoverageAreaSummary[] = input.resolvedFramework.map.learningAreas.map(
    (area) => {
      const matchedPathwaySteps = registryItems.filter((item) =>
        matchesLearningAreaFromPathwayDescriptor(
          buildPathwayDescriptorFromRegistryItem(item),
          area,
        ),
      );
      const matchedAreaEntries = entriesWithCurriculumContext
        .filter(({ entry, curriculumContext, pathwayContext }) =>
          matchesLearningAreaConfig(entry, curriculumContext, pathwayContext, area),
        )
        .map(({ entry }) => entry);

      const elementSummaries = area.elements.map((element) => {
        const matchedElementPathwaySteps = matchedPathwaySteps.filter((item) =>
          matchesCurriculumElementFromPathwayDescriptor(
            buildPathwayDescriptorFromRegistryItem(item),
            element,
          ),
        );
        const matchedElementEntries = entriesWithCurriculumContext
          .filter(({ entry, curriculumContext, pathwayContext }) =>
            matchesCurriculumElementConfig(
              entry,
              curriculumContext,
              pathwayContext,
              area,
              element,
            ),
          )
          .map(({ entry }) => entry);

        return {
          element,
          ...buildDetailedMatchSummary(matchedElementEntries),
          assessmentSummary: buildAssessmentSummary(
            matchedElementPathwaySteps,
            unifiedStateIndex,
          ),
        };
      });

      return {
        area,
        elementSummaries,
        ...buildDetailedMatchSummary(matchedAreaEntries),
        assessmentSummary: buildAssessmentSummary(matchedPathwaySteps, unifiedStateIndex),
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
      const contexts = contextByEntryId.get(entry.id) ?? null;
      const linked = registerLinkedEntry(entry, contexts?.curriculumContext ?? null);
      pushUnique(linked.learningAreaLabels, summary.area.label);
    });

    summary.elementSummaries.forEach((elementSummary) => {
      elementSummary.matchedEntries.forEach((entry) => {
        const contexts = contextByEntryId.get(entry.id) ?? null;
        const linked = registerLinkedEntry(entry, contexts?.curriculumContext ?? null);
        pushUnique(linked.learningAreaLabels, summary.area.label);
        pushUnique(linked.curriculumElementLabels, elementSummary.element.label);
      });
    });
  });

  supplementaryAreaSummaries.forEach((summary) => {
    summary.matchedEntries.forEach((entry) => {
      const contexts = contextByEntryId.get(entry.id) ?? null;
      const linked = registerLinkedEntry(entry, contexts?.curriculumContext ?? null);
      pushUnique(linked.authorityEvidenceAreaLabels, summary.area.label);
    });
  });

  const linkedEvidenceEntries: CurriculumCoverageLinkedEvidence[] = [
    ...linkedEvidenceMap.values(),
  ]
    .map((linked) => ({
      entry: linked.entry,
      curriculumContext: linked.curriculumContext,
      pathwayContext: contextByEntryId.get(linked.entry.id)?.pathwayContext ?? null,
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
