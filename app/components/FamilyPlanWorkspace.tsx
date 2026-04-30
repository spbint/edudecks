"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";
import {
  HomeSectionHeader,
  type HomeSurfaceState,
  type LearnerOption,
  LearnerSelector,
} from "@/app/components/home/HomeOverviewComponents";
import {
  PLANNER_SUBJECTS,
  PlanActionCard,
  PlanMetricCard,
  type PlanMetricCardProps,
  PlanNextMoveCard,
  PlannerDayCard,
  PlannerQuickAddRow,
  type PlannerBlock,
  type PlannerSubject,
  VisualWeeklyPlanner,
} from "@/app/components/plan/PlanOverviewComponents";
import {
  addFamilyCalendarBlock,
  loadFamilyCalendarWindow,
  loadFamilyWeeklyPlan,
  saveFamilyCalendarDayNote,
  updateFamilyCalendarBlock,
  updateFamilyCalendarBlockCurriculum,
  type FamilyCalendarWindow,
  type FamilyWeeklyPlan,
} from "@/lib/familyPlanner";
import {
  CurriculumAttachPanel,
  CurriculumTagPills,
} from "@/app/components/curriculum/CurriculumTaggingComponents";
import { frameworkPreset } from "@/lib/curriculumFrameworks";
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

function getBusinessWeek(anchor: Date) {
  const monday = startOfWeek(anchor);
  return Array.from({ length: 5 }, (_, index) => addDays(monday, index));
}

