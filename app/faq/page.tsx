"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import PublicSiteShell, {
  publicButtonStyle,
  publicCardStyle,
} from "@/app/components/PublicSiteShell";

type FAQCategory =
  | "Getting Started"
  | "Planning"
  | "Portfolios"
  | "Reporting"
  | "Record Keeping"
  | "Worksheets"
  | "Accounts";

type FAQItem = {
  answer: string;
  category: FAQCategory;
  question: string;
};

const FAQS: FAQItem[] = [
  {
    category: "Getting Started",
    question: "What is MyLearna?",
    answer:
      "MyLearna is a homeschool-first system for planning learning, capturing evidence, building portfolios and preparing clearer reports from connected family records.",
  },
  {
    category: "Getting Started",
    question: "Who is MyLearna for?",
    answer:
      "MyLearna is for homeschool families who want a calmer way to organise planning, learning evidence, work samples, portfolio notes and reporting preparation.",
  },
  {
    category: "Getting Started",
    question: "Is MyLearna only for one country?",
    answer:
      "No. MyLearna is available to families in different countries and regions. Homeschool requirements vary by location, so families should check their own local rules.",
  },
  {
    category: "Reporting",
    question: "Does MyLearna replace homeschool requirements?",
    answer:
      "No. MyLearna helps families organise learning and records, but homeschool requirements vary by location. It is not legal advice and does not replace official requirements.",
  },
  {
    category: "Record Keeping",
    question: "Do I need to save every worksheet?",
    answer:
      "Usually no. Keep representative samples and anything specifically required by your state or program. Read the complete record-keeping guide for a practical system.",
  },
  {
    category: "Record Keeping",
    question: "Can photos count as homeschool records?",
    answer:
      "Yes. Add a date and a short explanation of what happened, what the learner demonstrated and what might come next.",
  },
  {
    category: "Record Keeping",
    question: "What should I keep if my child may return to school?",
    answer:
      "Keep annual summaries, resource information, representative work, assessments and older-student course or credit information.",
  },
  {
    category: "Planning",
    question: "Can I use MyLearna for planning?",
    answer:
      "Yes. MyLearna supports weekly planning, daily learning flow, flexible routines and calendar-connected records so planning can become useful evidence later.",
  },
  {
    category: "Portfolios",
    question: "Can I use MyLearna for portfolios?",
    answer:
      "Yes. Families can build a portfolio over time from work samples, parent notes, reflections, learning evidence and selected records that show progress.",
  },
  {
    category: "Reporting",
    question: "Can I use MyLearna for reports?",
    answer:
      "MyLearna can help families prepare clearer summaries and records by connecting planning, evidence, portfolios and learning notes. Families should still check their local reporting requirements.",
  },
  {
    category: "Worksheets",
    question: "Are worksheets included?",
    answer:
      "MyLearna includes maths worksheet resources inside the learning workflow. Public SEO pages may describe worksheet topics, but they do not expose full worksheet PDF downloads.",
  },
  {
    category: "Accounts",
    question: "How do I start using MyLearna?",
    answer:
      "Start with your email. MyLearna asks for a few setup details so My Profile and My Settings can be easier to complete after sign-in.",
  },
  {
    category: "Accounts",
    question: "Do I need approval before using MyLearna?",
    answer:
      "No approval step is required in the public signup flow. Create your account with email, then begin with My Profile.",
  },
];

const CATEGORY_ORDER: Array<"All" | FAQCategory> = [
  "All",
  "Getting Started",
  "Planning",
  "Portfolios",
  "Reporting",
  "Record Keeping",
  "Worksheets",
  "Accounts",
];

const RELATED_GUIDES = [
  { href: "/homeschool-planning", label: "Homeschool planning" },
  { href: "/homeschool-record-keeping", label: "Record keeping" },
  { href: "/homeschool-learning-evidence", label: "Learning evidence" },
  { href: "/homeschool-portfolio", label: "Portfolio support" },
  { href: "/homeschool-reporting", label: "Reporting support" },
  { href: "/homeschool-maths-worksheets", label: "Maths worksheets" },
] as const;

export default function FAQPage() {
  const [openKey, setOpenKey] = useState<string>("What is MyLearna?");
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
      heroTitle="MyLearna FAQ"
      heroText="Answers to common questions about homeschool planning, portfolios, learning evidence, reports, worksheets and account setup."
      heroBadges={[
        "Planning",
        "Evidence",
        "Portfolios",
        "Reports",
      ]}
      primaryCta={{ label: "Start with MyLearna", href: "/start-free?source=seo-faq" }}
      secondaryCta={{ label: "Explore the demo", href: "/demo" }}
      asideTitle="What matters most"
      asideText="MyLearna helps families organise records. It does not replace local homeschool requirements."
      compactHero
    >
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
            "Requirements vary by location.",
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

      <section style={{ ...publicCardStyle(), marginBottom: 24, background: "#eff6ff", border: "1px solid #bfdbfe" }}>
        <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Record keeping answers</div>
        <div style={{ lineHeight: 1.7, color: "#334155", marginBottom: 14 }}>
          Start with the complete practical guide to what homeschool families should keep, what they can usually skip and how records become useful evidence, portfolios and reports.
        </div>
        <Link href="/homeschool-record-keeping" style={publicButtonStyle(true)}>
          Read the complete record-keeping guide
        </Link>
      </section>

      <section style={{ ...publicCardStyle(), marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {CATEGORY_ORDER.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              style={publicButtonStyle(activeCategory === category)}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

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
                  type="button"
                  onClick={() => setOpenKey(isOpen ? "" : item.question)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: 16,
                    border: "none",
                    background: "transparent",
                    fontWeight: 800,
                    cursor: "pointer",
                    color: "#0f172a",
                  }}
                >
                  {item.question}
                </button>

                {isOpen ? (
                  <div
                    style={{
                      padding: "0 16px 16px",
                      lineHeight: 1.7,
                      color: "#475569",
                    }}
                  >
                    {item.answer}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <section
        style={{
          borderRadius: 24,
          padding: 28,
          background: "linear-gradient(135deg,#2563eb,#7c3aed)",
          color: "#ffffff",
          marginBottom: 24,
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 10 }}>
          Start with MyLearna
        </div>

        <div style={{ marginBottom: 16, lineHeight: 1.7 }}>
          Create your MyLearna account and begin with a simple family record,
          planning flow and first learning moment.
        </div>

        <Link
          href="/start-free?source=seo-faq"
          style={{
            ...publicButtonStyle(true),
            background: "#ffffff",
            color: "#2563eb",
          }}
        >
          Create your MyLearna account
        </Link>
      </section>

      <section style={publicCardStyle()}>
        <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 12 }}>
          Related guides
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {RELATED_GUIDES.map((item) => (
            <Link key={item.href} href={item.href} style={publicButtonStyle(false)}>
              {item.label}
            </Link>
          ))}
        </div>
      </section>
    </PublicSiteShell>
  );
}
