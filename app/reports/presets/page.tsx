"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ActiveChildContextBar from "@/app/components/ActiveChildContextBar";
import { useActiveStudent } from "@/app/hooks/useActiveStudent";

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

function toSectionArray(value: any): SectionKey[] {
  if (Array.isArray(value)) return value.filter(Boolean) as SectionKey[];
  return [];
}

const templateOptions: Array<{ key: TemplateKey; label: string }> = [
  { key: "homeschool_registration", label: "Homeschool Registration" },
  { key: "general_portfolio", label: "General Portfolio" },
  { key: "term_summary", label: "Term Summary" },
  { key: "evidence_appendix", label: "Evidence Appendix" },
  { key: "christian_overlay", label: "Christian / Biblical Overlay" },
  { key: "custom_parent_view", label: "Custom Parent View" },
];

const sectionOptions: Array<{ key: SectionKey; label: string }> = [
  { key: "cover", label: "Cover page" },
  { key: "student_details", label: "Student details" },
  { key: "student_summary", label: "Student summary" },
  { key: "coverage_summary", label: "Coverage summary" },
  { key: "evidence_type_summary", label: "Evidence type summary" },
  { key: "grouped_evidence", label: "Grouped evidence" },
  { key: "representative_samples", label: "Representative samples" },
  { key: "reflection", label: "Reflection" },
  { key: "goals", label: "Goals" },
  { key: "appendix", label: "Appendix" },
  { key: "declaration", label: "Declaration" },
];

const S = {
  shell: {
    minHeight: "100vh",
    background: "#f6f7fb",
    padding: 24,
  } as React.CSSProperties,

  wrap: {
    maxWidth: 1240,
    margin: "0 auto",
  } as React.CSSProperties,

  hero: {
    border: "1px solid #e5e7eb",
    borderRadius: 26,
    padding: 28,
    background:
      "linear-gradient(135deg, rgba(17,24,39,0.06), rgba(99,102,241,0.08))",
  } as React.CSSProperties,

  subtle: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  } as React.CSSProperties,

  h1: {
    margin: "10px 0 0 0",
    fontSize: 38,
    fontWeight: 950,
    color: "#0f172a",
    lineHeight: 1.05,
  } as React.CSSProperties,

  lead: {
    marginTop: 14,
    fontSize: 17,
    lineHeight: 1.65,
    color: "#475569",
    fontWeight: 700,
    maxWidth: 900,
  } as React.CSSProperties,

  callout: {
    marginTop: 16,
    background: "#eff6ff",
    border: "1px solid #dbeafe",
    color: "#1d4ed8",
    padding: 14,
    borderRadius: 16,
    fontWeight: 800,
    lineHeight: 1.55,
  } as React.CSSProperties,

  btnRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 22,
  } as React.CSSProperties,

  btn: {
    padding: "12px 16px",
    borderRadius: 14,
    border: "1px solid #dbe1ea",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 900,
    cursor: "pointer",
  } as React.CSSProperties,

  btnPrimary: {
    padding: "12px 16px",
    borderRadius: 14,
    border: "1px solid #111827",
    background: "#111827",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  } as React.CSSProperties,

  grid2: {
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    gap: 14,
    marginTop: 18,
  } as React.CSSProperties,

  grid3: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 14,
    marginTop: 18,
  } as React.CSSProperties,

  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    padding: 18,
  } as React.CSSProperties,

  sectionTitle: {
    fontSize: 18,
    fontWeight: 950,
    color: "#0f172a",
  } as React.CSSProperties,

  sectionText: {
    marginTop: 8,
    fontWeight: 700,
    color: "#475569",
    lineHeight: 1.6,
    fontSize: 14,
  } as React.CSSProperties,

  fieldGrid: {
    display: "grid",
    gap: 14,
    marginTop: 14,
  } as React.CSSProperties,

  fieldRow2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  } as React.CSSProperties,

  field: {
    display: "grid",
    gap: 8,
  } as React.CSSProperties,

  label: {
    fontSize: 12,
    color: "#475569",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  } as React.CSSProperties,

  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid #dbe1ea",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 800,
    outline: "none",
  } as React.CSSProperties,

  textarea: {
    width: "100%",
    minHeight: 90,
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid #dbe1ea",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 800,
    outline: "none",
    resize: "vertical",
  } as React.CSSProperties,

  checklist: {
    display: "grid",
    gap: 10,
    marginTop: 12,
  } as React.CSSProperties,

  checkRow: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: "#fff",
  } as React.CSSProperties,

  presetList: {
    display: "grid",
    gap: 12,
    marginTop: 14,
  } as React.CSSProperties,

  presetCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 16,
  } as React.CSSProperties,

  presetTitle: {
    fontSize: 16,
    fontWeight: 950,
    color: "#0f172a",
  } as React.CSSProperties,

  presetText: {
    marginTop: 8,
    color: "#475569",
    fontWeight: 700,
    lineHeight: 1.5,
    fontSize: 14,
  } as React.CSSProperties,

  chipRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  } as React.CSSProperties,

  chip: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 10px",
    borderRadius: 999,
    background: "#fff",
    border: "1px solid #dbe1ea",
    color: "#0f172a",
    fontSize: 12,
    fontWeight: 900,
  } as React.CSSProperties,

  chipAccent: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 10px",
    borderRadius: 999,
    background: "#eef2ff",
    border: "1px solid #c7d2fe",
    color: "#4338ca",
    fontSize: 12,
    fontWeight: 900,
  } as React.CSSProperties,

  preview: {
    marginTop: 12,
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 14,
    background: "#fff",
  } as React.CSSProperties,

  previewTitle: {
    fontSize: 17,
    fontWeight: 950,
    color: "#0f172a",
  } as React.CSSProperties,

  previewText: {
    marginTop: 10,
    color: "#334155",
    fontWeight: 700,
    lineHeight: 1.6,
    fontSize: 14,
  } as React.CSSProperties,

  info: {
    marginTop: 12,
    borderRadius: 12,
    border: "1px solid #bfdbfe",
    background: "#eff6ff",
    padding: 10,
    color: "#1d4ed8",
    fontWeight: 900,
  } as React.CSSProperties,

  warn: {
    marginTop: 12,
    borderRadius: 12,
    border: "1px solid #fde68a",
    background: "#fffbeb",
    padding: 10,
    color: "#92400e",
    fontWeight: 900,
  } as React.CSSProperties,

  err: {
    marginTop: 12,
    borderRadius: 12,
    border: "1px solid #fecaca",
    background: "#fff1f2",
    padding: 10,
    color: "#9f1239",
    fontWeight: 900,
  } as React.CSSProperties,
};

