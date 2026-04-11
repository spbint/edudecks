import type { CSSProperties } from "react";
import Link from "next/link";

function sectionCardStyle(): CSSProperties {
  return {
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    background: "#ffffff",
    boxShadow: "0 18px 44px rgba(15,23,42,0.07)",
    padding: 24,
  };
}

function stepBadgeStyle(): CSSProperties {
  return {
    width: 28,
    height: 28,
    borderRadius: 999,
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1d4ed8",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 900,
    flexShrink: 0,
  };
}

const RIBBON_STEPS = [
  { key: "plan", label: "Plan" },
  { key: "capture", label: "Capture" },
  { key: "build", label: "Build your record" },
] as const;

function secondaryLinkStyle(): CSSProperties {
  return {
    minHeight: 42,
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    color: "#334155",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 14px",
    fontSize: 14,
    fontWeight: 800,
  };
}

export default function PostAuthWelcomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f8fafc 0%, #eef4ff 100%)",
        padding: "32px 20px 56px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 920,
          margin: "0 auto",
          display: "grid",
          gap: 22,
        }}
      >
        <section
          style={{
            ...sectionCardStyle(),
            padding: "32px clamp(22px, 4vw, 40px)",
            textAlign: "center",
            display: "grid",
            gap: 16,
            justifyItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: 1.1,
              textTransform: "uppercase",
              color: "#64748b",
            }}
          >
            EduDecks Family
          </div>

          <div
            style={{
              fontSize: "clamp(2rem, 6vw, 3.4rem)",
              lineHeight: 1.04,
              fontWeight: 900,
              color: "#0f172a",
              maxWidth: 760,
            }}
          >
            Welcome. You&apos;re in.
          </div>

          <div
            style={{
              fontSize: "clamp(1.1rem, 2.8vw, 1.5rem)",
              lineHeight: 1.35,
              fontWeight: 800,
              color: "#1e293b",
              maxWidth: 660,
            }}
          >
            Let&apos;s start with one simple learning moment.
          </div>

          <div
            style={{
              fontSize: 15,
              lineHeight: 1.75,
              color: "#475569",
              maxWidth: 620,
            }}
          >
            We&apos;ll guide you step by step from here.
          </div>

          <div style={{ display: "grid", gap: 10, width: "100%", maxWidth: 360, marginTop: 6 }}>
            <Link
              href="/start"
              style={{
                minHeight: 54,
                borderRadius: 16,
                background: "#2563eb",
                border: "1px solid #2563eb",
                color: "#ffffff",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: 900,
                boxShadow: "0 16px 34px rgba(37,99,235,0.18)",
                padding: "0 18px",
              }}
            >
              Start your first learning moment
            </Link>

            <div
              style={{
                fontSize: 13,
                lineHeight: 1.6,
                color: "#64748b",
                fontWeight: 700,
              }}
            >
              Takes less than 30 seconds. You can change it later.
            </div>
          </div>

          <div style={{ width: "100%", maxWidth: 760, marginTop: 6 }}>
            <WorkflowRibbon />
          </div>
        </section>

        <section
          id="how-it-works"
          style={{
            ...sectionCardStyle(),
            display: "grid",
            gap: 16,
          }}
        >
          <div style={{ display: "grid", gap: 8 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: 1.05,
                textTransform: "uppercase",
                color: "#64748b",
              }}
            >
              What happens next
            </div>
            <div
              style={{
                fontSize: 24,
                lineHeight: 1.15,
                fontWeight: 900,
                color: "#0f172a",
              }}
            >
              One small step. Then the record starts to build.
            </div>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            {[
              "Add one small learning moment",
              "Capture what happened",
              "We build your record from there",
            ].map((step, index) => (
              <div
                key={step}
                style={{
                  display: "grid",
                  gridTemplateColumns: "28px minmax(0,1fr)",
                  gap: 12,
                  alignItems: "start",
                }}
              >
                <span style={stepBadgeStyle()}>{index + 1}</span>
                <div
                  style={{
                    fontSize: 15,
                    lineHeight: 1.65,
                    color: "#334155",
                    fontWeight: 700,
                  }}
                >
                  {step}
                </div>
              </div>
            ))}
          </div>

          <div style={{ paddingTop: 4, display: "flex", justifyContent: "start" }}>
            <Link
              href="/start"
              style={{
                color: "#1d4ed8",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 800,
              }}
            >
              Start your first learning moment
            </Link>
          </div>
        </section>

        <section
          style={{
            ...sectionCardStyle(),
            background: "#f8fafc",
            borderColor: "#e2e8f0",
            display: "grid",
            gap: 14,
          }}
        >
          <div style={{ display: "grid", gap: 6 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: 1.05,
                textTransform: "uppercase",
                color: "#64748b",
              }}
            >
              Explore later
            </div>
            <div
              style={{
                fontSize: 16,
                lineHeight: 1.45,
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              The rest of EduDecks is ready when you need it, but you do not need to start there.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <Link href="/family" style={secondaryLinkStyle()}>
              Family home
            </Link>
            <Link href="/portfolio" style={secondaryLinkStyle()}>
              Portfolio
            </Link>
            <Link href="/reports" style={secondaryLinkStyle()}>
              Reports
            </Link>
            <Link href="/authority/readiness" style={secondaryLinkStyle()}>
              Readiness
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function WorkflowRibbon() {
  return (
    <section
      style={{
        border: "1px solid #dbeafe",
        background: "#f8fbff",
        borderRadius: 18,
        padding: 14,
        display: "grid",
        gap: 10,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: 1.05,
          textTransform: "uppercase",
          color: "#64748b",
        }}
      >
        How it flows
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {RIBBON_STEPS.map((step, index) => (
          <div
            key={step.key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 999,
                border: "1px solid #dbeafe",
                background: "#ffffff",
                color: "#334155",
                fontSize: 13,
                fontWeight: 800,
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  color: "#1d4ed8",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 900,
                }}
              >
                {index + 1}
              </span>
              {step.label}
            </div>

            {index < RIBBON_STEPS.length - 1 ? (
              <span
                style={{
                  color: "#94a3b8",
                  fontSize: 14,
                  fontWeight: 900,
                }}
              >
                →
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
