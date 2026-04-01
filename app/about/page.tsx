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
      eyebrow="Why EduDecks exists"
      heroTitle="A calmer, stronger way to organise learning outside the classroom."
      heroText="EduDecks Family is being built for families who want a more connected way to capture learning, curate evidence, plan intentionally, and report with confidence — without turning home into school."
      heroBadges={["Calm", "Evidence-led", "Family-first", "Built to grow"]}
      primaryCta={{ label: "See How It Works", href: "/get-started" }}
      secondaryCta={{ label: "Start Free", href: "/capture" }}
      asideTitle="What this is"
      asideText="EduDecks is not just a planner, a portfolio, or a report builder on its own. It is a connected family learning workflow designed to reduce overwhelm and build confidence over time."
    >
      <section style={{ ...publicCardStyle(), marginBottom: 24 }}>
        <div
          style={{
            fontSize: 28,
            lineHeight: 1.15,
            fontWeight: 900,
            color: "#0f172a",
            marginBottom: 10,
          }}
        >
          Why this product is being built
        </div>

        <div
          style={{
            fontSize: 14,
            lineHeight: 1.7,
            color: "#334155",
            maxWidth: 920,
            marginBottom: 18,
          }}
        >
          Many families are trying to build meaningful learning records with a mix of
          notes, folders, screenshots, spreadsheets, memories, and last-minute effort.
          The result is often stress at reporting time, uncertainty about what matters,
          and a constant feeling that the system is scattered.
        </div>

        <div
          style={{
            fontSize: 14,
            lineHeight: 1.7,
            color: "#334155",
            maxWidth: 920,
          }}
        >
          EduDecks Family exists to offer a calmer alternative: one connected workflow
          for capturing real learning, shaping stronger evidence, planning what comes
          next, and building reports that feel more credible and less rushed.
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.05fr) minmax(320px, 0.95fr)",
          gap: 20,
          marginBottom: 24,
        }}
      >
        <div style={publicCardStyle()}>
          <div
            style={{
              fontSize: 18,
              lineHeight: 1.25,
              fontWeight: 900,
              color: "#0f172a",
              marginBottom: 10,
            }}
          >
            What makes EduDecks different
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {[
              {
                title: "It starts with real learning moments",
                text: "The workflow begins with actual learning evidence, not with abstract setup or administrative complexity.",
                tone: ["#eff6ff", "#1d4ed8"],
              },
              {
                title: "It grows through progressive complexity",
                text: "Families can begin simply, then add portfolio, planning, and reporting depth as the system becomes more useful.",
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
                    lineHeight: 1.65,
                    color: "#334155",
                    fontWeight: 600,
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
              EduDecks is being designed for real family life: mixed ages, flexible
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
              The family workflow comes first, but the same evidence-led foundation can
              later support richer planning, schools, hybrid models, and broader
              learning systems without losing the calmer core.
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
          EduDecks Family should feel calm, premium, clear, and trustworthy. It should
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
            gridTemplateColumns: "minmax(0, 1.1fr) minmax(280px, 0.9fr)",
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
              families is still simple: capture one real learning moment and let the
              record build from there.
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/capture" style={publicButtonStyle(true)}>
                Start Free
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
              Join the waitlist, follow the launch, and help shape the workflow around
              what real families need most.
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/contact" style={publicButtonStyle(true)}>
              Join Waitlist
            </Link>
            <Link href="/pricing" style={publicButtonStyle(false)}>
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  );
}