export const MY_CURRICULUM_SOURCE = "my-curriculum" as const;
export const MY_PATHWAYS_SOURCE = "my-pathways" as const;

const LEARNING_AREA_KEY_PREFIX = "learning-area:";
const LEARNING_AREA_LABEL_PREFIX = "learning-area-label:";
const CURRICULUM_ELEMENT_KEY_PREFIX = "curriculum-element:";
const CURRICULUM_ELEMENT_LABEL_PREFIX = "curriculum-element-label:";
const AUTHORITY_AREA_KEY_PREFIX = "authority-evidence-area:";
const AUTHORITY_AREA_LABEL_PREFIX = "authority-evidence-area-label:";
const SOURCE_PREFIX = "source:";
const PATHWAY_SOURCE_PREFIX = "pathway-source:";
const PATHWAY_SUBJECT_KEY_PREFIX = "pathway-subject-key:";
const PATHWAY_SUBJECT_LABEL_PREFIX = "pathway-subject-label:";
const PATHWAY_KEY_PREFIX = "pathway-key:";
const PATHWAY_LABEL_PREFIX = "pathway-label:";
const PATHWAY_STAGE_KEY_PREFIX = "pathway-stage-key:";
const PATHWAY_STAGE_LABEL_PREFIX = "pathway-stage-label:";
const PATHWAY_STEP_ID_PREFIX = "pathway-step-id:";
const PATHWAY_STEP_KEY_PREFIX = "pathway-step-key:";
const PATHWAY_STEP_NUMBER_PREFIX = "pathway-step-number:";
const PATHWAY_STEP_TITLE_PREFIX = "pathway-step-title:";
const PATHWAY_STEP_MEANING_PREFIX = "pathway-step-meaning:";
const PATHWAY_SKILL_FOCUS_PREFIX = "pathway-skill-focus:";
const PATHWAY_STATUS_PREFIX = "pathway-status:";

const CURRICULUM_CONTEXT_PREFIXES = [
  LEARNING_AREA_KEY_PREFIX,
  LEARNING_AREA_LABEL_PREFIX,
  CURRICULUM_ELEMENT_KEY_PREFIX,
  CURRICULUM_ELEMENT_LABEL_PREFIX,
  AUTHORITY_AREA_KEY_PREFIX,
  AUTHORITY_AREA_LABEL_PREFIX,
  SOURCE_PREFIX,
];

const PATHWAY_CONTEXT_PREFIXES = [
  PATHWAY_SOURCE_PREFIX,
  PATHWAY_SUBJECT_KEY_PREFIX,
  PATHWAY_SUBJECT_LABEL_PREFIX,
  PATHWAY_KEY_PREFIX,
  PATHWAY_LABEL_PREFIX,
  PATHWAY_STAGE_KEY_PREFIX,
  PATHWAY_STAGE_LABEL_PREFIX,
  PATHWAY_STEP_ID_PREFIX,
  PATHWAY_STEP_KEY_PREFIX,
  PATHWAY_STEP_NUMBER_PREFIX,
  PATHWAY_STEP_TITLE_PREFIX,
  PATHWAY_STEP_MEANING_PREFIX,
  PATHWAY_SKILL_FOCUS_PREFIX,
  PATHWAY_STATUS_PREFIX,
];

export type CleanCurriculumCaptureContext = {
  source: typeof MY_CURRICULUM_SOURCE;
  learningAreaKey?: string | null;
  learningAreaLabel?: string | null;
  curriculumElementKey?: string | null;
  curriculumElementLabel?: string | null;
  authorityEvidenceAreaKey?: string | null;
  authorityEvidenceAreaLabel?: string | null;
};

export type CleanPathwayCaptureContext = {
  source: typeof MY_PATHWAYS_SOURCE;
  subjectKey?: string | null;
  subjectLabel?: string | null;
  pathwayKey?: string | null;
  pathwayLabel?: string | null;
  stageKey?: string | null;
  stageLabel?: string | null;
  pathwayStepId?: string | null;
  stepKey?: string | null;
  stepNumber?: string | null;
  stepTitle?: string | null;
  stepMeaning?: string | null;
  skillFocus?: string | null;
  observedSkillStatus?: string | null;
};

