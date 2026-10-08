// @vitest-environment jsdom

import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import MathematicsLearningProfile from "./MathematicsLearningProfile";
import MathematicsLearningProfilePreview from "./MathematicsLearningProfilePreview";
import { getMathematicsLearningProfileFixtures } from "@/lib/clean/educationalIntelligence/mathematicsLearningProfileFixtures";

afterEach(() => cleanup());

describe("MathematicsLearningProfile", () => {
  const mixed = getMathematicsLearningProfileFixtures().find(
    (fixture) => fixture.id === "mixed",
  )!;

  it("renders the five-area parent profile without an aggregate result", () => {
    const { container } = render(<MathematicsLearningProfile profile={mixed.presentation} />);

    expect(screen.getByRole("heading", { name: "MyLearna Mathematics Learning Profile" })).toBeTruthy();
    expect(screen.getAllByText("Number & Operations profile").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Five-area profile" })).toBeTruthy();
    const overview = screen.getByRole("heading", { name: "Five-area profile" }).parentElement!;
    for (const areaName of [
      "Number and place value",
      "Counting processes",
      "Additive strategies",
      "Multiplicative strategies",
      "Understanding money",
    ]) {
      expect(within(overview).getByText(areaName)).toBeTruthy();
    }
    expect(container.textContent).not.toMatch(/\b\d+%|percentile|pass\/fail/i);
    expect(container.textContent).not.toMatch(/overall maths level/i);
  });

  it("uses status text independently of colour and accessible native details", () => {
    render(<MathematicsLearningProfile profile={mixed.presentation} />);

    for (const label of [
      "Secure",
      "Consolidating",
      "Developing",
      "Needs support",
      "Practical confirmation required",
    ]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
    expect(document.querySelectorAll("details")).toHaveLength(5);
    expect(screen.getByRole("button", { name: "Print profile" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Download PDF" })).toBeTruthy();
  });

  it("shows next-learning actions without leaking technical provenance", () => {
    const { container } = render(<MathematicsLearningProfile profile={mixed.presentation} />);
    expect(screen.getAllByRole("link", { name: "Continue learning" })).toHaveLength(5);
    const text = container.textContent ?? "";
    for (const forbidden of [
      "fixture-item",
      "fixture-construct",
      "fixture-number-operations-rule",
      "routing-only",
      "provisional-moderate",
      "answer key",
      "P1",
    ]) {
      expect(text).not.toContain(forbidden);
    }
  });

  it("provides staff fixtures for all six statuses, mixed, focused and recheck states", () => {
    render(<MathematicsLearningProfilePreview />);
    for (const label of [
      "Secure",
      "Consolidating",
      "Developing",
      "Needs support",
      "Not enough evidence",
      "Practical confirmation required",
    ]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
    expect(screen.getByRole("option", { name: "Mixed five-area profile" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Focused attempt" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Recheck profile" })).toBeTruthy();
  });
});
