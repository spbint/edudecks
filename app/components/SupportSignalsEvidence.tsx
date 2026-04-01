"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type EvidenceRow = {
  id: string;
  student_id: string;
  note: string | null;
  occurred_on: string | null;
  created_at: string;
};

type StudentRow = {
  id: string;
  first_name: string | null;
  preferred_name: string | null;
  is_ilp: boolean | null;
  class_id: string | null;
};

type Props = {
  classId?: string; // optional: if provided, filters to students in this class
  limit?: number; // optional: show latest N evidence items
};

function studentName(s: StudentRow | null) {
  if (!s) return "Unnamed student";
  const pref = (s.preferred_name ?? "").trim();
  const first = (s.first_name ?? "").trim();
  return pref || first || "Unnamed student";
}

function parseEvidenceNote(note: string) {
  // Example: "NAPLAN Numeracy (NAP-NUM) — Score: 237 — test"
  const code = note.match(/\(([\w-]+)\)/)?.[1] ?? "UNKNOWN";
  const scoreRaw = note.match(/score:\s*([\d.]+)/i)?.[1];
  const score = scoreRaw ? Number(scoreRaw) : null;
  return { code, score };
}

function getDate(e: EvidenceRow) {
  const d = (e.occurred_on ?? e.created_at ?? "").slice(0, 10);
  return d || "—";
}

/**
 * SupportSignalsEvidence
 * - reads evidence_entries (your current working table)
 * - optionally filters by classId (via students table join in app, not SQL)
 * - provides:
 *   1) "Latest Evidence" list
 *   2) "Signals" quick counts (ILP, missing scores, codes used)
 */
export default function SupportSignalsEvidence({ classId, limit = 20 }: Props) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr("");

      try {
        // 1) students
        const sRes = await supabase
          .from("students")
          .select("id, first_name, preferred_name, is_ilp, class_id")
          .order("preferred_name", { ascending: true })
          .order("first_name", { ascending: true });

        if (sRes.error) {
          setErr(`Load students failed: ${sRes.error.message}`);
          setStudents([]);
          setEvidence([]);
          setLoading(false);
          return;
        }

        const sList = (sRes.data as StudentRow[]) ?? [];
        setStudents(sList);

        // If classId provided, build allowed student ids
        const allowedIds = new Set<string>(
          (classId ? sList.filter((s) => s.class_id === classId) : sList).map((s) => s.id)
        );

        // 2) evidence_entries (filter client-side)
        const eRes = await supabase
          .from("evidence_entries")
          .select("id, student_id, note, occurred_on, created_at")
          .order("occurred_on", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(500);

        if (eRes.error) {
          setErr(`Load evidence failed: ${eRes.error.message}`);
          setEvidence([]);
          setLoading(false);
          return;
        }

        const allEvidence = (eRes.data as EvidenceRow[]) ?? [];
        const filtered = classId ? allEvidence.filter((e) => allowedIds.has(e.student_id)) : allEvidence;

        setEvidence(filtered);
      } catch (e: any) {
        console.error(e);
        setErr(`Support signals loader crashed: ${e?.message ?? String(e)}`);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [classId]);

  const studentById = useMemo(() => {
    const m = new Map<string, StudentRow>();
    for (const s of students) m.set(s.id, s);
    return m;
  }, [students]);

  const latestEvidence = useMemo(() => evidence.slice(0, limit), [evidence, limit]);

  const signals = useMemo(() => {
    let total = evidence.length;
    let missingScore = 0;
    let ilpCount = 0;

    const codeCounts = new Map<string, number>();

    for (const e of evidence) {
      const s = studentById.get(e.student_id) ?? null;
      if (s?.is_ilp) ilpCount += 1;

      const text = (e.note ?? "").trim();
      const { code, score } = parseEvidenceNote(text);

      codeCounts.set(code, (codeCounts.get(code) ?? 0) + 1);

      if (score === null) missingScore += 1;
    }

    const topCodes = Array.from(codeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([code, count]) => ({ code, count }));

    return { total, missingScore, ilpCount, topCodes };
  }, [evidence, studentById]);

  if (loading) {
    return (
      <section style={panel}>
        <div style={{ fontWeight: 900 }}>Support Signals</div>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>Loading evidence entries…</div>
      </section>
    );
  }

  return (
    <section style={panel}>
      <div style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 900 }}>Support Signals (Evidence)</div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
              Based on <code>public.evidence_entries</code>
              {classId ? " (filtered to class)" : ""}.
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <Pill label={`Total evidence: ${signals.total}`} />
            <Pill label={`ILP evidence: ${signals.ilpCount}`} />
            <Pill label={`Missing score: ${signals.missingScore}`} />
          </div>
        </div>

        {!!err && (
          <div style={errorBox}>
            <strong style={{ color: "crimson" }}>Error:</strong>{" "}
            <span style={{ whiteSpace: "pre-wrap" }}>{err}</span>
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Most used instrument codes</div>
          {signals.topCodes.length === 0 ? (
            <div style={{ fontSize: 13, opacity: 0.75 }}>No evidence entries yet.</div>
          ) : (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {signals.topCodes.map((c) => (
                <Pill key={c.code} label={`${c.code}: ${c.count}`} />
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Latest evidence</div>

          {latestEvidence.length === 0 ? (
            <div style={{ fontSize: 13, opacity: 0.75 }}>No evidence yet.</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {latestEvidence.map((e) => {
                const s = studentById.get(e.student_id) ?? null;
                const note = (e.note ?? "").trim();
                const { code, score } = parseEvidenceNote(note);

                return (
                  <div key={e.id} style={rowCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 900 }}>
                        {studentName(s)} {s?.is_ilp ? <span style={tag}>ILP</span> : null}
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>
                        {getDate(e)} • <code>{code}</code>
                        {score !== null ? ` • Score: ${score}` : ""}
                      </div>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 13 }}>{note || "—"}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Pill({ label }: { label: string }) {
  return (
    <span
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid #e6e6e6",
        fontSize: 12,
        fontWeight: 800,
        background: "white",
      }}
    >
      {label}
    </span>
  );
}

const panel: React.CSSProperties = {
  border: "1px solid #e6e6e6",
  borderRadius: 16,
  padding: 16,
  background: "white",
};

const rowCard: React.CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 12,
  padding: 12,
};

const tag: React.CSSProperties = {
  marginLeft: 8,
  padding: "2px 8px",
  borderRadius: 999,
  border: "1px solid #e6e6e6",
  fontSize: 12,
  fontWeight: 900,
  opacity: 0.85,
};

const errorBox: React.CSSProperties = {
  marginTop: 12,
  padding: 10,
  border: "1px solid #f2c1c1",
  borderRadius: 10,
};
