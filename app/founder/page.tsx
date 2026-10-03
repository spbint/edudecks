import type { Metadata } from "next";
import FounderBehaviourIntelligenceV3 from "@/app/founder/FounderBehaviourIntelligenceV3";
import { requireFounderAccess } from "@/lib/clean/founder/founderAccess";
import { loadFounderBehaviourV3 } from "@/lib/clean/founder/founderBehaviourV3Server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "MyLearna Founder",
  robots: { index: false, follow: false, nocache: true },
};

export default async function FounderPage({
  searchParams,
}: {
  searchParams?: Promise<{ range?: string; internal?: string; suspicious?: string }>;
} = {}) {
  await requireFounderAccess();
  const params: { range?: string; internal?: string; suspicious?: string } = await (
    searchParams ?? Promise.resolve({})
  );
  const rangeDays = params.range === "7" ? 7 : params.range === "90" ? 90 : 30;
  const data = await loadFounderBehaviourV3({
    rangeDays,
    includeInternal: params.internal === "include",
    includeSuspicious: params.suspicious === "include",
  });
  return <FounderBehaviourIntelligenceV3 data={data} />;
}
