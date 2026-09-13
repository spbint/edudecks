import type { WorksheetResource, WorksheetStepContext } from "@/lib/clean/resources/worksheetResources";

const ENGLISH_SUBJECT_KEY = "english" as const;
const ENGLISH_STRAND_KEY = "spelling-and-word-study";
const ENGLISH_STAGE_KEY = "foundation-kindergarten";
const ENGLISH_STAGE_DISPLAY = "Foundation / Kindergarten";

const resources: WorksheetResource[] = [
  {
    pathwayStepId: `${ENGLISH_SUBJECT_KEY}::${ENGLISH_STRAND_KEY}::${ENGLISH_STAGE_KEY}::kf-u001-beginning-sounds`,
    stepKey: "kf-u001-beginning-sounds",
    subjectKey: ENGLISH_SUBJECT_KEY,
    strandKey: ENGLISH_STRAND_KEY,
    stageKey: ENGLISH_STAGE_KEY,
    stageDisplay: ENGLISH_STAGE_DISPLAY,
    stepNumber: 3,
    pathwayStepTitle: "Beginning Sounds",
    title: "Beginning Sounds",
    fileName: "MYL-LIT-MORPH-KF-U001-Beginning-Sounds-Worksheet.pdf",
    href: `/resources/worksheets/english/${ENGLISH_STRAND_KEY}/${ENGLISH_STAGE_KEY}/MYL-LIT-MORPH-KF-U001-Beginning-Sounds-Worksheet.pdf`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId: `${ENGLISH_SUBJECT_KEY}::${ENGLISH_STRAND_KEY}::${ENGLISH_STAGE_KEY}::kf-u002-ending-sounds`,
    stepKey: "kf-u002-ending-sounds",
    subjectKey: ENGLISH_SUBJECT_KEY,
    strandKey: ENGLISH_STRAND_KEY,
    stageKey: ENGLISH_STAGE_KEY,
    stageDisplay: ENGLISH_STAGE_DISPLAY,
    stepNumber: 4,
    pathwayStepTitle: "Ending Sounds",
    title: "Ending Sounds",
    fileName: "MYL-LIT-MORPH-KF-U002-Ending-Sounds-Worksheet.pdf",
    href: `/resources/worksheets/english/${ENGLISH_STRAND_KEY}/${ENGLISH_STAGE_KEY}/MYL-LIT-MORPH-KF-U002-Ending-Sounds-Worksheet.pdf`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId: `${ENGLISH_SUBJECT_KEY}::${ENGLISH_STRAND_KEY}::${ENGLISH_STAGE_KEY}::kf-u003-segment-and-blend`,
    stepKey: "kf-u003-segment-and-blend",
    subjectKey: ENGLISH_SUBJECT_KEY,
    strandKey: ENGLISH_STRAND_KEY,
    stageKey: ENGLISH_STAGE_KEY,
    stageDisplay: ENGLISH_STAGE_DISPLAY,
    stepNumber: 5,
    pathwayStepTitle: "Segment and Blend",
    title: "Segment and Blend",
    fileName: "MYL-LIT-MORPH-KF-U003-Segment-and-Blend-Worksheet.pdf",
    href: `/resources/worksheets/english/${ENGLISH_STRAND_KEY}/${ENGLISH_STAGE_KEY}/MYL-LIT-MORPH-KF-U003-Segment-and-Blend-Worksheet.pdf`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId: `${ENGLISH_SUBJECT_KEY}::${ENGLISH_STRAND_KEY}::${ENGLISH_STAGE_KEY}::kf-u004-consonant-sounds`,
    stepKey: "kf-u004-consonant-sounds",
    subjectKey: ENGLISH_SUBJECT_KEY,
    strandKey: ENGLISH_STRAND_KEY,
    stageKey: ENGLISH_STAGE_KEY,
    stageDisplay: ENGLISH_STAGE_DISPLAY,
    stepNumber: 6,
    pathwayStepTitle: "Consonant Sounds",
    title: "Consonant Sounds",
    fileName: "MYL-LIT-MORPH-KF-U004-Consonant-Sounds-Worksheet.pdf",
    href: `/resources/worksheets/english/${ENGLISH_STRAND_KEY}/${ENGLISH_STAGE_KEY}/MYL-LIT-MORPH-KF-U004-Consonant-Sounds-Worksheet.pdf`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId: `${ENGLISH_SUBJECT_KEY}::${ENGLISH_STRAND_KEY}::${ENGLISH_STAGE_KEY}::kf-u011-cvc-word-match`,
    stepKey: "kf-u011-cvc-word-match",
    subjectKey: ENGLISH_SUBJECT_KEY,
    strandKey: ENGLISH_STRAND_KEY,
    stageKey: ENGLISH_STAGE_KEY,
    stageDisplay: ENGLISH_STAGE_DISPLAY,
    stepNumber: 9,
    pathwayStepTitle: "CVC Word Match",
    title: "CVC Word Match",
    fileName: "MYL-LIT-MORPH-KF-U011-CVC-Word-Match-Worksheet.pdf",
    href: `/resources/worksheets/english/${ENGLISH_STRAND_KEY}/${ENGLISH_STAGE_KEY}/MYL-LIT-MORPH-KF-U011-CVC-Word-Match-Worksheet.pdf`,
    resourceType: "worksheet-pdf",
  },
];

export const ENGLISH_WORKSHEET_RESOURCES = resources;

export function getEnglishWorksheetResourceForPathwayStep(
  context: WorksheetStepContext,
): WorksheetResource | null {
  const pathwayStepId = String(context.pathwayStepId ?? "").trim();
  const stepKey = String(context.stepKey ?? "").trim();
  const subjectKey = String(context.subjectKey ?? "").trim();
  const strandKey = String(context.strandKey ?? "").trim();
  const stageKey = String(context.stageKey ?? "").trim();

  const exactResource = resources.find((resource) => {
    if (pathwayStepId && resource.pathwayStepId === pathwayStepId) return true;
    return Boolean(stepKey) && resource.stepKey === stepKey && resource.subjectKey === subjectKey && resource.strandKey === strandKey && resource.stageKey === stageKey;
  });

  return exactResource || null;
}
