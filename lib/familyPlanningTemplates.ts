import { hasSupabaseEnv, supabase } from "@/lib/supabaseClient";
import { addFamilyCalendarBlock, type FamilyCalendarBlockEntry } from "@/lib/familyPlanner";

export type CalendarCycleType = "weekly" | "custom";
export type ProgramPeriodType = "term" | "semester" | "season" | "custom";
export type ProgramSegmentType = "week" | "sequence" | "focus" | "custom";
export type ProgramPlacementMode = "sequential" | "weekly" | "custom";
export type CalendarItemType =
  | "learning_block"
  | "task"
  | "appointment"
  | "playdate"
  | "reminder"
  | "custom";
export type CalendarTimeBlock = "morning" | "midday" | "afternoon";

export const CALENDAR_ITEM_TYPE_OPTIONS: Array<{
  value: CalendarItemType;
  label: string;
}> = [
  { value: "learning_block", label: "Learning block" },
  { value: "task", label: "Task" },
  { value: "appointment", label: "Appointment" },
  { value: "playdate", label: "Playdate" },
  { value: "reminder", label: "Reminder" },
  { value: "custom", label: "Custom" },
];

export const CALENDAR_TIME_BLOCK_OPTIONS: Array<{
  value: CalendarTimeBlock;
  label: string;
}> = [
  { value: "morning", label: "Morning" },
  { value: "midday", label: "Midday" },
  { value: "afternoon", label: "Afternoon" },
];

export type TemplateSlot = {
  id: string;
  templateId: string;
  dayOfWeek: number;
  startTime?: string | null;
  endTime?: string | null;
  subjectId?: string | null;
  label: string;
  notes?: string | null;
  itemType?: CalendarItemType | null;
  learnerIds?: string[];
  timeBlock?: CalendarTimeBlock | null;
  isPortfolioHighlight?: boolean;
};

export type CalendarTemplate = {
  id: string;
  familyId: string;
  title: string;
  cycleType: CalendarCycleType;
  cycleLength?: number | null;
  academicStructureType?: string | null;
  slots: TemplateSlot[];
  updatedAt?: string | null;
};

export type SuggestedPlanBlock = {
  id?: string | null;
  title: string;
  learningArea?: string | null;
  curriculumOutcomeIds: string[];
  suggestedDuration?: string | null;
  notes?: string | null;
};

export type ProgramSegment = {
  id: string;
  programId: string;
  order: number;
  title: string;
  notes?: string | null;
  curriculumOutcomeIds: string[];
  evidencePrompts?: string[];
  assessmentIntents?: string[];
  suggestedPlanBlocks?: SuggestedPlanBlock[];
};

export type ProgramScheduleMapping = {
  id: string;
  programId: string;
  calendarTemplateSlotId: string;
  placementMode: ProgramPlacementMode;
  startDate: string;
};

export type Program = {
  id: string;
  familyId: string;
  learnerId?: string | null;
  title: string;
  subjectId: string;
  frameworkId: string;
  jurisdictionId?: string | null;
  periodType: ProgramPeriodType;
  periodLabel: string;
  durationCount: number;
  segmentType: ProgramSegmentType;
  startDate?: string | null;
  endDate?: string | null;
  calendarTemplateSlotId?: string | null;
  curriculumOutcomeIds: string[];
  segments: ProgramSegment[];
  scheduleMapping?: ProgramScheduleMapping | null;
  updatedAt?: string | null;
};

const STORAGE_KEYS = {
  calendarTemplates: "mylearna_calendar_templates_v1",
  programs: "mylearna_programs_v1",
};

type TemplateRowsResult = {
  data: Array<Record<string, unknown>> | null;
  error: unknown;
};

