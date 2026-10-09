import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import type { LearningEvidenceResultV1 } from "../learningEvidenceResult";

export const CAPTURED_LEARNING_EVIDENCE_SCHEMA =
  "mylearna-captured-learning-evidence" as const;
export const CAPTURED_LEARNING_EVIDENCE_SCHEMA_VERSION = 1 as const;

export const CAPTURED_LEARNING_EVIDENCE_SOURCE_TYPES = [
  "captured-photo",
  "captured-video",
  "work-sample",
  "parent-observation",
  "practical-observation",
  "note",
  "document-file",
] as const;

export type CapturedLearningEvidenceSourceType =
  (typeof CAPTURED_LEARNING_EVIDENCE_SOURCE_TYPES)[number];

export const CAPTURED_EVIDENCE_REVIEW_STATES = [
  "unreviewed",
  "reviewed",
  "confirmed-relevant",
  "not-relevant",
] as const;

export type CapturedEvidenceReviewState =
  (typeof CAPTURED_EVIDENCE_REVIEW_STATES)[number];

export type CapturedEvidenceConstructReference = {
  constructId: string;
  learningDomain: string;
  continuumId: string | null;
  constructName: string;
  authority: {
    authorityId: string;
    frameworkId: string;
    frameworkVersion: string;
    mappingVersion: string;
  };
};

export type CapturedEvidenceConstructLinkV1 = {
  linkId: string;
  evidenceId: string;
  familyId: string;
  learnerId: string;
  construct: CapturedEvidenceConstructReference;
  assignedBy: {
    kind: "human";
    actorId: string;
  };
  assignedAt: string;
  reviewState: CapturedEvidenceReviewState;
  reviewedByActorId: string | null;
  reviewedAt: string | null;
};

