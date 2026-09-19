import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(process.cwd(), "supabase/migrations/20260919074445_stripe_one_time_billing_foundation.sql"),
  "utf8",
);

describe("Stripe one-time billing foundation migration", () => {
  it("creates family-level Stripe customer mappings with provider uniqueness", () => {
    expect(source).toContain("create table public.family_billing_accounts");
    expect(source).toContain("family_billing_accounts_family_provider_unique unique (family_id, provider)");
    expect(source).toContain("family_billing_accounts_provider_customer_unique unique (provider, provider_customer_id)");
    expect(source).toContain("check (provider = 'stripe')");
  });

  it("snapshots only approved one-time AUD media products and the selected family learning year", () => {
    expect(source).toContain("create table public.billing_checkout_intents");
    expect(source).toContain("product_key in ('MEDIA_100', 'MEDIA_250', 'MEDIA_500', 'MEDIA_1000')");
    expect(source).toContain("check (currency = 'AUD')");
    expect(source).toContain("Billing checkout commercial snapshots are immutable.");
    expect(source).toContain("Billing checkout must snapshot the selected learning year.");
    expect(source).toContain("membership.role in ('owner', 'parent')");
    expect(source).toContain("when 'MEDIA_100' then expected_amount_minor := 1495; expected_quota_bytes := 104857600");
    expect(source).toContain("when 'MEDIA_1000' then expected_amount_minor := 5495; expected_quota_bytes := 1073741824");
  });

  it("keeps commercial writes service-only under RLS", () => {
    for (const table of [
      "family_billing_accounts",
      "billing_checkout_intents",
      "billing_provider_events",
    ]) {
      expect(source).toContain(`alter table public.${table} enable row level security`);
      expect(source).toContain(`revoke all on table public.${table} from public, anon, authenticated`);
      expect(source).toContain(`grant all on table public.${table} to service_role`);
    }
    expect(source).toContain("mylearna_finalize_stripe_paid_checkout");
    expect(source).toContain("security definer");
    expect(source).toContain("set search_path = public");
    expect(source).toContain("from public, anon, authenticated");
    expect(source).toContain("to service_role");
  });

  it("uses provider-event and provider-payment uniqueness to make verified grants idempotent", () => {
    expect(source).toContain("billing_provider_events_provider_event_unique unique (provider, event_id)");
    expect(source).toContain("billing_checkout_intents_provider_payment_unique");
    expect(source).toContain("on conflict (provider, event_id) do nothing");
    expect(source).toContain("'duplicate_event'::text");
    expect(source).toContain("provider_reference, source");
    expect(source).toContain("'stripe', p_payment_intent_id, 'stripe'");
    expect(source).toContain("status in ('active', 'grace')");
  });

  it("closes concurrent open Checkout races and releases stale attempts safely", () => {
    expect(source).toContain("billing_checkout_intents_one_open_family_year_unique");
    expect(source).toContain("where status in ('pending', 'checkout_created')");
    expect(source).toContain("mylearna_prepare_stripe_checkout_intent");
    expect(source).toContain("stale_intent.expires_at <= now()");
    expect(source).toContain("set status = 'expired'");
    expect(source).toContain("returning id, expires_at into created_checkout_intent_id, checkout_intent_expires_at");
    expect(source).toContain("'open_checkout_exists'::text");
    expect(source).toContain("'current_entitlement_exists'::text");
    expect(source).toContain("to service_role");
  });

  it("enforces unique Stripe Checkout and PaymentIntent mappings before finalising in one transaction", () => {
    expect(source).toContain("billing_checkout_intents_provider_session_unique");
    expect(source).toContain("billing_checkout_intents_provider_payment_unique");
    expect(source).toContain("select * into checkout_intent_row");
    expect(source).toContain("for update;");
    expect(source).toContain("insert into public.billing_provider_events");
    expect(source).toContain("insert into public.family_entitlements");
    expect(source).toContain("set processing_status = 'processed'");
    expect(source).toContain("set status = 'review_required'");
  });

  it("does not introduce media deletion, Resource Cupboard changes, or automated refund revocation", () => {
    expect(source).not.toMatch(/delete\s+from\s+storage\.objects/i);
    expect(source).not.toContain("learning-resources");
    expect(source).not.toContain("family_resource_storage_usage");
    expect(source).not.toContain("refund");
    expect(source).not.toContain("dispute");
  });
});
