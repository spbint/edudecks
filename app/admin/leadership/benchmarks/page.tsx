"use client";

import React, { useEffect, useMemo, useState } from "react";
import AdminLeftNav from "@/app/components/AdminLeftNav";
import { supabase } from "@/lib/supabaseClient";

/* =========================================================
   TYPES
========================================================= */

type ClassRow = {
  id: string;
  name?: string | null;
  teacher_name?: string | null;
};

type BenchmarkRow = {
  classId: string;
  className: string;
  teacher: string;
  studentCount: number;

  avgEvidenceAge: number; // days
  evidencePerStudent30d: number;
  overdueReviews: number;
  interventionLoad: number;
  readinessScore: number; // 0–100

  ilpCount: number;
};

/* =========================================================
   HELPERS
========================================================= */

function readinessBand(score: number) {
  if (score >= 80) return { label: "Strong", color: "#16a34a" };
  if (score >= 60) return { label: "Stable", color: "#2563eb" };
  if (score >= 40) return { label: "Watch", color: "#f59e0b" };
  return { label: "Critical", color: "#dc2626" };
}

function anomalyFlag(value: number, avg: number) {
  if (avg === 0) return false;
  const ratio = value / avg;
  return ratio > 1.5 || ratio < 0.6;
}

/* =========================================================
   PAGE
========================================================= */

export default function LeadershipBenchmarksPage() {
  const [rows, setRows] = useState<BenchmarkRow[]>([]);
  const [loading, setLoading] = useState(true);

  /* ------------------------------------------------------
     LOAD DATA (SIMPLIFIED AGGREGATION)
  ------------------------------------------------------ */

  useEffect(() => {
    async function load() {
      try {
        const { data: classes } = await supabase
          .from("classes")
          .select("id,name,teacher_name");

        const out: BenchmarkRow[] = [];

        for (const c of classes ?? []) {
          const classId = c.id;

          const { data: students } = await supabase
            .from("students")
            .select("id,is_ilp")
            .eq("class_id", classId);

          const studentIds = (students ?? []).map((s: any) => s.id);

          const { data: evidence } = await supabase
            .from("evidence_entries")
            .select("occurred_on")
            .eq("class_id", classId);

          const { data: interventions } = await supabase
            .from("interventions")
            .select("review_due_on,status")
            .eq("class_id", classId);

          const now = new Date();

          const avgEvidenceAge =
            evidence && evidence.length
              ? evidence.reduce((acc: number, e: any) => {
                  const d = new Date(e.occurred_on ?? now);
                  return acc + (now.getTime() - d.getTime()) / 86400000;
                }, 0) / evidence.length
              : 999;

          const evidence30 =
            evidence?.filter((e: any) => {
              const d = new Date(e.occurred_on ?? now);
              return (now.getTime() - d.getTime()) / 86400000 <= 30;
            }).length ?? 0;

          const evidencePerStudent30d =
            studentIds.length > 0 ? evidence30 / studentIds.length : 0;

          const overdueReviews =
            interventions?.filter((i: any) => {
              if (!i.review_due_on) return false;
              return new Date(i.review_due_on) < now;
            }).length ?? 0;

          const interventionLoad = interventions?.length ?? 0;

          const ilpCount =
            students?.filter((s: any) => s.is_ilp).length ?? 0;

          const readinessScore = Math.max(
            0,
            Math.min(
              100,
              100 -
                avgEvidenceAge * 1.2 -
                overdueReviews * 4 -
                interventionLoad * 0.8
            )
          );

          out.push({
            classId,
            className: c.name ?? "Class",
            teacher: c.teacher_name ?? "—",
            studentCount: studentIds.length,
            avgEvidenceAge: Math.round(avgEvidenceAge),
            evidencePerStudent30d: Number(
              evidencePerStudent30d.toFixed(2)
            ),
            overdueReviews,
            interventionLoad,
            readinessScore: Math.round(readinessScore),
            ilpCount,
          });
        }

        setRows(out);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  /* ------------------------------------------------------
     SYSTEM AVERAGES
  ------------------------------------------------------ */

  const averages = useMemo(() => {
    if (!rows.length) return null;

    const avg = (fn: (r: BenchmarkRow) => number) =>
      rows.reduce((a, r) => a + fn(r), 0) / rows.length;

    return {
      evidenceAge: avg((r) => r.avgEvidenceAge),
      evidenceRate: avg((r) => r.evidencePerStudent30d),
      overdue: avg((r) => r.overdueReviews),
      interventions: avg((r) => r.interventionLoad),
      readiness: avg((r) => r.readinessScore),
    };
  }, [rows]);

  /* ------------------------------------------------------
     RENDER
  ------------------------------------------------------ */

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f1f5f9" }}>
      <AdminLeftNav />

      <div style={{ flex: 1, padding: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900 }}>
          Leadership Benchmarks
        </h1>
        <p style={{ color: "#475569", marginBottom: 24 }}>
          Compare class performance against system standards and identify
          anomalies requiring leadership attention.
        </p>

        {loading && <div>Loading…</div>}

        {!loading && averages && (
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 20,
              marginBottom: 24,
              boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
            }}
          >
            <strong>System Averages</strong>
            <div style={{ marginTop: 8, fontSize: 14 }}>
              Evidence Age: {averages.evidenceAge.toFixed(1)} days · Evidence
              Rate: {averages.evidenceRate.toFixed(2)} · Overdue Reviews:{" "}
              {averages.overdue.toFixed(1)} · Intervention Load:{" "}
              {averages.interventions.toFixed(1)} · Readiness:{" "}
              {averages.readiness.toFixed(0)}%
            </div>
          </div>
        )}

        {!loading && (
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 20,
              boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
            }}
          >
            <table style={{ width: "100%", fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                  <th>Class</th>
                  <th>Teacher</th>
                  <th>Students</th>
                  <th>Evidence Age</th>
                  <th>Evidence Rate</th>
                  <th>Overdue Reviews</th>
                  <th>Interventions</th>
                  <th>ILP</th>
                  <th>Readiness</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r) => {
                  const band = readinessBand(r.readinessScore);

                  const flag =
                    averages &&
                    (anomalyFlag(r.avgEvidenceAge, averages.evidenceAge) ||
                      anomalyFlag(
                        r.evidencePerStudent30d,
                        averages.evidenceRate
                      ) ||
                      anomalyFlag(r.overdueReviews, averages.overdue) ||
                      anomalyFlag(
                        r.interventionLoad,
                        averages.interventions
                      ));

                  return (
                    <tr key={r.classId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td>
                        <strong>{r.className}</strong>{" "}
                        {flag && (
                          <span style={{ color: "#dc2626", fontWeight: 700 }}>
                            ⚠
                          </span>
                        )}
                      </td>
                      <td>{r.teacher}</td>
                      <td>{r.studentCount}</td>
                      <td>{r.avgEvidenceAge} d</td>
                      <td>{r.evidencePerStudent30d}</td>
                      <td>{r.overdueReviews}</td>
                      <td>{r.interventionLoad}</td>
                      <td>{r.ilpCount}</td>
                      <td style={{ color: band.color, fontWeight: 700 }}>
                        {band.label} ({r.readinessScore}%)
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}