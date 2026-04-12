"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";
import {
  createFamilyEvidenceEntry,
  linkEvidenceToOutcomes,
  loadEvidenceOutcomeLinks,
} from "@/lib/familyEvidence";
import {
  loadLinkableOutcomesForStudent,
  type LearnerCurriculumLinkContext,
} from "@/lib/familyCurriculum";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import FamilyHandoffNote from "@/app/components/FamilyHandoffNote";
import UpgradeCard from "@/app/components/premium/UpgradeCard";
import {
  FAMILY_SHELL_HANDOFF_QUERY_PARAM,
  resolveFamilyShellHandoff,
} from "@/lib/familyCommandHandoff";
import { resolveCanonicalActiveLearnerId } from "@/lib/familyWorkspace";
import { hasSupabaseEnv } from "@/lib/supabaseClient";
const PLAN_STORAGE_KEY = "edudecks_plan";
const CHILDREN_KEY = "edudecks_children_seed_v1";
const PORTFOLIO_HIGHLIGHT_EVIDENCE_KEY = "edudecks_portfolio_highlight_evidence_id";
const REPORTS_HIGHLIGHT_EVIDENCE_KEY = "edudecks_reports_highlight_evidence_id";

type ChildRow = {
  id: string;
  first_name?: string | null;
  preferred_name?: string | null;
  surname?: string | null;
  family_name?: string | null;
  year_level?: number | null;
  relationship_label?: string | null;
  yearLabel?: string | null;
  source?: "db" | "seed";
  [k: string]: any;
};

type SaveState = "idle" | "saving" | "success" | "error";

type EvidenceType =
  | "Observation"
  | "Work sample"
  | "Project"
  | "Assessment"
  | "Photo evidence"
  | "General evidence";

type PremiumMediaType = "photo" | "audio" | "video" | null;

type CurriculumCountry =
  | "United States"
  | "Australia"
  | "United Kingdom"
  | "New Zealand"
  | "International Baccalaureate"
  | "South Africa";

type CurriculumFramework =
  | "Common Core State Standards"
  | "State-Based Curriculum"
  | "Australian Curriculum"
  | "UK National Curriculum"
  | "New Zealand Curriculum"
  | "IB PYP"
  | "IB MYP"
  | "CAPS";

type PremiumCurriculumState = {
  country: string;
  framework: string;
  yearLevel: string;
  subject: string;
  strand: string;
  skill: string;
};

type SearchableSelectProps = {
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  onChange: (value: string) => void;
  helperText?: string;
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

function childDisplayName(child: ChildRow | null | undefined) {
  if (!child) return "Child";
  const first = safe(child.preferred_name || child.first_name || child.name);
  const sur = safe(child.surname || child.family_name);
  return `${first}${sur ? ` ${sur}` : ""}`.trim() || "Child";
}

function childYearLabel(child: ChildRow | null | undefined) {
  if (!child) return "";
  if (safe(child.yearLabel)) return safe(child.yearLabel);
  if (child.year_level != null && safe(child.year_level)) return `Year ${safe(child.year_level)}`;
  return "";
}

function shellCard(): React.CSSProperties {
  return {
    border: "1px solid #e5e7eb",
    borderRadius: 22,
    background: "#ffffff",
    boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
  };
}

function mainCard(): React.CSSProperties {
  return {
    ...shellCard(),
    padding: 24,
  };
}

function softCard(): React.CSSProperties {
  return {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    background: "#f8fafc",
    padding: 16,
  };
}

function subtleCard(): React.CSSProperties {
  return {
    border: "1px solid #eef2f7",
    borderRadius: 16,
    background: "#ffffff",
    padding: 14,
  };
}

function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    minHeight: 48,
    border: "1px solid #d1d5db",
    borderRadius: 12,
    padding: "12px 14px",
    background: "#ffffff",
    fontSize: 14,
    color: "#111827",
    outline: "none",
  };
}

function textareaStyle(): React.CSSProperties {
  return {
    ...inputStyle(),
    minHeight: 132,
    resize: "vertical",
  };
}

function labelStyle(): React.CSSProperties {
  return {
    fontSize: 13,
    fontWeight: 800,
    color: "#475569",
    marginBottom: 6,
    display: "block",
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

function buttonStyle(primary = false): React.CSSProperties {
  return {
    minHeight: 44,
    padding: "10px 14px",
    borderRadius: 12,
    border: `1px solid ${primary ? "#2563eb" : "#e5e7eb"}`,
    background: primary ? "#2563eb" : "#ffffff",
    color: primary ? "#ffffff" : "#0f172a",
    textDecoration: "none",
    fontWeight: 800,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  };
}

function tinyButtonStyle(active = false): React.CSSProperties {
  return {
    minHeight: 36,
    padding: "8px 10px",
    borderRadius: 999,
    border: `1px solid ${active ? "#2563eb" : "#d1d5db"}`,
    background: active ? "#2563eb" : "#ffffff",
    color: active ? "#ffffff" : "#0f172a",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
  };
}

function pillStyle(bg: string, fg: string, border?: string): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 800,
    background: bg,
    color: fg,
    border: `1px solid ${border || bg}`,
    whiteSpace: "nowrap",
  };
}

const EVIDENCE_TYPES: EvidenceType[] = [
  "Observation",
  "Work sample",
  "Project",
  "Assessment",
  "Photo evidence",
  "General evidence",
];

const GLOBAL_LEARNING_DOMAINS = [
  "Literacy",
  "Numeracy",
  "Science",
  "Humanities",
  "The Arts",
  "Health & Movement",
  "Technology",
  "Languages",
  "Faith / Values",
  "Life Skills",
];

const CURRICULUM_COUNTRIES: CurriculumCountry[] = [
  "United States",
  "Australia",
  "United Kingdom",
  "New Zealand",
  "International Baccalaureate",
  "South Africa",
];

const COUNTRY_TO_FRAMEWORKS: Record<string, CurriculumFramework[]> = {
  "United States": ["Common Core State Standards", "State-Based Curriculum"],
  Australia: ["Australian Curriculum"],
  "United Kingdom": ["UK National Curriculum"],
  "New Zealand": ["New Zealand Curriculum"],
  "International Baccalaureate": ["IB PYP", "IB MYP"],
  "South Africa": ["CAPS"],
};

const FRAMEWORK_TO_YEARS: Record<string, string[]> = {
  "Common Core State Standards": [
    "Kindergarten",
    "Grade 1",
    "Grade 2",
    "Grade 3",
    "Grade 4",
    "Grade 5",
    "Grade 6",
    "Grade 7",
    "Grade 8",
  ],
  "State-Based Curriculum": [
    "Kindergarten",
    "Grade 1",
    "Grade 2",
    "Grade 3",
    "Grade 4",
    "Grade 5",
    "Grade 6",
    "Grade 7",
    "Grade 8",
  ],
  "Australian Curriculum": [
    "Foundation",
    "Year 1",
    "Year 2",
    "Year 3",
    "Year 4",
    "Year 5",
    "Year 6",
    "Year 7",
    "Year 8",
  ],
  "UK National Curriculum": [
    "Year 1",
    "Year 2",
    "Year 3",
    "Year 4",
    "Year 5",
    "Year 6",
    "Year 7",
    "Year 8",
  ],
  "New Zealand Curriculum": ["Level 1", "Level 2", "Level 3", "Level 4", "Level 5"],
  "IB PYP": [
    "Ages 5–6",
    "Ages 6–7",
    "Ages 7–8",
    "Ages 8–9",
    "Ages 9–10",
    "Ages 10–11",
    "Ages 11–12",
  ],
  "IB MYP": ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"],
  CAPS: [
    "Grade R",
    "Grade 1",
    "Grade 2",
    "Grade 3",
    "Grade 4",
    "Grade 5",
    "Grade 6",
    "Grade 7",
    "Grade 8",
  ],
};

