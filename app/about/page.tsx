"use client";

import React from "react";
import Link from "next/link";
import PublicSiteShell, {
  publicButtonStyle,
  publicCardStyle,
  publicPill,
} from "@/app/components/PublicSiteShell";

export default function AboutPage() {
  return (
    <PublicSiteShell
      eyebrow="Why MyLearna exists"
      heroTitle="About MyLearna"
      heroText="MyLearna gives families one connected place to plan learning, follow the day, capture evidence, build portfolios and prepare homeschool reports."
      heroBadges={["Calm", "Evidence-led", "Family-first", "Built to grow"]}
      primaryCta={{ label: "Start free during beta", href: "/start-free?source=about-primary" }}
      secondaryCta={{ label: "See how it works", href: "/get-started" }}
      asideTitle="What this is"
      asideText="MyLearna is not just a planner, a portfolio, or a report builder on its own. It is a connected family learning workflow designed to reduce overwhelm and build confidence over time."
    >
      <section style={{ ...publicCardStyle(), marginBottom: 24 }}>
        <div
          style={{
            fontSize: 26,
            lineHeight: 1.18,
            fontWeight: 800,
            color: "#0f172a",
            marginBottom: 10,
          }}
        >
          Why this product is being built
        </div>

        <div
          style={{
            fontSize: 14,
            lineHeight: 1.55,
            color: "#334155",
            maxWidth: 920,
            marginBottom: 18,
          }}
        >
          Many families build records from notes, folders, screenshots,
          spreadsheets and memory. Reporting time can feel scattered.
        </div>

        <div
          style={{
            fontSize: 14,
            lineHeight: 1.55,
            color: "#334155",
            maxWidth: 920,
          }}
        >
          MyLearna offers a calmer workflow for planning, capturing real
          evidence, shaping portfolios and building records with less rush.
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
          gap: 20,
          marginBottom: 24,
        }}
      >
        <div style={publicCardStyle()}>
          <div
            style={{
              fontSize: 18,
              lineHeight: 1.25,
              fontWeight: 800,
              color: "#0f172a",
              marginBottom: 10,
            }}
          >
            What makes MyLearna different
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {[
              {
                title: "It starts with the family workflow",
                text: "The workflow connects planning, daily learning, pathway checks, evidence, portfolio choices and reports.",
                tone: ["#eff6ff", "#1d4ed8"],
              },
              {
                title: "It grows through progressive depth",
                text: "Families can begin with planning and text evidence, then add portfolio, pathway and reporting depth as the record grows.",
                tone: ["#f5f3ff", "#6d28d9"],
              },
              {
                title: "It is built to feel supportive, not supervisory",
                text: "The language, layout, and workflow are designed to reduce pressure and help families feel more in control.",
                tone: ["#ecfdf5", "#166534"],
              },
              {
                title: "It is designed to build confidence over time",
                text: "The aim is not to create more admin. It is to make learning easier to see, keep, and use later.",
                tone: ["#fff7ed", "#9a3412"],
              },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  padding: 14,
                  background: "#f8fafc",
                }}
              >
                <div style={{ marginBottom: 8 }}>
                  <span style={publicPill(item.tone[0], item.tone[1])}>
                    {item.title}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: 14,
                    lineHeight: 1.5,
                    color: "#334155",
                    fontWeight: 500,
                  }}
                >
                  {item.text}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gap: 20 }}>
          <section style={publicCardStyle()}>
            <div
              style={{
                fontSize: 12,
                lineHeight: 1.2,
                fontWeight: 800,
                letterSpacing: 1.1,
                textTransform: "uppercase",
                color: "#64748b",
                marginBottom: 8,
              }}
            >
              Built for families
            </div>

            <div
              style={{
                fontSize: 18,
                lineHeight: 1.25,
                fontWeight: 900,
                color: "#0f172a",
                marginBottom: 10,
              }}
            >
              A family-shaped system, not a classroom-shaped one
            </div>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.7,
                color: "#475569",
              }}
            >
              MyLearna is being designed for real family life: mixed ages, flexible
              rhythms, different homeschool philosophies, project-based learning,
              everyday learning, and records that build gradually rather than appearing
              all at once.
            </div>
          </section>

          <section style={publicCardStyle()}>
            <div
              style={{
                fontSize: 12,
                lineHeight: 1.2,
                fontWeight: 800,
                letterSpacing: 1.1,
                textTransform: "uppercase",
                color: "#64748b",
                marginBottom: 8,
              }}
            >
              Built to grow
            </div>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.7,
                color: "#475569",
              }}
            >
              The family workflow comes first, and the same evidence-led foundation can
              support richer family planning and broader homeschool reporting needs
              without losing the calmer core.
            </div>
          </section>
        </div>
      </section>

      <section style={{ ...publicCardStyle(), marginBottom: 24 }}>
        <div
          style={{
            fontSize: 18,
            lineHeight: 1.25,
            fontWeight: 900,
            color: "#0f172a",
            marginBottom: 10,
          }}
        >
          The kind of experience this should feel like
        </div>

        <div
          style={{
            fontSize: 14,
            lineHeight: 1.6,
            color: "#475569",
            marginBottom: 16,
            maxWidth: 900,
          }}
        >
          MyLearna should feel calm, premium, clear, and trustworthy. It should
          feel more like a thoughtful family support system than a school dashboard,
          and more like an organised record of growth than a pile of admin tasks.
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: 14,
          }}
        >
          {[
            "Calm instead of cluttered",
            "Supportive instead of supervisory",
            "Evidence-led instead of guesswork-led",
            "Clear instead of technically dense",
            "Premium without feeling corporate",
            "Human without feeling childish",
          ].map((item) => (
            <div
              key={item}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 14,
                padding: 14,
                background: "#f8fafc",
                fontSize: 14,
                fontWeight: 700,
                color: "#334155",
                lineHeight: 1.5,
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          ...publicCardStyle(),
          marginBottom: 24,
          background:
            "linear-gradient(135deg, rgba(79,124,240,0.06) 0%, rgba(139,124,246,0.06) 100%)",
          border: "1px solid #bfdbfe",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
            gap: 20,
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 28,
                lineHeight: 1.15,
                fontWeight: 900,
                color: "#0f172a",
                marginBottom: 10,
              }}
            >
              Start simply. Let the system become more useful over time.
            </div>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.7,
                color: "#334155",
                maxWidth: 760,
                marginBottom: 18,
              }}
            >
              You do not need a finished setup to begin. The best first move for most
              families is simple: create the family profile, sketch the week, and
              capture one real learning moment.
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/start-free?source=about-midpage" style={publicButtonStyle(true)}>
                Start free during beta
              </Link>
              <Link href="/get-started" style={publicButtonStyle(false)}>
                See the Recommended Path
              </Link>
            </div>
          </div>

          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 16,
              padding: 16,
              background: "#ffffff",
            }}
          >
            <div
              style={{
                fontSize: 12,
                lineHeight: 1.2,
                fontWeight: 800,
                letterSpacing: 1.1,
                textTransform: "uppercase",
                color: "#64748b",
                marginBottom: 8,
              }}
            >
              Helpful reminder
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {[
                "You do not need perfect records to begin.",
                "You do not need to build every section at once.",
                "You can begin simply and add depth later.",
                "The workflow is there to support, not pressure, your family.",
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: "12px 14px",
                    background: "#f8fafc",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#334155",
                    lineHeight: 1.5,
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={publicCardStyle()}>
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
              Want to stay close to the product as it grows?
            </div>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: "#475569",
                maxWidth: 760,
              }}
            >
              Use MyLearna now during beta, share feedback, and help shape the
              workflow around what real families need most.
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/start-free?source=about-footer" style={publicButtonStyle(true)}>
              Start free during beta
            </Link>
            <Link href="/contact" style={publicButtonStyle(false)}>
              Contact
            </Link>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  );
}
