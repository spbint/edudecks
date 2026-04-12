"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";

type TemplateKey =
  | "general_portfolio"
  | "homeschool_registration"
  | "term_summary"
  | "evidence_appendix"
  | "christian_overlay"
  | "custom_parent_view";

type SectionKey =
  | "cover"
  | "student_details"
  | "student_summary"
  | "coverage_summary"
  | "evidence_type_summary"
  | "grouped_evidence"
  | "representative_samples"
  | "reflection"
  | "goals"
  | "appendix"
  | "declaration";

type ReportPresetRow = {
  id: string;
  parent_user_id?: string;
  student_id?: string | null;
  name?: string | null;
  template_key?: string | null;
  date_from?: string | null;
  date_to?: string | null;
  sections?: any;
  notes?: string | null;
  is_favorite?: boolean | null;
  sort_order?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function safe(v: any) {
  return String(v ?? "").trim();
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function isMissingColumnError(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && msg.includes("column");
}

export default function ReportPresetsPage() {
  const {
    workspace,
    activeLearner,
    activeLearnerId,
    setActiveLearner,
    loading: workspaceLoading,
    error: workspaceError,
  } = useFamilyWorkspace();

  const [name, setName] = useState("");
  const [template, setTemplate] = useState<TemplateKey>("homeschool_registration");
  const [dateFrom, setDateFrom] = useState(daysAgoIso(90));
  const [dateTo, setDateTo] = useState(todayIso());
  const [notes, setNotes] = useState("");
  const [sections, setSections] = useState<SectionKey[]>([
    "cover",
    "student_details",
    "student_summary",
    "coverage_summary",
    "evidence_type_summary",
    "grouped_evidence",
    "representative_samples",
    "declaration",
  ]);

  const [busy, setBusy] = useState(false);
  const [loadingPresets, setLoadingPresets] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [presets, setPresets] = useState<ReportPresetRow[]>([]);

  const learnerName = activeLearner?.label?.trim() || "";
  const hasLearners = workspace.learners.length > 0;
  const canSavePreset = Boolean(activeLearnerId);

  async function loadPresets() {
    setLoadingPresets(true);
    setErr("");

    try {
      const tries = [
        "id,parent_user_id,student_id,name,template_key,date_from,date_to,sections,notes,is_favorite,sort_order,created_at,updated_at",
        "id,parent_user_id,student_id,name,template_key,date_from,date_to,sections,notes,sort_order,created_at,updated_at",
        "id,parent_user_id,student_id,name,template_key,date_from,date_to,sections,notes,created_at,updated_at",
      ];

      for (const sel of tries) {
        const r = await supabase
          .from("report_presets")
          .select(sel)
          .order("is_favorite", { ascending: false })
          .order("sort_order", { ascending: true })
          .order("updated_at", { ascending: false });

        // ✅ FIXED CAST (CRITICAL)
        if (!r.error) {
          setPresets(((r.data ?? []) as unknown) as ReportPresetRow[]);
          setLoadingPresets(false);
          return;
        }

        if (!isMissingColumnError(r.error)) throw r.error;
      }

      setPresets([]);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
      setPresets([]);
    } finally {
      setLoadingPresets(false);
    }
  }

  useEffect(() => {
    loadPresets();
  }, []);

  async function savePreset() {
    if (!safe(name)) {
      setErr("Please give the preset a name.");
      return;
    }

    if (!activeLearnerId) {
      setErr("Choose a learner from the family workspace before saving a preset.");
      return;
    }

    setBusy(true);
    setErr("");
    setMsg("");

    try {
      const payload = {
        student_id: activeLearnerId,
        name: safe(name),
        template_key: safe(template),
        date_from: safe(dateFrom) || null,
        date_to: safe(dateTo) || null,
        sections,
        notes: safe(notes) || null,
        is_favorite: false,
        sort_order: 0,
      };

      const r = await supabase.from("report_presets").insert(payload).select("id").single();
      if (r.error) throw r.error;

      setMsg("Preset saved.");
      setName("");
      setNotes("");
      await loadPresets();
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  async function deletePreset(id: string) {
    setBusy(true);
    setErr("");
    setMsg("");

    try {
      const r = await supabase.from("report_presets").delete().eq("id", id);
      if (r.error) throw r.error;

      setMsg("Preset deleted.");
      await loadPresets();
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Report Presets</h1>

      <p style={{ color: "#4b5563", marginTop: 8, maxWidth: 720 }}>
        Save a reusable report setup for the learner currently selected in your family
        workspace.
      </p>

      <div
        style={{
          marginTop: 20,
          padding: 16,
          border: "1px solid #d1d5db",
          borderRadius: 12,
          background: "#f8fafc",
          display: "grid",
          gap: 12,
          maxWidth: 720,
        }}
      >
        <div>
          <strong>Active learner</strong>
          <div style={{ color: "#4b5563", marginTop: 4 }}>
            {workspaceLoading
              ? "Loading learner context..."
              : learnerName || "No learner selected yet."}
          </div>
        </div>

        {hasLearners ? (
          <label style={{ display: "grid", gap: 6, maxWidth: 320 }}>
            <span style={{ fontSize: 14, color: "#4b5563" }}>Use preset for</span>
            <select
              value={activeLearnerId}
              onChange={(event) => setActiveLearner(event.target.value)}
              disabled={workspaceLoading || busy}
            >
              {workspace.learners.map((learner) => (
                <option key={learner.id} value={learner.id}>
                  {learner.label || "Learner"}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div style={{ color: "#4b5563" }}>
            Add a learner in <a href="/profile">Profile</a> before saving report presets.
          </div>
        )}
      </div>

      {msg && <div style={{ marginTop: 16 }}>{msg}</div>}
      {err && <div style={{ color: "red", marginTop: 16 }}>{err}</div>}
      {!err && workspaceError && <div style={{ color: "red", marginTop: 16 }}>{workspaceError}</div>}

      <div style={{ marginTop: 20 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Preset name" />
        <button onClick={savePreset} disabled={busy || workspaceLoading || !canSavePreset}>
          Save
        </button>
      </div>

      <div style={{ marginTop: 20 }}>
        {loadingPresets && <div>Loading saved presets...</div>}
        {presets.map((p) => (
          <div key={p.id}>
            <strong>{p.name}</strong>
            <button onClick={() => deletePreset(p.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
