// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CartView from "./CartView";

const { useMarketplaceCartMock } = vi.hoisted(() => ({ useMarketplaceCartMock: vi.fn() }));
vi.mock("../MarketplaceCartProvider", () => ({ useMarketplaceCart: useMarketplaceCartMock }));

describe("Marketplace cart inventory controls", () => {
  const updateLine = vi.fn();
  const removeLine = vi.fn();
  beforeEach(() => { vi.clearAllMocks(); useMarketplaceCartMock.mockReturnValue({ cart: { id: "cart-1", checkoutUrl: "https://checkout.shopify.com/cart-1", buyerIdentity: { countryCode: "AU" }, totalQuantity: 1, cost: { subtotalAmount: { amount: "19.95", currencyCode: "AUD" }, totalAmount: { amount: "19.95", currencyCode: "AUD" } }, lines: [{ id: "line-1", quantity: 1, cost: { totalAmount: { amount: "19.95", currencyCode: "AUD" }, amountPerQuantity: { amount: "19.95", currencyCode: "AUD" } }, merchandise: { id: "variant-1", title: "Default", availableForSale: true, quantityAvailable: 10, product: { handle: "maths-counting-bears", title: "Maths Counting Bears", featuredImage: null, collections: [] }, price: { amount: "19.95", currencyCode: "AUD" } } }] }, loading: false, error: null, refresh: vi.fn(), updateLine, removeLine }); });

  it("caps cart quantity input at finite availability", () => {
    render(React.createElement(CartView));
    const input = screen.getByLabelText("Quantity");
    expect(input.getAttribute("max")).toBe("10");
    fireEvent.change(input, { target: { value: "11" } });
    expect(updateLine).toHaveBeenCalledWith("line-1", 10);
  });
});
