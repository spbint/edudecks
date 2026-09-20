// @vitest-environment jsdom

import { readFileSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadUsage: vi.fn(),
  listAcademicYears: vi.fn(),
  trackProductEvent: vi.fn(),
  fetch: vi.fn(),
  assign: vi.fn(),
}));

vi.mock("@/app/components/AuthUserProvider", () => ({
  useAuthUser: () => ({ user: { id: "user-1" } }),
}));
vi.mock("@/lib/clean/evidence/storageQuota", () => ({
  loadEvidenceMediaEntitlementUsage: mocks.loadUsage,
}));
vi.mock("@/lib/clean/terms/client", () => ({
  listCleanAcademicYears: mocks.listAcademicYears,
}));
vi.mock("@/lib/clean/analytics/productAnalytics", () => ({
  trackProductEvent: mocks.trackProductEvent,
}));

import MediaStorageSettingsCard from "@/app/components/clean/MediaStorageSettingsCard";

const freeUsage = {
  familyId: "family-1",
  academicYearId: "year-1",
  entitlementSource: "free",
  entitlementStatus: "free",
  quotaBytes: 5242880,
  usedBytes: 1048576,
  reservedBytes: 0,
  remainingBytes: 4194304,
  historicalArchiveBytes: 0,
  unresolvedLegacyArchiveBytes: 0,
  isCompatibilityFallback: true,
};

function renderCard(countryCode: string | null = "AU") {
  return render(React.createElement(MediaStorageSettingsCard, { familyId: "family-1", countryCode }));
}

