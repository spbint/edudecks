import "server-only";

import type Stripe from "stripe";
import type { MediaProductKey } from "@/lib/clean/entitlements/mediaTierCatalog";
import {
  getOneTimeMediaProduct,
  isMediaProductKey,
  type MediaBillingCurrency,
} from "@/lib/billing/mediaProducts";
import {
  createStripeIntegrationIdentifier,
  getTrustedStripeMediaProduct,
} from "@/lib/billing/stripe.server";
import { BILLING_AUTHORITY_ROLES, createBillingAdminClient } from "@/lib/billing/supabaseBilling.server";
import {
  familyBillingDateKey,
  FamilyBillingEligibilityError,
  resolveFamilyBillingMarket,
  type FamilyBillingProfile,
} from "@/lib/billing/familyBillingEligibility";

export type BillingAcademicYear = {
  id: string;
  startsOn: string;
  endsOn: string;
  label: string;
};

export type BillingCheckoutIntent = {
  id: string;
  familyId: string;
  requestedByUserId: string;
  productKey: MediaProductKey;
  currency: MediaBillingCurrency;
  amountMinor: number;
  academicYearId: string;
  periodStartsOn: string;
  periodEndsOn: string;
  periodLabel: string;
  quotaBytes: number;
  provider: "stripe";
  providerCustomerId: string;
  providerCheckoutSessionId: string | null;
  providerPaymentIntentId: string | null;
  expiresAt: string;
  status: string;
};

export type BillingCheckoutRepository = {
  userCanInitiateBilling(familyId: string, userId: string): Promise<boolean>;
  getFamilyBillingProfile(familyId: string): Promise<FamilyBillingProfile | null>;
  getCurrentAcademicYear(familyId: string, observedOn: string): Promise<BillingAcademicYear | null>;
  hasCurrentExplicitMediaEntitlement(familyId: string, academicYearId: string): Promise<boolean>;
  findOpenCheckoutIntent(familyId: string, academicYearId: string): Promise<BillingCheckoutIntent | null>;
  findFamilyStripeCustomer(familyId: string): Promise<string | null>;
  saveFamilyStripeCustomer(familyId: string, customerId: string): Promise<string>;
  createCheckoutIntent(input: Omit<BillingCheckoutIntent, "id" | "providerCheckoutSessionId" | "providerPaymentIntentId" | "expiresAt" | "status">): Promise<BillingCheckoutIntent>;
  markCheckoutCreated(intentId: string, checkoutSessionId: string): Promise<void>;
  markCheckoutExpired(intentId: string): Promise<void>;
  markCheckoutFailed(intentId: string, safeReason: string): Promise<void>;
};

export class BillingCheckoutRequestError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "BillingCheckoutRequestError";
  }
}

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export function checkoutReturnOrigin() {
  const configured = safe(process.env.MYLEARNA_APP_URL);
  if (!configured) {
    throw new BillingCheckoutRequestError(
      "billing_configuration_missing",
      500,
      "Media storage billing is temporarily unavailable.",
    );
  }
  try {
    const parsed = new URL(configured);
    const isHttps = parsed.protocol === "https:";
    const isLocalHttp =
      process.env.NODE_ENV !== "production" &&
      parsed.protocol === "http:" &&
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1");
    if (
      (!isHttps && !isLocalHttp) ||
      parsed.username ||
      parsed.password ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash
    ) {
      throw new Error("invalid origin");
    }
    return parsed.origin;
  } catch {
    throw new BillingCheckoutRequestError(
      "billing_configuration_invalid",
      500,
      "Media storage billing is temporarily unavailable.",
    );
  }
}

type StripeCheckoutGateway = Pick<Stripe, "customers" | "checkout">;

function sessionId(session: Stripe.Checkout.Session) {
  const id = safe(session.id);
  const url = safe(session.url);
  if (!id || !url) {
    throw new BillingCheckoutRequestError(
      "stripe_checkout_unavailable",
      503,
      "Media storage checkout is temporarily unavailable.",
    );
  }
  return { id, url };
}

function stripeUnixTimestamp(isoTimestamp: string) {
  const milliseconds = Date.parse(isoTimestamp);
  if (!Number.isFinite(milliseconds)) {
    throw new BillingCheckoutRequestError(
      "billing_checkout_expiry_invalid",
      500,
      "Media storage checkout is temporarily unavailable.",
    );
  }
  return Math.floor(milliseconds / 1000);
}

