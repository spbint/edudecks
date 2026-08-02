// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import MarketplaceHeader from "./MarketplaceHeader";

const { useMarketplaceCartMock } = vi.hoisted(() => ({ useMarketplaceCartMock: vi.fn() }));
vi.mock("./MarketplaceCartProvider", () => ({ useMarketplaceCart: useMarketplaceCartMock }));

describe("Marketplace header", () => {
  afterEach(() => cleanup());

  it("exposes accessible retail navigation and cart count", () => {
    useMarketplaceCartMock.mockReturnValue({ cart: { totalQuantity: 2 } });
    render(React.createElement(MarketplaceHeader));
    expect(screen.getByRole("link", { name: "MyLearna Marketplace home" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Open MyLearna" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Cart with 2 items" })).toBeTruthy();
    expect(screen.getByText("Browse categories")).toBeTruthy();
  });

  it("opens the mobile category menu with keyboard-accessible links", () => {
    useMarketplaceCartMock.mockReturnValue({ cart: null });
    render(React.createElement(MarketplaceHeader));
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    const mobileNavigation = screen.getByRole("navigation", { name: "Mobile Marketplace navigation" });
    expect(mobileNavigation).toBeTruthy();
    expect(within(mobileNavigation).getByRole("link", { name: "Maths Manipulatives" })).toBeTruthy();
    expect(within(mobileNavigation).getByRole("link", { name: "Open MyLearna" })).toBeTruthy();
  });
});
