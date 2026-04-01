"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminLeftNav from "@/app/components/AdminLeftNav";
import { supabase } from "@/lib/supabaseClient";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}
function fmt(d?: string | null) {
  if (!d) return "—";
  const dt = new Date(String(d));
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleString();
}

export default function EvidencePage() {
  const router = useRouter();
  const params = useParams();
  const evidenceId = String((params as any)?.id ?? "");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!isUuid(evidenceId)) {
      setLoading(false);
      setErr(`Invalid evidence id: "${evidenceId}"`);
      return;
    }

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const resp = await supabase.rpc("get_evidence_drawer_view", { p_evidence_id: evidenceId });
        if (resp.error) throw resp.error;
        setData(resp.data);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load evidence.");
      } finally {
        setLoading(false);
      }
    })();
  }, [evidenceId]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f6f7fb" }}>
      <AdminLeftNav />
      <div style={{ flex: 1, padding: 24, maxWidth: 1200 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ color: "#6b7280", fontSize: 12, fontWeight: 900, letterSpacing: 0.6 }}>EVIDENCE</div>
            <div style={{ fontSize: 24, fontWeight: 950, marginTop: 6 }}>{evidenceId.slice(0, 8)}…</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => router.back()} style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb", fontWeight: 900, background: "#fff", cursor: "pointer" }}>
              Back
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ marginTop: 14, padding: 16, borderRadius: 18, border: "1px solid #e8eaf0", background: "#fff", fontWeight: 900 }}>
            Loading…
          </div>
        ) : err ? (
          <div style={{ marginTop: 14, padding: 16, borderRadius: 18, border: "1px solid #fecaca", background: "#fff", fontWeight: 900, color: "#991b1b", whiteSpace: "pre-wrap" }}>
            {err}
          </div>
        ) : (
          <>
            <div style={{ marginTop: 14, padding: 16, borderRadius: 18, border: "1px solid #e8eaf0", background: "#fff" }}>
              <div style={{ fontWeight: 950, fontSize: 18 }}>{data?.evidence?.title || "(Untitled)"}</div>
              <div style={{ marginTop: 6, color: "#6b7280", fontWeight: 850 }}>
                {fmt(data?.evidence?.occurred_on || data?.evidence?.created_at)} • {data?.evidence?.learning_area || "—"}
              </div>
              <div style={{ marginTop: 10, fontWeight: 800, lineHeight: 1.4 }}>
                {data?.evidence?.summary || data?.evidence?.body || "—"}
              </div>
            </div>

            <div style={{ marginTop: 14, padding: 16, borderRadius: 18, border: "1px solid #e8eaf0", background: "#fff" }}>
              <div style={{ color: "#6b7280", fontSize: 12, fontWeight: 900, letterSpacing: 0.6 }}>ATTRIBUTES</div>
              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                {(data?.attributes || []).map((a: any) => (
                  <div key={a.attribute_id} style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 10 }}>
                    <div style={{ fontWeight: 950 }}>{a.name}</div>
                    <div style={{ marginTop: 6, color: "#6b7280", fontWeight: 850 }}>{a.domain} • {a.growth_tempo}</div>
                    <div style={{ marginTop: 6, fontWeight: 800 }}>
                      Strength: {a.strength ?? "—"} • Confidence: {a.confidence ?? "—"}
                    </div>
                    {a.notes ? <div style={{ marginTop: 6, fontWeight: 800, color: "#374151" }}>{a.notes}</div> : null}
                  </div>
                ))}
                {(data?.attributes || []).length === 0 ? (
                  <div style={{ color: "#6b7280", fontWeight: 900, border: "1px dashed #e5e7eb", borderRadius: 18, padding: 14 }}>
                    No contributions linked yet.
                  </div>
                ) : null}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}