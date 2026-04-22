"use client";

import React, { useEffect, useMemo, useState } from "react";
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

export default function FamilyPlanWorkspace() {
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

  const learnerOptions: LearnerOption[] = workspace.learners.map((learner) => ({
    id: learner.id,
    label: learner.label,
    note: learner.yearLabel || "Learner",
  }));

  const hasLearners = workspace.learners.length > 0;
  const hasActiveLearner = Boolean(activeLearner);
  const activeLearnerName = activeLearner?.label || "your learner";
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
            })),
          ]),
        ) as Record<string, PlannerBlock[]>;

        setWeeklyPlan(plan);
        setCalendarWindow(calendar);
        setBlocks(nextBlocks);
        setDayNotes(calendar.dayNotes);
      } catch (error: any) {
        if (!mounted) return;
        setWeeklyPlan(null);
        setCalendarWindow(null);
        setBlocks({});
        setDayNotes({});
        setPlanError(String(error?.message ?? "We could not load this learner's plan."));
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
          },
        ],
      }));
      setStatusMessage("Saved to this week’s plan.");
    } catch (error: any) {
      setBlocks((prev) => ({
        ...prev,
        [key]: (prev[key] ?? []).filter((item) => item.id !== optimisticBlock.id),
      }));
      setPlanError(String(error?.message ?? "We could not save this learning block."));
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
    } catch (error: any) {
      setPlanError(String(error?.message ?? "We could not save this daily note."));
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
    } catch (error: any) {
      setPlanError(String(error?.message ?? "We could not save curriculum links."));
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
            : "Add your first learner to begin",
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
              ? "Preview"
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
              ? "Preview"
              : "0",
      note:
        planState === "live"
          ? `${totalWeekBlocks} block${totalWeekBlocks === 1 ? "" : "s"} placed this week`
          : hasActiveLearner
            ? `Weekly blocks for ${activeLearnerName} will appear here`
            : "Add your first block to begin",
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
      href: "/my-plan",
      icon: "PL",
      label: "Continue planning",
      note: hasActiveLearner ? `Keep ${activeLearnerName}'s week visible.` : "Choose a learner to continue.",
      cta: "Open",
      state: hasActiveLearner ? planState : "empty",
    },
    {
      href: "/my-plan",
      icon: "LB",
      label: "Add learning block",
      note: hasActiveLearner ? `Place one meaningful block for ${activeLearnerName}.` : "Add a learner before shaping the week.",
      cta: "Add",
      state: hasActiveLearner ? planState : "empty",
    },
    {
      href: "/my-plan",
      icon: "WK",
      label: "Adjust this week",
      note: hasActiveLearner ? `Review the open days and smooth the rhythm.` : "Weekly rhythm appears after learner setup.",
      cta: "Adjust",
      state: hasActiveLearner ? "derived" : "empty",
    },
    {
      href: "/capture",
      icon: "CP",
      label: "Review recent captures",
      note: hasActiveLearner ? `Use fresh evidence to refine ${activeLearnerName}'s next step.` : "Capture starts after learner setup.",
      cta: "Review",
      state: hasActiveLearner ? "derived" : "empty",
    },
  ];

  const healthCards: PlanMetricCardProps[] = [
    {
      label: "Active blocks",
      value: planState === "loading" ? "" : planState === "live" ? String(totalWeekBlocks) : hasActiveLearner ? "Preview" : "0",
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
      value: planState === "loading" ? "" : planState === "live" ? String(completedActions) : hasActiveLearner ? "Preview" : "0",
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
      value: planState === "loading" ? "" : planState === "live" ? String(openDays) : hasActiveLearner ? "Preview" : "0",
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
          title: "Start by choosing a learner",
          note: "Once a learner is in focus, My Plan can show the week visually and keep the next step close.",
          ctaHref: "/profile",
          ctaLabel: "Open My Profile",
          state: "empty" as HomeSurfaceState,
        }
      : planState === "live" && openDays > 0
        ? {
            title: `Shape ${activeLearnerName}'s week visually`,
            note: "Start with one clear focus and one or two learning blocks. The rest can stay flexible.",
            ctaHref: "/my-plan",
            ctaLabel: "Continue planning",
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
              note: "Use one small learning block to make the week feel settled without overplanning it.",
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
                captureHref={`/capture?learner=${encodeURIComponent(activeLearner?.id || "")}&date=${encodeURIComponent(key)}`}
                renderBlockCurriculum={(block) => (
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Linked outcomes
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingCurriculumBlockId((current) => (current === block.id ? null : block.id))}
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        {block.curriculumOutcomeIds.length ? "Edit curriculum" : "Add curriculum"}
                      </button>
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
                  editingCurriculumBlockId === block.id ? (
                    <CurriculumAttachPanel
                      preset={preset}
                      selectedOutcomeIds={block.curriculumOutcomeIds}
                      onApply={(outcomeIds) => void saveBlockCurriculum(block.id, outcomeIds)}
                      onCancel={() => setEditingCurriculumBlockId(null)}
                      state={planState}
                    />
                  ) : null
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
