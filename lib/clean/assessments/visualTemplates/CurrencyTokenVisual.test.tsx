// @vitest-environment jsdom

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CurrencyTokenVisual } from "./CurrencyTokenVisual";

describe("CurrencyTokenVisual", () => {
  it("renders exact deterministic denomination tokens with an accessible ordered description", () => {
    const { container } = render(
      React.createElement(CurrencyTokenVisual, {
        data: {
          layout: "grid",
          tokens: [
            { denomination: "20c" },
            { denomination: "$1" },
            { denomination: "20c" },
            { denomination: "50c" },
            { denomination: "20c" },
          ],
        },
      }),
    );

    expect(container.querySelectorAll('[data-testid="currency-token"]')).toHaveLength(5);
    expect(screen.getByRole("img").getAttribute("aria-label")).toBe(
      "Money tokens shown in this order: 20c, $1, 20c, 50c, 20c.",
    );
    expect(
      Array.from(container.querySelectorAll('[data-testid="currency-token"]')).map(
        (node) => node.getAttribute("data-denomination"),
      ),
    ).toEqual(["20c", "$1", "20c", "50c", "20c"]);
    const rendered = Array.from(
      container.querySelectorAll<HTMLElement>('[data-testid="currency-token"]'),
    );
    expect(rendered[0].querySelector("svg")?.getAttribute("width")).toBe("67");
    expect(rendered[1].querySelector("svg")?.getAttribute("width")).toBe("59");
    expect(rendered[3].querySelector("svg")?.getAttribute("width")).toBe("74");
    expect(rendered[3].querySelector("polygon")).not.toBeNull();
  });
});
