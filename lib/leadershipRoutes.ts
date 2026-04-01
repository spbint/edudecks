export function buildQueryString(query?: Record<string, string | null | undefined>) {
  const params = new URLSearchParams();

  Object.entries(query ?? {}).forEach(([key, value]) => {
    const safeValue = String(value ?? "").trim();
    if (safeValue) {
      params.set(key, safeValue);
    }
  });

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function buildLeadershipHomePath(
  query?: Record<string, string | null | undefined>
) {
  return `/admin/leadership${buildQueryString(query)}`;
}

export function buildLeadershipHeatmapPath(
  query?: Record<string, string | null | undefined>
) {
  return `/admin/leadership/heatmap${buildQueryString(query)}`;
}

export function buildWholeSchoolPath(
  query?: Record<string, string | null | undefined>
) {
  return `/admin/whole-school${buildQueryString(query)}`;
}

export function buildRiskRadarPath(
  query?: Record<string, string | null | undefined>
) {
  return `/admin/risk-radar${buildQueryString(query)}`;
}

export function buildTriagePath(
  query?: Record<string, string | null | undefined>
) {
  return `/admin/triage${buildQueryString(query)}`;
}

export function isLegacyLeadershipPath(pathname: string | null | undefined) {
  const p = String(pathname ?? "").trim();

  return p === "/admin/school-overview" || p === "/admin/learning-heatmap";
}

export function normaliseLegacyLeadershipPath(
  pathname: string | null | undefined,
  search?: string | null | undefined
) {
  const p = String(pathname ?? "").trim();
  const s = String(search ?? "").trim();

  if (p === "/admin/school-overview") {
    return `/admin/whole-school${s || ""}`;
  }

  if (p === "/admin/learning-heatmap") {
    return `/admin/leadership/heatmap${s || ""}`;
  }

  return p || "/admin/leadership";
}