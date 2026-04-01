"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import AdminLeftNav from "@/app/components/AdminLeftNav";
import { supabase } from "@/lib/supabaseClient";

/* ───────────────────────── TYPES ───────────────────────── */

type DatasetKey = "classes" | "students" | "evidence_entries" | "interventions";

type DatasetConfig = {
  key: DatasetKey;
  label: string;
  description: string;
  table: string;
  requiredFields: string[];
  optionalFields: string[];
  importOrder: number;
};

type WorkbookSheetData = {
  key: DatasetKey;
  headers: string[];
  rows: Record<string, any>[];
};

type WorkbookData = Partial<Record<DatasetKey, WorkbookSheetData>>;

type ImportStatus =
  | { type: "idle" }
  | { type: "error"; message: string }
  | { type: "ok"; message: string };

type ImportMode = "upsert" | "insert";
type PrivacyMode = "full" | "initial" | "first_only";

type ClassRow = {
  id: string;
  name: string | null;
  year_level?: number | null;
  [k: string]: any;
};

type StudentRow = {
  id: string;
  class_id?: string | null;
  first_name: string | null;
  preferred_name: string | null;
  surname?: string | null;
  family_name?: string | null;
  is_ilp?: boolean | null;
  [k: string]: any;
};

type ManualBatchRow = {
  student_id: string;
  class_id: string;
  title: string;
  learning_area: string;
  summary: string;
  body: string;
  occurred_on: string;
  visibility: string;
};

type IntakeLane = "assessmentImport" | "manualBatch" | "worksheetScan" | "verification";

/* ───────────────────────── CONFIG ───────────────────────── */

const DATASETS: DatasetConfig[] = [
  {
    key: "classes",
    label: "Classes",
    description: "Core class records such as Foundation K, Grade 4A, or Year 7B.",
    table: "classes",
    requiredFields: ["id", "name"],
    optionalFields: ["year_level", "created_at"],
    importOrder: 1,
  },
  {
    key: "students",
    label: "Students",
    description: "Students linked to classes through class_id.",
    table: "students",
    requiredFields: ["id", "first_name"],
    optionalFields: ["class_id", "preferred_name", "surname", "is_ilp", "created_at"],
    importOrder: 2,
  },
  {
    key: "evidence_entries",
    label: "Evidence Entries",
    description: "Observations, checkpoints, work samples, and learning evidence.",
    table: "evidence_entries",
    requiredFields: ["id", "student_id"],
    optionalFields: [
      "class_id",
      "occurred_on",
      "learning_area",
      "title",
      "summary",
      "body",
      "note",
      "visibility",
      "is_deleted",
      "created_at",
    ],
    importOrder: 3,
  },
  {
    key: "interventions",
    label: "Support Plans / Interventions",
    description: "Support plans, interventions, and review dates.",
    table: "interventions",
    requiredFields: ["id", "student_id", "title"],
    optionalFields: [
      "class_id",
      "status",
      "priority",
      "tier",
      "strategy",
      "due_on",
      "review_due_on",
      "notes",
      "created_at",
    ],
    importOrder: 4,
  },
];

const DATASET_MAP = Object.fromEntries(DATASETS.map((d) => [d.key, d])) as Record<DatasetKey, DatasetConfig>;

/* ───────────────────────── STYLE ───────────────────────── */

