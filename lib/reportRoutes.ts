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

export function buildAdminReportingPath(
  query?: Record<string, string | null | undefined>
) {
  return `/admin/reporting${buildQueryString(query)}`;
}

export function buildAdminReportsOutputPath(
  query?: Record<string, string | null | undefined>
) {
  return `/admin/reports/output${buildQueryString(query)}`;
}

export function buildAdminReportsReadinessPath(
  query?: Record<string, string | null | undefined>
) {
  return `/admin/reports/readiness${buildQueryString(query)}`;
}

export function buildAdminReportsBatchPath(
  query?: Record<string, string | null | undefined>
) {
  return `/admin/reports/batch${buildQueryString(query)}`;
}

export function isLegacyAdminReportPath(pathname: string | null | undefined) {
  const p = String(pathname ?? "").trim();

  return p === "/admin/dashboard";
}

export function normaliseLegacyAdminReportPath(
  pathname: string | null | undefined,
  search?: string | null | undefined
) {
  const p = String(pathname ?? "").trim();
  const s = String(search ?? "").trim();

  if (p === "/admin/dashboard") {
    return `/admin/command-centre${s || ""}`;
  }

  return p || "/admin/reporting";
}