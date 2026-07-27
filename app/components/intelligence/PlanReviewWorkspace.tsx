"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { V2Card, V2PageHeader, v2Tokens } from "@/app/components/clean/design-v2/MyLearnaAppShellV2";
import type { PlanProvenance } from "@/lib/intelligence/types";
import type { GeneratedPlanContent, LearningPlanType, PlanWorkflowStatus } from "@/lib/intelligence/plans/types";
import type { PlanReviewEnvelope, ReviewAction, ReviewValidationResult } from "@/lib/intelligence/plans/reviewTypes";
import PlanEditorShell from "./PlanEditorShell";
import LessonSequenceEditor from "./LessonSequenceEditor";
import UnitSequenceEditor from "./UnitSequenceEditor";
import ResourceRequirementEditor from "./ResourceRequirementEditor";

function urlFor(ideaId: string, sourceId: string, planType: LearningPlanType) {
  return `/api/intelligence/ideas/${encodeURIComponent(ideaId)}/sources/${encodeURIComponent(sourceId)}/plans/${planType}/review`;
}

function reviewValidation(envelope: PlanReviewEnvelope): ReviewValidationResult {
  const content = envelope.plan.content as unknown as GeneratedPlanContent;
  return {
    ...envelope.review.validation,
    safetyAcknowledgementRequired: envelope.review.validation.safetyAcknowledgementRequired ?? content.safetySupervisionNotes.length > 0,
    safetyAcknowledged: envelope.review.safetyAcknowledged,
  };
}

function provenanceRows(provenance: PlanProvenance, content: GeneratedPlanContent) {
  const source = provenance.sources[0];
  return [
    ["Original URL", source?.sourceUrl ?? content.sourceAttribution.originalUrl],
    ["Final URL", content.sourceAttribution.finalUrl ?? "Not available"],
    ["Canonical URL", content.sourceAttribution.canonicalUrl ?? "Not available"],
    ["Source title", source?.sourceTitle ?? content.sourceAttribution.title ?? "Not available"],
    ["Source provider", source?.sourceProvider ?? content.sourceAttribution.provider ?? "Not available"],
    ["Extracted", source?.extractedAt ?? content.sourceAttribution.extractedAt ?? "Not available"],
    ["Generation", `${content.generation.provider} / ${content.generation.model}`],
    ["Model version", content.generation.modelVersion],
    ["Prompt version", content.generation.promptVersion],
    ["Schema version", content.generation.schemaVersion],
    ["Original generated revision", String(content.review?.originalGeneratedRevision ?? content.generation.revision)],
  ];
}

function reviewSnapshot(content: GeneratedPlanContent, safetyAcknowledged: boolean) {
  return JSON.stringify({ content, safetyAcknowledged });
}

