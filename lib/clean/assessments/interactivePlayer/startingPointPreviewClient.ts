import type {
  MyLearnaAssessmentItem,
  MyLearnaAssessmentResponse,
} from "@/lib/clean/assessments/mylearnaAssessTypes";
import type { StartingPointPlayerAnswer } from "./startingPointPlayerContract";

export type StartingPointQuestionPool =
  | "anchor"
  | "reserve"
  | "search"
  | "boundary";

export async function loadStartingPointQuestion(input: {
  continuum: string;
  pool: StartingPointQuestionPool;
  pLevel: number;
  itemIndex: number;
}): Promise<{ item: MyLearnaAssessmentItem; itemCount: number }> {
  const params = new URLSearchParams({
    continuum: input.continuum,
    pool: input.pool,
    pLevel: String(input.pLevel),
    itemIndex: String(input.itemIndex),
  });
  const response = await fetch(
    `/api/assessments/maths-starting-point/items?${params.toString()}`,
    { method: "GET", credentials: "same-origin", cache: "no-store" },
  );
  const payload = (await response.json().catch(() => null)) as
    | { ok?: boolean; item?: MyLearnaAssessmentItem; itemCount?: number }
    | null;
  if (
    !response.ok ||
    !payload?.ok ||
    !payload.item ||
    !Number.isInteger(payload.itemCount) ||
    Number(payload.itemCount) < 1
  ) {
    throw new Error("This question set could not be loaded.");
  }
  return { item: payload.item, itemCount: Number(payload.itemCount) };
}

export async function scoreStartingPointPreviewAnswer(input: {
  answer: StartingPointPlayerAnswer;
  timeSpentSeconds: number;
}): Promise<MyLearnaAssessmentResponse> {
  const response = await fetch("/api/assessments/maths-starting-point/score", {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ...input.answer,
      timeSpentSeconds: input.timeSpentSeconds,
    }),
  });
  const payload = (await response.json().catch(() => null)) as
    | { ok?: boolean; response?: MyLearnaAssessmentResponse }
    | null;
  if (!response.ok || !payload?.ok || !payload.response) {
    throw new Error("That answer could not be recorded.");
  }
  return payload.response;
}
