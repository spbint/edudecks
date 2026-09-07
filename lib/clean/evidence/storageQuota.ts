import {
  FREE_FAMILY_PORTFOLIO_STORAGE_BYTES,
  type FreePortfolioStorageUsage,
} from "@/lib/clean/entitlements/freeGuardrails";
import { normalizeCleanErrorMessage } from "@/lib/clean/family/client";
import { supabase } from "@/lib/supabaseClient";

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

export async function loadFreePortfolioStorageUsage(
  familyId: string,
  observedOn: string,
): Promise<FreePortfolioStorageUsage | null> {
  const cleanFamilyId = safe(familyId);
  const cleanObservedOn = safe(observedOn);
  if (!cleanFamilyId || !cleanObservedOn) return null;

  const response = await supabase.rpc("mylearna_get_evidence_storage_usage", {
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

  const row = firstRow(response.data);
  if (!row) return null;

  const allowanceBytes = toBytes(
    row.allowance_bytes,
    FREE_FAMILY_PORTFOLIO_STORAGE_BYTES,
  );
  const usedBytes = toBytes(row.used_bytes);
  const reservedBytes = toBytes(row.reserved_bytes);
  const remainingBytes = toBytes(
    row.remaining_bytes,
    Math.max(0, allowanceBytes - usedBytes - reservedBytes),
  );

  return {
    familyId: safe(row.family_id) || cleanFamilyId,
    academicYearId: safe(row.academic_year_id) || null,
    allowanceBytes,
    usedBytes,
    reservedBytes,
    remainingBytes,
  };
}
