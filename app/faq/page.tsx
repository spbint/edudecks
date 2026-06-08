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
  | "Worksheets"
  | "Beta";

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
      "No. MyLearna is being designed for families in different countries and regions. Homeschool requirements vary by location, so families should check their own local rules.",
  },
  {
    category: "Reporting",
    question: "Does MyLearna replace homeschool requirements?",
    answer:
      "No. MyLearna helps families organise learning and records, but homeschool requirements vary by location. It is not legal advice and does not replace official requirements.",
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
    category: "Beta",
    question: "Is MyLearna in beta?",
    answer:
      "Yes. MyLearna is opening gradually through beta so real homeschool families can test the workflow and help shape what comes next.",
  },
  {
    category: "Beta",
    question: "How do I join the beta?",
    answer:
      "You can join the beta list from the MyLearna beta page. Beta access is opened gradually so the product can improve with practical family feedback.",
  },
];

const CATEGORY_ORDER: Array<"All" | FAQCategory> = [
  "All",
  "Getting Started",
  "Planning",
  "Portfolios",
  "Reporting",
  "Worksheets",
  "Beta",
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
      heroText="Answers to common questions about homeschool planning, portfolios, learning evidence, reports, worksheets and beta access."
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
