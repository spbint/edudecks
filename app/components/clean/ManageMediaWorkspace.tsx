"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthUser } from "@/app/components/AuthUserProvider";
import { useCleanFamilyWorkspace } from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import { trackProductEvent } from "@/lib/clean/analytics/productAnalytics";
import {
  formatMediaStorageBytes,
  getMediaAllowanceSourceLabel,
  getMediaStorageUsagePresentation,
} from "@/lib/clean/entitlements/mediaTierCatalog";
import {
  loadEvidenceMediaEntitlementUsage,
  type EvidenceMediaEntitlementUsage,
} from "@/lib/clean/evidence/storageQuota";
import {
  sortFamilyMediaItems,
  type FamilyMediaManagerItem,
  type FamilyMediaManagerPayload,
} from "@/lib/clean/media/mediaManager";

type ManagerState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; usage: EvidenceMediaEntitlementUsage; payload: FamilyMediaManagerPayload };

const shellStyle: React.CSSProperties = {
  width: "100%", maxWidth: 1100, margin: "0 auto", padding: "20px 16px 48px", display: "grid", gap: 18,
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #dbeafe", borderRadius: 18, background: "#ffffff", padding: 18,
  boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
};

function currentDateIso() {
  return new Date().toISOString().slice(0, 10);
}

function dateLabel(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value || "Date unavailable";
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(parsed);
}

function fileTypeLabel(item: FamilyMediaManagerItem) {
  if (item.mediaKind === "image") return "Photo";
  if (item.mediaKind === "audio") return "Recording";
  const subtype = item.mimeType.split("/")[1]?.replace(/[-_]+/g, " ").trim();
  return subtype ? subtype.toUpperCase() : "File";
}

