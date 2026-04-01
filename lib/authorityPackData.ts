import { supabase } from "@/lib/supabaseClient";
import type { ReportDraftRow } from "@/lib/reportDrafts";
import type { AuthorityPackConfig } from "@/lib/authorityPackConfig";

export type AuthorityEvidenceRow = {
  id: string;
  title: string;
  summary: string;
  learningArea: string;
  occurredOn: string;
  role: "core" | "appendix";
  required: boolean;
};

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function isMissingRelationOrColumn(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return (
    msg.includes("does not exist") &&
    (msg.includes("relation") || msg.includes("column"))
  );
}

function guessArea(raw: string | null | undefined) {
  const x = safe(raw).toLowerCase();

  if (
    x.includes("liter") ||
    x.includes("reading") ||
    x.includes("writing") ||
    x.includes("english")
  ) {
    return "Literacy";
  }
  if (x.includes("math") || x.includes("num")) return "Numeracy";
  if (x.includes("science")) return "Science";
  if (
    x.includes("history") ||
    x.includes("geography") ||
    x.includes("human") ||
    x.includes("hass")
  ) {
    return "Humanities";
  }
  if (x.includes("art") || x.includes("music") || x.includes("drama")) {
    return "The Arts";
  }
  if (
    x.includes("health") ||
    x.includes("physical") ||
    x.includes("pe") ||
    x.includes("wellbeing")
  ) {
    return "Health & PE";
  }
  if (x.includes("tech")) return "Technologies";
  if (x.includes("language")) return "Languages";
  return "Other";
}

function shortDate(value?: string | null) {
  const s = safe(value);
  if (!s) return "—";
  try {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s.slice(0, 10);
    return d.toLocaleDateString();
  } catch {
    return s.slice(0, 10);
  }
}

export function getAuthorityFilteredEvidenceIds(
  draft: ReportDraftRow,
  config: AuthorityPackConfig
): string[] {
  let ids = [...(config.selectedEvidenceIds || [])];

  if (config.includeOnlyCoreEvidence) {
    ids = ids.filter(
      (id) => draft.selection_meta?.[id]?.role !== "appendix"
    );
  }

  if (config.includeOnlyRequiredEvidence) {
    ids = ids.filter((id) => Boolean(draft.selection_meta?.[id]?.required));
  }

  return ids;
}

export async function loadAuthorityEvidenceRows(
  draft: ReportDraftRow,
  config: AuthorityPackConfig
): Promise<AuthorityEvidenceRow[]> {
  const filteredIds = getAuthorityFilteredEvidenceIds(draft, config);
  if (!filteredIds.length) return [];

  const variants = [
    "id,title,summary,body,note,learning_area,occurred_on,created_at,is_deleted",
    "id,title,summary,note,learning_area,occurred_on,created_at,is_deleted",
    "id,title,note,learning_area,occurred_on,created_at,is_deleted",
  ];

  let records: any[] = [];

  for (const select of variants) {
    const res = await supabase
      .from("evidence_entries")
      .select(select)
      .in("id", filteredIds);

    if (!res.error) {
      records = (res.data || []).filter((x: any) => !x?.is_deleted);
      break;
    }

    if (!isMissingRelationOrColumn(res.error)) {
      break;
    }
  }

  const byId = new Map<string, any>();
  records.forEach((row) => byId.set(safe(row.id), row));

  return filteredIds.map((id) => {
    const row = byId.get(id);
    const role =
      draft.selection_meta?.[id]?.role === "appendix" ? "appendix" : "core";
    const required = Boolean(draft.selection_meta?.[id]?.required);

    return {
      id,
      title: safe(row?.title) || `Evidence ${id}`,
      summary:
        safe(row?.summary || row?.body || row?.note) ||
        "No written summary available.",
      learningArea: guessArea(row?.learning_area),
      occurredOn: shortDate(row?.occurred_on || row?.created_at),
      role,
      required,
    };
  });
}