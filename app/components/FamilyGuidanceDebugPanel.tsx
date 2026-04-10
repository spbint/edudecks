"use client";

import React, { useEffect, useState } from "react";
import {
  FAMILY_GUIDANCE_WINDOW_EVENT,
  FAMILY_GUIDANCE_SNAPSHOT_EVENT,
  type FamilyGuidanceEvent,
  type FamilyGuidanceDebugSnapshot,
} from "@/lib/familyGuidanceEvents";

declare global {
  interface Window {
    __EDUDECKS_FAMILY_GUIDANCE_EVENTS__?: FamilyGuidanceEvent[];
    __EDUDECKS_FAMILY_GUIDANCE_SNAPSHOT__?: FamilyGuidanceDebugSnapshot;
  }
}

function formatTime(timestamp: number) {
  try {
    return new Date(timestamp).toLocaleTimeString("en-AU", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return String(timestamp);
  }
}

function clean(value?: string) {
  return value && value.trim() ? value : "—";
}

export default function FamilyGuidanceDebugPanel() {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<FamilyGuidanceEvent[]>([]);
  const [snapshot, setSnapshot] = useState<FamilyGuidanceDebugSnapshot | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" || typeof window === "undefined") {
      return;
    }

    setEvents([...(window.__EDUDECKS_FAMILY_GUIDANCE_EVENTS__ || [])].slice(-25).reverse());
    setSnapshot(window.__EDUDECKS_FAMILY_GUIDANCE_SNAPSHOT__ || null);

    function handleEvent(event: Event) {
      const detail = (event as CustomEvent<FamilyGuidanceEvent>).detail;
      if (!detail) return;
      setEvents((current) => [detail, ...current].slice(0, 25));
    }

    function handleSnapshot(event: Event) {
      const detail = (event as CustomEvent<FamilyGuidanceDebugSnapshot>).detail;
      if (!detail) return;
      setSnapshot(detail);
    }

    window.addEventListener(FAMILY_GUIDANCE_WINDOW_EVENT, handleEvent as EventListener);
    window.addEventListener(FAMILY_GUIDANCE_SNAPSHOT_EVENT, handleSnapshot as EventListener);
    return () => {
      window.removeEventListener(FAMILY_GUIDANCE_WINDOW_EVENT, handleEvent as EventListener);
      window.removeEventListener(FAMILY_GUIDANCE_SNAPSHOT_EVENT, handleSnapshot as EventListener);
    };
  }, []);

  if (process.env.NODE_ENV === "production") return null;

  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 140,
        width: open ? 360 : "auto",
        maxWidth: "calc(100vw - 32px)",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          minHeight: 34,
          padding: "8px 12px",
          borderRadius: 12,
          border: "1px solid #cbd5e1",
          background: "rgba(15,23,42,0.92)",
          color: "#f8fafc",
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 10px 30px rgba(15,23,42,0.18)",
        }}
      >
        {open ? "Hide guidance events" : `Guidance events (${events.length})`}
      </button>

      {open ? (
        <div
          style={{
            marginTop: 10,
            border: "1px solid #cbd5e1",
            borderRadius: 14,
            background: "rgba(255,255,255,0.98)",
            boxShadow: "0 18px 40px rgba(15,23,42,0.16)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid #e2e8f0",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              color: "#64748b",
            }}
          >
            Family guidance flow
          </div>
          <div
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid #e2e8f0",
              display: "grid",
              gap: 4,
              background: "#f8fafc",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Current state
            </div>
            <div style={{ fontSize: 11, color: "#475569" }}>
              bestNextMove={clean(snapshot?.bestNextMove)}
            </div>
            <div style={{ fontSize: 11, color: "#475569" }}>
              momentum={clean(snapshot?.momentumLabel)}
            </div>
            <div style={{ fontSize: 11, color: "#475569" }}>
              confidence={clean(snapshot?.readinessConfidenceLabel)}
            </div>
            <div style={{ fontSize: 11, color: "#475569" }}>
              focus={clean(snapshot?.focusLabel)}
            </div>
            <div style={{ fontSize: 11, color: "#475569" }}>
              helperMode={clean(snapshot?.helperMode)}
            </div>
            <div style={{ fontSize: 11, color: "#475569" }}>
              helperIntent={clean(snapshot?.helperIntent)}
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>
              path={clean(snapshot?.pathname)}
            </div>
          </div>
          <div
            style={{
              maxHeight: 320,
              overflowY: "auto",
              display: "grid",
            }}
          >
            {events.length === 0 ? (
              <div style={{ padding: 12, fontSize: 12, color: "#64748b" }}>No guidance events yet.</div>
            ) : (
              events.map((event, index) => (
                <div
                  key={`${event.name}-${event.timestamp}-${index}`}
                  style={{
                    padding: "10px 12px",
                    borderTop: index === 0 ? "none" : "1px solid #eef2f7",
                    display: "grid",
                    gap: 4,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{event.name}</div>
                  <div style={{ fontSize: 11, color: "#475569" }}>
                    {event.intent ? `intent=${event.intent}` : "intent=—"}
                    {" · "}
                    {event.pathname ? `path=${event.pathname}` : "path=—"}
                    {" · "}
                    {event.mode ? `mode=${event.mode}` : "mode=—"}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{formatTime(event.timestamp)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
