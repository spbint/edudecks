"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ClassLeftNav from "@/app/components/ClassLeftNav";

/* ================= TYPES ================= */

type SquadRow = {
  student_id: string;
  student_name: string;
  red_count: number;
  amber_count: number;
  green_count: number;
  risk_score: number;
  last_evidence_at: string | null;
};

type ClassRow = {
  name: string | null;
  year_level: number | null;
};

/* ================= PAGE ================= */

export default function SquadPage() {
  const params = useParams();
  const router = useRouter();
  const classId = (params?.id as string) || "";

  const [cls, setCls] = useState<ClassRow | null>(null);
  const [rows, setRows] = useState<SquadRow[]>([]);
  const [query, setQuery] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const [focusedId, setFocusedId] = useState<string | null>(null);

  const rowRefs = useRef<{ [key: string]: HTMLTableRowElement | null }>({});

  /* ================= LOAD ================= */

  useEffect(() => {
    if (!classId) return;

    setErr(null);

    supabase
      .from("classes")
      .select("name, year_level")
      .eq("id", classId)
      .maybeSingle()
      .then(({ data }) => setCls((data ?? null) as ClassRow | null));

    supabase
      .rpc("get_class_squad_view", { p_class_id: classId })
      .then(({ data, error }) => {
        if (error) {
          setErr(error.message);
          setRows([]);
          return;
        }

        const r = ((data ?? []) as unknown) as SquadRow[];
        setRows(r);

        if (r.length) {
          const firstId = r[0].student_id;
          setFocusedId(firstId);
        }
      });
  }, [classId]);

  /* ================= FILTER ================= */

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return rows.filter((r) => r.student_name.toLowerCase().includes(q));
  }, [rows, query]);

  /* ================= SCROLL ================= */

  useEffect(() => {
    if (!focusedId) return;
    rowRefs.current[focusedId]?.scrollIntoView({ block: "nearest" });
  }, [focusedId]);

  /* ================= RENDER ================= */

  if (err) return <div style={{ padding: 24, color: "red" }}>{err}</div>;
  if (!rows.length) return <div style={{ padding: 24 }}>Loading…</div>;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <ClassLeftNav classId={classId} />

      <div style={{ flex: 1, padding: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900 }}>
          {cls?.name ?? "Class"}
        </h1>

        <input
          placeholder="Search students…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ marginTop: 12, padding: 10 }}
        />

        <table style={{ width: "100%", marginTop: 16 }}>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.student_id}
                ref={(el) => {
                  rowRefs.current[r.student_id] = el;
                }}
                onClick={() => setFocusedId(r.student_id)}
                style={{
                  background:
                    r.student_id === focusedId ? "#eef2ff" : "#fff",
                  cursor: "pointer",
                }}
              >
                <td>{r.student_name}</td>
                <td>{r.risk_score}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {focusedId && (
          <div style={{ marginTop: 20 }}>
            <Link href={`/students/${focusedId}`}>
              Open student →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}