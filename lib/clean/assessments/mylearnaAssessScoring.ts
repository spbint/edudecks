import type {
  MyLearnaAssessmentItem,
  MyLearnaAssessmentResponse,
  MyLearnaAssessmentSummary,
} from "@/lib/clean/assessments/mylearnaAssessTypes";
import type { AssessmentViewer, AssessmentProfile } from "@/lib/clean/assessments/assessmentPermissions";
import { isInternalUser } from "@/lib/clean/assessments/assessmentPermissions";

export function canUseAssessmentItem(
  item: MyLearnaAssessmentItem,
  viewer: AssessmentViewer | null,
  profile: AssessmentProfile | null,
  context: "lab" | "customer",
) {
  if (context === "lab" && isInternalUser(viewer, profile)) return true;
  return item.status === "published";
}

export function scoreAssessmentItem(
  item: MyLearnaAssessmentItem,
  selectedOptionIds: string[],
  timeSpentSeconds?: number,
): MyLearnaAssessmentResponse {
  const expected = [...(item.response.correctOptionIds || [])].sort();
  const actual = [...selectedOptionIds].sort();
  const correct =
    expected.length === actual.length &&
    expected.every((optionId, index) => optionId === actual[index]);

  return {
    itemId: item.id,
    selectedOptionIds,
    correct,
    skillId: item.skill.id,
    misconceptionTags: correct ? [] : item.misconceptionTags || [],
    timeSpentSeconds,
  };
}

export function summarizeAssessmentAttempt(
  items: MyLearnaAssessmentItem[],
  responses: MyLearnaAssessmentResponse[],
): MyLearnaAssessmentSummary {
  const responseByItemId = new Map(responses.map((response) => [response.itemId, response]));
  const correctItems = items.filter((item) => responseByItemId.get(item.id)?.correct).length;
  const skillMap = new Map<string, { skillName: string; correct: number; total: number }>();

  items.forEach((item) => {
    const current = skillMap.get(item.skill.id) || {
      skillName: item.skill.name,
      correct: 0,
      total: 0,
    };
    current.total += 1;
    if (responseByItemId.get(item.id)?.correct) {
      current.correct += 1;
    }
    skillMap.set(item.skill.id, current);
  });

  return {
    totalItems: items.length,
    correctItems,
    percentage: items.length ? Math.round((correctItems / items.length) * 100) : 0,
    skillSummaries: Array.from(skillMap.entries()).map(([skillId, summary]) => ({
      skillId,
      skillName: summary.skillName,
      correct: summary.correct,
      total: summary.total,
    })),
    suggestedNextStep:
      correctItems === items.length
        ? "Open the next pathway step when the learner is ready."
        : "Use worksheet evidence and a short practical activity before trying another check-in.",
  };
}
