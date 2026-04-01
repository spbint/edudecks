"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export const ACTIVE_STUDENT_ID_KEY = "edudecks_active_student_id";

export type ActiveStudentRow = {
  id: string;
  first_name?: string | null;
  preferred_name?: string | null;
  surname?: string | null;
  family_name?: string | null;
  year_level?: number | null;
  class_id?: string | null;
  is_ilp?: boolean | null;
  created_at?: string | null;
  [k: string]: any;
};

function safe(v: any) {
  return String(v ?? "").trim();
}

function isMissingColumnError(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && msg.includes("column");
}

export function activeStudentDisplayName(student: ActiveStudentRow | null | undefined) {
  if (!student) return "Child";
  const first = safe(student.preferred_name || student.first_name);
  const sur = safe(student.surname || student.family_name);
  return `${first}${sur ? ` ${sur}` : ""}`.trim() || "Child";
}

export function useActiveStudent() {
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState("");
  const [activeStudentId, setActiveStudentId] = useState("");
  const [student, setStudent] = useState<ActiveStudentRow | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    setErr("");

    try {
      const id =
        typeof window !== "undefined"
          ? safe(localStorage.getItem(ACTIVE_STUDENT_ID_KEY))
          : "";

      setActiveStudentId(id);

      if (!id) {
        setStudent(null);
        setBusy(false);
        return;
      }

      const tries = [
        "id,first_name,preferred_name,surname,family_name,year_level,class_id,is_ilp,created_at",
        "id,first_name,preferred_name,surname,family_name,class_id,is_ilp,created_at",
        "id,first_name,preferred_name,surname,class_id,is_ilp,created_at",
        "id,first_name,preferred_name,family_name,class_id,is_ilp,created_at",
        "id,first_name,preferred_name,class_id,is_ilp,created_at",
      ];

      for (const sel of tries) {
        const r = await supabase.from("students").select(sel).eq("id", id).maybeSingle();
        if (!r.error) {
          setStudent((r.data as ActiveStudentRow | null) ?? null);
          setBusy(false);
          return;
        }
        if (!isMissingColumnError(r.error)) throw r.error;
      }

      setStudent(null);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
      setStudent(null);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    load();

    function onStorage(e: StorageEvent) {
      if (e.key === ACTIVE_STUDENT_ID_KEY) load();
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [load]);

  function updateActiveStudent(id: string) {
    const clean = safe(id);
    setActiveStudentId(clean);
    if (typeof window !== "undefined") {
      if (clean) localStorage.setItem(ACTIVE_STUDENT_ID_KEY, clean);
      else localStorage.removeItem(ACTIVE_STUDENT_ID_KEY);
    }
    load();
  }

  return {
    busy,
    err,
    activeStudentId,
    student,
    studentName: activeStudentDisplayName(student),
    reloadActiveStudent: load,
    updateActiveStudent,
  };
}