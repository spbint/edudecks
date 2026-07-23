"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { V2Card, V2PageHeader, v2Tokens } from "@/app/components/clean/design-v2/MyLearnaAppShellV2";
import type { FamilyOwnedResource, LearningRecommendation, RecommendationDebugInfo, RecommendationInteractionEventType } from "@/lib/intelligence/recommendations/types";
import type { LearningPlanType } from "@/lib/intelligence/plans/types";
import RecommendationDebugView from "./RecommendationDebugView";

type RecommendationPayload = {
  recommendations: LearningRecommendation[];
  dismissedRecommendations?: LearningRecommendation[];
  ownedRevision?: { planId: string; revisionId: string; revisionNumber: number };
  debug?: RecommendationDebugInfo;
  error?: string;
};

function endpoint(ideaId: string, sourceId: string, planType: LearningPlanType, planId: string, revision: number, includeDismissed = false) {
  return `/api/intelligence/ideas/${encodeURIComponent(ideaId)}/sources/${encodeURIComponent(sourceId)}/plans/${planType}/recommendations?planId=${encodeURIComponent(planId)}&revision=${revision}&includeDismissed=${includeDismissed ? "1" : "0"}&debug=1`;
}

function groupFor(item: LearningRecommendation) {
  if (item.objectType === "learning_activity") return "Ready to use";
  if (item.objectType === "preparation_action") return "Things to prepare";
  if (item.resourceClassification === "already_owned") return "Things you already own";
  if (item.resourceClassification === "free_digital" || item.resourceClassification === "household_common" || item.resourceClassification === "reusable" || item.resourceClassification === "consumable") return "Free or household alternatives";
  if (item.resourceClassification === "optional_extension" || item.objectType === "optional_extension_resource") return "Optional extensions";
  if (item.objectType === "evidence_capture_action") return "Evidence to capture";
  if (item.objectType === "portfolio_reflection_action") return "Portfolio reflection";
  if (item.objectType === "safety_supervision_action") return "Safety and supervision";
  return "Things still needed";
}

