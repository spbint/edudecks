export type EiProduct = "homeschool" | "campus";

export type EiTenantKind = "family" | "organisation";

export type EiEventType =
  | "assessment_response"
  | "assessment_attempt_completed"
  | "adult_judgement"
  | "evidence_observation"
  | "practice_response"
  | "intervention_started"
  | "intervention_reviewed"
  | "intervention_outcome"
  | "system_signal";

export type EiSourceKind =
  | "assessment"
  | "adult_judgement"
  | "evidence_capture"
  | "practice"
  | "intervention"
  | "system";

export type EiSignalPolarity = -1 | 0 | 1;
export type EiSignalStrength = "low" | "moderate" | "high";

export type EiLearningSignal = {
  polarity: EiSignalPolarity;
  strength: EiSignalStrength;
  rationale?: string | null;
};

export type EiLearningEvent = {
  id: string;
  product: EiProduct;
  tenantKind: EiTenantKind;
  tenantId: string;
  learnerId: string;
  competencyId: string;
  eventType: EiEventType;
  sourceKind: EiSourceKind;
  sourceId: string;
  evidenceGroupId: string;
  occurredAt: string;
  signal: EiLearningSignal;
  provenance: {
    originTable?: string | null;
    originRecordId?: string | null;
    adapterVersion: string;
  };
  metadata?: Record<string, unknown>;
};

export type EiEvidenceConfidence = "low" | "moderate" | "high";

export type EiEvidenceSignalBand =
  | "not_enough_evidence"
  | "needs_attention"
  | "mixed"
  | "promising"
  | "strong_signal";

export type EiEvidenceBalanceState = {
  competencyId: string;
  learnerId: string;
  eventCount: number;
  evidenceGroupCount: number;
  sourceKindCount: number;
  supportRatio: number | null;
  confidence: EiEvidenceConfidence;
  signalBand: EiEvidenceSignalBand;
  latestEvidenceAt: string | null;
  advisoryOnly: true;
  reasons: string[];
};
