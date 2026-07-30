import { notFound } from "next/navigation";
import MyPlansWorkspace from "@/app/components/intelligence/MyPlansWorkspace";
import { isIntelligenceEngineEnabled } from "@/lib/intelligence/featureFlags";

export default function MyPlansPage() {
  if (!isIntelligenceEngineEnabled()) notFound();
  return <MyPlansWorkspace />;
}

