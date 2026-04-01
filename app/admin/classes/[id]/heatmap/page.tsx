"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AdminLeftNav from "@/app/components/AdminLeftNav";
import { supabase } from "@/lib/supabaseClient";

/* ───────────────────────── TYPES ───────────────────────── */

type ClassRow = {
  id: string;
  name?: string | null;
  year_level?: number | null;
  teacher_name?: string | null;
  room?: string | null;
  [k: string]: any;
};

type StudentRow = {
  id: string;
  class_id?: string | null;
  preferred_name?: string | null;
  first_name?: string | null;
  surname?: string | null;
  family_name?: string | null;
  is_ilp?: boolean | null;
  [k: string]: any;
};

type EvidenceRow = {
  id: string;
  student_id?: string | null;
  class_id?: string | null;
  title?: string | null;
  learning_area?: string | null;
  occurred_on?: string | null;
  created_at?: string | null;
  is_deleted?: boolean | null;
  [k: string]: any;
};

type AttributeRow = {
  id?: string | null;
  key?: string | null;
  name?: string | null;
  domain?: string | null;
  sort_order?: number | null;
  is_active?: boolean | null;
  [k: string]: any;
};

type EvidenceAttributeLinkRow = {
  evidence_id?: string | null;
  attribute_id?: string | null;
  student_id?: string | null;
  [k: string]: any;
};

/* ───────────────────────── HELPERS ───────────────────────── */

function safe(v: any) {
  return String(v ?? "").trim();
}

function isMissingRelationOrColumn(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && (msg.includes("relation") || msg.includes("column"));
}

function classLabel(c: ClassRow | null) {
  if (!c) return "Class";
  const bits = [
    c.year_level ? `Year ${c.year_level}` : "",
    safe(c.name),
  ].filter(Boolean);
  return bits.join(" • ") || "Class";
}

function studentName(s: StudentRow | null | undefined) {
  if (!s) return "Student";
  return `${safe(s.preferred_name || s.first_name)} ${safe(s.surname || s.family_name)}`.trim() || "Student";
}

function shortDate(v: string | null | undefined) {
  return safe(v).slice(0, 10) || "—";
}

function heatColor(n: number) {
  if (n >= 20) return "#166534";
  if (n >= 12) return "#16a34a";
  if (n >= 6) return "#22c55e";
  if (n >= 3) return "#facc15";
  if (n >= 1) return "#f97316";
  return "#1e293b";
}

function coverageTone(pct: number) {
  if (pct >= 80) return "#16a34a";
  if (pct >= 50) return "#eab308";
  if (pct >= 25) return "#f97316";
  return "#ef4444";
}

/* ───────────────────────── STYLES ───────────────────────── */

