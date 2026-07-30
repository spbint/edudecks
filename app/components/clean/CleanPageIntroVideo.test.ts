// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import CleanPageIntroVideo from "@/app/components/clean/CleanPageIntroVideo";
import type { PageIntroVideoConfig } from "@/lib/clean/pageIntroVideos";

vi.mock("@/app/components/clean/guidance/GuidanceProvider", () => ({
  useGuidance: () => ({ enabled: false, hydrated: false, setupStatus: "not_started" }),
}));

const config: PageIntroVideoConfig = {
  pageKey: "my-calendar-weekly-planner",
  youtubeId: "fixture-video",
  title: "Weekly planner guide",
  shortTitle: "Watch planner guide",
  description: "A short guide.",
};

describe("CleanPageIntroVideo hydration", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it("hydrates without a recoverable mismatch and applies dismissed state after mount", async () => {
    window.localStorage.setItem("mylearna.pageIntroVideo.dismissed.my-calendar-weekly-planner", "true");
    window.localStorage.setItem("mylearna.pageIntroVideo.storageVersion", "1");

    const element = React.createElement(CleanPageIntroVideo, {
      config,
      className: "calendar-guide",
      variant: "card",
    });
    const serverMarkup = renderToString(element);
    const container = document.createElement("div");
    container.innerHTML = serverMarkup;
    document.body.appendChild(container);
    const recoverableErrors: unknown[] = [];

    await act(async () => {
      hydrateRoot(container, element, { onRecoverableError: (error) => recoverableErrors.push(error) });
    });

    expect(recoverableErrors).toHaveLength(0);
    expect(container.querySelector("section")?.className).toBe("calendar-guide");

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText("Need a quick reminder?")).toBeTruthy();
    expect(screen.queryByText("New to My Calendar?")).toBeNull();
  });
});
