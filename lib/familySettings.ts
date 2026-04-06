import { supabase } from "@/lib/supabaseClient";

/* ============================================================
   TYPES
   ============================================================ */

export type MarketKey = "au" | "uk" | "us";
export type ExperienceMode = "family" | "teacher" | "leadership";
export type DefaultChildLanding =
  | "dashboard"
  | "portfolio"
  | "planner"
  | "reports";
export type EvidencePrivacy = "private" | "family" | "shared";
export type WeekStart = "monday" | "sunday";

export type CurriculumPreferences = {
  country_id: string | null;
  region_id: string | null;
  framework_id: string | null;
  level_id: string | null;
  subject_ids: string[];
};

export type ChildOption = {
  id: string;
  label: string;
};

export type FamilySettings = {
  family_display_name: string;
  preferred_market: MarketKey;
  experience_mode: ExperienceMode;
  default_child_id: string | null;
  default_child_landing: DefaultChildLanding;
  week_start: WeekStart;
  compact_mode: boolean;
  show_advanced_insights: boolean;
  show_authority_guidance: boolean;
  auto_open_last_child: boolean;
  evidence_privacy_default: EvidencePrivacy;
  planner_auto_carry_forward: boolean;
  planner_show_weekend: boolean;
  portfolio_print_style: "calm" | "formal";
  report_tone_default: "family-summary" | "authority-ready" | "progress-review";
  notifications_weekly_digest: boolean;
  notifications_readiness_alerts: boolean;
  notifications_planner_nudges: boolean;
  curriculum_preferences: CurriculumPreferences;
};

export type FamilyProfileRow = FamilySettings & {
  id: string;
  created_at?: string;
  updated_at?: string;
};

/* ============================================================
   DEFAULTS
   ============================================================ */

export const DEFAULT_FAMILY_SETTINGS: FamilySettings = {
  family_display_name: "Your family",
  preferred_market: "au",
  experience_mode: "family",
  default_child_id: null,
  default_child_landing: "dashboard",
  week_start: "monday",
  compact_mode: false,
  show_advanced_insights: false,
  show_authority_guidance: true,
  auto_open_last_child: true,
  evidence_privacy_default: "family",
  planner_auto_carry_forward: true,
  planner_show_weekend: true,
  portfolio_print_style: "calm",
  report_tone_default: "family-summary",
  notifications_weekly_digest: true,
  notifications_readiness_alerts: true,
  notifications_planner_nudges: true,
  curriculum_preferences: {
    country_id: null,
    region_id: null,
    framework_id: null,
    level_id: null,
    subject_ids: [],
  },
};

export const DEFAULT_FAMILY_PROFILE: FamilyProfileRow = {
  id: "local",
  ...DEFAULT_FAMILY_SETTINGS,
};

/* ============================================================
   STORAGE KEYS
   ============================================================ */

const STORAGE_KEYS = {
  SETTINGS: "edudecks_family_settings_v1",
  ACTIVE_STUDENT: "edudecks_active_student_id",
  CHILDREN: "edudecks_children_seed_v1",
};

/* ============================================================
   HELPERS
   ============================================================ */

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function safeStringOrNull(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return null;
}

function safeStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => safeStringOrNull(item))
      .filter((item): item is string => Boolean(item));
  }
  return [];
}

function asCurriculumPreferences(value: unknown): CurriculumPreferences {
  if (!value) return DEFAULT_FAMILY_SETTINGS.curriculum_preferences;

  if (typeof value === "string") {
    try {
      return asCurriculumPreferences(JSON.parse(value));
    } catch {
      return DEFAULT_FAMILY_SETTINGS.curriculum_preferences;
    }
  }

  if (typeof value === "object" && value !== null) {
    const row = value as Record<string, unknown>;
    const country_id =
      safeStringOrNull(row.country_id ?? row.countryId ?? row.country) ??
      DEFAULT_FAMILY_SETTINGS.curriculum_preferences.country_id;
    const region_id =
      safeStringOrNull(row.region_id ?? row.regionId ?? row.region) ??
      DEFAULT_FAMILY_SETTINGS.curriculum_preferences.region_id;
    const framework_id =
      safeStringOrNull(row.framework_id ?? row.frameworkId ?? row.framework) ??
      DEFAULT_FAMILY_SETTINGS.curriculum_preferences.framework_id;
    const level_id =
      safeStringOrNull(row.level_id ?? row.levelId ?? row.level) ??
      DEFAULT_FAMILY_SETTINGS.curriculum_preferences.level_id;
    const subject_ids =
      safeStringArray(row.subject_ids ?? row.subjectIds ?? row.subjects) ||
      DEFAULT_FAMILY_SETTINGS.curriculum_preferences.subject_ids;

    return {
      country_id,
      region_id,
      framework_id,
      level_id,
      subject_ids,
    };
  }

  return DEFAULT_FAMILY_SETTINGS.curriculum_preferences;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asMarketKey(value: unknown): MarketKey {
  return value === "uk" || value === "us" ? value : "au";
}

function asExperienceMode(value: unknown): ExperienceMode {
  return value === "teacher" || value === "leadership" ? value : "family";
}

function asDefaultChildLanding(value: unknown): DefaultChildLanding {
  if (
    value === "portfolio" ||
    value === "planner" ||
    value === "reports"
  ) {
    return value;
  }
  return "dashboard";
}

function asEvidencePrivacy(value: unknown): EvidencePrivacy {
  return value === "private" || value === "shared" ? value : "family";
}

function asWeekStart(value: unknown): WeekStart {
  return value === "sunday" ? "sunday" : "monday";
}

function asPortfolioPrintStyle(value: unknown): "calm" | "formal" {
  return value === "formal" ? "formal" : "calm";
}

function asReportTone(
  value: unknown
): "family-summary" | "authority-ready" | "progress-review" {
  if (value === "authority-ready" || value === "progress-review") {
    return value;
  }
  return "family-summary";
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseBrowserStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseBrowserStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage errors
  }
}

