import type {
  DisplayNameSource,
  EvidenceTextSource,
  Nullable,
  YearLabelSource,
} from "@/lib/system/types";

function safeText(value: Nullable<string>) {
  return String(value ?? "").trim();
}

export function getDisplayName(
  value: Nullable<DisplayNameSource>,
  fallback = ""
) {
  if (!value) return fallback;

  const fullName = [
    safeText(value.preferred_name || value.first_name),
    safeText(value.surname || value.family_name || value.last_name),
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    safeText(value.label) ||
    safeText(value.name) ||
    safeText(value.child_name) ||
    safeText(value.title) ||
    fullName ||
    fallback
  );
}

export function getYearLabel(
  value: Nullable<YearLabelSource>,
  fallback = ""
) {
  if (!value) return fallback;

  const yearLevel = value.year_level;

  return (
    safeText(value.yearLabel) ||
    safeText(value.year_label) ||
    (yearLevel != null && String(yearLevel).trim()
      ? `Year ${String(yearLevel).trim()}`
      : fallback)
  );
}

export function getEvidenceText(
  value: Nullable<EvidenceTextSource>,
  fallback = ""
) {
  if (!value) return fallback;
  return safeText(value.summary) || safeText(value.body) || safeText(value.note) || fallback;
}

export function toRenderValue(value: Nullable<string | number>) {
  return value == null ? "" : String(value);
}
