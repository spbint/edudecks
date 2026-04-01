"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import PublicSiteShell from "@/app/components/PublicSiteShell";

type SaveState = "idle" | "saving" | "success" | "error";

type FormState = {
  familyDisplayName: string;
  parentName: string;
  childName: string;
  childYearLabel: string;
  preferredMarket: "au" | "uk" | "us";
};

type ChildSeed = {
  id: string;
  name: string;
  yearLabel: string;
  evidenceCount: number;
  recentAreaCount: number;
  lastUpdated: string | null;
  strongestArea: string;
  nextFocusArea: string;
  status: "getting-started" | "building" | "ready" | "attention";
};

const CHILDREN_KEY = "edudecks_children_seed_v1";
const SETTINGS_KEY = "edudecks_family_settings_v1";
const ACTIVE_STUDENT_ID_KEY = "edudecks_active_student_id";

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function slugify(v: string) {
  return safe(v)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function cardStyle(): React.CSSProperties {
  return {
    border: "1px solid #e5e7eb",
    borderRadius: 22,
    background: "#ffffff",
    padding: 24,
    boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
  };
}

function helperCardStyle(): React.CSSProperties {
  return {
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    background: "#f8fafc",
    padding: 18,
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

function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    minHeight: 48,
    border: "1px solid #d1d5db",
    borderRadius: 14,
    padding: "0 14px",
    fontSize: 14,
    color: "#0f172a",
    background: "#ffffff",
    outline: "none",
  };
}

function textareaStyle(): React.CSSProperties {
  return {
    width: "100%",
    border: "1px solid #d1d5db",
    borderRadius: 14,
    padding: "12px 14px",
    fontSize: 14,
    color: "#0f172a",
    background: "#ffffff",
    outline: "none",
    resize: "vertical",
  };
}

function primaryButtonStyle(disabled = false): React.CSSProperties {
  return {
    width: "100%",
    minHeight: 48,
    borderRadius: 14,
    border: "1px solid #2563eb",
    background: disabled ? "#93c5fd" : "#2563eb",
    color: "#ffffff",
    fontSize: 15,
    fontWeight: 800,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.8 : 1,
  };
}

function secondaryButtonStyle(): React.CSSProperties {
  return {
    width: "100%",
    minHeight: 48,
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    color: "#0f172a",
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };
}

function pillStyle(
  bg: string,
  fg: string,
  border?: string
): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 30,
    padding: "0 10px",
    borderRadius: 999,
    background: bg,
    color: fg,
    border: `1px solid ${border || bg}`,
    fontSize: 12,
    fontWeight: 800,
    whiteSpace: "nowrap",
  };
}

function buildChildSeed(name: string, yearLabel: string): ChildSeed {
  const baseId = slugify(name) || `child-${Date.now()}`;
  return {
    id: `child-${baseId}`,
    name: safe(name),
    yearLabel: safe(yearLabel),
    evidenceCount: 0,
    recentAreaCount: 0,
    lastUpdated: null,
    strongestArea: "—",
    nextFocusArea: "Literacy",
    status: "getting-started",
  };
}

