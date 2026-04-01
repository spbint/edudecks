/* ─────────────────────────────────────────────
   HOMESCHOOL REPORTING ENGINE v4 (STATIC)
   Evidence → Insight → Action
   Launch-safe, homeschool-first, builder/output ready
───────────────────────────────────────────── */

export type EvidenceItem = {
  id: string;
  student_id?: string | null;
  title?: string | null;
  description?: string | null;
  summary?: string | null;
  body?: string | null;
  note?: string | null;
  learning_area?: string | null;
  evidence_type?: string | null;
  created_at?: string | null;
  occurred_on?: string | null;
  has_media?: boolean | null;
  image_url?: string | null;
  photo_url?: string | null;
  file_url?: string | null;
  attachment_urls?: string[] | string | null;
  is_deleted?: boolean | null;
  [k: string]: any;
};

export type StudentItem = {
  id: string;
  preferred_name?: string | null;
  first_name?: string | null;
  surname?: string | null;
  family_name?: string | null;
  last_name?: string | null;
  year_level?: number | null;
  [k: string]: any;
};

export type ReportMode =
  | "family-summary"
  | "authority-ready"
  | "progress-review";

export type ReportFramework =
  | "homeschool"
  | "acara"
  | "common-core"
  | "uk"
  | "nz";

export type ReportPeriod =
  | "week"
  | "month"
  | "term"
  | "semester"
  | "year"
  | "custom";

export type ReportPreset =
  | "family-summary"
  | "progress-update"
  | "authority-pack"
  | "homeschool-review";

export type ReportRole = "core" | "appendix";

export type SelectionMeta = {
  role?: ReportRole;
  required?: boolean;
};

export type NextLearningPlan = {
  focusArea: string;
  reason: string;
  inquiryCycle: string;
  projectIdea: string;
  nextEvidence: string[];
  parentActions: string[];
};

export type WeeklyPlanDay = {
  day: string;
  focus: string;
  activity: string;
  evidenceToCapture: string;
};

export type CoverageRow = {
  area: string;
  selectedCount: number;
  availableCount: number;
  recentCount: number;
  hasMediaCount: number;
  status: "Strong" | "Developing" | "Missing";
};

export type GuidanceCard = {
  title: string;
  text: string;
  tone: "blue" | "orange" | "rose" | "green";
};

export type AppendixManifestItem = {
  id: string;
  title: string;
  area: string;
  type: string;
  occurredOn: string;
  score: number;
  reasons: string[];
  role: ReportRole;
  required: boolean;
  hasMedia: boolean;
};

export type ReportInput = {
  student?: StudentItem | null;
  studentName?: string;
  evidence: EvidenceItem[];
  selectedEvidenceIds?: string[];
  selectionMeta?: Record<string, SelectionMeta>;
  mode?: ReportMode;
  framework?: ReportFramework;
  period?: ReportPeriod;
  preset?: ReportPreset;
  startDate?: string | null;
  endDate?: string | null;
};

export type ReportOutput = {
  studentId: string;
  studentName: string;
  mode: ReportMode;
  framework: ReportFramework;
  period: ReportPeriod;
  preset: ReportPreset;
  packSource: "selected-evidence" | "fallback-auto";

  readiness: number;
  readinessBand: "Low" | "Emerging" | "Strong";

  coverage: {
    represented: string[];
    missing: string[];
    diversityScore: number;
    countsByArea: Record<string, number>;
    rows: CoverageRow[];
  };

  strengths: string[];
  developing: string[];

  quality: {
    averageEvidenceScore: number;
    mediaRatio: number;
    recentRatio: number;
    narrativeRatio: number;
    volumeScore: number;
    selectedCount: number;
    coreCount: number;
    appendixCount: number;
    requiredCount: number;
    balanceWarning: string | null;
    recencyDaysAverage: number;
  };

  narrative: {
    headline: string;
    overview: string;
    strengths: string;
    developing: string;
    nextFocus: string;
    evidenceParagraph: string;
    authoritySummary: string;
  };

  guidance: string[];
  guidanceCards: GuidanceCard[];

  nextPlan: NextLearningPlan;
  weeklyPlan: WeeklyPlanDay[];

  appendix: EvidenceItem[];
  orderedEvidence: EvidenceItem[];
  orderedCoreEvidence: EvidenceItem[];
  orderedAppendixEvidence: EvidenceItem[];
  manifest: AppendixManifestItem[];
};

