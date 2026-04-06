"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminLeftNav from "@/app/components/AdminLeftNav";
import { hasSupabaseEnv, supabase } from "@/lib/supabaseClient";

/* -----------------------------------------------------------------------------
   TYPES
----------------------------------------------------------------------------- */

type ExecRole =
  | "CEO"
  | "COO"
  | "CTO"
  | "CRO"
  | "CPO"
  | "CFO"
  | "CDO"
  | "CAIO";

type PriorityStatus = "critical" | "high" | "watch";

type FocusArea =
  | "authority"
  | "reports"
  | "portfolio"
  | "community"
  | "ai"
  | "planner";

type ExecutiveCard = {
  role: ExecRole;
  title: string;
  verdict: string;
  headline: string;
  recommendation: string;
  impact: string;
  status: PriorityStatus;
};

type MarketMetric = {
  label: string;
  value: string;
  note: string;
};

type TrendPoint = {
  year: string;
  value: number;
};

type FactorRow = {
  label: string;
  strength: number;
  type: "push" | "pull";
};

type RegionRow = {
  region: string;
  readiness: number;
  note: string;
};

type BuildPriority = {
  name: string;
  owner: ExecRole;
  score: number;
  why: string;
  status: PriorityStatus;
};

type InsightRow = {
  label: string;
  value: string;
  note: string;
};

type AdvisoryLens =
  | "learning_science"
  | "progressive"
  | "disruptors"
  | "classical"
  | "practical"
  | "behavioural"
  | "product_experience"
  | "first_principles"
  | "brand"
  | "network";

type AdvisoryInsight = {
  lens: AdvisoryLens;
  title: string;
  advisors: string[];
  insight: string;
  challenge: string;
  implication: string;
};

type ProductSignals = {
  childrenCount: number;
  evidenceCount: number;
  reportDraftCount: number;
  portfolioItemsCount: number;
  captureHealth: number;
  reportHealth: number;
  portfolioHealth: number;
  readinessScore: number;
  usingFallbackData: boolean;
};

type SynthesisResult = {
  title: string;
  boardCall: string;
  exec: string;
  advisory: string;
  product: string;
  risk: string;
  next: string;
};

/* -----------------------------------------------------------------------------
   DATA
----------------------------------------------------------------------------- */

const MARKET_METRICS: MarketMetric[] = [
  {
    label: "US Homeschool Scale",
    value: "About 4M students",
    note: "Persistent post-pandemic market, no longer niche.",
  },
  {
    label: "Pre-Pandemic Baseline",
    value: "About 3 to 4%",
    note: "Useful benchmark for showing the market shift.",
  },
  {
    label: "Post-Pandemic Range",
    value: "About 5 to 10%",
    note: "Different sources vary, but the category remains elevated.",
  },
  {
    label: "Sector Mixing",
    value: "44%",
    note: "Many homeschool households also use another education sector.",
  },
];

const US_TREND: TrendPoint[] = [
  { year: "2019", value: 3.0 },
  { year: "2021", value: 6.0 },
  { year: "2024", value: 6.0 },
  { year: "2026", value: 7.0 },
];

const PUSH_PULL_FACTORS: FactorRow[] = [
  { label: "Safety and school environment concerns", strength: 88, type: "push" },
  { label: "Dissatisfaction with traditional schooling", strength: 82, type: "push" },
  { label: "Need for child-specific support", strength: 79, type: "push" },
  { label: "Policy or ideology mismatch", strength: 72, type: "push" },
  { label: "Personalised learning", strength: 92, type: "pull" },
  { label: "Flexible schedule", strength: 86, type: "pull" },
  { label: "Parent-led responsibility", strength: 80, type: "pull" },
  { label: "Faith and values alignment", strength: 74, type: "pull" },
];

const EXECUTIVE_CARDS: ExecutiveCard[] = [
  {
    role: "CEO",
    title: "Chief Executive Officer",
    verdict: "Market category is real and durable.",
    headline: "EduDecks should position as a homeschool confidence engine, not just a tracker.",
    recommendation: "Lock the product story around confidence, compliance, and calm family control.",
    impact: "Improves positioning, launch messaging, and category clarity.",
    status: "critical",
  },
  {
    role: "COO",
    title: "Chief Operating Officer",
    verdict: "Build order must narrow.",
    headline: "Too many future ideas are competing with the core family operating loop.",
    recommendation: "Prioritise Capture to Portfolio to Progress to Reports to Authority readiness.",
    impact: "Reduces execution drift and rebuild churn.",
    status: "critical",
  },
  {
    role: "CTO",
    title: "Chief Technology Officer",
    verdict: "Platform scope is growing fast.",
    headline: "The product is becoming a platform, so stability and structure matter more now.",
    recommendation: "Keep the executive dashboard data-driven but lightweight; avoid over-engineering charts and data pipelines too early.",
    impact: "Protects production stability while adding strategy visibility.",
    status: "high",
  },
  {
    role: "CRO",
    title: "Chief Revenue Officer",
    verdict: "The problem is parent confidence.",
    headline: "Parents do not buy dashboards; they buy reassurance and reduced stress.",
    recommendation: "Make the main CTA about being on track, compliant, and knowing what to do next.",
    impact: "Improves activation and conversion to paid tiers.",
    status: "critical",
  },
  {
    role: "CPO",
    title: "Chief Product Officer",
    verdict: "Families want one home base.",
    headline: "The market is fragmented across planners, portfolios, groups, and reporting tools.",
    recommendation: "Unify the product around a simple operating system experience with fewer disconnected surfaces.",
    impact: "Raises product clarity and family retention.",
    status: "critical",
  },
  {
    role: "CFO",
    title: "Chief Financial Officer",
    verdict: "There is willingness to pay, but for relief, not complexity.",
    headline: "Premium should unlock confidence, time savings, storage, exports, and AI assistance.",
    recommendation: "Keep the free tier useful, then premium-gate convenience, intelligence, and advanced reporting.",
    impact: "Supports freemium monetisation without hurting trust.",
    status: "high",
  },
  {
    role: "CDO",
    title: "Chief Data Officer",
    verdict: "Research points to trackable parent anxieties and needs.",
    headline: "The most useful signals are readiness, evidence coverage, child support needs, and reporting confidence.",
    recommendation: "Model product analytics around confidence and completion, not just usage counts.",
    impact: "Creates a stronger insight layer and smarter future AI.",
    status: "high",
  },
  {
    role: "CAIO",
    title: "Chief AI Officer",
    verdict: "AI should assist, not dominate.",
    headline: "Families need help turning messy activity into useful summaries and next steps.",
    recommendation: "Use AI for report drafting, evidence summarisation, and weekly recommendations after the core workflow is stable.",
    impact: "Makes AI genuinely valuable and premium-worthy.",
    status: "watch",
  },
];

