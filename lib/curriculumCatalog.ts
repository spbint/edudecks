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

function normalizeFrameworkRow(
  row: Record<string, unknown>,
): CanonicalCurriculumFramework | null {
  const id = safe(row.id);
  const code = safe(row.code);
  const name = safe(row.name);
  const country = safe(row.country).toLowerCase();

  if (!id || !code || !name || !country) {
    return null;
  }

  return {
    id,
    slug: safe(row.slug) || code,
    code,
    name,
    market: safe(row.market) || country,
    country,
    jurisdiction: safe(row.jurisdiction) || null,
    version: safe(row.version) || safe(row.version_label) || "starter",
    framework_type: safe(row.framework_type) || "national",
    framework_scope: safe(row.framework_scope) || safe(row.subject_scope) || "national",
    parent_framework_id: safe(row.parent_framework_id) || null,
    description: safe(row.description) || null,
    is_active: row.is_active !== false,
    created_at: safe(row.created_at),
  };
}

function normalizeLevelRow(
  row: Record<string, unknown>,
): CanonicalCurriculumLevel | null {
  const id = safe(row.id);
  const frameworkId = safe(row.framework_id);
  const levelCode = safe(row.level_code) || safe(row.official_level_label);
  const levelLabel = safe(row.level_label) || safe(row.normalized_level_label) || safe(row.official_level_label);

  if (!id || !frameworkId || !levelCode || !levelLabel) {
    return null;
  }

  return {
    id,
    framework_id: frameworkId,
    jurisdiction_id: safe(row.jurisdiction_id) || null,
    level_code: levelCode,
    level_label: levelLabel,
    level_type: safe(row.level_type) || "year",
    sort_order:
      typeof row.sort_order === "number"
        ? row.sort_order
        : typeof row.normalized_sort_order === "number"
          ? row.normalized_sort_order
          : 0,
    is_active: row.is_active !== false,
  };
}

export async function loadCanonicalCurriculumFrameworks() {
  if (!hasSupabaseEnv) return [] as CanonicalCurriculumFramework[];

  const selectCandidates = [
    "id,slug,code,name,market,country,jurisdiction,version,framework_type,framework_scope,parent_framework_id,description,is_active,created_at",
    "id,code,name,country,jurisdiction,version,framework_type,framework_scope,is_active,created_at",
    "id,code,name,country,jurisdiction,version_label,framework_type,subject_scope,is_active,created_at",
  ];

  let lastError: unknown = null;

  for (const select of selectCandidates) {
    const { data, error } = await supabase
      .from("curriculum_frameworks")
      .select(select)
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      lastError = error;
      continue;
    }

    return ((data ?? []) as unknown as Array<Record<string, unknown>>)
      .map(normalizeFrameworkRow)
      .filter((row): row is CanonicalCurriculumFramework => Boolean(row))
      .sort(
        (a, b) =>
          a.market.localeCompare(b.market) ||
          a.country.localeCompare(b.country) ||
          a.name.localeCompare(b.name),
      );
  }

  throw lastError ?? new Error("Unable to load curriculum frameworks.");
}

export async function loadCanonicalCurriculumLevels(frameworkId: string) {
  if (!hasSupabaseEnv || !safe(frameworkId)) return [] as CanonicalCurriculumLevel[];

  const selectCandidates = [
    "id,framework_id,jurisdiction_id,level_code,level_label,level_type,sort_order,is_active",
    "id,framework_id,level_code,level_label,level_type,sort_order",
    "id,framework_id,official_level_label,normalized_level_label,normalized_sort_order,level_type,is_active",
  ];

  let lastError: unknown = null;

  for (const select of selectCandidates) {
    const query = supabase
      .from("curriculum_levels")
      .select(select)
      .eq("framework_id", frameworkId)
      .order(select.includes("sort_order") ? "sort_order" : "normalized_sort_order", {
        ascending: true,
      });

    if (select.includes("is_active")) {
      query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) {
      lastError = error;
      continue;
    }

    return ((data ?? []) as unknown as Array<Record<string, unknown>>)
      .map(normalizeLevelRow)
      .filter((row): row is CanonicalCurriculumLevel => Boolean(row))
      .sort((a, b) => a.sort_order - b.sort_order || a.level_label.localeCompare(b.level_label));
  }

  throw lastError ?? new Error("Unable to load curriculum levels.");
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