type UpsertResult = {
  error: unknown;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseBrowserStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseBrowserStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isDatabaseBackedId(value: unknown) {
  const id = safe(value);
  return !!id && id !== "local" && !id.startsWith("local-");
}

async function hasAuthenticatedSupabaseSession() {
  if (!hasSupabaseEnv) return false;

  const response = await supabase.auth.getSession().catch(() => null);
  const session = response?.data?.session;
  return Boolean(session?.access_token && session.user?.id);
}

async function canWritePlanningRows(familyId: string) {
  return isDatabaseBackedId(familyId) && (await hasAuthenticatedSupabaseSession());
}

function normalizeOutcomeIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => safe(item)).filter(Boolean);
}

function normalizeLearnerIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((item) => safe(item)).filter(Boolean)));
}

function normalizeCalendarItemType(value: unknown): CalendarItemType {
  const itemType = safe(value);
  if (
    itemType === "task" ||
    itemType === "appointment" ||
    itemType === "playdate" ||
    itemType === "reminder" ||
    itemType === "custom"
  ) {
    return itemType;
  }
  return "learning_block";
}

function inferTimeBlockFromStartTime(startTime: string | null) {
  const raw = safe(startTime);
  const match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hour = Number(match[1]);
  if (!Number.isFinite(hour)) return null;
  if (hour < 12) return "morning" as const;
  if (hour < 14) return "midday" as const;
  return "afternoon" as const;
}

function normalizeCalendarTimeBlock(
  value: unknown,
  fallbackStartTime?: string | null,
): CalendarTimeBlock {
  const timeBlock = safe(value);
  if (timeBlock === "morning" || timeBlock === "midday" || timeBlock === "afternoon") {
    return timeBlock;
  }
  return inferTimeBlockFromStartTime(fallbackStartTime ?? null) ?? "morning";
}

function asBoolean(value: unknown) {
  return value === true;
}

function isMissingSchemaError(error: unknown) {
  return safe((error as { message?: unknown })?.message)
    .toLowerCase()
    .includes("does not exist");
}

function requirePlanningWriteReady(familyId: string, label: string, ready: boolean) {
  if (ready) return;

  if (!isDatabaseBackedId(familyId)) {
    throw new Error(`${label} needs a synced family profile before it can save to your account.`);
  }

  throw new Error(`${label} needs an active Supabase session before it can save to your account.`);
}

function withTimeout<T>(promise: PromiseLike<T> | Promise<T>, ms = 12000) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => reject(new Error("Timed out.")), ms);
    }),
  ]).finally(() => {
    if (timer) clearTimeout(timer);
  }) as Promise<T>;
}

function normalizeTemplate(raw: Partial<CalendarTemplate>): CalendarTemplate {
  return {
    id: safe(raw.id) || makeId("calendar-template"),
    familyId: safe(raw.familyId),
    title: safe(raw.title) || "My Calendar Template",
    cycleType: raw.cycleType === "custom" ? "custom" : "weekly",
    cycleLength: typeof raw.cycleLength === "number" ? raw.cycleLength : null,
    academicStructureType: safe(raw.academicStructureType) || null,
    slots: Array.isArray(raw.slots)
      ? raw.slots.map((slot) => ({
          id: safe(slot.id) || makeId("slot"),
          templateId: safe(slot.templateId) || safe(raw.id) || "",
          dayOfWeek: typeof slot.dayOfWeek === "number" ? slot.dayOfWeek : 1,
          startTime: safe(slot.startTime) || null,
          endTime: safe(slot.endTime) || null,
          subjectId: safe(slot.subjectId) || null,
          label: safe(slot.label) || "Learning block",
          notes: safe(slot.notes) || null,
          itemType: normalizeCalendarItemType((slot as { itemType?: unknown }).itemType),
          learnerIds: normalizeLearnerIds((slot as { learnerIds?: unknown }).learnerIds),
          timeBlock: normalizeCalendarTimeBlock(
            (slot as { timeBlock?: unknown }).timeBlock,
            safe(slot.startTime) || null,
          ),
          isPortfolioHighlight: asBoolean(
            (slot as { isPortfolioHighlight?: unknown }).isPortfolioHighlight,
          ),
        }))
      : [],
    updatedAt: safe(raw.updatedAt) || nowIso(),
  };
}

