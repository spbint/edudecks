"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AdminLeftNav from "@/app/components/AdminLeftNav";
import StudentHubNav from "@/app/admin/components/StudentHubNav";
import { supabase } from "@/lib/supabaseClient";

/* ───────────────── TYPES ───────────────── */

type Student = {
  id: string;
  preferred_name?: string | null;
  first_name?: string | null;
  surname?: string | null;
  family_name?: string | null;
  year_level?: number | null;
  is_ilp?: boolean | null;
};

type Evidence = {
  id: string;
  title: string | null;
  summary: string | null;
  body?: string | null;
  learning_area: string | null;
  evidence_type: string | null;
  occurred_on: string | null;
  created_at: string | null;
  is_deleted?: boolean | null;
};

type AttributeLink = {
  evidence_id: string;
  attribute_id: string;
  attributes?: { name?: string | null } | { name?: string | null }[] | null;
};

/* ───────────────── HELPERS ───────────────── */

function safe(v: any) {
  return String(v ?? "").trim();
}

function shortDate(v: string | null | undefined) {
  return safe(v).slice(0, 10) || "—";
}

function studentName(s: Student | null) {
  if (!s) return "Student";
  return `${safe(s.preferred_name || s.first_name)} ${safe(
    s.surname || s.family_name
  )}`.trim() || "Student";
}

function attrNameFromLink(link: AttributeLink) {
  if (Array.isArray(link.attributes)) {
    return safe(link.attributes[0]?.name) || "Attribute";
  }
  return safe(link.attributes?.name) || "Attribute";
}

function clip(v: string | null | undefined, max = 220) {
  const s = safe(v);
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

/* ───────────────── STYLES (FIXED) ───────────────── */

const S = {
  shell: { display: "flex", minHeight: "100vh", background: "#f8fafc" } as React.CSSProperties,
  main: { flex: 1, padding: 28, maxWidth: 1200 } as React.CSSProperties,

  toolbar: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap" as const,
    marginBottom: 16,
  } as React.CSSProperties,

  btn: {
    padding: "10px 12px",
    borderRadius: 10,
    background: "#2563eb",
    color: "#fff",
    fontWeight: 900,
    border: "none",
    cursor: "pointer",
  } as React.CSSProperties,

  btnGhost: {
    padding: "10px 12px",
    borderRadius: 10,
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    fontWeight: 900,
    cursor: "pointer",
  } as React.CSSProperties,

  page: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: 28,
  } as React.CSSProperties,

  section: { marginTop: 22 } as React.CSSProperties,

  sectionTitle: { fontSize: 20, fontWeight: 900 } as React.CSSProperties,
  sectionText: { color: "#475569", marginBottom: 12 } as React.CSSProperties,

  summaryBox: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 16,
    whiteSpace: "pre-wrap",
    lineHeight: 1.7,
  } as React.CSSProperties,

  areaBlock: {
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 16,
    background: "#f8fafc",
    marginBottom: 14,
  } as React.CSSProperties,

  evidenceItem: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  } as React.CSSProperties,

  chip: {
    padding: "4px 8px",
    borderRadius: 999,
    border: "1px solid #cbd5e1",
    fontSize: 12,
    fontWeight: 900,
  } as React.CSSProperties,
};

/* ───────────────── PAGE ───────────────── */

export default function PortfolioPrintPage() {
  const params = useParams();
  const studentId = String(params?.id ?? "");

  const [student, setStudent] = useState<Student | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [links, setLinks] = useState<AttributeLink[]>([]);

  useEffect(() => {
    async function load() {
      const { data: s } = await supabase
        .from("students")
        .select("*")
        .eq("id", studentId)
        .maybeSingle();

      const { data: e } = await supabase
        .from("evidence_entries")
        .select("*")
        .eq("student_id", studentId)
        .eq("is_deleted", false);

      const { data: l } = await supabase
        .from("evidence_attribute_links")
        .select("evidence_id,attribute_id,attributes(name)");

      setStudent(s ?? null);
      setEvidence(e ?? []);
      setLinks(l ?? []);
    }

    load();
  }, [studentId]);

  const grouped = useMemo(() => {
    const map = new Map<string, Evidence[]>();
    evidence.forEach((e) => {
      const key = safe(e.learning_area) || "General";
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    });
    return Array.from(map.entries());
  }, [evidence]);

  const readiness =
    evidence.length >= 6 && grouped.length >= 3 ? "Ready" : "Developing";

  return (
    <div style={S.shell}>
      <AdminLeftNav />
      <main style={S.main}>
        <StudentHubNav studentId={studentId} />

        <div style={S.toolbar}>
          <button style={S.btn} onClick={() => window.print()}>
            Print / PDF
          </button>
          <Link href={`/admin/students/${studentId}/portfolio`} style={S.btnGhost}>
            Portfolio
          </Link>
        </div>

        <section style={S.page}>
          <h1 style={{ fontSize: 28, fontWeight: 900 }}>
            {studentName(student)} — Portfolio
          </h1>

          <section style={S.section}>
            <div style={S.sectionTitle}>Portfolio Readiness</div>
            <div style={S.summaryBox}>
              Status: {readiness}
              {"\n\n"}
              Evidence count: {evidence.length}
              {"\n"}
              Learning areas: {grouped.length}
            </div>
          </section>

          <section style={S.section}>
            <div style={S.sectionTitle}>Summary</div>
            <div style={S.summaryBox}>
              {studentName(student)} has {evidence.length} recorded pieces of
              learning evidence across {grouped.length} learning areas.
            </div>
          </section>

          <section style={S.section}>
            <div style={S.sectionTitle}>Evidence</div>

            {grouped.map(([area, items]) => (
              <div key={area} style={S.areaBlock}>
                <strong>{area}</strong>

                {items.map((e) => (
                  <div key={e.id} style={S.evidenceItem}>
                    <div>{safe(e.title)}</div>
                    <div>{shortDate(e.occurred_on)}</div>
                    <div>{clip(e.summary || e.body)}</div>
                  </div>
                ))}
              </div>
            ))}
          </section>
        </section>
      </main>
    </div>
  );
}