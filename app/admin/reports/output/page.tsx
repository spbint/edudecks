"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLeftNav from "@/app/components/AdminLeftNav";
import { supabase } from "@/lib/supabaseClient";

/* ───────────────────────── TYPES ───────────────────────── */

type ClassRow = {
  id: string;
  name?: string | null;
  year_level?: number | null;
  teacher_name?: string | null;
  room?: string | null;
  [k: string]: any;
};

type StudentRow = {
  id: string;
  class_id?: string | null;
  first_name?: string | null;
  preferred_name?: string | null;
  surname?: string | null;
  family_name?: string | null;
  last_name?: string | null;
  is_ilp?: boolean | null;
  [k: string]: any;
};

type EvidenceEntryRow = {
  id: string;
  student_id?: string | null;
  class_id?: string | null;
  title?: string | null;
  summary?: string | null;
  body?: string | null;
  learning_area?: string | null;
  occurred_on?: string | null;
  created_at?: string | null;
  is_deleted?: boolean | null;
  [k: string]: any;
};

type InterventionRow = {
  id: string;
  student_id?: string | null;
  class_id?: string | null;
  title?: string | null;
  status?: string | null;
  review_due_on?: string | null;
  review_due_date?: string | null;
  next_review_on?: string | null;
  due_on?: string | null;
  [k: string]: any;
};

type OutputMode =
  | "school"
  | "family"
  | "student"
  | "class"
  | "print"
  | "compliance";

type ArtifactType =
  | "final_pdf_pack"
  | "printable_bundle"
  | "zipped_evidence_pack"
  | "slide_deck_export"
  | "signed_reporting_release";

type ReleaseStage =
  | "draft"
  | "review"
  | "approved"
  | "published"
  | "archived";

type ValidationSeverity = "pass" | "watch" | "block";

type ValidationCheck = {
  id: string;
  title: string;
  severity: ValidationSeverity;
  text: string;
};

type GeneratedArtifact = {
  id: string;
  type: ArtifactType;
  title: string;
  targetLabel: string;
  mode: OutputMode;
  stage: ReleaseStage;
  createdAt: string;
  locked: boolean;
  content: string;
  manifest: string[];
  validations: ValidationCheck[];
};

type PublishHistoryRow = {
  id: string;
  artifactId: string;
  title: string;
  type: ArtifactType;
  targetLabel: string;
  mode: OutputMode;
  stage: ReleaseStage;
  timestamp: string;
};

type StudentOutputRow = {
  studentId: string;
  studentName: string;
  evidenceCount: number;
  narrativeCount: number;
  missingAreas: string[];
  fragile: boolean;
  overdueReviews: number;
  highlights: string[];
};

type ReleaseState = {
  stage: ReleaseStage;
  locked: boolean;
};

type ArtifactStore = Record<string, GeneratedArtifact>;
type PublishHistoryStore = PublishHistoryRow[];

/* ───────────────────────── HELPERS ───────────────────────── */

function safe(v: any) {
  return String(v ?? "").trim();
}

function clip(v: string | null | undefined, max = 120) {
  const s = safe(v);
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function studentDisplayName(s: StudentRow | null | undefined) {
  if (!s) return "Student";
  const first = safe(s.preferred_name) || safe(s.first_name);
  const sur = safe(s.surname || s.family_name || s.last_name);
  return `${first}${sur ? ` ${sur}` : ""}`.trim() || "Student";
}

function isoNow() {
  return new Date().toISOString();
}

function shortDate(v: string | null | undefined) {
  const s = safe(v);
  if (!s) return "—";
  try {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s.slice(0, 10);
    return d.toISOString().slice(0, 10);
  } catch {
    return s.slice(0, 10);
  }
}

function daysSince(v: string | null | undefined) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
}

function isClosedStatus(status: string | null | undefined) {
  const s = safe(status).toLowerCase();
  return ["closed", "done", "resolved", "archived", "completed"].includes(s);
}

function pickReviewDate(iv: InterventionRow) {
  return (
    safe(iv.review_due_on) ||
    safe(iv.review_due_date) ||
    safe(iv.next_review_on) ||
    safe(iv.due_on) ||
    ""
  );
}

function isMissingRelationOrColumn(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && (msg.includes("relation") || msg.includes("column"));
}

function guessArea(raw: string | null | undefined) {
  const x = safe(raw).toLowerCase();
  if (x.includes("math")) return "Maths";
  if (x.includes("liter") || x.includes("reading") || x.includes("writing") || x.includes("english")) return "Literacy";
  if (x.includes("science")) return "Science";
  if (x.includes("well") || x.includes("pastoral") || x.includes("social") || x.includes("behaviour") || x.includes("behavior")) return "Wellbeing";
  if (x.includes("human") || x.includes("history") || x.includes("geography") || x.includes("hass")) return "Humanities";
  return "Other";
}

