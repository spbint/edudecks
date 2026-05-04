import { supabase } from "@/lib/supabaseClient";

type QueryClient = Pick<typeof supabase, "from">;

export type PortfolioSectionType =
  | "overview"
  | "highlight"
  | "work_sample"
  | "project"
  | "reflection"
  | "skills"
  | "resources"
  | "milestone"
  | "next_steps"
  | "other";

export type PortfolioHighlight = {
  id: string;
  title: string;
  description: string | null;
  date?: string | null;
  itemType?: string | null;
  learningArea?: string | null;
  learnerId?: string | null;
  origin?: "section" | "calendar";
};

export type PortfolioWorkSample = {
  id: string;
  title: string;
  description: string | null;
  subjectLabel?: string | null;
  createdAt?: string | null;
};

export type PortfolioReflectionPrompt = {
  prompt: string;
};

export type PortfolioSkillSummary = {
  label: string;
  count: number;
};

export type PortfolioCalendarHighlight = {
  id: string;
  title: string;
  description: string | null;
  date: string | null;
  itemType: string | null;
  learningArea: string | null;
  learnerId: string | null;
};

export type PortfolioContentModel = {
  learnerId: string;
  reportDocumentId: string | null;
  localeCode: string;
  highlights: PortfolioHighlight[];
  workSamples: PortfolioWorkSample[];
  reflections: PortfolioReflectionPrompt[];
  skills: PortfolioSkillSummary[];
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function asObject(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function normalizeKey(value: unknown) {
  return safe(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function stripHtml(value: unknown) {
  return safe(value)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueBy<T>(items: T[], keyFor: (item: T) => string) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = keyFor(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sectionIdFor(section: Record<string, unknown>, fallback: string) {
  return (
    safe(section.id) ||
    safe(section.section_id) ||
    safe(section.sectionId) ||
    fallback
  );
}

function sectionTitleFor(section: Record<string, unknown>) {
  return (
    safe(section.title) ||
    safe(section.label) ||
    safe(section.section_title) ||
    "Portfolio section"
  );
}

function sectionBodyFor(section: Record<string, unknown>) {
  return (
    stripHtml(section.contentHtml) ||
    stripHtml(section.content_html) ||
    stripHtml(section.contentPreview) ||
    stripHtml(section.content_preview) ||
    stripHtml(section.content) ||
    stripHtml(section.description)
  );
}

function itemDescriptionFor(item: Record<string, unknown>) {
  return (
    stripHtml(item.description) ||
    stripHtml(item.note) ||
    stripHtml(item.summary) ||
    stripHtml(item.content) ||
    null
  );
}

function itemSubjectLabelFor(item: Record<string, unknown>) {
  return (
    safe(item.subjectLabel) ||
    safe(item.subject_label) ||
    safe(item.subject) ||
    safe(item.learningArea) ||
    safe(item.learning_area) ||
    null
  );
}

function reflectionPromptDefaults() {
  return [
    { prompt: "What learning moment are you most proud of?" },
    { prompt: "What project showed growth or persistence?" },
    { prompt: "What skill became stronger this term?" },
    { prompt: "What would you like to remember from this learning period?" },
    { prompt: "What should we keep working on next?" },
  ];
}

function normalizeCalendarItemType(value: unknown) {
  const normalized = safe(value).toLowerCase();
  if (
    normalized === "learning_block" ||
    normalized === "task" ||
    normalized === "appointment" ||
    normalized === "playdate" ||
    normalized === "reminder" ||
    normalized === "custom"
  ) {
    return normalized;
  }
  return null;
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => safe(entry)).filter(Boolean);
}

function parsePortfolioCalendarPayload(value: unknown) {
  const raw = safe(value);
  if (!raw) {
    return {
      note: "",
      itemType: null as string | null,
      learnerIds: [] as string[],
      isPortfolioHighlight: false,
    };
  }

  try {
    const parsed = asObject(JSON.parse(raw));
    return {
      note: safe(parsed?.note),
      itemType: normalizeCalendarItemType(parsed?.itemType),
      learnerIds: stringArray(parsed?.learnerIds),
      isPortfolioHighlight: parsed?.isPortfolioHighlight === true,
    };
  } catch {
    return {
      note: raw,
      itemType: null,
      learnerIds: [],
      isPortfolioHighlight: false,
    };
  }
}

function parsePortfolioCalendarLearningArea(source: unknown, itemType: string | null) {
  if (itemType !== "learning_block") return null;
  const parsed = safe(source).replace("planner_calendar_block:", "");
  return parsed || null;
}

export function portfolioCalendarItemTypeLabel(itemType: string | null | undefined) {
  const normalized = normalizeCalendarItemType(itemType);
  if (normalized === "task") return "Task";
  if (normalized === "appointment") return "Appointment";
  if (normalized === "playdate") return "Playdate";
  if (normalized === "reminder") return "Reminder";
  if (normalized === "custom") return "Custom";
  return "Learning block";
}

export function formatPortfolioHighlightDate(
  dateValue: string | null | undefined,
  localeCode?: string | null,
) {
  const raw = safe(dateValue);
  if (!raw) return "";
  const parsed = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString(safe(localeCode) || "en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export async function loadPortfolioCalendarHighlights(input: {
  learnerId: string;
  familyProfileId?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  client?: QueryClient;
}): Promise<PortfolioCalendarHighlight[]> {
  const learnerId = safe(input.learnerId);
  if (!learnerId) return [];

  const db = input.client || supabase;
  const familyProfileId = safe(input.familyProfileId);
  const dateFrom = safe(input.dateFrom);
  const dateTo = safe(input.dateTo);

  let query = db
    .from("learning_plan_items")
    .select("id,title,description,planned_date,source,student_id");

  if (familyProfileId) {
    query = query.eq("family_profile_id", familyProfileId);
  } else {
    query = query.eq("student_id", learnerId);
  }

  if (dateFrom) query = query.gte("planned_date", dateFrom);
  if (dateTo) query = query.lte("planned_date", dateTo);

  const response = await query.order("planned_date", { ascending: false });
  if (response.error) throw response.error;

  return uniqueBy(
    ((response.data ?? []) as Array<Record<string, unknown>>)
      .map((row, index) => {
        const parsed = parsePortfolioCalendarPayload(row.description);
        if (!parsed.isPortfolioHighlight) return null;

        const primaryLearnerId = safe(row.student_id);
        const learnerIds = parsed.learnerIds.length
          ? parsed.learnerIds
          : [primaryLearnerId].filter(Boolean);
        if (learnerIds.length && !learnerIds.includes(learnerId) && primaryLearnerId !== learnerId) {
          return null;
        }

        return {
          id: safe(row.id) || `calendar-highlight-${index + 1}`,
          title: safe(row.title) || "Calendar highlight",
          description: parsed.note || null,
          date: safe(row.planned_date) || null,
          itemType: parsed.itemType,
          learningArea: parsePortfolioCalendarLearningArea(row.source, parsed.itemType),
          learnerId: primaryLearnerId || learnerId || null,
        } satisfies PortfolioCalendarHighlight;
      })
      .filter(Boolean) as PortfolioCalendarHighlight[],
    (item) => item.id,
  );
}

export function classifyPortfolioSection(section: {
  section_key?: string | null;
  title?: string | null;
}): PortfolioSectionType {
  const sectionKey = normalizeKey(section.section_key);

  if (sectionKey) {
    if (
      [
        "portfolio_overview",
        "overview",
        "learning_portfolio_overview",
      ].includes(sectionKey)
    ) {
      return "overview";
    }
    if (
      [
        "learning_highlights",
        "highlight",
        "highlights",
        "learning_story",
      ].includes(sectionKey)
    ) {
      return "highlight";
    }
    if (
      [
        "work_samples",
        "work_sample",
        "sample",
        "samples",
      ].includes(sectionKey)
    ) {
      return "work_sample";
    }
    if (["project", "projects"].includes(sectionKey)) {
      return "project";
    }
    if (
      [
        "reflections_growth",
        "reflection",
        "reflections",
        "reflections_and_growth",
        "memories",
      ].includes(sectionKey)
    ) {
      return "reflection";
    }
    if (
      [
        "skills",
        "skills_summary",
        "skill_summary",
        "subject_coverage",
        "learning_areas",
      ].includes(sectionKey)
    ) {
      return "skills";
    }
    if (
      [
        "resources",
        "books_resources_field_trips",
        "books_resources_and_field_trips",
      ].includes(sectionKey)
    ) {
      return "resources";
    }
    if (["milestone", "milestones"].includes(sectionKey)) {
      return "milestone";
    }
    if (
      [
        "next_steps",
        "next_step",
        "next_documentation_step",
      ].includes(sectionKey)
    ) {
      return "next_steps";
    }
  }

  const title = normalizeKey(section.title);
  if (!title) return "other";
  if (title.includes("overview")) return "overview";
  if (title.includes("highlight") || title.includes("story")) return "highlight";
  if (title.includes("work_sample") || title.includes("work_samples") || title.includes("sample")) return "work_sample";
  if (title.includes("project")) return "project";
  if (title.includes("reflection") || title.includes("memory") || title.includes("growth")) return "reflection";
  if (title.includes("skill") || title.includes("subject_coverage") || title.includes("learning_area")) return "skills";
  if (title.includes("resource") || title.includes("book") || title.includes("field_trip") || title.includes("excursion")) return "resources";
  if (title.includes("milestone")) return "milestone";
  if (title.includes("next_step")) return "next_steps";
  return "other";
}

export function buildPortfolioContentModel(params: {
  sections: unknown[];
  packItems?: unknown[];
  localeCode?: string;
  calendarHighlights?: PortfolioCalendarHighlight[];
}): PortfolioContentModel {
  const sections = Array.isArray(params.sections) ? params.sections : [];
  const packItems = Array.isArray(params.packItems) ? params.packItems : [];
  const calendarHighlights = Array.isArray(params.calendarHighlights)
    ? params.calendarHighlights
    : [];
  const firstSection = (sections[0] ?? {}) as Record<string, unknown>;
  const firstPackItem = (packItems[0] ?? {}) as Record<string, unknown>;

  const learnerId =
    safe(firstSection.learnerId) ||
    safe(firstSection.learner_id) ||
    safe(firstPackItem.learnerId) ||
    safe(firstPackItem.learner_id);
  const reportDocumentId =
    safe(firstSection.reportDocumentId) ||
    safe(firstSection.report_document_id) ||
    safe(firstPackItem.reportDocumentId) ||
    safe(firstPackItem.report_document_id) ||
    null;

  const sectionHighlights = sections
    .map((rawSection, index) => {
      const section = rawSection as Record<string, unknown>;
      const sectionType = classifyPortfolioSection({
        section_key: safe(section.section_key) || safe(section.sectionKey),
        title: safe(section.title),
      });
      if (sectionType !== "highlight") return null;

      return {
        id: sectionIdFor(section, `highlight-${index + 1}`),
        title: sectionTitleFor(section),
        description: sectionBodyFor(section) || null,
        date: null,
        itemType: null,
        learningArea: null,
        learnerId: learnerId || null,
        origin: "section",
      } satisfies PortfolioHighlight;
    })
    .filter(Boolean) as PortfolioHighlight[];

  const calendarPortfolioHighlights = calendarHighlights.map((item, index) => ({
    id: safe(item.id) || `calendar-highlight-${index + 1}`,
    title: safe(item.title) || "Calendar highlight",
    description: safe(item.description) || null,
    date: safe(item.date) || null,
    itemType: safe(item.itemType) || null,
    learningArea: safe(item.learningArea) || null,
    learnerId: safe(item.learnerId) || learnerId || null,
    origin: "calendar" as const,
  }));

  const highlights = uniqueBy(
    [...calendarPortfolioHighlights, ...sectionHighlights],
    (item) => `${item.id}:${normalizeKey(item.title)}:${safe(item.date)}`,
  );

  const sectionWorkSamples = sections
    .map((rawSection, index) => {
      const section = rawSection as Record<string, unknown>;
      const sectionType = classifyPortfolioSection({
        section_key: safe(section.section_key) || safe(section.sectionKey),
        title: safe(section.title),
      });
      if (sectionType !== "work_sample" && sectionType !== "project") {
        return null;
      }

      return {
        id: sectionIdFor(section, `sample-${index + 1}`),
        title: sectionTitleFor(section),
        description: sectionBodyFor(section) || null,
        subjectLabel: itemSubjectLabelFor(section),
        createdAt: safe(section.createdAt) || safe(section.created_at) || null,
      } satisfies PortfolioWorkSample;
    })
    .filter(Boolean) as PortfolioWorkSample[];

  const packItemWorkSamples = packItems
    .map((rawItem, index) => {
      const item = rawItem as Record<string, unknown>;
      const title = safe(item.title) || safe(item.label);
      if (!title) return null;

      return {
        id: safe(item.id) || `pack-item-${index + 1}`,
        title,
        description: itemDescriptionFor(item),
        subjectLabel: itemSubjectLabelFor(item),
        createdAt: safe(item.createdAt) || safe(item.created_at) || null,
      } satisfies PortfolioWorkSample;
    })
    .filter(Boolean) as PortfolioWorkSample[];

  const workSamples = uniqueBy(
    [...sectionWorkSamples, ...packItemWorkSamples],
    (item) => `${item.id}:${normalizeKey(item.title)}`,
  );

  const subjectCounts = new Map<string, number>();
  [...sections, ...packItems].forEach((rawItem) => {
    const item = rawItem as Record<string, unknown>;
    const subjectLabel = itemSubjectLabelFor(item);
    if (!subjectLabel) return;
    subjectCounts.set(subjectLabel, (subjectCounts.get(subjectLabel) || 0) + 1);
  });

  const skills = Array.from(subjectCounts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));

  const reflectionSections = sections.filter((rawSection) => {
    const section = rawSection as Record<string, unknown>;
    return (
      classifyPortfolioSection({
        section_key: safe(section.section_key) || safe(section.sectionKey),
        title: safe(section.title),
      }) === "reflection"
    );
  }) as Record<string, unknown>[];

  const reflectionStrength = reflectionSections.reduce(
    (max, section) => Math.max(max, sectionBodyFor(section).length),
    0,
  );
  const reflections =
    reflectionSections.length === 0 || reflectionStrength < 80
      ? reflectionPromptDefaults()
      : [];

  return {
    learnerId,
    reportDocumentId,
    localeCode: safe(params.localeCode) || "en-AU",
    highlights,
    workSamples,
    reflections,
    skills,
  };
}
