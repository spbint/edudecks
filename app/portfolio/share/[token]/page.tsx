"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type ShareLinkRow = {
  id: string;
  student_id: string;
  share_token: string;
  expires_at?: string | null;
  password?: string | null;
  include_goals?: boolean | null;
  include_reflection?: boolean | null;
  representative_only?: boolean | null;
  created_at?: string | null;
  [k: string]: any;
};

type StudentRow = {
  id: string;
  first_name?: string | null;
  preferred_name?: string | null;
  surname?: string | null;
  family_name?: string | null;
  class_id?: string | null;
  is_ilp?: boolean | null;
  [k: string]: any;
};

type ClassRow = {
  id: string;
  name?: string | null;
  year_level?: number | null;
  teacher_name?: string | null;
  room?: string | null;
  [k: string]: any;
};

type EvidenceRow = {
  id: string;
  student_id?: string | null;
  class_id?: string | null;
  title?: string | null;
  summary?: string | null;
  body?: string | null;
  learning_area?: string | null;
  evidence_type?: string | null;
  occurred_on?: string | null;
  created_at?: string | null;
  visibility?: string | null;
  is_deleted?: boolean | null;
  attachment_url?: string | null;
  file_url?: string | null;
  image_url?: string | null;
  photo_url?: string | null;
  attachment_urls?: string[] | string | null;
  attachments?: any;
  [k: string]: any;
};

type FrameworkMapRow = {
  evidence_id: string;
  framework_code?: string | null;
  framework_name?: string | null;
  framework_item_label?: string | null;
  framework_item_code?: string | null;
  framework_sort_order?: number | null;
  learning_area?: string | null;
  [k: string]: any;
};

type GoalRow = {
  id: string;
  student_id?: string | null;
  text?: string | null;
  done?: boolean | null;
  sort_order?: number | null;
  [k: string]: any;
};

type NotesRow = {
  student_id: string;
  cover_note?: string | null;
  reflection?: string | null;
  [k: string]: any;
};

type EnrichedEvidence = EvidenceRow & {
  derived_group_label: string;
  derived_sort_order: number;
  is_unmapped: boolean;
  attachmentList: string[];
};

function safe(v: any) {
  return String(v ?? "").trim();
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function isMissingRelationOrColumn(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && (msg.includes("relation") || msg.includes("column"));
}

function studentDisplayName(s: StudentRow | null | undefined) {
  if (!s) return "Student";
  const first = safe(s.preferred_name || s.first_name);
  const sur = safe(s.surname || s.family_name);
  return `${first}${sur ? ` ${sur}` : ""}`.trim() || "Student";
}

function fmtYear(y?: number | null) {
  return y == null ? "" : `Year ${y}`;
}

function evidenceDate(e: EvidenceRow) {
  return safe(e.occurred_on) || safe(e.created_at);
}

function isoShort(v?: string | null) {
  if (!v) return "—";
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v).slice(0, 10);
    return d.toISOString().slice(0, 10);
  } catch {
    return String(v).slice(0, 10);
  }
}

function clip(text: string, max = 420) {
  const s = safe(text);
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function parseMaybeJsonArray(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map((x) => safe(x)).filter(Boolean);
  const s = safe(v);
  if (!s) return [];
  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed)) return parsed.map((x) => safe(x)).filter(Boolean);
  } catch {}
  return [s];
}