/* ───────────────────────── CONSTANTS ───────────────────────── */

const LEARNING_AREAS = [
  "Literacy",
  "Numeracy",
  "Science",
  "Humanities",
  "Arts",
  "Health & PE",
  "Technologies",
  "Languages",
  "Other",
];

/* ───────────────────────── HELPERS ───────────────────────── */

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function textOf(e: EvidenceItem) {
  return safe(e.description || e.summary || e.body || e.note);
}

function titleOf(e: EvidenceItem) {
  return safe(e.title) || "Untitled evidence";
}

function getStudentName(student?: StudentItem | null, fallback?: string) {
  if (student) {
    const first = safe(student.preferred_name || student.first_name);
    const last = safe(student.surname || student.family_name || student.last_name);
    const full = `${first} ${last}`.trim();
    if (full) return full;
  }

  return safe(fallback) || "Child";
}

function normaliseArea(area?: string | null) {
  const value = safe(area).toLowerCase();

  if (!value) return "Other";
  if (value.includes("literacy") || value.includes("english") || value.includes("reading") || value.includes("writing")) return "Literacy";
  if (value.includes("numeracy") || value.includes("math")) return "Numeracy";
  if (value.includes("science")) return "Science";
  if (value.includes("humanit") || value.includes("history") || value.includes("geography") || value.includes("hass")) return "Humanities";
  if (value.includes("art") || value.includes("music") || value.includes("drama")) return "Arts";
  if (value.includes("health") || value.includes("pe") || value.includes("physical")) return "Health & PE";
  if (value.includes("tech")) return "Technologies";
  if (value.includes("language")) return "Languages";

  return area?.trim() || "Other";
}

function hasMedia(e: EvidenceItem) {
  if (e.has_media) return true;

  return (
    !!safe(e.image_url) ||
    !!safe(e.photo_url) ||
    !!safe(e.file_url) ||
    (Array.isArray(e.attachment_urls) && e.attachment_urls.length > 0) ||
    (!!safe(e.attachment_urls) && !Array.isArray(e.attachment_urls))
  );
}

function dateValueOf(e: EvidenceItem) {
  return safe(e.occurred_on || e.created_at);
}

