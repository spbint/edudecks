"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import { familyStyles as S } from "@/lib/theme/familyStyles";
import { listReportDrafts, type ReportDraftRow } from "@/lib/reportDrafts";
import UpgradeCard from "@/app/components/premium/UpgradeCard";
import {
  getPremiumUpgradeDecision,
  dismissPremiumTrigger,
  getPremiumPlanFromStorage,
} from "@/lib/premiumUpgradeEngine";

/* =========================
   TYPES
========================= */

type ChildRecord = {
  id: string;
  name: string;
  yearLabel: string;
  evidenceCount: number;
  recentAreaCount: number;
  lastUpdated: string | null;
  strongestArea: string;
  nextFocusArea: string;
  status: "getting-started" | "building" | "ready" | "attention";
};

type FamilySettings = {
  defaultChildId?: string;
  autoOpenLastChild?: boolean;
  showAuthorityGuidance?: boolean;
  familyDisplayName?: string;
  preferredMarket?: "au" | "uk" | "us";
  onboardingComplete?: boolean;
  parentName?: string;
};

type GuideState = {
  title: string;
  body: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  tone: "info" | "success" | "warning";
  reason: string;
  progressNudge: string;
};

type LearningStep = {
  current: string;
  next: string;
  action: string;
};

/* =========================
   CONSTANTS
========================= */

const CHILDREN_KEY = "edudecks_children_seed_v1";
const SETTINGS_KEY = "edudecks_family_settings_v1";
const ACTIVE_STUDENT_ID_KEY = "edudecks_active_student_id";

const FALLBACK_CHILDREN: ChildRecord[] = [
  {
    id: "child-ava",
    name: "Ava",
    yearLabel: "Year 4",
    evidenceCount: 0,
    recentAreaCount: 0,
    lastUpdated: null,
    strongestArea: "—",
    nextFocusArea: "Literacy",
    status: "getting-started",
  },
  {
    id: "child-harvey",
    name: "Harvey",
    yearLabel: "Year 3",
    evidenceCount: 1,
    recentAreaCount: 1,
    lastUpdated: null,
    strongestArea: "Literacy",
    nextFocusArea: "Numeracy",
    status: "building",
  },
  {
    id: "child-jude",
    name: "Jude",
    yearLabel: "Year 5",
    evidenceCount: 3,
    recentAreaCount: 2,
    lastUpdated: null,
    strongestArea: "Humanities",
    nextFocusArea: "Science",
    status: "building",
  },
];

const AREA_SEQUENCE: Record<string, LearningStep> = {
  literacy: {
    current: "early reading and writing evidence",
    next: "blending, fluency, and simple written responses",
    action: "capture one short reading or writing learning moment next",
  },
  numeracy: {
    current: "single-step number understanding",
    next: "multi-step number work and strategy explanation",
    action: "capture a worked example with a short note about the strategy used",
  },
  mathematics: {
    current: "early operations evidence",
    next: "larger numbers, regrouping, and explanation of method",
    action: "add one more maths learning entry showing the next level of difficulty",
  },
  science: {
    current: "observation and recall",
    next: "prediction, explanation, and simple investigation",
    action: "capture a photo and short reflection from a hands-on science task",
  },
  humanities: {
    current: "basic topic engagement",
    next: "comparison, explanation, and source-based thinking",
    action: "add a short summary showing what your child learned and explained",
  },
  default: {
    current: "early learning evidence",
    next: "a slightly more independent next step",
    action: "capture one new learning moment and describe what your child could now do",
  },
};

