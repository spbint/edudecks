"use client";

import { useCallback, useEffect, useState } from "react";
import { loadFamilyLearnersWithVariants } from "@/lib/familyLearners";

export const ACTIVE_STUDENT_ID_KEY = "edudecks_active_student_id";
const ACTIVE_CHILD_EVENT = "edudecksActiveChildChanged";

export type ActiveStudentRow = {
  id: string;
  first_name?: string | null;
  preferred_name?: string | null;
  surname?: string | null;
  family_name?: string | null;
  year_level?: number | null;
  is_ilp?: boolean | null;
  created_at?: string | null;
  [k: string]: unknown;
};

function safe(v: unknown) {
  return String(v ?? "").trim();
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

      const rows = await loadFamilyLearnersWithVariants<ActiveStudentRow>(
        [],
        { orderedIds: [id], orderByCreatedAt: false },
      );
      setStudent(rows[0] ?? null);
    } catch (e: unknown) {
      setErr(String((e as { message?: unknown })?.message ?? e));
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

    function onActiveChildChanged() {
      load();
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener(ACTIVE_CHILD_EVENT, onActiveChildChanged);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(ACTIVE_CHILD_EVENT, onActiveChildChanged);
    };
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