function sameCommercialSnapshot(
  intent: BillingCheckoutIntent,
  expected: { productKey: MediaProductKey; currency: MediaBillingCurrency; amountMinor: number; quotaBytes: number; academicYearId: string },
) {
  return (
    intent.academicYearId === expected.academicYearId &&
    intent.productKey === expected.productKey &&
    intent.currency === expected.currency &&
    intent.amountMinor === expected.amountMinor &&
    intent.quotaBytes === expected.quotaBytes
  );
}

function isMissingStripeSession(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: unknown; statusCode?: unknown };
  return candidate.code === "resource_missing" || candidate.statusCode === 404;
}

function paymentProcessingError() {
  return new BillingCheckoutRequestError(
    "media_checkout_payment_processing",
    409,
    "Your payment is being confirmed. Your media allowance will update shortly.",
  );
}

async function resolveExistingCheckout(input: {
  repository: BillingCheckoutRepository;
  stripe: StripeCheckoutGateway;
  existing: BillingCheckoutIntent;
  expected: { productKey: MediaProductKey; currency: MediaBillingCurrency; amountMinor: number; quotaBytes: number; academicYearId: string };
  now: Date;
}) {
  const sessionId = safe(input.existing.providerCheckoutSessionId);
  if (!sessionId) {
    if (Date.parse(input.existing.expiresAt) <= input.now.getTime()) {
      await input.repository.markCheckoutExpired(input.existing.id);
      return null;
    }
    throw new BillingCheckoutRequestError(
      "media_checkout_already_open",
      409,
      "Your secure checkout is being prepared. Please try again shortly.",
    );
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await input.stripe.checkout.sessions.retrieve(sessionId);
  } catch (error) {
    if (isMissingStripeSession(error)) {
      await input.repository.markCheckoutExpired(input.existing.id);
      return null;
    }
    throw new BillingCheckoutRequestError(
      "stripe_checkout_unavailable",
      503,
      "Media storage checkout is temporarily unavailable.",
    );
  }

  if (session.status === "complete") throw paymentProcessingError();
  if (session.status === "expired") {
    await input.repository.markCheckoutExpired(input.existing.id);
    return null;
  }

  if (session.status !== "open") {
    throw paymentProcessingError();
  }

  if (sameCommercialSnapshot(input.existing, input.expected)) {
    const resumable = sessionIdPair(session);
    return { checkoutUrl: resumable.url, checkoutIntentId: input.existing.id };
  }

  try {
    await input.stripe.checkout.sessions.expire(sessionId);
  } catch (error) {
    if (isMissingStripeSession(error)) {
      await input.repository.markCheckoutExpired(input.existing.id);
      return null;
    }
    let latest: Stripe.Checkout.Session;
    try {
      latest = await input.stripe.checkout.sessions.retrieve(sessionId);
    } catch {
      throw new BillingCheckoutRequestError(
        "stripe_checkout_unavailable",
        503,
        "Media storage checkout is temporarily unavailable.",
      );
    }
    if (latest.status === "expired") {
      await input.repository.markCheckoutExpired(input.existing.id);
      return null;
    }
    if (latest.status === "complete") throw paymentProcessingError();
    throw new BillingCheckoutRequestError(
      "stripe_checkout_unavailable",
      503,
      "Media storage checkout is temporarily unavailable.",
    );
  }
  await input.repository.markCheckoutExpired(input.existing.id);
  return null;
}

function sessionIdPair(session: Stripe.Checkout.Session) {
  const id = safe(session.id);
  const url = safe(session.url);
  if (!id || !url) {
    throw new BillingCheckoutRequestError(
      "stripe_checkout_unavailable",
      503,
      "Media storage checkout is temporarily unavailable.",
    );
  }
  return { id, url };
}

