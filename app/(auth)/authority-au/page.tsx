"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import { loadLinkedFamilyStudentIds } from "@/lib/familyLearners";

const ACTIVE_STUDENT_ID_KEY = "edudecks_active_student_id";

type ChildRow = {
  id: string;
  first_name?: string | null;
  preferred_name?: string | null;
  surname?: string | null;
  year_level?: number | null;
  [k: string]: any;
};

type EvidenceRow = {
  id: string;
  student_id?: string | null;
  learning_area?: string | null;
  evidence_type?: string | null;
  occurred_on?: string | null;
  created_at?: string | null;
  title?: string | null;
  summary?: string | null;
  note?: string | null;
  body?: string | null;
  is_deleted?: boolean | null;
  [k: string]: any;
};

function safe(v: any) {
  return String(v ?? "").trim();
}

function isMissingColumnError(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && msg.includes("column");
}

function isMissingRelationOrColumn(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && (msg.includes("column") || msg.includes("relation"));
}

function childDisplayName(child: ChildRow | null | undefined) {
  if (!child) return "Child";
  const first = safe(child.preferred_name || child.first_name);
  const sur = safe(child.surname);
  return `${first}${sur ? ` ${sur}` : ""}`.trim() || "Child";
}

export default function AuthorityAuPage() {
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState("");
  const [children, setChildren] = useState<ChildRow[]>([]);
  const [activeChildId, setActiveChildId] = useState("");
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);

  async function loadData() {
    setBusy(true);
    setErr("");

    try {
      const ids = await loadLinkedFamilyStudentIds();
      if (!Array.isArray(ids)) {
        setChildren([]);
        setEvidence([]);
        setBusy(false);
        return;
      }
      if (!ids.length) {
        setChildren([]);
        setEvidence([]);
        setBusy(false);
        return;
      }

      let students: ChildRow[] = [];

      const r = await supabase
        .from("students")
        .select("id,first_name,preferred_name,surname,year_level,created_at")
        .in("id", ids);

      if (!r.error) {
        students = ids
          .map((id) => {
            const student = ((r.data ?? []) as ChildRow[]).find((row) => row.id === id);
            if (!student) return null;
            return student satisfies ChildRow;
          })
          .filter(Boolean) as ChildRow[];
      } else {
        throw r.error;
      }

      setChildren(students);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
      setChildren([]);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <FamilyTopNavShell
      title="EduDecks Family"
      subtitle="Authority Hub — Australia"
      heroTitle="Australian authority pathway"
      heroText="This page helps families shape an Australia-focused pathway."
    >
      {busy ? <div>Loading…</div> : err ? <div>{err}</div> : <div>Loaded</div>}
    </FamilyTopNavShell>
  );
}
