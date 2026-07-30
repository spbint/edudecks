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
  onReadyToUse,
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
  onReadyToUse?: () => void;
  onApprove: () => void;
  onReturnToDraft: () => void;
  onArchive: () => void;
  onRegenerate: () => void;
  sequenceEditor: ReactNode;
  resourceEditor: ReactNode;
}) {
  useUnsavedChangesGuard(dirty);
  const statusLabel = saving ? "Saving..." : dirty ? "Unsaved changes" : "All changes saved";
  const statusTone = saving ? "saving" : dirty ? "unsaved" : "saved";
  return (
    <>
      <style jsx>{`
        .plan-review-action-bar {
          display: grid;
          gap: 14px;
          padding: 16px;
          border: 1px solid #dfe4ee;
          border-radius: 16px;
          background: #f8faff;
        }

        .plan-review-action-heading {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .plan-review-status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 36px;
          padding: 7px 11px;
          border: 1px solid;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
        }

        .plan-review-status-unsaved {
          border-color: #f59e0b;
          background: #fff7e6;
          color: #7c2d12;
        }

        .plan-review-status-saving {
          border-color: #b9aaff;
          background: #f2edff;
          color: #4c35b8;
        }

        .plan-review-status-saved {
          border-color: #86efac;
          background: #ecfdf4;
          color: #166534;
        }

        .plan-review-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .plan-review-action {
          min-height: 44px;
          border: 1px solid #cbd3e1;
          border-radius: 10px;
          padding: 10px 14px;
          background: #ffffff;
          color: #17204b;
          font: inherit;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease, box-shadow 120ms ease;
        }

        .plan-review-action:hover:not(:disabled) {
          border-color: #6c4df6;
          background: #f2edff;
        }

        .plan-review-action:focus-visible {
          outline: 3px solid #17204b;
          outline-offset: 3px;
        }

        .plan-review-action:disabled {
          border-color: #d8dee9;
          background: #eef1f6;
          color: #7b8496;
          cursor: not-allowed;
        }

        .plan-review-action-save[data-dirty="true"] {
          border-color: #6c4df6;
          background: #6c4df6;
          color: #ffffff;
        }

        .plan-review-action-save[data-dirty="true"]:hover:not(:disabled) {
          border-color: #5338d4;
          background: #5338d4;
        }

        .plan-review-action-save[data-dirty="false"] {
          border-color: #6c4df6;
          color: #5338d4;
        }

        .plan-review-action-approve {
          border-color: #2f9d68;
          background: #2f9d68;
          color: #ffffff;
        }

        .plan-review-action-ready {
          border-color: #6c4df6;
          color: #5338d4;
        }

        .plan-review-action-ready:hover:not(:disabled) {
          background: #f2edff;
        }

        .plan-review-action-approve:hover:not(:disabled) {
          border-color: #237a50;
          background: #237a50;
        }

        .plan-review-action-destructive {
          border-color: #e85d75;
          color: #a51d3b;
        }

        .plan-review-action-destructive:hover:not(:disabled) {
          border-color: #be3654;
          background: #fff1f2;
        }

        @media (max-width: 680px) {
          .plan-review-action-heading {
            align-items: stretch;
          }

          .plan-review-status {
            width: 100%;
          }

          .plan-review-actions {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .plan-review-action {
            width: 100%;
          }

          .plan-review-action-save,
          .plan-review-action-approve {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 380px) {
          .plan-review-actions {
            grid-template-columns: minmax(0, 1fr);
          }

          .plan-review-action-save,
          .plan-review-action-approve {
            grid-column: auto;
          }
        }
      `}</style>
      <form onSubmit={(event) => event.preventDefault()} style={{ display: "grid", gap: 18 }}>
        <section className="plan-review-action-bar" aria-label="Plan review actions" aria-busy={saving}>
          <div className="plan-review-action-heading">
            <div>
              <strong>Review status: {status.replaceAll("_", " ")}</strong>
              <div
                className={`plan-review-status plan-review-status-${statusTone}`}
                role="status"
                aria-live="polite"
                aria-label={`Plan review status: ${statusLabel}`}
              >
                <span aria-hidden="true">{dirty ? "!" : saving ? "…" : "✓"}</span>
                <span>{statusLabel}</span>
              </div>
            </div>
            <div className="plan-review-actions">
              <button className="plan-review-action plan-review-action-save" data-dirty={dirty} type="button" onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save draft"}</button>
              <button className="plan-review-action" type="button" onClick={onValidate} disabled={saving}>Validate</button>
              <button className="plan-review-action plan-review-action-ready" type="button" onClick={onReadyToUse} disabled={saving}>Mark Ready to use</button>
              <button className="plan-review-action plan-review-action-approve" type="button" onClick={onApprove} disabled={saving}>Approve plan</button>
              <button className="plan-review-action" type="button" onClick={onReturnToDraft} disabled={saving}>Return to draft</button>
              <button className="plan-review-action plan-review-action-destructive" type="button" onClick={onArchive} disabled={saving}>Archive</button>
              <button className="plan-review-action" type="button" onClick={onRegenerate} disabled={saving}>Regenerate as new revision</button>
            </div>
          </div>
        </section>

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
    </>
  );
}