const FRAMEWORK_TO_SUBJECTS: Record<string, string[]> = {
  "Common Core State Standards": ["English Language Arts", "Mathematics"],
  "State-Based Curriculum": [
    "English Language Arts",
    "Mathematics",
    "Science",
    "Social Studies",
    "Arts",
    "Health",
  ],
  "Australian Curriculum": [
    "English",
    "Mathematics",
    "Science",
    "Humanities and Social Sciences",
    "The Arts",
    "Health and Physical Education",
    "Technologies",
    "Languages",
  ],
  "UK National Curriculum": [
    "English",
    "Mathematics",
    "Science",
    "History",
    "Geography",
    "Art and Design",
    "Design and Technology",
    "Computing",
    "Physical Education",
    "Languages",
  ],
  "New Zealand Curriculum": [
    "English",
    "Mathematics and Statistics",
    "Science",
    "Social Sciences",
    "The Arts",
    "Health and Physical Education",
    "Technology",
    "Learning Languages",
  ],
  "IB PYP": [
    "Language",
    "Mathematics",
    "Science",
    "Social Studies",
    "Arts",
    "Personal, Social and Physical Education",
  ],
  "IB MYP": [
    "Language and Literature",
    "Individuals and Societies",
    "Sciences",
    "Mathematics",
    "Arts",
    "Design",
    "Physical and Health Education",
  ],
  CAPS: [
    "Home Language",
    "Mathematics",
    "Life Skills",
    "Natural Sciences",
    "Social Sciences",
    "Creative Arts",
    "Technology",
  ],
};

const SUBJECT_TO_STRANDS: Record<string, string[]> = {
  "English Language Arts": ["Reading", "Writing", "Speaking and Listening", "Language"],
  Mathematics: ["Number", "Operations", "Fractions", "Measurement", "Geometry", "Algebraic Thinking"],
  English: ["Reading", "Writing", "Speaking and Listening", "Language"],
  Science: ["Inquiry Skills", "Biological Sciences", "Chemical Sciences", "Earth and Space Sciences", "Physical Sciences"],
  "Humanities and Social Sciences": ["History", "Geography", "Civics and Citizenship", "Economics and Business"],
  "The Arts": ["Visual Arts", "Music", "Drama", "Dance", "Media Arts"],
  "Health and Physical Education": ["Personal Development", "Movement", "Games and Sport", "Safety"],
  Technologies: ["Digital Technologies", "Design and Technologies"],
  Languages: ["Listening", "Speaking", "Reading", "Writing"],
  History: ["Knowledge and Understanding", "Historical Skills"],
  Geography: ["Knowledge and Understanding", "Geographical Inquiry"],
  "Art and Design": ["Creating", "Responding"],
  "Design and Technology": ["Design", "Make", "Evaluate"],
  Computing: ["Digital Literacy", "Computer Science", "Information Technology"],
  "Physical Education": ["Movement", "Fitness", "Games"],
  "Mathematics and Statistics": ["Number", "Algebra", "Geometry", "Measurement", "Statistics"],
  "Social Sciences": ["Identity", "Community", "Place and Environment", "Economic Activity"],
  Technology: ["Design Thinking", "Computational Thinking", "Outcomes"],
  "Learning Languages": ["Listening", "Speaking", "Reading", "Writing"],
  Language: ["Oral Language", "Reading", "Writing", "Viewing and Presenting"],
  "Social Studies": ["Identity", "Culture", "Systems", "Citizenship"],
  Arts: ["Creating", "Performing", "Responding"],
  "Personal, Social and Physical Education": ["Identity", "Wellbeing", "Relationships", "Movement"],
  "Language and Literature": ["Reading", "Writing", "Speaking", "Viewing"],
  "Individuals and Societies": ["Inquiry", "Research", "Systems", "Perspectives"],
  Sciences: ["Inquiry", "Biology", "Chemistry", "Physics", "Earth Science"],
  Design: ["Investigating", "Planning", "Creating", "Evaluating"],
  "Physical and Health Education": ["Identity", "Movement", "Relationships", "Health Choices"],
  "Home Language": ["Listening", "Speaking", "Reading", "Writing"],
  "Life Skills": ["Personal Growth", "Social Development", "Creative Expression", "Physical Development"],
  "Natural Sciences": ["Life and Living", "Matter and Materials", "Energy and Change", "Planet Earth and Beyond"],
  "Creative Arts": ["Visual Arts", "Music", "Drama", "Dance"],
};

const STRAND_TO_SKILLS: Record<string, string[]> = {
  Reading: ["Main idea", "Inference", "Fluency", "Phonics", "Comprehension", "Vocabulary", "Response to text"],
  Writing: ["Sentence construction", "Paragraph writing", "Narrative writing", "Informative writing", "Persuasive writing", "Editing and revising"],
  "Speaking and Listening": ["Oral presentation", "Discussion skills", "Listening for meaning", "Responding to others"],
  Language: ["Grammar", "Spelling", "Punctuation", "Vocabulary"],
  Number: ["Place value", "Counting", "Addition", "Subtraction", "Multiplication", "Division"],
  Operations: ["Add and subtract", "Multiply and divide", "Order of operations"],
  Fractions: ["Recognise fractions", "Compare fractions", "Equivalent fractions", "Fraction models"],
  Measurement: ["Length", "Mass", "Capacity", "Time", "Area", "Perimeter"],
  Geometry: ["Shape properties", "Angles", "Symmetry", "Location and transformation"],
  "Algebraic Thinking": ["Patterns", "Rules", "Equations", "Unknowns"],
  "Inquiry Skills": ["Observe", "Question", "Predict", "Investigate", "Record findings"],
  "Biological Sciences": ["Living things", "Habitats", "Life cycles", "Adaptations"],
  "Chemical Sciences": ["Materials", "States of matter", "Properties", "Changes"],
  "Earth and Space Sciences": ["Weather", "Water cycle", "Rocks", "Earth systems"],
  "Physical Sciences": ["Forces", "Light", "Sound", "Energy"],
  History: ["Chronology", "Sources", "Cause and effect", "Historical perspectives"],
  Geography: ["Places", "Environment", "Maps", "Human impact"],
  "Digital Technologies": ["Algorithms", "Data", "Digital systems", "Programming"],
  "Design and Technologies": ["Design process", "Materials", "Solutions", "Evaluation"],
  Listening: ["Understand spoken language", "Follow instructions", "Identify key details"],
  Speaking: ["Pronunciation", "Conversation", "Presentation", "Oral response"],
  "Visual Arts": ["Drawing", "Painting", "Construction", "Responding to artwork"],
  Music: ["Rhythm", "Pitch", "Performance", "Composition"],
  Drama: ["Role play", "Performance", "Improvisation", "Expression"],
  Dance: ["Movement", "Sequencing", "Performance", "Expression"],
  "Personal Development": ["Identity", "Decision making", "Resilience"],
  Movement: ["Fundamental movement", "Coordination", "Balance", "Control"],
  "Games and Sport": ["Teamwork", "Rules", "Tactics", "Skill execution"],
  Safety: ["Risk awareness", "Safe choices", "Help-seeking"],
  Literacy: ["Reading development", "Writing development", "Speaking", "Listening"],
  Numeracy: ["Number sense", "Operations", "Reasoning", "Problem solving"],
};