export default function PlanReviewWorkspace({ ideaId, sourceId, planType }: { ideaId: string; sourceId: string; planType: LearningPlanType }) {
  const [envelope, setEnvelope] = useState<PlanReviewEnvelope | null>(null);
  const [content, setContent] = useState<GeneratedPlanContent | null>(null);
  const [dirty, setDirty] = useState(false);
  const [safetyAcknowledged, setSafetyAcknowledged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [validation, setValidation] = useState<ReviewValidationResult | null>(null);
  const envelopeRef = useRef<PlanReviewEnvelope | null>(null);
  const contentRef = useRef<GeneratedPlanContent | null>(null);
  const safetyAcknowledgedRef = useRef(false);
  const savedSnapshotRef = useRef("");
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);
  const requestIdRef = useRef(0);

  const endpoint = useMemo(() => urlFor(ideaId, sourceId, planType), [ideaId, sourceId, planType]);

  const applyEnvelope = useCallback((next: PlanReviewEnvelope) => {
    const nextContent = next.plan.content as unknown as GeneratedPlanContent;
    const nextSafety = next.review.safetyAcknowledged;
    const nextSnapshot = reviewSnapshot(nextContent, nextSafety);
    envelopeRef.current = next;
    contentRef.current = nextContent;
    safetyAcknowledgedRef.current = nextSafety;
    savedSnapshotRef.current = nextSnapshot;
    dirtyRef.current = false;
    setEnvelope(next);
    setContent(nextContent);
    setSafetyAcknowledged(nextSafety);
    setDirty(false);
    setValidation(reviewValidation(next));
    setState(next.workflowStatus === "approved" ? "approved" : "saved");
  }, []);

  const updateContent = useCallback((update: (current: GeneratedPlanContent) => GeneratedPlanContent) => {
    const current = contentRef.current;
    if (!current) return;
    const next = update(current);
    contentRef.current = next;
    dirtyRef.current = reviewSnapshot(next, safetyAcknowledgedRef.current) !== savedSnapshotRef.current;
    setContent(next);
    setDirty(dirtyRef.current);
    setState("editing");
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      const payload = await response.json().catch(() => ({})) as PlanReviewEnvelope & { error?: string };
      if (!response.ok || !payload.plan) throw new Error(payload.error || "We could not load this plan review.");
      applyEnvelope(payload);
    } catch (loadError) {
      setState("persistence_failure");
      setError(loadError instanceof Error ? loadError.message : "We could not load this plan review.");
    } finally {
      setLoading(false);
    }
  }, [applyEnvelope, endpoint]);

  useEffect(() => { void load(); }, [load]);

  async function request(action: ReviewAction, options: { content?: GeneratedPlanContent; expectedRevision?: number; safety?: boolean } = {}) {
    const currentEnvelope = envelopeRef.current;
    const currentContent = contentRef.current;
    if (!currentEnvelope || !currentContent) return null;
    if (savingRef.current) return null;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    savingRef.current = true;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action,
          expectedRevision: options.expectedRevision ?? currentEnvelope.currentRevision,
          content: action === "save" ? options.content ?? currentContent : options.content,
          safetyAcknowledged: options.safety ?? safetyAcknowledgedRef.current,
        }),
      });
      const payload = await response.json().catch(() => ({})) as PlanReviewEnvelope & { error?: string; code?: string; issues?: string[]; plan?: unknown; state?: string };
      if (requestId !== requestIdRef.current) return null;
      if (!response.ok) {
        if (payload.code === "stale_revision") setState("stale_revision");
        else if (payload.code === "approval_blocked" || payload.code === "validation_failed") setState(payload.code);
        else setState("persistence_failure");
        if (payload.issues?.length) setValidation({ valid: false, repaired: false, issues: payload.issues, safetyAcknowledgementRequired: true, safetyAcknowledged, validatedAt: new Date().toISOString() });
        throw new Error(payload.error || "We could not update this plan.");
      }
      if (action === "regenerate") {
        await load();
      } else {
        applyEnvelope(payload);
      }
      return payload;
    } catch (requestError) {
      if (requestId !== requestIdRef.current) return null;
      setError(requestError instanceof Error ? requestError.message : "We could not update this plan.");
      return null;
    } finally {
      if (requestId === requestIdRef.current) {
        savingRef.current = false;
        setSaving(false);
      }
    }
  }

  async function saveIfDirty(): Promise<PlanReviewEnvelope | true | false> {
    if (!dirtyRef.current) return true;
    const saved = await request("save", { content: contentRef.current ?? undefined });
    return saved && "currentRevision" in saved ? saved as PlanReviewEnvelope : false;
  }

  async function validate() {
    const saved = await saveIfDirty();
    if (!saved) return;
    const currentEnvelope = envelopeRef.current;
    await request("validate", { expectedRevision: saved === true ? currentEnvelope?.currentRevision : saved.currentRevision });
  }

  async function approve() {
    const saved = await saveIfDirty();
    if (!saved) return;
    const currentEnvelope = envelopeRef.current;
    await request("approve", { expectedRevision: saved === true ? currentEnvelope?.currentRevision : saved.currentRevision, safety: safetyAcknowledgedRef.current });
  }

  async function changeStatus(action: "return_to_draft" | "archive") {
    const saved = await saveIfDirty();
    if (!saved) return;
    const currentEnvelope = envelopeRef.current;
    await request(action, { expectedRevision: saved === true ? currentEnvelope?.currentRevision : saved.currentRevision });
  }

  if (loading) {
    return <V2Card><p role="status" style={{ margin: 0, color: v2Tokens.slate }}>Loading plan review...</p></V2Card>;
  }
  if (!content || !envelope) {
    return <V2Card><div role="alert" style={{ color: "#9f1239" }}>{error || "Plan review unavailable."}</div></V2Card>;
  }

  const rows = provenanceRows(envelope.provenance, content);
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <V2PageHeader eyebrow="My Ideas" title={`Review ${planType} plan`} subtitle="Edit the draft, validate it, then approve it when it is ready." />
      {error ? <div role="alert" style={{ border: "1px solid #fecdd3", background: "#fff1f2", color: "#9f1239", padding: 12, borderRadius: 12 }}>{error}</div> : null}
      <V2Card>
        <PlanEditorShell
          content={content}
          status={envelope.workflowStatus as PlanWorkflowStatus}
          dirty={dirty}
          saving={saving}
          validation={validation}
          safetyAcknowledged={safetyAcknowledged}
          onSafetyAcknowledgedChange={(value) => {
            safetyAcknowledgedRef.current = value;
            setSafetyAcknowledged(value);
            if (contentRef.current) {
              dirtyRef.current = reviewSnapshot(contentRef.current, value) !== savedSnapshotRef.current;
              setDirty(dirtyRef.current);
            }
            setState("editing");
          }}
          onChange={(field, value) => { updateContent((current) => ({ ...current, [field]: value } as GeneratedPlanContent)); }}
          onSave={() => { void request("save"); }}
          onValidate={() => { void validate(); }}
          onApprove={() => { void approve(); }}
          onReturnToDraft={() => { void changeStatus("return_to_draft"); }}
          onArchive={() => { void changeStatus("archive"); }}
          onRegenerate={() => { void request("regenerate"); }}
          sequenceEditor={planType === "lesson"
            ? <LessonSequenceEditor values={content.sequence} onChange={(value) => { updateContent((current) => ({ ...current, sequence: value })); }} />
            : <UnitSequenceEditor values={content.sequence} onChange={(value) => { updateContent((current) => ({ ...current, sequence: value })); }} />}
          resourceEditor={<ResourceRequirementEditor values={content.resourceRequirements} onChange={(value) => { updateContent((current) => ({ ...current, resourceRequirements: value })); }} />}
        />
        <div aria-label="Plan state" style={{ marginTop: 12, color: v2Tokens.slate, fontSize: 13 }}>Editor state: {state}</div>
      </V2Card>
      {envelope.workflowStatus === "approved" ? (
        <V2Card>
          <a href={`/my-ideas/${encodeURIComponent(ideaId)}/sources/${encodeURIComponent(sourceId)}/plans/${planType}/preparation?planId=${encodeURIComponent(envelope.plan.id)}&revision=${envelope.currentRevision}`} style={{ color: v2Tokens.purple, fontWeight: 700 }}>
            Open learning preparation list
          </a>
        </V2Card>
      ) : null}
      <V2Card>
        <section aria-labelledby="provenance-heading" style={{ display: "grid", gap: 8 }}>
          <h2 id="provenance-heading" style={{ margin: 0 }}>Protected provenance</h2>
          <p style={{ margin: 0, color: v2Tokens.slate }}>These fields are retained with every revision and cannot be edited here.</p>
          <dl style={{ display: "grid", gridTemplateColumns: "minmax(150px, 0.35fr) minmax(0, 1fr)", gap: 8, margin: 0 }}>
            {rows.map(([label, value]) => <div key={label} style={{ display: "contents" }}><dt style={{ fontWeight: 700 }}>{label}</dt><dd style={{ margin: 0, overflowWrap: "anywhere", color: v2Tokens.slate }}>{value}</dd></div>)}
          </dl>
        </section>
      </V2Card>
    </div>
  );
}
