import type { WorksheetResource, WorksheetStepContext } from "@/lib/clean/resources/worksheetResources";

const ENGLISH_SUBJECT_KEY = "english" as const;
const ENGLISH_STRAND_KEY = "spelling-and-word-study";
const ENGLISH_STAGE_KEY = "foundation-kindergarten";
const ENGLISH_STAGE_DISPLAY = "Foundation / Kindergarten";
const ENGLISH_LOWER_PRIMARY_STAGE_KEY = "lower-primary";
const ENGLISH_LOWER_PRIMARY_STAGE_DISPLAY = "Lower Primary";

function additionalEnglishWorksheetResource(
  stepNumber: number,
  stepKey: string,
  title: string,
  fileName: string,
  stageKey: string = ENGLISH_STAGE_KEY,
  stageDisplay: string = ENGLISH_STAGE_DISPLAY,
): WorksheetResource {
  const pathwayStepId = `${ENGLISH_SUBJECT_KEY}::${ENGLISH_STRAND_KEY}::${stageKey}::${stepKey}`;
  const href = `/resources/worksheets/english/${ENGLISH_STRAND_KEY}/${stageKey}/${fileName}`;
  return {
    pathwayStepId,
    stepKey,
    subjectKey: ENGLISH_SUBJECT_KEY,
    strandKey: ENGLISH_STRAND_KEY,
    stageKey,
    stageDisplay,
    stepNumber,
    pathwayStepTitle: title,
    title,
    fileName,
    href,
    resourceType: "worksheet-pdf",
  };
}

const EXTENDED_ENGLISH_WORKSHEET_RESOURCES: WorksheetResource[] = ([
  [3, "ee-u001-consonant-digraphs", "Consonant Digraphs", "MYL-LIT-MORPH-EE-U001-Consonant-Digraphs-Worksheet.pdf"],
  [4, "ee-u002-ck-ng-qu", "CK NG QU", "MYL-LIT-MORPH-EE-U002-CK-NG-QU-Worksheet.pdf"],
  [5, "ee-u003-initial-consonant-blends", "Initial Consonant Blends", "MYL-LIT-MORPH-EE-U003-Initial-Consonant-Blends-Worksheet.pdf"],
  [6, "ee-u004-final-consonant-blends", "Final Consonant Blends", "MYL-LIT-MORPH-EE-U004-Final-Consonant-Blends-Worksheet.pdf"],
  [7, "ee-u005-long-vowels-silent-e", "Long Vowels Silent E", "MYL-LIT-MORPH-EE-U005-Long-Vowels-Silent-E-Worksheet.pdf"],
  [8, "ee-u006-common-vowel-teams", "Common Vowel Teams", "MYL-LIT-MORPH-EE-U006-Common-Vowel-Teams-Worksheet.pdf"],
  [9, "ee-u007-other-vowel-spellings", "Other Vowel Spellings", "MYL-LIT-MORPH-EE-U007-Other-Vowel-Spellings-Worksheet.pdf"],
  [10, "ee-u008-two-syllable-word-building", "Two-Syllable Word Building", "MYL-LIT-MORPH-EE-U008-Two-Syllable-Word-Building-Worksheet.pdf"],
  [11, "ee-u010-ed-ing", "ED ING", "MYL-LIT-MORPH-EE-U010-ED-ING-Worksheet.pdf"],
  [12, "ee-u011-er-est", "ER EST", "MYL-LIT-MORPH-EE-U011-ER-EST-Worksheet.pdf"],
  [13, "ee-u012-compound-words-and-base-words", "Compound Words and Base Words", "MYL-LIT-MORPH-EE-U012-Compound-Words-and-Base-Words-Worksheet.pdf"],
  [14, "ee-u009-plurals-s-es", "Plurals S ES", "MYL-LIT-MORPH-EE-U009-Plurals-S-ES-Worksheet.pdf"],
] as const).map(([stepNumber, stepKey, title, fileName]) =>
  additionalEnglishWorksheetResource(
    stepNumber,
    stepKey,
    title,
    fileName,
    ENGLISH_LOWER_PRIMARY_STAGE_KEY,
    ENGLISH_LOWER_PRIMARY_STAGE_DISPLAY,
  ),
);

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
  ...([
    [10, "kf-u007-short-vowel-o", "Short Vowel O", "MYL-LIT-MORPH-KF-U007-Short-Vowel-O-Worksheet.pdf"],
    [11, "kf-u008-short-vowel-u", "Short Vowel U", "MYL-LIT-MORPH-KF-U008-Short-Vowel-U-Worksheet.pdf"],
    [12, "kf-u009-short-vowel-e", "Short Vowel E", "MYL-LIT-MORPH-KF-U009-Short-Vowel-E-Worksheet.pdf"],
    [13, "kf-u010-cvc-word-practice", "CVC Word Practice", "MYL-LIT-MORPH-KF-U010-CVC-Word-Practice-Worksheet.pdf"],
    [14, "kf-u012-cvc-word-write", "CVC Word Write", "MYL-LIT-MORPH-KF-U012-CVC-Word-Write-Worksheet.pdf"],
    [15, "kf-u013-cvc-word-read-and-colour", "CVC Word Read and Colour", "MYL-LIT-MORPH-KF-U013-CVC-Word-Read-and-Colour-Worksheet.pdf"],
    [16, "kf-u014-cvc-word-sentences", "CVC Word Sentences", "MYL-LIT-MORPH-KF-U014-CVC-Word-Sentences-Worksheet.pdf"],
    [17, "kf-u015-cvc-word-spot-and-write", "CVC Word Spot and Write", "MYL-LIT-MORPH-KF-U015-CVC-Word-Spot-and-Write-Worksheet.pdf"],
    [18, "kf-u016-cvc-word-practice", "CVC Word Practice", "MYL-LIT-MORPH-KF-U016-CVC-Word-Practice-Worksheet.pdf"],
    [19, "kf-u017-cvc-word-sounds", "CVC Word Sounds", "MYL-LIT-MORPH-KF-U017-CVC-Word-Sounds-Worksheet.pdf"],
    [20, "kf-u018-cvc-word-match-and-sort", "CVC Word Match and Sort", "MYL-LIT-MORPH-KF-U018-CVC-Word-Match-and-Sort-Worksheet.pdf"],
    [21, "kf-u019-cvc-word-build-and-write", "CVC Word Build and Write", "MYL-LIT-MORPH-KF-U019-CVC-Word-Build-and-Write-Worksheet.pdf"],
    [22, "kf-u020-cvc-word-read-and-find", "CVC Word Read and Find", "MYL-LIT-MORPH-KF-U020-CVC-Word-Read-and-Find-Worksheet.pdf"],
  ] as const).map(([stepNumber, stepKey, title, fileName]) =>
    additionalEnglishWorksheetResource(stepNumber, stepKey, title, fileName),
  ),
  ...EXTENDED_ENGLISH_WORKSHEET_RESOURCES,
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