export type CapturedLearningEvidenceV1 = {
  schema: typeof CAPTURED_LEARNING_EVIDENCE_SCHEMA;
  schemaVersion: typeof CAPTURED_LEARNING_EVIDENCE_SCHEMA_VERSION;
  evidenceId: string;
  learnerId: string;
  familyId: string;
  sourceType: CapturedLearningEvidenceSourceType;
  capturedAt: string;
  createdAt: string | null;
  originatingSubsystem: "my-capture";
  artifactReferences: Array<{
    reference: string;
    kind: "image" | "video" | "document" | "file";
  }>;
  noteReference: {
    evidenceEntryId: string;
  } | null;
  learningArea: string | null;
  constructLinks: CapturedEvidenceConstructLinkV1[];
  provenance: {
    rawEvidenceRecordType: "evidence_entries";
    rawEvidenceRecordId: string;
    captureSource: string | null;
    createdByUserId: string;
  };
  reviewState: CapturedEvidenceReviewState;
  portfolioInclusion: "included" | "not-included";
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function artifactKind(reference: string) {
  const normalized = reference.toLowerCase().split("?")[0];
  if (/\.(?:png|jpe?g|gif|webp|heic|avif)$/.test(normalized)) return "image" as const;
  if (/\.(?:mp4|mov|webm|m4v|avi)$/.test(normalized)) return "video" as const;
  if (/\.(?:pdf|docx?|pages|pptx?|xlsx?|txt)$/.test(normalized)) return "document" as const;
  return "file" as const;
}

function deriveSourceType(
  entry: CleanEvidenceEntry,
): CapturedLearningEvidenceSourceType {
  const references = [...entry.attachmentUrls, entry.imageUrl].filter(
    (value): value is string => Boolean(safe(value)),
  );
  const kinds = references.map(artifactKind);
  if (kinds.includes("video")) return "captured-video";
  if (kinds.includes("image")) return "captured-photo";
  if (kinds.includes("document")) return "document-file";
  return safe(entry.whatHappened) ? "parent-observation" : "note";
}

export function constructReferenceFromLearningEvidenceResult(
  result: LearningEvidenceResultV1,
): CapturedEvidenceConstructReference {
  return {
    constructId: result.construct.constructId,
    learningDomain: result.construct.learningDomain,
    continuumId: result.construct.continuumId,
    constructName: result.construct.constructName,
    authority: { ...result.construct.authority },
  };
}

export function adaptCleanCaptureToLearningEvidence(
  entry: CleanEvidenceEntry,
  options: {
    sourceType?: CapturedLearningEvidenceSourceType;
    constructLinks?: CapturedEvidenceConstructLinkV1[];
    reviewState?: CapturedEvidenceReviewState;
  } = {},
): CapturedLearningEvidenceV1 {
  const references = [...new Set(
    [...entry.attachmentUrls, entry.imageUrl]
      .map(safe)
      .filter(Boolean),
  )];

  return {
    schema: CAPTURED_LEARNING_EVIDENCE_SCHEMA,
    schemaVersion: CAPTURED_LEARNING_EVIDENCE_SCHEMA_VERSION,
    evidenceId: entry.id,
    learnerId: entry.learnerId,
    familyId: entry.familyId,
    sourceType: options.sourceType ?? deriveSourceType(entry),
    capturedAt: entry.observedOn,
    createdAt: entry.createdAt,
    originatingSubsystem: "my-capture",
    artifactReferences: references.map((reference) => ({
      reference,
      kind: artifactKind(reference),
    })),
    noteReference: safe(entry.whatHappened)
      ? { evidenceEntryId: entry.id }
      : null,
    learningArea: entry.learningArea,
    constructLinks: [...(options.constructLinks ?? [])],
    provenance: {
      rawEvidenceRecordType: "evidence_entries",
      rawEvidenceRecordId: entry.id,
      captureSource: entry.captureSource ?? null,
      createdByUserId: entry.createdByUserId,
    },
    reviewState: options.reviewState ?? "unreviewed",
    portfolioInclusion: entry.includeInPortfolio ? "included" : "not-included",
  };
}

function canonicalConstructReference(reference: CapturedEvidenceConstructReference) {
  return Boolean(
    safe(reference.constructId) &&
      safe(reference.learningDomain) &&
      safe(reference.constructName) &&
      safe(reference.authority.authorityId) &&
      safe(reference.authority.frameworkId) &&
      safe(reference.authority.frameworkVersion) &&
      safe(reference.authority.mappingVersion),
  );
}

export function linkCapturedEvidenceToConstruct(input: {
  evidence: CapturedLearningEvidenceV1;
  construct: CapturedEvidenceConstructReference;
  actorId: string;
  assignedAt: string;
  familyId: string;
  learnerId: string;
  reviewState?: CapturedEvidenceReviewState;
}): CapturedLearningEvidenceV1 {
  if (
    input.evidence.familyId !== input.familyId ||
    input.evidence.learnerId !== input.learnerId
  ) {
    throw new Error("Captured evidence and learner must belong to the same family envelope.");
  }
  if (!safe(input.actorId)) throw new Error("A human assigning actor is required.");
  if (!canonicalConstructReference(input.construct)) {
    throw new Error("A canonical construct reference is required.");
  }
  if (!Number.isFinite(Date.parse(input.assignedAt))) {
    throw new Error("A valid construct-assignment timestamp is required.");
  }

  const identity = `${input.evidence.evidenceId}::${input.learnerId}::${input.construct.constructId}::${input.construct.authority.mappingVersion}`;
  const link: CapturedEvidenceConstructLinkV1 = {
    linkId: `capture-construct-link:${identity}`,
    evidenceId: input.evidence.evidenceId,
    familyId: input.familyId,
    learnerId: input.learnerId,
    construct: structuredClone(input.construct),
    assignedBy: { kind: "human", actorId: input.actorId },
    assignedAt: new Date(input.assignedAt).toISOString(),
    reviewState: input.reviewState ?? "unreviewed",
    reviewedByActorId: null,
    reviewedAt: null,
  };

  const withoutSameIdentity = input.evidence.constructLinks.filter(
    (candidate) => candidate.linkId !== link.linkId,
  );
  return {
    ...input.evidence,
    constructLinks: [...withoutSameIdentity, link],
  };
}

export function reviewCapturedEvidenceConstructLink(input: {
  evidence: CapturedLearningEvidenceV1;
  linkId: string;
  reviewState: CapturedEvidenceReviewState;
  actorId: string;
  reviewedAt: string;
}) {
  if (!safe(input.actorId)) throw new Error("A human reviewing actor is required.");
  if (!Number.isFinite(Date.parse(input.reviewedAt))) {
    throw new Error("A valid review timestamp is required.");
  }
  let matched = false;
  const constructLinks = input.evidence.constructLinks.map((link) => {
    if (link.linkId !== input.linkId) return link;
    matched = true;
    return {
      ...link,
      reviewState: input.reviewState,
      reviewedByActorId: input.actorId,
      reviewedAt: new Date(input.reviewedAt).toISOString(),
    };
  });
  if (!matched) throw new Error("Captured evidence construct link was not found.");
  return { ...input.evidence, constructLinks };
}
