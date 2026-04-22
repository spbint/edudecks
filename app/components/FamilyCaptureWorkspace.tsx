"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";
import {
  type HomeSurfaceState,
  type LearnerOption,
  LearnerSelector,
} from "@/app/components/home/HomeOverviewComponents";
import {
  CaptureSelect,
  CaptureSurface,
  CaptureTextArea,
  CaptureTextInput,
  BODY_TEXT,
  CARD_TITLE,
  CTA_TEXT,
  META_TEXT,
  SECTION_LABEL,
  SECTION_TITLE,
} from "@/app/components/capture/CaptureOverviewComponents";
import {
  CurriculumAttachPanel,
  CurriculumTagPills,
  InheritedCurriculumPanel,
} from "@/app/components/curriculum/CurriculumTaggingComponents";
import { createFamilyEvidenceEntry } from "@/lib/familyEvidence";
import { frameworkPreset } from "@/lib/curriculumFrameworks";
import { loadFamilyCalendarWindow, type FamilyCalendarBlockEntry } from "@/lib/familyPlanner";
import { resolveEffectiveLearnerLearningConfig } from "@/lib/familyLearningConfig";

function ymd(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

type LinkedBlockOption = FamilyCalendarBlockEntry & {
  dateLabel: string;
};

function friendlyCaptureMessage(kind: "load" | "save" | "setup") {
  if (kind === "load") {
    return "Linked plan blocks are still getting ready. You can keep the capture focused on the learning moment.";
  }
  if (kind === "setup") {
    return "Choose a synced learner workspace before capturing evidence.";
  }
  return "This learning evidence could not be saved just yet. Try again in a moment.";
}

export default function FamilyCaptureWorkspace() {
  const searchParams = useSearchParams();
  const { workspace, activeLearner, loading: workspaceLoading, setActiveLearner } = useFamilyWorkspace();

  const learnerOptions: LearnerOption[] = workspace.learners.map((learner) => ({
    id: learner.id,
    label: learner.label,
    note: learner.yearLabel || "Learner",
  }));

  const learnerParam = searchParams.get("learner") || "";
  const dateParam = searchParams.get("date") || ymd(new Date());

  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [linkedBlocks, setLinkedBlocks] = useState<LinkedBlockOption[]>([]);
  const [linkedLearningBlockId, setLinkedLearningBlockId] = useState("");
  const [curriculumOutcomeIds, setCurriculumOutcomeIds] = useState<string[]>([]);
  const [outcomeStatusById, setOutcomeStatusById] = useState<Record<string, "understood" | "in_progress" | "needs_support">>({});
  const [editingCurriculum, setEditingCurriculum] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [note, setNote] = useState("");
  const [occurredOn, setOccurredOn] = useState(dateParam);
  const [learningArea, setLearningArea] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const hasLearners = workspace.learners.length > 0;
  const hasActiveLearner = Boolean(activeLearner);
  const canonicalReady =
    Boolean(workspace.userId) &&
    workspace.storageMode === "database" &&
    Boolean(workspace.profile?.id) &&
    workspace.profile.id !== "local" &&
    Boolean(activeLearner?.id);
  const learningConfig = resolveEffectiveLearnerLearningConfig(workspace.profile, activeLearner);
  const preset = frameworkPreset(
    learningConfig.country === "us" || learningConfig.country === "uk"
      ? learningConfig.country
      : "au",
  );

  useEffect(() => {
    if (!learnerParam) return;
    if (activeLearner?.id === learnerParam) return;
    const match = workspace.learners.find((learner) => learner.id === learnerParam);
    if (match) setActiveLearner(match.id);
  }, [activeLearner?.id, learnerParam, setActiveLearner, workspace.learners]);

  useEffect(() => {
    let mounted = true;

    async function hydrateBlocks() {
      if (!canonicalReady || !activeLearner?.id) {
        if (mounted) {
          setLinkedBlocks([]);
          setLoadingBlocks(false);
        }
        return;
      }

      try {
        setLoadingBlocks(true);
        const anchor = new Date(`${occurredOn}T00:00:00`);
        const monday = startOfWeek(anchor);
        const friday = addDays(monday, 4);
        const window = await loadFamilyCalendarWindow({
          familyProfileId: workspace.profile.id,
          studentId: activeLearner.id,
          dateFrom: ymd(monday),
          dateTo: ymd(friday),
        });

        if (!mounted) return;

        const options = Object.entries(window.blocks)
          .flatMap(([date, blocks]) =>
            blocks.map((block) => ({
              ...block,
              dateLabel: new Date(`${date}T00:00:00`).toLocaleDateString("en-AU", {
                weekday: "short",
                day: "numeric",
                month: "short",
              }),
            })),
          )
          .sort((a, b) => a.date.localeCompare(b.date));

        setLinkedBlocks(options);
      } catch {
        if (!mounted) return;
        setErrorMessage(friendlyCaptureMessage("load"));
      } finally {
        if (mounted) setLoadingBlocks(false);
      }
    }

    void hydrateBlocks();
    return () => {
      mounted = false;
    };
  }, [activeLearner?.id, canonicalReady, occurredOn, workspace.profile?.id]);

  useEffect(() => {
    if (!linkedBlocks.length) {
      setLinkedLearningBlockId("");
      return;
    }

    const exact = linkedBlocks.find((block) => block.date === occurredOn);
    if (exact && !linkedLearningBlockId) {
      setLinkedLearningBlockId(exact.id);
      return;
    }

    if (linkedLearningBlockId && linkedBlocks.some((block) => block.id === linkedLearningBlockId)) {
      return;
    }

    setLinkedLearningBlockId(linkedBlocks[0]?.id || "");
  }, [linkedBlocks, linkedLearningBlockId, occurredOn]);

  const linkedBlock = linkedBlocks.find((block) => block.id === linkedLearningBlockId) ?? null;

  useEffect(() => {
    if (!linkedBlock) return;
    setLearningArea(linkedBlock.subject || "");
    setCurriculumOutcomeIds(linkedBlock.curriculumOutcomeIds ?? []);
    setOutcomeStatusById(
      Object.fromEntries(
        (linkedBlock.curriculumOutcomeIds ?? []).map((outcomeId) => [outcomeId, "in_progress" as const]),
      ),
    );
  }, [linkedBlock?.id]);

  const pageState: HomeSurfaceState = workspaceLoading || loadingBlocks
    ? "loading"
    : !hasLearners || !hasActiveLearner
      ? "empty"
      : canonicalReady
        ? "live"
        : "placeholder";

  const learnerSelectorState: HomeSurfaceState = workspaceLoading
    ? "loading"
    : hasLearners
      ? workspace.storageMode === "database"
        ? "derived"
        : "placeholder"
      : "empty";

  const primaryLinkedSummary = linkedBlock
    ? `${linkedBlock.title} · ${linkedBlock.dateLabel}`
    : "No linked learning block";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activeLearner?.id || !canonicalReady) {
      setErrorMessage(friendlyCaptureMessage("setup"));
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage("");
      setStatusMessage("");
      await createFamilyEvidenceEntry({
        studentId: activeLearner.id,
        userId: workspace.userId,
        title: title.trim() || "Learning moment",
        summary: summary.trim() || note.trim() || "Captured learning moment",
        note,
        occurredOn,
        learningArea: learningArea || linkedBlock?.subject || null,
        evidenceType: "note",
        linkedLearningBlockId: linkedBlock?.id || null,
        curriculumOutcomeIds,
        outcomeStatusById,
      });
      setStatusMessage("Learning evidence saved.");
      setTitle("");
      setSummary("");
      setNote("");
    } catch {
      setErrorMessage(friendlyCaptureMessage("save"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FamilyTopNavShell
      subtitle="My Capture"
      heroTitle="My Capture"
      heroText="Capture a learning moment while it is still fresh."
      heroAsideTitle="Linked context"
      heroAsideText="Capture inherits the plan context quietly, so curriculum can stay visible without cluttering the moment."
    >
      <div className="grid gap-5 pb-14">
        <LearnerSelector
          familyName={workspace.profile.family_display_name || "Your family"}
          learners={learnerOptions}
          activeLearnerId={activeLearner?.id}
          onSelectLearner={setActiveLearner}
          state={learnerSelectorState}
        />

        <CaptureSurface>
          <div className="grid gap-1.5">
            <div className={SECTION_LABEL}>Capture</div>
            <h2 className={SECTION_TITLE}>Add a learning moment</h2>
            <p className={BODY_TEXT}>
              Capture the important part now, then refine the curriculum links quietly underneath.
            </p>
          </div>

          <form className="grid gap-4" onSubmit={onSubmit}>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="grid gap-2">
                <label className={SECTION_LABEL}>Title</label>
                <CaptureTextInput
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="What happened?"
                />
              </div>
              <div className="grid gap-2">
                <label className={SECTION_LABEL}>Date</label>
                <CaptureTextInput
                  type="date"
                  value={occurredOn}
                  onChange={(event) => setOccurredOn(event.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label className={SECTION_LABEL}>Summary</label>
              <CaptureTextArea
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder="Keep it short and true to the learning moment."
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="grid gap-2">
                <label className={SECTION_LABEL}>Linked learning block</label>
                <CaptureSelect
                  value={linkedLearningBlockId}
                  onChange={(event) => setLinkedLearningBlockId(event.target.value)}
                >
                  <option value="">No linked learning block</option>
                  {linkedBlocks.map((block) => (
                    <option key={block.id} value={block.id}>
                      {block.dateLabel} · {block.title}
                    </option>
                  ))}
                </CaptureSelect>
                <div className={META_TEXT}>{primaryLinkedSummary}</div>
              </div>

              <div className="grid gap-2">
                <label className={SECTION_LABEL}>Learning area</label>
                <CaptureTextInput
                  value={learningArea}
                  onChange={(event) => setLearningArea(event.target.value)}
                  placeholder="Mathematics, English, Science…"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label className={SECTION_LABEL}>Reflection note</label>
              <CaptureTextArea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="What showed growth, confidence, or the next useful step?"
                className="min-h-[96px]"
              />
            </div>

            {statusMessage ? (
              <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-[14px] font-medium text-emerald-700">
                {statusMessage}
              </div>
            ) : null}
            {errorMessage ? (
              <div className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-[14px] font-medium text-rose-700">
                {errorMessage}
              </div>
            ) : null}

            <div className="flex justify-end">
              <div className="grid gap-2 justify-items-end">
                {!canonicalReady && hasActiveLearner ? (
                  <div className={META_TEXT}>
                    Capture saves once this learner is connected to the synced family workspace.
                  </div>
                ) : null}
                <button
                type="submit"
                disabled={submitting || !hasActiveLearner || !canonicalReady}
                className={`inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 ${CTA_TEXT} text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300`}
              >
                {submitting ? "Saving..." : "Capture Evidence"}
              </button>
              </div>
            </div>
          </form>
        </CaptureSurface>

        {editingCurriculum ? (
          <CurriculumAttachPanel
            preset={preset}
            selectedOutcomeIds={curriculumOutcomeIds}
            onApply={(outcomeIds) => {
              setCurriculumOutcomeIds(outcomeIds);
              setOutcomeStatusById((prev) =>
                Object.fromEntries(
                  outcomeIds.map((outcomeId) => [outcomeId, prev[outcomeId] || "in_progress"]),
                ),
              );
              setEditingCurriculum(false);
            }}
            onCancel={() => setEditingCurriculum(false)}
            state={pageState}
          />
        ) : (
          <InheritedCurriculumPanel
            preset={preset}
            outcomeIds={curriculumOutcomeIds}
            outcomeStatusById={outcomeStatusById}
            onEdit={() => setEditingCurriculum(true)}
            onStatusChange={(outcomeId, status) =>
              setOutcomeStatusById((prev) => ({ ...prev, [outcomeId]: status }))
            }
            state={pageState}
          />
        )}

        {linkedBlock ? (
          <CaptureSurface>
            <div className="grid gap-2">
              <div className={SECTION_LABEL}>Linked from plan</div>
              <div className={CARD_TITLE}>{linkedBlock.title}</div>
              <div className={META_TEXT}>
                {linkedBlock.dateLabel} · {linkedBlock.subject || "General"}
              </div>
              {preset && linkedBlock.curriculumOutcomeIds?.length ? (
                <CurriculumTagPills preset={preset} outcomeIds={linkedBlock.curriculumOutcomeIds} />
              ) : (
                <div className={BODY_TEXT}>
                  This block does not have linked curriculum yet.
                </div>
              )}
            </div>
          </CaptureSurface>
        ) : null}
      </div>
    </FamilyTopNavShell>
  );
}
