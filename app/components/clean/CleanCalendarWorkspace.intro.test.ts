// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { CleanCalendarIntroVideo } from "@/app/components/clean/CleanCalendarWorkspace";

vi.mock("@/app/components/clean/guidance/GuidanceProvider", () => ({
  useGuidance: () => ({ enabled: false, hydrated: false, setupStatus: "not_started" }),
}));

describe("CleanCalendarIntroVideo hydration", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it("keeps the Calendar caller props and post-hydration storage state stable", async () => {
    window.localStorage.setItem("mylearna.pageIntroVideo.watched.my-calendar-term-times", "true");
    window.localStorage.setItem("mylearna.pageIntroVideo.storageVersion", "1");

    const element = React.createElement(CleanCalendarIntroVideo);
    const serverMarkup = renderToString(element);
    const container = document.createElement("div");
    container.innerHTML = serverMarkup;
    document.body.appendChild(container);
    const recoverableErrors: unknown[] = [];

    await act(async () => {
      hydrateRoot(container, element, { onRecoverableError: (error) => recoverableErrors.push(error) });
    });

    expect(recoverableErrors).toHaveLength(0);
    expect(container.querySelector("section")?.className).toBe("mylearna-calendar-intro-video");

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText("Need a quick reminder?")).toBeTruthy();
    expect(screen.queryByText("New to My Calendar?")).toBeNull();
  });
});
