"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

/* ───────────────────────────── TYPES ───────────────────────────── */

type ShareLinkRow = {
  id: string;
  student_id: string;
  share_token: string;
  expires_at?: string | null;
  password?: string | null;
  include_goals?: boolean | null;
  include_reflection?: boolean | null;
  representative_only?: boolean | null;
  created_at?: string | null;
  [k: string]: any;
};

type StudentRow = {
  id: string;
  first_name?: string | null;
  preferred_name?: string | null;
  surname?: string | null;
  family_name?: string | null;
  class_id?: string | null;
  is_ilp?: boolean | null;
  [k: string]: any;
};

type ClassRow = {
  id: string;
  name?: string | null;
  year_level?: number | null;
  teacher_name?: string | null;
  room?: string | null;
  [k: string]: any;
};

type EvidenceRow = {
  id: string;
  student_id?: string | null;
  class_id?: string | null;
  title?: string | null;
  summary?: string | null;
  body?: string | null;
  learning_area?: string | null;
  evidence_type?: string | null;
  occurred_on?: string | null;
  created_at?: string | null;
  visibility?: string | null;
  is_deleted?: boolean | null;
  attachment_url?: string | null;
  file_url?: string | null;
  image_url?: string | null;
  photo_url?: string | null;
  attachment_urls?: string[] | string | null;
  attachments?: any;
  [k: string]: any;
};

type FrameworkMapRow = {
  evidence_id: string;
  framework_code?: string | null;
  framework_name?: string | null;
  framework_item_label?: string | null;
  framework_item_code?: string | null;
  framework_sort_order?: number | null;
  learning_area?: string | null;
  [k: string]: any;
};

type GoalRow = {
  id: string;
  student_id?: string | null;
  text?: string | null;
  done?: boolean | null;
  sort_order?: number | null;
  [k: string]: any;
};

type NotesRow = {
  student_id: string;
  cover_note?: string | null;
  reflection?: string | null;
  [k: string]: any;
};

type EnrichedEvidence = EvidenceRow & {
  derived_group_label: string;
  derived_sort_order: number;
  is_unmapped: boolean;
  attachmentList: string[];
};

/* ───────────────────────────── HELPERS ───────────────────────────── */

function safe(v: any) {
  return String(v ?? "").trim();
}

function isMissingRelationOrColumn(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && (msg.includes("relation") || msg.includes("column"));
}

function studentDisplayName(s: StudentRow | null | undefined) {
  if (!s) return "Student";
  const first = safe(s.preferred_name || s.first_name);
  const sur = safe(s.surname || s.family_name);
  return `${first}${sur ? ` ${sur}` : ""}`.trim() || "Student";
}

function fmtYear(y?: number | null) {
  return y == null ? "" : `Year ${y}`;
}

function printPage() {
  window.print();
}

/* ───────────────────────────── PAGE ───────────────────────────── */

export default function SharedPortfolioView() {
  const params = useParams<{ token: string }>();
  const token = safe((params as any)?.token);

  const [busy, setBusy] = useState(true);
  const [locked, setLocked] = useState(false);
  const [enteredPassword, setEnteredPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [err, setErr] = useState<string | null>(null);

  const [share, setShare] = useState<ShareLinkRow | null>(null);
  const [student, setStudent] = useState<StudentRow | null>(null);
  const [klass, setKlass] = useState<ClassRow | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const r = await supabase
          .from("portfolio_share_links")
          .select("*")
          .eq("share_token", token)
          .maybeSingle();

        if (r.error) throw r.error;
        if (!r.data) {
          setErr("This shared portfolio link was not found.");
          setBusy(false);
          return;
        }

        setShare(r.data);

        const s = await supabase
          .from("students")
          .select("*")
          .eq("id", r.data.student_id)
          .maybeSingle();

        if (!s.error) setStudent(s.data);

        const k = await supabase
          .from("classes")
          .select("*")
          .eq("id", s.data?.class_id)
          .maybeSingle();

        if (!k.error) setKlass(k.data);

        setBusy(false);
      } catch (e: any) {
        setErr(String(e?.message ?? e));
        setBusy(false);
      }
    }

    load();
  }, [token]);

  return (
    <div style={{ padding: 24 }}>
      <h1>{studentDisplayName(student)}</h1>

      <div style={{ marginTop: 6 }}>
        {klass
          ? `${safe(klass.name) || "Class"}${
              klass.year_level != null ? ` • ${fmtYear(klass.year_level)}` : ""
            }`
          : "Shared read-only portfolio"}
        {safe(klass?.teacher_name) ? ` • ${safe(klass?.teacher_name)}` : ""}
        {student?.is_ilp ? " • ILP" : ""}
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={printPage}>Print / Save PDF</button>
      </div>

      {busy && <div>Loading…</div>}
      {err && <div>{err}</div>}
    </div>
  );
}