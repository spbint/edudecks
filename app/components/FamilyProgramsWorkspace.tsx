"use client";

import React, { useEffect, useMemo, useState } from "react";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";
import {
  type LearnerOption,
  LearnerSelector,
} from "@/app/components/home/HomeOverviewComponents";
import {
  CurriculumAttachPanel,
  CurriculumTagPills,
} from "@/app/components/curriculum/CurriculumTaggingComponents";
import {
  ProgramCalendarAssignmentPanel,
  ProgramEditor,
  ProgramList,
  ProgramSegmentCard,
  BODY,
  H2,
  LABEL,
  META,
} from "@/app/components/programs/ProgramOverviewComponents";
import { resolveEffectiveLearnerLearningConfig } from "@/lib/familyLearningConfig";
import {
  defaultProgram,
  generateProgramIntoCalendar,
  loadFamilyCalendarTemplates,
  loadFamilyPrograms,
  saveFamilyProgram,
  type CalendarTemplate,
  type Program,
  type ProgramSegment,
} from "@/lib/familyPlanningTemplates";
import { frameworkPreset } from "@/lib/curriculumFrameworks";

function ymd(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function FamilyProgramsWorkspace() {
  const { workspace, activeLearner, loading: workspaceLoading, setActiveLearner } = useFamilyWorkspace();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [templates, setTemplates] = useState<CalendarTemplate[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [editingCurriculumSegmentId, setEditingCurriculumSegmentId] = useState<string | null>(null);
  const [assignmentTemplateId, setAssignmentTemplateId] = useState("");
  const [assignmentSlotId, setAssignmentSlotId] = useState("");
  const [assignmentStartDate, setAssignmentStartDate] = useState(ymd(new Date()));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const learnerOptions: LearnerOption[] = workspace.learners.map((learner) => ({
    id: learner.id,
    label: learner.label,
    note: learner.yearLabel || "Learner",
  }));

  const learningConfig = resolveEffectiveLearnerLearningConfig(workspace.profile, activeLearner);
  const preset = frameworkPreset(
    learningConfig.country === "us" || learningConfig.country === "uk"
      ? learningConfig.country
      : "au",
  );

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      if (!workspace.profile.id) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [nextPrograms, nextTemplates] = await Promise.all([
          loadFamilyPrograms({ familyId: workspace.profile.id }),
          loadFamilyCalendarTemplates({ familyId: workspace.profile.id }),
        ]);
        if (!mounted) return;
        const filteredPrograms = nextPrograms.filter(
          (program) => !program.learnerId || program.learnerId === activeLearner?.id,
        );
        setPrograms(filteredPrograms);
        setTemplates(nextTemplates);
        const firstProgram = filteredPrograms[0] ?? null;
        setSelectedProgramId(firstProgram?.id || "");
        setAssignmentTemplateId(nextTemplates[0]?.id || "");
      } catch (loadError: any) {
        if (!mounted) return;
        setError(String(loadError?.message ?? "We couldn't load programs yet."));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void hydrate();
    return () => {
      mounted = false;
    };
  }, [activeLearner?.id, workspace.profile.id]);

  const selectedProgram = useMemo(
    () => programs.find((program) => program.id === selectedProgramId) ?? null,
    [programs, selectedProgramId],
  );

  const selectedSegment =
    selectedProgram?.segments.find((segment) => segment.id === selectedSegmentId) ?? null;

  useEffect(() => {
    if (!selectedProgram) {
      setSelectedSegmentId(null);
      return;
    }
    if (!selectedSegmentId || !selectedProgram.segments.some((segment) => segment.id === selectedSegmentId)) {
      setSelectedSegmentId(selectedProgram.segments[0]?.id || null);
    }
    if (selectedProgram.scheduleMapping?.calendarTemplateSlotId) {
      setAssignmentSlotId(selectedProgram.scheduleMapping.calendarTemplateSlotId);
    }
    if (selectedProgram.scheduleMapping?.startDate) {
      setAssignmentStartDate(selectedProgram.scheduleMapping.startDate);
    }
  }, [selectedProgram, selectedSegmentId]);

  useEffect(() => {
    const template = templates.find((item) => item.id === assignmentTemplateId) ?? null;
    if (!template) return;
    if (!assignmentSlotId || !template.slots.some((slot) => slot.id === assignmentSlotId)) {
      setAssignmentSlotId(template.slots[0]?.id || "");
    }
  }, [assignmentSlotId, assignmentTemplateId, templates]);

  function handleCreateProgram() {
    const next = defaultProgram({
      familyId: workspace.profile.id,
      learnerId: activeLearner?.id || null,
      frameworkId: learningConfig.frameworkId,
      jurisdictionId: learningConfig.jurisdictionId,
      subjectId: "Inquiry",
      periodLabel: learningConfig.academicStructureType === "semesters" ? "This semester" : "This term",
    });
    setPrograms((current) => [next, ...current]);
    setSelectedProgramId(next.id);
    setStatus("A fresh program template is ready to shape.");
    setError("");
  }

  function updateProgram(nextProgram: Program) {
    setPrograms((current) =>
      current.map((program) => (program.id === nextProgram.id ? nextProgram : program)),
    );
  }

  function updateSegment(nextSegment: ProgramSegment) {
    if (!selectedProgram) return;
    updateProgram({
      ...selectedProgram,
      segments: selectedProgram.segments.map((segment) =>
        segment.id === nextSegment.id ? nextSegment : segment,
      ),
    });
  }

  function addSegment() {
    if (!selectedProgram) return;
    const nextSegment: ProgramSegment = {
      id: `segment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      programId: selectedProgram.id,
      order: selectedProgram.segments.length + 1,
      title: `Segment ${selectedProgram.segments.length + 1}`,
      notes: "",
      curriculumOutcomeIds: [],
      evidencePrompts: [],
      assessmentIntents: [],
      suggestedPlanBlocks: [],
    };
    updateProgram({
      ...selectedProgram,
      segments: [...selectedProgram.segments, nextSegment],
      durationCount: selectedProgram.segments.length + 1,
    });
    setSelectedSegmentId(nextSegment.id);
  }

  async function handleSaveProgram() {
    if (!selectedProgram) return;
    setSaving(true);
    setStatus("");
    setError("");
    try {
      const nextProgram: Program = {
        ...selectedProgram,
        learnerId: activeLearner?.id || selectedProgram.learnerId || null,
        frameworkId: learningConfig.frameworkId,
        jurisdictionId: learningConfig.jurisdictionId,
        scheduleMapping:
          assignmentTemplateId && assignmentSlotId && assignmentStartDate
            ? {
                id: selectedProgram.scheduleMapping?.id || `mapping-${Date.now()}`,
                programId: selectedProgram.id,
                calendarTemplateSlotId: assignmentSlotId,
                placementMode: "sequential",
                startDate: assignmentStartDate,
              }
            : null,
      };
      const saved = await saveFamilyProgram(nextProgram);
      updateProgram(saved);
      setStatus("Program saved.");
    } catch (saveError: any) {
      setError(String(saveError?.message ?? "We couldn't save the program yet."));
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerate() {
    if (!selectedProgram || !activeLearner?.id || !workspace.userId) return;
    const template = templates.find((item) => item.id === assignmentTemplateId) ?? null;
    if (!template || !assignmentSlotId || !assignmentStartDate) return;

    setGenerating(true);
    setStatus("");
    setError("");

    try {
      const nextProgram: Program = {
        ...selectedProgram,
        learnerId: activeLearner.id,
        frameworkId: learningConfig.frameworkId,
        jurisdictionId: learningConfig.jurisdictionId,
        scheduleMapping: {
          id: selectedProgram.scheduleMapping?.id || `mapping-${Date.now()}`,
          programId: selectedProgram.id,
          calendarTemplateSlotId: assignmentSlotId,
          placementMode: "sequential",
          startDate: assignmentStartDate,
        },
      };
      const saved = await saveFamilyProgram(nextProgram);
      updateProgram(saved);
      const generated = await generateProgramIntoCalendar({
        familyProfileId: workspace.profile.id,
        learnerId: activeLearner.id,
        createdByUserId: workspace.userId,
        program: saved,
        template,
        slotId: assignmentSlotId,
        startDate: assignmentStartDate,
      });
      setStatus(`${generated.length} live planning block${generated.length === 1 ? "" : "s"} generated into My Plan.`);
    } catch (generateError: any) {
      setError(String(generateError?.message ?? "We couldn't generate the live plan yet."));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <FamilyTopNavShell
      subtitle="My Programs"
      heroTitle="My Programs"
      heroText="Build the bigger sequence here, then let it land gently inside the reusable calendar rhythm."
      heroAsideTitle="Program templates"
      heroAsideText="Programs hold the longer story. Calendar templates decide where that story lands in a normal week."
    >
      <div className="grid gap-5 pb-14">
        <LearnerSelector
          familyName={workspace.profile.family_display_name || "Your family"}
          learners={learnerOptions}
          activeLearnerId={activeLearner?.id}
          onSelectLearner={setActiveLearner}
          state={workspaceLoading ? "loading" : activeLearner ? "live" : "empty"}
        />

        <ProgramList
          programs={programs}
          selectedProgramId={selectedProgram?.id}
          onSelect={setSelectedProgramId}
          onCreate={handleCreateProgram}
        />

        {loading ? (
          <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
            <div className={BODY}>Loading programs…</div>
          </section>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="grid gap-5">
              <ProgramEditor program={selectedProgram} onChange={updateProgram} />

              <section className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
                <div className="flex items-start justify-between gap-4">
                  <div className="grid gap-1.5">
                    <div className={LABEL}>Segments</div>
                    <h2 className={H2}>Build the sequence</h2>
                    <p className={BODY}>Keep each segment lightweight. It only needs enough detail to make live planning easier later.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addSegment}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Add segment
                  </button>
                </div>

                <div className="grid gap-4">
                  {(selectedProgram?.segments || []).map((segment) => (
                    <ProgramSegmentCard
                      key={segment.id}
                      segment={segment}
                      onChange={updateSegment}
                      onAttachCurriculum={setEditingCurriculumSegmentId}
                    />
                  ))}
                </div>
              </section>
            </div>

            <div className="grid gap-5">
              {selectedSegment ? (
                <section className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
                  <div className="grid gap-1.5">
                    <div className={LABEL}>Curriculum</div>
                    <h2 className={H2}>Linked outcomes for this segment</h2>
                  </div>
                  <CurriculumTagPills
                    preset={preset}
                    outcomeIds={selectedSegment.curriculumOutcomeIds}
                    emptyLabel="No linked outcomes yet"
                  />
                  {editingCurriculumSegmentId === selectedSegment.id ? (
                    <CurriculumAttachPanel
                      preset={preset}
                      selectedOutcomeIds={selectedSegment.curriculumOutcomeIds}
                      onApply={(outcomeIds) => {
                        updateSegment({ ...selectedSegment, curriculumOutcomeIds: outcomeIds });
                        setEditingCurriculumSegmentId(null);
                      }}
                      onCancel={() => setEditingCurriculumSegmentId(null)}
                      state="derived"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingCurriculumSegmentId(selectedSegment.id)}
                      className="inline-flex w-fit items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      {selectedSegment.curriculumOutcomeIds.length ? "Edit curriculum" : "Add curriculum"}
                    </button>
                  )}
                </section>
              ) : (
                <section className="rounded-[24px] border border-dashed border-slate-200 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.03)]">
                  <div className={LABEL}>Curriculum</div>
                  <h2 className={`mt-2 ${H2}`}>Select a segment to attach curriculum</h2>
                  <p className={`mt-2 ${BODY}`}>Program curriculum stays quieter if it lives on the segment that will later generate the real live block.</p>
                </section>
              )}

              <ProgramCalendarAssignmentPanel
                templates={templates}
                selectedTemplateId={assignmentTemplateId}
                selectedSlotId={assignmentSlotId}
                startDate={assignmentStartDate}
                onTemplateChange={setAssignmentTemplateId}
                onSlotChange={setAssignmentSlotId}
                onStartDateChange={setAssignmentStartDate}
                onGenerate={() => void handleGenerate()}
                generating={generating}
              />

              <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
                <div className={LABEL}>Status</div>
                <div className={`mt-2 ${H2}`}>Publish to the live week when ready</div>
                <div className={`mt-2 ${error ? "text-[14px] text-rose-600" : META}`}>
                  {error || status || "Assign a program to a calendar slot to start building your live plan."}
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => void handleSaveProgram()}
                    disabled={saving || !selectedProgram}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save program"}
                  </button>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </FamilyTopNavShell>
  );
}
