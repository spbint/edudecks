import type { CleanPortfolioItem } from "@/lib/clean/portfolio/types";
import { parsePathwayContextFromNodeIds } from "@/lib/clean/evidence/curriculumContext";
import type { CleanReportPdfEvidenceItem } from "@/lib/clean/outputs/pdf";
import type { CleanCalendarItem } from "@/lib/clean/calendar/types";

export type EvidencePresentationMeta = {
  sourceLabel: string;
  pathwayLabel: string | null;
  strandLabel: string | null;
  stageLabel: string | null;
  stepLabel: string | null;
  progressLevel: string | null;
  hasAttachment: boolean;
};

export function getEvidenceProgressLevel(reflection: string | null | undefined) {
  const match = String(reflection ?? "").match(/Progress level:\s*([^\n.]+)/i);
  return match?.[1]?.trim() || null;
}

export function getEvidencePresentationMeta(item: CleanPortfolioItem): EvidencePresentationMeta {
  const pathwayContext = parsePathwayContextFromNodeIds(item.evidence.curriculumNodeIds);
  const stepLabel =
    pathwayContext?.stepNumber && pathwayContext.stepTitle
      ? `Step ${pathwayContext.stepNumber} - ${pathwayContext.stepTitle}`
      : pathwayContext?.stepTitle || null;

  return {
    sourceLabel: pathwayContext ? "My Pathways" : "My Capture",
    pathwayLabel: pathwayContext?.pathwayLabel || pathwayContext?.pathwayKey || null,
    strandLabel: pathwayContext?.pathwayLabel || pathwayContext?.pathwayKey || null,
    stageLabel: pathwayContext?.stageLabel || pathwayContext?.stageKey || null,
    stepLabel,
    progressLevel: getEvidenceProgressLevel(item.evidence.reflection),
    hasAttachment:
      Boolean(item.evidence.imageUrl) || Boolean(item.evidence.attachmentUrls.length),
  };
}

export function buildReportPdfEvidenceItems(
  portfolioItems: CleanPortfolioItem[],
  options: {
    calendarItemById: Map<string, CleanCalendarItem>;
    programLabelById: Map<string, string>;
    segmentLabelById: Map<string, string>;
    learnerLabelById: Map<string, string>;
    selectedLearnerLabel?: string | null;
  },
): CleanReportPdfEvidenceItem[] {
  return portfolioItems.map((item) => {
    const linkedCalendarItem = item.evidence.calendarItemId
      ? options.calendarItemById.get(item.evidence.calendarItemId) ?? null
      : null;
    const programTitle =
      (item.evidence.programId
        ? options.programLabelById.get(item.evidence.programId) ?? null
        : null) ||
      (linkedCalendarItem?.programId
        ? options.programLabelById.get(linkedCalendarItem.programId) ?? null
        : null);
    const segmentTitle =
      linkedCalendarItem?.programSegmentId
        ? options.segmentLabelById.get(linkedCalendarItem.programSegmentId) ?? null
        : null;
    const meta = getEvidencePresentationMeta(item);

    return {
      id: item.evidence.id,
      title: item.evidence.title || item.evidence.whatHappened,
      observedOn: item.evidence.observedOn,
      learnerLabel:
        options.learnerLabelById.get(item.evidence.learnerId) ||
        options.selectedLearnerLabel ||
        "Unknown learner",
      learningArea: item.evidence.learningArea || linkedCalendarItem?.learningArea || null,
      programTitle,
      segmentTitle,
      blockTitle: linkedCalendarItem?.title || null,
      whatHappened: item.evidence.whatHappened,
      reflection: item.evidence.reflection,
      portfolioNote: item.highlight?.note ?? null,
      sourceLabel: meta.sourceLabel,
      pathwayLabel: meta.pathwayLabel,
      strandLabel: meta.strandLabel,
      stageLabel: meta.stageLabel,
      stepLabel: meta.stepLabel,
      progressLevel: meta.progressLevel,
      hasAttachment: meta.hasAttachment,
      attachmentCount: item.evidence.attachmentUrls.length,
    };
  });
}
