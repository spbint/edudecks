"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import AdminLeftNav from "@/app/components/AdminLeftNav";
import { supabase } from "@/lib/supabaseClient";

/* ───────────────────────────── TYPES ───────────────────────────── */

type InterventionRow = {
  id: string;
  student_id: string;
  tier: number | null;
  title: string | null;
  strategy: string | null;
  status: string | null;
  start_date: string | null;
  review_due_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type StudentRow = {
  id: string;
  first_name?: string | null;
  preferred_name?: string | null;
  surname?: string | null;
  family_name?: string | null;
  name?: string | null;
  class_name?: string | null;
  year_level?: number | null;
  class_id?: string | null;
};

type AttributeRow = {
  student_id: string;
  attribute_id: string;
  attribute_code: string;
  attribute_name: string;
  domain: string;
  display_order: number;
  value: number;
  confidence: number;
  trend_velocity: number;
  risk_band: string | null;
  last_updated: string | null;
};

type EvidenceEntryRow = {
  id: string;
  student_id: string;
  class_id?: string | null;
  created_at: string | null;
  occurred_on?: string | null;
  learning_area?: string | null;
  title?: string | null;
  summary?: string | null;
  body?: string | null;
  visibility?: string | null;
  is_deleted?: boolean | null;
};

type SnapshotRow = {
  id: string;
  intervention_id: string;
  student_id: string;
  kind: "baseline" | "review";
  captured_at: string;
  attribute_id: string | null;
  attribute_code: string;
  attribute_name: string | null;
  domain: string | null;
  value: number | null;
  confidence: number | null;
  trend_velocity: number | null;
  risk_band: string | null;
};

/* ───────────────────────────── STYLE ───────────────────────────── */

const shell: React.CSSProperties = { display: "flex", minHeight: "100vh", background: "#f6f7fb" };
const content: React.CSSProperties = { flex: 1, padding: 24, maxWidth: 1400 };

const card: React.CSSProperties = { border: "1px solid #e8eaf0", borderRadius: 18, background: "#fff" };
const subtle: React.CSSProperties = { color: "#6b7280", fontSize: 12, fontWeight: 900, letterSpacing: 0.6 };
const h1: React.CSSProperties = { fontSize: 26, fontWeight: 950, margin: 0, lineHeight: 1.1 };

const btn: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  fontWeight: 900,
  cursor: "pointer",
  background: "#fff",
};
const btnPrimary: React.CSSProperties = { ...btn, background: "#111827", border: "1px solid #111827", color: "#fff" };
const btnDanger: React.CSSProperties = { ...btn, background: "#991b1b", border: "1px solid #991b1b", color: "#fff" };

const input: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  width: "100%",
  fontWeight: 800,
  background: "#fff",
  outline: "none",
};

