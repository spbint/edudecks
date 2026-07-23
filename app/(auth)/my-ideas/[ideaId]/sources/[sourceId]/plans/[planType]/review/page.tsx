import { notFound } from "next/navigation";
import PlanReviewWorkspace from "@/app/components/intelligence/PlanReviewWorkspace";
import { isIntelligenceEngineEnabled } from "@/lib/intelligence/featureFlags";
import { isLearningPlanType } from "@/lib/intelligence/plans/generator";

export default async function PlanReviewPage({ params }: { params: Promise<{ ideaId: string; sourceId: string; planType: string }> }) {
  if (!isIntelligenceEngineEnabled()) notFound();
  const { ideaId, sourceId, planType } = await params;
  if (!isLearningPlanType(planType)) notFound();
  return <PlanReviewWorkspace ideaId={ideaId} sourceId={sourceId} planType={planType} />;
}