export async function createOneTimeMediaCheckout(input: {
  familyId: unknown;
  productKey: unknown;
  requestedByUserId: string;
  requestedByEmail: string | null | undefined;
  repository: BillingCheckoutRepository;
  stripe: StripeCheckoutGateway;
  now?: Date;
}) {
  const familyId = safe(input.familyId);
  if (!familyId || !isMediaProductKey(input.productKey)) {
    throw new BillingCheckoutRequestError(
      "billing_request_invalid",
      400,
      "Choose an available family media option.",
    );
  }

  if (!(await input.repository.userCanInitiateBilling(familyId, input.requestedByUserId))) {
    throw new BillingCheckoutRequestError(
      "billing_not_authorised",
      403,
      "Only a family owner or parent can manage media storage purchases.",
    );
  }

  const billingProfile = await input.repository.getFamilyBillingProfile(familyId);
  if (!billingProfile) {
    throw new BillingCheckoutRequestError(
      "billing_jurisdiction_required",
      409,
      "Update your family settings with your country and jurisdiction before choosing media storage.",
    );
  }

  let observedOn: string;
  let trustedProduct: ReturnType<typeof getOneTimeMediaProduct>;
  try {
    const billingMarket = resolveFamilyBillingMarket(billingProfile);
    trustedProduct = getOneTimeMediaProduct(billingMarket.countryCode, input.productKey);
    if (!trustedProduct) {
      throw new FamilyBillingEligibilityError(
        "billing_country_unsupported",
        "Media storage purchases are not available in your country yet.",
      );
    }
    observedOn = familyBillingDateKey(billingProfile, input.now);
  } catch (error) {
    if (error instanceof FamilyBillingEligibilityError) {
      throw new BillingCheckoutRequestError(error.code, 409, error.message);
    }
    throw error;
  }
  const academicYear = await input.repository.getCurrentAcademicYear(familyId, observedOn);
  if (!academicYear) {
    throw new BillingCheckoutRequestError(
      "current_learning_year_required",
      409,
      "Set up your current learning year before choosing media storage.",
    );
  }

  if (await input.repository.hasCurrentExplicitMediaEntitlement(familyId, academicYear.id)) {
    throw new BillingCheckoutRequestError(
      "media_entitlement_already_current",
      409,
      "Your family already has media storage for this learning year.",
    );
  }

  const trustedStripeProduct = getTrustedStripeMediaProduct(trustedProduct);
  const expectedSnapshot = {
    productKey: trustedStripeProduct.key,
    currency: trustedStripeProduct.currency,
    amountMinor: trustedStripeProduct.amountMinor,
    quotaBytes: trustedStripeProduct.quotaBytes,
    academicYearId: academicYear.id,
  };
  const now = input.now ?? new Date();
  const existing = await input.repository.findOpenCheckoutIntent(familyId, academicYear.id);
  if (existing) {
    const resumed = await resolveExistingCheckout({
      repository: input.repository,
      stripe: input.stripe,
      existing,
      expected: expectedSnapshot,
      now,
    });
    if (resumed) return resumed;
  }

  let customerId = await input.repository.findFamilyStripeCustomer(familyId);
  if (!customerId) {
    const customer = await input.stripe.customers.create(
      {
        email: safe(input.requestedByEmail) || undefined,
        metadata: { family_id: familyId },
      },
      { idempotencyKey: `mylearna-family-stripe-customer-${familyId}` },
    );
    customerId = await input.repository.saveFamilyStripeCustomer(familyId, customer.id);
  }

  const intentInput = {
    familyId,
    requestedByUserId: input.requestedByUserId,
    productKey: trustedStripeProduct.key,
    currency: trustedStripeProduct.currency,
    amountMinor: trustedStripeProduct.amountMinor,
    academicYearId: academicYear.id,
    periodStartsOn: academicYear.startsOn,
    periodEndsOn: academicYear.endsOn,
    periodLabel: academicYear.label,
    quotaBytes: trustedStripeProduct.quotaBytes,
    provider: "stripe" as const,
    providerCustomerId: customerId,
  };
  let intent: BillingCheckoutIntent;
  try {
    intent = await input.repository.createCheckoutIntent(intentInput);
  } catch (error) {
    if (!(error instanceof BillingCheckoutRequestError) || error.code !== "media_checkout_already_open") {
      throw error;
    }
    const concurrent = await input.repository.findOpenCheckoutIntent(familyId, academicYear.id);
    if (!concurrent) throw error;
    const resumed = await resolveExistingCheckout({
      repository: input.repository,
      stripe: input.stripe,
      existing: concurrent,
      expected: expectedSnapshot,
      now,
    });
    if (resumed) return resumed;
    intent = await input.repository.createCheckoutIntent(intentInput);
  }

  try {
    const origin = checkoutReturnOrigin();
    const session = await input.stripe.checkout.sessions.create({
      mode: "payment",
      currency: trustedStripeProduct.currency.toLowerCase(),
      customer: customerId,
      client_reference_id: intent.id,
      line_items: [{ price: trustedStripeProduct.stripePriceId, quantity: 1 }],
      expires_at: stripeUnixTimestamp(intent.expiresAt),
      success_url: `${origin}/my-settings?billing=success`,
      cancel_url: `${origin}/my-settings?billing=cancelled`,
      metadata: {
        checkout_intent_id: intent.id,
        family_id: familyId,
        academic_year_id: academicYear.id,
        media_product_key: trustedStripeProduct.key,
      },
      integration_identifier: createStripeIntegrationIdentifier(),
    }, {
      idempotencyKey: `mylearna-media-checkout-${intent.id}`,
    });
    const createdSession = sessionId(session);
    await input.repository.markCheckoutCreated(intent.id, createdSession.id);
    return { checkoutUrl: createdSession.url, checkoutIntentId: intent.id };
  } catch (error) {
    await input.repository.markCheckoutFailed(intent.id, "checkout_creation_failed");
    if (error instanceof BillingCheckoutRequestError) throw error;
    throw new BillingCheckoutRequestError(
      "stripe_checkout_unavailable",
      503,
      "Media storage checkout is temporarily unavailable.",
    );
  }
}

