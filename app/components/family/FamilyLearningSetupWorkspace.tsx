"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";
import {
  type HomeSurfaceState,
  type LearnerOption,
  LearnerSelector,
} from "@/app/components/home/HomeOverviewComponents";
import { AttendanceComplianceCard } from "@/app/components/family/compliance/AttendanceComplianceCard";
import { NotificationComplianceCard } from "@/app/components/family/compliance/NotificationComplianceCard";
import { SubjectsPlanComplianceCard } from "@/app/components/family/compliance/SubjectsPlanComplianceCard";
import {
  CountrySelector,
  CurriculumSetupEmptyState,
  FamilyLearningSetupCard,
  Field,
  FrameworkSelector,
  JurisdictionSelector,
  LearnerCurriculumSettingsCard,
  ReportingModeSelector,
  SettingsSaveBar,
} from "@/app/components/family/FamilyConfigurationComponents";
import {
  loadFamilyComplianceCommandCard,
  type FamilyComplianceCommandCardModel,
} from "@/lib/complianceCommandCard";
import {
  loadReportsBuilderModel,
  type ReportsBuilderModel,
} from "@/lib/reporting";
import {
  persistSettingsToLocalStorage,
  type FamilySettings,
} from "@/lib/familySettings";
import {
  persistLearnersToLocalCache,
  saveFamilyWorkspaceSettings,
  type FamilyLearner,
} from "@/lib/familyWorkspace";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function friendlyFamilySetupMessage() {
  return "Learning setup storage is still getting ready. Try saving again in a moment.";
}

function describeFamilySetupError(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  return friendlyFamilySetupMessage();
}

function defaultFrameworkForCountry(country: FamilySettings["country"] | "") {
  if (country === "us") return "us-common-core";
  if (country === "uk") return "uk-national";
  if (country === "other") return "custom-homeschool";
  if (country === "au") return "au-v9";
  return "";
}

function applyLocalLearnerPatch(
  learners: FamilyLearner[],
  learnerId: string,
  patch: {
    yearBand?: string | null;
    curriculum_framework_id?: string | null;
    curriculum_jurisdiction_id?: string | null;
    reporting_mode?: string | null;
  },
) {
  return learners.map((learner) =>
    learner.id === learnerId
      ? {
          ...learner,
          year_band:
            patch.yearBand === undefined ? learner.year_band ?? null : patch.yearBand,
          curriculum_framework_id:
            patch.curriculum_framework_id === undefined
              ? learner.curriculum_framework_id ?? null
              : patch.curriculum_framework_id,
          curriculum_jurisdiction_id:
            patch.curriculum_jurisdiction_id === undefined
              ? learner.curriculum_jurisdiction_id ?? null
              : patch.curriculum_jurisdiction_id,
          reporting_mode:
            patch.reporting_mode === undefined
              ? learner.reporting_mode ?? null
              : patch.reporting_mode,
        }
      : learner,
  );
}

function statusTone(status: FamilyComplianceCommandCardModel["readinessStatus"]) {
  if (status === "ready") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "warning") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function learnerSelectorState(
  loading: boolean,
  learners: FamilyLearner[],
  storageMode: string,
  syncIssue?: string,
): HomeSurfaceState {
  if (loading) return "loading";
  if (syncIssue && !learners.length) return "placeholder";
  if (!learners.length) return "empty";
  return storageMode === "database" ? "derived" : "placeholder";
}

function learnerOverridesDiffer(
  left: FamilyLearner,
  right: FamilyLearner | undefined,
) {
  if (!right) return false;

  return (
    safe(left.year_band) !== safe(right.year_band) ||
    safe(left.curriculum_framework_id) !== safe(right.curriculum_framework_id) ||
    safe(left.curriculum_jurisdiction_id) !== safe(right.curriculum_jurisdiction_id) ||
    safe(left.reporting_mode) !== safe(right.reporting_mode)
  );
}

function hasSyncedLearnerOverrideChanges(
  learnersDraft: FamilyLearner[],
  baselineLearners: FamilyLearner[],
) {
  const baselineById = new Map(
    baselineLearners.map((learner) => [learner.id, learner] as const),
  );

  return learnersDraft.some((learner) => {
    if (safe(learner.id).startsWith("local-")) return false;
    return learnerOverridesDiffer(learner, baselineById.get(learner.id));
  });
}