const BUILD_PRIORITIES: BuildPriority[] = [
  {
    name: "Authority Confidence Layer",
    owner: "CEO",
    score: 98,
    why: "Parents need reassurance they are doing this correctly and legally.",
    status: "critical",
  },
  {
    name: "Family Progress and Readiness Layer",
    owner: "CDO",
    score: 95,
    why: "Confidence comes from visible progress and clean evidence coverage.",
    status: "critical",
  },
  {
    name: "Evidence Capture Simplification",
    owner: "CPO",
    score: 92,
    why: "Low-friction capture is the root of the whole system.",
    status: "critical",
  },
  {
    name: "Report Generator and Output Quality",
    owner: "COO",
    score: 90,
    why: "Families need chaos converted into authority-ready output.",
    status: "high",
  },
  {
    name: "Regional Compliance Router",
    owner: "CTO",
    score: 86,
    why: "Different regions require flexible outputs and future scale support.",
    status: "high",
  },
  {
    name: "AI Parent Guidance Layer",
    owner: "CAIO",
    score: 72,
    why: "Strong premium upside, but it should follow workflow stability.",
    status: "watch",
  },
];

const REGION_ROWS: RegionRow[] = [
  {
    region: "United States",
    readiness: 88,
    note: "Biggest immediate opportunity; large and persistent homeschool market.",
  },
  {
    region: "Australia",
    readiness: 81,
    note: "Strong fit for values, child-specific needs, and reporting confidence.",
  },
  {
    region: "United Kingdom",
    readiness: 73,
    note: "Attractive future market with flexible home education culture.",
  },
  {
    region: "New Zealand",
    readiness: 69,
    note: "Good fit for family-first positioning and evidence-led support.",
  },
];

const INSIGHTS: InsightRow[] = [
  {
    label: "Primary parent fear",
    value: "Am I doing this right?",
    note: "Confidence is the category entry point.",
  },
  {
    label: "Primary product job",
    value: "Turn learning into proof",
    note: "Capture and reporting must feel effortless.",
  },
  {
    label: "Retention engine",
    value: "Progress and reassurance",
    note: "Families stay when they feel organised and calm.",
  },
  {
    label: "Premium engine",
    value: "Time-saving intelligence",
    note: "AI, exports, storage, and advanced readiness signals.",
  },
];

const ADVISORY_INSIGHTS: AdvisoryInsight[] = [
  {
    lens: "learning_science",
    title: "Learning Science",
    advisors: ["John Hattie", "Lev Vygotsky", "Carol Dweck", "Howard Gardner", "Gerd Gigerenzer"],
    insight: "Learning improves when feedback, progress visibility, and cognitive load are managed carefully.",
    challenge: "Are we measuring meaningful progress or just collecting data?",
    implication: "Progress and feedback must be visible and simple for parents.",
  },
  {
    lens: "progressive",
    title: "Child-Centred Learning",
    advisors: ["Maria Montessori", "John Dewey", "Sir Ken Robinson", "Sugata Mitra"],
    insight: "Children learn best when curiosity and autonomy are preserved.",
    challenge: "Are we over-structuring the homeschool experience?",
    implication: "Keep the system flexible and child-led, not rigid like school.",
  },
  {
    lens: "disruptors",
    title: "System Critics",
    advisors: ["Ivan Illich", "Rudolf Steiner"],
    insight: "Institutional systems often reduce genuine learning.",
    challenge: "Are we recreating school at home through compliance tools?",
    implication: "Avoid turning EduDecks into a bureaucratic reporting machine.",
  },
  {
    lens: "classical",
    title: "Classical Philosophy",
    advisors: ["Socrates", "Saint Augustine", "Thomas Aquinas"],
    insight: "Education should form character, wisdom, and truth-seeking.",
    challenge: "Are we focusing only on output instead of formation?",
    implication: "Balance skills tracking with purpose and reflection.",
  },
  {
    lens: "practical",
    title: "Real-World Teaching",
    advisors: ["Jaime Escalante", "Salman Khan"],
    insight: "Tools must work for real teachers and parents with limited time.",
    challenge: "Can a parent use this in under 2 minutes?",
    implication: "Reduce friction everywhere.",
  },
  {
    lens: "behavioural",
    title: "Behavioural Economics",
    advisors: ["Rory Sutherland"],
    insight: "Perception and emotion matter more than logic.",
    challenge: "Does this feel reassuring or overwhelming?",
    implication: "Design for confidence, not just functionality.",
  },
  {
    lens: "product_experience",
    title: "Product Experience",
    advisors: ["Steve Jobs", "James Dyson"],
    insight: "Great products remove friction and feel intuitive.",
    challenge: "Is this effortless or does it require thinking?",
    implication: "Simplify flows aggressively.",
  },
  {
    lens: "first_principles",
    title: "First Principles",
    advisors: ["Elon Musk"],
    insight: "Rebuild solutions from first principles, not assumptions.",
    challenge: "Why does reporting even exist in its current form?",
    implication: "Reduce unnecessary steps dramatically.",
  },
  {
    lens: "brand",
    title: "Brand and Experience",
    advisors: ["Richard Branson"],
    insight: "Products should feel human and enjoyable.",
    challenge: "Is this uplifting or administrative?",
    implication: "Make the experience encouraging.",
  },
  {
    lens: "network",
    title: "Network Effects",
    advisors: ["Mark Zuckerberg"],
    insight: "Platforms grow stronger with user interaction.",
    challenge: "Does this improve with more families?",
    implication: "Future: community and shared insights.",
  },
];