function normalizeProgram(raw: Partial<Program>): Program {
  const programId = safe(raw.id) || makeId("program");
  const segments = Array.isArray(raw.segments) ? raw.segments : [];

  return {
    id: programId,
    familyId: safe(raw.familyId),
    learnerId: safe(raw.learnerId) || null,
    title: safe(raw.title) || "My Program",
    subjectId: safe(raw.subjectId) || "General",
    frameworkId: safe(raw.frameworkId) || "au-v9",
    jurisdictionId: safe(raw.jurisdictionId) || null,
    periodType:
      raw.periodType === "semester" || raw.periodType === "season" || raw.periodType === "custom"
        ? raw.periodType
        : "term",
    periodLabel: safe(raw.periodLabel) || "This term",
    durationCount:
      typeof raw.durationCount === "number" && raw.durationCount > 0 ? raw.durationCount : 10,
    segmentType:
      raw.segmentType === "sequence" || raw.segmentType === "focus" || raw.segmentType === "custom"
        ? raw.segmentType
        : "week",
    startDate: safe(raw.startDate) || null,
    endDate: safe(raw.endDate) || null,
    calendarTemplateSlotId: safe(raw.calendarTemplateSlotId) || null,
    curriculumOutcomeIds: normalizeOutcomeIds(raw.curriculumOutcomeIds),
    segments: segments.map((segment, index) => ({
      id: safe(segment.id) || makeId("segment"),
      programId,
      order:
        typeof segment.order === "number" && Number.isFinite(segment.order)
          ? segment.order
          : index + 1,
      title: safe(segment.title) || `Segment ${index + 1}`,
      notes: safe(segment.notes) || null,
      curriculumOutcomeIds: normalizeOutcomeIds(segment.curriculumOutcomeIds),
      evidencePrompts: Array.isArray(segment.evidencePrompts)
        ? segment.evidencePrompts.map((item) => safe(item)).filter(Boolean)
        : [],
      assessmentIntents: Array.isArray(segment.assessmentIntents)
        ? segment.assessmentIntents.map((item) => safe(item)).filter(Boolean)
        : [],
      suggestedPlanBlocks: Array.isArray(segment.suggestedPlanBlocks)
        ? segment.suggestedPlanBlocks.map((block) => ({
            id: safe(block.id) || null,
            title: safe(block.title) || "Learning block",
            learningArea: safe(block.learningArea) || null,
            curriculumOutcomeIds: normalizeOutcomeIds(block.curriculumOutcomeIds),
            suggestedDuration: safe(block.suggestedDuration) || null,
            notes: safe(block.notes) || null,
          }))
        : [],
    })),
    scheduleMapping: raw.scheduleMapping
      ? {
          id: safe(raw.scheduleMapping.id) || makeId("mapping"),
          programId,
          calendarTemplateSlotId: safe(raw.scheduleMapping.calendarTemplateSlotId),
          placementMode:
            raw.scheduleMapping.placementMode === "weekly" ||
            raw.scheduleMapping.placementMode === "custom"
              ? raw.scheduleMapping.placementMode
              : "sequential",
          startDate: safe(raw.scheduleMapping.startDate) || "",
        }
      : null,
    updatedAt: safe(raw.updatedAt) || nowIso(),
  };
}

function templatesFromLocal(familyId: string) {
  return readJson<CalendarTemplate[]>(STORAGE_KEYS.calendarTemplates, []).filter(
    (template) => template.familyId === familyId,
  );
}

function programsFromLocal(familyId: string) {
  return readJson<Program[]>(STORAGE_KEYS.programs, []).filter(
    (program) => program.familyId === familyId,
  );
}

function persistTemplateLocal(template: CalendarTemplate) {
  const current = readJson<CalendarTemplate[]>(STORAGE_KEYS.calendarTemplates, []);
  const next = [
    ...current.filter((item) => item.id !== template.id),
    template,
  ].sort((a, b) => (safe(b.updatedAt) > safe(a.updatedAt) ? 1 : -1));
  writeJson(STORAGE_KEYS.calendarTemplates, next);
}

