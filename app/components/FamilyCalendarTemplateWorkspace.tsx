"use client";

import React, { useEffect, useMemo, useState } from "react";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import {
  CalendarTemplateGrid,
  CalendarTemplateSelector,
  CalendarTemplateSlotEditor,
  BODY,
  H2,
  LABEL,
} from "@/app/components/calendar/CalendarTemplateOverviewComponents";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";
import {
  defaultCalendarTemplate,
  loadFamilyCalendarTemplates,
  saveFamilyCalendarTemplate,
  type CalendarTemplate,
  type TemplateSlot,
} from "@/lib/familyPlanningTemplates";
import { resolveEffectiveLearnerLearningConfig } from "@/lib/familyLearningConfig";

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function FamilyCalendarTemplateWorkspace() {
  const { workspace, activeLearner } = useFamilyWorkspace();
  const [templates, setTemplates] = useState<CalendarTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const learningConfig = resolveEffectiveLearnerLearningConfig(workspace.profile, activeLearner);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      if (!workspace.profile.id) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const rows = await loadFamilyCalendarTemplates({ familyId: workspace.profile.id });
        if (!mounted) return;
        const next = rows.length
          ? rows
          : [defaultCalendarTemplate({
              familyId: workspace.profile.id,
              academicStructureType: workspace.profile.academic_structure_type,
            })];
        setTemplates(next);
        setSelectedTemplateId(next[0]?.id || "");
      } catch (loadError: any) {
        if (!mounted) return;
        setError(String(loadError?.message ?? "We couldn't load the calendar template yet."));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void hydrate();
    return () => {
      mounted = false;
    };
  }, [workspace.profile.academic_structure_type, workspace.profile.id]);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? templates[0] ?? null,
    [selectedTemplateId, templates],
  );

  const selectedSlot =
    selectedTemplate?.slots.find((slot) => slot.id === selectedSlotId) ?? null;

  useEffect(() => {
    if (!selectedTemplate) return;
    if (!selectedTemplate.slots.length) {
      setSelectedSlotId(null);
      return;
    }
    if (!selectedSlotId || !selectedTemplate.slots.some((slot) => slot.id === selectedSlotId)) {
      setSelectedSlotId(selectedTemplate.slots[0]?.id || null);
    }
  }, [selectedSlotId, selectedTemplate]);

  function upsertTemplate(nextTemplate: CalendarTemplate) {
    setTemplates((current) =>
      current.map((template) => (template.id === nextTemplate.id ? nextTemplate : template)),
    );
  }

  function handleCreateTemplate() {
    const next = defaultCalendarTemplate({
      familyId: workspace.profile.id,
      academicStructureType: workspace.profile.academic_structure_type,
    });
    setTemplates((current) => [next, ...current]);
    setSelectedTemplateId(next.id);
    setSelectedSlotId(next.slots[0]?.id || null);
    setStatus("A fresh calendar template is ready to shape.");
    setError("");
  }

  function handleAddSlot() {
    if (!selectedTemplate) return;
    const nextSlot: TemplateSlot = {
      id: makeId("slot"),
      templateId: selectedTemplate.id,
      dayOfWeek: 1,
      startTime: "",
      endTime: "",
      subjectId: "",
      label: "Learning block",
      notes: "",
    };
    const nextTemplate = {
      ...selectedTemplate,
      slots: [...selectedTemplate.slots, nextSlot],
    };
    upsertTemplate(nextTemplate);
    setSelectedSlotId(nextSlot.id);
  }

  function handleSlotChange(nextSlot: TemplateSlot) {
    if (!selectedTemplate) return;
    upsertTemplate({
      ...selectedTemplate,
      slots: selectedTemplate.slots.map((slot) =>
        slot.id === nextSlot.id ? nextSlot : slot,
      ),
    });
  }

  function handleDeleteSlot(slotId: string) {
    if (!selectedTemplate) return;
    const nextSlots = selectedTemplate.slots.filter((slot) => slot.id !== slotId);
    upsertTemplate({
      ...selectedTemplate,
      slots: nextSlots,
    });
    setSelectedSlotId(nextSlots[0]?.id || null);
  }

  async function handleSave() {
    if (!selectedTemplate) return;
    setSaving(true);
    setStatus("");
    setError("");
    try {
      const saved = await saveFamilyCalendarTemplate(selectedTemplate);
      upsertTemplate(saved);
      setStatus("Calendar template saved.");
    } catch (saveError: any) {
      setError(String(saveError?.message ?? "We couldn't save the calendar template yet."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <FamilyTopNavShell
      subtitle="My Calendar"
      heroTitle="My Calendar"
      heroText="Shape the reusable weekly rhythm that later programs can drop into automatically."
      heroAsideTitle="Calendar template"
      heroAsideText="Set the week up once, then reuse it as the calm frame behind live planning."
    >
      <div className="grid gap-5 pb-14">
        <CalendarTemplateSelector
          templates={templates}
          selectedTemplateId={selectedTemplate?.id || ""}
          onSelect={setSelectedTemplateId}
          onCreate={handleCreateTemplate}
        />

        <section className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)] md:grid-cols-4">
          {[
            { label: "Academic structure", value: workspace.profile.academic_structure_type || "terms" },
            { label: "Cycles", value: String(workspace.profile.cycle_count || 4) },
            { label: "Weeks per cycle", value: String(workspace.profile.weeks_per_cycle || 10) },
            { label: "Framework", value: learningConfig.frameworkLabel },
          ].map((item) => (
            <article key={item.label} className="grid gap-1 rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-4">
              <div className={LABEL}>{item.label}</div>
              <div className={H2}>{item.value}</div>
            </article>
          ))}
        </section>

        {loading ? (
          <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
            <div className={BODY}>Loading your calendar template…</div>
          </section>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
            <CalendarTemplateGrid
              slots={selectedTemplate?.slots || []}
              selectedSlotId={selectedSlotId}
              onSelectSlot={setSelectedSlotId}
            />
            <CalendarTemplateSlotEditor
              slot={selectedSlot}
              onChange={handleSlotChange}
              onDelete={handleDeleteSlot}
              onAddNew={handleAddSlot}
            />
          </div>
        )}

        <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-slate-200 bg-white/95 px-5 py-4 shadow-[0_18px_34px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="grid gap-1">
            <div className="text-[15px] font-semibold text-slate-950">Save My Calendar Template</div>
            <div className={error ? "text-[13px] text-rose-600" : "text-[13px] text-slate-500"}>
              {error || status || "Set up your weekly rhythm to begin generating plans."}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || !selectedTemplate}
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {saving ? "Saving..." : "Save template"}
          </button>
        </div>
      </div>
    </FamilyTopNavShell>
  );
}
