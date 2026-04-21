"use client";

import React from "react";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";
import {
  type CompactStat,
  HomeSectionHeader,
  type HomeSurfaceState,
  type LearnerOption,
  LearnerSelector,
  LearnerSummaryRow,
  MetricCard,
  NextBestMoveCard,
  QuickActionCard,
  RecentActivityList,
  SpaceCard,
} from "@/app/components/home/HomeOverviewComponents";

function relativeTimeLabel(value?: string | null) {
  if (!value) return "Recently";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Recently";

  const diffMs = Date.now() - parsed.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours <= 24) return "Today";
  if (diffDays <= 7) return `${diffDays}d ago`;
  return parsed.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

export default function FamilyHomeWorkspace() {
  const { workspace, activeLearner, loading, setActiveLearner } = useFamilyWorkspace();

  const hasLearners = workspace.learners.length > 0;
  const hasActiveLearner = Boolean(activeLearner);
  const activeLearnerName = activeLearner?.label || "No learner selected";

  const readinessState: HomeSurfaceState = loading
    ? "loading"
    : hasActiveLearner
      ? "derived"
      : "empty";

  const workspaceState: HomeSurfaceState = loading
    ? "loading"
    : hasLearners
      ? workspace.storageMode === "database"
        ? "derived"
        : "placeholder"
      : "empty";

  const progressPercent = loading
    ? 32
    : hasActiveLearner
      ? workspace.storageMode === "database"
        ? 72
        : 58
      : 16;
  const evidencePercent = loading ? 18 : hasActiveLearner ? 48 : 8;
  const plansPercent = loading ? 24 : hasActiveLearner ? 42 : 10;
  const reportsPercent = loading ? 12 : hasActiveLearner ? 36 : 6;

  const learnerOptions: LearnerOption[] = workspace.learners.map((learner) => ({
    id: learner.id,
    label: learner.label,
    note: learner.yearLabel || "Learner",
  }));

  const heroStats: CompactStat[] = [
    {
      label: "Readiness",
      value: loading ? "" : hasActiveLearner ? "On track" : "Getting started",
      note: hasActiveLearner ? `${activeLearnerName} is ready for the next move` : "Choose a learner",
      state: readinessState,
    },
    {
      label: "Last Capture",
      value: loading ? "" : hasActiveLearner ? "Awaiting sync" : "No activity yet",
      note: hasActiveLearner ? `${activeLearnerName} has no recent capture yet` : "Start with one moment",
      state: hasActiveLearner ? "placeholder" : "empty",
    },
    {
      label: "My Plans",
      value: loading ? "" : hasActiveLearner ? "2" : "0",
      note: hasActiveLearner
        ? `Preview while ${activeLearnerName}'s planning data matures`
        : "Your first plan will appear here",
      state: hasActiveLearner ? "placeholder" : "empty",
    },
    {
      label: "Next Step",
      value: loading ? "" : hasActiveLearner ? "Add evidence" : "Set learner",
      note: hasActiveLearner ? `Capture a fresh moment for ${activeLearnerName}` : "Choose who you're reviewing",
      state: hasActiveLearner ? "derived" : "empty",
    },
  ];

  const recentActivity = loading
    ? []
    : hasLearners
      ? [
          {
            label: activeLearner ? `${activeLearner.label} is in focus` : "Family context is ready",
            tag: "Context",
            time: "Now",
          },
          {
            label:
              workspace.storageMode === "database"
                ? `${activeLearnerName} is in your synced workspace`
                : `${activeLearnerName} is in your local snapshot`,
            tag: "Learner",
            time: "Today",
          },
          ...(activeLearner?.connectedAt
            ? [
                {
                  label: `${activeLearner.label} joined your family workspace`,
                  tag: "Timeline",
                  time: relativeTimeLabel(activeLearner.connectedAt),
                },
              ]
            : []),
        ].slice(0, 3)
      : [];

  const nextMove = loading
    ? {
        state: "loading" as HomeSurfaceState,
        title: "Preparing your next move",
        note: "Loading your family overview.",
        href: "/home",
        cta: "Please wait",
      }
    : !hasLearners
      ? {
          state: "empty" as HomeSurfaceState,
          title: "Add your first learner",
          note: "Set learner context first so planning, capture, and reports have somewhere to begin.",
          href: "/children/new",
          cta: "Add learner",
        }
      : workspace.storageMode !== "database"
        ? {
            state: "placeholder" as HomeSurfaceState,
            title: "Review your family setup",
            note: "A synced workspace will make planning, evidence, and reporting easier to keep together.",
            href: "/settings",
            cta: "Open My Settings",
          }
        : {
            state: "derived" as HomeSurfaceState,
            title: `Add a fresh learning moment for ${activeLearnerName}`,
            note: "Capture one recent piece of learning while it is still easy to describe.",
            href: "/capture",
            cta: "Add learning evidence",
          };

  return (
    <FamilyTopNavShell
      title="MyLearna"
      subtitle="My Learning"
      heroTitle="Family Overview"
      heroText="A calm overview of what’s active, ready, and next."
      hideHeroAside={true}
    >
      <div className="grid gap-5 pb-14">
        <LearnerSelector
          familyName={workspace.profile.family_display_name || "Your family"}
          learners={learnerOptions}
          activeLearnerId={activeLearner?.id}
          onSelectLearner={setActiveLearner}
          state={workspaceState}
        />

        <LearnerSummaryRow stats={heroStats} state={workspaceState} />

        <section className="grid gap-4">
          <HomeSectionHeader eyebrow="Quick actions" title="Start with one clear step" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <QuickActionCard
              href="/my-plan"
              icon="MP"
              label="Continue My Plan"
              note={hasActiveLearner ? `Plan next steps for ${activeLearnerName}` : "Start after learner setup"}
              cta="Continue"
            />
            <QuickActionCard
              href="/capture"
              icon="MC"
              label="Add learning evidence"
              note={hasActiveLearner ? `Capture a fresh moment for ${activeLearnerName}` : "Ready when your learner is set"}
              cta="Add"
            />
            <QuickActionCard
              href="/my-portfolio"
              icon="PO"
              label="Review My Portfolio"
              note={hasActiveLearner ? `Review ${activeLearnerName}'s learning story` : "Keep the story visible"}
              cta="Review"
            />
            <QuickActionCard
              href="/my-reports"
              icon="MR"
              label="Build report"
              note={hasActiveLearner ? `Turn ${activeLearnerName}'s evidence into output` : "Turn evidence into output"}
              cta="Build"
            />
          </div>
        </section>

        <section className="grid gap-4">
          <HomeSectionHeader eyebrow="Key metrics" title="Fast signals" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Progress"
              value={hasActiveLearner ? `${progressPercent}%` : "Start"}
              note={hasActiveLearner ? `${activeLearnerName}'s readiness is building steadily` : "Add a learner to begin"}
              progress={progressPercent}
              state={readinessState}
            />
            <MetricCard
              label="Evidence captured"
              value={hasActiveLearner ? "Preview" : "0"}
              note={hasActiveLearner ? `Real capture counts for ${activeLearnerName} will appear here` : "Your first capture will appear here"}
              progress={evidencePercent}
              state={hasActiveLearner ? "placeholder" : "empty"}
            />
            <MetricCard
              label="Active plans"
              value={hasActiveLearner ? "2" : "0"}
              note={hasActiveLearner ? `Derived from ${activeLearnerName}'s current rhythm` : "No plans yet"}
              progress={plansPercent}
              state={hasActiveLearner ? "derived" : "empty"}
            />
            <MetricCard
              label="Reports ready"
              value={hasActiveLearner ? "Preview" : "0"}
              note={hasActiveLearner ? `Reporting readiness for ${activeLearnerName} will sharpen as data grows` : "Your first report will appear here"}
              progress={reportsPercent}
              state={hasActiveLearner ? "placeholder" : "empty"}
            />
          </div>
        </section>

        <section className="grid gap-4">
          <HomeSectionHeader eyebrow="Core spaces" title="Go straight to the right space" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SpaceCard
              title="My Plan"
              note={hasActiveLearner ? `Weekly rhythm and next blocks for ${activeLearnerName}.` : "Weekly rhythm and the next planned blocks."}
              href="/my-plan"
              cta="Open"
              state={hasActiveLearner ? "derived" : "empty"}
              pill={hasActiveLearner ? "Active" : "Setup"}
            />
            <SpaceCard
              title="My Portfolio"
              note={hasActiveLearner ? `Review ${activeLearnerName}'s evidence and learning story.` : "Review evidence and keep the learning story visible."}
              href="/my-portfolio"
              cta="Review"
              state={hasActiveLearner ? "placeholder" : "empty"}
              pill="Ready"
            />
            <SpaceCard
              title="My Reports"
              note={hasActiveLearner ? `Build summaries and outputs for ${activeLearnerName}.` : "Build summaries and formal outputs from current records."}
              href="/my-reports"
              cta="Build"
              state={hasActiveLearner ? "placeholder" : "empty"}
              pill="Output"
            />
            <SpaceCard
              title="My Progress"
              note={hasActiveLearner ? `See ${activeLearnerName}'s readiness and suggested improvements.` : "See readiness, coverage snapshot, and suggested improvements."}
              href="/my-progress"
              cta="Review"
              state={hasActiveLearner ? "derived" : "empty"}
              pill="Signals"
            />
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_420px]">
          <RecentActivityList
            items={recentActivity}
            state={loading ? "loading" : hasLearners ? "derived" : "empty"}
            emptyTitle="No activity yet"
            emptyNote="Add your first learner to start building a visible family record."
          />
          <NextBestMoveCard
            title={nextMove.title}
            note={nextMove.note}
            href={nextMove.href}
            cta={nextMove.cta}
            state={nextMove.state}
          />
        </section>
      </div>
    </FamilyTopNavShell>
  );
}
