import { notFound } from "next/navigation";
import PlanDetailWorkspace from "@/app/components/intelligence/PlanDetailWorkspace";
import { isIntelligenceEngineEnabled } from "@/lib/intelligence/featureFlags";

export default async function LessonPlanDetailPage({ params }: { params: Promise<{ planId: string }> }) {
  if (!isIntelligenceEngineEnabled()) notFound();
  const { planId } = await params;
  return <PlanDetailWorkspace planType="lesson" planId={planId} />;
}