function daysSince(dateValue?: string | null) {
  const value = safe(dateValue);
  if (!value) return 9999;

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 9999;

  const diff = Date.now() - d.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function shortDate(dateValue?: string | null) {
  const value = safe(dateValue);
  if (!value) return "—";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value.slice(0, 10);

  return d.toLocaleDateString();
}

function inDateRange(value: string | null | undefined, startDate?: string | null, endDate?: string | null) {
  const raw = safe(value);
  if (!raw) return true;

  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return true;

  if (startDate) {
    const s = new Date(startDate);
    if (!Number.isNaN(s.getTime()) && d < s) return false;
  }

  if (endDate) {
    const e = new Date(endDate);
    if (!Number.isNaN(e.getTime()) && d > e) return false;
  }

  return true;
}

function hasNarrative(e: EvidenceItem) {
  return textOf(e).length >= 30;
}

function evidenceQualityScore(e: EvidenceItem) {
  let score = 0;

  if (safe(e.title)) score += 2;

  const descriptionLength = textOf(e).length;
  if (descriptionLength >= 180) score += 5;
  else if (descriptionLength >= 120) score += 4;
  else if (descriptionLength >= 80) score += 3;
  else if (descriptionLength >= 30) score += 2;
  else if (descriptionLength > 0) score += 1;

  if (normaliseArea(e.learning_area) !== "Other") score += 2;
  if (safe(e.evidence_type)) score += 1;
  if (hasMedia(e)) score += 2;

  const age = daysSince(dateValueOf(e));
  if (age <= 30) score += 2;
  else if (age <= 90) score += 1;

  return score;
}

function evidenceReasons(e: EvidenceItem) {
  const reasons: string[] = [];

  if (safe(e.title)) reasons.push("clear title");
  if (textOf(e).length >= 80) reasons.push("rich description");
  else if (textOf(e).length >= 30) reasons.push("some narrative detail");
  if (normaliseArea(e.learning_area) !== "Other") reasons.push("learning area tagged");
  if (safe(e.evidence_type)) reasons.push("evidence type tagged");
  if (hasMedia(e)) reasons.push("includes media");
  if (daysSince(dateValueOf(e)) <= 30) reasons.push("recent evidence");

  if (!reasons.length) reasons.push("basic entry");

  return reasons;
}

function sortEvidenceByQuality(evidence: EvidenceItem[]) {
  return [...evidence].sort((a, b) => {
    const scoreDiff = evidenceQualityScore(b) - evidenceQualityScore(a);
    if (scoreDiff !== 0) return scoreDiff;

    return safe(dateValueOf(b)).localeCompare(safe(dateValueOf(a)));
  });
}

function countByArea(evidence: EvidenceItem[]) {
  const counts: Record<string, number> = {};

  evidence.forEach((e) => {
    const area = normaliseArea(e.learning_area);
    counts[area] = (counts[area] || 0) + 1;
  });

  return counts;
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function autoSelectEvidence(evidence: EvidenceItem[], limit = 10) {
  const sorted = sortEvidenceByQuality(evidence);
  const byArea = new Map<string, EvidenceItem[]>();

  sorted.forEach((item) => {
    const area = normaliseArea(item.learning_area);
    const list = byArea.get(area) || [];
    list.push(item);
    byArea.set(area, list);
  });

  const chosen: EvidenceItem[] = [];

  [...byArea.keys()].sort((a, b) => a.localeCompare(b)).forEach((area) => {
    const best = (byArea.get(area) || []).slice(0, 2);
    best.forEach((item) => {
      if (!chosen.find((x) => x.id === item.id)) chosen.push(item);
    });
  });

  return chosen.slice(0, limit);
}

function buildCoverageRows(available: EvidenceItem[], selected: EvidenceItem[]): CoverageRow[] {
  return LEARNING_AREAS.map((area) => {
    const availableArea = available.filter((e) => normaliseArea(e.learning_area) === area);
    const selectedArea = selected.filter((e) => normaliseArea(e.learning_area) === area);

    let status: CoverageRow["status"] = "Missing";
    if (selectedArea.length >= 2) status = "Strong";
    else if (selectedArea.length >= 1) status = "Developing";

    return {
      area,
      selectedCount: selectedArea.length,
      availableCount: availableArea.length,
      recentCount: selectedArea.filter((e) => daysSince(dateValueOf(e)) <= 30).length,
      hasMediaCount: selectedArea.filter(hasMedia).length,
      status,
    };
  });
}

/* ───────────────────────── COVERAGE ───────────────────────── */

function calculateCoverage(allEvidence: EvidenceItem[], selectedEvidence: EvidenceItem[]) {
  const countsByArea = countByArea(selectedEvidence);
  const represented = Object.keys(countsByArea).sort((a, b) => a.localeCompare(b));
  const missing = LEARNING_AREAS.filter((a) => !countsByArea[a]);
  const diversityScore = Math.min(1, represented.length / LEARNING_AREAS.length);
  const rows = buildCoverageRows(allEvidence, selectedEvidence);

  return { represented, missing, diversityScore, countsByArea, rows };
}

/* ───────────────────────── QUALITY ───────────────────────── */

function calculateRecentRatio(evidence: EvidenceItem[]) {
  if (!evidence.length) return 0;
  const recentCount = evidence.filter((e) => daysSince(dateValueOf(e)) <= 90).length;
  return recentCount / evidence.length;
}

function calculateMediaRatio(evidence: EvidenceItem[]) {
  if (!evidence.length) return 0;
  return evidence.filter((e) => hasMedia(e)).length / evidence.length;
}

function calculateNarrativeRatio(evidence: EvidenceItem[]) {
  if (!evidence.length) return 0;
  return evidence.filter(hasNarrative).length / evidence.length;
}

function calculateVolumeScore(evidence: EvidenceItem[]) {
  return Math.min(1, evidence.length / 8);
}

function calculateAverageEvidenceScore(evidence: EvidenceItem[]) {
  if (!evidence.length) return 0;
  const total = evidence.reduce((sum, item) => sum + evidenceQualityScore(item), 0);
  return Math.round((total / evidence.length) * 10) / 10;
}

function detectBalanceWarning(evidence: EvidenceItem[]) {
  if (!evidence.length) return "No selected evidence yet.";

  const counts = countByArea(evidence);
  const ordered = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const top = ordered[0];

  if (!top) return null;

  if (top[1] >= 4 && top[1] / evidence.length >= 0.5) {
    return `The current evidence set leans heavily toward ${top[0]}. Add more variety to improve balance.`;
  }

  return null;
}

function calculateQuality(
  evidence: EvidenceItem[],
  selectionMeta: Record<string, SelectionMeta>
) {
  const mediaRatio = calculateMediaRatio(evidence);
  const recentRatio = calculateRecentRatio(evidence);
  const narrativeRatio = calculateNarrativeRatio(evidence);
  const volumeScore = calculateVolumeScore(evidence);
  const averageEvidenceScore = calculateAverageEvidenceScore(evidence);

  const coreCount = evidence.filter(
    (e) => (selectionMeta[e.id]?.role || "core") === "core"
  ).length;

  const appendixCount = evidence.filter(
    (e) => (selectionMeta[e.id]?.role || "core") === "appendix"
  ).length;

  const requiredCount = evidence.filter((e) => !!selectionMeta[e.id]?.required).length;

  return {
    averageEvidenceScore,
    mediaRatio,
    recentRatio,
    narrativeRatio,
    volumeScore,
    selectedCount: evidence.length,
    coreCount,
    appendixCount,
    requiredCount,
    balanceWarning: detectBalanceWarning(evidence),
    recencyDaysAverage: Math.round(
      average(evidence.map((e) => daysSince(dateValueOf(e))))
    ),
  };
}

/* ───────────────────────── READINESS ───────────────────────── */

function calculateReadiness(evidence: EvidenceItem[]) {
  if (!evidence.length) return 0;

  const coverage = {
    represented: Object.keys(countByArea(evidence)),
    diversityScore: Math.min(1, Object.keys(countByArea(evidence)).length / LEARNING_AREAS.length),
  };

  const quality = {
    recentRatio: calculateRecentRatio(evidence),
    volumeScore: calculateVolumeScore(evidence),
    mediaRatio: calculateMediaRatio(evidence),
    narrativeRatio: calculateNarrativeRatio(evidence),
    averageEvidenceScore: calculateAverageEvidenceScore(evidence),
  };

  const score =
    coverage.diversityScore * 0.32 +
    quality.recentRatio * 0.2 +
    quality.volumeScore * 0.18 +
    quality.mediaRatio * 0.1 +
    quality.narrativeRatio * 0.1 +
    Math.min(1, quality.averageEvidenceScore / 10) * 0.1;

  return Math.max(0, Math.min(100, Math.round(score * 100)));
}

function readinessBand(readiness: number): "Low" | "Emerging" | "Strong" {
  if (readiness >= 75) return "Strong";
  if (readiness >= 45) return "Emerging";
  return "Low";
}

/* ───────────────────────── ANALYSIS ───────────────────────── */

function determineStrengths(evidence: EvidenceItem[]) {
  const counts = countByArea(evidence);

  const strengths = Object.entries(counts)
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([area]) => area)
    .slice(0, 3);

  if (!strengths.length && evidence.length) {
    const fallback = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([area]) => area)
      .slice(0, 2);

    return fallback;
  }

  return strengths;
}

