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

  if (
    x.includes("liter") ||
    x.includes("reading") ||
    x.includes("writing") ||
    x.includes("english") ||
    x.includes("phonics") ||
    x.includes("spelling")
  ) {
    return "Literacy";
  }
  if (
    x.includes("num") ||
    x.includes("math") ||
    x.includes("fraction") ||
    x.includes("number") ||
    x.includes("count") ||
    x.includes("measure")
  ) {
    return "Numeracy";
  }
  if (x.includes("science") || x.includes("experiment") || x.includes("investigat")) {
    return "Science";
  }
  if (
    x.includes("history") ||
    x.includes("geography") ||
    x.includes("human") ||
    x.includes("hass") ||
    x.includes("community")
  ) {
    return "Humanities";
  }
  if (x.includes("art") || x.includes("music") || x.includes("drama") || x.includes("dance")) {
    return "The Arts";
  }
  if (
    x.includes("health") ||
    x.includes("movement") ||
    x.includes("sport") ||
    x.includes("physical") ||
    x.includes("wellbeing")
  ) {
    return "Health & Movement";
  }
  if (x.includes("tech") || x.includes("digital") || x.includes("design")) {
    return "Technology";
  }
  if (x.includes("language")) return "Languages";
  if (x.includes("faith") || x.includes("bible") || x.includes("values")) return "Faith / Values";
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
    yearLabel: safe(child?.yearLabel || child?.year_label),
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
    if (!res.error) return (res.data || []) as StudentRow[];
    lastErr = res.error;
    if (!isMissingRelationOrColumn(res.error)) break;
  }

  if (lastErr) throw lastErr;
  return [];
}

