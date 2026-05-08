function safe(value: unknown) {
  return String(value ?? "").trim();
}

export function normalizeNextPath(nextPath?: string | null) {
  const clean = safe(nextPath);
  if (!clean) return "/";
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    try {
      const url = new URL(clean);
      return `${url.pathname}${url.search}${url.hash}` || "/";
    } catch {
      return "/";
    }
  }
  return clean.startsWith("/") ? clean : `/${clean}`;
}

export function normalizeAuthNextPath(
  nextPath?: string | null,
  fallback = "/my-day",
) {
  const normalizedFallback = normalizeNextPath(fallback) || "/my-day";
  const normalized = normalizeNextPath(nextPath) || normalizedFallback;

  if (
    normalized === "/login" ||
    normalized.startsWith("/login?") ||
    normalized === "/signup" ||
    normalized.startsWith("/signup?") ||
    normalized === "/auth/callback" ||
    normalized.startsWith("/auth/callback?")
  ) {
    return normalizedFallback;
  }

  return normalized;
}

export function buildAuthCallbackUrl(nextPath?: string) {
  const next = normalizeAuthNextPath(nextPath);

  if (typeof window !== "undefined") {
    const url = new URL("/auth/callback", window.location.origin);
    url.searchParams.set("next", next);
    return url.toString();
  }

  const appUrl = safe(process.env.NEXT_PUBLIC_APP_URL).replace(/\/+$/, "");
  if (appUrl) {
    const url = new URL("/auth/callback", appUrl);
    url.searchParams.set("next", next);
    return url.toString();
  }

  return `/auth/callback?next=${encodeURIComponent(next)}`;
}
