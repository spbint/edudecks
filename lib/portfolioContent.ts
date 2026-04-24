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
  sections: any[];
  packItems?: any[];
  localeCode?: string;
}): PortfolioContentModel {
  const sections = Array.isArray(params.sections) ? params.sections : [];
  const packItems = Array.isArray(params.packItems) ? params.packItems : [];
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

  const highlights = uniqueBy(
    sections
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
        } satisfies PortfolioHighlight;
      })
      .filter(Boolean) as PortfolioHighlight[],
    (item) => `${item.id}:${normalizeKey(item.title)}`,
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
