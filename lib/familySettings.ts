import { hasSupabaseEnv, supabase } from "@/lib/supabaseClient";
import {
  familyYearLevelLabelFromStored,
  familyYearLevelToStoredNumber,
} from "@/lib/familyLearnerYearLevel";

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
  country: FamilyCountry;
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
