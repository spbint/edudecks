export type ShopifyErrorCode =
  | "not_configured"
  | "network"
  | "graphql"
  | "invalid_response"
  | "user_error"
  | "not_found";

export class ShopifyError extends Error {
  readonly code: ShopifyErrorCode;
  readonly status: number | null;

  constructor(code: ShopifyErrorCode, message: string, status: number | null = null) {
    super(message);
    this.name = "ShopifyError";
    this.code = code;
    this.status = status;
  }
}

export function safeShopifyMessage(error: unknown, fallback = "The Marketplace is temporarily unavailable.") {
  if (error instanceof ShopifyError && error.code === "not_configured") {
    return "The Marketplace is being prepared. Please try again shortly.";
  }
  return fallback;
}

