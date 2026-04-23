"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import {
  type HomeSurfaceState,
  type LearnerOption,
  LearnerSelector,
} from "@/app/components/home/HomeOverviewComponents";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";
import {
  currentPeriodRangeLabel,
  loadReportsBuilderModel,
  nextReportCta,
  reportingModeLabel,
  type ArtifactStatus,
  type ReportsBuilderModel,
} from "@/lib/reporting";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function statusTone(status: ArtifactStatus) {
  if (status === "Ready") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "In progress") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function stateFromModel(input: {
  workspaceLoading: boolean;
  hasLearners: boolean;
  activeLearnerId: string;
  model: ReportsBuilderModel | null;
}): HomeSurfaceState {
  if (input.workspaceLoading || !input.model) return "loading";
  if (!input.hasLearners || !input.activeLearnerId) return "empty";
  if (input.model.registrationCycle || input.model.requiredArtifacts.length || input.model.reportDocument) {
    return "live";
  }
  return "placeholder";
}

function SummaryCard({
  status,
  sentence,
  completeCount,
  totalCount,
}: {
  status: ArtifactStatus;
  sentence: string;
  completeCount: number;
  totalCount: number;
}) {
  return (
    <section className="grid gap-4 rounded-[26px] border border-blue-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(239,246,255,0.94)_58%,rgba(248,250,252,0.96)_100%)] p-6 shadow-[0_14px_34px_rgba(15,23,42,0.05)] lg:grid-cols-[minmax(0,1.2fr)_220px]">
      <div className="grid gap-2">
        <div className="text-[12px] font-black uppercase tracking-[0.18em] text-slate-500">
          Reporting summary
        </div>
        <div className="text-[28px] font-black tracking-tight text-slate-950">{status}</div>
        <p className="max-w-[760px] text-[15px] leading-7 text-slate-600">{sentence}</p>
      </div>
      <div className="grid gap-3 rounded-[22px] border border-white/80 bg-white/80 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
        <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
          Required items
        </div>
        <div className="text-[30px] font-black tracking-tight text-slate-950">
          {completeCount}/{totalCount || 0}
        </div>
        <div className="text-sm leading-6 text-slate-600">
          {totalCount
            ? `${completeCount} artifact${completeCount === 1 ? "" : "s"} ready for this cycle`
            : "No jurisdiction artifact list has been published yet."}
        </div>
      </div>
    </section>
  );
}

function DetailCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
      <div className="grid gap-1.5">
        <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          {eyebrow}
        </div>
        <h2 className="text-[18px] font-bold tracking-tight text-slate-950">{title}</h2>
      </div>
      {children}
    </section>
  );
}

type FamilyReportsWorkspaceProps = {
  includeShell?: boolean;
};

