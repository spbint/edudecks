// @vitest-environment jsdom

import { readFileSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadUsage: vi.fn(),
  trackProductEvent: vi.fn(),
  fetch: vi.fn(),
  confirm: vi.fn(),
}));

vi.mock("@/app/components/AuthUserProvider", () => ({
  useAuthUser: () => ({ user: { id: "user-1" } }),
}));
vi.mock("@/app/components/clean/CleanFamilyWorkspaceProvider", () => ({
  useCleanFamilyWorkspace: () => ({
    loading: false,
    requiresFamilyCreation: false,
    profile: { id: "family-1" },
  }),
}));
vi.mock("@/lib/clean/evidence/storageQuota", () => ({
  loadEvidenceMediaEntitlementUsage: mocks.loadUsage,
}));
vi.mock("@/lib/clean/analytics/productAnalytics", () => ({
  trackProductEvent: mocks.trackProductEvent,
}));

import ManageMediaWorkspace from "@/app/components/clean/ManageMediaWorkspace";

const usage = {
  familyId: "family-1",
  academicYearId: "year-current",
  entitlementSource: "free",
  entitlementStatus: "free",
  quotaBytes: 5 * 1024 * 1024,
  usedBytes: 1024 * 1024,
  reservedBytes: 0,
  remainingBytes: 4 * 1024 * 1024,
  historicalArchiveBytes: 3 * 1024 * 1024,
  unresolvedLegacyArchiveBytes: 0,
  isCompatibilityFallback: true,
};

const payload = {
  learnerOptions: [
    { id: "learner-1", label: "Alex" },
    { id: "learner-2", label: "Sam" },
  ],
  learningYearOptions: [
    { id: "year-current", label: "2026 learning year" },
    { id: "year-old", label: "2025 learning year" },
  ],
  items: [
    {
      assetId: "asset-current",
      academicYearId: "year-current",
      learningYearLabel: "2026 learning year",
      byteSize: 100,
      mimeType: "image/jpeg",
      mediaKind: "image",
      previewUrl: null,
      previewAvailable: false,
      learnerIds: ["learner-1"],
      learnerLabels: ["Alex"],
      evidenceTitle: "Current record",
      evidenceDescription: "Current evidence text",
      observedOn: "2026-09-01",
      uploadedAt: "2026-09-01T00:00:00Z",
    },
    {
      assetId: "asset-old",
      academicYearId: "year-old",
      learningYearLabel: "2025 learning year",
      byteSize: 900,
      mimeType: "application/pdf",
      mediaKind: "file",
      previewUrl: "https://signed.example.test/file",
      previewAvailable: true,
      learnerIds: ["learner-2"],
      learnerLabels: ["Sam"],
      evidenceTitle: "Historical record",
      evidenceDescription: "Historical evidence text",
      observedOn: "2025-05-02",
      uploadedAt: "2025-05-02T00:00:00Z",
    },
  ],
};

beforeEach(() => {
  mocks.loadUsage.mockResolvedValue(usage);
  mocks.fetch.mockImplementation(async (_url: string, init?: RequestInit) => {
    if (init?.method === "DELETE") {
      return { ok: true, json: async () => ({ status: "removed" }) };
    }
    return { ok: true, json: async () => payload };
  });
  mocks.confirm.mockReturnValue(true);
  vi.stubGlobal("fetch", mocks.fetch);
  vi.stubGlobal("confirm", mocks.confirm);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("Manage Media workspace", () => {
  it("shows authoritative usage, filters, largest-first ordering and year distinctions", async () => {
    render(<ManageMediaWorkspace />);

    await screen.findByRole("heading", { name: "Manage media" });
    expect(screen.getByText("5 MB allowance")).toBeTruthy();
    expect(screen.getByText("1 MB")).toBeTruthy();
    expect(screen.getByText("4 MB")).toBeTruthy();
    expect(screen.getByLabelText("Learner")).toBeTruthy();
    expect(screen.getByLabelText("Learning year")).toBeTruthy();
    expect(screen.getByDisplayValue("Largest files first")).toBeTruthy();
    expect(screen.getByText("CURRENT LEARNING YEAR")).toBeTruthy();
    expect(screen.getByText("EARLIER LEARNING YEAR")).toBeTruthy();

    const historical = screen.getByText("Historical record");
    const current = screen.getByText("Current record");
    expect(historical.compareDocumentPosition(current) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Learner"), { target: { value: "learner-1" } });
    expect(screen.getByText("Current record")).toBeTruthy();
    expect(screen.queryByText("Historical record")).toBeNull();
  });

  it("uses signed links without exposing paths and handles unavailable previews", async () => {
    render(<ManageMediaWorkspace />);
    await screen.findByText("Historical record");
    expect(screen.getByRole("link", { name: "View media" }).getAttribute("href")).toBe(
      "https://signed.example.test/file",
    );
    expect(screen.getByText("Signed preview unavailable")).toBeTruthy();
    expect(document.body.textContent).not.toContain("family/family-1/");
  });

  it("confirms removal and sends only family and selected asset IDs", async () => {
    render(<ManageMediaWorkspace />);
    const buttons = await screen.findAllByRole("button", { name: "Remove media" });
    fireEvent.click(buttons[0]);

    await waitFor(() => expect(mocks.confirm).toHaveBeenCalledWith(expect.stringContaining("The learning record will remain")));
    await waitFor(() => {
      const deleteCall = mocks.fetch.mock.calls.find((call) => call[1]?.method === "DELETE");
      expect(deleteCall?.[0]).toBe("/api/media");
      expect(deleteCall?.[1]?.body).toBe(JSON.stringify({ familyId: "family-1", assetId: "asset-old" }));
      expect(String(deleteCall?.[1]?.body)).not.toMatch(/objectPath|byteSize|filename/i);
    });
    await screen.findByText("Media removed. The learning record and its text remain available.");
  });
});

describe("Manage Media routing contract", () => {
  it("is under the authenticated clean layout and adds no global My Media destination", () => {
    const layout = readFileSync(join(process.cwd(), "app/(clean)/layout.tsx"), "utf8");
    const page = readFileSync(join(process.cwd(), "app/(clean)/my-settings/media/page.tsx"), "utf8");
    const shell = readFileSync(join(process.cwd(), "app/components/clean/design-v2/MyLearnaAppShellV2.tsx"), "utf8");
    expect(layout).toContain("requireAuthenticatedRoute");
    expect(page).toContain("ManageMediaWorkspace");
    expect(shell).not.toContain('label: "My Media"');
  });
});