const S = {
  shell: {
    display: "flex",
    minHeight: "100vh",
    background: "#0f172a",
  } as React.CSSProperties,

  main: {
    flex: 1,
    padding: 28,
    color: "#e5e7eb",
    maxWidth: 1360,
    width: "100%",
  } as React.CSSProperties,

  hero: {
    background: "#111827",
    border: "1px solid #1f2937",
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
  } as React.CSSProperties,

  h1: {
    fontSize: 28,
    fontWeight: 900,
    margin: 0,
  } as React.CSSProperties,

  sub: {
    marginTop: 8,
    color: "#94a3b8",
    fontWeight: 700,
    lineHeight: 1.5,
  } as React.CSSProperties,

  row: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  } as React.CSSProperties,

  chip: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    background: "#1e293b",
    border: "1px solid #334155",
    fontSize: 12,
    fontWeight: 900,
    color: "#e5e7eb",
  } as React.CSSProperties,

  btn: {
    padding: "10px 12px",
    borderRadius: 10,
    background: "#2563eb",
    border: "none",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
    textDecoration: "none",
  } as React.CSSProperties,

  btnGhost: {
    padding: "10px 12px",
    borderRadius: 10,
    background: "#1e293b",
    border: "1px solid #334155",
    color: "#e5e7eb",
    fontWeight: 900,
    cursor: "pointer",
    textDecoration: "none",
  } as React.CSSProperties,

  grid2: {
    display: "grid",
    gridTemplateColumns: "1.15fr 0.85fr",
    gap: 16,
    alignItems: "start",
  } as React.CSSProperties,

  card: {
    background: "#111827",
    border: "1px solid #1f2937",
    borderRadius: 16,
    padding: 16,
  } as React.CSSProperties,

  title: {
    fontSize: 18,
    fontWeight: 900,
    marginBottom: 10,
  } as React.CSSProperties,

  controls: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 12,
    marginBottom: 10,
  } as React.CSSProperties,

  select: {
    padding: "10px 12px",
    borderRadius: 10,
    background: "#0b1220",
    border: "1px solid #334155",
    color: "#e5e7eb",
    fontWeight: 800,
  } as React.CSSProperties,

  input: {
    padding: "10px 12px",
    borderRadius: 10,
    background: "#0b1220",
    border: "1px solid #334155",
    color: "#e5e7eb",
    fontWeight: 800,
    minWidth: 220,
  } as React.CSSProperties,

  legend: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 14,
  } as React.CSSProperties,

  swatch: (color: string): React.CSSProperties => ({
    width: 18,
    height: 18,
    borderRadius: 4,
    background: color,
    border: "1px solid rgba(255,255,255,0.12)",
  }),

  heatGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
    gap: 12,
  } as React.CSSProperties,

  heatCell: (color: string): React.CSSProperties => ({
    background: color,
    borderRadius: 12,
    padding: 14,
    minHeight: 96,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  }),

  cellName: {
    fontWeight: 800,
    fontSize: 14,
    lineHeight: 1.25,
    color: "#ffffff",
  } as React.CSSProperties,

  cellMeta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "end",
    gap: 8,
  } as React.CSSProperties,

  cellCount: {
    fontSize: 24,
    fontWeight: 900,
    color: "#ffffff",
  } as React.CSSProperties,

  cellSmall: {
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
    fontWeight: 800,
    textAlign: "right",
  } as React.CSSProperties,

  list: {
    display: "grid",
    gap: 10,
  } as React.CSSProperties,

  item: {
    background: "#0b1220",
    border: "1px solid #1f2937",
    borderRadius: 12,
    padding: 12,
  } as React.CSSProperties,

  itemTitle: {
    fontWeight: 800,
    fontSize: 14,
  } as React.CSSProperties,

  itemMeta: {
    marginTop: 4,
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: 700,
  } as React.CSSProperties,

  empty: {
    background: "#111827",
    borderRadius: 14,
    padding: 20,
    border: "1px solid #1f2937",
    color: "#94a3b8",
    fontWeight: 700,
  } as React.CSSProperties,

  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 12,
    marginTop: 14,
  } as React.CSSProperties,

  statCard: {
    background: "#0b1220",
    border: "1px solid #1f2937",
    borderRadius: 12,
    padding: 14,
  } as React.CSSProperties,

  statLabel: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  } as React.CSSProperties,

  statValue: {
    fontSize: 26,
    fontWeight: 900,
    marginTop: 6,
  } as React.CSSProperties,

  barBg: {
    width: "100%",
    height: 10,
    borderRadius: 999,
    background: "#1e293b",
    overflow: "hidden",
    marginTop: 8,
  } as React.CSSProperties,
};

/* ───────────────────────── PAGE ───────────────────────── */