const FALLBACK_SIGNAL_COUNTS = {
  childrenCount: 3,
  evidenceCount: 21,
  reportDraftCount: 4,
  portfolioItemsCount: 7,
};

const FOCUS_OPTIONS: Array<{ key: FocusArea; label: string }> = [
  { key: "authority", label: "Authority" },
  { key: "reports", label: "Reports" },
  { key: "portfolio", label: "Portfolio" },
  { key: "community", label: "Community" },
  { key: "ai", label: "AI" },
  { key: "planner", label: "Planner" },
];

/* -----------------------------------------------------------------------------
   HELPERS
----------------------------------------------------------------------------- */

function statusColor(status: PriorityStatus) {
  if (status === "critical") return "#dc2626";
  if (status === "high") return "#d97706";
  return "#2563eb";
}

function statusBg(status: PriorityStatus) {
  if (status === "critical") return "#fee2e2";
  if (status === "high") return "#ffedd5";
  return "#dbeafe";
}

function safePct(n: number) {
  return `${Math.max(0, Math.min(100, n))}%`;
}

function clampScore(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function sectionCardStyle(highlight = false): React.CSSProperties {
  return {
    background: "#ffffff",
    border: highlight ? "1px solid #c7d2fe" : "1px solid #e5e7eb",
    borderRadius: 20,
    padding: 20,
    boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
  };
}

function MiniBar({
  value,
  color,
}: {
  value: number;
  color: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: 10,
        background: "#e5e7eb",
        borderRadius: 999,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: safePct(value),
          height: "100%",
          background: color,
          borderRadius: 999,
        }}
      />
    </div>
  );
}

function buildProductSignals(input: {
  childrenCount: number;
  evidenceCount: number;
  reportDraftCount: number;
  portfolioItemsCount: number;
  usingFallbackData: boolean;
}): ProductSignals {
  const childrenCount = Math.max(0, input.childrenCount);
  const evidenceCount = Math.max(0, input.evidenceCount);
  const reportDraftCount = Math.max(0, input.reportDraftCount);
  const portfolioItemsCount = Math.max(0, input.portfolioItemsCount);

  const evidencePerChild = childrenCount > 0 ? evidenceCount / childrenCount : 0;
  const reportsPerChild = childrenCount > 0 ? reportDraftCount / childrenCount : 0;
  const portfolioPerChild = childrenCount > 0 ? portfolioItemsCount / childrenCount : 0;

  const captureHealth = clampScore(evidencePerChild * 18);
  const reportHealth = clampScore(
    evidenceCount === 0 ? reportDraftCount * 15 : (reportDraftCount / Math.max(1, evidenceCount)) * 220
  );
  const portfolioHealth = clampScore(
    evidenceCount === 0 ? portfolioPerChild * 20 : (portfolioItemsCount / Math.max(1, evidenceCount)) * 260
  );
  const readinessScore = clampScore(
    captureHealth * 0.4 + reportHealth * 0.35 + portfolioHealth * 0.25
  );

  return {
    childrenCount,
    evidenceCount,
    reportDraftCount,
    portfolioItemsCount,
    captureHealth,
    reportHealth,
    portfolioHealth,
    readinessScore,
    usingFallbackData: input.usingFallbackData,
  };
}

function advisorySummaryForFocus(focus: FocusArea) {
  if (focus === "authority") {
    return "Learning science and practical teaching both point toward visible progress, low cognitive load, and calmer proof-building.";
  }
  if (focus === "reports") {
    return "First-principles and product experience lenses both challenge unnecessary reporting friction.";
  }
  if (focus === "portfolio") {
    return "Classical and child-centred lenses both support preserving meaningful work, not just administrative output.";
  }
  if (focus === "community") {
    return "Network effects are valuable, but behavioural and practical lenses say community should support a healthy core workflow, not distract from it.";
  }
  if (focus === "ai") {
    return "AI should assist a stable workflow with summarisation and guidance, not compensate for weak capture or reporting foundations.";
  }
  return "Practical teaching and behavioural design both suggest joining planning to capture so families know what to do next without extra thought.";
}

function executiveSummaryForFocus(focus: FocusArea) {
  if (focus === "authority") {
    return "CEO, COO, and CRO logic all converge on confidence, compliance, and clear next steps.";
  }
  if (focus === "reports") {
    return "COO and CPO logic say report conversion is the moment where capture either proves value or becomes dead weight.";
  }
  if (focus === "portfolio") {
    return "CPO and CFO logic favour stronger kept-work flows because tangible output reinforces retention and premium value.";
  }
  if (focus === "community") {
    return "CPO and CAIO logic both say community becomes more valuable after the family loop is already trustworthy.";
  }
  if (focus === "ai") {
    return "CAIO and CDO logic say AI becomes strategic only once usable evidence and reporting patterns already exist.";
  }
  return "COO and CRO logic favour connecting plans to action so families move from intention to visible progress.";
}

