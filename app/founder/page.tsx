import type { Metadata } from "next";
import FounderBehavior from "@/app/founder/FounderBehavior";
import FounderCockpit from "@/app/founder/FounderCockpit";
import FounderCustomers from "@/app/founder/FounderCustomers";
import { requireFounderAccess } from "@/lib/clean/founder/founderAccess";
import { loadFounderBehavior } from "@/lib/clean/founder/founderBehavior";
import {
  loadFounderAdminUserIds,
  loadFounderCustomers,
} from "@/lib/clean/founder/founderCustomers";
import { loadFounderCockpitData } from "@/lib/clean/founder/founderServer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "MyLearna Founder",
  robots: { index: false, follow: false, nocache: true },
};

export default async function FounderPage() {
  await requireFounderAccess();
  const [data, customers, adminUserIds] = await Promise.all([
    loadFounderCockpitData(),
    loadFounderCustomers(),
    loadFounderAdminUserIds(),
  ]);
  const behavior = await loadFounderBehavior(adminUserIds);

  return (
    <>
      <FounderCockpit data={data} />
      <FounderBehavior behavior={behavior} customers={customers} />
      <FounderCustomers data={customers} behavior={behavior} />
    </>
  );
}
