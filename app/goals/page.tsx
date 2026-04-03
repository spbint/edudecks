"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const ACTIVE_STUDENT_ID_KEY = "edudecks_active_student_id";
const CHILDREN_KEY = "edudecks_children_seed_v1";

type StudentRow = {
  id: string;
  preferred_name?: string | null;
  first_name?: string | null;
  surname?: string | null;
  family_name?: string | null;
  last_name?: string | null;
  year_level?: number | null;
  yearLabel?: string | null;
  source?: "db" | "seed";
  [k: string]: any;
};

type EvidenceRow = {
  id: string;
  student_id?: string | null;
  title?: string | null;
  summary?: string | null;
  body?: string | null;
  note?: string | null;
  learning_area?: string | null;
  evidence_type?: string | null;
  occurred_on?: string | null;
  created_at?: string | null;
  curriculum_subject?: string | null;
  curriculum_strand?: string | null;
  curriculum_skill?: string | null;
  is_deleted?: boolean | null;
  [k: string]: any;
};

type GoalStatus = "active" | "building" | "achieved";
type GoalKind = "coverage" | "skill" | "habit" | "readiness";

type GoalCard = {
  id: string;
  title: string;
  description: string;
  whyNow: string;
  linkedArea: string;
  linkedEvidenceCount: number;
  lastActivity: string | null;
  status: GoalStatus;
  confidence: number;
  nextActionText: string;
  captureHref: string;
  plannerHref: string;
  badges: string[];
  kind: GoalKind;
};

function safe(v: any) {
  return String(v ?? "").trim();
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function isMissingRelationOrColumn(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && (msg.includes("relation") || msg.includes("column"));
}

function studentName(student?: StudentRow | null) {
  if (!student) return "Your child";
  const first = safe(student.preferred_name || student.first_name);
  const last = safe(student.surname || student.family_name || student.last_name);
  return `${first} ${last}`.trim() || "Your child";
}

function firstNameOf(student?: StudentRow | null) {
  return safe(student?.preferred_name || student?.first_name) || "your child";
}

function studentYearLabel(student?: StudentRow | null) {
  if (!student) return "";
  if (student.year_level != null && safe(student.year_level)) return `Year ${safe(student.year_level)}`;
  return safe(student.yearLabel);
}

function textOfEvidence(row: EvidenceRow) {
  return safe(row.summary || row.body || row.note);
}

function guessArea(raw: string | null | undefined) {
  const x = safe(raw).toLowerCase();

  if (x.includes("liter") || x.includes("reading") || x.includes("writing")) return "Literacy";
  if (x.includes("num") || x.includes("math")) return "Numeracy";
  if (x.includes("science")) return "Science";
  if (x.includes("history") || x.includes("geography")) return "Humanities";
  return "Other";
}

function shortDate(value?: string | null) {
  const s = safe(value);
  if (!s) return "—";
  try {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s.slice(0, 10);
    return d.toLocaleDateString();
  } catch {
    return s.slice(0, 10);
  }
}

function daysSince(value?: string | null) {
  const s = safe(value);
  if (!s) return 999;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return 999;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)));
}

function buildSeedStudents(): StudentRow[] {
  if (typeof window === "undefined") return [];
  const raw = parseJson<any[]>(window.localStorage.getItem(CHILDREN_KEY), []);
  return raw.map((child, index) => ({
    id: safe(child?.id) || `seed-child-${index + 1}`,
    preferred_name: safe(child?.name) || `Child ${index + 1}`,
    yearLabel: safe(child?.yearLabel),
    source: "seed",
  }));
}

async function loadStudents(): Promise<StudentRow[]> {
  const variants = [
    "id,preferred_name,first_name,surname,family_name,last_name,year_level",
    "id,preferred_name,first_name,surname,last_name,year_level",
    "id,preferred_name,first_name,year_level",
  ];

  let lastErr: any = null;

  for (const select of variants) {
    const res = await supabase.from("students").select(select);

    // ✅ FIXED CAST
    if (!res.error) return ((res.data || []) as unknown) as StudentRow[];

    lastErr = res.error;
    if (!isMissingRelationOrColumn(res.error)) break;
  }

  if (lastErr) throw lastErr;
  return [];
}

async function loadEvidence(): Promise<EvidenceRow[]> {
  const variants = [
    "id,student_id,title,summary,body,note,learning_area,evidence_type,occurred_on,created_at,is_deleted",
  ];

  let lastErr: any = null;

  for (const select of variants) {
    const res = await supabase.from("evidence_entries").select(select);

    // ✅ FIXED CAST
    if (!res.error) {
      return (((res.data || []) as unknown) as EvidenceRow[]).filter(
        (x) => !x.is_deleted
      );
    }

    lastErr = res.error;
    if (!isMissingRelationOrColumn(res.error)) break;
  }

  if (lastErr) throw lastErr;
  return [];
}

export default function GoalsPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);

  useEffect(() => {
    async function init() {
      const [s, e] = await Promise.all([loadStudents(), loadEvidence()]);
      setStudents(s);
      setEvidence(e);
    }
    init();
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>Goals</h1>
      <div>Students loaded: {students.length}</div>
      <div>Evidence loaded: {evidence.length}</div>
    </main>
  );
}