function determineDeveloping(evidence: EvidenceItem[]) {
  const coverage = calculateCoverage(evidence, evidence);

  if (coverage.missing.length > 0) {
    return coverage.missing.slice(0, 3);
  }

  const ordered = Object.entries(coverage.countsByArea)
    .sort((a, b) => a[1] - b[1])
    .map(([area]) => area);

  return ordered.slice(0, 2);
}

/* ───────────────────────── NARRATIVE ───────────────────────── */

function buildOverview(
  studentName: string,
  evidenceCount: number,
  mode: ReportMode,
  readiness: number,
  strongest: string[]
) {
  const strongestText = strongest.length > 0 ? strongest.join(", ") : "multiple areas";

  if (mode === "authority-ready") {
    return `${studentName} has engaged in a documented range of learning experiences, with ${evidenceCount} representative evidence item${evidenceCount === 1 ? "" : "s"} currently supporting this report. The strongest current evidence profile is in ${strongestText}. Overall reporting readiness is ${readiness}%.`;
  }

  if (mode === "progress-review") {
    return `${studentName}'s current learning record includes ${evidenceCount} evidence item${evidenceCount === 1 ? "" : "s"} and shows the clearest momentum in ${strongestText}. Current readiness is ${readiness}%.`;
  }

  return `${studentName} has a growing homeschool learning portfolio with ${evidenceCount} evidence item${evidenceCount === 1 ? "" : "s"} currently represented. The strongest evidence pattern is in ${strongestText}, with overall report readiness currently at ${readiness}%.`;
}

