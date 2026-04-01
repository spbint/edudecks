"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import AdminLeftNav from "@/app/components/AdminLeftNav";
import StudentHubNav from "@/app/admin/components/StudentHubNav";
import { supabase } from "@/lib/supabaseClient";

/* ───────────────────────── TYPES ───────────────────────── */

type Student = {
  id: string;
  preferred_name?: string | null;
  first_name?: string | null;
  surname?: string | null;
  family_name?: string | null;
};

type Attribute = {
  id: string;
  name: string | null;
  domain?: string | null;
};

type Link = {
  attribute_id: string;
  evidence_id: string;
};

type Evidence = {
  id: string;
  student_id: string;
};

/* ───────────────────────── HELPERS ───────────────────────── */

function safe(v: any) {
  return String(v ?? "").trim();
}

function studentName(s: Student | null) {
  if (!s) return "Student";
  return `${safe(s.preferred_name || s.first_name)} ${safe(
    s.surname || s.family_name
  )}`.trim();
}

/* Heat color scale */

function heatColor(n: number) {
  if (n >= 10) return "#16a34a"; // strong
  if (n >= 6) return "#22c55e";
  if (n >= 3) return "#facc15";
  if (n >= 1) return "#f97316";
  return "#1e293b"; // none
}

/* ───────────────────────── STYLES ───────────────────────── */

const S = {
  shell: { display: "flex", minHeight: "100vh", background: "#0f172a" },
  main: { flex: 1, padding: 28, color: "#e5e7eb", maxWidth: 1200 },

  h1: { fontSize: 28, fontWeight: 900, marginBottom: 8 },
  sub: { color: "#94a3b8", fontWeight: 700, marginBottom: 18 },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))",
    gap: 12,
  },

  cell: (color: string): React.CSSProperties => ({
    background: color,
    borderRadius: 12,
    padding: 14,
    minHeight: 90,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  }),

  name: { fontWeight: 800, fontSize: 14 },
  count: { fontSize: 22, fontWeight: 900, textAlign: "right" },

  legend: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    marginBottom: 16,
  },

  swatch: (color: string): React.CSSProperties => ({
    width: 18,
    height: 18,
    borderRadius: 4,
    background: color,
  }),
};

/* ───────────────────────── PAGE ───────────────────────── */

export default function StudentHeatmapPage() {
  const params = useParams();
  const studentId = String(params?.id ?? "");

  const [student, setStudent] = useState<Student | null>(null);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);

  useEffect(() => {
    async function load() {
      const { data: s } = await supabase
        .from("students")
        .select("id,preferred_name,first_name,surname,family_name")
        .eq("id", studentId)
        .single();

      const { data: a } = await supabase
        .from("attributes")
        .select("id,name,domain")
        .eq("is_active", true);

      const { data: ev } = await supabase
        .from("evidence_entries")
        .select("id,student_id")
        .eq("student_id", studentId)
        .eq("is_deleted", false);

      const { data: l } = await supabase
        .from("evidence_attribute_links")
        .select("attribute_id,evidence_id");

      setStudent(s ?? null);
      setAttributes(a ?? []);
      setEvidence(ev ?? []);
      setLinks(l ?? []);
    }

    if (studentId) load();
  }, [studentId]);

  /* ───────────────── COUNT EVIDENCE PER ATTRIBUTE ───────────────── */

  const counts = useMemo(() => {
    const evidenceSet = new Set(evidence.map((e) => e.id));

    const map: Record<string, number> = {};

    links.forEach((l) => {
      if (evidenceSet.has(l.evidence_id)) {
        map[l.attribute_id] = (map[l.attribute_id] || 0) + 1;
      }
    });

    return map;
  }, [links, evidence]);

  /* ───────────────── RENDER ───────────────── */

  return (
    <div style={S.shell}>
      <AdminLeftNav />

      <main style={S.main}>
        <StudentHubNav studentId={studentId} />

        <h1 style={S.h1}>
          {studentName(student)} — Learner Heatmap
        </h1>

        <div style={S.sub}>
          Evidence-weighted view of strengths across attributes.
        </div>

        {/* LEGEND */}

        <div style={S.legend}>
          <div style={S.swatch("#16a34a")} /> Strong
          <div style={S.swatch("#22c55e")} /> Developing
          <div style={S.swatch("#facc15")} /> Emerging
          <div style={S.swatch("#f97316")} /> Minimal
          <div style={S.swatch("#1e293b")} /> None
        </div>

        {/* HEAT GRID */}

        <div style={S.grid}>
          {attributes.map((a) => {
            const n = counts[a.id] || 0;

            return (
              <div key={a.id} style={S.cell(heatColor(n))}>
                <div style={S.name}>{safe(a.name) || "Attribute"}</div>
                <div style={S.count}>{n}</div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}