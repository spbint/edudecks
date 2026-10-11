// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import FamilyEvidenceReview from "./FamilyEvidenceReview";

afterEach(() => cleanup());

describe("FamilyEvidenceReview", () => {
  it("renders five independent areas and a parent-readable evidence story", () => {
    const { container } = render(<FamilyEvidenceReview />);
    expect(screen.getByRole("heading", { name: "My Learning Evidence" })).toBeTruthy();
    const overviewHeading = screen.getByRole("heading", {
      name: "What MyLearna currently knows",
    });
    const overview = overviewHeading.parentElement!.parentElement!;
    for (const area of [
      "Number and place value",
      "Counting processes",
      "Additive strategies",
      "Multiplicative strategies",
      "Understanding money",
    ]) {
      expect(within(overview).getByText(area)).toBeTruthy();
    }
    expect(screen.getByRole("heading", { name: "Current learning view" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "What MyLearna has seen" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Evidence timeline" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "What remains open" })).toBeTruthy();
    expect(container.textContent).not.toMatch(/overall maths level|\d+%|percentile|rank/i);
  });

  it("lets staff inspect unknown, practical and unreviewed states without writes", () => {
    render(<FamilyEvidenceReview />);
    const selector = screen.getByRole("combobox", { name: "Preview state" });
    fireEvent.change(selector, { target: { value: "focused-unknown" } });
    expect(screen.getAllByText("Not enough evidence").length).toBeGreaterThan(0);

    fireEvent.change(selector, { target: { value: "practical-confirmation" } });
    fireEvent.click(screen.getAllByRole("button", { name: "View evidence" })[4]!);
    expect(screen.getAllByText(/practical confirmation required/i).length).toBeGreaterThan(0);

    fireEvent.change(selector, { target: { value: "unreviewed-capture" } });
    expect(screen.getByRole("option", { name: "Unreviewed Capture evidence" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /save|review|confirm/i })).toBeNull();
  });

  it("uses text labels for source lanes and keeps technical provenance private", () => {
    const { container } = render(<FamilyEvidenceReview />);
    fireEvent.click(screen.getAllByRole("button", { name: "View evidence" })[2]!);
    const text = container.textContent ?? "";
    expect(text).toMatch(/Assessment/);
    expect(text).toMatch(/Captured work/);
    expect(text).toMatch(/Parent observation/);
    for (const forbidden of [
      "fixture-family",
      "fixture-human-reviewer",
      "MYL-MATH-AU-NUMERACY-V9",
      "mappingVersion",
      "ruleVersion",
      "service_role",
      "answer key",
      "storage bucket",
    ]) {
      expect(text).not.toContain(forbidden);
    }
  });

  it("offers a navigation-only Continue learning handoff", () => {
    render(<FamilyEvidenceReview />);
    const link = screen.getByRole("link", { name: "Continue learning" });
    expect(link.getAttribute("href")).toMatch(/^\/my-pathways\?/);
    expect(screen.getByText(/does not change the learner's pathway automatically/i)).toBeTruthy();
  });
});