const S: Record<string, React.CSSProperties> = {
  shell: {
    display: "flex",
    minHeight: "100vh",
    background: "#f6f7fb",
  },
  main: {
    flex: 1,
    padding: 22,
    maxWidth: 1440,
    margin: "0 auto",
    width: "100%",
  },
  hero: {
    border: "1px solid #e8eaf0",
    borderRadius: 22,
    background: "linear-gradient(135deg, rgba(17,24,39,0.05), rgba(15,118,110,0.08))",
    padding: 18,
  },
  card: {
    border: "1px solid #e8eaf0",
    borderRadius: 18,
    background: "#fff",
  },
  subtle: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  h1: {
    fontSize: 38,
    fontWeight: 950,
    lineHeight: 1.05,
    marginTop: 8,
    color: "#0f172a",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 950,
    color: "#0f172a",
    margin: 0,
  },
  sectionBody: {
    padding: 16,
  },
  helper: {
    marginTop: 8,
    fontSize: 12,
    color: "#6b7280",
    fontWeight: 750,
    lineHeight: 1.45,
  },
  row: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1.15fr 0.85fr",
    gap: 14,
    marginTop: 14,
    alignItems: "start",
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 12,
  },
  grid4: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 12,
  },
  btn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    fontWeight: 900,
    cursor: "pointer",
    background: "#fff",
    color: "#0f172a",
  },
  btnPrimary: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #0f172a",
    fontWeight: 900,
    cursor: "pointer",
    background: "#0f172a",
    color: "#fff",
  },
  btnSoft: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    fontWeight: 900,
    cursor: "pointer",
    background: "#f8fafc",
    color: "#0f172a",
  },
  btnDisabled: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    fontWeight: 900,
    cursor: "not-allowed",
    background: "#f8fafc",
    color: "#94a3b8",
  },
  chip: {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 10px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#fff",
    fontSize: 12,
    fontWeight: 900,
    color: "#0f172a",
    whiteSpace: "nowrap",
  },
  chipWarn: {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 10px",
    borderRadius: 999,
    border: "1px solid #fed7aa",
    background: "#fff7ed",
    fontSize: 12,
    fontWeight: 900,
    color: "#9a3412",
    whiteSpace: "nowrap",
  },
  chipOk: {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 10px",
    borderRadius: 999,
    border: "1px solid #bbf7d0",
    background: "#f0fdf4",
    fontSize: 12,
    fontWeight: 900,
    color: "#166534",
    whiteSpace: "nowrap",
  },
  alert: {
    marginTop: 10,
    borderRadius: 14,
    border: "1px solid #fecaca",
    background: "#fff1f2",
    padding: 12,
    color: "#9f1239",
    fontWeight: 900,
  },
  ok: {
    marginTop: 10,
    borderRadius: 14,
    border: "1px solid #bbf7d0",
    background: "#f0fdf4",
    padding: 12,
    color: "#14532d",
    fontWeight: 900,
  },
  select: {
    padding: "11px 12px",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    width: "100%",
    fontWeight: 900,
    background: "#fff",
    outline: "none",
    color: "#0f172a",
  },
  input: {
    padding: "11px 12px",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    width: "100%",
    fontWeight: 850,
    background: "#fff",
    outline: "none",
    color: "#0f172a",
  },
  textarea: {
    padding: "11px 12px",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    width: "100%",
    minHeight: 100,
    fontWeight: 850,
    background: "#fff",
    outline: "none",
    color: "#0f172a",
    lineHeight: 1.4,
    whiteSpace: "pre-wrap",
  },
  uploadBox: {
    marginTop: 12,
    border: "2px dashed #cbd5e1",
    borderRadius: 18,
    background: "#f8fafc",
    padding: 18,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: 950,
    color: "#0f172a",
    margin: 0,
  },
  uploadActions: {
    marginTop: 12,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },
  tile: {
    border: "1px solid #e8eaf0",
    borderRadius: 16,
    background: "#fff",
    padding: 14,
    minHeight: 120,
  },
  tileK: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 900,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  tileV: {
    marginTop: 6,
    fontSize: 22,
    color: "#0f172a",
    fontWeight: 950,
    lineHeight: 1.1,
  },
  tileS: {
    marginTop: 8,
    fontSize: 12,
    color: "#475569",
    fontWeight: 800,
    lineHeight: 1.35,
  },
  laneCard: {
    border: "1px solid #e8eaf0",
    borderRadius: 18,
    background: "#fff",
    padding: 16,
    cursor: "pointer",
  },
  laneCardActive: {
    border: "1px solid #0f172a",
    borderRadius: 18,
    background: "#f8fafc",
    padding: 16,
    cursor: "pointer",
    boxShadow: "0 0 0 2px rgba(15,23,42,0.04) inset",
  },
  tableWrap: {
    overflowX: "auto",
    borderTop: "1px solid #eef2f7",
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
  },
  th: {
    textAlign: "left",
    fontSize: 12,
    color: "#64748b",
    fontWeight: 950,
    padding: "10px 10px",
    borderBottom: "1px solid #e8eaf0",
    whiteSpace: "nowrap",
    background: "#fff",
    position: "sticky",
    top: 0,
    zIndex: 1,
  },
  td: {
    padding: "10px 10px",
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "top",
    color: "#0f172a",
    fontSize: 13,
    fontWeight: 700,
  },
  mono: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
    fontSize: 12,
  },
};

/* ───────────────────────── HELPERS ───────────────────────── */

function normaliseSheetName(name: string) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function toBoolean(v: any) {
  const s = String(v ?? "").trim().toLowerCase();
  if (!s) return null;
  if (["true", "t", "yes", "y", "1"].includes(s)) return true;
  if (["false", "f", "no", "n", "0"].includes(s)) return false;
  return null;
}

function toNumber(v: any) {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

function getAllFields(config: DatasetConfig) {
  return [...config.requiredFields, ...config.optionalFields];
}

function yearLevelLabel(yearLevel: number | null) {
  if (yearLevel == null) return null;
  if (yearLevel === 0) return "Foundation";
  return `Year ${yearLevel}`;
}

function applySurnamePrivacy(originalSurname: any, privacyMode: PrivacyMode) {
  const surname = String(originalSurname ?? "").trim();
  if (!surname) return null;

  if (privacyMode === "full") return surname;
  if (privacyMode === "initial") return surname.charAt(0).toUpperCase();
  return null;
}

function normaliseInterventionStatus(value: any) {
  const s = String(value ?? "").trim().toLowerCase();

  if (!s) return "open";

  if (["open", "active", "monitoring", "in progress", "in_progress", "current"].includes(s)) {
    return "open";
  }

  if (["closed", "done", "resolved", "archived", "complete", "completed"].includes(s)) {
    return "closed";
  }

  if (s === "paused") return "paused";

  return "open";
}

function normalisePriority(value: any) {
  const s = String(value ?? "").trim().toLowerCase();
  if (!s) return null;
  if (["low", "medium", "high", "urgent", "normal"].includes(s)) return s;
  return null;
}

function transformRow(dataset: DatasetConfig, row: Record<string, any>, privacyMode: PrivacyMode) {
  const out: Record<string, any> = {};

  for (const field of getAllFields(dataset)) {
    const raw = row[field];

    if (raw == null || raw === "") {
      out[field] = null;
      continue;
    }

    if (field === "year_level" || field === "tier") {
      out[field] = toNumber(raw);
    } else if (field === "is_ilp" || field === "is_deleted") {
      const boolVal = toBoolean(raw);
      out[field] = boolVal === null ? raw : boolVal;
    } else if (dataset.key === "students" && field === "surname") {
      out[field] = applySurnamePrivacy(raw, privacyMode);
    } else if (dataset.key === "interventions" && field === "status") {
      out[field] = normaliseInterventionStatus(raw);
    } else if (dataset.key === "interventions" && field === "priority") {
      out[field] = normalisePriority(raw);
    } else {
      out[field] = raw;
    }
  }

  if (dataset.key === "evidence_entries") {
    if (!out.visibility) out.visibility = "teacher";
    if (out.is_deleted == null) out.is_deleted = false;
  }

  if (dataset.key === "interventions") {
    if (!out.status) out.status = "open";
  }

  return out;
}

function validateSheet(dataset: DatasetConfig, rows: Record<string, any>[]) {
  const issues: string[] = [];

  rows.forEach((row, idx) => {
    for (const req of dataset.requiredFields) {
      const value = row[req];
      if (value == null || String(value).trim() === "") {
        issues.push(`${dataset.key} row ${idx + 2}: missing required field "${req}"`);
      }
    }
  });

  return issues;
}

function buildTemplateWorkbook() {
  const wb = XLSX.utils.book_new();

  const classes = [
    { id: "cls-001", name: "Foundation K", year_level: 0, created_at: "2026-02-01" },
    { id: "cls-002", name: "Grade 4A", year_level: 4, created_at: "2026-02-01" },
    { id: "cls-003", name: "Grade 7B", year_level: 7, created_at: "2026-02-01" },
  ];

  const students = [
    {
      id: "stu-001",
      class_id: "cls-002",
      first_name: "Ava",
      preferred_name: "Ava",
      surname: "Smith",
      is_ilp: "FALSE",
      created_at: "2026-02-01",
    },
    {
      id: "stu-002",
      class_id: "cls-002",
      first_name: "Leo",
      preferred_name: "Leo",
      surname: "Brown",
      is_ilp: "TRUE",
      created_at: "2026-02-01",
    },
  ];

  const evidence_entries = [
    {
      id: "ev-001",
      student_id: "stu-001",
      class_id: "cls-002",
      occurred_on: "2026-02-10",
      learning_area: "Writing",
      title: "Writing sample",
      summary: "Short persuasive writing task.",
      body: "Captured during a classroom writing session.",
      note: "Useful baseline sample.",
      visibility: "teacher",
      is_deleted: "FALSE",
      created_at: "2026-02-10",
    },
  ];

  const interventions = [
    {
      id: "int-001",
      student_id: "stu-002",
      class_id: "cls-002",
      title: "Reading support plan",
      status: "open",
      priority: "normal",
      tier: 2,
      strategy: "Small-group reteach twice weekly",
      due_on: "2026-02-21",
      review_due_on: "2026-02-21",
      notes: "Mock support plan for onboarding.",
      created_at: "2026-02-07",
    },
  ];

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(classes), "classes");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(students), "students");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(evidence_entries), "evidence_entries");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(interventions), "interventions");

  return wb;
}

