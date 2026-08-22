// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import FounderActions from "./FounderActions";
import type { FounderDashboardData } from "@/lib/clean/founder/founderDashboard";

const data: FounderDashboardData = {
  generatedAt: "2026-08-22T00:00:00.000Z",
  productActivityAvailable: true,
  today: { newFamilies: 1, activeFamilies: 1, returningFamilies: 0, meaningfulActions: 0 },
  whatChanged: "1 new family joined today.",
  trends: { periodLabel: "Last 7 days", summary: "Steady.", items: [] },
  attention: [],
  customers: [{
    userId: "family-1", familyId: "family-row-1", email: "family@example.com",
    joinedAt: "2026-08-21T12:00:00.000Z", lastSignInAt: "2026-08-21T13:00:00.000Z",
    familyDisplayName: "Example Family", countryCode: "AU", jurisdictionCode: "TAS",
    learnerCount: 1, profileCompleted: true, displayName: "Example Family",
    lastActiveAt: "2026-08-21T13:00:00.000Z", activeDays30: 1,
    myDayViews: 0, calendarActions: 0, captureOpens: 0, capturesSaved: 0,
    portfolioViews: 0, reportViews: 0, coachUses: 0, pathwayViews: 0,
    topArea: null, status: "New", recentActivity: [], activity30: [],
  }],
  journey: [], biggestDrop: null, featureUsage: [],
  returnHealth: { activeLast7Days: 1, activeLast30Days: 1, goingQuiet: 0 },
  acquisitionToday: null,
};

describe("Founder Actions UI", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => cleanup());

  it("shows a prioritized explainable action and a human-reviewed draft option", () => {
    render(<FounderActions data={data} />);
    expect(screen.getByRole("heading", { name: "Founder Actions" })).toBeTruthy();
    expect(screen.getByText("Send a personal welcome")).toBeTruthy();
    expect(screen.getByText(/Nothing is sent automatically/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Draft personal email" })).toBeTruthy();
  });

  it("lets the founder mark an action done and reset the browser-only decision", () => {
    render(<FounderActions data={data} />);
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByText("Send a personal welcome")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Reset 1 hidden action/i }));
    expect(screen.getByText("Send a personal welcome")).toBeTruthy();
  });

  it("keeps Done hidden after a browser reload", async () => {
    const first = render(<FounderActions data={data} />);
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    first.unmount();
    render(<FounderActions data={data} />);
    await waitFor(() => expect(screen.queryByText("Send a personal welcome")).toBeNull());
  });

  it("supports snooze, expiry, dismiss and reset semantics", async () => {
    const first = render(<FounderActions data={data} />);
    fireEvent.click(screen.getByRole("button", { name: "Snooze 3 days" }));
    await waitFor(() => expect(screen.queryByText("Send a personal welcome")).toBeNull());
    first.unmount();

    window.localStorage.setItem("mylearna:founder-actions:v1", JSON.stringify({
      "welcome:family-1": { state: "snoozed", until: Date.now() - 1, updatedAt: Date.now() },
    }));
    render(<FounderActions data={data} />);
    await waitFor(() => expect(screen.getByText("Send a personal welcome")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    await waitFor(() => expect(screen.queryByText("Send a personal welcome")).toBeNull());
    fireEvent.click(screen.getByRole("button", { name: /Reset 1 hidden action/i }));
    expect(screen.getByText("Send a personal welcome")).toBeTruthy();
  });

  it("exposes the evidence behind the suggestion", () => {
    render(<FounderActions data={data} />);
    fireEvent.click(screen.getByText("Evidence"));
    expect(screen.getByText("Family profile is set up")).toBeTruthy();
  });

  it("shows a confident quiet-day state when no strong signals exist", () => {
    render(<FounderActions data={{ ...data, customers: [] }} />);
    expect(screen.getByText("Nothing currently needs action")).toBeTruthy();
    expect(screen.getByText(/Quiet days are valid/i)).toBeTruthy();
  });
});
