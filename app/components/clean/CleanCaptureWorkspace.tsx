"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import CleanFamilyWorkspaceProvider, {
  useCleanFamilyWorkspace,
} from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import CleanWorkflowRibbon from "@/app/components/clean/CleanWorkflowRibbon";
import { listCleanCalendarItems } from "@/lib/clean/calendar/client";
import type { CleanCalendarItem } from "@/lib/clean/calendar/types";
import {
  deleteCleanEvidenceEntry,
  listCleanEvidenceEntries,
  createCleanEvidenceEntry,
  updateCleanEvidenceEntry,
} from "@/lib/clean/evidence/client";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import {
  CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE,
  normalizeCleanErrorMessage,
} from "@/lib/clean/family/client";
import {
  listCleanProgramSegments,
  listCleanPrograms,
} from "@/lib/clean/programs/client";
import type { CleanProgram, CleanProgramSegment } from "@/lib/clean/programs/types";

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "32px 20px 48px",
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 1080,
  margin: "0 auto",
  display: "grid",
  gap: 20,
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  background: "#ffffff",
  padding: 20,
  boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
};

const textAreaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 120,
  resize: "vertical",
};

const buttonStyle: React.CSSProperties = {
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

function getTodayDate() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function formatDateLabel(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getLearnerLabel(firstName: string, preferredName: string | null) {
  return preferredName || firstName;
}

function buildCalendarOptionLabel(item: CleanCalendarItem, learnerLabel: string) {
  return `${formatDateLabel(item.plannedDate)} - ${item.title} - ${learnerLabel}`;
}

function safeQueryValue(value: string | null) {
  return String(value ?? "").trim();
}

function humanizeQuerySlug(value: string) {
  const normalized = safeQueryValue(value);
  if (!normalized) return "";

  return normalized
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function CleanCaptureWorkspaceBody() {
  const workspace = useCleanFamilyWorkspace();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [entries, setEntries] = useState<CleanEvidenceEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [entriesError, setEntriesError] = useState<string | null>(null);
  const [programs, setPrograms] = useState<CleanProgram[]>([]);
  const [programSegments, setProgramSegments] = useState<CleanProgramSegment[]>([]);
  const [calendarItems, setCalendarItems] = useState<CleanCalendarItem[]>([]);
  const [linkingLoading, setLinkingLoading] = useState(false);
  const [linkingError, setLinkingError] = useState<string | null>(null);

  const [learnerId, setLearnerId] = useState("");
  const [observedOn, setObservedOn] = useState(getTodayDate);
  const [title, setTitle] = useState("");
  const [whatHappened, setWhatHappened] = useState("");
  const [reflection, setReflection] = useState("");
  const [learningArea, setLearningArea] = useState("");
  const [programId, setProgramId] = useState("");
  const [calendarItemId, setCalendarItemId] = useState("");
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [lastAppliedContextKey, setLastAppliedContextKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const learnerOptions = useMemo(
    () =>
      workspace.learners.map((learner) => ({
        value: learner.id,
        label: getLearnerLabel(learner.firstName, learner.preferredName),
      })),
    [workspace.learners],
  );

  const captureContextKey = searchParams.toString();
  const evidenceEntryIdFromQuery = safeQueryValue(searchParams.get("evidence_entry_id"));
  const calendarItemIdFromQuery = safeQueryValue(searchParams.get("calendar_item_id"));
  const learnerIdFromQuery = safeQueryValue(searchParams.get("learner_id"));
  const programIdFromQuery = safeQueryValue(searchParams.get("program_id"));
  const programSegmentIdFromQuery = safeQueryValue(searchParams.get("program_segment_id"));
  const learningAreaFromQuery = safeQueryValue(searchParams.get("learningArea"));
  const curriculumElementFromQuery = safeQueryValue(searchParams.get("curriculumElement"));
  const observedOnFromQuery =
    safeQueryValue(searchParams.get("observed_on")) ||
    safeQueryValue(searchParams.get("planned_date"));

  const selectedProgram = useMemo(
    () => programs.find((program) => program.id === programId) ?? null,
    [programId, programs],
  );

  const selectedCalendarItem = useMemo(
    () => calendarItems.find((item) => item.id === calendarItemId) ?? null,
    [calendarItemId, calendarItems],
  );

  const selectedProgramSegment = useMemo(() => {
    const linkedSegmentId =
      programSegmentIdFromQuery || selectedCalendarItem?.programSegmentId || "";
    if (!linkedSegmentId) return null;
    return programSegments.find((segment) => segment.id === linkedSegmentId) ?? null;
  }, [programSegmentIdFromQuery, programSegments, selectedCalendarItem?.programSegmentId]);

  const filteredPrograms = useMemo(() => {
    if (!learnerId) return programs;

    return programs.filter(
      (program) => program.learnerId === null || program.learnerId === learnerId,
    );
  }, [learnerId, programs]);

  const filteredCalendarItems = useMemo(() => {
    if (!learnerId) return calendarItems;

    return calendarItems.filter(
      (item) => item.learnerId === null || item.learnerId === learnerId,
    );
  }, [calendarItems, learnerId]);

  const reloadEntries = useCallback(async () => {
    if (!workspace.profile) return;

    setEntriesLoading(true);
    setEntriesError(null);
    try {
      const nextEntries = await listCleanEvidenceEntries(workspace.profile.id, {
        limit: 50,
      });
      setEntries(nextEntries);
    } catch (error) {
      setEntriesError(
        normalizeCleanErrorMessage(
          error,
          "We could not load your capture notes just now.",
        ),
      );
    } finally {
      setEntriesLoading(false);
    }
  }, [workspace.profile]);

  const reloadLinkOptions = useCallback(async () => {
    if (!workspace.profile) return;

    setLinkingLoading(true);
    setLinkingError(null);
    try {
      const [nextPrograms, nextCalendarItems] = await Promise.all([
        listCleanPrograms(workspace.profile.id, { limit: 50 }),
        listCleanCalendarItems(workspace.profile.id, { limit: 50 }),
      ]);

      const nextProgramSegments = (
        await Promise.all(
          nextPrograms.map((program) =>
            listCleanProgramSegments(workspace.profile!.id, program.id),
          ),
        )
      ).flat();

      setPrograms(nextPrograms);
      setProgramSegments(nextProgramSegments);
      setCalendarItems(nextCalendarItems);
    } catch (error) {
      setLinkingError(
        normalizeCleanErrorMessage(
          error,
          "We could not load the program and calendar links just now.",
        ),
      );
    } finally {
      setLinkingLoading(false);
    }
  }, [workspace.profile]);

  useEffect(() => {
    if (!workspace.profile || workspace.schemaMissing || workspace.requiresFamilyCreation) {
      setEntries([]);
      setPrograms([]);
      setProgramSegments([]);
      setCalendarItems([]);
      return;
    }

    void reloadEntries();
    void reloadLinkOptions();
  }, [
    reloadEntries,
    reloadLinkOptions,
    workspace.profile,
    workspace.requiresFamilyCreation,
    workspace.schemaMissing,
  ]);

  useEffect(() => {
    if (!workspace.learners.length) {
      setLearnerId("");
      return;
    }

    const currentIsValid = workspace.learners.some((learner) => learner.id === learnerId);
    if (currentIsValid) return;

    const defaultLearnerId = workspace.profile?.defaultLearnerId;
    const defaultIsValid = defaultLearnerId
      ? workspace.learners.some((learner) => learner.id === defaultLearnerId)
      : false;

    setLearnerId(defaultIsValid ? defaultLearnerId || "" : workspace.learners[0]?.id || "");
  }, [learnerId, workspace.learners, workspace.profile?.defaultLearnerId]);

  useEffect(() => {
    if (programId && !filteredPrograms.some((program) => program.id === programId)) {
      setProgramId("");
    }

    if (
      calendarItemId &&
      !filteredCalendarItems.some((item) => item.id === calendarItemId)
    ) {
      setCalendarItemId("");
    }
  }, [calendarItemId, filteredCalendarItems, filteredPrograms, programId]);

  function resetForm(nextLearnerId?: string) {
    setEditingEntryId(null);
    setObservedOn(getTodayDate());
    setTitle("");
    setWhatHappened("");
    setReflection("");
    setLearningArea("");
    setProgramId("");
    setCalendarItemId("");
    setLearnerId(nextLearnerId ?? workspace.profile?.defaultLearnerId ?? workspace.learners[0]?.id ?? "");
  }

  function clearCaptureContext() {
    setLastAppliedContextKey("");
    router.replace(pathname);
  }

  useEffect(() => {
    if (
      !workspace.profile ||
      !captureContextKey ||
      captureContextKey === lastAppliedContextKey ||
      linkingLoading ||
      entriesLoading
    ) {
      return;
    }

    if (evidenceEntryIdFromQuery) {
      const existingEntry = entries.find((entry) => entry.id === evidenceEntryIdFromQuery);
      if (!existingEntry) return;

      setEditingEntryId(existingEntry.id);
      setLearnerId(existingEntry.learnerId);
      setObservedOn(existingEntry.observedOn);
      setTitle(existingEntry.title || "");
      setWhatHappened(existingEntry.whatHappened);
      setReflection(existingEntry.reflection || "");
      setLearningArea(existingEntry.learningArea || "");
      setProgramId(existingEntry.programId || "");
      setCalendarItemId(existingEntry.calendarItemId || calendarItemIdFromQuery || "");
      setMessage(null);
      setActionError(null);
      setLastAppliedContextKey(captureContextKey);
      return;
    }

    const linkedCalendarItem = calendarItemIdFromQuery
      ? calendarItems.find((item) => item.id === calendarItemIdFromQuery) ?? null
      : null;
    const linkedProgram = programIdFromQuery
      ? programs.find((program) => program.id === programIdFromQuery) ?? null
      : null;
    const linkedSegment = programSegmentIdFromQuery
      ? programSegments.find((segment) => segment.id === programSegmentIdFromQuery) ?? null
      : null;

    const nextLearnerId =
      learnerIdFromQuery ||
      linkedCalendarItem?.learnerId ||
      linkedSegment?.learnerId ||
      linkedProgram?.learnerId ||
      workspace.profile.defaultLearnerId ||
      workspace.learners[0]?.id ||
      "";

    setEditingEntryId(null);
    setLearnerId(nextLearnerId);
    setObservedOn(observedOnFromQuery || linkedCalendarItem?.plannedDate || getTodayDate());
    setTitle(
      linkedCalendarItem?.title ||
        linkedSegment?.title ||
        linkedProgram?.title ||
        humanizeQuerySlug(curriculumElementFromQuery) ||
        "",
    );
    setWhatHappened("");
    setReflection("");
    setLearningArea(
      learningAreaFromQuery || linkedCalendarItem?.learningArea || linkedProgram?.learningArea || "",
    );
    setProgramId(programIdFromQuery || linkedCalendarItem?.programId || linkedProgram?.id || "");
    setCalendarItemId(calendarItemIdFromQuery || "");
    setMessage(null);
    setActionError(null);
    setLastAppliedContextKey(captureContextKey);
  }, [
    calendarItemIdFromQuery,
    calendarItems,
    captureContextKey,
    entries,
    entriesLoading,
    evidenceEntryIdFromQuery,
    curriculumElementFromQuery,
    lastAppliedContextKey,
    learningAreaFromQuery,
    learnerIdFromQuery,
    linkingLoading,
    observedOnFromQuery,
    pathname,
    programIdFromQuery,
    programSegmentIdFromQuery,
    programSegments,
    programs,
    workspace.learners,
    workspace.profile,
  ]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace.profile) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      const payload = {
        learnerId,
        observedOn,
        title: title || null,
        whatHappened,
        reflection: reflection || null,
        learningArea: learningArea || null,
        programId: programId || null,
        calendarItemId: calendarItemId || null,
      };

      if (editingEntryId) {
        await updateCleanEvidenceEntry(workspace.profile.id, editingEntryId, payload);
        setMessage("Capture note updated.");
      } else {
        await createCleanEvidenceEntry(workspace.profile.id, payload);
        setMessage("Capture note saved.");
      }

      const nextLearnerId = learnerId;
      resetForm(nextLearnerId);
      if (captureContextKey) {
        clearCaptureContext();
      }
      await reloadEntries();
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not save this capture note.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(entry: CleanEvidenceEntry) {
    if (!workspace.profile) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      await deleteCleanEvidenceEntry(workspace.profile.id, entry.id);
      if (editingEntryId === entry.id) {
        resetForm();
      }
      setMessage("Capture note deleted.");
      await reloadEntries();
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not delete this capture note.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(entry: CleanEvidenceEntry) {
    setEditingEntryId(entry.id);
    setLearnerId(entry.learnerId);
    setObservedOn(entry.observedOn);
    setTitle(entry.title || "");
    setWhatHappened(entry.whatHappened);
    setReflection(entry.reflection || "");
    setLearningArea(entry.learningArea || "");
    setProgramId(entry.programId || "");
    setCalendarItemId(entry.calendarItemId || "");
    setMessage(null);
    setActionError(null);
  }

  const readyForCapture =
    !workspace.loading && !workspace.schemaMissing && !workspace.requiresFamilyCreation;

  return (
    <div style={shellStyle}>
      <div style={wrapStyle}>
        <CleanWorkflowRibbon />

        <section style={cardStyle}>
          <div style={{ display: "grid", gap: 8 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.08em",
                color: "#64748b",
                textTransform: "uppercase",
              }}
            >
              Capture what happened
            </div>
            <h1 style={{ margin: 0, fontSize: 28, color: "#0f172a" }}>My Capture</h1>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              Save a simple learning record from today&apos;s blocks, then decide later what
              belongs in the portfolio.
            </p>
          </div>
        </section>

        {workspace.loading ? (
          <section style={cardStyle}>Loading your family workspace...</section>
        ) : null}

        {!workspace.loading && workspace.schemaMissing ? (
          <section style={cardStyle}>
            <strong style={{ display: "block", marginBottom: 8 }}>
              {CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE}
            </strong>
            <p style={{ margin: 0, color: "#475569" }}>
              My Capture will not fall back to older evidence systems.
            </p>
          </section>
        ) : null}

        {!workspace.loading && !workspace.schemaMissing && workspace.error ? (
          <section style={cardStyle}>
            <strong style={{ display: "block", marginBottom: 8 }}>Workspace error</strong>
            <p style={{ margin: 0, color: "#475569" }}>{workspace.error}</p>
          </section>
        ) : null}

        {!workspace.loading && !workspace.schemaMissing && workspace.requiresFamilyCreation ? (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, color: "#0f172a" }}>Create family profile first</h2>
            <p style={{ margin: 0, color: "#475569" }}>
              Capture notes are family-scoped in the clean rebuild. Create the family profile first on My Profile.
            </p>
          </section>
        ) : null}

        {readyForCapture && !workspace.learners.length ? (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, color: "#0f172a" }}>Add a learner first</h2>
            <p style={{ margin: 0, color: "#475569" }}>
              A learner is required before saving a clean capture note.
            </p>
          </section>
        ) : null}

        {readyForCapture && workspace.profile && workspace.learners.length ? (
          <>
            <section style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h2 style={{ margin: 0, color: "#0f172a" }}>Text capture</h2>
                  <p style={{ margin: "8px 0 0", color: "#475569" }}>
                    Save is always explicit. Write what happened, keep the useful links, and
                    decide later what belongs in the portfolio.
                  </p>
                </div>
                <button
                  type="button"
                  style={buttonStyle}
                  onClick={() => {
                    void reloadEntries();
                    void reloadLinkOptions();
                  }}
                  disabled={entriesLoading || linkingLoading || submitting}
                >
                  {entriesLoading || linkingLoading ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              {selectedCalendarItem || selectedProgram || selectedProgramSegment ? (
                <div
                  style={{
                    marginTop: 16,
                    border: "1px solid #bfdbfe",
                    borderRadius: 14,
                    padding: 14,
                    background: "#eff6ff",
                    display: "grid",
                    gap: 6,
                  }}
                >
                  <strong style={{ color: "#0f172a" }}>
                    {selectedCalendarItem
                      ? `Capturing from: ${selectedCalendarItem.title}`
                      : "Capture context ready"}
                  </strong>
                  <div style={{ color: "#475569", lineHeight: 1.6 }}>
                    {selectedCalendarItem
                      ? formatDateLabel(selectedCalendarItem.plannedDate)
                      : formatDateLabel(observedOn)}
                    {selectedProgram ? ` - Program: ${selectedProgram.title}` : ""}
                    {selectedProgramSegment
                      ? ` - Week / segment: ${selectedProgramSegment.title}`
                      : ""}
                  </div>
                </div>
              ) : null}

              <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
                <div
                  style={{
                    display: "grid",
                    gap: 12,
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  }}
                >
                  <select
                    value={learnerId}
                    onChange={(event) => setLearnerId(event.target.value)}
                    style={inputStyle}
                  >
                    <option value="">Select learner</option>
                    {learnerOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={observedOn}
                    onChange={(event) => setObservedOn(event.target.value)}
                    style={inputStyle}
                  />
                </div>

                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Title (optional)"
                  style={inputStyle}
                />

                <textarea
                  value={whatHappened}
                  onChange={(event) => setWhatHappened(event.target.value)}
                  placeholder="What happened"
                  style={textAreaStyle}
                />

                <textarea
                  value={reflection}
                  onChange={(event) => setReflection(event.target.value)}
                  placeholder="Reflection, next step, or what stood out (optional)"
                  style={textAreaStyle}
                />

                <input
                  value={learningArea}
                  onChange={(event) => setLearningArea(event.target.value)}
                  placeholder="Learning area (optional)"
                  style={inputStyle}
                />

                <div
                  style={{
                    display: "grid",
                    gap: 12,
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  }}
                >
                  <select
                    value={programId}
                    onChange={(event) => setProgramId(event.target.value)}
                    style={inputStyle}
                  >
                    <option value="">No program link</option>
                    {filteredPrograms.map((program) => {
                      const learnerLabel =
                        learnerOptions.find((option) => option.value === program.learnerId)?.label ||
                        "Family / all learners";

                      return (
                        <option key={program.id} value={program.id}>
                          {program.title} - {learnerLabel}
                        </option>
                      );
                    })}
                  </select>

                  <select
                    value={calendarItemId}
                    onChange={(event) => setCalendarItemId(event.target.value)}
                    style={inputStyle}
                  >
                    <option value="">No calendar link</option>
                    {filteredCalendarItems.map((item) => {
                      const learnerLabel =
                        learnerOptions.find((option) => option.value === item.learnerId)?.label ||
                        "Family / all learners";

                      return (
                        <option key={item.id} value={item.id}>
                          {buildCalendarOptionLabel(item, learnerLabel)}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button type="submit" style={buttonStyle} disabled={submitting}>
                    {submitting ? "Saving..." : "Save capture"}
                  </button>
                  {editingEntryId ? (
                    <button
                      type="button"
                      style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
                      onClick={() => {
                        resetForm();
                        if (captureContextKey) {
                          clearCaptureContext();
                        }
                      }}
                      disabled={submitting}
                    >
                      Cancel edit
                    </button>
                  ) : null}
                </div>

                {linkingError ? (
                  <p style={{ margin: 0, color: "#b91c1c" }}>{linkingError}</p>
                ) : null}
              </form>
            </section>

            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, color: "#0f172a" }}>Later additions</h2>
              <p style={{ marginTop: 0, color: "#475569" }}>
                This phase stays text-first. Media and file capture can come later.
              </p>
              <div
                style={{
                  display: "grid",
                  gap: 12,
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                }}
              >
                {["Photo upload", "File upload", "Audio note"].map((label) => (
                  <div
                    key={label}
                    style={{
                      border: "1px dashed #cbd5e1",
                      borderRadius: 14,
                      padding: 14,
                      display: "grid",
                      gap: 8,
                      background: "#f8fafc",
                    }}
                    >
                      <strong style={{ color: "#0f172a" }}>{label}</strong>
                    <button
                      type="button"
                      disabled
                      style={{
                        ...buttonStyle,
                        background: "#e2e8f0",
                        borderColor: "#cbd5e1",
                        color: "#475569",
                        cursor: "not-allowed",
                      }}
                    >
                      Coming later
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, color: "#0f172a" }}>Recent capture notes</h2>
              {entriesLoading ? (
                <p style={{ margin: 0, color: "#475569" }}>Loading capture notes...</p>
              ) : null}
              {entriesError ? <p style={{ margin: 0, color: "#b91c1c" }}>{entriesError}</p> : null}

              {!entriesLoading && !entriesError && !entries.length ? (
                <p style={{ margin: 0, color: "#475569" }}>
                  No capture notes yet.
                </p>
              ) : null}

              {!entriesLoading && !entriesError && entries.length ? (
                <div style={{ display: "grid", gap: 12 }}>
                  {entries.map((entry) => {
                    const learnerLabel =
                      learnerOptions.find((option) => option.value === entry.learnerId)?.label ||
                      "Unknown learner";
                    const linkedProgram =
                      programs.find((program) => program.id === entry.programId)?.title ||
                      null;
                    const linkedCalendarItem =
                      calendarItems.find((item) => item.id === entry.calendarItemId) ?? null;
                    const linkedSegment =
                      linkedCalendarItem?.programSegmentId
                        ? programSegments.find(
                            (segment) => segment.id === linkedCalendarItem.programSegmentId,
                          )?.title ?? null
                        : null;

                    return (
                      <div
                        key={entry.id}
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: 14,
                          padding: 14,
                          display: "grid",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                            flexWrap: "wrap",
                          }}
                        >
                          <div>
                            <strong>{entry.title || "Untitled note"}</strong>
                            <div style={{ color: "#64748b", marginTop: 4 }}>
                              {formatDateLabel(entry.observedOn)} - {learnerLabel}
                              {entry.learningArea ? ` - ${entry.learningArea}` : ""}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button
                              type="button"
                              style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
                              onClick={() => handleEdit(entry)}
                              disabled={submitting}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              style={{ ...buttonStyle, background: "#b91c1c", borderColor: "#b91c1c" }}
                              onClick={() => void handleDelete(entry)}
                              disabled={submitting}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <p style={{ margin: 0, color: "#334155", lineHeight: 1.6 }}>
                          {entry.whatHappened}
                        </p>
                        {entry.reflection ? (
                          <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                            {entry.reflection}
                          </p>
                        ) : null}
                        {linkedProgram || linkedCalendarItem ? (
                          <div style={{ color: "#64748b", fontSize: 13 }}>
                            {linkedProgram ? `Program: ${linkedProgram}` : ""}
                            {linkedProgram && linkedSegment ? " | " : ""}
                            {linkedSegment ? `Week / segment: ${linkedSegment}` : ""}
                            {(linkedProgram || linkedSegment) && linkedCalendarItem ? " | " : ""}
                            {linkedCalendarItem ? `Block: ${linkedCalendarItem.title}` : ""}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </section>
          </>
        ) : null}

        {message ? (
          <section style={cardStyle}>
            <p style={{ margin: 0, color: "#0f766e" }}>{message}</p>
          </section>
        ) : null}

        {actionError ? (
          <section style={cardStyle}>
            <p style={{ margin: 0, color: "#b91c1c" }}>{actionError}</p>
          </section>
        ) : null}
      </div>
    </div>
  );
}

export default function CleanCaptureWorkspace() {
  return (
    <CleanFamilyWorkspaceProvider>
      <CleanCaptureWorkspaceBody />
    </CleanFamilyWorkspaceProvider>
  );
}