function inferLearningSignals(summary: string, area: string, type: EvidenceType) {
  const text = `${safe(summary)} ${safe(area)} ${safe(type)}`.toLowerCase();
  const signals: string[] = [];

  if (
    text.includes("solve") ||
    text.includes("problem") ||
    text.includes("worked out") ||
    text.includes("numeracy") ||
    text.includes("fractions") ||
    text.includes("number") ||
    text.includes("math")
  ) {
    signals.push("Problem solving");
  }
  if (
    text.includes("explain") ||
    text.includes("reflection") ||
    text.includes("reason") ||
    text.includes("why") ||
    text.includes("discuss")
  ) {
    signals.push("Understanding");
  }
  if (
    text.includes("tried") ||
    text.includes("kept going") ||
    text.includes("improved") ||
    text.includes("practice") ||
    text.includes("again")
  ) {
    signals.push("Persistence");
  }
  if (
    text.includes("made") ||
    text.includes("built") ||
    text.includes("created") ||
    text.includes("project") ||
    text.includes("design")
  ) {
    signals.push("Creativity");
  }
  if (
    text.includes("read") ||
    text.includes("wrote") ||
    text.includes("story") ||
    text.includes("sentence") ||
    text.includes("spelling") ||
    text.includes("literacy")
  ) {
    signals.push("Literacy growth");
  }
  if (
    text.includes("count") ||
    text.includes("measure") ||
    text.includes("fraction") ||
    text.includes("equation") ||
    text.includes("numeracy")
  ) {
    signals.push("Numeracy growth");
  }
  if (
    text.includes("worked with") ||
    text.includes("shared") ||
    text.includes("helped") ||
    text.includes("team")
  ) {
    signals.push("Collaboration");
  }
  if (
    text.includes("confident") ||
    text.includes("present") ||
    text.includes("spoke") ||
    text.includes("voice")
  ) {
    signals.push("Confidence");
  }

  return Array.from(new Set(signals)).slice(0, 4);
}

function suggestLearningArea(summary: string) {
  const text = safe(summary).toLowerCase();
  if (!text) return "";

  if (
    text.includes("fraction") ||
    text.includes("number") ||
    text.includes("count") ||
    text.includes("add") ||
    text.includes("subtract") ||
    text.includes("measure") ||
    text.includes("math")
  ) return "Numeracy";

  if (
    text.includes("read") ||
    text.includes("wrote") ||
    text.includes("sentence") ||
    text.includes("story") ||
    text.includes("spelling") ||
    text.includes("letter")
  ) return "Literacy";

  if (
    text.includes("experiment") ||
    text.includes("observe") ||
    text.includes("plant") ||
    text.includes("water") ||
    text.includes("science")
  ) return "Science";

  if (
    text.includes("paint") ||
    text.includes("draw") ||
    text.includes("music") ||
    text.includes("art") ||
    text.includes("drama")
  ) return "The Arts";

  if (
    text.includes("run") ||
    text.includes("jump") ||
    text.includes("sport") ||
    text.includes("health") ||
    text.includes("movement")
  ) return "Health & Movement";

  if (
    text.includes("build") ||
    text.includes("design") ||
    text.includes("computer") ||
    text.includes("digital") ||
    text.includes("technology")
  ) return "Technology";

  if (
    text.includes("history") ||
    text.includes("geography") ||
    text.includes("community") ||
    text.includes("society")
  ) return "Humanities";

  return "";
}

function buildCaptureQuality(title: string, summary: string, learningArea: string) {
  const cleanTitle = safe(title);
  const cleanSummary = safe(summary);
  const cleanArea = safe(learningArea);

  const checks = [
    { label: "Clear learning moment", passed: cleanSummary.length >= 20 },
    { label: "Title you can recognise later", passed: cleanTitle.length >= 5 },
    { label: "Linked to one domain", passed: cleanArea.length >= 2 },
    { label: "Specific enough for later reporting", passed: cleanSummary.length >= 70 },
  ];

  const score = checks.filter((x) => x.passed).length;

  if (score <= 1) {
    return {
      score,
      label: "Good start",
      toneBg: "#f8fafc",
      toneBorder: "#e2e8f0",
      toneText: "#334155",
      width: "25%",
      reassurance:
        "This is a useful start. A little more detail will make it easier to use later.",
      checks,
    };
  }

  if (score === 2) {
    return {
      score,
      label: "Useful",
      toneBg: "#fffbeb",
      toneBorder: "#fde68a",
      toneText: "#92400e",
      width: "50%",
      reassurance:
        "This is already useful. A little more specificity will make it stronger in portfolio and reports.",
      checks,
    };
  }

  if (score === 3) {
    return {
      score,
      label: "Strong",
      toneBg: "#eff6ff",
      toneBorder: "#bfdbfe",
      toneText: "#1d4ed8",
      width: "75%",
      reassurance:
        "This is a strong capture. You’ve recorded enough to support later reporting.",
      checks,
    };
  }

  return {
    score,
    label: "Portfolio-ready",
    toneBg: "#ecfdf5",
    toneBorder: "#86efac",
    toneText: "#166534",
    width: "100%",
    reassurance:
      "This is strong, specific, and ready to support portfolio and reporting later.",
    checks,
  };
}

function buildSummaryPreview(childName: string, summary: string, learningArea: string) {
  const s = safe(summary);
  const area = safe(learningArea);
  if (!s) return "";
  const intro = childName ? `${childName} ` : "The learner ";
  const areaText = area ? ` in ${area}` : "";
  return `${intro}showed learning${areaText} by ${s.charAt(0).toLowerCase()}${s.slice(1)}`;
}

function getPremiumFromStorage() {
  if (typeof window === "undefined") return false;
  return safe(localStorage.getItem(PLAN_STORAGE_KEY)).toLowerCase() === "premium";
}

function getSeedChildren(): ChildRow[] {
  if (typeof window === "undefined") return [];
  const raw = parseJson<any[]>(window.localStorage.getItem(CHILDREN_KEY), []);
  return raw.map((child, index) => ({
    id: safe(child?.id) || `seed-child-${index + 1}`,
    first_name: safe(child?.name) || `Child ${index + 1}`,
    yearLabel: safe(child?.yearLabel) || safe(child?.year_label) || "",
    relationship_label: "Family",
    source: "seed",
  }));
}

