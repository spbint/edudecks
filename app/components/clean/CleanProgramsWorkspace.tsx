"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import CleanFamilyWorkspaceProvider, {
  useCleanFamilyWorkspace,
} from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import CleanWorkflowRibbon from "@/app/components/clean/CleanWorkflowRibbon";
import {
  createCleanProgram,
  createCleanProgramSegment,
  deleteCleanProgram,
  deleteCleanProgramSegment,
  listCleanProgramSegments,
  listCleanPrograms,
  updateCleanProgram,
  updateCleanProgramSegment,
} from "@/lib/clean/programs/client";
import type {
  CleanProgram,
  CleanProgramSegment,
} from "@/lib/clean/programs/types";
import {
  CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE,
  normalizeCleanErrorMessage,
} from "@/lib/clean/family/client";

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "32px 20px 48px",
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 1100,
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
  minHeight: 100,
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

function getLearnerLabel(firstName: string, preferredName: string | null) {
  return preferredName || firstName;
}

function CleanProgramsWorkspaceBody() {
  const workspace = useCleanFamilyWorkspace();
  const [programs, setPrograms] = useState<CleanProgram[]>([]);
  const [programsLoading, setProgramsLoading] = useState(false);
  const [programsError, setProgramsError] = useState<string | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [segments, setSegments] = useState<CleanProgramSegment[]>([]);
  const [segmentsLoading, setSegmentsLoading] = useState(false);
  const [segmentsError, setSegmentsError] = useState<string | null>(null);

  const [programTitle, setProgramTitle] = useState("");
  const [programLearnerId, setProgramLearnerId] = useState("");
  const [programLearningArea, setProgramLearningArea] = useState("");
  const [programDescription, setProgramDescription] = useState("");
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);

  const [segmentTitle, setSegmentTitle] = useState("");
  const [segmentLearnerId, setSegmentLearnerId] = useState("");
  const [segmentOrder, setSegmentOrder] = useState("0");
  const [segmentNotes, setSegmentNotes] = useState("");
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);

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

  const selectedProgram =
    programs.find((program) => program.id === selectedProgramId) ?? null;

  const reloadPrograms = useCallback(
    async (nextSelectedProgramId?: string | null) => {
      if (!workspace.profile) return;

      setProgramsLoading(true);
      setProgramsError(null);
      try {
        const nextPrograms = await listCleanPrograms(workspace.profile.id, {
          limit: 50,
        });
        setPrograms(nextPrograms);

        const selectedId = nextSelectedProgramId ?? selectedProgramId;
        const hasSelected = selectedId
          ? nextPrograms.some((program) => program.id === selectedId)
          : false;

        if (hasSelected) {
          setSelectedProgramId(selectedId);
        } else {
          setSelectedProgramId(nextPrograms[0]?.id ?? null);
        }
      } catch (error) {
        setProgramsError(
          normalizeCleanErrorMessage(
            error,
            "We could not load clean programs just now.",
          ),
        );
      } finally {
        setProgramsLoading(false);
      }
    },
    [selectedProgramId, workspace.profile],
  );

  const reloadSegments = useCallback(
    async (programId: string | null) => {
      if (!workspace.profile || !programId) {
        setSegments([]);
        return;
      }

      setSegmentsLoading(true);
      setSegmentsError(null);
      try {
        const nextSegments = await listCleanProgramSegments(
          workspace.profile.id,
          programId,
        );
        setSegments(nextSegments);
      } catch (error) {
        setSegmentsError(
          normalizeCleanErrorMessage(
            error,
            "We could not load clean program segments just now.",
          ),
        );
      } finally {
        setSegmentsLoading(false);
      }
    },
    [workspace.profile],
  );

  useEffect(() => {
    if (!workspace.profile || workspace.schemaMissing || workspace.requiresFamilyCreation) {
      setPrograms([]);
      setSegments([]);
      setSelectedProgramId(null);
      return;
    }

    void reloadPrograms();
  }, [reloadPrograms, workspace.profile, workspace.requiresFamilyCreation, workspace.schemaMissing]);

  useEffect(() => {
    void reloadSegments(selectedProgramId);
  }, [reloadSegments, selectedProgramId]);

  function resetProgramForm() {
    setEditingProgramId(null);
    setProgramTitle("");
    setProgramLearnerId("");
    setProgramLearningArea("");
    setProgramDescription("");
  }

  function resetSegmentForm() {
    setEditingSegmentId(null);
    setSegmentTitle("");
    setSegmentLearnerId("");
    setSegmentOrder("0");
    setSegmentNotes("");
  }

  async function handleProgramSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace.profile) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      const payload = {
        title: programTitle,
        learnerId: programLearnerId || null,
        learningArea: programLearningArea || null,
        description: programDescription || null,
      };

      let savedProgramId: string | null = null;

      if (editingProgramId) {
        const updated = await updateCleanProgram(
          workspace.profile.id,
          editingProgramId,
          payload,
        );
        savedProgramId = updated.id;
        setMessage("Clean program updated.");
      } else {
        const created = await createCleanProgram(workspace.profile.id, payload);
        savedProgramId = created.id;
        setMessage("Clean program created.");
      }

      resetProgramForm();
      await reloadPrograms(savedProgramId);
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not save the clean program.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteProgram(program: CleanProgram) {
    if (!workspace.profile) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      await deleteCleanProgram(workspace.profile.id, program.id);
      if (editingProgramId === program.id) {
        resetProgramForm();
      }
      if (selectedProgramId === program.id) {
        resetSegmentForm();
      }
      setMessage("Clean program deleted.");
      await reloadPrograms(null);
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not delete the clean program.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleEditProgram(program: CleanProgram) {
    setEditingProgramId(program.id);
    setProgramTitle(program.title);
    setProgramLearnerId(program.learnerId || "");
    setProgramLearningArea(program.learningArea || "");
    setProgramDescription(program.description || "");
    setSelectedProgramId(program.id);
    setMessage(null);
    setActionError(null);
  }

  async function handleSegmentSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace.profile || !selectedProgram) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      const payload = {
        title: segmentTitle,
        learnerId: segmentLearnerId || null,
        segmentOrder: Number.parseInt(segmentOrder || "0", 10) || 0,
        notes: segmentNotes || null,
      };

      if (editingSegmentId) {
        await updateCleanProgramSegment(
          workspace.profile.id,
          editingSegmentId,
          payload,
        );
        setMessage("Program segment updated.");
      } else {
        await createCleanProgramSegment(
          workspace.profile.id,
          selectedProgram.id,
          payload,
        );
        setMessage("Program segment created.");
      }

      resetSegmentForm();
      await reloadSegments(selectedProgram.id);
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not save the program segment.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteSegment(segment: CleanProgramSegment) {
    if (!workspace.profile || !selectedProgram) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      await deleteCleanProgramSegment(workspace.profile.id, segment.id);
      if (editingSegmentId === segment.id) {
        resetSegmentForm();
      }
      setMessage("Program segment deleted.");
      await reloadSegments(selectedProgram.id);
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not delete the program segment.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleEditSegment(segment: CleanProgramSegment) {
    setEditingSegmentId(segment.id);
    setSegmentTitle(segment.title);
    setSegmentLearnerId(segment.learnerId || "");
    setSegmentOrder(String(segment.segmentOrder));
    setSegmentNotes(segment.notes || "");
    setMessage(null);
    setActionError(null);
  }

  const readyForPrograms =
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
              Clean rebuild scaffold
            </div>
            <h1 style={{ margin: 0, fontSize: 28, color: "#0f172a" }}>My Programs</h1>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              This preview route uses only the clean programs and program_segments tables.
            </p>
          </div>
        </section>

        {workspace.loading ? <section style={cardStyle}>Loading clean family workspace...</section> : null}

        {!workspace.loading && workspace.schemaMissing ? (
          <section style={cardStyle}>
            <strong style={{ display: "block", marginBottom: 8 }}>
              {CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE}
            </strong>
            <p style={{ margin: 0, color: "#475569" }}>
              The clean programs scaffold will not fall back to legacy program or planning tables.
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
              Programs are family-scoped in the clean rebuild. Create the family profile first on My Profile.
            </p>
          </section>
        ) : null}

        {readyForPrograms && !workspace.learners.length ? (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, color: "#0f172a" }}>Add a learner first</h2>
            <p style={{ margin: 0, color: "#475569" }}>
              This scaffold supports family-wide programs, but it still expects at least one clean learner before planning begins.
            </p>
          </section>
        ) : null}

        {readyForPrograms && workspace.profile && workspace.learners.length ? (
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
                  <h2 style={{ margin: 0, color: "#0f172a" }}>Program details</h2>
                  <p style={{ margin: "8px 0 0", color: "#475569" }}>
                    Calendar handoff is deferred to Phase 4B. This layer focuses only on programs and segments.
                  </p>
                </div>
                <button
                  type="button"
                  style={buttonStyle}
                  onClick={() => void reloadPrograms()}
                  disabled={programsLoading || submitting}
                >
                  {programsLoading ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              <form onSubmit={handleProgramSubmit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
                <input
                  value={programTitle}
                  onChange={(event) => setProgramTitle(event.target.value)}
                  placeholder="Program title"
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
                    value={programLearnerId}
                    onChange={(event) => setProgramLearnerId(event.target.value)}
                    style={inputStyle}
                  >
                    <option value="">Family / all learners</option>
                    {learnerOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <input
                    value={programLearningArea}
                    onChange={(event) => setProgramLearningArea(event.target.value)}
                    placeholder="Learning area"
                    style={inputStyle}
                  />
                </div>
                <textarea
                  value={programDescription}
                  onChange={(event) => setProgramDescription(event.target.value)}
                  placeholder="Program description"
                  style={textAreaStyle}
                />
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button type="submit" style={buttonStyle} disabled={submitting}>
                    {submitting ? "Saving..." : editingProgramId ? "Save program" : "Add program"}
                  </button>
                  {editingProgramId ? (
                    <button
                      type="button"
                      style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
                      onClick={resetProgramForm}
                      disabled={submitting}
                    >
                      Cancel edit
                    </button>
                  ) : null}
                </div>
              </form>
            </section>

            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, color: "#0f172a" }}>Programs</h2>
              <p style={{ marginTop: 0, color: "#475569" }}>
                A simple list and detail view for the clean rebuild foundation.
              </p>

              {programsLoading ? <p style={{ margin: 0, color: "#475569" }}>Loading programs...</p> : null}
              {programsError ? <p style={{ margin: 0, color: "#b91c1c" }}>{programsError}</p> : null}

              {!programsLoading && !programsError && !programs.length ? (
                <p style={{ margin: 0, color: "#475569" }}>
                  No clean programs exist yet. Add one above to start the clean planning layer.
                </p>
              ) : null}

              {!programsLoading && !programsError && programs.length ? (
                <div style={{ display: "grid", gap: 12 }}>
                  {programs.map((program) => {
                    const learnerLabel =
                      learnerOptions.find((option) => option.value === program.learnerId)?.label ||
                      "Family / all learners";
                    const isSelected = selectedProgramId === program.id;

                    return (
                      <div
                        key={program.id}
                        style={{
                          border: isSelected ? "2px solid #1d4ed8" : "1px solid #e2e8f0",
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
                            <strong>{program.title}</strong>
                            <div style={{ color: "#64748b", marginTop: 4 }}>
                              {learnerLabel}
                              {program.learningArea ? ` - ${program.learningArea}` : ""}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button
                              type="button"
                              style={{
                                ...buttonStyle,
                                background: isSelected ? "#1d4ed8" : "#ffffff",
                                borderColor: isSelected ? "#1d4ed8" : "#0f172a",
                                color: isSelected ? "#ffffff" : "#0f172a",
                              }}
                              onClick={() => setSelectedProgramId(program.id)}
                              disabled={submitting}
                            >
                              {isSelected ? "Selected" : "Select"}
                            </button>
                            <button
                              type="button"
                              style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
                              onClick={() => handleEditProgram(program)}
                              disabled={submitting}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              style={{ ...buttonStyle, background: "#b91c1c", borderColor: "#b91c1c" }}
                              onClick={() => void handleDeleteProgram(program)}
                              disabled={submitting}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        {program.description ? (
                          <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                            {program.description}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </section>

            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, color: "#0f172a" }}>Program segments</h2>
              {!selectedProgram ? (
                <p style={{ margin: 0, color: "#475569" }}>
                  Select a program to manage its segments.
                </p>
              ) : (
                <>
                  <p style={{ marginTop: 0, color: "#475569" }}>
                    Working in: <strong>{selectedProgram.title}</strong>
                  </p>
                  <form onSubmit={handleSegmentSubmit} style={{ display: "grid", gap: 12 }}>
                    <input
                      value={segmentTitle}
                      onChange={(event) => setSegmentTitle(event.target.value)}
                      placeholder="Segment title"
                      style={inputStyle}
                    />
                    <div
                      style={{
                        display: "grid",
                        gap: 12,
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                      }}
                    >
                      <select
                        value={segmentLearnerId}
                        onChange={(event) => setSegmentLearnerId(event.target.value)}
                        style={inputStyle}
                      >
                        <option value="">Family / all learners</option>
                        {learnerOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={segmentOrder}
                        onChange={(event) => setSegmentOrder(event.target.value)}
                        placeholder="Order"
                        style={inputStyle}
                      />
                    </div>
                    <textarea
                      value={segmentNotes}
                      onChange={(event) => setSegmentNotes(event.target.value)}
                      placeholder="Segment notes"
                      style={textAreaStyle}
                    />
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button type="submit" style={buttonStyle} disabled={submitting}>
                        {submitting ? "Saving..." : editingSegmentId ? "Save segment" : "Add segment"}
                      </button>
                      {editingSegmentId ? (
                        <button
                          type="button"
                          style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
                          onClick={resetSegmentForm}
                          disabled={submitting}
                        >
                          Cancel edit
                        </button>
                      ) : null}
                    </div>
                  </form>

                  {segmentsLoading ? (
                    <p style={{ marginTop: 16, marginBottom: 0, color: "#475569" }}>
                      Loading program segments...
                    </p>
                  ) : null}
                  {segmentsError ? (
                    <p style={{ marginTop: 16, marginBottom: 0, color: "#b91c1c" }}>
                      {segmentsError}
                    </p>
                  ) : null}
                  {!segmentsLoading && !segmentsError && !segments.length ? (
                    <p style={{ marginTop: 16, marginBottom: 0, color: "#475569" }}>
                      No segments exist for this clean program yet.
                    </p>
                  ) : null}
                  {!segmentsLoading && !segmentsError && segments.length ? (
                    <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                      {segments.map((segment) => {
                        const learnerLabel =
                          learnerOptions.find((option) => option.value === segment.learnerId)?.label ||
                          "Family / all learners";

                        return (
                          <div
                            key={segment.id}
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
                                <strong>
                                  {segment.segmentOrder}. {segment.title}
                                </strong>
                                <div style={{ color: "#64748b", marginTop: 4 }}>
                                  {learnerLabel}
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                <button
                                  type="button"
                                  style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
                                  onClick={() => handleEditSegment(segment)}
                                  disabled={submitting}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  style={{ ...buttonStyle, background: "#b91c1c", borderColor: "#b91c1c" }}
                                  onClick={() => void handleDeleteSegment(segment)}
                                  disabled={submitting}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                            {segment.notes ? (
                              <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                                {segment.notes}
                              </p>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </>
              )}
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

export default function CleanProgramsWorkspace() {
  return (
    <CleanFamilyWorkspaceProvider>
      <CleanProgramsWorkspaceBody />
    </CleanFamilyWorkspaceProvider>
  );
}
