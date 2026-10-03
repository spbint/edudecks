import { describe, expect, it } from "vitest";
import { NPV_CONFIRMATION_CLUSTERS } from "./numberOperationsNpvConfirmationItems";

describe("NPV confirmation item bank", () => {
  it("provides two fresh confirmation items for every P1-P10 level", () => {
    expect(Object.keys(NPV_CONFIRMATION_CLUSTERS)).toEqual([
      "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
    ]);
    for (const items of Object.values(NPV_CONFIRMATION_CLUSTERS)) {
      expect(items).toHaveLength(2);
    }
  });

  it("keeps all confirmation items unique, versioned and draft-only", () => {
    const all = Object.values(NPV_CONFIRMATION_CLUSTERS).flat();
    expect(all).toHaveLength(20);
    expect(new Set(all.map((item) => item.id)).size).toBe(20);
    expect(all.every((item) => item.version === 1)).toBe(true);
    expect(all.every((item) => item.status === "draft")).toBe(true);
    expect(all.every((item) => item.analytics?.tags?.includes("confirmation"))).toBe(true);
  });

  it("uses direct ordering where ordering is the construct", () => {
    expect(NPV_CONFIRMATION_CLUSTERS[2][0].response.type).toBe("ordering");
    expect(NPV_CONFIRMATION_CLUSTERS[3][0].response.type).toBe("ordering");
    expect(NPV_CONFIRMATION_CLUSTERS[4][0].response.type).toBe("ordering");
    expect(NPV_CONFIRMATION_CLUSTERS[8][0].response.type).toBe("ordering");
    expect(NPV_CONFIRMATION_CLUSTERS[9][0].response.type).toBe("ordering");
    expect(NPV_CONFIRMATION_CLUSTERS[10][1].response.type).toBe("ordering");
  });
});