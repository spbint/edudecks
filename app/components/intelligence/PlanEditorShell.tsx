"use client";

import { useEffect, type ReactNode } from "react";
import type { GeneratedPlanContent, PlanWorkflowStatus } from "@/lib/intelligence/plans/types";
import ListFieldEditor from "./ListFieldEditor";
import PlanValidationSummary from "./PlanValidationSummary";
import type { ReviewValidationResult } from "@/lib/intelligence/plans/reviewTypes";

export function useUnsavedChangesGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return undefined;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const click = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank" || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (anchor.origin !== window.location.origin) return;
      if (!window.confirm("You have unsaved edits. Leave this review?")) event.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", click, true);
    };
  }, [dirty]);
}

function textArea(label: string, value: string, onChange: (value: string) => void, required = false) {
  return (
    <label style={{ display: "grid", gap: 5 }}>
      {label}{required ? " *" : ""}
      <textarea aria-label={label} required={required} value={value} onChange={(event) => onChange(event.target.value)} rows={3} />
    </label>
  );
}

export default function PlanEditorShell({
  content,
  status,
  dirty,
  saving,
  validation,
  safetyAcknowledged,
  onSafetyAcknowledgedChange,
  onChange,
  onSave,
  onValidate,
  onApprove,
  onReturnToDraft,
  onArchive,
  onRegenerate,
  sequenceEditor,
  resourceEditor,
}: {
  content: GeneratedPlanContent;
  status: PlanWorkflowStatus;
  dirty: boolean;
  saving: boolean;
  validation: ReviewValidationResult | null;
  safetyAcknowledged: boolean;
  onSafetyAcknowledgedChange: (value: boolean) => void;
  onChange: <K extends keyof GeneratedPlanContent>(field: K, value: GeneratedPlanContent[K]) => void;
  onSave: () => void;
  onValidate: () => void;
  onApprove: () => void;
  onReturnToDraft: () => void;
  onArchive: () => void;
  onRegenerate: () => void;
  sequenceEditor: ReactNode;
  resourceEditor: ReactNode;
}) {
  useUnsavedChangesGuard(dirty);
  return (
    <form onSubmit={(event) => event.preventDefault()} style={{ display: "grid", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <strong>Review status: {status.replaceAll("_", " ")}</strong>
          <div role="status" aria-live="polite">{dirty ? "Unsaved changes" : saving ? "Saving..." : "All changes saved"}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save draft"}</button>
          <button type="button" onClick={onValidate} disabled={saving}>Validate</button>
          <button type="button" onClick={onApprove} disabled={saving}>Approve plan</button>
          <button type="button" onClick={onReturnToDraft} disabled={saving}>Return to draft</button>
          <button type="button" onClick={onArchive} disabled={saving}>Archive</button>
          <button type="button" onClick={onRegenerate} disabled={saving}>Regenerate as new revision</button>
        </div>
      </div>

      <PlanValidationSummary validation={validation} />

      <section aria-labelledby="plan-details-heading" style={{ display: "grid", gap: 12 }}>
        <h2 id="plan-details-heading">Plan details</h2>
        {textArea("Title", content.title, (value) => onChange("title", value), true)}
        {textArea("Overview", content.overview, (value) => onChange("overview", value), true)}
        {textArea("Age or stage", content.ageStage, (value) => onChange("ageStage", value), true)}
        <label style={{ display: "grid", gap: 5 }}>
          Subjects (comma-separated) *
          <input aria-label="Subjects" value={content.subjects.join(", ")} onChange={(event) => onChange("subjects", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} />
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <label style={{ display: "grid", gap: 5 }}>
            Duration
            <input aria-label="Duration" type="number" min={1} max={1440} value={content.duration ?? ""} onChange={(event) => onChange("duration", event.target.value === "" ? null : Number(event.target.value))} />
          </label>
          <label style={{ display: "grid", gap: 5 }}>
            Duration unit
            <select aria-label="Duration unit" value={content.durationUnit ?? "minutes"} onChange={(event) => onChange("durationUnit", event.target.value as GeneratedPlanContent["durationUnit"])}>
              <option value="minutes">Minutes</option><option value="lessons">Lessons</option><option value="weeks">Weeks</option><option value="sessions">Sessions</option>
            </select>
          </label>
        </div>
      </section>

      <section aria-labelledby="learning-heading" style={{ display: "grid", gap: 14 }}>
        <h2 id="learning-heading">Learning design</h2>
        <ListFieldEditor label="Learning intentions" values={content.learningIntentions} onChange={(value) => onChange("learningIntentions", value)} required />
        <ListFieldEditor label="Success criteria" values={content.successCriteria} onChange={(value) => onChange("successCriteria", value)} required />
        {sequenceEditor}
        {resourceEditor}
        {textArea("Assessment approach", content.assessmentApproach, (value) => onChange("assessmentApproach", value), true)}
      </section>

      <section aria-labelledby="support-heading" style={{ display: "grid", gap: 14 }}>
        <h2 id="support-heading">Support and evidence</h2>
        <ListFieldEditor label="Preparation" values={content.preparation} onChange={(value) => onChange("preparation", value)} />
        <ListFieldEditor label="Discussion questions" values={content.discussionQuestions} onChange={(value) => onChange("discussionQuestions", value)} />
        <ListFieldEditor label="Differentiation" values={content.differentiation} onChange={(value) => onChange("differentiation", value)} />
        <ListFieldEditor label="Evidence prompts" values={content.evidencePrompts} onChange={(value) => onChange("evidencePrompts", value)} />
        <ListFieldEditor label="Portfolio prompts" values={content.portfolioPrompts} onChange={(value) => onChange("portfolioPrompts", value)} />
        <ListFieldEditor label="Safety and supervision notes" values={content.safetySupervisionNotes} onChange={(value) => onChange("safetySupervisionNotes", value)} required />
        {content.safetySupervisionNotes.length ? (
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" checked={safetyAcknowledged} onChange={(event) => onSafetyAcknowledgedChange(event.target.checked)} />
            I acknowledge the safety and supervision notes.
          </label>
        ) : null}
        <ListFieldEditor label="Limitations and assumptions" values={content.limitationsAssumptions} onChange={(value) => onChange("limitationsAssumptions", value)} />
      </section>
    </form>
  );
}
