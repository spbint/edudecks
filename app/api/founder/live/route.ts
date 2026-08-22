import { getFounderAccessContext } from "@/lib/clean/founder/founderAccess";
import { loadFounderCustomers } from "@/lib/clean/founder/founderCustomers";
import { buildFounderLiveBehaviour } from "@/lib/clean/founder/founderLiveBehaviour";
import { loadFounderPostHogSnapshot } from "@/lib/clean/founder/founderPosthog";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
};

export async function GET() {
  const access = await getFounderAccessContext();
  if (access.decision === "unauthenticated") {
    return Response.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE_HEADERS });
  }
  if (access.decision !== "allowed") {
    return new Response(null, { status: 404, headers: NO_STORE_HEADERS });
  }

  try {
    const now = new Date();
    const [customerSnapshot, postHog] = await Promise.all([
      loadFounderCustomers(now),
      loadFounderPostHogSnapshot(7),
    ]);
    const customerIds = new Set(customerSnapshot.customers.map((customer) => customer.userId));
    const customerEvents = postHog.events.filter((event) => customerIds.has(event.userId));
    const data = buildFounderLiveBehaviour(customerSnapshot.customers, customerEvents, now, postHog.available);
    return Response.json(data, { headers: NO_STORE_HEADERS });
  } catch {
    return Response.json(
      { error: "Live Founder activity is temporarily unavailable." },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }
}
