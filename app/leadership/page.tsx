"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type TrendPoint = { period_start: string; value: number };

type BenchmarkStatus = "above" | "on_track" | "below" | "no_target" | "no_data";

type BenchmarkItem = {
  actual: number | null;
  target: number | null;
  status: BenchmarkStatus;
};

type Dashboard = {
  kpis: {
    students_total: number;
    evidence_7d_total: number;
    evidence_30d_total: number;
    evidence_30d_delta: number;
    evidence_90d_total: number;
    evidence_90d_delta: number;

    interventions_active: number;
    interventions_created_30d: number;
    interventions_created_30d_delta: number;
    interventions_created_90d: number;
    interventions_created_90d_delta: number;

    reviews_overdue: number;
    classes_at_risk: number;
    on_time_review_rate: number | null;
  };
  benchmarks: {
    evidence_30d_per_student: BenchmarkItem;
    reviews_overdue_max: BenchmarkItem;
    on_time_review_rate_min: BenchmarkItem;
  };
  trends: {
    evidence_monthly: TrendPoint[];
    interventions_created_monthly: TrendPoint[];
  };
  class_risk: Array<{
    class_id: string;
    class_name: string;
    students: number;
    evidence_30d: number;
    reviews_due: number;
  }>;
};

export default function SchoolLeadershipPage() {
  const router = useRouter();

  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string>("");

  const [creatingFor, setCreatingFor] = useState<string>(""); // class_id
  const [toast, setToast] = useState<string>("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErrMsg("");

      const { data, error } = await supabase.rpc("get_school_leadership_dashboard");

      if (error) {
        const e: any = error;
        console.log("Leadership RPC error raw:", e);
        setErrMsg(
          e?.message || e?.details || e?.hint || "Failed to load leadership dashboard."
        );
        setData(null);
        setLoading(false);
        return;
      }

      setData(data as Dashboard);
      setLoading(false);
    })();
  }, []);

  const evidenceTrend = useMemo(() => data?.trends?.evidence_monthly || [], [data]);
  const interventionsTrend = useMemo(
    () => data?.trends?.interventions_created_monthly || [],
    [data]
  );

  async function createIntervention(classId: string, className: string) {
    setCreatingFor(classId);
    setToast("");

    // optional defaults — tweak anytime
    const title = `Leadership intervention · ${className}`;
    const reviewDays = 21;

    const { data: newId, error } = await supabase.rpc("create_class_intervention", {
      p_class_id: classId,
      p_title: title,
      p_review_days: reviewDays,
    });

    if (error) {
      const e: any = error;
      console.log("create_class_intervention error:", e);
      setToast(e?.message || e?.details || "Failed to create intervention.");
      setCreatingFor("");
      return;
    }

    const interventionId = String(newId);
    setToast("Created. Opening…");

    // ✅ deep-link open
    router.push(`/classes/${classId}/interventions?open=${interventionId}`);
  }

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;

  if (errMsg) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 12, color: "#777", fontWeight: 900 }}>
          LEADERSHIP · SCHOOL
        </div>
        <h1>School Overview</h1>
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            border: "1px solid #f5c2c7",
            background: "#fff5f5",
            color: "#7f1d1d",
            fontWeight: 800,
          }}
        >
          Error loading leadership dashboard: {errMsg}
        </div>
      </div>
    );
  }

  if (!data) return <div style={{ padding: 24 }}>No data.</div>;

  const k = data.kpis;
  const b = data.benchmarks;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ fontSize: 12, color: "#777", fontWeight: 900 }}>
        LEADERSHIP · SCHOOL
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: "6px 0 0 0" }}>School Overview</h1>

        <a
          href="/api/leadership/pdf"
          style={{
            display: "inline-block",
            padding: "10px 14px",
            background: "#111",
            color: "#fff",
            borderRadius: 10,
            fontWeight: 900,
            textDecoration: "none",
            marginLeft: "auto",
          }}
        >
          Export PDF
        </a>
      </div>

      {toast && (
        <div style={{ marginTop: 10, fontWeight: 900, color: "#0a7" }}>
          {toast}
        </div>
      )}

      {/* Benchmarks row */}
      <h3 style={{ marginTop: 18, marginBottom: 10 }}>Benchmarks</h3>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <BenchmarkCard
          title="Evidence per student (30d)"
          actual={b.evidence_30d_per_student.actual}
          target={b.evidence_30d_per_student.target}
          status={b.evidence_30d_per_student.status}
          format={(v) => (v == null ? "—" : v.toFixed(2))}
        />
        <BenchmarkCard
          title="Reviews overdue (max)"
          actual={b.reviews_overdue_max.actual}
          target={b.reviews_overdue_max.target}
          status={b.reviews_overdue_max.status}
          format={(v) => (v == null ? "—" : String(v))}
        />
        <BenchmarkCard
          title="On-time review rate (%)"
          actual={b.on_time_review_rate_min.actual}
          target={b.on_time_review_rate_min.target}
          status={b.on_time_review_rate_min.status}
          format={(v) => (v == null ? "—" : `${v}%`)}
        />
      </div>

      {/* Core KPIs */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
        <Stat label="Students" value={k.students_total} />
        <Stat label="Evidence (7d)" value={k.evidence_7d_total} />
        <Stat label="Evidence (30d)" value={k.evidence_30d_total} />
        <Stat label="Evidence (90d)" value={k.evidence_90d_total} />
        <Stat label="Active Interventions" value={k.interventions_active} />
        <Stat label="Reviews Overdue" value={k.reviews_overdue} />
        <Stat
          label="On-Time Review Rate"
          value={k.on_time_review_rate == null ? "—" : `${k.on_time_review_rate}%`}
        />
        <Stat label="Classes at Risk" value={k.classes_at_risk} />
      </div>

      {/* Trends */}
      <h3 style={{ marginTop: 24, marginBottom: 10 }}>Trends (30/90 day deltas)</h3>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <TrendStat
          label="Evidence Δ (30d vs prev 30d)"
          delta={k.evidence_30d_delta}
          points={evidenceTrend}
        />
        <TrendStat
          label="Evidence Δ (90d vs prev 90d)"
          delta={k.evidence_90d_delta}
          points={evidenceTrend}
        />
        <TrendStat
          label="Interventions Created Δ (30d)"
          delta={k.interventions_created_30d_delta}
          points={interventionsTrend}
        />
        <TrendStat
          label="Interventions Created Δ (90d)"
          delta={k.interventions_created_90d_delta}
          points={interventionsTrend}
        />
      </div>

      {/* Classes */}
      <h3 style={{ marginTop: 24 }}>Classes Needing Attention</h3>
      <table width="100%" cellPadding={8} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #eee" }}>
            <th align="left">Class</th>
            <th>Students</th>
            <th>Evidence (30d)</th>
            <th>Reviews Due</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {data.class_risk.map((c) => {
            const busy = creatingFor === c.class_id;

            return (
              <tr key={c.class_id} style={{ borderBottom: "1px solid #f2f2f2" }}>
                <td>
                  <Link href={`/classes/${c.class_id}/leadership`}>{c.class_name}</Link>
                </td>
                <td align="center">{c.students}</td>
                <td align="center">{c.evidence_30d}</td>
                <td align="center">{c.reviews_due}</td>
                <td align="right">
                  <button
                    onClick={() => createIntervention(c.class_id, c.class_name)}
                    disabled={busy}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid #111",
                      background: busy ? "#f3f4f6" : "#111",
                      color: busy ? "#666" : "#fff",
                      fontWeight: 900,
                      cursor: busy ? "not-allowed" : "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {busy ? "Creating…" : "Create Intervention"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 14, padding: 14, minWidth: 190, background: "#fff" }}>
      <div style={{ fontSize: 12, color: "#777", fontWeight: 900 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 900 }}>{value}</div>
    </div>
  );
}

function Badge({ status }: { status: BenchmarkStatus }) {
  const map: Record<BenchmarkStatus, { text: string; bg: string; border: string; color: string }> = {
    above: { text: "Above target", bg: "#ecfdf5", border: "#bbf7d0", color: "#14532d" },
    on_track: { text: "On track", bg: "#eff6ff", border: "#bfdbfe", color: "#1e3a8a" },
    below: { text: "Below target", bg: "#fff5f5", border: "#fecaca", color: "#7f1d1d" },
    no_target: { text: "No target", bg: "#f7f7f7", border: "#e5e7eb", color: "#444" },
    no_data: { text: "No data", bg: "#f7f7f7", border: "#e5e7eb", color: "#444" },
  };

  const s = map[status];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "6px 10px",
        borderRadius: 999,
        border: `1px solid ${s.border}`,
        background: s.bg,
        color: s.color,
        fontWeight: 900,
        fontSize: 12,
        whiteSpace: "nowrap",
      }}
    >
      {s.text}
    </span>
  );
}

