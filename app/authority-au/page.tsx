"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";

const ACTIVE_STUDENT_ID_KEY = "edudecks_active_student_id";

type ChildRow = {
  id: string;
  first_name?: string | null;
  preferred_name?: string | null;
  surname?: string | null;
  family_name?: string | null;
  year_level?: number | null;
  relationship_label?: string | null;
  [k: string]: any;
};

type EvidenceRow = {
  id: string;
  student_id?: string | null;
  learning_area?: string | null;
  evidence_type?: string | null;
  occurred_on?: string | null;
  created_at?: string | null;
  title?: string | null;
  summary?: string | null;
  note?: string | null;
  body?: string | null;
  is_deleted?: boolean | null;
  [k: string]: any;
};

function safe(v: any) {
  return String(v ?? "").trim();
}

function isMissingColumnError(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && msg.includes("column");
}

function isMissingRelationOrColumn(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && (msg.includes("column") || msg.includes("relation"));
}

function childDisplayName(child: ChildRow | null | undefined) {
  if (!child) return "Child";
  const first = safe(child.preferred_name || child.first_name);
  const sur = safe(child.surname || child.family_name);
  return `${first}${sur ? ` ${sur}` : ""}`.trim() || "Child";
}

function shortDate(v: string | null | undefined) {
  const s = safe(v);
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString();
}

function daysSince(v: string | null | undefined) {
  const s = safe(v);
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
}

function cardStyle(): React.CSSProperties {
  return {
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    padding: 20,
    background: "#ffffff",
    boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
  };
}

function buttonStyle(primary = false): React.CSSProperties {
  return {
    padding: "12px 16px",
    borderRadius: 12,
    border: `1px solid ${primary ? "#2563eb" : "#e5e7eb"}`,
    background: primary ? "#2563eb" : "#ffffff",
    color: primary ? "#ffffff" : "#0f172a",
    textDecoration: "none",
    fontWeight: 800,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  };
}

function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    border: "1px solid #d1d5db",
    borderRadius: 12,
    padding: "12px 14px",
    background: "#ffffff",
    fontSize: 14,
    color: "#111827",
    outline: "none",
  };
}

function pillStyle(bg: string, fg: string): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 800,
    background: bg,
    color: fg,
    border: `1px solid ${bg}`,
    whiteSpace: "nowrap",
  };
}

function readinessTone(readiness: "Early" | "Building" | "Strong") {
  if (readiness === "Strong") {
    return {
      pill: pillStyle("#ecfdf5", "#166534"),
      panelBorder: "1px solid #a7f3d0",
      panelBg: "#ecfdf5",
    };
  }
  if (readiness === "Building") {
    return {
      pill: pillStyle("#eff6ff", "#1d4ed8"),
      panelBorder: "1px solid #bfdbfe",
      panelBg: "#eff6ff",
    };
  }
  return {
    pill: pillStyle("#fff7ed", "#9a3412"),
    panelBorder: "1px solid #fed7aa",
    panelBg: "#fff7ed",
  };
}

