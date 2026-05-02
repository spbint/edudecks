"use client";

import React, { useEffect, useMemo, useState } from "react";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";
import {
  CalendarTemplateGrid,
  CalendarTemplateSelector,
  CalendarTemplateSlotEditor,
  BODY,
  H2,
  LABEL,
  META,
} from "@/app/components/calendar/CalendarTemplateOverviewComponents";
import {
  loadFamilyCalendarTemplates,
  saveFamilyCalendarTemplate,
  type CalendarTemplate,
  type TemplateSlot,
} from "@/lib/familyPlanningTemplates";

function makeLocalId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildEmptyTemplate(input: {
  familyId: string;
  academicStructureType?: string | null;
}): CalendarTemplate {
  const id = makeLocalId("calendar-template");

  return {
    id,
    familyId: input.familyId,
    title: "My Calendar Template",
    cycleType: "weekly",
    cycleLength: 5,
    academicStructureType: input.academicStructureType || "terms",
    slots: [],
    updatedAt: new Date().toISOString(),
  };
}

function buildBlankSlot(templateId: string): TemplateSlot {
  return {
    id: makeLocalId("slot"),
    templateId,
    dayOfWeek: 1,
    startTime: null,
    endTime: null,
    subjectId: null,
    label: "Learning block",
    notes: "",
  };
}

