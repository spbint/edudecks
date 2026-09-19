// @vitest-environment jsdom

import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadUsage: vi.fn(),
  listAcademicYears: vi.fn(),
  trackProductEvent: vi.fn(),
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

const betaUsage = {
  familyId: "family-1",
  academicYearId: "year-1",
  entitlementSource: "legacy_beta_compatibility",
  entitlementStatus: null,
  quotaBytes: 262144000,
  usedBytes: 104857600,
  reservedBytes: 0,
  remainingBytes: 157286400,
  historicalArchiveBytes: 0,
  unresolvedLegacyArchiveBytes: 0,
  isCompatibilityFallback: true,
};

function renderCard() {
  return render(React.createElement(MediaStorageSettingsCard, { familyId: "family-1" }));
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Media storage settings", () => {
  it("shows a truthful beta family allowance with current usage and no purchase claim", async () => {
    mocks.loadUsage.mockResolvedValue(betaUsage);
    mocks.listAcademicYears.mockResolvedValue([{ id: "year-1", title: "2026 learning year" }]);

    renderCard();

    await screen.findByText("Beta media allowance");
    expect(screen.getByText("2026 learning year")).toBeTruthy();
    expect(screen.getByText("100 MB used · 150 MB remaining")).toBeTruthy();
    expect(screen.getByRole("progressbar", { name: "40% of media storage used" })).toBeTruthy();
    expect(screen.queryByText(/subscribed|purchased/i)).toBeNull();
  });

  it("keeps authoritative usage visible when academic-year label enrichment fails", async () => {
    mocks.loadUsage.mockResolvedValue(betaUsage);
    mocks.listAcademicYears.mockRejectedValue(new Error("Academic year labels unavailable"));

    renderCard();

    await screen.findByText("Beta media allowance");
    expect(screen.getByText("Current learning year")).toBeTruthy();
    expect(screen.getByText("100 MB used · 150 MB remaining")).toBeTruthy();
    expect(screen.queryByText(/temporarily unavailable/i)).toBeNull();
  });

  it("shows the unavailable state only when authoritative usage cannot load", async () => {
    mocks.loadUsage.mockRejectedValue(new Error("Usage unavailable"));
    mocks.listAcademicYears.mockResolvedValue([{ id: "year-1", title: "2026 learning year" }]);

    renderCard();

    await screen.findByText(/Media storage information is temporarily unavailable/i);
    expect(mocks.listAcademicYears).not.toHaveBeenCalled();
    expect(screen.queryByText("Beta media allowance")).toBeNull();
  });

  it("presents family-shared annual options without checkout controls or internal terminology", async () => {
    mocks.loadUsage.mockResolvedValue(betaUsage);
    mocks.listAcademicYears.mockResolvedValue([]);

    const view = renderCard();
    await screen.findByText("Future media storage options");

    expect(screen.getByText("A$14.95/year")).toBeTruthy();
    expect(screen.getByText("A$54.95/year")).toBeTruthy();
    expect(screen.getAllByText("Shared across your family")).toHaveLength(4);
    expect(screen.getAllByText("Coming soon")).toHaveLength(4);
    expect(view.container.querySelectorAll("a,button")).toHaveLength(0);
    expect(view.container.textContent).not.toMatch(/supabase|quota_bytes|storage bucket|object path/i);
  });

  it("uses calm warning copy at the media thresholds and tracks only structural view events", async () => {
    mocks.loadUsage.mockResolvedValue({
      ...betaUsage,
      usedBytes: 250000000,
      remainingBytes: 12144000,
    });
    mocks.listAcademicYears.mockResolvedValue([]);

    renderCard();

    await screen.findByText(/You’re nearly at your media limit/i);
    await waitFor(() => {
      expect(mocks.trackProductEvent).toHaveBeenCalledWith(
        "media_storage_viewed",
        { area: "my_settings", surface: "media_storage" },
        "user-1",
      );
    });
    expect(mocks.trackProductEvent).toHaveBeenCalledWith(
      "media_tier_comparison_viewed",
      { area: "my_settings", surface: "media_storage" },
      "user-1",
    );
  });

  it("keeps a zero allowance readable without producing an invalid progress value", async () => {
    mocks.loadUsage.mockResolvedValue({
      ...betaUsage,
      entitlementSource: "manual",
      entitlementStatus: "expired",
      quotaBytes: 0,
      usedBytes: 0,
      remainingBytes: 0,
      isCompatibilityFallback: false,
    });
    mocks.listAcademicYears.mockResolvedValue([]);

    renderCard();

    await screen.findByText("Media storage is not available for this learning year.");
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("0");
  });
});
