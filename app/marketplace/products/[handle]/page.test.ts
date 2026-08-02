import { beforeEach, describe, expect, it, vi } from "vitest";

const { notFoundMock, getProductMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => { throw new Error("NEXT_NOT_FOUND"); }),
  getProductMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({ notFound: notFoundMock }));
vi.mock("@/lib/shopify/client", () => ({ getProduct: getProductMock }));

import ProductPage from "./page";

describe("Marketplace product route isolation", () => {
  beforeEach(() => {
    notFoundMock.mockClear();
    getProductMock.mockReset();
  });

  it("uses the Next.js not-found boundary for an unapproved or missing product", async () => {
    getProductMock.mockResolvedValue(null);
    await expect(ProductPage({ params: Promise.resolve({ handle: "excluded-resource" }) })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledOnce();
  });

  it("uses the Next.js not-found boundary when product resolution fails", async () => {
    getProductMock.mockRejectedValue(new Error("sanitised product failure"));
    await expect(ProductPage({ params: Promise.resolve({ handle: "unavailable-resource" }) })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledOnce();
  });
});