function stageTone(stage: ReleaseStage) {
  if (stage === "published") return { bg: "#ecfdf5", bd: "#bbf7d0", fg: "#166534" };
  if (stage === "approved") return { bg: "#eff6ff", bd: "#bfdbfe", fg: "#1d4ed8" };
  if (stage === "review") return { bg: "#fffbeb", bd: "#fde68a", fg: "#92400e" };
  if (stage === "archived") return { bg: "#f8fafc", bd: "#e2e8f0", fg: "#475569" };
  return { bg: "#fff1f2", bd: "#fecaca", fg: "#9f1239" };
}

function validationTone(severity: ValidationSeverity) {
  if (severity === "pass") return { bg: "#ecfdf5", bd: "#bbf7d0", fg: "#166534" };
  if (severity === "watch") return { bg: "#fffbeb", bd: "#fde68a", fg: "#92400e" };
  return { bg: "#fff1f2", bd: "#fecaca", fg: "#9f1239" };
}

function artifactTypeLabel(t: ArtifactType) {
  if (t === "final_pdf_pack") return "Final PDF pack";
  if (t === "printable_bundle") return "Printable bundle";
  if (t === "zipped_evidence_pack") return "Zipped evidence pack";
  if (t === "slide_deck_export") return "Slide deck export";
  return "Signed reporting release";
}

function modeLabel(mode: OutputMode) {
  if (mode === "school") return "School";
  if (mode === "family") return "Family";
  if (mode === "student") return "Student";
  if (mode === "class") return "Class";
  if (mode === "print") return "Print";
  return "Compliance";
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function artifactKey(classId: string) {
  return `edudecks.output.artifacts.${classId}`;
}

function historyKey(classId: string) {
  return `edudecks.output.history.${classId}`;
}

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
}

/* ───────────────────────── STYLES ───────────────────────── */

const S = {
  shell: {
    display: "flex",
    minHeight: "100vh",
    background: "#f6f7fb",
  } as React.CSSProperties,

  main: {
    flex: 1,
    width: "100%",
    maxWidth: 1640,
    margin: "0 auto",
    padding: 22,
  } as React.CSSProperties,

  hero: {
    border: "1px solid #e8eaf0",
    borderRadius: 24,
    background: "linear-gradient(135deg, rgba(17,24,39,0.08), rgba(16,185,129,0.10))",
    padding: 18,
  } as React.CSSProperties,

  subtle: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  } as React.CSSProperties,

  h1: {
    fontSize: 38,
    fontWeight: 950,
    lineHeight: 1.05,
    marginTop: 8,
    color: "#0f172a",
  } as React.CSSProperties,

  sub: {
    marginTop: 8,
    color: "#475569",
    fontSize: 13,
    fontWeight: 800,
    lineHeight: 1.45,
  } as React.CSSProperties,

  topBar: {
    display: "grid",
    gridTemplateColumns: "1fr 0.95fr 0.95fr auto auto",
    gap: 12,
    marginTop: 14,
  } as React.CSSProperties,

  select: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 800,
    outline: "none",
  } as React.CSSProperties,

  btn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 900,
    cursor: "pointer",
  } as React.CSSProperties,

  btnPrimary: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #111827",
    background: "#111827",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  } as React.CSSProperties,

  tiles: {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(130px, 1fr))",
    gap: 12,
    marginTop: 14,
  } as React.CSSProperties,

  tile: {
    border: "1px solid #e8eaf0",
    borderRadius: 16,
    background: "#fff",
    padding: 14,
    minHeight: 92,
  } as React.CSSProperties,

  tileK: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: 900,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  } as React.CSSProperties,

  tileV: {
    marginTop: 6,
    fontSize: 28,
    color: "#0f172a",
    fontWeight: 950,
    lineHeight: 1.05,
  } as React.CSSProperties,

  tileS: {
    marginTop: 8,
    fontSize: 12,
    color: "#475569",
    fontWeight: 800,
    lineHeight: 1.35,
  } as React.CSSProperties,

  grid: {
    display: "grid",
    gridTemplateColumns: "390px 1fr",
    gap: 14,
    marginTop: 14,
    alignItems: "start",
  } as React.CSSProperties,

  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
    marginTop: 14,
  } as React.CSSProperties,

  card: {
    border: "1px solid #e8eaf0",
    borderRadius: 18,
    background: "#fff",
  } as React.CSSProperties,

  sectionPad: {
    padding: 16,
  } as React.CSSProperties,

  sectionTitle: {
    fontSize: 18,
    fontWeight: 950,
    color: "#0f172a",
  } as React.CSSProperties,

  sectionHelp: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 1.45,
    color: "#64748b",
    fontWeight: 800,
  } as React.CSSProperties,

  list: {
    display: "grid",
    gap: 10,
    marginTop: 12,
  } as React.CSSProperties,

  item: {
    border: "1px solid #edf2f7",
    borderRadius: 14,
    background: "#fff",
    padding: 12,
  } as React.CSSProperties,

  itemTitle: {
    fontWeight: 950,
    color: "#0f172a",
    fontSize: 15,
    lineHeight: 1.3,
  } as React.CSSProperties,

  itemText: {
    marginTop: 8,
    color: "#475569",
    fontWeight: 800,
    lineHeight: 1.45,
  } as React.CSSProperties,

  chip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#fff",
    fontSize: 12,
    fontWeight: 900,
    color: "#0f172a",
    whiteSpace: "nowrap",
  } as React.CSSProperties,

  chipMuted: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    fontSize: 12,
    fontWeight: 900,
    color: "#475569",
    whiteSpace: "nowrap",
  } as React.CSSProperties,

  row: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  } as React.CSSProperties,

  pre: {
    width: "100%",
    minHeight: 280,
    padding: 14,
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    color: "#0f172a",
    fontWeight: 700,
    lineHeight: 1.5,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    whiteSpace: "pre-wrap",
  } as React.CSSProperties,

  ok: {
    marginTop: 12,
    borderRadius: 14,
    border: "1px solid #a7f3d0",
    background: "#ecfdf5",
    padding: 12,
    color: "#065f46",
    fontWeight: 900,
    fontSize: 13,
  } as React.CSSProperties,

  err: {
    marginTop: 12,
    borderRadius: 14,
    border: "1px solid #fecaca",
    background: "#fff1f2",
    padding: 12,
    color: "#9f1239",
    fontWeight: 900,
    fontSize: 13,
    lineHeight: 1.45,
  } as React.CSSProperties,
};