function getWeekKeyFromDate(dateValue: string): string {
  const date = new Date(`${dateValue}T00:00:00`);
  const year = date.getFullYear();
  const start = new Date(year, 0, 1);
  const diffDays = Math.floor((date.getTime() - start.getTime()) / 86400000);
  const week = Math.ceil((diffDays + start.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function formatWeekRange(days: Date[]) {
  const first = days[0];
  const last = days[days.length - 1];
  const firstMonth = first.toLocaleDateString("en-AU", { month: "short" });
  const lastMonth = last.toLocaleDateString("en-AU", { month: "short" });
  const year = last.getFullYear();

  return `Week of ${first.getDate()} ${firstMonth} – ${last.getDate()} ${lastMonth} ${year}`;
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString("en-AU", { weekday: "short" });
}

function formatDayDateLabel(date: Date) {
  return date.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

function relativeTimeLabel(value?: string | null) {
  if (!value) return "Not yet";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Recently";

  const diffMs = Date.now() - parsed.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours <= 24) return "Today";
  if (diffDays <= 7) return `${diffDays}d ago`;
  return parsed.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

function plannerSubject(value: string): PlannerSubject {
  return (PLANNER_SUBJECTS.includes(value as PlannerSubject) ? value : "Creative") as PlannerSubject;
}

function friendlyPlanMessage(kind: "load" | "block" | "note" | "curriculum" | "edit") {
  if (kind === "load") {
    return "My Plan is still settling. This week's view should be back in a moment.";
  }
  if (kind === "block") {
    return "This learning block could not be saved just yet. Try again in a moment.";
  }
  if (kind === "note") {
    return "Today's note could not be saved just yet. Try again in a moment.";
  }
  if (kind === "curriculum") {
    return "Curriculum links are still getting ready. Try saving them again in a moment.";
  }
  return "This block could not be updated just yet. Try again in a moment.";
}

export default function FamilyPlanWorkspace() {
  const searchParams = useSearchParams();
  const { workspace, activeLearner, loading: workspaceLoading, setActiveLearner } = useFamilyWorkspace();

  const [selectedWeekAnchor, setSelectedWeekAnchor] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weeklyPlan, setWeeklyPlan] = useState<FamilyWeeklyPlan | null>(null);
  const [calendarWindow, setCalendarWindow] = useState<FamilyCalendarWindow | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [savingCalendar, setSavingCalendar] = useState(false);
  const [planError, setPlanError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [momentTitle, setMomentTitle] = useState("");
  const [momentNote, setMomentNote] = useState("");
  const [optionalTime, setOptionalTime] = useState("");
  const [subject, setSubject] = useState<PlannerSubject>("Literacy");
  const [dayNotes, setDayNotes] = useState<Record<string, string>>({});
  const [blocks, setBlocks] = useState<Record<string, PlannerBlock[]>>({});
  const [editingCurriculumBlockId, setEditingCurriculumBlockId] = useState<string | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editingBlockDraft, setEditingBlockDraft] = useState<{
    title: string;
    subject: PlannerSubject;
    note: string;
    time: string;
  }>({
    title: "",
    subject: "Literacy",
    note: "",
    time: "",
  });

  const learnerOptions: LearnerOption[] = workspace.learners.map((learner) => ({
    id: learner.id,
    label: learner.label,
    note: learner.yearLabel || "Learner",
  }));

  const hasLearners = workspace.learners.length > 0;
  const hasActiveLearner = Boolean(activeLearner);
  const activeLearnerName = activeLearner?.label || "your learner";
  const learnerSetupHref = hasLearners ? "/family" : "/family#learner-management";
  const learnerSetupLabel = hasLearners ? "Open My Family" : "Add your first learner";
  const learningConfig = resolveEffectiveLearnerLearningConfig(workspace.profile, activeLearner);
  const preset = frameworkPreset(
    learningConfig.country === "us" || learningConfig.country === "uk"
      ? learningConfig.country
      : "au",
  );
  const hasFramework = Boolean(learningConfig.frameworkId);
  const weekDays = useMemo(() => getBusinessWeek(selectedWeekAnchor), [selectedWeekAnchor]);
  const weekKey = getWeekKeyFromDate(ymd(weekDays[0]));
  const weekStart = ymd(weekDays[0]);
  const weekEnd = ymd(weekDays[weekDays.length - 1]);
  const selectedDayKey = ymd(selectedDate);
  const selectedDayLabel = `${formatDayLabel(selectedDate)} ${formatDayDateLabel(selectedDate)}`;

  const canonicalReady =
    Boolean(workspace.userId) &&
    workspace.storageMode === "database" &&
    Boolean(workspace.profile?.id) &&
    workspace.profile.id !== "local" &&
    Boolean(activeLearner?.id);

  useEffect(() => {
    const dateParam = searchParams.get("date");
    if (!dateParam) return;
    const parsed = new Date(`${dateParam}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return;
    setSelectedWeekAnchor(parsed);
    setSelectedDate(parsed);
    setStatusMessage("Your generated week is open and ready to shape.");
  }, [searchParams]);

  useEffect(() => {
    const inVisibleWeek = weekDays.some((day) => ymd(day) === selectedDayKey);
    if (!inVisibleWeek) {
      setSelectedDate(weekDays[0]);
    }
  }, [selectedDayKey, weekDays]);

  useEffect(() => {
    let mounted = true;

    async function hydratePlan() {
      if (!canonicalReady || !activeLearner?.id) {
        if (mounted) {
          setWeeklyPlan(null);
          setCalendarWindow(null);
          setBlocks({});
          setDayNotes({});
          setLoadingPlan(false);
          setPlanError("");
        }
        return;
      }

      try {
        setLoadingPlan(true);
        setPlanError("");
        setStatusMessage("");

        const [plan, calendar] = await Promise.all([
          loadFamilyWeeklyPlan({
            familyProfileId: workspace.profile.id,
            studentId: activeLearner.id,
            weekKey,
          }),
          loadFamilyCalendarWindow({
            familyProfileId: workspace.profile.id,
            studentId: activeLearner.id,
            dateFrom: weekStart,
            dateTo: weekEnd,
          }),
        ]);

        if (!mounted) return;

        const nextBlocks = Object.fromEntries(
          Object.entries(calendar.blocks).map(([date, items]) => [
            date,
            items.map((item) => ({
              id: item.id,
              title: item.title,
              subject: plannerSubject(item.subject),
              note: item.note,
              time: item.time,
              curriculumOutcomeIds: item.curriculumOutcomeIds ?? [],
              sourceType: item.sourceType ?? "manual",
              programId: item.programId ?? null,
              programSegmentId: item.programSegmentId ?? null,
              calendarTemplateSlotId: item.calendarTemplateSlotId ?? null,
            })),
          ]),
        ) as Record<string, PlannerBlock[]>;

        setWeeklyPlan(plan);
        setCalendarWindow(calendar);
        setBlocks(nextBlocks);
        setDayNotes(calendar.dayNotes);
      } catch {
        if (!mounted) return;
        setWeeklyPlan(null);
        setCalendarWindow(null);
        setBlocks({});
        setDayNotes({});
        setPlanError(friendlyPlanMessage("load"));
      } finally {
        if (mounted) setLoadingPlan(false);
      }
    }

    void hydratePlan();

    return () => {
      mounted = false;
    };
  }, [canonicalReady, activeLearner?.id, workspace.profile?.id, weekEnd, weekKey, weekStart]);

  const totalWeekBlocks = weekDays.reduce(
    (count, day) => count + (blocks[ymd(day)]?.length ?? 0),
    0,
  );
  const completedActions = weeklyPlan?.actions.filter((action) => action.completed).length ?? 0;
  const openDays = weekDays.filter((day) => (blocks[ymd(day)]?.length ?? 0) === 0).length;

  const planState: HomeSurfaceState = workspaceLoading || loadingPlan
    ? "loading"
    : !hasLearners || !hasActiveLearner
      ? "empty"
      : canonicalReady
        ? weeklyPlan || totalWeekBlocks
          ? "live"
          : "empty"
        : workspace.storageMode === "database"
          ? "derived"
          : "placeholder";

  const learnerSelectorState: HomeSurfaceState = workspaceLoading
    ? "loading"
    : hasLearners
      ? workspace.storageMode === "database"
        ? "derived"
        : "placeholder"
      : "empty";

  async function addBlockForDate(date: Date, title?: string, forcedSubject?: PlannerSubject) {
    const key = ymd(date);
    const trimmed = (title ?? momentTitle).trim();
    const finalTitle = trimmed || "Start with one small learning moment";
    const finalSubject = forcedSubject ?? subject;

    const optimisticBlock: PlannerBlock = {
      id: `${key}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: finalTitle,
      subject: finalSubject,
      note: momentNote.trim(),
      time: optionalTime.trim(),
      curriculumOutcomeIds: [],
      sourceType: "manual",
      programId: null,
      programSegmentId: null,
      calendarTemplateSlotId: null,
    };

    setBlocks((prev) => ({
      ...prev,
      [key]: [...(prev[key] ?? []), optimisticBlock],
    }));
    setMomentTitle("");
    setMomentNote("");
    setOptionalTime("");
    setSelectedDate(date);

    if (!canonicalReady || !activeLearner?.id) {
      setStatusMessage("Plan blocks will save once a linked learner and synced workspace are available.");
      return;
    }

    try {
      setSavingCalendar(true);
      setPlanError("");

      const savedBlock = await addFamilyCalendarBlock({
        familyProfileId: workspace.profile.id,
        studentId: activeLearner.id,
        createdByUserId: workspace.userId as string,
        date: key,
        title: finalTitle,
        subject: finalSubject,
        note: optimisticBlock.note,
        time: optimisticBlock.time,
        curriculumOutcomeIds: optimisticBlock.curriculumOutcomeIds,
      });

      setBlocks((prev) => ({
        ...prev,
        [key]: [
          ...(prev[key] ?? []).filter((item) => item.id !== optimisticBlock.id),
          {
            id: savedBlock.id,
            title: savedBlock.title,
            subject: plannerSubject(savedBlock.subject),
            note: savedBlock.note,
            time: savedBlock.time,
            curriculumOutcomeIds: savedBlock.curriculumOutcomeIds ?? [],
            sourceType: savedBlock.sourceType ?? "manual",
            programId: savedBlock.programId ?? null,
            programSegmentId: savedBlock.programSegmentId ?? null,
            calendarTemplateSlotId: savedBlock.calendarTemplateSlotId ?? null,
          },
        ],
      }));
      setStatusMessage("Saved to this week’s plan.");
    } catch {
      setBlocks((prev) => ({
        ...prev,
        [key]: (prev[key] ?? []).filter((item) => item.id !== optimisticBlock.id),
      }));
      setPlanError(friendlyPlanMessage("block"));
    } finally {
      setSavingCalendar(false);
    }
  }

  function updateDayNote(date: Date, value: string) {
    const key = ymd(date);
    setDayNotes((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function persistDayNote(date: Date) {
    const key = ymd(date);
    const nextNote = dayNotes[key] ?? "";

    if (!canonicalReady || !activeLearner?.id) {
      setStatusMessage("Daily notes will save once a linked learner is ready.");
      return;
    }

    try {
      setSavingCalendar(true);
      setPlanError("");
      await saveFamilyCalendarDayNote({
        familyProfileId: workspace.profile.id,
        studentId: activeLearner.id,
        createdByUserId: workspace.userId as string,
        date: key,
        note: nextNote,
      });
      setStatusMessage(nextNote.trim() ? "Daily note saved." : "Daily note cleared.");
    } catch {
      setPlanError(friendlyPlanMessage("note"));
    } finally {
      setSavingCalendar(false);
    }
  }

  function goPreviousWeek() {
    setSelectedWeekAnchor((prev) => addDays(prev, -7));
  }

  function goNextWeek() {
    setSelectedWeekAnchor((prev) => addDays(prev, 7));
  }

  function goToday() {
    const today = new Date();
    setSelectedWeekAnchor(today);
    setSelectedDate(today);
  }

  async function saveBlockCurriculum(blockId: string, curriculumOutcomeIds: string[]) {
    setBlocks((prev) =>
      Object.fromEntries(
        Object.entries(prev).map(([date, items]) => [
          date,
          items.map((item) =>
            item.id === blockId ? { ...item, curriculumOutcomeIds } : item,
          ),
        ]),
      ),
    );
    setEditingCurriculumBlockId(null);

    if (!canonicalReady) {
      setStatusMessage("Curriculum links will persist once the synced workspace is available.");
      return;
    }

    try {
      setSavingCalendar(true);
      setPlanError("");
      await updateFamilyCalendarBlockCurriculum({ blockId, curriculumOutcomeIds });
      setStatusMessage(
        curriculumOutcomeIds.length
          ? "Curriculum links saved."
          : "Curriculum links cleared.",
      );
    } catch {
      setPlanError(friendlyPlanMessage("curriculum"));
    } finally {
      setSavingCalendar(false);
    }
  }

  async function saveBlockEdits(blockId: string) {
    const draft = editingBlockDraft;
    setEditingBlockId(null);

    setBlocks((prev) =>
      Object.fromEntries(
        Object.entries(prev).map(([date, items]) => [
          date,
          items.map((item) =>
            item.id === blockId
              ? {
                  ...item,
                  title: draft.title,
                  subject: draft.subject,
                  note: draft.note,
                  time: draft.time,
                }
              : item,
          ),
        ]),
      ),
    );

    if (!canonicalReady) {
      setStatusMessage("Block changes will persist once the synced workspace is available.");
      return;
    }

    try {
      setSavingCalendar(true);
      setPlanError("");
      const currentBlock = Object.values(blocks).flat().find((item) => item.id === blockId);
      await updateFamilyCalendarBlock({
        blockId,
        title: draft.title,
        subject: draft.subject,
        note: draft.note,
        time: draft.time,
        curriculumOutcomeIds: currentBlock?.curriculumOutcomeIds ?? [],
      });
      setStatusMessage("Live plan block updated.");
    } catch {
      setPlanError(friendlyPlanMessage("edit"));
    } finally {
      setSavingCalendar(false);
    }
  }

  const compactSummaryCards: PlanMetricCardProps[] = [
    {
      label: "Current focus",
      value:
        planState === "loading"
          ? ""
          : weeklyPlan?.focusTitle ||
            blocks[selectedDayKey]?.[0]?.title ||
            (hasActiveLearner ? "Ready to shape" : "Not set"),
      note:
        planState === "live"
          ? weeklyPlan?.selectedGoal || `Keep ${activeLearnerName}'s week gently in view`
          : hasActiveLearner
            ? `Shape one clear focus for ${activeLearnerName}`
            : "Add your first learner before shaping the live week",
      state: planState,
      accent: "blue",
    },
    {
      label: "Readiness",
      value:
        planState === "loading"
          ? ""
          : planState === "live"
            ? openDays <= 1
              ? "On track"
              : openDays <= 3
                ? "Ready to shape"
                : "Needs shaping"
            : hasActiveLearner
              ? "Draft workspace"
              : "Choose learner",
      note:
        planState === "live"
          ? `${openDays} open day${openDays === 1 ? "" : "s"} still available this week`
          : hasActiveLearner
            ? `Use one or two blocks to settle ${activeLearnerName}'s rhythm`
            : "Choose a learner to see readiness",
      state: planState === "live" ? "derived" : planState,
      accent: "violet",
    },
    {
      label: "Active blocks",
      value:
        planState === "loading"
          ? ""
          : planState === "live"
            ? String(totalWeekBlocks)
            : hasActiveLearner
              ? "Draft workspace"
              : "0",
      note:
        planState === "live"
          ? `${totalWeekBlocks} block${totalWeekBlocks === 1 ? "" : "s"} placed this week`
          : hasActiveLearner
            ? `Weekly blocks for ${activeLearnerName} will appear here`
            : "Add a learner first, then place the first block",
      state: planState === "live" ? "live" : planState,
      accent: "emerald",
    },
  ];

  const quickActions: Array<{
    href: string;
    icon: string;
    label: string;
    note: string;
    cta: string;
    state: HomeSurfaceState;
  }> = [
    {
      href: "/my-day",
      icon: "TD",
      label: "Open My Day",
      note: hasActiveLearner ? `See what is due today for ${activeLearnerName} and what is ready to capture.` : "Choose a learner to see today clearly.",
      cta: "Open day",
      state: hasActiveLearner ? planState : "empty",
    },
    {
      href: "/my-calendar",
      icon: "CL",
      label: "Review My Calendar",
      note: hasActiveLearner ? `Adjust the reusable weekly rhythm that supports ${activeLearnerName}'s live week.` : "Set the weekly rhythm after learner setup.",
      cta: "Review rhythm",
      state: hasActiveLearner ? planState : "empty",
    },
    {
      href: "/my-programs",
      icon: "PG",
      label: "Open My Programs",
      note: hasActiveLearner ? `Refine the longer sequence behind ${activeLearnerName}'s week before generating more blocks.` : "Programs become useful after learner setup.",
      cta: "Open programs",
      state: hasActiveLearner ? "derived" : "empty",
    },
    {
      href: "/capture",
      icon: "CP",
      label: "Capture from the live week",
      note: hasActiveLearner ? `Use fresh evidence to refine ${activeLearnerName}'s next step once the week is in motion.` : "Capture starts after learner setup.",
      cta: "Capture now",
      state: hasActiveLearner ? "derived" : "empty",
    },
  ];

  const healthCards: PlanMetricCardProps[] = [
    {
      label: "Active blocks",
      value: planState === "loading" ? "" : planState === "live" ? String(totalWeekBlocks) : hasActiveLearner ? "Draft workspace" : "0",
      note:
        planState === "live"
          ? `${totalWeekBlocks} block${totalWeekBlocks === 1 ? "" : "s"} across this week`
          : hasActiveLearner
            ? "Blocks will sharpen as planner data grows"
            : "Your first block will appear here",
      state: planState,
      accent: "blue",
    },
    {
      label: "Ready now",
      value: planState === "loading" ? "" : planState === "live" ? String(completedActions) : hasActiveLearner ? "Draft workspace" : "0",
      note:
        planState === "live"
          ? `${completedActions} action${completedActions === 1 ? "" : "s"} already settled`
          : hasActiveLearner
            ? "Ready-now signals will appear as the plan matures"
            : "Ready-now signals appear after setup",
      state: planState === "live" ? "live" : planState,
      accent: "emerald",
    },
    {
      label: "Needs shaping",
      value: planState === "loading" ? "" : planState === "live" ? String(openDays) : hasActiveLearner ? "Draft workspace" : "0",
      note:
        planState === "live"
          ? `${openDays} day${openDays === 1 ? "" : "s"} still open this week`
          : hasActiveLearner
            ? "Open days stay visible here"
            : "Choose a learner to see what needs shaping",
      state: planState === "live" ? "derived" : planState,
      accent: "amber",
    },
    {
      label: "Last updated",
      value: planState === "loading" ? "" : relativeTimeLabel(weeklyPlan?.updatedAt || activeLearner?.connectedAt),
      note:
        planState === "live"
          ? "Based on the latest weekly plan or learner activity"
          : hasActiveLearner
            ? "Plan updates will appear once saved"
            : "No planning activity yet",
      state: planState === "live" ? "live" : planState,
      accent: "violet",
    },
  ];

  const nextMove =
    !hasActiveLearner
      ? {
          title: hasLearners ? "Choose who this live week belongs to" : "My Plan shapes the live week after learner setup",
          note: hasLearners
            ? "Choose the learner you want to plan for first. Then My Plan can shape the live week and hand you forward into My Day."
            : "Add your first learner first. Then My Plan can shape the live week, My Day can run today, and capture can stay connected.",
          ctaHref: learnerSetupHref,
          ctaLabel: learnerSetupLabel,
          state: "empty" as HomeSurfaceState,
        }
      : planState === "live" && openDays > 0
        ? {
            title: `Shape ${activeLearnerName}'s week visually`,
            note: "Start with one clear focus and one or two learning blocks, then return to My Day to run today calmly.",
            ctaHref: "/my-day",
            ctaLabel: "Open My Day",
            state: "live" as HomeSurfaceState,
          }
        : planState === "live"
          ? {
              title: `Capture evidence for ${activeLearnerName}`,
              note: "The week is visible. A fresh capture will make the next report and progress view stronger.",
              ctaHref: "/capture",
              ctaLabel: "Add learning evidence",
              state: "derived" as HomeSurfaceState,
            }
          : {
              title: `Start ${activeLearnerName}'s first visual plan`,
              note: "Use one small learning block to make the week feel settled. My Calendar sets the rhythm behind it, but My Plan is the right place to start the live week.",
              ctaHref: "/my-plan",
              ctaLabel: "Continue planning",
              state: hasActiveLearner ? "placeholder" as HomeSurfaceState : "empty" as HomeSurfaceState,
            };

  return (
    <FamilyTopNavShell
      title="MyLearna"
      subtitle="My Plan"
      heroTitle="My Plan"
      heroText="Shape what’s active now and what comes next."
      hideHeroAside={true}
    >
      <div className="grid gap-5 pb-14">
        <LearnerSelector
          familyName={workspace.profile.family_display_name || "Your family"}
          learners={learnerOptions}
          activeLearnerId={activeLearner?.id}
          onSelectLearner={setActiveLearner}
          state={learnerSelectorState}
        />

        <section className="grid gap-4 lg:grid-cols-3">
          {compactSummaryCards.map((card) => (
            <PlanMetricCard
              key={card.label}
              label={card.label}
              value={card.value}
              note={card.note}
              state={card.state}
              accent={card.accent}
            />
          ))}
        </section>

        <section className="grid gap-4">
          <HomeSectionHeader eyebrow="Quick actions" title="Start with one clear planning move" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {quickActions.map((action) => (
              <PlanActionCard
                key={action.label}
                href={action.href}
                icon={action.icon}
                label={action.label}
                note={action.note}
                cta={action.cta}
                state={action.state}
              />
            ))}
          </div>
        </section>

        <VisualWeeklyPlanner
          state={planState}
          weekLabel={formatWeekRange(weekDays)}
          selectedDayLabel={selectedDayLabel}
          onToday={goToday}
          onPreviousWeek={goPreviousWeek}
          onNextWeek={goNextWeek}
          onAddFromControl={() => void addBlockForDate(selectedDate)}
          savingLabel={savingCalendar ? "Saving…" : ""}
          errorMessage={planError}
          statusMessage={statusMessage}
          quickAddRow={
            <PlannerQuickAddRow
              title={momentTitle}
              subject={subject}
              note={momentNote}
              optionalTime={optionalTime}
              selectedDayLabel={selectedDayLabel}
              onTitleChange={setMomentTitle}
              onSubjectChange={setSubject}
              onNoteChange={setMomentNote}
              onOptionalTimeChange={setOptionalTime}
              onAdd={() => void addBlockForDate(selectedDate)}
              disabled={savingCalendar}
            />
          }
        >
          {weekDays.map((day) => {
            const key = ymd(day);
            const dayBlocks = blocks[key] ?? [];

            return (
              <PlannerDayCard
                key={key}
                label={formatDayLabel(day)}
                dateLabel={formatDayDateLabel(day)}
                today={key === ymd(new Date())}
                focused={key === selectedDayKey}
                note={dayNotes[key] ?? ""}
                blocks={dayBlocks}
                noteStatusLabel={
                  savingCalendar && key === selectedDayKey
                    ? "Saving"
                    : dayNotes[key]?.trim()
                      ? "Saved"
                      : "Open"
                }
                onNoteChange={(value) => updateDayNote(day, value)}
                onNoteBlur={() => void persistDayNote(day)}
                onAddBlock={() => void addBlockForDate(day, "Learning block")}
                onOpenDay={() => setSelectedDate(day)}
                quickAddOptions={PLANNER_SUBJECTS.map((plannerChip) => ({
                  label: plannerChip,
                  subject: plannerChip,
                  onClick: () => void addBlockForDate(day, plannerChip, plannerChip),
                }))}
                captureHref={`/capture?date=${encodeURIComponent(key)}`}
                renderBlockCurriculum={(block) => (
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="grid gap-1">
                        <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                          {block.sourceType === "generated" ? "Generated block" : "Linked outcomes"}
                        </div>
                        {block.sourceType === "generated" ? (
                          <div className="text-[13px] leading-5 text-slate-500">
                            Generated from My Programs, then opened into the live week for adjustment.
                          </div>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBlockId((current) => (current === block.id ? null : block.id));
                            setEditingBlockDraft({
                              title: block.title,
                              subject: block.subject,
                              note: block.note,
                              time: block.time,
                            });
                          }}
                          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Adjust block
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCurriculumBlockId((current) => (current === block.id ? null : block.id))}
                          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          {block.curriculumOutcomeIds.length ? "Edit curriculum" : "Add curriculum"}
                        </button>
                      </div>
                    </div>
                    {hasFramework && preset ? (
                      <CurriculumTagPills
                        preset={preset}
                        outcomeIds={block.curriculumOutcomeIds}
                        emptyLabel="No linked outcomes yet"
                      />
                    ) : (
                      <div className="text-[13px] leading-5 text-slate-500">
                        Choose a curriculum framework in My Settings to begin linking outcomes.
                      </div>
                    )}
                  </div>
                )}
                renderBlockEditor={(block) =>
                  <>
                    {editingBlockId === block.id ? (
                      <div className="grid gap-3 rounded-[18px] border border-slate-200 bg-white px-4 py-4">
                        <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Adjust this block
                        </div>
                        <input
                          className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[14px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300"
                          value={editingBlockDraft.title}
                          onChange={(event) =>
                            setEditingBlockDraft((current) => ({ ...current, title: event.target.value }))
                          }
                        />
                        <div className="grid gap-3 md:grid-cols-2">
                          <select
                            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[14px] text-slate-800 outline-none transition focus:border-blue-300"
                            value={editingBlockDraft.subject}
                            onChange={(event) =>
                              setEditingBlockDraft((current) => ({
                                ...current,
                                subject: event.target.value as PlannerSubject,
                              }))
                            }
                          >
                            {PLANNER_SUBJECTS.map((item) => (
                              <option key={item}>{item}</option>
                            ))}
                          </select>
                          <input
                            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[14px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300"
                            placeholder="Optional time"
                            value={editingBlockDraft.time}
                            onChange={(event) =>
                              setEditingBlockDraft((current) => ({ ...current, time: event.target.value }))
                            }
                          />
                        </div>
                        <textarea
                          className="min-h-[84px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[14px] leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300"
                          value={editingBlockDraft.note}
                          onChange={(event) =>
                            setEditingBlockDraft((current) => ({ ...current, note: event.target.value }))
                          }
                          placeholder="Keep a gentle note close to this learning block..."
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void saveBlockEdits(block.id)}
                            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-[14px] font-semibold text-white transition hover:bg-slate-800"
                          >
                            Save block
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingBlockId(null)}
                            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : null}
                    {editingCurriculumBlockId === block.id ? (
                      <CurriculumAttachPanel
                        preset={preset}
                        selectedOutcomeIds={block.curriculumOutcomeIds}
                        onApply={(outcomeIds) => void saveBlockCurriculum(block.id, outcomeIds)}
                        onCancel={() => setEditingCurriculumBlockId(null)}
                        state={planState}
                      />
                    ) : null}
                  </>
                }
              />
            );
          })}
        </VisualWeeklyPlanner>

        <section className="grid gap-4">
          <HomeSectionHeader eyebrow="Plan health" title="Keep the week visible" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {healthCards.map((card) => (
              <PlanMetricCard
                key={card.label}
                label={card.label}
                value={card.value}
                note={card.note}
                state={card.state}
                accent={card.accent}
              />
            ))}
          </div>
        </section>

        <PlanNextMoveCard
          title={nextMove.title}
          note={nextMove.note}
          ctaHref={nextMove.ctaHref}
          ctaLabel={nextMove.ctaLabel}
          state={nextMove.state}
        />
      </div>
    </FamilyTopNavShell>
  );
}
