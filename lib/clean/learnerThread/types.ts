export const LEARNER_THREAD_V1_SCHEMA_VERSION = "1.0" as const;

export type LearnerThreadProduct = "mylearna-homeschool" | "mylearna-campus";

export type LearnerThreadReferenceType =
  | "family"
  | "school"
  | "learner"
  | "program"
  | "program_segment"
  | "calendar_item"
  | "evidence_entry"
  | "assessment_skill_status"
  | "assessment_attempt"
  | "pathway_step"
  | "pathway_step_key"
  | "pathway"
  | "curriculum_element"
  | "learning_area"
  | "authority_evidence_area"
  | "marketplace_resource"
  | "template_block"
  | "generation_run"
  | "user";

export type LearnerThreadReferenceV1 = {
  type: LearnerThreadReferenceType;
  id: string;
  label?: string | null;
};

export type LearnerThreadActorType = "account_user" | "system" | "unknown";

export type LearnerThreadSourceType =
  | "parent_entered"
  | "system_derived"
  | "assessment_derived"
  | "calendar_derived"
  | "marketplace_derived";

export type LearnerThreadDataSufficiency =
  | "sufficient"
  | "limited"
  | "incomplete"
  | "unavailable";

export type LearnerThreadFreshnessPolicyV1 = {
  id: string;
  version: string;
  staleAfterDays: number;
};

export type LearnerThreadFreshnessV1 = {
  status: "current" | "stale" | "unavailable";
  asOf: string;
  referenceAt: string | null;
  ageDays: number | null;
  policy: LearnerThreadFreshnessPolicyV1;
};

export type LearnerThreadConfidenceV1 = {
  dataSufficiency: LearnerThreadDataSufficiency;
  reason: string;
};

export type LearnerThreadProvenanceV1 = {
  summary: string;
  sourceRecord: LearnerThreadReferenceV1;
  sourceReferences: LearnerThreadReferenceV1[];
  actorType: LearnerThreadActorType;
  actorReference: LearnerThreadReferenceV1 | null;
  sourceTypes: LearnerThreadSourceType[];
};

export type LearnerThreadExplicitValueV1 = {
  state: string | null;
  value: string | number | boolean | null;
  unit: string | null;
  attributes: Record<string, string | number | boolean | null>;
};

export type LearnerThreadFactKindV1 =
  | "plan_scheduled"
  | "plan_completed"
  | "evidence_recorded"
  | "progress_judgement_recorded"
  | "assessment_status_recorded"
  | "assessment_attempt_recorded";

export type LearnerThreadFactV1 = {
  recordType: "fact";
  id: string;
  kind: LearnerThreadFactKindV1;
  occurredAt: string | null;
  recordedAt: string | null;
  capabilityReferences: LearnerThreadReferenceV1[];
  planActionReferences: LearnerThreadReferenceV1[];
  evidenceReferences: LearnerThreadReferenceV1[];
  explicitValue: LearnerThreadExplicitValueV1;
  provenance: LearnerThreadProvenanceV1;
  confidence: LearnerThreadConfidenceV1;
  freshness: LearnerThreadFreshnessV1;
};

export type LearnerThreadRuleV1 = {
  identifier: string;
  version: string;
};

export type LearnerThreadDerivedClaimKindV1 =
  | "latest_explicit_progress_judgement"
  | "possible_verification_evidence";

export type LearnerThreadDerivedClaimV1 = {
  recordType: "derived_claim";
  id: string;
  kind: LearnerThreadDerivedClaimKindV1;
  statement: string;
  derivedAt: string;
  capabilityReferences: LearnerThreadReferenceV1[];
  evidenceReferences: LearnerThreadReferenceV1[];
  basisReferences: LearnerThreadReferenceV1[];
  provenanceSummary: string;
  confidence: LearnerThreadConfidenceV1;
  freshness: LearnerThreadFreshnessV1;
  rule: LearnerThreadRuleV1;
};

export type LearnerThreadNextStepKindV1 =
  | "capture_evidence"
  | "review_completion_without_evidence"
  | "schedule_follow_up_observation"
  | "review_possible_verification_evidence";

export type LearnerThreadNextStepV1 = {
  kind: LearnerThreadNextStepKindV1;
  suggestion: string;
  reason: string;
  basisReferences: LearnerThreadReferenceV1[];
  confidence: LearnerThreadConfidenceV1;
  freshness: LearnerThreadFreshnessV1;
  rule: LearnerThreadRuleV1;
};

export type LearnerThreadV1 = {
  schemaVersion: typeof LEARNER_THREAD_V1_SCHEMA_VERSION;
  product: LearnerThreadProduct;
  tenant: LearnerThreadReferenceV1;
  learner: LearnerThreadReferenceV1;
  generatedAt: string;
  freshnessPolicy: LearnerThreadFreshnessPolicyV1;
  facts: LearnerThreadFactV1[];
  derivedClaims: LearnerThreadDerivedClaimV1[];
  nextStep: LearnerThreadNextStepV1 | null;
};
