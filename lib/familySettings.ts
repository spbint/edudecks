import { hasSupabaseEnv, supabase } from "@/lib/supabaseClient";

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

export type ChildOption = {
  id: string;
  label: string;
  yearLabel?: string;
  year_level?: string | number | null;
  connectedAt?: string | null;
};

export type CurriculumPreferences = {
  country_id: string | null;
  region_id: string | null;
  framework_id: string | null;
  level_id: string | null;
  subject_ids: string[];
  compliance_profile?: {
    country: string | null;
    state: string | null;
    curriculum_framework: string | null;
    compliance_mode: string | null;
    template_version: string | null;
    required_fields: string[];
    recommended_fields: string[];
    optional_fields: string[];
    custom_labels: Record<string, string>;
    last_reviewed_at: string | null;
  };
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
  user_id?: string | null;
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
    compliance_profile: {
      country: null,
      state: null,
      curriculum_framework: null,
      compliance_mode: null,
      template_version: null,
      required_fields: [],
      recommended_fields: [],
      optional_fields: [],
      custom_labels: {},
      last_reviewed_at: null,
    },
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

async function withTimeout<T>(
  promise: PromiseLike<T> | Promise<T>,
  label: string,
  ms = 25000
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`${label} timed out after ${ms}ms.`));
        }, ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function isMissingColumnError(error: unknown) {
  const message = String(
    (error as { message?: unknown })?.message ?? "",
  ).toLowerCase();
  return message.includes("does not exist") && message.includes("column");
}

function isMissingConstraintError(error: unknown) {
  const message = String(
    (error as { message?: unknown })?.message ?? "",
  ).toLowerCase();
  return (
    message.includes("no unique or exclusion constraint") &&
    message.includes("on conflict")
  );
}