export default function ReportPresetsPage() {
  const router = useRouter();
  const { studentName, activeStudentId } = useActiveStudent();

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

        if (!r.error) {
          setPresets((r.data ?? []) as ReportPresetRow[]);
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

  function toggleSection(key: SectionKey) {
    setSections((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]
    );
  }

  async function savePreset() {
    if (!safe(name)) {
      setErr("Please give the preset a name.");
      return;
    }

    setBusy(true);
    setErr("");
    setMsg("");

    try {
      const payload = {
        student_id: activeStudentId || null,
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

  function loadPresetIntoEditor(preset: ReportPresetRow) {
    setName(safe(preset.name));
    setTemplate((safe(preset.template_key) || "homeschool_registration") as TemplateKey);
    setDateFrom(safe(preset.date_from) || "");
    setDateTo(safe(preset.date_to) || "");
    setSections(toSectionArray(preset.sections));
    setNotes(safe(preset.notes));
    setMsg(`Loaded preset: ${safe(preset.name)}`);
    setErr("");
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

  function requireChild(next: () => void) {
    if (!activeStudentId) {
      router.push("/children");
      return;
    }
    next();
  }

  const selectedTemplateLabel =
    templateOptions.find((t) => t.key === template)?.label || template;

  const previewSections = useMemo(() => {
    return sections;
  }, [sections]);

  return (
    <div style={S.shell}>
      <div style={S.wrap}>
        <ActiveChildContextBar
          showOpenProfile={true}
          showOpenPortfolio={true}
          showAddEvidence={true}
        />

        <section style={S.hero}>
          <div style={S.subtle}>Report Presets</div>
          <h1 style={S.h1}>Saved report presets</h1>
          <div style={S.lead}>
            Save reusable report setups so parents can quickly return to familiar
            reporting formats without rebuilding the configuration each time.
          </div>

          <div style={S.callout}>
            This page now supports the full report section set, including student details,
            evidence type summary, and parent declaration.
          </div>

          <div style={S.btnRow}>
            <button style={S.btn} onClick={() => router.push("/reports")}>
              Back to report generator
            </button>
            <button style={S.btn} onClick={() => router.push("/exports/templates")}>
              Back to templates
            </button>
            <button style={S.btnPrimary} onClick={() => router.push("/exports")}>
              Exports launcher
            </button>
          </div>

          {!activeStudentId ? (
            <div style={S.warn}>
              No active child selected yet. Choose a child first so presets can be used in context.
            </div>
          ) : null}

          {loadingPresets ? <div style={S.info}>Loading presets…</div> : null}
          {msg ? <div style={S.info}>{msg}</div> : null}
          {err ? <div style={S.err}>{err}</div> : null}
        </section>

        <section style={S.grid2}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Create a preset</div>
            <div style={S.sectionText}>
              Save a reusable reporting combination for this family workflow.
            </div>

            <div style={S.fieldGrid}>
              <div style={S.field}>
                <label style={S.label}>Preset name</label>
                <input
                  style={S.input}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Term 1 Authority Report"
                />
              </div>

              <div style={S.field}>
                <label style={S.label}>Template</label>
                <select
                  style={S.input}
                  value={template}
                  onChange={(e) => setTemplate(e.target.value as TemplateKey)}
                >
                  {templateOptions.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={S.fieldRow2}>
                <div style={S.field}>
                  <label style={S.label}>Date from</label>
                  <input
                    style={S.input}
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>

                <div style={S.field}>
                  <label style={S.label}>Date to</label>
                  <input
                    style={S.input}
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>

              <div style={S.field}>
                <label style={S.label}>Notes</label>
                <textarea
                  style={S.textarea}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional reminder about audience, tone, or purpose."
                />
              </div>

              <div>
                <div style={S.label}>Included sections</div>
                <div style={S.checklist}>
                  {sectionOptions.map((section) => (
                    <label key={section.key} style={S.checkRow}>
                      <input
                        type="checkbox"
                        checked={sections.includes(section.key)}
                        onChange={() => toggleSection(section.key)}
                      />
                      <div>
                        <div style={{ fontWeight: 900, color: "#0f172a" }}>{section.label}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div style={S.btnRow}>
              <button style={S.btnPrimary} onClick={savePreset} disabled={busy}>
                {busy ? "Saving…" : "Save preset"}
              </button>

              <button
                style={S.btn}
                onClick={() => requireChild(() => router.push("/reports"))}
                disabled={busy}
              >
                Use in report generator
              </button>
            </div>
          </div>

          <div style={S.card}>
            <div style={S.sectionTitle}>Preset preview</div>
            <div style={S.sectionText}>
              A quick summary of the current preset configuration.
            </div>

            <div style={S.preview}>
              <div style={S.previewTitle}>{safe(name) || "Untitled preset"}</div>
              <div style={S.previewText}>
                Child: <strong>{studentName || "No child selected"}</strong>
              </div>
              <div style={S.previewText}>
                Template: <strong>{selectedTemplateLabel}</strong>
              </div>
              <div style={S.previewText}>
                Timeframe: <strong>{dateFrom} → {dateTo}</strong>
              </div>
              <div style={S.previewText}>
                Sections: <strong>{previewSections.length}</strong>
              </div>

              <div style={S.chipRow}>
                <span style={S.chipAccent}>{selectedTemplateLabel}</span>
                {previewSections.map((section) => (
                  <span key={section} style={S.chip}>
                    {section}
                  </span>
                ))}
              </div>
            </div>

            <div style={S.info}>
              These presets are stored in Supabase and can be reused across sessions.
            </div>
          </div>
        </section>

        <section style={S.grid3}>
          <div style={{ ...S.card, gridColumn: "1 / span 2" }}>
            <div style={S.sectionTitle}>Saved presets</div>
            <div style={S.sectionText}>
              Reuse these whenever you want to rebuild a familiar type of report.
            </div>

            <div style={S.presetList}>
              {presets.length ? (
                presets.map((preset) => {
                  const templateLabel =
                    templateOptions.find((t) => t.key === preset.template_key)?.label ||
                    safe(preset.template_key);

                  const presetSections = toSectionArray(preset.sections);

                  return (
                    <div key={preset.id} style={S.presetCard}>
                      <div style={S.presetTitle}>{safe(preset.name) || "Untitled preset"}</div>
                      <div style={S.presetText}>
                        {templateLabel} • {safe(preset.date_from) || "—"} → {safe(preset.date_to) || "—"}
                      </div>

                      {safe(preset.notes) ? (
                        <div style={S.presetText}>{safe(preset.notes)}</div>
                      ) : null}

                      <div style={S.chipRow}>
                        <span style={S.chipAccent}>{templateLabel}</span>
                        {presetSections.map((section) => (
                          <span key={section} style={S.chip}>
                            {section}
                          </span>
                        ))}
                      </div>

                      <div style={S.btnRow}>
                        <button
                          style={S.btn}
                          onClick={() => loadPresetIntoEditor(preset)}
                        >
                          Load into editor
                        </button>

                        <button
                          style={S.btnPrimary}
                          onClick={() =>
                            requireChild(() =>
                              router.push(`/reports?preset=${encodeURIComponent(preset.id)}`)
                            )
                          }
                        >
                          Use preset
                        </button>

                        <button
                          style={S.btn}
                          onClick={() => deletePreset(preset.id)}
                          disabled={busy}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={S.preview}>
                  <div style={S.previewTitle}>No saved presets yet</div>
                  <div style={S.previewText}>
                    Save your first preset to speed up repeat reporting workflows.
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={S.card}>
            <div style={S.sectionTitle}>Why presets matter</div>
            <div style={S.sectionText}>
              Parents often repeat the same reporting pattern each term. Presets reduce friction and make EduDecks feel operational rather than experimental.
            </div>

            <div style={S.chipRow}>
              <span style={S.chip}>Repeatable workflows</span>
              <span style={S.chip}>Less setup time</span>
              <span style={S.chip}>Consistency</span>
              <span style={S.chip}>Confidence</span>
            </div>

            <div style={S.info}>
              Best examples: Term report, authority review pack, Christian portfolio summary.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}