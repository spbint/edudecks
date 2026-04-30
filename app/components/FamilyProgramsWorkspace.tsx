"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  ProgramGenerationSuccessBanner,
  ProgramsFirstRunCard,
  ProgramsGuidedSetupBanner,
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
import { countFamilyGeneratedCalendarBlocks } from "@/lib/familyPlanner";

function buildSeedProgram(input: {
  familyId: string;
  learnerId?: string | null;
  frameworkId: string;
  jurisdictionId?: string | null;
  periodLabel: string;
}): Program {
  const base = defaultProgram({
    familyId: input.familyId,
    learnerId: input.learnerId || null,
    frameworkId: input.frameworkId,
    jurisdictionId: input.jurisdictionId || null,
    subjectId: "Mathematics",
    periodLabel: input.periodLabel,
  });

  const segments = [
    {
      title: "Number patterns and place value",
      notes: "Number fluency and visible maths routines.",
    },
    {
      title: "Addition and subtraction strategies",
      notes: "Materials, models, and short practice blocks.",
    },
    {
      title: "Fractions in everyday contexts",
      notes: "Food, measuring, sharing, and comparison.",
    },
    {
      title: "Measurement and time",
      notes: "Time, length, and practical comparisons.",
    },
  ];

  return {
    ...base,
    title: "Mathematics Term 1",
    subjectId: "Mathematics",
    durationCount: segments.length,
    segments: base.segments.slice(0, segments.length).map((segment, index) => ({
      ...segment,
      title: segments[index]?.title || segment.title,
      notes: segments[index]?.notes || "",
    })),
  };
}

