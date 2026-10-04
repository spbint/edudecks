import { supabase } from "@/lib/supabaseClient";
import {
  assertMathsStartingPointPersistenceEnabled,
} from "@/lib/clean/assessments/mathsStartingPointRelease";
import type {
  NumberOperationsBaselinePersistenceDraft,
} from "./numberOperationsPersistenceDraft";

export type SaveNumberOperationsBaselineInput = {
  familyId: string;
  learnerId: string;
  clientSubmissionId: string;
  draft: NumberOperationsBaselinePersistenceDraft;
};

function required(value: string, label: string) {
  const cleaned = String(value ?? "").trim();
  if (!cleaned) throw new Error(`${label} is required.`);
  return cleaned;
}

export async function saveNumberOperationsBaseline(
  input: SaveNumberOperationsBaselineInput,
) {
  assertMathsStartingPointPersistenceEnabled();

  const familyId = required(input.familyId, "familyId");
  const learnerId = required(input.learnerId, "learnerId");
  const clientSubmissionId = required(
    input.clientSubmissionId,
    "clientSubmissionId",
  );

  if (
    clientSubmissionId.length < 8 ||
    clientSubmissionId.length > 128 ||
    /\s/.test(clientSubmissionId)
  ) {
    throw new Error("clientSubmissionId must be 8–128 non-whitespace characters.");
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user?.id) {
    throw new Error("Sign in to save this Maths starting point.");
  }

  const { data, error } = await supabase.rpc(
    "mylearna_save_number_operations_baseline",
    {
      p_family_id: familyId,
      p_learner_id: learnerId,
      p_client_submission_id: clientSubmissionId,
      p_attempt: input.draft.attempt,
      p_responses: input.draft.responses,
    },
  );

  if (error) {
    throw error;
  }

  const attemptId = String(data ?? "").trim();
  if (!attemptId) {
    throw new Error("The baseline save completed without an attempt id.");
  }

  return { attemptId };
}
