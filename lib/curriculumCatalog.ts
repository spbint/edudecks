import { hasSupabaseEnv, supabase } from "@/lib/supabaseClient";

export type CanonicalCurriculumFramework = {
  id: string;
  slug: string;
  code: string;
  name: string;
  market: string;
  country: string;
  jurisdiction: string | null;
  version: string;
  framework_type: string;
  framework_scope: string;
  parent_framework_id: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
};

export type CanonicalCurriculumJurisdiction = {
  id: string;
  framework_id: string;
  country_code: string;
  state_code: string | null;
  slug: string;
  name: string;
  sort_order: number;
  is_active: boolean;
};

export type CanonicalCurriculumLevel = {
  id: string;
  framework_id: string;
  jurisdiction_id: string | null;
  level_code: string;
  level_label: string;
  level_type: string;
  sort_order: number;
  is_active: boolean;
};

export type CanonicalCurriculumSubject = {
  id: string;
  framework_id: string;
  jurisdiction_id: string | null;
  code: string;
  name: string;
  sort_order: number;
  is_active: boolean;
};

export type CanonicalCurriculumCountryOption = {
  id: string;
  label: string;
};

function safe(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function countryLabel(code: string) {
  if (code === "au") return "Australia";
  if (code === "ib") return "International";
  if (code === "uk") return "United Kingdom";
  if (code === "us") return "United States";
  return code.toUpperCase() || "Unknown";
}

export async function loadCanonicalCurriculumFrameworks() {
  if (!hasSupabaseEnv) return [] as CanonicalCurriculumFramework[];

  const { data, error } = await supabase
    .from("curriculum_frameworks")
    .select(
      "id,slug,code,name,market,country,jurisdiction,version,framework_type,framework_scope,parent_framework_id,description,is_active,created_at",
    )
    .eq("is_active", true)
    .order("market", { ascending: true })
    .order("country", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as CanonicalCurriculumFramework[]).filter(
    (row) => !!safe(row.id) && !!safe(row.name) && !!safe(row.country),
  );
}

export async function loadCanonicalCurriculumLevels(frameworkId: string) {
  if (!hasSupabaseEnv || !safe(frameworkId)) return [] as CanonicalCurriculumLevel[];

  const { data, error } = await supabase
    .from("curriculum_levels")
    .select("id,framework_id,jurisdiction_id,level_code,level_label,level_type,sort_order,is_active")
    .eq("framework_id", frameworkId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("level_label", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as CanonicalCurriculumLevel[]).filter(
    (row) => !!safe(row.id) && !!safe(row.framework_id) && !!safe(row.level_label),
  );
}

export async function loadCanonicalCurriculumJurisdictions(frameworkId: string) {
  if (!hasSupabaseEnv || !safe(frameworkId)) return [] as CanonicalCurriculumJurisdiction[];

  const { data, error } = await supabase
    .from("curriculum_jurisdictions")
    .select("id,framework_id,country_code,state_code,slug,name,sort_order,is_active")
    .eq("framework_id", frameworkId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as CanonicalCurriculumJurisdiction[]).filter(
    (row) => !!safe(row.id) && !!safe(row.framework_id) && !!safe(row.name),
  );
}

export async function loadCanonicalCurriculumSubjects(frameworkId: string) {
  if (!hasSupabaseEnv || !safe(frameworkId)) return [] as CanonicalCurriculumSubject[];

  const { data, error } = await supabase
    .from("curriculum_subjects")
    .select("id,framework_id,jurisdiction_id,code,name,sort_order,is_active")
    .eq("framework_id", frameworkId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as CanonicalCurriculumSubject[]).filter(
    (row) => !!safe(row.id) && !!safe(row.framework_id) && !!safe(row.name),
  );
}

export function buildCanonicalCountryOptions(
  frameworks: CanonicalCurriculumFramework[],
): CanonicalCurriculumCountryOption[] {
  const seen = new Set<string>();
  const rows: CanonicalCurriculumCountryOption[] = [];

  for (const framework of frameworks) {
    const code = safe(framework.country).toLowerCase();
    if (!code || seen.has(code)) continue;
    seen.add(code);
    rows.push({
      id: code,
      label: countryLabel(code),
    });
  }

  return rows.sort((a, b) => a.label.localeCompare(b.label));
}

export function findCanonicalFrameworkLabel(
  frameworks: CanonicalCurriculumFramework[],
  frameworkId: string | null | undefined,
) {
  const clean = safe(frameworkId);
  if (!clean) return "Not set";
  return frameworks.find((framework) => framework.id === clean)?.name || clean;
}

export function findCanonicalCountryLabel(
  frameworks: CanonicalCurriculumFramework[],
  countryId: string | null | undefined,
) {
  const clean = safe(countryId).toLowerCase();
  if (!clean) return "Not set";

  const option = buildCanonicalCountryOptions(frameworks).find(
    (country) => country.id === clean,
  );
  return option?.label || countryLabel(clean);
}
