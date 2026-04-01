"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Student = {
  id: string;
  first_name: string | null;
  preferred_name: string | null;
};

type Class = {
  id: string;
  name: string | null;
};

function safe(v: any) {
  return String(v ?? "").trim();
}

export default function CommandBar() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);

  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);

    const { data: s } = await supabase
      .from("students")
      .select("id, first_name, preferred_name")
      .limit(200);

    const { data: c } = await supabase
      .from("classes")
      .select("id, name")
      .limit(100);

    setStudents((s as Student[]) ?? []);
    setClasses((c as Class[]) ?? []);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  /* Keyboard shortcut */

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }

      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", handler);

    return () => window.removeEventListener("keydown", handler);
  }, []);

  const q = query.toLowerCase();

  const filteredStudents = students
    .filter((s) =>
      (safe(s.preferred_name) + safe(s.first_name)).toLowerCase().includes(q)
    )
    .slice(0, 5);

  const filteredClasses = classes
    .filter((c) => safe(c.name).toLowerCase().includes(q))
    .slice(0, 5);

  if (!open) return null;

  return (
    <div style={overlay}>
      <div style={modal}>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search students, classes, actions..."
          style={input}
        />

        {loading && <div style={{ padding: 10 }}>Loading…</div>}

        <div style={results}>
          {filteredStudents.map((s) => (
            <Result
              key={s.id}
              label={`Student: ${safe(s.preferred_name) || safe(s.first_name)}`}
              onClick={() => router.push(`/admin/students/${s.id}`)}
            />
          ))}

          {filteredClasses.map((c) => (
            <Result
              key={c.id}
              label={`Class: ${safe(c.name)}`}
              onClick={() => router.push(`/admin/classes/${c.id}`)}
            />
          ))}

          <Result
            label="Enter Results"
            onClick={() => router.push("/admin/enter-results")}
          />

          <Result
            label="Evidence Entry"
            onClick={() => router.push("/admin/evidence-entry")}
          />

          <Result
            label="Interventions"
            onClick={() => router.push("/admin/interventions")}
          />
        </div>
      </div>
    </div>
  );
}

function Result({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <div style={item} onClick={onClick}>
      {label}
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  paddingTop: 120,
  zIndex: 10000,
};

const modal: React.CSSProperties = {
  width: 600,
  background: "white",
  borderRadius: 14,
  border: "1px solid #ddd",
  boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: 16,
  border: "none",
  borderBottom: "1px solid #eee",
  fontSize: 16,
  outline: "none",
};

const results: React.CSSProperties = {
  maxHeight: 400,
  overflow: "auto",
};

const item: React.CSSProperties = {
  padding: 14,
  cursor: "pointer",
  borderBottom: "1px solid #f1f1f1",
  fontWeight: 600,
};