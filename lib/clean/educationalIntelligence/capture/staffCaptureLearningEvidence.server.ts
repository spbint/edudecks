import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import type { LearningEvidenceResultV1 } from "../learningEvidenceResult";
import {
  CAPTURED_EVIDENCE_REVIEW_STATES,
  CAPTURED_LEARNING_EVIDENCE_SOURCE_TYPES,
  adaptCleanCaptureToLearningEvidence,
  type CapturedEvidenceConstructLinkV1,
  type CapturedEvidenceConstructReference,
  type CapturedEvidenceReviewState,
  type CapturedLearningEvidenceSourceType,
} from "./capturedLearningEvidence";
import { projectLearningEvidenceTimeline } from "./learningEvidenceTimeline";
import type {
  StaffCaptureEvidenceHistory,
  StaffCaptureEvidenceRequest,
} from "./staffCaptureLearningEvidence";
import {
  EI_STAGING_BRANCH_NAME,
  EI_STAGING_PROJECT_REF,
} from "../persistence/staffLearningEvidenceSmoke";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CONSTRUCT_PATTERN = /^[A-Za-z0-9][A-Za-z0-9:._-]{5,239}$/;
const LINK_KEYS = new Set([
  "operation",
  "familyId",
  "learnerId",
  "evidenceId",
  "constructId",
  "sourceType",
]);
const REVIEW_KEYS = new Set([
  "operation",
  "familyId",
  "learnerId",
  "evidenceId",
  "constructId",
  "reviewState",
]);

export class StaffCaptureLearningEvidenceError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "StaffCaptureLearningEvidenceError";
  }
}

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function requireUuid(value: unknown, label: string) {
  const candidate = clean(value);
  if (!UUID_PATTERN.test(candidate)) {
    throw new StaffCaptureLearningEvidenceError(`${label} is invalid.`, 400);
  }
  return candidate;
}

function requireConstructId(value: unknown) {
  const candidate = clean(value);
  if (!CONSTRUCT_PATTERN.test(candidate)) {
    throw new StaffCaptureLearningEvidenceError(
      "A canonical construct identity is required.",
      400,
    );
  }
  return candidate;
}

export function parseStaffCaptureEvidenceRequest(
  value: unknown,
): StaffCaptureEvidenceRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new StaffCaptureLearningEvidenceError("Invalid Capture evidence request.", 400);
  }
  const record = value as Record<string, unknown>;
  const common = {
    familyId: requireUuid(record.familyId, "Family"),
    learnerId: requireUuid(record.learnerId, "Learner"),
    evidenceId: requireUuid(record.evidenceId, "Capture evidence"),
    constructId: requireConstructId(record.constructId),
  };

  if (record.operation === "link-capture-evidence") {
    if (Object.keys(record).some((key) => !LINK_KEYS.has(key))) {
      throw new StaffCaptureLearningEvidenceError(
        "Educational interpretation cannot be submitted with Capture evidence.",
        400,
      );
    }
    if (
      !CAPTURED_LEARNING_EVIDENCE_SOURCE_TYPES.includes(
        record.sourceType as CapturedLearningEvidenceSourceType,
      )
    ) {
      throw new StaffCaptureLearningEvidenceError("Invalid evidence source type.", 400);
    }
    return {
      operation: "link-capture-evidence",
      ...common,
      sourceType: record.sourceType as CapturedLearningEvidenceSourceType,
    };
  }

  if (record.operation === "review-capture-evidence-link") {
    if (Object.keys(record).some((key) => !REVIEW_KEYS.has(key))) {
      throw new StaffCaptureLearningEvidenceError(
        "Only evidence relevance may be reviewed here.",
        400,
      );
    }
    if (
      !CAPTURED_EVIDENCE_REVIEW_STATES.includes(
        record.reviewState as CapturedEvidenceReviewState,
      )
    ) {
      throw new StaffCaptureLearningEvidenceError("Invalid evidence review state.", 400);
    }
    return {
      operation: "review-capture-evidence-link",
      ...common,
      reviewState: record.reviewState as CapturedEvidenceReviewState,
    };
  }

  throw new StaffCaptureLearningEvidenceError("Invalid Capture evidence operation.", 400);
}