export default function ClassHeatmapPage() {
  const params = useParams();
  const router = useRouter();
  const classId = String(params?.id ?? "");

  const [klass, setKlass] = useState<ClassRow | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);
  const [attributes, setAttributes] = useState<AttributeRow[]>([]);
  const [links, setLinks] = useState<EvidenceAttributeLinkRow[]>([]);

  const [domainFilter, setDomainFilter] = useState("All domains");
  const [studentSearch, setStudentSearch] = useState("");

  useEffect(() => {
    async function load() {
      /* class */
      const classQueries = [
        supabase
          .from("classes")
          .select("id,name,year_level,teacher_name,room")
          .eq("id", classId)
          .maybeSingle(),
        supabase
          .from("classes")
          .select("id,name,year_level,room")
          .eq("id", classId)
          .maybeSingle(),
        supabase
          .from("classes")
          .select("id,name")
          .eq("id", classId)
          .maybeSingle(),
      ];

      let loadedClass: ClassRow | null = null;
      for (const q of classQueries) {
        const r = await q;
        if (!r.error) {
          loadedClass = (r.data as ClassRow | null) ?? null;
          break;
        }
        if (!isMissingRelationOrColumn(r.error)) throw r.error;
      }

      /* students */
      const studentQueries = [
        supabase
          .from("students")
          .select("id,class_id,preferred_name,first_name,surname,family_name,is_ilp")
          .eq("class_id", classId),
        supabase
          .from("students")
          .select("id,class_id,preferred_name,first_name,surname,is_ilp")
          .eq("class_id", classId),
        supabase
          .from("students")
          .select("id,class_id,preferred_name,first_name,is_ilp")
          .eq("class_id", classId),
      ];

      let loadedStudents: StudentRow[] = [];
      for (const q of studentQueries) {
        const r = await q;
        if (!r.error) {
          loadedStudents = (r.data as StudentRow[]) ?? [];
          break;
        }
        if (!isMissingRelationOrColumn(r.error)) throw r.error;
      }

      /* evidence */
      const evidenceQueries = [
        supabase
          .from("evidence_entries")
          .select("id,student_id,class_id,title,learning_area,occurred_on,created_at,is_deleted")
          .eq("class_id", classId)
          .eq("is_deleted", false),
        supabase
          .from("evidence_entries")
          .select("id,student_id,class_id,title,learning_area,occurred_on,created_at")
          .eq("class_id", classId),
      ];

      let loadedEvidence: EvidenceRow[] = [];
      for (const q of evidenceQueries) {
        const r = await q;
        if (!r.error) {
          loadedEvidence = ((r.data as EvidenceRow[]) ?? []).filter((x) => x.is_deleted !== true);
          break;
        }
        if (!isMissingRelationOrColumn(r.error)) throw r.error;
      }

      /* attributes */
      const attributeQueries = [
        supabase
          .from("attributes")
          .select("id,key,name,domain,sort_order,is_active")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
        supabase
          .from("attributes")
          .select("id,name,domain,sort_order")
          .order("sort_order", { ascending: true }),
        supabase
          .from("attributes")
          .select("id,name,domain"),
      ];

      let loadedAttributes: AttributeRow[] = [];
      for (const q of attributeQueries) {
        const r = await q;
        if (!r.error) {
          loadedAttributes = (r.data as AttributeRow[]) ?? [];
          break;
        }
        if (!isMissingRelationOrColumn(r.error)) throw r.error;
      }

      /* links */
      const linkQueries = [
        supabase
          .from("evidence_attribute_links")
          .select("evidence_id,attribute_id,student_id"),
        supabase
          .from("evidence_attribute_links")
          .select("evidence_id,attribute_id"),
      ];

      let loadedLinks: EvidenceAttributeLinkRow[] = [];
      for (const q of linkQueries) {
        const r = await q;
        if (!r.error) {
          loadedLinks = (r.data as EvidenceAttributeLinkRow[]) ?? [];
          break;
        }
        if (!isMissingRelationOrColumn(r.error)) throw r.error;
      }

      setKlass(loadedClass);
      setStudents(loadedStudents);
      setEvidence(loadedEvidence);
      setAttributes(loadedAttributes);
      setLinks(loadedLinks);
    }

    if (classId) {
      load().catch((e) => console.error(e));
    }
  }, [classId]);

  const domains = useMemo(() => {
    const vals = Array.from(new Set(attributes.map((a) => safe(a.domain)).filter(Boolean)));
    return ["All domains", ...vals];
  }, [attributes]);

  const filteredStudents = useMemo(() => {
    const q = studentSearch.toLowerCase().trim();
    if (!q) return students;
    return students.filter((s) =>
      studentName(s).toLowerCase().includes(q)
    );
  }, [students, studentSearch]);

  const evidenceSetForFilteredStudents = useMemo(() => {
    const allowedStudentIds = new Set(filteredStudents.map((s) => safe(s.id)));
    return new Set(
      evidence
        .filter((e) => allowedStudentIds.has(safe(e.student_id)))
        .map((e) => safe(e.id))
    );
  }, [evidence, filteredStudents]);

  const filteredAttributes = useMemo(() => {
    if (domainFilter === "All domains") return attributes;
    return attributes.filter((a) => safe(a.domain) === domainFilter);
  }, [attributes, domainFilter]);

  const countsByAttributeId = useMemo(() => {
    const m: Record<string, number> = {};
    links.forEach((l) => {
      if (!evidenceSetForFilteredStudents.has(safe(l.evidence_id))) return;
      const attrId = safe(l.attribute_id);
      if (!attrId) return;
      m[attrId] = (m[attrId] || 0) + 1;
    });
    return m;
  }, [links, evidenceSetForFilteredStudents]);

  const studentCoverage = useMemo(() => {
    const evidenceByStudent: Record<string, number> = {};
    evidence.forEach((e) => {
      const sid = safe(e.student_id);
      if (!sid) return;
      evidenceByStudent[sid] = (evidenceByStudent[sid] || 0) + 1;
    });

    return filteredStudents
      .map((s) => ({
        id: safe(s.id),
        name: studentName(s),
        ilp: !!s.is_ilp,
        evidenceCount: evidenceByStudent[safe(s.id)] || 0,
      }))
      .sort((a, b) => a.evidenceCount - b.evidenceCount || a.name.localeCompare(b.name));
  }, [filteredStudents, evidence]);

  const hotspotAttributes = useMemo(() => {
    return filteredAttributes
      .map((a) => ({
        id: safe(a.id),
        name: safe(a.name) || "Attribute",
        domain: safe(a.domain) || "General",
        count: countsByAttributeId[safe(a.id)] || 0,
      }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 8);
  }, [filteredAttributes, countsByAttributeId]);

  const stats = useMemo(() => {
    const totalStudents = filteredStudents.length;
    const totalEvidence = evidence.filter((e) =>
      filteredStudents.some((s) => safe(s.id) === safe(e.student_id))
    ).length;
    const ilpCount = filteredStudents.filter((s) => s.is_ilp).length;
    const activeAttributes = filteredAttributes.length;

    const studentsWithEvidence = studentCoverage.filter((s) => s.evidenceCount > 0).length;
    const coveragePct =
      totalStudents > 0 ? Math.round((studentsWithEvidence / totalStudents) * 100) : 0;

    return {
      totalStudents,
      totalEvidence,
      ilpCount,
      activeAttributes,
      coveragePct,
    };
  }, [filteredStudents, evidence, studentCoverage, filteredAttributes]);

  return (
    <div style={S.shell}>
      <AdminLeftNav />

      <main style={S.main}>
        <section style={S.hero}>
          <h1 style={S.h1}>{classLabel(klass)} — Class Heatmap</h1>
          <div style={S.sub}>
            Evidence-weighted class view showing which attributes are strongest across the class and where coverage is still thin.
          </div>

          <div style={{ ...S.row, marginTop: 12 }}>
            <span style={S.chip}>Students: {stats.totalStudents}</span>
            <span style={S.chip}>Evidence: {stats.totalEvidence}</span>
            <span style={S.chip}>ILP: {stats.ilpCount}</span>
            <span style={S.chip}>Attributes: {stats.activeAttributes}</span>
            <span style={S.chip}>Coverage: {stats.coveragePct}%</span>
            {safe(klass?.teacher_name) ? <span style={S.chip}>Teacher: {safe(klass?.teacher_name)}</span> : null}
          </div>

          <div style={{ ...S.row, marginTop: 14 }}>
            <button
              style={S.btnGhost}
              onClick={() => router.push(`/admin/classes/${encodeURIComponent(classId)}`)}
            >
              Back to Class Hub
            </button>

            <Link
              href={`/admin/evidence-feed?classId=${encodeURIComponent(classId)}`}
              style={S.btn}
            >
              Open Evidence Feed
            </Link>
          </div>
        </section>

        <div style={S.grid2}>
          <section style={S.card}>
            <div style={S.title}>Heatmap controls</div>

            <div style={S.controls}>
              <select
                style={S.select}
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
              >
                {domains.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <input
                style={S.input}
                placeholder="Search student..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
            </div>

            <div style={S.legend}>
              <div style={S.swatch("#166534")} /> Very strong
              <div style={S.swatch("#16a34a")} /> Strong
              <div style={S.swatch("#22c55e")} /> Developing
              <div style={S.swatch("#facc15")} /> Emerging
              <div style={S.swatch("#f97316")} /> Minimal
              <div style={S.swatch("#1e293b")} /> None
            </div>

            <div style={S.statGrid}>
              <div style={S.statCard}>
                <div style={S.statLabel}>Students</div>
                <div style={S.statValue}>{stats.totalStudents}</div>
              </div>

              <div style={S.statCard}>
                <div style={S.statLabel}>Evidence</div>
                <div style={S.statValue}>{stats.totalEvidence}</div>
              </div>

              <div style={S.statCard}>
                <div style={S.statLabel}>Coverage</div>
                <div style={{ ...S.statValue, color: coverageTone(stats.coveragePct) }}>
                  {stats.coveragePct}%
                </div>
              </div>

              <div style={S.statCard}>
                <div style={S.statLabel}>ILP</div>
                <div style={S.statValue}>{stats.ilpCount}</div>
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <div style={S.title}>Least-covered students</div>
              <div style={S.list}>
                {studentCoverage.slice(0, 8).map((s) => {
                  const pct = Math.min(100, s.evidenceCount * 12);
                  return (
                    <div key={s.id} style={S.item}>
                      <div style={S.itemTitle}>{s.name}</div>
                      <div style={S.itemMeta}>
                        Evidence items: {s.evidenceCount}
                        {s.ilp ? " • ILP" : ""}
                      </div>
                      <div style={S.barBg}>
                        <div
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            background: coverageTone(pct),
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                {studentCoverage.length === 0 ? (
                  <div style={S.empty}>No students found for this filter.</div>
                ) : null}
              </div>
            </div>
          </section>

          <section style={S.card}>
            <div style={S.title}>Class attribute heatmap</div>

            {filteredAttributes.length === 0 ? (
              <div style={S.empty}>No attributes available for this filter.</div>
            ) : (
              <div style={S.heatGrid}>
                {filteredAttributes.map((a) => {
                  const count = countsByAttributeId[safe(a.id)] || 0;
                  return (
                    <div key={safe(a.id) || safe(a.name)} style={S.heatCell(heatColor(count))}>
                      <div style={S.cellName}>{safe(a.name) || "Attribute"}</div>
                      <div style={S.cellMeta}>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", fontWeight: 800 }}>
                          {safe(a.domain) || "General"}
                        </div>
                        <div>
                          <div style={S.cellCount}>{count}</div>
                          <div style={S.cellSmall}>links</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ marginTop: 18 }}>
              <div style={S.title}>Top hotspots</div>
              <div style={S.list}>
                {hotspotAttributes.map((a) => (
                  <div key={a.id || a.name} style={S.item}>
                    <div style={S.itemTitle}>{a.name}</div>
                    <div style={S.itemMeta}>
                      {a.domain} • {a.count} evidence links
                    </div>
                  </div>
                ))}
                {hotspotAttributes.length === 0 ? (
                  <div style={S.empty}>No hotspot data available yet.</div>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}