import { buildFounderBehaviourV3, type FounderBehaviourV3 } from "./founderBehaviourV3";
import {
  isFounderExcludedAccount,
  isFounderSuspiciousAccount,
  loadFounderCustomers,
} from "./founderCustomers";
import { loadFounderPostHogSnapshot } from "./founderPosthog";

export type FounderBehaviourV3Options = {
  rangeDays?: 7 | 30 | 90;
  includeInternal?: boolean;
  includeSuspicious?: boolean;
};

export async function loadFounderBehaviourV3(
  options: FounderBehaviourV3Options = {},
  now = new Date(),
): Promise<FounderBehaviourV3> {
  const rangeDays = options.rangeDays ?? 30;
  const includeInternal = options.includeInternal ?? false;
  const includeSuspicious = options.includeSuspicious ?? true;
  const [posthog, directory] = await Promise.all([
    loadFounderPostHogSnapshot(rangeDays),
    loadFounderCustomers(now, { includeInternal: true }),
  ]);
  const internalUserIds = new Set(
    directory.customers
      .filter((customer) => isFounderExcludedAccount(customer.email))
      .map((customer) => customer.userId),
  );
  const suspiciousUserIds = new Set(
    directory.customers
      .filter((customer) => isFounderSuspiciousAccount(customer.email))
      .map((customer) => customer.userId),
  );

  return buildFounderBehaviourV3({
    events: posthog.events,
    rangeDays,
    includeInternal,
    includeSuspicious,
    internalUserIds,
    suspiciousUserIds,
    posthogAvailable: posthog.available,
    now,
  });
}
