const MAX_TEXT = 2000;

function clean(value: string | null, max: number) {
  return (value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
}
export function extractSharedHttpUrl(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const text = clean(value ?? null, MAX_TEXT);
    const candidates = text.match(/https?:\/\/[^\s<>"']+/gi) ?? [];
    for (const candidate of candidates) {
      const trimmed = candidate.replace(/[),.;!?]+$/, "");
      try {
        const parsed = new URL(trimmed);
        if (parsed.protocol === "http:" || parsed.protocol === "https:") return parsed.toString();
      } catch {
        // Continue looking for the next safe URL in shared text.
      }
    }
  }
  return null;
}