function buildStrengthsText(studentName: string, strengths: string[], mode: ReportMode) {
  if (!strengths.length) {
    return mode === "authority-ready"
      ? `${studentName}'s current evidence base demonstrates emerging progress across several areas, though further breadth would strengthen the profile.`
      : `${studentName}'s current evidence shows emerging progress across several areas.`;
  }

  if (mode === "authority-ready") {
    return `${studentName}'s strongest current evidence base is in ${strengths.join(", ")}. These areas contain the clearest representative material and give the most confidence for formal reporting.`;
  }

  return `${studentName}'s strongest current areas appear to be ${strengths.join(", ")}. These parts of the portfolio contain the richest and most representative evidence right now.`;
}

function buildDevelopingText(studentName: string, developing: string[], mode: ReportMode) {
  if (!developing.length) {
    return mode === "authority-ready"
      ? `${studentName}'s current coverage is reasonably balanced across the major learning areas.`
      : `${studentName}'s portfolio currently shows a balanced spread across the main learning areas.`;
  }

  if (mode === "authority-ready") {
    return `Further representative evidence in ${developing.join(", ")} would strengthen balance, improve defensibility, and lift overall confidence for structured reporting.`;
  }

  return `Further evidence in ${developing.join(", ")} would make ${studentName}'s portfolio feel more balanced and complete.`;
}

function buildNextFocusText(developing: string[], mode: ReportMode) {
  const focus = developing[0];

  if (!focus) {
    return mode === "authority-ready"
      ? "The next phase should focus on maintaining breadth while deepening the quality of representative evidence."
      : "The next phase can focus on deepening evidence quality through sustained projects, written reflection, and visual proof.";
  }

  if (mode === "authority-ready") {
    return `Next learning should prioritise ${focus} through structured tasks, representative work samples, and a clearer sequence of evidence across time.`;
  }

  if (mode === "progress-review") {
    return `The clearest next focus is ${focus}. A short inquiry cycle or mini-project in this area would strengthen the next review point.`;
  }

  return `A strong next step would be to focus on ${focus} through projects, practical tasks, or guided inquiry so the portfolio continues to broaden.`;
}

function buildEvidenceParagraph(evidence: EvidenceItem[]) {
  if (!evidence.length) {
    return "No selected evidence has been curated yet, so the final report is still relying on a minimal evidence base.";
  }

  const examples = evidence
    .slice(0, 3)
    .map((item) => `"${titleOf(item)}"`)
    .join(", ");

  return `Selected evidence includes ${examples}. These samples provide the clearest current picture of participation, progress, and learning development.`;
}

function buildAuthoritySummary(studentName: string, readiness: number, missing: string[]) {
  if (!missing.length) {
    return `${studentName}'s current evidence set provides a strong basis for structured reporting, with readiness sitting at ${readiness}%.`;
  }

  return `${studentName}'s current evidence set provides a usable reporting base, but additional representative evidence in ${missing.slice(0, 3).join(", ")} would strengthen the overall defensibility of the final pack.`;
}

function buildNarrative(
  studentName: string,
  evidence: EvidenceItem[],
  strengths: string[],
  developing: string[],
  mode: ReportMode,
  readiness: number,
  missing: string[]
) {
  return {
    headline:
      mode === "authority-ready"
        ? `${studentName} — Reporting Summary`
        : mode === "progress-review"
          ? `${studentName} — Progress Review`
          : `${studentName} — Family Learning Summary`,
    overview: buildOverview(studentName, evidence.length, mode, readiness, strengths),
    strengths: buildStrengthsText(studentName, strengths, mode),
    developing: buildDevelopingText(studentName, developing, mode),
    nextFocus: buildNextFocusText(developing, mode),
    evidenceParagraph: buildEvidenceParagraph(evidence),
    authoritySummary: buildAuthoritySummary(studentName, readiness, missing),
  };
}

