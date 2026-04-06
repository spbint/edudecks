"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminLeftNav from "@/app/components/AdminLeftNav";
import { hasSupabaseEnv, supabase } from "@/lib/supabaseClient";

/* ------------------------------------------------------------------------------
   TYPES
------------------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------------------
   DATA
------------------------------------------------------------------------------ */

const MARKET_METRICS: MarketMetric[] = [
  {
    label: "US Homeschool Scale",
    value: "Approx. 4M students",
    note: "Persistent post-pandemic market, no longer niche.",
  },
  {
    label: "Pre-Pandemic Baseline",
    value: "Approx. 3 to 4%",
    note: "Useful benchmark for showing the market shift.",
  },
  {
    label: "Post-Pandemic Range",
    value: "Approx. 5 to 10%",
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
  { label: "Safety / school environment concerns", strength: 88, type: "push" },
  { label: "Dissatisfaction with traditional schooling", strength: 82, type: "push" },
  { label: "Need for child-specific support", strength: 79, type: "push" },
  { label: "Policy / ideology mismatch", strength: 72, type: "push" },
  { label: "Personalised learning", strength: 92, type: "pull" },
  { label: "Flexible schedule", strength: 86, type: "pull" },
  { label: "Parent-led responsibility", strength: 80, type: "pull" },
  { label: "Faith / values alignment", strength: 74, type: "pull" },
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
    name: "Family Progress + Readiness Layer",
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
    name: "Report Generator + Output Quality",
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
    value: "Progress + reassurance",
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
    title: "Brand & Experience",
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
    implication: "Future: community + shared insights.",
  },
];

const FALLBACK_SIGNALS: ProductSignals = {
  childrenCount: 12,
  evidenceCount: 54,
  reportDraftCount: 11,
  portfolioItemsCount: 18,
  captureHealth: 78,
  reportHealth: 58,
  portfolioHealth: 64,
  readinessScore: 68,
  usingFallbackData: true,
};
