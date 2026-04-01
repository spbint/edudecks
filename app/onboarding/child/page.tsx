"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PublicSiteShell, {
  publicButtonStyle,
  publicCardStyle,
  publicPill,
} from "@/app/components/PublicSiteShell";

type YearBand =
  | "Early Years"
  | "Primary"
  | "Middle Years"
  | "Secondary"
  | "Not sure yet";

type SetupState = "idle" | "saving" | "error";

function safe(v: any) {
  return String(v ?? "").trim();
}

function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    border: "1px solid #d1d5db",
    borderRadius: 12,
    padding: "12px 14px",
    background: "#ffffff",
    fontSize: 14,
    color: "#111827",
  };
}

function labelStyle(): React.CSSProperties {
  return {
    fontSize: 13,
    fontWeight: 800,
    color: "#475569",
    marginBottom: 6,
    display: "block",
  };
}

function optionCardStyle(active: boolean): React.CSSProperties {
  return {
    border: active ? "1px solid #2563eb" : "1px solid #e5e7eb",
    background: active ? "#eff6ff" : "#ffffff",
    borderRadius: 14,
    padding: 14,
    cursor: "pointer",
    boxShadow: active ? "0 10px 24px rgba(37,99,235,0.10)" : "0 6px 18px rgba(15,23,42,0.03)",
  };
}

