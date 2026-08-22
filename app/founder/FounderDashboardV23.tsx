import FounderDashboardV21 from "@/app/founder/FounderDashboardV21";
import FounderLiveBehaviour from "@/app/founder/FounderLiveBehaviour";
import type { FounderDashboardData } from "@/lib/clean/founder/founderDashboard";

const ACTIVE_NOW_MS = 5 * 60 * 1000;

function activeNowCount(data: FounderDashboardData) {
  if (!data.productActivityAvailable) return 0;
  const now = Date.parse(data.generatedAt);
  if (!Number.isFinite(now)) return 0;
  return data.customers.filter((customer) => {
    if (!customer.lastActiveAt) return false;
    const last = Date.parse(customer.lastActiveAt);
    return Number.isFinite(last) && now >= last && now - last <= ACTIVE_NOW_MS;
  }).length;
}

export default function FounderDashboardV23({ data }: { data: FounderDashboardData }) {
  return <>
    <FounderDashboardV21 data={data} />
    <FounderLiveBehaviour
      initialActiveNowCount={activeNowCount(data)}
      initiallyAvailable={data.productActivityAvailable}
    />
  </>;
}
