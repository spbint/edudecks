"use client";

import type { FamilyShellHandoffIntent } from "@/lib/familyCommandHandoff";

export type FamilyGuidanceEventName =
  | "recommended_card_clicked"
  | "handoff_helper_rendered"
  | "handoff_helper_start_mode"
  | "handoff_helper_followup_mode"
  | "handoff_progressed_after_arrival";

export type FamilyGuidanceEvent = {
  name: FamilyGuidanceEventName;
  intent?: FamilyShellHandoffIntent;
  sourceHref?: string;
  destinationHref?: string;
  pathname?: string;
  mode?: "start" | "followup";
  timestamp: number;
};

declare global {
  interface Window {
    __EDUDECKS_FAMILY_GUIDANCE_EVENTS__?: FamilyGuidanceEvent[];
  }
}

const FAMILY_GUIDANCE_WINDOW_EVENT = "edudecks:family-guidance";

export function trackFamilyGuidanceEvent(
  event: Omit<FamilyGuidanceEvent, "timestamp">
) {
  if (typeof window === "undefined") return;

  const next: FamilyGuidanceEvent = {
    ...event,
    timestamp: Date.now(),
  };

  try {
    const queue = window.__EDUDECKS_FAMILY_GUIDANCE_EVENTS__ || [];
    queue.push(next);
    window.__EDUDECKS_FAMILY_GUIDANCE_EVENTS__ = queue.slice(-200);
  } catch {
    // best-effort only
  }

  try {
    window.dispatchEvent(new CustomEvent(FAMILY_GUIDANCE_WINDOW_EVENT, { detail: next }));
  } catch {
    // best-effort only
  }

  if (process.env.NODE_ENV !== "production") {
    console.debug("[family-guidance]", next);
  }
}
