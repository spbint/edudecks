"use client";

import React from "react";
import Link from "next/link";
import PublicSiteShell, {
  publicButtonStyle,
  publicCardStyle,
  publicPill,
} from "@/app/components/PublicSiteShell";

const STEPS = [
  {
    step: "Step 1",
    title: "Capture one learning moment",
    text:
      "Start with one simple learning record. A short title, a useful summary, and one learning area are enough to begin building confidence.",
    href: "/capture",
    cta: "Open Quick Capture",
    tone: { bg: "#eff6ff", bd: "#bfdbfe", fg: "#1d4ed8" },
  },
  {
    step: "Step 2",
    title: "Curate a simple portfolio",
    text:
      "Choose the learning moments that best represent progress so the record starts becoming clearer, stronger, and easier to work with later.",
    href: "/portfolio",
    cta: "Open Portfolio",
    tone: { bg: "#f5f3ff", bd: "#ddd6fe", fg: "#6d28d9" },
  },
  {
    step: "Step 3",
    title: "Plan your next week",
    text:
      "Use what you are noticing to shape a gentler weekly rhythm with a clearer sense of what to focus on next.",
    href: "/planner",
    cta: "Open Planner",
    tone: { bg: "#ecfdf5", bd: "#a7f3d0", fg: "#166534" },
  },
  {
    step: "Step 4",
    title: "Build your first report view",
    text:
      "Open the report builder once your evidence base has started to grow, so you can see how the record is coming together over time.",
    href: "/reports",
    cta: "Open Reports",
    tone: { bg: "#fff7ed", bd: "#fed7aa", fg: "#9a3412" },
  },
  {
    step: "Step 5",
    title: "Add goals and deeper direction",
    text:
      "When the basics are working, add goals and longer-term direction so the system becomes even more intentional without becoming overwhelming.",
    href: "/goals",
    cta: "Open Goals",
    tone: { bg: "#f8fafc", bd: "#e5e7eb", fg: "#334155" },
  },
];

export default function GetStartedPage() {
  return (
    <PublicSiteShell
      eyebrow="Your best first path"
      heroTitle="Start simply. Build confidence steadily. Grow into the full workflow."
      heroText="The best way to begin is not by setting up everything at once. Start with one captured learning moment, then let the system guide you into portfolio, planning, and reporting when you are ready."
      heroBadges={[
        "Begin simply",
        "Curate gradually",
        "Plan intentionally",
        "Report when ready",
      ]}
      primaryCta={{ label: "Open Quick Capture", href: "/capture" }}
      secondaryCta={{ label: "Open Family Hub", href: "/family" }}
      asideTitle="Best first move"
      asideText="One captured learning moment is enough to begin. You do not need a perfect setup before EduDecks starts becoming useful."
    >
      <section style={{ ...publicCardStyle(), marginBottom: 24 }}>
        <div
          style={{
            fontSize: 28,
            lineHeight: 1.15,
            fontWeight: 900,
            color: "#0f172a",
            marginBottom: 8,
          }}
        >
          A calm way to begin
        </div>

        <div
          style={{
            fontSize: 14,
            color: "#475569",
            lineHeight: 1.6,
            marginBottom: 18,
            maxWidth: 860,
          }}
        >
          Most families do not need every part of the system on day one. This is
          the recommended path for starting simply, building useful evidence, and
          growing into the fuller workflow over time.
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {STEPS.map((item) => (
            <div
              key={item.step}
              style={{
                border: `1px solid ${item.tone.bd}`,
                background: item.tone.bg,
                borderRadius: 20,
                padding: 18,
                boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
              }}
            >
              <div style={{ marginBottom: 10 }}>
                <span style={publicPill(item.tone.bg, item.tone.fg)}>
                  {item.step}
                </span>
              </div>

              <div
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  color: "#0f172a",
                  marginBottom: 8,
                  lineHeight: 1.2,
                }}
              >
                {item.title}
              </div>

              <div
                style={{
                  fontSize: 14,
                  color: "#334155",
                  lineHeight: 1.65,
                  marginBottom: 14,
                }}
              >
                {item.text}
              </div>

              <Link href={item.href} style={publicButtonStyle(false)}>
                {item.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(320px, 0.9fr)",
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
            What most families should do first
          </div>

          <div
            style={{
              fontSize: 14,
              color: "#475569",
              lineHeight: 1.6,
              marginBottom: 16,
            }}
          >
            You do not need a full system in place before EduDecks becomes
            helpful. A simple first week is usually enough to make the workflow
            feel real.
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {[
              "Capture 2 to 3 real learning moments from your week.",
              "Choose 1 or 2 that best show progress and keep them in your portfolio.",
              "Sketch a gentle weekly rhythm in the planner.",
              "Open the reports area only to see how the evidence flows forward.",
            ].map((item, index) => (
              <div
                key={item}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  padding: 14,
                  background: "#f8fafc",
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    minWidth: 30,
                    height: 30,
                    borderRadius: 999,
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    color: "#1d4ed8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 900,
                  }}
                >
                  {index + 1}
                </div>

                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#334155",
                    lineHeight: 1.55,
                  }}
                >
                  {item}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={publicCardStyle()}>
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
            Gentle reassurance
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
            You do not need everything in place on day one
          </div>

          <div
            style={{
              fontSize: 14,
              color: "#475569",
              lineHeight: 1.65,
              marginBottom: 16,
            }}
          >
            EduDecks is designed to become more useful as your family record grows.
            That means you can begin simply, ignore the deeper parts for now, and
            build more confidence over time.
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {[
              "You do not need perfect evidence to begin.",
              "You do not need to configure every section right away.",
              "You do not need to homeschool like a classroom for this to work.",
              "You remain in control of what is kept, curated, and reported.",
            ].map((item) => (
              <div
                key={item}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: "12px 14px",
                  background: "#ffffff",
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
          What can wait until later
        </div>

        <div
          style={{
            fontSize: 14,
            color: "#475569",
            lineHeight: 1.6,
            marginBottom: 16,
            maxWidth: 860,
          }}
        >
          If you are just getting started, these parts do not need to be perfect
          yet. It is better to begin with real learning records than to delay until
          everything feels fully set up.
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          {[
            "A fully balanced portfolio",
            "A detailed weekly plan",
            "A polished final report",
            "Long-term goals and mission structure",
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
              Begin with one useful step
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
              The strongest first move for most families is still the same: capture
              one meaningful learning moment and let the system build from there.
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/capture" style={publicButtonStyle(true)}>
                Open Quick Capture
              </Link>
              <Link href="/family" style={publicButtonStyle(false)}>
                Open Family Hub
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
                "Start simple, then build depth.",
                "Do not wait for a perfect setup.",
                "Let the evidence grow before expecting a finished report.",
                "Use the workflow as support, not pressure.",
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
    </PublicSiteShell>
  );
}