/* ───────────────────────── PAGE ───────────────────────── */

export default function ReportsOutputPage() {
  const router = useRouter();

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [evidenceEntries, setEvidenceEntries] = useState<EvidenceEntryRow[]>([]);
  const [interventions, setInterventions] = useState<InterventionRow[]>([]);

  const [classId, setClassId] = useState("");
  const [mode, setMode] = useState<OutputMode>("class");
  const [artifactType, setArtifactType] = useState<ArtifactType>("final_pdf_pack");
  const [selectedArtifactId, setSelectedArtifactId] = useState("");

  const [artifactStore, setArtifactStore] = useState<ArtifactStore>({});
  const [publishHistory, setPublishHistory] = useState<PublishHistoryStore>([]);

  async function loadClasses() {
    const tries = [
      "id,name,year_level,teacher_name,room",
      "id,name,year_level,teacher_name",
      "id,name,year_level",
      "id,name",
    ];

    for (const sel of tries) {
      const r = await supabase.from("classes").select(sel).order("year_level").order("name");
      if (!r.error) {
        const rows = ((r.data as any[]) ?? []) as ClassRow[];
        setClasses(rows);
        if (!classId && rows.length) setClassId(rows[0].id);
        return;
      }
      if (!isMissingRelationOrColumn(r.error)) throw r.error;
    }

    setClasses([]);
  }

  async function loadStudents(selectedClassId: string) {
    const tries = [
      "id,class_id,first_name,preferred_name,surname,family_name,last_name,is_ilp",
      "id,class_id,first_name,preferred_name,surname,family_name,is_ilp",
      "id,class_id,first_name,preferred_name,surname,is_ilp",
      "id,class_id,first_name,preferred_name,is_ilp",
    ];

    for (const sel of tries) {
      const r = await supabase.from("students").select(sel).eq("class_id", selectedClassId);
      if (!r.error) {
        setStudents(((r.data as any[]) ?? []) as StudentRow[]);
        return;
      }
      if (!isMissingRelationOrColumn(r.error)) throw r.error;
    }

    setStudents([]);
  }

  async function loadEvidence(selectedClassId: string) {
    const tries = [
      "id,student_id,class_id,title,summary,body,learning_area,occurred_on,created_at,is_deleted",
      "id,student_id,class_id,title,learning_area,occurred_on,created_at,is_deleted",
      "id,student_id,class_id,learning_area,occurred_on,created_at,is_deleted",
    ];

    for (const sel of tries) {
      const r = await supabase
        .from("evidence_entries")
        .select(sel)
        .eq("class_id", selectedClassId)
        .eq("is_deleted", false)
        .limit(8000);

      if (!r.error) {
        setEvidenceEntries(((r.data as any[]) ?? []) as EvidenceEntryRow[]);
        return;
      }
      if (!isMissingRelationOrColumn(r.error)) throw r.error;
    }

    setEvidenceEntries([]);
  }

  async function loadInterventions(selectedClassId: string) {
    const tries = [
      "id,student_id,class_id,title,status,review_due_on,review_due_date,next_review_on,due_on",
      "id,student_id,class_id,status,review_due_on,review_due_date,next_review_on,due_on",
      "*",
    ];

    for (const sel of tries) {
      const r = await supabase.from("interventions").select(sel).eq("class_id", selectedClassId).limit(5000);
      if (!r.error) {
        setInterventions(((r.data as any[]) ?? []) as InterventionRow[]);
        return;
      }
      if (!isMissingRelationOrColumn(r.error)) throw r.error;
    }

    setInterventions([]);
  }

  async function loadAll(selectedClassId: string) {
    if (!selectedClassId) return;

    setBusy(true);
    setErr(null);

    try {
      await Promise.all([
        loadStudents(selectedClassId),
        loadEvidence(selectedClassId),
        loadInterventions(selectedClassId),
      ]);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadClasses().catch((e) => setErr(String(e?.message ?? e)));
  }, []);

  useEffect(() => {
    if (!classId) return;
    loadAll(classId);
  }, [classId]);

  useEffect(() => {
    if (!classId || typeof window === "undefined") return;
    setArtifactStore(safeParse<ArtifactStore>(window.localStorage.getItem(artifactKey(classId)), {}));
    setPublishHistory(safeParse<PublishHistoryStore>(window.localStorage.getItem(historyKey(classId)), []));
  }, [classId]);

  function persistArtifacts(next: ArtifactStore) {
    setArtifactStore(next);
    if (typeof window !== "undefined" && classId) {
      window.localStorage.setItem(artifactKey(classId), JSON.stringify(next));
    }
  }

  function persistHistory(next: PublishHistoryStore) {
    setPublishHistory(next);
    if (typeof window !== "undefined" && classId) {
      window.localStorage.setItem(historyKey(classId), JSON.stringify(next));
    }
  }

  const selectedClass = useMemo(
    () => classes.find((c) => c.id === classId) ?? null,
    [classes, classId]
  );

  const studentOutputs = useMemo<StudentOutputRow[]>(() => {
    return students.map((s) => {
      const studentEvidence = evidenceEntries
        .filter((e) => safe(e.student_id) === s.id)
        .sort((a, b) => safe(b.occurred_on || b.created_at).localeCompare(safe(a.occurred_on || a.created_at)));

      const studentPlans = interventions.filter((iv) => safe(iv.student_id) === s.id);

      const areas = ["Maths", "Literacy", "Science", "Wellbeing", "Humanities", "Other"];
      const areaCounts = new Map<string, number>();
      for (const area of areas) areaCounts.set(area, 0);

      for (const e of studentEvidence) {
        const area = guessArea(e.learning_area);
        areaCounts.set(area, (areaCounts.get(area) ?? 0) + 1);
      }

      const missingAreas = areas.filter((a) => (areaCounts.get(a) ?? 0) === 0);
      const overdueReviews = studentPlans.filter((iv) => {
        if (isClosedStatus(iv.status)) return false;
        const review = pickReviewDate(iv);
        return review ? (daysSince(review) ?? 0) > 0 : false;
      }).length;

      const narrativeCount = studentEvidence.filter((e) => safe(e.summary) || safe(e.body)).length;
      const fragile =
        studentEvidence.length < 2 ||
        missingAreas.length >= 2 ||
        overdueReviews > 0 ||
        narrativeCount < 2;

      const highlights = studentEvidence
        .slice(0, 3)
        .map((e) => safe(e.title) || clip(safe(e.summary || e.body), 80))
        .filter(Boolean);

      return {
        studentId: s.id,
        studentName: studentDisplayName(s),
        evidenceCount: studentEvidence.length,
        narrativeCount,
        missingAreas,
        fragile,
        overdueReviews,
        highlights,
      };
    });
  }, [students, evidenceEntries, interventions]);

  const validationChecks = useMemo<ValidationCheck[]>(() => {
    const missingEvidenceCount = studentOutputs.filter((s) => s.evidenceCount < 2).length;
    const fragileCount = studentOutputs.filter((s) => s.fragile).length;
    const narrativeRiskCount = studentOutputs.filter((s) => s.narrativeCount < 2).length;
    const complianceAppendixMissing = mode === "compliance" && artifactType !== "signed_reporting_release";
    const formattingRisk = artifactType === "slide_deck_export" && mode === "compliance";

    const checks: ValidationCheck[] = [
      {
        id: "missing_evidence",
        title: "Missing evidence check",
        severity: missingEvidenceCount === 0 ? "pass" : missingEvidenceCount <= 2 ? "watch" : "block",
        text:
          missingEvidenceCount === 0
            ? "All learners have minimum evidence coverage for output generation."
            : `${missingEvidenceCount} learners have weak evidence volume and may compromise output quality.`,
      },
      {
        id: "fragile_readiness",
        title: "Fragile readiness check",
        severity: fragileCount === 0 ? "pass" : fragileCount <= 3 ? "watch" : "block",
        text:
          fragileCount === 0
            ? "No fragile readiness cases detected in the current output scope."
            : `${fragileCount} learners are fragile and may weaken release confidence.`,
      },
      {
        id: "narrative_gap",
        title: "Narrative gap check",
        severity: narrativeRiskCount === 0 ? "pass" : narrativeRiskCount <= 3 ? "watch" : "block",
        text:
          narrativeRiskCount === 0
            ? "Narrative evidence is broadly sufficient for report commentary."
            : `${narrativeRiskCount} learners have weak descriptive evidence, which may affect narrative quality.`,
      },
      {
        id: "compliance_appendix",
        title: "Compliance appendix check",
        severity: complianceAppendixMissing ? "watch" : "pass",
        text: complianceAppendixMissing
          ? "Compliance mode is selected, but the current artifact type does not naturally include a signed compliance appendix."
          : "Compliance appendix expectations are aligned with the selected output setup.",
      },
      {
        id: "formatting_risk",
        title: "Formatting risk check",
        severity: formattingRisk ? "watch" : "pass",
        text: formattingRisk
          ? "Slide deck export in compliance mode may not satisfy formal submission expectations."
          : "No major formatting risk is detected for the current mode/artifact pairing.",
      },
    ];

    return checks;
  }, [studentOutputs, mode, artifactType]);

  function buildManifest(): string[] {
    const base = [
      `Output mode: ${modeLabel(mode)}`,
      `Artifact type: ${artifactTypeLabel(artifactType)}`,
      `Target class: ${safe(selectedClass?.name) || "Class"}`,
      `Student count: ${studentOutputs.length}`,
      `Generated at: ${isoNow()}`,
    ];

    if (artifactType === "final_pdf_pack") {
      return [...base, "Cover page", "Class summary", "Student reports", "Appendix / evidence index"];
    }
    if (artifactType === "printable_bundle") {
      return [...base, "Print cover", "Teacher comments", "Student sections", "Checklist"];
    }
    if (artifactType === "zipped_evidence_pack") {
      return [...base, "Evidence manifest", "Student folders", "Evidence summaries", "Audit note"];
    }
    if (artifactType === "slide_deck_export") {
      return [...base, "Title slide", "Class overview", "Student slides", "Action summary"];
    }
    return [...base, "Signed release cover", "Submission note", "Readiness summary", "Compliance appendix"];
  }

  function buildArtifactContent(): string {
    const classLabel = safe(selectedClass?.name) || "Class";
    const headline = studentOutputs.length
      ? `${studentOutputs.length} learners in current output scope.`
      : "No learners in current output scope.";

    const studentLines = studentOutputs
      .slice(0, 10)
      .map((s) => {
        const status = s.fragile ? "Fragile" : "Stable";
        const gaps = s.missingAreas.length ? `Missing: ${s.missingAreas.join(", ")}` : "Coverage present";
        return `• ${s.studentName} — ${status}. Evidence ${s.evidenceCount}. ${gaps}.`;
      })
      .join("\n");

    if (artifactType === "final_pdf_pack") {
      return `FINAL PDF PACK\n\nClass: ${classLabel}\nMode: ${modeLabel(mode)}\n\n${headline}\n\nStudent summary:\n${studentLines}`;
    }

    if (artifactType === "printable_bundle") {
      return `PRINTABLE BUNDLE\n\nClass: ${classLabel}\nMode: ${modeLabel(mode)}\n\nReady for print distribution.\n\nLearner notes:\n${studentLines}`;
    }

    if (artifactType === "zipped_evidence_pack") {
      return `ZIPPED EVIDENCE PACK\n\nClass: ${classLabel}\nMode: ${modeLabel(mode)}\n\nEvidence export manifest:\n${studentLines}`;
    }

    if (artifactType === "slide_deck_export") {
      return `SLIDE DECK EXPORT\n\nClass: ${classLabel}\nMode: ${modeLabel(mode)}\n\nPresentation-ready reporting summary:\n${studentLines}`;
    }

    return `SIGNED REPORTING RELEASE\n\nClass: ${classLabel}\nMode: ${modeLabel(mode)}\n\nFormal release summary:\n${studentLines}`;
  }

  function createArtifact() {
    if (!classId) return;

    const id = makeId("artifact");
    const artifact: GeneratedArtifact = {
      id,
      type: artifactType,
      title: `${artifactTypeLabel(artifactType)} — ${safe(selectedClass?.name) || "Class"}`,
      targetLabel: safe(selectedClass?.name) || "Class",
      mode,
      stage: "draft",
      createdAt: isoNow(),
      locked: false,
      content: buildArtifactContent(),
      manifest: buildManifest(),
      validations: validationChecks,
    };

    const next = {
      ...artifactStore,
      [id]: artifact,
    };

    persistArtifacts(next);
    setSelectedArtifactId(id);
    setOk("Artifact generated successfully.");
    setTimeout(() => setOk(null), 1500);
  }

  function updateArtifactStage(id: string, stage: ReleaseStage) {
    const current = artifactStore[id];
    if (!current) return;

    if (current.locked && stage !== "archived") {
      setErr("This artifact is locked. Unlock it first if you need to change its release stage.");
      return;
    }

    const nextArtifact = {
      ...current,
      stage,
    };

    const nextStore = {
      ...artifactStore,
      [id]: nextArtifact,
    };

    persistArtifacts(nextStore);

    const event: PublishHistoryRow = {
      id: makeId("history"),
      artifactId: id,
      title: nextArtifact.title,
      type: nextArtifact.type,
      targetLabel: nextArtifact.targetLabel,
      mode: nextArtifact.mode,
      stage,
      timestamp: isoNow(),
    };

    persistHistory([event, ...publishHistory].slice(0, 50));
    setOk(`Artifact moved to ${stage}.`);
    setTimeout(() => setOk(null), 1400);
  }

  function toggleLock(id: string) {
    const current = artifactStore[id];
    if (!current) return;

    const nextStore = {
      ...artifactStore,
      [id]: {
        ...current,
        locked: !current.locked,
      },
    };

    persistArtifacts(nextStore);
    setOk(current.locked ? "Artifact unlocked." : "Artifact locked.");
    setTimeout(() => setOk(null), 1400);
  }

  const artifactList = useMemo(() => {
    return Object.values(artifactStore)
      .sort((a, b) => safe(b.createdAt).localeCompare(safe(a.createdAt)));
  }, [artifactStore]);

  useEffect(() => {
    if (!selectedArtifactId && artifactList.length) {
      setSelectedArtifactId(artifactList[0].id);
    }
  }, [artifactList, selectedArtifactId]);

  const selectedArtifact = useMemo(() => {
    return artifactStore[selectedArtifactId] ?? artifactList[0] ?? null;
  }, [artifactStore, selectedArtifactId, artifactList]);

  const headline = useMemo(() => {
    const totalArtifacts = artifactList.length;
    const published = artifactList.filter((a) => a.stage === "published").length;
    const approved = artifactList.filter((a) => a.stage === "approved").length;
    const draft = artifactList.filter((a) => a.stage === "draft").length;
    const blocked = validationChecks.filter((v) => v.severity === "block").length;
    const watch = validationChecks.filter((v) => v.severity === "watch").length;
    return { totalArtifacts, published, approved, draft, blocked, watch };
  }, [artifactList, validationChecks]);

  return (
    <div style={S.shell}>
      <AdminLeftNav />

      <main style={S.main}>
        <section style={S.hero}>
          <div style={S.subtle}>Reports</div>
          <div style={S.h1}>Output Release & Artifact Engine</div>
          <div style={S.sub}>
            Generate real output artifacts, validate them before release, move them through draft-to-published workflow, and maintain a durable publish history for reporting season.
          </div>

          <div style={S.topBar}>
            <div>
              <label style={{ display: "block", fontWeight: 950, marginBottom: 6 }}>Class</label>
              <select value={classId} onChange={(e) => setClassId(e.target.value)} style={S.select}>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {safe(c.name) || "Class"} {c.year_level != null ? `(${c.year_level})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontWeight: 950, marginBottom: 6 }}>Output mode</label>
              <select value={mode} onChange={(e) => setMode(e.target.value as OutputMode)} style={S.select}>
                <option value="school">School</option>
                <option value="family">Family</option>
                <option value="student">Student</option>
                <option value="class">Class</option>
                <option value="print">Print</option>
                <option value="compliance">Compliance</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontWeight: 950, marginBottom: 6 }}>Artifact type</label>
              <select
                value={artifactType}
                onChange={(e) => setArtifactType(e.target.value as ArtifactType)}
                style={S.select}
              >
                <option value="final_pdf_pack">Final PDF pack</option>
                <option value="printable_bundle">Printable report bundle</option>
                <option value="zipped_evidence_pack">Zipped evidence pack</option>
                <option value="slide_deck_export">Slide deck export</option>
                <option value="signed_reporting_release">Signed-off reporting release</option>
              </select>
            </div>

            <button type="button" style={{ ...S.btnPrimary, alignSelf: "end" }} onClick={createArtifact}>
              Generate artifact
            </button>

            <button type="button" style={{ ...S.btn, alignSelf: "end" }} onClick={() => router.push("/admin/reports/batch")}>
              Open batch
            </button>
          </div>

          {busy ? <div style={S.ok}>Loading output workspace…</div> : null}
          {err ? <div style={S.err}>Error: {err}</div> : null}
          {ok ? <div style={S.ok}>{ok}</div> : null}

          <div style={S.tiles}>
            <div style={S.tile}>
              <div style={S.tileK}>Artifacts</div>
              <div style={S.tileV}>{headline.totalArtifacts}</div>
              <div style={S.tileS}>Generated output artifacts in this class scope.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Published</div>
              <div style={S.tileV}>{headline.published}</div>
              <div style={S.tileS}>Release-complete artifacts.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Approved</div>
              <div style={S.tileV}>{headline.approved}</div>
              <div style={S.tileS}>Ready to publish when signed off.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Draft</div>
              <div style={S.tileV}>{headline.draft}</div>
              <div style={S.tileS}>Artifacts still in early release state.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Validation blocks</div>
              <div style={S.tileV}>{headline.blocked}</div>
              <div style={S.tileS}>Checks that should stop final release.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Validation watch</div>
              <div style={S.tileV}>{headline.watch}</div>
              <div style={S.tileS}>Warnings that deserve review before publish.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Learners</div>
              <div style={S.tileV}>{studentOutputs.length}</div>
              <div style={S.tileS}>Learners contributing to the current output scope.</div>
            </div>
          </div>
        </section>

        <div style={S.grid}>
          <section style={S.card}>
            <div style={S.sectionPad}>
              <div style={S.sectionTitle}>Generated artifacts</div>
              <div style={S.sectionHelp}>
                This page now holds the generated artifacts directly, not just the shell around them.
              </div>

              <div style={S.list}>
                {artifactList.length === 0 ? (
                  <div style={S.item}>
                    <div style={S.itemTitle}>No artifacts generated yet</div>
                    <div style={S.itemText}>
                      Generate a real artifact such as a PDF pack, printable bundle, zipped evidence pack, slide deck, or signed release.
                    </div>
                  </div>
                ) : (
                  artifactList.map((a) => {
                    const tone = stageTone(a.stage);
                    return (
                      <div
                        key={a.id}
                        style={{
                          ...S.item,
                          borderColor: a.id === selectedArtifact?.id ? "#1d4ed8" : "#edf2f7",
                          boxShadow: a.id === selectedArtifact?.id ? "0 0 0 2px rgba(29,78,216,0.10)" : "none",
                          cursor: "pointer",
                        }}
                        onClick={() => setSelectedArtifactId(a.id)}
                      >
                        <div style={{ ...S.row, justifyContent: "space-between" }}>
                          <div style={S.itemTitle}>{a.title}</div>
                          <span style={{ ...S.chip, background: tone.bg, borderColor: tone.bd, color: tone.fg }}>
                            {a.stage}
                          </span>
                        </div>
                        <div style={{ ...S.row, marginTop: 8 }}>
                          <span style={S.chipMuted}>{artifactTypeLabel(a.type)}</span>
                          <span style={S.chipMuted}>{modeLabel(a.mode)}</span>
                          <span style={S.chipMuted}>{shortDate(a.createdAt)}</span>
                          {a.locked ? <span style={S.chipMuted}>Locked</span> : null}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>

          <section style={S.card}>
            <div style={S.sectionPad}>
              <div style={{ ...S.row, justifyContent: "space-between" }}>
                <div>
                  <div style={S.sectionTitle}>
                    {selectedArtifact ? selectedArtifact.title : "Artifact preview"}
                  </div>
                  <div style={S.sectionHelp}>
                    Review content, manifest, validation, and release controls in one place.
                  </div>
                </div>
              </div>

              {selectedArtifact ? (
                <>
                  <div style={{ ...S.row, marginTop: 12 }}>
                    <span style={S.chipMuted}>{artifactTypeLabel(selectedArtifact.type)}</span>
                    <span style={S.chipMuted}>{modeLabel(selectedArtifact.mode)}</span>
                    <span style={S.chipMuted}>{selectedArtifact.targetLabel}</span>
                    <span style={S.chipMuted}>{shortDate(selectedArtifact.createdAt)}</span>
                    <span style={S.chipMuted}>{selectedArtifact.locked ? "Locked" : "Unlocked"}</span>
                  </div>

                  <div style={{ ...S.row, marginTop: 12 }}>
                    <button type="button" style={S.btn} onClick={() => updateArtifactStage(selectedArtifact.id, "draft")}>
                      Mark draft
                    </button>
                    <button type="button" style={S.btn} onClick={() => updateArtifactStage(selectedArtifact.id, "review")}>
                      Send to review
                    </button>
                    <button type="button" style={S.btn} onClick={() => updateArtifactStage(selectedArtifact.id, "approved")}>
                      Approve
                    </button>
                    <button type="button" style={S.btnPrimary} onClick={() => updateArtifactStage(selectedArtifact.id, "published")}>
                      Publish
                    </button>
                    <button type="button" style={S.btn} onClick={() => updateArtifactStage(selectedArtifact.id, "archived")}>
                      Archive
                    </button>
                    <button type="button" style={S.btn} onClick={() => toggleLock(selectedArtifact.id)}>
                      {selectedArtifact.locked ? "Unlock" : "Lock"}
                    </button>
                  </div>

                  <div style={{ marginTop: 14 }}>
                    <div style={S.sectionTitle}>Generated content</div>
                    <div style={S.sectionHelp}>
                      Direct integration with the generated artifact content lives here.
                    </div>
                    <pre style={S.pre}>{selectedArtifact.content}</pre>
                  </div>
                </>
              ) : (
                <div style={S.item}>
                  <div style={S.itemTitle}>No artifact selected</div>
                </div>
              )}
            </div>
          </section>
        </div>

        <div style={S.grid2}>
          <section style={S.card}>
            <div style={S.sectionPad}>
              <div style={S.sectionTitle}>Output quality validation</div>
              <div style={S.sectionHelp}>
                Before release, the system now validates evidence, fragile readiness, narrative gaps, compliance appendix expectations, and formatting risk.
              </div>

              <div style={S.list}>
                {validationChecks.map((check) => {
                  const tone = validationTone(check.severity);
                  return (
                    <div key={check.id} style={S.item}>
                      <div style={{ ...S.row, justifyContent: "space-between" }}>
                        <div style={S.itemTitle}>{check.title}</div>
                        <span style={{ ...S.chip, background: tone.bg, borderColor: tone.bd, color: tone.fg }}>
                          {check.severity}
                        </span>
                      </div>
                      <div style={S.itemText}>{check.text}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section style={S.card}>
            <div style={S.sectionPad}>
              <div style={S.sectionTitle}>Artifact manifest</div>
              <div style={S.sectionHelp}>
                Every artifact carries an inspectable manifest to support review, audit, and future signed releases.
              </div>

              <div style={S.list}>
                {(selectedArtifact?.manifest ?? buildManifest()).map((line, idx) => (
                  <div key={`${line}-${idx}`} style={S.item}>
                    <div style={S.itemText}>{line}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div style={S.grid2}>
          <section style={S.card}>
            <div style={S.sectionPad}>
              <div style={S.sectionTitle}>Durable publish history</div>
              <div style={S.sectionHelp}>
                Track what was exported, when it moved stages, for whom, in what mode, and at what sign-off point.
              </div>

              <div style={S.list}>
                {publishHistory.length === 0 ? (
                  <div style={S.item}>
                    <div style={S.itemTitle}>No publish history yet</div>
                    <div style={S.itemText}>Release events will appear here as artifacts move through workflow stages.</div>
                  </div>
                ) : (
                  publishHistory.map((row) => {
                    const tone = stageTone(row.stage);
                    return (
                      <div key={row.id} style={S.item}>
                        <div style={{ ...S.row, justifyContent: "space-between" }}>
                          <div style={S.itemTitle}>{row.title}</div>
                          <span style={{ ...S.chip, background: tone.bg, borderColor: tone.bd, color: tone.fg }}>
                            {row.stage}
                          </span>
                        </div>
                        <div style={{ ...S.row, marginTop: 8 }}>
                          <span style={S.chipMuted}>{artifactTypeLabel(row.type)}</span>
                          <span style={S.chipMuted}>{modeLabel(row.mode)}</span>
                          <span style={S.chipMuted}>{row.targetLabel}</span>
                          <span style={S.chipMuted}>{shortDate(row.timestamp)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>

          <section style={S.card}>
            <div style={S.sectionPad}>
              <div style={S.sectionTitle}>Current output scope</div>
              <div style={S.sectionHelp}>
                This page now connects directly to the content being released, including weak points in the learner pool.
              </div>

              <div style={S.list}>
                {studentOutputs.slice(0, 8).map((s) => (
                  <div key={s.studentId} style={S.item}>
                    <div style={S.itemTitle}>{s.studentName}</div>
                    <div style={S.itemText}>
                      {s.fragile
                        ? `Fragile output profile. Missing ${s.missingAreas.join(", ") || "none"}, overdue reviews ${s.overdueReviews}.`
                        : "Stable output profile for current release scope."}
                    </div>
                    <div style={{ ...S.row, marginTop: 8 }}>
                      <span style={S.chipMuted}>Evidence {s.evidenceCount}</span>
                      <span style={S.chipMuted}>Narrative {s.narrativeCount}</span>
                      <span style={S.chipMuted}>{s.fragile ? "Fragile" : "Stable"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}