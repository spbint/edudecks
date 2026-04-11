"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { FamilyShellHandoffPayload } from "@/lib/familyCommandHandoff";
import type { CrossRoleHandoffPayload } from "@/lib/crossRoleHandoff";
import {
  publishFamilyGuidanceSnapshot,
  trackFamilyGuidanceEvent,
} from "@/lib/familyGuidanceEvents";

type SharedHandoffPayload =
  | FamilyShellHandoffPayload
  | CrossRoleHandoffPayload;

type FamilyHandoffNoteProps = {
  handoff: SharedHandoffPayload | null;
  acted?: boolean;
  marginBottom?: number;
  marginTop?: number;
};

export default function FamilyHandoffNote({
  handoff,
  acted = false,
  marginBottom = 18,
  marginTop = 0,
}: FamilyHandoffNoteProps) {
  const pathname = usePathname();
  const handoffKey = useMemo(
    () =>
      handoff
        ? `${pathname}:${handoff.intent}:${handoff.href}:${"timestamp" in handoff ? handoff.timestamp : handoff.createdAt}`
        : "",
    [handoff, pathname]
  );
  const lastRenderedRef = useRef<string>("");
  const previousActedRef = useRef<boolean>(false);
  const [arrivalActed, setArrivalActed] = useState(acted);
  const effectiveActed = Boolean(handoff) && acted && !arrivalActed;

  useEffect(() => {
    setArrivalActed(acted);
    previousActedRef.current = false;
    lastRenderedRef.current = "";
  }, [acted, handoffKey]);

  useEffect(() => {
    if (!handoff) return;

    const mode = effectiveActed ? "followup" : "start";
    const renderKey = `${pathname}:${handoff.intent}:${mode}`;

    if (lastRenderedRef.current !== renderKey) {
      trackFamilyGuidanceEvent({
        name: "handoff_helper_rendered",
        intent: handoff.intent,
        sourceHref: handoff.href,
        destinationHref: handoff.href,
        pathname,
        mode,
      });
      trackFamilyGuidanceEvent({
        name: effectiveActed ? "handoff_helper_followup_mode" : "handoff_helper_start_mode",
        intent: handoff.intent,
        sourceHref: handoff.href,
        destinationHref: handoff.href,
        pathname,
        mode,
      });
      lastRenderedRef.current = renderKey;
    }
  }, [effectiveActed, handoff, pathname]);

  useEffect(() => {
    if (!handoff) {
      publishFamilyGuidanceSnapshot({
        pathname,
        helperMode: undefined,
        helperIntent: undefined,
      });
      return;
    }

    publishFamilyGuidanceSnapshot({
      pathname,
      helperMode: effectiveActed ? "followup" : "start",
      helperIntent: handoff.intent,
    });
  }, [effectiveActed, handoff, pathname]);

  useEffect(() => {
    if (!handoff) return;

    if (!previousActedRef.current && effectiveActed) {
      trackFamilyGuidanceEvent({
        name: "handoff_progressed_after_arrival",
        intent: handoff.intent,
        sourceHref: handoff.href,
        destinationHref: handoff.href,
        pathname,
        mode: "followup",
      });
    }

    previousActedRef.current = effectiveActed;
  }, [effectiveActed, handoff, pathname]);

  if (!handoff) return null;

  return (
    <section
      style={{
        marginTop,
        marginBottom,
        border: "1px solid #dbeafe",
        background: "linear-gradient(180deg, #f8fbff 0%, #eff6ff 100%)",
        borderRadius: 16,
        padding: "14px 16px",
        maxWidth: 820,
        boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: "#64748b",
        }}
      >
        {handoff.title}
      </div>
      <div style={{ marginTop: 7, fontSize: 14, lineHeight: 1.6, color: "#334155" }}>
        {handoff.detail}
      </div>
      <div style={{ marginTop: 9, fontSize: 13, lineHeight: 1.55, color: "#475569" }}>
        <span style={{ fontWeight: 800, color: "#0f172a" }}>
          {effectiveActed ? "From here:" : "Start here:"}
        </span>{" "}
        {effectiveActed ? handoff.followUpAction : handoff.firstAction}
      </div>
    </section>
  );
}
