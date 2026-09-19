export const EVIDENCE_MEDIA_TIER_BYTES = {
  media_100: 100 * 1024 * 1024,
  media_250: 250 * 1024 * 1024,
  media_500: 500 * 1024 * 1024,
  media_1000: 1024 * 1024 * 1024,
} as const;

// Phase 2 compatibility only. Existing beta families continue to use this
// allowance until the separate customer-facing media-gate phase is approved.
export const LEGACY_BETA_EVIDENCE_MEDIA_ALLOWANCE_BYTES =
  EVIDENCE_MEDIA_TIER_BYTES.media_250;

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
