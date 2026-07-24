import { notFound } from "next/navigation";
import MyIdeasWorkspace from "@/app/components/intelligence/MyIdeasWorkspace";
import { isIntelligenceEngineEnabled } from "@/lib/intelligence/featureFlags";

export default function MyIdeasPage() {
  if (!isIntelligenceEngineEnabled()) {
    notFound();
  }

  return <MyIdeasWorkspace />;
}
