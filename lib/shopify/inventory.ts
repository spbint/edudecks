export const MARKETPLACE_MAX_QUANTITY = 20;

export function effectiveMarketplaceQuantityLimit(
  quantityAvailable: number | null | undefined,
) {
  return typeof quantityAvailable === "number" && Number.isFinite(quantityAvailable)
    ? Math.max(0, Math.min(MARKETPLACE_MAX_QUANTITY, quantityAvailable))
    : MARKETPLACE_MAX_QUANTITY;
}

export function remainingMarketplaceQuantity(
  quantityAvailable: number | null | undefined,
  existingQuantity: number,
) {
  return Math.max(
    0,
    effectiveMarketplaceQuantityLimit(quantityAvailable) - Math.max(0, existingQuantity),
  );
}
