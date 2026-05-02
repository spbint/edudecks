import { hasSupabaseEnv, supabase } from "@/lib/supabaseClient";
import {
  familyYearLevelLabelFromStored,
  familyYearLevelToStoredNumber,
} from "@/lib/familyLearnerYearLevel";
import { US_STATE_OPTIONS } from "@/lib/jurisdictionCompliance";

export type MarketKey = "au" | "uk" | "us";
export type FamilyCountry = MarketKey | "other";
export type ExperienceMode = "family";
export type DefaultChildLanding = "dashboard" | "portfolio" | "planner" | "reports";
export type EvidencePrivacy = "private" | "family" | "shared";
export type WeekStart = "monday" | "sunday";
export type ReportingMode =
  | "family-summary"
  | "progress-review"
  | "authority-ready"
  | "plain-language"
  | "formal";
export type AcademicStructureType =
  | "terms"
  | "semesters"
  | "trimesters"
  | "flexible";

export type ChildOption = {
  id: string;
  label: string;
  yearLabel?: string;
  year_level?: string | number | null;
  year_band?: string | null;
  curriculum_framework_id?: string | null;
  curriculum_jurisdiction_id?: string | null;
  reporting_mode?: string | null;
  connectedAt?: string | null;
};

export type FamilySettings = {
  family_display_name: string;
  preferred_market: MarketKey;
  country: FamilyCountry | "";
  curriculum_framework_id: string;
  curriculum_jurisdiction_id: string;
  reporting_mode: ReportingMode;
  academic_structure_type: AcademicStructureType;
  cycle_count: number | null;
  weeks_per_cycle: number | null;
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
};

