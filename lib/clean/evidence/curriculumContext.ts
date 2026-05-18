export const MY_CURRICULUM_SOURCE = "my-curriculum" as const;

const LEARNING_AREA_KEY_PREFIX = "learning-area:";
const LEARNING_AREA_LABEL_PREFIX = "learning-area-label:";
const CURRICULUM_ELEMENT_KEY_PREFIX = "curriculum-element:";
const CURRICULUM_ELEMENT_LABEL_PREFIX = "curriculum-element-label:";
const AUTHORITY_AREA_KEY_PREFIX = "authority-evidence-area:";
const AUTHORITY_AREA_LABEL_PREFIX = "authority-evidence-area-label:";
const SOURCE_PREFIX = "source:";

const CURRICULUM_CONTEXT_PREFIXES = [
  LEARNING_AREA_KEY_PREFIX,
  LEARNING_AREA_LABEL_PREFIX,
  CURRICULUM_ELEMENT_KEY_PREFIX,
  CURRICULUM_ELEMENT_LABEL_PREFIX,
  AUTHORITY_AREA_KEY_PREFIX,
  AUTHORITY_AREA_LABEL_PREFIX,
  SOURCE_PREFIX,
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
