import type { Nullable } from "@/lib/system/types";

export function safeText(value: Nullable<string>) {
  return String(value ?? "").trim();
}

export function safeNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function safeDateText(value: unknown): string | null {
  const text = safeText(typeof value === "string" ? value : String(value ?? ""));
  return text || null;
}