type EvidenceRow = {
  id: string;
  family_id: string;
  learner_id: string;
  program_id: string | null;
  calendar_item_id: string | null;
  observed_on: string;
  title: string | null;
  what_happened: string;
  reflection: string | null;
  learning_area: string | null;
  curriculum_node_ids: unknown;
  attachment_urls: unknown;
  image_url: string | null;
  include_in_portfolio: boolean;
  include_in_report: boolean;
  created_by_user_id: string;
  capture_source: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type LinkRow = {
  id: string;
  family_id: string;
  learner_id: string;
  evidence_entry_id: string;
  evidence_source_type: CapturedLearningEvidenceSourceType;
  canonical_construct_id: string;
  learning_domain: string;
  continuum_id: string | null;
  construct_name: string;
  authority_id: string;
  framework_id: string;
  framework_version: string;
  curriculum_mapping_version: string;
  assigned_by_user_id: string;
  assigned_at: string;
  review_state: CapturedEvidenceReviewState;
  reviewed_by_user_id: string | null;
  reviewed_at: string | null;
};

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function toCleanEvidence(row: EvidenceRow): CleanEvidenceEntry {
  return {
    id: row.id,
    familyId: row.family_id,
    learnerId: row.learner_id,
    programId: row.program_id,
    calendarItemId: row.calendar_item_id,
    observedOn: row.observed_on,
    title: row.title,
    whatHappened: row.what_happened,
    reflection: row.reflection,
    learningArea: row.learning_area,
    curriculumNodeIds: strings(row.curriculum_node_ids),
    attachmentUrls: strings(row.attachment_urls),
    imageUrl: row.image_url,
    captureSource: row.capture_source,
    includeInPortfolio: row.include_in_portfolio,
    includeInReport: row.include_in_report,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function constructFromPayload(payload: unknown): CapturedEvidenceConstructReference | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const construct = (payload as { construct?: unknown }).construct;
  if (!construct || typeof construct !== "object" || Array.isArray(construct)) return null;
  const record = construct as Record<string, unknown>;
  const authorityValue = record.authority;
  if (!authorityValue || typeof authorityValue !== "object" || Array.isArray(authorityValue)) return null;
  const authority = authorityValue as Record<string, unknown>;
  const reference: CapturedEvidenceConstructReference = {
    constructId: clean(record.constructId),
    learningDomain: clean(record.learningDomain),
    continuumId: clean(record.continuumId) || null,
    constructName: clean(record.constructName),
    authority: {
      authorityId: clean(authority.authorityId),
      frameworkId: clean(authority.frameworkId),
      frameworkVersion: clean(authority.frameworkVersion),
      mappingVersion: clean(authority.mappingVersion),
    },
  };
  return Object.values(reference.authority).every(Boolean) &&
    reference.constructId && reference.learningDomain && reference.constructName
    ? reference
    : null;
}

function toLink(row: LinkRow): CapturedEvidenceConstructLinkV1 {
  return {
    linkId: row.id,
    evidenceId: row.evidence_entry_id,
    familyId: row.family_id,
    learnerId: row.learner_id,
    construct: {
      constructId: row.canonical_construct_id,
      learningDomain: row.learning_domain,
      continuumId: row.continuum_id,
      constructName: row.construct_name,
      authority: {
        authorityId: row.authority_id,
        frameworkId: row.framework_id,
        frameworkVersion: row.framework_version,
        mappingVersion: row.curriculum_mapping_version,
      },
    },
    assignedBy: { kind: "human", actorId: row.assigned_by_user_id },
    assignedAt: row.assigned_at,
    reviewState: row.review_state,
    reviewedByActorId: row.reviewed_by_user_id,
    reviewedAt: row.reviewed_at,
  };
}

async function requireOwnedEnvelope(input: {
  client: SupabaseClient;
  actorUserId: string;
  familyId: string;
  learnerId: string;
  evidenceId?: string;
}) {
  const queries = [
    input.client.from("family_members").select("id").eq("family_id", input.familyId).eq("user_id", input.actorUserId).maybeSingle(),
    input.client.from("learners").select("id,first_name,preferred_name").eq("family_id", input.familyId).eq("id", input.learnerId).maybeSingle(),
  ] as const;
  const [membership, learner] = await Promise.all(queries);
  if (membership.error || learner.error) {
    throw new StaffCaptureLearningEvidenceError("Could not verify the staging tenant envelope.", 503);
  }
  if (!membership.data || !learner.data) {
    throw new StaffCaptureLearningEvidenceError("Capture evidence is unavailable in this tenant.", 403);
  }
  if (input.evidenceId) {
    const [evidence, participant] = await Promise.all([
      input.client.from("evidence_entries").select("*").eq("family_id", input.familyId).eq("id", input.evidenceId).maybeSingle(),
      input.client.from("evidence_entry_learner_links").select("id").eq("family_id", input.familyId).eq("learner_id", input.learnerId).eq("evidence_entry_id", input.evidenceId).maybeSingle(),
    ]);
    if (evidence.error || participant.error) {
      throw new StaffCaptureLearningEvidenceError("Could not verify Capture evidence ownership.", 503);
    }
    if (!evidence.data || !participant.data) {
      throw new StaffCaptureLearningEvidenceError("Capture evidence is not linked to this learner.", 403);
    }
  }
  const row = learner.data as { first_name?: string | null; preferred_name?: string | null };
  return clean(row.preferred_name) || clean(row.first_name) || "Staging learner";
}

async function loadCanonicalConstruct(input: {
  client: SupabaseClient;
  familyId: string;
  learnerId: string;
  constructId: string;
}) {
  const result = await input.client
    .from("learning_evidence_results")
    .select("canonical_payload")
    .eq("family_id", input.familyId)
    .eq("learner_id", input.learnerId)
    .eq("construct_id", input.constructId)
    .order("evaluated_at", { ascending: false })
    .limit(10);
  if (result.error) {
    throw new StaffCaptureLearningEvidenceError("Canonical construct validation is unavailable.", 503);
  }
  const references = (result.data ?? [])
    .map((row) => constructFromPayload((row as { canonical_payload?: unknown }).canonical_payload))
    .filter((reference): reference is CapturedEvidenceConstructReference => Boolean(reference));
  if (!references.length || references.some((reference) => reference.constructId !== input.constructId)) {
    throw new StaffCaptureLearningEvidenceError("Canonical construct was not found for this learner.", 400);
  }
  const serialized = new Set(references.map((reference) => JSON.stringify(reference)));
  if (serialized.size !== 1) {
    throw new StaffCaptureLearningEvidenceError("Canonical construct metadata is not stable across history.", 409);
  }
  return references[0];
}

function sameImmutableLink(row: LinkRow, sourceType: CapturedLearningEvidenceSourceType, construct: CapturedEvidenceConstructReference) {
  return row.evidence_source_type === sourceType &&
    row.learning_domain === construct.learningDomain &&
    row.continuum_id === construct.continuumId &&
    row.construct_name === construct.constructName &&
    row.authority_id === construct.authority.authorityId &&
    row.framework_id === construct.authority.frameworkId &&
    row.framework_version === construct.authority.frameworkVersion &&
    row.curriculum_mapping_version === construct.authority.mappingVersion;
}

async function findLink(input: {
  client: SupabaseClient;
  familyId: string;
  learnerId: string;
  evidenceId: string;
  constructId: string;
}) {
  return input.client
    .from("learning_evidence_artifact_links")
    .select("*")
    .eq("family_id", input.familyId)
    .eq("learner_id", input.learnerId)
    .eq("evidence_entry_id", input.evidenceId)
    .eq("canonical_construct_id", input.constructId)
    .maybeSingle();
}

export async function governStaffCaptureEvidence(input: {
  client: SupabaseClient;
  actorUserId: string;
  request: StaffCaptureEvidenceRequest;
}) {
  await requireOwnedEnvelope({
    client: input.client,
    actorUserId: input.actorUserId,
    familyId: input.request.familyId,
    learnerId: input.request.learnerId,
    evidenceId: input.request.evidenceId,
  });
  const construct = await loadCanonicalConstruct({
    client: input.client,
    familyId: input.request.familyId,
    learnerId: input.request.learnerId,
    constructId: input.request.constructId,
  });
  const existing = await findLink({ client: input.client, ...input.request });
  if (existing.error) {
    throw new StaffCaptureLearningEvidenceError("Capture evidence link could not be checked.", 503);
  }

  if (input.request.operation === "link-capture-evidence") {
    if (existing.data) {
      const row = existing.data as LinkRow;
      if (!sameImmutableLink(row, input.request.sourceType, construct)) {
        throw new StaffCaptureLearningEvidenceError("Capture evidence link conflicts with immutable canonical content.", 409);
      }
      return { link: toLink(row), reused: true };
    }
    const inserted = await input.client.from("learning_evidence_artifact_links").insert({
      family_id: input.request.familyId,
      learner_id: input.request.learnerId,
      evidence_entry_id: input.request.evidenceId,
      evidence_source_type: input.request.sourceType,
      canonical_construct_id: construct.constructId,
      learning_domain: construct.learningDomain,
      continuum_id: construct.continuumId,
      construct_name: construct.constructName,
      authority_id: construct.authority.authorityId,
      framework_id: construct.authority.frameworkId,
      framework_version: construct.authority.frameworkVersion,
      curriculum_mapping_version: construct.authority.mappingVersion,
      assigned_by_user_id: input.actorUserId,
    }).select("*").single();
    if (inserted.error || !inserted.data) {
      throw new StaffCaptureLearningEvidenceError("Capture evidence link could not be saved.", 503);
    }
    return { link: toLink(inserted.data as LinkRow), reused: false };
  }

  if (!existing.data) {
    throw new StaffCaptureLearningEvidenceError("Capture evidence link was not found.", 404);
  }
  const reviewed = input.request.reviewState === "unreviewed"
    ? { review_state: "unreviewed", reviewed_by_user_id: null, reviewed_at: null }
    : { review_state: input.request.reviewState, reviewed_by_user_id: input.actorUserId, reviewed_at: new Date().toISOString() };
  const updated = await input.client.from("learning_evidence_artifact_links")
    .update(reviewed)
    .eq("id", (existing.data as LinkRow).id)
    .select("*")
    .single();
  if (updated.error || !updated.data) {
    throw new StaffCaptureLearningEvidenceError("Capture evidence review could not be saved.", 503);
  }
  return { link: toLink(updated.data as LinkRow), reused: false };
}

export async function loadStaffCaptureEvidenceHistory(input: {
  client: SupabaseClient;
  actorUserId: string;
  familyId: string;
  learnerId: string;
}): Promise<StaffCaptureEvidenceHistory> {
  const familyId = requireUuid(input.familyId, "Family");
  const learnerId = requireUuid(input.learnerId, "Learner");
  const learnerDisplayName = await requireOwnedEnvelope({
    client: input.client,
    actorUserId: input.actorUserId,
    familyId,
    learnerId,
  });
  const [evidenceRows, linkRows, resultRows] = await Promise.all([
    input.client.from("evidence_entries").select("*").eq("family_id", familyId).eq("learner_id", learnerId).order("observed_on"),
    input.client.from("learning_evidence_artifact_links").select("*").eq("family_id", familyId).eq("learner_id", learnerId).order("assigned_at"),
    input.client.from("learning_evidence_results").select("canonical_payload").eq("family_id", familyId).eq("learner_id", learnerId).order("evaluated_at"),
  ]);
  if (evidenceRows.error || linkRows.error || resultRows.error) {
    throw new StaffCaptureLearningEvidenceError("The staging evidence timeline could not be loaded.", 503);
  }
  const links = (linkRows.data ?? []).map((row) => row as LinkRow);
  const evidence = (evidenceRows.data ?? []).map((row) => {
    const typedRow = row as EvidenceRow;
    const evidenceLinks = links.filter((link) => link.evidence_entry_id === typedRow.id);
    return adaptCleanCaptureToLearningEvidence(toCleanEvidence(typedRow), {
      sourceType: evidenceLinks[0]?.evidence_source_type,
      constructLinks: evidenceLinks.map(toLink),
      reviewState: evidenceLinks[0]?.review_state ?? "unreviewed",
    });
  });
  const assessmentResults = (resultRows.data ?? [])
    .map((row) => (row as { canonical_payload?: unknown }).canonical_payload)
    .filter((payload): payload is LearningEvidenceResultV1 => Boolean(payload && typeof payload === "object"));
  return {
    target: { branchName: EI_STAGING_BRANCH_NAME, projectRef: EI_STAGING_PROJECT_REF },
    learner: { id: learnerId, displayName: learnerDisplayName },
    evidence,
    timeline: projectLearningEvidenceTimeline({ learnerId, assessmentResults, capturedEvidence: evidence }),
  };
}