export default function OnboardingChildPage() {
  const router = useRouter();

  const [childName, setChildName] = useState("");
  const [yearBand, setYearBand] = useState<YearBand>("Primary");
  const [homeStyle, setHomeStyle] = useState("Eclectic / mixed");
  const [mainGoal, setMainGoal] = useState("");
  const [setupState, setSetupState] = useState<SetupState>("idle");
  const [feedback, setFeedback] = useState("");

  const onboardingReason =
    typeof window !== "undefined"
      ? localStorage.getItem("edudecks.onboarding.reason") || ""
      : "";

  const canContinue = useMemo(() => !!safe(childName), [childName]);

  async function handleContinue() {
    if (!canContinue) {
      setSetupState("error");
      setFeedback("Please enter the child’s name to continue.");
      return;
    }

    try {
      setSetupState("saving");
      setFeedback("");

      if (typeof window !== "undefined") {
        localStorage.setItem(
          "edudecks.onboarding.childProfileDraft",
          JSON.stringify({
            childName: safe(childName),
            yearBand,
            homeStyle: safe(homeStyle),
            mainGoal: safe(mainGoal),
            onboardingReason: safe(onboardingReason),
            savedAt: new Date().toISOString(),
          })
        );
      }

      router.push("/family");
    } catch (err: any) {
      setSetupState("error");
      setFeedback(String(err?.message || err || "Something went wrong while saving this setup step."));
    }
  }

  return (
    <PublicSiteShell
      eyebrow="Set up the first learner"
      heroTitle="Start with one child. Keep the setup light."
      heroText="You do not need to build the whole system right now. This step simply gives EduDecks a real learner to organise around so the family workspace feels more relevant from the beginning."
      heroBadges={[
        "Family-first",
        "No heavy setup",
        "You can refine later",
        "Progressive complexity",
      ]}
      primaryCta={{ label: "Save and continue", href: "#child-setup" }}
      secondaryCta={{ label: "Back to onboarding start", href: "/onboarding" }}
      asideTitle="What this step does"
      asideText="This creates a simple starting profile so the workflow can begin around a real child instead of abstract settings. You can add more detail later."
    >
      <section
        id="child-setup"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.08fr) minmax(320px, 0.92fr)",
          gap: 20,
          marginBottom: 24,
        }}
      >
        <div style={publicCardStyle()}>
          <div
            style={{
              fontSize: 28,
              lineHeight: 1.15,
              fontWeight: 900,
              color: "#0f172a",
              marginBottom: 8,
            }}
          >
            Child setup
          </div>

          <div
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              color: "#475569",
              marginBottom: 18,
              maxWidth: 780,
            }}
          >
            Add just enough to begin. The strongest first move is to create a simple learner profile and then move into the family workspace.
          </div>

          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={labelStyle()}>Child’s name</label>
              <input
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="Enter the child’s name"
                style={inputStyle()}
              />
            </div>

            <div>
              <label style={labelStyle()}>Year band</label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
                  gap: 10,
                }}
              >
                {(["Early Years", "Primary", "Middle Years", "Secondary", "Not sure yet"] as YearBand[]).map(
                  (option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setYearBand(option)}
                      style={optionCardStyle(yearBand === option)}
                    >
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
                        {option}
                      </div>
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <label style={labelStyle()}>Homeschool style (optional)</label>
              <select
                value={homeStyle}
                onChange={(e) => setHomeStyle(e.target.value)}
                style={inputStyle()}
              >
                <option>Eclectic / mixed</option>
                <option>Structured / curriculum-led</option>
                <option>Classical</option>
                <option>Interest-led / project-based</option>
                <option>Hybrid / part-school</option>
                <option>Not sure yet</option>
              </select>
            </div>

            <div>
              <label style={labelStyle()}>Main focus right now (optional)</label>
              <textarea
                value={mainGoal}
                onChange={(e) => setMainGoal(e.target.value)}
                rows={4}
                placeholder="For example: build a clearer weekly rhythm, prepare for registration, strengthen reading records, or just start capturing learning more consistently."
                style={{ ...inputStyle(), resize: "vertical" }}
              />
            </div>

            {feedback ? (
              <div
                style={{
                  border: "1px solid #fecdd3",
                  background: "#fff1f2",
                  color: "#be123c",
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {feedback}
              </div>
            ) : null}

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handleContinue}
                disabled={!canContinue || setupState === "saving"}
                style={{
                  ...publicButtonStyle(true),
                  cursor: !canContinue || setupState === "saving" ? "not-allowed" : "pointer",
                  opacity: !canContinue || setupState === "saving" ? 0.7 : 1,
                }}
              >
                {setupState === "saving" ? "Saving..." : "Save and continue"}
              </button>

              <Link href="/onboarding" style={publicButtonStyle(false)}>
                Back
              </Link>
            </div>
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
              This is only a starting profile
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {[
                "You can add more detail later.",
                "One child is enough to begin the workflow.",
                "Nothing here needs to be perfect today.",
                "The aim is momentum, not admin overload.",
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
              What happens after this?
            </div>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.65,
                color: "#475569",
                marginBottom: 14,
              }}
            >
              After saving this step, the family workspace can start shaping itself around a real learner. From there, most families should simply begin capturing learning and let the record grow.
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {[
                "Open the family hub",
                "Capture one learning moment",
                "Let evidence build before expecting a finished report",
              ].map((item, index) => (
                <div
                  key={item}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: "12px 14px",
                    background: index === 0 ? "#ffffff" : "#f8fafc",
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

          {safe(onboardingReason) ? (
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
                Your selected starting path
              </div>

              <div style={{ marginBottom: 8 }}>
                <span style={publicPill("#eff6ff", "#1d4ed8")}>
                  {onboardingReason}
                </span>
              </div>

              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: "#475569",
                }}
              >
                This can help shape the way the early family workflow is presented, but you can always change direction later.
              </div>
            </section>
          ) : null}
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
              Want to keep the setup even lighter?
            </div>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: "#475569",
                maxWidth: 760,
              }}
            >
              That is completely fine. Start with a name, continue into the family workspace, and let the rest of the system become useful over time.
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={handleContinue}
              disabled={!canContinue || setupState === "saving"}
              style={{
                ...publicButtonStyle(true),
                cursor: !canContinue || setupState === "saving" ? "not-allowed" : "pointer",
                opacity: !canContinue || setupState === "saving" ? 0.7 : 1,
              }}
            >
              {setupState === "saving" ? "Saving..." : "Continue"}
            </button>
            <Link href="/get-started" style={publicButtonStyle(false)}>
              See the setup path
            </Link>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  );
}