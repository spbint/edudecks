import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { sanitizeProductAnalyticsProperties } from "@/lib/clean/analytics/productAnalytics";

const publicAnalyticsSource = readFileSync(
  join(process.cwd(), "app/lib/publicAnalytics.ts"),
  "utf8",
);
const productAnalyticsSource = readFileSync(
  join(process.cwd(), "lib/clean/analytics/productAnalytics.ts"),
  "utf8",
);

describe("public acquisition PostHog bridge", () => {
  it("allows only the safe public acquisition dimensions through the product analytics sanitizer", () => {
    const sanitized = sanitizeProductAnalyticsProperties({
      public_source: "chatgpt",
      page_path: "/demo",
      resource_id: "homeschool-record-keeping",
      resource_asset: "starter-kit",
      email: "private@example.com",
      learnerName: "Private learner",
      referrer: "https://example.com/private",
      utm_campaign: "raw-campaign",
    });

    expect(sanitized).toMatchObject({
      public_source: "chatgpt",
      page_path: "/demo",
      resource_id: "homeschool-record-keeping",
      resource_asset: "starter-kit",
    });
    expect(sanitized.timestamp).toEqual(expect.any(String));
    expect(sanitized).not.toHaveProperty("email");
    expect(sanitized).not.toHaveProperty("learnerName");
    expect(sanitized).not.toHaveProperty("referrer");
    expect(sanitized).not.toHaveProperty("utm_campaign");
  });

  it("sends public acquisition events to PostHog even when Google Analytics is unavailable", () => {
    expect(publicAnalyticsSource).toContain(
      'import { trackProductEvent } from "@/lib/clean/analytics/productAnalytics";',
    );
    expect(publicAnalyticsSource).toContain(
      "const acquisitionParams = buildPublicAcquisitionParams(publicSource, pathname, context);",
    );
    expect(publicAnalyticsSource).toContain("trackProductEvent(eventName, acquisitionParams);");
    expect(publicAnalyticsSource).toContain('if (typeof window.gtag === "function")');
    expect(publicAnalyticsSource).not.toContain(
      'if (typeof window.gtag !== "function") return;',
    );
  });

  it("merges the pre-signup anonymous PostHog identity into the authenticated product identity", () => {
    expect(productAnalyticsSource).toContain("$anon_distinct_id: getAnonymousDistinctId()");
    expect(productAnalyticsSource).toContain('posthogCapture(\n    "$identify"');
    expect(productAnalyticsSource).toContain("trustedProperties: ProductAnalyticsProperties = {}");
  });

  it("keeps the acquisition bridge free of private family or learner content", () => {
    expect(publicAnalyticsSource).not.toMatch(/user\.email|learnerName|familyName|caption|evidenceId/);
    expect(productAnalyticsSource).toContain("UNSAFE_KEY_PATTERN");
  });
});