function friendlyCalendarMessage(kind: "load" | "save") {
  if (kind === "load") {
    return "My Calendar could not load. You can still shape a local template.";
  }
  return "My Calendar could not save. Check your account connection and try again.";
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isDatabaseProfileId(value: unknown) {
  const id = clean(value);
  return !!id && id !== "local" && !id.startsWith("local-");
}

function describeSaveError(error: unknown, fallback: string) {
  if (!error || typeof error !== "object") return fallback;
  const row = error as { message?: unknown; details?: unknown; hint?: unknown };
  return clean(row.message) || clean(row.details) || clean(row.hint) || fallback;
}

export default function FamilyCalendarTemplateWorkspace() {
  const { workspace, loading: workspaceLoading } = useFamilyWorkspace();
  const [templates, setTemplates] = useState<CalendarTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      if (!workspace.profile.id) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const nextTemplates = await loadFamilyCalendarTemplates({
          familyId: workspace.profile.id,
        });

        if (!mounted) return;

        setTemplates(nextTemplates);
        setSelectedTemplateId((current) => {
          if (nextTemplates.some((template) => template.id === current)) return current;
          return nextTemplates[0]?.id || "";
        });
      } catch {
        if (!mounted) return;
        setTemplates([]);
        setSelectedTemplateId("");
        setSelectedSlotId(null);
        setError(friendlyCalendarMessage("load"));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void hydrate();

    return () => {
      mounted = false;
    };
  }, [workspace.profile.id]);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates],
  );

  const selectedSlot = useMemo(
    () => selectedTemplate?.slots.find((slot) => slot.id === selectedSlotId) ?? null,
    [selectedSlotId, selectedTemplate],
  );

  useEffect(() => {
    if (!selectedTemplate) {
      setSelectedSlotId(null);
      return;
    }

    if (
      selectedSlotId &&
      selectedTemplate.slots.some((slot) => slot.id === selectedSlotId)
    ) {
      return;
    }

    setSelectedSlotId(selectedTemplate.slots[0]?.id || null);
  }, [selectedSlotId, selectedTemplate]);

  function replaceTemplate(nextTemplate: CalendarTemplate) {
    setTemplates((current) => {
      const exists = current.some((template) => template.id === nextTemplate.id);
      if (!exists) return [nextTemplate, ...current];
      return current.map((template) => (template.id === nextTemplate.id ? nextTemplate : template));
    });
  }

  function handleCreateTemplate() {
    const nextTemplate = buildEmptyTemplate({
      familyId: workspace.profile.id || "local",
      academicStructureType: workspace.profile.academic_structure_type,
    });

    setTemplates((current) => [nextTemplate, ...current]);
    setSelectedTemplateId(nextTemplate.id);
    setSelectedSlotId(null);
    setStatus("Draft workspace ready.");
    setError("");
  }

  function ensureTemplateForEdit() {
    if (selectedTemplate) return selectedTemplate;

    const nextTemplate = buildEmptyTemplate({
      familyId: workspace.profile.id || "local",
      academicStructureType: workspace.profile.academic_structure_type,
    });
    setTemplates((current) => [nextTemplate, ...current]);
    setSelectedTemplateId(nextTemplate.id);
    return nextTemplate;
  }

  function handleAddSlot() {
    const template = ensureTemplateForEdit();
    const nextSlot = buildBlankSlot(template.id);
    replaceTemplate({
      ...template,
      slots: [...template.slots, nextSlot],
      updatedAt: new Date().toISOString(),
    });
    setSelectedTemplateId(template.id);
    setSelectedSlotId(nextSlot.id);
    setStatus("Slot added.");
    setError("");
  }

  function handleChangeSlot(nextSlot: TemplateSlot) {
    if (!selectedTemplate) return;
    replaceTemplate({
      ...selectedTemplate,
      slots: selectedTemplate.slots.map((slot) => (slot.id === nextSlot.id ? nextSlot : slot)),
      updatedAt: new Date().toISOString(),
    });
  }

  function handleDeleteSlot(slotId: string) {
    if (!selectedTemplate) return;
    const nextSlots = selectedTemplate.slots.filter((slot) => slot.id !== slotId);
    replaceTemplate({
      ...selectedTemplate,
      slots: nextSlots,
      updatedAt: new Date().toISOString(),
    });
    setSelectedSlotId(nextSlots[0]?.id || null);
    setStatus("Slot removed.");
    setError("");
  }

  async function handleSaveTemplate() {
    if (!selectedTemplate) return;

    setSaving(true);
    setStatus("");
    setError("");

    try {
      const saved = await saveFamilyCalendarTemplate(selectedTemplate);
      replaceTemplate(saved);
      setSelectedTemplateId(saved.id);
      setStatus("Calendar saved.");
    } catch (saveError) {
      setError(describeSaveError(saveError, friendlyCalendarMessage("save")));
    } finally {
      setSaving(false);
    }
  }

  const canSaveToAccount = Boolean(
    workspace.storageMode === "database" &&
      workspace.userId &&
      isDatabaseProfileId(workspace.profile.id),
  );
  const saveDisabledReason = canSaveToAccount
    ? ""
    : "Sign in and connect a family profile before saving My Calendar.";
  const workspaceStateLabel = canSaveToAccount ? "Synced workspace" : "Needs synced workspace";

  return (
    <FamilyTopNavShell subtitle="My Calendar" hideHero>
      <div className="grid gap-5 pb-14">
        <section className="grid gap-4 rounded-[24px] border border-slate-200 bg-white px-5 py-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)] md:grid-cols-[minmax(0,1fr)_minmax(240px,320px)] md:items-center">
          <div>
            <div className={LABEL}>Draft workspace</div>
            <h1 className="mt-2 text-[28px] font-black leading-tight text-slate-950">
              My Calendar
            </h1>
            <p className="mt-2 text-[15px] leading-6 text-slate-600">
              Shape the weekly rhythm your plans and programs use.
            </p>
          </div>

          <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
            <div className={LABEL}>Master Calendar</div>
            <div className={`mt-2 ${H2}`}>Planning defaults</div>
            <p className={`mt-1 ${META}`}>Set reusable rotations and planning defaults</p>
          </div>
        </section>

        {error || status ? (
          <section
            className={`rounded-[18px] border px-4 py-3 text-[14px] font-semibold ${
              error
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {error || status}
          </section>
        ) : null}

        <CalendarTemplateSelector
          templates={templates}
          selectedTemplateId={selectedTemplateId}
          onSelect={setSelectedTemplateId}
          onCreate={handleCreateTemplate}
        />

        {loading || workspaceLoading ? (
          <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
            <div className={BODY}>Loading calendar...</div>
          </section>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            <CalendarTemplateGrid
              slots={selectedTemplate?.slots || []}
              selectedSlotId={selectedSlotId}
              onSelectSlot={setSelectedSlotId}
            />

            <div className="xl:sticky xl:top-4 xl:self-start">
              <CalendarTemplateSlotEditor
                slot={selectedSlot}
                onChange={handleChangeSlot}
                onDelete={handleDeleteSlot}
                onAddNew={handleAddSlot}
              />
            </div>
          </div>
        )}

        <section className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-[22px] border border-slate-200 bg-white/95 px-4 py-4 shadow-[0_18px_48px_rgba(15,23,42,0.14)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] font-semibold text-slate-600">
              Draft workspace
            </span>
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] font-semibold text-slate-600">
              {workspaceStateLabel}
            </span>
            {!canSaveToAccount ? (
              <span className="text-[12px] font-semibold text-slate-500">
                {saveDisabledReason}
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => void handleSaveTemplate()}
            disabled={saving || !selectedTemplate || !canSaveToAccount}
            title={!canSaveToAccount ? saveDisabledReason : undefined}
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save calendar"}
          </button>
        </section>
      </div>
    </FamilyTopNavShell>
  );
}
