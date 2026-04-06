"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

/* ───────────────────────── TYPES ───────────────────────── */

type StudentRow = {
  id: string;
  class_id?: string | null;
  preferred_name?: string | null;
  first_name?: string | null;
  surname?: string | null;
  family_name?: string | null;
  last_name?: string | null;
  is_ilp?: boolean | null;
  year_level?: number | null;
  created_at?: string | null;
  [k: string]: any;
};

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
  visibility?: string | null;
  is_deleted?: boolean | null;
  attachment_urls?: string[] | string | null;
  image_url?: string | null;
  photo_url?: string | null;
  file_url?: string | null;
  [k: string]: any;
};

type FrameworkOption = {
  id: string;
  label: string;
  country: string;
  region?: string;
};

type QuickEntryForm = {
  studentId: string;
  title: string;
  description: string;
  date: string;
  evidenceType: string;
  learningAreas: string[];
};

type CoverageCard = {
  area: string;
  count: number;
  lastDate: string | null;
  status: "Strong" | "Watch" | "Needs Evidence";
  suggestion: string;
};

type ChildSnapshot = {
  student: StudentRow;
  evidenceCount: number;
  lastEvidenceDate: string | null;
  strongestArea: string;
  weakestArea: string;
  readinessPercent: number;
  statusLabel: string;
};

type SaveStatus = "idle" | "saving" | "success" | "error";

type FamilyDashboardScreenProps = {
  mode?: "admin" | "public";
};

/* ───────────────────────── CONSTANTS ───────────────────────── */

const FALLBACK_FRAMEWORKS: FrameworkOption[] = [
  {
    id: "au-acara-v9",
    label: "Australia — ACARA v9",
    country: "Australia",
    region: "National",
  },
  {
    id: "us-common-core",
    label: "United States — Common Core",
    country: "United States",
    region: "National",
  },
  {
    id: "uk-england",
    label: "United Kingdom — National Curriculum (England)",
    country: "United Kingdom",
    region: "England",
  },
  {
    id: "ca-provincial",
    label: "Canada — Provincial Aligned",
    country: "Canada",
  },
  {
    id: "nz-nzc",
    label: "New Zealand — NZ Curriculum",
    country: "New Zealand",
  },
  {
    id: "generic-flexible",
    label: "Flexible / Interest-led Homeschool",
    country: "Flexible",
  },
];

const LEARNING_AREAS = [
  "Literacy",
  "Numeracy",
  "Science",
  "Humanities",
  "Arts",
  "Health & PE",
  "Technologies",
  "Languages",
];

const EVIDENCE_TYPES = [
  "Activity",
  "Project",
  "Work Sample",
  "Assessment",
  "Excursion",
  "Reading",
  "Discussion",
  "Physical Activity",
  "Creative Work",
  "Other",
];

/* ───────────────────────── HELPERS ───────────────────────── */

function safe(v: any) {
  return String(v ?? "").trim();
}

