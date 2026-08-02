// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AddToCartPanel from "./AddToCartPanel";

const { useMarketplaceCartMock } = vi.hoisted(() => ({ useMarketplaceCartMock: vi.fn() }));
vi.mock("../../MarketplaceCartProvider", () => ({ useMarketplaceCart: useMarketplaceCartMock }));

const image = { url: "https://cdn.shopify.com/image.jpg", altText: "Counting bears", width: 100, height: 100 };
const product = {
  id: "product-1", handle: "maths-counting-bears", title: "Maths Counting Bears", description: "Counting bears", descriptionHtml: "<p>Counting bears</p>", featuredImage: image, images: [image],
  variants: [{ id: "variant-1", title: "Default", availableForSale: true, quantityAvailable: 10, selectedOptions: [], price: { amount: "19.95", currencyCode: "AUD" }, compareAtPrice: null, image }],
  vendor: "MyLearna", productType: "Learning resource", tags: [], collections: [], seo: { title: null, description: null },
};

describe("Marketplace add-to-cart inventory controls", () => {
  const addLine = vi.fn();
  afterEach(() => cleanup());
  beforeEach(() => { vi.clearAllMocks(); addLine.mockResolvedValue({ ok: true }); useMarketplaceCartMock.mockReturnValue({ cart: null, addLine }); });

  it("uses finite stock as the maximum and displays availability", () => {
    render(React.createElement(AddToCartPanel, { product }));
    expect(screen.getByText("10 available")).toBeTruthy();
    expect(screen.getByLabelText("Quantity").getAttribute("max")).toBe("10");
  });

  it("retains the application maximum when inventory is not tracked", () => {
    render(React.createElement(AddToCartPanel, { product: { ...product, variants: [{ ...product.variants[0], quantityAvailable: null }] } }));
    expect(screen.getByLabelText("Quantity").getAttribute("max")).toBe("20");
    expect(screen.queryByText("10 available")).toBeNull();
  });

  it("reduces the additional maximum by the quantity already in the cart", () => {
    useMarketplaceCartMock.mockReturnValue({ cart: { lines: [{ merchandise: { id: "variant-1" }, quantity: 1 }] }, addLine });
    render(React.createElement(AddToCartPanel, { product }));
    expect(screen.getByText("1 is already in your cart. You can add up to 9 more.")).toBeTruthy();
    expect(screen.getByLabelText("Quantity").getAttribute("max")).toBe("9");
    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "12" } });
    expect((screen.getByLabelText("Quantity") as HTMLInputElement).value).toBe("9");
  });
});
