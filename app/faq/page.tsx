"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import PublicSiteShell, {
  publicButtonStyle,
  publicCardStyle,
  publicPill,
} from "@/app/components/PublicSiteShell";

type FAQCategory =
  | "Getting Started"
  | "Homeschool Fit"
  | "Evidence"
  | "Reporting"
  | "Time & Effort"
  | "Trust";

type FAQItem = {
  category: FAQCategory;
  question: string;
  answer: string;
  featured?: boolean;
};

const FAQS: FAQItem[] = [
  {
    category: "Getting Started",
    question: "What is EduDecks Family?",
    answer:
      "EduDecks Family is a homeschool-first workflow for capturing learning, curating stronger evidence, planning intentionally, and building reports more calmly over time.",
    featured: true,
  },
  {
    category: "Getting Started",
    question: "Where should I begin?",
    answer:
      "Start with one real learning moment. You do not need to configure everything before the system becomes useful.",
    featured: true,
  },
  {
    category: "Homeschool Fit",
    question: "Will this work for our homeschool style?",
    answer:
      "Yes. It supports structured, eclectic, interest-led, project-based, hybrid, and mixed approaches without forcing one method.",
    featured: true,
  },
  {
    category: "Evidence",
    question: "What counts as evidence?",
    answer:
      "Work samples, observations, projects, discussions, practical tasks, photos, or reflections can all demonstrate meaningful learning.",
    featured: true,
  },
  {
    category: "Reporting",
    question: "Can this help with reporting requirements?",
    answer:
      "Yes. The workflow is designed to help families build clearer, more credible records over time without making the process bureaucratic.",
    featured: true,
  },
  {
    category: "Time & Effort",
    question: "How much time does this take?",
    answer:
      "It can start very lightly — often just a few minutes at a time. The goal is to reduce stress, not create more work.",
  },
  {
    category: "Trust",
    question: "Will this judge our homeschooling?",
    answer:
      "No. EduDecks is designed to support families, not supervise them.",
  },
];

const CATEGORY_ORDER: Array<"All" | FAQCategory> = [
  "All",
  "Getting Started",
  "Homeschool Fit",
  "Evidence",
  "Reporting",
  "Time & Effort",
  "Trust",
];

export default function FAQPage() {
  const [openKey, setOpenKey] = useState<string>("What is EduDecks Family?");
  const [activeCategory, setActiveCategory] =
    useState<"All" | FAQCategory>("All");

  const filteredFaqs = useMemo(() => {
    return activeCategory === "All"
      ? FAQS
      : FAQS.filter((item) => item.category === activeCategory);
  }, [activeCategory]);

  return (
    <PublicSiteShell
      eyebrow="Trust starts with clarity"
      heroTitle="Common questions. Calm, honest answers."
      heroText="Most families do not need a perfect system. They just need a calm place to begin."
      heroBadges={[
        "Homeschool-first",
        "Flexible use",
        "Evidence-led",
        "Reporting-ready",
      ]}
      primaryCta={{ label: "Start Free", href: "/capture" }}
      secondaryCta={{ label: "See How It Works", href: "/get-started" }}
      asideTitle="What matters most"
      asideText="It should feel supportive, not bureaucratic."
    >
      {/* TOP QUICK REASSURANCE */}
      <section style={{ ...publicCardStyle(), marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 12 }}>
          Most families ask these first
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: 12,
          }}
        >
          {[
            "Start with one learning moment.",
            "No perfect setup required.",
            "Works with different homeschool styles.",
            "Build confidence before reporting.",
          ].map((item) => (
            <div
              key={item}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 14,
                background: "#f8fafc",
                fontWeight: 700,
                fontSize: 14,
                color: "#334155",
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORY FILTER */}
      <section style={{ ...publicCardStyle(), marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {CATEGORY_ORDER.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              style={publicButtonStyle(activeCategory === category)}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* QUESTIONS */}
      <section style={{ ...publicCardStyle(), marginBottom: 24 }}>
        <div style={{ display: "grid", gap: 12 }}>
          {filteredFaqs.map((item) => {
            const isOpen = openKey === item.question;

            return (
              <div
                key={item.question}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 16,
                  background: "#f8fafc",
                }}
              >
                <button
                  onClick={() =>
                    setOpenKey(isOpen ? "" : item.question)
                  }
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: 16,
                    border: "none",
                    background: "transparent",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {item.question}
                </button>

                {isOpen && (
                  <div style={{ padding: "0 16px 16px", lineHeight: 1.7 }}>
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* FINAL CTA */}
      <section
        style={{
          borderRadius: 24,
          padding: 28,
          background: "linear-gradient(135deg,#2563eb,#7c3aed)",
          color: "#ffffff",
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 10 }}>
          The easiest way to understand it is to try it
        </div>

        <div style={{ marginBottom: 16 }}>
          One captured learning moment is enough to see how the workflow works.
        </div>

        <Link
          href="/capture"
          style={{
            ...publicButtonStyle(true),
            background: "#ffffff",
            color: "#2563eb",
          }}
        >
          Open Quick Capture
        </Link>
      </section>
    </PublicSiteShell>
  );
}