/* ============================================================
   MAPPERS
   ============================================================ */

export function rowToSettings(row: Partial<FamilyProfileRow> | null | undefined): FamilySettings {
  if (!row) return { ...DEFAULT_FAMILY_SETTINGS };

  return {
    family_display_name:
      safeString(row.family_display_name) || DEFAULT_FAMILY_SETTINGS.family_display_name,
    preferred_market: asMarketKey(row.preferred_market),
    experience_mode: asExperienceMode(row.experience_mode),
    default_child_id: safeString(row.default_child_id) || null,
    default_child_landing: asDefaultChildLanding(row.default_child_landing),
    week_start: asWeekStart(row.week_start),
    compact_mode: asBoolean(row.compact_mode, DEFAULT_FAMILY_SETTINGS.compact_mode),
    show_advanced_insights: asBoolean(
      row.show_advanced_insights,
      DEFAULT_FAMILY_SETTINGS.show_advanced_insights
    ),
    show_authority_guidance: asBoolean(
      row.show_authority_guidance,
      DEFAULT_FAMILY_SETTINGS.show_authority_guidance
    ),
    auto_open_last_child: asBoolean(
      row.auto_open_last_child,
      DEFAULT_FAMILY_SETTINGS.auto_open_last_child
    ),
    evidence_privacy_default: asEvidencePrivacy(row.evidence_privacy_default),
    planner_auto_carry_forward: asBoolean(
      row.planner_auto_carry_forward,
      DEFAULT_FAMILY_SETTINGS.planner_auto_carry_forward
    ),
    planner_show_weekend: asBoolean(
      row.planner_show_weekend,
      DEFAULT_FAMILY_SETTINGS.planner_show_weekend
    ),
    portfolio_print_style: asPortfolioPrintStyle(row.portfolio_print_style),
    report_tone_default: asReportTone(row.report_tone_default),
    notifications_weekly_digest: asBoolean(
      row.notifications_weekly_digest,
      DEFAULT_FAMILY_SETTINGS.notifications_weekly_digest
    ),
    notifications_readiness_alerts: asBoolean(
      row.notifications_readiness_alerts,
      DEFAULT_FAMILY_SETTINGS.notifications_readiness_alerts
    ),
    notifications_planner_nudges: asBoolean(
      row.notifications_planner_nudges,
      DEFAULT_FAMILY_SETTINGS.notifications_planner_nudges
    ),
    curriculum_preferences: asCurriculumPreferences(row.curriculum_preferences),
  };
}

/* ============================================================
   LOCAL STORAGE
   ============================================================ */

export function loadSettingsFromLocalStorage(): FamilySettings {
  const raw = readJson<Partial<FamilySettings> | null>(STORAGE_KEYS.SETTINGS, null);
  return rowToSettings(raw ?? undefined);
}

export function persistSettingsToLocalStorage(settings: FamilySettings) {
  writeJson(STORAGE_KEYS.SETTINGS, settings);
}

export function getCurrentUserId(): string {
  return "local-user";
}

export function loadChildrenFromLocalStorage(): ChildOption[] {
  const raw = readJson<unknown[]>(STORAGE_KEYS.CHILDREN, []);
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      const row = item as Record<string, unknown>;
      const id = safeString(row.id);
      const firstName =
        safeString(row.first_name) ||
        safeString(row.firstName) ||
        safeString(row.given_name) ||
        safeString(row.givenName);
      const lastName =
        safeString(row.last_name) ||
        safeString(row.lastName) ||
        safeString(row.surname) ||
        safeString(row.family_name) ||
        safeString(row.familyName);
      const explicitName = safeString(row.name);
      const label = explicitName || [firstName, lastName].filter(Boolean).join(" ");

      if (!id || !label) return null;
      return { id, label };
    })
    .filter((value): value is ChildOption => value !== null);
}

/* ============================================================
   SUPABASE LOAD / SAVE
   ============================================================ */

export async function loadFamilyProfile(): Promise<FamilyProfileRow> {
  const { data, error } = await supabase
    .from("family_profiles")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("loadFamilyProfile error:", error);
    return { ...DEFAULT_FAMILY_PROFILE };
  }

  if (!data) {
    return { ...DEFAULT_FAMILY_PROFILE };
  }

  return {
    ...DEFAULT_FAMILY_PROFILE,
    ...data,
  };
}

export async function upsertFamilyProfile(
  settings: FamilySettings
): Promise<FamilyProfileRow> {
  const payload: FamilyProfileRow = {
    id: "local",
    ...DEFAULT_FAMILY_SETTINGS,
    ...settings,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("family_profiles")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    console.error("upsertFamilyProfile error:", error);
    throw error;
  }

  return {
    ...DEFAULT_FAMILY_PROFILE,
    ...data,
  };
}

export async function saveFamilyProfile(settings: FamilySettings): Promise<void> {
  await upsertFamilyProfile(settings);
}
