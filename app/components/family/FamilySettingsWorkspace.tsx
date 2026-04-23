"use client";

import React, { useEffect, useState } from "react";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import {
  AcademicStructureSelector,
  CountrySelector,
  FamilyLearningSetupCard,
  Field,
  FrameworkSelector,
  JurisdictionSelector,
  ReportingModeSelector,
  SettingsSaveBar,
} from "@/app/components/family/FamilyConfigurationComponents";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";
import {
  persistSettingsToLocalStorage,
  type FamilySettings,
} from "@/lib/familySettings";
import { saveFamilyWorkspaceSettings } from "@/lib/familyWorkspace";

function friendlySettingsMessage() {
  return "Settings storage is still getting ready. Try saving again in a moment.";
}

export default function FamilySettingsWorkspace() {
  const { workspace, setWorkspacePatch } = useFamilyWorkspace();
  const [draft, setDraft] = useState<FamilySettings>(workspace.profile);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setDraft(workspace.profile);
  }, [workspace.profile]);

  async function handleSave() {
    setSaving(true);
    setStatus("");
    setError("");

    try {
      const saved = await saveFamilyWorkspaceSettings(draft);
      setWorkspacePatch({ profile: saved });
      persistSettingsToLocalStorage(saved);
      setStatus("Settings saved.");
    } catch {
      setError(friendlySettingsMessage());
    } finally {
      setSaving(false);
    }
  }

  return (
    <FamilyTopNavShell
      subtitle="My Settings"
      heroTitle="My Settings"
      heroText="Keep family-wide curriculum, reporting, and academic structure defaults calm, clear, and ready for the rest of the workflow."
      heroAsideTitle="Learning settings"
      heroAsideText="These defaults shape curriculum, reports, future programs, and calendar templates."
    >
      <div className="grid gap-5 pb-14">
        <FamilyLearningSetupCard
          title="Curriculum Defaults"
          note="Choose the country, framework, and jurisdiction your family should follow by default. If you move or switch systems later, update it here once."
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
            <div className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4 text-[14px] leading-6 text-slate-600">
              These curriculum defaults apply across your family unless a learner needs an override elsewhere.
            </div>
          </div>
        </FamilyLearningSetupCard>

        <FamilyLearningSetupCard
          title="Reporting Setup"
          note="Choose the reporting voice that should guide reports by default across your family workspace."
        >
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
        </FamilyLearningSetupCard>

        <FamilyLearningSetupCard
          title="Academic Structure"
          note="Choose the academic rhythm you want future program and calendar templates to inherit."
        >
          <AcademicStructureSelector
            type={draft.academic_structure_type}
            cycleCount={draft.cycle_count}
            weeksPerCycle={draft.weeks_per_cycle}
            onTypeChange={(value) =>
              setDraft((current) => ({ ...current, academic_structure_type: value }))
            }
            onCycleCountChange={(value) =>
              setDraft((current) => ({ ...current, cycle_count: value }))
            }
            onWeeksPerCycleChange={(value) =>
              setDraft((current) => ({ ...current, weeks_per_cycle: value }))
            }
          />
        </FamilyLearningSetupCard>

        <FamilyLearningSetupCard
          title="Advanced Curriculum Options"
          note="Keep this tucked away unless your family is using a custom or alternative framework."
        >
          <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50/80 p-4 text-[14px] leading-6 text-slate-600">
            Custom and alternative framework support will appear here when it is ready. For now, family defaults stay focused on the core curriculum, reporting, and academic structure settings above.
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
