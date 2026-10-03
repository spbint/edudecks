// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import FounderLoading from "./loading";

describe("Founder loading state", () => {
  afterEach(() => cleanup());

  it("shows a visible route-level transition instead of a blank page", () => {
    render(<FounderLoading />);
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByText("Updating Founder view…")).toBeTruthy();
    expect(screen.getByText("Applying the selected population and time window.")).toBeTruthy();
  });
});