function persistProgramLocal(program: Program) {
  const current = readJson<Program[]>(STORAGE_KEYS.programs, []);
  const next = [
    ...current.filter((item) => item.id !== program.id),
    program,
  ].sort((a, b) => (safe(b.updatedAt) > safe(a.updatedAt) ? 1 : -1));
  writeJson(STORAGE_KEYS.programs, next);
}

export async function loadFamilyCalendarTemplates(input: {
  familyId: string;
}): Promise<CalendarTemplate[]> {
  const local = templatesFromLocal(input.familyId).map(normalizeTemplate);
  if (!hasSupabaseEnv || !isDatabaseBackedId(input.familyId) || !(await hasAuthenticatedSupabaseSession())) return local;

  const response = (await withTimeout(
    supabase
      .from("family_calendar_templates")
      .select("id,family_profile_id,title,cycle_type,cycle_length,academic_structure_type,slots_json,updated_at")
      .eq("family_profile_id", input.familyId)
      .order("updated_at", { ascending: false }),
  ).catch((error) => ({ data: null, error }))) as TemplateRowsResult;

  if (response.error) {
    if (!isMissingSchemaError(response.error)) throw response.error;
    return local;
  }

  const rows = (response.data ?? []).map((row) =>
    normalizeTemplate({
      id: safe(row.id),
      familyId: safe(row.family_profile_id),
      title: safe(row.title),
      cycleType: safe(row.cycle_type) === "custom" ? "custom" : "weekly",
      cycleLength: typeof row.cycle_length === "number" ? row.cycle_length : null,
      academicStructureType: safe(row.academic_structure_type) || null,
      slots: Array.isArray(row.slots_json) ? (row.slots_json as TemplateSlot[]) : [],
      updatedAt: safe(row.updated_at) || nowIso(),
    }),
  );

  rows.forEach(persistTemplateLocal);
  return rows.length ? rows : local;
}

export async function saveFamilyCalendarTemplate(template: CalendarTemplate): Promise<CalendarTemplate> {
  const normalized = normalizeTemplate({ ...template, updatedAt: nowIso() });
  persistTemplateLocal(normalized);

  requirePlanningWriteReady(
    normalized.familyId,
    "My Calendar",
    await canWritePlanningRows(normalized.familyId),
  );

  const response = (await withTimeout(
    supabase.from("family_calendar_templates").upsert({
      id: normalized.id,
      family_profile_id: normalized.familyId,
      title: normalized.title,
      cycle_type: normalized.cycleType,
      cycle_length: normalized.cycleLength,
      academic_structure_type: normalized.academicStructureType,
      slots_json: normalized.slots,
      updated_at: normalized.updatedAt,
    }),
  ).catch((error) => ({ error }))) as UpsertResult;

  if (response.error) {
    throw response.error;
  }

  return normalized;
}