/* ───────────────────────── GUIDANCE ───────────────────────── */

function buildGuidance(
  evidence: EvidenceItem[],
  readiness: number,
  developing: string[],
  quality: ReportOutput["quality"]
) {
  const tips: string[] = [];

  if (evidence.length < 3) {
    tips.push("Add more evidence samples so the report is not relying on too small a set.");
  }

  if (readiness < 40) {
    tips.push("Broaden the portfolio across more learning areas before treating this as report-ready.");
  }

  if (developing.length > 0) {
    tips.push(`Plan the next learning phase around ${developing[0]} so coverage becomes more balanced.`);
  }

  if (quality.mediaRatio < 0.2) {
    tips.push("Include at least one photo, file, or visual artefact to strengthen representation.");
  }

  if (quality.narrativeRatio < 0.5) {
    tips.push("Add richer written descriptions or observation notes so the evidence carries clearer meaning.");
  }

  if (quality.recentRatio < 0.5) {
    tips.push("Add more recent evidence so the report reflects current learning rather than older samples.");
  }

  if (quality.balanceWarning) {
    tips.push(quality.balanceWarning);
  }

  tips.push("A mix of written work, practical tasks, and reflective notes gives the strongest reporting base.");

  return tips.slice(0, 6);
}

function buildGuidanceCards(
  evidence: EvidenceItem[],
  readiness: number,
  missing: string[],
  quality: ReportOutput["quality"]
): GuidanceCard[] {
  const cards: GuidanceCard[] = [];

  if (!evidence.length) {
    cards.push({
      title: "Start the report set",
      text: "Choose a small group of stronger entries so the report can move from placeholder output to meaningful narrative generation.",
      tone: "blue",
    });
  }

  if (readiness >= 75) {
    cards.push({
      title: "Ready to build",
      text: "This curated set is strong enough to support a confident homeschool report draft.",
      tone: "green",
    });
  } else if (readiness >= 45) {
    cards.push({
      title: "Good foundation",
      text: "The current evidence is usable, but another layer of balance or recency would strengthen the final pack.",
      tone: "blue",
    });
  } else {
    cards.push({
      title: "Strengthen before export",
      text: "The current evidence base is still light. Add stronger or more representative samples before finalising the report.",
      tone: "orange",
    });
  }

  if (missing.length > 0) {
    cards.push({
      title: "Broaden coverage",
      text: `The following learning areas are still under-represented: ${missing.slice(0, 3).join(", ")}.`,
      tone: "orange",
    });
  }

  if (quality.balanceWarning) {
    cards.push({
      title: "Improve balance",
      text: quality.balanceWarning,
      tone: "rose",
    });
  }

  return cards.slice(0, 4);
}

/* ───────────────────────── ACTION ENGINE ───────────────────────── */

function buildInquiryCycle(focusArea: string, mode: ReportMode) {
  if (focusArea === "Literacy") {
    return mode === "authority-ready"
      ? "Collect a sequence of written responses, edited work, and oral language observations across the next two weeks."
      : "Run a short writing and reading response cycle with one draft, one reflection, and one finished piece.";
  }

  if (focusArea === "Numeracy") {
    return mode === "authority-ready"
      ? "Capture problem-solving tasks, worked strategies, and a short reflection showing mathematical reasoning."
      : "Try a mini maths inquiry with practical tasks, a worked example, and a quick explanation of thinking.";
  }

  if (focusArea === "Science") {
    return "Use a simple investigation cycle: predict, test, record, and reflect.";
  }

  if (focusArea === "Humanities") {
    return "Use a question-led inquiry with reading, discussion, and a short response or presentation.";
  }

  if (focusArea === "Arts") {
    return "Build a short create-reflect-share cycle with one finished artefact and a reflection note.";
  }

  if (focusArea === "Technologies") {
    return "Plan a design-build-review cycle and capture each stage with photos or notes.";
  }

  if (focusArea === "Languages") {
    return "Capture vocabulary practice, short spoken examples, and one simple written response.";
  }

  if (focusArea === "Health & PE") {
    return "Track a short movement, wellbeing, or personal challenge cycle with simple daily notes.";
  }

  return "Use a short inquiry cycle with planning, activity, evidence capture, and reflection.";
}