function describeSupabaseError(error: unknown) {
  if (!error) return "Unknown Supabase error.";

  if (typeof error === "string") return error;

  if (typeof error === "object") {
    const row = error as Record<string, unknown>;
    return (
      safeString(row.message) ||
      safeString(row.details) ||
      safeString(row.hint) ||
      JSON.stringify(error)
    );
  }

  return String(error);
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
  if (value === "portfolio" || value === "planner" || value === "reports") {
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

function asCurriculumPreferences(value: unknown): CurriculumPreferences {
  const row =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  const subjectIdsRaw = Array.isArray(row.subject_ids) ? row.subject_ids : [];

  return {
    country_id: safeString(row.country_id) || null,
    region_id: safeString(row.region_id) || null,
    framework_id: safeString(row.framework_id) || null,
    level_id: safeString(row.level_id) || null,
    subject_ids: subjectIdsRaw
      .map((item) => safeString(item))
      .filter(Boolean),
    compliance_profile:
      row.compliance_profile && typeof row.compliance_profile === "object"
        ? {
            country:
              safeString(
                (row.compliance_profile as Record<string, unknown>).country,
              ) || null,
            state:
              safeString(
                (row.compliance_profile as Record<string, unknown>).state,
              ) || null,
            curriculum_framework:
              safeString(
                (row.compliance_profile as Record<string, unknown>)
                  .curriculum_framework,
              ) || null,
            compliance_mode:
              safeString(
                (row.compliance_profile as Record<string, unknown>)
                  .compliance_mode,
              ) || null,
            template_version:
              safeString(
                (row.compliance_profile as Record<string, unknown>)
                  .template_version,
              ) || null,
            required_fields: Array.isArray(
              (row.compliance_profile as Record<string, unknown>).required_fields,
            )
              ? (
                  (row.compliance_profile as Record<string, unknown>)
                    .required_fields as unknown[]
                )
                  .map((item) => safeString(item))
                  .filter(Boolean)
              : [],
            recommended_fields: Array.isArray(
              (row.compliance_profile as Record<string, unknown>).recommended_fields,
            )
              ? (
                  (row.compliance_profile as Record<string, unknown>)
                    .recommended_fields as unknown[]
                )
                  .map((item) => safeString(item))
                  .filter(Boolean)
              : [],
            optional_fields: Array.isArray(
              (row.compliance_profile as Record<string, unknown>).optional_fields,
            )
              ? (
                  (row.compliance_profile as Record<string, unknown>)
                    .optional_fields as unknown[]
                )
                  .map((item) => safeString(item))
                  .filter(Boolean)
              : [],
            custom_labels:
              (row.compliance_profile as Record<string, unknown>).custom_labels &&
              typeof (row.compliance_profile as Record<string, unknown>).custom_labels ===
                "object"
                ? Object.fromEntries(
                    Object.entries(
                      (row.compliance_profile as Record<string, unknown>)
                        .custom_labels as Record<string, unknown>,
                    ).map(([key, item]) => [key, safeString(item)]),
                  )
                : {},
            last_reviewed_at:
              safeString(
                (row.compliance_profile as Record<string, unknown>)
                  .last_reviewed_at,
              ) || null,
          }
        : {
            country: null,
            state: null,
            curriculum_framework: null,
            compliance_mode: null,
            template_version: null,
            required_fields: [],
            recommended_fields: [],
            optional_fields: [],
            custom_labels: {},
            last_reviewed_at: null,
          },
  };
}

function toDbCurriculumPreferences(
  value: CurriculumPreferences | null | undefined
): CurriculumPreferences {
  const normalized = asCurriculumPreferences(value);

  return {
    country_id: normalized.country_id,
    region_id: normalized.region_id,
    framework_id: normalized.framework_id,
    level_id: null,
    subject_ids: [...normalized.subject_ids],
    compliance_profile: normalized.compliance_profile
      ? {
          country: normalized.compliance_profile.country,
          state: normalized.compliance_profile.state,
          curriculum_framework:
            normalized.compliance_profile.curriculum_framework,
          compliance_mode: normalized.compliance_profile.compliance_mode,
          template_version: normalized.compliance_profile.template_version,
          required_fields: [...normalized.compliance_profile.required_fields],
          recommended_fields: [
            ...normalized.compliance_profile.recommended_fields,
          ],
          optional_fields: [...normalized.compliance_profile.optional_fields],
          custom_labels: {
            ...normalized.compliance_profile.custom_labels,
          },
          last_reviewed_at: normalized.compliance_profile.last_reviewed_at,
        }
      : {
          country: null,
          state: null,
          curriculum_framework: null,
          compliance_mode: null,
          template_version: null,
          required_fields: [],
          recommended_fields: [],
          optional_fields: [],
          custom_labels: {},
          last_reviewed_at: null,
        },
  };
}

function toFamilyProfilePayload(
  settings: FamilySettings,
  userId: string
): FamilyProfileRow {
  return {
    id: userId,
    user_id: userId,
    family_display_name:
      safeString(settings.family_display_name) ||
      DEFAULT_FAMILY_SETTINGS.family_display_name,
    preferred_market: asMarketKey(settings.preferred_market),
    experience_mode: asExperienceMode(settings.experience_mode),
    default_child_id: safeString(settings.default_child_id) || null,
    default_child_landing: asDefaultChildLanding(
      settings.default_child_landing
    ),
    week_start: asWeekStart(settings.week_start),
    compact_mode: Boolean(settings.compact_mode),
    show_advanced_insights: Boolean(settings.show_advanced_insights),
    show_authority_guidance: Boolean(settings.show_authority_guidance),
    auto_open_last_child: Boolean(settings.auto_open_last_child),
    evidence_privacy_default: asEvidencePrivacy(
      settings.evidence_privacy_default
    ),
    planner_auto_carry_forward: Boolean(settings.planner_auto_carry_forward),
    planner_show_weekend: Boolean(settings.planner_show_weekend),
    portfolio_print_style: asPortfolioPrintStyle(
      settings.portfolio_print_style
    ),
    report_tone_default: asReportTone(settings.report_tone_default),
    notifications_weekly_digest: Boolean(
      settings.notifications_weekly_digest
    ),
    notifications_readiness_alerts: Boolean(
      settings.notifications_readiness_alerts
    ),
    notifications_planner_nudges: Boolean(
      settings.notifications_planner_nudges
    ),
    curriculum_preferences: toDbCurriculumPreferences(
      settings.curriculum_preferences
    ),
    updated_at: new Date().toISOString(),
  };
}

function omitUserId<T extends Record<string, unknown>>(payload: T): Record<string, unknown> {
  const next = { ...payload };
  delete next.user_id;
  return next;
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

function normalizeYearLevel(value: unknown): string | null {
  const clean = safeString(value);
  if (!clean) return null;

  const stripped = clean.replace(/^year\s+/i, "").trim();
  return stripped || null;
}

function normalizeYearLabel(
  yearLabel: unknown,
  yearLevel: unknown
): string | undefined {
  const explicit = safeString(yearLabel);
  if (explicit) return explicit;

  const cleanLevel = normalizeYearLevel(yearLevel);
  return cleanLevel ? `Year ${cleanLevel}` : undefined;
}

function normalizeChildOption(value: unknown): ChildOption | null {
  if (!value || typeof value !== "object") return null;

  const row = value as Record<string, unknown>;

  const id = safeString(row.id);
  const explicitLabel =
    safeString(row.label) || safeString(row.name) || safeString(row.title);
  const firstName =
    safeString(row.first_name) ||
    safeString(row.firstName) ||
    safeString(row.given_name) ||
    safeString(row.givenName) ||
    safeString(row.preferred_name) ||
    safeString(row.preferredName);
  const lastName =
    safeString(row.last_name) ||
    safeString(row.lastName) ||
    safeString(row.surname) ||
    safeString(row.family_name) ||
    safeString(row.familyName);

  const label = explicitLabel || [firstName, lastName].filter(Boolean).join(" ").trim();

  if (!id || !label) return null;

  const year_level =
    normalizeYearLevel(row.year_level) ||
    normalizeYearLevel(row.yearLevel) ||
    null;

  const yearLabel = normalizeYearLabel(
    row.yearLabel ?? row.year_label,
    year_level
  );

  return {
    id,
    label,
    yearLabel,
    year_level,
    connectedAt: safeString(row.connectedAt ?? row.connected_at) || null,
  };
}

/* ============================================================
   MAPPERS
   ============================================================ */

export function rowToSettings(
  row: Partial<FamilyProfileRow> | null | undefined
): FamilySettings {
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
    curriculum_preferences: asCurriculumPreferences(
      row.curriculum_preferences
    ),
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

export function getStoredActiveStudentId(): string {
  if (!canUseBrowserStorage()) return "";
  return safeString(window.localStorage.getItem(STORAGE_KEYS.ACTIVE_STUDENT));
}

export function persistActiveStudentId(studentId: string | null | undefined) {
  if (!canUseBrowserStorage()) return;

  const clean = safeString(studentId);
  if (clean) {
    window.localStorage.setItem(STORAGE_KEYS.ACTIVE_STUDENT, clean);
  } else {
    window.localStorage.removeItem(STORAGE_KEYS.ACTIVE_STUDENT);
  }
}

export async function getCurrentUserId(): Promise<string | null> {
  if (!hasSupabaseEnv) return null;

  const sessionResp = await supabase.auth.getSession();
  if (sessionResp.data.session?.user?.id) {
    return sessionResp.data.session.user.id;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("getCurrentUserId error:", error);
    return null;
  }

  return user?.id ?? null;
}

export function loadChildrenFromLocalStorage(): ChildOption[] {
  const raw = readJson<unknown>(STORAGE_KEYS.CHILDREN, []);

  const rows = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object"
      ? Object.values(raw as Record<string, unknown>)
      : [];

  const items = rows
    .map((item) => normalizeChildOption(item))
    .filter(Boolean) as ChildOption[];

  const seen = new Set<string>();
  const deduped: ChildOption[] = [];

  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    deduped.push(item);
  }

  return deduped;
}

export function persistChildrenToLocalStorage(children: ChildOption[]) {
  const normalized = children
    .map((child) => normalizeChildOption(child))
    .filter(Boolean) as ChildOption[];

  writeJson(STORAGE_KEYS.CHILDREN, normalized);
}

/* ============================================================
   SUPABASE LOAD / SAVE
   ============================================================ */

export async function loadFamilyProfile(): Promise<FamilyProfileRow> {
  if (!hasSupabaseEnv) {
    return { ...DEFAULT_FAMILY_PROFILE };
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return { ...DEFAULT_FAMILY_PROFILE };
  }

  const loadVariants: Array<{
    label: string;
    run: () => Promise<{
      data: FamilyProfileRow | null;
      error: unknown;
    }>;
    continueOnError?: (error: unknown) => boolean;
  }> = [
    {
      label: "family_profiles by user_id",
      run: async () => {
        const response = await supabase
          .from("family_profiles")
          .select("*")
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle();
        return {
          data: (response.data as FamilyProfileRow | null) ?? null,
          error: response.error,
        };
      },
      continueOnError: (error) => isMissingColumnError(error),
    },
    {
      label: "family_profiles by id",
      run: async () => {
        const response = await supabase
          .from("family_profiles")
          .select("*")
          .eq("id", userId)
          .limit(1)
          .maybeSingle();
        return {
          data: (response.data as FamilyProfileRow | null) ?? null,
          error: response.error,
        };
      },
    },
  ];

  for (const variant of loadVariants) {
    const { data, error } = await variant.run();

    if (!error && data) {
      return {
        ...DEFAULT_FAMILY_PROFILE,
        ...data,
        id: safeString(data.id) || userId,
        user_id: safeString(data.user_id) || userId,
      };
    }

    if (error) {
      console.error(`loadFamilyProfile ${variant.label} failed`, {
        userId,
        error,
      });

      if (variant.continueOnError?.(error)) {
        continue;
      }

      return { ...DEFAULT_FAMILY_PROFILE, id: userId, user_id: userId };
    }
  }

  return { ...DEFAULT_FAMILY_PROFILE, id: userId, user_id: userId };
}

async function selectFamilyProfileRow(userId: string): Promise<FamilyProfileRow | null> {
  const selectVariants: Array<{
    label: string;
    run: () => Promise<{
      data: FamilyProfileRow | null;
      error: unknown;
    }>;
    continueOnError?: (error: unknown) => boolean;
  }> = [
    {
      label: "family_profiles select by user_id",
      run: async () => {
        const response = await supabase
          .from("family_profiles")
          .select("*")
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle();
        return {
          data: (response.data as FamilyProfileRow | null) ?? null,
          error: response.error,
        };
      },
      continueOnError: (error) => isMissingColumnError(error),
    },
    {
      label: "family_profiles select by id",
      run: async () => {
        const response = await supabase
          .from("family_profiles")
          .select("*")
          .eq("id", userId)
          .limit(1)
          .maybeSingle();
        return {
          data: (response.data as FamilyProfileRow | null) ?? null,
          error: response.error,
        };
      },
    },
  ];

  for (const variant of selectVariants) {
    const startedAt = Date.now();
    console.info("selectFamilyProfileRow start", {
      label: variant.label,
      userId,
    });

    const { data, error } = await withTimeout(
      variant.run(),
      variant.label,
      12000,
    );

    if (!error && data) {
      console.info("selectFamilyProfileRow success", {
        label: variant.label,
        durationMs: Date.now() - startedAt,
        data,
      });
      return {
        ...DEFAULT_FAMILY_PROFILE,
        ...data,
        id: safeString(data.id) || userId,
        user_id: safeString(data.user_id) || userId,
      };
    }

    if (error) {
      console.error("selectFamilyProfileRow error", {
        label: variant.label,
        durationMs: Date.now() - startedAt,
        error,
      });

      if (variant.continueOnError?.(error)) {
        continue;
      }

      throw error;
    }
  }

  return null;
}

export async function upsertFamilyProfile(
  settings: FamilySettings
): Promise<FamilyProfileRow> {
  if (!hasSupabaseEnv) {
    return { ...DEFAULT_FAMILY_PROFILE, ...settings };
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("A signed-in Supabase session is required to save family settings.");
  }

  const payload = toFamilyProfilePayload(settings, userId);
  const startedAt = Date.now();

  console.info("upsertFamilyProfile incoming payload", {
    userId,
    payload,
  });

  const existingProfile = await selectFamilyProfileRow(userId).catch((error) => {
    console.error("upsertFamilyProfile existing row check failed", {
      userId,
      error,
    });
    return null;
  });

  console.info("upsertFamilyProfile existing row result", {
    userId,
    existingProfile,
  });

  const saveVariants: Array<{
    label: string;
    run: () => Promise<{ data: unknown; error: unknown }>;
    continueOnError?: (error: unknown) => boolean;
  }> = existingProfile
    ? [
        {
          label: "family_profiles update by user_id",
          run: async () => {
            const response = await supabase
              .from("family_profiles")
              .update(payload)
              .eq("user_id", userId);
            return { data: response.data, error: response.error };
          },
          continueOnError: (error) => isMissingColumnError(error),
        },
        {
          label: "family_profiles update by id",
          run: async () => {
            const response = await supabase
              .from("family_profiles")
              .update(omitUserId(payload))
              .eq("id", userId);
            return { data: response.data, error: response.error };
          },
        },
      ]
    : [
        {
          label: "family_profiles insert with user_id",
          run: async () => {
            const response = await supabase
              .from("family_profiles")
              .insert(payload);
            return { data: response.data, error: response.error };
          },
          continueOnError: (error) =>
            isMissingColumnError(error) || isMissingConstraintError(error),
        },
        {
          label: "family_profiles insert by id",
          run: async () => {
            const response = await supabase
              .from("family_profiles")
              .insert(omitUserId(payload));
            return { data: response.data, error: response.error };
          },
        },
      ];

  let lastError: unknown = null;

  for (const variant of saveVariants) {
    console.info("upsertFamilyProfile attempt", {
      label: variant.label,
      userId,
    });

    const dbCallStartedAt = Date.now();
    const writeResponse = await withTimeout(
      variant.run(),
      `upsertFamilyProfile write ${variant.label}`,
    );

    if (!writeResponse.error) {
      console.info("upsertFamilyProfile write success", {
        label: variant.label,
        durationMs: Date.now() - dbCallStartedAt,
        totalDurationMs: Date.now() - startedAt,
        response: writeResponse.data,
      });

      const selectStartedAt = Date.now();
      console.info("upsertFamilyProfile post-write select start", {
        label: variant.label,
        totalDurationMs: Date.now() - startedAt,
      });

      try {
        const selected = await selectFamilyProfileRow(userId);
        if (selected) {
          console.info("upsertFamilyProfile post-write select success", {
            label: variant.label,
            durationMs: Date.now() - selectStartedAt,
            totalDurationMs: Date.now() - startedAt,
          });
          return selected;
        }
      } catch (selectError) {
        console.error("upsertFamilyProfile post-write select failed", {
          label: variant.label,
          durationMs: Date.now() - selectStartedAt,
          totalDurationMs: Date.now() - startedAt,
          error: selectError,
        });
      }

      return {
        ...DEFAULT_FAMILY_PROFILE,
        ...payload,
        id: userId,
        user_id: userId,
      };
    }

    lastError = writeResponse.error;
    console.error("upsertFamilyProfile Supabase error", {
      label: variant.label,
      durationMs: Date.now() - dbCallStartedAt,
      totalDurationMs: Date.now() - startedAt,
      error: writeResponse.error,
    });

    if (variant.continueOnError?.(writeResponse.error)) {
      continue;
    }
  }

  console.error("upsertFamilyProfile final failure", {
    totalDurationMs: Date.now() - startedAt,
    userId,
    lastError,
  });
  throw new Error(describeSupabaseError(lastError));
}

export async function saveFamilyProfile(settings: FamilySettings): Promise<void> {
  await upsertFamilyProfile(settings);
}
