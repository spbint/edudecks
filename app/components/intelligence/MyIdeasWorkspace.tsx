"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthUser } from "@/app/components/AuthUserProvider";
import {
  V2Card,
  V2PageHeader,
  v2Tokens,
} from "@/app/components/clean/design-v2/MyLearnaAppShellV2";
import { validateSourceUrl } from "@/lib/intelligence/validation";
import {
  defaultIdeasService,
  type CreateIdeaInput,
  type IdeasService,
} from "@/lib/intelligence/ideas/service";
import { IdeasRepositoryError } from "@/lib/intelligence/ideas/repository";
import type { Idea, IdeaSource } from "@/lib/intelligence/types";
import type {
  SourceExtractionStatus,
  SourcePreviewMetadata,
} from "@/lib/intelligence/sources/types";
import type { LearningPlanDraft, LearningPlanType, GeneratedPlanContent } from "@/lib/intelligence/plans/types";
import type { PlanReviewEnvelope } from "@/lib/intelligence/plans/reviewTypes";
import { isRecommendationEngineEnabled } from "@/lib/intelligence/featureFlags";

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: `1px solid ${v2Tokens.border}`,
  borderRadius: 11,
  padding: "11px 12px",
  background: "#ffffff",
  color: v2Tokens.navy,
  font: "inherit",
};

const primaryButtonStyle: React.CSSProperties = {
  minHeight: 44,
  border: `1px solid ${v2Tokens.purple}`,
  borderRadius: 12,
  padding: "10px 16px",
  background: v2Tokens.purple,
  color: "#ffffff",
  font: "inherit",
  fontWeight: 750,
  cursor: "pointer",
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently saved";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ideaUrl(idea: Idea) {
  return idea.sources[0]?.url || "";
}

function sourceMetadata(source: IdeaSource): SourcePreviewMetadata | null {
  const metadata = source.metadata as Partial<SourcePreviewMetadata>;
  if (typeof metadata.extractionStatus !== "string") return null;
  return metadata as SourcePreviewMetadata;
}

function previewStatus(source: IdeaSource, extracting: boolean): SourceExtractionStatus | "pending" {
  if (extracting) return "fetching";
  return sourceMetadata(source)?.extractionStatus ?? "pending";
}

function previewStatusLabel(status: SourceExtractionStatus | "pending") {
  switch (status) {
    case "fetching": return "Fetching preview...";
    case "ready": return "Preview ready";
    case "unsupported": return "Unsupported source";
    case "blocked": return "Blocked by source policy";
    case "timed_out": return "Source timed out";
    case "too_large": return "Source is too large";
    case "failed": return "Preview failed";
    default: return "Preview not fetched";
  }
}

function planContent(plan: LearningPlanDraft) {
  return plan.content as unknown as GeneratedPlanContent;
}

type PlanSummaryState = Partial<Record<LearningPlanType, PlanReviewEnvelope | null>>;

function reviewUrl(ideaId: string, sourceId: string, planType: LearningPlanType) {
  return `/api/intelligence/ideas/${encodeURIComponent(ideaId)}/sources/${encodeURIComponent(sourceId)}/plans/${planType}/review`;
}

function planStatusLabel(review: PlanReviewEnvelope) {
  switch (review.workflowStatus) {
    case "generated_draft": return "Draft generated";
    case "editing": return "Editing";
    case "ready_for_approval": return "Ready for approval";
    case "approved": return "Approved";
    case "returned_to_draft": return "Returned to draft";
    case "archived": return "Archived";
  }
}

function approvedRevision(review: PlanReviewEnvelope) {
  const revision = review.provenance.finalApprovedVersion;
  return review.workflowStatus === "approved" && typeof revision === "number" && Number.isInteger(revision) && revision > 0
    ? revision
    : review.currentRevision;
}