function throwDatabaseError(error: { message?: string } | null, fallback: string): never {
  throw new Error(safe(error?.message) || fallback);
}

export function createSupabaseBillingCheckoutRepository() : BillingCheckoutRepository {
  const db = createBillingAdminClient();
  return {
    async userCanInitiateBilling(familyId, userId) {
      const response = await db
        .from("family_members")
        .select("id")
        .eq("family_id", familyId)
        .eq("user_id", userId)
        .in("role", [...BILLING_AUTHORITY_ROLES])
        .maybeSingle();
      if (response.error) throwDatabaseError(response.error, "Unable to verify billing authority.");
      return Boolean(response.data);
    },
    async getFamilyBillingProfile(familyId) {
      const response = await db
        .from("family_profiles")
        .select("country_code,jurisdiction_code")
        .eq("id", familyId)
        .maybeSingle();
      if (response.error) throwDatabaseError(response.error, "Unable to load family billing settings.");
      if (!response.data) return null;
      return {
        countryCode: safe(response.data.country_code) || null,
        jurisdictionCode: safe(response.data.jurisdiction_code) || null,
      };
    },
    async getCurrentAcademicYear(familyId, observedOn) {
      const response = await db
        .from("academic_years")
        .select("id,starts_on,ends_on,title")
        .eq("family_id", familyId)
        .lte("starts_on", observedOn)
        .gte("ends_on", observedOn)
        .order("starts_on", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (response.error) throwDatabaseError(response.error, "Unable to resolve the current learning year.");
      if (!response.data) return null;
      return {
        id: safe(response.data.id),
        startsOn: safe(response.data.starts_on),
        endsOn: safe(response.data.ends_on),
        label: safe(response.data.title),
      };
    },
    async hasCurrentExplicitMediaEntitlement(familyId, academicYearId) {
      const response = await db
        .from("family_entitlements")
        .select("id")
        .eq("family_id", familyId)
        .eq("academic_year_id", academicYearId)
        .eq("entitlement_key", "evidence_media")
        .in("status", ["active", "grace"])
        .limit(1);
      if (response.error) throwDatabaseError(response.error, "Unable to verify current media storage.");
      return (response.data ?? []).length > 0;
    },
    async findOpenCheckoutIntent(familyId, academicYearId) {
      const response = await db
        .from("billing_checkout_intents")
        .select("id,family_id,requested_by_user_id,product_key,currency,amount_minor,academic_year_id,period_starts_on,period_ends_on,period_label,quota_bytes,provider,provider_customer_id,provider_checkout_session_id,provider_payment_intent_id,expires_at,status")
        .eq("family_id", familyId)
        .eq("academic_year_id", academicYearId)
        .in("status", ["pending", "checkout_created"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (response.error) throwDatabaseError(response.error, "Unable to load the existing media checkout.");
      if (!response.data) return null;
      const row = response.data as Record<string, unknown>;
      if (!isMediaProductKey(row.product_key)) return null;
      if (row.currency !== "AUD" && row.currency !== "USD" && row.currency !== "GBP") return null;
      return {
        id: safe(row.id),
        familyId: safe(row.family_id),
        requestedByUserId: safe(row.requested_by_user_id),
        productKey: row.product_key,
        currency: row.currency,
        amountMinor: Number(row.amount_minor),
        academicYearId: safe(row.academic_year_id),
        periodStartsOn: safe(row.period_starts_on),
        periodEndsOn: safe(row.period_ends_on),
        periodLabel: safe(row.period_label),
        quotaBytes: Number(row.quota_bytes),
        provider: "stripe",
        providerCustomerId: safe(row.provider_customer_id),
        providerCheckoutSessionId: safe(row.provider_checkout_session_id) || null,
        providerPaymentIntentId: safe(row.provider_payment_intent_id) || null,
        expiresAt: safe(row.expires_at),
        status: safe(row.status),
      };
    },
    async findFamilyStripeCustomer(familyId) {
      const response = await db
        .from("family_billing_accounts")
        .select("provider_customer_id")
        .eq("family_id", familyId)
        .eq("provider", "stripe")
        .maybeSingle();
      if (response.error) throwDatabaseError(response.error, "Unable to load the family billing account.");
      return safe(response.data?.provider_customer_id) || null;
    },
    async saveFamilyStripeCustomer(familyId, customerId) {
      const inserted = await db
        .from("family_billing_accounts")
        .insert({ family_id: familyId, provider: "stripe", provider_customer_id: customerId })
        .select("provider_customer_id")
        .maybeSingle();
      if (!inserted.error && inserted.data) return safe(inserted.data.provider_customer_id);

      const existing = await db
        .from("family_billing_accounts")
        .select("provider_customer_id")
        .eq("family_id", familyId)
        .eq("provider", "stripe")
        .maybeSingle();
      if (existing.error || !existing.data) {
        throwDatabaseError(existing.error ?? inserted.error, "Unable to save the family billing account.");
      }
      return safe(existing.data.provider_customer_id);
    },
    async createCheckoutIntent(input) {
      const response = await db.rpc("mylearna_prepare_stripe_checkout_intent", {
        p_family_id: input.familyId,
        p_requested_by_user_id: input.requestedByUserId,
        p_product_key: input.productKey,
        p_currency: input.currency,
        p_amount_minor: input.amountMinor,
        p_academic_year_id: input.academicYearId,
        p_period_starts_on: input.periodStartsOn,
        p_period_ends_on: input.periodEndsOn,
        p_period_label: input.periodLabel,
        p_quota_bytes: input.quotaBytes,
        p_provider_customer_id: input.providerCustomerId,
      });
      const row = Array.isArray(response.data) ? response.data[0] : response.data;
      if (response.error || !row) {
        throwDatabaseError(response.error, "Unable to prepare media storage checkout.");
      }
      const outcome = safe((row as { outcome?: unknown }).outcome);
      if (outcome === "current_entitlement_exists") {
        throw new BillingCheckoutRequestError(
          "media_entitlement_already_current",
          409,
          "Your family already has media storage for this learning year.",
        );
      }
      if (outcome === "open_checkout_exists") {
        throw new BillingCheckoutRequestError(
          "media_checkout_already_open",
          409,
          "Your family already has a media storage checkout in progress for this learning year.",
        );
      }
      const id = safe((row as { checkout_intent_id?: unknown }).checkout_intent_id);
      const expiresAt = safe((row as { checkout_intent_expires_at?: unknown }).checkout_intent_expires_at);
      if (outcome !== "created" || !id || !expiresAt) {
        throw new Error("Unable to prepare media storage checkout.");
      }
      return {
        id,
        ...input,
        providerCheckoutSessionId: null,
        providerPaymentIntentId: null,
        expiresAt,
        status: "pending",
      };
    },
    async markCheckoutCreated(intentId, checkoutSessionId) {
      const response = await db
        .from("billing_checkout_intents")
        .update({ status: "checkout_created", provider_checkout_session_id: checkoutSessionId })
        .eq("id", intentId);
      if (response.error) throwDatabaseError(response.error, "Unable to save checkout session.");
    },
    async markCheckoutExpired(intentId) {
      const response = await db
        .from("billing_checkout_intents")
        .update({ status: "expired", updated_at: new Date().toISOString() })
        .eq("id", intentId)
        .in("status", ["pending", "checkout_created"]);
      if (response.error) throwDatabaseError(response.error, "Unable to expire the previous media checkout.");
    },
    async markCheckoutFailed(intentId) {
      const response = await db
        .from("billing_checkout_intents")
        .update({ status: "failed" })
        .eq("id", intentId)
        .eq("status", "pending");
      if (response.error) throwDatabaseError(response.error, "Unable to record checkout failure.");
    },
  };
}