function getAttachmentList(item: EvidenceRow): string[] {
  return uniqueStrings([
    safe(item.attachment_url),
    safe(item.file_url),
    safe(item.image_url),
    safe(item.photo_url),
    ...parseMaybeJsonArray(item.attachment_urls),
    ...parseMaybeJsonArray(item.attachments),
  ]).filter((x) => /^https?:\/\//i.test(x));
}

function toDate(v?: string | null) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isExpired(expiresAt?: string | null) {
  const d = toDate(expiresAt);
  if (!d) return false;
  return d.getTime() < Date.now();
}

function printPage() {
  window.print();
}

const S = {
  shell: {
    minHeight: "100vh",
    background: "#f6f7fb",
    padding: 24,
  } as React.CSSProperties,

  main: {
    maxWidth: 1120,
    margin: "0 auto",
  } as React.CSSProperties,

  hero: {
    border: "1px solid #e8eaf0",
    borderRadius: 22,
    background: "linear-gradient(135deg, rgba(17,24,39,0.05), rgba(99,102,241,0.08))",
    padding: 20,
  } as React.CSSProperties,

  subtle: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  } as React.CSSProperties,

  h1: {
    fontSize: 34,
    fontWeight: 950,
    margin: 0,
    color: "#0f172a",
    lineHeight: 1.05,
  } as React.CSSProperties,

  sub: {
    marginTop: 8,
    color: "#475569",
    fontWeight: 800,
    fontSize: 13,
    lineHeight: 1.45,
  } as React.CSSProperties,

  card: {
    border: "1px solid #e8eaf0",
    borderRadius: 18,
    background: "#fff",
    marginTop: 14,
  } as React.CSSProperties,

  sectionPad: {
    padding: 16,
  } as React.CSSProperties,

  row: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  } as React.CSSProperties,

  grid4: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 12,
    marginTop: 14,
  } as React.CSSProperties,

  grid2: {
    display: "grid",
    gridTemplateColumns: "1.1fr 1fr",
    gap: 12,
    marginTop: 14,
  } as React.CSSProperties,

  statCard: {
    border: "1px solid #eef2f7",
    borderRadius: 16,
    background: "#fff",
    padding: 14,
  } as React.CSSProperties,

  statK: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  } as React.CSSProperties,

  statV: {
    marginTop: 6,
    fontSize: 28,
    fontWeight: 950,
    color: "#0f172a",
    lineHeight: 1.05,
  } as React.CSSProperties,

  statS: {
    marginTop: 6,
    color: "#475569",
    fontWeight: 800,
    fontSize: 12,
    lineHeight: 1.35,
  } as React.CSSProperties,

  block: {
    border: "1px solid #edf2f7",
    borderRadius: 16,
    background: "#fff",
    padding: 14,
  } as React.CSSProperties,

  blockTitle: {
    fontSize: 18,
    fontWeight: 950,
    color: "#0f172a",
  } as React.CSSProperties,

  blockHelp: {
    marginTop: 6,
    color: "#64748b",
    fontWeight: 800,
    fontSize: 12,
    lineHeight: 1.45,
  } as React.CSSProperties,

  chip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#fff",
    fontSize: 12,
    fontWeight: 900,
    color: "#0f172a",
    whiteSpace: "nowrap",
  } as React.CSSProperties,

  chipMuted: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    fontSize: 12,
    fontWeight: 900,
    color: "#475569",
    whiteSpace: "nowrap",
  } as React.CSSProperties,

  chipAccent: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #c7d2fe",
    background: "#eef2ff",
    fontSize: 12,
    fontWeight: 900,
    color: "#4338ca",
    whiteSpace: "nowrap",
  } as React.CSSProperties,

  chipWarn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #fde68a",
    background: "#fffbeb",
    fontSize: 12,
    fontWeight: 900,
    color: "#92400e",
    whiteSpace: "nowrap",
  } as React.CSSProperties,

  evidenceItem: {
    borderTop: "1px solid #eef2f7",
    paddingTop: 10,
    marginTop: 10,
  } as React.CSSProperties,

  evidenceTitle: {
    fontWeight: 950,
    color: "#0f172a",
    fontSize: 15,
    lineHeight: 1.3,
  } as React.CSSProperties,

  evidenceText: {
    marginTop: 8,
    color: "#334155",
    fontWeight: 800,
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
  } as React.CSSProperties,

  btn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 900,
    cursor: "pointer",
  } as React.CSSProperties,

  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    fontWeight: 800,
    background: "#fff",
    outline: "none",
    color: "#0f172a",
  } as React.CSSProperties,

  info: {
    marginTop: 12,
    borderRadius: 14,
    border: "1px solid #bfdbfe",
    background: "#eff6ff",
    padding: 12,
    color: "#1d4ed8",
    fontWeight: 900,
  } as React.CSSProperties,

  warn: {
    marginTop: 12,
    borderRadius: 14,
    border: "1px solid #fde68a",
    background: "#fffbeb",
    padding: 12,
    color: "#92400e",
    fontWeight: 900,
  } as React.CSSProperties,

  err: {
    marginTop: 12,
    borderRadius: 14,
    border: "1px solid #fecaca",
    background: "#fff1f2",
    padding: 12,
    color: "#9f1239",
    fontWeight: 900,
  } as React.CSSProperties,

  tableWrap: {
    width: "100%",
    overflowX: "auto",
    marginTop: 12,
  } as React.CSSProperties,

  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
  } as React.CSSProperties,

  th: {
    textAlign: "left",
    padding: "10px 10px",
    borderBottom: "1px solid #e5e7eb",
    color: "#64748b",
    fontWeight: 900,
    textTransform: "uppercase",
    fontSize: 11,
    letterSpacing: 0.4,
    whiteSpace: "nowrap",
  } as React.CSSProperties,

  td: {
    padding: "10px 10px",
    borderBottom: "1px solid #eef2f7",
    color: "#0f172a",
    fontWeight: 800,
    verticalAlign: "top",
  } as React.CSSProperties,

  galleryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 10,
    marginTop: 10,
  } as React.CSSProperties,

  galleryItem: {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    background: "#fff",
    padding: 8,
    textDecoration: "none",
  } as React.CSSProperties,

  galleryImg: {
    width: "100%",
    height: 180,
    objectFit: "cover",
    borderRadius: 10,
    display: "block",
  } as React.CSSProperties,
};