function SearchableSelect({
  label,
  value,
  options,
  placeholder,
  onChange,
  helperText,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = safe(query).toLowerCase();
    if (!q) return options.slice(0, 50);
    return options.filter((opt) => opt.toLowerCase().includes(q)).slice(0, 50);
  }, [options, query]);

  return (
    <div style={{ position: "relative" }} ref={wrapRef}>
      <label style={labelStyle()}>{label}</label>
      <input
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (!e.target.value.trim()) onChange("");
        }}
        placeholder={placeholder}
        style={inputStyle()}
      />

      {helperText ? (
        <div style={{ marginTop: 6, fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
          {helperText}
        </div>
      ) : null}

      {open ? (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            zIndex: 20,
            border: "1px solid #dbe2ea",
            borderRadius: 14,
            background: "#ffffff",
            boxShadow: "0 20px 50px rgba(15,23,42,0.12)",
            maxHeight: 260,
            overflowY: "auto",
            padding: 8,
          }}
        >
          {filtered.length ? (
            filtered.map((opt) => {
              const selected = value === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setQuery(opt);
                    setOpen(false);
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    border: "none",
                    background: selected ? "#eff6ff" : "#ffffff",
                    color: selected ? "#1d4ed8" : "#0f172a",
                    borderRadius: 10,
                    padding: "10px 12px",
                    fontSize: 14,
                    fontWeight: selected ? 800 : 600,
                    cursor: "pointer",
                  }}
                >
                  {opt}
                </button>
              );
            })
          ) : (
            <div style={{ padding: "10px 12px", fontSize: 13, color: "#64748b" }}>
              No matches found.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function CapturePage() {
  const searchParams = useSearchParams();
  const { workspace, activeLearnerId, setActiveLearner, loading: workspaceLoading } =
    useFamilyWorkspace();
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState("");
  const [children, setChildren] = useState<ChildRow[]>([]);
  const [activeChildId, setActiveChildId] = useState("");

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [learningArea, setLearningArea] = useState("");
  const [evidenceType, setEvidenceType] = useState<EvidenceType>("Observation");
  const [occurredOn, setOccurredOn] = useState(() => new Date().toISOString().slice(0, 10));

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [feedback, setFeedback] = useState("");
  const [savedCount, setSavedCount] = useState(0);
  const [saveFlash, setSaveFlash] = useState(false);
  const [savedEvidenceId, setSavedEvidenceId] = useState("");
  const [linkContext, setLinkContext] = useState<LearnerCurriculumLinkContext | null>(null);
  const [selectedOutcomeId, setSelectedOutcomeId] = useState("");
  const [linkedOutcomeIds, setLinkedOutcomeIds] = useState<string[]>([]);
  const [linkingState, setLinkingState] = useState<SaveState>("idle");
  const [linkingFeedback, setLinkingFeedback] = useState("");

  const [premiumMediaType, setPremiumMediaType] = useState<PremiumMediaType>(null);
  const [isPremium, setIsPremium] = useState(false);

  const [curriculum, setCurriculum] = useState<PremiumCurriculumState>({
    country: "",
    framework: "",
    yearLevel: "",
    subject: "",
    strand: "",
    skill: "",
  });

  async function loadChildren() {
    setBusy(true);
    setErr("");

    try {
      let merged: ChildRow[] = workspace.learners.map((learner) => ({
        id: learner.id,
        preferred_name: learner.label,
        first_name: learner.label,
        year_level: learner.year_level ?? null,
        yearLabel: learner.yearLabel ?? "",
        relationship_label: "Family",
        source: learner.id.startsWith("local-") ? ("seed" as const) : ("db" as const),
      }));

      if (!merged.length && !workspace.userId) {
        merged = getSeedChildren();
      }

      if (!merged.length) {
        setChildren([]);
        if (workspace.userId && hasSupabaseEnv) {
          setErr("Add a linked learner first so EduDecks can save captures to the family record.");
        }
        setBusy(false);
        return;
      }

      setChildren(merged);

      const usableActive = resolveCanonicalActiveLearnerId(
        merged,
        workspace.profile,
        activeLearnerId,
      );

      setActiveChildId(usableActive);

      if (usableActive) {
        setActiveLearner(usableActive);
      }
    } catch (e: any) {
      setErr(String(e?.message ?? e ?? "Could not load learners."));
      setChildren([]);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void loadChildren();
    setIsPremium(getPremiumFromStorage());
  }, [workspace.learners, workspace.profile, workspace.userId, activeLearnerId]);

  useEffect(() => {
    const nextId = resolveCanonicalActiveLearnerId(
      children,
      workspace.profile,
      activeLearnerId,
      activeChildId,
    );
    setActiveChildId((prev) => (prev === nextId ? prev : nextId));
  }, [children, workspace.profile, activeLearnerId, activeChildId]);

  useEffect(() => {
    if (!saveFlash) return;
    const id = window.setTimeout(() => setSaveFlash(false), 900);
    return () => window.clearTimeout(id);
  }, [saveFlash]);

  const activeChild = useMemo(
    () => children.find((c) => c.id === activeChildId) || null,
    [children, activeChildId]
  );
  useEffect(() => {
    let mounted = true;

    async function hydrateLinkContext() {
      if (
        !workspace.userId ||
        !hasSupabaseEnv ||
        !activeChildId ||
        !activeChild ||
        activeChild.source !== "db"
      ) {
        if (mounted) {
          setLinkContext(null);
          setSelectedOutcomeId("");
        }
        return;
      }

      try {
        const next = await loadLinkableOutcomesForStudent({
          studentId: activeChildId,
          familyPreferences: workspace.profile.curriculum_preferences,
        });

        if (!mounted) return;
        setLinkContext(next);
        setSelectedOutcomeId((prev) =>
          prev && next?.outcomes.some((outcome) => outcome.id === prev)
            ? prev
            : next?.outcomes[0]?.id || "",
        );
      } catch (error) {
        if (!mounted) return;
        console.error("capture curriculum link context failed", error);
        setLinkContext(null);
        setSelectedOutcomeId("");
      }
    }

    void hydrateLinkContext();
    return () => {
      mounted = false;
    };
  }, [
    workspace.userId,
    workspace.profile,
    activeChildId,
    activeChild,
  ]);

  useEffect(() => {
    let mounted = true;

    async function hydrateEvidenceLinks() {
      if (!savedEvidenceId || !workspace.userId || !hasSupabaseEnv) {
        if (mounted) {
          setLinkedOutcomeIds([]);
          setLinkingState("idle");
          setLinkingFeedback("");
        }
        return;
      }

      try {
        const links = await loadEvidenceOutcomeLinks(savedEvidenceId);
        if (!mounted) return;
        setLinkedOutcomeIds(links.map((row) => row.outcomeId));
      } catch (error) {
        if (!mounted) return;
        console.error("capture evidence links failed", error);
        setLinkedOutcomeIds([]);
      }
    }

    void hydrateEvidenceLinks();
    return () => {
      mounted = false;
    };
  }, [savedEvidenceId, workspace.userId]);
  const shellHandoff = useMemo(
    () =>
      resolveFamilyShellHandoff(
        searchParams?.get(FAMILY_SHELL_HANDOFF_QUERY_PARAM),
        "/capture"
      ),
    [searchParams]
  );
  const handoffStepTaken = saveState === "success" || savedCount > 0;

  const suggestedArea = useMemo(() => suggestLearningArea(summary), [summary]);
  const quality = useMemo(
    () => buildCaptureQuality(title, summary, learningArea),
    [title, summary, learningArea]
  );
  const signals = useMemo(
    () => inferLearningSignals(summary, learningArea, evidenceType),
    [summary, learningArea, evidenceType]
  );
  const summaryPreview = useMemo(
    () => buildSummaryPreview(childDisplayName(activeChild), summary, learningArea),
    [activeChild, summary, learningArea]
  );
  const selectedOutcome = useMemo(
    () => linkContext?.outcomes.find((outcome) => outcome.id === selectedOutcomeId) || null,
    [linkContext, selectedOutcomeId],
  );

  const frameworks = useMemo(
    () => (curriculum.country ? COUNTRY_TO_FRAMEWORKS[curriculum.country] || [] : []),
    [curriculum.country]
  );
  const years = useMemo(
    () => (curriculum.framework ? FRAMEWORK_TO_YEARS[curriculum.framework] || [] : []),
    [curriculum.framework]
  );
  const subjects = useMemo(
    () => (curriculum.framework ? FRAMEWORK_TO_SUBJECTS[curriculum.framework] || [] : []),
    [curriculum.framework]
  );
  const strands = useMemo(
    () => (curriculum.subject ? SUBJECT_TO_STRANDS[curriculum.subject] || [] : []),
    [curriculum.subject]
  );
  const skills = useMemo(
    () => (curriculum.strand ? STRAND_TO_SKILLS[curriculum.strand] || [] : []),
    [curriculum.strand]
  );

  const canSave = !!safe(activeChildId) && !!safe(title) && !!safe(summary);

  async function saveEvidenceOutcomeLink() {
    if (!savedEvidenceId) {
      setLinkingState("error");
      setLinkingFeedback("Save the evidence first, then link it to curriculum.");
      return;
    }

    if (!selectedOutcomeId) {
      setLinkingState("error");
      setLinkingFeedback("Choose an outcome first.");
      return;
    }

    try {
      setLinkingState("saving");
      setLinkingFeedback("");

      await linkEvidenceToOutcomes({
        evidenceId: savedEvidenceId,
        outcomeIds: [selectedOutcomeId],
      });

      const links = await loadEvidenceOutcomeLinks(savedEvidenceId);
      setLinkedOutcomeIds(links.map((row) => row.outcomeId));
      setLinkingState("success");
      setLinkingFeedback("Linked to curriculum.");
    } catch (error: any) {
      setLinkingState("error");
      setLinkingFeedback(
        String(error?.message ?? "We could not link this evidence right now."),
      );
    }
  }

  function resetDependentCurriculum(level: keyof PremiumCurriculumState, value: string) {
    setCurriculum((prev) => {
      if (level === "country") {
        return {
          country: value,
          framework: "",
          yearLevel: "",
          subject: "",
          strand: "",
          skill: "",
        };
      }
      if (level === "framework") {
        return { ...prev, framework: value, yearLevel: "", subject: "", strand: "", skill: "" };
      }
      if (level === "yearLevel") {
        return { ...prev, yearLevel: value, subject: "", strand: "", skill: "" };
      }
      if (level === "subject") {
        return { ...prev, subject: value, strand: "", skill: "" };
      }
      if (level === "strand") {
        return { ...prev, strand: value, skill: "" };
      }
      return { ...prev, skill: value };
    });
  }

  async function saveEvidence() {
    if (!canSave) {
      setSaveState("error");
      setFeedback("Please choose a learner, add a title, and include a short summary.");
      return;
    }

    setSaveState("saving");
    setErr("");
    setFeedback("");
    setLinkingState("idle");
    setLinkingFeedback("");
    setSavedEvidenceId("");
    setLinkedOutcomeIds([]);

    try {
      let insertedId = "";
      if (workspace.userId && hasSupabaseEnv) {
        if (!workspace.profile?.id || workspace.profile.id === "local") {
          throw new Error(
            "Family workspace is not ready for canonical evidence saves yet. Refresh and try again.",
          );
        }

        if (!activeChild || activeChild.source !== "db") {
          throw new Error(
            "Choose a linked learner before saving to the family record.",
          );
        }

        const created = await createFamilyEvidenceEntry({
          familyProfileId: workspace.profile.id,
          studentId: activeChildId,
          createdByUserId: workspace.userId,
          title: safe(title),
          summary: safe(summary),
          occurredOn: safe(occurredOn) || null,
          evidenceType: safe(evidenceType) || "note",
          visibility: "family",
          metadata: {
            learning_area: safe(learningArea) || "General",
            capture_surface: "family_capture",
          },
        });

        insertedId = safe(created.id);
      } else {
        if (typeof window === "undefined") {
          throw new Error("Could not save learning outside the browser.");
        }

        insertedId = `local-${Date.now()}`;

        const childrenSeed = parseJson<any[]>(window.localStorage.getItem(CHILDREN_KEY), []);
        const nextChildren = childrenSeed.map((child) => {
          if (safe(child?.id) !== activeChildId) return child;
          return {
            ...child,
            evidenceCount: Number(child?.evidenceCount || 0) + 1,
            lastUpdated: new Date().toISOString(),
            strongestArea: safe(learningArea) || child?.strongestArea || "Literacy",
            nextFocusArea: safe(learningArea) || child?.nextFocusArea || "Literacy",
            status: "building",
            recentAreaCount: Math.max(Number(child?.recentAreaCount || 0), 1),
          };
        });

        window.localStorage.setItem(CHILDREN_KEY, JSON.stringify(nextChildren));
      }

      if (!insertedId) throw new Error("Could not save evidence.");

      if (typeof window !== "undefined" && insertedId) {
        window.localStorage.setItem(PORTFOLIO_HIGHLIGHT_EVIDENCE_KEY, insertedId);
        window.localStorage.setItem(REPORTS_HIGHLIGHT_EVIDENCE_KEY, insertedId);
      }

      setSaveState("success");
      setSavedCount((prev) => prev + 1);
      setSavedEvidenceId(workspace.userId && hasSupabaseEnv ? insertedId : "");
      setSaveFlash(true);

      setFeedback(
        `Nice — you’ve started building a strong learning record for ${childDisplayName(
          activeChild
        )}. This capture is now available for portfolio and reports.`
      );

      setTitle("");
      setSummary("");
      setLearningArea("");
      setEvidenceType("Observation");
      setOccurredOn(new Date().toISOString().slice(0, 10));

      if (isPremium) {
        setCurriculum({
          country: "",
          framework: "",
          yearLevel: "",
          subject: "",
          strand: "",
          skill: "",
        });
      }

      await loadChildren();
    } catch (e: any) {
      setSaveState("error");
      setFeedback(String(e?.message ?? e ?? "Something went wrong while saving."));
    }
  }

  function openPremiumMedia(type: PremiumMediaType) {
    setPremiumMediaType(type);
  }

  function mediaTitle(type: PremiumMediaType) {
    if (type === "photo") return "Photo uploads";
    if (type === "audio") return "Voice notes";
    if (type === "video") return "Video capture";
    return "Premium media";
  }

  function mediaExplanation(type: PremiumMediaType) {
    if (type === "photo") {
      return "Photo evidence helps turn work samples, practical tasks, and real-world learning into richer portfolio moments.";
    }
    if (type === "audio") {
      return "Voice notes are ideal for oral reading, spoken reflection, memory work, and learner explanations.";
    }
    if (type === "video") {
      return "Video helps capture demonstrations, performances, presentations, and confidence over time.";
    }
    return "Premium media capture adds richer evidence to portfolio and reporting.";
  }

  return (
    <FamilyTopNavShell
      title="EduDecks Family"
      subtitle="Quick Capture"
      heroTitle="Capture one useful learning moment"
      heroText="Start with what happened, what it showed, and why it matters. That is enough to build a calm, trustworthy learning record over time."
      heroAsideTitle="Best family move"
      heroAsideText="A useful title, a short summary of what the learner showed, and one learning domain are enough to create a strong starting record."
    >
      <FamilyHandoffNote handoff={shellHandoff} acted={handoffStepTaken} />
      {busy || workspaceLoading ? (
        <div style={{ ...mainCard(), marginBottom: 18 }}>Loading family learners…</div>
      ) : err ? (
        <div
          style={{
            ...mainCard(),
            marginBottom: 18,
            border: "1px solid #fecaca",
            background: "#fff1f2",
            color: "#9f1239",
            fontWeight: 800,
          }}
        >
          {err}
        </div>
      ) : children.length === 0 ? (
        <div style={{ ...mainCard(), marginBottom: 18 }}>
          <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 10, color: "#0f172a" }}>
            No learners have been added yet
          </div>
          <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.7, marginBottom: 16 }}>
            Add a child first so EduDecks can attach captures to a real learner and begin building a useful family record.
          </div>
          <Link href="/children/new" style={buttonStyle(true)}>
            Add a child
          </Link>
        </div>
      ) : (
        <>
          <section
            style={{
              ...mainCard(),
              marginBottom: 18,
              padding: 18,
              background: "linear-gradient(135deg, #f8fbff 0%, #ffffff 100%)",
              border: "1px solid #dbeafe",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 14,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={eyebrowStyle()}>Quick capture</div>
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 26,
                    lineHeight: 1.15,
                    fontWeight: 900,
                    color: "#0f172a",
                  }}
                >
                  {activeChild ? `Capture for ${childDisplayName(activeChild)}` : "Capture learning"}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 14,
                    lineHeight: 1.65,
                    color: "#475569",
                    maxWidth: 760,
                  }}
                >
                  You do not need to sound like a teacher. Just notice what happened, what it showed, and why it matters.
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link href="/family" style={buttonStyle(false)}>
                  Family Home
                </Link>
                <Link href="/portfolio" style={buttonStyle(false)}>
                  Portfolio
                </Link>
                <Link href="/reports" style={buttonStyle(false)}>
                  Reports
                </Link>
              </div>
            </div>
          </section>

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.2fr) minmax(280px, 0.8fr)",
              gap: 20,
              alignItems: "start",
            }}
          >
            <div style={{ display: "grid", gap: 18 }}>
              <section style={mainCard()}>
                <div style={eyebrowStyle()}>Main capture</div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 22,
                    lineHeight: 1.15,
                    fontWeight: 900,
                    color: "#0f172a",
                  }}
                >
                  Capture details
                </div>

                <div style={{ display: "grid", gap: 18, marginTop: 18 }}>
                  <div>
                    <label style={labelStyle()}>Learner</label>
                    <select
                      value={activeChildId}
                      onChange={(e) => {
                        setActiveChildId(e.target.value);
                        setActiveLearner(e.target.value);
                      }}
                      style={inputStyle()}
                    >
                      {children.map((child) => (
                        <option key={child.id} value={child.id}>
                          {childDisplayName(child)}
                          {childYearLabel(child) ? ` — ${childYearLabel(child)}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle()}>Short title</label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Fractions with pizza slices"
                      style={inputStyle()}
                    />
                  </div>

                  <div>
                    <label style={labelStyle()}>What happened?</label>
                    <textarea
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      rows={6}
                      placeholder="What did your child do? What did that show? Why might this matter later? For example: Sean used pizza slices to compare fractions and explained why one-half is bigger than one-quarter."
                      style={textareaStyle()}
                    />
                  </div>

                  <div
                    style={{
                      ...softCard(),
                      border: `1px solid ${quality.toneBorder}`,
                      background: quality.toneBg,
                      display: "grid",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 900, color: "#0f172a" }}>
                        Capture quality
                      </div>
                      <span
                        style={pillStyle(quality.toneBg, quality.toneText, quality.toneBorder)}
                      >
                        {quality.label}
                      </span>
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
                          width: quality.width,
                          height: "100%",
                          background:
                            quality.label === "Portfolio-ready"
                              ? "linear-gradient(90deg, #22c55e 0%, #16a34a 100%)"
                              : quality.label === "Strong"
                              ? "linear-gradient(90deg, #60a5fa 0%, #2563eb 100%)"
                              : quality.label === "Useful"
                              ? "linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)"
                              : "linear-gradient(90deg, #cbd5e1 0%, #94a3b8 100%)",
                          borderRadius: 999,
                        }}
                      />
                    </div>

                    <div style={{ display: "grid", gap: 7 }}>
                      {quality.checks.map((item) => (
                        <div
                          key={item.label}
                          style={{
                            fontSize: 13,
                            color: item.passed ? "#166534" : "#92400e",
                            fontWeight: 700,
                          }}
                        >
                          {item.passed ? "✓" : "•"} {item.label}
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        lineHeight: 1.65,
                        color: quality.toneText,
                        fontWeight: 700,
                      }}
                    >
                      {quality.reassurance}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(0,1fr) minmax(180px,220px)",
                      gap: 14,
                    }}
                  >
                    <div>
                      <label style={labelStyle()}>Learning domain</label>
                      <input
                        list="learning-domain-options"
                        value={learningArea}
                        onChange={(e) => setLearningArea(e.target.value)}
                        placeholder="e.g. Numeracy"
                        style={inputStyle()}
                      />
                      <datalist id="learning-domain-options">
                        {GLOBAL_LEARNING_DOMAINS.map((area) => (
                          <option key={area} value={area} />
                        ))}
                      </datalist>

                      {!safe(learningArea) && suggestedArea ? (
                        <div style={{ marginTop: 8 }}>
                          <button
                            type="button"
                            onClick={() => setLearningArea(suggestedArea)}
                            style={{
                              ...tinyButtonStyle(false),
                              background: "#eff6ff",
                              border: "1px solid #bfdbfe",
                              color: "#1d4ed8",
                            }}
                          >
                            Suggested: {suggestedArea}
                          </button>
                        </div>
                      ) : null}

                      <div style={{ marginTop: 8, fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
                        Link this to curriculum after saving so the same evidence can flow into curriculum coverage and later reports.
                      </div>
                    </div>

                    <div>
                      <label style={labelStyle()}>Date</label>
                      <input
                        type="date"
                        value={occurredOn}
                        onChange={(e) => setOccurredOn(e.target.value)}
                        style={inputStyle()}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle()}>Evidence type</label>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {EVIDENCE_TYPES.map((type) => {
                        const active = evidenceType === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setEvidenceType(type)}
                            style={tinyButtonStyle(active)}
                          >
                            {type}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {summaryPreview ? (
                    <div
                      style={{
                        ...softCard(),
                        border: "1px solid #dbeafe",
                        background: "#eff6ff",
                      }}
                    >
                      <div style={eyebrowStyle()}>Report-ready wording preview</div>
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 14,
                          lineHeight: 1.65,
                          color: "#1e3a8a",
                        }}
                      >
                        {summaryPreview}
                      </div>
                    </div>
                  ) : null}

                  <div
                    style={{
                      ...softCard(),
                      border: "1px solid #dbeafe",
                      background: "linear-gradient(135deg, #eff6ff 0%, #f8fbff 100%)",
                      display: "grid",
                      gap: 14,
                    }}
                  >
                    <div>
                      <div style={{ ...eyebrowStyle(), color: "#1d4ed8" }}>
                        Link to curriculum
                      </div>
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 14,
                          lineHeight: 1.65,
                          color: "#1e3a8a",
                        }}
                      >
                        After you save this evidence, you can attach it to a canonical curriculum outcome for the current learner.
                      </div>
                    </div>

                    {!workspace.userId || !hasSupabaseEnv ? (
                      <div style={{ fontSize: 13, lineHeight: 1.6, color: "#475569" }}>
                        Curriculum linking is available when the signed-in family workspace is connected to Supabase.
                      </div>
                    ) : !activeChildId ? (
                      <div style={{ fontSize: 13, lineHeight: 1.6, color: "#475569" }}>
                        Choose a learner first so EduDecks can load the right curriculum outcomes.
                      </div>
                    ) : !linkContext?.framework || !linkContext?.level ? (
                      <div style={{ fontSize: 13, lineHeight: 1.6, color: "#475569" }}>
                        This learner does not have a curriculum selection yet. Finish the setup in{" "}
                        <Link href="/settings#curriculum">Settings</Link>.
                      </div>
                    ) : linkContext.outcomes.length === 0 ? (
                      <div style={{ fontSize: 13, lineHeight: 1.6, color: "#475569" }}>
                        No canonical outcomes are seeded yet for {linkContext.framework.name} · {linkContext.level.level_label}.
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: 13, lineHeight: 1.6, color: "#475569" }}>
                          {linkContext.framework.name} · {linkContext.level.level_label} · {linkContext.outcomes.length} available outcomes
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "minmax(0,1fr) auto",
                            gap: 12,
                            alignItems: "end",
                          }}
                        >
                          <div>
                            <label style={labelStyle()}>Outcome</label>
                            <select
                              value={selectedOutcomeId}
                              onChange={(e) => setSelectedOutcomeId(e.target.value)}
                              style={inputStyle()}
                              disabled={!savedEvidenceId || linkingState === "saving"}
                            >
                              {linkContext.outcomes.map((outcome) => (
                                <option key={outcome.id} value={outcome.id}>
                                  {outcome.learningAreaName} · {outcome.strandName} · {outcome.code || "Outcome"}
                                </option>
                              ))}
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={saveEvidenceOutcomeLink}
                            disabled={!savedEvidenceId || !selectedOutcomeId || linkingState === "saving"}
                            style={{
                              ...buttonStyle(false),
                              cursor:
                                !savedEvidenceId || !selectedOutcomeId || linkingState === "saving"
                                  ? "not-allowed"
                                  : "pointer",
                              opacity:
                                !savedEvidenceId || !selectedOutcomeId || linkingState === "saving"
                                  ? 0.7
                                  : 1,
                            }}
                          >
                            {linkingState === "saving" ? "Linking..." : "Link outcome"}
                          </button>
                        </div>

                        {selectedOutcome ? (
                          <div style={{ fontSize: 13, lineHeight: 1.6, color: "#334155" }}>
                            <strong>{selectedOutcome.code || "Outcome"}</strong>
                            {selectedOutcome.shortLabel ? ` · ${selectedOutcome.shortLabel}` : ""}
                            <div style={{ marginTop: 4, color: "#64748b" }}>
                              {selectedOutcome.fullText}
                            </div>
                          </div>
                        ) : null}

                        {linkingFeedback ? (
                          <div
                            style={{
                              border: `1px solid ${linkingState === "success" ? "#a7f3d0" : "#dbeafe"}`,
                              background: linkingState === "success" ? "#ecfdf5" : "#ffffff",
                              color: linkingState === "success" ? "#166534" : "#1e3a8a",
                              borderRadius: 12,
                              padding: 12,
                              fontSize: 13,
                              fontWeight: 800,
                            }}
                          >
                            {linkingFeedback}
                          </div>
                        ) : null}

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {linkedOutcomeIds.length ? (
                            linkedOutcomeIds.map((outcomeId) => {
                              const linked = linkContext.outcomes.find((outcome) => outcome.id === outcomeId);
                              if (!linked) return null;
                              return (
                                <span
                                  key={outcomeId}
                                  style={pillStyle("#ecfdf5", "#166534", "#a7f3d0")}
                                >
                                  {linked.code || "Outcome"}{linked.shortLabel ? ` · ${linked.shortLabel}` : ""}
                                </span>
                              );
                            })
                          ) : (
                            <span style={pillStyle("#ffffff", "#64748b", "#d1d5db")}>
                              Save the evidence first, then link one or more outcomes.
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div
                    style={{
                      ...softCard(),
                      background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                      display: "grid",
                      gap: 14,
                    }}
                  >
                    <div>
                      <div style={eyebrowStyle()}>Rich media capture</div>
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 16,
                          lineHeight: 1.25,
                          fontWeight: 900,
                          color: "#0f172a",
                        }}
                      >
                        Add photos, voice notes, and video
                      </div>
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 14,
                          lineHeight: 1.65,
                          color: "#475569",
                        }}
                      >
                        Text capture stays free. Rich media is offered as a premium layer because it depends on secure storage and ongoing file handling.
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button type="button" onClick={() => openPremiumMedia("photo")} style={buttonStyle(false)}>
                        📷 Add photo
                      </button>
                      <button type="button" onClick={() => openPremiumMedia("audio")} style={buttonStyle(false)}>
                        🎤 Add voice note
                      </button>
                      <button type="button" onClick={() => openPremiumMedia("video")} style={buttonStyle(false)}>
                        🎥 Add video
                      </button>
                    </div>

                    {!isPremium ? (
                      <div style={{ marginTop: 4 }}>
                        <UpgradeCard
                          trigger="capture-media"
                          variant="compact"
                          onSecondaryClick={() => setPremiumMediaType(null)}
                        />
                      </div>
                    ) : null}
                  </div>

                  {feedback ? (
                    <div
                      aria-live="polite"
                      style={{
                        border:
                          saveState === "success"
                            ? "1px solid #a7f3d0"
                            : "1px solid #fecaca",
                        background: saveState === "success" ? "#ecfdf5" : "#fff1f2",
                        color: saveState === "success" ? "#166534" : "#9f1239",
                        borderRadius: 14,
                        padding: 14,
                        fontSize: 14,
                        fontWeight: 700,
                        lineHeight: 1.6,
                        boxShadow: saveFlash ? "0 0 0 4px rgba(134,239,172,0.25)" : "none",
                        transition: "box-shadow 160ms ease",
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 4 }}>
                        {saveState === "success" ? "Saved to family record" : "Could not save yet"}
                      </div>
                      {feedback}
                    </div>
                  ) : null}

                  <div
                    style={{
                      border: "1px dashed #cbd5e1",
                      borderRadius: 14,
                      padding: 12,
                      background: "#f8fafc",
                      fontSize: 13,
                      lineHeight: 1.55,
                      color: "#334155",
                      fontWeight: 700,
                    }}
                  >
                    {quality.score >= 3
                      ? "This is strong enough to support later reporting."
                      : "You can save this now, or add a little more detail to make it even stronger later."}
                  </div>

                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={saveEvidence}
                      disabled={!canSave || saveState === "saving"}
                      style={{
                        ...buttonStyle(true),
                        cursor: !canSave || saveState === "saving" ? "not-allowed" : "pointer",
                        opacity: !canSave || saveState === "saving" ? 0.7 : 1,
                        minWidth: 190,
                      }}
                    >
                      {saveState === "saving" ? "Saving..." : "Save to family record"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTitle("");
                        setSummary("");
                        setLearningArea("");
                        setEvidenceType("Observation");
                        setOccurredOn(new Date().toISOString().slice(0, 10));
                        setFeedback("");
                        setSaveState("idle");
                        if (isPremium) {
                          setCurriculum({
                            country: "",
                            framework: "",
                            yearLevel: "",
                            subject: "",
                            strand: "",
                            skill: "",
                          });
                        }
                      }}
                      style={buttonStyle(false)}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </section>

              <section
                style={{
                  ...mainCard(),
                  padding: 18,
                  background:
                    "linear-gradient(135deg, rgba(79,124,240,0.06) 0%, rgba(139,124,246,0.06) 100%)",
                  border: "1px solid #bfdbfe",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 16,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 18,
                        lineHeight: 1.25,
                        fontWeight: 900,
                        color: "#0f172a",
                        marginBottom: 8,
                      }}
                    >
                      {savedCount > 0
                        ? "You’re building momentum — next step: portfolio or reports"
                        : "After capture, the next strongest move is usually portfolio or reports"}
                    </div>

                    <div
                      style={{
                        fontSize: 14,
                        lineHeight: 1.6,
                        color: "#475569",
                        maxWidth: 760,
                      }}
                    >
                      {savedCount > 0
                        ? `You’ve saved ${savedCount} learning ${
                            savedCount === 1 ? "record" : "records"
                          } in this session. These become much more powerful when viewed together in portfolio and reports.`
                        : "Once a few meaningful records exist, the system becomes much more useful for curation, planning, and reporting."}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <Link href="/portfolio" style={buttonStyle(false)}>
                      Open Portfolio
                    </Link>
                    <Link href="/reports" style={buttonStyle(false)}>
                      Open Reports
                    </Link>
                  </div>
                </div>
              </section>
            </div>

            <div style={{ display: "grid", gap: 18 }}>
              <section style={mainCard()}>
                <div style={eyebrowStyle()}>Helpful guide</div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 18,
                    lineHeight: 1.2,
                    fontWeight: 900,
                    color: "#0f172a",
                  }}
                >
                  A simple way to think about it
                </div>

                <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                  {[
                    "What did your child actually do?",
                    "What does that show about their learning?",
                    "Why might this matter later in portfolio or reporting?",
                  ].map((prompt) => (
                    <div key={prompt} style={softCard()}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#334155", lineHeight: 1.5 }}>
                        {prompt}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
                  {[
                    "This does not need to be perfect to be useful.",
                    "A short, specific capture is often better than a long one.",
                    "You are building a record over time, not writing a polished report today.",
                  ].map((item) => (
                    <div key={item} style={subtleCard()}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", lineHeight: 1.55 }}>
                        {item}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section style={mainCard()}>
                <div style={eyebrowStyle()}>Current learner</div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 18,
                    lineHeight: 1.2,
                    fontWeight: 900,
                    color: "#0f172a",
                  }}
                >
                  {childDisplayName(activeChild)}
                </div>

                <div
                  style={{
                    marginTop: 8,
                    fontSize: 14,
                    color: "#475569",
                    lineHeight: 1.6,
                  }}
                >
                  {childYearLabel(activeChild) || "Year level not set yet"}
                  {safe(activeChild?.relationship_label)
                    ? ` • ${safe(activeChild?.relationship_label)}`
                    : ""}
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
                  {signals.length ? (
                    signals.map((signal) => (
                      <span
                        key={signal}
                        style={pillStyle("#eff6ff", "#1e40af", "#dbeafe")}
                      >
                        {signal}
                      </span>
                    ))
                  ) : (
                    <span style={pillStyle("#ffffff", "#64748b", "#d1d5db")}>
                      Signals will surface as you add more detail
                    </span>
                  )}
                </div>
              </section>
            </div>
          </section>

          {premiumMediaType ? (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15,23,42,0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 50,
                padding: 18,
              }}
            >
              <div
                style={{
                  width: "100%",
                  maxWidth: 720,
                  background: "#ffffff",
                  borderRadius: 22,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 30px 80px rgba(15,23,42,0.18)",
                  padding: 24,
                  display: "grid",
                  gap: 16,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={eyebrowStyle()}>Premium feature</div>
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 24,
                        lineHeight: 1.2,
                        fontWeight: 900,
                        color: "#0f172a",
                      }}
                    >
                      {mediaTitle(premiumMediaType)} are part of EduDecks Plus
                    </div>
                    <div
                      style={{
                        marginTop: 10,
                        fontSize: 15,
                        lineHeight: 1.7,
                        color: "#475569",
                        maxWidth: 560,
                      }}
                    >
                      {mediaExplanation(premiumMediaType)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPremiumMediaType(null)}
                    style={{ ...buttonStyle(false), padding: "8px 12px", alignSelf: "start" }}
                  >
                    Close
                  </button>
                </div>

                <UpgradeCard
                  trigger="capture-media"
                  variant="full"
                  onSecondaryClick={() => setPremiumMediaType(null)}
                />
              </div>
            </div>
          ) : null}
        </>
      )}
    </FamilyTopNavShell>
  );
}
