// @vitest-environment jsdom

import { readFileSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import GoogleCalendarConnectionCard from "@/app/components/clean/GoogleCalendarConnectionCard";

const settingsSource = readFileSync(
  join(process.cwd(), "app/components/clean/CleanSettingsWorkspace.tsx"),
  "utf8",
);

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.history.replaceState({}, "", "/");
});

describe("Google Calendar Settings connection", () => {
  it("hides the provider when required server configuration is absent", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(json({ ok: true, status: "unavailable", metadata: null })),
    );
    const { container } = render(
      <GoogleCalendarConnectionCard familyId="family-1" canManage />,
    );
    await waitFor(() => expect(container.textContent).toBe(""));
  });

  it("shows a 44px connect action only when the provider is ready", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(json({ ok: true, status: "not_connected" })),
    );
    render(<GoogleCalendarConnectionCard familyId="family-1" canManage />);
    const button = await screen.findByRole("button", { name: "Connect Google Calendar" });
    expect((button as HTMLButtonElement).style.minHeight).toBe("44px");
    expect(screen.getByText(/MyLearna remains the source of truth/)).toBeTruthy();
  });

  it("retries active sync and disconnects with confirmation", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json({ ok: true, status: "active" }))
      .mockResolvedValueOnce(
        json({ ok: true, result: { claimed: 1, succeeded: 1, failed: 0 } }),
      )
      .mockResolvedValueOnce(json({ ok: true, disconnected: true, warningCode: null }));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<GoogleCalendarConnectionCard familyId="family-1" canManage />);
    expect(await screen.findByText("✓ Google Calendar connected")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry sync" }));
    expect(await screen.findByText("Google Calendar sync retried.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Disconnect" }));
    expect(await screen.findByText("Google Calendar disconnected.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Connect Google Calendar" })).toBeTruthy();
    expect(fetchMock.mock.calls.map((call) => call[1]?.method ?? "GET")).toEqual([
      "GET",
      "PATCH",
      "DELETE",
    ]);
  });

  it("makes reconnect dominant when authorization needs attention", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(json({ ok: true, status: "needs_attention" })),
    );
    render(<GoogleCalendarConnectionCard familyId="family-1" canManage />);
    expect(await screen.findByText("Google Calendar needs attention")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reconnect Google Calendar" })).toBeTruthy();
  });

  it("shows a calm recoverable error when status loading fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    render(<GoogleCalendarConnectionCard familyId="family-1" canManage />);
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Google Calendar status could not be loaded",
    );
    expect(screen.getByRole("button", { name: "Connect Google Calendar" })).toBeTruthy();
  });

  it("does not request or expose management controls to caregivers", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { container } = render(
      <GoogleCalendarConnectionCard
        familyId="family-1"
        canManage={false}
      />,
    );
    expect(container.textContent).toBe("");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sits with Microsoft and Apple before the existing My Calendar next step", () => {
    const apple = settingsSource.indexOf("<AppleCalendarConnectionCard");
    const google = settingsSource.indexOf("<GoogleCalendarConnectionCard");
    const microsoft = settingsSource.indexOf("<MicrosoftCalendarConnectionCard");
    const next = settingsSource.indexOf('data-guidance-id="settings-next-calendar"');
    expect(apple).toBeGreaterThan(-1);
    expect(google).toBeLessThan(microsoft);
    expect(microsoft).toBeLessThan(apple);
    expect(apple).toBeLessThan(next);
    expect(settingsSource).toContain("grid-template-columns: 1fr !important");
  });
});
