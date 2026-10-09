// @vitest-environment jsdom

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CounterSetVisual } from "./CounterSetVisual";

describe("CounterSetVisual", () => {
  it("renders a large scattered counting collection without overlapping counters", () => {
    const { container } = render(
      React.createElement(CounterSetVisual, {
        data: {
          quantity: 14,
          arrangement: "scattered",
          seed: 514,
          maxQuantity: 20,
        },
        altText:
          "A scattered collection of identical counters. The quantity is intentionally not stated because counting the collection is the task.",
      }),
    );

    const groups = Array.from(
      container.querySelectorAll('[data-testid="counter"]'),
    );
    expect(groups).toHaveLength(14);
    expect(screen.getByRole("img").getAttribute("aria-label")).not.toContain("14");

    const circles = groups.map((group) => group.querySelector("circle"));
    const points = circles.map((circle) => ({
      x: Number(circle?.getAttribute("cx")),
      y: Number(circle?.getAttribute("cy")),
      r: Number(circle?.getAttribute("r")),
    }));

    for (let a = 0; a < points.length; a += 1) {
      for (let b = a + 1; b < points.length; b += 1) {
        const dx = points[a]!.x - points[b]!.x;
        const dy = points[a]!.y - points[b]!.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        expect(distance, `counter ${a} vs ${b}`).toBeGreaterThanOrEqual(
          points[a]!.r + points[b]!.r,
        );
      }
    }
  });
});
