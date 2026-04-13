import type { LearnerCurriculumPageData } from "@/lib/familyCurriculum";
import type { ReportMode } from "@/lib/reportDrafts";

export type CoverageStatus = "strong" | "developing" | "attention";
export type ReadinessTone = "success" | "info" | "warning" | "danger";

export type CurriculumCoverageArea = {
  area: string;
  totalOutcomes: number;
  plannedOutcomes: number;
  linkedOutcomes: number;
  plannedOnlyOutcomes: number;
  evidenceOnlyOutcomes: number;
  plannedAndEvidencedOutcomes: number;
  planLinks: number;
  evidenceLinks: number;
  secureOutcomes: number;
  trackedOutcomes: number;
  status: CoverageStatus;
  statusLabel: string;
};

export type CurriculumCoverage = {
  ready: boolean;
  reason: "ok" | "no-learner" | "no-curriculum" | "no-outcomes";
  areas: CurriculumCoverageArea[];
  totalOutcomes: number;
  plannedOutcomes: number;
  linkedOutcomes: number;
  plannedOnlyOutcomes: number;
  evidenceOnlyOutcomes: number;
  plannedAndEvidencedOutcomes: number;
  planLinks: number;
  evidenceLinks: number;
  secureOutcomes: number;
  trackedOutcomes: number;
  uncoveredOutcomes: number;
  planningAheadAreas: string[];
  evidenceAheadAreas: string[];
  strongestAreas: string[];
  weakestAreas: string[];
};

export type ParentLanguageSummary = {
  overall: string;
  strengths: string;
  nextStep: string;
};

