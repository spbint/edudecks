"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type InstrumentRow = {
  id: string;
  instrument_name: string | null;
  instrument_code: string | null;
  domain?: string | null;
  score_type?: string | null;
  is_active?: boolean | null;
};

type ResultRow = {
  id: string;
  student_id: string;
  assessment_instrument_id: string; // ✅ correct FK
  assessed_at?: string | null;
  created_at?: string | null;
  score_numeric?: number | null;
  score_band?: string | null;
  score_stanine?: number | null;
  note_text?: string | null;
};

export default function AssessmentSnapshot({
  studentId,
}: {
  studentId: string;
}) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");
  const [instruments, setInstruments] = useState<InstrumentRow[]>([]);
  const [results, setResults] = useState<ResultRow[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr("");

      // 1) instruments
      const inst = await supabase
        .from("assessment_instruments")
        .select("id, instrument_name, instrument_code, domain, score_type, is_active")
        .order("instrument_name", { ascending: true });

      if (inst.error) {
        setErr(`Load instruments failed: ${inst.error.message}`);
        setInstruments([]);
      } else {
        setInstruments((inst.data as InstrumentRow[]) ?? []);
      }

      // 2) latest results for student (✅ uses assessment_instrument_id, NOT instrument_id)
      const res = await supabase
        .from("assessment_results")
        .select(
          "id, student_id, assessment_instrument_id, assessed_at, created_at, score_numeric, score_band, score_stanine, note_text"
        )
        .eq("student_id", studentId)
        .order("assessed_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(500);

      if (res.error) {
        setErr(`Load results failed: ${res.error.message}`);
        setResults([]);
      } else {
        setResults((res.data as ResultRow[]) ?? []);
      }

      setLoading(false);
    };

    load();
  }, [studentId]);

  const instrumentById = useMemo(() => {
    const m = new Map<string, InstrumentRow>();
    for (const i of instruments) m.set(i.id, i);
    return m;
  }, [instruments]);

  // “Assessment Summary by instrument”: code → latest score → count → last date
  const summary = useMemo(() => {
    const byInst = new Map<
      string,
      { instrumentId: string; count: number; latest: ResultRow | null }
    >();

    for (const r of results) {
      const k = r.assessment_instrument_id;
      const existing = byInst.get(k);
      if (!existing) {
        byInst.set(k, { instrumentId: k, count: 1, latest: r });
      } else {
        existing.count += 1;
        // results already ordered newest-first, so first seen stays latest
      }
    }

    const rows = Array.from(byInst.values()).map((x) => {
      const inst = instrumentById.get(x.instrumentId);
      const code = inst?.instrument_code ?? "—";
      const name = inst?.instrument_name ?? "Unnamed";
      const lastDate = x.latest?.assessed_at ?? x.latest?.created_at ?? null;

      // pick a display score
      const score =
        x.latest?.score_numeric != null
          ? String(x.latest.score_numeric)
          : x.latest?.score_band != null
          ? String(x.latest.score_band)
          : x.latest?.score_stanine != null
          ? `Stanine ${x.latest.score_stanine}`
          : "—";

      return { code, name, score, count: x.count, lastDate };
    });

    // sort by name, then code
    rows.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    return rows;
  }, [results, instrumentById]);

  if (loading) return <div style={{ padding: 12, opacity: 0.75 }}>Loading assessment snapshot…</div>;

  return (
    <section style={panel}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>ASSESSMENT SUMMARY</div>
          <div style={{ fontSize: 18, fontWeight: 900, marginTop: 4 }}>
            By instrument
          </div>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
            Code → latest score → count → last date
          </div>
        </div>
      </div>

      {!!err && (
        <div style={errorBox}>
          <strong style={{ color: "crimson" }}>Error:</strong>{" "}
          <span style={{ whiteSpace: "pre-wrap" }}>{err}</span>
        </div>
      )}

      {summary.length === 0 ? (
        <div style={{ fontSize: 13, opacity: 0.75, marginTop: 10 }}>
          No assessment results found yet for this student.
        </div>
      ) : (
        <div style={{ overflowX: "auto", marginTop: 10 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
            <thead>
              <tr style={{ textAlign: "left", fontSize: 12, opacity: 0.7 }}>
                <th style={{ padding: "8px 6px" }}>Code</th>
                <th style={{ padding: "8px 6px" }}>Instrument</th>
                <th style={{ padding: "8px 6px" }}>Latest</th>
                <th style={{ padding: "8px 6px" }}>Count</th>
                <th style={{ padding: "8px 6px" }}>Last date</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((r) => (
                <tr key={`${r.code}-${r.name}`} style={{ borderTop: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "10px 6px", fontWeight: 900 }}>{r.code}</td>
                  <td style={{ padding: "10px 6px" }}>{r.name}</td>
                  <td style={{ padding: "10px 6px" }}>{r.score}</td>
                  <td style={{ padding: "10px 6px" }}>{r.count}</td>
                  <td style={{ padding: "10px 6px", fontSize: 12, opacity: 0.85 }}>
                    {r.lastDate ? String(r.lastDate).slice(0, 10) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

const panel: React.CSSProperties = {
  border: "1px solid #e6e6e6",
  borderRadius: 16,
  padding: 16,
};

const errorBox: React.CSSProperties = {
  marginTop: 12,
  padding: 10,
  border: "1px solid #f2c1c1",
  borderRadius: 10,
};
