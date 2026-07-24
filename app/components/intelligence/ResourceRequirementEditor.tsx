"use client";

import type { GeneratedResourceItem } from "@/lib/intelligence/plans/types";

export default function ResourceRequirementEditor({ values, onChange }: { values: GeneratedResourceItem[]; onChange: (values: GeneratedResourceItem[]) => void }) {
  return (
    <fieldset style={{ display: "grid", gap: 12, border: 0, padding: 0, margin: 0 }}>
      <legend style={{ fontWeight: 700 }}>Resource requirements</legend>
      {values.map((resource, index) => (
        <div key={`resource-${index}`} style={{ display: "grid", gap: 8, border: "1px solid #dbe3ef", borderRadius: 12, padding: 12 }}>
          {(["name", "category", "quantity", "url", "notes"] as const).map((field) => (
            <label key={field} style={{ display: "grid", gap: 4 }}>
              {field[0].toUpperCase() + field.slice(1)}{field === "name" ? " *" : ""}
              <input
                aria-label={`Resource ${index + 1} ${field}`}
                required={field === "name"}
                value={resource[field] ?? ""}
                onChange={(event) => onChange(values.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: event.target.value || (field === "url" || field === "category" || field === "quantity" ? null : "") } : item))}
              />
            </label>
          ))}
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" checked={resource.required} onChange={(event) => onChange(values.map((item, itemIndex) => itemIndex === index ? { ...item, required: event.target.checked } : item))} />
            Required resource
          </label>
          <button type="button" onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove resource ${index + 1}`}>
            Remove resource
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...values, { name: "", category: null, quantity: null, required: true, url: null, notes: "" }])} style={{ justifySelf: "start" }}>
        Add resource
      </button>
    </fieldset>
  );
}
