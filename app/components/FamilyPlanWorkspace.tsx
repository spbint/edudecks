"use client";

import React, { useEffect, useState } from "react";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";
import {
  HomeSectionHeader,
  type HomeSurfaceState,
  type LearnerOption,
  LearnerSelector,
} from "@/app/components/home/HomeOverviewComponents";
import {
  PlanActionCard,
  PlanListCard,
  PlanMetricCard,
  type PlanMetricCardProps,
  PlanNextMoveCard,
  WeeklyRhythmCard,
  type WeeklyRhythmDay,
} from "@/app/components/plan/PlanOverviewComponents";
import {
  loadFamilyCalendarWindow,
  loadFamilyWeeklyPlan,
  type FamilyCalendarWindow,
  type FamilyWeeklyPlan,
} from "@/lib/familyPlanner";

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

export default function FamilyPlanWorkspace() {
  const { workspace, activeLearner, loading: workspaceLoading, setActiveLearner } = useFamilyWorkspace();
  const [weeklyPlan, setWeeklyPlan] = useState<FamilyWeeklyPlan | null>(null);
  const [calendarWindow, setCalendarWindow] = useState<FamilyCalendarWindow | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [planError, setPlanError] = useState("");

  const learnerOptions: LearnerOption[] = workspace.learners.map((learner) => ({
    id: learner.id,
    label: learner.label,
    note: learner.yearLabel || "Learner",
  }));

  const hasLearners = workspace.learners.length > 0;
  const hasActiveLearner = Boolean(activeLearner);
  const activeLearnerName = activeLearner?.label || "your learner";
  const currentWeek = getBusinessWeek(new Date());
  const weekKey = getWeekKeyFromDate(ymd(currentWeek[0]));
  const weekStart = ymd(currentWeek[0]);
  const weekEnd = ymd(currentWeek[currentWeek.length - 1]);

  const canonicalReady =
    Boolean(workspace.userId) &&
    workspace.storageMode === "database" &&
    Boolean(workspace.profile?.id) &&
    workspace.profile.id !== "local" &&
    Boolean(activeLearner?.id);

  useEffect(() => {
    let mounted = true;

    async function hydratePlan() {
      if (!canonicalReady || !activeLearner?.id) {
        if (mounted) {
          setWeeklyPlan(null);
          setCalendarWindow(null);
          setLoadingPlan(false);
          setPlanError("");
        }
        return;
      }

      try {
        setLoadingPlan(true);
        setPlanError("");

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
        setWeeklyPlan(plan);
        setCalendarWindow(calendar);
      } catch (error: any) {
        if (!mounted) return;
        setWeeklyPlan(null);
        setCalendarWindow(null);
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

  const totalWeekBlocks = currentWeek.reduce(
    (count, day) => count + (calendarWindow?.blocks?.[ymd(day)]?.length ?? 0),
    0,
  );
  const completedActions = weeklyPlan?.actions.filter((action) => action.completed).length ?? 0;
  const activeActions = weeklyPlan?.actions.filter((action) => !action.completed).length ?? 0;
  const openDays = currentWeek.filter((day) => (calendarWindow?.blocks?.[ymd(day)]?.length ?? 0) === 0).length;

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

  const readinessValue =
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
          : "Choose learner";

  const planSummaryCards: PlanMetricCardProps[] = [
    {
      label: "Current focus",
      value:
        planState === "loading"
          ? ""
          : weeklyPlan?.focusTitle || (hasActiveLearner ? "Ready to shape" : "Not set"),
      note:
        planState === "live"
          ? weeklyPlan?.selectedGoal || `Keep ${activeLearnerName}'s week gently in view`
          : hasActiveLearner
            ? `Shape one clear focus for ${activeLearnerName}`
            : "Add your first learner to begin",
      state: planState,
      accent: "blue" as const,
    },
    {
      label: "Readiness",
      value: readinessValue,
      note:
        planState === "live"
          ? `${openDays} open day${openDays === 1 ? "" : "s"} still available this week`
          : hasActiveLearner
            ? `Use one or two blocks to settle ${activeLearnerName}'s rhythm`
            : "Choose a learner to see readiness",
      state: planState === "live" ? "derived" : planState,
      accent: "violet" as const,
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
          ? `${Math.max(activeActions, totalWeekBlocks)} block${Math.max(activeActions, totalWeekBlocks) === 1 ? "" : "s"} in motion`
          : hasActiveLearner
            ? `Weekly blocks for ${activeLearnerName} will appear here`
            : "Add your first block to begin",
      state: planState === "live" ? "live" : planState,
      accent: "emerald" as const,
    },
  ];

  const currentFocusItems =
    planState === "live"
      ? [
          ...(weeklyPlan?.focusTitle
            ? [
                {
                  title: weeklyPlan.focusTitle,
                  meta: weeklyPlan.focusSummary || weeklyPlan.selectedGoal || "Weekly focus",
                  status: "Active",
                },
              ]
            : []),
          ...(weeklyPlan?.actions
            .filter((action) => !action.completed)
            .slice(0, 2)
            .map((action) => ({
              title: action.title,
              meta: action.description || "Current planning action",
              status: action.category,
            })) ?? []),
        ]
      : [];

  const comingNextItems =
    planState === "live"
      ? currentWeek
          .flatMap((day) =>
            (calendarWindow?.blocks?.[ymd(day)] ?? []).map((block) => ({
              title: block.title,
              meta: [
                day.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" }),
                block.subject,
                block.time,
              ]
                .filter(Boolean)
                .join(" • "),
              status: "Planned",
            })),
          )
          .slice(0, 3)
      : [];

  const weeklyRhythmDays: WeeklyRhythmDay[] = currentWeek.map((day) => {
    const key = ymd(day);
    const blocks = (calendarWindow?.blocks?.[key] ?? []).map((block) => ({
      title: block.title,
      subject: block.subject,
      time: block.time,
    }));

    return {
      id: key,
      label: day.toLocaleDateString("en-AU", { weekday: "short" }),
      dateLabel: day.toLocaleDateString("en-AU", { day: "numeric", month: "short" }),
      blocks,
      note: calendarWindow?.dayNotes?.[key] || "",
      today: key === ymd(new Date()),
    };
  });

  const quickActions: Array<{
    href: string;
    icon: string;
    label: string;
    note: string;
    cta: string;
    state: HomeSurfaceState;
  }> = [
    {
      href: "/calendar",
      icon: "PL",
      label: "Continue planning",
      note: hasActiveLearner ? `Keep ${activeLearnerName}'s week visible and easy to adjust.` : "Choose a learner to continue.",
      cta: "Open",
      state: hasActiveLearner ? planState : "empty",
    },
    {
      href: "/calendar",
      icon: "LB",
      label: "Add learning block",
      note: hasActiveLearner ? `Place one meaningful block for ${activeLearnerName}.` : "Add a learner before shaping the week.",
      cta: "Add",
      state: hasActiveLearner ? planState : "empty",
    },
    {
      href: "/calendar",
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
      note: hasActiveLearner ? `Use new evidence to sharpen ${activeLearnerName}'s next step.` : "Capture starts after learner setup.",
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
          ? `${totalWeekBlocks} block${totalWeekBlocks === 1 ? "" : "s"} placed across the week`
          : hasActiveLearner
            ? "Weekly blocks will sharpen as planner data grows"
            : "Your first block will appear here",
      state: planState,
      accent: "blue" as const,
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
      accent: "emerald" as const,
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
      accent: "amber" as const,
    },
    {
      label: "Last updated",
      value: planState === "loading" ? "" : relativeTimeLabel(weeklyPlan?.updatedAt || activeLearner?.connectedAt),
      note:
        planState === "live"
          ? "Based on the latest saved weekly plan"
          : hasActiveLearner
            ? "Plan updates will appear once saved"
            : "No planning activity yet",
      state: planState === "live" ? "live" : planState,
      accent: "violet" as const,
    },
  ];

  const nextMove =
    !hasActiveLearner
      ? {
          title: "Start by choosing a learner",
          note: "Once a learner is in focus, My Plan can show what is active now and what should come next.",
          ctaHref: "/profile",
          ctaLabel: "Open My Profile",
          state: "empty" as HomeSurfaceState,
        }
      : planState === "live" && openDays > 0
        ? {
            title: `Add one more block for ${activeLearnerName}`,
            note: "Use one small learning block to make the week feel settled without overplanning it.",
            ctaHref: "/calendar",
            ctaLabel: "Adjust this week",
            state: "live" as HomeSurfaceState,
          }
        : planState === "live"
          ? {
              title: `Capture evidence for ${activeLearnerName}`,
              note: "The plan is visible. A fresh capture will make the next report and progress view stronger.",
              ctaHref: "/capture",
              ctaLabel: "Add learning evidence",
              state: "derived" as HomeSurfaceState,
            }
          : {
              title: `Shape ${activeLearnerName}'s first weekly rhythm`,
              note: "Start with one clear focus and one or two learning blocks. The rest can stay flexible.",
              ctaHref: "/calendar",
              ctaLabel: "Continue planning",
              state: hasActiveLearner ? "placeholder" as HomeSurfaceState : "empty" as HomeSurfaceState,
            };

  return (
    <FamilyTopNavShell
      title="MyLearna"
      subtitle="My Plan"
      heroTitle="My Plan"
      heroText="A calm place to shape what’s active now and what comes next."
      hideHeroAside={true}
    >
      <div className="grid gap-6 pb-14">
        {planError ? (
          <section className="rounded-[22px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-900 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            {planError}
          </section>
        ) : null}

        <LearnerSelector
          familyName={workspace.profile.family_display_name || "Your family"}
          learners={learnerOptions}
          activeLearnerId={activeLearner?.id}
          onSelectLearner={setActiveLearner}
          state={learnerSelectorState}
        />

        <section className="grid gap-4 lg:grid-cols-3">
          {planSummaryCards.map((card) => (
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

        <section className="grid gap-4 xl:grid-cols-2">
          <PlanListCard
            eyebrow="Current focus"
            title="What is active now"
            note={hasActiveLearner ? `Keep ${activeLearnerName}'s current focus visible and easy to continue.` : "Choose a learner to begin."}
            items={currentFocusItems}
            state={planState}
            emptyTitle={hasActiveLearner ? "Start your first focus" : "No learner selected"}
            emptyNote={
              hasActiveLearner
                ? "Pick one weekly focus and one or two actions to make the next step visible."
                : "Add or choose a learner to begin planning."
            }
            ctaLabel="Continue"
            ctaHref="/calendar"
          />

          <PlanListCard
            eyebrow="Coming next"
            title="What comes next"
            note={hasActiveLearner ? `See the next blocks and open space for ${activeLearnerName}.` : "The next step appears here once a learner is in focus."}
            items={comingNextItems}
            state={planState}
            emptyTitle={hasActiveLearner ? "This week is still open" : "No upcoming blocks yet"}
            emptyNote={
              hasActiveLearner
                ? "Add one small learning block to begin shaping the week gently."
                : "Choose a learner to preview what comes next."
            }
            ctaLabel="Open week"
            ctaHref="/calendar"
          />
        </section>

        <WeeklyRhythmCard state={planState} days={weeklyRhythmDays} ctaHref="/calendar" />

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
