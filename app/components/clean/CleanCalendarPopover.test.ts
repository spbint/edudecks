// @vitest-environment jsdom

import { readFileSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CleanCalendarPopover from "@/app/components/clean/CleanCalendarPopover";

const popoverSource = readFileSync(
  join(process.cwd(), "app/components/clean/CleanCalendarPopover.tsx"),
  "utf8",
);
const workspaceSource = readFileSync(
  join(process.cwd(), "app/components/clean/CleanCalendarWorkspace.tsx"),
  "utf8",
);

function buildProps(overrides: Record<string, unknown> = {}) {
  return {
    open: true,
    mode: "create" as const,
    plannedDate: "2026-08-17",
    title: "",
    learnerId: "",
    learningArea: "",
    learningAreaCustom: "",
    timeMode: "untimed" as const,
    startTime: "",
    endTime: "",
    description: "",
    programId: "",
    programSegmentId: "",
    learnerOptions: [{ value: "learner-1", label: "Alex" }],
    programOptions: [{ value: "program-1", label: "Maths" }],
    segmentOptions: [],
    onChangeTitle: vi.fn(),
    onChangeLearnerId: vi.fn(),
    onChangeLearningArea: vi.fn(),
    onChangeLearningAreaCustom: vi.fn(),
    onChangeTimeMode: vi.fn(),
    onChangeStartTime: vi.fn(),
    onChangeEndTime: vi.fn(),
    onChangeDescription: vi.fn(),
    onChangeProgramId: vi.fn(),
    onChangeProgramSegmentId: vi.fn(),
    onClose: vi.fn(),
    onSave: vi.fn(),
    saving: false,
    errorMessage: null,
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute("style");
  document.body.removeAttribute("style");
  Object.defineProperty(window, "visualViewport", {
    configurable: true,
    value: undefined,
  });
  vi.restoreAllMocks();
});

describe("Calendar learning block dialog", () => {
  it.each([
    [320, 568],
    [375, 667],
    [390, 844],
    [393, 852],
    [430, 932],
  ])(
    "keeps the complete action structure mounted at %ipx",
    async (width, viewportHeight) => {
      Object.defineProperty(window, "scrollTo", {
        configurable: true,
        value: vi.fn(),
      });
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        value: width,
      });
      const viewport = new EventTarget() as EventTarget & {
        height: number;
        offsetTop: number;
      };
      viewport.height = viewportHeight;
      viewport.offsetTop = 0;
      Object.defineProperty(window, "visualViewport", {
        configurable: true,
        value: viewport,
      });

      const { container } = render(
        React.createElement(CleanCalendarPopover, buildProps()),
      );
      const overlay = container.querySelector<HTMLElement>(
        ".mylearna-calendar-popover-overlay",
      );

      expect(screen.getByRole("dialog", { name: "Add learning block" })).toBeTruthy();
      expect(container.querySelector(".mylearna-calendar-popover-body")).toBeTruthy();
      expect(container.querySelector(".mylearna-calendar-popover-footer")).toBeTruthy();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeTruthy();
      expect(screen.getByRole("button", { name: "Save learning block" })).toBeTruthy();
      await waitFor(() =>
        expect(overlay?.style.getPropertyValue("--calendar-popover-visible-height")).toBe(
          `${viewportHeight}px`,
        ),
      );
    },
  );

  it("uses a labelled modal, locks background scroll, traps focus and restores the trigger", async () => {
    Object.defineProperty(window, "scrollTo", {
      configurable: true,
      value: vi.fn(),
    });
    const trigger = document.createElement("button");
    trigger.textContent = "Open add learning block";
    document.body.append(trigger);
    trigger.focus();
    const onClose = vi.fn();

    const view = render(React.createElement(CleanCalendarPopover, buildProps({ onClose })));

    const dialog = screen.getByRole("dialog", { name: "Add learning block" });
    const titleInput = screen.getByLabelText("What are you planning?");
    const saveButton = screen.getByRole("button", { name: "Save learning block" });

    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(document.documentElement.style.overflow).toBe("hidden");
    expect(document.body.style.position).toBe("fixed");
    await waitFor(() => expect(document.activeElement).toBe(titleInput));

    saveButton.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(titleInput);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);

    view.unmount();
    await waitFor(() => expect(document.activeElement).toBe(trigger));
    expect(document.documentElement.style.overflow).toBe("");
    expect(document.body.style.position).toBe("");
    trigger.remove();
  });

  it("keeps Cancel and the pending Save action clear and exposes errors accessibly", () => {
    Object.defineProperty(window, "scrollTo", {
      configurable: true,
      value: vi.fn(),
    });
    render(
      React.createElement(
        CleanCalendarPopover,
        buildProps({ saving: true, errorMessage: "Choose a valid time range." }),
      ),
    );

    expect(screen.getByRole("alert").textContent).toContain("Choose a valid time range.");
    expect(screen.getByRole("status").textContent).toContain("Saving learning block");
    expect((screen.getByRole("button", { name: "Cancel" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect((screen.getByRole("button", { name: "Saving…" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it("routes the persistent Save and Cancel actions through the shared handlers", () => {
    Object.defineProperty(window, "scrollTo", {
      configurable: true,
      value: vi.fn(),
    });
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(
      React.createElement(
        CleanCalendarPopover,
        buildProps({ onSave, onClose, title: "Nature journal" }),
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: "Save learning block" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("progressively follows visualViewport resize events", async () => {
    Object.defineProperty(window, "scrollTo", {
      configurable: true,
      value: vi.fn(),
    });
    const viewport = new EventTarget() as EventTarget & {
      height: number;
      offsetTop: number;
    };
    viewport.height = 480;
    viewport.offsetTop = 12;
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: viewport,
    });

    const { container } = render(
      React.createElement(CleanCalendarPopover, buildProps()),
    );
    const overlay = container.querySelector<HTMLElement>(
      ".mylearna-calendar-popover-overlay",
    );
    expect(overlay).not.toBeNull();

    await waitFor(() => {
      expect(overlay?.style.getPropertyValue("--calendar-popover-visible-height")).toBe(
        "480px",
      );
      expect(overlay?.style.getPropertyValue("--calendar-popover-offset-top")).toBe(
        "12px",
      );
    });

    viewport.height = 320;
    viewport.dispatchEvent(new Event("resize"));
    await waitFor(() =>
      expect(overlay?.style.getPropertyValue("--calendar-popover-visible-height")).toBe(
        "320px",
      ),
    );
  });

  it("scrolls a focused lower field into the internal form viewport", async () => {
    Object.defineProperty(window, "scrollTo", {
      configurable: true,
      value: vi.fn(),
    });
    const { container } = render(
      React.createElement(CleanCalendarPopover, buildProps()),
    );
    const scrollBody = container.querySelector<HTMLElement>(
      ".mylearna-calendar-popover-body",
    );
    const titleInput = screen.getByLabelText("What are you planning?");
    const notes = screen.getByLabelText("Notes") as HTMLTextAreaElement;
    expect(scrollBody).not.toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(titleInput));

    vi.spyOn(scrollBody!, "getBoundingClientRect").mockReturnValue({
      top: 100,
      bottom: 400,
      left: 0,
      right: 320,
      width: 320,
      height: 300,
      x: 0,
      y: 100,
      toJSON: () => ({}),
    });
    vi.spyOn(notes, "getBoundingClientRect").mockReturnValue({
      top: 430,
      bottom: 530,
      left: 16,
      right: 304,
      width: 288,
      height: 100,
      x: 16,
      y: 430,
      toJSON: () => ({}),
    });

    scrollBody!.scrollTop = 0;
    notes.focus();
    await waitFor(() => expect(scrollBody!.scrollTop).toBeGreaterThan(0));
  });

  it("keeps one shared form while using full-screen mobile and centred desktop structure", () => {
    expect(popoverSource).toContain("@supports (height: 100svh)");
    expect(popoverSource).toContain("@supports (height: 100dvh)");
    expect(popoverSource).toContain("@media (max-width: 720px)");
    expect(popoverSource).toContain("height: 100% !important");
    expect(popoverSource).toContain("width: \"min(560px, 100%)\"");
    expect(popoverSource).toContain("gridTemplateRows: \"auto minmax(0, 1fr) auto\"");
    expect(popoverSource).toContain("overflow-y: auto");
    expect(popoverSource).toContain("env(safe-area-inset-bottom, 0px)");
    expect(popoverSource).toContain("scroll-padding-bottom");
    expect(popoverSource).toContain("scroll-margin-bottom");
    expect(popoverSource.match(/<form/g)?.length).toBe(1);
  });

  it("guards the shared save handler against duplicate submissions", () => {
    expect(workspaceSource).toContain("popoverSubmitLockRef.current");
    expect(workspaceSource).toContain(
      "if (!workspace.profile || submitting || popoverSubmitLockRef.current) return;",
    );
    expect(workspaceSource).toContain("errorMessage={actionError}");
  });
});
