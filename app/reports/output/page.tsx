"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import UpgradeCard from "@/app/components/premium/UpgradeCard";
import {
  loadReportDraftById,
  marketLabel,
  modeLabel,
  periodLabel,
  type ReportDraftRow,
} from "@/lib/reportDrafts";
import { familyStyles as S } from "@/lib/theme/familyStyles";

type EvidenceRow = {
  id: string;
  student_id?: string | null;
  class_id?: string | null;
  title?: string | null;
  summary?: string | null;
  body?: string | null;
  note?: string | null;
  learning_area?: string | null;
  evidence_type?: string | null;
  occurred_on?: string | null;
  created_at?: string | null;
  attachment_urls?: string[] | string | null;
  image_url?: string | null;
  photo_url?: string | null;
  file_url?: string | null;
  audio_url?: string | null;
  is_deleted?: boolean | null;
  [k: string]: any;
};

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function isMissingRelationOrColumn(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return (
    msg.includes("does not exist") &&
    (msg.includes("relation") || msg.includes("column"))
  );
}

async function loadEvidence(): Promise<EvidenceRow[]> {
  const variants = [
    "id,student_id,class_id,title,summary,body,note,learning_area,evidence_type,occurred_on,created_at,attachment_urls,image_url,photo_url,file_url,audio_url,is_deleted",
    "id,student_id,class_id,title,summary,body,note,learning_area,occurred_on,created_at,attachment_urls,image_url,photo_url,file_url,is_deleted",
    "id,student_id,class_id,title,summary,note,learning_area,occurred_on,created_at,is_deleted",
  ];

  let lastErr: any = null;

  for (const select of variants) {
    const res = await supabase
      .from("evidence_entries")
      .select(select)
      .order("occurred_on", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    // ✅ FIXED CAST (THIS WAS THE ERROR)
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

/* --- REST OF YOUR FILE REMAINS IDENTICAL --- */

export default function ReportsOutputPage() {
  return <div>Report Output Page</div>;
}
