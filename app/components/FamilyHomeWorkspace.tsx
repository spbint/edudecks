"use client";

import React from "react";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";
import {
  type CompactStat,
  HomeHeroSummaryCard,
  HomeSectionHeader,
  MetricCard,
  NextBestMoveCard,
  QuickActionCard,
  RecentActivityList,
  SpaceCard,
  type HomeSurfaceState,
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
  const { workspace, activeLearner, loading } = useFamilyWorkspace();

  const hasLearners = workspace.learners.length > 0;
  const hasActiveLearner = Boolean(activeLearner);

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

  const progressPercent = loading ? 32 : hasActiveLearner ? (workspace.storageMode === "database" ? 72 : 58) : 16;
  const evidencePercent = loading ? 18 : hasActiveLearner ? 48 : 8;
  const plansPercent = loading ? 24 : hasActiveLearner ? 42 : 10;
  const reportsPercent = loading ? 12 : hasActiveLearner ? 36 : 6;

  const heroStats: CompactStat[] = [
    {
      label: "Current learner",
      value: activeLearner?.label || "Not set",
      note: hasActiveLearner ? activeLearner?.yearLabel || "Learner in focus" : "Choose a learner",
      state: readinessState,
    },
    {
      label: "Readiness",
      value: loading ? "" : hasActiveLearner ? "On track" : "Getting started",
      note: hasActiveLearner ? "Ready for the next move" : "Add family context first",
      state: readinessState,
    },
    {
      label: "Last capture",
      value: loading ? "" : hasActiveLearner ? "Awaiting sync" : "No activity yet",
      note: hasActiveLearner ? "Capture will appear here" : "Start with one moment",
      state: hasActiveLearner ? "placeholder" : "empty",
    },
    {
      label: "Active plan count",
      value: loading ? "" : hasActiveLearner ? "2" : "0",
      note: hasActiveLearner ? "Preview while planning data matures" : "Your first plan will appear here",
      state: hasActiveLearner ? "placeholder" : "empty",
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
                ? "Family workspace synced"
                : "Local family snapshot available",
            tag: "Workspace",
            time: "Today",
          },
          ...workspace.learners
            .filter((learner) => learner.connectedAt)
            .slice(0, 1)
            .map((learner) => ({
              label: `${learner.label} added`,
              tag: "Learner",
              time: relativeTimeLabel(learner.connectedAt),
            })),
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
            cta: "Open settings",
          }
        : {
            state: "derived" as HomeSurfaceState,
            title: "Add a fresh learning moment",
            note: "Capture one recent piece of learning while it is still easy to describe.",
            href: "/capture",
            cta: "Add learning evidence",
          };

  return (
    <FamilyTopNavShell
      title="MyLearna"
      subtitle="My Learning"
      heroTitle="My Learning"
      heroText="A calm overview of what’s active, ready, and next."
      hideHeroAside={true}
    >
      <div className="grid gap-6 pb-14">
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_360px]">
          <div className="grid gap-4 rounded-[28px] border border-blue-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(239,246,255,0.94)_60%,rgba(245,243,255,0.92)_100%)] p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <div className="grid gap-2">
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
                My Learning
              </div>
              <h1 className="text-[34px] font-black tracking-tight text-slate-950">
                My Learning
              </h1>
              <p className="text-sm leading-7 text-slate-600">
                A calm overview of what’s active, ready, and next.
              </p>
            </div>
          </div>

          <HomeHeroSummaryCard
            familyName={workspace.profile.family_display_name || "Your family"}
            stats={heroStats}
            state={workspaceState}
          />
        </section>

        <section className="grid gap-4">
          <HomeSectionHeader eyebrow="Quick actions" title="Start with one clear step" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <QuickActionCard
              href="/my-plan"
              icon="MP"
              label="Continue My Plan"
              note={hasActiveLearner ? "Keep the week visible" : "Start after learner setup"}
              cta="Continue"
            />
            <QuickActionCard
              href="/capture"
              icon="MC"
              label="Add learning evidence"
              note={hasActiveLearner ? "Capture a fresh moment" : "Ready when your learner is set"}
              cta="Add"
            />
            <QuickActionCard
              href="/my-portfolio"
              icon="PO"
              label="Review My Portfolio"
              note="Keep the story visible"
              cta="Review"
            />
            <QuickActionCard
              href="/my-reports"
              icon="MR"
              label="Build report"
              note="Turn evidence into output"
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
              note={hasActiveLearner ? "Readiness is building steadily" : "Add a learner to begin"}
              progress={progressPercent}
              state={readinessState}
            />
            <MetricCard
              label="Evidence captured"
              value={hasActiveLearner ? "Preview" : "0"}
              note={hasActiveLearner ? "Real evidence counts will appear here" : "Your first capture will appear here"}
              progress={evidencePercent}
              state={hasActiveLearner ? "placeholder" : "empty"}
            />
            <MetricCard
              label="Active plans"
              value={hasActiveLearner ? "2" : "0"}
              note={hasActiveLearner ? "Derived from the current family rhythm" : "No plans yet"}
              progress={plansPercent}
              state={hasActiveLearner ? "derived" : "empty"}
            />
            <MetricCard
              label="Reports ready"
              value={hasActiveLearner ? "Preview" : "0"}
              note={hasActiveLearner ? "Reporting readiness will sharpen as data grows" : "Your first report will appear here"}
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
              note="Weekly rhythm and the next planned blocks."
              href="/my-plan"
              cta="Open"
              state={hasActiveLearner ? "derived" : "empty"}
              pill={hasActiveLearner ? "Active" : "Setup"}
            />
            <SpaceCard
              title="My Portfolio"
              note="Review evidence and keep the learning story visible."
              href="/my-portfolio"
              cta="Review"
              state={hasActiveLearner ? "placeholder" : "empty"}
              pill="Ready"
            />
            <SpaceCard
              title="My Reports"
              note="Build summaries and formal outputs from current records."
              href="/my-reports"
              cta="Build"
              state={hasActiveLearner ? "placeholder" : "empty"}
              pill="Output"
            />
            <SpaceCard
              title="My Progress"
              note="See readiness, coverage snapshot, and suggested improvements."
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
