"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import {
  loadFamilyLearnersWithVariants,
  loadLinkedFamilyLearnerIds,
} from "@/lib/familyLearners";

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
      const ids = await loadLinkedFamilyLearnerIds();
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

      const learners = await loadFamilyLearnersWithVariants<ChildRow>(
        [],
        { orderedIds: ids, orderByCreatedAt: false },
      );
      setChildren(learners);
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
