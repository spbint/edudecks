"use client";

import React, { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type { FamilyShellHandoffPayload } from "@/lib/familyCommandHandoff";
import { trackFamilyGuidanceEvent } from "@/lib/familyGuidanceEvents";

type FamilyHandoffNoteProps = {
  handoff: FamilyShellHandoffPayload | null;
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
  const lastRenderedRef = useRef<string>("");
  const previousActedRef = useRef<boolean>(acted);

  useEffect(() => {
    if (!handoff) return;

    const mode = acted ? "followup" : "start";
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
        name: acted ? "handoff_helper_followup_mode" : "handoff_helper_start_mode",
        intent: handoff.intent,
        sourceHref: handoff.href,
        destinationHref: handoff.href,
        pathname,
        mode,
      });
      lastRenderedRef.current = renderKey;
    }
  }, [acted, handoff, pathname]);

  useEffect(() => {
    if (!handoff) return;

    if (!previousActedRef.current && acted) {
      trackFamilyGuidanceEvent({
        name: "handoff_progressed_after_arrival",
        intent: handoff.intent,
        sourceHref: handoff.href,
        destinationHref: handoff.href,
        pathname,
        mode: "followup",
      });
    }

    previousActedRef.current = acted;
  }, [acted, handoff, pathname]);

  if (!handoff) return null;

  return (
    <section
      style={{
        marginTop,
        marginBottom,
        border: "1px solid #dbeafe",
        background: "#eff6ff",
        borderRadius: 16,
        padding: "14px 16px",
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
      <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.6, color: "#334155" }}>
        {handoff.detail}
      </div>
      <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.55, color: "#475569" }}>
        <span style={{ fontWeight: 800, color: "#0f172a" }}>
          {acted ? "From here:" : "Start here:"}
        </span>{" "}
        {acted ? handoff.followUpAction : handoff.firstAction}
      </div>
    </section>
  );
}