export default function ManageMediaWorkspace() {
  const workspace = useCleanFamilyWorkspace();
  const { user } = useAuthUser();
  const familyId = workspace.profile?.id ?? "";
  const [state, setState] = useState<ManagerState>({ status: "loading" });
  const [learnerFilter, setLearnerFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [ordering, setOrdering] = useState<"largest" | "newest">("largest");
  const [removingAssetId, setRemovingAssetId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const trackedRef = useRef(false);

  const load = useCallback(async () => {
    if (!familyId) return;
    setState({ status: "loading" });
    try {
      const [usage, response] = await Promise.all([
        loadEvidenceMediaEntitlementUsage(familyId, currentDateIso()),
        fetch(`/api/media?familyId=${encodeURIComponent(familyId)}`, {
          cache: "no-store",
          credentials: "same-origin",
        }),
      ]);
      const payload = (await response.json().catch(() => null)) as
        | (FamilyMediaManagerPayload & { error?: unknown })
        | null;
      if (!response.ok || !usage || !payload) {
        throw new Error(String(payload?.error ?? "Family media is temporarily unavailable."));
      }
      setState({ status: "ready", usage, payload });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error && error.message ? error.message : "Family media is temporarily unavailable.",
      });
    }
  }, [familyId]);

  useEffect(() => {
    if (familyId) void load();
  }, [familyId, load]);

  useEffect(() => {
    if (trackedRef.current || state.status !== "ready") return;
    trackedRef.current = true;
    trackProductEvent("media_manager_viewed", { area: "my_settings", surface: "media_manager" }, user?.id);
  }, [state.status, user?.id]);

  const visibleItems = useMemo(() => {
    if (state.status !== "ready") return [];
    const filtered = state.payload.items.filter((item) => {
      if (learnerFilter && !item.learnerIds.includes(learnerFilter)) return false;
      if (yearFilter === "historical") return item.academicYearId !== state.usage.academicYearId;
      if (yearFilter && item.academicYearId !== yearFilter) return false;
      return true;
    });
    return sortFamilyMediaItems(filtered, ordering);
  }, [learnerFilter, ordering, state, yearFilter]);

  async function removeItem(item: FamilyMediaManagerItem) {
    if (!familyId || removingAssetId) return;
    if (!window.confirm("Remove this media file?\n\nThe learning record will remain, but this file will be permanently removed and cannot be restored.")) return;

    setRemovingAssetId(item.assetId);
    setNotice(null);
    trackProductEvent("media_manager_remove_started", { area: "my_settings", surface: "media_manager" }, user?.id);
    try {
      const response = await fetch("/api/media", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ familyId, assetId: item.assetId }),
      });
      const payload = (await response.json().catch(() => null)) as { status?: unknown; error?: unknown } | null;
      if (!response.ok) throw new Error(String(payload?.error ?? "This media file could not be removed right now."));
      const alreadyRemoved = payload?.status === "already_removed";
      setNotice(alreadyRemoved
        ? "That media file was already removed. The learning record remains available."
        : "Media removed. The learning record and its text remain available.");
      trackProductEvent(
        "media_manager_remove_completed",
        { area: "my_settings", surface: "media_manager", outcome: alreadyRemoved ? "already_removed" : "removed" },
        user?.id,
      );
      await load();
    } catch (error) {
      setNotice(error instanceof Error && error.message
        ? error.message
        : "This media file could not be removed right now. The learning record remains safe.");
    } finally {
      setRemovingAssetId(null);
    }
  }

  if (workspace.loading || (!workspace.profile && !workspace.requiresFamilyCreation)) {
    return <main style={shellStyle}><section style={cardStyle}>Preparing family media...</section></main>;
  }

  if (workspace.requiresFamilyCreation || !workspace.profile) {
    return (
      <main style={shellStyle}>
        <section style={cardStyle}>
          <h1 style={{ marginTop: 0, color: "#17204b" }}>Manage media</h1>
          <p style={{ margin: 0, color: "#475569" }}>Create your family profile before managing media.</p>
        </section>
      </main>
    );
  }

  return (
    <main style={shellStyle}>
      <section style={{ ...cardStyle, display: "grid", gap: 10 }}>
        <Link href="/my-settings" style={{ color: "#2563eb", fontWeight: 700, width: "fit-content" }}>Back to My Settings</Link>
        <div>
          <div style={{ color: "#64748b", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em" }}>MEDIA STORAGE</div>
          <h1 style={{ margin: "6px 0 0", color: "#17204b", fontSize: 28 }}>Manage media</h1>
        </div>
        <p style={{ margin: 0, color: "#475569", lineHeight: 1.65 }}>
          See the photos, files and recordings using your family&apos;s media storage. Removing a file does not delete the learning record it belongs to.
        </p>
      </section>

      {state.status === "loading" ? <section aria-live="polite" style={cardStyle}>Loading family media...</section> : null}

      {state.status === "error" ? (
        <section style={{ ...cardStyle, display: "grid", gap: 12 }}>
          <strong style={{ color: "#991b1b" }}>Media is temporarily unavailable</strong>
          <p style={{ margin: 0, color: "#475569" }}>{state.message} Your text learning records are unaffected.</p>
          <button type="button" onClick={() => void load()} style={{ width: "fit-content", minHeight: 42 }}>Try again</button>
        </section>
      ) : null}

      {state.status === "ready" ? (
        <>
          <StorageSummary usage={state.usage} />
          <section style={{ ...cardStyle, display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
              <label style={{ display: "grid", gap: 6, color: "#334155", fontWeight: 700 }}>
                Learner
                <select value={learnerFilter} onChange={(event) => setLearnerFilter(event.target.value)} style={{ minHeight: 44 }}>
                  <option value="">All learners</option>
                  {state.payload.learnerOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                </select>
              </label>
              <label style={{ display: "grid", gap: 6, color: "#334155", fontWeight: 700 }}>
                Learning year
                <select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)} style={{ minHeight: 44 }}>
                  <option value="">All learning years</option>
                  {state.payload.learningYearOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                  <option value="historical">Earlier learning years</option>
                </select>
              </label>
              <label style={{ display: "grid", gap: 6, color: "#334155", fontWeight: 700 }}>
                Order
                <select value={ordering} onChange={(event) => setOrdering(event.target.value === "newest" ? "newest" : "largest")} style={{ minHeight: 44 }}>
                  <option value="largest">Largest files first</option>
                  <option value="newest">Newest first</option>
                </select>
              </label>
            </div>
          </section>

          {notice ? <p aria-live="polite" style={{ ...cardStyle, margin: 0, color: "#334155" }}>{notice}</p> : null}

          {!state.payload.items.length ? (
            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, color: "#17204b" }}>No media uploaded</h2>
              <p style={{ margin: 0, color: "#475569" }}>Photos, files and recordings attached to learning records will appear here.</p>
            </section>
          ) : !visibleItems.length ? (
            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, color: "#17204b" }}>No media matches these filters</h2>
              <p style={{ margin: 0, color: "#475569" }}>Choose all learners or all learning years to see more media.</p>
            </section>
          ) : (
            <section aria-label="Family evidence media" style={{ display: "grid", gap: 12 }}>
              {visibleItems.map((item) => (
                <MediaItemCard key={item.assetId} item={item} currentAcademicYearId={state.usage.academicYearId}
                  removing={removingAssetId === item.assetId} onRemove={() => void removeItem(item)} />
              ))}
            </section>
          )}
        </>
      ) : null}
    </main>
  );
}

