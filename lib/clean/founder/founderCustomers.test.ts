import { describe, expect, it } from "vitest";
import {
  FOUNDER_ANALYTICS_EXCLUDED_EMAIL_DOMAINS,
  isFounderExcludedAccount,
} from "@/lib/clean/founder/founderCustomers";

describe("Founder analytics account hygiene", () => {
  it("excludes the explicit synthetic domains and Founder account", () => {
    expect(FOUNDER_ANALYTICS_EXCLUDED_EMAIL_DOMAINS).toEqual([
      "mailinator.com",
      "codoteam.com",
      "bezill.com",
      "hutdot.com",
    ]);
    expect(isFounderExcludedAccount("test@mailinator.com")).toBe(true);
    expect(isFounderExcludedAccount("DEV@CODOTEAM.COM")).toBe(true);
    expect(isFounderExcludedAccount("sean@mylearna.com")).toBe(true);
  });

  it("keeps ordinary customer addresses included", () => {
    expect(isFounderExcludedAccount("parent@example.com")).toBe(false);
    expect(isFounderExcludedAccount("family@mylearna.com")).toBe(false);
  });
});
