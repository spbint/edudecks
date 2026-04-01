export function safeStudentId(value: unknown) {
  return String(value ?? "").trim();
}

export function buildStudentProfilePath(
  studentId: string,
  returnTo?: string | null
) {
  const id = safeStudentId(studentId);
  if (!id) return "/admin/students";

  const base = `/admin/students/${id}`;

  if (!returnTo || !String(returnTo).trim()) {
    return base;
  }

  const params = new URLSearchParams({
    returnTo: String(returnTo).trim(),
  });

  return `${base}?${params.toString()}`;
}

export function buildStudentListPath(returnTo?: string | null) {
  if (!returnTo || !String(returnTo).trim()) {
    return "/admin/students";
  }

  const params = new URLSearchParams({
    returnTo: String(returnTo).trim(),
  });

  return `/admin/students?${params.toString()}`;
}

export function isLegacyStudentPath(pathname: string | null | undefined) {
  const p = String(pathname ?? "").trim();
  return /^\/admin\/student\/[^/]+/.test(p);
}

export function normaliseLegacyStudentPath(
  pathname: string | null | undefined,
  search?: string | null | undefined
) {
  const p = String(pathname ?? "").trim();
  const s = String(search ?? "").trim();

  const match = p.match(/^\/admin\/student\/([^/]+)/);
  if (!match) return p || "/admin/students";

  const studentId = match[1];
  return `/admin/students/${studentId}${s || ""}`;
}