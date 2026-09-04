import { describe, expect, it } from "vitest";
import {
  captureAttachmentCategory,
  resolveCaptureSourceSurface,
} from "@/lib/clean/evidence/captureAnalytics";

describe("Capture analytics context", () => {
  it("classifies Capture sources without learner or evidence identifiers", () => {
    expect(resolveCaptureSourceSurface({ hasPathwayContext: true })).toBe("pathways");
    expect(resolveCaptureSourceSurface({ returnTo: "/my-day?date=2026-09-04" })).toBe("my_day");
    expect(resolveCaptureSourceSurface({ hasCalendarItem: true })).toBe("calendar");
    expect(resolveCaptureSourceSurface({ isQuickCapture: true })).toBe("quick_capture");
    expect(resolveCaptureSourceSurface({})).toBe("general");
  });

  it("uses only a broad attachment category", () => {
    expect(captureAttachmentCategory([{ type: "image/jpeg" }])).toBe("image");
    expect(captureAttachmentCategory([{ type: "application/pdf" }])).toBe("document");
  });
});