function generateBoardCall(focus: FocusArea, signals: ProductSignals): SynthesisResult {
  const captureWeak = signals.captureHealth < 45;
  const reportWeak = signals.reportHealth < 45;
  const portfolioWeak = signals.portfolioHealth < 45;
  const readinessWeak = signals.readinessScore < 55;
  const evidenceHealthy = signals.captureHealth >= 60;
  const reportHealthy = signals.reportHealth >= 60;
  const workflowHealthy =
    signals.captureHealth >= 60 && signals.reportHealth >= 55 && signals.readinessScore >= 60;
  const dataReady =
    signals.evidenceCount >= 12 && signals.reportDraftCount >= 3 && signals.captureHealth >= 55;

  if (focus === "authority") {
    if (captureWeak) {
      return {
        title: "Capture before confidence layer",
        boardCall: "Authority should not be the next build while capture activity is still weak.",
        exec: "The board sees a confidence promise risk: authority messaging will underperform if families do not yet have enough evidence in the system.",
        advisory: advisorySummaryForFocus(focus),
        product: "Children are present, but evidence flow is not yet strong enough to support a reliable readiness layer.",
        risk: "Building authority first could create a polished empty shell with too little real family signal behind it.",
        next: "Tighten planner-to-capture flow and simplify evidence entry before expanding authority readiness.",
      };
    }

    if (evidenceHealthy && (reportWeak || readinessWeak)) {
      return {
        title: "Authority confidence layer is justified",
        boardCall: "Capture activity is healthy, but reporting and readiness conversion are lagging. The board recommends an Authority Confidence Layer next.",
        exec: "This fits the CEO, COO, and CRO view: families need to know what has been captured, what is missing, and how close they are to being report-ready.",
        advisory: advisorySummaryForFocus(focus),
        product: "Evidence is accumulating, but the bridge from proof to parent confidence is incomplete.",
        risk: "If readiness remains unclear, families may feel busy but still unsure they are on track.",
        next: "Build a readiness panel that shows captured evidence, missing proof, and the next best reporting action for the week.",
      };
    }

    return {
      title: "Authority can move to polish",
      boardCall: "Core workflow signals are relatively healthy, so authority work can shift from rescue to polish and regional confidence.",
      exec: "The board sees room to refine compliance guidance rather than using authority as the first stabiliser.",
      advisory: advisorySummaryForFocus(focus),
      product: "Capture, reports, and readiness are no longer severely out of balance.",
      risk: "Over-investing here now could delay more visible family wins elsewhere.",
      next: "Polish regional guidance and keep authority improvements targeted rather than dominant.",
    };
  }

  if (focus === "reports") {
    if (signals.evidenceCount > 0 && reportWeak) {
      return {
        title: "Report conversion is the main bottleneck",
        boardCall: "Evidence exists, but report drafting is not converting strongly. The board recommends simplifying report generation next.",
        exec: executiveSummaryForFocus(focus),
        advisory: advisorySummaryForFocus(focus),
        product: "Families are doing the hard part of capture, but the system is not yet helping them finish reports with enough ease.",
        risk: "If captured work does not become usable output, trust in the whole workflow will erode.",
        next: "Reduce report setup steps and add stronger draft-from-evidence pathways.",
      };
    }

    if (reportHealthy) {
      return {
        title: "Reporting is healthy enough to expand from",
        boardCall: "Report health is already reasonably strong, so the next move can shift toward portfolio polish or better output presentation.",
        exec: executiveSummaryForFocus(focus),
        advisory: advisorySummaryForFocus(focus),
        product: "The report engine is contributing value; it no longer appears to be the main workflow constraint.",
        risk: "Further report work may produce diminishing returns compared with portfolio or authority improvements.",
        next: "Move toward output polish, saved views, and better report-to-portfolio continuity.",
      };
    }

    return {
      title: "Reports remain important, but not alone",
      boardCall: "Reports still matter, but the board sees them as part of a broader readiness loop rather than a standalone build frontier.",
      exec: executiveSummaryForFocus(focus),
      advisory: advisorySummaryForFocus(focus),
      product: "Signal strength is mixed, so report work should stay connected to capture and authority readiness.",
      risk: "Treating reports in isolation can hide upstream capture problems.",
      next: "Pair report improvements with stronger readiness cues and clearer evidence quality signals.",
    };
  }

  if (focus === "portfolio") {
    if (reportHealthy && portfolioWeak) {
      return {
        title: "Portfolio should follow stronger reporting",
        boardCall: "Reports are forming, but portfolio strength is lagging. The board recommends a stronger keep-this flow and portfolio polish next.",
        exec: executiveSummaryForFocus(focus),
        advisory: advisorySummaryForFocus(focus),
        product: "Families are producing output, but the system is not yet helping them preserve and revisit standout work effectively.",
        risk: "Without stronger portfolio flow, EduDecks may feel transactional instead of encouraging.",
        next: "Add clearer save-to-portfolio prompts after reporting and during evidence review.",
      };
    }

    if (captureWeak) {
      return {
        title: "Portfolio is premature",
        boardCall: "The board does not recommend portfolio expansion yet because the evidence foundation is still weak.",
        exec: executiveSummaryForFocus(focus),
        advisory: advisorySummaryForFocus(focus),
        product: "There is not yet enough captured work to make portfolio the next high-leverage move.",
        risk: "A polished portfolio on weak input can look impressive but feel empty to families.",
        next: "Strengthen capture behaviour first, then return to portfolio as a retention layer.",
      };
    }

    return {
      title: "Portfolio is a secondary growth layer",
      boardCall: "Portfolio is strategically useful, but it should stay slightly behind capture, reporting, and readiness until the core loop is stronger.",
      exec: executiveSummaryForFocus(focus),
      advisory: advisorySummaryForFocus(focus),
      product: "Current signals suggest portfolio is valuable as reinforcement rather than as the main corrective build.",
      risk: "If prioritised too early, portfolio could absorb attention from more urgent workflow gaps.",
      next: "Prepare lightweight portfolio improvements while keeping major effort on readiness and report conversion.",
    };
  }

  if (focus === "community") {
    if (!workflowHealthy) {
      return {
        title: "Community stays secondary",
        boardCall: "Community should not be elevated yet because the core workflow is not healthy enough.",
        exec: executiveSummaryForFocus(focus),
        advisory: advisorySummaryForFocus(focus),
        product: "Capture, reporting, or readiness still need work before community can compound value safely.",
        risk: "A stronger community layer could mask core product weakness rather than deepen retention.",
        next: "Keep community simple while improving the family operating loop first.",
      };
    }

    return {
      title: "Community can support retention",
      boardCall: "Core signals are reasonably healthy, so community can now serve as a supporting retention layer rather than a distraction.",
      exec: executiveSummaryForFocus(focus),
      advisory: advisorySummaryForFocus(focus),
      product: "The product now has enough functional stability for a thoughtful member community to add belonging and shared learning.",
      risk: "Community still needs to remain structured and secondary to family progress.",
      next: "Expand calm, category-based community support after readiness and reporting remain stable.",
    };
  }

  if (focus === "ai") {
    if (!dataReady) {
      return {
        title: "AI is not yet the next move",
        boardCall: "AI should remain secondary until the workflow is producing more reliable evidence and reporting signals.",
        exec: executiveSummaryForFocus(focus),
        advisory: advisorySummaryForFocus(focus),
        product: "The current product signal base is still too thin to make AI consistently useful and trustworthy.",
        risk: "AI introduced too early may generate novelty without enough grounded value.",
        next: "Improve capture volume and report completion before expanding AI-guided summaries or recommendations.",
      };
    }

    return {
      title: "AI can now become assistive",
      boardCall: "The board sees enough workflow signal to justify assistive AI for summarisation, report drafting, and weekly next-step guidance.",
      exec: executiveSummaryForFocus(focus),
      advisory: advisorySummaryForFocus(focus),
      product: "There is now enough captured work and draft behaviour to make AI outputs more grounded and premium-worthy.",
      risk: "AI still needs to stay supportive and transparent rather than replacing parent judgment.",
      next: "Add AI to compress effort in reporting and evidence review, not as a separate experience layer.",
    };
  }

  if (signals.childrenCount > 0 && captureWeak) {
    return {
      title: "Planner to capture connection needs work",
      boardCall: "Families have children in the system, but evidence flow is too light. The board recommends improving planner-to-capture connection next.",
      exec: executiveSummaryForFocus(focus),
      advisory: advisorySummaryForFocus(focus),
      product: "Intent exists, but planned learning is not turning into enough captured proof.",
      risk: "If planning and capture remain disconnected, the system can feel aspirational rather than operational.",
      next: "Link planner moments more directly to evidence capture prompts and weekly follow-through cues.",
    };
  }

  return {
    title: "Planner can become a guidance surface",
    boardCall: "The core workflow is stable enough for planner work to focus on guidance, rhythm, and next-step clarity rather than basic activation.",
    exec: executiveSummaryForFocus(focus),
    advisory: advisorySummaryForFocus(focus),
    product: "Planning can now serve as a forward-looking confidence tool because enough capture and output behaviour already exists.",
    risk: "If planner scope grows too broad, it can become another disconnected surface.",
    next: "Keep planner lightweight and connect it tightly to capture prompts, readiness cues, and weekly momentum.",
  };
}

