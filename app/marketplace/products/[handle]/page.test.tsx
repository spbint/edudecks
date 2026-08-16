// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { notFoundMock, getProductMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  getProductMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({ notFound: notFoundMock }));
vi.mock("@/lib/shopify/client", () => ({ getProduct: getProductMock }));
vi.mock("./AddToCartPanel", () => ({ default: () => null }));

import ProductPage from "./page";

const product = {
  id: "product-1",
  handle: "maths-counting-bears",
  title: "Maths Counting Bears",
  description: "A useful maths resource.",
  descriptionHtml: "<p>A useful maths resource.</p>",
  featuredImage: null,
  images: [],
  variants: [],
  vendor: "gofindgod.com",
  productType: "Learning resource",
  tags: [],
  collections: [],
  seo: { title: null, description: null },
};

describe("Marketplace product route isolation", () => {
  afterEach(() => cleanup());
  beforeEach(() => {
    notFoundMock.mockClear();
    getProductMock.mockReset();
  });

  it("uses the not-found boundary for an unapproved or missing product", async () => {
    getProductMock.mockResolvedValue(null);
    await expect(
      ProductPage({ params: Promise.resolve({ handle: "excluded-resource" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledOnce();
  });

  it("fails closed when product resolution fails", async () => {
    getProductMock.mockRejectedValue(new Error("sanitised product failure"));
    await expect(
      ProductPage({ params: Promise.resolve({ handle: "unavailable-resource" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("suppresses the legacy gofindgod.com vendor on an eligible product", async () => {
    getProductMock.mockResolvedValue(product);
    render(await ProductPage({ params: Promise.resolve({ handle: product.handle }) }));
    expect(screen.getByRole("heading", { name: "Maths Counting Bears" })).toBeTruthy();
    expect(screen.queryByText(/gofindgod\.com/i)).toBeNull();
  });
});
