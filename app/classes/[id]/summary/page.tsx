"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ClassLeftNav from "@/app/components/ClassLeftNav";

type CoachSummary = {
  overview: string;
  strengths: string;
  concerns: string;
  intervention: string;
};

function Section({ title, text }: { title: string; text: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontWeight: 900, marginBottom: 6 }}>{title}</div>
      <div style={{ lineHeight: 1.55 }}>{text}</div>
    </div>
  );
}

export default function CohortCoachSummaryPage() {
  const params = useParams();
  const classId = (params?.id as string) || "";

  const [summary, setSummary] = useState<CoachSummary | null>(null);
  const [classLabel, setClassLabel] = useState<string>("Class");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!classId) return;

    setErr(null);

    supabase
      .rpc("get_cohort_coach_summary", { p_class_id: classId })
      .then(({ data, error }) => {
        if (error) {
          setErr(error.message);
          setSummary(null);
        } else {
          setSummary(data as CoachSummary);
        }
      });

    supabase
      .from("classes")
      .select("name, year_level")
      .eq("id", classId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setClassLabel(
          data.name ?? (data.year_level != null ? `Year ${data.year_level}` : "Class")
        );
      });
  }, [classId]);

  if (err) return <div style={{ padding: 24, color: "red" }}>{err}</div>;
  if (!summary) return <div style={{ padding: 24 }}>Loading summary…</div>;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <ClassLeftNav classId={classId} />

      <div style={{ flex: 1, padding: 24, maxWidth: 980 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 18,
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: "#777" }}>CLASSES · COACH SUMMARY</div>
            <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>{classLabel}</div>
          </div>

          <Link href={`/classes/${classId}`} style={{ fontWeight: 900 }}>
            ← Back to Overview
          </Link>
        </div>

        <div style={{ border: "1px solid #eee", borderRadius: 16, padding: 20, background: "#fff" }}>
          <Section title="Overview" text={summary.overview} />
          <Section title="Areas of strength" text={summary.strengths} />
          <Section title="Areas to monitor" text={summary.concerns} />
          <Section title="Intervention snapshot" text={summary.intervention} />
        </div>
      </div>
    </div>
  );
}