export default function AuthorityAuPage() {
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState("");
  const [children, setChildren] = useState<ChildRow[]>([]);
  const [activeChildId, setActiveChildId] = useState("");
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);

  async function loadData() {
    setBusy(true);
    setErr("");

    try {
      const authResp = await supabase.auth.getUser();
      const userId = authResp.data.user?.id;

      if (!userId) {
        setChildren([]);
        setEvidence([]);
        setBusy(false);
        return;
      }

      const linksResp = await supabase
        .from("parent_student_links")
        .select("student_id,relationship_label,sort_order,created_at")
        .eq("parent_user_id", userId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (linksResp.error) {
        if (isMissingRelationOrColumn(linksResp.error)) {
          setErr("parent_student_links table is missing. Run the linking SQL first.");
          setBusy(false);
          return;
        }
        throw linksResp.error;
      }

      const links = (linksResp.data ?? []) as Array<{
        student_id: string;
        relationship_label?: string | null;
      }>;

      if (!links.length) {
        setChildren([]);
        setEvidence([]);
        setBusy(false);
        return;
      }

      const ids = links.map((x) => x.student_id).filter(Boolean);

      const studentTries = [
        "id,first_name,preferred_name,surname,family_name,year_level",
        "id,first_name,preferred_name,surname,year_level",
        "id,first_name,preferred_name,family_name,year_level",
        "id,first_name,preferred_name,year_level",
        "id,first_name,preferred_name",
        "id,first_name",
      ];

      let students: ChildRow[] = [];

      for (const sel of studentTries) {
        const r = await supabase.from("students").select(sel).in("id", ids);
        if (!r.error) {
          students = (r.data ?? []) as ChildRow[];
          break;
        }
        if (!isMissingColumnError(r.error)) throw r.error;
      }

      const merged = ids
        .map((id) => {
          const student = students.find((s) => s.id === id);
          const link = links.find((l) => l.student_id === id);
          if (!student) return null;
          return {
            ...student,
            relationship_label: link?.relationship_label ?? null,
          } as ChildRow;
        })
        .filter(Boolean) as ChildRow[];

      const evidenceTries = [
        "id,student_id,learning_area,evidence_type,occurred_on,created_at,title,summary,note,body,is_deleted",
        "id,student_id,learning_area,evidence_type,occurred_on,created_at,title,summary,is_deleted",
        "id,student_id,learning_area,occurred_on,created_at,title,summary,is_deleted",
        "id,student_id,occurred_on,created_at,title,is_deleted",
      ];

      let evidenceRows: EvidenceRow[] = [];

      for (const sel of evidenceTries) {
        const r = await supabase
          .from("evidence_entries")
          .select(sel)
          .in("student_id", ids)
          .order("occurred_on", { ascending: false })
          .order("created_at", { ascending: false });

        if (!r.error) {
          evidenceRows = ((r.data ?? []) as EvidenceRow[]).filter((x) => !x.is_deleted);
          break;
        }
        if (!isMissingColumnError(r.error)) throw r.error;
      }

      setChildren(merged);
      setEvidence(evidenceRows);

      const storedActive = safe(localStorage.getItem(ACTIVE_STUDENT_ID_KEY));
      const usableActive =
        merged.find((c) => c.id === storedActive)?.id || merged[0]?.id || "";

      setActiveChildId(usableActive);
      if (usableActive) localStorage.setItem(ACTIVE_STUDENT_ID_KEY, usableActive);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
      setChildren([]);
      setEvidence([]);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const activeChild = useMemo(
    () => children.find((c) => c.id === activeChildId) || null,
    [children, activeChildId]
  );

  const activeEvidence = useMemo(
    () => evidence.filter((e) => safe(e.student_id) === safe(activeChildId)),
    [evidence, activeChildId]
  );

  const coverageRows = useMemo(() => {
    const map = new Map<string, number>();
    activeEvidence.forEach((item) => {
      const area = safe(item.learning_area) || "General";
      map.set(area, (map.get(area) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count);
  }, [activeEvidence]);

  const evidenceCount = activeEvidence.length;
  const coverage = coverageRows.length;
  const latestEvidence = activeEvidence[0] || null;
  const latestEvidenceDays = daysSince(latestEvidence?.occurred_on || latestEvidence?.created_at);

  const readiness: "Early" | "Building" | "Strong" =
    evidenceCount >= 8 && coverage >= 4
      ? "Strong"
      : evidenceCount >= 4 && coverage >= 2
        ? "Building"
        : "Early";

  const strongestArea = coverageRows[0]?.area || "General learning";
  const weakestArea =
    coverageRows.length >= 2
      ? coverageRows[coverageRows.length - 1]?.area
      : "a broader spread of evidence";

  const tone = readinessTone(readiness);

  const bestNextMove =
    readiness === "Strong"
      ? {
          title: "Move into Australian pack-building or final output",
          text: "The current record appears broad enough to support a calmer AU-facing pathway.",
          href: "/authority/builder",
          cta: "Open Authority Pack Builder",
        }
      : readiness === "Building"
        ? {
            title: "Broaden the record before formal submission",
            text: `The current record is promising, though more depth in ${weakestArea} would make the Australian pathway stronger.`,
            href: "/capture",
            cta: "Capture More Evidence",
          }
        : {
            title: "Grow the learning record first",
            text: "The strongest Australian-ready pathways begin with a wider body of evidence gathered over time.",
            href: "/capture",
            cta: "Open Quick Capture",
          };

  return (
    <FamilyTopNavShell
      title="EduDecks Family"
      subtitle="Authority Hub — Australia"
      heroTitle="Australian authority pathway"
      heroText="This page helps families shape an Australia-focused pathway from evidence to reports and authority pack building. The goal is calm visibility, not pressure."
      heroAsideTitle="AU pathway signal"
      heroAsideText={
        readiness === "Strong"
          ? "The current record looks broad enough to support an Australia-focused compliance pathway."
          : readiness === "Building"
            ? "The record is heading in a useful direction, though more breadth would strengthen the Australian-ready picture."
            : "The AU pathway is available, but the evidence base is still early."
      }
    >
      <section
        style={{
          ...cardStyle(),
          marginBottom: 18,
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>
            Australia Authority Hub
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#0f172a" }}>
            {activeChild ? `AU pathway for ${childDisplayName(activeChild)}` : "Australian pathway"}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/authority" style={buttonStyle(false)}>
            Authority Hub
          </Link>
          <Link href="/authority/readiness" style={buttonStyle(false)}>
            Readiness
          </Link>
          <Link href="/authority/builder" style={buttonStyle(true)}>
            Pack Builder
          </Link>
        </div>
      </section>

      {busy ? (
        <div style={{ ...cardStyle(), marginBottom: 18 }}>Loading Australian authority view…</div>
      ) : err ? (
        <div
          style={{
            ...cardStyle(),
            marginBottom: 18,
            border: "1px solid #fecaca",
            background: "#fff1f2",
            color: "#9f1239",
            fontWeight: 800,
          }}
        >
          {err}
        </div>
      ) : children.length === 0 ? (
        <div style={{ ...cardStyle(), marginBottom: 18 }}>
          <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 10, color: "#0f172a" }}>
            No learners have been added yet
          </div>
          <div style={{ color: "#475569", lineHeight: 1.6, marginBottom: 14 }}>
            Add a child first so EduDecks can shape an Australian authority pathway around a real learner and a real record.
          </div>
          <Link href="/children/new" style={buttonStyle(true)}>
            Add a child
          </Link>
        </div>
      ) : (
        <>
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
              gap: 14,
              marginBottom: 18,
            }}
          >
            {[
              ["Readiness", readiness],
              ["Evidence items", String(evidenceCount)],
              ["Learning areas", String(coverage)],
              ["Jurisdiction", "Australia"],
            ].map(([label, value]) => (
              <div key={label} style={cardStyle()}>
                <div style={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}>{label}</div>
                <div
                  style={{
                    fontSize: label === "Jurisdiction" ? 18 : 28,
                    fontWeight: 900,
                    color: "#0f172a",
                    marginTop: 4,
                    lineHeight: 1.2,
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </section>

          <section style={{ ...cardStyle(), marginBottom: 18 }}>
            <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Best next move</div>

            <div
              style={{
                border: tone.panelBorder,
                background: tone.panelBg,
                borderRadius: 16,
                padding: 16,
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>
                {bestNextMove.title}
              </div>

              <div style={{ marginBottom: 12, color: "#334155", lineHeight: 1.6 }}>
                {bestNextMove.text}
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link href={bestNextMove.href} style={buttonStyle(true)}>
                  {bestNextMove.cta}
                </Link>
                <Link href="/reports/output" style={buttonStyle(false)}>
                  Open Report Output
                </Link>
              </div>
            </div>
          </section>

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.08fr) minmax(320px, 0.92fr)",
              gap: 18,
              marginBottom: 18,
            }}
          >
            <div style={cardStyle()}>
              <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>Australian pathway view</div>

              <div style={{ marginBottom: 14 }}>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#475569",
                    marginBottom: 6,
                    display: "block",
                  }}
                >
                  Learner
                </label>

                <select
                  value={activeChildId}
                  onChange={(e) => {
                    setActiveChildId(e.target.value);
                    localStorage.setItem(ACTIVE_STUDENT_ID_KEY, e.target.value);
                  }}
                  style={inputStyle()}
                >
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {childDisplayName(child)}
                      {child.year_level != null ? ` — Year ${child.year_level}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    padding: 14,
                    background: "#ffffff",
                  }}
                >
                  <div style={{ marginBottom: 8 }}>
                    <span style={tone.pill}>{readiness}</span>
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.6, color: "#334155" }}>
                    {readiness === "Strong"
                      ? "The current learning record has enough breadth to support a more formal Australian-facing pathway."
                      : readiness === "Building"
                        ? "The current record is moving in a useful direction, though it would benefit from a little more spread before final export."
                        : "The Australian pathway is still early. Build more breadth through capture and portfolio first."}
                  </div>
                </div>

                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    padding: 14,
                    background: "#ffffff",
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b", marginBottom: 6 }}>
                    Strongest area
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>
                    {strongestArea}
                  </div>
                </div>

                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    padding: 14,
                    background: "#ffffff",
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b", marginBottom: 6 }}>
                    Most useful next gap
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>
                    {weakestArea}
                  </div>
                </div>

                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    padding: 14,
                    background: "#ffffff",
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b", marginBottom: 6 }}>
                    Latest evidence
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>
                    {latestEvidence
                      ? latestEvidenceDays != null
                        ? `${latestEvidenceDays} day${latestEvidenceDays === 1 ? "" : "s"} ago`
                        : shortDate(latestEvidence.occurred_on || latestEvidence.created_at)
                      : "No evidence yet"}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 18 }}>
              <section style={cardStyle()}>
                <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 10 }}>Coverage snapshot</div>

                {!coverageRows.length ? (
                  <div
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 12,
                      padding: 12,
                      background: "#f8fafc",
                      color: "#475569",
                      fontWeight: 700,
                    }}
                  >
                    Coverage will appear once evidence is captured.
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    {coverageRows.slice(0, 6).map((row) => (
                      <div
                        key={row.area}
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: 12,
                          padding: 12,
                          background: "#ffffff",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 10,
                            alignItems: "center",
                          }}
                        >
                          <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
                            {row.area}
                          </div>
                          <span style={pillStyle("#eff6ff", "#1d4ed8")}>{row.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section style={cardStyle()}>
                <div
                  style={{
                    fontSize: 12,
                    lineHeight: 1.2,
                    fontWeight: 800,
                    letterSpacing: 1.1,
                    textTransform: "uppercase",
                    color: "#64748b",
                    marginBottom: 8,
                  }}
                >
                  A stronger Australian-ready record usually means
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  {[
                    "A broad spread of evidence across learning areas",
                    "A record built over time rather than in a rush",
                    "Portfolio and report work already shaped before export",
                    "A calmer path into formal review or documentation",
                  ].map((item) => (
                    <div
                      key={item}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 12,
                        padding: "12px 14px",
                        background: "#f8fafc",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#334155",
                        lineHeight: 1.5,
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </section>

          <section
            style={{
              ...cardStyle(),
              background:
                "linear-gradient(135deg, rgba(79,124,240,0.06) 0%, rgba(139,124,246,0.06) 100%)",
              border: "1px solid #bfdbfe",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 18,
                    lineHeight: 1.25,
                    fontWeight: 900,
                    color: "#0f172a",
                    marginBottom: 8,
                  }}
                >
                  The strongest AU pathway is capture → portfolio → report → pack
                </div>

                <div
                  style={{
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: "#475569",
                    maxWidth: 760,
                  }}
                >
                  The Australian authority view is strongest when it stays connected to the living family record rather than feeling like a separate process at the end.
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link href="/capture" style={buttonStyle(false)}>
                  Open Quick Capture
                </Link>
                <Link href="/reports" style={buttonStyle(false)}>
                  Open Reports
                </Link>
                <Link href="/authority/builder" style={buttonStyle(true)}>
                  Build Authority Pack
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </FamilyTopNavShell>
  );
}