export default function FamilyReportsWorkspace({
  includeShell = true,
}: FamilyReportsWorkspaceProps) {
  const {
    workspace,
    activeLearner,
    activeLearnerId,
    loading: workspaceLoading,
    setActiveLearner,
  } = useFamilyWorkspace();
  const [model, setModel] = useState<ReportsBuilderModel | null>(null);

  const learnerOptions: LearnerOption[] = workspace.learners.map((learner) => ({
    id: learner.id,
    label: learner.label,
    note: learner.yearLabel || "Learner",
  }));

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      const next = await loadReportsBuilderModel({
        profile: workspace.profile,
        learner: activeLearner,
        userId: workspace.userId,
        mode: "read",
      });

      if (mounted) {
        setModel(next);
      }
    }

    void hydrate();

    return () => {
      mounted = false;
    };
  }, [activeLearner, workspace.profile, workspace.userId]);

  const surfaceState = stateFromModel({
    workspaceLoading,
    hasLearners: workspace.learners.length > 0,
    activeLearnerId,
    model,
  });
  const learnerSelectorState: HomeSurfaceState = workspaceLoading
    ? "loading"
    : workspace.learners.length
      ? workspace.storageMode === "database"
        ? "derived"
        : "placeholder"
      : "empty";

  const cta = useMemo(() => nextReportCta(model ?? {
    learner: activeLearner,
    effectiveJurisdiction: null,
    ruleSet: null,
    registrationCycle: null,
    reportingPeriod: null,
    reportDocument: null,
    requiredArtifacts: [],
    readiness: {
      status: "Not started",
      sentence: "Your reporting workspace has not been started yet.",
      completeCount: 0,
      totalCount: 0,
    },
    planCount: 0,
    evidenceCount: 0,
    softWarning: "",
  }), [activeLearner, model]);

  const content = (
    <div className="grid gap-5 pb-14">
        <LearnerSelector
          familyName={workspace.profile.family_display_name || "My family"}
          learners={learnerOptions}
          activeLearnerId={activeLearnerId}
          onSelectLearner={setActiveLearner}
          state={learnerSelectorState}
        />

        {surfaceState === "loading" ? (
          <div className="grid gap-5">
            <div className="h-48 animate-pulse rounded-[26px] bg-slate-100" />
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="h-52 animate-pulse rounded-[24px] bg-slate-100" />
              <div className="h-52 animate-pulse rounded-[24px] bg-slate-100" />
            </div>
          </div>
        ) : !activeLearner ? (
          <DetailCard eyebrow="Reports workspace" title="Choose a learner to begin">
            <p className="text-sm leading-7 text-slate-600">
              The reporting builder needs one learner in focus so it can resolve the correct jurisdiction, cycle, and current reporting period.
            </p>
            <div>
              <Link
                href="/family"
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Open My Family
              </Link>
            </div>
          </DetailCard>
        ) : (
          <>
            {model?.softWarning ? (
              <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-7 text-amber-800">
                {model.softWarning}
              </div>
            ) : null}

            <SummaryCard
              status={model?.readiness.status || "Not started"}
              sentence={model?.readiness.sentence || "Your reporting workspace has not been started yet."}
              completeCount={model?.readiness.completeCount || 0}
              totalCount={model?.readiness.totalCount || 0}
            />

            <section className="grid gap-4 lg:grid-cols-2">
              <DetailCard eyebrow="Jurisdiction" title={model?.effectiveJurisdiction?.label || "Jurisdiction not resolved"}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-1">
                    <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                      Reporting mode
                    </div>
                    <div className="text-[16px] font-bold text-slate-950">
                      {model ? reportingModeLabel(model) : "Not available"}
                    </div>
                  </div>
                  <div className="grid gap-1">
                    <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                      Jurisdiction term
                    </div>
                    <div className="text-[16px] font-bold text-slate-950">
                      {model?.effectiveJurisdiction?.terminologyMode === "jurisdiction"
                        ? model.effectiveJurisdiction.label === "Queensland"
                          ? "Educational progress"
                          : model.effectiveJurisdiction.label === "New South Wales"
                            ? "Educational program"
                            : model.effectiveJurisdiction.label === "Victoria"
                              ? "Learning plan"
                              : model.effectiveJurisdiction.label === "South Australia"
                                ? "Exemption review"
                                : "Reporting workspace"
                        : "Reporting workspace"}
                    </div>
                  </div>
                </div>
                <div className="rounded-[18px] border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm leading-7 text-slate-600">
                  {model?.ruleSet
                    ? `${model.ruleSet.title} is the current rule set for ${model.effectiveJurisdiction?.label || "this learner"}.`
                    : "A current jurisdiction rule set could not be confirmed yet, so this workspace is keeping the guidance lighter."}
                </div>
              </DetailCard>

              <DetailCard eyebrow="Reporting period" title={model?.reportingPeriod?.label || "Current reporting period"}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-1">
                    <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                      Registration cycle
                    </div>
                    <div className="text-[16px] font-bold text-slate-950">
                      {model?.registrationCycle?.label || "Not found"}
                    </div>
                  </div>
                  <div className="grid gap-1">
                    <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                      Date range
                    </div>
                    <div className="text-[16px] font-bold text-slate-950">
                      {model ? currentPeriodRangeLabel(model) : "Not available"}
                    </div>
                  </div>
                </div>
                <div className="rounded-[18px] border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm leading-7 text-slate-600">
                  {model?.reportingPeriod
                    ? `${model.reportingPeriod.label} is the reporting window currently in view for ${activeLearner.label}.`
                    : "No reporting period has been created yet. The draft flow can create one when a current registration cycle exists."}
                </div>
              </DetailCard>
            </section>

            <DetailCard eyebrow="Required artifacts" title="What this jurisdiction expects">
              {model?.requiredArtifacts.length ? (
                <div className="grid gap-3">
                  {model.requiredArtifacts.map((artifact) => (
                    <div
                      key={artifact.id || artifact.label}
                      className="grid gap-3 rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-4 md:grid-cols-[minmax(0,1fr)_120px]"
                    >
                      <div className="grid gap-1">
                        <div className="text-[15px] font-bold text-slate-950">{artifact.label}</div>
                        <div className="text-[13px] leading-6 text-slate-500">
                          {artifact.frequency}
                          {artifact.note ? ` - ${artifact.note}` : ""}
                        </div>
                      </div>
                      <div className="flex items-start md:justify-end">
                        <span className={cx("inline-flex rounded-full border px-3 py-1.5 text-xs font-bold", statusTone(artifact.status))}>
                          {artifact.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-5 text-sm leading-7 text-slate-600">
                  No required artifact list is available yet for this jurisdiction and rule set.
                </div>
              )}
            </DetailCard>

            <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
              <DetailCard eyebrow="Readiness notes" title="What is already in place">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-[18px] border border-slate-200 bg-slate-50/80 px-4 py-4">
                    <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                      Plans in cycle
                    </div>
                    <div className="mt-2 text-[24px] font-black text-slate-950">{model?.planCount || 0}</div>
                  </div>
                  <div className="rounded-[18px] border border-slate-200 bg-slate-50/80 px-4 py-4">
                    <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                      Evidence in cycle
                    </div>
                    <div className="mt-2 text-[24px] font-black text-slate-950">{model?.evidenceCount || 0}</div>
                  </div>
                  <div className="rounded-[18px] border border-slate-200 bg-slate-50/80 px-4 py-4">
                    <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                      Report draft
                    </div>
                    <div className="mt-2 text-[24px] font-black text-slate-950">
                      {model?.reportDocument ? "Ready" : "Not yet"}
                    </div>
                  </div>
                </div>
                <p className="text-sm leading-7 text-slate-600">
                  These checks are intentionally simple for this first phase. They show whether the main planning, evidence, and reporting ingredients are visible for the current cycle, without claiming full compliance certainty yet.
                </p>
              </DetailCard>

              <aside className="grid gap-4 rounded-[24px] border border-blue-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(239,246,255,0.94)_60%,rgba(248,250,252,0.96)_100%)] p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                <div className="grid gap-1.5">
                  <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Next action
                  </div>
                  <h2 className="text-[18px] font-bold tracking-tight text-slate-950">{cta.label}</h2>
                </div>
                <p className="text-sm leading-7 text-slate-600">{cta.note}</p>
                <Link
                  href={cta.href}
                  className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  {cta.label}
                </Link>
              </aside>
            </section>
          </>
        )}
      </div>
  );

  if (!includeShell) {
    return content;
  }

  return (
    <FamilyTopNavShell
      subtitle="My Reports"
      heroTitle="Build the right report for the current reporting cycle"
      heroText="See what your jurisdiction expects, what has already been gathered, and the next calm step toward a trustworthy report draft."
      heroAsideTitle="Jurisdiction-aware builder"
      heroAsideText="This workspace reads your family and learner settings first, then shapes the reporting flow around the learner's effective jurisdiction."
    >
      {content}
    </FamilyTopNavShell>
  );
}
