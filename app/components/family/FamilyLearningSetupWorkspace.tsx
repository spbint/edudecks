"use client";

import React, { useEffect, useState } from "react";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";
import {
  AcademicStructureSelector,
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
  persistSettingsToLocalStorage,
  type FamilySettings,
} from "@/lib/familySettings";
import {
  persistLearnersToLocalCache,
  saveFamilyWorkspaceSettings,
  updateLinkedLearner,
  type FamilyLearner,
} from "@/lib/familyWorkspace";

function safe(value: unknown) {
  return String(value ?? "").trim();
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

export default function FamilyLearningSetupWorkspace() {
  const { workspace, setWorkspacePatch, reloadWorkspace } = useFamilyWorkspace();
  const [draft, setDraft] = useState<FamilySettings>(workspace.profile);
  const [learnersDraft, setLearnersDraft] = useState<FamilyLearner[]>(workspace.learners);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setDraft(workspace.profile);
  }, [workspace.profile]);

  useEffect(() => {
    setLearnersDraft(workspace.learners);
  }, [workspace.learners]);

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
        await Promise.all(
          learnersDraft
            .filter((learner) => !safe(learner.id).startsWith("local-"))
            .map((learner) =>
              updateLinkedLearner(
                workspace.userId as string,
                learner.id,
                learner.label,
                learner.year_level != null ? String(learner.year_level) : "",
                {
                  yearBand: learner.year_band ?? null,
                  frameworkId: learner.curriculum_framework_id ?? null,
                  jurisdictionId: learner.curriculum_jurisdiction_id ?? null,
                  reportingMode: learner.reporting_mode ?? null,
                },
              ),
            ),
        );
        await reloadWorkspace();
      } else {
        persistSettingsToLocalStorage(draft);
        persistLearnersToLocalCache(learnersDraft);
        setWorkspacePatch({ profile: draft, learners: learnersDraft, storageMode: "local" });
      }

      setStatus("Family learning setup saved.");
    } catch (saveError: any) {
      setError(String(saveError?.message ?? "We couldn't save the learning setup just yet."));
    } finally {
      setSaving(false);
    }
  }

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
                      value === "us" || value === "uk" ? value : "au",
                    curriculum_framework_id:
                      value === "us"
                        ? "us-common-core"
                        : value === "uk"
                          ? "uk-national"
                          : value === "other"
                            ? "custom-homeschool"
                            : "au-v9",
                    curriculum_jurisdiction_id:
                      value === "us"
                        ? "ca"
                        : value === "uk"
                          ? "england"
                          : value === "other"
                            ? "custom"
                            : "tas",
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
