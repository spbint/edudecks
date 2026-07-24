"use client";

export default function ListFieldEditor({
  label,
  values,
  onChange,
  required = false,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  required?: boolean;
}) {
  function update(index: number, value: string) {
    onChange(values.map((item, itemIndex) => itemIndex === index ? value : item));
  }
  return (
    <fieldset style={{ display: "grid", gap: 8, border: 0, padding: 0, margin: 0 }}>
      <legend style={{ fontWeight: 700 }}>{label}{required ? " *" : ""}</legend>
      {values.map((value, index) => (
        <div key={`${label}-${index}`} style={{ display: "flex", gap: 8 }}>
          <input
            aria-label={`${label} ${index + 1}`}
            value={value}
            onChange={(event) => update(index, event.target.value)}
            style={{ flex: 1, minWidth: 0 }}
          />
          <button type="button" onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${label} ${index + 1}`}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...values, ""])} style={{ justifySelf: "start" }}>
        Add {label.toLowerCase()}
      </button>
    </fieldset>
  );
}