export async function loadFamilyPrograms(input: { familyId: string }): Promise<Program[]> {
  const local = programsFromLocal(input.familyId).map(normalizeProgram);
  if (!hasSupabaseEnv || !isDatabaseBackedId(input.familyId) || !(await hasAuthenticatedSupabaseSession())) return local;

  const response = (await withTimeout(
    supabase
      .from("family_programs")
      .select("id,family_profile_id,learner_id,title,subject_id,framework_id,jurisdiction_id,period_type,period_label,duration_count,segment_type,start_date,end_date,calendar_template_slot_id,curriculum_outcome_ids,segments_json,schedule_mapping_json,updated_at")
      .eq("family_profile_id", input.familyId)
      .order("updated_at", { ascending: false }),
  ).catch((error) => ({ data: null, error }))) as TemplateRowsResult;

  if (response.error) {
    if (!isMissingSchemaError(response.error)) throw response.error;
    return local;
  }

  const rows = (response.data ?? []).map((row) =>
    normalizeProgram({
      id: safe(row.id),
      familyId: safe(row.family_profile_id),
      learnerId: safe(row.learner_id) || null,
      title: safe(row.title),
      subjectId: safe(row.subject_id),
      frameworkId: safe(row.framework_id),
      jurisdictionId: safe(row.jurisdiction_id) || null,
      periodType: safe(row.period_type) as ProgramPeriodType,
      periodLabel: safe(row.period_label),
      durationCount: Number(row.duration_count ?? 0),
      segmentType: safe(row.segment_type) as ProgramSegmentType,
      startDate: safe(row.start_date) || null,
      endDate: safe(row.end_date) || null,
      calendarTemplateSlotId: safe(row.calendar_template_slot_id) || null,
      curriculumOutcomeIds: normalizeOutcomeIds(row.curriculum_outcome_ids),
      segments: Array.isArray(row.segments_json) ? (row.segments_json as ProgramSegment[]) : [],
      scheduleMapping:
        row.schedule_mapping_json && typeof row.schedule_mapping_json === "object"
          ? (row.schedule_mapping_json as ProgramScheduleMapping)
          : null,
      updatedAt: safe(row.updated_at) || nowIso(),
    }),
  );

  rows.forEach(persistProgramLocal);
  return rows.length ? rows : local;
}

export async function saveFamilyProgram(program: Program): Promise<Program> {
  const normalized = normalizeProgram({ ...program, updatedAt: nowIso() });
  persistProgramLocal(normalized);

  requirePlanningWriteReady(
    normalized.familyId,
    "My Programs",
    await canWritePlanningRows(normalized.familyId),
  );

  const response = (await withTimeout(
    supabase.from("family_programs").upsert({
      id: normalized.id,
      family_profile_id: normalized.familyId,
      learner_id: normalized.learnerId,
      title: normalized.title,
      subject_id: normalized.subjectId,
      framework_id: normalized.frameworkId,
      jurisdiction_id: normalized.jurisdictionId,
      period_type: normalized.periodType,
      period_label: normalized.periodLabel,
      duration_count: normalized.durationCount,
      segment_type: normalized.segmentType,
      start_date: normalized.startDate,
      end_date: normalized.endDate,
      calendar_template_slot_id: normalized.calendarTemplateSlotId,
      curriculum_outcome_ids: normalized.curriculumOutcomeIds,
      segments_json: normalized.segments,
      schedule_mapping_json: normalized.scheduleMapping,
      updated_at: normalized.updatedAt,
    }),
  ).catch((error) => ({ error }))) as UpsertResult;

  if (response.error) {
    throw response.error;
  }

  return normalized;
}

export function defaultCalendarTemplate(input: {
  familyId: string;
  academicStructureType?: string | null;
}) {
  const id = makeId("calendar-template");
  const slots: TemplateSlot[] = [
    {
      id: makeId("slot"),
      templateId: id,
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "10:00",
      subjectId: "Literacy",
      label: "Literacy block",
      notes: "",
      itemType: "learning_block",
      learnerIds: [],
      timeBlock: "morning",
      isPortfolioHighlight: false,
    },
    {
      id: makeId("slot"),
      templateId: id,
      dayOfWeek: 2,
      startTime: "10:00",
      endTime: "11:00",
      subjectId: "Numeracy",
      label: "Maths block",
      notes: "",
      itemType: "learning_block",
      learnerIds: [],
      timeBlock: "morning",
      isPortfolioHighlight: false,
    },
    {
      id: makeId("slot"),
      templateId: id,
      dayOfWeek: 3,
      startTime: "13:00",
      endTime: "14:30",
      subjectId: "Inquiry",
      label: "Inquiry block",
      notes: "",
      itemType: "learning_block",
      learnerIds: [],
      timeBlock: "afternoon",
      isPortfolioHighlight: false,
    },
  ];

  return normalizeTemplate({
    id,
    familyId: input.familyId,
    title: "My Calendar Template",
    cycleType: "weekly",
    cycleLength: 5,
    academicStructureType: input.academicStructureType || "terms",
    slots,
  });
}

