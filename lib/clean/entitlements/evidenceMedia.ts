export const EVIDENCE_MEDIA_TIER_BYTES = {
  media_100: 100 * 1024 * 1024,
  media_250: 250 * 1024 * 1024,
  media_500: 500 * 1024 * 1024,
  media_1000: 1024 * 1024 * 1024,
} as const;

export const FREE_EVIDENCE_MEDIA_ALLOWANCE_BYTES = 5 * 1024 * 1024;

export type EvidenceMediaTierKey = keyof typeof EVIDENCE_MEDIA_TIER_BYTES;

export function getRemainingEvidenceMediaBytes(
  quotaBytes: number,
  usedBytes: number,
  reservedBytes: number,
) {
  return Math.max(
    0,
    Math.max(0, quotaBytes) - Math.max(0, usedBytes) - Math.max(0, reservedBytes),
  );
}
