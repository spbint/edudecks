"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { V2Card, V2PageHeader, v2Tokens } from "@/app/components/clean/design-v2/MyLearnaAppShellV2";
import type { FamilyOwnedResource, LearningRecommendation, RecommendationDebugInfo, RecommendationInteractionEventType } from "@/lib/intelligence/recommendations/types";
import type { CommerceEventType, CommerceProductCandidate, CommerceResult, LearningBasket } from "@/lib/intelligence/commerce/types";
import type { LearningPlanType } from "@/lib/intelligence/plans/types";
import RecommendationDebugView from "./RecommendationDebugView";

type RecommendationPayload = {
  recommendations: LearningRecommendation[];
  dismissedRecommendations?: LearningRecommendation[];
  ownedRevision?: { planId: string; revisionId: string; revisionNumber: number };
  debug?: RecommendationDebugInfo;
  commerce?: CommerceResult;
  error?: string;
};

export const PREPARATION_LOAD_TIMEOUT_MS = 20_000;
const PREPARATION_TIMEOUT_MESSAGE = "The preparation list is taking too long to load. Please try again.";
const PREPARATION_LOAD_ERROR_MESSAGE = "We could not load the preparation list. Please try again.";

class PreparationLoadTimeoutError extends Error {
  constructor() {
    super(PREPARATION_TIMEOUT_MESSAGE);
    this.name = "PreparationLoadTimeoutError";
  }
}

