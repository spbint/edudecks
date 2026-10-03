// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./AssessmentPlayerV1", () => ({
  default: ({ items }: { items: Array<{ id: string }> }) =>
    React.createElement("div", { "data-testid": "mock-player" }, items[0]?.id),
}));

import AssessmentItemReviewLab from "./AssessmentItemReviewLab";

afterEach(() => cleanup());

describe("AssessmentItemReviewLab", () => {
  it("opens with the complete first-slice item registry and phone frame", () => {
    render(React.createElement(AssessmentItemReviewLab));

    expect(screen.getByText("Trusted item & visual review")).toBeTruthy();
    expect(screen.getByText("203 items in this view")).toBeTruthy();
    expect(screen.getByLabelText("phone assessment preview")).toBeTruthy();
    expect(screen.getByTestId("mock-player").textContent).toContain("myl-");
  });

  it("filters by pool and search term without leaving the staff review surface", () => {
    render(React.createElement(AssessmentItemReviewLab));

    fireEvent.change(screen.getByLabelText("Pool"), {
      target: { value: "boundary" },
    });
    expect(screen.getByText("87 items in this view")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Search items"), {
      target: { value: "myl-boundary-npv-p05-b-v1" },
    });
    expect(screen.getByText("1 item in this view")).toBeTruthy();
    expect(screen.getByTestId("mock-player").textContent).toBe(
      "myl-boundary-npv-p05-b-v1",
    );
  });

  it("can isolate the fresh confirmation bank", () => {
    render(React.createElement(AssessmentItemReviewLab));

    fireEvent.change(screen.getByLabelText("Pool"), {
      target: { value: "confirmation" },
    });

    expect(screen.getByText("20 items in this view")).toBeTruthy();
    expect(screen.getByTestId("mock-player").textContent).toContain(
      "myl-confirm-npv-",
    );
  });

  it("can isolate the Measurement units cross-strand lane", () => {
    render(React.createElement(AssessmentItemReviewLab));

    fireEvent.change(screen.getByLabelText("Sub-element"), {
      target: { value: "understanding-units-measurement" },
    });

    expect(screen.getByText("25 items in this view")).toBeTruthy();
    expect(screen.getByTestId("mock-player").textContent).toContain(
      "myl-",
    );
  });

  it("can isolate the Understanding chance lane", () => {
    render(React.createElement(AssessmentItemReviewLab));

    fireEvent.change(screen.getByLabelText("Sub-element"), {
      target: { value: "understanding-chance" },
    });

    expect(screen.getByText("15 items in this view")).toBeTruthy();
    expect(screen.getByTestId("mock-player").textContent).toContain(
      "myl-",
    );
  });

  it("can isolate the Interpreting fractions lane", () => {
    render(React.createElement(AssessmentItemReviewLab));

    fireEvent.change(screen.getByLabelText("Sub-element"), {
      target: { value: "interpreting-fractions" },
    });

    expect(screen.getByText("23 items in this view")).toBeTruthy();
    expect(screen.getByTestId("mock-player").textContent).toContain(
      "myl-",
    );
  });

  it("switches the visual review frame to tablet", () => {
    render(React.createElement(AssessmentItemReviewLab));

    fireEvent.change(screen.getByLabelText("Viewport"), {
      target: { value: "tablet" },
    });

    expect(screen.getByLabelText("tablet assessment preview")).toBeTruthy();
  });
});
