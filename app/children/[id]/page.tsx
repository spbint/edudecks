"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import {
  listSavedDrafts,
  setActiveDraftId,
  type SavedReportDraft,
} from "@/lib/reporting/reportDraftStorage";

type ChildRow = {
  id: string;
  first_name?: string | null;
  preferred_name?: string | null;
  surname?: string | null;
  family_name?: string | null;
  year_level?: number | null;
  created_at?: string | null;
  [k: string]: any;
};

type EvidenceRow = {
  id: string;
  student_id?: string | null;
  title?: string | null;
  summary?: string | null;
  body?: string | null;
  note?: string | null;
  learning_area?: string | null;
  evidence_type?: string | null;
  occurred_on?: string | null;
  created_at?: string | null;
  is_deleted?: boolean | null;
  [k: string]: any;
};

type CoverageRow = {
  area: string;
  count: number;
};

const ACTIVE_STUDENT_ID_KEY = "edudecks_active_student_id";

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

export default function ChildWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const childId = safe(params?.id);

  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState("");
  const [child, setChild] = useState<ChildRow | null>(null);
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);
  const [savedDrafts, setSavedDrafts] = useState<SavedReportDraft[]>([]);

  async function loadChild() {
    const tries = [
      "id,first_name,preferred_name,surname,family_name,year_level,created_at",
      "id,first_name,preferred_name,surname,year_level,created_at",
      "id,first_name,preferred_name,family_name,year_level,created_at",
      "id,first_name,preferred_name,year_level,created_at",
      "id,first_name,preferred_name,created_at",
      "id,first_name,created_at",
    ];

    for (const sel of tries) {
      const r = await supabase.from("students").select(sel).eq("id", childId).single();
      if (!r.error) return (r.data ?? null) as ChildRow | null;
      if (!isMissingColumnError(r.error)) throw r.error;
    }

    return null;
  }

  async function loadEvidence() {
    const tries = [
      "id,student_id,title,summary,body,note,learning_area,evidence_type,occurred_on,created_at,is_deleted",
      "id,student_id,title,summary,body,note,learning_area,occurred_on,created_at,is_deleted",
      "id,student_id,title,summary,learning_area,occurred_on,created_at,is_deleted",
      "id,student_id,title,occurred_on,created_at,is_deleted",
    ];

    for (const sel of tries) {
      const r = await supabase
        .from("evidence_entries")
        .select(sel)
        .eq("student_id", childId)
        .order("occurred_on", { ascending: false })
        .order("created_at", { ascending: false });

      if (!r.error) {
        return ((r.data ?? []) as EvidenceRow[]).filter((x) => !x.is_deleted);
      }
      if (!isMissingColumnError(r.error)) throw r.error;
    }

    return [];
  }

  async function loadAll() {
    setBusy(true);
    setErr("");

    try {
      if (!childId) {
        setErr("Child ID is missing.");
        setBusy(false);
        return;
      }

      const authResp = await supabase.auth.getUser();
      const userId = authResp.data.user?.id;

      if (!userId) {
        setErr("You must be signed in.");
        setBusy(false);
        return;
      }

      const linkResp = await supabase
        .from("parent_student_links")
        .select("student_id")
        .eq("parent_user_id", userId)
        .eq("student_id", childId)
        .maybeSingle();

      if (linkResp.error && !isMissingRelationOrColumn(linkResp.error)) {
        throw linkResp.error;
      }

      if (!linkResp.data && !linkResp.error) {
        setErr("This child is not linked to your household.");
        setBusy(false);
        return;
      }

      const [childRow, evidenceRows] = await Promise.all([loadChild(), loadEvidence()]);

      setChild(childRow);
      setEvidence(evidenceRows);
      setSavedDrafts(listSavedDrafts().filter((d) => d.studentId === childId));
      localStorage.setItem(ACTIVE_STUDENT_ID_KEY, childId);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId]);

  const name = childDisplayName(child);

  const latestEvidence = evidence[0] || null;
  const latestEvidenceDays = daysSince(latestEvidence?.occurred_on || latestEvidence?.created_at);

  const coverageRows = useMemo<CoverageRow[]>(() => {
    const map = new Map<string, number>();
    evidence.forEach((item) => {
      const area = safe(item.learning_area) || "General";
      map.set(area, (map.get(area) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [evidence]);

  const strongestArea = coverageRows[0]?.area || "General learning";
  const weakestArea =
    coverageRows.length >= 2 ? coverageRows[coverageRows.length - 1]?.area : "a broader spread of evidence";

  const reportReadiness =
    evidence.length >= 8 ? "Strong" : evidence.length >= 4 ? "Growing" : "Early";

  const bestNextMove = useMemo(() => {
    if (!evidence.length) {
      return {
        title: "Capture the first learning moment",
        text: "One useful record is enough to bring this child’s workspace to life and start building the evidence trail.",
        href: "/capture",
        cta: "Open Quick Capture",
      };
    }

    if (!savedDrafts.length) {
      return {
        title: "Shape the first report path",
        text: "There is already enough evidence to start curating a stronger pack and preview how reporting will come together.",
        href: "/reports",
        cta: "Open Reports",
      };
    }

    return {
      title: "Deepen the learning record",
      text: `The strongest evidence is currently around ${strongestArea}. The next opportunity is to strengthen ${weakestArea} or reopen the latest saved report draft.`,
      href: "/portfolio",
      cta: "Open Portfolio",
    };
  }, [evidence.length, savedDrafts.length, strongestArea, weakestArea]);

  const latestDraft = savedDrafts[0] || null;

  return (
    <FamilyTopNavShell
      title="EduDecks Family"
      subtitle="Child Workspace"
      heroTitle={child ? `${name} Workspace` : "Child Workspace"}
      heroText="This is the learner’s home for capture, portfolio, planning, and reports. Use it to see where the record is strongest and what to do next."
      heroAsideTitle="Current signal"
      heroAsideText={
        !evidence.length
          ? "The workspace is ready to begin. One captured learning moment will bring it to life."
          : latestDraft
            ? `A saved report draft already exists for ${name}. You can reopen it or keep deepening the evidence base.`
            : `The record is strongest in ${strongestArea} and would benefit from more depth in ${weakestArea}.`
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
            Child workspace
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#0f172a" }}>
            {child ? name : "Learner"}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/capture" style={buttonStyle(true)}>
            Quick Capture
          </Link>
          <Link href="/portfolio" style={buttonStyle(false)}>
            Portfolio
          </Link>
          <Link href="/planner" style={buttonStyle(false)}>
            Planner
          </Link>
          <Link href="/reports" style={buttonStyle(false)}>
            Reports
          </Link>
        </div>
      </section>

      {busy ? (
        <div style={{ ...cardStyle(), marginBottom: 18 }}>Loading child workspace…</div>
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
              ["Evidence items", String(evidence.length)],
              ["Coverage areas", String(coverageRows.length)],
              ["Saved drafts", String(savedDrafts.length)],
              ["Report readiness", reportReadiness],
            ].map(([label, value]) => (
              <div key={label} style={cardStyle()}>
                <div style={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}>{label}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", marginTop: 4 }}>
                  {value}
                </div>
              </div>
            ))}
          </section>

          <section style={{ ...cardStyle(), marginBottom: 18 }}>
            <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Best next move</div>

            <div
              style={{
                border: "1px solid #dbeafe",
                background: "#eff6ff",
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

                {latestDraft ? (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDraftId(latestDraft.id);
                      router.push(`/reports/output?draft=${encodeURIComponent(latestDraft.id)}`);
                    }}
                    style={buttonStyle(false)}
                  >
                    Open latest draft
                  </button>
                ) : null}
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
              <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>
                Recent evidence
              </div>

              {!evidence.length ? (
                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    padding: 16,
                    background: "#f8fafc",
                    color: "#475569",
                    lineHeight: 1.6,
                    fontWeight: 700,
                  }}
                >
                  No evidence has been captured yet for this learner.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {evidence.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 14,
                        padding: 14,
                        background: "#ffffff",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                          alignItems: "center",
                          flexWrap: "wrap",
                          marginBottom: 6,
                        }}
                      >
                        <div style={{ fontSize: 16, fontWeight: 900, color: "#0f172a" }}>
                          {safe(item.title) || "Untitled evidence"}
                        </div>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <span style={pillStyle("#eff6ff", "#1d4ed8")}>
                            {safe(item.learning_area) || "General"}
                          </span>
                          <span style={pillStyle("#f8fafc", "#475569")}>
                            {shortDate(item.occurred_on || item.created_at)}
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          fontSize: 14,
                          lineHeight: 1.65,
                          color: "#334155",
                        }}
                      >
                        {safe(item.summary || item.note || item.body) || "No summary provided for this evidence item."}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "grid", gap: 18 }}>
              <section style={cardStyle()}>
                <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 10 }}>
                  Coverage snapshot
                </div>

                <div style={{ display: "grid", gap: 10 }}>
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
                    coverageRows.map((row) => (
                      <div
                        key={row.area}
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: 12,
                          padding: 12,
                          background: "#f8fafc",
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
                          <span style={pillStyle("#ecfdf5", "#166534")}>{row.count}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section style={cardStyle()}>
                <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 10 }}>
                  Current status
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  <div
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 12,
                      padding: 12,
                      background: "#ffffff",
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b", marginBottom: 4 }}>
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

                  <div
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 12,
                      padding: 12,
                      background: "#ffffff",
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b", marginBottom: 4 }}>
                      Strongest area
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>
                      {strongestArea}
                    </div>
                  </div>

                  <div
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 12,
                      padding: 12,
                      background: "#ffffff",
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b", marginBottom: 4 }}>
                      Active child
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>
                      {name}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </section>

          <section style={cardStyle()}>
            <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>Fast lanes</div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/capture" style={buttonStyle(true)}>
                Quick Capture
              </Link>
              <Link href="/portfolio" style={buttonStyle(false)}>
                Portfolio
              </Link>
              <Link href="/planner" style={buttonStyle(false)}>
                Planner
              </Link>
              <Link href="/reports" style={buttonStyle(false)}>
                Reports
              </Link>
              <Link href="/children" style={buttonStyle(false)}>
                All children
              </Link>
              <Link href="/authority/readiness" style={buttonStyle(false)}>
                Authority Readiness
              </Link>
            </div>
          </section>
        </>
      )}
    </FamilyTopNavShell>
  );
}