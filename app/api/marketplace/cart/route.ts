import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { addCartLine, createCart, getCart, removeCartLine, updateCartLine } from "@/lib/shopify/client";
import { ShopifyError } from "@/lib/shopify/errors";
import type { ShopifyCart } from "@/lib/shopify/types";

const CART_COOKIE = "mylearna_marketplace_cart_id";

function safeError(error: unknown) {
  if (error instanceof ShopifyError && error.code === "not_configured") return { code: "marketplace_not_configured", error: "The Marketplace is being prepared. Please try again shortly." };
  if (error instanceof ShopifyError && error.code === "user_error") return { code: "cart_request_invalid", error: "We could not update your cart. Please check the item and try again." };
  return { code: "marketplace_unavailable", error: "The Marketplace cart is temporarily unavailable. Please try again." };
}

function response(cart: ShopifyCart | null, status = 200) { return NextResponse.json({ cart }, { status }); }

function setCartCookie(result: NextResponse, id: string) {
  result.cookies.set(CART_COOKIE, id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 30, path: "/" });
  return result;
}

export async function GET() {
  const jar = await cookies();
  const id = jar.get(CART_COOKIE)?.value;
  if (!id) return response(null);
  try {
    const cart = await getCart(id);
    if (!cart) { const result = response(null); result.cookies.delete(CART_COOKIE); return result; }
    return response(cart);
  } catch (error) { return NextResponse.json(safeError(error), { status: 503 }); }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const action = body?.action;
  const quantity = Number(body?.quantity);
  const lineId = typeof body?.lineId === "string" ? body.lineId : "";
  const variantId = typeof body?.variantId === "string" ? body.variantId : "";
  if (action !== "add" && action !== "update" && action !== "remove") return NextResponse.json({ code: "invalid_cart_action", error: "That cart request is not available." }, { status: 400 });
  if (action === "add" && (!variantId || !Number.isInteger(quantity) || quantity < 1 || quantity > 20)) return NextResponse.json({ code: "invalid_cart_line", error: "Please choose a valid item quantity." }, { status: 400 });
  if (action === "update" && (!lineId || !Number.isInteger(quantity) || quantity < 1 || quantity > 20)) return NextResponse.json({ code: "invalid_cart_line", error: "Please choose a valid item quantity." }, { status: 400 });
  if (action === "remove" && !lineId) return NextResponse.json({ code: "invalid_cart_line", error: "That cart item is not available." }, { status: 400 });
  const jar = await cookies();
  const existingId = jar.get(CART_COOKIE)?.value;
  try {
    if (action === "add") {
      if (!existingId) {
        const cart = await createCart(variantId, quantity);
        return setCartCookie(response(cart), cart.id);
      }
      const current = await getCart(existingId);
      if (!current) {
        const cart = await createCart(variantId, quantity);
        return setCartCookie(response(cart), cart.id);
      }
      return response(await addCartLine(existingId, variantId, quantity));
    }
    if (!existingId) return response(null, 404);
    const current = await getCart(existingId);
    if (!current) { const result = response(null, 404); result.cookies.delete(CART_COOKIE); return result; }
    return response(action === "update" ? await updateCartLine(existingId, lineId, quantity) : await removeCartLine(existingId, lineId));
  } catch (error) {
    const safe = safeError(error);
    if (error instanceof ShopifyError && error.code === "not_found") { const result = NextResponse.json(safe, { status: 404 }); result.cookies.delete(CART_COOKIE); return result; }
    return NextResponse.json(safe, { status: 503 });
  }
}