function buildProjectIdea(focusArea: string) {
  if (focusArea === "Literacy") return "Create a mini author study or write a short information booklet.";
  if (focusArea === "Numeracy") return "Run a real-life budgeting, measuring, or data project.";
  if (focusArea === "Science") return "Complete a home experiment journal with predictions and results.";
  if (focusArea === "Humanities") return "Build a local history, geography, or community research project.";
  if (focusArea === "Arts") return "Create a themed art portfolio with artist inspiration and reflection.";
  if (focusArea === "Health & PE") return "Track a personal movement or wellbeing challenge across two weeks.";
  if (focusArea === "Technologies") return "Design and build a simple model, system, or digital product.";
  if (focusArea === "Languages") return "Create a themed vocabulary poster, audio recording, or dialogue task.";
  return "Create a small project that ends with a product, reflection, and evidence sample.";
}

function buildNextEvidenceSuggestions(focusArea: string) {
  if (focusArea === "Literacy") {
    return [
      "A writing sample with visible editing",
      "A reading response or comprehension note",
      "A short oral language observation",
    ];
  }

  if (focusArea === "Numeracy") {
    return [
      "A worked problem-solving example",
      "A photo of practical maths in action",
      "A short explanation of the strategy used",
    ];
  }

  if (focusArea === "Science") {
    return [
      "A prediction and results record",
      "A labelled diagram or photo",
      "A short reflection on what changed or was discovered",
    ];
  }

  if (focusArea === "Humanities") {
    return [
      "A research note or map",
      "A summary of learning from a source",
      "A short presentation or reflection",
    ];
  }

  if (focusArea === "Arts") {
    return [
      "A planning draft or sketch",
      "A photo of the finished work",
      "A reflection on creative choices",
    ];
  }

  if (focusArea === "Technologies") {
    return [
      "A design plan or sketch",
      "A build/test photo",
      "A review of what worked and what changed",
    ];
  }

  if (focusArea === "Health & PE") {
    return [
      "A tracker or movement log",
      "A reflection on effort or wellbeing",
      "A photo or note from the activity",
    ];
  }

  return [
    "A clear work sample",
    "A short reflective note",
    "A photo or visual artefact",
  ];
}

function buildParentActions(focusArea: string, readiness: number) {
  const actions: string[] = [
    `Schedule one focused activity in ${focusArea} this week.`,
    "Capture one written or spoken reflection after the activity.",
    "Add at least one recent photo, file, or work sample to the portfolio.",
  ];

  if (readiness < 60) {
    actions.unshift("Prioritise breadth over polish by collecting representative evidence first.");
  }

  return actions.slice(0, 4);
}

function buildNextPlan(
  developing: string[],
  mode: ReportMode,
  readiness: number
): NextLearningPlan {
  const focusArea = developing[0] || "Other";

  return {
    focusArea,
    reason:
      developing.length > 0
        ? `${focusArea} currently needs more representative evidence to improve balance and readiness.`
        : "The next step is to deepen the quality of current evidence and maintain breadth.",
    inquiryCycle: buildInquiryCycle(focusArea, mode),
    projectIdea: buildProjectIdea(focusArea),
    nextEvidence: buildNextEvidenceSuggestions(focusArea),
    parentActions: buildParentActions(focusArea, readiness),
  };
}

function buildWeeklyPlan(focusArea: string, projectIdea: string): WeeklyPlanDay[] {
  return [
    {
      day: "Monday",
      focus: focusArea,
      activity: `Introduce the weekly focus and launch the project idea: ${projectIdea}`,
      evidenceToCapture: "Planning notes or child voice",
    },
    {
      day: "Tuesday",
      focus: focusArea,
      activity: "Complete a practical activity or hands-on task linked to the focus area.",
      evidenceToCapture: "Photo evidence and quick observation note",
    },
    {
      day: "Wednesday",
      focus: focusArea,
      activity: "Add a writing, reading, or numeracy connection to deepen the learning.",
      evidenceToCapture: "Work sample with explanation",
    },
    {
      day: "Thursday",
      focus: focusArea,
      activity: "Review, improve, test, or compare ideas from earlier in the week.",
      evidenceToCapture: "Reflection or oral summary",
    },
    {
      day: "Friday",
      focus: focusArea,
      activity: "Share the week’s learning through a mini presentation or finished product.",
      evidenceToCapture: "Final artefact and end-of-week reflection",
    },
  ];
}

