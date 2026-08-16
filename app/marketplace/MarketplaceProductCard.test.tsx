// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import MarketplaceProductCard from "./MarketplaceProductCard";

const baseProduct = {
  id: "product-1",
  handle: "maths-counting-bears",
  title: "Maths Counting Bears",
  vendor: "gofindgod.com",
  productType: "",
  tags: [],
  availableForSale: true,
  featuredImage: null,
  priceRange: {
    minVariantPrice: { amount: "0", currencyCode: "AUD" },
    maxVariantPrice: { amount: "0", currencyCode: "AUD" },
  },
  collections: [],
};

describe("Marketplace product cards", () => {
  afterEach(() => cleanup());

  it("renders Counting Bears without exposing the legacy vendor domain", () => {
    render(React.createElement(MarketplaceProductCard, { product: baseProduct }));
    expect(screen.getByText("Free")).toBeTruthy();
    expect(screen.getByText("Learning resource")).toBeTruthy();
    expect(screen.queryByText("gofindgod.com")).toBeNull();
  });

  it("uses a clear unavailable state", () => {
    render(
      React.createElement(MarketplaceProductCard, {
        product: {
          ...baseProduct,
          availableForSale: false,
          priceRange: {
            minVariantPrice: { amount: "19.95", currencyCode: "AUD" },
            maxVariantPrice: { amount: "19.95", currencyCode: "AUD" },
          },
        },
      }),
    );
    expect(screen.getByRole("status").textContent).toContain("Currently unavailable");
  });
});
