"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useCleanFamilyWorkspace } from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import V2LoadingState from "@/app/components/clean/design-v2/V2LoadingState";
import {
  addCleanProgramLessons,
  listCleanProgramLessonCounts,
  listCleanProgramLessons,
  listCleanPrograms,
  normalizeBulkProgramLessonTitles,
  removeCleanProgramLesson,
  reorderCleanProgramLessons,
  updateCleanProgram,
  updateCleanProgramLesson,
  createCleanProgram,
} from "@/lib/clean/programs/client";
import { moveProgramLesson } from "@/lib/clean/programs/programLessons";
import type { CleanProgram, CleanProgramLesson } from "@/lib/clean/programs/types";
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
  maxWidth: 960,
  margin: "0 auto",
  display: "grid",
  gap: 20,
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  background: "#ffffff",
  padding: "clamp(16px, 3vw, 22px)",
  boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 16,
};

const textAreaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 92,
  resize: "vertical",
};

const buttonStyle: React.CSSProperties = {
  minHeight: 44,
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

type ProgramView = "list" | "create" | "edit";

export default function CleanProgramsWorkspace() {
  const workspace = useCleanFamilyWorkspace();
  const [programs, setPrograms] = useState<CleanProgram[]>([]);
  const [lessonCounts, setLessonCounts] = useState<Record<string, number>>({});
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [view, setView] = useState<ProgramView>("list");
  const [lessons, setLessons] = useState<CleanProgramLesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [programTitle, setProgramTitle] = useState("");
  const [programLearningArea, setProgramLearningArea] = useState("");
  const [programDescription, setProgramDescription] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonInstructions, setLessonInstructions] = useState("");
  const [lessonDuration, setLessonDuration] = useState("");
  const [bulkLessonTitles, setBulkLessonTitles] = useState("");
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  const selectedProgram = useMemo(
    () => programs.find((program) => program.id === selectedProgramId) ?? null,
    [programs, selectedProgramId],
  );

  const ready = !workspace.loading && !workspace.schemaMissing && !workspace.requiresFamilyCreation;

  const reloadPrograms = useCallback(async () => {
    if (!workspace.profile) return;
    setLoading(true);
    setError(null);
    try {
      const [nextPrograms, nextCounts] = await Promise.all([
        listCleanPrograms(workspace.profile.id, { limit: 100 }),
        listCleanProgramLessonCounts(workspace.profile.id),
      ]);
      setPrograms(nextPrograms);
      setLessonCounts(nextCounts);
    } catch (reason) {
      setError(normalizeCleanErrorMessage(reason, "We could not load your programs just now."));
    } finally {
      setLoading(false);
    }
  }, [workspace.profile]);

  const reloadLessons = useCallback(async (programId: string) => {
    if (!workspace.profile) return;
    setLessonsLoading(true);
    setError(null);
    try {
      setLessons(await listCleanProgramLessons(workspace.profile.id, programId));
    } catch (reason) {
      setError(normalizeCleanErrorMessage(reason, "We could not load these lessons just now."));
    } finally {
      setLessonsLoading(false);
    }
  }, [workspace.profile]);

  useEffect(() => {
    if (!ready) {
      setPrograms([]);
      setLessonCounts({});
      setLessons([]);
      return;
    }
    void reloadPrograms();
  }, [ready, reloadPrograms]);

  useEffect(() => {
    if (view === "edit" && selectedProgramId) void reloadLessons(selectedProgramId);
  }, [reloadLessons, selectedProgramId, view]);

  function resetProgramForm() {
    setProgramTitle("");
    setProgramLearningArea("");
    setProgramDescription("");
  }

  function resetLessonForm() {
    setEditingLessonId(null);
    setLessonTitle("");
    setLessonInstructions("");
    setLessonDuration("");
  }

  function openCreate() {
    resetProgramForm();
    setSelectedProgramId(null);
    setLessons([]);
    setView("create");
    setMessage(null);
    setError(null);
  }

  function openProgram(program: CleanProgram) {
    setSelectedProgramId(program.id);
    setProgramTitle(program.title);
    setProgramLearningArea(program.learningArea || "");
    setProgramDescription(program.description || "");
    resetLessonForm();
    setView("edit");
    setMessage(null);
    setError(null);
  }

  function returnToPrograms() {
    setView("list");
    setSelectedProgramId(null);
    setLessons([]);
    resetProgramForm();
    resetLessonForm();
    setError(null);
  }

  async function handleProgramSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace.profile) return;
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      const input = {
        title: programTitle,
        learningArea: programLearningArea || null,
        description: programDescription || null,
      };
      if (view === "create") {
        const created = await createCleanProgram(workspace.profile.id, input);
        await reloadPrograms();
        setSelectedProgramId(created.id);
        setProgramTitle(created.title);
        setProgramLearningArea(created.learningArea || "");
        setProgramDescription(created.description || "");
        setLessons([]);
        setView("edit");
        setMessage("Program created. Add its lessons when you are ready.");
      } else if (selectedProgram) {
        const updated = await updateCleanProgram(workspace.profile.id, selectedProgram.id, input);
        await reloadPrograms();
        setProgramTitle(updated.title);
        setProgramLearningArea(updated.learningArea || "");
        setProgramDescription(updated.description || "");
        setMessage("Program details updated.");
      }
    } catch (reason) {
      setError(normalizeCleanErrorMessage(reason, "We could not save this program."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleArchive() {
    if (!workspace.profile || !selectedProgram) return;
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      await updateCleanProgram(workspace.profile.id, selectedProgram.id, { status: "archived" });
      await reloadPrograms();
      setMessage("Program archived. Existing learning links stay intact.");
    } catch (reason) {
      setError(normalizeCleanErrorMessage(reason, "We could not archive this program."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLessonSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace.profile || !selectedProgram) return;
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      const input = {
        title: lessonTitle,
        instructions: lessonInstructions || null,
        estimatedDurationMinutes: lessonDuration ? Number.parseInt(lessonDuration, 10) : null,
      };
      if (editingLessonId) {
        await updateCleanProgramLesson(workspace.profile.id, editingLessonId, input);
        setMessage("Lesson updated.");
      } else {
        await addCleanProgramLessons(workspace.profile.id, selectedProgram.id, [input]);
        setMessage("Lesson added.");
      }
      resetLessonForm();
      await Promise.all([reloadLessons(selectedProgram.id), reloadPrograms()]);
    } catch (reason) {
      setError(normalizeCleanErrorMessage(reason, "We could not save this lesson."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBulkLessonsSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace.profile || !selectedProgram) return;
    const titles = normalizeBulkProgramLessonTitles(bulkLessonTitles);
    if (!titles.length) {
      setError("Paste at least one lesson title.");
      return;
    }
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      await addCleanProgramLessons(workspace.profile.id, selectedProgram.id, titles.map((title) => ({ title })));
      setBulkLessonTitles("");
      setMessage(`${titles.length} lessons added.`);
      await Promise.all([reloadLessons(selectedProgram.id), reloadPrograms()]);
    } catch (reason) {
      setError(normalizeCleanErrorMessage(reason, "We could not add these lessons."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMoveLesson(lessonId: string, direction: -1 | 1) {
    if (!workspace.profile || !selectedProgram) return;
    const reordered = moveProgramLesson(lessons, lessonId, direction);
    if (reordered === lessons) return;
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      await reorderCleanProgramLessons(workspace.profile.id, selectedProgram.id, reordered.map((lesson) => lesson.id));
      setMessage("Lesson order updated.");
      await reloadLessons(selectedProgram.id);
    } catch (reason) {
      setError(normalizeCleanErrorMessage(reason, "We could not reorder these lessons."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemoveLesson(lesson: CleanProgramLesson) {
    if (!workspace.profile || !selectedProgram) return;
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      await removeCleanProgramLesson(workspace.profile.id, selectedProgram.id, lesson.id);
      if (editingLessonId === lesson.id) resetLessonForm();
      setMessage("Lesson removed.");
      await Promise.all([reloadLessons(selectedProgram.id), reloadPrograms()]);
    } catch (reason) {
      setError(normalizeCleanErrorMessage(reason, "We could not remove this lesson."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={shellStyle}>
      <div style={wrapStyle}>
        <section style={cardStyle}>
          <p style={{ margin: 0, color: "#64748b", fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>My Plan</p>
          <h1 style={{ margin: "6px 0 0", fontSize: 28, color: "#0f172a" }}>My Programs</h1>
          <p style={{ margin: "8px 0 0", color: "#475569", lineHeight: 1.6 }}>
            Create reusable learning programs and organise their lessons. Scheduling comes after you assign a program to a learner.
          </p>
        </section>

        {workspace.loading ? <V2LoadingState title="Preparing programs" body="We are loading your program definitions." /> : null}
        {!workspace.loading && workspace.schemaMissing ? <section style={cardStyle}><strong>{CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE}</strong></section> : null}
        {!workspace.loading && !workspace.schemaMissing && workspace.error ? <section style={cardStyle}><strong>Workspace error</strong><p style={{ color: "#475569" }}>{workspace.error}</p></section> : null}
        {!workspace.loading && !workspace.schemaMissing && workspace.requiresFamilyCreation ? <section style={cardStyle}><h2 style={{ marginTop: 0 }}>Create family profile first</h2><p style={{ marginBottom: 0, color: "#475569" }}>Programs are private to your family. Create the family profile first on My Profile.</p></section> : null}

        {ready && workspace.profile ? (
          <>
            {view === "list" ? (
              <section style={cardStyle} aria-labelledby="existing-programs-heading">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div><h2 id="existing-programs-heading" style={{ margin: 0, color: "#0f172a" }}>Existing Programs</h2><p style={{ margin: "6px 0 0", color: "#475569" }}>Programs are reusable definitions. They are not assigned or scheduled yet.</p></div>
                  <button type="button" style={buttonStyle} onClick={openCreate} disabled={submitting}>Create Program</button>
                </div>
                {loading ? <p style={{ color: "#475569" }}>Loading programs...</p> : null}
                {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
                {!loading && !error && !programs.length ? <p style={{ color: "#475569", margin: "20px 0 0" }}>No programs yet. Create a program to organise its lessons.</p> : null}
                {!loading && !error && programs.length ? <div style={{ display: "grid", gap: 12, marginTop: 20 }}>{programs.map((program) => {
                  const count = lessonCounts[program.id] ?? 0;
                  return <article key={program.id} style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 16, display: "grid", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><div><strong style={{ color: "#0f172a" }}>{program.title}</strong><div style={{ color: "#64748b", marginTop: 4 }}>{program.learningArea || "Learning area not set"} · {count} {count === 1 ? "lesson" : "lessons"}{program.status === "archived" ? " · Archived" : ""}</div></div><button type="button" style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }} onClick={() => openProgram(program)} disabled={submitting}>Open / Edit</button></div>
                    {program.description ? <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>{program.description}</p> : null}
                  </article>;
                })}</div> : null}
              </section>
            ) : null}

            {view === "create" || (view === "edit" && selectedProgram) ? (
              <>
                <section style={cardStyle} aria-labelledby="program-editor-heading">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start", flexWrap: "wrap" }}><div><h2 id="program-editor-heading" style={{ margin: 0, color: "#0f172a" }}>{view === "create" ? "Create Program" : "Program details"}</h2><p style={{ margin: "6px 0 0", color: "#475569" }}>A program is a reusable lesson definition, ready for learner assignment and scheduling later.</p></div><button type="button" style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }} onClick={returnToPrograms} disabled={submitting}>Back to Programs</button></div>
                  <form onSubmit={handleProgramSubmit} style={{ display: "grid", gap: 12, marginTop: 20 }}>
                    <label style={{ display: "grid", gap: 6, color: "#334155", fontWeight: 700 }}>Program name<input value={programTitle} onChange={(event) => setProgramTitle(event.target.value)} placeholder="For example, Maths Level 3" style={inputStyle} required /></label>
                    <label style={{ display: "grid", gap: 6, color: "#334155", fontWeight: 700 }}>Learning area<input value={programLearningArea} onChange={(event) => setProgramLearningArea(event.target.value)} placeholder="For example, Mathematics" style={inputStyle} /></label>
                    <label style={{ display: "grid", gap: 6, color: "#334155", fontWeight: 700 }}>Description <span style={{ fontWeight: 400 }}>(optional)</span><textarea value={programDescription} onChange={(event) => setProgramDescription(event.target.value)} placeholder="A short note about this program" style={textAreaStyle} /></label>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><button type="submit" style={buttonStyle} disabled={submitting}>{submitting ? "Saving..." : view === "create" ? "Create Program" : "Save details"}</button>{view === "edit" ? <button type="button" style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }} onClick={() => void handleArchive()} disabled={submitting}>Archive Program</button> : null}</div>
                  </form>
                </section>

                {view === "edit" && selectedProgram ? <section style={cardStyle} aria-labelledby="program-lessons-heading">
                  <h2 id="program-lessons-heading" style={{ marginTop: 0, color: "#0f172a" }}>Lessons</h2>
                  <p style={{ margin: "0 0 18px", color: "#475569" }}>{lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}{lessons[0] ? ` · Program starts with: ${lessons[0].title}` : ""}</p>
                  <form onSubmit={handleLessonSubmit} style={{ display: "grid", gap: 12 }}>
                    <h3 style={{ margin: 0, fontSize: 17 }}>{editingLessonId ? "Edit lesson" : "Add lesson"}</h3>
                    <label style={{ display: "grid", gap: 6, color: "#334155", fontWeight: 700 }}>Lesson title<input value={lessonTitle} onChange={(event) => setLessonTitle(event.target.value)} placeholder="For example, Comparing simple fractions" style={inputStyle} required /></label>
                    <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}><label style={{ display: "grid", gap: 6, color: "#334155", fontWeight: 700 }}>Instructions <span style={{ fontWeight: 400 }}>(optional)</span><textarea value={lessonInstructions} onChange={(event) => setLessonInstructions(event.target.value)} placeholder="A short parent note" style={{ ...textAreaStyle, minHeight: 72 }} /></label><label style={{ display: "grid", gap: 6, color: "#334155", fontWeight: 700 }}>Estimated minutes <span style={{ fontWeight: 400 }}>(optional)</span><input type="number" min="1" value={lessonDuration} onChange={(event) => setLessonDuration(event.target.value)} placeholder="30" style={inputStyle} /></label></div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><button type="submit" style={buttonStyle} disabled={submitting}>{submitting ? "Saving..." : editingLessonId ? "Save lesson" : "Add lesson"}</button>{editingLessonId ? <button type="button" style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }} onClick={resetLessonForm} disabled={submitting}>Cancel edit</button> : null}</div>
                  </form>
                  <form onSubmit={handleBulkLessonsSubmit} style={{ display: "grid", gap: 10, marginTop: 28, paddingTop: 22, borderTop: "1px solid #e2e8f0" }}><h3 style={{ margin: 0, fontSize: 17 }}>Paste lesson list</h3><p style={{ margin: 0, color: "#475569" }}>Paste one lesson title per line. Blank lines are ignored.</p><label style={{ display: "grid", gap: 6, color: "#334155", fontWeight: 700 }}>Lesson titles<textarea value={bulkLessonTitles} onChange={(event) => setBulkLessonTitles(event.target.value)} placeholder={"Introduction\nCounting to 10\nComparing numbers"} style={textAreaStyle} /></label><div><button type="submit" style={buttonStyle} disabled={submitting}>{submitting ? "Adding..." : "Add pasted lessons"}</button></div></form>
                  {lessonsLoading ? <p style={{ color: "#475569" }}>Loading lessons...</p> : null}
                  {!lessonsLoading && !lessons.length ? <p style={{ color: "#475569", margin: "24px 0 0" }}>No lessons yet. Add lesson or Paste lesson list to start this program.</p> : null}
                  {lessons.length ? <ol style={{ display: "grid", gap: 10, margin: "24px 0 0", paddingLeft: 24 }}>{lessons.map((lesson, index) => <li key={lesson.id} style={{ paddingLeft: 4 }}><article style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 14, display: "grid", gap: 8 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><div><strong>{lesson.title}</strong>{lesson.estimatedDurationMinutes ? <div style={{ color: "#64748b", marginTop: 4 }}>About {lesson.estimatedDurationMinutes} minutes</div> : null}</div><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button type="button" style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }} onClick={() => void handleMoveLesson(lesson.id, -1)} disabled={submitting || index === 0} aria-label={`Move ${lesson.title} up`}>Move up</button><button type="button" style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }} onClick={() => void handleMoveLesson(lesson.id, 1)} disabled={submitting || index === lessons.length - 1} aria-label={`Move ${lesson.title} down`}>Move down</button><button type="button" style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }} onClick={() => { setEditingLessonId(lesson.id); setLessonTitle(lesson.title); setLessonInstructions(lesson.instructions || ""); setLessonDuration(lesson.estimatedDurationMinutes ? String(lesson.estimatedDurationMinutes) : ""); }} disabled={submitting}>Edit</button><button type="button" style={{ ...buttonStyle, background: "#b91c1c", borderColor: "#b91c1c" }} onClick={() => void handleRemoveLesson(lesson)} disabled={submitting}>Remove</button></div></div>{lesson.instructions ? <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>{lesson.instructions}</p> : null}</article></li>)}</ol> : null}
                </section> : null}
              </>
            ) : null}
            {message ? <section style={cardStyle}><p style={{ margin: 0, color: "#0f766e" }}>{message}</p></section> : null}
            {error && view !== "list" ? <section style={cardStyle}><p style={{ margin: 0, color: "#b91c1c" }}>{error}</p></section> : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
