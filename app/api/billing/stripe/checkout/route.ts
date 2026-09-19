import { NextResponse } from "next/server";
import { getAuthenticatedRouteUser } from "@/lib/auth/serverRouteAuth";
import {
  BillingCheckoutRequestError,
  createOneTimeMediaCheckout,
  createSupabaseBillingCheckoutRepository,
} from "@/lib/billing/stripeCheckout.server";
import { getStripeClient, StripeBillingConfigurationError } from "@/lib/billing/stripe.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export async function POST(request: Request) {
  const user = await getAuthenticatedRouteUser();
  if (!user) {
    return NextResponse.json(
      { code: "billing_authentication_required", error: "Sign in to manage family media storage." },
      { status: 401, headers: { "cache-control": "no-store" } },
    );
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json(
      { code: "billing_request_invalid", error: "Choose an available family media option." },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }

  try {
    const result = await createOneTimeMediaCheckout({
      familyId: body.familyId,
      productKey: body.productKey,
      requestedByUserId: user.id,
      requestedByEmail: user.email,
      repository: createSupabaseBillingCheckoutRepository(),
      stripe: getStripeClient(),
    });
    return NextResponse.json(result, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof BillingCheckoutRequestError) {
      return NextResponse.json(
        { code: error.code, error: error.message },
        { status: error.status, headers: { "cache-control": "no-store" } },
      );
    }
    if (error instanceof StripeBillingConfigurationError) {
      console.error("stripe_billing_configuration_error", { missing: error.missing });
    } else {
      console.error("stripe_checkout_creation_failed", { message: safe(error instanceof Error ? error.message : error) });
    }
    return NextResponse.json(
      {
        code: "stripe_checkout_unavailable",
        error: "Media storage checkout is temporarily unavailable.",
      },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