beforeEach(() => {
  vi.stubGlobal("fetch", mocks.fetch);
  vi.stubGlobal("location", { search: "", assign: mocks.assign });
  mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({ checkoutUrl: "https://checkout.stripe.test/cs-1" }) });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("Media storage settings", () => {
  it("shows a truthful 5 MB Free family allowance with current usage", async () => {
    mocks.loadUsage.mockResolvedValue(freeUsage);
    mocks.listAcademicYears.mockResolvedValue([{ id: "year-1", title: "2026 learning year" }]);

    renderCard();

    await screen.findByText("Free media allowance");
    expect(screen.getByText("2026 learning year")).toBeTruthy();
    expect(screen.getByText((content) => content.includes("1 MB") && content.includes("4 MB"))).toBeTruthy();
    expect(screen.getByRole("progressbar", { name: "20% of media storage used" })).toBeTruthy();
  });

  it.each([
    ["AU", "A$14.95 · one-time"],
    ["US", "US$9.99 · one-time"],
    ["UK", "\u00a37.99 · one-time"],
  ])("shows %s family prices and real purchase controls", async (countryCode, price) => {
    mocks.loadUsage.mockResolvedValue(freeUsage);
    mocks.listAcademicYears.mockResolvedValue([]);

    renderCard(countryCode);

    await screen.findByText("Media storage options");
    expect(screen.getByText(price)).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Choose this option" })).toHaveLength(4);
    expect(screen.getAllByText("For one learning year")).toHaveLength(4);
    expect(screen.queryByText(/annual renewals|subscription|\/year/i)).toBeNull();
  });

  it("posts only familyId and productKey, prevents repeat clicks, and redirects to Checkout", async () => {
    mocks.loadUsage.mockResolvedValue(freeUsage);
    mocks.listAcademicYears.mockResolvedValue([]);
    let resolveCheckout: ((value: unknown) => void) | undefined;
    mocks.fetch.mockReturnValue(new Promise((resolve) => { resolveCheckout = resolve; }));

    renderCard("US");
    const button = await screen.findAllByRole("button", { name: "Choose this option" });
    fireEvent.click(button[0]);

    await waitFor(() => expect(mocks.fetch).toHaveBeenCalledOnce());
    expect(mocks.fetch).toHaveBeenCalledWith("/api/billing/stripe/checkout", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ familyId: "family-1", productKey: "MEDIA_100" }),
    }));
    expect((button[0] as HTMLButtonElement).disabled).toBe(true);
    expect((button[1] as HTMLButtonElement).disabled).toBe(true);

    resolveCheckout?.({ ok: true, json: async () => ({ checkoutUrl: "https://checkout.stripe.test/cs-1" }) });
    await waitFor(() => expect(mocks.assign).toHaveBeenCalledWith("https://checkout.stripe.test/cs-1"));
  });

  it("blocks unsupported markets and shows a safe checkout error", async () => {
    mocks.loadUsage.mockResolvedValue(freeUsage);
    mocks.listAcademicYears.mockResolvedValue([]);

    renderCard("NZ");
    await screen.findByText("Media storage options");
    expect(screen.getByText("Media purchases are not available in your country yet.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Choose this option" })).toBeNull();

    cleanup();
    mocks.loadUsage.mockResolvedValue(freeUsage);
    mocks.fetch.mockResolvedValue({ ok: false, json: async () => ({ error: "Checkout is temporarily unavailable." }) });
    renderCard("AU");
    fireEvent.click((await screen.findAllByRole("button", { name: "Choose this option" }))[0]);
    await screen.findByText("Checkout is temporarily unavailable.");
  });

  it.each(["active", "grace"] as const)("does not offer a second purchase for a %s paid entitlement", async (entitlementStatus) => {
    mocks.loadUsage.mockResolvedValue({
      ...freeUsage,
      entitlementSource: "stripe",
      entitlementStatus,
      quotaBytes: 262144000,
      usedBytes: 1048576,
      remainingBytes: 261095424,
      isCompatibilityFallback: false,
    });
    mocks.listAcademicYears.mockResolvedValue([]);

    renderCard("AU");
    await waitFor(() => expect(screen.getAllByText("Included with your current media allowance")).toHaveLength(4));
    expect(screen.getAllByText("250 MB").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Choose this option" })).toBeNull();
  });

  it("keeps over-quota beta history intact but reports zero free upload capacity", async () => {
    mocks.loadUsage.mockResolvedValue({
      ...freeUsage,
      usedBytes: 6 * 1024 * 1024,
      remainingBytes: 0,
    });
    mocks.listAcademicYears.mockResolvedValue([]);

    renderCard("AU");

    await screen.findByText("Free media allowance");
    expect(screen.getByText((content) => content.includes("6 MB") && content.includes("0 bytes"))).toBeTruthy();
    expect(screen.getByRole("progressbar", { name: "100% of media storage used" })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Choose this option" })).toHaveLength(4);
  });

  it("keeps authoritative usage visible when academic-year label enrichment fails", async () => {
    mocks.loadUsage.mockResolvedValue(freeUsage);
    mocks.listAcademicYears.mockRejectedValue(new Error("Academic year labels unavailable"));

    renderCard();

    await screen.findByText("Free media allowance");
    expect(screen.getByText("Current learning year")).toBeTruthy();
    expect(screen.queryByText(/temporarily unavailable/i)).toBeNull();
  });

  it("shows the unavailable state only when authoritative usage cannot load", async () => {
    mocks.loadUsage.mockRejectedValue(new Error("Usage unavailable"));
    mocks.listAcademicYears.mockResolvedValue([{ id: "year-1", title: "2026 learning year" }]);

    renderCard();

    await screen.findByText(/Media storage information is temporarily unavailable/i);
    expect(mocks.listAcademicYears).not.toHaveBeenCalled();
  });

  it("tracks structural view events and contains no Stripe Price ID in browser code", async () => {
    mocks.loadUsage.mockResolvedValue({ ...freeUsage, usedBytes: 5000000, remainingBytes: 242880 });
    mocks.listAcademicYears.mockResolvedValue([]);

    renderCard();

    await screen.findByText(/nearly at your media limit/i);
    await waitFor(() => {
      expect(mocks.trackProductEvent).toHaveBeenCalledWith(
        "media_storage_viewed",
        { area: "my_settings", surface: "media_storage" },
        "user-1",
      );
    });
    const source = readFileSync(join(process.cwd(), "app/components/clean/MediaStorageSettingsCard.tsx"), "utf8");
    expect(source).not.toMatch(/price_1UHc|STRIPE_PRICE_MEDIA/i);
    expect(source).toContain('JSON.stringify({ familyId, productKey })');
  });
});
