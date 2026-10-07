// @vitest-environment jsdom

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CurrencyTokenVisual } from "./CurrencyTokenVisual";

describe("CurrencyTokenVisual", () => {
  it("renders exact deterministic Australian coins with an accessible ordered description", () => {
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
      "Australian coins shown in this order: 20c, $1, 20c, 50c, 20c.",
    );
    expect(
      Array.from(container.querySelectorAll('[data-testid="currency-token"]')).map(
        (node) => node.getAttribute("data-denomination"),
      ),
    ).toEqual(["20c", "$1", "20c", "50c", "20c"]);
  });

  it("preserves relative coin diameters and the dodecagonal 50c shape", () => {
    const { container } = render(
      React.createElement(CurrencyTokenVisual, {
        data: {
          layout: "row",
          tokens: [
            { denomination: "5c" },
            { denomination: "10c" },
            { denomination: "20c" },
            { denomination: "50c" },
            { denomination: "$1" },
            { denomination: "$2" },
          ],
        },
      }),
    );

    const tokens = Array.from(
      container.querySelectorAll('[data-testid="currency-token"]'),
    ) as HTMLElement[];
    const byDenomination = new Map(
      tokens.map((node) => [node.dataset.denomination, node]),
    );

    expect(byDenomination.get("5c")?.dataset.diameterMm).toBe("19.41");
    expect(byDenomination.get("10c")?.dataset.diameterMm).toBe("23.6");
    expect(byDenomination.get("20c")?.dataset.diameterMm).toBe("28.65");
    expect(byDenomination.get("50c")?.dataset.diameterMm).toBe("31.65");
    expect(byDenomination.get("$1")?.dataset.diameterMm).toBe("25");
    expect(byDenomination.get("$2")?.dataset.diameterMm).toBe("20.5");

    expect(
      Number.parseFloat(byDenomination.get("50c")?.style.width || "0"),
    ).toBeGreaterThan(
      Number.parseFloat(byDenomination.get("20c")?.style.width || "0"),
    );
    expect(byDenomination.get("50c")?.dataset.coinSides).toBe("12");
    expect(byDenomination.get("20c")?.dataset.coinSides).toBe("circle");
    expect(
      tokens.every((node) => node.dataset.assetKind === "australian-coin"),
    ).toBe(true);
    const visual = container.querySelector(
      '[data-testid="trusted-australian-currency-visual"]',
    ) as HTMLElement;
    expect(visual.style.width).toBe("100%");
    expect(visual.style.boxSizing).toBe("border-box");
    expect((visual.firstElementChild as HTMLElement).style.flexWrap).toBe(
      "wrap",
    );
  });

});
