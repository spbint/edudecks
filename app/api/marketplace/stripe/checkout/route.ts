import { NextResponse } from "next/server";
import { getAuthenticatedRouteUser } from "@/lib/auth/serverRouteAuth";
import {
  createMarketplaceResourceCheckout,
  MarketplaceCheckoutRequestError,
} from "@/lib/billing/marketplaceCheckout.server";
import {
  getStripeClient,
  StripeBillingConfigurationError,
} from "@/lib/billing/stripe.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export async function POST(request: Request) {
  const user = await getAuthenticatedRouteUser();
  if (!user) {
    return NextResponse.json(
      { code: "marketplace_authentication_required", error: "Sign in to purchase this Marketplace resource." },
      { status: 401, headers: { "cache-control": "no-store" } },
    );
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json(
      { code: "marketplace_checkout_invalid", error: "Choose an available Marketplace resource." },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }

  try {
    const result = await createMarketplaceResourceCheckout({
      familyId: body.familyId,
      externalProductId: body.externalProductId,
      requestedByUserId: user.id,
      requestedByEmail: user.email,
      stripe: getStripeClient(),
    });
    return NextResponse.json(result, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof MarketplaceCheckoutRequestError) {
      return NextResponse.json(
        { code: error.code, error: error.message },
        { status: error.status, headers: { "cache-control": "no-store" } },
      );
    }
    if (error instanceof StripeBillingConfigurationError) {
      console.error("marketplace_stripe_configuration_error", { missing: error.missing });
    } else {
      console.error("marketplace_checkout_creation_failed", {
        message: safe(error instanceof Error ? error.message : error),
      });
    }
    return NextResponse.json(
      { code: "marketplace_checkout_unavailable", error: "Marketplace checkout is temporarily unavailable." },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