function joinNatural(items: string[]) {
  if (!items.length) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export function getCoverageStatus(count: number): CoverageStatus {
  if (count >= 3) return "strong";
  if (count >= 1) return "developing";
  return "attention";
}

export function coverageStatusLabel(status: CoverageStatus) {
  if (status === "strong") return "Strong";
  if (status === "developing") return "Developing";
  return "Needs evidence";
}

export function coverageTone(status: CoverageStatus): ReadinessTone {
  if (status === "strong") return "success";
  if (status === "developing") return "info";
  return "warning";
}

export function buildCurriculumCoverage(input: {
  selectedStudentId: string;
  curriculumData: LearnerCurriculumPageData | null;
}): CurriculumCoverage {
  const { selectedStudentId, curriculumData } = input;

  if (!selectedStudentId) {
    return {
      ready: false,
      reason: "no-learner",
      areas: [],
      totalOutcomes: 0,
      plannedOutcomes: 0,
      linkedOutcomes: 0,
      plannedOnlyOutcomes: 0,
      evidenceOnlyOutcomes: 0,
      plannedAndEvidencedOutcomes: 0,
      planLinks: 0,
      evidenceLinks: 0,
      secureOutcomes: 0,
      trackedOutcomes: 0,
      uncoveredOutcomes: 0,
      planningAheadAreas: [],
      evidenceAheadAreas: [],
      strongestAreas: [],
      weakestAreas: [],
    };
  }

  if (!curriculumData?.framework || !curriculumData?.level) {
    return {
      ready: false,
      reason: "no-curriculum",
      areas: [],
      totalOutcomes: 0,
      plannedOutcomes: 0,
      linkedOutcomes: 0,
      plannedOnlyOutcomes: 0,
      evidenceOnlyOutcomes: 0,
      plannedAndEvidencedOutcomes: 0,
      planLinks: 0,
      evidenceLinks: 0,
      secureOutcomes: 0,
      trackedOutcomes: 0,
      uncoveredOutcomes: 0,
      planningAheadAreas: [],
      evidenceAheadAreas: [],
      strongestAreas: [],
      weakestAreas: [],
    };
  }

  if (curriculumData.totalOutcomes === 0) {
    return {
      ready: false,
      reason: "no-outcomes",
      areas: [],
      totalOutcomes: 0,
      plannedOutcomes: 0,
      linkedOutcomes: 0,
      plannedOnlyOutcomes: 0,
      evidenceOnlyOutcomes: 0,
      plannedAndEvidencedOutcomes: 0,
      planLinks: 0,
      evidenceLinks: 0,
      secureOutcomes: 0,
      trackedOutcomes: 0,
      uncoveredOutcomes: 0,
      planningAheadAreas: [],
      evidenceAheadAreas: [],
      strongestAreas: [],
      weakestAreas: [],
    };
  }

  const areas = curriculumData.areas.map((area) => {
    const outcomes = area.strands.flatMap((strand) => strand.outcomes);
    const totalOutcomes = outcomes.length;
    const plannedOutcomes = outcomes.filter((outcome) => outcome.plannedCount > 0).length;
    const linkedOutcomes = outcomes.filter((outcome) => outcome.evidenceCount > 0).length;
    const plannedOnlyOutcomes = outcomes.filter(
      (outcome) => outcome.plannedCount > 0 && outcome.evidenceCount === 0,
    ).length;
    const evidenceOnlyOutcomes = outcomes.filter(
      (outcome) => outcome.plannedCount === 0 && outcome.evidenceCount > 0,
    ).length;
    const plannedAndEvidencedOutcomes = outcomes.filter(
      (outcome) => outcome.plannedCount > 0 && outcome.evidenceCount > 0,
    ).length;
    const secureOutcomes = outcomes.filter((outcome) => outcome.status === "secure").length;
    const trackedOutcomes = outcomes.filter(
      (outcome) => outcome.status !== "not_introduced",
    ).length;
    const status = getCoverageStatus(plannedAndEvidencedOutcomes || linkedOutcomes);

    return {
      area: area.name,
      totalOutcomes,
      plannedOutcomes,
      linkedOutcomes,
      plannedOnlyOutcomes,
      evidenceOnlyOutcomes,
      plannedAndEvidencedOutcomes,
      planLinks: area.plannedCount,
      evidenceLinks: area.evidenceCount,
      secureOutcomes,
      trackedOutcomes,
      status,
      statusLabel: coverageStatusLabel(status),
    } satisfies CurriculumCoverageArea;
  });

  const strongestAreas = areas
    .filter((area) => area.plannedAndEvidencedOutcomes > 0 || area.linkedOutcomes > 0)
    .sort(
      (a, b) =>
        b.plannedAndEvidencedOutcomes - a.plannedAndEvidencedOutcomes ||
        b.linkedOutcomes - a.linkedOutcomes ||
        b.evidenceLinks - a.evidenceLinks,
    )
    .slice(0, 3)
    .map((area) => area.area);

  const weakestAreas = areas
    .filter((area) => area.plannedAndEvidencedOutcomes === 0 && area.linkedOutcomes === 0)
    .slice(0, 3)
    .map((area) => area.area);

  const planningAheadAreas = areas
    .filter((area) => area.plannedOnlyOutcomes > 0)
    .sort((a, b) => b.plannedOnlyOutcomes - a.plannedOnlyOutcomes)
    .slice(0, 3)
    .map((area) => area.area);

  const evidenceAheadAreas = areas
    .filter((area) => area.evidenceOnlyOutcomes > 0)
    .sort((a, b) => b.evidenceOnlyOutcomes - a.evidenceOnlyOutcomes)
    .slice(0, 3)
    .map((area) => area.area);

  return {
    ready: true,
    reason: "ok",
    areas,
    totalOutcomes: curriculumData.totalOutcomes,
    plannedOutcomes: curriculumData.plannedLinkedOutcomeCount,
    linkedOutcomes: curriculumData.evidenceLinkedOutcomeCount,
    plannedOnlyOutcomes: curriculumData.plannedOnlyOutcomeCount,
    evidenceOnlyOutcomes: curriculumData.evidenceOnlyOutcomeCount,
    plannedAndEvidencedOutcomes: curriculumData.plannedAndEvidencedOutcomeCount,
    planLinks: curriculumData.totalPlanLinks,
    evidenceLinks: curriculumData.totalEvidenceLinks,
    secureOutcomes: curriculumData.statusCounts.secure,
    trackedOutcomes: curriculumData.trackedOutcomeCount,
    uncoveredOutcomes: Math.max(
      curriculumData.totalOutcomes - curriculumData.evidenceLinkedOutcomeCount,
      0,
    ),
    planningAheadAreas,
    evidenceAheadAreas,
    strongestAreas,
    weakestAreas,
  };
}

export function buildReportReadinessScore(input: {
  selectedStudentId: string;
  curriculumCoverage: CurriculumCoverage;
  plannerActionCount: number;
  selectedAreasCount: number;
  selectedEvidenceCount: number;
  selectedCoreCount: number;
  selectedAppendixCount: number;
  includeAppendix: boolean;
  includeReadinessNotes: boolean;
  notesText: string;
  draftId: string;
  reportMode: ReportMode;
}) {
  const {
    selectedStudentId,
    curriculumCoverage,
    plannerActionCount,
    selectedAreasCount,
    selectedEvidenceCount,
    selectedCoreCount,
    selectedAppendixCount,
    includeAppendix,
    includeReadinessNotes,
    notesText,
    draftId,
    reportMode,
  } = input;

  let score = 12;
  if (selectedStudentId) score += 10;
  if (curriculumCoverage.ready) score += 10;
  if (curriculumCoverage.totalOutcomes > 0) score += 6;
  if (curriculumCoverage.plannedOutcomes >= 8) score += 10;
  else if (curriculumCoverage.plannedOutcomes >= 4) score += 6;
  else if (curriculumCoverage.plannedOutcomes >= 1) score += 3;
  if (curriculumCoverage.linkedOutcomes >= 8) score += 16;
  else if (curriculumCoverage.linkedOutcomes >= 4) score += 12;
  else if (curriculumCoverage.linkedOutcomes >= 1) score += 6;
  if (curriculumCoverage.plannedAndEvidencedOutcomes >= 6) score += 12;
  else if (curriculumCoverage.plannedAndEvidencedOutcomes >= 3) score += 8;
  else if (curriculumCoverage.plannedAndEvidencedOutcomes >= 1) score += 4;
  if (curriculumCoverage.plannedOnlyOutcomes > 0) score += 2;
  if (curriculumCoverage.evidenceOnlyOutcomes > 0) score += 2;
  if (curriculumCoverage.secureOutcomes >= 3) score += 10;
  else if (curriculumCoverage.secureOutcomes >= 1) score += 6;
  if (plannerActionCount) score += 6;
  if (selectedAreasCount >= 4) score += 8;
  if (selectedEvidenceCount >= 4) score += 10;
  else if (selectedEvidenceCount >= 2) score += 6;
  else if (selectedEvidenceCount >= 1) score += 3;
  if (selectedCoreCount >= 2) score += 5;
  if (includeAppendix && selectedAppendixCount >= 1) score += 3;
  if (includeReadinessNotes) score += 4;
  if (notesText.trim().length >= 20) score += 4;
  if (draftId) score += 4;
  if (reportMode === "authority-ready") score += 2;
  return Math.min(score, 100);
}

export function interpretReadiness(score: number): {
  label: string;
  tone: ReadinessTone;
  message: string;
  action: string;
} {
  if (score >= 85) {
    return {
      label: "Ready",
      tone: "success",
      message:
        "This report is in a strong position. It has enough structure and evidence to save confidently and move into output.",
      action: "You are ready to save this draft and open the report output.",
    };
  }

  if (score >= 65) {
    return {
      label: "Developing",
      tone: "info",
      message:
        "This report is close. A little more balance, evidence selection, or a short note will make it feel much stronger.",
      action: "Strengthen one or two weak areas, then save the draft.",
    };
  }

  if (score >= 45) {
    return {
      label: "Early",
      tone: "warning",
      message:
        "The report structure is taking shape, but it still needs stronger evidence anchors before it will feel calm and defensible.",
      action: "Select stronger evidence and broaden the coverage mix slightly.",
    };
  }

  return {
    label: "Not ready",
    tone: "danger",
    message:
      "This report still needs its basic foundations. Start with a child, evidence, and a clearer area mix.",
    action: "Choose a child and select evidence to start building a real draft object.",
  };
}

export function buildParentLanguageSummary(input: {
  selectedStudentId: string;
  curriculumCoverage: CurriculumCoverage;
  studentEvidenceCount: number;
  selectedEvidenceCount: number;
  notesText: string;
  draftId: string;
}): ParentLanguageSummary {
  const {
    selectedStudentId,
    curriculumCoverage,
    studentEvidenceCount,
    selectedEvidenceCount,
    notesText,
    draftId,
  } = input;

  if (!selectedStudentId) {
    return {
      overall:
        "Choose a learner first so EduDecks can build a clear picture from real planning, evidence, and curriculum links.",
      strengths:
        "Once a learner is selected, this page will show where planning and evidence are already supporting the report.",
      nextStep: "Start by selecting the learner you want this report to describe.",
    };
  }

  if (!curriculumCoverage.ready && curriculumCoverage.reason === "no-curriculum") {
    return {
      overall:
        "There is not enough curriculum context yet to build a strong report summary for this learner.",
      strengths:
        "The learner is in the family workspace, but curriculum selection still needs to be finished before the report can interpret coverage properly.",
      nextStep:
        "Finish curriculum setup in Settings so planning and evidence can be read against the right outcomes.",
    };
  }

  if (!curriculumCoverage.ready && curriculumCoverage.reason === "no-outcomes") {
    return {
      overall:
        "This learner has a curriculum selection, but there are no seeded outcomes available yet for the chosen level.",
      strengths:
        "The core report path is ready, but the curriculum map does not have enough structure yet to support useful coverage language.",
      nextStep:
        "Seed the selected curriculum level so EduDecks can turn planning and evidence into a meaningful summary.",
    };
  }

  if (
    curriculumCoverage.ready &&
    curriculumCoverage.plannedOutcomes === 0 &&
    curriculumCoverage.linkedOutcomes === 0
  ) {
    return {
      overall:
        "You are still at an early stage of building a clear learning record for this report.",
      strengths:
        "The report hub is ready, but there are no curriculum-linked planner items or evidence links yet.",
      nextStep:
        "Link some planning in Planner and some evidence in Capture so the report has real curriculum support to work from.",
    };
  }

  if (
    curriculumCoverage.ready &&
    curriculumCoverage.plannedOutcomes > 0 &&
    curriculumCoverage.linkedOutcomes === 0
  ) {
    const planningAreas = joinNatural(curriculumCoverage.planningAheadAreas.slice(0, 2));
    return {
      overall: planningAreas
        ? `Planning is taking shape well, especially in ${planningAreas}, but evidence has not caught up yet.`
        : "Planning is taking shape well, but evidence has not caught up yet.",
      strengths:
        "There is clear intention behind the learner's work, which gives the report a solid starting point.",
      nextStep:
        "Capture one or two strong pieces of work and link them to the planned outcomes so the report feels more grounded.",
    };
  }

  if (curriculumCoverage.ready && curriculumCoverage.plannedAndEvidencedOutcomes > 0) {
    const strongAreas = joinNatural(curriculumCoverage.strongestAreas.slice(0, 2));
    const planningAheadAreas = joinNatural(
      curriculumCoverage.planningAheadAreas.slice(0, 2),
    );
    const evidenceAheadAreas = joinNatural(
      curriculumCoverage.evidenceAheadAreas.slice(0, 2),
    );

    return {
      overall: strongAreas
        ? `Planning and evidence are starting to line up well in ${strongAreas}, which gives this report a more trustworthy base.`
        : "Planning and evidence are starting to line up well, which gives this report a more trustworthy base.",
      strengths:
        curriculumCoverage.plannedAndEvidencedOutcomes >= 3
          ? "There is now a meaningful overlap between what was intended and what has been captured, so the learner's story is becoming clearer."
          : "There is early overlap between planned learning and captured evidence, which is a good sign that the record is becoming more complete.",
      nextStep: planningAheadAreas
        ? `Add a little more evidence in ${planningAheadAreas} so the thinner planned areas catch up.`
        : evidenceAheadAreas
          ? `Link a little more forward planning around ${evidenceAheadAreas} so intention and proof stay aligned.`
          : "Keep building with a few more well-chosen evidence links so the strongest areas are matched by broader coverage.",
    };
  }

  if (curriculumCoverage.ready && curriculumCoverage.linkedOutcomes > 0) {
    const evidenceAheadAreas = joinNatural(
      curriculumCoverage.evidenceAheadAreas.slice(0, 2),
    );
    const weakAreas = joinNatural(curriculumCoverage.weakestAreas.slice(0, 2));
    return {
      overall: evidenceAheadAreas
        ? `There is meaningful evidence of learning, including growth in ${evidenceAheadAreas}, but planning is still catching up.`
        : "There is meaningful evidence of learning, but planning is still catching up in places.",
      strengths:
        "The learner already has real proof of progress recorded, so the report does not need to start from scratch.",
      nextStep: weakAreas
        ? `Add a little more planning and evidence around ${weakAreas} so the report feels more balanced.`
        : "Link upcoming planner items to outcomes so the report can show intention as clearly as proof.",
    };
  }

  return {
    overall: studentEvidenceCount
      ? "A learning record is starting to form, but it still needs stronger curriculum links before the report will feel settled."
      : "There is not enough linked planning and evidence yet to build a strong summary.",
    strengths: selectedEvidenceCount
      ? "You already have some chosen evidence in the report builder, which gives you a useful starting point."
      : "The report structure is ready to use once more curriculum-linked activity is recorded.",
    nextStep: notesText.trim() && draftId
      ? "Keep strengthening the thinner areas so the saved draft feels calmer and more complete."
      : "Once a little more planning and evidence are linked, save the draft so you have a reusable report base to keep improving.",
  };
}
