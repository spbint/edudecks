// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";
import {
  PENDING_MARKETPLACE_DESTINATION_KEY,
  consumePendingMarketplaceDestination,
  readPendingMarketplaceDestination,
  rememberPendingMarketplaceDestination,
} from "@/lib/authPendingMarketplaceDestination";

describe("pending Marketplace auth destination", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("persists and consumes an exact Resource Cupboard handoff", () => {
    const destination =
      "/my-resources?add_marketplace=MYL-CLASSICAL-Y34-A-U1-E01&source=marketplace";

    rememberPendingMarketplaceDestination(destination);

    expect(
      window.sessionStorage.getItem(PENDING_MARKETPLACE_DESTINATION_KEY),
    ).toBe(destination);
    expect(readPendingMarketplaceDestination()).toBe(destination);
    expect(consumePendingMarketplaceDestination()).toBe(destination);
    expect(readPendingMarketplaceDestination()).toBeNull();
  });

  it("persists a canonical My Pathways handoff", () => {
    const destination =
      "/my-pathways?subjectKey=classical&pathwayStepId=classical%3A%3Ahistory-and-civilisation";

    rememberPendingMarketplaceDestination(destination);

    expect(readPendingMarketplaceDestination()).toBe(destination);
  });

  it("clears stale Marketplace state when a later auth flow is unrelated or unsafe", () => {
    rememberPendingMarketplaceDestination(
      "/my-resources?add_marketplace=MYL-CLASSICAL-Y34-A-U1-E01",
    );
    expect(readPendingMarketplaceDestination()).not.toBeNull();

    rememberPendingMarketplaceDestination("/my-day");
    expect(readPendingMarketplaceDestination()).toBeNull();

    rememberPendingMarketplaceDestination("/my-pathways?subjectKey=classical");
    expect(readPendingMarketplaceDestination()).not.toBeNull();

    rememberPendingMarketplaceDestination("https://example.com/my-resources");
    expect(readPendingMarketplaceDestination()).toBeNull();

    rememberPendingMarketplaceDestination("/my-pathways?subjectKey=classical");
    expect(readPendingMarketplaceDestination()).not.toBeNull();

    rememberPendingMarketplaceDestination("//example.com/my-pathways");
    expect(readPendingMarketplaceDestination()).toBeNull();
  });
});