function studentDisplayName(s: StudentRow | undefined) {
  if (!s) return "Student";
  const first = String(s.preferred_name || s.first_name || "").trim();
  const sur = String(s.surname || s.family_name || "").trim();
  return `${first}${sur ? ` ${sur}` : ""}`.trim() || "Student";
}

/* ───────────────────────── PAGE ───────────────────────── */

export default function ImportCentrePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [importMode, setImportMode] = useState<ImportMode>("upsert");
  const [privacyMode, setPrivacyMode] = useState<PrivacyMode>("full");
  const [workbookData, setWorkbookData] = useState<WorkbookData>({});
  const [status, setStatus] = useState<ImportStatus>({ type: "idle" });
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState("");
  const [previewDataset, setPreviewDataset] = useState<DatasetKey>("classes");
  const [previewLimit, setPreviewLimit] = useState(12);
  const [workbookLoaded, setWorkbookLoaded] = useState(false);
  const [readyToFinalise, setReadyToFinalise] = useState(false);
  const [activeLane, setActiveLane] = useState<IntakeLane>("assessmentImport");

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);

  const [manualClassId, setManualClassId] = useState("");
  const [manualStudentId, setManualStudentId] = useState("");
  const [manualTitle, setManualTitle] = useState("Assessment intake note");
  const [manualLearningArea, setManualLearningArea] = useState("Mathematics");
  const [manualSummary, setManualSummary] = useState("");
  const [manualBody, setManualBody] = useState("");
  const [manualOccurredOn, setManualOccurredOn] = useState(new Date().toISOString().slice(0, 10));
  const [manualVisibility, setManualVisibility] = useState("teacher");
  const [manualBatchRows, setManualBatchRows] = useState<ManualBatchRow[]>([]);

  useEffect(() => {
    (async () => {
      const classResp = await supabase
        .from("classes")
        .select("id,name,year_level")
        .order("year_level", { ascending: true })
        .order("name", { ascending: true });

      if (!classResp.error) setClasses((classResp.data as any[]) ?? []);

      const studentResp = await supabase
        .from("students")
        .select("id,class_id,first_name,preferred_name,surname,family_name,is_ilp")
        .order("preferred_name", { ascending: true })
        .order("first_name", { ascending: true });

      if (!studentResp.error) setStudents((studentResp.data as any[]) ?? []);
    })();
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => !manualClassId || String(s.class_id || "") === manualClassId);
  }, [students, manualClassId]);

  const datasetsFound = useMemo(() => {
    return DATASETS.filter((d) => workbookData[d.key] && workbookData[d.key]!.rows.length > 0);
  }, [workbookData]);

  const validationIssues = useMemo(() => {
    const issues: string[] = [];
    for (const d of DATASETS) {
      const sheet = workbookData[d.key];
      if (!sheet) continue;
      issues.push(...validateSheet(d, sheet.rows));
    }
    return issues;
  }, [workbookData]);

  const previewSheet = workbookData[previewDataset];

  const previewRows = useMemo(() => {
    if (!previewSheet) return [];
    return previewSheet.rows.slice(0, previewLimit);
  }, [previewSheet, previewLimit]);

  const transformedPreviewRows = useMemo(() => {
    if (!previewSheet) return [];
    return previewRows.map((row) => transformRow(DATASET_MAP[previewDataset], row, privacyMode));
  }, [previewSheet, previewRows, previewDataset, privacyMode]);

  const totalRowsReady = useMemo(() => {
    return datasetsFound.reduce((sum, d) => sum + (workbookData[d.key]?.rows.length ?? 0), 0);
  }, [datasetsFound, workbookData]);

  const importDisabledReason = useMemo(() => {
    if (busy) return "Upload is currently running.";
    if (!datasetsFound.length) return "Upload an onboarding workbook first.";
    if (validationIssues.length) return "Fix validation issues before finalising upload.";
    if (!readyToFinalise) return "Review the workbook, then click Finalise upload.";
    return "";
  }, [busy, datasetsFound.length, validationIssues.length, readyToFinalise]);

  const verificationQueueCount = useMemo(() => {
    return datasetsFound.reduce((sum, d) => sum + (workbookData[d.key]?.rows.length ?? 0), 0) + manualBatchRows.length;
  }, [datasetsFound, workbookData, manualBatchRows]);

  function resetAll() {
    setWorkbookData({});
    setStatus({ type: "idle" });
    setFileName("");
    setWorkbookLoaded(false);
    setReadyToFinalise(false);
    setManualBatchRows([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function downloadTemplateWorkbook() {
    const wb = buildTemplateWorkbook();
    XLSX.writeFile(wb, "EduDecks_Onboarding_Template.xlsx");
  }

  async function handleWorkbook(file: File) {
    setBusy(true);
    setStatus({ type: "idle" });
    setFileName(file.name);
    setWorkbookLoaded(false);
    setReadyToFinalise(false);

    try {
      const lower = file.name.toLowerCase();
      if (!lower.endsWith(".xlsx") && !lower.endsWith(".xls")) {
        throw new Error("Please upload an Excel workbook (.xlsx or .xls).");
      }

      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });

      const nextData: WorkbookData = {};

      for (const sheetName of wb.SheetNames) {
        const normalised = normaliseSheetName(sheetName) as DatasetKey;
        const dataset = DATASET_MAP[normalised];
        if (!dataset) continue;

        const sheet = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
          defval: "",
          raw: false,
        });

        const filteredRows = rows.filter((row) =>
          Object.values(row).some((v) => String(v ?? "").trim() !== "")
        );

        const headers = filteredRows.length
          ? Array.from(
              new Set(filteredRows.flatMap((row) => Object.keys(row).map((k) => String(k).trim())))
            )
          : getAllFields(dataset);

        nextData[dataset.key] = {
          key: dataset.key,
          headers,
          rows: filteredRows,
        };
      }

      setWorkbookData(nextData);

      const found = DATASETS.filter((d) => nextData[d.key] && nextData[d.key]!.rows.length > 0);
      if (!found.length) {
        throw new Error(
          'No recognised sheets were found. Expected sheet names like "classes", "students", "evidence_entries", or "interventions".'
        );
      }

      setPreviewDataset(found[0].key);
      setWorkbookLoaded(true);
      setReadyToFinalise(true);
      setStatus({
        type: "ok",
        message: `Workbook loaded successfully. Found ${found.length} usable sheet(s): ${found
          .map((d) => d.label)
          .join(", ")}. Review the summary below, then finalise the upload.`,
      });
    } catch (e: any) {
      setWorkbookData({});
      setWorkbookLoaded(false);
      setReadyToFinalise(false);
      setStatus({ type: "error", message: e?.message ?? "Could not read workbook." });
    } finally {
      setBusy(false);
    }
  }

  async function finaliseUpload() {
    if (validationIssues.length) {
      setStatus({
        type: "error",
        message: `Upload blocked. Fix validation issues first. First issue: ${validationIssues[0]}`,
      });
      return;
    }

    if (!datasetsFound.length) {
      setStatus({ type: "error", message: "Upload a workbook first." });
      return;
    }

    setBusy(true);
    setStatus({ type: "idle" });

    try {
      const ordered = [...datasetsFound].sort((a, b) => a.importOrder - b.importOrder);

      for (const dataset of ordered) {
        const sheet = workbookData[dataset.key];
        if (!sheet || !sheet.rows.length) continue;

        const payload = sheet.rows.map((row) => transformRow(dataset, row, privacyMode));

        if (importMode === "upsert") {
          const { error } = await supabase.from(dataset.table).upsert(payload, { onConflict: "id" });
          if (error) throw new Error(`${dataset.label}: ${error.message}`);
        } else {
          const { error } = await supabase.from(dataset.table).insert(payload);
          if (error) throw new Error(`${dataset.label}: ${error.message}`);
        }
      }

      setStatus({
        type: "ok",
        message: `Upload finalised successfully. Imported ${ordered.length} dataset(s) and ${totalRowsReady} row(s) into EduDecks.`,
      });
      setReadyToFinalise(false);
    } catch (e: any) {
      setStatus({
        type: "error",
        message: e?.message ?? "Workbook upload failed.",
      });
    } finally {
      setBusy(false);
    }
  }

  function addManualBatchRow() {
    if (!manualStudentId || !manualClassId || !manualTitle || !manualLearningArea) {
      setStatus({
        type: "error",
        message: "Manual batch entry needs a class, student, title, and learning area.",
      });
      return;
    }

    const row: ManualBatchRow = {
      student_id: manualStudentId,
      class_id: manualClassId,
      title: manualTitle,
      learning_area: manualLearningArea,
      summary: manualSummary,
      body: manualBody,
      occurred_on: manualOccurredOn,
      visibility: manualVisibility,
    };

    setManualBatchRows((prev) => [...prev, row]);
    setManualSummary("");
    setManualBody("");
    setStatus({
      type: "ok",
      message: `Manual batch row added. ${manualBatchRows.length + 1} row(s) currently staged.`,
    });
  }

  async function finaliseManualBatch() {
    if (!manualBatchRows.length) {
      setStatus({ type: "error", message: "No manual batch rows are staged yet." });
      return;
    }

    setBusy(true);
    setStatus({ type: "idle" });

    try {
      const payload = manualBatchRows.map((row, idx) => ({
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `manual-${Date.now()}-${idx}`,
        student_id: row.student_id,
        class_id: row.class_id,
        title: row.title,
        learning_area: row.learning_area,
        summary: row.summary || null,
        body: row.body || null,
        occurred_on: row.occurred_on || null,
        visibility: row.visibility || "teacher",
        is_deleted: false,
        created_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from("evidence_entries").insert(payload);
      if (error) throw error;

      setStatus({
        type: "ok",
        message: `Manual batch import complete. Inserted ${payload.length} evidence row(s).`,
      });
      setManualBatchRows([]);
    } catch (e: any) {
      setStatus({
        type: "error",
        message: e?.message ?? "Manual batch upload failed.",
      });
    } finally {
      setBusy(false);
    }
  }

  const laneCards: Array<{ key: IntakeLane; title: string; help: string; badge?: string }> = [
    {
      key: "assessmentImport",
      title: "Assessment Import",
      help: "Upload one workbook to onboard classes, students, evidence, and support plans.",
      badge: "Live now",
    },
    {
      key: "manualBatch",
      title: "Manual Batch Entry",
      help: "Quickly stage and upload teacher-entered assessment or observation rows.",
      badge: "Live now",
    },
    {
      key: "worksheetScan",
      title: "Worksheet Scan Pipeline",
      help: "Premium-ready placeholder for future scan, extraction, and teacher verification.",
      badge: "Premium-ready",
    },
    {
      key: "verification",
      title: "Verification Queue",
      help: "Preview what should later become the teacher verification step before evidence is trusted.",
      badge: "Foundation",
    },
  ];

  return (
    <div style={S.shell}>
      <AdminLeftNav />

      <main style={S.main}>
        <section style={S.hero}>
          <div style={S.subtle}>EVIDENCE INTAKE HUB</div>
          <div style={S.h1}>Import Centre</div>

          <div style={{ ...S.row, marginTop: 10 }}>
            <div style={{ color: "#334155", fontSize: 14, fontWeight: 850, maxWidth: 980 }}>
              Bring evidence into EduDecks through structured workbook import, quick manual batch entry, and premium-ready
              intake pathways that prepare the platform for future assessment and worksheet scan workflows.
            </div>

            <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button style={S.btnSoft} onClick={downloadTemplateWorkbook}>
                Download workbook template
              </button>
              <button style={S.btn} onClick={resetAll}>
                Reset
              </button>
            </div>
          </div>

          {status.type === "error" ? <div style={S.alert}>{status.message}</div> : null}
          {status.type === "ok" ? <div style={S.ok}>{status.message}</div> : null}

          <div style={S.helper}>
            This page is now the intake layer for EduDecks. Structured imports work today; premium scan and verification lanes are architected for future rollout.
          </div>
        </section>

        <section style={{ ...S.card, marginTop: 14 }}>
          <div style={S.sectionBody}>
            <h3 style={S.sectionTitle}>Intake Lanes</h3>
            <div style={S.helper}>
              Each lane represents a different way evidence can enter the system. Start with workbook import or manual entry now; expand into premium capture later.
            </div>

            <div style={{ ...S.grid4, marginTop: 12 }}>
              {laneCards.map((lane) => (
                <div
                  key={lane.key}
                  style={activeLane === lane.key ? S.laneCardActive : S.laneCard}
                  onClick={() => setActiveLane(lane.key)}
                >
                  <div style={S.tileK}>{lane.title}</div>
                  <div style={S.tileV}>{lane.badge || "Lane"}</div>
                  <div style={S.tileS}>{lane.help}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div style={{ ...S.grid4, marginTop: 14 }}>
          <div style={S.tile}>
            <div style={S.tileK}>Workbook rows ready</div>
            <div style={S.tileV}>{totalRowsReady}</div>
            <div style={S.tileS}>Rows detected across recognised workbook tabs.</div>
          </div>

          <div style={S.tile}>
            <div style={S.tileK}>Manual batch staged</div>
            <div style={S.tileV}>{manualBatchRows.length}</div>
            <div style={S.tileS}>Teacher-entered rows waiting to be committed as evidence.</div>
          </div>

          <div style={S.tile}>
            <div style={S.tileK}>Verification queue</div>
            <div style={S.tileV}>{verificationQueueCount}</div>
            <div style={S.tileS}>Foundation count for future teacher verification workflows.</div>
          </div>

          <div style={S.tile}>
            <div style={S.tileK}>Premium scan state</div>
            <div style={S.tileV}>Ready</div>
            <div style={S.tileS}>UI infrastructure prepared for worksheet and scan AI lanes.</div>
          </div>
        </div>

        {activeLane === "assessmentImport" && (
          <>
            <div style={S.grid2}>
              <section style={S.card}>
                <div style={S.sectionBody}>
                  <h3 style={S.sectionTitle}>1. Upload onboarding workbook</h3>

                  <div style={{ marginTop: 14 }}>
                    <div style={S.subtle}>IMPORT MODE</div>
                    <select
                      style={{ ...S.select, marginTop: 8, maxWidth: 360 }}
                      value={importMode}
                      onChange={(e) => setImportMode(e.target.value as ImportMode)}
                      disabled={busy}
                    >
                      <option value="upsert">Upsert by id (recommended)</option>
                      <option value="insert">Insert only</option>
                    </select>
                    <div style={S.helper}>
                      Upsert creates new rows and updates existing rows that match the same id.
                    </div>
                  </div>

                  <div style={{ marginTop: 14 }}>
                    <div style={S.subtle}>STUDENT NAME PRIVACY</div>
                    <select
                      style={{ ...S.select, marginTop: 8, maxWidth: 360 }}
                      value={privacyMode}
                      onChange={(e) => setPrivacyMode(e.target.value as PrivacyMode)}
                      disabled={busy}
                    >
                      <option value="full">Full surname</option>
                      <option value="initial">Surname initial only</option>
                      <option value="first_only">First name only</option>
                    </select>
                    <div style={S.helper}>
                      This only affects the <strong>students</strong> sheet during upload.
                    </div>
                  </div>

                  <div style={S.uploadBox}>
                    <h4 style={S.uploadTitle}>Upload one Excel workbook</h4>
                    <div style={S.helper}>
                      This is the one-time onboarding workflow. Use one workbook with multiple tabs rather than uploading separate files.
                    </div>

                    <div style={S.uploadActions}>
                      <button type="button" style={S.btnPrimary} onClick={openFilePicker} disabled={busy}>
                        {busy ? "Working..." : "Upload workbook"}
                      </button>

                      <span style={S.chipWarn}>One workbook upload</span>
                      <span style={S.chipWarn}>Optional blanks allowed</span>

                      {fileName ? (
                        <span style={S.chip}>Selected: {fileName}</span>
                      ) : (
                        <span style={S.chip}>No workbook selected</span>
                      )}
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleWorkbook(file);
                      }}
                      style={{ display: "none" }}
                      disabled={busy}
                    />

                    <div style={S.helper}>
                      Example: upload <strong>EduDecks_Onboarding_Template.xlsx</strong> after populating the tabs you need.
                    </div>
                  </div>

                  <div style={{ marginTop: 14 }}>
                    <div style={S.subtle}>EXPECTED TABS</div>
                    <div style={{ ...S.row, marginTop: 8 }}>
                      {DATASETS.map((d) => (
                        <span key={d.key} style={S.chip}>
                          {d.key}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section style={S.card}>
                <div style={S.sectionBody}>
                  <h3 style={S.sectionTitle}>2. Workbook summary</h3>

                  <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                    {DATASETS.map((d) => {
                      const sheet = workbookData[d.key];
                      const found = !!sheet && sheet.rows.length > 0;
                      const derivedLabel =
                        d.key === "classes" && sheet?.rows?.length
                          ? ` • derived labels like ${yearLevelLabel(toNumber(sheet.rows[0]?.year_level)) || "Year label"}`
                          : "";

                      return (
                        <div
                          key={d.key}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 10,
                            alignItems: "center",
                            padding: "10px 0",
                            borderBottom: "1px solid #f1f5f9",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 950, color: "#0f172a" }}>{d.label}</div>
                            <div style={S.helper}>
                              {d.description}
                              {derivedLabel}
                            </div>
                          </div>
                          <div>
                            {found ? (
                              <span style={S.chipOk}>{sheet.rows.length} row(s)</span>
                            ) : (
                              <span style={S.chipWarn}>not found</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ ...S.row, marginTop: 12 }}>
                    {workbookLoaded ? (
                      <span style={S.chipOk}>Workbook loaded successfully</span>
                    ) : (
                      <span style={S.chipWarn}>Workbook not yet loaded</span>
                    )}
                    <span style={S.chip}>Rows ready: {totalRowsReady}</span>
                    <span style={S.chip}>
                      Privacy mode:{" "}
                      {privacyMode === "full"
                        ? "Full surname"
                        : privacyMode === "initial"
                        ? "Surname initial only"
                        : "First name only"}
                    </span>
                  </div>

                  {validationIssues.length ? (
                    <div style={S.alert}>
                      {validationIssues.slice(0, 6).map((issue, i) => (
                        <div key={i}>• {issue}</div>
                      ))}
                      {validationIssues.length > 6 ? <div>• + {validationIssues.length - 6} more issue(s)</div> : null}
                    </div>
                  ) : datasetsFound.length ? (
                    <div style={S.ok}>Workbook structure looks valid for upload.</div>
                  ) : (
                    <div style={S.helper}>No workbook has been loaded yet.</div>
                  )}
                </div>
              </section>
            </div>

            <div style={{ ...S.grid2, marginTop: 14 }}>
              <section style={S.card}>
                <div style={S.sectionBody}>
                  <h3 style={S.sectionTitle}>3. Preview workbook data</h3>

                  <div style={{ ...S.row, marginTop: 12 }}>
                    <div>
                      <div style={S.subtle}>PREVIEW TAB</div>
                      <select
                        style={{ ...S.select, marginTop: 8, width: 260 }}
                        value={previewDataset}
                        onChange={(e) => setPreviewDataset(e.target.value as DatasetKey)}
                        disabled={!datasetsFound.length}
                      >
                        {DATASETS.map((d) => (
                          <option key={d.key} value={d.key}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div style={S.subtle}>PREVIEW ROWS</div>
                      <select
                        style={{ ...S.select, marginTop: 8, width: 180 }}
                        value={previewLimit}
                        onChange={(e) => setPreviewLimit(Number(e.target.value))}
                      >
                        <option value={8}>8 rows</option>
                        <option value={12}>12 rows</option>
                        <option value={20}>20 rows</option>
                      </select>
                    </div>

                    <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                      {!importDisabledReason ? (
                        <button style={S.btnPrimary} onClick={finaliseUpload} disabled={busy}>
                          {busy ? "Finalising..." : "Finalise upload"}
                        </button>
                      ) : (
                        <button style={S.btnDisabled} disabled title={importDisabledReason}>
                          Finalise upload
                        </button>
                      )}
                    </div>
                  </div>

                  {importDisabledReason ? <div style={S.helper}>Why disabled: {importDisabledReason}</div> : null}
                </div>

                <div style={S.tableWrap}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={S.th}>Workbook row</th>
                        {previewSheet
                          ? getAllFields(DATASET_MAP[previewDataset]).map((f) => (
                              <th key={f} style={S.th}>
                                {f}
                              </th>
                            ))
                          : null}
                        {previewDataset === "classes" ? <th style={S.th}>derived label</th> : null}
                      </tr>
                    </thead>
                    <tbody>
                      {previewSheet && transformedPreviewRows.length ? (
                        transformedPreviewRows.map((row, idx) => (
                          <tr key={idx}>
                            <td style={{ ...S.td, ...S.mono }}>{idx + 2}</td>
                            {getAllFields(DATASET_MAP[previewDataset]).map((field) => (
                              <td key={field} style={S.td}>
                                <span style={S.mono}>{String(row[field] ?? "")}</span>
                              </td>
                            ))}
                            {previewDataset === "classes" ? (
                              <td style={S.td}>
                                <span style={S.mono}>
                                  {yearLevelLabel(typeof row.year_level === "number" ? row.year_level : toNumber(row.year_level))}
                                </span>
                              </td>
                            ) : null}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={24} style={S.td}>
                            No preview yet. Upload one onboarding workbook to begin.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section style={S.card}>
                <div style={S.sectionBody}>
                  <h3 style={S.sectionTitle}>4. Import summary</h3>

                  <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={S.chip}>Workbook loaded: {workbookLoaded ? "Yes" : "No"}</div>
                    <div style={S.chip}>Classes ready: {workbookData.classes?.rows.length ?? 0}</div>
                    <div style={S.chip}>Students ready: {workbookData.students?.rows.length ?? 0}</div>
                    <div style={S.chip}>Evidence ready: {workbookData.evidence_entries?.rows.length ?? 0}</div>
                    <div style={S.chip}>Support plans ready: {workbookData.interventions?.rows.length ?? 0}</div>
                  </div>

                  <div style={{ ...S.helper, marginTop: 12 }}>
                    The upload only writes data when you click <strong>Finalise upload</strong>. That gives schools a clearer review step before committing data to EduDecks.
                  </div>

                  <div style={{ ...S.helper, marginTop: 12 }}>
                    This import lane is suitable for onboarding and structured admin uploads. Use the manual lane below for quick teacher-entered assessment evidence.
                  </div>
                </div>
              </section>
            </div>
          </>
        )}

        {activeLane === "manualBatch" && (
          <div style={S.grid2}>
            <section style={S.card}>
              <div style={S.sectionBody}>
                <h3 style={S.sectionTitle}>Manual Batch Entry</h3>
                <div style={S.helper}>
                  Use this when results exist on paper or in a teacher notebook and need to become evidence quickly without preparing a workbook first.
                </div>

                <div style={{ ...S.grid2, marginTop: 14, gridTemplateColumns: "1fr 1fr" }}>
                  <div>
                    <div style={S.subtle}>CLASS</div>
                    <select style={{ ...S.select, marginTop: 8 }} value={manualClassId} onChange={(e) => setManualClassId(e.target.value)}>
                      <option value="">Select class</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {String(c.name || "Class")} {c.year_level != null ? `(${yearLevelLabel(c.year_level)})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div style={S.subtle}>STUDENT</div>
                    <select style={{ ...S.select, marginTop: 8 }} value={manualStudentId} onChange={(e) => setManualStudentId(e.target.value)}>
                      <option value="">{manualClassId ? "Select student" : "Select class first"}</option>
                      {filteredStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          {studentDisplayName(s)} {s.is_ilp ? "• ILP" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ ...S.grid2, marginTop: 14, gridTemplateColumns: "1fr 1fr" }}>
                  <div>
                    <div style={S.subtle}>TITLE</div>
                    <input style={{ ...S.input, marginTop: 8 }} value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} />
                  </div>

                  <div>
                    <div style={S.subtle}>LEARNING AREA</div>
                    <input style={{ ...S.input, marginTop: 8 }} value={manualLearningArea} onChange={(e) => setManualLearningArea(e.target.value)} />
                  </div>
                </div>

                <div style={{ ...S.grid2, marginTop: 14, gridTemplateColumns: "1fr 1fr" }}>
                  <div>
                    <div style={S.subtle}>DATE OBSERVED</div>
                    <input
                      type="date"
                      style={{ ...S.input, marginTop: 8 }}
                      value={manualOccurredOn}
                      onChange={(e) => setManualOccurredOn(e.target.value)}
                    />
                  </div>

                  <div>
                    <div style={S.subtle}>VISIBILITY</div>
                    <select style={{ ...S.select, marginTop: 8 }} value={manualVisibility} onChange={(e) => setManualVisibility(e.target.value)}>
                      <option value="teacher">teacher</option>
                      <option value="staff">staff</option>
                      <option value="leadership">leadership</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <div style={S.subtle}>SUMMARY</div>
                  <textarea
                    style={{ ...S.textarea, marginTop: 8, minHeight: 90 }}
                    value={manualSummary}
                    onChange={(e) => setManualSummary(e.target.value)}
                    placeholder="e.g. Score 14/20 on fractions checkpoint. Needed prompting for equivalent fractions."
                  />
                </div>

                <div style={{ marginTop: 14 }}>
                  <div style={S.subtle}>BODY / SUPPORTING NOTES</div>
                  <textarea
                    style={{ ...S.textarea, marginTop: 8 }}
                    value={manualBody}
                    onChange={(e) => setManualBody(e.target.value)}
                    placeholder="Optional deeper note: misconceptions, completion, next teaching step, worksheet reference..."
                  />
                </div>

                <div style={{ ...S.row, marginTop: 14 }}>
                  <button style={S.btnPrimary} onClick={addManualBatchRow} disabled={busy}>
                    Stage row
                  </button>
                  <button style={manualBatchRows.length ? S.btnSoft : S.btnDisabled} onClick={finaliseManualBatch} disabled={!manualBatchRows.length || busy}>
                    {busy ? "Uploading..." : "Upload staged rows"}
                  </button>
                </div>
              </div>
            </section>

            <section style={S.card}>
              <div style={S.sectionBody}>
                <h3 style={S.sectionTitle}>Staged Manual Rows</h3>
                <div style={S.helper}>
                  These rows are not written to the database until you click <strong>Upload staged rows</strong>.
                </div>

                <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                  {manualBatchRows.length === 0 ? (
                    <div style={S.chipWarn}>No rows staged yet</div>
                  ) : (
                    manualBatchRows.map((row, idx) => {
                      const student = students.find((s) => s.id === row.student_id);
                      return (
                        <div key={idx} style={S.tile}>
                          <div style={S.tileK}>Staged row {idx + 1}</div>
                          <div style={{ ...S.tileV, fontSize: 18 }}>{row.title}</div>
                          <div style={S.tileS}>
                            {studentDisplayName(student)} • {row.learning_area} • {row.occurred_on}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

        {activeLane === "worksheetScan" && (
          <div style={S.grid2}>
            <section style={S.card}>
              <div style={S.sectionBody}>
                <h3 style={S.sectionTitle}>Worksheet Scan Pipeline</h3>
                <div style={S.helper}>
                  This lane is intentionally scaffolded now so premium-grade evidence capture can slot into EduDecks later without redesigning the whole intake layer.
                </div>

                <div style={{ ...S.grid3, marginTop: 14 }}>
                  <div style={S.tile}>
                    <div style={S.tileK}>Step 1</div>
                    <div style={{ ...S.tileV, fontSize: 18 }}>Upload scan</div>
                    <div style={S.tileS}>Teacher uploads worksheet, rubric, or assessment scan.</div>
                  </div>

                  <div style={S.tile}>
                    <div style={S.tileK}>Step 2</div>
                    <div style={{ ...S.tileV, fontSize: 18 }}>AI extraction</div>
                    <div style={S.tileS}>Future premium service extracts names, scores, completion, and skill signals.</div>
                  </div>

                  <div style={S.tile}>
                    <div style={S.tileK}>Step 3</div>
                    <div style={{ ...S.tileV, fontSize: 18 }}>Teacher verify</div>
                    <div style={S.tileS}>Teacher confirms or edits extracted evidence before trusting it.</div>
                  </div>
                </div>

                <div style={{ ...S.uploadBox, marginTop: 14 }}>
                  <h4 style={S.uploadTitle}>Premium-ready placeholder</h4>
                  <div style={S.helper}>
                    No live scan processing is connected yet. This card exists so the UX and premium product story can be developed now, while the underlying AI pipeline is added later.
                  </div>

                  <div style={S.uploadActions}>
                    <button style={S.btnDisabled} disabled>
                      Upload scan (coming later)
                    </button>
                    <span style={S.chipWarn}>Premium feature</span>
                    <span style={S.chip}>Future teacher verification required</span>
                  </div>
                </div>
              </div>
            </section>

            <section style={S.card}>
              <div style={S.sectionBody}>
                <h3 style={S.sectionTitle}>Premium Infrastructure Notes</h3>
                <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                  <div style={S.tile}>
                    <div style={S.tileK}>Capture targets</div>
                    <div style={S.tileS}>Assessment import, worksheet scans, structured rubric signals, completion markers, and evidence confidence.</div>
                  </div>
                  <div style={S.tile}>
                    <div style={S.tileK}>Why this matters</div>
                    <div style={S.tileS}>It prepares EduDecks for high-value evidence capture features without forcing a later rebuild of the intake system.</div>
                  </div>
                  <div style={S.tile}>
                    <div style={S.tileK}>Product position</div>
                    <div style={S.tileS}>Free and standard plans can use structured imports; premium plans can add scan AI plus verification queue workflows.</div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeLane === "verification" && (
          <div style={S.grid2}>
            <section style={S.card}>
              <div style={S.sectionBody}>
                <h3 style={S.sectionTitle}>Verification Queue</h3>
                <div style={S.helper}>
                  This is the foundation for a future teacher verification flow. Today it acts as an architectural placeholder and intake visibility layer.
                </div>

                <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                  <div style={S.tile}>
                    <div style={S.tileK}>Workbook items staged</div>
                    <div style={S.tileV}>{totalRowsReady}</div>
                    <div style={S.tileS}>Rows currently sitting in workbook preview before final upload.</div>
                  </div>

                  <div style={S.tile}>
                    <div style={S.tileK}>Manual rows staged</div>
                    <div style={S.tileV}>{manualBatchRows.length}</div>
                    <div style={S.tileS}>Rows waiting to be committed from the manual batch lane.</div>
                  </div>
                </div>

                <div style={{ ...S.uploadBox, marginTop: 14 }}>
                  <h4 style={S.uploadTitle}>Future verification model</h4>
                  <div style={S.helper}>
                    In a later version, imported or AI-extracted evidence should appear here first with:
                  </div>
                  <div style={{ ...S.row, marginTop: 10 }}>
                    <span style={S.chip}>student match confidence</span>
                    <span style={S.chip}>learning area mapping</span>
                    <span style={S.chip}>score / completion extraction</span>
                    <span style={S.chip}>approve / edit / reject</span>
                  </div>
                </div>
              </div>
            </section>

            <section style={S.card}>
              <div style={S.sectionBody}>
                <h3 style={S.sectionTitle}>Why this queue matters</h3>
                <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                  <div style={S.tile}>
                    <div style={S.tileK}>Trust layer</div>
                    <div style={S.tileS}>Teachers should not be forced to accept imported or AI-extracted evidence blindly.</div>
                  </div>
                  <div style={S.tile}>
                    <div style={S.tileK}>Behavioural design</div>
                    <div style={S.tileS}>A verification queue reduces anxiety because teachers retain control over what becomes trusted evidence.</div>
                  </div>
                  <div style={S.tile}>
                    <div style={S.tileK}>SaaS value</div>
                    <div style={S.tileS}>This queue becomes a premium workflow once assessment imports and scans generate larger evidence volumes.</div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}