function pill(text: string, tone: "neutral" | "good" | "warn" = "neutral") {
  const bg = tone === "good" ? "#ecfdf5" : tone === "warn" ? "#fff7ed" : "#f3f4f6";
  const border = tone === "good" ? "#a7f3d0" : tone === "warn" ? "#fed7aa" : "#e5e7eb";
  const color = tone === "good" ? "#065f46" : tone === "warn" ? "#9a3412" : "#111827";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 10px",
        borderRadius: 999,
        border: `1px solid ${border}`,
        background: bg,
        color,
        fontSize: 12,
        fontWeight: 950,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

/* ───────────────────────────── HELPERS ───────────────────────────── */

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function safeStr(v: any) {
  return String(v ?? "").trim();
}

function normCode(v: string) {
  return String(v || "").trim().toLowerCase();
}

function formatDate(d?: string | null) {
  if (!d) return "";
  const dt = new Date(String(d));
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatDateTime(d?: string | null) {
  if (!d) return "";
  const dt = new Date(String(d));
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleString();
}

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysToISO(dateISO: string, days: number) {
  const d = new Date(dateISO + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function evidenceEntryDate(ev: EvidenceEntryRow) {
  return ev.occurred_on || ev.created_at || null;
}

function studentDisplayName(student: StudentRow | null) {
  if (!student) return "Student";
  const first = safeStr(student.preferred_name || student.first_name);
  const last = safeStr(student.surname || student.family_name);
  const full = safeStr(`${first} ${last}`.trim());
  return full || safeStr(student.name) || "Student";
}

function isMissingColumnError(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && msg.includes("column");
}

/* ───────────────────────────── PAGE ───────────────────────────── */

export default function InterventionReviewWizardPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const interventionId = String((params as any)?.id ?? "");
  const badId = !isUuid(interventionId);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [intervention, setIntervention] = useState<InterventionRow | null>(null);
  const [student, setStudent] = useState<StudentRow | null>(null);

  const [attrs, setAttrs] = useState<AttributeRow[]>([]);
  const [evidence, setEvidence] = useState<EvidenceEntryRow[]>([]);
  const [snapshots, setSnapshots] = useState<SnapshotRow[]>([]);

  const [linkedEvidenceIds, setLinkedEvidenceIds] = useState<Set<string>>(new Set());
  const [linkQ, setLinkQ] = useState("");

  const [step, setStep] = useState<number>(Number(searchParams.get("step") || 1));
  const [reviewDue, setReviewDue] = useState<string>(searchParams.get("next") || addDaysToISO(isoToday(), 21));
  const [setStatusTo, setSetStatusTo] = useState<"active" | "closed">("active");

  const [reviewSummary, setReviewSummary] = useState<string>("");
  const [outcomes, setOutcomes] = useState<Record<string, boolean>>({
    improved: false,
    stable: false,
    not_yet: false,
    strategy_changed: false,
    family_contacted: false,
    student_voice: false,
  });

  const [saving, setSaving] = useState(false);

  const studentName = useMemo(() => studentDisplayName(student), [student]);

  const headerMeta = useMemo(() => {
    const parts: string[] = [];
    if (student?.year_level) parts.push(`Year ${student.year_level}`);
    if (student?.class_name) parts.push(student.class_name);
    return parts.join(" • ");
  }, [student]);

  const attrNameByCode = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of attrs) m.set(normCode(a.attribute_code), a.attribute_name);
    return m;
  }, [attrs]);

  const latestReviewAt = useMemo(() => {
    const reviews = snapshots.filter((s) => s.kind === "review").map((s) => s.captured_at);
    if (!reviews.length) return null;
    return reviews.sort((a, b) => (a > b ? -1 : a < b ? 1 : 0))[0];
  }, [snapshots]);

  const baselineRows = useMemo(() => snapshots.filter((s) => s.kind === "baseline"), [snapshots]);

  const latestReviewRows = useMemo(() => {
    if (!latestReviewAt) return [];
    return snapshots.filter((s) => s.kind === "review" && s.captured_at === latestReviewAt);
  }, [snapshots, latestReviewAt]);

  const deltaTop = useMemo(() => {
    const base = new Map<string, SnapshotRow>();
    baselineRows.forEach((r) => base.set(normCode(r.attribute_code), r));

    const rev = new Map<string, SnapshotRow>();
    latestReviewRows.forEach((r) => rev.set(normCode(r.attribute_code), r));

    const items = Array.from(base.entries()).map(([code, b]) => {
      const r = rev.get(code) ?? null;
      const bVal = Number(b.value ?? 0);
      const rVal = Number(r?.value ?? bVal);
      const dVal = rVal - bVal;

      const bConf = Number(b.confidence ?? 0.5);
      const rConf = Number(r?.confidence ?? bConf);
      const dConf = rConf - bConf;

      const bTr = Number(b.trend_velocity ?? 0);
      const rTr = Number(r?.trend_velocity ?? bTr);
      const dTr = rTr - bTr;

      return { code, b, r, dVal, dConf, dTr, abs: Math.abs(dVal) + Math.abs(dConf) + Math.abs(dTr) };
    });

    if (latestReviewAt) {
      items.sort((a, b) => b.abs - a.abs);
      return items.slice(0, 6);
    }

    items.sort((a, b) => Number(a.b.value ?? 0) - Number(b.b.value ?? 0));
    return items.slice(0, 6);
  }, [baselineRows, latestReviewRows, latestReviewAt]);

  function setUrl(next: Record<string, string | null>) {
    const sp = new URLSearchParams(Array.from(searchParams.entries()));
    Object.entries(next).forEach(([k, v]) => {
      if (v === null) sp.delete(k);
      else sp.set(k, v);
    });
    router.replace(`?${sp.toString()}`);
  }

  async function loadStudentRow(studentId: string) {
    const tries = [
      "id,first_name,preferred_name,surname,class_id",
      "id,first_name,preferred_name,family_name,class_id",
      "id,first_name,preferred_name,name,class_id",
      "id,first_name,preferred_name,class_id",
    ];

    for (const sel of tries) {
      const resp = await supabase.from("students").select(sel).eq("id", studentId).single();
      if (!resp.error) return (resp.data ?? null) as StudentRow | null;
      if (!isMissingColumnError(resp.error)) break;
    }
    return null;
  }

  async function loadClassMeta(classId: string | null | undefined) {
    if (!classId) return { class_name: null as string | null, year_level: null as number | null };

    const resp = await supabase.from("classes").select("name,year_level").eq("id", classId).single();
    if (resp.error) return { class_name: null, year_level: null };

    return {
      class_name: (resp.data as any)?.name ?? null,
      year_level: (resp.data as any)?.year_level ?? null,
    };
  }

  async function loadAll() {
    setLoading(true);
    setErr(null);

    try {
      const intResp = await supabase
        .from("interventions")
        .select("id,student_id,tier,title,strategy,status,start_date,review_due_date,end_date,notes,created_at,updated_at")
        .eq("id", interventionId)
        .single();

      if (intResp.error) throw intResp.error;
      const it = intResp.data as InterventionRow;
      setIntervention(it);

      const stu = await loadStudentRow(it.student_id);
      if (stu) {
        const classMeta = await loadClassMeta(stu.class_id);
        setStudent({
          ...stu,
          class_name: classMeta.class_name,
          year_level: classMeta.year_level,
        });
      } else {
        setStudent(null);
      }

      const rpc = await supabase.rpc("get_student_profile_v1", {
        p_student_id: it.student_id,
        p_evidence_limit: 200,
      });

      if (!rpc.error && rpc.data) {
        const payload: any = rpc.data;
        setAttrs((payload.attributes ?? []) as AttributeRow[]);
      } else {
        setAttrs([]);
      }

      const evResp = await supabase
        .from("evidence_entries")
        .select("id,student_id,class_id,created_at,occurred_on,learning_area,title,summary,body,visibility,is_deleted")
        .eq("student_id", it.student_id)
        .eq("is_deleted", false)
        .order("occurred_on", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(200);

      if (!evResp.error) {
        setEvidence((evResp.data ?? []) as EvidenceEntryRow[]);
      } else if (isMissingColumnError(evResp.error)) {
        const evResp2 = await supabase
          .from("evidence_entries")
          .select("id,student_id,class_id,created_at,occurred_on,learning_area,title,summary,body,visibility")
          .eq("student_id", it.student_id)
          .order("occurred_on", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false })
          .limit(200);

        if (evResp2.error) throw evResp2.error;
        setEvidence((evResp2.data ?? []) as EvidenceEntryRow[]);
      } else {
        throw evResp.error;
      }

      const linkResp = await supabase
        .from("intervention_evidence_links")
        .select("evidence_id")
        .eq("intervention_id", interventionId);

      if (!linkResp.error) {
        setLinkedEvidenceIds(new Set((linkResp.data ?? []).map((r: any) => String(r.evidence_id))));
      } else {
        setLinkedEvidenceIds(new Set());
      }

      const snapResp = await supabase
        .from("intervention_attribute_snapshots")
        .select(
          "id,intervention_id,student_id,kind,captured_at,attribute_id,attribute_code,attribute_name,domain,value,confidence,trend_velocity,risk_band"
        )
        .eq("intervention_id", interventionId)
        .order("captured_at", { ascending: false })
        .limit(5000);

      if (!snapResp.error) setSnapshots((snapResp.data ?? []) as SnapshotRow[]);
      else setSnapshots([]);

      const defaultSummary = [
        `Review date: ${formatDate(isoToday())}`,
        ``,
        `What we tried:`,
        `- ${safeStr(it.strategy) || ""}`,
        ``,
        `What we noticed (evidence-based):`,
        `- `,
        ``,
        `Next steps:`,
        `- `,
      ].join("\n");

      setReviewSummary(defaultSummary);
      setReviewDue(it.review_due_date ? String(it.review_due_date).slice(0, 10) : addDaysToISO(isoToday(), 21));
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load intervention.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (badId) {
      setLoading(false);
      setErr(
        `Invalid intervention id in URL: "${interventionId}".\n\nOpen this page with a real UUID from public.interventions.id.\n\nExample:\n/admin/interventions/7de6a899-a57f-4c75-8e13-9e61cae839da`
      );
      return;
    }
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interventionId, badId]);

  async function upsertLinks() {
    const desired = new Set(Array.from(linkedEvidenceIds));

    const curResp = await supabase
      .from("intervention_evidence_links")
      .select("evidence_id")
      .eq("intervention_id", interventionId);

    if (curResp.error) throw curResp.error;

    const current = new Set((curResp.data ?? []).map((r: any) => String(r.evidence_id)));

    const toAdd: string[] = [];
    const toRemove: string[] = [];

    for (const id of desired) if (!current.has(id)) toAdd.push(id);
    for (const id of current) if (!desired.has(id)) toRemove.push(id);

    if (toAdd.length) {
      const rows = toAdd.map((evidence_id) => ({ intervention_id: interventionId, evidence_id }));
      const ins = await supabase.from("intervention_evidence_links").upsert(rows, {
        onConflict: "intervention_id,evidence_id",
      });
      if (ins.error) throw ins.error;
    }

    if (toRemove.length) {
      const del = await supabase
        .from("intervention_evidence_links")
        .delete()
        .eq("intervention_id", interventionId)
        .in("evidence_id", toRemove);
      if (del.error) throw del.error;
    }
  }

  async function createSnapshot(kind: "baseline" | "review") {
    if (!intervention) throw new Error("No intervention loaded.");

    const rows = (attrs ?? []).map((a) => ({
      intervention_id: intervention.id,
      student_id: intervention.student_id,
      kind,
      attribute_id: a.attribute_id ?? null,
      attribute_code: a.attribute_code,
      attribute_name: a.attribute_name ?? null,
      domain: a.domain ?? null,
      value: a.value ?? null,
      confidence: a.confidence ?? null,
      trend_velocity: a.trend_velocity ?? null,
      risk_band: a.risk_band ?? null,
      metadata: {},
    }));

    if (!rows.length) throw new Error("No attributes available to snapshot.");

    if (kind === "baseline") {
      const resp = await supabase
        .from("intervention_attribute_snapshots")
        .upsert(rows, { onConflict: "intervention_id,kind,attribute_code" });
      if (resp.error) throw resp.error;
    } else {
      const chunkSize = 500;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const resp = await supabase.from("intervention_attribute_snapshots").insert(chunk);
        if (resp.error) throw resp.error;
      }
    }
  }

  function outcomeLine() {
    const bits: string[] = [];
    if (outcomes.improved) bits.push("Improved");
    if (outcomes.stable) bits.push("Stable");
    if (outcomes.not_yet) bits.push("Not yet");
    if (outcomes.strategy_changed) bits.push("Strategy adjusted");
    if (outcomes.family_contacted) bits.push("Family contacted");
    if (outcomes.student_voice) bits.push("Student voice included");
    return bits.length ? bits.join(" · ") : "—";
  }

  async function finalizeReview() {
    if (!intervention) return;

    setSaving(true);
    try {
      await upsertLinks();
      await createSnapshot("review");

      const now = new Date().toLocaleString();
      const nextDue = reviewDue || addDaysToISO(isoToday(), 21);

      const block = [
        ``,
        `================ REVIEW =================`,
        `Reviewed: ${now}`,
        `Outcome: ${outcomeLine()}`,
        `Next review due: ${nextDue}`,
        ``,
        reviewSummary.trim(),
        ``,
        `Linked evidence (count): ${linkedEvidenceIds.size}`,
        `========================================`,
        ``,
      ].join("\n");

      const newNotes = safeStr(intervention.notes || "") + block;

      const patch: any = {
        status: setStatusTo,
        review_due_date: nextDue,
        notes: newNotes,
      };

      if (setStatusTo === "closed") patch.end_date = isoToday();

      const up = await supabase.from("interventions").update(patch).eq("id", intervention.id).select("id").single();
      if (up.error) throw up.error;

      await loadAll();

      alert("Review saved: snapshot captured + notes updated.");
      router.push(`/admin/students/${intervention.student_id}?tab=overview`);
    } catch (e: any) {
      alert(`Could not finalize review: ${e?.message ?? "unknown error"}`);
    } finally {
      setSaving(false);
    }
  }

  const evidenceList = useMemo(() => {
    const q = linkQ.trim().toLowerCase();
    const filtered = !q
      ? evidence
      : evidence.filter((ev) =>
          `${ev.title ?? ""} ${ev.summary ?? ""} ${ev.body ?? ""} ${ev.learning_area ?? ""}`.toLowerCase().includes(q)
        );

    return (filtered ?? []).slice(0, 80);
  }, [evidence, linkQ]);

  const hasBaseline = baselineRows.length > 0;
  const hasReview = Boolean(latestReviewAt);

  return (
    <div style={shell}>
      <AdminLeftNav />

      <div style={content}>
        <div
          style={{
            ...card,
            padding: 16,
            borderRadius: 22,
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 300 }}>
            <div style={subtle}>INTERVENTION REVIEW WIZARD</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "baseline", marginTop: 6 }}>
              <h1 style={h1}>{intervention?.title || "Intervention"}</h1>
              {student ? (
                <span style={{ ...subtle, letterSpacing: 0 }}>
                  {studentName}
                  {headerMeta ? ` • ${headerMeta}` : ""}
                </span>
              ) : null}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
              {pill(`Tier ${intervention?.tier ?? "—"}`, "neutral")}
              {pill(`Status: ${(intervention?.status ?? "—").toLowerCase()}`, "neutral")}
              {pill(`Start: ${formatDate(intervention?.start_date) || "—"}`, "neutral")}
              {pill(`Review due: ${formatDate(intervention?.review_due_date) || "—"}`, "neutral")}
              {pill(`Baseline: ${hasBaseline ? "Yes" : "No"}`, hasBaseline ? "good" : "warn")}
              {pill(`Review snap: ${hasReview ? "Yes" : "No"}`, hasReview ? "good" : "neutral")}
              {hasReview ? pill(`Last review: ${formatDateTime(latestReviewAt)}`, "neutral") : null}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button style={btn} type="button" onClick={() => router.back()}>
              Back
            </button>
            {intervention?.student_id ? (
              <button
                style={btn}
                type="button"
                onClick={() => router.push(`/admin/students/${intervention.student_id}?tab=overview`)}
              >
                Student profile
              </button>
            ) : null}
            <button style={btn} type="button" onClick={loadAll} disabled={loading || saving}>
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ ...card, marginTop: 14, padding: 16, borderRadius: 22 }}>
            <div style={subtle}>LOADING</div>
            <div style={{ marginTop: 8, fontWeight: 900 }}>Fetching intervention + snapshots…</div>
          </div>
        ) : err ? (
          <div style={{ ...card, marginTop: 14, padding: 16, borderRadius: 22, borderColor: "#fecaca", whiteSpace: "pre-wrap" }}>
            <div style={{ ...subtle, color: "#991b1b" }}>ERROR</div>
            <div style={{ marginTop: 8, fontWeight: 950 }}>{err}</div>
          </div>
        ) : !intervention ? (
          <div style={{ ...card, marginTop: 14, padding: 16, borderRadius: 22 }}>
            <div style={subtle}>EMPTY</div>
            <div style={{ marginTop: 8, fontWeight: 900 }}>No intervention returned.</div>
          </div>
        ) : (
          <>
            <div
              style={{
                ...card,
                marginTop: 14,
                padding: 12,
                borderRadius: 22,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {[
                { n: 1, label: "1) Baseline & focus" },
                { n: 2, label: "2) Link evidence" },
                { n: 3, label: "3) Review notes" },
                { n: 4, label: "4) Snapshot + save" },
              ].map((s) => (
                <button
                  key={s.n}
                  type="button"
                  style={step === s.n ? btnPrimary : btn}
                  onClick={() => {
                    setStep(s.n);
                    setUrl({ step: String(s.n) });
                  }}
                >
                  {s.label}
                </button>
              ))}
              <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
                {pill(`Linked evidence: ${linkedEvidenceIds.size}`, linkedEvidenceIds.size ? "good" : "warn")}
                {pill(`Attrs loaded: ${attrs.length}`, attrs.length ? "good" : "warn")}
              </div>
            </div>

            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 420px", gap: 14, alignItems: "start" }}>
              <div style={{ ...card, borderRadius: 22, padding: 16 }}>
                {step === 1 ? (
                  <>
                    <div style={subtle}>STEP 1</div>
                    <div style={{ fontWeight: 950, fontSize: 18, marginTop: 6 }}>Baseline & focus check</div>
                    <div style={{ color: "#64748b", fontWeight: 850, marginTop: 8, lineHeight: 1.4 }}>
                      If baseline doesn’t exist, capture it now. Then skim the “Before → After” preview once a review exists.
                    </div>

                    <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        style={btnPrimary}
                        type="button"
                        disabled={saving || attrs.length === 0}
                        onClick={async () => {
                          setSaving(true);
                          try {
                            await createSnapshot("baseline");
                            await loadAll();
                            alert("Baseline captured (or refreshed).");
                          } catch (e: any) {
                            alert(`Baseline failed: ${e?.message ?? "unknown error"}`);
                          } finally {
                            setSaving(false);
                          }
                        }}
                      >
                        Capture baseline
                      </button>

                      <button
                        style={btn}
                        type="button"
                        disabled={saving || attrs.length === 0}
                        onClick={async () => {
                          setSaving(true);
                          try {
                            await createSnapshot("review");
                            await loadAll();
                            alert("Review snapshot captured.");
                          } catch (e: any) {
                            alert(`Review snapshot failed: ${e?.message ?? "unknown error"}`);
                          } finally {
                            setSaving(false);
                          }
                        }}
                        title="For testing only; normally use Step 4"
                      >
                        Capture review (test)
                      </button>
                    </div>

                    <div style={{ marginTop: 14, border: "1px solid #e5e7eb", borderRadius: 18, padding: 12, background: "#fbfbfd" }}>
                      <div style={subtle}>DELTA PREVIEW</div>

                      {!hasBaseline ? (
                        <div style={{ marginTop: 8, color: "#6b7280", fontWeight: 900 }}>
                          No baseline yet. Capture baseline to enable true delta reporting.
                        </div>
                      ) : !hasReview ? (
                        <div style={{ marginTop: 8, color: "#6b7280", fontWeight: 900 }}>
                          Baseline exists. Complete this wizard to create the <strong>review snapshot</strong> (the “after”).
                        </div>
                      ) : (
                        <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                          {deltaTop.map((x) => {
                            const name = attrNameByCode.get(x.code) ?? x.b.attribute_name ?? x.code;
                            const tone =
                              x.dVal > 0.02 || x.dConf > 0.05 || x.dTr > 0.02
                                ? "good"
                                : x.dVal < -0.02 || x.dConf < -0.05 || x.dTr < -0.02
                                ? "warn"
                                : "neutral";

                            return (
                              <div key={x.code} style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 10, background: "#fff" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                                  <div style={{ fontWeight: 950 }}>{name}</div>
                                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    {pill(`Δ value: ${x.dVal >= 0 ? "+" : ""}${x.dVal.toFixed(2)}`, tone as any)}
                                    {pill(`Δ conf: ${x.dConf >= 0 ? "+" : ""}${Math.round(x.dConf * 100)}%`, tone as any)}
                                    {pill(`Δ trend: ${x.dTr >= 0 ? "+" : ""}${x.dTr.toFixed(2)}`, tone as any)}
                                  </div>
                                </div>
                                <div style={{ marginTop: 6, color: "#475569", fontWeight: 850, fontSize: 12 }}>
                                  Baseline {Number(x.b.value ?? 0)} → Review {Number(x.r?.value ?? x.b.value ?? 0)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 10 }}>
                      <button style={btnPrimary} type="button" onClick={() => setStep(2)}>
                        Next →
                      </button>
                    </div>
                  </>
                ) : step === 2 ? (
                  <>
                    <div style={subtle}>STEP 2</div>
                    <div style={{ fontWeight: 950, fontSize: 18, marginTop: 6 }}>Link evidence to this intervention</div>
                    <div style={{ color: "#64748b", fontWeight: 850, marginTop: 8, lineHeight: 1.4 }}>
                      Tick evidence that best supports the review decision. These links are saved when you finalize.
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <input style={input} placeholder="Search evidence…" value={linkQ} onChange={(e) => setLinkQ(e.target.value)} />
                    </div>

                    <div style={{ marginTop: 12, maxHeight: 520, overflow: "auto", paddingRight: 6, display: "grid", gap: 8 }}>
                      {evidenceList.map((ev) => {
                        const checked = linkedEvidenceIds.has(ev.id);
                        return (
                          <label
                            key={ev.id}
                            style={{
                              display: "flex",
                              gap: 10,
                              alignItems: "flex-start",
                              padding: 12,
                              borderRadius: 16,
                              border: `1px solid ${checked ? "#c7d2fe" : "#e5e7eb"}`,
                              background: checked ? "#eef2ff" : "#fff",
                              cursor: "pointer",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setLinkedEvidenceIds((cur) => {
                                  const next = new Set(Array.from(cur));
                                  if (next.has(ev.id)) next.delete(ev.id);
                                  else next.add(ev.id);
                                  return next;
                                });
                              }}
                              disabled={saving}
                              style={{ marginTop: 3 }}
                            />

                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 950, lineHeight: 1.15 }}>{ev.title || ev.summary || "(Untitled evidence entry)"}</div>

                              <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {pill(formatDate(evidenceEntryDate(ev)) || "—", "neutral")}
                                {pill(ev.learning_area || "General", "neutral")}
                                {pill(`Visibility: ${ev.visibility || "staff"}`, "neutral")}
                              </div>

                              {ev.summary ? (
                                <div style={{ marginTop: 6, color: "#374151", fontWeight: 800, lineHeight: 1.35 }}>
                                  {String(ev.summary).slice(0, 160)}
                                  {String(ev.summary).length > 160 ? "…" : ""}
                                </div>
                              ) : null}

                              {ev.body ? (
                                <div style={{ marginTop: 6, color: "#6b7280", fontWeight: 800, lineHeight: 1.35 }}>
                                  {String(ev.body).slice(0, 160)}
                                  {String(ev.body).length > 160 ? "…" : ""}
                                </div>
                              ) : null}
                            </div>
                          </label>
                        );
                      })}

                      {!evidenceList.length ? (
                        <div style={{ color: "#6b7280", fontWeight: 900, border: "1px dashed #e5e7eb", borderRadius: 18, padding: 14 }}>
                          No evidence entries found.
                        </div>
                      ) : null}
                    </div>

                    <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <button style={btn} type="button" onClick={() => setStep(1)}>
                        ← Back
                      </button>
                      <button style={btnPrimary} type="button" onClick={() => setStep(3)}>
                        Next →
                      </button>
                    </div>
                  </>
                ) : step === 3 ? (
                  <>
                    <div style={subtle}>STEP 3</div>
                    <div style={{ fontWeight: 950, fontSize: 18, marginTop: 6 }}>Review notes + outcomes</div>

                    <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {[
                        ["improved", "Improved"],
                        ["stable", "Stable"],
                        ["not_yet", "Not yet / needs more time"],
                        ["strategy_changed", "Strategy adjusted"],
                        ["family_contacted", "Family contacted"],
                        ["student_voice", "Student voice included"],
                      ].map(([k, label]) => (
                        <label
                          key={k}
                          style={{
                            display: "flex",
                            gap: 10,
                            alignItems: "center",
                            padding: 12,
                            borderRadius: 16,
                            border: `1px solid ${outcomes[k] ? "#a7f3d0" : "#e5e7eb"}`,
                            background: outcomes[k] ? "#ecfdf5" : "#fff",
                            cursor: "pointer",
                            fontWeight: 900,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={!!outcomes[k]}
                            onChange={() => setOutcomes((cur) => ({ ...cur, [k]: !cur[k] }))}
                            disabled={saving}
                          />
                          {label}
                        </label>
                      ))}
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <div style={subtle}>REVIEW SUMMARY</div>
                      <textarea
                        value={reviewSummary}
                        onChange={(e) => setReviewSummary(e.target.value)}
                        style={{ ...input, marginTop: 8, minHeight: 220, fontWeight: 800, lineHeight: 1.35, whiteSpace: "pre-wrap" }}
                        placeholder="Write a brief, evidence-based review…"
                      />
                    </div>

                    <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <button style={btn} type="button" onClick={() => setStep(2)}>
                        ← Back
                      </button>
                      <button style={btnPrimary} type="button" onClick={() => setStep(4)}>
                        Next →
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={subtle}>STEP 4</div>
                    <div style={{ fontWeight: 950, fontSize: 18, marginTop: 6 }}>Snapshot + finalize</div>
                    <div style={{ color: "#64748b", fontWeight: 850, marginTop: 8, lineHeight: 1.4 }}>
                      This will: <strong>save evidence links</strong>, <strong>capture a review snapshot</strong>, append a clean review block to notes, and set the next review date.
                    </div>

                    <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <div style={subtle}>NEXT REVIEW DUE</div>
                        <input
                          type="date"
                          value={reviewDue}
                          onChange={(e) => {
                            setReviewDue(e.target.value);
                            setUrl({ next: e.target.value });
                          }}
                          style={{ ...input, marginTop: 8, fontWeight: 900 }}
                          disabled={saving}
                        />
                        <div style={{ marginTop: 8, color: "#6b7280", fontWeight: 850, fontSize: 12 }}>
                          Default is +21 days (change if needed).
                        </div>
                      </div>

                      <div>
                        <div style={subtle}>SET STATUS TO</div>
                        <select
                          value={setStatusTo}
                          onChange={(e) => setSetStatusTo(e.target.value as any)}
                          style={{ ...input, marginTop: 8, fontWeight: 900 }}
                          disabled={saving}
                        >
                          <option value="active">active (continue support)</option>
                          <option value="closed">closed (end intervention)</option>
                        </select>

                        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {pill(
                            `Outcome: ${outcomeLine()}`,
                            outcomes.improved || outcomes.stable ? "good" : outcomes.not_yet ? "warn" : "neutral"
                          )}
                          {pill(`Evidence linked: ${linkedEvidenceIds.size}`, linkedEvidenceIds.size ? "good" : "warn")}
                          {pill(`Baseline: ${hasBaseline ? "Yes" : "No"}`, hasBaseline ? "good" : "warn")}
                        </div>
                      </div>
                    </div>

                    {!hasBaseline ? (
                      <div style={{ marginTop: 12, border: "1px solid #fed7aa", background: "#fff7ed", borderRadius: 18, padding: 12 }}>
                        <div style={{ fontWeight: 950, color: "#9a3412" }}>Baseline missing</div>
                        <div style={{ marginTop: 6, color: "#9a3412", fontWeight: 850 }}>
                          Capture baseline first (Step 1) so the delta is meaningful.
                        </div>
                      </div>
                    ) : null}

                    <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <button style={btn} type="button" onClick={() => setStep(3)} disabled={saving}>
                        ← Back
                      </button>
                      <button style={btnPrimary} type="button" onClick={finalizeReview} disabled={saving || !hasBaseline}>
                        {saving ? "Saving…" : "Finalize review (snapshot + save)"}
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div style={{ display: "grid", gap: 14 }}>
                <div style={{ ...card, borderRadius: 22, padding: 16 }}>
                  <div style={subtle}>QUICK CONTEXT</div>
                  <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                    <div style={{ fontWeight: 950 }}>{studentName}</div>
                    {headerMeta ? <div style={{ color: "#6b7280", fontWeight: 850 }}>{headerMeta}</div> : null}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {pill(`Intervention: ${interventionId.slice(0, 8)}…`, "neutral")}
                      {pill(`Created: ${formatDate(intervention.created_at) || "—"}`, "neutral")}
                    </div>
                  </div>

                  <div style={{ marginTop: 12, borderTop: "1px solid #e5e7eb", paddingTop: 12 }}>
                    <div style={subtle}>STRATEGY</div>
                    <div style={{ marginTop: 8, color: "#0f172a", fontWeight: 850, lineHeight: 1.35, whiteSpace: "pre-wrap" }}>
                      {intervention.strategy || <span style={{ color: "#6b7280" }}>No strategy set.</span>}
                    </div>
                  </div>

                  <div style={{ marginTop: 12, borderTop: "1px solid #e5e7eb", paddingTop: 12 }}>
                    <div style={subtle}>SNAPSHOT STATUS</div>
                    <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                      {pill(`Baseline rows: ${baselineRows.length}`, baselineRows.length ? "good" : "warn")}
                      {pill(`Review rows: ${snapshots.filter((s) => s.kind === "review").length}`, hasReview ? "good" : "neutral")}
                      {hasReview ? pill(`Latest review: ${formatDateTime(latestReviewAt)}`, "neutral") : null}
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 12,
                      borderTop: "1px solid #e5e7eb",
                      paddingTop: 12,
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="button"
                      style={btn}
                      disabled={saving}
                      onClick={async () => {
                        setSaving(true);
                        try {
                          await createSnapshot("baseline");
                          await loadAll();
                          alert("Baseline captured.");
                        } catch (e: any) {
                          alert(`Baseline failed: ${e?.message ?? "unknown error"}`);
                        } finally {
                          setSaving(false);
                        }
                      }}
                    >
                      Capture baseline
                    </button>

                    <button
                      type="button"
                      style={btn}
                      disabled={saving}
                      onClick={async () => {
                        setSaving(true);
                        try {
                          await loadAll();
                          alert("Reloaded.");
                        } finally {
                          setSaving(false);
                        }
                      }}
                    >
                      Reload
                    </button>

                    <button
                      type="button"
                      style={btnDanger}
                      disabled={saving}
                      onClick={async () => {
                        if (!confirm("Close this intervention now? (Sets status=closed and end_date=today)")) return;
                        setSaving(true);
                        try {
                          const up = await supabase
                            .from("interventions")
                            .update({ status: "closed", end_date: isoToday() })
                            .eq("id", interventionId)
                            .select("id")
                            .single();
                          if (up.error) throw up.error;
                          await loadAll();
                          alert("Closed.");
                        } catch (e: any) {
                          alert(`Close failed: ${e?.message ?? "unknown error"}`);
                        } finally {
                          setSaving(false);
                        }
                      }}
                    >
                      Close now
                    </button>
                  </div>
                </div>

                <div style={{ ...card, borderRadius: 22, padding: 16 }}>
                  <div style={subtle}>LINKED EVIDENCE (PREVIEW)</div>
                  <div style={{ marginTop: 10, display: "grid", gap: 8, maxHeight: 240, overflow: "auto", paddingRight: 6 }}>
                    {Array.from(linkedEvidenceIds)
                      .slice(0, 20)
                      .map((id) => {
                        const ev = evidence.find((x) => x.id === id);
                        return (
                          <div key={id} style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 10 }}>
                            <div style={{ fontWeight: 950 }}>{ev?.title || ev?.summary || `Evidence ${id.slice(0, 8)}…`}</div>
                            <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
                              {pill(formatDate(evidenceEntryDate(ev as EvidenceEntryRow)) || "—", "neutral")}
                              {pill(ev?.learning_area || "General", "neutral")}
                            </div>
                          </div>
                        );
                      })}

                    {linkedEvidenceIds.size === 0 ? (
                      <div style={{ color: "#6b7280", fontWeight: 900, border: "1px dashed #e5e7eb", borderRadius: 18, padding: 14 }}>
                        None linked yet (Step 2).
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}