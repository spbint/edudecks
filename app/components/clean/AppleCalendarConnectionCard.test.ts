// @vitest-environment jsdom

import { readFileSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AppleCalendarConnectionCard from "@/app/components/clean/AppleCalendarConnectionCard";

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
});

describe("Apple Calendar Settings connection", () => {
  it("shows the not-connected state and creates a memory-only subscription link", async () => {
    const token = "A".repeat(43);
    const feedAddress = "https://www.mylearna.com/api/calendar-feeds/AAAAAAAA.ics";
    const authenticatedFeedUrl = `https://mylearna:${token}@www.mylearna.com/api/calendar-feeds/AAAAAAAA.ics`;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json({ ok: true, status: "not_connected", metadata: null }))
      .mockResolvedValueOnce(
        json(
          {
            ok: true,
            status: "active",
            feedAddress,
            subscriptionPassword: token,
          },
          201,
        ),
      );
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("fetch", fetchMock);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(
      React.createElement(AppleCalendarConnectionCard, {
        familyId: "11111111-1111-4111-8111-111111111111",
        canManage: true,
      }),
    );

    const addButton = await screen.findByRole("button", {
      name: "Add MyLearna calendar",
    });
    expect((addButton as HTMLButtonElement).style.minHeight).toBe("44px");
    fireEvent.click(addButton);

    expect(await screen.findByText("✓ MyLearna calendar ready")).toBeTruthy();
    const appleLink = screen.getByRole("link", { name: "Add to Apple Calendar" });
    expect(appleLink.getAttribute("href")).toBe(
      `webcal://mylearna:${token}@www.mylearna.com/api/calendar-feeds/AAAAAAAA.ics`,
    );
    fireEvent.click(screen.getByRole("button", { name: "Copy calendar link" }));
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(authenticatedFeedUrl),
    );
    expect(window.localStorage.length).toBe(0);
  });

  it("shows active metadata without re-returning the secret URL", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        json({
          ok: true,
          status: "active",
          metadata: { status: "active" },
        }),
      ),
    );

    render(
      React.createElement(AppleCalendarConnectionCard, {
        familyId: "11111111-1111-4111-8111-111111111111",
        canManage: true,
      }),
    );

    expect(await screen.findByText("✓ MyLearna calendar ready")).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Copy calendar link" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(screen.getByText(/Rotate the link to receive a new one/)).toBeTruthy();
  });

  it("rotates and revokes with confirmation", async () => {
    const oldPassword = "A".repeat(43);
    const newPassword = "B".repeat(43);
    const oldFeedAddress = "https://www.mylearna.com/api/calendar-feeds/AAAAAAAA.ics";
    const newFeedAddress = "https://www.mylearna.com/api/calendar-feeds/BBBBBBBB.ics";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json({ ok: true, status: "not_connected" }))
      .mockResolvedValueOnce(
        json({
          ok: true,
          status: "active",
          feedAddress: oldFeedAddress,
          subscriptionPassword: oldPassword,
        }, 201),
      )
      .mockResolvedValueOnce(
        json({
          ok: true,
          status: "active",
          feedAddress: newFeedAddress,
          subscriptionPassword: newPassword,
        }),
      )
      .mockResolvedValueOnce(json({ ok: true, status: "not_connected" }));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      React.createElement(AppleCalendarConnectionCard, {
        familyId: "11111111-1111-4111-8111-111111111111",
        canManage: true,
      }),
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Add MyLearna calendar" }),
    );
    await screen.findByText("✓ MyLearna calendar ready");
    fireEvent.click(screen.getByRole("button", { name: "Rotate link" }));
    expect(await screen.findByText(/Calendar link rotated/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Add to Apple Calendar" }).getAttribute("href"))
      .toContain(`mylearna:${newPassword}@`);

    fireEvent.click(screen.getByRole("button", { name: "Revoke" }));
    expect(await screen.findByText("Apple Calendar link revoked.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add MyLearna calendar" })).toBeTruthy();
    expect(fetchMock.mock.calls.map((call) => call[1]?.method ?? "GET")).toEqual([
      "GET",
      "POST",
      "PATCH",
      "DELETE",
    ]);
  });

  it("denies caregiver management in the UI without requesting metadata", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(
      React.createElement(AppleCalendarConnectionCard, {
        familyId: "11111111-1111-4111-8111-111111111111",
        canManage: false,
      }),
    );
    expect(screen.getByText(/A family owner or parent can manage/)).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sits after the family form and before the My Calendar next step with responsive actions", () => {
    const connection = settingsSource.indexOf("<AppleCalendarConnectionCard");
    const familyForm = settingsSource.indexOf('id="edit-family-settings"');
    const nextCalendar = settingsSource.indexOf('data-guidance-id="settings-next-calendar"');
    expect(familyForm).toBeLessThan(connection);
    expect(connection).toBeLessThan(nextCalendar);
    expect(settingsSource).toContain("grid-template-columns: 1fr !important");
    expect(settingsSource).toContain(
      "grid-template-columns: repeat(auto-fit, minmax(180px, 1fr))",
    );
  });
});
