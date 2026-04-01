"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type ProfileRow = {
  student_id: string;
  student_display_name: string | null;
  class_id: string | null;
  class_name: string | null;
  year_level_label: string | null;
  is_ilp: boolean | null;

  // Optional fields used by the UI (safe if missing)
  next_best_action?: any;

  mtss_tier?: string | null;
  priority_score?: number | null;
  priority_reason?: string | null;
  weakest_attribute_1?: string | null;
  weakest_attribute_2?: string | null;

  red_count?: number | null;
  amber_count?: number | null;
  green_count?: number | null;
  grey_count?: number | null;
  has_stale_attributes?: boolean | null;
};

function pillStyle() {
  return {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    lineHeight: 1,
    gap: 6,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "rgba(0,0,0,0.03)",
    fontWeight: 800,
  } as const;
}

function Pill({ children }: { children: any }) {
  return <span style={pillStyle()}>{children}</span>;
}

export default function StudentProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const studentId = params?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!studentId) return;

      setLoading(true);
      setError("");

      // 1) Try view first
      const viewRes = await supabase
        .from("v_student_profile_overview_fm")
        .select("*")
        .eq("student_id", studentId)
        .single();

      if (!cancelled && !viewRes.error && viewRes.data) {
        setProfile(viewRes.data as any);
        setLoading(false);
        return;
      }

      // 2) Fallback RPC
      const rpcRes = await supabase.rpc("get_student_profile_view", {
        p_student_id: studentId,
      });

      if (!cancelled && rpcRes.error) {
        const msg =
          viewRes.error?.message ||
          rpcRes.error.message ||
          "Failed to load student profile.";
        setError(msg);
        setLoading(false);
        return;
      }

      const rpcData: any = (rpcRes as any).data;
      const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;

      if (!cancelled) {
        setProfile((row as any) ?? null);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  const nextAction = useMemo(() => {
    if (!profile) return null;
    return profile.next_best_action ?? null;
  }, [profile]);

  if (!studentId) return <div style={{ padding: 24 }}>Missing student id in route.</div>;
  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <h2 style={{ margin: 0 }}>Student Profile</h2>
        <p style={{ color: "#b91c1c" }}>{error}</p>
        <p style={{ opacity: 0.8, fontSize: 12 }}>
          If this mentions permission denied/RLS, your policies are blocking reads from the view/RPC.
        </p>
      </div>
    );
  }

  if (!profile) return <div style={{ padding: 24 }}>No profile data returned.</div>;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #fafafa 0%, #ffffff 60%)" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: 20, display: "grid", gap: 14 }}>
        {/* Header card */}
        <div
          style={{
            border: "1px solid rgba(0,0,0,0.08)",
            background: "white",
            borderRadius: 18,
            padding: 16,
            boxShadow: "0 1px 10px rgba(0,0,0,0.04)",
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 900, fontSize: 22 }}>
              {profile.student_display_name || "Student"}
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Pill>
                Class: {profile.class_name || "—"}{" "}
                {profile.year_level_label ? `(${profile.year_level_label})` : ""}
              </Pill>
              {profile.is_ilp ? <Pill>ILP</Pill> : null}
              {profile.mtss_tier ? <Pill>MTSS: {String(profile.mtss_tier).toUpperCase()}</Pill> : null}
              {profile.priority_score != null ? <Pill>Priority: {profile.priority_score}</Pill> : null}
            </div>

            {profile.priority_reason ? (
              <div style={{ marginTop: 10, opacity: 0.85 }}>{profile.priority_reason}</div>
            ) : null}

            {(profile.weakest_attribute_1 || profile.weakest_attribute_2) ? (
              <div style={{ marginTop: 6, opacity: 0.75, fontSize: 13 }}>
                Weakest: {profile.weakest_attribute_1 || "—"}
                {profile.weakest_attribute_2 ? `, ${profile.weakest_attribute_2}` : ""}
              </div>
            ) : null}
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {profile.class_id ? (
              <button
                onClick={() => router.push(`/classes/${profile.class_id}`)}
                style={{
                  borderRadius: 14,
                  padding: "10px 14px",
                  border: "1px solid rgba(0,0,0,0.10)",
                  background: "white",
                  cursor: "pointer",
                  fontWeight: 800,
                }}
              >
                Back to Class
              </button>
            ) : null}

            <button
              onClick={() => router.push("/teacher")}
              style={{
                borderRadius: 14,
                padding: "10px 14px",
                border: "1px solid rgba(0,0,0,0.10)",
                background: "white",
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              Teacher dashboard →
            </button>

            {nextAction?.route_hint ? (
              <button
                onClick={() => router.push(nextAction.route_hint)}
                style={{
                  borderRadius: 14,
                  padding: "10px 14px",
                  border: "1px solid rgba(0,0,0,0.10)",
                  background: "#111",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 900,
                }}
              >
                Next action
              </button>
            ) : null}
          </div>
        </div>

        {/* Simple stats row (optional, safe) */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Pill>Red: {profile.red_count ?? 0}</Pill>
          <Pill>Amber: {profile.amber_count ?? 0}</Pill>
          <Pill>Green: {profile.green_count ?? 0}</Pill>
          <Pill>Stale: {profile.has_stale_attributes ? "Yes" : "No"}</Pill>
        </div>

        {/* Tasks/Inbox intentionally removed */}
      </div>
    </div>
  );
}
