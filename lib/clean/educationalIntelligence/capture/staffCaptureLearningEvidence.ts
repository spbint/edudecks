import type {
  CapturedEvidenceReviewState,
  CapturedLearningEvidenceSourceType,
  CapturedLearningEvidenceV1,
} from "./capturedLearningEvidence";
import type { LearningEvidenceTimelineEventV1 } from "./learningEvidenceTimeline";

export type StaffCaptureEvidenceLinkRequest = {
  operation: "link-capture-evidence";
  familyId: string;
  learnerId: string;
  evidenceId: string;
  constructId: string;
  sourceType: CapturedLearningEvidenceSourceType;
};

export type StaffCaptureEvidenceReviewRequest = {
  operation: "review-capture-evidence-link";
  familyId: string;
  learnerId: string;
  evidenceId: string;
  constructId: string;
  reviewState: CapturedEvidenceReviewState;
};

export type StaffCaptureEvidenceRequest =
  | StaffCaptureEvidenceLinkRequest
  | StaffCaptureEvidenceReviewRequest;

export type StaffCaptureEvidenceHistory = {
  target: {
    branchName: "intelligence-staging";
    projectRef: "owvxggviughmpursepof";
  };
  learner: { id: string; displayName: string };
  evidence: CapturedLearningEvidenceV1[];
  timeline: LearningEvidenceTimelineEventV1[];
};