function StorageSummary({ usage }: { usage: EvidenceMediaEntitlementUsage }) {
  const presentation = getMediaStorageUsagePresentation(usage.quotaBytes, usage.usedBytes, usage.reservedBytes);
  return (
    <section aria-labelledby="manage-media-storage-summary" style={{ ...cardStyle, display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 id="manage-media-storage-summary" style={{ margin: 0, color: "#17204b", fontSize: 20 }}>Current learning-year storage</h2>
          <div style={{ marginTop: 4, color: "#475569" }}>{getMediaAllowanceSourceLabel(usage.entitlementSource, usage.isCompatibilityFallback)}</div>
        </div>
        <strong style={{ color: "#17204b" }}>{formatMediaStorageBytes(usage.quotaBytes)} allowance</strong>
      </div>
      <div role="progressbar" aria-label={`${presentation.percentUsed}% of media storage used`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={presentation.percentUsed} style={{ height: 10, borderRadius: 999, background: "#dbeafe", overflow: "hidden" }}>
        <div style={{ width: `${presentation.percentUsed}%`, minWidth: presentation.percentUsed ? 4 : 0, height: "100%", background: "#2563eb" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
        <div><strong>{formatMediaStorageBytes(presentation.usageBytes)}</strong><br /><span style={{ color: "#64748b" }}>used this learning year</span></div>
        <div><strong>{formatMediaStorageBytes(usage.remainingBytes)}</strong><br /><span style={{ color: "#64748b" }}>remaining this learning year</span></div>
        <div><strong>{formatMediaStorageBytes(usage.historicalArchiveBytes)}</strong><br /><span style={{ color: "#64748b" }}>earlier learning-year archive</span></div>
      </div>
    </section>
  );
}

function MediaItemCard({ item, currentAcademicYearId, removing, onRemove }: {
  item: FamilyMediaManagerItem;
  currentAcademicYearId: string | null;
  removing: boolean;
  onRemove: () => void;
}) {
  const isCurrent = Boolean(currentAcademicYearId && item.academicYearId === currentAcademicYearId);
  return (
    <article style={{ ...cardStyle, display: "grid", gridTemplateColumns: "minmax(76px, 112px) minmax(0, 1fr)", gap: 14 }}>
      {item.mediaKind === "image" && item.previewUrl ? (
        <div role="img" aria-label="Private evidence media preview" style={{ minHeight: 92, borderRadius: 12, background: `#e2e8f0 url(${JSON.stringify(item.previewUrl)}) center / cover no-repeat` }} />
      ) : (
        <div aria-label={`${fileTypeLabel(item)} preview`} style={{ minHeight: 92, borderRadius: 12, background: "#eff6ff", color: "#1e3a8a", display: "grid", placeItems: "center", fontWeight: 800, textAlign: "center", padding: 8 }}>
          {fileTypeLabel(item)}
        </div>
      )}
      <div style={{ minWidth: 0, display: "grid", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div>
            <span style={{ display: "inline-block", borderRadius: 999, padding: "4px 8px", background: isCurrent ? "#dcfce7" : "#f1f5f9", color: isCurrent ? "#166534" : "#475569", fontSize: 12, fontWeight: 800 }}>
              {isCurrent ? "CURRENT LEARNING YEAR" : "EARLIER LEARNING YEAR"}
            </span>
            <h2 style={{ margin: "8px 0 0", color: "#17204b", fontSize: 18 }}>{item.evidenceTitle}</h2>
          </div>
          <strong style={{ color: "#17204b" }}>{formatMediaStorageBytes(item.byteSize)}</strong>
        </div>
        <div style={{ color: "#475569", lineHeight: 1.5 }}>
          {fileTypeLabel(item)} · {item.learnerLabels.join(", ") || "Learner"} · {dateLabel(item.observedOn)} · {item.learningYearLabel}
        </div>
        <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>
          {isCurrent
            ? "Counts toward the current allowance. Removing it restores current-year capacity."
            : "Retained archive media. Removing it does not increase current-year remaining storage."}
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {item.previewUrl ? <a href={item.previewUrl} target="_blank" rel="noreferrer" style={{ color: "#2563eb", fontWeight: 700 }}>View media</a>
            : <span style={{ color: "#92400e", fontSize: 14 }}>Signed preview unavailable</span>}
          <button type="button" onClick={onRemove} disabled={removing} style={{ minHeight: 40, border: "1px solid #fecaca", borderRadius: 10, background: "#fff", color: "#b91c1c", fontWeight: 800, padding: "0 14px", cursor: removing ? "wait" : "pointer" }}>
            {removing ? "Removing media..." : "Remove media"}
          </button>
        </div>
      </div>
    </article>
  );
}
