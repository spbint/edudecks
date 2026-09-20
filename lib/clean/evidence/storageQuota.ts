import {
  FREE_FAMILY_MEDIA_ALLOWANCE_BYTES,
  type FreePortfolioStorageUsage,
} from "@/lib/clean/entitlements/freeGuardrails";
import { normalizeCleanErrorMessage } from "@/lib/clean/family/client";
import { supabase } from "@/lib/supabaseClient";

type EvidenceMediaEntitlementUsageRow = {
  family_id?: unknown;
  academic_year_id?: unknown;
  entitlement_source?: unknown;
  entitlement_status?: unknown;
  quota_bytes?: unknown;
  used_bytes?: unknown;
  reserved_bytes?: unknown;
  remaining_bytes?: unknown;
  historical_archive_bytes?: unknown;
  unresolved_legacy_archive_bytes?: unknown;
  is_compatibility_fallback?: unknown;
};

type FreePortfolioStorageUsageRow = {
  family_id?: unknown;
  academic_year_id?: unknown;
  allowance_bytes?: unknown;
  used_bytes?: unknown;
  reserved_bytes?: unknown;
  remaining_bytes?: unknown;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function toBytes(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, value);
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return Math.max(0, parsed);
  }
  return fallback;
}

function firstRow(value: unknown): FreePortfolioStorageUsageRow | null {
  if (Array.isArray(value)) return (value[0] as FreePortfolioStorageUsageRow | undefined) ?? null;
  if (value && typeof value === "object") return value as FreePortfolioStorageUsageRow;
  return null;
}

export type EvidenceMediaEntitlementUsage = {
  familyId: string;
  academicYearId: string | null;
  entitlementSource: string;
  entitlementStatus: string;
  quotaBytes: number;
  usedBytes: number;
  reservedBytes: number;
  remainingBytes: number;
  historicalArchiveBytes: number;
  unresolvedLegacyArchiveBytes: number;
  isCompatibilityFallback: boolean;
};

export async function loadEvidenceMediaEntitlementUsage(
  familyId: string,
  observedOn: string,
): Promise<EvidenceMediaEntitlementUsage | null> {
  const cleanFamilyId = safe(familyId);
  const cleanObservedOn = safe(observedOn);
  if (!cleanFamilyId || !cleanObservedOn) return null;

  const response = await supabase.rpc("mylearna_get_evidence_media_usage", {
    p_family_id: cleanFamilyId,
    p_observed_on: cleanObservedOn,
  });

  if (response.error) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Portfolio storage usage is unavailable right now.",
        "evidence",
      ),
    );
  }

  const row = firstRow(response.data) as EvidenceMediaEntitlementUsageRow | null;
  if (!row) return null;

  const quotaBytes = toBytes(
    row.quota_bytes,
    FREE_FAMILY_MEDIA_ALLOWANCE_BYTES,
  );
  const usedBytes = toBytes(row.used_bytes);
  const reservedBytes = toBytes(row.reserved_bytes);

  return {
    familyId: safe(row.family_id) || cleanFamilyId,
    academicYearId: safe(row.academic_year_id) || null,
    entitlementSource: safe(row.entitlement_source) || "free",
    entitlementStatus: safe(row.entitlement_status) || "none",
    quotaBytes,
    usedBytes,
    reservedBytes,
    remainingBytes: toBytes(
      row.remaining_bytes,
      Math.max(0, quotaBytes - usedBytes - reservedBytes),
    ),
    historicalArchiveBytes: toBytes(row.historical_archive_bytes),
    unresolvedLegacyArchiveBytes: toBytes(row.unresolved_legacy_archive_bytes),
    isCompatibilityFallback: row.is_compatibility_fallback === true,
  };
}

export async function loadFreePortfolioStorageUsage(
  familyId: string,
  observedOn: string,
): Promise<FreePortfolioStorageUsage | null> {
  const cleanFamilyId = safe(familyId);
  const cleanObservedOn = safe(observedOn);
  if (!cleanFamilyId || !cleanObservedOn) return null;

  const usage = await loadEvidenceMediaEntitlementUsage(cleanFamilyId, cleanObservedOn);
  if (!usage) return null;

  return {
    familyId: usage.familyId,
    academicYearId: usage.academicYearId,
    allowanceBytes: usage.quotaBytes,
    usedBytes: usage.usedBytes,
    reservedBytes: usage.reservedBytes,
    remainingBytes: usage.remainingBytes,
  };
}
