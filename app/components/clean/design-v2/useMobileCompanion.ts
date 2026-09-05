"use client";

import { useSyncExternalStore } from "react";

// This mirrors the authenticated shell's established mobile breakpoint.
export const MOBILE_COMPANION_MEDIA_QUERY = "(max-width: 900px)";
export const MOBILE_COMPANION_CAPTURE_EDITING_EVENT = "mylearna:mobile-companion-capture-editing";

function subscribeToMobileCompanion(callback: () => void) {
  const mediaQuery = window.matchMedia(MOBILE_COMPANION_MEDIA_QUERY);
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getMobileCompanionSnapshot() {
  return window.matchMedia(MOBILE_COMPANION_MEDIA_QUERY).matches;
}

export function useMobileCompanion() {
  return useSyncExternalStore(
    subscribeToMobileCompanion,
    getMobileCompanionSnapshot,
    () => false,
  );
}

export function setMobileCompanionCaptureEditing(editing: boolean) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<boolean>(MOBILE_COMPANION_CAPTURE_EDITING_EVENT, { detail: editing }),
  );
}
