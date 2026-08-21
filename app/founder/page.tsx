import type { Metadata } from "next";
import FounderDashboardV21 from "@/app/founder/FounderDashboardV21";
import { requireFounderAccess } from "@/lib/clean/founder/founderAccess";
import { loadFounderDashboard } from "@/lib/clean/founder/founderDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "MyLearna Founder",
  robots: { index: false, follow: false, nocache: true },
};

export default async function FounderPage() {
  await requireFounderAccess();
  const data = await loadFounderDashboard();
  return <FounderDashboardV21 data={data} />;
}
