"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAuthUser } from "@/app/components/AuthUserProvider";
import { trackProductEvent } from "@/lib/clean/analytics/productAnalytics";
import {
  formatMediaStorageBytes,
  getMediaAllowanceSourceLabel,
  getMediaStorageUsagePresentation,
  MEDIA_TIER_CATALOG,
} from "@/lib/clean/entitlements/mediaTierCatalog";
import {
  loadEvidenceMediaEntitlementUsage,
  type EvidenceMediaEntitlementUsage,
} from "@/lib/clean/evidence/storageQuota";
import { listCleanAcademicYears } from "@/lib/clean/terms/client";

type MediaStorageSettingsCardProps = {
  familyId: string;
};

type MediaStorageState =
  | { status: "loading"; familyId: string }
  | { status: "error"; familyId: string }
  | {
      status: "ready";
      familyId: string;
      usage: EvidenceMediaEntitlementUsage;
      learningYearLabel: string;
    };

const cardStyle: React.CSSProperties = {
  border: "1px solid #bfdbfe",
  borderRadius: 18,
  background: "#ffffff",
  padding: 20,
  boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
  display: "grid",
  gap: 16,
};

function currentDateIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function MediaStorageSettingsCard({ familyId }: MediaStorageSettingsCardProps) {
  const { user } = useAuthUser();
  const [state, setState] = useState<MediaStorageState>(() => ({ status: "loading", familyId }));
  const analyticsTrackedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const observedOn = currentDateIso();
      let usage: EvidenceMediaEntitlementUsage | null;

      try {
        usage = await loadEvidenceMediaEntitlementUsage(familyId, observedOn);
      } catch {
        if (!cancelled) setState({ status: "error", familyId });
        return;
      }

      if (cancelled) return;
      if (!usage) {
        setState({ status: "error", familyId });
        return;
      }

      setState({
        status: "ready",
        familyId,
        usage,
        learningYearLabel: "Current learning year",
      });

      if (!usage.academicYearId) return;

      try {
        const academicYears = await listCleanAcademicYears(familyId);
        if (cancelled) return;
        const matchingYear = academicYears.find((year) => year.id === usage.academicYearId);
        const learningYearLabel = matchingYear?.title?.trim();
        if (!learningYearLabel) return;

        setState((current) => {
          if (current.familyId !== familyId || current.status !== "ready") return current;
          return { ...current, learningYearLabel };
        });
      } catch {
        return;
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [familyId]);

  const currentState: MediaStorageState =
    state.familyId === familyId ? state : { status: "loading", familyId };

  useEffect(() => {
    if (analyticsTrackedRef.current || currentState.status !== "ready") return;
    analyticsTrackedRef.current = true;
    trackProductEvent("media_storage_viewed", { area: "my_settings", surface: "media_storage" }, user?.id);
    trackProductEvent(
      "media_tier_comparison_viewed",
      { area: "my_settings", surface: "media_storage" },
      user?.id,
    );
  }, [currentState.status, user?.id]);

  return (
    <section aria-labelledby="media-storage-heading" style={cardStyle}>
      <div>
        <h2 id="media-storage-heading" style={{ margin: 0, color: "#0f172a" }}>
          Media storage
        </h2>
        <p style={{ margin: "8px 0 0", color: "#475569", lineHeight: 1.6 }}>
          Media storage is shared across your family for the learning year. Text learning records remain part of MyLearna.
        </p>
      </div>

      {currentState.status === "loading" ? (
        <p aria-live="polite" style={{ margin: 0, color: "#475569" }}>
          Loading your media storage…
        </p>
      ) : null}

      {currentState.status === "error" ? (
        <p aria-live="polite" style={{ margin: 0, color: "#475569" }}>
          Media storage information is temporarily unavailable. Your text learning records are unaffected.
        </p>
      ) : null}

      {currentState.status === "ready" ? <MediaUsageSummary state={currentState} /> : null}

      <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 16, display: "grid", gap: 12 }}>
        <div>
          <h3 style={{ margin: 0, color: "#0f172a", fontSize: 18 }}>Future media storage options</h3>
          <p style={{ margin: "6px 0 0", color: "#475569", lineHeight: 1.55 }}>
            Annual family media storage is shared across every learner and follows your learning year.
          </p>
        </div>
        <div
          aria-label="Family media storage options"
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}
        >
          {MEDIA_TIER_CATALOG.map((tier) => (
            <article
              key={tier.key}
              style={{ border: "1px solid #dbeafe", borderRadius: 14, padding: 14, display: "grid", gap: 7 }}
            >
              <strong style={{ color: "#0f172a" }}>{tier.displayName}</strong>
              <span style={{ color: "#1e3a8a", fontSize: 20, fontWeight: 700 }}>{tier.allowanceLabel}</span>
              <span style={{ color: "#475569" }}>{tier.displayPrices.AUD?.label}</span>
              <span style={{ color: "#475569", fontSize: 14 }}>Shared across your family</span>
              <span style={{ color: "#475569", fontSize: 14 }}>For one learning year</span>
              <span style={{ color: "#64748b", fontSize: 14 }}>Coming soon</span>
            </article>
          ))}
        </div>
        <p style={{ margin: 0, color: "#475569", lineHeight: 1.55, fontSize: 14 }}>
          When annual renewals are introduced, MyLearna plans to keep earlier paid learning-year media available as archive.
        </p>
        <p style={{ margin: 0, color: "#475569", lineHeight: 1.55, fontSize: 14 }}>
          MyLearna Free includes text learning records, text Capture, text Portfolio, My Day, Calendar, Pathways, On Deck, Recover My Week, and useful basic reporting.
        </p>
      </div>
    </section>
  );
}