export function defaultProgram(input: {
  familyId: string;
  learnerId?: string | null;
  frameworkId: string;
  jurisdictionId?: string | null;
  subjectId?: string;
  periodLabel?: string;
}): Program {
  const id = makeId("program");
  return normalizeProgram({
    id,
    familyId: input.familyId,
    learnerId: input.learnerId || null,
    title: "My Program Template",
    subjectId: input.subjectId || "Inquiry",
    frameworkId: input.frameworkId,
    jurisdictionId: input.jurisdictionId || null,
    periodType: "term",
    periodLabel: input.periodLabel || "This term",
    durationCount: 6,
    segmentType: "week",
    curriculumOutcomeIds: [],
    segments: Array.from({ length: 6 }, (_, index) => ({
      id: makeId("segment"),
      programId: id,
      order: index + 1,
      title: `Segment ${index + 1}`,
      notes: "",
      curriculumOutcomeIds: [],
      evidencePrompts: [],
      assessmentIntents: [],
      suggestedPlanBlocks: [],
    })),
  });
}

function parseDate(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function ymd(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function nextDateForWeekday(anchor: Date, weekday: number) {
  const copy = new Date(anchor);
  const jsTarget = weekday === 7 ? 0 : weekday;
  const diff = (jsTarget - copy.getDay() + 7) % 7;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export async function generateProgramIntoCalendar(input: {
  familyProfileId: string;
  learnerId: string;
  createdByUserId: string;
  program: Program;
  template: CalendarTemplate;
  slotId: string;
  startDate: string;
}): Promise<FamilyCalendarBlockEntry[]> {
  const slot = input.template.slots.find((item) => item.id === input.slotId);
  const start = parseDate(input.startDate);
  if (!slot || !start) return [];

  const scheduledStart = nextDateForWeekday(start, slot.dayOfWeek);
  const generated: FamilyCalendarBlockEntry[] = [];

  for (const segment of [...input.program.segments].sort((a, b) => a.order - b.order)) {
    const scheduledDate = new Date(scheduledStart);
    scheduledDate.setDate(scheduledStart.getDate() + (segment.order - 1) * 7);

    const primaryBlock = segment.suggestedPlanBlocks?.[0];
    const title = safe(primaryBlock?.title) || safe(segment.title) || input.program.title;
    const subject = safe(primaryBlock?.learningArea) || safe(slot.subjectId) || safe(input.program.subjectId) || "General";
    const note = [safe(slot.notes), safe(segment.notes), safe(primaryBlock?.notes)]
      .filter(Boolean)
      .join(" - ");
    const time = [safe(slot.startTime), safe(slot.endTime)].filter(Boolean).join(" - ");
    const curriculumOutcomeIds = [
      ...input.program.curriculumOutcomeIds,
      ...segment.curriculumOutcomeIds,
      ...(primaryBlock?.curriculumOutcomeIds ?? []),
    ].filter(Boolean);

    const created = await addFamilyCalendarBlock({
      familyProfileId: input.familyProfileId,
      studentId: input.learnerId,
      createdByUserId: input.createdByUserId,
      date: ymd(scheduledDate),
      title,
      subject,
      note,
      time,
      curriculumOutcomeIds,
      sourceType: "generated",
      programId: input.program.id,
      programSegmentId: segment.id,
      calendarTemplateSlotId: slot.id,
      itemType: "learning_block",
      learnerIds: [input.learnerId],
      timeBlock: normalizeCalendarTimeBlock(slot.timeBlock, slot.startTime ?? null),
      startTime: safe(slot.startTime) || null,
      endTime: safe(slot.endTime) || null,
      isPortfolioHighlight: slot.isPortfolioHighlight === true,
    });

    generated.push(created);
  }

  return generated;
}