type SearchParamsReader = {
  get(name: string): string | null;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeNullString(value: unknown) {
  const text = safe(value);
  return text || null;
}

function encodeNodeValue(value: string) {
  return encodeURIComponent(value);
}

function decodeNodeValue(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function hasContextValue(context: Partial<CleanCurriculumCaptureContext>) {
  return Boolean(
    safe(context.learningAreaKey) ||
      safe(context.learningAreaLabel) ||
      safe(context.curriculumElementKey) ||
      safe(context.curriculumElementLabel) ||
      safe(context.authorityEvidenceAreaKey) ||
      safe(context.authorityEvidenceAreaLabel),
  );
}

function hasPathwayContextValue(context: Partial<CleanPathwayCaptureContext>) {
  return Boolean(
    safe(context.subjectKey) ||
      safe(context.subjectLabel) ||
      safe(context.pathwayKey) ||
      safe(context.pathwayLabel) ||
      safe(context.stageKey) ||
      safe(context.stageLabel) ||
      safe(context.pathwayStepId) ||
      safe(context.stepKey) ||
      safe(context.stepNumber) ||
      safe(context.stepTitle) ||
      safe(context.stepMeaning) ||
      safe(context.skillFocus) ||
      safe(context.observedSkillStatus),
  );
}

function dedupeNodeIds(nodeIds: string[]) {
  return [...new Set(nodeIds.filter((nodeId) => Boolean(safe(nodeId))))];
}

export function buildCurriculumCaptureContext(
  input: Partial<CleanCurriculumCaptureContext>,
): CleanCurriculumCaptureContext | null {
  const nextContext: CleanCurriculumCaptureContext = {
    source: MY_CURRICULUM_SOURCE,
    learningAreaKey: normalizeNullString(input.learningAreaKey),
    learningAreaLabel: normalizeNullString(input.learningAreaLabel),
    curriculumElementKey: normalizeNullString(input.curriculumElementKey),
    curriculumElementLabel: normalizeNullString(input.curriculumElementLabel),
    authorityEvidenceAreaKey: normalizeNullString(input.authorityEvidenceAreaKey),
    authorityEvidenceAreaLabel: normalizeNullString(input.authorityEvidenceAreaLabel),
  };

  if (!hasContextValue(nextContext)) {
    return null;
  }

  return nextContext;
}

export function buildPathwayCaptureContext(
  input: Partial<CleanPathwayCaptureContext>,
): CleanPathwayCaptureContext | null {
  const nextContext: CleanPathwayCaptureContext = {
    source: MY_PATHWAYS_SOURCE,
    subjectKey: normalizeNullString(input.subjectKey),
    subjectLabel: normalizeNullString(input.subjectLabel),
    pathwayKey: normalizeNullString(input.pathwayKey),
    pathwayLabel: normalizeNullString(input.pathwayLabel),
    stageKey: normalizeNullString(input.stageKey),
    stageLabel: normalizeNullString(input.stageLabel),
    pathwayStepId: normalizeNullString(input.pathwayStepId),
    stepKey: normalizeNullString(input.stepKey),
    stepNumber: normalizeNullString(input.stepNumber),
    stepTitle: normalizeNullString(input.stepTitle),
    stepMeaning: normalizeNullString(input.stepMeaning),
    skillFocus: normalizeNullString(input.skillFocus),
    observedSkillStatus: normalizeNullString(input.observedSkillStatus),
  };

  if (!hasPathwayContextValue(nextContext)) {
    return null;
  }

  return nextContext;
}

export function parseCurriculumCaptureContextFromSearchParams(
  searchParams: SearchParamsReader,
) {
  const source = safe(searchParams.get("source"));
  const nextContext = buildCurriculumCaptureContext({
    learningAreaKey: searchParams.get("learningArea"),
    learningAreaLabel: searchParams.get("learningAreaLabel"),
    curriculumElementKey: searchParams.get("curriculumElement"),
    curriculumElementLabel: searchParams.get("curriculumElementLabel"),
    authorityEvidenceAreaKey: searchParams.get("authorityEvidenceArea"),
    authorityEvidenceAreaLabel: searchParams.get("authorityEvidenceAreaLabel"),
  });

  if (!nextContext) {
    return null;
  }

  if (source && source !== MY_CURRICULUM_SOURCE) {
    return null;
  }

  return nextContext;
}

export function parsePathwayCaptureContextFromSearchParams(
  searchParams: SearchParamsReader,
) {
  const source = safe(searchParams.get("source"));
  if (source !== MY_PATHWAYS_SOURCE) {
    return null;
  }

  return buildPathwayCaptureContext({
    subjectKey: searchParams.get("subjectKey") || searchParams.get("subject"),
    subjectLabel: searchParams.get("subjectLabel"),
    pathwayKey: searchParams.get("pathwayKey") || searchParams.get("pathway"),
    pathwayLabel: searchParams.get("pathwayLabel"),
    stageKey: searchParams.get("stageKey") || searchParams.get("stage"),
    stageLabel: searchParams.get("stageLabel"),
    pathwayStepId: searchParams.get("pathwayStepId"),
    stepKey: searchParams.get("stepKey"),
    stepNumber: searchParams.get("stepNumber"),
    stepTitle: searchParams.get("stepTitle"),
    stepMeaning: searchParams.get("stepMeaning"),
    skillFocus: searchParams.get("skillFocus"),
    observedSkillStatus: searchParams.get("pathwayStatus"),
  });
}

export function buildCurriculumCaptureSearchParams(
  context: CleanCurriculumCaptureContext,
  options: {
    learnerId?: string | null;
    programId?: string | null;
    calendarItemId?: string | null;
    observedOn?: string | null;
  } = {},
) {
  const params = new URLSearchParams();
  params.set("source", MY_CURRICULUM_SOURCE);

  if (safe(options.learnerId)) {
    params.set("learner_id", safe(options.learnerId));
  }

  if (safe(options.programId)) {
    params.set("program_id", safe(options.programId));
  }

  if (safe(options.calendarItemId)) {
    params.set("calendar_item_id", safe(options.calendarItemId));
  }

  if (safe(options.observedOn)) {
    params.set("observed_on", safe(options.observedOn));
  }

  if (safe(context.learningAreaKey)) {
    params.set("learningArea", safe(context.learningAreaKey));
  }

  if (safe(context.learningAreaLabel)) {
    params.set("learningAreaLabel", safe(context.learningAreaLabel));
  }

  if (safe(context.curriculumElementKey)) {
    params.set("curriculumElement", safe(context.curriculumElementKey));
  }

  if (safe(context.curriculumElementLabel)) {
    params.set("curriculumElementLabel", safe(context.curriculumElementLabel));
  }

  if (safe(context.authorityEvidenceAreaKey)) {
    params.set("authorityEvidenceArea", safe(context.authorityEvidenceAreaKey));
  }

  if (safe(context.authorityEvidenceAreaLabel)) {
    params.set("authorityEvidenceAreaLabel", safe(context.authorityEvidenceAreaLabel));
  }

  return params;
}

export function buildPathwayCaptureSearchParams(
  context: CleanPathwayCaptureContext,
  options: {
    learnerId?: string | null;
    learningAreaKey?: string | null;
    learningAreaLabel?: string | null;
  } = {},
) {
  const params = new URLSearchParams();
  params.set("source", MY_PATHWAYS_SOURCE);

  if (safe(options.learnerId)) {
    params.set("learnerId", safe(options.learnerId));
  }

  if (safe(options.learningAreaKey)) {
    params.set("learningArea", safe(options.learningAreaKey));
  }

  if (safe(options.learningAreaLabel)) {
    params.set("learningAreaLabel", safe(options.learningAreaLabel));
  }

  if (safe(context.subjectKey)) {
    params.set("subjectKey", safe(context.subjectKey));
  }

  if (safe(context.subjectLabel)) {
    params.set("subjectLabel", safe(context.subjectLabel));
  }

  if (safe(context.pathwayKey)) {
    params.set("pathwayKey", safe(context.pathwayKey));
  }

  if (safe(context.pathwayLabel)) {
    params.set("pathwayLabel", safe(context.pathwayLabel));
  }

  if (safe(context.stageKey)) {
    params.set("stageKey", safe(context.stageKey));
  }

  if (safe(context.stageLabel)) {
    params.set("stageLabel", safe(context.stageLabel));
  }

  if (safe(context.pathwayStepId)) {
    params.set("pathwayStepId", safe(context.pathwayStepId));
  }

  if (safe(context.stepKey)) {
    params.set("stepKey", safe(context.stepKey));
  }

  if (safe(context.stepNumber)) {
    params.set("stepNumber", safe(context.stepNumber));
  }

  if (safe(context.stepTitle)) {
    params.set("stepTitle", safe(context.stepTitle));
  }

  if (safe(context.stepMeaning)) {
    params.set("stepMeaning", safe(context.stepMeaning));
  }

  if (safe(context.skillFocus)) {
    params.set("skillFocus", safe(context.skillFocus));
  }

  if (safe(context.observedSkillStatus)) {
    params.set("pathwayStatus", safe(context.observedSkillStatus));
  }

  return params;
}

export function encodeCurriculumContextNodeIds(
  existingNodeIds: string[],
  context: CleanCurriculumCaptureContext | null,
) {
  const preservedNodeIds = existingNodeIds.filter(
    (nodeId) =>
      !CURRICULUM_CONTEXT_PREFIXES.some((prefix) => safe(nodeId).startsWith(prefix)),
  );

  if (!context) {
    return dedupeNodeIds(preservedNodeIds);
  }

  const curriculumNodeIds = [...preservedNodeIds, `${SOURCE_PREFIX}${MY_CURRICULUM_SOURCE}`];

  if (safe(context.learningAreaKey)) {
    curriculumNodeIds.push(
      `${LEARNING_AREA_KEY_PREFIX}${encodeNodeValue(safe(context.learningAreaKey))}`,
    );
  }

  if (safe(context.learningAreaLabel)) {
    curriculumNodeIds.push(
      `${LEARNING_AREA_LABEL_PREFIX}${encodeNodeValue(safe(context.learningAreaLabel))}`,
    );
  }

  if (safe(context.curriculumElementKey)) {
    curriculumNodeIds.push(
      `${CURRICULUM_ELEMENT_KEY_PREFIX}${encodeNodeValue(safe(context.curriculumElementKey))}`,
    );
  }

  if (safe(context.curriculumElementLabel)) {
    curriculumNodeIds.push(
      `${CURRICULUM_ELEMENT_LABEL_PREFIX}${encodeNodeValue(safe(context.curriculumElementLabel))}`,
    );
  }

  if (safe(context.authorityEvidenceAreaKey)) {
    curriculumNodeIds.push(
      `${AUTHORITY_AREA_KEY_PREFIX}${encodeNodeValue(safe(context.authorityEvidenceAreaKey))}`,
    );
  }

  if (safe(context.authorityEvidenceAreaLabel)) {
    curriculumNodeIds.push(
      `${AUTHORITY_AREA_LABEL_PREFIX}${encodeNodeValue(
        safe(context.authorityEvidenceAreaLabel),
      )}`,
    );
  }

  return dedupeNodeIds(curriculumNodeIds);
}

export function encodePathwayContextNodeIds(
  existingNodeIds: string[],
  context: CleanPathwayCaptureContext | null,
) {
  const preservedNodeIds = existingNodeIds.filter(
    (nodeId) =>
      !PATHWAY_CONTEXT_PREFIXES.some((prefix) => safe(nodeId).startsWith(prefix)),
  );

  if (!context) {
    return dedupeNodeIds(preservedNodeIds);
  }

  const pathwayNodeIds = [...preservedNodeIds, `${PATHWAY_SOURCE_PREFIX}${MY_PATHWAYS_SOURCE}`];

  if (safe(context.subjectKey)) {
    pathwayNodeIds.push(
      `${PATHWAY_SUBJECT_KEY_PREFIX}${encodeNodeValue(safe(context.subjectKey))}`,
    );
  }

  if (safe(context.subjectLabel)) {
    pathwayNodeIds.push(
      `${PATHWAY_SUBJECT_LABEL_PREFIX}${encodeNodeValue(safe(context.subjectLabel))}`,
    );
  }

  if (safe(context.pathwayKey)) {
    pathwayNodeIds.push(
      `${PATHWAY_KEY_PREFIX}${encodeNodeValue(safe(context.pathwayKey))}`,
    );
  }

  if (safe(context.pathwayLabel)) {
    pathwayNodeIds.push(
      `${PATHWAY_LABEL_PREFIX}${encodeNodeValue(safe(context.pathwayLabel))}`,
    );
  }

  if (safe(context.stageKey)) {
    pathwayNodeIds.push(
      `${PATHWAY_STAGE_KEY_PREFIX}${encodeNodeValue(safe(context.stageKey))}`,
    );
  }

  if (safe(context.stageLabel)) {
    pathwayNodeIds.push(
      `${PATHWAY_STAGE_LABEL_PREFIX}${encodeNodeValue(safe(context.stageLabel))}`,
    );
  }

  if (safe(context.pathwayStepId)) {
    pathwayNodeIds.push(
      `${PATHWAY_STEP_ID_PREFIX}${encodeNodeValue(safe(context.pathwayStepId))}`,
    );
  }

  if (safe(context.stepKey)) {
    pathwayNodeIds.push(
      `${PATHWAY_STEP_KEY_PREFIX}${encodeNodeValue(safe(context.stepKey))}`,
    );
  }

  if (safe(context.stepNumber)) {
    pathwayNodeIds.push(
      `${PATHWAY_STEP_NUMBER_PREFIX}${encodeNodeValue(safe(context.stepNumber))}`,
    );
  }

  if (safe(context.stepTitle)) {
    pathwayNodeIds.push(
      `${PATHWAY_STEP_TITLE_PREFIX}${encodeNodeValue(safe(context.stepTitle))}`,
    );
  }

  if (safe(context.stepMeaning)) {
    pathwayNodeIds.push(
      `${PATHWAY_STEP_MEANING_PREFIX}${encodeNodeValue(safe(context.stepMeaning))}`,
    );
  }

  if (safe(context.skillFocus)) {
    pathwayNodeIds.push(
      `${PATHWAY_SKILL_FOCUS_PREFIX}${encodeNodeValue(safe(context.skillFocus))}`,
    );
  }

  if (safe(context.observedSkillStatus)) {
    pathwayNodeIds.push(
      `${PATHWAY_STATUS_PREFIX}${encodeNodeValue(safe(context.observedSkillStatus))}`,
    );
  }

  return dedupeNodeIds(pathwayNodeIds);
}

export function parseCurriculumContextFromNodeIds(nodeIds: string[]) {
  let source = "";
  const parsed: Partial<CleanCurriculumCaptureContext> = {};

  for (const nodeId of nodeIds) {
    const normalizedNodeId = safe(nodeId);
    if (!normalizedNodeId) continue;

    if (normalizedNodeId.startsWith(SOURCE_PREFIX)) {
      source = safe(normalizedNodeId.slice(SOURCE_PREFIX.length));
      continue;
    }

    if (normalizedNodeId.startsWith(LEARNING_AREA_KEY_PREFIX)) {
      parsed.learningAreaKey = decodeNodeValue(
        normalizedNodeId.slice(LEARNING_AREA_KEY_PREFIX.length),
      );
      continue;
    }

    if (normalizedNodeId.startsWith(LEARNING_AREA_LABEL_PREFIX)) {
      parsed.learningAreaLabel = decodeNodeValue(
        normalizedNodeId.slice(LEARNING_AREA_LABEL_PREFIX.length),
      );
      continue;
    }

    if (normalizedNodeId.startsWith(CURRICULUM_ELEMENT_KEY_PREFIX)) {
      parsed.curriculumElementKey = decodeNodeValue(
        normalizedNodeId.slice(CURRICULUM_ELEMENT_KEY_PREFIX.length),
      );
      continue;
    }

    if (normalizedNodeId.startsWith(CURRICULUM_ELEMENT_LABEL_PREFIX)) {
      parsed.curriculumElementLabel = decodeNodeValue(
        normalizedNodeId.slice(CURRICULUM_ELEMENT_LABEL_PREFIX.length),
      );
      continue;
    }

    if (normalizedNodeId.startsWith(AUTHORITY_AREA_KEY_PREFIX)) {
      parsed.authorityEvidenceAreaKey = decodeNodeValue(
        normalizedNodeId.slice(AUTHORITY_AREA_KEY_PREFIX.length),
      );
      continue;
    }

    if (normalizedNodeId.startsWith(AUTHORITY_AREA_LABEL_PREFIX)) {
      parsed.authorityEvidenceAreaLabel = decodeNodeValue(
        normalizedNodeId.slice(AUTHORITY_AREA_LABEL_PREFIX.length),
      );
    }
  }

  if (!hasContextValue(parsed)) {
    return null;
  }

  if (source && source !== MY_CURRICULUM_SOURCE) {
    return null;
  }

  return buildCurriculumCaptureContext(parsed);
}

export function parsePathwayContextFromNodeIds(nodeIds: string[]) {
  let source = "";
  const parsed: Partial<CleanPathwayCaptureContext> = {};

  for (const nodeId of nodeIds) {
    const normalizedNodeId = safe(nodeId);
    if (!normalizedNodeId) continue;

    if (normalizedNodeId.startsWith(PATHWAY_SOURCE_PREFIX)) {
      source = safe(normalizedNodeId.slice(PATHWAY_SOURCE_PREFIX.length));
      continue;
    }

    if (normalizedNodeId.startsWith(PATHWAY_SUBJECT_KEY_PREFIX)) {
      parsed.subjectKey = decodeNodeValue(
        normalizedNodeId.slice(PATHWAY_SUBJECT_KEY_PREFIX.length),
      );
      continue;
    }

    if (normalizedNodeId.startsWith(PATHWAY_SUBJECT_LABEL_PREFIX)) {
      parsed.subjectLabel = decodeNodeValue(
        normalizedNodeId.slice(PATHWAY_SUBJECT_LABEL_PREFIX.length),
      );
      continue;
    }

    if (normalizedNodeId.startsWith(PATHWAY_KEY_PREFIX)) {
      parsed.pathwayKey = decodeNodeValue(
        normalizedNodeId.slice(PATHWAY_KEY_PREFIX.length),
      );
      continue;
    }

    if (normalizedNodeId.startsWith(PATHWAY_LABEL_PREFIX)) {
      parsed.pathwayLabel = decodeNodeValue(
        normalizedNodeId.slice(PATHWAY_LABEL_PREFIX.length),
      );
      continue;
    }

    if (normalizedNodeId.startsWith(PATHWAY_STAGE_KEY_PREFIX)) {
      parsed.stageKey = decodeNodeValue(
        normalizedNodeId.slice(PATHWAY_STAGE_KEY_PREFIX.length),
      );
      continue;
    }

    if (normalizedNodeId.startsWith(PATHWAY_STAGE_LABEL_PREFIX)) {
      parsed.stageLabel = decodeNodeValue(
        normalizedNodeId.slice(PATHWAY_STAGE_LABEL_PREFIX.length),
      );
      continue;
    }

    if (normalizedNodeId.startsWith(PATHWAY_STEP_ID_PREFIX)) {
      parsed.pathwayStepId = decodeNodeValue(
        normalizedNodeId.slice(PATHWAY_STEP_ID_PREFIX.length),
      );
      continue;
    }

    if (normalizedNodeId.startsWith(PATHWAY_STEP_KEY_PREFIX)) {
      parsed.stepKey = decodeNodeValue(
        normalizedNodeId.slice(PATHWAY_STEP_KEY_PREFIX.length),
      );
      continue;
    }

    if (normalizedNodeId.startsWith(PATHWAY_STEP_NUMBER_PREFIX)) {
      parsed.stepNumber = decodeNodeValue(
        normalizedNodeId.slice(PATHWAY_STEP_NUMBER_PREFIX.length),
      );
      continue;
    }

    if (normalizedNodeId.startsWith(PATHWAY_STEP_TITLE_PREFIX)) {
      parsed.stepTitle = decodeNodeValue(
        normalizedNodeId.slice(PATHWAY_STEP_TITLE_PREFIX.length),
      );
      continue;
    }

    if (normalizedNodeId.startsWith(PATHWAY_STEP_MEANING_PREFIX)) {
      parsed.stepMeaning = decodeNodeValue(
        normalizedNodeId.slice(PATHWAY_STEP_MEANING_PREFIX.length),
      );
      continue;
    }

    if (normalizedNodeId.startsWith(PATHWAY_SKILL_FOCUS_PREFIX)) {
      parsed.skillFocus = decodeNodeValue(
        normalizedNodeId.slice(PATHWAY_SKILL_FOCUS_PREFIX.length),
      );
      continue;
    }

    if (normalizedNodeId.startsWith(PATHWAY_STATUS_PREFIX)) {
      parsed.observedSkillStatus = decodeNodeValue(
        normalizedNodeId.slice(PATHWAY_STATUS_PREFIX.length),
      );
    }
  }

  if (!hasPathwayContextValue(parsed)) {
    return null;
  }

  if (source && source !== MY_PATHWAYS_SOURCE) {
    return null;
  }

  return buildPathwayCaptureContext(parsed);
}