export default function SharedPortfolioView() {
  const params = useParams<{ token: string }>();
  const token = safe((params as any)?.token);

  const [busy, setBusy] = useState(true);
  const [locked, setLocked] = useState(false);
  const [enteredPassword, setEnteredPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [err, setErr] = useState<string | null>(null);

  const [share, setShare] = useState<ShareLinkRow | null>(null);
  const [student, setStudent] = useState<StudentRow | null>(null);
  const [klass, setKlass] = useState<ClassRow | null>(null);
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);
  const [frameworkMapRows, setFrameworkMapRows] = useState<FrameworkMapRow[]>([]);
  const [notes, setNotes] = useState<NotesRow | null>(null);
  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [representativeIds, setRepresentativeIds] = useState<Record<string, boolean>>({});

  async function loadShareLink() {
    const r = await supabase
      .from("portfolio_share_links")
      .select("*")
      .eq("share_token", token)
      .maybeSingle();

    if (r.error) throw r.error;
    return (r.data as ShareLinkRow | null) ?? null;
  }

  async function loadStudent(studentId: string) {
    const tries = [
      "id,class_id,first_name,preferred_name,surname,family_name,is_ilp",
      "id,class_id,first_name,preferred_name,surname,is_ilp",
      "id,class_id,first_name,preferred_name,family_name,is_ilp",
      "id,class_id,first_name,preferred_name,is_ilp",
    ];

    for (const sel of tries) {
      const r = await supabase.from("students").select(sel).eq("id", studentId).maybeSingle();
      if (!r.error) return (r.data as StudentRow | null) ?? null;
      if (!isMissingRelationOrColumn(r.error)) throw r.error;
    }
    return null;
  }

  async function loadClass(classId: string | null | undefined) {
    if (!classId) return null;

    const tries = [
      "id,name,year_level,teacher_name,room",
      "id,name,year_level,room",
      "id,name,year_level",
    ];

    for (const sel of tries) {
      const r = await supabase.from("classes").select(sel).eq("id", classId).maybeSingle();
      if (!r.error) return (r.data as ClassRow | null) ?? null;
      if (!isMissingRelationOrColumn(r.error)) throw r.error;
    }
    return null;
  }

  async function loadEvidence(studentId: string) {
    const tries = [
      "id,student_id,class_id,title,summary,body,learning_area,evidence_type,occurred_on,created_at,visibility,is_deleted,attachment_url,file_url,image_url,photo_url,attachment_urls,attachments",
      "id,student_id,class_id,title,summary,body,learning_area,evidence_type,occurred_on,created_at,visibility,is_deleted",
      "id,student_id,class_id,title,summary,body,learning_area,occurred_on,created_at,visibility,is_deleted",
    ];

    for (const sel of tries) {
      const r = await supabase
        .from("evidence_entries")
        .select(sel)
        .eq("student_id", studentId)
        .eq("is_deleted", false)
        .order("occurred_on", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (!r.error) return ((r.data as any[]) ?? []) as EvidenceRow[];
      if (!isMissingRelationOrColumn(r.error)) throw r.error;
    }
    return [];
  }

  async function loadFrameworkMap(studentId: string) {
    const r = await supabase
      .from("v_evidence_framework_map")
      .select(
        "evidence_id,framework_code,framework_name,framework_item_label,framework_item_code,framework_sort_order,learning_area"
      )
      .eq("student_id", studentId);

    if (r.error) {
      if (isMissingRelationOrColumn(r.error)) return [] as FrameworkMapRow[];
      throw r.error;
    }
    return ((r.data as any[]) ?? []) as FrameworkMapRow[];
  }

  async function loadNotes(studentId: string) {
    const r = await supabase
      .from("student_portfolio_notes")
      .select("student_id,cover_note,reflection")
      .eq("student_id", studentId)
      .maybeSingle();

    if (r.error) {
      if (isMissingRelationOrColumn(r.error)) return null;
      throw r.error;
    }
    return (r.data as NotesRow | null) ?? null;
  }

  async function loadGoals(studentId: string) {
    const r = await supabase
      .from("student_goals")
      .select("id,student_id,text,done,sort_order")
      .eq("student_id", studentId)
      .order("sort_order", { ascending: true });

    if (r.error) {
      if (isMissingRelationOrColumn(r.error)) return [] as GoalRow[];
      throw r.error;
    }
    return ((r.data as any[]) ?? []) as GoalRow[];
  }

  async function loadRepresentative(studentId: string) {
    const r = await supabase
      .from("portfolio_representative_samples")
      .select("evidence_id")
      .eq("student_id", studentId);

    if (r.error) {
      if (isMissingRelationOrColumn(r.error)) return {};
      throw r.error;
    }

    const out: Record<string, boolean> = {};
    ((r.data as any[]) ?? []).forEach((row) => {
      out[safe(row.evidence_id)] = true;
    });
    return out;
  }

  async function loadAll() {
    if (!token) return;

    setBusy(true);
    setErr(null);

    try {
      const shareRow = await loadShareLink();

      if (!shareRow) {
        setErr("This shared portfolio link was not found.");
        setBusy(false);
        return;
      }

      if (isExpired(shareRow.expires_at)) {
        setErr("This shared portfolio link has expired.");
        setBusy(false);
        return;
      }

      setShare(shareRow);

      if (safe(shareRow.password)) {
        setLocked(true);
        setBusy(false);
        return;
      }

      await hydratePortfolio(shareRow);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
      setBusy(false);
    }
  }

  async function hydratePortfolio(shareRow: ShareLinkRow) {
    const s = await loadStudent(shareRow.student_id);
    setStudent(s);

    const [k, ev, fm, nt, gl, reps] = await Promise.all([
      loadClass(s?.class_id),
      loadEvidence(shareRow.student_id),
      loadFrameworkMap(shareRow.student_id),
      loadNotes(shareRow.student_id),
      loadGoals(shareRow.student_id),
      loadRepresentative(shareRow.student_id),
    ]);

    setKlass(k);
    setEvidence(ev);
    setFrameworkMapRows(fm);
    setNotes(nt);
    setGoals(gl);
    setRepresentativeIds(reps);
    setBusy(false);
  }

  async function unlockPortfolio() {
    if (!share) return;
    if (enteredPassword === safe(share.password)) {
      setPasswordError("");
      setLocked(false);
      setBusy(true);
      await hydratePortfolio(share);
      return;
    }
    setPasswordError("Incorrect password.");
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const frameworkLookupByEvidenceId = useMemo(() => {
    const out = new Map<string, { label: string; sortOrder: number }>();

    for (const row of frameworkMapRows) {
      const evidenceId = safe(row.evidence_id);
      if (!evidenceId) continue;

      if (!out.has(evidenceId)) {
        out.set(evidenceId, {
          label: safe(row.framework_item_label) || "Unmapped / Incomplete",
          sortOrder: Number(row.framework_sort_order ?? 9999),
        });
      }
    }

    return out;
  }, [frameworkMapRows]);

  const enrichedEvidence = useMemo(() => {
    return evidence.map((item) => {
      const found = frameworkLookupByEvidenceId.get(safe(item.id));
      return {
        ...item,
        derived_group_label: found?.label || safe(item.learning_area) || "Unmapped / Incomplete",
        derived_sort_order: found?.sortOrder ?? 9999,
        is_unmapped: !found && !safe(item.learning_area),
        attachmentList: getAttachmentList(item),
      } as EnrichedEvidence;
    });
  }, [evidence, frameworkLookupByEvidenceId]);

  const visibleEvidence = useMemo(() => {
    if (share?.representative_only) {
      return enrichedEvidence.filter((x) => representativeIds[safe(x.id)]);
    }
    return enrichedEvidence;
  }, [enrichedEvidence, representativeIds, share]);

  const grouped = useMemo(() => {
    const map = new Map<string, EnrichedEvidence[]>();

    for (const item of visibleEvidence) {
      const key = safe(item.derived_group_label) || "Unmapped / Incomplete";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }

    return Array.from(map.entries())
      .map(([label, items]) => ({
        label,
        sortOrder: Math.min(...items.map((x) => x.derived_sort_order || 9999)),
        items: [...items].sort((a, b) => evidenceDate(b).localeCompare(evidenceDate(a))),
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));
  }, [visibleEvidence]);

  const coverageRows = useMemo(() => {
    const map = new Map<string, { count: number; latest: string | null; sortOrder: number }>();

    for (const item of visibleEvidence) {
      const key = safe(item.derived_group_label) || "Unmapped / Incomplete";
      const prev = map.get(key);
      const dt = evidenceDate(item);

      if (!prev) {
        map.set(key, {
          count: 1,
          latest: dt || null,
          sortOrder: item.derived_sort_order || 9999,
        });
      } else {
        map.set(key, {
          count: prev.count + 1,
          latest: safe(dt) > safe(prev.latest) ? dt : prev.latest,
          sortOrder: Math.min(prev.sortOrder, item.derived_sort_order || 9999),
        });
      }
    }

    return Array.from(map.entries())
      .map(([label, value]) => ({
        label,
        count: value.count,
        latest: value.latest,
        sortOrder: value.sortOrder,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder || b.count - a.count || a.label.localeCompare(b.label));
  }, [visibleEvidence]);

  const stats = useMemo(() => {
    const total = visibleEvidence.length;
    const mappedAreas = Array.from(new Set(visibleEvidence.map((x) => safe(x.derived_group_label)).filter(Boolean))).length;
    const withSummary = visibleEvidence.filter((x) => safe(x.summary)).length;
    const attachments = visibleEvidence.reduce((sum, x) => sum + x.attachmentList.length, 0);
    const latest = total ? evidenceDate(visibleEvidence[0]) : null;
    return { total, mappedAreas, withSummary, attachments, latest };
  }, [visibleEvidence]);

  const galleryItems = useMemo(() => {
    const out: Array<{ id: string; url: string; title: string; date: string }> = [];
    for (const item of visibleEvidence) {
      for (const url of item.attachmentList) {
        out.push({
          id: `${safe(item.id)}_${url}`,
          url,
          title: safe(item.title) || "Evidence attachment",
          date: isoShort(evidenceDate(item)),
        });
      }
    }
    return out.slice(0, 12);
  }, [visibleEvidence]);

  return (
    <div style={S.shell}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          a { color: #111827 !important; text-decoration: none !important; }
        }
      `}</style>

      <main style={S.main}>
        <section style={S.hero}>
          <div style={S.subtle}>Shared Student Portfolio</div>
          <h1 style={S.h1}>{studentDisplayName(student)}</h1>
          <div style={S.sub}>
            {klass
              ? `${safe(klass.name) || "Class"}${klass.year_level != null ? ` • ${fmtYear(klass.year_level)}` : ""}`
              : "Shared read-only portfolio"}
            {safe(klass?.teacher_name) ? ` • ${safe(klass.teacher_name)}` : ""}
            {student?.is_ilp ? " • ILP" : ""}
          </div>

          <div style={{ ...S.row, marginTop: 12 }}>
            <span style={S.chip}>Read-only</span>
            <span style={S.chipMuted}>Entries: {stats.total}</span>
            <span style={S.chipMuted}>Areas: {stats.mappedAreas}</span>
            <span style={S.chipMuted}>Latest: {isoShort(stats.latest)}</span>
            {share?.representative_only ? <span style={S.chipAccent}>Representative samples only</span> : null}
            <div style={{ marginLeft: "auto" }} className="no-print">
              <button style={S.btn} onClick={printPage}>
                Print / Save PDF
              </button>
            </div>
          </div>

          {busy ? <div style={S.info}>Loading shared portfolio…</div> : null}
          {err ? <div style={S.err}>{err}</div> : null}
          {share?.expires_at && !err ? (
            <div style={S.warn}>Link expires: {isoShort(share.expires_at)}</div>
          ) : null}
        </section>

        {locked && !err ? (
          <section style={S.card}>
            <div style={S.sectionPad}>
              <div style={S.subtle}>Password Required</div>
              <div style={{ marginTop: 8, fontSize: 18, fontWeight: 950, color: "#0f172a" }}>
                This shared portfolio is protected
              </div>
              <div style={{ marginTop: 8, color: "#475569", fontWeight: 800, lineHeight: 1.5 }}>
                Enter the password to open this portfolio.
              </div>

              <div style={{ marginTop: 12, maxWidth: 420 }}>
                <input
                  style={S.input}
                  type="password"
                  value={enteredPassword}
                  onChange={(e) => setEnteredPassword(e.target.value)}
                  placeholder="Enter password"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") unlockPortfolio();
                  }}
                />
              </div>

              <div style={{ ...S.row, marginTop: 12 }}>
                <button style={S.btn} onClick={unlockPortfolio}>
                  Unlock portfolio
                </button>
              </div>

              {passwordError ? <div style={S.err}>{passwordError}</div> : null}
            </div>
          </section>
        ) : null}

        {!busy && !err && !locked ? (
          <>
            <section style={S.grid4}>
              <div style={S.statCard}>
                <div style={S.statK}>Entries</div>
                <div style={S.statV}>{stats.total}</div>
                <div style={S.statS}>Visible evidence in this shared view.</div>
              </div>

              <div style={S.statCard}>
                <div style={S.statK}>Coverage Areas</div>
                <div style={S.statV}>{stats.mappedAreas}</div>
                <div style={S.statS}>Distinct reporting areas represented.</div>
              </div>

              <div style={S.statCard}>
                <div style={S.statK}>Narrative Items</div>
                <div style={S.statV}>{stats.withSummary}</div>
                <div style={S.statS}>Entries with written summaries attached.</div>
              </div>

              <div style={S.statCard}>
                <div style={S.statK}>Attachments</div>
                <div style={S.statV}>{stats.attachments}</div>
                <div style={S.statS}>File or image links detected in evidence.</div>
              </div>
            </section>

            {safe(notes?.cover_note) ? (
              <section style={S.card}>
                <div style={S.sectionPad}>
                  <div style={S.subtle}>Cover Note</div>
                  <div style={{ marginTop: 8, color: "#334155", fontWeight: 800, lineHeight: 1.6 }}>
                    {safe(notes?.cover_note)}
                  </div>
                </div>
              </section>
            ) : null}

            <section style={S.grid2}>
              <div style={S.block}>
                <div style={S.blockTitle}>Coverage summary</div>
                <div style={S.blockHelp}>
                  Overview of how evidence is distributed across the reporting areas in this shared portfolio.
                </div>

                <div style={S.tableWrap}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={S.th}>Area</th>
                        <th style={S.th}>Entries</th>
                        <th style={S.th}>Latest</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coverageRows.length ? (
                        coverageRows.map((row) => (
                          <tr key={row.label}>
                            <td style={S.td}>{row.label}</td>
                            <td style={S.td}>{row.count}</td>
                            <td style={S.td}>{isoShort(row.latest)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td style={S.td} colSpan={3}>
                            No coverage data available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={S.block}>
                <div style={S.blockTitle}>Portfolio summary</div>
                <div style={S.blockHelp}>
                  This shared page presents a read-only view of the student portfolio for reporting, review, or family sharing.
                </div>

                <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                  <div style={S.chipMuted}>Student: {studentDisplayName(student)}</div>
                  <div style={S.chipMuted}>Class: {safe(klass?.name) || "—"}</div>
                  <div style={S.chipMuted}>Year: {klass?.year_level != null ? fmtYear(klass.year_level) : "—"}</div>
                  <div style={S.chipMuted}>Shared mode: {share?.representative_only ? "Representative samples only" : "Full portfolio"}</div>
                </div>
              </div>
            </section>

            {share?.include_goals && goals.length ? (
              <section style={S.card}>
                <div style={S.sectionPad}>
                  <div style={S.subtle}>Goals</div>
                  <div style={{ marginTop: 8, fontSize: 18, fontWeight: 950, color: "#0f172a" }}>
                    Current learning goals
                  </div>

                  <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                    {goals.map((goal) => (
                      <div key={goal.id} style={S.block}>
                        <div style={{ ...S.row, justifyContent: "space-between" }}>
                          <div style={{ fontWeight: 900, color: "#0f172a" }}>{safe(goal.text) || "Goal"}</div>
                          <span style={goal.done ? S.chipAccent : S.chipMuted}>
                            {goal.done ? "Completed" : "In progress"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ) : null}

            {share?.include_reflection && safe(notes?.reflection) ? (
              <section style={S.card}>
                <div style={S.sectionPad}>
                  <div style={S.subtle}>Reflection</div>
                  <div style={{ marginTop: 8, fontSize: 18, fontWeight: 950, color: "#0f172a" }}>
                    Portfolio reflection
                  </div>
                  <div style={{ marginTop: 8, color: "#334155", fontWeight: 800, lineHeight: 1.6 }}>
                    {safe(notes?.reflection)}
                  </div>
                </div>
              </section>
            ) : null}

            {galleryItems.length ? (
              <section style={S.card}>
                <div style={S.sectionPad}>
                  <div style={S.subtle}>Evidence gallery</div>
                  <div style={{ marginTop: 8, fontSize: 18, fontWeight: 950, color: "#0f172a" }}>
                    Attachments and visual evidence
                  </div>

                  <div style={S.galleryGrid}>
                    {galleryItems.map((item) => (
                      <a
                        key={item.id}
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        style={S.galleryItem}
                      >
                        <img src={item.url} alt={item.title} style={S.galleryImg} />
                        <div style={{ marginTop: 8, fontWeight: 900, color: "#0f172a", lineHeight: 1.35 }}>
                          {item.title}
                        </div>
                        <div style={{ marginTop: 4, color: "#64748b", fontWeight: 800, fontSize: 12 }}>
                          {item.date}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </section>
            ) : null}

            <section style={S.card}>
              <div style={S.sectionPad}>
                <div style={S.subtle}>Evidence Record</div>
                <div style={{ marginTop: 8, fontSize: 18, fontWeight: 950, color: "#0f172a" }}>
                  Shared portfolio evidence
                </div>

                <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
                  {grouped.length ? (
                    grouped.map((group) => (
                      <div key={group.label} style={S.block}>
                        <div style={{ ...S.row, justifyContent: "space-between" }}>
                          <div style={S.blockTitle}>{group.label}</div>
                          <span style={S.chipMuted}>
                            {group.items.length} item{group.items.length === 1 ? "" : "s"}
                          </span>
                        </div>

                        {group.items.map((item) => (
                          <div key={item.id} style={S.evidenceItem}>
                            <div style={{ ...S.row, justifyContent: "space-between" }}>
                              <div style={S.evidenceTitle}>{safe(item.title) || "Evidence entry"}</div>
                              <div style={S.row}>
                                {representativeIds[safe(item.id)] ? (
                                  <span style={S.chipAccent}>Representative sample</span>
                                ) : null}
                                <span style={S.chip}>{isoShort(evidenceDate(item))}</span>
                              </div>
                            </div>

                            <div style={{ ...S.row, marginTop: 8 }}>
                              <span style={S.chipMuted}>{safe(item.learning_area) || "General"}</span>
                              <span style={S.chipMuted}>{safe(item.evidence_type) || "General evidence"}</span>
                              {item.is_unmapped ? <span style={S.chipWarn}>Unmapped</span> : null}
                            </div>

                            {safe(item.summary) ? (
                              <div style={S.evidenceText}>{safe(item.summary)}</div>
                            ) : safe(item.body) ? (
                              <div style={S.evidenceText}>{clip(safe(item.body), 500)}</div>
                            ) : null}

                            {item.attachmentList.length ? (
                              <div style={{ ...S.row, marginTop: 10 }}>
                                {item.attachmentList.slice(0, 3).map((url, idx) => (
                                  <a
                                    key={`${item.id}_${idx}`}
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ textDecoration: "none" }}
                                  >
                                    <span style={S.chipMuted}>Open attachment {idx + 1}</span>
                                  </a>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ))
                  ) : (
                    <div style={S.blockHelp}>No evidence is available in this shared portfolio.</div>
                  )}
                </div>
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}