function reviewEnvelopeFromPlan(plan: LearningPlanDraft): PlanReviewEnvelope {
  const content = planContent(plan);
  const review = content.review ?? {
    workflowStatus: "generated_draft" as const,
    originalGeneratedRevision: content.generation.revision,
    revisionKind: "generated" as const,
    changedFields: [],
    lastEditedAt: null,
    lastEditedByUserId: null,
    safetyAcknowledged: false,
    validation: content.validation,
  };
  return {
    plan,
    workflowStatus: review.workflowStatus,
    currentRevision: plan.version,
    originalGeneratedRevision: review.originalGeneratedRevision,
    review,
    provenance: plan.provenance,
  };
}

function ReadOnlyPlanPreview({ plan }: { plan: LearningPlanDraft }) {
  const content = planContent(plan);
  const sections: Array<[string, string[]]> = [
    ["Learning intentions", content.learningIntentions],
    ["Success criteria", content.successCriteria],
    ["Preparation", content.preparation],
    ["Discussion questions", content.discussionQuestions],
    ["Differentiation", content.differentiation],
    ["Evidence prompts", content.evidencePrompts],
    ["Portfolio prompts", content.portfolioPrompts],
    ["Safety and supervision", content.safetySupervisionNotes],
    ["Limitations and assumptions", content.limitationsAssumptions],
  ];
  return (
    <div
      aria-label="Generated plan draft preview"
      style={{ display: "grid", gap: 12, marginTop: 12, borderTop: `1px solid ${v2Tokens.border}`, paddingTop: 12 }}
    >
      <div>
        <strong style={{ color: v2Tokens.navy }}>{content.title}</strong>
        <p style={{ margin: "5px 0 0", color: v2Tokens.slate, lineHeight: 1.5 }}>{content.overview}</p>
      </div>
      <span style={{ color: v2Tokens.slate, fontSize: 13 }}>
        {content.planType === "lesson" ? "Lesson" : "Unit"} · {content.subjects.join(", ")} · {content.ageStage}
      </span>
      <div style={{ display: "grid", gap: 8 }}>
        <strong style={{ color: v2Tokens.navy }}>Sequence</strong>
        {content.sequence.map((item, index) => (
          <div key={`${item.title}-${index}`} style={{ borderLeft: `3px solid ${v2Tokens.purple}`, paddingLeft: 10 }}>
            <strong style={{ color: v2Tokens.navy }}>{index + 1}. {item.title}</strong>
            <div style={{ color: v2Tokens.slate, fontSize: 13 }}>{item.objective} {item.activity}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gap: 5 }}>
        <strong style={{ color: v2Tokens.navy }}>Resource requirements</strong>
        {content.resourceRequirements.length ? content.resourceRequirements.map((resource, index) => (
          <span key={`${resource.name}-${index}`} style={{ color: v2Tokens.slate, fontSize: 13 }}>
            {resource.required ? "Required" : "Optional"}: {resource.name}
          </span>
        )) : <span style={{ color: v2Tokens.slate, fontSize: 13 }}>No additional resources listed.</span>}
      </div>
      {sections.map(([label, values]) => values.length ? (
        <div key={label} style={{ display: "grid", gap: 4 }}>
          <strong style={{ color: v2Tokens.navy }}>{label}</strong>
          {values.map((value, index) => <span key={`${label}-${index}`} style={{ color: v2Tokens.slate, fontSize: 13 }}>• {value}</span>)}
        </div>
      ) : null)}
      <div style={{ color: v2Tokens.slate, fontSize: 12, overflowWrap: "anywhere" }}>
        Source: {content.sourceAttribution.title || content.sourceAttribution.provider || content.sourceAttribution.originalUrl} · {content.sourceAttribution.originalUrl}
      </div>
    </div>
  );
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof IdeasRepositoryError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export default function MyIdeasWorkspace({
  service = defaultIdeasService,
}: {
  service?: IdeasService;
}) {
  const { user, loading: authLoading } = useAuthUser();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [persistenceError, setPersistenceError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [extractingSourceId, setExtractingSourceId] = useState<string | null>(null);
  const [planType, setPlanType] = useState<LearningPlanType>("lesson");
  const [learnerAgeOrStage, setLearnerAgeOrStage] = useState("");
  const [subjects, setSubjects] = useState("");
  const [duration, setDuration] = useState("");
  const [durationUnit, setDurationUnit] = useState<"minutes" | "lessons" | "weeks" | "sessions">("minutes");
  const [parentInstructions, setParentInstructions] = useState("");
  const [generatingSourceId, setGeneratingSourceId] = useState<string | null>(null);
  const [generationState, setGenerationState] = useState("");
  const [generationError, setGenerationError] = useState("");
  const [planSummaries, setPlanSummaries] = useState<Record<string, PlanSummaryState>>({});
  const [planSummaryError, setPlanSummaryError] = useState("");

  const userId = user?.id ?? "";
  const formId = useMemo(() => "my-ideas-add-form", []);

  const hydratePlanSummaries = useCallback(async (nextIdeas: Idea[]) => {
    if (!userId) return;
    const requests = nextIdeas.flatMap((idea) => {
      const source = idea.sources[0];
      if (!source) return [];
      return (["lesson", "unit"] as const).map(async (type) => {
        try {
          const response = await fetch(reviewUrl(idea.id, source.id, type), { cache: "no-store" });
          if (response.status === 404) return { ideaId: idea.id, type, value: null as PlanReviewEnvelope | null, failed: false };
          if (!response.ok) return { ideaId: idea.id, type, value: undefined, failed: true };
          const payload = await response.json().catch(() => ({})) as Partial<PlanReviewEnvelope>;
          if (!payload.plan || !payload.review || !payload.provenance) return { ideaId: idea.id, type, value: undefined, failed: true };
          return { ideaId: idea.id, type, value: payload as PlanReviewEnvelope, failed: false };
        } catch {
          return { ideaId: idea.id, type, value: undefined, failed: true };
        }
      });
    });
    const results = await Promise.all(requests);
    const failed = results.some((result) => result.failed);
    setPlanSummaries((current) => {
      const next = { ...current };
      for (const result of results) {
        if (!result.failed) next[result.ideaId] = { ...(next[result.ideaId] ?? {}), [result.type]: result.value };
      }
      return next;
    });
    setPlanSummaryError(failed ? "Some saved plan details are temporarily unavailable. Try again to refresh." : "");
  }, [userId]);

  const loadIdeas = useCallback(async () => {
    if (!userId) {
      setIdeas([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError("");
    try {
      const nextIdeas = await service.listForUser(userId);
      setIdeas(nextIdeas);
      await hydratePlanSummaries(nextIdeas);
    } catch (error) {
      setLoadError(errorMessage(error, "We could not load your ideas."));
    } finally {
      setLoading(false);
    }
  }, [hydratePlanSummaries, service, userId]);

  useEffect(() => {
    void loadIdeas();
  }, [loadIdeas]);

  useEffect(() => {
    const refresh = () => {
      if (userId && ideas.length) void hydratePlanSummaries(ideas);
    };
    window.addEventListener("pageshow", refresh);
    return () => window.removeEventListener("pageshow", refresh);
  }, [hydratePlanSummaries, ideas, userId]);

  const fetchPreview = useCallback(async (idea: Idea) => {
    const source = idea.sources[0];
    if (!source || !userId) return;

    setExtractingSourceId(source.id);
    setPersistenceError("");
    try {
      const response = await fetch(
        `/api/intelligence/ideas/${encodeURIComponent(idea.id)}/sources/${encodeURIComponent(source.id)}/metadata`,
        { method: "POST" },
      );
      const payload = (await response.json().catch(() => ({}))) as {
        source?: IdeaSource;
        error?: string;
      };
      if (!response.ok || !payload.source) {
        throw new Error(payload.error || "We could not fetch a preview for this source.");
      }
      setIdeas((current) => current.map((entry) =>
        entry.id === idea.id
          ? {
              ...entry,
              sources: entry.sources.map((entrySource) =>
                entrySource.id === source.id ? payload.source! : entrySource,
              ),
            }
          : entry,
      ));
    } catch (error) {
      setPersistenceError(errorMessage(error, "We could not fetch a preview for this source."));
    } finally {
      setExtractingSourceId(null);
    }
  }, [userId]);

  const generatePlan = useCallback(async (idea: Idea) => {
    const source = idea.sources[0];
    if (!source || !userId) return;
    setGeneratingSourceId(source.id);
    setGenerationState("generating");
    setGenerationError("");
    try {
      const response = await fetch(
        `/api/intelligence/ideas/${encodeURIComponent(idea.id)}/sources/${encodeURIComponent(source.id)}/plans/${planType}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            learnerAgeOrStage,
            subjects: subjects.split(",").map((value) => value.trim()).filter(Boolean),
            duration: duration || null,
            durationUnit: duration || null ? durationUnit : null,
            parentInstructions: parentInstructions.trim() || null,
          }),
        },
      );
      const payload = (await response.json().catch(() => ({}))) as {
        state?: string;
        plan?: LearningPlanDraft;
        error?: string;
      };
      if (!response.ok || !payload.plan) {
        setGenerationState(payload.state || "failed");
        throw new Error(payload.error || "We could not generate a plan draft.");
      }
      setPlanSummaries((current) => ({
        ...current,
        [idea.id]: { ...(current[idea.id] ?? {}), [planType]: reviewEnvelopeFromPlan(payload.plan!) },
      }));
      setGenerationState("ready");
      await hydratePlanSummaries([idea]);
    } catch (error) {
      setGenerationError(errorMessage(error, "We could not generate a plan draft."));
      setGenerationState((current) => current === "generating" ? "failed" : current);
    } finally {
      setGeneratingSourceId(null);
    }
  }, [duration, durationUnit, hydratePlanSummaries, learnerAgeOrStage, parentInstructions, planType, subjects, userId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError("");
    setPersistenceError("");
    setSuccessMessage("");

    if (!userId) {
      setPersistenceError("Your signed-in session is not ready yet.");
      return;
    }

    const validation = validateSourceUrl(url);
    if (!validation.valid) {
      setValidationError(validation.message);
      return;
    }

    const input: CreateIdeaInput = {
      url,
      title: title.trim() || null,
    };

    setSubmitting(true);
    try {
      const created = await service.createForUser(userId, input);
      setIdeas((current) => [created, ...current]);
      setPlanSummaries((current) => ({ ...current, [created.id]: { lesson: null, unit: null } }));
      setUrl("");
      setTitle("");
      setSuccessMessage("Your idea was saved.");
      void fetchPreview(created);
    } catch (error) {
      setPersistenceError(errorMessage(error, "We could not save your idea."));
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div style={{ display: "grid", gap: 18 }}>
        <V2PageHeader
          eyebrow="My Ideas"
          title="Save ideas for later"
          subtitle="Keep useful links in one calm place. URL analysis and plan generation will arrive in later milestones."
        />
        <V2Card>
          <p style={{ margin: 0, color: v2Tokens.slate }}>Loading your saved ideas...</p>
        </V2Card>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <V2PageHeader
        eyebrow="My Ideas"
        title="Save ideas for later"
        subtitle="Keep useful links in one calm place. We will add URL preview and plan generation in later milestones."
      />

      {successMessage ? (
        <div
          role="status"
          style={{
            border: "1px solid #bbf7d0",
            borderRadius: 14,
            background: v2Tokens.mint,
            color: "#166534",
            padding: 14,
            fontWeight: 650,
          }}
        >
          {successMessage}
        </div>
      ) : null}

      {loadError ? (
        <div
          role="alert"
          style={{
            border: "1px solid #fecdd3",
            borderRadius: 14,
            background: v2Tokens.softRed,
            color: "#9f1239",
            padding: 14,
          }}
        >
          {loadError}
        </div>
      ) : null}

      {planSummaryError ? (
        <div role="alert" style={{ border: "1px solid #fed7aa", borderRadius: 14, background: "#fff7ed", color: "#9a3412", padding: 14 }}>
          {planSummaryError} <button type="button" onClick={() => void hydratePlanSummaries(ideas)} style={{ marginLeft: 8 }}>Refresh plan status</button>
        </div>
      ) : null}

      <V2Card>
        <div style={{ display: "grid", gap: 6, marginBottom: 16 }}>
          <h2 style={{ margin: 0, color: v2Tokens.navy, fontSize: 20 }}>Add an idea</h2>
          <p style={{ margin: 0, color: v2Tokens.slate, lineHeight: 1.55 }}>
            Save the link now. Nothing will be fetched or analysed yet.
          </p>
        </div>

        <form id={formId} onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
          <label style={{ display: "grid", gap: 7, color: v2Tokens.navy, fontWeight: 700 }}>
            URL
            <input
              aria-describedby="my-ideas-url-help"
              aria-label="Idea URL"
              autoComplete="url"
              required
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com/article"
              style={inputStyle}
            />
          </label>
          <span id="my-ideas-url-help" style={{ marginTop: -7, color: v2Tokens.slate, fontSize: 13 }}>
            Use an HTTP or HTTPS link.
          </span>

          <label style={{ display: "grid", gap: 7, color: v2Tokens.navy, fontWeight: 700 }}>
            Your title <span style={{ color: v2Tokens.slate, fontWeight: 500 }}>(optional)</span>
            <input
              aria-label="Optional idea title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Backyard weather station"
              style={inputStyle}
            />
          </label>

          {validationError ? (
            <div role="alert" style={{ color: "#9f1239", fontSize: 14, fontWeight: 650 }}>
              {validationError}
            </div>
          ) : null}
          {persistenceError ? (
            <div role="alert" style={{ color: "#9f1239", fontSize: 14, lineHeight: 1.5 }}>
              {persistenceError}
            </div>
          ) : null}

          <div>
            <button type="submit" disabled={submitting} style={{ ...primaryButtonStyle, opacity: submitting ? 0.65 : 1 }}>
              {submitting ? "Saving..." : "Save idea"}
            </button>
          </div>
        </form>
      </V2Card>

      <V2Card>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0, color: v2Tokens.navy, fontSize: 20 }}>Saved ideas</h2>
            <p style={{ margin: "6px 0 0", color: v2Tokens.slate }}>
              {ideas.length} saved {ideas.length === 1 ? "idea" : "ideas"}
            </p>
          </div>
        </div>

        {!ideas.length ? (
          <div
            style={{
              marginTop: 16,
              border: `1px dashed ${v2Tokens.border}`,
              borderRadius: 14,
              padding: 18,
              color: v2Tokens.slate,
              background: "#fbfcfe",
            }}
          >
            No ideas saved yet. Add your first link above.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
            {ideas.map((idea) => {
              const sourceUrl = ideaUrl(idea);
              return (
                <article
                  key={idea.id}
                  style={{
                    border: `1px solid ${v2Tokens.border}`,
                    borderRadius: 14,
                    padding: 14,
                    display: "grid",
                    gap: 7,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <strong style={{ color: v2Tokens.navy }}>{idea.title || "Saved idea"}</strong>
                    <span style={{ color: v2Tokens.slate, fontSize: 13 }}>{formatDate(idea.createdAt)}</span>
                  </div>
                  {sourceUrl ? (
                    <a
                      href={sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: v2Tokens.purple, overflowWrap: "anywhere", fontSize: 14 }}
                    >
                      {sourceUrl}
                    </a>
                  ) : null}
                  <span style={{ color: v2Tokens.slate, fontSize: 13 }}>Active</span>
                  {idea.sources[0] ? (() => {
                    const source = idea.sources[0];
                    const metadata = sourceMetadata(source);
                    const status = previewStatus(source, extractingSourceId === source.id);
                    const persistedPlan = planSummaries[idea.id]?.[planType];
                    const existingPlan = persistedPlan?.plan;
                    const approved = Boolean(persistedPlan && persistedPlan.workflowStatus === "approved");
                    const reviewHref = `/my-ideas/${encodeURIComponent(idea.id)}/sources/${encodeURIComponent(source.id)}/plans/${planType}/review`;
                    const preparationHref = persistedPlan && approved
                      ? `/my-ideas/${encodeURIComponent(idea.id)}/sources/${encodeURIComponent(source.id)}/plans/${planType}/preparation?planId=${encodeURIComponent(persistedPlan.plan.id)}&revision=${approvedRevision(persistedPlan)}`
                      : "";
                    return (
                      <div
                        aria-label="Source preview"
                        style={{
                          marginTop: 5,
                          borderTop: `1px solid ${v2Tokens.border}`,
                          paddingTop: 10,
                          display: "grid",
                          gap: 5,
                        }}
                      >
                        <strong style={{ color: v2Tokens.navy, fontSize: 14 }}>
                          {previewStatusLabel(status)}
                        </strong>
                        {metadata?.title || metadata?.description || metadata?.provider ? (
                          <div style={{ display: "grid", gap: 3 }}>
                            {metadata.title ? <span style={{ color: v2Tokens.navy }}>{metadata.title}</span> : null}
                            {metadata.description ? <span style={{ color: v2Tokens.slate, fontSize: 13 }}>{metadata.description}</span> : null}
                            {metadata.provider ? <span style={{ color: v2Tokens.slate, fontSize: 13 }}>{metadata.provider}</span> : null}
                          </div>
                        ) : null}
                        {metadata?.finalUrl && metadata.finalUrl !== source.url ? (
                          <span style={{ color: v2Tokens.slate, fontSize: 12, overflowWrap: "anywhere" }}>
                            Final URL: {metadata.finalUrl}
                          </span>
                        ) : null}
                        {metadata?.canonicalUrl ? (
                          <span style={{ color: v2Tokens.slate, fontSize: 12, overflowWrap: "anywhere" }}>
                            Canonical URL: {metadata.canonicalUrl}
                          </span>
                        ) : null}
                        {status === "ready" ? (
                          <label style={{ display: "grid", gap: 4, color: v2Tokens.navy, fontSize: 13, fontWeight: 650 }}>
                            Plan type
                            <select aria-label="Plan type" value={planType} onChange={(event) => setPlanType(event.target.value as LearningPlanType)} style={inputStyle}>
                              <option value="lesson">Lesson plan</option>
                              <option value="unit">Unit plan</option>
                            </select>
                          </label>
                        ) : null}
                        {status === "ready" && persistedPlan === null ? (
                          <div style={{ display: "grid", gap: 8, marginTop: 5 }}>
                            <strong style={{ color: v2Tokens.navy, fontSize: 14 }}>Generate a draft</strong>
                            <label style={{ display: "grid", gap: 4, color: v2Tokens.navy, fontSize: 13, fontWeight: 650 }}>
                              Learner age or stage
                              <input aria-label="Learner age or stage" value={learnerAgeOrStage} onChange={(event) => setLearnerAgeOrStage(event.target.value)} placeholder="e.g. Ages 8–10" style={inputStyle} />
                            </label>
                            <label style={{ display: "grid", gap: 4, color: v2Tokens.navy, fontSize: 13, fontWeight: 650 }}>
                              Subjects <span style={{ color: v2Tokens.slate, fontWeight: 500 }}>(optional, comma-separated)</span>
                              <input aria-label="Optional subjects" value={subjects} onChange={(event) => setSubjects(event.target.value)} placeholder="e.g. Science, writing" style={inputStyle} />
                            </label>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                              <label style={{ display: "grid", gap: 4, color: v2Tokens.navy, fontSize: 13, fontWeight: 650 }}>
                                Duration <span style={{ color: v2Tokens.slate, fontWeight: 500 }}>(optional)</span>
                                <input aria-label="Optional duration" inputMode="numeric" value={duration} onChange={(event) => setDuration(event.target.value)} placeholder="e.g. 45" style={inputStyle} />
                              </label>
                              <label style={{ display: "grid", gap: 4, color: v2Tokens.navy, fontSize: 13, fontWeight: 650 }}>
                                Duration unit
                                <select aria-label="Duration unit" value={durationUnit} onChange={(event) => setDurationUnit(event.target.value as typeof durationUnit)} style={inputStyle}>
                                  <option value="minutes">Minutes</option>
                                  <option value="lessons">Lessons</option>
                                  <option value="weeks">Weeks</option>
                                  <option value="sessions">Sessions</option>
                                </select>
                              </label>
                            </div>
                            <label style={{ display: "grid", gap: 4, color: v2Tokens.navy, fontSize: 13, fontWeight: 650 }}>
                              Parent instructions <span style={{ color: v2Tokens.slate, fontWeight: 500 }}>(optional)</span>
                              <textarea aria-label="Optional parent instructions" value={parentInstructions} onChange={(event) => setParentInstructions(event.target.value)} rows={3} placeholder="What should this draft emphasise?" style={{ ...inputStyle, resize: "vertical" }} />
                            </label>
                            <span role="status" style={{ color: v2Tokens.slate, fontSize: 13 }}>
                              Generation status: {generationState || "awaiting_input"}
                            </span>
                            {generationError ? <span role="alert" style={{ color: "#9f1239", fontSize: 13 }}>{generationError}</span> : null}
                            <button
                              type="button"
                              disabled={generatingSourceId === source.id}
                              onClick={() => void generatePlan(idea)}
                              style={{ ...primaryButtonStyle, justifySelf: "start", opacity: generatingSourceId === source.id ? 0.65 : 1 }}
                            >
                              {generatingSourceId === source.id ? "Generating..." : "Generate draft"}
                            </button>
                          </div>
                        ) : null}
                        {status === "ready" && persistedPlan === undefined ? (
                          <span role="status" style={{ color: v2Tokens.slate, fontSize: 13 }}>
                            Saved plan status is temporarily unavailable. Refresh to try again.
                          </span>
                        ) : null}
                        {status === "ready" && persistedPlan ? (
                          <div style={{ display: "grid", gap: 8, marginTop: 5 }}>
                            <strong style={{ color: v2Tokens.navy, fontSize: 14 }}>Plan status: {planStatusLabel(persistedPlan)}</strong>
                            {existingPlan ? <ReadOnlyPlanPreview plan={existingPlan} /> : null}
                            <a href={reviewHref} style={{ color: v2Tokens.purple, fontWeight: 700, justifySelf: "start" }}>
                              {approved ? "Open approved plan" : "Review and edit plan"}
                            </a>
                            {approved && isRecommendationEngineEnabled() ? (
                              <a href={preparationHref} style={{ color: v2Tokens.purple, fontWeight: 700, justifySelf: "start" }}>
                                View preparation list
                              </a>
                            ) : null}
                          </div>
                        ) : null}
                        {status !== "fetching" && status !== "ready" ? (
                          <button
                            type="button"
                            onClick={() => void fetchPreview(idea)}
                            style={{ ...primaryButtonStyle, minHeight: 36, justifySelf: "start", padding: "7px 12px", fontSize: 13 }}
                          >
                            {status === "pending" ? "Fetch preview" : "Try again"}
                          </button>
                        ) : null}
                      </div>
                    );
                  })() : null}
                </article>
              );
            })}
          </div>
        )}
      </V2Card>
    </div>
  );
}