function MediaUsageSummary({ state }: { state: Extract<MediaStorageState, { status: "ready" }> }) {
  const { usage, learningYearLabel } = state;
  const presentation = getMediaStorageUsagePresentation(
    usage.quotaBytes,
    usage.usedBytes,
    usage.reservedBytes,
  );
  const sourceLabel = getMediaAllowanceSourceLabel(
    usage.entitlementSource,
    usage.isCompatibilityFallback,
  );
  const warningColor =
    presentation.warningState === "full" || presentation.warningState === "unavailable"
      ? "#9f1239"
      : presentation.warningState === "nearly_full" || presentation.warningState === "most_used"
        ? "#92400e"
        : "#475569";

  return (
    <div style={{ border: "1px solid #dbeafe", borderRadius: 14, background: "#f8fbff", padding: 16, display: "grid", gap: 9 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <strong style={{ color: "#0f172a" }}>{sourceLabel}</strong>
          <div style={{ color: "#475569", fontSize: 14, marginTop: 3 }}>{learningYearLabel}</div>
        </div>
        <strong style={{ color: "#0f172a" }}>{formatMediaStorageBytes(usage.quotaBytes)}</strong>
      </div>
      <div
        aria-label={`${presentation.percentUsed}% of media storage used`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={presentation.percentUsed}
        role="progressbar"
        style={{ height: 10, borderRadius: 999, background: "#dbeafe", overflow: "hidden" }}
      >
        <div
          style={{
            width: `${presentation.percentUsed}%`,
            minWidth: presentation.percentUsed > 0 ? 4 : 0,
            height: "100%",
            background: presentation.warningState === "full" ? "#be123c" : "#2563eb",
          }}
        />
      </div>
      <div style={{ color: "#334155" }}>
        {formatMediaStorageBytes(presentation.usageBytes)} used · {formatMediaStorageBytes(usage.remainingBytes)} remaining
      </div>
      {presentation.warningCopy ? (
        <p style={{ margin: 0, color: warningColor, lineHeight: 1.5 }}>{presentation.warningCopy}</p>
      ) : null}
      {usage.historicalArchiveBytes > 0 ? (
        <p style={{ margin: 0, color: "#475569", fontSize: 14, lineHeight: 1.5 }}>
          Earlier learning-year media: {formatMediaStorageBytes(usage.historicalArchiveBytes)}
        </p>
      ) : null}
      <p style={{ margin: 0, color: "#475569", fontSize: 14, lineHeight: 1.5 }}>
        Media storage follows your family’s learning year.
      </p>
    </div>
  );
}
