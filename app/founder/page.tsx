import type { Metadata } from "next";
import FounderCockpit from "@/app/founder/FounderCockpit";
import FounderCustomers from "@/app/founder/FounderCustomers";
import { requireFounderAccess } from "@/lib/clean/founder/founderAccess";
import { loadFounderCockpitData } from "@/lib/clean/founder/founderServer";
import { loadFounderCustomers } from "@/lib/clean/founder/founderCustomers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "MyLearna Founder",
  robots: { index: false, follow: false, nocache: true },
};

export default async function FounderPage() {
  await requireFounderAccess();
  const [data, customers] = await Promise.all([
    loadFounderCockpitData(),
    loadFounderCustomers(),
  ]);

  return (
    <>
      <FounderCockpit data={data} />
      <FounderCustomers data={customers} />
    </>
  );
}