function ymd(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function friendlyProgramsMessage(kind: "load" | "save" | "generate") {
  if (kind === "load") {
    return "My Programs could not load. You can keep shaping a draft here.";
  }
  if (kind === "save") {
    return "Your program could not be saved just yet. Keep editing, then save again.";
  }
  return "Generation is not ready yet. Check learner, slot, segment, and start date.";
}

const DETAIL_CHIP =
  "inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.12em]";

function detailStatus(input: {
  hasLearner: boolean;
  hasSegments: boolean;
  hasCalendarTemplate: boolean;
  hasSlot: boolean;
  hasStartDate: boolean;
  generationReady: boolean;
}) {
  if (!input.hasLearner) {
    return { label: "Choose learner", tone: "border-slate-200 bg-slate-50 text-slate-600" };
  }
  if (!input.hasSegments) {
    return { label: "Needs segment", tone: "border-amber-200 bg-amber-50 text-amber-700" };
  }
  if (!input.hasCalendarTemplate || !input.hasSlot) {
    return { label: "Needs slot", tone: "border-blue-200 bg-blue-50 text-blue-700" };
  }
  if (!input.hasStartDate) {
    return { label: "Needs date", tone: "border-violet-200 bg-violet-50 text-violet-700" };
  }
  if (input.generationReady) {
    return { label: "Ready", tone: "border-emerald-200 bg-emerald-50 text-emerald-700" };
  }
  return { label: "Draft workspace", tone: "border-slate-200 bg-slate-50 text-slate-600" };
}

function generationGuidance(input: {
  hasLearner: boolean;
  hasSegments: boolean;
  hasCalendarTemplate: boolean;
  hasSlot: boolean;
  hasStartDate: boolean;
}) {
  if (!input.hasLearner) return "Choose a learner";
  if (!input.hasSegments) return "Add at least one segment";
  if (!input.hasCalendarTemplate || !input.hasSlot) return "Choose a calendar slot";
  if (!input.hasStartDate) return "Choose a start date";
  return "Ready. Generate this program into My Calendar.";
}

export default function FamilyProgramsWorkspace() {
  const router = useRouter();
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
  const [generatedBlockCount, setGeneratedBlockCount] = useState(0);
  const [lastGeneratedCount, setLastGeneratedCount] = useState(0);
  const [showGenerationSuccess, setShowGenerationSuccess] = useState(false);
  const [loadedProgramCount, setLoadedProgramCount] = useState(0);

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
        let generatedCount = 0;
        if (activeLearner?.id) {
          generatedCount = await countFamilyGeneratedCalendarBlocks({
            familyProfileId: workspace.profile.id,
            studentId: activeLearner.id,
          }).catch(() => 0);
        }
        if (!mounted) return;

        const filteredPrograms = nextPrograms.filter(
          (program) => !program.learnerId || program.learnerId === activeLearner?.id,
        );

        setLoadedProgramCount(filteredPrograms.length);
        setPrograms(filteredPrograms);
        setTemplates(nextTemplates);
        setGeneratedBlockCount(generatedCount);
        setSelectedProgramId(filteredPrograms[0]?.id || "");
        setAssignmentTemplateId(nextTemplates[0]?.id || "");
      } catch {
        if (!mounted) return;
        setError(friendlyProgramsMessage("load"));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void hydrate();
    return () => {
      mounted = false;
    };
  }, [
    activeLearner?.id,
    learningConfig.academicStructureType,
    learningConfig.frameworkId,
    learningConfig.jurisdictionId,
    workspace.profile.id,
  ]);

  const selectedProgram = useMemo(
    () => programs.find((program) => program.id === selectedProgramId) ?? null,
    [programs, selectedProgramId],
  );
  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === assignmentTemplateId) ?? null,
    [assignmentTemplateId, templates],
  );
  const selectedSlot = selectedTemplate?.slots.find((slot) => slot.id === assignmentSlotId) ?? null;
  const hasCalendarTemplate = templates.some((template) => template.slots.length > 0);
  const hasPrograms = loadedProgramCount > 0;
  const hasVisiblePrograms = programs.length > 0;
  const hasGeneratedItems = generatedBlockCount > 0;
  const hasLearnerSelected = Boolean(activeLearner?.id);
  const hasProgramSegments = Boolean(selectedProgram?.segments.length);
  const hasCalendarSlot = Boolean(selectedSlot);
  const hasStartDate = Boolean(assignmentStartDate);
  const hasMapping = Boolean(
    selectedProgram?.scheduleMapping?.calendarTemplateSlotId && selectedProgram?.scheduleMapping?.startDate,
  );
  const isFirstRun = !hasGeneratedItems && (!hasCalendarTemplate || !hasPrograms);
  const generationReady = Boolean(
    selectedProgram &&
      assignmentTemplateId &&
      assignmentSlotId &&
      assignmentStartDate &&
      hasCalendarTemplate &&
      hasLearnerSelected &&
      hasProgramSegments,
  );

  const selectedSegment =
    selectedProgram?.segments.find((segment) => segment.id === selectedSegmentId) ?? null;
  const selectedStatus = detailStatus({
    hasLearner: hasLearnerSelected,
    hasSegments: hasProgramSegments,
    hasCalendarTemplate,
    hasSlot: hasCalendarSlot,
    hasStartDate,
    generationReady,
  });
  const currentGuidance = generationGuidance({
    hasLearner: hasLearnerSelected,
    hasSegments: hasProgramSegments,
    hasCalendarTemplate,
    hasSlot: hasCalendarSlot,
    hasStartDate,
  });
  const saveStateLabel = saving
    ? "Saving"
    : workspace.storageMode === "local"
      ? "Saved locally"
      : status
        ? "Saved"
        : "Draft workspace";

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
    const next = buildSeedProgram({
      familyId: workspace.profile.id,
      learnerId: activeLearner?.id || null,
      frameworkId: learningConfig.frameworkId,
      jurisdictionId: learningConfig.jurisdictionId,
      periodLabel: learningConfig.academicStructureType === "semesters" ? "Semester 1" : "Term 1",
    });
    setPrograms((current) => [next, ...current]);
    setSelectedProgramId(next.id);
    setLoadedProgramCount((current) => Math.max(current, 1));
    setStatus("Draft workspace ready.");
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
    } catch {
      setError(friendlyProgramsMessage("save"));
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
      setGeneratedBlockCount((current) => current + generated.length);
      setLastGeneratedCount(generated.length);
      setShowGenerationSuccess(true);
      setStatus(`${generated.length} block${generated.length === 1 ? "" : "s"} generated into My Calendar.`);
    } catch {
      setError(friendlyProgramsMessage("generate"));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <FamilyTopNavShell
      subtitle="My Programs"
      heroTitle="My Programs"
      heroText="Build longer learning sequences, then place them into the live week."
      heroAsideTitle="Program planner"
      heroAsideText="Select a program, shape its segments, then place it into My Calendar."
    >
      <div className="grid gap-5 pb-14">
        {showGenerationSuccess ? (
          <ProgramGenerationSuccessBanner
            count={lastGeneratedCount}
            onOpenPlan={() => router.push(`/my-calendar?date=${encodeURIComponent(assignmentStartDate)}`)}
            onStayHere={() => setShowGenerationSuccess(false)}
          />
        ) : null}

        <LearnerSelector
          familyName={workspace.profile.family_display_name || "Your family"}
          learners={learnerOptions}
          activeLearnerId={activeLearner?.id}
          onSelectLearner={setActiveLearner}
          state={workspaceLoading ? "loading" : activeLearner ? "live" : "empty"}
        />

        {!workspaceLoading && !activeLearner ? (
          <ProgramsGuidedSetupBanner
            title="Choose a learner"
            note="Generation unlocks after a learner is selected."
          />
        ) : null}

        {isFirstRun ? (
          <ProgramsFirstRunCard
            onStartSetup={() => {
              if (!hasCalendarTemplate) {
                router.push("/my-calendar?returnTo=/my-programs&setup=1");
                return;
              }
              handleCreateProgram();
            }}
            onLearnHow={() => {
              const target = document.getElementById("programs-workspace");
              target?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            primaryLabel={!hasCalendarTemplate ? "Open My Calendar" : "New program"}
            hasCalendarTemplate={hasCalendarTemplate}
            hasProgram={hasVisiblePrograms}
            generationReady={generationReady}
            hasGeneratedItems={hasGeneratedItems}
          />
        ) : null}

        {loading ? (
          <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
            <div className={BODY}>Loading programs...</div>
          </section>
        ) : (
          <div id="programs-workspace" className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
            <div className="xl:sticky xl:top-4 xl:self-start">
              <ProgramList
                programs={programs}
                selectedProgramId={selectedProgram?.id}
                onSelect={setSelectedProgramId}
                onCreate={handleCreateProgram}
                firstRun={isFirstRun}
              />
            </div>

            <section className="grid gap-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="grid gap-1.5">
                  <div className={LABEL}>Selected program</div>
                  <h2 className="text-[24px] font-black leading-tight text-slate-950">
                    {selectedProgram?.title || "No program selected"}
                  </h2>
                  <div className={META}>
                    {[selectedProgram?.subjectId, selectedProgram?.periodLabel].filter(Boolean).join(" - ") ||
                      "Create or select a program."}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`${DETAIL_CHIP} ${selectedStatus.tone}`}>{selectedStatus.label}</span>
                  <span className={`${DETAIL_CHIP} border-slate-200 bg-slate-50 text-slate-600`}>
                    {selectedProgram?.segments.length || 0} segment{selectedProgram?.segments.length === 1 ? "" : "s"}
                  </span>
                  <span className={`${DETAIL_CHIP} border-slate-200 bg-slate-50 text-slate-600`}>
                    {selectedSlot?.label || "No slot"}
                  </span>
                </div>
              </div>

              <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)]">
                <div className="grid gap-5">
                  <ProgramEditor program={selectedProgram} onChange={updateProgram} />

                  <section className="grid gap-4 rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="grid gap-1.5">
                        <div className={LABEL}>Segments</div>
                        <h2 className={H2}>Sequence rows</h2>
                      </div>
                      <button
                        type="button"
                        onClick={addSegment}
                        disabled={!selectedProgram}
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Add segment
                      </button>
                    </div>

                    <div className="grid gap-3">
                      {(selectedProgram?.segments || []).map((segment) => (
                        <ProgramSegmentCard
                          key={segment.id}
                          segment={segment}
                          hasSlot={hasCalendarSlot}
                          onChange={updateSegment}
                          onAttachCurriculum={setEditingCurriculumSegmentId}
                        />
                      ))}
                      {selectedProgram && !selectedProgram.segments.length ? (
                        <div className="rounded-[18px] border border-dashed border-slate-200 bg-white px-4 py-5">
                          <div className={H2}>No segments yet</div>
                          <div className={`mt-1 ${META}`}>Add at least one segment</div>
                        </div>
                      ) : null}
                    </div>
                  </section>
                </div>

                <div className="grid gap-5">
                  {selectedSegment ? (
                    <section className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
                      <div className="grid gap-1.5">
                        <div className={LABEL}>Curriculum</div>
                        <h2 className={H2}>Linked outcomes</h2>
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
                      <h2 className={`mt-2 ${H2}`}>Select a segment</h2>
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
                    generationReady={generationReady}
                    hasLearner={hasLearnerSelected}
                    hasSegments={hasProgramSegments}
                  />

                  <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className={LABEL}>Save state</div>
                        <div className={`mt-2 ${H2}`}>Place when ready</div>
                      </div>
                      <span className={`${DETAIL_CHIP} border-slate-200 bg-slate-50 text-slate-600`}>
                        {saveStateLabel}
                      </span>
                    </div>
                    <div className={`mt-3 ${error ? "text-[14px] text-rose-600" : META}`}>
                      {error || status || currentGuidance}
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
            </section>
          </div>
        )}
      </div>
    </FamilyTopNavShell>
  );
}