function RecommendationCard({ item, onAction }: { item: LearningRecommendation; onAction: (eventType: RecommendationInteractionEventType, item: LearningRecommendation) => void }) {
  const resource = item.resourceClassification !== null;
  return (
    <article style={{ border: `1px solid ${v2Tokens.border}`, borderRadius: 12, padding: 12, display: "grid", gap: 7, background: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
        <strong style={{ color: v2Tokens.navy }}>{item.title}</strong>
        <span style={{ color: v2Tokens.slate, fontSize: 12 }}>#{item.priorityRank}</span>
      </div>
      <span style={{ color: v2Tokens.slate, fontSize: 14 }}>{item.summary}</span>
      <span style={{ color: v2Tokens.slate, fontSize: 13 }}>{item.parentReadableReason}</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {resource ? <>
          <button type="button" onClick={() => onAction("owned_confirmation", item)}>Mark as owned</button>
          <button type="button" onClick={() => onAction("not_owned_confirmation", item)}>Not owned</button>
        </> : null}
        <button type="button" onClick={() => onAction("save", item)}>Save for later</button>
        <button type="button" onClick={() => onAction(item.interaction.prepared ? "completed" : "prepared", item)}>{item.interaction.prepared ? "Mark completed" : "Mark prepared"}</button>
        <button type="button" onClick={() => onAction("dismiss", item)}>Dismiss</button>
      </div>
    </article>
  );
}

export default function LearningPreparationList({ ideaId, sourceId, planType, planId, revision }: { ideaId: string; sourceId: string; planType: LearningPlanType; planId: string; revision: number }) {
  const [payload, setPayload] = useState<RecommendationPayload | null>(null);
  const [ownedResources, setOwnedResources] = useState<FamilyOwnedResource[]>([]);
  const [showDismissed, setShowDismissed] = useState(false);
  const [resourceName, setResourceName] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const impressionKey = useRef("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [recommendationsResponse, resourcesResponse] = await Promise.all([
        fetch(endpoint(ideaId, sourceId, planType, planId, revision, showDismissed), { cache: "no-store" }),
        fetch("/api/intelligence/resources", { cache: "no-store" }),
      ]);
      const recommendations = await recommendationsResponse.json() as RecommendationPayload;
      const resources = await resourcesResponse.json() as { resources?: FamilyOwnedResource[] };
      if (!recommendationsResponse.ok) throw new Error(recommendations.error || "We could not load this preparation list.");
      setPayload(recommendations);
      setOwnedResources(resources.resources ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "We could not load this preparation list.");
    } finally {
      setLoading(false);
    }
  }, [ideaId, planId, planType, revision, showDismissed, sourceId]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const revisionKey = payload?.ownedRevision ? `${payload.ownedRevision.planId}:${payload.ownedRevision.revisionId}` : "";
    if (!revisionKey || impressionKey.current === revisionKey || !payload?.recommendations.length) return;
    impressionKey.current = revisionKey;
    void Promise.all(payload.recommendations.slice(0, 50).map((item) => fetch(endpoint(ideaId, sourceId, planType, planId, revision), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ recommendationId: item.recommendationId, eventType: "impression", resourceKey: item.resourceKey }),
    }))).catch(() => undefined);
  }, [ideaId, payload, planId, planType, revision, sourceId]);

  async function action(eventType: RecommendationInteractionEventType, item: LearningRecommendation) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(endpoint(ideaId, sourceId, planType, planId, revision), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ recommendationId: item.recommendationId, eventType, resourceKey: item.resourceKey }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "We could not save that action.");
      await load();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "We could not save that action.");
    } finally {
      setBusy(false);
    }
  }

  async function addOwnedResource(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resourceName.trim()) return;
    setBusy(true);
    try {
      const response = await fetch("/api/intelligence/resources", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: resourceName }) });
      const result = await response.json() as { resource?: FamilyOwnedResource; error?: string };
      if (!response.ok || !result.resource) throw new Error(result.error || "We could not save that resource.");
      setResourceName("");
      await load();
    } catch (resourceError) {
      setError(resourceError instanceof Error ? resourceError.message : "We could not save that resource.");
    } finally {
      setBusy(false);
    }
  }

  const groups = useMemo(() => {
    const result = new Map<string, LearningRecommendation[]>();
    for (const item of payload?.recommendations ?? []) {
      const group = groupFor(item);
      result.set(group, [...(result.get(group) ?? []), item]);
    }
    return result;
  }, [payload]);

  if (loading) return <V2Card><p role="status" style={{ margin: 0, color: v2Tokens.slate }}>Preparing your learning list...</p></V2Card>;
  if (!payload) return <V2Card><div role="alert" style={{ color: "#9f1239" }}>{error || "Preparation list unavailable."}</div></V2Card>;
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <V2PageHeader eyebrow="My Ideas" title="Learning preparation list" subtitle="Learning comes first. Start with what is required, safe, and already available." />
      {error ? <div role="alert" style={{ border: "1px solid #fecdd3", background: "#fff1f2", color: "#9f1239", padding: 12, borderRadius: 12 }}>{error}</div> : null}
      <V2Card>
        <h2 style={{ marginTop: 0 }}>Family owned resources</h2>
        <p style={{ color: v2Tokens.slate }}>Add common resources once so future lists can avoid duplicate purchase suggestions.</p>
        <form onSubmit={addOwnedResource} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input aria-label="Owned resource name" value={resourceName} onChange={(event) => setResourceName(event.target.value)} placeholder="e.g. paper, pencils, cardboard box" />
          <button type="submit" disabled={busy}>Add owned resource</button>
        </form>
        {ownedResources.length ? <p style={{ color: v2Tokens.slate, fontSize: 13 }}>Tracked: {ownedResources.map((resource) => resource.name).join(", ")}</p> : null}
      </V2Card>
      {Array.from(groups.entries()).map(([group, items]) => (
        <V2Card key={group}>
          <h2 style={{ marginTop: 0 }}>{group}</h2>
          <div style={{ display: "grid", gap: 10 }}>{items.map((item) => <RecommendationCard key={item.recommendationId} item={item} onAction={action} />)}</div>
        </V2Card>
      ))}
      {!payload.recommendations.length ? <V2Card><p style={{ margin: 0, color: v2Tokens.slate }}>Nothing else needs preparation right now.</p></V2Card> : null}
      <V2Card>
        <button type="button" onClick={() => setShowDismissed((current) => !current)}>{showDismissed ? "Hide dismissed items" : "Show dismissed items"}</button>
        {showDismissed && payload.dismissedRecommendations?.length ? <div style={{ display: "grid", gap: 10, marginTop: 12 }}>{payload.dismissedRecommendations.map((item) => <article key={item.recommendationId} style={{ padding: 10, border: "1px dashed #cbd5e1", borderRadius: 10 }}><strong>{item.title}</strong><button type="button" onClick={() => void action("restore", item)} style={{ marginLeft: 10 }}>Restore dismissed item</button></article>)}</div> : null}
      </V2Card>
      <RecommendationDebugView debug={payload.debug ?? null} />
    </div>
  );
}
