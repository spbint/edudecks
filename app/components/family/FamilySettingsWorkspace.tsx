"use client";

import React, { useEffect, useState } from "react";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import {
  AcademicStructureSelector,
  FamilyLearningSetupCard,
  ReportingModeSelector,
  SettingsSaveBar,
} from "@/app/components/family/FamilyConfigurationComponents";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";
import {
  persistSettingsToLocalStorage,
  type FamilySettings,
} from "@/lib/familySettings";
import { saveFamilyWorkspaceSettings } from "@/lib/familyWorkspace";

export default function FamilySettingsWorkspace() {
  const { workspace, setWorkspacePatch } = useFamilyWorkspace();
  const [draft, setDraft] = useState<FamilySettings>(workspace.profile);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

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
    } catch (saveError: any) {
      setError(String(saveError?.message ?? "We couldn't save settings just yet."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <FamilyTopNavShell
      subtitle="My Settings"
      heroTitle="My Settings"
      heroText="Keep reporting and academic structure defaults calm, clear, and ready for the rest of the family workflow."
      heroAsideTitle="Learning settings"
      heroAsideText="These defaults quietly shape reporting, future programs, and calendar templates."
    >
      <div className="grid gap-5 pb-14">
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
          <button
            type="button"
            onClick={() => setShowAdvanced((current) => !current)}
            className="inline-flex w-fit items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            {showAdvanced ? "Hide advanced options" : "Show advanced options"}
          </button>

          {showAdvanced ? (
            <div className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4 text-[14px] leading-6 text-slate-600">
              Custom framework support is now structurally ready. The deeper IB, school-defined, and homeschool custom template logic can sit on top of this configuration layer later without changing the family setup flow again.
            </div>
          ) : null}
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