export default function OnboardingPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    familyDisplayName: "",
    parentName: "",
    childName: "",
    childYearLabel: "",
    preferredMarket: "au",
  });

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    let mounted = true;

    async function hydrateUser() {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data.user;

        if (!mounted || !user) return;

        const userName =
          safe(user.user_metadata?.full_name) ||
          safe(user.user_metadata?.name);

        const userMarket = safe(user.user_metadata?.preferred_market).toLowerCase();

        setForm((prev) => ({
          ...prev,
          parentName: prev.parentName || userName,
          preferredMarket:
            userMarket === "uk" || userMarket === "us" || userMarket === "au"
              ? (userMarket as "au" | "uk" | "us")
              : prev.preferredMarket,
        }));
      } catch {
        // non-blocking
      }
    }

    void hydrateUser();
    return () => {
      mounted = false;
    };
  }, []);

  const formReady = useMemo(() => {
    return (
      safe(form.parentName).length >= 2 &&
      safe(form.childName).length >= 2 &&
      safe(form.childYearLabel).length >= 2 &&
      safe(form.familyDisplayName).length >= 2
    );
  }, [form]);

  const previewChild = useMemo(
    () =>
      safe(form.childName) && safe(form.childYearLabel)
        ? buildChildSeed(form.childName, form.childYearLabel)
        : null,
    [form.childName, form.childYearLabel]
  );

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function persistProfile() {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user?.id) return;

    try {
      await supabase.from("profiles").upsert({
        id: user.id,
        full_name: safe(form.parentName),
        email: user.email || null,
        user_type: "family",
        onboarding_complete: true,
        preferred_market: form.preferredMarket,
        family_display_name: safe(form.familyDisplayName),
      });
    } catch {
      // non-blocking for now
    }

    try {
      await supabase.auth.updateUser({
        data: {
          full_name: safe(form.parentName),
          user_type: "family",
          onboarding_state: "complete",
          preferred_market: form.preferredMarket,
          family_display_name: safe(form.familyDisplayName),
        },
      });
    } catch {
      // non-blocking
    }
  }

  async function handleFinish(e: React.FormEvent) {
    e.preventDefault();

    if (!formReady) {
      setSaveState("error");
      setMessage("Just a couple of things to finish before we set up your family space.");
      return;
    }

    try {
      setSaveState("saving");
      setMessage("");

      const child = buildChildSeed(form.childName, form.childYearLabel);

      if (typeof window !== "undefined") {
        const children: ChildSeed[] = [child];
        window.localStorage.setItem(CHILDREN_KEY, JSON.stringify(children));
        window.localStorage.setItem(ACTIVE_STUDENT_ID_KEY, child.id);

        window.localStorage.setItem(
          SETTINGS_KEY,
          JSON.stringify({
            defaultChildId: child.id,
            autoOpenLastChild: true,
            showAuthorityGuidance: true,
            familyDisplayName: safe(form.familyDisplayName),
            preferredMarket: form.preferredMarket,
            onboardingComplete: true,
            parentName: safe(form.parentName),
          })
        );
      }

      await persistProfile();

      setSaveState("success");
      setMessage("Your EduDecks family space is ready. Taking you to your dashboard now…");

      window.setTimeout(() => {
        router.push("/family");
      }, 800);
    } catch (err: any) {
      setSaveState("error");
      setMessage(
        String(
          err?.message ||
            err ||
            "We couldn’t finish your setup just yet — please try again."
        )
      );
    }
  }

  return (
    <PublicSiteShell
      eyebrow="Onboarding"
      heroTitle="Let’s set up your family space"
      heroText="You only need a few details to begin. Add your family name, your first child, and a rough curriculum market — the rest can grow later."
      heroBadges={["Family-first", "Simple setup", "Start small", "Grow later"]}
      primaryCta={{ label: "Back to sign in", href: "/login" }}
      secondaryCta={{ label: "Start free", href: "/start-free" }}
      asideTitle="This does not need to be perfect"
      asideText="Most families begin with one child and a rough year level. You can refine everything else later as the real learning record grows."
    >
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1.05fr) minmax(320px,0.95fr)",
          gap: 22,
          alignItems: "start",
        }}
      >
        <div style={cardStyle()}>
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <span
              style={pillStyle(
                step >= 1 ? "#eff6ff" : "#f8fafc",
                step >= 1 ? "#1d4ed8" : "#64748b",
                step >= 1 ? "#bfdbfe" : "#e5e7eb"
              )}
            >
              1. Family
            </span>
            <span
              style={pillStyle(
                step >= 2 ? "#eff6ff" : "#f8fafc",
                step >= 2 ? "#1d4ed8" : "#64748b",
                step >= 2 ? "#bfdbfe" : "#e5e7eb"
              )}
            >
              2. Child
            </span>
            <span
              style={pillStyle(
                step >= 3 ? "#eff6ff" : "#f8fafc",
                step >= 3 ? "#1d4ed8" : "#64748b",
                step >= 3 ? "#bfdbfe" : "#e5e7eb"
              )}
            >
              3. Ready
            </span>
          </div>

          <div
            style={{
              fontSize: 26,
              lineHeight: 1.15,
              fontWeight: 900,
              color: "#0f172a",
              marginBottom: 8,
            }}
          >
            Set up your first EduDecks family space
          </div>

          <div
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: "#475569",
              marginBottom: 18,
              maxWidth: 720,
            }}
          >
            This first setup is intentionally light. It is enough to get you into
            your dashboard and ready to capture your first real learning moment.
          </div>

          <form onSubmit={handleFinish} style={{ display: "grid", gap: 18 }}>
            <div
              style={{
                border: step === 1 ? "1px solid #bfdbfe" : "1px solid #e5e7eb",
                background: step === 1 ? "#eff6ff" : "#ffffff",
                borderRadius: 18,
                padding: 18,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  lineHeight: 1.2,
                  fontWeight: 800,
                  letterSpacing: 1.05,
                  textTransform: "uppercase",
                  color: step === 1 ? "#1d4ed8" : "#64748b",
                  marginBottom: 8,
                }}
              >
                Step 1
              </div>

              <div
                style={{
                  fontSize: 18,
                  lineHeight: 1.2,
                  fontWeight: 900,
                  color: "#0f172a",
                  marginBottom: 12,
                }}
              >
                Family details
              </div>

              <div style={{ display: "grid", gap: 14 }}>
                <div>
                  <label style={labelStyle()}>Family display name</label>
                  <input
                    value={form.familyDisplayName}
                    onChange={(e) => updateField("familyDisplayName", e.target.value)}
                    placeholder="e.g. The Smith Family"
                    style={inputStyle()}
                    disabled={saveState === "saving"}
                    onFocus={() => setStep(1)}
                  />
                </div>

                <div>
                  <label style={labelStyle()}>Parent or caregiver name</label>
                  <input
                    value={form.parentName}
                    onChange={(e) => updateField("parentName", e.target.value)}
                    placeholder="Enter your name"
                    style={inputStyle()}
                    disabled={saveState === "saving"}
                    onFocus={() => setStep(1)}
                  />
                </div>

                <div>
                  <label style={labelStyle()}>Curriculum market</label>
                  <select
                    value={form.preferredMarket}
                    onChange={(e) =>
                      updateField(
                        "preferredMarket",
                        e.target.value as "au" | "uk" | "us"
                      )
                    }
                    style={inputStyle()}
                    disabled={saveState === "saving"}
                    onFocus={() => setStep(1)}
                  >
                    <option value="au">Australia</option>
                    <option value="uk">United Kingdom</option>
                    <option value="us">United States</option>
                  </select>
                </div>
              </div>
            </div>

            <div
              style={{
                border: step === 2 ? "1px solid #bfdbfe" : "1px solid #e5e7eb",
                background: step === 2 ? "#eff6ff" : "#ffffff",
                borderRadius: 18,
                padding: 18,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  lineHeight: 1.2,
                  fontWeight: 800,
                  letterSpacing: 1.05,
                  textTransform: "uppercase",
                  color: step === 2 ? "#1d4ed8" : "#64748b",
                  marginBottom: 8,
                }}
              >
                Step 2
              </div>

              <div
                style={{
                  fontSize: 18,
                  lineHeight: 1.2,
                  fontWeight: 900,
                  color: "#0f172a",
                  marginBottom: 12,
                }}
              >
                Add your first child
              </div>

              <div style={{ display: "grid", gap: 14 }}>
                <div>
                  <label style={labelStyle()}>Child name</label>
                  <input
                    value={form.childName}
                    onChange={(e) => updateField("childName", e.target.value)}
                    placeholder="Enter your child’s name"
                    style={inputStyle()}
                    disabled={saveState === "saving"}
                    onFocus={() => setStep(2)}
                  />
                </div>

                <div>
                  <label style={labelStyle()}>Year level or stage</label>
                  <input
                    value={form.childYearLabel}
                    onChange={(e) => updateField("childYearLabel", e.target.value)}
                    placeholder="e.g. Year 4, Grade 3, Foundation"
                    style={inputStyle()}
                    disabled={saveState === "saving"}
                    onFocus={() => setStep(2)}
                  />
                </div>

                <div>
                  <label style={labelStyle()}>Why this is enough</label>
                  <textarea
                    value={
                      "One child and one year label are enough to get your dashboard, capture flow, and first reporting journey started."
                    }
                    readOnly
                    rows={3}
                    style={{
                      ...textareaStyle(),
                      background: "#f8fafc",
                      color: "#475569",
                    }}
                  />
                </div>
              </div>
            </div>

            <div
              style={{
                border: step === 3 ? "1px solid #bfdbfe" : "1px solid #e5e7eb",
                background: step === 3 ? "#eff6ff" : "#ffffff",
                borderRadius: 18,
                padding: 18,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  lineHeight: 1.2,
                  fontWeight: 800,
                  letterSpacing: 1.05,
                  textTransform: "uppercase",
                  color: step === 3 ? "#1d4ed8" : "#64748b",
                  marginBottom: 8,
                }}
              >
                Step 3
              </div>

              <div
                style={{
                  fontSize: 18,
                  lineHeight: 1.2,
                  fontWeight: 900,
                  color: "#0f172a",
                  marginBottom: 12,
                }}
              >
                Finish and open your dashboard
              </div>

              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: "#475569",
                  marginBottom: 14,
                }}
              >
                Once this setup is saved, you’ll land in your family dashboard and
                be ready to capture your first learning moment.
              </div>

              {message ? (
                <div
                  style={{
                    border:
                      saveState === "success"
                        ? "1px solid #86efac"
                        : saveState === "error"
                        ? "1px solid #fecaca"
                        : "1px solid #e5e7eb",
                    background:
                      saveState === "success"
                        ? "#ecfdf5"
                        : saveState === "error"
                        ? "#fff1f2"
                        : "#f8fafc",
                    color:
                      saveState === "success"
                        ? "#166534"
                        : saveState === "error"
                        ? "#9f1239"
                        : "#334155",
                    borderRadius: 14,
                    padding: 14,
                    fontSize: 14,
                    fontWeight: 700,
                    lineHeight: 1.6,
                    marginBottom: 14,
                  }}
                >
                  {message}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={!formReady || saveState === "saving"}
                style={primaryButtonStyle(!formReady || saveState === "saving")}
                onMouseEnter={() => setStep(3)}
              >
                {saveState === "saving"
                  ? "Setting up your family space…"
                  : formReady
                  ? "Finish setup"
                  : "Complete the form to continue"}
              </button>

              <div
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  lineHeight: 1.6,
                  color: "#64748b",
                  fontWeight: 700,
                  textAlign: "center",
                }}
              >
                You can refine everything else later. This is just enough to begin.
              </div>
            </div>
          </form>
        </div>

        <div style={{ display: "grid", gap: 18 }}>
          <div style={helperCardStyle()}>
            <div
              style={{
                fontSize: 12,
                lineHeight: 1.2,
                fontWeight: 800,
                letterSpacing: 1.05,
                textTransform: "uppercase",
                color: "#64748b",
                marginBottom: 8,
              }}
            >
              What your setup creates
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {[
                "A family dashboard to guide your next step",
                "A first child profile to anchor captures and reports",
                "A saved family preference for your curriculum market",
                "A calm starting point instead of a heavy setup process",
              ].map((item, index) => (
                <div
                  key={item}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "28px minmax(0,1fr)",
                    gap: 10,
                    alignItems: "start",
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 999,
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 900,
                    }}
                  >
                    {index + 1}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      lineHeight: 1.6,
                      color: "#334155",
                      fontWeight: 700,
                    }}
                  >
                    {item}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={helperCardStyle()}>
            <div
              style={{
                fontSize: 18,
                lineHeight: 1.2,
                fontWeight: 900,
                color: "#0f172a",
                marginBottom: 10,
              }}
            >
              Preview of your first child
            </div>

            {previewChild ? (
              <div
                style={{
                  border: "1px solid #bfdbfe",
                  background: "#eff6ff",
                  borderRadius: 16,
                  padding: 16,
                  display: "grid",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    color: "#0f172a",
                  }}
                >
                  {previewChild.name}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: "#475569",
                    lineHeight: 1.6,
                  }}
                >
                  {previewChild.yearLabel} • Getting started
                </div>
                <div
                  style={{
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: "#334155",
                  }}
                >
                  This child will be ready for the first learning capture as soon as setup finishes.
                </div>
              </div>
            ) : (
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  background: "#ffffff",
                  borderRadius: 16,
                  padding: 16,
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: "#475569",
                }}
              >
                Add your child’s name and year level to preview the first profile.
              </div>
            )}
          </div>

          <div style={helperCardStyle()}>
            <div
              style={{
                fontSize: 18,
                lineHeight: 1.2,
                fontWeight: 900,
                color: "#0f172a",
                marginBottom: 10,
              }}
            >
              You can keep this simple
            </div>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.7,
                color: "#475569",
              }}
            >
              You do not need every child, every setting, or every curriculum
              detail ready today. EduDecks works best when you begin with what is
              real and useful right now.
            </div>
          </div>

          <div style={helperCardStyle()}>
            <div
              style={{
                fontSize: 18,
                lineHeight: 1.2,
                fontWeight: 900,
                color: "#0f172a",
                marginBottom: 10,
              }}
            >
              Need to go back?
            </div>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.7,
                color: "#475569",
                marginBottom: 14,
              }}
            >
              You can return to sign in or start-free if you want to review the
              path before continuing.
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <Link href="/login" style={secondaryButtonStyle()}>
                Back to sign in
              </Link>
              <Link href="/start-free" style={secondaryButtonStyle()}>
                Back to start free
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  );
}