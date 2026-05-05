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
import {
  type FamilyEvidenceAttachmentLink,
  createFamilyEvidenceEntry,
  updateFamilyEvidenceEntryAttachments,
  uploadFamilyEvidenceFiles,
} from "@/lib/familyEvidence";
import { frameworkPreset } from "@/lib/curriculumFrameworks";
import { ensureEvidenceCompatibleLearner } from "@/lib/familyWorkspace";
import { loadFamilyCalendarWindow, type FamilyCalendarBlockEntry } from "@/lib/familyPlanner";
import { resolveEffectiveLearnerLearningConfig } from "@/lib/familyLearningConfig";

const MAX_EVIDENCE_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_EVIDENCE_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
];
const ACCEPTED_EVIDENCE_FILE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".pdf",
  ".doc",
  ".docx",
  ".txt",
  ".csv",
];

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

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isSupportedEvidenceFile(file: File) {
  const fileType = String(file.type || "").toLowerCase();
  if (fileType && ACCEPTED_EVIDENCE_FILE_TYPES.includes(fileType)) return true;
  const lowerName = file.name.toLowerCase();
  return ACCEPTED_EVIDENCE_FILE_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
}

function dedupeFiles(files: File[]) {
  const seen = new Set<string>();
  return files.filter((file) => {
    const key = `${file.name}:${file.size}:${file.lastModified}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function evidenceTypeFromFiles(files: File[]) {
  if (!files.length) return "note";
  const hasImage = files.some((file) =>
    String(file.type || "").toLowerCase().startsWith("image/"),
  );
  const hasNonImage = files.some(
    (file) => !String(file.type || "").toLowerCase().startsWith("image/"),
  );

  if (hasImage && hasNonImage) return "work_sample";
  if (hasImage) return "photo";
  return "document";
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
  const blockParam = searchParams.get("block") || "";

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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [savedAttachments, setSavedAttachments] = useState<FamilyEvidenceAttachmentLink[]>([]);
  const [savedAttachmentNote, setSavedAttachmentNote] = useState("");
  const [fileInputResetKey, setFileInputResetKey] = useState(0);

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

    if (blockParam) {
      const requested = linkedBlocks.find((block) => block.id === blockParam);
      if (requested) {
        setLinkedLearningBlockId(requested.id);
        return;
      }
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
  }, [blockParam, linkedBlocks, linkedLearningBlockId, occurredOn]);

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
  }, [linkedBlock]);

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

  const attachmentSelectionLabel =
    selectedFiles.length === 1 ? "1 file selected" : `${selectedFiles.length} files selected`;

  function resetCaptureFields() {
    setTitle("");
    setSummary("");
    setNote("");
    setSelectedFiles([]);
    setFileInputResetKey((current) => current + 1);
  }

  function onFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFiles = dedupeFiles(Array.from(event.target.files ?? []));
    if (!nextFiles.length) {
      setSelectedFiles([]);
      return;
    }

    const unsupported = nextFiles.find((file) => !isSupportedEvidenceFile(file));
    if (unsupported) {
      setErrorMessage("Attach a photo, PDF, Word file, text file, or CSV.");
      event.target.value = "";
      return;
    }

    const oversized = nextFiles.find((file) => file.size > MAX_EVIDENCE_FILE_SIZE);
    if (oversized) {
      setErrorMessage(`${oversized.name} is too large. Keep each file under 10 MB.`);
      event.target.value = "";
      return;
    }

    setErrorMessage("");
    setSelectedFiles(nextFiles);
  }

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
      setSavedAttachments([]);
      setSavedAttachmentNote("");

      const evidenceLearner = await ensureEvidenceCompatibleLearner(
        workspace.userId || "",
        activeLearner,
        workspace.profile.id,
      );

      const created = await createFamilyEvidenceEntry({
        studentId: evidenceLearner.id,
        userId: workspace.userId,
        title: title.trim() || "Learning moment",
        summary: summary.trim() || note.trim() || "Captured learning moment",
        note,
        occurredOn,
        learningArea: learningArea || linkedBlock?.subject || null,
        evidenceType: evidenceTypeFromFiles(selectedFiles),
        linkedLearningBlockId: linkedBlock?.id || null,
        curriculumOutcomeIds,
        outcomeStatusById,
      });

      let uploadedAttachments: FamilyEvidenceAttachmentLink[] = [];
      let failedUploads = 0;

      if (selectedFiles.length) {
        const uploadResult = await uploadFamilyEvidenceFiles({
          familyProfileId: workspace.profile.id,
          studentId: evidenceLearner.id,
          evidenceId: created.id,
          files: selectedFiles,
        });

        uploadedAttachments = uploadResult.uploaded.map((item) => ({
          url: null,
          label: item.label,
          kind: item.kind,
          path: item.path,
          mimeType: item.mimeType,
          size: item.size,
          isLegacyPublicUrl: false,
        }));
        failedUploads = uploadResult.failed.length;

        if (uploadResult.uploaded.length) {
          await updateFamilyEvidenceEntryAttachments({
            evidenceId: created.id,
            studentId: evidenceLearner.id,
            attachmentUrls: uploadResult.uploaded.map((item) => ({
              path: item.path,
              name: item.label,
              mimeType: item.mimeType,
              size: item.size,
              kind: item.kind,
            })),
            imageUrl: null,
            audioUrl: null,
            fileUrl: null,
          });
        }
      }

      if (!selectedFiles.length) {
        setStatusMessage("Learning evidence saved.");
      } else if (uploadedAttachments.length && failedUploads === 0) {
        setStatusMessage(
          `Learning evidence saved with ${uploadedAttachments.length} attachment${uploadedAttachments.length === 1 ? "" : "s"}.`,
        );
      } else if (uploadedAttachments.length) {
        setStatusMessage(
          `Learning evidence saved with ${uploadedAttachments.length} attachment${uploadedAttachments.length === 1 ? "" : "s"}.`,
        );
        setErrorMessage(
          `${failedUploads} attachment${failedUploads === 1 ? "" : "s"} could not be uploaded.`,
        );
      } else {
        setStatusMessage("Learning evidence saved.");
        setErrorMessage("The learning note was saved, but the attachment upload did not complete.");
      }

      setSavedAttachments(uploadedAttachments);
      setSavedAttachmentNote(
        uploadedAttachments.length
          ? "Evidence attached"
          : selectedFiles.length
            ? "Evidence saved without attachment links"
            : "",
      );
      resetCaptureFields();
    } catch (error) {
      setErrorMessage(
        error instanceof Error && error.message
          ? error.message
          : friendlyCaptureMessage("save"),
      );
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

            <div className="grid gap-3 rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-4">
              <div className="grid gap-1">
                <div className={SECTION_LABEL}>Attach photo or file</div>
                <div className={BODY_TEXT}>
                  Add a real piece of evidence to this learning moment. Images stay visible in portfolio cards when available. Other files are saved as private references for report and export use.
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50">
                  Choose files
                  <input
                    key={fileInputResetKey}
                    type="file"
                    multiple
                    accept={ACCEPTED_EVIDENCE_FILE_EXTENSIONS.join(",")}
                    onChange={onFilesSelected}
                    className="hidden"
                  />
                </label>
                <div className={META_TEXT}>Up to 10 MB each</div>
                {selectedFiles.length ? (
                  <div className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[12px] font-semibold text-blue-700">
                    {attachmentSelectionLabel}
                  </div>
                ) : null}
              </div>

              {selectedFiles.length ? (
                <div className="grid gap-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${file.size}-${file.lastModified}`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-slate-200 bg-white px-3 py-3"
                    >
                      <div className="grid gap-0.5">
                        <div className="text-[13px] font-semibold text-slate-950">{file.name}</div>
                        <div className="text-[12px] text-slate-500">{formatFileSize(file.size)}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedFiles((current) =>
                            current.filter((_, fileIndex) => fileIndex !== index),
                          )
                        }
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              {savedAttachments.length ? (
                <div className="grid gap-2 rounded-[14px] border border-emerald-200 bg-emerald-50 px-3 py-3">
                  <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                    {savedAttachmentNote || "Evidence attached"}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {savedAttachments.map((attachment) => (
                      <div
                        key={`${attachment.path || attachment.label}-${attachment.kind}`}
                        className="inline-flex rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        {attachment.label}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
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
                {submitting ? "Saving evidence..." : "Capture Evidence"}
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
