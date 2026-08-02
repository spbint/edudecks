// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CartPage from "./page";

vi.mock("./CartView", () => ({ default: () => React.createElement("div", null, "Cart contents") }));

describe("Marketplace cart page", () => {
  afterEach(() => cleanup());

  it("keeps the checkout pricing guidance visible", () => {
    render(React.createElement(CartPage));
    expect(screen.getByText("Prices and availability are confirmed at checkout.")).toBeTruthy();
  });
});
