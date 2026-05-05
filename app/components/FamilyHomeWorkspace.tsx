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
  OnboardingConfidenceCard,
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
  const activeLearnerName = activeLearner?.label || "your learner";
  const syncedWorkspace = workspace.storageMode === "database";

  const readinessState: HomeSurfaceState = loading
    ? "loading"
    : hasActiveLearner
      ? "derived"
      : "empty";

  const workspaceState: HomeSurfaceState = loading
    ? "loading"
    : hasLearners
      ? syncedWorkspace
        ? "derived"
        : "placeholder"
      : "empty";

  const progressPercent = loading
    ? 32
    : hasActiveLearner
      ? syncedWorkspace
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
      value: loading ? "" : hasActiveLearner ? "Ready for one small step" : "Choose a learner",
      note: hasActiveLearner
        ? `${activeLearnerName} is in focus and ready for the next useful move`
        : "A single learner is enough to begin",
      state: readinessState,
    },
    {
      label: "Evidence",
      value: loading ? "" : hasActiveLearner ? "Capture the next moment" : "Start gently",
      note: hasActiveLearner
        ? `One short record is enough to keep ${activeLearnerName}'s story moving`
        : "You do not need a full record on day one",
      state: hasActiveLearner ? "derived" : "empty",
    },
    {
      label: "Weekly rhythm",
      value: loading ? "" : hasActiveLearner ? "Ready to shape" : "Later is fine",
      note: hasActiveLearner
        ? `Plan lightly around what matters most for ${activeLearnerName}`
        : "The calendar can wait until a learner is linked",
      state: hasActiveLearner ? "placeholder" : "empty",
    },
    {
      label: "Next step",
      value: loading ? "" : hasActiveLearner ? "Add evidence" : "Add learner",
      note: hasActiveLearner
        ? `Capture one useful moment for ${activeLearnerName}`
        : "Set the first learner and let the rest grow later",
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
            label: syncedWorkspace
              ? `${activeLearnerName} is in your synced family workspace`
              : `${activeLearnerName} is in your local family setup`,
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
        href: "/my-day",
        cta: "Please wait",
      }
    : !hasLearners
      ? {
          state: "empty" as HomeSurfaceState,
          title: "Add your first learner",
          note: "One learner is enough to make planning, capture, portfolio, and reports feel connected.",
          href: "/children/new",
          cta: "Add learner",
        }
      : !syncedWorkspace
        ? {
            state: "placeholder" as HomeSurfaceState,
            title: "Finish the family setup gently",
            note: "A synced workspace will make the evidence, portfolio, and report loop easier to trust.",
            href: "/settings",
            cta: "Open settings",
          }
        : {
            state: "derived" as HomeSurfaceState,
            title: `Add a fresh learning moment for ${activeLearnerName}`,
            note: "Capture one recent piece of learning while it is still easy to describe in natural family language.",
            href: "/capture",
            cta: "Add learning evidence",
          };

  const confidenceCard = loading
    ? {
        title: "Preparing your family view",
        note: "Loading the gentlest next path through planning, evidence, portfolio, and reports.",
        bullets: [
          "Start with one learner.",
          "Capture one simple learning moment.",
          "Let the record grow from there.",
        ],
        primaryHref: "/family",
        primaryLabel: "Loading...",
        secondaryHref: "/start",
        secondaryLabel: "Guided start",
        state: "loading" as HomeSurfaceState,
      }
    : !hasLearners
      ? {
          title: "Set one learner and keep the rest light",
          note: "You do not need the whole system today. One learner is enough to make the family workflow start feeling real.",
          bullets: [
            "Add one learner profile.",
            "Capture one simple learning moment.",
            "Review the portfolio only after a few real moments exist.",
          ],
          primaryHref: "/children/new",
          primaryLabel: "Add first learner",
          secondaryHref: "/start",
          secondaryLabel: "See guided start",
          state: "empty" as HomeSurfaceState,
        }
      : !syncedWorkspace
        ? {
            title: "Your family space is taking shape",
            note: "You can still explore, but syncing the workspace will make the planning, evidence, and report loop easier to trust.",
            bullets: [
              "Review the family setup and preferred market.",
              "Choose a gentle weekly rhythm when ready.",
              "Add one piece of evidence before expecting a full report.",
            ],
            primaryHref: "/settings",
            primaryLabel: "Review setup",
            secondaryHref: "/capture",
            secondaryLabel: "Add evidence",
            state: "placeholder" as HomeSurfaceState,
          }
        : {
            title: "Keep the learning story moving",
            note: "You already have enough to keep the loop calm: plan lightly, capture naturally, and review the strongest moments before reporting.",
            bullets: [
              "Shape the next week in My Calendar.",
              "Capture one useful moment while it is fresh.",
              "Review highlights in Portfolio before Reports.",
            ],
            primaryHref: "/capture",
            primaryLabel: "Add evidence",
            secondaryHref: "/my-portfolio",
            secondaryLabel: "Open My Portfolio",
            state: "derived" as HomeSurfaceState,
          };

  return (
    <FamilyTopNavShell
      title="MyLearna"
      subtitle="My Day"
      heroTitle="My Family Overview"
      heroText="A calm overview of what matters now, what can wait, and the next useful family step."
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

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_420px]">
          <OnboardingConfidenceCard
            title={confidenceCard.title}
            note={confidenceCard.note}
            bullets={confidenceCard.bullets}
            primaryHref={confidenceCard.primaryHref}
            primaryLabel={confidenceCard.primaryLabel}
            secondaryHref={confidenceCard.secondaryHref}
            secondaryLabel={confidenceCard.secondaryLabel}
            state={confidenceCard.state}
          />
          <NextBestMoveCard
            title={nextMove.title}
            note={nextMove.note}
            href={nextMove.href}
            cta={nextMove.cta}
            state={nextMove.state}
          />
        </section>

        <section className="grid gap-4">
          <HomeSectionHeader eyebrow="Quick actions" title="Start with one clear step" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <QuickActionCard
              href="/my-calendar"
              icon="MC"
              label="Open My Calendar"
              note={hasActiveLearner ? `Shape a simple weekly rhythm for ${activeLearnerName}` : "Open this once the first learner is set"}
              cta="Continue"
            />
            <QuickActionCard
              href="/capture"
              icon="EV"
              label="Add learning evidence"
              note={hasActiveLearner ? `Capture one fresh moment for ${activeLearnerName}` : "Ready as soon as a learner is linked"}
              cta="Add"
            />
            <QuickActionCard
              href="/my-portfolio"
              icon="PO"
              label="Review My Portfolio"
              note={hasActiveLearner ? `Keep ${activeLearnerName}'s learning story visible` : "Portfolio becomes useful after the first few moments"}
              cta="Review"
            />
            <QuickActionCard
              href="/my-reports"
              icon="RP"
              label="Build report"
              note={hasActiveLearner ? `Turn ${activeLearnerName}'s strongest moments into output` : "Reports can wait until the record feels real"}
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
              note={hasActiveLearner ? `${activeLearnerName}'s confidence is building steadily` : "Add one learner to begin"}
              progress={progressPercent}
              state={readinessState}
            />
            <MetricCard
              label="Evidence captured"
              value={hasActiveLearner ? "Building" : "Start"}
              note={hasActiveLearner ? `One or two real moments are enough to begin ${activeLearnerName}'s record` : "Your first capture will appear here"}
              progress={evidencePercent}
              state={hasActiveLearner ? "placeholder" : "empty"}
            />
            <MetricCard
              label="Active plans"
              value={hasActiveLearner ? "Taking shape" : "Later"}
              note={hasActiveLearner ? `Weekly rhythm can stay light while ${activeLearnerName}'s record grows` : "Planning can wait until the learner is linked"}
              progress={plansPercent}
              state={hasActiveLearner ? "derived" : "empty"}
            />
            <MetricCard
              label="Reports ready"
              value={hasActiveLearner ? "Growing" : "Later"}
              note={hasActiveLearner ? `Reporting readiness will sharpen as the evidence body grows` : "Reports become useful after a few real entries"}
              progress={reportsPercent}
              state={hasActiveLearner ? "placeholder" : "empty"}
            />
          </div>
        </section>

        <section className="grid gap-4">
          <HomeSectionHeader eyebrow="Core spaces" title="Go straight to the right space" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SpaceCard
              title="My Calendar"
              note={hasActiveLearner ? `Weekly rhythm and next blocks for ${activeLearnerName}.` : "Weekly rhythm and the next planned blocks."}
              href="/my-calendar"
              cta="Open"
              state={hasActiveLearner ? "derived" : "empty"}
              pill={hasActiveLearner ? "Active" : "Setup"}
            />
            <SpaceCard
              title="My Portfolio"
              note={hasActiveLearner ? `Review ${activeLearnerName}'s learning story and strongest moments.` : "Review evidence and keep the learning story visible."}
              href="/my-portfolio"
              cta="Review"
              state={hasActiveLearner ? "placeholder" : "empty"}
              pill="Story"
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

        <RecentActivityList
          items={recentActivity}
          state={loading ? "loading" : hasLearners ? "derived" : "empty"}
          emptyTitle="No activity yet"
          emptyNote="Add one learner to start building a calm family record."
        />
      </div>
    </FamilyTopNavShell>
  );
}
