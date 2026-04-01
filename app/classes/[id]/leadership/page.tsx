"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ClassLeftNav from "@/app/components/ClassLeftNav";

type ClassRow = {
  id: string;
  name: string | null;
  year_level: number | null;
};

type Dashboard = {
  class: {
    class_id: string;
    class_name: string;
    year_level: number | null;
  };
  kpis: {
    students_total: number;
    evidence_7d_total: number;
    evidence_30d_total: number;
    interventions_active: number;
    reviews_overdue: number;
  };
  // optional: if your RPC returns more, it will be ignored
};

export default function ClassLeadershipPage() {
  const router = useRouter();
  const params = useParams();
  const classId = (params?.id as string) || "";

  const [cls, setCls] = useState<ClassRow | null>(null);
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState("");

  const classLabel = useMemo(() => {
    if (cls?.name) return cls.name;
    if (cls?.year_level) return `Year ${cls.year_level}`;
    return "Class";
  }, [cls]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErrMsg("");

      // Get class header (works even if you haven't built class leadership RPC yet)
      const { data: classRow, error: classErr } = await supabase
        .from("classes")
        .select("id,name,year_level")
        .eq("id", classId)
        .maybeSingle();

      if (classErr) {
        const e: any = classErr;
        setErrMsg(e?.message || "Failed to load class.");
        setLoading(false);
        return;
      }

      setCls((classRow as ClassRow) ?? null);

      // If you already have a class leadership RPC, keep this call.
      // If not, the page still renders the action bar + links.
      try {
        const { data: dash, error } = await supabase.rpc("get_class_leadership_dashboard", {
          p_class_id: classId,
        });

        if (error) {
          // Soft fail: show page but keep action bar usable
          console.log("get_class_leadership_dashboard error:", error);
          setData(null);
        } else {
          setData(dash as Dashboard);
        }
      } catch (e) {
        setData(null);
      }

      setLoading(false);
    })();
  }, [classId]);

  async function createIntervention() {
    setCreating(true);
    setToast("");
    setErrMsg("");

    const title = `Leadership intervention · ${classLabel}`;
    const reviewDays = 21;

    const { data: newId, error } = await supabase.rpc("create_class_intervention", {
      p_class_id: classId,
      p_title: title,
      p_review_days: reviewDays,
    });

    if (error) {
      const e: any = error;
      console.log("create_class_intervention error:", e);
      setErrMsg(e?.message || e?.details || "Failed to create intervention.");
      setCreating(false);
      return;
    }

    const interventionId = String(newId);
    setToast("Created. Opening…");
    setCreating(false);

    // ✅ deep-link open on interventions page
    router.push(`/classes/${classId}/interventions?open=${interventionId}`);
  }

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <ClassLeftNav classId={classId} />

      <div style={{ flex: 1, padding: 24 }}>
        <div style={{ fontSize: 12, color: "#777", fontWeight: 900 }}>
          CLASS · LEADERSHIP
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1 style={{ margin: "6px 0 0 0" }}>{classLabel}</h1>

          {/* ACTION BAR */}
          <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
            <Link
              href={`/classes/${classId}/interventions`}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #eee",
                background: "#fff",
                fontWeight: 900,
                textDecoration: "none",
                color: "#111",
              }}
            >
              View Interventions
            </Link>

            <button
              onClick={createIntervention}
              disabled={creating}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #111",
                background: creating ? "#f3f4f6" : "#111",
                color: creating ? "#666" : "#fff",
                fontWeight: 900,
                cursor: creating ? "not-allowed" : "pointer",
              }}
            >
              {creating ? "Creating…" : "Create Intervention"}
            </button>
          </div>
        </div>

        {toast && (
          <div style={{ marginTop: 10, fontWeight: 900, color: "#0a7" }}>
            {toast}
          </div>
        )}

        {errMsg && (
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
            {errMsg}
            <div style={{ marginTop: 8, color: "#555", fontWeight: 700, lineHeight: 1.4 }}>
              Most common cause: your user isn’t marked <b>is_admin</b> or <b>is_leader</b> in <code>profiles</code>.
            </div>
          </div>
        )}

        {/* OPTIONAL dashboard content */}
        <div style={{ marginTop: 18 }}>
          {!data ? (
            <div style={{ color: "#666", fontWeight: 800 }}>
              (No class dashboard data yet — action bar is live.)
            </div>
          ) : (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Stat label="Students" value={data.kpis.students_total} />
              <Stat label="Evidence (7d)" value={data.kpis.evidence_7d_total} />
              <Stat label="Evidence (30d)" value={data.kpis.evidence_30d_total} />
              <Stat label="Active Interventions" value={data.kpis.interventions_active} />
              <Stat label="Reviews Overdue" value={data.kpis.reviews_overdue} />
            </div>
          )}
        </div>

        <div style={{ marginTop: 18 }}>
          <Link href={`/classes/${classId}`} style={{ fontWeight: 900 }}>
            ← Back to Class Overview
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div
      style={{
        border: "1px solid #eee",
        borderRadius: 14,
        padding: 14,
        minWidth: 200,
        background: "#fff",
      }}
    >
      <div style={{ fontSize: 12, color: "#777", fontWeight: 900 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 900 }}>{value}</div>
    </div>
  );
}