function BenchmarkCard({
  title,
  actual,
  target,
  status,
  format,
}: {
  title: string;
  actual: number | null;
  target: number | null;
  status: BenchmarkStatus;
  format: (v: number | null) => string;
}) {
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 14, padding: 14, minWidth: 280, background: "#fff" }}>
      <div style={{ fontSize: 12, color: "#777", fontWeight: 900 }}>{title}</div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
        <div style={{ fontSize: 24, fontWeight: 900 }}>{format(actual)}</div>
        <div style={{ color: "#777", fontWeight: 900 }}> / {format(target)}</div>
        <div style={{ marginLeft: "auto" }}>
          <Badge status={status} />
        </div>
      </div>

      <div style={{ fontSize: 12, color: "#666", fontWeight: 800, marginTop: 6 }}>
        Actual / Target
      </div>
    </div>
  );
}

/* ====== Trend + Sparkline ====== */

function TrendStat({ label, delta, points }: { label: string; delta: number; points: TrendPoint[] }) {
  const up = delta > 0;
  const down = delta < 0;
  const arrow = up ? "▲" : down ? "▼" : "•";
  const tone = up ? "#14532d" : down ? "#7f1d1d" : "#444";
  const bg = up ? "#ecfdf5" : down ? "#fff5f5" : "#f7f7f7";
  const border = up ? "#bbf7d0" : down ? "#fecaca" : "#e5e7eb";

  const last = points?.length ? points[points.length - 1].value : null;
  const prev = points?.length > 1 ? points[points.length - 2].value : null;
  const microDelta = last == null || prev == null ? null : last - prev;

  const microLabel =
    microDelta == null
      ? "Last month vs previous: —"
      : `Last month vs previous: ${microDelta > 0 ? "+" : ""}${microDelta}`;

  return (
    <div style={{ border: `1px solid ${border}`, borderRadius: 14, padding: 14, minWidth: 310, background: bg }}>
      <div style={{ fontSize: 12, color: "#555", fontWeight: 900 }}>{label}</div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
        <div style={{ fontSize: 26, fontWeight: 900, color: tone, minWidth: 92 }}>
          {arrow} {delta}
        </div>

        <div style={{ flex: 1, color: tone }}>
          <Sparkline points={points} />
          <div style={{ fontSize: 11, fontWeight: 800, color: "#666", marginTop: 6 }}>
            {microLabel}
          </div>
        </div>
      </div>
    </div>
  );
}

