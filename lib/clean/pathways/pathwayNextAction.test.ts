import { describe, expect, it } from "vitest";
import { resolvePathwayNextAction } from "@/lib/clean/pathways/pathwayNextAction";

const allUnavailable = {
  "check-understanding": false,
  practise: false,
  "next-step": false,
  worksheet: false,
  "capture-evidence": false,
};

function resolve(input: Partial<Parameters<typeof resolvePathwayNextAction>[0]> = {}) {
  return resolvePathwayNextAction({
    autoCheckStatus: null,
    parentProgress: "Not checked yet",
    availability: { ...allUnavailable, "capture-evidence": true },
    ...input,
  });
}

describe("resolvePathwayNextAction", () => {
  it("recommends checking understanding before a first available check", () => {
    expect(
      resolve({ availability: { ...allUnavailable, "check-understanding": true, practise: true, "capture-evidence": true } }),
    ).toMatchObject({ primary: "check-understanding", secondary: ["practise", "capture-evidence"] });
  });

  it.each(["Needs support", "Developing"] as const)(
    "recommends practice for %s when it is available",
    (autoCheckStatus) => {
      expect(
        resolve({
          autoCheckStatus,
          availability: { ...allUnavailable, "check-understanding": true, practise: true, "capture-evidence": true },
        }),
      ).toMatchObject({ primary: "practise", secondary: ["check-understanding", "capture-evidence"] });
    },
  );

  it("uses the existing check-again direction for consolidating", () => {
    expect(
      resolve({
        autoCheckStatus: "Consolidating",
        availability: { ...allUnavailable, "check-understanding": true, practise: true, "capture-evidence": true },
      }),
    ).toMatchObject({ primary: "check-understanding" });
  });

  it("recommends the existing next step only when a secure step has one", () => {
    expect(
      resolve({
        autoCheckStatus: "Secure",
        availability: { ...allUnavailable, "next-step": true, practise: true, "capture-evidence": true },
      }),
    ).toMatchObject({ primary: "next-step", secondary: ["practise", "capture-evidence"] });
  });

  it("falls back to a real action instead of presenting an unavailable recommendation", () => {
    expect(
      resolve({
        autoCheckStatus: "Needs support",
        availability: { ...allUnavailable, worksheet: true, "capture-evidence": true },
      }),
    ).toMatchObject({ primary: "worksheet", secondary: ["capture-evidence"] });
  });

  it("does not create a dead primary action when no action is available", () => {
    expect(resolve({ availability: allUnavailable })).toEqual({
      primary: null,
      secondary: [],
      supportingText: null,
    });
  });
});
