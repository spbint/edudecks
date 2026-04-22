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
          <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50/80 p-4 text-[14px] leading-6 text-slate-600">
            Custom and alternative framework support will appear here when it is ready. For now, family defaults stay focused on the main reporting and academic structure settings above.
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