function Sparkline({ points }: { points: TrendPoint[] }) {
  const w = 190;
  const h = 44;
  const pad = 4;

  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(null);

  const values = points?.map((p) => p.value) || [];
  if (!values || values.length < 2) {
    return <div style={{ height: h, display: "flex", alignItems: "center", color: "#777", fontSize: 12 }}>—</div>;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const coords = values.map((v, i) => {
    const x = pad + (i * (w - pad * 2)) / (values.length - 1);
    const y = pad + (h - pad * 2) * (1 - (v - min) / range);
    return { x, y };
  });

  const poly = coords.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  function monthLabel(periodStart: string) {
    const d = new Date(periodStart);
    return new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" }).format(d);
  }

  function nearestIndexFromMouse(svg: SVGSVGElement, clientX: number) {
    const rect = svg.getBoundingClientRect();
    const x = clientX - rect.left;

    let bestI = 0;
    let bestDist = Infinity;
    for (let i = 0; i < coords.length; i++) {
      const d = Math.abs(coords[i].x - x);
      if (d < bestDist) {
        bestDist = d;
        bestI = i;
      }
    }
    return bestI;
  }

  const start = coords[0];
  const end = coords[coords.length - 1];

  return (
    <div style={{ position: "relative" }}>
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        style={{ display: "block", cursor: "crosshair" }}
        onMouseMove={(e) => {
          const svg = e.currentTarget;
          const i = nearestIndexFromMouse(svg, e.clientX);
          const p = coords[i];
          setHover({ i, x: p.x, y: p.y });
        }}
        onMouseLeave={() => setHover(null)}
      >
        <polyline fill="none" stroke="currentColor" strokeWidth="2" points={poly} />
        <circle cx={start.x} cy={start.y} r={3} fill="currentColor" opacity={0.6} />
        <circle cx={end.x} cy={end.y} r={3} fill="currentColor" opacity={0.85} />
        {hover && <circle cx={hover.x} cy={hover.y} r={4} fill="currentColor" />}
      </svg>

      {hover && (
        <div
          style={{
            position: "absolute",
            left: Math.min(Math.max(hover.x + 8, 0), w - 10),
            top: Math.max(hover.y - 34, 0),
            transform: "translateX(-10px)",
            background: "#111",
            color: "#fff",
            padding: "6px 8px",
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 800,
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          {monthLabel(points[hover.i]?.period_start)} · {points[hover.i]?.value}
        </div>
      )}
    </div>
  );
}
