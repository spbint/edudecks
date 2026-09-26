import { normalizeAuthNextPath } from "@/lib/authRedirect";

export const PENDING_MARKETPLACE_DESTINATION_KEY =
  "mylearna.auth.pendingMarketplaceDestination";

function supportedMarketplaceDestination(path: string) {
  return (
    path.startsWith("/my-resources") ||
    path.startsWith("/my-pathways")
  );
}

export function rememberPendingMarketplaceDestination(
  candidate: string | null | undefined,
) {
  if (typeof window === "undefined") return;
  const normalized = normalizeAuthNextPath(candidate, "/");

  try {
    if (!supportedMarketplaceDestination(normalized)) {
      window.sessionStorage.removeItem(PENDING_MARKETPLACE_DESTINATION_KEY);
      return;
    }

    window.sessionStorage.setItem(
      PENDING_MARKETPLACE_DESTINATION_KEY,
      normalized,
    );
  } catch {
    // Keep auth/setup usable in restricted browser storage modes.
  }
}

export function readPendingMarketplaceDestination() {
  if (typeof window === "undefined") return null;

  try {
    const stored = normalizeAuthNextPath(
      window.sessionStorage.getItem(PENDING_MARKETPLACE_DESTINATION_KEY),
      "/",
    );
    if (!supportedMarketplaceDestination(stored)) {
      window.sessionStorage.removeItem(PENDING_MARKETPLACE_DESTINATION_KEY);
      return null;
    }
    return stored;
  } catch {
    return null;
  }
}

export function consumePendingMarketplaceDestination() {
  const destination = readPendingMarketplaceDestination();
  if (!destination || typeof window === "undefined") return destination;

  try {
    window.sessionStorage.removeItem(PENDING_MARKETPLACE_DESTINATION_KEY);
  } catch {
    // A failed cleanup should not block the requested navigation.
  }

  return destination;
}
