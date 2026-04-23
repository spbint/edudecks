import type { ReportSectionStarterBlock } from "@/lib/reportSectionAutofill";
import { supabase } from "@/lib/supabaseClient";

export type PersistedReportSection = {
  id: string;
  title: string;
  content: string;
  status: string;
  sourceMode: string | null;
  locked: boolean;
};

type EnsureReportSectionInput = {
  reportDocumentId: string;
  sectionId?: string | null;
  title: string;
  order?: number | null;
};

type MutateSectionInput = EnsureReportSectionInput & {
  starterBlocks: ReportSectionStarterBlock[];
  existingContent?: string | null;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function asObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function normalizePersistedSection(raw: Record<string, unknown>, fallbackTitle: string): PersistedReportSection {
  return {
    id: safe(raw.id),
    title: safe(raw.title) || safe(raw.heading) || safe(raw.name) || fallbackTitle,
    content:
      safe(raw.body_rich_text) ||
      safe(raw.content) ||
      safe(raw.body) ||
      safe(raw.note),
    status: safe(raw.status) || "in_progress",
    sourceMode: safe(raw.source_mode) || safe(raw.mode) || null,
    locked:
      raw.locked === true ||
      raw.is_locked === true ||
      safe(raw.locked) === "true" ||
      safe(raw.is_locked) === "true",
  };
}

function renderStarterBlocks(blocks: ReportSectionStarterBlock[]) {
  return blocks
    .map((block) => {
      const title = safe(block.title);
      const heading = title ? `${title}\n` : "";

      if (block.type === "bullet_list" || block.type === "record_list") {
        return `${heading}${block.lines.map((line) => `- ${line}`).join("\n")}`;
      }

      if (block.type === "count_list") {
        return `${heading}${block.lines.map((line) => `- ${line}`).join("\n")}`;
      }

      return `${heading}${block.lines.join("\n")}`;
    })
    .filter(Boolean)
    .join("\n\n");
}

function joinContent(parts: Array<string | null | undefined>) {
  return parts
    .map((part) => safe(part))
    .filter(Boolean)
    .join("\n\n");
}

async function maybeSingle(
  table: string,
  configure: (query: ReturnType<typeof supabase.from>) => any,
) {
  const response = await configure(supabase.from(table));
  if (response.error) throw response.error;
  return response.data ? asObject(response.data) : null;
}

async function locateExistingSection(input: EnsureReportSectionInput) {
  const usableId = safe(input.sectionId);
  if (usableId && !usableId.startsWith("scaffold-")) {
    try {
      const row = await maybeSingle("report_sections", (query) =>
        query.select("*").eq("id", usableId).maybeSingle(),
      );
      if (row) return row;
    } catch {
      // continue to title-based lookup
    }
  }

  try {
    const row = await maybeSingle("report_sections", (query) =>
      query
        .select("*")
        .eq("report_document_id", input.reportDocumentId)
        .eq("title", input.title)
        .maybeSingle(),
    );
    if (row) return row;
  } catch {
    // fallback below
  }

  try {
    const row = await maybeSingle("report_sections", (query) =>
      query
        .select("*")
        .eq("document_id", input.reportDocumentId)
        .eq("title", input.title)
        .maybeSingle(),
    );
    if (row) return row;
  } catch {
    return null;
  }

  return null;
}

async function createSectionRecord(input: EnsureReportSectionInput) {
  const payloadVariants = [
    {
      report_document_id: input.reportDocumentId,
      title: input.title,
      status: "in_progress",
      display_order: input.order ?? null,
      source_mode: "starter_promoted",
      body_rich_text: "",
      content: "",
    },
    {
      document_id: input.reportDocumentId,
      title: input.title,
      status: "in_progress",
      display_order: input.order ?? null,
      source_mode: "starter_promoted",
      body_rich_text: "",
      content: "",
    },
    {
      report_document_id: input.reportDocumentId,
      title: input.title,
      status: "in_progress",
      display_order: input.order ?? null,
      mode: "starter_promoted",
      body: "",
    },
  ];

  for (const payload of payloadVariants) {
    try {
      const response = await supabase
        .from("report_sections")
        .insert(payload)
        .select("*")
        .maybeSingle();

      if (response.error) throw response.error;
      if (response.data) return asObject(response.data);
    } catch {
      // try next shape
    }
  }

  throw new Error("A report section record could not be created for this draft.");
}

async function ensureSectionRecord(input: EnsureReportSectionInput) {
  const existing = await locateExistingSection(input);
  if (existing) return existing;
  return createSectionRecord(input);
}

async function updateSectionRecord(
  sectionId: string,
  title: string,
  content: string,
) {
  const payloadVariants = [
    {
      body_rich_text: content,
      content,
      status: "in_progress",
      source_mode: "starter_promoted",
      updated_at: new Date().toISOString(),
    },
    {
      body_rich_text: content,
      status: "in_progress",
      source_mode: "starter_promoted",
      updated_at: new Date().toISOString(),
    },
    {
      content,
      status: "in_progress",
      source_mode: "starter_promoted",
      updated_at: new Date().toISOString(),
    },
    {
      body: content,
      status: "in_progress",
      mode: "starter_promoted",
      updated_at: new Date().toISOString(),
    },
  ];

  for (const payload of payloadVariants) {
    try {
      const response = await supabase
        .from("report_sections")
        .update(payload)
        .eq("id", sectionId)
        .select("*")
        .maybeSingle();

      if (response.error) throw response.error;
      if (response.data) return normalizePersistedSection(asObject(response.data), title);
    } catch {
      // try next shape
    }
  }

  throw new Error("The report section could not be updated.");
}

async function persistWithMode(
  input: MutateSectionInput,
  mode: "replace" | "append" | "prepend",
) {
  const sectionRow = await ensureSectionRecord(input);
  const normalized = normalizePersistedSection(sectionRow, input.title);

  if (normalized.locked) {
    throw new Error("This section is locked and cannot be changed from the starter controls.");
  }

  const starterContent = renderStarterBlocks(input.starterBlocks);
  if (!safe(starterContent)) {
    throw new Error("There is no starter content available to promote for this section.");
  }

  const current = safe(input.existingContent) || normalized.content;
  const nextContent =
    mode === "replace"
      ? starterContent
      : mode === "append"
        ? joinContent([current, starterContent])
        : joinContent([starterContent, current]);

  return updateSectionRecord(normalized.id, normalized.title, nextContent);
}

export async function applyStarterToSection(input: MutateSectionInput) {
  return persistWithMode(input, "replace");
}

export async function appendStarterToSection(input: MutateSectionInput) {
  return persistWithMode(input, "append");
}

export async function insertStarterAtTop(input: MutateSectionInput) {
  return persistWithMode(input, "prepend");
}

export async function replaceSectionContent(input: MutateSectionInput) {
  return persistWithMode(input, "replace");
}

export function dismissStarterForSection(sectionKey: string) {
  return safe(sectionKey);
}