/* =========================
   HELPERS
========================= */

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function asNumber(v: unknown, fallback = 0) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function asDateText(v: unknown): string | null {
  const s = safe(v);
  return s || null;
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
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  return Math.max(
    0,
    Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  );
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function statusPill(status: ChildRecord["status"]) {
  if (status === "ready") return S.pill("success");
  if (status === "attention") return S.pill("warning");
  if (status === "building") return S.pill("info");
  return S.pill("secondary");
}

function statusLabel(status: ChildRecord["status"]) {
  if (status === "ready") return "Ready to report";
  if (status === "attention") return "Needs attention";
  if (status === "building") return "Building momentum";
  return "Getting started";
}

function calmCheckTone(score: number): "success" | "info" | "warning" {
  if (score >= 75) return "success";
  if (score >= 45) return "info";
  return "warning";
}

function calmCheckText(score: number, childName: string) {
  if (score >= 75) {
    return `${childName} is on track. You have enough current evidence to move calmly toward reporting.`;
  }
  if (score >= 45) {
    return `${childName} is nearly there. One or two stronger learning moments would build confidence quickly.`;
  }
  return `${childName} needs a little more captured learning before this feels fully reassuring. Start small — one entry counts.`;
}

function normalizeChild(raw: any, index: number): ChildRecord {
  const name =
    safe(raw?.name) ||
    safe(raw?.child_name) ||
    safe(raw?.label) ||
    safe(raw?.title) ||
    [
      safe(raw?.preferred_name || raw?.first_name),
      safe(raw?.surname || raw?.family_name || raw?.last_name),
    ]
      .filter(Boolean)
      .join(" ") ||
    `Child ${index + 1}`;

  const yearLabel =
    safe(raw?.yearLabel) ||
    safe(raw?.year_label) ||
    (safe(raw?.year_level) ? `Year ${safe(raw?.year_level)}` : "Year level");

  const evidenceCount = asNumber(
    raw?.evidenceCount ?? raw?.evidence_count ?? raw?.entries ?? raw?.evidence,
    0
  );

  const recentAreaCount = asNumber(
    raw?.recentAreaCount ?? raw?.recent_area_count ?? raw?.coverage ?? 0,
    0
  );

  const lastUpdated =
    asDateText(raw?.lastUpdated) ||
    asDateText(raw?.updated_at) ||
    asDateText(raw?.lastEvidenceAt) ||
    asDateText(raw?.last_evidence_at);

  const strongestArea =
    safe(raw?.strongestArea) ||
    safe(raw?.strongest_area) ||
    safe(raw?.focusArea) ||
    safe(raw?.focus_area) ||
    "Literacy";

  const nextFocusArea =
    safe(raw?.nextFocusArea) ||
    safe(raw?.next_focus_area) ||
    (strongestArea === "—" ? "Literacy" : strongestArea);

  let status: ChildRecord["status"] = "getting-started";
  if (evidenceCount >= 4 && recentAreaCount >= 3) status = "ready";
  else if (evidenceCount >= 1) status = "building";
  if (lastUpdated && (daysSince(lastUpdated) ?? 0) > 30) status = "attention";

  return {
    id: safe(raw?.id) || `child-${index + 1}`,
    name,
    yearLabel,
    evidenceCount,
    recentAreaCount,
    lastUpdated,
    strongestArea,
    nextFocusArea,
    status,
  };
}

function inferLearningStep(area: string): LearningStep {
  const key = safe(area).toLowerCase();
  return AREA_SEQUENCE[key] || AREA_SEQUENCE.default;
}

function buildGuideState(
  child: ChildRecord | null,
  childDraft: ReportDraftRow | null
): GuideState {
  if (!child) {
    return {
      title: "Start by adding your first child",
      body: "Create or import a child profile so EduDecks can guide you through evidence, reports, and next learning steps.",
      primaryLabel: "Add child",
      primaryHref: "/children",
      secondaryLabel: "Open settings",
      secondaryHref: "/settings",
      tone: "info",
      reason: "No child is currently selected.",
      progressNudge:
        "Your first completed setup step unlocks the rest of the journey.",
    };
  }

  const evidenceCount = child.evidenceCount;
  const recentAreaCount = child.recentAreaCount;
  const lastDays = daysSince(child.lastUpdated);
  const selectedEvidenceCount = childDraft?.selected_evidence_ids?.length ?? 0;

  if (evidenceCount === 0) {
    return {
      title: `Start ${child.name}'s first learning entry`,
      body: `${child.name} does not have any saved learning evidence yet. Capture one small learning moment today so the system can begin guiding the next step with more confidence.`,
      primaryLabel: "Capture learning",
      primaryHref: "/capture",
      secondaryLabel: "View portfolio",
      secondaryHref: "/portfolio",
      tone: "warning",
      reason: "No evidence has been captured yet.",
      progressNudge:
        "You’re building a real learning record — one step at a time.",
    };
  }

  if (!childDraft) {
    return {
      title: `Turn ${child.name}'s evidence into a saved draft`,
      body: `${child.name} already has evidence building, but there is no saved report draft yet. The strongest next move is to formalise the learning story into a calm, reusable draft.`,
      primaryLabel: "Create report draft",
      primaryHref: "/reports",
      secondaryLabel: "Capture more evidence",
      secondaryHref: "/capture",
      tone: "info",
      reason: "Evidence exists, but no saved report draft is linked yet.",
      progressNudge:
        "You’re one step away from a reusable report draft.",
    };
  }

  if (selectedEvidenceCount < 3 || recentAreaCount < 2) {
    return {
      title: `Strengthen ${child.name}'s report before moving on`,
      body: `A saved draft exists, but the evidence set is still light. Add one or two stronger pieces across a wider spread of areas before treating it as submission-ready.`,
      primaryLabel: "Capture stronger evidence",
      primaryHref: "/capture",
      secondaryLabel: "Open report",
      secondaryHref: `/reports?draftId=${childDraft.id}`,
      tone: "warning",
      reason: "Draft exists, but coverage and evidence volume are still limited.",
      progressNudge:
        "One more strong piece could move this into ‘ready to report’.",
    };
  }

  if ((lastDays ?? 0) > 21) {
    return {
      title: `Refresh ${child.name}'s recent evidence`,
      body: `The draft is in place, but the latest saved learning evidence is getting older. Add one fresh learning moment so your reporting and authority posture stay current.`,
      primaryLabel: "Add fresh evidence",
      primaryHref: "/capture",
      secondaryLabel: "Open authority pack",
      secondaryHref: `/authority/pack-builder?draftId=${childDraft.id}`,
      tone: "info",
      reason: "The evidence set is useful, but recency is softening confidence.",
      progressNudge:
        "A fresh entry will strengthen confidence and make the next step feel calmer.",
    };
  }

  return {
    title: `${child.name} is ready for the next reporting step`,
    body: `You have enough current evidence and a saved draft for ${child.name}. The strongest next move is to shape the authority pack or review the output before export.`,
    primaryLabel: "Open authority pack",
    primaryHref: `/authority/pack-builder?draftId=${childDraft.id}`,
    secondaryLabel: "Review report output",
    secondaryHref: `/reports/output?draftId=${childDraft.id}`,
    tone: "success",
    reason: "Evidence, recency, and saved draft state are all in a strong place.",
    progressNudge: "You are at the formal reporting stage now.",
  };
}

function childActionLabel(child: ChildRecord, childDraft: ReportDraftRow | null) {
  if (child.evidenceCount === 0) return "Start entry";
  if (!childDraft) return "Build draft";
  if (child.evidenceCount < 3) return "Build draft";
  return "Continue";
}

function childActionHref(childDraft: ReportDraftRow | null) {
  if (!childDraft) return "/reports";
  return `/reports?draftId=${childDraft.id}`;
}

function estimateTimeSaved(
  child: ChildRecord | null,
  childDraft: ReportDraftRow | null
) {
  let minutes = 0;
  if (child) minutes += Math.min(child.evidenceCount * 7, 35);
  if (childDraft) minutes += 25;
  return Math.round(minutes / 6) / 10;
}

function estimateLearningStreak(child: ChildRecord | null) {
  if (!child) return 0;
  if (child.evidenceCount === 0) return 0;
  if (child.evidenceCount >= 4) return 4;
  if (child.evidenceCount >= 2) return 2;
  return 1;
}

function evidenceQualityHint(
  child: ChildRecord | null,
  childDraft: ReportDraftRow | null
) {
  if (!child) {
    return "A strong piece usually shows what your child attempted, understood, and found tricky.";
  }
  if (child.evidenceCount === 0) {
    return "Start simple: even one photo and one sentence can count as a useful first learning record.";
  }
  if (!childDraft) {
    return "Strong evidence usually includes a clear example plus a short human note about what was understood.";
  }
  return "At this stage, stronger evidence shows progress, confidence, and the likely next step — not just completion.";
}

/* =========================
   PAGE
========================= */

export default function FamilyPage() {
  return (
    <Suspense fallback={null}>
      <FamilyPageContent />
    </Suspense>
  );
}

function FamilyPageContent() {
  const searchParams = useSearchParams();

  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [settings, setSettings] = useState<FamilySettings>({});
  const [drafts, setDrafts] = useState<ReportDraftRow[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState("");

  useEffect(() => {
    const storedChildren = parseJson<any[]>(
      typeof window !== "undefined"
        ? window.localStorage.getItem(CHILDREN_KEY)
        : null,
      []
    );

    const normalizedChildren =
      storedChildren.length > 0
        ? storedChildren.map((child, i) => normalizeChild(child, i))
        : FALLBACK_CHILDREN;

    const storedSettings = parseJson<FamilySettings>(
      typeof window !== "undefined"
        ? window.localStorage.getItem(SETTINGS_KEY)
        : null,
      {}
    );

    setChildren(normalizedChildren);
    setSettings(storedSettings);

    const storedActive =
      typeof window !== "undefined"
        ? safe(window.localStorage.getItem(ACTIVE_STUDENT_ID_KEY))
        : "";

    const preferredId =
      storedActive ||
      safe(storedSettings.defaultChildId) ||
      safe(normalizedChildren[0]?.id);

    setSelectedChildId(preferredId);

    const onboarded = Boolean(storedSettings.onboardingComplete);
    const childName = safe(normalizedChildren[0]?.name);
    const familyName = safe(storedSettings.familyDisplayName);

    if (onboarded) {
      setWelcomeMessage(
        familyName && childName
          ? `Welcome to EduDecks, ${familyName}. ${childName} is ready for the first learning capture.`
          : childName
          ? `${childName} is ready for the first learning capture.`
          : "Your family space is ready."
      );
    }

    const authMessage = safe(searchParams.get("authMessage"));
    if (authMessage) {
      setWelcomeMessage(authMessage);
    }
  }, [searchParams]);

  useEffect(() => {
    let mounted = true;

    async function hydrateDrafts() {
      try {
        setLoadingDrafts(true);
        const rows = await listReportDrafts();
        if (!mounted) return;
        setDrafts(rows);
      } catch {
        if (!mounted) return;
        setDrafts([]);
      } finally {
        if (mounted) setLoadingDrafts(false);
      }
    }

    void hydrateDrafts();

    return () => {
      mounted = false;
    };
  }, []);

  const selectedChild = useMemo(() => {
    return children.find((child) => child.id === selectedChildId) || children[0] || null;
  }, [children, selectedChildId]);

  const selectedChildDraft = useMemo(() => {
    if (!selectedChild) return null;

    const exact =
      drafts.find(
        (draft) =>
          safe(draft.child_id) === selectedChild.id ||
          safe(draft.student_id) === selectedChild.id
      ) || null;

    if (exact) return exact;

    return (
      drafts.find(
        (draft) =>
          safe(draft.child_name).toLowerCase() === safe(selectedChild.name).toLowerCase()
      ) || null
    );
  }, [drafts, selectedChild]);

  const guideState = useMemo(
    () => buildGuideState(selectedChild, selectedChildDraft),
    [selectedChild, selectedChildDraft]
  );

  const confidenceSummary = useMemo(() => {
    if (!selectedChild) return 0;
    let score = 0;
    score += Math.min(selectedChild.evidenceCount * 15, 45);
    score += Math.min(selectedChild.recentAreaCount * 10, 30);
    if (selectedChildDraft) score += 15;
    const lastDays = daysSince(selectedChild.lastUpdated);
    if (lastDays != null && lastDays <= 14) score += 10;
    return Math.min(score, 100);
  }, [selectedChild, selectedChildDraft]);

  const learningStep = useMemo(() => {
    if (!selectedChild) return AREA_SEQUENCE.default;
    return inferLearningStep(selectedChild.nextFocusArea || selectedChild.strongestArea);
  }, [selectedChild]);

  const timeSavedHours = useMemo(
    () => estimateTimeSaved(selectedChild, selectedChildDraft),
    [selectedChild, selectedChildDraft]
  );

  const learningStreak = useMemo(() => estimateLearningStreak(selectedChild), [selectedChild]);

  const familyDisplayName = safe(settings.familyDisplayName) || "Your family";

  const parentName = safe(settings.parentName);

  const upgradeDecision = useMemo(() => {
    return getPremiumUpgradeDecision({
      surface: "family",
      hasPremium: getPremiumPlanFromStorage(),
      captureCount: selectedChild?.evidenceCount ?? 0,
      reportCount: selectedChildDraft ? 1 : 0,
      authorityPackCount: selectedChildDraft ? 1 : 0,
      hasEnteredAuthorityFlow: Boolean(selectedChildDraft),
    });
  }, [selectedChild, selectedChildDraft]);

  return (
    <FamilyTopNavShell
      title="EduDecks Family"
      subtitle="Home"
      heroTitle="Your Family Learning Home"
      heroText="Keep daily capture simple, stay on track with curriculum coverage, and grow a professional record of progress without the admin feel."
      heroAsideTitle="Readiness snapshot"
      heroAsideText={
        selectedChild
          ? `${selectedChild.name} is currently ${statusLabel(
              selectedChild.status
            ).toLowerCase()}. The system is watching evidence volume, coverage, draft state, and recency to guide the next move.`
          : "Select a child to see the strongest next move."
      }
    >
      {welcomeMessage ? (
        <section
          style={{
            ...S.card(),
            marginBottom: 18,
            border: "1px solid #bfdbfe",
            background: "#eff6ff",
          }}
        >
          <div style={S.label()}>Welcome</div>
          <div style={{ ...S.body(), color: "#1e3a8a" }}>{welcomeMessage}</div>
        </section>
      ) : null}

      <section style={{ ...S.card(), marginBottom: 18 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1.2fr) minmax(280px,0.8fr)",
            gap: 18,
            alignItems: "start",
          }}
        >
          <div>
            <div style={S.label()}>Next step for your family</div>
            <div style={S.h1()}>{guideState.title}</div>
            <div style={S.body()}>{guideState.body}</div>

            <div
              style={{
                marginTop: 14,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <Link href={guideState.primaryHref} style={S.button(true)}>
                {guideState.primaryLabel}
              </Link>
              {guideState.secondaryHref && guideState.secondaryLabel ? (
                <Link href={guideState.secondaryHref} style={S.button(false)}>
                  {guideState.secondaryLabel}
                </Link>
              ) : null}
            </div>

            <div
              style={{
                marginTop: 14,
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid #e5e7eb",
                background: "#f8fafc",
              }}
            >
              <div style={S.label()}>Why this is the best next move</div>
              <div style={S.small()}>{guideState.reason}</div>
              <div style={{ height: 8 }} />
              <div style={S.small()}>
                <strong>Progress nudge:</strong> {guideState.progressNudge}
              </div>
            </div>

            {upgradeDecision.shouldShow ? (
              <div style={{ marginTop: 16 }}>
                <UpgradeCard
                  trigger={upgradeDecision.trigger}
                  variant="compact"
                  onSecondaryClick={() => dismissPremiumTrigger(upgradeDecision.trigger)}
                />
              </div>
            ) : null}
          </div>

          <div style={S.card()}>
            <div style={S.label()}>Confidence summary</div>
            <div style={S.h1()}>{confidenceSummary}%</div>
            <div style={S.small()}>
              This is a parent-side confidence read based on evidence, coverage,
              saved draft state, and recency.
            </div>

            <div style={{ height: 12 }} />

            <div style={{ display: "grid", gap: 10 }}>
              <MiniStat label="Evidence" value={String(selectedChild?.evidenceCount ?? 0)} />
              <MiniStat label="Coverage" value={String(selectedChild?.recentAreaCount ?? 0)} />
              <MiniStat label="Saved draft" value={selectedChildDraft ? "Yes" : "No"} />
              <MiniStat label="Last update" value={shortDate(selectedChild?.lastUpdated)} />
            </div>
          </div>
        </div>
      </section>

      <section style={{ ...S.card(), marginBottom: 18 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1.15fr) minmax(280px,0.85fr)",
            gap: 18,
            alignItems: "start",
          }}
        >
          <div>
            <div style={S.label()}>Calm check</div>
            <div style={S.h2()}>
              {selectedChild
                ? `${selectedChild.name} is ${statusLabel(selectedChild.status).toLowerCase()}`
                : "Select a child"}
            </div>
            <div style={S.body()}>
              {selectedChild
                ? calmCheckText(confidenceSummary, selectedChild.name)
                : "Choose a child to see whether the system thinks you are on track."}
            </div>

            <div
              style={{
                marginTop: 14,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <span style={S.pill(calmCheckTone(confidenceSummary))}>
                Calm check {confidenceSummary}%
              </span>
              <span style={S.pill("secondary")}>{learningStreak} day learning streak</span>
              <span style={S.pill("info")}>~{timeSavedHours.toFixed(1)} hrs saved</span>
            </div>
          </div>

          <div style={S.card()}>
            <div style={S.label()}>Selected child</div>

            <div style={{ marginBottom: 10 }}>
              <select
                value={selectedChild?.id || ""}
                onChange={(e) => {
                  setSelectedChildId(e.target.value);
                  if (typeof window !== "undefined") {
                    window.localStorage.setItem(ACTIVE_STUDENT_ID_KEY, e.target.value);
                  }
                }}
                style={{ ...S.input(220), width: "100%" }}
              >
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name} — {child.yearLabel}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <MiniStat
                label="Status"
                value={statusLabel(selectedChild?.status || "getting-started")}
              />
              <MiniStat label="Strongest area" value={selectedChild?.strongestArea || "—"} />
              <MiniStat label="Next focus" value={selectedChild?.nextFocusArea || "Literacy"} />
            </div>
          </div>
        </div>
      </section>

      <section style={{ ...S.card(), marginBottom: 18 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1.15fr) minmax(300px,0.85fr)",
            gap: 18,
            alignItems: "start",
          }}
        >
          <div>
            <div style={S.label()}>Family workspace</div>
            <div style={S.h2()}>
              Welcome back,{" "}
              {parentName || familyDisplayName === "Your family"
                ? parentName || selectedChild?.name || "friend"
                : familyDisplayName}
            </div>
            <div style={S.small()}>
              Use this page as your guided starting point. You do not need to
              think like a teacher — EduDecks should keep nudging the next
              sensible move.
            </div>

            <div style={{ height: 14 }} />

            <div
              style={{
                border: "1px solid #bfdbfe",
                background: "#eff6ff",
                borderRadius: 16,
                padding: 16,
              }}
            >
              <div style={S.label()}>Smart suggested focus</div>
              <div style={S.h2()}>
                Strengthen {selectedChild?.nextFocusArea || "Literacy"}
              </div>
              <div style={S.body()}>
                {selectedChild
                  ? `${selectedChild.name} would benefit from one stronger ${
                      selectedChild.nextFocusArea || "literacy"
                    } learning moment. Add a short note, photo, or work sample that shows what they can now do.`
                  : "Choose a child to unlock a suggested focus area."}
              </div>

              <div style={{ ...S.small(), marginTop: 8 }}>
                Calendar is the best place to shape the week before you capture what actually happened.
              </div>

              <div
                style={{
                  marginTop: 14,
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <Link href="/calendar" style={S.button(true)}>
                  Plan this week
                </Link>
                <Link href="/planner" style={S.button(false)}>
                  Adjust plan
                </Link>
                <Link href="/capture" style={S.button(false)}>
                  Capture learning
                </Link>
                <Link
                  href={selectedChildDraft ? `/reports?draftId=${selectedChildDraft.id}` : "/reports"}
                  style={S.button(false)}
                >
                  Build report
                </Link>
              </div>
            </div>
          </div>

          <div style={S.card()}>
            <div style={S.label()}>Learning journey</div>
            <div style={S.h2()}>
              {selectedChild?.name || "Your child"} is currently building{" "}
              {learningStep.current}
            </div>
            <div style={S.body()}>
              Next likely step: <strong>{learningStep.next}</strong>.
            </div>

            <div style={{ height: 12 }} />

            <div
              style={{
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid #e5e7eb",
                background: "#f8fafc",
              }}
            >
              <div style={S.label()}>Evidence quality coaching</div>
              <div style={S.small()}>{evidenceQualityHint(selectedChild, selectedChildDraft)}</div>
            </div>

            <div
              style={{
                marginTop: 12,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <Link href="/capture" style={S.button(true)}>
                Capture next step learning
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section style={S.card()}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          <div>
            <div style={S.h2()}>Child snapshots</div>
            <div style={S.small()}>
              A simple overview of each child so you can see who is ready and
              who needs attention next.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/children" style={S.button(false)}>
              Manage children
            </Link>
            <Link href="/capture" style={S.button(true)}>
              Add learning
            </Link>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          {children.map((child) => {
            const childDraft =
              drafts.find(
                (draft) =>
                  safe(draft.child_id) === child.id ||
                  safe(draft.student_id) === child.id ||
                  safe(draft.child_name).toLowerCase() === safe(child.name).toLowerCase()
              ) || null;

            return (
              <div
                key={child.id}
                style={{
                  border: selectedChild?.id === child.id ? "2px solid #4f7cf0" : "1px solid #e5e7eb",
                  background: selectedChild?.id === child.id ? "#f8fbff" : "#ffffff",
                  borderRadius: 16,
                  padding: 14,
                  display: "grid",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    alignItems: "start",
                  }}
                >
                  <div>
                    <div style={S.h3()}>{child.name}</div>
                    <div style={S.small()}>{child.yearLabel}</div>
                  </div>
                  <span style={statusPill(child.status)}>{statusLabel(child.status)}</span>
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <SummaryRow label="Evidence" value={String(child.evidenceCount)} />
                  <SummaryRow label="Coverage" value={String(child.recentAreaCount)} />
                  <SummaryRow label="Strongest" value={child.strongestArea || "—"} />
                  <SummaryRow label="Last update" value={shortDate(child.lastUpdated)} />
                </div>

                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    background: "#f8fafc",
                  }}
                >
                  <div style={S.label()}>Suggested next move</div>
                  <div style={S.small()}>
                    {child.evidenceCount === 0
                      ? "Start by adding your first learning entry."
                      : childDraft
                      ? child.status === "ready"
                        ? "Open the saved report or authority pack."
                        : "Turn this evidence into a saved report draft."
                      : "Turn this evidence into a first saved report draft."}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedChildId(child.id);
                      if (typeof window !== "undefined") {
                        window.localStorage.setItem(ACTIVE_STUDENT_ID_KEY, child.id);
                      }
                    }}
                    style={S.button(false)}
                  >
                    Select
                  </button>
                  <Link href={childActionHref(childDraft)} style={S.button(true)}>
                    {childActionLabel(child, childDraft)}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {loadingDrafts ? (
          <div style={{ marginTop: 14 }}>
            <div style={S.small()}>Loading saved report signals…</div>
          </div>
        ) : null}
      </section>
    </FamilyTopNavShell>
  );
}

/* =========================
   SMALL COMPONENTS
========================= */

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        alignItems: "center",
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        background: "#f8fafc",
      }}
    >
      <span style={{ fontSize: 13, color: "#64748b" }}>{label}</span>
      <strong style={{ fontSize: 15, color: "#0f172a" }}>{value}</strong>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "88px minmax(0,1fr)",
        gap: 8,
        alignItems: "start",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: "#64748b",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 13,
          lineHeight: 1.45,
          color: "#334155",
          wordBreak: "break-word",
        }}
      >
        {value || "—"}
      </div>
    </div>
  );
}
