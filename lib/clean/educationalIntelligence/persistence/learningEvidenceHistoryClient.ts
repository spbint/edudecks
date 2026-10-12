import { supabase } from "@/lib/supabaseClient";
import {
  LEARNING_EVIDENCE_RESULT_SCHEMA,
  LEARNING_EVIDENCE_RESULT_SCHEMA_VERSION,
  type LearningEvidenceResultV1,
} from "../learningEvidenceResult";

function isCanonicalResult(value: unknown): value is LearningEvidenceResultV1 {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<LearningEvidenceResultV1>;
  return candidate.schema === LEARNING_EVIDENCE_RESULT_SCHEMA &&
    candidate.schemaVersion === LEARNING_EVIDENCE_RESULT_SCHEMA_VERSION &&
    typeof candidate.learnerId === "string" &&
    typeof candidate.assessment?.attemptId === "string" &&
    typeof candidate.construct?.continuumId === "string" &&
    typeof candidate.evaluatedAt === "string";
}

/**
 * Loads only the signed-in family's canonical result payloads. Supabase RLS is
 * the authority for tenancy; this browser helper has no write operation and no
 * service-role credential.
 */
export async function listCanonicalLearningEvidenceHistory(input: {
  familyId: string;
  learnerId: string;
}): Promise<LearningEvidenceResultV1[]> {
  const response = await supabase
    .from("learning_evidence_results")
    .select("canonical_payload,evaluated_at")
    .eq("family_id", input.familyId)
    .eq("learner_id", input.learnerId)
    .order("evaluated_at", { ascending: true });
  if (response.error) throw response.error;

  return (response.data ?? [])
    .map((row) => (row as { canonical_payload?: unknown }).canonical_payload)
    .filter(isCanonicalResult)
    .filter((result) => result.learnerId === input.learnerId)
    .map((result) => structuredClone(result));
}
