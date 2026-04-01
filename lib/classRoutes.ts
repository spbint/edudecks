export function safeClassId(value: unknown) {
  return String(value ?? "").trim();
}

function buildQueryString(query?: Record<string, string | null | undefined>) {
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

export function buildClassProfilePath(
  classId: string,
  query?: Record<string, string | null | undefined>
) {
  const id = safeClassId(classId);
  if (!id) return "/admin/classes";

  return `/admin/classes/${id}${buildQueryString(query)}`;
}

export function buildClassHeatmapPath(
  classId: string,
  query?: Record<string, string | null | undefined>
) {
  const id = safeClassId(classId);
  if (!id) return "/admin/classes";

  return `/admin/classes/${id}/heatmap${buildQueryString(query)}`;
}

export function buildClassListPath(
  query?: Record<string, string | null | undefined>
) {
  return `/admin/classes${buildQueryString(query)}`;
}

export function isLegacyClassPath(pathname: string | null | undefined) {
  const p = String(pathname ?? "").trim();

  return (
    /^\/admin\/class-profile\/[^/]+/.test(p) ||
    /^\/admin\/class-overview\/[^/]+/.test(p)
  );
}

export function normaliseLegacyClassPath(
  pathname: string | null | undefined,
  search?: string | null | undefined
) {
  const p = String(pathname ?? "").trim();
  const s = String(search ?? "").trim();

  const profileMatch = p.match(/^\/admin\/class-profile\/([^/]+)/);
  if (profileMatch) {
    return `/admin/classes/${profileMatch[1]}${s || ""}`;
  }

  const overviewMatch = p.match(/^\/admin\/class-overview\/([^/]+)/);
  if (overviewMatch) {
    return `/admin/classes/${overviewMatch[1]}${s || ""}`;
  }

  return p || "/admin/classes";
}