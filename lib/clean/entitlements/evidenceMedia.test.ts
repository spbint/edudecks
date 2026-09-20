import { describe, expect, it } from "vitest";
import {
  EVIDENCE_MEDIA_TIER_BYTES,
  FREE_EVIDENCE_MEDIA_ALLOWANCE_BYTES,
  getRemainingEvidenceMediaBytes,
} from "@/lib/clean/entitlements/evidenceMedia";

describe("evidence media entitlement byte model", () => {
  it("uses the approved exact binary tier allowances", () => {
    expect(EVIDENCE_MEDIA_TIER_BYTES).toEqual({
      media_100: 104857600,
      media_250: 262144000,
      media_500: 524288000,
      media_1000: 1073741824,
    });
    expect(FREE_EVIDENCE_MEDIA_ALLOWANCE_BYTES).toBe(5242880);
  });

  it("calculates family remaining capacity from retained and reserved bytes", () => {
    expect(getRemainingEvidenceMediaBytes(104857600, 20, 30)).toBe(104857550);
    expect(getRemainingEvidenceMediaBytes(100, 100, 1)).toBe(0);
    expect(getRemainingEvidenceMediaBytes(100, -10, -5)).toBe(100);
  });

  it("keeps capacity reclaimable when retained media is reduced", () => {
    const beforeDelete = getRemainingEvidenceMediaBytes(1000, 750, 100);
    const afterDelete = getRemainingEvidenceMediaBytes(1000, 550, 100);
    expect(afterDelete - beforeDelete).toBe(200);
  });
});
