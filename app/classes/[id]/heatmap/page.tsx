"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ClassLeftNav from "@/app/components/ClassLeftNav";

type HeatmapRow = {
  attribute_id: string;
  attribute_name: string;
  domain: string;
  healthy_count: number;
  monitor_count: number;
  risk_count: number;
  total_students: number;
};

function intensity(count: number, total: number) {
  if (total === 0) return 0;
  return Math.min(1, count / total);
}

function cellStyle(i: number, kind: "g" | "y" | "r") {
  const base =
    kind === "g" ? "#4CAF50" : kind === "y" ? "#FFC107" : "#F44336";
  return {
    background: base,
    opacity: 0.25 + i * 0.75,
    padding: "8px 10px",
    borderRadius: 8,
    textAlign: "center" as const,
    fontWeight: 900,
  };
}

export default function AttributeHeatmapPage() {
  const params = useParams();
  const classId = (params?.id as string) || "";

  const [rows, setRows] = useState<HeatmapRow[]>([]);
  const [classLabel, setClassLabel] = useState<string>("Class");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!classId) return;

    setErr(null);

    supabase
      .rpc("get_attribute_heatmap_view", { p_class_id: classId })
      .then(({ data, error }) => {
        if (error) setErr(error.message);
        setRows((data ?? []) as HeatmapRow[]);
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
  if (!rows.length) return <div style={{ padding: 24 }}>Loading heatmap…</div>;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <ClassLeftNav classId={classId} />

      <div style={{ flex: 1, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: "#777" }}>CLASSES · ATTRIBUTE HEATMAP</div>
            <div style={{ fontSize: 28, fontWeight: 900 }}>{classLabel}</div>
          </div>

          <Link href={`/classes/${classId}`} style={{ fontWeight: 900 }}>
            ← Back to Overview
          </Link>
        </div>

        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Attribute</th>
              <th>🟢 Healthy</th>
              <th>🟡 Monitor</th>
              <th>🔴 At risk</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => {
              const h = intensity(r.healthy_count, r.total_students);
              const m = intensity(r.monitor_count, r.total_students);
              const d = intensity(r.risk_count, r.total_students);

              return (
                <tr key={r.attribute_id}>
                  <td style={{ fontWeight: 900 }}>{r.attribute_name}</td>
                  <td><div style={cellStyle(h, "g")}>{r.healthy_count}</div></td>
                  <td><div style={cellStyle(m, "y")}>{r.monitor_count}</div></td>
                  <td><div style={cellStyle(d, "r")}>{r.risk_count}</div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