async function loadEvidence(): Promise<EvidenceRow[]> {
  const variants = [
    "id,student_id,title,summary,body,note,learning_area,evidence_type,occurred_on,created_at,curriculum_subject,curriculum_strand,curriculum_skill,is_deleted",
    "id,student_id,title,summary,body,note,learning_area,evidence_type,occurred_on,created_at,is_deleted",
    "id,student_id,title,summary,note,learning_area,occurred_on,created_at,is_deleted",
  ];

  let lastErr: any = null;

  for (const select of variants) {
    const res = await supabase
      .from("evidence_entries")
      .select(select)
      .order("occurred_on", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (!res.error) {
      return ((res.data || []) as EvidenceRow[]).filter((x) => !x.is_deleted);
    }
    lastErr = res.error;
    if (!isMissingRelationOrColumn(res.error)) break;
  }

  if (lastErr) throw lastErr;
  return [];
}

function buildGoals(student: StudentRow | null, evidence: EvidenceRow[]): GoalCard[] {
  const first = firstNameOf(student);
  const studentId = safe(student?.id);

  const areas = [
    "Literacy",
    "Numeracy",
    "Science",
    "Humanities",
    "The Arts",
    "Health & Movement",
  ];

  const evidenceByArea = new Map<string, EvidenceRow[]>();
  areas.forEach((area) => evidenceByArea.set(area, []));

  evidence.forEach((row) => {
    const area = guessArea(row.learning_area);
    if (!evidenceByArea.has(area)) evidenceByArea.set(area, []);
    evidenceByArea.get(area)!.push(row);
  });

  const recentEvidence = evidence.filter((row) => daysSince(row.occurred_on || row.created_at) <= 21);

  const lowCoverageAreas = areas
    .map((area) => ({
      area,
      count: evidenceByArea.get(area)?.length || 0,
      lastSeen:
        [...(evidenceByArea.get(area) || [])]
          .map((r) => safe(r.occurred_on || r.created_at))
          .sort()
          .reverse()[0] || null,
    }))
    .sort((a, b) => a.count - b.count);

  const numeracyEvidence = evidenceByArea.get("Numeracy") || [];
  const literacyEvidence = evidenceByArea.get("Literacy") || [];

  const fractionSignalCount = numeracyEvidence.filter((row) => {
    const t = `${safe(row.title)} ${textOfEvidence(row)} ${safe(row.curriculum_skill)}`.toLowerCase();
    return t.includes("fraction") || t.includes("half") || t.includes("quarter");
  }).length;

  const writingSignalCount = literacyEvidence.filter((row) => {
    const t = `${safe(row.title)} ${textOfEvidence(row)} ${safe(row.curriculum_skill)}`.toLowerCase();
    return t.includes("writing") || t.includes("sentence") || t.includes("paragraph") || t.includes("story");
  }).length;

  const persistenceSignalCount = evidence.filter((row) => {
    const t = `${safe(row.title)} ${textOfEvidence(row)}`.toLowerCase();
    return (
      t.includes("tried again") ||
      t.includes("kept going") ||
      t.includes("persist") ||
      t.includes("improv") ||
      t.includes("practice")
    );
  }).length;

  const goals: GoalCard[] = [];

  const weakest = lowCoverageAreas[0];
  if (weakest) {
    goals.push({
      id: `coverage-${weakest.area.toLowerCase()}`,
      title: `Build consistency in ${weakest.area.toLowerCase()}`,
      description: `Help ${first} build a steadier body of evidence in ${weakest.area.toLowerCase()} so the learning story feels more balanced.`,
      whyNow:
        weakest.count === 0
          ? `There is no saved ${weakest.area.toLowerCase()} evidence yet.`
          : `Only ${weakest.count} ${weakest.area.toLowerCase()} item${weakest.count === 1 ? "" : "s"} are currently visible.`,
      linkedArea: weakest.area,
      linkedEvidenceCount: weakest.count,
      lastActivity: weakest.lastSeen,
      status: weakest.count >= 3 ? "achieved" : weakest.count >= 1 ? "building" : "active",
      confidence: weakest.count >= 3 ? 88 : weakest.count >= 1 ? 58 : 28,
      nextActionText: `Capture one meaningful ${weakest.area.toLowerCase()} moment this week.`,
      captureHref: `/capture?studentId=${encodeURIComponent(studentId)}`,
      plannerHref: `/planner?studentId=${encodeURIComponent(studentId)}&goal=${encodeURIComponent(
        `coverage-${weakest.area.toLowerCase()}`
      )}`,
      badges: [weakest.area, weakest.count === 0 ? "Gap" : "Needs balance"],
      kind: "coverage",
    });
  }

  if (fractionSignalCount > 0 || numeracyEvidence.length > 0) {
    goals.push({
      id: "skill-fractions",
      title: "Strengthen confidence with fractions",
      description: `Keep building ${first}'s understanding of fractions and number relationships through a few stronger examples over time.`,
      whyNow:
        fractionSignalCount > 0
          ? `${fractionSignalCount} recent item${fractionSignalCount === 1 ? "" : "s"} already point toward fractions learning.`
          : "Numeracy evidence is building and is ready for a more focused next step.",
      linkedArea: "Numeracy",
      linkedEvidenceCount: numeracyEvidence.length,
      lastActivity:
        numeracyEvidence
          .map((r) => safe(r.occurred_on || r.created_at))
          .sort()
          .reverse()[0] || null,
      status: fractionSignalCount >= 3 ? "achieved" : numeracyEvidence.length >= 2 ? "building" : "active",
      confidence: fractionSignalCount >= 3 ? 84 : numeracyEvidence.length >= 2 ? 61 : 39,
      nextActionText: "Capture one worked example or explanation showing what now makes sense.",
      captureHref: `/capture?studentId=${encodeURIComponent(studentId)}`,
      plannerHref: `/planner?studentId=${encodeURIComponent(studentId)}&goal=skill-fractions`,
      badges: ["Numeracy", "Skill focus"],
      kind: "skill",
    });
  }

  if (writingSignalCount > 0 || literacyEvidence.length > 0) {
    goals.push({
      id: "skill-writing-confidence",
      title: "Grow writing confidence",
      description: `Encourage ${first} to show a little more independence and confidence in writing over time.`,
      whyNow:
        writingSignalCount > 0
          ? `${writingSignalCount} recent item${writingSignalCount === 1 ? "" : "s"} suggest writing is becoming an active learning thread.`
          : "Literacy evidence is visible and can now be strengthened further.",
      linkedArea: "Literacy",
      linkedEvidenceCount: literacyEvidence.length,
      lastActivity:
        literacyEvidence
          .map((r) => safe(r.occurred_on || r.created_at))
          .sort()
          .reverse()[0] || null,
      status: writingSignalCount >= 3 ? "achieved" : literacyEvidence.length >= 2 ? "building" : "active",
      confidence: writingSignalCount >= 3 ? 82 : literacyEvidence.length >= 2 ? 60 : 36,
      nextActionText: "Capture one short writing moment and note what felt more independent or confident.",
      captureHref: `/capture?studentId=${encodeURIComponent(studentId)}`,
      plannerHref: `/planner?studentId=${encodeURIComponent(studentId)}&goal=skill-writing-confidence`,
      badges: ["Literacy", "Confidence"],
      kind: "skill",
    });
  }

  goals.push({
    id: "habit-capture-rhythm",
    title: "Keep a gentle capture rhythm",
    description:
      "The goal is not perfection — it is a steady rhythm of useful moments that help the bigger learning story grow.",
    whyNow:
      recentEvidence.length >= 2
        ? `${recentEvidence.length} recent capture${recentEvidence.length === 1 ? "" : "s"} show good momentum.`
        : "A simple capture rhythm will make everything else in EduDecks feel easier.",
    linkedArea: "General",
    linkedEvidenceCount: recentEvidence.length,
    lastActivity:
      evidence
        .map((r) => safe(r.occurred_on || r.created_at))
        .sort()
        .reverse()[0] || null,
    status: recentEvidence.length >= 3 ? "achieved" : recentEvidence.length >= 1 ? "building" : "active",
    confidence: recentEvidence.length >= 3 ? 90 : recentEvidence.length >= 1 ? 57 : 25,
    nextActionText: "Aim for one or two meaningful learning captures this week.",
    captureHref: `/capture?studentId=${encodeURIComponent(studentId)}`,
    plannerHref: `/planner?studentId=${encodeURIComponent(studentId)}&goal=habit-capture-rhythm`,
    badges: ["Rhythm", "Momentum"],
    kind: "habit",
  });

  goals.push({
    id: "readiness-report-confidence",
    title: "Build calm reporting confidence",
    description:
      "Help the portfolio and reports feel more trustworthy by collecting a balanced set of real evidence across time.",
    whyNow:
      evidence.length >= 4
        ? `There are already ${evidence.length} evidence item${evidence.length === 1 ? "" : "s"} available to shape into a stronger learning story.`
        : "The reporting engine becomes much more helpful once a few meaningful pieces are in place.",
    linkedArea: "Portfolio / Reports",
    linkedEvidenceCount: evidence.length,
    lastActivity:
      evidence
        .map((r) => safe(r.occurred_on || r.created_at))
        .sort()
        .reverse()[0] || null,
    status: evidence.length >= 6 ? "achieved" : evidence.length >= 3 ? "building" : "active",
    confidence: evidence.length >= 6 ? 88 : evidence.length >= 3 ? 62 : 32,
    nextActionText: "Add one more representative piece, then review Portfolio or Reports.",
    captureHref: `/capture?studentId=${encodeURIComponent(studentId)}`,
    plannerHref: `/planner?studentId=${encodeURIComponent(studentId)}&goal=readiness-report-confidence`,
    badges: ["Confidence", "Reporting"],
    kind: "readiness",
  });

  if (persistenceSignalCount > 0) {
    goals.push({
      id: "habit-persistence",
      title: "Encourage persistence and follow-through",
      description: `There are signs that ${first} is practising resilience and sticking with challenge. This is worth strengthening deliberately.`,
      whyNow: `${persistenceSignalCount} recent item${persistenceSignalCount === 1 ? "" : "s"} suggest persistence and improvement are already showing up.`,
      linkedArea: "Learning habits",
      linkedEvidenceCount: persistenceSignalCount,
      lastActivity:
        evidence
          .filter((row) => {
            const t = `${safe(row.title)} ${textOfEvidence(row)}`.toLowerCase();
            return (
              t.includes("tried again") ||
              t.includes("kept going") ||
              t.includes("persist") ||
              t.includes("improv") ||
              t.includes("practice")
            );
          })
          .map((r) => safe(r.occurred_on || r.created_at))
          .sort()
          .reverse()[0] || null,
      status: persistenceSignalCount >= 3 ? "achieved" : "building",
      confidence: persistenceSignalCount >= 3 ? 80 : 61,
      nextActionText: "Capture one more moment where effort, retrying, or perseverance is clearly visible.",
      captureHref: `/capture?studentId=${encodeURIComponent(studentId)}`,
      plannerHref: `/planner?studentId=${encodeURIComponent(studentId)}&goal=habit-persistence`,
      badges: ["Habit", "Persistence"],
      kind: "habit",
    });
  }

  return goals
    .sort((a, b) => {
      const statusWeight = { active: 0, building: 1, achieved: 2 };
      if (statusWeight[a.status] !== statusWeight[b.status]) {
        return statusWeight[a.status] - statusWeight[b.status];
      }
      return a.confidence - b.confidence;
    })
    .slice(0, 6);
}

function pageStyle(): React.CSSProperties {
  return {
    minHeight: "100vh",
    background: "#f5f7fb",
  };
}

function innerStyle(): React.CSSProperties {
  return {
    width: "100%",
    maxWidth: 1380,
    margin: "0 auto",
    padding: "28px 24px 48px",
  };
}

function topNavStyle(): React.CSSProperties {
  return {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 18,
  };
}

function cardStyle(): React.CSSProperties {
  return {
    border: "1px solid #e5e7eb",
    borderRadius: 22,
    background: "#ffffff",
    boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
  };
}

function sectionStyle(): React.CSSProperties {
  return {
    ...cardStyle(),
    padding: 24,
  };
}

function softCardStyle(): React.CSSProperties {
  return {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 14,
    background: "#f8fafc",
  };
}

function chipStyle(
  tone: "blue" | "green" | "amber" | "slate" | "red" = "slate"
): React.CSSProperties {
  const map = {
    blue: { bg: "#eff6ff", bd: "#bfdbfe", fg: "#2563eb" },
    green: { bg: "#ecfdf5", bd: "#a7f3d0", fg: "#166534" },
    amber: { bg: "#fff7ed", bd: "#fed7aa", fg: "#9a3412" },
    slate: { bg: "#ffffff", bd: "#d1d5db", fg: "#475569" },
    red: { bg: "#fff1f2", bd: "#fecdd3", fg: "#be123c" },
  };
  const t = map[tone];
  return {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    background: t.bg,
    border: `1px solid ${t.bd}`,
    color: t.fg,
    fontSize: 12,
    fontWeight: 800,
  };
}

function buttonStyle(primary = false): React.CSSProperties {
  return {
    minHeight: 44,
    padding: "10px 14px",
    borderRadius: 12,
    border: `1px solid ${primary ? "#2563eb" : "#d1d5db"}`,
    background: primary ? "#2563eb" : "#ffffff",
    color: primary ? "#ffffff" : "#111827",
    fontSize: 14,
    fontWeight: 800,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  };
}

function selectStyle(): React.CSSProperties {
  return {
    width: "100%",
    minHeight: 48,
    border: "1px solid #d1d5db",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 14,
    background: "#ffffff",
    color: "#111827",
    outline: "none",
  };
}

function eyebrowStyle(): React.CSSProperties {
  return {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1.05,
    textTransform: "uppercase",
    color: "#64748b",
  };
}

export default function GoalsPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [allEvidence, setAllEvidence] = useState<EvidenceRow[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      try {
        setLoading(true);
        setError("");

        const [dbStudents, evidenceRows] = await Promise.all([
          loadStudents().catch(() => [] as StudentRow[]),
          loadEvidence().catch(() => [] as EvidenceRow[]),
        ]);

        if (!mounted) return;

        const seedStudents = buildSeedStudents();
        const mergedStudents = dbStudents.length > 0 ? dbStudents : seedStudents;

        const storedActive =
          typeof window !== "undefined"
            ? safe(window.localStorage.getItem(ACTIVE_STUDENT_ID_KEY))
            : "";

        const defaultStudentId =
          storedActive && mergedStudents.some((s) => s.id === storedActive)
            ? storedActive
            : mergedStudents[0]?.id || "";

        setStudents(mergedStudents);
        setAllEvidence(evidenceRows);
        setSelectedStudentId(defaultStudentId);
      } catch (err: any) {
        if (!mounted) return;
        setError(String(err?.message || err || "Could not load goals."));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    hydrate();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!safe(selectedStudentId)) return;
    try {
      window.localStorage.setItem(ACTIVE_STUDENT_ID_KEY, selectedStudentId);
    } catch {}
  }, [selectedStudentId]);

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) || students[0] || null,
    [students, selectedStudentId]
  );

  const studentEvidence = useMemo(() => {
    if (!selectedStudent) return [] as EvidenceRow[];
    return allEvidence.filter((row) => safe(row.student_id) === selectedStudent.id);
  }, [allEvidence, selectedStudent]);

  const goals = useMemo(
    () => buildGoals(selectedStudent, studentEvidence),
    [selectedStudent, studentEvidence]
  );

  const activeGoals = useMemo(
    () => goals.filter((goal) => goal.status === "active"),
    [goals]
  );

  const buildingGoals = useMemo(
    () => goals.filter((goal) => goal.status === "building"),
    [goals]
  );

  const achievedGoals = useMemo(
    () => goals.filter((goal) => goal.status === "achieved"),
    [goals]
  );

  const topFocus = goals[0] || null;

  const coverageAreas = useMemo(() => {
    const set = new Set(
      studentEvidence.map((row) => guessArea(row.learning_area)).filter((x) => x !== "Other")
    );
    return Array.from(set);
  }, [studentEvidence]);

  if (loading) {
    return (
      <main style={pageStyle()}>
        <div style={innerStyle()}>
          <section style={sectionStyle()}>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a" }}>Loading goals…</div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle()}>
      <div style={innerStyle()}>
        <div style={topNavStyle()}>
          <div>
            <div style={{ ...eyebrowStyle(), marginBottom: 4 }}>EduDecks Family</div>
            <div style={{ fontSize: 28, lineHeight: 1.1, fontWeight: 900, color: "#0f172a" }}>
              Goals
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/family" style={buttonStyle(false)}>
              Family
            </Link>
            <Link href="/capture" style={buttonStyle(false)}>
              Capture
            </Link>
            <Link href="/planner" style={buttonStyle(false)}>
              Planner
            </Link>
            <Link href="/portfolio" style={buttonStyle(false)}>
              Portfolio
            </Link>
            <Link
              href={`/reports?studentId=${encodeURIComponent(safe(selectedStudent?.id))}`}
              style={buttonStyle(true)}
            >
              Build report
            </Link>
          </div>
        </div>

        {error ? (
          <section
            style={{
              ...sectionStyle(),
              marginBottom: 18,
              border: "1px solid #fecaca",
              background: "#fff1f2",
              color: "#be123c",
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            {error}
          </section>
        ) : null}

        <section
          style={{
            ...sectionStyle(),
            marginBottom: 18,
            background: "linear-gradient(135deg, #f8fbff 0%, #ffffff 100%)",
            border: "1px solid #dbeafe",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1.15fr) minmax(280px,0.85fr)",
              gap: 18,
              alignItems: "start",
            }}
          >
            <div>
              <div style={eyebrowStyle()}>Gentle direction</div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 34,
                  lineHeight: 1.08,
                  fontWeight: 900,
                  color: "#0f172a",
                  maxWidth: 860,
                }}
              >
                What matters next for {firstNameOf(selectedStudent)}
              </div>
              <div
                style={{
                  marginTop: 12,
                  fontSize: 15,
                  lineHeight: 1.75,
                  color: "#475569",
                  maxWidth: 860,
                }}
              >
                Goals in EduDecks are not rigid targets. They are calm, evidence-linked
                suggestions that help you decide what to focus on next.
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
                <span style={chipStyle("blue")}>Evidence-led</span>
                <span style={chipStyle("slate")}>Parent-friendly</span>
                <span style={chipStyle("green")}>Confidence-building</span>
              </div>
            </div>

            <div style={softCardStyle()}>
              <div style={eyebrowStyle()}>Current learner</div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 20,
                  lineHeight: 1.2,
                  fontWeight: 900,
                  color: "#0f172a",
                }}
              >
                {studentName(selectedStudent)}
              </div>
              <div style={{ marginTop: 8, fontSize: 14, color: "#475569", lineHeight: 1.65 }}>
                {studentYearLabel(selectedStudent) || "Year level not set yet"}
              </div>

              <div style={{ marginTop: 14 }}>
                <select
                  value={selectedStudent?.id || ""}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  style={selectStyle()}
                >
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {studentName(student)}
                      {studentYearLabel(student) ? ` — ${studentYearLabel(student)}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: 14,
            marginBottom: 18,
          }}
        >
          <MiniStat label="Evidence items" value={String(studentEvidence.length)} />
          <MiniStat label="Active goals" value={String(activeGoals.length)} />
          <MiniStat label="Building goals" value={String(buildingGoals.length)} />
          <MiniStat label="Achieved goals" value={String(achievedGoals.length)} />
        </section>

        {topFocus ? (
          <section
            style={{
              ...sectionStyle(),
              marginBottom: 18,
              border: "1px solid #bfdbfe",
              background: "linear-gradient(135deg, #eff6ff 0%, #f8fbff 100%)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0,1.2fr) minmax(300px,0.8fr)",
                gap: 20,
                alignItems: "start",
              }}
            >
              <div>
                <div style={{ ...eyebrowStyle(), color: "#1d4ed8" }}>Focus right now</div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 30,
                    lineHeight: 1.08,
                    fontWeight: 900,
                    color: "#0f172a",
                    maxWidth: 900,
                  }}
                >
                  {topFocus.title}
                </div>

                <div
                  style={{
                    marginTop: 12,
                    fontSize: 15,
                    lineHeight: 1.75,
                    color: "#475569",
                    maxWidth: 900,
                  }}
                >
                  {topFocus.description}
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
                  <span style={chipStyle("blue")}>{topFocus.linkedArea}</span>
                  <span
                    style={chipStyle(
                      topFocus.status === "achieved"
                        ? "green"
                        : topFocus.status === "building"
                        ? "amber"
                        : "slate"
                    )}
                  >
                    {topFocus.status === "achieved"
                      ? "Achieved"
                      : topFocus.status === "building"
                      ? "Building"
                      : "Active"}
                  </span>
                  {topFocus.badges.map((badge) => (
                    <span key={badge} style={chipStyle("slate")}>
                      {badge}
                    </span>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
                  <Link href={topFocus.captureHref} style={buttonStyle(true)}>
                    Capture towards this
                  </Link>
                  <Link href={topFocus.plannerHref} style={buttonStyle(false)}>
                    Plan this goal
                  </Link>
                </div>
              </div>

              <div style={softCardStyle()}>
                <div style={eyebrowStyle()}>Why now</div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: "#334155",
                    fontWeight: 700,
                  }}
                >
                  {topFocus.whyNow}
                </div>

                <div style={{ height: 16 }} />

                <div style={{ display: "grid", gap: 10 }}>
                  <MiniLine label="Linked evidence" value={`${topFocus.linkedEvidenceCount}`} />
                  <MiniLine label="Last activity" value={shortDate(topFocus.lastActivity)} />
                  <MiniLine label="Confidence" value={`${topFocus.confidence}%`} />
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1.12fr) minmax(320px,0.88fr)",
            gap: 18,
            alignItems: "start",
          }}
        >
          <div style={{ display: "grid", gap: 18 }}>
            <section style={sectionStyle()}>
              <div style={eyebrowStyle()}>Suggested next focus</div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 24,
                  lineHeight: 1.15,
                  fontWeight: 900,
                  color: "#0f172a",
                }}
              >
                Based on your recent learning
              </div>

              <div style={{ display: "grid", gap: 16, marginTop: 18 }}>
                {goals.filter((g) => g.status !== "achieved").map((goal) => (
                  <GoalRow key={goal.id} goal={goal} />
                ))}

                {!goals.filter((g) => g.status !== "achieved").length ? (
                  <div style={softCardStyle()}>
                    <div style={{ fontSize: 14, lineHeight: 1.7, color: "#475569" }}>
                      No suggested goals yet. Add more evidence and EduDecks will begin proposing
                      focus areas automatically.
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            <section style={sectionStyle()}>
              <div style={eyebrowStyle()}>Achieved / growing confidence</div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 24,
                  lineHeight: 1.15,
                  fontWeight: 900,
                  color: "#0f172a",
                }}
              >
                Goals already building well
              </div>

              <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
                {achievedGoals.length ? (
                  achievedGoals.map((goal) => (
                    <div
                      key={goal.id}
                      style={{
                        ...softCardStyle(),
                        border: "1px solid #bbf7d0",
                        background: "#f0fdf4",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          flexWrap: "wrap",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 17, fontWeight: 900, color: "#14532d" }}>
                            {goal.title}
                          </div>
                          <div
                            style={{
                              marginTop: 6,
                              fontSize: 14,
                              lineHeight: 1.65,
                              color: "#166534",
                            }}
                          >
                            {goal.description}
                          </div>
                        </div>
                        <span style={chipStyle("green")}>Achieved</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={softCardStyle()}>
                    <div style={{ fontSize: 14, lineHeight: 1.7, color: "#475569" }}>
                      As goals strengthen, they will appear here as achieved or strongly building.
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div style={{ display: "grid", gap: 18 }}>
            <section style={sectionStyle()}>
              <div style={eyebrowStyle()}>What this page is doing</div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 20,
                  lineHeight: 1.2,
                  fontWeight: 900,
                  color: "#0f172a",
                }}
              >
                Goals are generated from the evidence you already have
              </div>

              <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
                {[
                  "Looks for low-coverage learning areas",
                  "Spots repeated themes like writing or fractions",
                  "Rewards steady capture rhythm",
                  "Helps point you toward what matters next",
                ].map((item) => (
                  <div key={item} style={softCardStyle()}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#334155",
                        lineHeight: 1.55,
                      }}
                    >
                      {item}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section style={sectionStyle()}>
              <div style={eyebrowStyle()}>Visible learning areas</div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 20,
                  lineHeight: 1.2,
                  fontWeight: 900,
                  color: "#0f172a",
                }}
              >
                Current learning spread
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
                {coverageAreas.length ? (
                  coverageAreas.slice(0, 8).map((area) => (
                    <span key={area} style={chipStyle("blue")}>
                      {area}
                    </span>
                  ))
                ) : (
                  <span style={chipStyle("slate")}>No visible learning areas yet</span>
                )}
              </div>
            </section>

            <section
              style={{
                ...sectionStyle(),
                border: "1px solid #bfdbfe",
                background: "linear-gradient(135deg, #eff6ff 0%, #f8fbff 100%)",
              }}
            >
              <div style={{ ...eyebrowStyle(), color: "#1d4ed8" }}>Planner connection</div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 20,
                  lineHeight: 1.2,
                  fontWeight: 900,
                  color: "#0f172a",
                }}
              >
                Goals should feed a realistic week
              </div>

              <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.7, color: "#475569" }}>
                The next step is not a strict timetable. It is a small set of realistic
                actions that help the learning story grow steadily.
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                <Link
                  href={`/planner?studentId=${encodeURIComponent(safe(selectedStudent?.id))}`}
                  style={buttonStyle(true)}
                >
                  Open Planner
                </Link>
                <Link
                  href={`/capture?studentId=${encodeURIComponent(safe(selectedStudent?.id))}`}
                  style={buttonStyle(false)}
                >
                  Capture learning
                </Link>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        ...cardStyle(),
        padding: 18,
        border: "1px solid #dbeafe",
        background: "rgba(255,255,255,0.9)",
      }}
    >
      <div style={eyebrowStyle()}>{label}</div>
      <div
        style={{
          marginTop: 8,
          fontSize: 32,
          lineHeight: 1.02,
          fontWeight: 900,
          color: "#0f172a",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function MiniLine({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 10,
        alignItems: "center",
        padding: "12px 14px",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        background: "#ffffff",
      }}
    >
      <span style={{ fontSize: 13, color: "#64748b" }}>{label}</span>
      <strong style={{ fontSize: 14, color: "#0f172a" }}>{value}</strong>
    </div>
  );
}

function GoalRow({ goal }: { goal: GoalCard }) {
  const tone =
    goal.status === "achieved"
      ? "green"
      : goal.status === "building"
      ? "amber"
      : "blue";

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 18,
        padding: 18,
        background: "#ffffff",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) auto",
          gap: 14,
          alignItems: "start",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 20,
              lineHeight: 1.15,
              fontWeight: 900,
              color: "#0f172a",
            }}
          >
            {goal.title}
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 1.75,
              color: "#475569",
            }}
          >
            {goal.description}
          </div>
        </div>

        <span style={chipStyle(tone)}>
          {goal.status === "achieved"
            ? "Achieved"
            : goal.status === "building"
            ? "Building"
            : "Active"}
        </span>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
        <span style={chipStyle("slate")}>{goal.linkedArea}</span>
        {goal.badges.map((badge) => (
          <span key={badge} style={chipStyle("slate")}>
            {badge}
          </span>
        ))}
      </div>

      <div
        style={{
          marginTop: 16,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 10,
        }}
      >
        <MiniLine label="Linked evidence" value={`${goal.linkedEvidenceCount}`} />
        <MiniLine label="Last activity" value={shortDate(goal.lastActivity)} />
        <MiniLine label="Confidence" value={`${goal.confidence}%`} />
      </div>

      <div
        style={{
          marginTop: 16,
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 14,
          background: "#f8fafc",
        }}
      >
        <div style={eyebrowStyle()}>Why now</div>
        <div
          style={{
            marginTop: 6,
            fontSize: 13,
            lineHeight: 1.65,
            color: "#334155",
            fontWeight: 700,
          }}
        >
          {goal.whyNow}
        </div>
      </div>

      <div
        style={{
          marginTop: 12,
          border: "1px solid #dbeafe",
          borderRadius: 12,
          padding: 14,
          background: "#eff6ff",
        }}
      >
        <div style={{ ...eyebrowStyle(), color: "#1d4ed8" }}>Next suggested action</div>
        <div
          style={{
            marginTop: 6,
            fontSize: 13,
            lineHeight: 1.65,
            color: "#1e3a8a",
            fontWeight: 700,
          }}
        >
          {goal.nextActionText}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
        <Link href={goal.captureHref} style={buttonStyle(true)}>
          Capture towards this
        </Link>
        <Link href={goal.plannerHref} style={buttonStyle(false)}>
          Plan this goal
        </Link>
      </div>
    </div>
  );
}