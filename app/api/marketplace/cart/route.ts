import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  addCartLine,
  createCart,
  getCart,
  getMarketplaceVariantAvailability,
  isMarketplaceCartValid,
  removeCartLine,
  updateCartLine,
} from "@/lib/shopify/client";
import { ShopifyError } from "@/lib/shopify/errors";
import { effectiveMarketplaceQuantityLimit } from "@/lib/shopify/inventory";
import type { ShopifyCart } from "@/lib/shopify/types";

const CART_COOKIE = "mylearna_marketplace_cart_v2_id";
const LEGACY_CART_COOKIE = "mylearna_marketplace_cart_id";

function safeError(error: unknown) {
  if (error instanceof ShopifyError && error.code === "not_configured") {
    return {
      code: "marketplace_not_configured",
      error: "The Marketplace is being prepared. Please try again shortly.",
    };
  }
  if (error instanceof ShopifyError && error.code === "user_error") {
    return {
      code: "cart_request_invalid",
      error: "We could not update your cart. Please check the item and try again.",
    };
  }
  if (error instanceof ShopifyError && error.code === "ineligible") {
    return {
      code: "marketplace_item_unavailable",
      error: "This item is not available in MyLearna Marketplace.",
    };
  }
  if (error instanceof ShopifyError && error.code === "quantity_unavailable") {
    return { code: "cart_quantity_unavailable", error: error.message };
  }
  return {
    code: "marketplace_unavailable",
    error: "The Marketplace cart is temporarily unavailable. Please try again.",
  };
}

function response(cart: ShopifyCart | null, status = 200) {
  return NextResponse.json({ cart }, { status });
}

function setCartCookie(result: NextResponse, id: string) {
  result.cookies.set(CART_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return result;
}

function clearCartCookies(result: NextResponse) {
  result.cookies.delete(CART_COOKIE);
  result.cookies.delete(LEGACY_CART_COOKIE);
  return result;
}

function deleteLegacyCookie(result: NextResponse) {
  result.cookies.delete(LEGACY_CART_COOKIE);
  return result;
}

function validCartResponse(cart: ShopifyCart | null, status = 200) {
  if (cart && !isMarketplaceCartValid(cart)) {
    return clearCartCookies(response(null));
  }
  return response(cart, status);
}

function quantityUnavailableResponse(quantityAvailable: number) {
  return deleteLegacyCookie(
    NextResponse.json(
      {
        code: "cart_quantity_unavailable",
        error: `Only ${quantityAvailable} are currently available.`,
      },
      { status: 409 },
    ),
  );
}

export async function GET() {
  const jar = await cookies();
  const id = jar.get(CART_COOKIE)?.value;
  if (!id) return deleteLegacyCookie(response(null));
  try {
    const cart = await getCart(id);
    if (!cart || !isMarketplaceCartValid(cart)) {
      return clearCartCookies(response(null));
    }
    return deleteLegacyCookie(response(cart));
  } catch (error) {
    return deleteLegacyCookie(NextResponse.json(safeError(error), { status: 503 }));
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const action = body?.action;
  const quantity = Number(body?.quantity);
  const lineId = typeof body?.lineId === "string" ? body.lineId : "";
  const variantId = typeof body?.variantId === "string" ? body.variantId : "";
  if (action !== "add" && action !== "update" && action !== "remove") {
    return deleteLegacyCookie(
      NextResponse.json(
        { code: "invalid_cart_action", error: "That cart request is not available." },
        { status: 400 },
      ),
    );
  }
  if (
    action === "add" &&
    (!variantId || !Number.isInteger(quantity) || quantity < 1 || quantity > 20)
  ) {
    return deleteLegacyCookie(
      NextResponse.json(
        { code: "invalid_cart_line", error: "Please choose a valid item quantity." },
        { status: 400 },
      ),
    );
  }
  if (
    action === "update" &&
    (!lineId || !Number.isInteger(quantity) || quantity < 1 || quantity > 20)
  ) {
    return deleteLegacyCookie(
      NextResponse.json(
        { code: "invalid_cart_line", error: "Please choose a valid item quantity." },
        { status: 400 },
      ),
    );
  }
  if (action === "remove" && !lineId) {
    return deleteLegacyCookie(
      NextResponse.json(
        { code: "invalid_cart_line", error: "That cart item is not available." },
        { status: 400 },
      ),
    );
  }

  const jar = await cookies();
  const existingId = jar.get(CART_COOKIE)?.value;
  try {
    if (action === "add") {
      const availability = await getMarketplaceVariantAvailability(variantId);
      if (!availability.eligible || !availability.availableForSale) {
        return deleteLegacyCookie(
          NextResponse.json(
            {
              code: "marketplace_item_unavailable",
              error: "This item is not available in MyLearna Marketplace.",
            },
            { status: 400 },
          ),
        );
      }

      const current = existingId ? await getCart(existingId) : null;
      if (existingId && (!current || !isMarketplaceCartValid(current))) {
        return clearCartCookies(response(null));
      }
      const existingQuantity =
        current?.lines.find((line) => line.merchandise.id === variantId)?.quantity ?? 0;
      const maximum = effectiveMarketplaceQuantityLimit(availability.quantityAvailable);
      if (existingQuantity + quantity > maximum) {
        return quantityUnavailableResponse(availability.quantityAvailable ?? maximum);
      }

      if (!existingId) {
        const cart = await createCart(variantId, quantity);
        if (!isMarketplaceCartValid(cart)) return clearCartCookies(response(null));
        return deleteLegacyCookie(setCartCookie(response(cart), cart.id));
      }
      return deleteLegacyCookie(
        validCartResponse(
          await addCartLine(existingId, variantId, quantity, existingQuantity + quantity),
        ),
      );
    }

    if (!existingId) return deleteLegacyCookie(response(null, 404));
    const current = await getCart(existingId);
    if (!current || !isMarketplaceCartValid(current)) {
      return clearCartCookies(response(null));
    }
    if (action === "update") {
      const line = current.lines.find((item) => item.id === lineId);
      const maximum = effectiveMarketplaceQuantityLimit(line?.merchandise.quantityAvailable);
      if (quantity > maximum) {
        return quantityUnavailableResponse(line?.merchandise.quantityAvailable ?? maximum);
      }
      return deleteLegacyCookie(
        validCartResponse(await updateCartLine(existingId, lineId, quantity, quantity)),
      );
    }
    return deleteLegacyCookie(validCartResponse(await removeCartLine(existingId, lineId)));
  } catch (error) {
    const safe = safeError(error);
    if (error instanceof ShopifyError && error.code === "not_found") {
      return deleteLegacyCookie(
        clearCartCookies(NextResponse.json(safe, { status: 404 })),
      );
    }
    return deleteLegacyCookie(NextResponse.json(safe, { status: 503 }));
  }
}
