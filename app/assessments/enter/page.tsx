"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

import TopNav from "@/app/components/TopNav";
import CohortSnapshot from "@/app/components/CohortSnapshot";
import AssessmentSnapshot from "@/app/components/AssessmentSnapshot";
import SupportSignalsPanel from "@/app/components/SupportSignalsPanel";
import NoRankingGuarantee from "@/app/components/NoRankingGuarantee";

type Scope = "class" | "year";

const DEMO_CLASS_ID = "83421f06-b6e8-47ea-b021-2139243f29e5";
const DEMO_SCHOOL_ID = "73d0be47-56e9-4b5a-8e4f-4e063b9c71f2";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);

  // scope + filters
  const [scope, setScope] = useState<Scope>("class");
  const [classId, setClassId] = useState<string>(DEMO_CLASS_ID);
  const [yearLevel, setYearLevel] = useState<number>(4);

  // data
  const [payload, setPayload] = useState<any>(null);
  const [signals, setSignals] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // ─────────────────────────────
  // Auth guard
  // ─────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }
      if (!data.user) {
        window.location.href = "/";
        return;
      }
      setLoading(false);
    });
  }, []);

  // ─────────────────────────────
  // Load dashboard data (RPCs)
  // ─────────────────────────────
  useEffect(() => {
    if (loading) return;

    const loadDashboard = async () => {
      setErrorMsg("");

      /* 1) Cohort planning dashboard (COLOURED BARS) */
      const { data: cohortData, error: cohortError } = await supabase.rpc(
        "rpc_cohort_planning_dashboard",
        {
          p_scope: scope,
          p_class_id: scope === "class" ? classId : null,
          p_school_id: DEMO_SCHOOL_ID,
          p_year_level: scope === "year" ? yearLevel : null,
          p_key_stage: null,
          p_min_group_size: 5,
          p_include_ilp: false,
          p_only_active: true,
        }
      );

      if (cohortError) {
        setErrorMsg(`Cohort RPC: ${cohortError.message}`);
        setPayload(null);
      } else {
        setPayload(cohortData);
      }

      /* 2) Support signals (professional judgement layer) */
      const { data: signalData, error: signalError } = await supabase.rpc(
        "rpc_support_signals",
        {
          p_scope: scope,
          p_school_id: DEMO_SCHOOL_ID,
          p_class_id: scope === "class" ? classId : null,
          p_year_level: scope === "year" ? yearLevel : null,
          p_key_stage: null,
          p_days_recent: 30,
          p_days_assessment: 180,
          p_include_ilp: false,
        }
      );

      if (signalError) {
        console.error("Signals RPC error:", signalError);
        setSignals([]);
      } else {
        setSignals(signalData ?? []);
      }
    };

    loadDashboard();
  }, [loading, scope, classId, yearLevel]);

  // ─────────────────────────────
  // Summary tiles (FM-style)
  // ─────────────────────────────
  const summary = useMemo(() => {
    const total = signals.length;
    const red = signals.filter((s) => s?.severity === "red").length;
    const amber = signals.filter((s) => s?.severity === "amber").length;
    const green = signals.filter((s) => s?.severity === "green").length;
    return { total, red, amber, green };
  }, [signals]);

  if (loading) {
    return <div style={{ padding: 24 }}>Loading dashboard…</div>;
  }

  return (
    <main style={{ padding: 24 }}>
      <TopNav />

      {/* Scope controls */}
      <section style={{ margin: "12px 0 18px", display: "flex", gap: 10 }}>
        <strong>View:</strong>
        <button onClick={() => setScope("class")} disabled={scope === "class"}>
          Class
        </button>
        <button onClick={() => setScope("year")} disabled={scope === "year"}>
          Year
        </button>

        <label style={{ marginLeft: 16, opacity: scope === "class" ? 1 : 0.4 }}>
          Class ID{" "}
          <input
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            disabled={scope !== "class"}
            style={{ width: 360 }}
          />
        </label>

        <label style={{ opacity: scope === "year" ? 1 : 0.4 }}>
          Year{" "}
          <input
            type="number"
            value={yearLevel}
            onChange={(e) => setYearLevel(Number(e.target.value))}
            disabled={scope !== "year"}
            style={{ width: 80 }}
          />
        </label>
      </section>

      {errorMsg && (
        <div style={{ marginBottom: 14, padding: 10, border: "1px solid #f2c1c1", borderRadius: 10 }}>
          <strong style={{ color: "crimson" }}>Error:</strong> {errorMsg}
        </div>
      )}

      {/* FM-style summary tiles */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 18 }}>
        <Tile title="Signals" value={summary.total} />
        <Tile title="Red" value={summary.red} />
        <Tile title="Amber" value={summary.amber} />
        <Tile title="Green" value={summary.green} />
      </section>

      {/* Main dashboard */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        <div>
          <CohortSnapshot payload={payload} loading={false} />
          <AssessmentSnapshot payload={payload} />
        </div>

        <div>
          <SupportSignalsPanel signals={signals} />
          <NoRankingGuarantee />
        </div>
      </div>

      {/* Debug (temporary) */}
      <details style={{ marginTop: 20 }}>
        <summary>Debug payload</summary>
        <pre>{JSON.stringify(payload, null, 2)}</pre>
      </details>
    </main>
  );
}

function Tile({ title, value }: { title: string; value: number }) {
  return (
    <div style={{ border: "1px solid #e6e6e6", borderRadius: 14, padding: 12 }}>
      <div style={{ fontSize: 12, opacity: 0.7 }}>{title}</div>
      <div style={{ fontSize: 26, fontWeight: 800 }}>{value}</div>
    </div>
  );
}