function isMissingRelationOrColumn(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return (
    msg.includes("does not exist") &&
    (msg.includes("relation") || msg.includes("column"))
  );
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function studentName(s: StudentRow | null | undefined) {
  if (!s) return "Child";
  const first = safe(s.preferred_name || s.first_name);
  const last = safe(s.surname || s.family_name || s.last_name);
  return `${first} ${last}`.trim() || "Child";
}

function shortDate(v: string | null | undefined) {
  const s = safe(v);
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s.slice(0, 10) || "—";
  return d.toLocaleDateString();
}

function daysSince(v: string | null | undefined) {
  const s = safe(v);
  if (!s) return 999;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return 999;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
}

function firstNonEmpty(...vals: any[]) {
  for (const v of vals) {
    const s = safe(v);
    if (s) return s;
  }
  return "";
}

function evidenceDate(e: EvidenceRow) {
  return safe(e.occurred_on || e.created_at);
}

function statusForCoverage(
  count: number,
  lastDate: string | null
): CoverageCard["status"] {
  const age = daysSince(lastDate);
  if (count >= 3 && age <= 21) return "Strong";
  if (count >= 1 && age <= 60) return "Watch";
  return "Needs Evidence";
}

function suggestionForArea(area: string) {
  const key = area.toLowerCase();
  if (key.includes("literacy")) {
    return "Add a reading response, discussion note, or writing sample.";
  }
  if (key.includes("numeracy")) {
    return "Capture a maths task, real-world measurement, or quick number check.";
  }
  if (key.includes("science")) {
    return "Add an experiment, nature observation, or investigation note.";
  }
  if (key.includes("humanities")) {
    return "Record a history, geography, civics, or community-based activity.";
  }
  if (key.includes("arts")) {
    return "Upload a creative piece, performance, or visual art sample.";
  }
  if (key.includes("health")) {
    return "Add a sport, movement, wellbeing, or health learning entry.";
  }
  if (key.includes("technologies")) {
    return "Record a design, coding, making, or digital task.";
  }
  if (key.includes("languages")) {
    return "Add vocabulary practice, speaking, or cultural learning evidence.";
  }
  return "Add one representative learning activity in this area.";
}

function readinessPercentFromCoverage(cards: CoverageCard[]) {
  if (!cards.length) return 0;
  let score = 0;
  for (const c of cards) {
    if (c.status === "Strong") score += 1;
    else if (c.status === "Watch") score += 0.6;
    else score += 0.2;
  }
  return Math.max(0, Math.min(100, Math.round((score / cards.length) * 100)));
}

function overallCoverageLabel(cards: CoverageCard[]) {
  const ready = readinessPercentFromCoverage(cards);
  if (ready >= 75) return "On Track";
  if (ready >= 50) return "Watch";
  return "Needs Attention";
}

function strongestAreaFromEvidence(evidence: EvidenceRow[]) {
  const counts = new Map<string, number>();
  for (const e of evidence) {
    const area = firstNonEmpty(e.learning_area, "General");
    counts.set(area, (counts.get(area) || 0) + 1);
  }
  let winner = "Getting Started";
  let best = -1;
  counts.forEach((count, area) => {
    if (count > best) {
      best = count;
      winner = area;
    }
  });
  return winner;
}

function weakestAreaFromCoverage(cards: CoverageCard[]) {
  if (!cards.length) return "Add first learning entry";
  const ordered = [...cards].sort(
    (a, b) => a.count - b.count || daysSince(b.lastDate) - daysSince(a.lastDate)
  );
  return ordered[0]?.area || "Add first learning entry";
}

function cardTone(status: CoverageCard["status"]) {
  if (status === "Strong") {
    return {
      bg: "#ecfdf5",
      bd: "#a7f3d0",
      fg: "#166534",
      soft: "#dcfce7",
    };
  }
  if (status === "Watch") {
    return {
      bg: "#fff7ed",
      bd: "#fed7aa",
      fg: "#9a3412",
      soft: "#ffedd5",
    };
  }
  return {
    bg: "#fff1f2",
    bd: "#fecdd3",
    fg: "#be123c",
    soft: "#ffe4e6",
  };
}

function summaryTone(kind: "good" | "watch" | "neutral" | "action") {
  if (kind === "good") {
    return { bg: "#eff6ff", bd: "#bfdbfe", fg: "#1d4ed8" };
  }
  if (kind === "watch") {
    return { bg: "#fff7ed", bd: "#fed7aa", fg: "#9a3412" };
  }
  if (kind === "action") {
    return { bg: "#f5f3ff", bd: "#ddd6fe", fg: "#6d28d9" };
  }
  return { bg: "#f8fafc", bd: "#e2e8f0", fg: "#334155" };
}

function buttonStyle(
  primary = false,
  size: "sm" | "md" = "md"
): React.CSSProperties {
  return {
    border: "1px solid " + (primary ? "#2563eb" : "#d1d5db"),
    background: primary ? "#2563eb" : "#ffffff",
    color: primary ? "#ffffff" : "#111827",
    borderRadius: 10,
    padding: size === "sm" ? "8px 12px" : "10px 14px",
    fontWeight: 700,
    fontSize: size === "sm" ? 13 : 14,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  };
}

function buildCoverageCardsForStudent(evidence: EvidenceRow[]) {
  return LEARNING_AREAS.map((area) => {
    const rows = evidence.filter(
      (e) => safe(e.learning_area).toLowerCase() === area.toLowerCase()
    );
    const latest =
      rows
        .map((e) => evidenceDate(e))
        .filter(Boolean)
        .sort()
        .reverse()[0] || null;

    const count = rows.length;
    const status = statusForCoverage(count, latest);

    return {
      area,
      count,
      lastDate: latest,
      status,
      suggestion: suggestionForArea(area),
    } satisfies CoverageCard;
  });
}

/* ───────────────────────── SCREEN ───────────────────────── */

export default function FamilyDashboardScreen({
  mode = "public",
}: FamilyDashboardScreenProps) {
  const isPublic = mode === "public";

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);
  const [frameworks, setFrameworks] =
    useState<FrameworkOption[]>(FALLBACK_FRAMEWORKS);

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedFrameworkId, setSelectedFrameworkId] =
    useState("au-acara-v9");
  const [reportingPeriod, setReportingPeriod] = useState("Term 1, 2026");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveMessage, setSaveMessage] = useState("");

  const [form, setForm] = useState<QuickEntryForm>({
    studentId: "",
    title: "",
    description: "",
    date: todayIso(),
    evidenceType: "Activity",
    learningAreas: [],
  });

  async function loadStudents() {
    let lastErr: any = null;

    const variants = [
      "id,class_id,preferred_name,first_name,surname,is_ilp,year_level,created_at",
      "id,class_id,preferred_name,first_name,family_name,is_ilp,year_level,created_at",
      "id,class_id,preferred_name,first_name,last_name,is_ilp,year_level,created_at",
      "id,class_id,preferred_name,first_name,is_ilp,year_level,created_at",
    ];

    for (const select of variants) {
      const res = await supabase
        .from("students")
        .select(select)
        .order("preferred_name", { ascending: true });

      if (!res.error) {
        return ((res.data || []) as unknown) as StudentRow[];
      }
      lastErr = res.error;
      if (!isMissingRelationOrColumn(res.error)) break;
    }

    if (lastErr) throw lastErr;
    return [];
  }

  async function loadEvidence() {
    const variants = [
      "id,student_id,class_id,title,summary,body,note,learning_area,evidence_type,occurred_on,created_at,visibility,is_deleted,attachment_urls,image_url,photo_url,file_url",
      "id,student_id,class_id,title,summary,body,learning_area,evidence_type,occurred_on,created_at,visibility,is_deleted,attachment_urls,image_url,photo_url,file_url",
      "id,student_id,class_id,title,summary,learning_area,evidence_type,occurred_on,created_at,is_deleted",
    ];

    let lastErr: any = null;

    for (const select of variants) {
      const res = await supabase
        .from("evidence_entries")
        .select(select)
        .order("occurred_on", { ascending: false })
        .order("created_at", { ascending: false });

      if (!res.error) {
        return (((res.data || []) as unknown) as EvidenceRow[]).filter((x) => !x.is_deleted);
      }

      lastErr = res.error;
      if (!isMissingRelationOrColumn(res.error)) break;
    }

    if (lastErr) throw lastErr;
    return [];
  }

  async function loadFrameworks() {
    const variants = [
      "id,key,name,description,is_active",
      "id,name,description,is_active",
      "id,key,name",
    ];

    for (const select of variants) {
      const res = await supabase.from("curriculum_frameworks").select(select);
      if (!res.error) {
        const rows = (res.data || []).map((r: any) => ({
          id: safe(r.id || r.key || r.name),
          label: safe(r.name) || safe(r.key) || "Framework",
          country: "Configured",
          region: safe(r.description),
        })) as FrameworkOption[];

        if (rows.length) return rows;
      }

      if (!isMissingRelationOrColumn(res.error)) break;
    }

    return FALLBACK_FRAMEWORKS;
  }

  async function loadAll() {
    try {
      setLoading(true);
      setError("");

      const [studentRows, evidenceRows, frameworkRows] = await Promise.all([
        loadStudents(),
        loadEvidence(),
        loadFrameworks(),
      ]);

      setStudents(studentRows);
      setEvidence(evidenceRows);
      setFrameworks(frameworkRows);

      const storedChild =
        typeof window !== "undefined"
          ? localStorage.getItem("edudecks.family.selectedStudentId")
          : "";

      const storedFramework =
        typeof window !== "undefined"
          ? localStorage.getItem("edudecks.family.selectedFrameworkId")
          : "";

      const nextStudentId =
        studentRows.find((s) => s.id === storedChild)?.id ||
        studentRows[0]?.id ||
        "";

      setSelectedStudentId(nextStudentId);
      setSelectedFrameworkId(
        frameworkRows.find((f) => f.id === storedFramework)?.id ||
          storedFramework ||
          frameworkRows[0]?.id ||
          "au-acara-v9"
      );
      setForm((prev) => ({
        ...prev,
        studentId: nextStudentId,
      }));
    } catch (err: any) {
      setError(String(err?.message || err || "Failed to load family dashboard."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (selectedStudentId) {
      localStorage.setItem("edudecks.family.selectedStudentId", selectedStudentId);
    }
  }, [selectedStudentId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (selectedFrameworkId) {
      localStorage.setItem(
        "edudecks.family.selectedFrameworkId",
        selectedFrameworkId
      );
    }
  }, [selectedFrameworkId]);

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) || null,
    [students, selectedStudentId]
  );

  const evidenceByStudent = useMemo(() => {
    const map = new Map<string, EvidenceRow[]>();
    for (const row of evidence) {
      const key = safe(row.student_id);
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    }
    return map;
  }, [evidence]);

  const selectedEvidence = useMemo(
    () => evidenceByStudent.get(selectedStudentId) || [],
    [evidenceByStudent, selectedStudentId]
  );

  const selectedCoverage = useMemo(
    () => buildCoverageCardsForStudent(selectedEvidence),
    [selectedEvidence]
  );

  const familySnapshots = useMemo<ChildSnapshot[]>(() => {
    return students.map((student) => {
      const rows = evidenceByStudent.get(student.id) || [];
      const coverage = buildCoverageCardsForStudent(rows);
      const readinessPercent = readinessPercentFromCoverage(coverage);

      return {
        student,
        evidenceCount: rows.length,
        lastEvidenceDate:
          rows
            .map((r) => evidenceDate(r))
            .filter(Boolean)
            .sort()
            .reverse()[0] || null,
        strongestArea: strongestAreaFromEvidence(rows),
        weakestArea: weakestAreaFromCoverage(coverage),
        readinessPercent,
        statusLabel: overallCoverageLabel(coverage),
      };
    });
  }, [students, evidenceByStudent]);

  const overallCoverage = useMemo(
    () => overallCoverageLabel(selectedCoverage),
    [selectedCoverage]
  );

  const portfolioReadiness = useMemo(
    () => readinessPercentFromCoverage(selectedCoverage),
    [selectedCoverage]
  );

  const recentTimeline = useMemo(() => {
    return [...selectedEvidence]
      .sort((a, b) => {
        const da = safe(a.occurred_on || a.created_at);
        const db = safe(b.occurred_on || b.created_at);
        return db.localeCompare(da);
      })
      .slice(0, 8);
  }, [selectedEvidence]);

  const strongestSelectedArea = useMemo(
    () => strongestAreaFromEvidence(selectedEvidence),
    [selectedEvidence]
  );

  const weakestSelectedArea = useMemo(
    () => weakestAreaFromCoverage(selectedCoverage),
    [selectedCoverage]
  );

  const nextBestAction = useMemo(() => {
    const weakest = selectedCoverage.find((c) => c.status !== "Strong");
    if (!weakest) {
      return "Keep capturing representative learning samples across the week.";
    }
    return weakest.suggestion;
  }, [selectedCoverage]);

  const selectedFramework = useMemo(
    () =>
      frameworks.find((f) => f.id === selectedFrameworkId) ||
      frameworks[0] ||
      null,
    [frameworks, selectedFrameworkId]
  );

  function toggleArea(area: string) {
    setForm((prev) => {
      const exists = prev.learningAreas.includes(area);
      return {
        ...prev,
        learningAreas: exists
          ? prev.learningAreas.filter((x) => x !== area)
          : [...prev.learningAreas, area],
      };
    });
  }

  async function submitQuickAdd() {
    if (!safe(form.studentId)) {
      setSaveStatus("error");
      setSaveMessage("Please select a child.");
      return;
    }
    if (!safe(form.title)) {
      setSaveStatus("error");
      setSaveMessage("Please add a short title.");
      return;
    }

    try {
      setSaveStatus("saving");
      setSaveMessage("");

      const payload = {
        student_id: form.studentId,
        title: form.title,
        summary: form.description,
        body: form.description,
        note: form.description,
        learning_area: form.learningAreas[0] || null,
        evidence_type: form.evidenceType,
        occurred_on: form.date || todayIso(),
        created_at: new Date().toISOString(),
        visibility: "parent_safe",
        is_deleted: false,
      };

      const attempt1 = await supabase
        .from("evidence_entries")
        .insert(payload)
        .select("id")
        .single();

      if (attempt1.error && isMissingRelationOrColumn(attempt1.error)) {
        const fallbackPayload = {
          student_id: form.studentId,
          title: form.title,
          summary: form.description,
          learning_area: form.learningAreas[0] || null,
          evidence_type: form.evidenceType,
          occurred_on: form.date || todayIso(),
          created_at: new Date().toISOString(),
        };

        const attempt2 = await supabase
          .from("evidence_entries")
          .insert(fallbackPayload)
          .select("id")
          .single();

        if (attempt2.error) throw attempt2.error;
      } else if (attempt1.error) {
        throw attempt1.error;
      }

      setSaveStatus("success");
      setSaveMessage("Learning record saved.");
      setQuickAddOpen(false);
      setForm({
        studentId: selectedStudentId,
        title: "",
        description: "",
        date: todayIso(),
        evidenceType: "Activity",
        learningAreas: [],
      });
      await loadAll();
    } catch (err: any) {
      setSaveStatus("error");
      setSaveMessage(String(err?.message || err || "Could not save learning entry."));
    }
  }

  return (
    <div style={{ color: "#0f172a" }}>
      {isPublic ? (
        <section
          style={{
            marginBottom: 22,
            borderRadius: 26,
            overflow: "hidden",
            background:
              "linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(124,58,237,0.08) 100%)",
            border: "1px solid rgba(191,219,254,0.9)",
            boxShadow: "0 18px 50px rgba(15,23,42,0.06)",
          }}
        >
          <div
            style={{
              padding: "28px 24px",
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.3fr) minmax(260px, 0.9fr)",
              gap: 24,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  color: "#475569",
                  marginBottom: 10,
                }}
              >
                Homeschool Dashboard
              </div>
              <div
                style={{
                  fontSize: 34,
                  lineHeight: 1.1,
                  fontWeight: 900,
                  color: "#0f172a",
                  marginBottom: 12,
                }}
              >
                Your Family Learning Home
              </div>
              <div
                style={{
                  maxWidth: 760,
                  fontSize: 16,
                  lineHeight: 1.6,
                  color: "#334155",
                }}
              >
                Keep daily capture simple, stay confident about curriculum coverage,
                and grow a professional record of your child’s progress over time.
              </div>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.8)",
                border: "1px solid rgba(226,232,240,0.95)",
                borderRadius: 20,
                padding: 18,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 900,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: "#64748b",
                  marginBottom: 8,
                }}
              >
                Today’s focus
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  color: "#0f172a",
                  marginBottom: 8,
                }}
              >
                {weakestSelectedArea || "Start with one learning entry"}
              </div>
              <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.55 }}>
                {nextBestAction}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 18,
          padding: 20,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 20,
          boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              color: "#64748b",
              marginBottom: 6,
            }}
          >
            Family Dashboard
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: "#0f172a",
              marginBottom: 6,
            }}
          >
            {isPublic ? "Bint Family Dashboard" : "Family Learning Home"}
          </div>
          <div style={{ fontSize: 14, color: "#475569" }}>
            Record real learning, see what is covered, and keep reporting calm and organised.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
          }}
        >
          <select
            value={reportingPeriod}
            onChange={(e) => setReportingPeriod(e.target.value)}
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 10,
              padding: "10px 12px",
              background: "#fff",
              minWidth: 160,
            }}
          >
            <option>Term 1, 2026</option>
            <option>Term 2, 2026</option>
            <option>Semester 1, 2026</option>
            <option>Annual, 2026</option>
          </select>

          <select
            value={selectedFrameworkId}
            onChange={(e) => setSelectedFrameworkId(e.target.value)}
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 10,
              padding: "10px 12px",
              background: "#fff",
              minWidth: 260,
            }}
          >
            {frameworks.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>

          <select
            value={selectedStudentId}
            onChange={(e) => {
              setSelectedStudentId(e.target.value);
              setForm((prev) => ({ ...prev, studentId: e.target.value }));
            }}
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 10,
              padding: "10px 12px",
              background: "#fff",
              minWidth: 180,
            }}
          >
            {students.length === 0 ? (
              <option value="">No children yet</option>
            ) : (
              students.map((s) => (
                <option key={s.id} value={s.id}>
                  {studentName(s)}
                </option>
              ))
            )}
          </select>

          <button style={buttonStyle(true)} onClick={() => setQuickAddOpen(true)}>
            + Add Learning
          </button>
        </div>
      </div>

      {error ? (
        <div
          style={{
            background: "#fff1f2",
            border: "1px solid #fecdd3",
            color: "#be123c",
            padding: 14,
            borderRadius: 14,
            marginBottom: 16,
            fontWeight: 700,
          }}
        >
          {error}
        </div>
      ) : null}

      {saveMessage ? (
        <div
          style={{
            background:
              saveStatus === "error"
                ? "#fff1f2"
                : saveStatus === "success"
                ? "#ecfdf5"
                : "#eff6ff",
            border:
              saveStatus === "error"
                ? "1px solid #fecdd3"
                : saveStatus === "success"
                ? "1px solid #a7f3d0"
                : "1px solid #bfdbfe",
            color:
              saveStatus === "error"
                ? "#be123c"
                : saveStatus === "success"
                ? "#166534"
                : "#1d4ed8",
            padding: 14,
            borderRadius: 14,
            marginBottom: 16,
            fontWeight: 700,
          }}
        >
          {saveMessage}
        </div>
      ) : null}

      {loading ? (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 18,
            padding: 24,
            color: "#475569",
          }}
        >
          Loading family dashboard…
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
              gap: 16,
              marginBottom: 20,
            }}
          >
            {[
              {
                title: "Coverage",
                value: overallCoverage.toUpperCase(),
                text:
                  overallCoverage === "On Track"
                    ? "Most key learning areas have recent evidence."
                    : overallCoverage === "Watch"
                    ? "Several areas look healthy, but one or two need attention."
                    : "Add fresh evidence in weaker areas to strengthen reporting confidence.",
                tone:
                  overallCoverage === "On Track"
                    ? "good"
                    : overallCoverage === "Watch"
                    ? "watch"
                    : "neutral",
              },
              {
                title: "Progress",
                value: strongestSelectedArea || "Getting Started",
                text:
                  selectedEvidence.length > 0
                    ? `Recent learning shows strongest momentum in ${strongestSelectedArea}.`
                    : "Start with one simple learning entry to begin the record.",
                tone: "good",
              },
              {
                title: "Portfolio",
                value: `${portfolioReadiness}% READY`,
                text:
                  portfolioReadiness >= 75
                    ? "You have enough representative evidence in most areas."
                    : portfolioReadiness >= 50
                    ? "A few more balanced entries would strengthen your portfolio."
                    : "Build a stronger spread of evidence before reporting time.",
                tone:
                  portfolioReadiness >= 75
                    ? "good"
                    : portfolioReadiness >= 50
                    ? "watch"
                    : "neutral",
              },
              {
                title: "Next Step",
                value: weakestSelectedArea || "Start Here",
                text: nextBestAction,
                tone: "action",
              },
            ].map((card) => {
              const tone = summaryTone(card.tone as any);
              return (
                <div
                  key={card.title}
                  style={{
                    background: tone.bg,
                    border: `1px solid ${tone.bd}`,
                    borderRadius: 18,
                    padding: 18,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: 1.1,
                      textTransform: "uppercase",
                      color: tone.fg,
                      marginBottom: 10,
                    }}
                  >
                    {card.title}
                  </div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 900,
                      color: "#0f172a",
                      marginBottom: 8,
                    }}
                  >
                    {card.value}
                  </div>
                  <div style={{ fontSize: 14, color: "#334155", lineHeight: 1.45 }}>
                    {card.text}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 18,
              padding: 20,
              marginBottom: 20,
              boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 16,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    color: "#0f172a",
                    marginBottom: 4,
                  }}
                >
                  Child Snapshots
                </div>
                <div style={{ fontSize: 14, color: "#64748b" }}>
                  A calm overview of progress, coverage, and portfolio readiness.
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link
                  href={isPublic ? "/reports" : "/admin/homeschool-reporting"}
                  style={buttonStyle(false)}
                >
                  Open Reporting
                </Link>
                <Link
                  href={isPublic ? "/portfolio" : "/admin/family-print-centre"}
                  style={buttonStyle(false)}
                >
                  Print Centre
                </Link>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 16,
              }}
            >
              {familySnapshots.length === 0 ? (
                <div
                  style={{
                    border: "1px dashed #cbd5e1",
                    borderRadius: 16,
                    padding: 18,
                    color: "#64748b",
                    background: "#f8fafc",
                  }}
                >
                  No child records found yet. Add student records first, then return here.
                </div>
              ) : (
                familySnapshots.map((snap) => {
                  const active = snap.student.id === selectedStudentId;
                  return (
                    <button
                      key={snap.student.id}
                      onClick={() => {
                        setSelectedStudentId(snap.student.id);
                        setForm((prev) => ({ ...prev, studentId: snap.student.id }));
                      }}
                      style={{
                        textAlign: "left",
                        border: active ? "2px solid #2563eb" : "1px solid #e5e7eb",
                        borderRadius: 16,
                        padding: 18,
                        background: active ? "#eff6ff" : "#ffffff",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 10,
                          marginBottom: 10,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 900,
                            color: "#0f172a",
                          }}
                        >
                          {studentName(snap.student)}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 800,
                            padding: "6px 10px",
                            borderRadius: 999,
                            background:
                              snap.statusLabel === "On Track"
                                ? "#dcfce7"
                                : snap.statusLabel === "Watch"
                                ? "#ffedd5"
                                : "#ffe4e6",
                            color:
                              snap.statusLabel === "On Track"
                                ? "#166534"
                                : snap.statusLabel === "Watch"
                                ? "#9a3412"
                                : "#be123c",
                          }}
                        >
                          {snap.statusLabel}
                        </div>
                      </div>

                      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>
                        {snap.student.year_level
                          ? `Year ${snap.student.year_level}`
                          : "Year equivalent not set"}
                      </div>

                      <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
                        <div style={{ fontSize: 14, color: "#334155" }}>
                          <strong>Strongest:</strong> {snap.strongestArea}
                        </div>
                        <div style={{ fontSize: 14, color: "#334155" }}>
                          <strong>Needs attention:</strong> {snap.weakestArea}
                        </div>
                        <div style={{ fontSize: 14, color: "#334155" }}>
                          <strong>Last learning:</strong> {shortDate(snap.lastEvidenceDate)}
                        </div>
                      </div>

                      <div style={{ marginBottom: 8 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 13,
                            color: "#475569",
                            marginBottom: 6,
                          }}
                        >
                          <span>Portfolio readiness</span>
                          <strong>{snap.readinessPercent}%</strong>
                        </div>
                        <div
                          style={{
                            height: 10,
                            borderRadius: 999,
                            background: "#e2e8f0",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${snap.readinessPercent}%`,
                              height: "100%",
                              background:
                                snap.readinessPercent >= 75
                                  ? "#16a34a"
                                  : snap.readinessPercent >= 50
                                  ? "#f59e0b"
                                  : "#e11d48",
                            }}
                          />
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.45fr) minmax(320px, 0.95fr)",
              gap: 20,
            }}
          >
            <div style={{ display: "grid", gap: 20 }}>
              <section
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 18,
                  padding: 20,
                  boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 900,
                        color: "#0f172a",
                        marginBottom: 4,
                      }}
                    >
                      Recent Learning
                    </div>
                    <div style={{ fontSize: 14, color: "#64748b" }}>
                      A simple, Seesaw-style timeline of recent learning records.
                    </div>
                  </div>

                  <button style={buttonStyle(true)} onClick={() => setQuickAddOpen(true)}>
                    + Add Learning
                  </button>
                </div>

                {recentTimeline.length === 0 ? (
                  <div
                    style={{
                      border: "1px dashed #cbd5e1",
                      borderRadius: 14,
                      padding: 18,
                      background: "#f8fafc",
                      color: "#64748b",
                    }}
                  >
                    No learning records yet for this child. Add your first entry to begin building the timeline and portfolio.
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 12 }}>
                    {recentTimeline.map((item) => {
                      const text =
                        firstNonEmpty(item.summary, item.body, item.note) ||
                        "Learning entry";
                      return (
                        <div
                          key={item.id}
                          style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: 14,
                            padding: 14,
                            background: "#ffffff",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              gap: 12,
                              marginBottom: 8,
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontSize: 16,
                                  fontWeight: 800,
                                  color: "#0f172a",
                                  marginBottom: 4,
                                }}
                              >
                                {firstNonEmpty(
                                  item.title,
                                  item.evidence_type,
                                  "Learning Entry"
                                )}
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  gap: 8,
                                  flexWrap: "wrap",
                                  fontSize: 12,
                                  color: "#475569",
                                }}
                              >
                                <span>{shortDate(item.occurred_on || item.created_at)}</span>
                                <span>•</span>
                                <span>{firstNonEmpty(item.learning_area, "General Learning")}</span>
                                <span>•</span>
                                <span>{firstNonEmpty(item.evidence_type, "Entry")}</span>
                              </div>
                            </div>

                            <Link
                              href={isPublic ? "/portfolio" : "/admin/evidence"}
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: "#2563eb",
                                textDecoration: "none",
                              }}
                            >
                              {isPublic ? "Open portfolio" : "View evidence"}
                            </Link>
                          </div>

                          <div
                            style={{
                              fontSize: 14,
                              color: "#334155",
                              lineHeight: 1.5,
                            }}
                          >
                            {text}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <section
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 18,
                  padding: 20,
                  boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
                }}
              >
                <div style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 900,
                      color: "#0f172a",
                      marginBottom: 4,
                    }}
                  >
                    Coverage Overview
                  </div>
                  <div style={{ fontSize: 14, color: "#64748b" }}>
                    This keeps the dashboard calm and practical: what is strong,
                    what needs more evidence, and what to do next.
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 14,
                  }}
                >
                  {selectedCoverage.map((card) => {
                    const tone = cardTone(card.status);
                    return (
                      <div
                        key={card.area}
                        style={{
                          background: tone.bg,
                          border: `1px solid ${tone.bd}`,
                          borderRadius: 16,
                          padding: 16,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 10,
                            marginBottom: 10,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 16,
                              fontWeight: 900,
                              color: "#0f172a",
                            }}
                          >
                            {card.area}
                          </div>
                          <div
                            style={{
                              background: tone.soft,
                              color: tone.fg,
                              borderRadius: 999,
                              fontSize: 12,
                              fontWeight: 800,
                              padding: "6px 10px",
                            }}
                          >
                            {card.status}
                          </div>
                        </div>

                        <div style={{ fontSize: 14, color: "#334155", marginBottom: 6 }}>
                          <strong>Evidence this period:</strong> {card.count}
                        </div>
                        <div style={{ fontSize: 14, color: "#334155", marginBottom: 10 }}>
                          <strong>Last activity:</strong> {shortDate(card.lastDate)}
                        </div>
                        <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.45 }}>
                          {card.suggestion}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            <div style={{ display: "grid", gap: 20 }}>
              <section
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 18,
                  padding: 20,
                  boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
                }}
              >
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    color: "#0f172a",
                    marginBottom: 14,
                  }}
                >
                  Selected Child
                </div>

                {selectedStudent ? (
                  <>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 900,
                        color: "#0f172a",
                        marginBottom: 6,
                      }}
                    >
                      {studentName(selectedStudent)}
                    </div>
                    <div style={{ fontSize: 14, color: "#64748b", marginBottom: 14 }}>
                      {selectedStudent.year_level
                        ? `Year ${selectedStudent.year_level} equivalent`
                        : "Year equivalent not set"}{" "}
                      • Framework: {selectedFramework?.label || "Not selected"}
                    </div>

                    <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
                      <div style={{ fontSize: 14, color: "#334155" }}>
                        <strong>Strongest area:</strong> {strongestSelectedArea}
                      </div>
                      <div style={{ fontSize: 14, color: "#334155" }}>
                        <strong>Needs more evidence:</strong> {weakestSelectedArea}
                      </div>
                      <div style={{ fontSize: 14, color: "#334155" }}>
                        <strong>Last learning recorded:</strong>{" "}
                        {shortDate(
                          selectedEvidence
                            .map((r) => evidenceDate(r))
                            .filter(Boolean)
                            .sort()
                            .reverse()[0] || null
                        )}
                      </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 13,
                          color: "#475569",
                          marginBottom: 6,
                        }}
                      >
                        <span>Portfolio readiness</span>
                        <strong>{portfolioReadiness}%</strong>
                      </div>
                      <div
                        style={{
                          height: 12,
                          borderRadius: 999,
                          background: "#e2e8f0",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${portfolioReadiness}%`,
                            height: "100%",
                            background:
                              portfolioReadiness >= 75
                                ? "#16a34a"
                                : portfolioReadiness >= 50
                                ? "#f59e0b"
                                : "#e11d48",
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gap: 10 }}>
                      <Link
                        href={isPublic ? "/reports" : "/admin/homeschool-reporting"}
                        style={buttonStyle(false)}
                      >
                        Open Reporting
                      </Link>
                      <Link
                        href={isPublic ? "/portfolio" : "/admin/family-print-centre"}
                        style={buttonStyle(false)}
                      >
                        Open Print Centre
                      </Link>
                      <button style={buttonStyle(true)} onClick={() => setQuickAddOpen(true)}>
                        + Add Learning
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 14, color: "#64748b" }}>
                    Select a child to see a focused summary.
                  </div>
                )}
              </section>

              <section
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 18,
                  padding: 20,
                  boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
                }}
              >
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    color: "#0f172a",
                    marginBottom: 12,
                  }}
                >
                  Reporting Confidence
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  {[
                    {
                      title: "Balanced learning",
                      text:
                        portfolioReadiness >= 75
                          ? "Your current evidence shows a healthy spread across learning areas."
                          : "A few more balanced entries would strengthen the term record.",
                    },
                    {
                      title: "Representative samples",
                      text:
                        selectedEvidence.length >= 6
                          ? "You have enough entries to begin selecting representative samples."
                          : "Add more learning records so your portfolio shows a fuller picture.",
                    },
                    {
                      title: "Next reporting move",
                      text: nextBestAction,
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 14,
                        padding: 14,
                        background: "#f8fafc",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: "#0f172a",
                          marginBottom: 6,
                        }}
                      >
                        {item.title}
                      </div>
                      <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.45 }}>
                        {item.text}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 18,
                  padding: 20,
                  boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
                }}
              >
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    color: "#0f172a",
                    marginBottom: 12,
                  }}
                >
                  Jurisdiction & Framework
                </div>

                <div
                  style={{
                    fontSize: 14,
                    color: "#475569",
                    lineHeight: 1.55,
                    marginBottom: 12,
                  }}
                >
                  This dashboard is designed so families can align learning to the
                  framework that fits their registration context, while still keeping
                  daily capture simple.
                </div>

                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    padding: 14,
                    background: "#f8fafc",
                  }}
                >
                  <div style={{ fontSize: 14, color: "#334155", marginBottom: 6 }}>
                    <strong>Current framework:</strong> {selectedFramework?.label || "Not selected"}
                  </div>
                  <div style={{ fontSize: 14, color: "#334155" }}>
                    <strong>Reporting period:</strong> {reportingPeriod}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </>
      )}

      {quickAddOpen ? (
        <div
          onClick={() => setQuickAddOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.42)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 60,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 760,
              background: "#ffffff",
              borderRadius: 20,
              border: "1px solid #e5e7eb",
              boxShadow: "0 24px 70px rgba(15,23,42,0.25)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: 20,
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: "#0f172a",
                    marginBottom: 4,
                  }}
                >
                  Quick Add Learning
                </div>
                <div style={{ fontSize: 14, color: "#64748b" }}>
                  Capture a learning moment now and organise it later.
                </div>
              </div>

              <button
                onClick={() => setQuickAddOpen(false)}
                style={{
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  borderRadius: 10,
                  padding: "8px 12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>

            <div style={{ padding: 20, display: "grid", gap: 16 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 14,
                }}
              >
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                    Child
                  </label>
                  <select
                    value={form.studentId}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, studentId: e.target.value }))
                    }
                    style={{
                      width: "100%",
                      border: "1px solid #d1d5db",
                      borderRadius: 10,
                      padding: "10px 12px",
                      background: "#fff",
                    }}
                  >
                    <option value="">Select child</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {studentName(s)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                    Date
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, date: e.target.value }))
                    }
                    style={{
                      width: "100%",
                      border: "1px solid #d1d5db",
                      borderRadius: 10,
                      padding: "10px 12px",
                      background: "#fff",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                    Entry type
                  </label>
                  <select
                    value={form.evidenceType}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, evidenceType: e.target.value }))
                    }
                    style={{
                      width: "100%",
                      border: "1px solid #d1d5db",
                      borderRadius: 10,
                      padding: "10px 12px",
                      background: "#fff",
                    }}
                  >
                    {EVIDENCE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                  Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="e.g. Nature journal and leaf classification"
                  style={{
                    width: "100%",
                    border: "1px solid #d1d5db",
                    borderRadius: 10,
                    padding: "10px 12px",
                    background: "#fff",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                  What did you do?
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={5}
                  placeholder="Briefly describe the activity, discussion, project, or learning moment."
                  style={{
                    width: "100%",
                    border: "1px solid #d1d5db",
                    borderRadius: 10,
                    padding: "10px 12px",
                    background: "#fff",
                    resize: "vertical",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                  Learning areas
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {LEARNING_AREAS.map((area) => {
                    const active = form.learningAreas.includes(area);
                    return (
                      <button
                        key={area}
                        type="button"
                        onClick={() => toggleArea(area)}
                        style={{
                          border: active ? "1px solid #2563eb" : "1px solid #d1d5db",
                          background: active ? "#eff6ff" : "#fff",
                          color: active ? "#1d4ed8" : "#334155",
                          borderRadius: 999,
                          padding: "8px 12px",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {area}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div
              style={{
                padding: 20,
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ fontSize: 13, color: "#64748b" }}>
                Keep entry fast now. You can refine, group, and export later.
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setQuickAddOpen(false)}
                  style={buttonStyle(false)}
                >
                  Cancel
                </button>
                <button
                  onClick={submitQuickAdd}
                  style={buttonStyle(true)}
                  disabled={saveStatus === "saving"}
                >
                  {saveStatus === "saving" ? "Saving..." : "Save Learning"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isPublic ? (
        <button
          onClick={() => setQuickAddOpen(true)}
          style={{
            position: "fixed",
            right: 24,
            bottom: 24,
            border: "none",
            background: "#2563eb",
            color: "#ffffff",
            borderRadius: 999,
            padding: "14px 18px",
            fontWeight: 900,
            fontSize: 14,
            boxShadow: "0 18px 40px rgba(37,99,235,0.28)",
            cursor: "pointer",
            zIndex: 40,
          }}
        >
          + Add Learning
        </button>
      ) : null}
    </div>
  );
}