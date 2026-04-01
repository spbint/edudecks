import { supabase } from "@/lib/supabaseClient";

/* ============================================================
   FAMILY PROFILE TYPES
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

export type FamilyProfile = {
  id: string;

  family_display_name: string | null;

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

  report_tone_default:
    | "family-summary"
    | "authority-ready"
    | "progress-review";

  notifications_weekly_digest: boolean;
  notifications_readiness_alerts: boolean;
  notifications_planner_nudges: boolean;

  created_at?: string;
  updated_at?: string;
};

/* ============================================================
   DEFAULTS (SAFE FALLBACK)
   ============================================================ */

export const DEFAULT_FAMILY_PROFILE: FamilyProfile = {
  id: "local",

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
};

/* ============================================================
   LOAD CURRENT FAMILY PROFILE
   ============================================================ */

export async function loadFamilyProfile(): Promise<FamilyProfile> {
  const { data, error } = await supabase
    .from("family_profiles")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("loadFamilyProfile error:", error);
    return DEFAULT_FAMILY_PROFILE;
  }

  if (!data) {
    return DEFAULT_FAMILY_PROFILE;
  }

  return {
    ...DEFAULT_FAMILY_PROFILE,
    ...data,
  };
}

/* ============================================================
   SAVE / UPSERT FAMILY PROFILE
   ============================================================ */

export async function saveFamilyProfile(
  profile: FamilyProfile
): Promise<void> {
  const payload = {
    ...profile,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("family_profiles")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    console.error("saveFamilyProfile error:", error);
    throw error;
  }
}