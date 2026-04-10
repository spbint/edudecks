"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  buildLeadershipActivityNote,
  buildLeadershipSnapshot,
  buildLeadershipSupportPressure,
  classAction,
  classIssue,
  loadLeadershipDashboard,
} from "@/lib/leadershipWorkspace";
import type { LeadershipDashboard } from "@/lib/leadershipWorkspace";

const styles = {
  stack: {
    display: "grid",
    gap: 18,
  } satisfies React.CSSProperties,
  section: {
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    borderRadius: 22,
    padding: 20,
    display: "grid",
    gap: 14,
    boxShadow: "0 10px 26px rgba(15,23,42,0.04)",
  } satisfies React.CSSProperties,
  sectionTitle: {
    fontSize: 16,
    fontWeight: 900,
    color: "#0f172a",
  } satisfies React.CSSProperties,
  sectionBody: {
    fontSize: 14,
    lineHeight: 1.65,
    color: "#475569",
  } satisfies React.CSSProperties,
  softCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 16,
    background: "#f8fafc",
    display: "grid",
    gap: 8,
  } satisfies React.CSSProperties,
  quietNote: {
    border: "1px solid #dbeafe",
    borderRadius: 16,
    padding: "14px 16px",
    background: "linear-gradient(180deg, #f8fbff 0%, #eff6ff 100%)",
    fontSize: 14,
    lineHeight: 1.6,
    color: "#334155",
  } satisfies React.CSSProperties,
};

export default function LeadershipCommandCentrePage() {
  const [data, setData] = useState<LeadershipDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      if (mounted) {
        setLoading(true);
        setError("");
      }

      try {
        const next = await loadLeadershipDashboard();
        if (!mounted) return;
        setData(next);
      } catch (err) {
        if (!mounted) return;
        setData(null);
        setError(err instanceof Error ? err.message : "Unable to load leadership view.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void hydrate();
    return () => {
      mounted = false;
    };
  }, []);

  const priorityClasses = useMemo(() => data?.class_risk.slice(0, 5) ?? [], [data?.class_risk]);
  const snapshot = useMemo(() => buildLeadershipSnapshot(data), [data]);
  const supportPressure = useMemo(() => buildLeadershipSupportPressure(data), [data]);
  const activityNote = useMemo(() => buildLeadershipActivityNote(data), [data]);

  return (
    <div style={styles.stack}>
      {error ? (
        <section
          style={{
            ...styles.section,
            borderColor: "#fecaca",
            background: "#fff7f7",
            color: "#991b1b",
          }}
        >
          <div style={styles.sectionTitle}>Leadership view unavailable</div>
          <div style={styles.sectionBody}>{error}</div>
        </section>
      ) : null}

      <section style={styles.section}>
        <div style={styles.sectionTitle}>Priority classes</div>
        <div style={styles.sectionBody}>
          {loading
            ? "Loading the current school triage view."
            : priorityClasses.length
              ? "Start with the classes where visibility, review pressure, or support load is most likely to drift next."
              : "No classes are standing out for immediate leadership attention right now."}
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {priorityClasses.map((row) => (
            <Link
              key={row.class_id}
              href={`/classes/${row.class_id}/leadership`}
              style={{
                ...styles.softCard,
                textDecoration: "none",
                background: "#ffffff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "start",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "grid", gap: 4 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                    {row.class_name}
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.55, color: "#475569" }}>
                    {classIssue(row)}
                  </div>
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    minHeight: 28,
                    padding: "0 10px",
                    borderRadius: 999,
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    border: "1px solid #bfdbfe",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 0.2,
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  {classAction(row)}
                </div>
              </div>
            </Link>
          ))}

          {!loading && !priorityClasses.length ? (
            <div style={styles.softCard}>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: "#475569" }}>
                The school picture is relatively settled. A light class-level check-in is enough for now.
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionTitle}>School snapshot</div>
        <div style={styles.sectionBody}>{loading ? "Preparing the school summary." : snapshot}</div>
      </section>

      {supportPressure ? (
        <section style={styles.quietNote}>
          <span style={{ fontWeight: 800, color: "#0f172a" }}>Support pressure:</span>{" "}
          {supportPressure}
        </section>
      ) : null}

      {activityNote ? (
        <section style={styles.section}>
          <div style={styles.sectionTitle}>Recent activity</div>
          <div style={styles.sectionBody}>{activityNote}</div>
        </section>
      ) : null}
    </div>
  );
}
