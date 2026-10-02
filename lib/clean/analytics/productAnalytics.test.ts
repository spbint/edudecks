import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getProductDisplayMode,
  getProductViewportCategory,
  sanitizeProductAnalyticsProperties,
  PRODUCT_ANALYTICS_DISTINCT_ID_KEY,
  resetProductAnalyticsIdentity,
} from "./productAnalytics";

describe("product analytics privacy and device context", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("separates standalone PWA from browser display mode", () => {
    expect(getProductDisplayMode(() => ({ matches: true }))).toBe("standalone");
    expect(getProductDisplayMode(() => ({ matches: false }))).toBe("browser");
    expect(getProductDisplayMode(null)).toBe("unknown");
  });

  it("classifies phone and desktop viewports without claiming PWA", () => {
    expect(getProductViewportCategory(390)).toBe("phone");
    expect(getProductViewportCategory(1600)).toBe("desktop");
  });

  it("keeps media telemetry categorical and strips PII-like fields", () => {
    const properties = sanitizeProductAnalyticsProperties({
      attachmentSource: "camera",
      failureStage: "upload",
      onlineHint: "online",
      displayMode: "standalone",
      fileName: "private-child-name.jpg",
      email: "private@example.com",
      note: "private learning note",
    });
    expect(properties).toMatchObject({
      attachmentSource: "camera",
      failureStage: "upload",
      onlineHint: "online",
      displayMode: "standalone",
    });
    expect(properties).not.toHaveProperty("fileName");
    expect(properties).not.toHaveProperty("email");
    expect(properties).not.toHaveProperty("note");
  });

  it("clears the anonymous analytics identity on sign-out", () => {
    const removeItem = vi.fn();
    vi.stubGlobal("window", { localStorage: { removeItem } });
    resetProductAnalyticsIdentity();
    expect(removeItem).toHaveBeenCalledWith(PRODUCT_ANALYTICS_DISTINCT_ID_KEY);
  });
});
