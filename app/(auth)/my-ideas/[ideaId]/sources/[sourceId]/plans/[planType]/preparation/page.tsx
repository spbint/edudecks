import { notFound } from "next/navigation";
import LearningPreparationList from "@/app/components/intelligence/LearningPreparationList";
import { isLearningPlanType } from "@/lib/intelligence/plans/generator";
import { isRecommendationEngineEnabled } from "@/lib/intelligence/featureFlags";

export default async function LearningPreparationPage({ params, searchParams }: { params: Promise<{ ideaId: string; sourceId: string; planType: string }>; searchParams: Promise<{ planId?: string; revision?: string }> }) {
  if (!isRecommendationEngineEnabled()) notFound();
  const [{ ideaId, sourceId, planType }, query] = await Promise.all([params, searchParams]);
  if (!isLearningPlanType(planType)) notFound();
  const revision = Number(query.revision);
  const planId = query.planId?.trim() ?? "";
  if (!planId || !Number.isInteger(revision) || revision < 1) notFound();
  return <LearningPreparationList ideaId={ideaId} sourceId={sourceId} planType={planType} planId={planId} revision={revision} />;
}
