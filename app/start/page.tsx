"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthModal from "@/app/components/AuthModal";
import { hasSupabaseEnv, supabase } from "@/lib/supabaseClient";
import { buildGuidedStartPdf, type GuidedStartSession } from "@/lib/guidedStartPdf";
import { saveReportDraft } from "@/lib/reportDrafts";

type GuidedStep =
  | "child"
  | "planning"
  | "calendar"
  | "capture"
  | "reports"
  | "portfolio"
  | "final";

type PlanOption = {
  category: string;
  title: string;
  learningArea: string;
  helper: string;
};

const SESSION_KEY = "edudecks_guided_start_session_v1";
const STEP_KEY = "edudecks_guided_start_step_v1";
const PENDING_SAVE_KEY = "edudecks_guided_start_pending_save_v1";

const CHILDREN_KEY = "edudecks_children_seed_v1";
const ACTIVE_STUDENT_ID_KEY = "edudecks_active_student_id";
const CALENDAR_BLOCKS_KEY = "edudecks_calendar_blocks_v1";
const PORTFOLIO_HIGHLIGHT_EVIDENCE_KEY = "edudecks_portfolio_highlight_evidence_id";
const REPORTS_HIGHLIGHT_EVIDENCE_KEY = "edudecks_reports_highlight_evidence_id";

const PLAN_OPTIONS: PlanOption[] = [
  {
    category: "Reading time",
    title: "10 minutes of reading together",
    learningArea: "Literacy",
    helper: "A short reading moment is enough to begin.",
  },
  {
    category: "Maths practice",
    title: "One light maths practice moment",
    learningArea: "Numeracy",
    helper: "Keep it practical, calm, and short.",
  },
  {
    category: "Outdoor learning",
    title: "An outdoor observation and reflection",
    learningArea: "Science",
    helper: "Curiosity counts as real learning too.",
  },
  {
    category: "Create your own",
    title: "",
    learningArea: "General",
    helper: "Use your own simple plan if that feels better.",
  },
];

