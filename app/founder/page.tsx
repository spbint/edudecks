import type { Metadata } from "next";
import FounderCockpit from "@/app/founder/FounderCockpit";
import { requireFounderAccess } from "@/lib/clean/founder/founderAccess";
import { loadFounderCockpitData } from "@/lib/clean/founder/founderServer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "MyLearna Founder",
  robots: { index: false, follow: false, nocache: true },
};

export default async function FounderPage() {
  await requireFounderAccess();
  const data = await loadFounderCockpitData();
  return <FounderCockpit data={data} />;
}

