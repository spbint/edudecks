"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadClassAnalytics } from "@/lib/analytics/class";
import type { ClassAnalytics, ClassRow } from "@/lib/analytics/types";
import {
  buildTeacherFocusNext,
  buildTeacherGentleNudge,
  classConfidence,
  classMomentum,
  className,
  classYear,
  loadTeacherClasses,
  readLastTeacherClassId,
  setTeacherClassId,
} from "@/lib/teacherWorkspace";

function toneChip(tone: "neutral" | "info" | "warning" | "success"): React.CSSProperties {
  const tones = {
    neutral: { bg: "#f8fafc", fg: "#475569", bd: "#e2e8f0" },
    info: { bg: "#eff6ff", fg: "#1d4ed8", bd: "#bfdbfe" },
    warning: { bg: "#fff7ed", fg: "#c2410c", bd: "#fdba74" },
    success: { bg: "#ecfdf5", fg: "#047857", bd: "#86efac" },
  };
  const t = tones[tone];
  return {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 30,
    padding: "0 10px",
    borderRadius: 999,
    border: `1px solid ${t.bd}`,
    background: t.bg,
    color: t.fg,
    fontSize: 12,
    fontWeight: 800,
    lineHeight: 1.2,
    whiteSpace: "nowrap",
  };
}

export default function TeacherTopNavShell({ children }: { children: React.ReactNode }) {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [classId, setClassId] = useState("");
  const [analytics, setAnalytics] = useState<ClassAnalytics | null>(null);

  useEffect(() => {
    let mounted = true;

    async function hydrateClasses() {
      try {
        const rows = await loadTeacherClasses();
        if (!mounted) return;
        setClasses(rows);
        const stored = readLastTeacherClassId();
        const nextClassId = rows.find((row) => row.id === stored)?.id || rows[0]?.id || "";
        if (nextClassId) {
          setClassId(nextClassId);
          setTeacherClassId(nextClassId);
        }
      } catch {
        if (!mounted) return;
        setClasses([]);
      }
    }

    void hydrateClasses();

    function handleClassChange(event: Event) {
      const detail = (event as CustomEvent<{ classId?: string }>).detail;
      const nextClassId = String(detail?.classId ?? "").trim();
      if (nextClassId) setClassId(nextClassId);
    }

    window.addEventListener("edudecksTeacherClassChanged", handleClassChange as EventListener);
    return () => {
      mounted = false;
      window.removeEventListener("edudecksTeacherClassChanged", handleClassChange as EventListener);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!classId) {
      setAnalytics(null);
      return;
    }

    async function hydrateAnalytics() {
      try {
        const next = await loadClassAnalytics(classId);
        if (!mounted) return;
        setAnalytics(next);
      } catch {
        if (!mounted) return;
        setAnalytics(null);
      }
    }

    void hydrateAnalytics();
    return () => {
      mounted = false;
    };
  }, [classId]);

  const momentum = useMemo(
    () => classMomentum(analytics?.classHealthScore ?? 0),
    [analytics?.classHealthScore]
  );
  const confidence = useMemo(() => classConfidence(analytics), [analytics]);
  const focusNext = useMemo(() => buildTeacherFocusNext(analytics), [analytics]);
  const supportPressureNote = useMemo(() => buildTeacherGentleNudge(analytics), [analytics]);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section
        style={{
          border: "1px solid #dbeafe",
          background: "linear-gradient(180deg, #f8fbff 0%, #eff6ff 100%)",
          borderRadius: 22,
          padding: 20,
          display: "grid",
          gap: 14,
          boxShadow: "0 12px 30px rgba(15,23,42,0.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 14,
            flexWrap: "wrap",
            alignItems: "start",
          }}
        >
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: "#64748b" }}>
              Teacher command centre
            </div>
            <div style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.3rem)", fontWeight: 900, lineHeight: 1.05, color: "#0f172a" }}>
              {analytics?.klass ? className(analytics.klass) : "Teacher command centre"}
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: "#475569", maxWidth: 760 }}>
              {analytics?.klass
                ? `${classYear(analytics.klass) || "Class view"} in focus. Keep the class picture calm, visible, and easy to act on.`
                : "Choose a class to see the clearest next move and overall classroom visibility."}
            </div>
          </div>

          <div style={{ display: "grid", gap: 8, minWidth: 240 }}>
            <label style={{ fontSize: 12, fontWeight: 800, color: "#475569" }}>Class</label>
            <select
              value={classId}
              onChange={(e) => {
                const nextClassId = e.target.value;
                setClassId(nextClassId);
                setTeacherClassId(nextClassId);
              }}
              style={{
                minHeight: 42,
                borderRadius: 12,
                border: "1px solid #d1d5db",
                padding: "10px 12px",
                fontSize: 14,
                fontWeight: 700,
                color: "#0f172a",
                background: "#ffffff",
              }}
            >
              {!classes.length ? <option value="">No classes found</option> : null}
              {classes.map((row) => (
                <option key={row.id} value={row.id}>
                  {className(row)}{classYear(row) ? ` - ${classYear(row)}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {analytics?.students.length ? (
            <span style={toneChip("neutral")}>
              {analytics.students.length} student{analytics.students.length === 1 ? "" : "s"}
            </span>
          ) : null}
          <span style={toneChip(momentum.tone)}>{momentum.label}</span>
          <span style={toneChip(confidence.tone)}>{confidence.label}</span>
        </div>

        {focusNext ? (
          <div style={{ display: "grid", gap: 4, maxWidth: 780 }}>
            <div style={{ fontSize: 13, lineHeight: 1.5, color: "#334155" }}>
              <span style={{ fontWeight: 800, color: "#0f172a" }}>Best next move:</span>{" "}
              {focusNext.label}. {focusNext.reason}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ fontSize: 12, lineHeight: 1.45, color: "#64748b" }}>
                Why this now: it is the quickest way to improve class visibility without adding noise.
              </div>
              <Link
                href={focusNext.href}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 30,
                  padding: "0 10px",
                  borderRadius: 999,
                  background: "#1d4ed8",
                  color: "#ffffff",
                  textDecoration: "none",
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 0.3,
                  textTransform: "uppercase",
                }}
              >
                {focusNext.chip}
              </Link>
            </div>
          </div>
        ) : null}

        {supportPressureNote ? (
          <div style={{ fontSize: 12, lineHeight: 1.5, color: "#64748b" }}>
            Support note: {supportPressureNote}
          </div>
        ) : null}
      </section>

      {children}
    </div>
  );
}
