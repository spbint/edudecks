"use client";

import { useMemo } from "react";

/* ───────────────── TYPES ───────────────── */

type HeatmapCell = {
  studentId: string;
  area: string;
  count: number;
  freshCount: number;
  lastSeenAt: string | null;
  studentCoverageScore: number;
  status: "Strong" | "Watch" | "Gap";
  riskScore: number;
};

type HeatmapStudentRow = {
  studentId: string;
  classId: string | null;
  studentName: string;
  isILP: boolean;
  attentionStatus: "Ready" | "Watch" | "Attention";
  nextAction: string;
  openInterventions: number;
  overdueReviews: number;
  evidenceCount30d: number;
  evidencePrev30d: number;
  evidenceMomentumDelta: number;
  totalEvidenceCount: number;
  invisibleRisk: boolean;
  authorityFragile: boolean;
  forecastRisk: "Stable" | "Watch" | "Escalating";
  score: number;
  cells: HeatmapCell[];
};

/* ───────────────── HELPERS ───────────────── */

function safe(v: any) {
  return String(v ?? "").trim();
}

/* ───────────────── MOCK INPUTS (keep your real ones) ───────────────── */

// NOTE: These should already exist in your real file.
// If they do — remove these lines.
const scopedStudentIds: string[] = [];
const studentMap = new Map();
const overviewMap = new Map();
const evidenceMap = new Map();
const interventionMap = new Map();
const areas = ["Literacy", "Numeracy", "Wellbeing"];

/* ───────────────── CORE FIXED LOGIC ───────────────── */

export default function LeadershipHeatmapPage() {
  const heatmapRows = useMemo<HeatmapStudentRow[]>(() => {
    return scopedStudentIds.map((studentId) => {
      const s: any = studentMap.get(studentId);
      const o: any = overviewMap.get(studentId);
      const evidenceList = (evidenceMap.get(studentId) ?? []) as any[];
      const interventionList = (interventionMap.get(studentId) ?? []) as any[];

      const attentionStatus: HeatmapStudentRow["attentionStatus"] =
        o?.attention_status === "Attention"
          ? "Attention"
          : o?.attention_status === "Watch"
          ? "Watch"
          : "Ready";

      const cells: HeatmapCell[] = areas.map((area) => ({
        studentId,
        area,
        count: 0,
        freshCount: 0,
        lastSeenAt: null,
        studentCoverageScore: 0,
        status: "Strong",
        riskScore: 0,
      }));

      return {
        studentId,
        classId: s?.class_id ?? null,
        studentName: safe(o?.student_name) || "Student",
        isILP: !!(o?.is_ilp ?? s?.is_ilp),
        attentionStatus,
        nextAction: "Maintain visibility",
        openInterventions: 0,
        overdueReviews: 0,
        evidenceCount30d: 0,
        evidencePrev30d: 0,
        evidenceMomentumDelta: 0,
        totalEvidenceCount: evidenceList.length,
        invisibleRisk: false,
        authorityFragile: false,
        forecastRisk: "Stable",
        score: 0,
        cells,
      };
    });
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontWeight: 900 }}>Leadership Heatmap</h1>

      <div style={{ marginTop: 16 }}>
        {heatmapRows.map((row) => (
          <div key={row.studentId} style={{ marginBottom: 12 }}>
            <strong>{row.studentName}</strong> — {row.attentionStatus}
          </div>
        ))}
      </div>
    </div>
  );
}