export type FamilyProfileRow = FamilySettings & {
  id: string;
  user_id?: string | null;
  owner_user_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

type FamilyProfileWritePayload = Partial<Omit<FamilyProfileRow, "id">> & {
  id?: string;
};

type CanonicalFamilyJurisdictionRow = {
  family_id?: string | null;
  country_code?: string | null;
  state_code?: string | null;
};

type RowToSettingsOptions = {
  defaultJurisdiction?: boolean;
  canonicalJurisdiction?: CanonicalFamilyJurisdictionRow | null;
};

type FamilySettingsSource = Partial<
  Omit<
    FamilyProfileRow,
    "preferred_market" | "country" | "curriculum_framework_id" | "curriculum_jurisdiction_id"
  >
> & {
  preferred_market?: MarketKey | null;
  country?: FamilyCountry | "" | null;
  curriculum_framework_id?: string | null;
  curriculum_jurisdiction_id?: string | null;
};

const FAMILY_PROFILE_SELECT_COLUMNS = [
  "id",
  "user_id",
  "owner_user_id",
  "family_display_name",
  "preferred_market",
  "country",
  "curriculum_framework_id",
  "curriculum_jurisdiction_id",
  "reporting_mode",
  "academic_structure_type",
  "cycle_count",
  "weeks_per_cycle",
  "experience_mode",
  "default_child_id",
  "default_child_landing",
  "week_start",
  "compact_mode",
  "show_advanced_insights",
  "show_authority_guidance",
  "auto_open_last_child",
  "evidence_privacy_default",
  "planner_auto_carry_forward",
  "planner_show_weekend",
  "portfolio_print_style",
  "report_tone_default",
  "notifications_weekly_digest",
  "notifications_readiness_alerts",
  "notifications_planner_nudges",
  "created_at",
  "updated_at",
].join(",");

export const DEFAULT_FAMILY_SETTINGS: FamilySettings = {
  family_display_name: "My family",
  preferred_market: "au",
  country: "au",
  curriculum_framework_id: "au-v9",
  curriculum_jurisdiction_id: "tas",
  reporting_mode: "family-summary",
  academic_structure_type: "terms",
  cycle_count: 4,
  weeks_per_cycle: 10,
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
};

export const DEFAULT_FAMILY_PROFILE: FamilyProfileRow = {
  id: "local",
  user_id: null,
  owner_user_id: null,
  ...DEFAULT_FAMILY_SETTINGS,
};

const STORAGE_KEYS = {
  SETTINGS: "edudecks_family_settings_v1",
  ACTIVE_STUDENT: "edudecks_active_student_id",
  CHILDREN: "edudecks_children_seed_v1",
};

const AU_STATE_CODES = new Set(["QLD", "NSW", "VIC", "SA", "WA", "TAS", "NT", "ACT"]);
const US_STATE_CODES = new Set(US_STATE_OPTIONS.map((option) => option.stateCode));

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function withTimeout<T>(promise: PromiseLike<T> | Promise<T>, label: string, ms = 25000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms.`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function describeSupabaseError(error: unknown) {
  if (!error) return "Unknown Supabase error.";
  if (typeof error === "string") return error;
  if (typeof error === "object") {
    const row = error as Record<string, unknown>;
    return safeString(row.message) || safeString(row.details) || safeString(row.hint) || JSON.stringify(error);
  }
  return String(error);
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asMarketKey(value: unknown): MarketKey {
  return value === "uk" || value === "us" ? value : "au";
}

function asFamilyCountry(value: unknown): FamilyCountry | "" {
  if (value === "") return "";
  if (value === "uk" || value === "us" || value === "other") return value;
  return "au";
}

function hasValue(value: unknown) {
  return safeString(value).length > 0;
}

function defaultFrameworkIdForCountry(country: FamilyCountry | "") {
  if (country === "us") return "us-common-core";
  if (country === "uk") return "uk-national";
  if (country === "other") return "custom-homeschool";
  if (country === "au") return "au-v9";
  return "";
}

function normalizeCountryCode(value: unknown) {
  const upper = safeString(value).toUpperCase();
  if (upper === "US" || upper === "AU") return upper;
  return "";
}

function normalizeStateCode(countryCode: string, value: unknown) {
  const upper = safeString(value).toUpperCase();
  if (!upper) return "";
  if (countryCode === "US" && US_STATE_CODES.has(upper)) return upper;
  if (countryCode === "AU" && AU_STATE_CODES.has(upper)) return upper;
  return "";
}

function stateCodeToJurisdictionId(countryCode: string, stateCode: string) {
  if (!countryCode || !stateCode) return "";
  return stateCode.toLowerCase();
}

function countryCodeToCountry(countryCode: string): FamilyCountry | "" {
  if (countryCode === "US") return "us";
  if (countryCode === "AU") return "au";
  return "";
}

function countryCodeToMarket(countryCode: string, fallback: MarketKey): MarketKey {
  if (countryCode === "US") return "us";
  if (countryCode === "AU") return "au";
  return fallback;
}

function resolveCanonicalJurisdiction(settings: Pick<FamilySettings, "country" | "curriculum_jurisdiction_id">) {
  const countryCode =
    settings.country === "us"
      ? "US"
      : settings.country === "au"
        ? "AU"
        : "";
  const stateCode = normalizeStateCode(countryCode, settings.curriculum_jurisdiction_id);

  return {
    country_code: countryCode || null,
    state_code: stateCode || null,
  };
}

async function selectCanonicalFamilyJurisdiction(familyId: string) {
  const cleanFamilyId = safeString(familyId);
  if (!cleanFamilyId) return null;

  const response = await withTimeout(
    supabase
      .from("family_settings")
      .select("family_id,country_code,state_code")
      .eq("family_id", cleanFamilyId)
      .maybeSingle(),
    "family_settings select by family_id",
    12000,
  );

  if (response.error) throw response.error;
  return (response.data as CanonicalFamilyJurisdictionRow | null) ?? null;
}

async function upsertCanonicalFamilyJurisdiction(
  familyId: string,
  settings: Pick<FamilySettings, "country" | "curriculum_jurisdiction_id">,
) {
  const cleanFamilyId = safeString(familyId);
  if (!cleanFamilyId) return null;

  const canonical = resolveCanonicalJurisdiction(settings);
  const payload = {
    family_id: cleanFamilyId,
    country_code: canonical.country_code,
    state_code: canonical.state_code,
  };

  const response = await withTimeout(
    supabase.from("family_settings").upsert(payload, { onConflict: "family_id" }),
    "family_settings upsert",
    12000,
  );

  if (response.error) throw response.error;
  return payload satisfies CanonicalFamilyJurisdictionRow;
}

function asExperienceMode(value: unknown): ExperienceMode {
  return "family";
}

function asDefaultChildLanding(value: unknown): DefaultChildLanding {
  if (value === "portfolio" || value === "planner" || value === "reports") return value;
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

function asReportTone(value: unknown): "family-summary" | "authority-ready" | "progress-review" {
  if (value === "authority-ready" || value === "progress-review") return value;
  return "family-summary";
}

function asReportingMode(value: unknown): ReportingMode {
  if (
    value === "authority-ready" ||
    value === "progress-review" ||
    value === "plain-language" ||
    value === "formal"
  ) {
    return value;
  }
  return "family-summary";
}

function asAcademicStructureType(value: unknown): AcademicStructureType {
  if (value === "semesters" || value === "trimesters" || value === "flexible") {
    return value;
  }
  return "terms";
}

function asNullableNumber(value: unknown, fallback: number | null): number | null {
  if (value == null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toFamilyProfilePayload(settings: FamilySettings, userId: string, existingId?: string | null): FamilyProfileWritePayload {
  return {
    ...(safeString(existingId) ? { id: safeString(existingId) } : {}),
    user_id: userId,
    owner_user_id: userId,
    family_display_name: safeString(settings.family_display_name) || DEFAULT_FAMILY_SETTINGS.family_display_name,
    preferred_market: asMarketKey(settings.preferred_market),
    country: asFamilyCountry(settings.country) || DEFAULT_FAMILY_SETTINGS.country,
    curriculum_framework_id:
      safeString(settings.curriculum_framework_id) ||
      defaultFrameworkIdForCountry(settings.country) ||
      DEFAULT_FAMILY_SETTINGS.curriculum_framework_id,
    curriculum_jurisdiction_id:
      safeString(settings.curriculum_jurisdiction_id) ||
      DEFAULT_FAMILY_SETTINGS.curriculum_jurisdiction_id,
    reporting_mode: asReportingMode(settings.reporting_mode),
    academic_structure_type: asAcademicStructureType(settings.academic_structure_type),
    cycle_count: asNullableNumber(settings.cycle_count, DEFAULT_FAMILY_SETTINGS.cycle_count),
    weeks_per_cycle: asNullableNumber(settings.weeks_per_cycle, DEFAULT_FAMILY_SETTINGS.weeks_per_cycle),
    experience_mode: asExperienceMode(settings.experience_mode),
    default_child_id: safeString(settings.default_child_id) || null,
    default_child_landing: asDefaultChildLanding(settings.default_child_landing),
    week_start: asWeekStart(settings.week_start),
    compact_mode: Boolean(settings.compact_mode),
    show_advanced_insights: Boolean(settings.show_advanced_insights),
    show_authority_guidance: Boolean(settings.show_authority_guidance),
    auto_open_last_child: Boolean(settings.auto_open_last_child),
    evidence_privacy_default: asEvidencePrivacy(settings.evidence_privacy_default),
    planner_auto_carry_forward: Boolean(settings.planner_auto_carry_forward),
    planner_show_weekend: Boolean(settings.planner_show_weekend),
    portfolio_print_style: asPortfolioPrintStyle(settings.portfolio_print_style),
    report_tone_default: asReportTone(settings.report_tone_default),
    notifications_weekly_digest: Boolean(settings.notifications_weekly_digest),
    notifications_readiness_alerts: Boolean(settings.notifications_readiness_alerts),
    notifications_planner_nudges: Boolean(settings.notifications_planner_nudges),
    updated_at: new Date().toISOString(),
  };
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

function normalizeYearLabel(yearLabel: unknown, yearLevel: unknown): string | undefined {
  const yearLevelNumber = familyYearLevelToStoredNumber(yearLevel ?? yearLabel);
  return familyYearLevelLabelFromStored(yearLevelNumber) || undefined;
}

function normalizeChildOption(value: unknown): ChildOption | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const id = safeString(row.id);
  const explicitLabel = safeString(row.label) || safeString(row.name) || safeString(row.title);
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

  const year_level = familyYearLevelToStoredNumber(
    row.year_level ?? row.yearLevel ?? row.yearLabel ?? row.year_label,
  );
  const yearLabel = normalizeYearLabel(row.yearLabel ?? row.year_label, year_level);

  return {
    id,
    label,
    yearLabel,
    year_level,
    year_band: safeString(row.year_band ?? row.yearBand) || null,
    curriculum_framework_id:
      safeString(row.curriculum_framework_id ?? row.frameworkId) || null,
    curriculum_jurisdiction_id:
      safeString(row.curriculum_jurisdiction_id ?? row.jurisdictionId) || null,
    reporting_mode:
      safeString(row.reporting_mode ?? row.reportingMode) || null,
    connectedAt: safeString(row.connectedAt ?? row.connected_at) || null,
  };
}

export function rowToSettings(
  row: FamilySettingsSource | null | undefined,
  options?: RowToSettingsOptions,
): FamilySettings {
  const storedFamilyName = safeString(row?.family_display_name);
  const defaultJurisdiction = options?.defaultJurisdiction !== false;
  const canonicalCountryCode = normalizeCountryCode(options?.canonicalJurisdiction?.country_code);
  const canonicalStateCode = normalizeStateCode(
    canonicalCountryCode,
    options?.canonicalJurisdiction?.state_code,
  );
  const rawCountry = canonicalCountryCode
    ? countryCodeToCountry(canonicalCountryCode)
    : safeString(row?.country ?? row?.preferred_market);
  const country = hasValue(rawCountry)
    ? asFamilyCountry(rawCountry)
    : (defaultJurisdiction ? DEFAULT_FAMILY_SETTINGS.country : "");
  const rawFrameworkId = safeString(row?.curriculum_framework_id);
  const rawJurisdictionId = canonicalStateCode
    ? stateCodeToJurisdictionId(canonicalCountryCode, canonicalStateCode)
    : safeString(row?.curriculum_jurisdiction_id);
  const frameworkId =
    rawFrameworkId ||
    defaultFrameworkIdForCountry(country) ||
    (defaultJurisdiction ? DEFAULT_FAMILY_SETTINGS.curriculum_framework_id : "");

  return {
    family_display_name:
      storedFamilyName === "Your family"
        ? "My family"
        : storedFamilyName || DEFAULT_FAMILY_SETTINGS.family_display_name,
    preferred_market: canonicalCountryCode
      ? countryCodeToMarket(canonicalCountryCode, asMarketKey(row?.preferred_market))
      : asMarketKey(row?.preferred_market),
    country,
    curriculum_framework_id: frameworkId,
    curriculum_jurisdiction_id:
      rawJurisdictionId ||
      (defaultJurisdiction ? DEFAULT_FAMILY_SETTINGS.curriculum_jurisdiction_id : ""),
    reporting_mode: asReportingMode(row?.reporting_mode ?? row?.report_tone_default),
    academic_structure_type: asAcademicStructureType(row?.academic_structure_type),
    cycle_count: asNullableNumber(row?.cycle_count, DEFAULT_FAMILY_SETTINGS.cycle_count),
    weeks_per_cycle: asNullableNumber(row?.weeks_per_cycle, DEFAULT_FAMILY_SETTINGS.weeks_per_cycle),
    experience_mode: asExperienceMode(row?.experience_mode),
    default_child_id: safeString(row?.default_child_id) || null,
    default_child_landing: asDefaultChildLanding(row?.default_child_landing),
    week_start: asWeekStart(row?.week_start),
    compact_mode: asBoolean(row?.compact_mode, DEFAULT_FAMILY_SETTINGS.compact_mode),
    show_advanced_insights: asBoolean(row?.show_advanced_insights, DEFAULT_FAMILY_SETTINGS.show_advanced_insights),
    show_authority_guidance: asBoolean(row?.show_authority_guidance, DEFAULT_FAMILY_SETTINGS.show_authority_guidance),
    auto_open_last_child: asBoolean(row?.auto_open_last_child, DEFAULT_FAMILY_SETTINGS.auto_open_last_child),
    evidence_privacy_default: asEvidencePrivacy(row?.evidence_privacy_default),
    planner_auto_carry_forward: asBoolean(row?.planner_auto_carry_forward, DEFAULT_FAMILY_SETTINGS.planner_auto_carry_forward),
    planner_show_weekend: asBoolean(row?.planner_show_weekend, DEFAULT_FAMILY_SETTINGS.planner_show_weekend),
    portfolio_print_style: asPortfolioPrintStyle(row?.portfolio_print_style),
    report_tone_default: asReportTone(row?.report_tone_default),
    notifications_weekly_digest: asBoolean(row?.notifications_weekly_digest, DEFAULT_FAMILY_SETTINGS.notifications_weekly_digest),
    notifications_readiness_alerts: asBoolean(row?.notifications_readiness_alerts, DEFAULT_FAMILY_SETTINGS.notifications_readiness_alerts),
    notifications_planner_nudges: asBoolean(row?.notifications_planner_nudges, DEFAULT_FAMILY_SETTINGS.notifications_planner_nudges),
  };
}

export function loadSettingsFromLocalStorage(): FamilySettings {
  const raw = readJson<Partial<FamilySettings> | null>(STORAGE_KEYS.SETTINGS, null);
  return rowToSettings(raw ?? undefined, {
    defaultJurisdiction: raw == null,
  });
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
  if (sessionResp.data.session?.user?.id) return sessionResp.data.session.user.id;

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

  const items = rows.map((item) => normalizeChildOption(item)).filter(Boolean) as ChildOption[];
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

export async function loadFamilyProfile(): Promise<FamilyProfileRow> {
  if (!hasSupabaseEnv) return { ...DEFAULT_FAMILY_PROFILE };

  const userId = await getCurrentUserId();
  if (!userId) return { ...DEFAULT_FAMILY_PROFILE };

  try {
    const profile = await selectFamilyProfileRow(userId);
    if (profile) {
      const canonicalJurisdiction = await selectCanonicalFamilyJurisdiction(safeString(profile.id)).catch(
        () => null,
      );
      const settings = rowToSettings(profile, {
        defaultJurisdiction: false,
        canonicalJurisdiction,
      });

      return {
        ...DEFAULT_FAMILY_PROFILE,
        ...profile,
        ...settings,
        id: safeString(profile.id) || DEFAULT_FAMILY_PROFILE.id,
        user_id: safeString(profile.user_id) || userId,
        owner_user_id: safeString(profile.owner_user_id) || userId,
      };
    }
  } catch (error) {
    console.error("loadFamilyProfile failed", { userId, error });
  }

  return {
    ...DEFAULT_FAMILY_PROFILE,
    user_id: userId,
    owner_user_id: userId,
  };
}

async function selectFamilyProfileRow(userId: string): Promise<Partial<FamilyProfileRow> | null> {
  const response = await withTimeout(
    supabase
      .from("family_profiles")
      .select(FAMILY_PROFILE_SELECT_COLUMNS)
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle(),
    "family_profiles select by user_id",
    12000,
  );

  if (response.error) throw response.error;

  if (!response || !response.data) return null;

  const data = response.data as unknown as Partial<FamilyProfileRow>;
  return {
    ...data,
    id: safeString(data.id) || DEFAULT_FAMILY_PROFILE.id,
    user_id: safeString(data.user_id) || userId,
    owner_user_id: safeString(data.owner_user_id) || userId,
  };
}

export async function upsertFamilyProfile(settings: FamilySettings): Promise<FamilyProfileRow> {
  if (!hasSupabaseEnv) return { ...DEFAULT_FAMILY_PROFILE, ...settings };

  const userId = await getCurrentUserId();
  if (!userId) throw new Error("A signed-in Supabase session is required to save family settings.");
  const authenticatedUserId = userId;

  const existingProfile = await selectFamilyProfileRow(authenticatedUserId).catch(() => null);
  const payload = toFamilyProfilePayload(settings, authenticatedUserId, existingProfile?.id);

  async function buildSavedProfile(row: unknown): Promise<FamilyProfileRow> {
    const rowRecord =
      row && typeof row === "object" ? (row as Partial<FamilyProfileRow>) : null;
    const selectedProfile = safeString(rowRecord?.id)
      ? rowRecord
      : await selectFamilyProfileRow(authenticatedUserId);

    const savedProfile: FamilyProfileRow = {
      ...DEFAULT_FAMILY_PROFILE,
      ...(existingProfile ?? {}),
      ...settings,
      ...(selectedProfile ?? {}),
      ...payload,
      id:
        safeString(selectedProfile?.id) ||
        safeString(existingProfile?.id) ||
        safeString(payload.id) ||
        DEFAULT_FAMILY_PROFILE.id,
      user_id: safeString(selectedProfile?.user_id) || authenticatedUserId,
      owner_user_id: safeString(selectedProfile?.owner_user_id) || authenticatedUserId,
    };

    const canonicalJurisdiction = await upsertCanonicalFamilyJurisdiction(savedProfile.id, settings);

    return {
      ...savedProfile,
      ...rowToSettings(savedProfile, {
        defaultJurisdiction: true,
        canonicalJurisdiction,
      }),
    };
  }

  let lastError: unknown = null;

  const writeResponse = await withTimeout(
    existingProfile
      ? supabase
          .from("family_profiles")
          .update(payload)
          .eq("user_id", authenticatedUserId)
          .select(FAMILY_PROFILE_SELECT_COLUMNS)
          .maybeSingle()
      : supabase
          .from("family_profiles")
          .insert(payload)
          .select(FAMILY_PROFILE_SELECT_COLUMNS)
          .single(),
    "upsertFamilyProfile write",
  );

  if (!writeResponse.error) {
    return buildSavedProfile(writeResponse.data);
  }

  lastError = writeResponse.error;
  const message = describeSupabaseError(writeResponse.error).toLowerCase();
  if (!existingProfile && message.includes("duplicate")) {
    const retryResponse = await withTimeout(
      supabase
          .from("family_profiles")
          .update(payload)
        .eq("user_id", authenticatedUserId)
        .select(FAMILY_PROFILE_SELECT_COLUMNS)
        .maybeSingle(),
      "upsertFamilyProfile duplicate insert retry",
    );

    if (!retryResponse.error) {
      return buildSavedProfile(retryResponse.data);
    }

    lastError = retryResponse.error;
  }

  throw new Error(describeSupabaseError(lastError));
}

export async function saveFamilyProfile(settings: FamilySettings): Promise<void> {
  await upsertFamilyProfile(settings);
}