/* ───────────────────────── MAIN FUNCTION ───────────────────────── */

export function buildHomeschoolReport(input: ReportInput): ReportOutput {
  const mode = input.mode || "family-summary";
  const framework = input.framework || "homeschool";
  const period = input.period || "term";
  const preset = input.preset || "family-summary";
  const selectionMeta = input.selectionMeta || {};

  const studentId = safe(input.student?.id);
  const studentName = getStudentName(input.student, input.studentName);

  const allEvidence = (input.evidence || [])
    .filter((item) => !item.is_deleted)
    .filter((item) => !studentId || safe(item.student_id) === studentId)
    .filter((item) => inDateRange(dateValueOf(item), input.startDate, input.endDate));

  const selectedIdSet = new Set(
    (input.selectedEvidenceIds || []).map((id) => safe(id)).filter(Boolean)
  );

  const explicitSelected =
    selectedIdSet.size > 0
      ? allEvidence.filter((item) => selectedIdSet.has(safe(item.id)))
      : [];

  const packSource: "selected-evidence" | "fallback-auto" =
    explicitSelected.length > 0 ? "selected-evidence" : "fallback-auto";

  let orderedEvidence: EvidenceItem[] = [];

  if (explicitSelected.length > 0 && input.selectedEvidenceIds?.length) {
    const map = new Map(explicitSelected.map((item) => [safe(item.id), item]));
    orderedEvidence = input.selectedEvidenceIds
      .map((id) => map.get(safe(id)))
      .filter(Boolean) as EvidenceItem[];
  } else {
    orderedEvidence = autoSelectEvidence(allEvidence, 10);
  }

  const orderedCoreEvidence = orderedEvidence.filter(
    (item) => (selectionMeta[item.id]?.role || "core") === "core"
  );

  const orderedAppendixEvidence = orderedEvidence.filter(
    (item) => (selectionMeta[item.id]?.role || "core") === "appendix"
  );

  const appendix = orderedEvidence;
  const coverage = calculateCoverage(allEvidence, orderedEvidence);
  const quality = calculateQuality(orderedEvidence, selectionMeta);
  const readiness = calculateReadiness(orderedEvidence);
  const strengths = determineStrengths(orderedEvidence);
  const developing = determineDeveloping(orderedEvidence);

  const narrative = buildNarrative(
    studentName,
    orderedEvidence,
    strengths,
    developing,
    mode,
    readiness,
    coverage.missing
  );

  const guidance = buildGuidance(
    orderedEvidence,
    readiness,
    developing,
    quality
  );

  const guidanceCards = buildGuidanceCards(
    orderedEvidence,
    readiness,
    coverage.missing,
    quality
  );

  const nextPlan = buildNextPlan(developing, mode, readiness);
  const weeklyPlan = buildWeeklyPlan(nextPlan.focusArea, nextPlan.projectIdea);

  const manifest: AppendixManifestItem[] = orderedEvidence.map((item) => ({
    id: safe(item.id),
    title: titleOf(item),
    area: normaliseArea(item.learning_area),
    type: safe(item.evidence_type) || "General evidence",
    occurredOn: shortDate(dateValueOf(item)),
    score: evidenceQualityScore(item),
    reasons: evidenceReasons(item),
    role: (selectionMeta[item.id]?.role || "core") as ReportRole,
    required: !!selectionMeta[item.id]?.required,
    hasMedia: hasMedia(item),
  }));

  return {
    studentId,
    studentName,
    mode,
    framework,
    period,
    preset,
    packSource,

    readiness,
    readinessBand: readinessBand(readiness),

    coverage,
    strengths,
    developing,

    quality,

    narrative,

    guidance,
    guidanceCards,

    nextPlan,
    weeklyPlan,

    appendix,
    orderedEvidence,
    orderedCoreEvidence,
    orderedAppendixEvidence,
    manifest,
  };
}