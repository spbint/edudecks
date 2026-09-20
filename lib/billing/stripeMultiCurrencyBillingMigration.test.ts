import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(process.cwd(), "supabase/migrations/20260920052324_add_multi_currency_media_billing.sql"),
  "utf8",
);
const foundation = readFileSync(
  join(process.cwd(), "supabase/migrations/20260919074445_stripe_one_time_billing_foundation.sql"),
  "utf8",
);

describe("multi-currency one-time media billing migration", () => {
  it("updates only the checkout-intent currency contract to AUD, USD, and GBP", () => {
    expect(source).toContain("drop constraint billing_checkout_intents_currency_check");
    expect(source).toContain("check (currency in ('AUD', 'USD', 'GBP'))");
    expect(source).not.toMatch(/alter table public\.family_entitlements/i);
  });

  it("requires the exact supported country, tier, currency, amount, and quota snapshots", () => {
    expect(source).toContain("from public.family_profiles as profile");
    expect(source).toContain("when 'AU' then expected_currency := 'AUD'");
    expect(source).toContain("when 'US' then expected_currency := 'USD'");
    expect(source).toContain("when 'UK' then expected_currency := 'GBP'");
    expect(source).toContain("Billing checkout country is not supported.");
    for (const amount of [1495, 2195, 3495, 5495, 999, 1499, 2299, 3999, 799, 1199, 1899, 2999]) {
      expect(source).toContain(`expected_amount_minor := ${amount}`);
    }
    for (const quota of [104857600, 262144000, 524288000, 1073741824]) {
      expect(source).toContain(`expected_quota_bytes := ${quota}`);
    }
  });

  it("preserves the immutable commercial snapshot, billing authority, year validation, and service-only posture", () => {
    expect(source).toContain("Billing checkout commercial snapshots are immutable.");
    expect(source).toContain("membership.role in ('owner', 'parent')");
    expect(source).toContain("Billing checkout must snapshot the selected learning year.");
    expect(source).toContain("revoke all on function public.mylearna_validate_billing_checkout_intent() from public, anon, authenticated");
    expect(source).toContain("grant execute on function public.mylearna_validate_billing_checkout_intent() to service_role");
    expect(foundation).toContain("revoke all on table public.billing_checkout_intents from public, anon, authenticated");
    expect(foundation).toContain("grant all on table public.billing_checkout_intents to service_role");
  });

  it("does not add notifications, Stripe objects, or unrelated schema changes", () => {
    expect(source).not.toMatch(/community_notifications|create table|create index|stripe price|webhook/i);
  });
});
