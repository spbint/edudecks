"use client";

import type { GeneratedSequenceItem } from "@/lib/intelligence/plans/types";

export default function SequenceEditor({ label, values, onChange }: { label: string; values: GeneratedSequenceItem[]; onChange: (values: GeneratedSequenceItem[]) => void }) {
  return (
    <fieldset style={{ display: "grid", gap: 12, border: 0, padding: 0, margin: 0 }}>
      <legend style={{ fontWeight: 700 }}>{label} *</legend>
      {values.map((step, index) => (
        <div key={`${label}-${index}`} style={{ display: "grid", gap: 8, border: "1px solid #dbe3ef", borderRadius: 12, padding: 12 }}>
          <strong>Step {index + 1}</strong>
          {(["title", "objective", "activity", "notes"] as const).map((field) => (
            <label key={field} style={{ display: "grid", gap: 4 }}>
              {field[0].toUpperCase() + field.slice(1)}{field !== "notes" ? " *" : ""}
              <textarea
                aria-label={`Step ${index + 1} ${field}`}
                required={field !== "notes"}
                value={step[field]}
                onChange={(event) => onChange(values.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: event.target.value } : item))}
                rows={field === "activity" || field === "notes" ? 3 : 2}
              />
            </label>
          ))}
          <label style={{ display: "grid", gap: 4 }}>
            Duration minutes
            <input
              aria-label={`Step ${index + 1} duration minutes`}
              type="number"
              min={0}
              max={1440}
              value={step.durationMinutes ?? ""}
              onChange={(event) => onChange(values.map((item, itemIndex) => itemIndex === index ? { ...item, durationMinutes: event.target.value === "" ? null : Number(event.target.value) } : item))}
            />
          </label>
          <button type="button" onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove step ${index + 1}`}>
            Remove step
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...values, { title: "", objective: "", activity: "", durationMinutes: null, notes: "" }])} style={{ justifySelf: "start" }}>
        Add step
      </button>
    </fieldset>
  );
}