async function requestPreparationData(controller: AbortController, ideaId: string, sourceId: string, planType: LearningPlanType, planId: string, revision: number, includeDismissed: boolean) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const requests = Promise.all([
    fetch(endpoint(ideaId, sourceId, planType, planId, revision, includeDismissed), { cache: "no-store", signal: controller.signal }).then(async (response) => ({ response, payload: await response.json().catch(() => ({})) as RecommendationPayload })),
    fetch("/api/intelligence/resources", { cache: "no-store", signal: controller.signal }).then(async (response) => ({ response, payload: await response.json().catch(() => ({})) as { resources?: FamilyOwnedResource[] } })),
  ]);
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new PreparationLoadTimeoutError());
    }, PREPARATION_LOAD_TIMEOUT_MS);
  });
  try {
    return await Promise.race([requests, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function endpoint(ideaId: string, sourceId: string, planType: LearningPlanType, planId: string, revision: number, includeDismissed = false) {
  return `/api/intelligence/ideas/${encodeURIComponent(ideaId)}/sources/${encodeURIComponent(sourceId)}/plans/${planType}/recommendations?planId=${encodeURIComponent(planId)}&revision=${revision}&includeDismissed=${includeDismissed ? "1" : "0"}&debug=1`;
}

function basketEndpoint(ideaId: string, sourceId: string, planType: LearningPlanType, planId: string, revision: number) {
  return `/api/intelligence/basket?ideaId=${encodeURIComponent(ideaId)}&sourceId=${encodeURIComponent(sourceId)}&planType=${planType}&planId=${encodeURIComponent(planId)}&revision=${revision}`;
}

function commerceEventEndpoint() { return "/api/intelligence/commerce/events"; }

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

function CommerceProductCard({ item, onEvent, onAdd }: { item: CommerceProductCandidate; onEvent: (eventType: CommerceEventType, item: CommerceProductCandidate) => void; onAdd: (item: CommerceProductCandidate) => void }) {
  return (
    <article style={{ border: `1px solid ${v2Tokens.border}`, borderRadius: 12, padding: 12, display: "grid", gap: 7, background: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
        <strong style={{ color: v2Tokens.navy }}>{item.product.title}</strong>
        <span style={{ color: v2Tokens.slate, fontSize: 12 }}>{item.required ? "Essential resource" : "Optional extension"}</span>
      </div>
      {item.product.imageUrl ? <div role="img" aria-label={`${item.product.title} preview`} style={{ width: 96, height: 72, borderRadius: 8, backgroundImage: `url(${JSON.stringify(item.product.imageUrl)})`, backgroundSize: "cover", backgroundPosition: "center" }} /> : null}
      <span style={{ color: v2Tokens.slate, fontSize: 14 }}>{item.product.summary || item.parentReadableReason}</span>
      <span style={{ color: v2Tokens.slate, fontSize: 13 }}>{item.parentReadableReason}</span>
      <span style={{ color: v2Tokens.navy, fontWeight: 600 }}>{item.product.price.currency} {item.product.price.amount.toFixed(2)} · {item.product.fulfilmentType.replaceAll("_", " ")}</span>
      <span style={{ color: v2Tokens.slate, fontSize: 12 }}>{item.product.availability === "available" ? "Available in your region" : "Unavailable"}. {item.product.disclosure}</span>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <a href={item.product.productUrl} target="_blank" rel="noreferrer" onClick={() => { onEvent("product_opened", item); onEvent("product_clicked", item); onEvent("outbound_shopify_click", item); }}>View product</a>
        <button type="button" onClick={() => onAdd(item)}>Add to learning basket</button>
      </div>
    </article>
  );
}

export default function LearningPreparationList({ ideaId, sourceId, planType, planId, revision }: { ideaId: string; sourceId: string; planType: LearningPlanType; planId: string; revision: number }) {
  const [payload, setPayload] = useState<RecommendationPayload | null>(null);
  const [ownedResources, setOwnedResources] = useState<FamilyOwnedResource[]>([]);
  const [basket, setBasket] = useState<LearningBasket | null>(null);
  const [showDismissed, setShowDismissed] = useState(false);
  const [resourceName, setResourceName] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const impressionKey = useRef("");
  const loadAbortRef = useRef<AbortController | null>(null);
  const loadRequestIdRef = useRef(0);
  const loadingRef = useRef(false);

  const load = useCallback(async () => {
    if (loadingRef.current) return;
    const requestId = loadRequestIdRef.current + 1;
    loadRequestIdRef.current = requestId;
    loadAbortRef.current?.abort();
    const controller = new AbortController();
    loadAbortRef.current = controller;
    loadingRef.current = true;
    setLoading(true);
    setError("");
    try {
      const [{ response: recommendationsResponse, payload: recommendations }, { response: resourcesResponse, payload: resources }] = await requestPreparationData(controller, ideaId, sourceId, planType, planId, revision, showDismissed);
      if (requestId !== loadRequestIdRef.current) return;
      if (!recommendationsResponse.ok || !resourcesResponse.ok) throw new Error(PREPARATION_LOAD_ERROR_MESSAGE);
      setPayload(recommendations);
      setOwnedResources(resources.resources ?? []);
      if (recommendations.commerce?.status === "ready") {
        const basketResponse = await fetch(basketEndpoint(ideaId, sourceId, planType, planId, revision), { cache: "no-store" });
        if (basketResponse.ok) setBasket((await basketResponse.json() as { basket?: LearningBasket }).basket ?? null);
      } else setBasket(null);
    } catch (loadError) {
      if (requestId !== loadRequestIdRef.current) return;
      setPayload(null);
      setError(loadError instanceof PreparationLoadTimeoutError ? PREPARATION_TIMEOUT_MESSAGE : PREPARATION_LOAD_ERROR_MESSAGE);
    } finally {
      if (requestId === loadRequestIdRef.current) {
        loadingRef.current = false;
        loadAbortRef.current = null;
        setLoading(false);
      }
    }
  }, [ideaId, planId, planType, revision, showDismissed, sourceId]);

  const commerceEvent = useCallback(async (eventType: CommerceEventType, item: CommerceProductCandidate) => {
    await fetch(commerceEventEndpoint(), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ideaId, sourceId, planType, planId, revision, eventType, productId: item.product.providerProductId, resourceKey: item.resourceKey }) }).catch(() => undefined);
  }, [ideaId, planId, planType, revision, sourceId]);

  async function addToBasket(item: CommerceProductCandidate) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(basketEndpoint(ideaId, sourceId, planType, planId, revision), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ideaId, sourceId, planType, planId, revision, commerceRecommendationId: item.commerceRecommendationId, quantity: 1 }) });
      const result = await response.json() as { basket?: LearningBasket; error?: string };
      if (!response.ok || !result.basket) throw new Error(result.error || "We could not add that product to your learning basket.");
      setBasket(result.basket);
      await commerceEvent("product_added", item);
    } catch (addError) { setError(addError instanceof Error ? addError.message : "We could not add that product to your learning basket."); }
    finally { setBusy(false); }
  }

  async function removeFromBasket(item: LearningBasket["items"][number]) {
    if (!basket) return;
    setBusy(true);
    try {
      const response = await fetch(basketEndpoint(ideaId, sourceId, planType, planId, revision), { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ ideaId, sourceId, planType, planId, revision, basketId: basket.id, itemId: item.id }) });
      const result = await response.json() as { basket?: LearningBasket; error?: string };
      if (!response.ok || !result.basket) throw new Error(result.error || "We could not remove that basket item.");
      setBasket(result.basket);
    } catch (removeError) { setError(removeError instanceof Error ? removeError.message : "We could not remove that basket item."); }
    finally { setBusy(false); }
  }

  useEffect(() => { void load(); }, [load]);

  useEffect(() => () => {
    loadRequestIdRef.current += 1;
    loadAbortRef.current?.abort();
    loadAbortRef.current = null;
    loadingRef.current = false;
  }, []);

  useEffect(() => {
    const revisionKey = payload?.ownedRevision ? `${payload.ownedRevision.planId}:${payload.ownedRevision.revisionId}` : "";
    if (!revisionKey || impressionKey.current === revisionKey || !payload?.recommendations.length) return;
    impressionKey.current = revisionKey;
    void Promise.all(payload.recommendations.slice(0, 50).map((item) => fetch(endpoint(ideaId, sourceId, planType, planId, revision), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ recommendationId: item.recommendationId, eventType: "impression", resourceKey: item.resourceKey }),
    }))).catch(() => undefined);
    void Promise.all((payload.commerce?.products ?? []).slice(0, 20).map((item) => commerceEvent("product_impression", item))).catch(() => undefined);
  }, [commerceEvent, ideaId, payload, planId, planType, revision, sourceId]);

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
  if (!payload) return <V2Card><div role="alert" style={{ color: "#9f1239" }}>{error || "Preparation list unavailable."}</div><button type="button" onClick={() => void load()} style={{ marginTop: 12 }}>Retry</button></V2Card>;
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
      {payload.commerce?.status === "unavailable" ? <V2Card><p role="status" style={{ margin: 0, color: v2Tokens.slate }}>Shopping options are temporarily unavailable. Your learning and free alternatives are still ready.</p></V2Card> : null}
      {payload.commerce?.products.length ? <V2Card>
        <h2 style={{ marginTop: 0 }}>Learning resources from Shopify</h2>
        <p style={{ color: v2Tokens.slate }}>Shopping is optional and appears only after learning, preparation, owned resources, and free alternatives.</p>
        <div style={{ display: "grid", gap: 10 }}>{payload.commerce.products.map((item) => <CommerceProductCard key={item.commerceRecommendationId} item={item} onEvent={commerceEvent} onAdd={addToBasket} />)}</div>
      </V2Card> : null}
      {basket?.items.length ? <V2Card>
        <h2 style={{ marginTop: 0 }}>Learning basket</h2>
        <p style={{ color: v2Tokens.slate }}>This is a preparation basket only. Checkout is not available yet.</p>
        <div style={{ display: "grid", gap: 8 }}>{basket.items.map((item) => <div key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}><span>{item.title} × {item.quantity} · {item.priceSnapshot.currency} {item.priceSnapshot.amount.toFixed(2)}</span><button type="button" disabled={busy} onClick={() => void removeFromBasket(item)}>Remove</button></div>)}</div>
      </V2Card> : null}
      {!payload.recommendations.length ? <V2Card><p style={{ margin: 0, color: v2Tokens.slate }}>Nothing else needs preparation right now.</p></V2Card> : null}
      <V2Card>
        <button type="button" onClick={() => setShowDismissed((current) => !current)}>{showDismissed ? "Hide dismissed items" : "Show dismissed items"}</button>
        {showDismissed && payload.dismissedRecommendations?.length ? <div style={{ display: "grid", gap: 10, marginTop: 12 }}>{payload.dismissedRecommendations.map((item) => <article key={item.recommendationId} style={{ padding: 10, border: "1px dashed #cbd5e1", borderRadius: 10 }}><strong>{item.title}</strong><button type="button" onClick={() => void action("restore", item)} style={{ marginLeft: 10 }}>Restore dismissed item</button></article>)}</div> : null}
      </V2Card>
      <RecommendationDebugView debug={payload.debug ?? null} />
    </div>
  );
}