async function loadCount(table: string, filter?: { column: string; value: string | number | boolean }) {
  let query = supabase.from(table).select("*", { count: "exact", head: true });

  if (filter) {
    query = query.eq(filter.column, filter.value);
  }

  const { count, error } = await query;
  if (error) {
    throw error;
  }

  return count ?? 0;
}

/* -----------------------------------------------------------------------------
   PAGE
----------------------------------------------------------------------------- */

export default function AdminExecutivePage() {
  const [selectedRole, setSelectedRole] = useState<ExecRole | "ALL">("ALL");
  const [selectedFocus, setSelectedFocus] = useState<FocusArea>("authority");
  const [signalsLoading, setSignalsLoading] = useState(true);
  const [productSignals, setProductSignals] = useState<ProductSignals>(
    buildProductSignals({
      ...FALLBACK_SIGNAL_COUNTS,
      usingFallbackData: true,
    })
  );

  useEffect(() => {
    let active = true;

    async function hydrateSignals() {
      if (!hasSupabaseEnv) {
        if (active) {
          setProductSignals(
            buildProductSignals({
              ...FALLBACK_SIGNAL_COUNTS,
              usingFallbackData: true,
            })
          );
          setSignalsLoading(false);
        }
        return;
      }

      try {
        const [childrenCount, evidenceCount, reportDraftCount, portfolioItemsCount] =
          await Promise.all([
            loadCount("students"),
            loadCount("evidence_entries"),
            loadCount("report_drafts"),
            loadCount("student_evidence_curation", {
              column: "portfolio_pinned",
              value: true,
            }),
          ]);

        if (!active) return;

        setProductSignals(
          buildProductSignals({
            childrenCount,
            evidenceCount,
            reportDraftCount,
            portfolioItemsCount,
            usingFallbackData: false,
          })
        );
      } catch {
        if (!active) return;

        setProductSignals(
          buildProductSignals({
            ...FALLBACK_SIGNAL_COUNTS,
            usingFallbackData: true,
          })
        );
      } finally {
        if (active) {
          setSignalsLoading(false);
        }
      }
    }

    void hydrateSignals();

    return () => {
      active = false;
    };
  }, []);

  const visibleExecCards = useMemo(() => {
    if (selectedRole === "ALL") return EXECUTIVE_CARDS;
    return EXECUTIVE_CARDS.filter((card) => card.role === selectedRole);
  }, [selectedRole]);

  const avgReadiness = useMemo(() => {
    if (!REGION_ROWS.length) return 0;
    return Math.round(
      REGION_ROWS.reduce((sum, row) => sum + row.readiness, 0) / REGION_ROWS.length
    );
  }, []);

  const topPriority = useMemo(() => {
    return [...BUILD_PRIORITIES].sort((a, b) => b.score - a.score)[0];
  }, []);

  const criticalCount = BUILD_PRIORITIES.filter((p) => p.status === "critical").length;

  const synthesis = useMemo(() => {
    return generateBoardCall(selectedFocus, productSignals);
  }, [selectedFocus, productSignals]);

  const sortedBuildPriorities = useMemo(() => {
    return [...BUILD_PRIORITIES].sort((a, b) => b.score - a.score);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#0f172a",
      }}
    >
      <div style={{ display: "flex", alignItems: "stretch" }}>
        <AdminLeftNav />

        <main
          style={{
            flex: 1,
            padding: 24,
          }}
        >
          <section
            style={{
              ...sectionCardStyle(true),
              padding: 24,
              marginBottom: 20,
              background:
                "linear-gradient(135deg, rgba(238,242,255,1) 0%, rgba(248,250,252,1) 60%, rgba(236,253,245,1) 100%)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 20,
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
              }}
            >
              <div style={{ maxWidth: 820 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 999,
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#4338ca",
                    marginBottom: 14,
                  }}
                >
                  DIGITAL EXECUTIVE BOARD
                </div>

                <h1
                  style={{
                    margin: 0,
                    fontSize: 34,
                    lineHeight: 1.1,
                    fontWeight: 900,
                    letterSpacing: -0.6,
                  }}
                >
                  EduDecks Executive Dashboard
                </h1>

                <p
                  style={{
                    marginTop: 12,
                    marginBottom: 0,
                    fontSize: 16,
                    lineHeight: 1.6,
                    color: "#334155",
                    maxWidth: 780,
                  }}
                >
                  Research-led command view translating homeschooling market data into
                  product strategy, advisory logic, live workflow signals, and build
                  decisions for the EduDecks family product.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(140px, 1fr))",
                  gap: 12,
                  minWidth: 360,
                  flex: 1,
                  maxWidth: 520,
                }}
              >
                <div style={sectionCardStyle()}>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                    Top Priority
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 900, marginTop: 8 }}>
                    {topPriority?.name || "-"}
                  </div>
                </div>

                <div style={sectionCardStyle()}>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                    Critical Workstreams
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 900, marginTop: 8 }}>
                    {criticalCount}
                  </div>
                </div>

                <div style={sectionCardStyle()}>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                    Avg Region Readiness
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 900, marginTop: 8 }}>
                    {avgReadiness}%
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginTop: 18,
              }}
            >
              <Link
                href="/family"
                style={{
                  textDecoration: "none",
                  background: "#4f46e5",
                  color: "#ffffff",
                  fontWeight: 800,
                  padding: "10px 14px",
                  borderRadius: 12,
                  fontSize: 14,
                }}
              >
                Open Family Dashboard
              </Link>

              <Link
                href="/reports"
                style={{
                  textDecoration: "none",
                  background: "#ffffff",
                  color: "#0f172a",
                  border: "1px solid #e5e7eb",
                  fontWeight: 800,
                  padding: "10px 14px",
                  borderRadius: 12,
                  fontSize: 14,
                }}
              >
                Open Reports Builder
              </Link>

              <Link
                href="/portfolio"
                style={{
                  textDecoration: "none",
                  background: "#ffffff",
                  color: "#0f172a",
                  border: "1px solid #e5e7eb",
                  fontWeight: 800,
                  padding: "10px 14px",
                  borderRadius: 12,
                  fontSize: 14,
                }}
              >
                Open Portfolio
              </Link>
            </div>
          </section>

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "1.25fr 1fr",
              gap: 20,
              marginBottom: 20,
            }}
          >
            <div style={sectionCardStyle()}>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  marginBottom: 14,
                }}
              >
                Market Snapshot
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(220px, 1fr))",
                  gap: 12,
                }}
              >
                {MARKET_METRICS.map((metric) => (
                  <div
                    key={metric.label}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 16,
                      padding: 16,
                      background: "#fafafa",
                    }}
                  >
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                      {metric.label}
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 900, marginTop: 8 }}>
                      {metric.value}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "#475569",
                        lineHeight: 1.45,
                        marginTop: 8,
                      }}
                    >
                      {metric.note}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 18 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    marginBottom: 10,
                  }}
                >
                  Homeschool Participation Trend
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${US_TREND.length}, minmax(90px, 1fr))`,
                    gap: 12,
                    alignItems: "end",
                    height: 220,
                  }}
                >
                  {US_TREND.map((point) => (
                    <div
                      key={point.year}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        gap: 10,
                        height: "100%",
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#334155" }}>
                        {point.value.toFixed(1)}%
                      </div>

                      <div
                        style={{
                          width: "100%",
                          maxWidth: 80,
                          height: `${point.value * 24}px`,
                          background: "linear-gradient(180deg, #6366f1 0%, #22c55e 100%)",
                          borderRadius: 16,
                          boxShadow: "0 10px 20px rgba(99,102,241,0.15)",
                        }}
                      />

                      <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                        {point.year}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={sectionCardStyle()}>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  marginBottom: 14,
                }}
              >
                Executive Summary
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 12,
                }}
              >
                {INSIGHTS.map((item) => (
                  <div
                    key={item.label}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 16,
                      padding: 16,
                      background: "#ffffff",
                    }}
                  >
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                      {item.label}
                    </div>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 900,
                        marginTop: 8,
                        color: "#0f172a",
                      }}
                    >
                      {item.value}
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 13,
                        color: "#475569",
                        lineHeight: 1.45,
                      }}
                    >
                      {item.note}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section
            style={{
              ...sectionCardStyle(),
              marginBottom: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 20, fontWeight: 900 }}>
                  Parent Motivation Map
                </div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 14,
                    color: "#475569",
                    lineHeight: 1.5,
                  }}
                >
                  Push factors are driving families away from traditional systems.
                  Pull factors are attracting them toward flexible, parent-led learning.
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 10px",
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#b91c1c",
                  }}
                >
                  PUSH
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 10px",
                    background: "#ecfdf5",
                    border: "1px solid #bbf7d0",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#15803d",
                  }}
                >
                  PULL
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              <div
                style={{
                  border: "1px solid #fee2e2",
                  background: "#fffafa",
                  borderRadius: 18,
                  padding: 16,
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 900, color: "#991b1b" }}>
                  Push Factors
                </div>
                <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
                  {PUSH_PULL_FACTORS.filter((f) => f.type === "push").map((factor) => (
                    <div key={factor.label}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                          fontSize: 13,
                          fontWeight: 700,
                          marginBottom: 6,
                        }}
                      >
                        <span>{factor.label}</span>
                        <span>{factor.strength}</span>
                      </div>
                      <MiniBar value={factor.strength} color="#ef4444" />
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  border: "1px solid #dcfce7",
                  background: "#f7fff9",
                  borderRadius: 18,
                  padding: 16,
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 900, color: "#166534" }}>
                  Pull Factors
                </div>
                <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
                  {PUSH_PULL_FACTORS.filter((f) => f.type === "pull").map((factor) => (
                    <div key={factor.label}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                          fontSize: 13,
                          fontWeight: 700,
                          marginBottom: 6,
                        }}
                      >
                        <span>{factor.label}</span>
                        <span>{factor.strength}</span>
                      </div>
                      <MiniBar value={factor.strength} color="#22c55e" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section
            style={{
              ...sectionCardStyle(),
              marginBottom: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 14,
                flexWrap: "wrap",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 20, fontWeight: 900 }}>
                  Executive Board Decisions
                </div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 14,
                    color: "#475569",
                  }}
                >
                  Role-based strategic verdicts generated from homeschool market signals.
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                {(["ALL", "CEO", "COO", "CTO", "CRO", "CPO", "CFO", "CDO", "CAIO"] as const).map(
                  (role) => {
                    const active = selectedRole === role;
                    return (
                      <button
                        key={role}
                        onClick={() => setSelectedRole(role)}
                        style={{
                          border: active ? "1px solid #4f46e5" : "1px solid #e5e7eb",
                          background: active ? "#eef2ff" : "#ffffff",
                          color: active ? "#3730a3" : "#334155",
                          borderRadius: 999,
                          padding: "8px 12px",
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        {role}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(320px, 1fr))",
                gap: 16,
              }}
            >
              {visibleExecCards.map((card) => (
                <div
                  key={card.role}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 18,
                    padding: 18,
                    background: "#ffffff",
                    boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: "#64748b",
                          letterSpacing: 0.2,
                        }}
                      >
                        {card.role}
                      </div>
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 18,
                          fontWeight: 900,
                        }}
                      >
                        {card.title}
                      </div>
                    </div>

                    <div
                      style={{
                        background: statusBg(card.status),
                        color: statusColor(card.status),
                        borderRadius: 999,
                        padding: "6px 10px",
                        fontSize: 12,
                        fontWeight: 800,
                        textTransform: "uppercase",
                      }}
                    >
                      {card.status}
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 12,
                      fontSize: 15,
                      fontWeight: 800,
                      color: "#0f172a",
                    }}
                  >
                    {card.verdict}
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 14,
                      lineHeight: 1.55,
                      color: "#334155",
                    }}
                  >
                    {card.headline}
                  </div>

                  <div
                    style={{
                      marginTop: 14,
                      borderTop: "1px solid #f1f5f9",
                      paddingTop: 14,
                      display: "grid",
                      gap: 10,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>
                        Recommendation
                      </div>
                      <div style={{ fontSize: 14, color: "#0f172a", lineHeight: 1.5, marginTop: 4 }}>
                        {card.recommendation}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>
                        Expected Impact
                      </div>
                      <div style={{ fontSize: 14, color: "#0f172a", lineHeight: 1.5, marginTop: 4 }}>
                        {card.impact}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section style={{ marginTop: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 12 }}>
              Advisory Intelligence Layer
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(320px, 1fr))",
                gap: 16,
              }}
            >
              {ADVISORY_INSIGHTS.map((item) => (
                <div
                  key={item.title}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 16,
                    padding: 16,
                    background: "#ffffff",
                  }}
                >
                  <div style={{ fontSize: 16, fontWeight: 900 }}>{item.title}</div>

                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                    {item.advisors.join(", ")}
                  </div>

                  <div style={{ marginTop: 10, fontSize: 14 }}>
                    <strong>Insight:</strong> {item.insight}
                  </div>

                  <div style={{ marginTop: 8, fontSize: 14 }}>
                    <strong>Challenge:</strong> {item.challenge}
                  </div>

                  <div style={{ marginTop: 8, fontSize: 14 }}>
                    <strong>Implication:</strong> {item.implication}
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section
            style={{
              ...sectionCardStyle(),
              marginBottom: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 22, fontWeight: 900 }}>Live Product Signals</div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 14,
                    color: "#475569",
                    lineHeight: 1.5,
                  }}
                >
                  Lightweight product counts informing the board about workflow health,
                  readiness, and next build direction.
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                {signalsLoading ? (
                  <div
                    style={{
                      padding: "6px 10px",
                      borderRadius: 999,
                      background: "#f8fafc",
                      border: "1px solid #e5e7eb",
                      fontSize: 12,
                      fontWeight: 800,
                      color: "#475569",
                    }}
                  >
                    Loading signals
                  </div>
                ) : null}
                {productSignals.usingFallbackData ? (
                  <div
                    style={{
                      padding: "6px 10px",
                      borderRadius: 999,
                      background: "#fffbeb",
                      border: "1px solid #fde68a",
                      fontSize: 12,
                      fontWeight: 800,
                      color: "#92400e",
                    }}
                  >
                    Using fallback/demo product signals
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "6px 10px",
                      borderRadius: 999,
                      background: "#ecfdf5",
                      border: "1px solid #bbf7d0",
                      fontSize: 12,
                      fontWeight: 800,
                      color: "#166534",
                    }}
                  >
                    Live product counts loaded
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(180px, 1fr))",
                gap: 12,
                marginBottom: 16,
              }}
            >
              {[
                { label: "Children tracked", value: String(productSignals.childrenCount) },
                { label: "Evidence entries", value: String(productSignals.evidenceCount) },
                { label: "Report drafts", value: String(productSignals.reportDraftCount) },
                { label: "Portfolio items", value: String(productSignals.portfolioItemsCount) },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 16,
                    padding: 16,
                    background: "#fafafa",
                  }}
                >
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 900, marginTop: 8 }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(180px, 1fr))",
                gap: 12,
              }}
            >
              {[
                { label: "Capture health", value: productSignals.captureHealth, color: "#2563eb" },
                { label: "Report health", value: productSignals.reportHealth, color: "#f59e0b" },
                { label: "Portfolio health", value: productSignals.portfolioHealth, color: "#10b981" },
                { label: "Readiness score", value: productSignals.readinessScore, color: "#4f46e5" },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 16,
                    padding: 16,
                    background: "#ffffff",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      marginBottom: 10,
                      fontSize: 12,
                      color: "#64748b",
                      fontWeight: 700,
                    }}
                  >
                    <span>{item.label}</span>
                    <span>{item.value}%</span>
                  </div>
                  <MiniBar value={item.value} color={item.color} />
                </div>
              ))}
            </div>
          </section>

          <section
            style={{
              ...sectionCardStyle(true),
              marginBottom: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 14,
                flexWrap: "wrap",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 22, fontWeight: 900 }}>
                  Synthesis Engine v2
                </div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 14,
                    color: "#475569",
                  }}
                >
                  Executive logic, advisory logic, and live product signals combined into one deterministic board decision system.
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                {FOCUS_OPTIONS.map((option) => {
                  const active = selectedFocus === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setSelectedFocus(option.key)}
                      style={{
                        border: active ? "1px solid #4f46e5" : "1px solid #e5e7eb",
                        background: active ? "#eef2ff" : "#ffffff",
                        color: active ? "#3730a3" : "#334155",
                        borderRadius: 999,
                        padding: "8px 12px",
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.05fr 0.95fr",
                gap: 16,
              }}
            >
              <div
                style={{
                  border: "1px solid #c7d2fe",
                  borderRadius: 18,
                  padding: 18,
                  background: "#f8faff",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#6366f1",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {synthesis.title}
                </div>
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 24,
                    lineHeight: 1.25,
                    fontWeight: 900,
                    color: "#0f172a",
                  }}
                >
                  {synthesis.boardCall}
                </div>
                <div
                  style={{
                    marginTop: 14,
                    fontSize: 15,
                    lineHeight: 1.7,
                    color: "#334155",
                  }}
                >
                  {synthesis.product}
                </div>
              </div>

              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 18,
                  padding: 18,
                  background: "#ffffff",
                  display: "grid",
                  gap: 14,
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>
                    Executive View
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.6, color: "#0f172a", marginTop: 6 }}>
                    {synthesis.exec}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>
                    Advisory View
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.6, color: "#0f172a", marginTop: 6 }}>
                    {synthesis.advisory}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>
                    Risk
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.6, color: "#0f172a", marginTop: 6 }}>
                    {synthesis.risk}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>
                    Next Move
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.6, color: "#0f172a", marginTop: 6 }}>
                    {synthesis.next}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 0.8fr",
              gap: 20,
              marginBottom: 20,
            }}
          >
            <div style={sectionCardStyle()}>
              <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 14 }}>
                Build Priority Stack
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                {sortedBuildPriorities.map((item, index) => (
                  <div
                    key={item.name}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 16,
                      padding: 16,
                      background: "#ffffff",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#64748b",
                            fontWeight: 800,
                          }}
                        >
                          PRIORITY {index + 1}
                        </div>
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 900,
                            marginTop: 4,
                          }}
                        >
                          {item.name}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <div
                          style={{
                            background: "#f8fafc",
                            border: "1px solid #e5e7eb",
                            borderRadius: 999,
                            padding: "6px 10px",
                            fontSize: 12,
                            fontWeight: 800,
                            color: "#334155",
                          }}
                        >
                          Owner: {item.owner}
                        </div>

                        <div
                          style={{
                            background: statusBg(item.status),
                            color: statusColor(item.status),
                            borderRadius: 999,
                            padding: "6px 10px",
                            fontSize: 12,
                            fontWeight: 800,
                          }}
                        >
                          {item.status}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                          marginBottom: 6,
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        <span>Priority Score</span>
                        <span>{item.score}</span>
                      </div>
                      <MiniBar
                        value={item.score}
                        color={
                          item.status === "critical"
                            ? "#ef4444"
                            : item.status === "high"
                              ? "#f59e0b"
                              : "#3b82f6"
                        }
                      />
                    </div>

                    <div
                      style={{
                        marginTop: 12,
                        fontSize: 14,
                        color: "#334155",
                        lineHeight: 1.55,
                      }}
                    >
                      {item.why}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={sectionCardStyle()}>
              <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 14 }}>
                Region Opportunity Radar
              </div>

              <div style={{ display: "grid", gap: 14 }}>
                {REGION_ROWS.map((row) => (
                  <div
                    key={row.region}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 16,
                      padding: 16,
                      background: "#ffffff",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        alignItems: "center",
                      }}
                    >
                      <div style={{ fontSize: 15, fontWeight: 900 }}>{row.region}</div>
                      <div style={{ fontSize: 14, fontWeight: 900 }}>{row.readiness}%</div>
                    </div>

                    <div style={{ marginTop: 10 }}>
                      <MiniBar value={row.readiness} color="#4f46e5" />
                    </div>

                    <div
                      style={{
                        marginTop: 10,
                        fontSize: 13,
                        color: "#475569",
                        lineHeight: 1.5,
                      }}
                    >
                      {row.note}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section style={sectionCardStyle(true)}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.15fr 0.85fr",
                gap: 20,
              }}
            >
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 10 }}>
                  Board Call
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 900,
                    lineHeight: 1.2,
                    letterSpacing: -0.3,
                  }}
                >
                  {synthesis.boardCall}
                </div>

                <div
                  style={{
                    marginTop: 14,
                    fontSize: 15,
                    color: "#334155",
                    lineHeight: 1.7,
                    maxWidth: 880,
                  }}
                >
                  {synthesis.product} {synthesis.exec} {synthesis.advisory}
                </div>
              </div>

              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 18,
                  padding: 18,
                  background: "#ffffff",
                }}
              >
                <div style={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}>
                  NEXT BEST PRODUCT MOVE
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, marginTop: 8 }}>
                  {synthesis.title}
                </div>
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: "#334155",
                  }}
                >
                  {synthesis.next}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    marginTop: 16,
                  }}
                >
                  <Link
                    href="/authority"
                    style={{
                      textDecoration: "none",
                      background: "#4f46e5",
                      color: "#ffffff",
                      fontWeight: 800,
                      padding: "10px 14px",
                      borderRadius: 12,
                      fontSize: 14,
                    }}
                  >
                    Open Authority Hub
                  </Link>

                  <Link
                    href="/reports/output"
                    style={{
                      textDecoration: "none",
                      background: "#ffffff",
                      color: "#0f172a",
                      border: "1px solid #e5e7eb",
                      fontWeight: 800,
                      padding: "10px 14px",
                      borderRadius: 12,
                      fontSize: 14,
                    }}
                  >
                    Open Report Output
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