function ComplianceCommandCard({
  loading,
  model,
}: {
  loading: boolean;
  model: FamilyComplianceCommandCardModel | null;
}) {
  if (loading) {
    return (
      <section className="grid gap-4 rounded-[28px] border border-blue-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(239,246,255,0.94)_60%,rgba(248,250,252,0.96)_100%)] p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <div className="h-4 w-36 animate-pulse rounded-full bg-slate-200" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="grid gap-3">
            <div className="h-8 w-72 animate-pulse rounded-full bg-slate-200" />
            <div className="h-4 w-full animate-pulse rounded-full bg-slate-200" />
            <div className="h-4 w-5/6 animate-pulse rounded-full bg-slate-200" />
          </div>
          <div className="grid gap-3 rounded-[22px] border border-white/70 bg-white/80 p-5">
            <div className="h-4 w-20 animate-pulse rounded-full bg-slate-200" />
            <div className="h-8 w-16 animate-pulse rounded-full bg-slate-200" />
            <div className="h-4 w-28 animate-pulse rounded-full bg-slate-200" />
          </div>
        </div>
      </section>
    );
  }

  if (!model) {
    return (
      <section className="grid gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
        <div className="grid gap-1.5">
          <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Compliance readiness
          </div>
          <h2 className="text-[24px] font-black tracking-tight text-slate-950">
            Add a learner to start tracking readiness
          </h2>
        </div>
        <p className="max-w-[760px] text-sm leading-7 text-slate-600">
          The family command surface comes alive once one learner is linked and selected. It will then show the jurisdiction, reporting posture, and next best action for that learner.
        </p>
      </section>
    );
  }

  return (
    <section className="grid gap-5 rounded-[28px] border border-blue-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(239,246,255,0.94)_58%,rgba(248,250,252,0.96)_100%)] p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-1.5">
          <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Compliance readiness
          </div>
          <h2 className="text-[28px] font-black tracking-tight text-slate-950">
            {model.learnerName}
          </h2>
          <div className="text-sm leading-6 text-slate-600">
            {model.jurisdictionName || "Jurisdiction not resolved"}
          </div>
          <div className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700">
            {model.complianceModeLabel}
          </div>
        </div>
        <span
          className={cx(
            "inline-flex rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em]",
            statusTone(model.readinessStatus),
          )}
        >
          {model.readinessStatus.replace("_", " ")}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="grid gap-4">
          <p className="max-w-[760px] text-[15px] leading-7 text-slate-700">
            {model.summary}
          </p>
          <div className="rounded-[20px] border border-white/80 bg-white/80 p-4 text-sm leading-7 text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            {model.complianceSummary}
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_280px]">
            <div className="rounded-[22px] border border-white/80 bg-white/80 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                What matters most next
              </div>
              <div className="mt-2 text-[18px] font-bold tracking-tight text-slate-950">
                {model.nextAction || "Review the learner's compliance context"}
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-600">
                {model.helperNote}
              </div>
            </div>

            <div className="rounded-[22px] border border-white/80 bg-white/80 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                Top missing items
              </div>
              {model.topMissing.length ? (
                <div className="mt-3 grid gap-2">
                  {model.topMissing.map((item) => (
                    <div
                      key={item}
                      className="rounded-[14px] border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm leading-6 text-slate-700"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 rounded-[14px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm leading-6 text-emerald-800">
                  No urgent missing items are leading the queue right now.
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="grid gap-3 rounded-[24px] border border-white/80 bg-white/88 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              Readiness score
            </div>
            <div className="mt-2 text-[34px] font-black tracking-tight text-slate-950">
              {model.readinessScore}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              Learning setup
            </div>
            <div className="mt-2 text-sm font-bold text-slate-950">
              {model.complianceModeLabel}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              Next step
            </div>
            <div className="mt-2 text-sm font-bold text-slate-950">
              {model.primaryCta?.label || model.nextAction || "Keep setup current"}
            </div>
          </div>
          {model.primaryCta ? (
            <Link
              href={model.primaryCta.href}
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              {model.primaryCta.label}
            </Link>
          ) : null}
          {model.secondaryCta ? (
            <Link
              href={model.secondaryCta.href}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
            >
              {model.secondaryCta.label}
            </Link>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

export default function FamilyLearningSetupWorkspace() {
  const {
    workspace,
    activeLearner,
    activeLearnerId,
    loading: workspaceLoading,
    setActiveLearner,
    setWorkspacePatch,
    reloadWorkspace,
  } = useFamilyWorkspace();
  const [draft, setDraft] = useState<FamilySettings>(workspace.profile);
  const [learnersDraft, setLearnersDraft] = useState<FamilyLearner[]>(workspace.learners);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [commandCard, setCommandCard] = useState<FamilyComplianceCommandCardModel | null>(null);
  const [commandCardLoading, setCommandCardLoading] = useState(false);
  const [reportsModel, setReportsModel] = useState<ReportsBuilderModel | null>(null);
  const [reportsModelLoading, setReportsModelLoading] = useState(false);
  const [complianceRefreshTick, setComplianceRefreshTick] = useState(0);

  useEffect(() => {
    setDraft(workspace.profile);
  }, [workspace.profile]);

  useEffect(() => {
    setLearnersDraft(workspace.learners);
  }, [workspace.learners]);

  useEffect(() => {
    let mounted = true;

    async function hydrateCommandCard() {
      if (!activeLearner) {
        if (mounted) {
          setCommandCard(null);
          setCommandCardLoading(false);
        }
        return;
      }

      setCommandCardLoading(true);
      try {
        const next = await loadFamilyComplianceCommandCard({
          profile: workspace.profile,
          learner: activeLearner,
          userId: workspace.userId,
        });

        if (mounted) {
          setCommandCard(next);
        }
      } catch {
        if (mounted) {
          setCommandCard(null);
        }
      } finally {
        if (mounted) {
          setCommandCardLoading(false);
        }
      }
    }

    void hydrateCommandCard();

    return () => {
      mounted = false;
    };
  }, [activeLearner, workspace.profile, workspace.userId, complianceRefreshTick]);

  useEffect(() => {
    let mounted = true;

    async function hydrateReportsModel() {
      if (!activeLearner) {
        if (mounted) {
          setReportsModel(null);
          setReportsModelLoading(false);
        }
        return;
      }

      if (mounted) {
        setReportsModelLoading(true);
      }

      try {
        const next = await loadReportsBuilderModel({
          profile: workspace.profile,
          learner: activeLearner,
          userId: workspace.userId,
          mode: "read",
        });

        if (mounted) {
          setReportsModel(next);
        }
      } catch {
        if (mounted) {
          setReportsModel(null);
        }
      } finally {
        if (mounted) {
          setReportsModelLoading(false);
        }
      }
    }

    void hydrateReportsModel();

    return () => {
      mounted = false;
    };
  }, [activeLearner, workspace.profile, workspace.userId, complianceRefreshTick]);

  async function handleComplianceSaved() {
    setComplianceRefreshTick((current) => current + 1);
    await reloadWorkspace();
  }

  function patchLearner(
    learnerId: string,
    patch: {
      yearBand?: string | null;
      curriculum_framework_id?: string | null;
      curriculum_jurisdiction_id?: string | null;
      reporting_mode?: string | null;
    },
  ) {
    setLearnersDraft((current) => applyLocalLearnerPatch(current, learnerId, patch));
  }

  async function handleSave() {
    setSaving(true);
    setStatus("");
    setError("");

    try {
      const savedProfile = await saveFamilyWorkspaceSettings(draft);
      setWorkspacePatch({ profile: savedProfile });

      if (workspace.userId && workspace.storageMode === "database") {
        const hadSyncedLearnerOverrideChanges = hasSyncedLearnerOverrideChanges(
          learnersDraft,
          workspace.learners,
        );
        await reloadWorkspace();
        setStatus(
          hadSyncedLearnerOverrideChanges
            ? "Family defaults saved. Learner-specific synced overrides stay read-only until learner editing is fully connected."
            : "Family learning setup saved.",
        );
      } else {
        persistSettingsToLocalStorage(draft);
        persistLearnersToLocalCache(learnersDraft);
        setWorkspacePatch({ profile: draft, learners: learnersDraft, storageMode: "local" });
        setStatus("Family learning setup saved.");
      }
    } catch (saveError) {
      setError(describeFamilySetupError(saveError));
    } finally {
      setSaving(false);
    }
  }

  const learnerOptions: LearnerOption[] = workspace.learners.map((learner) => ({
    id: learner.id,
    label: learner.label,
    note: learner.yearLabel || "Learner",
  }));

  return (
    <FamilyTopNavShell
      subtitle="My Family"
      heroTitle="My Family"
      heroText="Set the defaults that shape curriculum, reporting, and planning across your family workspace."
      heroAsideTitle="Family defaults"
      heroAsideText="Start with one shared setup, then only override a learner where it genuinely helps."
    >
      <div className="grid gap-5 pb-14">
        {!workspace.learners.length ? <CurriculumSetupEmptyState /> : null}

        <div id="learner-management">
          <LearnerSelector
            familyName={workspace.profile.family_display_name || "My family"}
            learners={learnerOptions}
            activeLearnerId={activeLearnerId}
            onSelectLearner={setActiveLearner}
            state={learnerSelectorState(
              workspaceLoading,
              workspace.learners,
              workspace.storageMode,
              workspace.syncIssue,
            )}
          />
        </div>

        <div id="family-compliance-command" className="grid gap-4">
          <ComplianceCommandCard
            loading={commandCardLoading}
            model={commandCard}
          />
        </div>

        <div id="family-compliance-inputs" className="grid gap-4">
          <FamilyLearningSetupCard
            title="Compliance setup"
            note="Keep notification, attendance, and subject tracking visible here so the jurisdiction engine can guide the right next step without forcing a separate workflow."
          >
            <div className="grid gap-4 xl:grid-cols-3">
              <div id="notification-compliance">
                <NotificationComplianceCard
                  learner={activeLearner}
                  reportsModel={reportsModel}
                  familyProfileId={workspace.profile.id}
                  jurisdictionId={reportsModel?.effectiveJurisdiction?.code ?? null}
                  registrationCycleId={reportsModel?.registrationCycle?.id ?? null}
                  userId={workspace.userId}
                  loading={reportsModelLoading}
                  onSaved={() => void handleComplianceSaved()}
                />
              </div>
              <div id="attendance-compliance">
                <AttendanceComplianceCard
                  learner={activeLearner}
                  reportsModel={reportsModel}
                  familyProfileId={workspace.profile.id}
                  jurisdictionId={reportsModel?.effectiveJurisdiction?.code ?? null}
                  registrationCycleId={reportsModel?.registrationCycle?.id ?? null}
                  userId={workspace.userId}
                  loading={reportsModelLoading}
                  onSaved={() => void handleComplianceSaved()}
                />
              </div>
              <div id="subjects-plan-compliance">
                <SubjectsPlanComplianceCard
                  learner={activeLearner}
                  reportsModel={reportsModel}
                  familyProfileId={workspace.profile.id}
                  jurisdictionId={reportsModel?.effectiveJurisdiction?.code ?? null}
                  registrationCycleId={reportsModel?.registrationCycle?.id ?? null}
                  userId={workspace.userId}
                  loading={reportsModelLoading}
                  onSaved={() => void handleComplianceSaved()}
                />
              </div>
            </div>
          </FamilyLearningSetupCard>
        </div>

        <div id="family-learning-setup">
          <FamilyLearningSetupCard
            title="Family Learning Setup"
            note="Choose the default curriculum and reporting setup once, then let each learner inherit it unless you need something different."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Country">
                <CountrySelector
                  value={draft.country}
                  onChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      country: value,
                      preferred_market:
                        value === "us" || value === "uk"
                          ? value
                          : value === "au"
                            ? "au"
                            : current.preferred_market,
                      curriculum_framework_id: defaultFrameworkForCountry(value),
                      curriculum_jurisdiction_id: "",
                    }))
                  }
                />
              </Field>
              <Field label="Curriculum framework">
                <FrameworkSelector
                  country={draft.country}
                  frameworkId={draft.curriculum_framework_id}
                  onChange={(value) =>
                    setDraft((current) => ({ ...current, curriculum_framework_id: value }))
                  }
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <JurisdictionSelector
                country={draft.country}
                frameworkId={draft.curriculum_framework_id}
                jurisdictionId={draft.curriculum_jurisdiction_id}
                onChange={(value) =>
                  setDraft((current) => ({ ...current, curriculum_jurisdiction_id: value }))
                }
              />
              <Field
                label="Reporting preference"
                note="This becomes the family default report style unless a learner needs something different."
              >
                <div className="grid gap-3">
                  <ReportingModeSelector
                    value={draft.reporting_mode}
                    onChange={(value) =>
                      setDraft((current) => ({
                        ...current,
                        reporting_mode: value,
                        report_tone_default:
                          value === "authority-ready" || value === "progress-review"
                            ? value
                            : "family-summary",
                      }))
                    }
                  />
                </div>
              </Field>
            </div>
          </FamilyLearningSetupCard>
        </div>

        <FamilyLearningSetupCard
          title="Learners"
          note="Each learner starts with the family setup. Add an override only where the framework, jurisdiction, year band, or report style needs to differ."
        >
          <div className="grid gap-4">
            {learnersDraft.map((learner) => (
              <LearnerCurriculumSettingsCard
                key={learner.id}
                learner={learner}
                familyCountry={draft.country}
                familyFrameworkId={draft.curriculum_framework_id}
                familyJurisdictionId={draft.curriculum_jurisdiction_id}
                familyReportingMode={draft.reporting_mode}
                onPatch={patchLearner}
              />
            ))}
          </div>
        </FamilyLearningSetupCard>

        <SettingsSaveBar
          status={status}
          error={error}
          saving={saving}
          onSave={() => void handleSave()}
        />
      </div>
    </FamilyTopNavShell>
  );
}
