import { describe, expect, it } from "vitest";
import { getEmailAuthDelivery } from "@/lib/authEmailMode";

describe("email auth delivery mode", () => {
  it("defaults safely to magic links", () => {
    expect(getEmailAuthDelivery()).toBe("magic-link");
  });
});
