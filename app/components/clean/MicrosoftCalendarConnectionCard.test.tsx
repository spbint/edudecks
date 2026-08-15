// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import MicrosoftCalendarConnectionCard from "@/app/components/clean/MicrosoftCalendarConnectionCard";

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

describe("Microsoft Outlook Settings connection", () => {
  it("hides an unconfigured provider rather than showing a dead button", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        json({ ok: true, status: "unavailable", metadata: null }),
      ),
    );
    const { container } = render(
      <MicrosoftCalendarConnectionCard familyId="family-1" canManage />,
    );
    await waitFor(() => expect(container.textContent).toBe(""));
  });

  it("shows a mobile-safe connect action and canonical-record copy", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(json({ ok: true, status: "not_connected" })),
    );
    render(<MicrosoftCalendarConnectionCard familyId="family-1" canManage />);
    const button = await screen.findByRole("button", {
      name: "Connect Microsoft",
    });
    expect((button as HTMLButtonElement).style.minHeight).toBe("44px");
    expect(screen.getByText(/remains your learning record/)).toBeTruthy();
  });

  it("supports retry and confirmed disconnect", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json({ ok: true, status: "active" }))
      .mockResolvedValueOnce(
        json({ ok: true, result: { claimed: 1, succeeded: 1, failed: 0 } }),
      )
      .mockResolvedValueOnce(
        json({ ok: true, disconnected: true, warningCode: null }),
      );
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<MicrosoftCalendarConnectionCard familyId="family-1" canManage />);
    expect(await screen.findByText("Microsoft Outlook connected")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry sync" }));
    expect(await screen.findByText("Microsoft Outlook sync retried.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Disconnect" }));
    expect(await screen.findByText("Microsoft Outlook disconnected.")).toBeTruthy();
    expect(fetchMock.mock.calls.map((call) => call[1]?.method ?? "GET")).toEqual([
      "GET",
      "PATCH",
      "DELETE",
    ]);
  });

  it("denies caregivers any browser management request", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { container } = render(
      <MicrosoftCalendarConnectionCard familyId="family-1" canManage={false} />,
    );
    expect(container.textContent).toBe("");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
