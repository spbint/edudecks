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

  const session = await supabase.auth.getSession();
  const accessToken = session.data.session?.access_token;
  if (session.error || !accessToken) {
    throw new Error("Sign in to save this Maths starting point.");
  }

  const response = await fetch(
    "/api/assessments/maths-starting-point/save",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        familyId,
        learnerId,
        clientSubmissionId,
        draft: input.draft,
      }),
    },
  );

  const payload = (await response.json().catch(() => null)) as
    | { ok?: boolean; attemptId?: string; error?: string }
    | null;

  if (!response.ok || !payload?.ok) {
    throw new Error(
      String(payload?.error || "The Maths starting point could not be saved."),
    );
  }

  const attemptId = String(payload.attemptId ?? "").trim();
  if (!attemptId) {
    throw new Error("The save completed without an attempt id.");
  }

  return { attemptId };
}