const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const RIBBON_STEPS = [
  { key: "planning", label: "Planning" },
  { key: "calendar", label: "Calendar" },
  { key: "capture", label: "Capture" },
  { key: "reports", label: "Reports" },
  { key: "portfolio", label: "Portfolio" },
] as const;

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function splitName(fullName: string) {
  const clean = safe(fullName);
  if (!clean) return { first_name: "", surname: "" };
  const parts = clean.split(/\s+/).filter(Boolean);
  return {
    first_name: parts[0] || "",
    surname: parts.slice(1).join(" "),
  };
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatWeekLabel() {
  const now = new Date();
  const start = new Date(now);
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(now.getDate() + diff);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
}

function buildSuggestedDay(category: string) {
  const key = safe(category).toLowerCase();
  if (key.includes("reading")) return "Monday";
  if (key.includes("math")) return "Tuesday";
  if (key.includes("outdoor")) return "Thursday";
  return "Wednesday";
}

function buildDefaultSession(): GuidedStartSession {
  return {
    child: {
      name: "",
      yearLevel: "",
    },
    plan: {
      category: "Reading time",
      title: "10 minutes of reading together",
      suggestedDay: "Monday",
    },
    calendar: {
      weekLabel: formatWeekLabel(),
      scheduledDay: "Monday",
    },
    capture: {
      happened: "",
      showed: "",
      note: "",
    },
    report: {
      summary: "",
    },
    portfolio: {
      previewTitle: "",
    },
  };
}

function buildCaptureExample(session: GuidedStartSession) {
  const childName = safe(session.child.name) || "Your child";
  const title = safe(session.plan.title).toLowerCase() || "a short learning moment";

  if (title.includes("reading")) {
    return `${childName} read for 10 minutes and retold the story in their own words.`;
  }
  if (title.includes("math")) {
    return `${childName} worked through one short maths task and explained how they solved it.`;
  }
  if (title.includes("outdoor")) {
    return `${childName} spent time outside observing, noticing, and describing what they found.`;
  }
  return `${childName} completed a simple learning moment and was able to talk about what they did.`;
}

function buildReportSummary(session: GuidedStartSession) {
  const childName = safe(session.child.name) || "This learner";
  const happened = safe(session.capture.happened);
  const showed = safe(session.capture.showed);
  const plan = safe(session.plan.title).toLowerCase();
  const learningArea =
    plan.includes("reading")
      ? "literacy"
      : plan.includes("math")
      ? "numeracy"
      : plan.includes("outdoor")
      ? "science"
      : "learning";

  if (!happened && !showed) {
    return `${childName} began building a gentle ${learningArea} record through one small planned learning moment this week.`;
  }

  return `${childName} completed a planned ${learningArea} moment this week. ${happened || "A useful learning moment was recorded."}${showed ? ` This showed ${showed}.` : ""}`;
}

function buildPortfolioPreviewTitle(session: GuidedStartSession) {
  const childName = safe(session.child.name) || "Your child";
  return `${childName}'s first guided learning record`;
}

function stepIndex(step: GuidedStep) {
  if (step === "child") return 0;
  if (step === "planning") return 0;
  if (step === "calendar") return 1;
  if (step === "capture") return 2;
  if (step === "reports") return 3;
  return 4;
}

async function createStudentRecord(childName: string, yearLevel: string) {
  const nameBits = splitName(childName);
  const yearNum = Number(safe(yearLevel));
  const usableYear = Number.isFinite(yearNum) ? yearNum : null;

  const payload = {
    first_name: nameBits.first_name || safe(childName),
    preferred_name: nameBits.first_name || safe(childName),
    surname: nameBits.surname || null,
    year_level: usableYear,
  };

  const r = await supabase.from("students").insert(payload).select("id").single();
  if (r.error) throw r.error;
  return String(r.data.id);
}

async function linkStudent(studentId: string) {
  const authResp = await supabase.auth.getUser();
  const userId = authResp.data.user?.id;
  if (!userId) throw new Error("Please sign in to save your progress.");

  const r = await supabase.from("parent_student_links").upsert(
    {
      parent_user_id: userId,
      student_id: studentId,
      relationship_label: "child",
      sort_order: 0,
    },
    { onConflict: "parent_user_id,student_id" }
  );

  if (r.error) throw r.error;
}

function learningAreaForPlan(planTitle: string) {
  const title = safe(planTitle).toLowerCase();
  if (title.includes("reading")) return "Literacy";
  if (title.includes("math")) return "Numeracy";
  if (title.includes("outdoor")) return "Science";
  return "General";
}

function buildPrintMarkup(session: GuidedStartSession) {
  const childName = safe(session.child.name) || "Your child";
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${childName} - Guided Record</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 32px; color: #0f172a; }
      h1 { font-size: 28px; margin-bottom: 4px; }
      h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-top: 22px; margin-bottom: 8px; }
      .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px; margin-bottom: 10px; }
      .muted { color: #475569; line-height: 1.6; }
      .footer { margin-top: 24px; font-size: 12px; color: #64748b; }
    </style>
  </head>
  <body>
    <h1>Your first learning record</h1>
    <div class="muted">Created with EduDecks Family - guided homeschool records</div>

    <h2>Child</h2>
    <div class="card">${childName}${safe(session.child.yearLevel) ? ` - ${safe(session.child.yearLevel)}` : ""}</div>

    <h2>Planned activity</h2>
    <div class="card">${safe(session.plan.title)}</div>

    <h2>Calendar placement</h2>
    <div class="card">${safe(session.calendar.weekLabel)}${safe(session.calendar.scheduledDay) ? ` - ${safe(session.calendar.scheduledDay)}` : ""}</div>

    <h2>Captured learning moment</h2>
    <div class="card">${safe(session.capture.happened)}</div>

    <h2>What it showed</h2>
    <div class="card">${safe(session.capture.showed) || "Not added yet"}</div>

    <h2>Optional note</h2>
    <div class="card">${safe(session.capture.note) || "No extra note added"}</div>

    <h2>Report-ready summary</h2>
    <div class="card">${safe(session.report.summary)}</div>

    <h2>Portfolio preview</h2>
    <div class="card">${safe(session.portfolio.previewTitle)}</div>

    <div class="footer">Created with EduDecks Family - guided homeschool records</div>
  </body>
</html>`;
}

export default function GuidedStartPage() {
  return (
    <Suspense fallback={null}>
      <GuidedStartPageContent />
    </Suspense>
  );
}

function GuidedStartPageContent() {
  const router = useRouter();
  const [step, setStep] = useState<GuidedStep>("child");
  const [session, setSession] = useState<GuidedStartSession>(buildDefaultSession);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authUserId, setAuthUserId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const pendingPersistRef = useRef(false);

  const reportSummary = useMemo(() => buildReportSummary(session), [session]);
  const portfolioPreviewTitle = useMemo(
    () => buildPortfolioPreviewTitle(session),
    [session]
  );

  useEffect(() => {
    const storedSession = parseJson<GuidedStartSession | null>(
      typeof window !== "undefined" ? window.sessionStorage.getItem(SESSION_KEY) : null,
      null
    );
    const storedStep = safe(
      typeof window !== "undefined" ? window.sessionStorage.getItem(STEP_KEY) : ""
    ) as GuidedStep;

    if (storedSession) {
      setSession(storedSession);
    }

    if (
      storedStep === "child" ||
      storedStep === "planning" ||
      storedStep === "calendar" ||
      storedStep === "capture" ||
      storedStep === "reports" ||
      storedStep === "portfolio" ||
      storedStep === "final"
    ) {
      setStep(storedStep);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const nextSession: GuidedStartSession = {
      ...session,
      report: {
        ...session.report,
        summary: reportSummary,
      },
      portfolio: {
        ...session.portfolio,
        previewTitle: portfolioPreviewTitle,
      },
    };
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    window.sessionStorage.setItem(STEP_KEY, step);
  }, [session, step, reportSummary, portfolioPreviewTitle]);

  useEffect(() => {
    let mounted = true;

    async function hydrateAuth() {
      if (!hasSupabaseEnv) return;
      const { data } = await supabase.auth.getUser();
      if (mounted) {
        setAuthUserId(String(data.user?.id || ""));
      }
    }

    void hydrateAuth();

    if (!hasSupabaseEnv) {
      return () => {
        mounted = false;
      };
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, sessionState) => {
      if (mounted) {
        setAuthUserId(String(sessionState?.user?.id || ""));
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authUserId || !hasSupabaseEnv || pendingPersistRef.current) return;
    if (typeof window === "undefined") return;
    const shouldPersist = window.sessionStorage.getItem(PENDING_SAVE_KEY) === "1";
    if (!shouldPersist) return;
    pendingPersistRef.current = true;
    void handlePersistToWorkspace(authUserId);
  }, [authUserId]);

  function selectPlan(option: PlanOption) {
    setSession((current) => ({
      ...current,
      plan: {
        category: option.category,
        title: option.title || current.plan.title,
        suggestedDay: buildSuggestedDay(option.category),
      },
      calendar: {
        ...current.calendar,
        weekLabel: current.calendar.weekLabel || formatWeekLabel(),
        scheduledDay: buildSuggestedDay(option.category),
      },
    }));
  }

  function continueFromChild() {
    if (!safe(session.child.name)) {
      setError("Start with just a name.");
      return;
    }
    setError("");
    setStep("planning");
  }

  function continueFromPlanning() {
    if (!safe(session.plan.title)) {
      setError("Choose one small plan first.");
      return;
    }
    setError("");
    setStep("calendar");
  }

  function continueFromCalendar() {
    setError("");
    setStep("capture");
    if (!safe(session.capture.happened)) {
      setSession((current) => ({
        ...current,
        capture: {
          ...current.capture,
          happened: buildCaptureExample(current),
        },
      }));
    }
  }

  function continueFromCapture() {
    if (!safe(session.capture.happened)) {
      setError("Add one useful learning moment first.");
      return;
    }
    setError("");
    setStep("reports");
  }

  async function handleDownloadPdf() {
    setDownloadingPdf(true);
    setError("");
    try {
      const pdfBlob = await buildGuidedStartPdf({
        ...session,
        report: { summary: reportSummary },
        portfolio: { previewTitle: portfolioPreviewTitle },
      });
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${safe(session.child.name || "guided-record")
        .replace(/[^a-z0-9]+/gi, "-")
        .toLowerCase()}-guided-record.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Something went wrong - try again.");
    } finally {
      setDownloadingPdf(false);
    }
  }

  function handlePrint() {
    const popup = window.open("", "_blank", "width=960,height=720");
    if (!popup) {
      setError("Something went wrong - try again.");
      return;
    }
    popup.document.open();
    popup.document.write(
      buildPrintMarkup({
        ...session,
        report: { summary: reportSummary },
        portfolio: { previewTitle: portfolioPreviewTitle },
      })
    );
    popup.document.close();
    popup.focus();
    popup.print();
  }

  async function handlePersistToWorkspace(resolvedUserId?: string) {
    const userId = resolvedUserId || authUserId;
    if (!userId) {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(PENDING_SAVE_KEY, "1");
      }
      setAuthModalOpen(true);
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const childName = safe(session.child.name) || "Child";
      const childId = await createStudentRecord(childName, safe(session.child.yearLevel));
      await linkStudent(childId);

      const seedChildren = parseJson<any[]>(
        typeof window !== "undefined" ? window.localStorage.getItem(CHILDREN_KEY) : null,
        []
      );
      const nextChildren = [
        {
          id: childId,
          name: childName,
          preferred_name: splitName(childName).first_name || childName,
          surname: splitName(childName).surname || null,
          yearLabel: safe(session.child.yearLevel) || null,
        },
        ...seedChildren.filter((row) => safe(row?.id) !== childId),
      ];

      if (typeof window !== "undefined") {
        window.localStorage.setItem(CHILDREN_KEY, JSON.stringify(nextChildren));
        window.localStorage.setItem(ACTIVE_STUDENT_ID_KEY, childId);
      }

      const plannedFor = todayIso();
      const learningArea = learningAreaForPlan(session.plan.title);

      const plannerBlock = {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `guided-plan-${Date.now()}`,
        user_id: userId,
        student_id: childId,
        title: safe(session.plan.title),
        learning_area: learningArea,
        planned_for: plannedFor,
        planned_time: null,
        note: `Guided Start - ${safe(session.calendar.scheduledDay) || "This week"}`,
        status: "planned",
      };

      await supabase.from("planner_blocks").insert(plannerBlock);

      const localBlocks = parseJson<any[]>(
        typeof window !== "undefined"
          ? window.localStorage.getItem(CALENDAR_BLOCKS_KEY)
          : null,
        []
      );
      localBlocks.push(plannerBlock);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(CALENDAR_BLOCKS_KEY, JSON.stringify(localBlocks));
      }

      const evidencePayloadVariants: Array<Record<string, any>> = [
        {
          user_id: userId,
          student_id: childId,
          title: safe(session.plan.title),
          summary: safe(session.capture.happened),
          note: [safe(session.capture.showed), safe(session.capture.note)].filter(Boolean).join(" "),
          learning_area: learningArea,
          evidence_type: "guided-start",
          occurred_on: plannedFor,
        },
        {
          user_id: userId,
          student_id: childId,
          title: safe(session.plan.title),
          note: safe(session.capture.happened),
          learning_area: learningArea,
          occurred_on: plannedFor,
        },
      ];

      let insertedEvidenceId = "";
      let lastEvidenceError: any = null;

      for (const payload of evidencePayloadVariants) {
        const response = await supabase
          .from("evidence_entries")
          .insert(payload)
          .select("id")
          .single();
        if (!response.error) {
          insertedEvidenceId = safe(response.data?.id);
          break;
        }
        lastEvidenceError = response.error;
      }

      if (lastEvidenceError && !insertedEvidenceId) {
        throw lastEvidenceError;
      }

      if (typeof window !== "undefined" && insertedEvidenceId) {
        window.localStorage.setItem(PORTFOLIO_HIGHLIGHT_EVIDENCE_KEY, insertedEvidenceId);
        window.localStorage.setItem(REPORTS_HIGHLIGHT_EVIDENCE_KEY, insertedEvidenceId);
      }

      if (insertedEvidenceId) {
        await saveReportDraft({
          child_id: childId,
          student_id: childId,
          child_name: childName,
          report_mode: "family-summary",
          period_mode: "term",
          preferred_market: "au",
          selected_evidence_ids: [insertedEvidenceId],
          selection_meta: {
            [insertedEvidenceId]: {
              role: "core",
              required: true,
            },
          },
          selected_areas: [learningArea],
          include_appendix: false,
          include_action_plan: true,
          include_weekly_plan: true,
          include_readiness_notes: false,
          notes: reportSummary,
          status: "draft",
        });
      }

      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(PENDING_SAVE_KEY);
        window.sessionStorage.removeItem(SESSION_KEY);
        window.sessionStorage.removeItem(STEP_KEY);
      }

      setMessage("Your first guided record is saved.");
      router.push("/family?authMessage=Your%20first%20guided%20record%20is%20saved.");
    } catch {
      setError("Something went wrong - try again.");
    } finally {
      pendingPersistRef.current = false;
      setSaving(false);
      setAuthModalOpen(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f8fafc 0%, #eef4ff 100%)",
        color: "#0f172a",
      }}
    >
      <div
        style={{
          borderBottom: "1px solid #e5e7eb",
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(10px)",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div
          style={{
            maxWidth: 980,
            margin: "0 auto",
            padding: "14px 16px",
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <Link
              href="/"
              style={{
                textDecoration: "none",
                color: "#0f172a",
                fontSize: 20,
                fontWeight: 900,
              }}
            >
              EduDecks Family
            </Link>
            <span style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>(Beta v1)</span>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ fontSize: 13, color: "#64748b", fontWeight: 700 }}>
              Guided start
            </div>
            <Link
              href={authUserId ? "/family" : "/login"}
              style={{
                color: "#2563eb",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              {authUserId ? "Open family workspace" : "Sign in"}
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 980, margin: "0 auto", padding: "20px 16px 36px" }}>
        <GuidedRibbon currentIndex={stepIndex(step)} />

        <section
          style={{
            marginTop: 18,
            borderRadius: 24,
            border: "1px solid #dbeafe",
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(239,246,255,0.96) 100%)",
            boxShadow: "0 20px 50px rgba(15,23,42,0.06)",
            padding: 24,
          }}
        >
          {step === "child" ? (
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <div style={uiLabel()}>Guided start</div>
                <div style={uiTitle()}>Let&apos;s start together</div>
                <div style={uiBody()}>
                  We&apos;ll help you build your first learning record step by step.
                </div>
              </div>

              <div style={{ display: "grid", gap: 14 }}>
                <div>
                  <div style={uiFieldLabel()}>Child name</div>
                  <input
                    value={session.child.name}
                    onChange={(e) =>
                      setSession((current) => ({
                        ...current,
                        child: { ...current.child, name: e.target.value },
                      }))
                    }
                    placeholder="e.g. Charlotte"
                    style={uiInput()}
                  />
                </div>

                <div>
                  <div style={uiFieldLabel()}>Year level or age band</div>
                  <input
                    value={safe(session.child.yearLevel)}
                    onChange={(e) =>
                      setSession((current) => ({
                        ...current,
                        child: { ...current.child, yearLevel: e.target.value },
                      }))
                    }
                    placeholder="Optional, but helpful"
                    style={uiInput()}
                  />
                </div>
              </div>

              <div style={uiSupport()}>
                Start with just a name. You can refine details later.
              </div>

              {error ? <div style={uiError()}>{error}</div> : null}

              <button type="button" onClick={continueFromChild} style={uiPrimaryButton()}>
                Continue
              </button>
            </div>
          ) : null}

          {step === "planning" ? (
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <div style={uiLabel()}>1. Planning</div>
                <div style={uiTitle()}>Let&apos;s start with one small plan for the week.</div>
                <div style={uiBody()}>
                  Choose the gentlest place to begin. One small plan is enough to start a real record.
                </div>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                {PLAN_OPTIONS.map((option) => {
                  const active = session.plan.category === option.category;
                  return (
                    <button
                      key={option.category}
                      type="button"
                      onClick={() => selectPlan(option)}
                      style={uiChoiceButton(active)}
                    >
                      <span style={{ fontSize: 16, fontWeight: 900 }}>{option.category}</span>
                      <span style={{ fontSize: 13, color: active ? "#dbeafe" : "#64748b" }}>
                        {option.helper}
                      </span>
                    </button>
                  );
                })}
              </div>

              {session.plan.category === "Create your own" ? (
                <div>
                  <div style={uiFieldLabel()}>Your simple plan</div>
                  <input
                    value={session.plan.title}
                    onChange={(e) =>
                      setSession((current) => ({
                        ...current,
                        plan: {
                          ...current.plan,
                          title: e.target.value,
                          suggestedDay: current.plan.suggestedDay || "Wednesday",
                        },
                      }))
                    }
                    placeholder="e.g. Read together after lunch"
                    style={uiInput()}
                  />
                </div>
              ) : null}

              <div style={uiSupport()}>One small plan is enough to begin.</div>
              {error ? <div style={uiError()}>{error}</div> : null}

              <button type="button" onClick={continueFromPlanning} style={uiPrimaryButton()}>
                Add this plan
              </button>
            </div>
          ) : null}

          {step === "calendar" ? (
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <div style={uiLabel()}>2. Calendar</div>
                <div style={uiTitle()}>Here&apos;s how that plan fits into your week.</div>
                <div style={uiBody()}>
                  Keep this light and flexible. You can place this small plan where it feels most realistic.
                </div>
              </div>

              <div style={uiSoftPanel()}>
                <div style={uiFieldLabel()}>This week</div>
                <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.6 }}>
                  {safe(session.calendar.weekLabel) || formatWeekLabel()}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
                    gap: 10,
                    marginTop: 14,
                  }}
                >
                  {WEEK_DAYS.map((day) => {
                    const active = safe(session.calendar.scheduledDay) === day;
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() =>
                          setSession((current) => ({
                            ...current,
                            calendar: { ...current.calendar, scheduledDay: day },
                          }))
                        }
                        style={uiDayButton(active)}
                      >
                        <span style={{ fontSize: 13, fontWeight: 900 }}>{day}</span>
                        {active ? (
                          <span style={{ fontSize: 12, color: active ? "#dbeafe" : "#64748b" }}>
                            {safe(session.plan.title)}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={uiSupport()}>You can keep this light and flexible.</div>

              <button type="button" onClick={continueFromCalendar} style={uiPrimaryButton()}>
                Keep this plan
              </button>
            </div>
          ) : null}

          {step === "capture" ? (
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <div style={uiLabel()}>3. Capture</div>
                <div style={uiTitle()}>Now let&apos;s record what happened.</div>
                <div style={uiBody()}>
                  We&apos;ll keep this simple. One useful moment is enough to start a strong record.
                </div>
              </div>

              <div style={uiSoftPanel()}>
                <div style={uiFieldLabel()}>Planned moment</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                  {safe(session.plan.title)}
                </div>
                <div style={{ marginTop: 6, fontSize: 13, color: "#64748b" }}>
                  {safe(session.calendar.scheduledDay)} in {safe(session.calendar.weekLabel)}
                </div>
              </div>

              <div>
                <div style={uiFieldLabel()}>What happened?</div>
                <textarea
                  value={session.capture.happened}
                  onChange={(e) =>
                    setSession((current) => ({
                      ...current,
                      capture: { ...current.capture, happened: e.target.value },
                    }))
                  }
                  rows={4}
                  placeholder={buildCaptureExample(session)}
                  style={uiTextarea()}
                />
              </div>

              <div>
                <div style={uiFieldLabel()}>What did it show?</div>
                <textarea
                  value={safe(session.capture.showed)}
                  onChange={(e) =>
                    setSession((current) => ({
                      ...current,
                      capture: { ...current.capture, showed: e.target.value },
                    }))
                  }
                  rows={3}
                  placeholder="e.g. Confidence, recall, focus, persistence, early understanding"
                  style={uiTextarea()}
                />
              </div>

              <div>
                <div style={uiFieldLabel()}>Optional note</div>
                <textarea
                  value={safe(session.capture.note)}
                  onChange={(e) =>
                    setSession((current) => ({
                      ...current,
                      capture: { ...current.capture, note: e.target.value },
                    }))
                  }
                  rows={2}
                  placeholder="Anything else worth remembering?"
                  style={uiTextarea()}
                />
              </div>

              <div style={uiSupport()}>
                One useful moment is enough to start a strong record.
              </div>
              {error ? <div style={uiError()}>{error}</div> : null}

              <button type="button" onClick={continueFromCapture} style={uiPrimaryButton()}>
                Add this learning moment
              </button>
            </div>
          ) : null}

          {step === "reports" ? (
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <div style={uiLabel()}>4. Reports</div>
                <div style={uiTitle()}>
                  Here&apos;s how EduDecks turns that moment into a report-ready summary.
                </div>
                <div style={uiBody()}>
                  This is a calm preview of how one small learning moment becomes something you can keep building.
                </div>
              </div>

              <div style={uiSoftPanel()}>
                <div style={uiFieldLabel()}>Draft summary</div>
                <div style={{ fontSize: 15, lineHeight: 1.7, color: "#334155" }}>{reportSummary}</div>
              </div>

              <button type="button" onClick={() => setStep("portfolio")} style={uiPrimaryButton()}>
                See how this reads
              </button>
            </div>
          ) : null}

          {step === "portfolio" ? (
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <div style={uiLabel()}>5. Portfolio</div>
                <div style={uiTitle()}>This is how your learning story builds over time.</div>
                <div style={uiBody()}>
                  Planning, capture, and reporting connect into one record you can keep growing gently.
                </div>
              </div>

              <div style={uiSoftPanel()}>
                <div style={uiFieldLabel()}>{portfolioPreviewTitle}</div>
                <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                  <div style={uiMiniStat()}>
                    <span style={uiMiniLabel()}>Child</span>
                    <strong>{safe(session.child.name) || "Your child"}</strong>
                  </div>
                  <div style={uiMiniStat()}>
                    <span style={uiMiniLabel()}>Planned moment</span>
                    <strong>{safe(session.plan.title)}</strong>
                  </div>
                  <div style={uiMiniStat()}>
                    <span style={uiMiniLabel()}>Captured</span>
                    <strong>{safe(session.capture.happened) || "One learning moment added"}</strong>
                  </div>
                  <div style={uiMiniStat()}>
                    <span style={uiMiniLabel()}>Report summary</span>
                    <strong>{reportSummary}</strong>
                  </div>
                </div>
              </div>

              <button type="button" onClick={() => setStep("final")} style={uiPrimaryButton()}>
                Preview my first record
              </button>
            </div>
          ) : null}

          {step === "final" ? (
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <div style={uiLabel()}>Your first learning record is ready</div>
                <div style={uiTitle()}>You can keep this now, or save it and continue later.</div>
                <div style={uiBody()}>
                  You can print or keep this PDF now, or create a free account to save your progress and keep building.
                </div>
              </div>

              <div style={uiSoftPanel()}>
                <div style={uiFieldLabel()}>{portfolioPreviewTitle}</div>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: "#475569", marginTop: 8 }}>
                  {reportSummary}
                </div>
              </div>

              {message ? <div style={uiSuccess()}>{message}</div> : null}
              {error ? <div style={uiError()}>{error}</div> : null}

              <div style={{ display: "grid", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => void handleDownloadPdf()}
                  disabled={downloadingPdf}
                  style={uiPrimaryButton()}
                >
                  {downloadingPdf ? "Preparing PDF..." : "Download PDF"}
                </button>

                <button type="button" onClick={handlePrint} style={uiSecondaryButton()}>
                  Print
                </button>

                <button
                  type="button"
                  onClick={() => void handlePersistToWorkspace()}
                  disabled={saving}
                  style={uiSecondaryButton()}
                >
                  {saving ? "Saving..." : "Save my progress"}
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        returnPath="/start"
      />
    </main>
  );
}

function GuidedRibbon({ currentIndex }: { currentIndex: number }) {
  return (
    <section
      style={{
        border: "1px solid #e5e7eb",
        background: "#ffffff",
        borderRadius: 16,
        padding: 12,
        boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: 1.1,
          textTransform: "uppercase",
          color: "#64748b",
          marginBottom: 10,
        }}
      >
        Guided journey
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          overflowX: "auto",
          paddingBottom: 4,
        }}
      >
        {RIBBON_STEPS.map((step, index) => {
          const active = currentIndex === index;
          const complete = currentIndex > index;
          return (
            <React.Fragment key={step.key}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: `1px solid ${active ? "#2563eb" : complete ? "#bfdbfe" : "#dbe3ef"}`,
                  background: active ? "#eff6ff" : complete ? "#f8fbff" : "#ffffff",
                  color: active ? "#1d4ed8" : complete ? "#2563eb" : "#64748b",
                  fontSize: 13,
                  fontWeight: active ? 900 : 700,
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: active ? "#2563eb" : complete ? "#dbeafe" : "#f8fafc",
                    color: active ? "#ffffff" : complete ? "#1d4ed8" : "#64748b",
                    border: `1px solid ${active ? "#2563eb" : complete ? "#93c5fd" : "#d1d5db"}`,
                    fontSize: 11,
                    fontWeight: 900,
                    flexShrink: 0,
                  }}
                >
                  {index + 1}
                </span>
                <span>{step.label}</span>
              </div>

              {index < RIBBON_STEPS.length - 1 ? (
                <span
                  style={{
                    color: "#94a3b8",
                    fontSize: 14,
                    fontWeight: 900,
                    flexShrink: 0,
                  }}
                >
                  &rarr;
                </span>
              ) : null}
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
}

function uiLabel(): React.CSSProperties {
  return {
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#64748b",
    marginBottom: 8,
  };
}

function uiTitle(): React.CSSProperties {
  return {
    fontSize: 32,
    lineHeight: 1.08,
    fontWeight: 900,
    color: "#0f172a",
  };
}

function uiBody(): React.CSSProperties {
  return {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 1.7,
    color: "#475569",
    maxWidth: 760,
  };
}

function uiFieldLabel(): React.CSSProperties {
  return {
    fontSize: 13,
    fontWeight: 800,
    color: "#334155",
    marginBottom: 6,
  };
}

function uiInput(): React.CSSProperties {
  return {
    width: "100%",
    minHeight: 48,
    borderRadius: 14,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    padding: "12px 14px",
    fontSize: 15,
    color: "#0f172a",
    outline: "none",
    boxSizing: "border-box",
  };
}

function uiTextarea(): React.CSSProperties {
  return {
    width: "100%",
    borderRadius: 14,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    padding: "12px 14px",
    fontSize: 15,
    color: "#0f172a",
    outline: "none",
    boxSizing: "border-box",
    lineHeight: 1.6,
    resize: "vertical",
  };
}

function uiPrimaryButton(): React.CSSProperties {
  return {
    width: "100%",
    minHeight: 52,
    borderRadius: 14,
    border: "1px solid #2563eb",
    background: "#2563eb",
    color: "#ffffff",
    fontSize: 15,
    fontWeight: 900,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
  };
}

function uiSecondaryButton(): React.CSSProperties {
  return {
    width: "100%",
    minHeight: 48,
    borderRadius: 14,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#0f172a",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
  };
}

function uiChoiceButton(active: boolean): React.CSSProperties {
  return {
    width: "100%",
    minHeight: 74,
    borderRadius: 16,
    border: `1px solid ${active ? "#2563eb" : "#d1d5db"}`,
    background: active ? "#2563eb" : "#ffffff",
    color: active ? "#ffffff" : "#0f172a",
    padding: "14px 16px",
    cursor: "pointer",
    display: "grid",
    gap: 4,
    textAlign: "left",
  };
}

function uiDayButton(active: boolean): React.CSSProperties {
  return {
    minHeight: 72,
    borderRadius: 14,
    border: `1px solid ${active ? "#2563eb" : "#d1d5db"}`,
    background: active ? "#2563eb" : "#ffffff",
    color: active ? "#ffffff" : "#0f172a",
    padding: "12px 12px",
    cursor: "pointer",
    display: "grid",
    gap: 6,
    alignContent: "start",
    textAlign: "left",
  };
}

function uiSupport(): React.CSSProperties {
  return {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 1.6,
    fontWeight: 700,
  };
}

function uiSoftPanel(): React.CSSProperties {
  return {
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    background: "#f8fafc",
    padding: 16,
  };
}

function uiMiniStat(): React.CSSProperties {
  return {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "start",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
  };
}

function uiMiniLabel(): React.CSSProperties {
  return {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 800,
  };
}

function uiError(): React.CSSProperties {
  return {
    borderRadius: 12,
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#9f1239",
    padding: "12px 14px",
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1.55,
  };
}

function uiSuccess(): React.CSSProperties {
  return {
    borderRadius: 12,
    border: "1px solid #bbf7d0",
    background: "#f0fdf4",
    color: "#166534",
    padding: "12px 14px",
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1.55,
  };
}
