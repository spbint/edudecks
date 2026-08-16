// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CartView from "./CartView";

const { useMarketplaceCartMock } = vi.hoisted(() => ({
  useMarketplaceCartMock: vi.fn(),
}));
vi.mock("../MarketplaceCartProvider", () => ({
  useMarketplaceCart: useMarketplaceCartMock,
}));

const cart = {
  id: "cart-1",
  checkoutUrl: "https://checkout.shopify.com/cart-1",
  buyerIdentity: { countryCode: "AU" },
  totalQuantity: 1,
  cost: {
    subtotalAmount: { amount: "19.95", currencyCode: "AUD" },
    totalAmount: { amount: "19.95", currencyCode: "AUD" },
  },
  lines: [
    {
      id: "line-1",
      quantity: 1,
      cost: {
        totalAmount: { amount: "19.95", currencyCode: "AUD" },
        amountPerQuantity: { amount: "19.95", currencyCode: "AUD" },
      },
      merchandise: {
        id: "variant-1",
        title: "Default",
        availableForSale: true,
        quantityAvailable: 4,
        product: {
          handle: "maths-counting-bears",
          title: "Maths Counting Bears",
          featuredImage: null,
          collections: [],
        },
        price: { amount: "19.95", currencyCode: "AUD" },
      },
    },
  ],
};

describe("Marketplace cart inventory", () => {
  afterEach(() => cleanup());
  beforeEach(() => {
    useMarketplaceCartMock.mockReturnValue({
      cart,
      loading: false,
      error: null,
      updateLine: vi.fn(),
      removeLine: vi.fn(),
      refresh: vi.fn(),
    });
  });

  it("shows Shopify availability and caps the quantity input", () => {
    render(React.createElement(CartView));
    expect(screen.getByText("4 available")).toBeTruthy();
    expect(screen.getByLabelText("Quantity").getAttribute("max")).toBe("4");
    expect(screen.getByRole("link", { name: "Continue to secure checkout" })).toBeTruthy();
  });
});
