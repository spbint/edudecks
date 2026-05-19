"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";
import CleanAppHeader from "@/app/components/clean/CleanAppHeader";
import CleanFamilyWorkspaceProvider, {
  useCleanFamilyWorkspace,
} from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import { resolveCurriculumFrameworkMap } from "@/lib/clean/curriculum/frameworkMaps";

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "32px 20px 48px",
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
  display: "grid",
  gap: 20,
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  background: "#ffffff",
  padding: 20,
  boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
};

const helperCardStyle: React.CSSProperties = {
  border: "1px solid #dbeafe",
  borderRadius: 16,
  background: "#f8fbff",
  padding: 16,
  display: "grid",
  gap: 8,
};

const compactCardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  background: "#f8fafc",
  padding: 16,
  display: "grid",
  gap: 8,
};

const summaryCardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  background: "#ffffff",
  padding: 16,
  display: "grid",
  gap: 8,
  boxShadow: "0 6px 18px rgba(15,23,42,0.04)",
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.08em",
  color: "#64748b",
  textTransform: "uppercase",
};

const buttonStyle: React.CSSProperties = {
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 700,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
};

const disabledButtonStyle: React.CSSProperties = {
  ...secondaryButtonStyle,
  cursor: "default",
  opacity: 0.72,
};

const ASSESSMENT_STAGES = [
  "Foundation",
  "Lower Primary",
  "Middle Primary",
  "Upper Primary",
  "Lower Secondary",
] as const;

const ASSESSMENT_STATUSES = [
  "Not assessed yet",
  "Still developing",
  "Developing",
  "Secure",
  "Strong",
] as const;

type AssessmentStage = (typeof ASSESSMENT_STAGES)[number];
type AssessmentStatus = (typeof ASSESSMENT_STATUSES)[number];
type AssessmentSubjectKey = "mathematics" | "english";

type AssessmentSkillRow = {
  skillArea: string;
  stages: Record<AssessmentStage, AssessmentStatus>;
};

type AssessmentSubject = {
  key: AssessmentSubjectKey;
  title: string;
  helper: string;
  rows: AssessmentSkillRow[];
  prototypeCopy: string;
};

type StatusMeta = {
  fill: string;
  border: string;
  text: string;
  dot: string;
  cellLabel: string;
  helper: string;
  scoringHint: string;
};

const STATUS_META: Record<AssessmentStatus, StatusMeta> = {
  "Not assessed yet": {
    fill: "#f8fafc",
    border: "#e2e8f0",
    text: "#64748b",
    dot: "#94a3b8",
    cellLabel: "Not assessed",
    helper: "No assessment recorded yet.",
    scoringHint: "Suggested later model: no assessment recorded",
  },
  "Still developing": {
    fill: "#f5f3ff",
    border: "#ddd6fe",
    text: "#6d28d9",
    dot: "#8b5cf6",
    cellLabel: "Still developing",
    helper: "Early understanding is still developing.",
    scoringHint: "Suggested later model: below 50%",
  },
  Developing: {
    fill: "#eff6ff",
    border: "#bfdbfe",
    text: "#1d4ed8",
    dot: "#3b82f6",
    cellLabel: "Developing",
    helper: "Confidence is starting to build.",
    scoringHint: "Suggested later model: 50-79%",
  },
  Secure: {
    fill: "#f0fdf4",
    border: "#bbf7d0",
    text: "#166534",
    dot: "#22c55e",
    cellLabel: "Secure",
    helper: "The skill is looking more settled.",
    scoringHint: "Suggested later model: 80%+",
  },
  Strong: {
    fill: "#fff7ed",
    border: "#fed7aa",
    text: "#c2410c",
    dot: "#f97316",
    cellLabel: "Strong",
    helper: "Repeated confidence or standout performance.",
    scoringHint: "Suggested later model: 90%+ or repeated secure result",
  },
};

function buildStageStatusMap(
  foundation: AssessmentStatus,
  lowerPrimary: AssessmentStatus,
  middlePrimary: AssessmentStatus,
  upperPrimary: AssessmentStatus,
  lowerSecondary: AssessmentStatus,
) {
  return {
    Foundation: foundation,
    "Lower Primary": lowerPrimary,
    "Middle Primary": middlePrimary,
    "Upper Primary": upperPrimary,
    "Lower Secondary": lowerSecondary,
  } satisfies Record<AssessmentStage, AssessmentStatus>;
}

const MATHEMATICS_ROWS: AssessmentSkillRow[] = [
  {
    skillArea: "Number sense",
    stages: buildStageStatusMap("Developing", "Secure", "Strong", "Secure", "Developing"),
  },
  {
    skillArea: "Place value",
    stages: buildStageStatusMap(
      "Still developing",
      "Developing",
      "Secure",
      "Secure",
      "Developing",
    ),
  },
  {
    skillArea: "Addition and subtraction",
    stages: buildStageStatusMap("Secure", "Secure", "Strong", "Secure", "Developing"),
  },
  {
    skillArea: "Multiplication and division",
    stages: buildStageStatusMap(
      "Not assessed yet",
      "Developing",
      "Secure",
      "Developing",
      "Still developing",
    ),
  },
  {
    skillArea: "Fractions",
    stages: buildStageStatusMap(
      "Not assessed yet",
      "Still developing",
      "Developing",
      "Secure",
      "Developing",
    ),
  },
  {
    skillArea: "Decimals and percentages",
    stages: buildStageStatusMap(
      "Not assessed yet",
      "Not assessed yet",
      "Developing",
      "Secure",
      "Still developing",
    ),
  },
  {
    skillArea: "Measurement",
    stages: buildStageStatusMap("Developing", "Secure", "Developing", "Secure", "Developing"),
  },
  {
    skillArea: "Geometry / space",
    stages: buildStageStatusMap("Developing", "Developing", "Secure", "Secure", "Developing"),
  },
  {
    skillArea: "Data / statistics",
    stages: buildStageStatusMap(
      "Still developing",
      "Developing",
      "Developing",
      "Secure",
      "Developing",
    ),
  },
  {
    skillArea: "Mathematical modelling and problem solving",
    stages: buildStageStatusMap(
      "Not assessed yet",
      "Developing",
      "Developing",
      "Secure",
      "Strong",
    ),
  },
  {
    skillArea: "Reasoning and explanation",
    stages: buildStageStatusMap(
      "Still developing",
      "Developing",
      "Developing",
      "Secure",
      "Strong",
    ),
  },
];

const ENGLISH_ROWS: AssessmentSkillRow[] = [
  {
    skillArea: "Reading comprehension",
    stages: buildStageStatusMap("Developing", "Secure", "Secure", "Strong", "Secure"),
  },
  {
    skillArea: "Vocabulary",
    stages: buildStageStatusMap("Developing", "Developing", "Secure", "Secure", "Developing"),
  },
  {
    skillArea: "Spelling / word knowledge",
    stages: buildStageStatusMap(
      "Still developing",
      "Developing",
      "Secure",
      "Developing",
      "Still developing",
    ),
  },
  {
    skillArea: "Writing sentences",
    stages: buildStageStatusMap("Secure", "Secure", "Strong", "Secure", "Developing"),
  },
  {
    skillArea: "Writing paragraphs and texts",
    stages: buildStageStatusMap(
      "Not assessed yet",
      "Developing",
      "Developing",
      "Secure",
      "Strong",
    ),
  },
  {
    skillArea: "Grammar and punctuation",
    stages: buildStageStatusMap(
      "Not assessed yet",
      "Still developing",
      "Developing",
      "Secure",
      "Developing",
    ),
  },
  {
    skillArea: "Speaking and listening",
    stages: buildStageStatusMap("Developing", "Secure", "Secure", "Strong", "Secure"),
  },
  {
    skillArea: "Text response",
    stages: buildStageStatusMap(
      "Not assessed yet",
      "Developing",
      "Developing",
      "Secure",
      "Developing",
    ),
  },
];

const SUBJECTS: Record<AssessmentSubjectKey, AssessmentSubject> = {
  mathematics: {
    key: "mathematics",
    title: "My Mathematics",
    helper: "Number and core mathematical skills",
    rows: MATHEMATICS_ROWS,
    prototypeCopy: "This is a visual prototype. Assessment checks and saved results will come later.",
  },
  english: {
    key: "english",
    title: "My English",
    helper: "Reading, writing, language, and communication skills",
    rows: ENGLISH_ROWS,
    prototypeCopy: "This is a visual prototype. Assessment checks and saved results will come later.",
  },
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function splitCountryAndAuthorityLabels(countryAuthorityLabel: string, countryLabel: string) {
  const normalizedCountry = safe(countryLabel);
  const normalizedAuthority = safe(countryAuthorityLabel);

  if (
    !normalizedAuthority ||
    normalizedAuthority.toLowerCase() === normalizedCountry.toLowerCase()
  ) {
    return {
      countryLabel: normalizedCountry || "Not recorded in MyLearna yet.",
      authorityLabel: "Not recorded in MyLearna yet.",
    };
  }

  const prefix = `${normalizedCountry} / `;
  if (normalizedAuthority.startsWith(prefix)) {
    return {
      countryLabel: normalizedCountry || "Not recorded in MyLearna yet.",
      authorityLabel:
        normalizedAuthority.slice(prefix.length) || "Not recorded in MyLearna yet.",
    };
  }

  return {
    countryLabel: normalizedCountry || "Not recorded in MyLearna yet.",
    authorityLabel: normalizedAuthority,
  };
}

function buildStatusTotals(rows: AssessmentSkillRow[]) {
  return rows.reduce(
    (totals, row) => {
      ASSESSMENT_STAGES.forEach((stage) => {
        totals[row.stages[stage]] += 1;
      });

      return totals;
    },
    {
      "Not assessed yet": 0,
      "Still developing": 0,
      Developing: 0,
      Secure: 0,
      Strong: 0,
    } satisfies Record<AssessmentStatus, number>,
  );
}

function AssessmentsWorkspaceBody() {
  const workspace = useCleanFamilyWorkspace();
  const [selectedSubjectKey, setSelectedSubjectKey] =
    useState<AssessmentSubjectKey>("mathematics");

  const selectedSubject = SUBJECTS[selectedSubjectKey];
  const statusTotals = useMemo(
    () => buildStatusTotals(selectedSubject.rows),
    [selectedSubject.rows],
  );
  const resolvedFramework = useMemo(
    () => resolveCurriculumFrameworkMap(workspace.profile),
    [workspace.profile],
  );
  const frameworkDetails = useMemo(() => {
    if (
      !workspace.profile ||
      workspace.schemaMissing ||
      workspace.requiresFamilyCreation
    ) {
      return null;
    }

    const splitLabels = splitCountryAndAuthorityLabels(
      resolvedFramework.countryAuthorityLabel,
      resolvedFramework.map.countryLabel,
    );

    return {
      countryLabel: splitLabels.countryLabel,
      frameworkLabel: resolvedFramework.frameworkDisplayLabel,
      authorityLabel: splitLabels.authorityLabel,
      settingsHint:
        !safe(workspace.profile.countryCode) || !safe(workspace.profile.curriculumFrameworkId)
          ? "Framework details can be adjusted in My Settings."
          : resolvedFramework.settingsHint,
    };
  }, [
    resolvedFramework,
    workspace.profile,
    workspace.requiresFamilyCreation,
    workspace.schemaMissing,
  ]);

  return (
    <div style={shellStyle}>
      <div style={wrapStyle}>
        <CleanAppHeader />

        <section
          style={{
            ...cardStyle,
            padding: 24,
            background:
              "linear-gradient(180deg, rgba(248,251,255,1) 0%, rgba(255,255,255,1) 100%)",
          }}
        >
          <div style={{ display: "grid", gap: 18 }}>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={eyebrowStyle}>Assessment layer prototype</div>
              <h1 style={{ margin: 0, fontSize: 30, color: "#0f172a" }}>My Assessments</h1>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.7, fontSize: 16 }}>
                My Assessments will help families see how learners are developing across
                core skills in mathematics and English. This first view is a visual
                prototype of the assessment tracker.
              </p>
              <p style={{ margin: 0, color: "#64748b", lineHeight: 1.7 }}>
                Track assessed skill confidence across My Mathematics and My English
                using a universal skills framework that can later be mapped to major
                curriculum expectations.
              </p>
            </div>

            <div style={helperCardStyle}>
              <strong style={{ color: "#0f172a" }}>Framework positioning</strong>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                Built around a universal skills framework and designed to be crosswalked
                against major curriculum expectations, including the Australian
                Curriculum, UK National Curriculum, DoDEA-aligned US expectations, and
                selected US state standards.
              </p>
            </div>
          </div>
        </section>

        <section style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 18,
              alignItems: "flex-start",
              flexWrap: "wrap",
              marginBottom: 18,
            }}
          >
            <div style={{ display: "grid", gap: 8, maxWidth: 760 }}>
              <div style={eyebrowStyle}>Framework context</div>
              <h2 style={{ margin: 0, color: "#0f172a" }}>Assessment pathway context</h2>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                The goal is one MyLearna assessment pathway that can report against the
                framework selected in My Settings.
              </p>
            </div>

            <Link href="/my-settings" style={secondaryButtonStyle}>
              Open My Settings
            </Link>
          </div>

          {workspace.loading ? (
            <div style={helperCardStyle}>
              <strong style={{ color: "#0f172a" }}>Loading framework context...</strong>
              <div style={{ color: "#475569", lineHeight: 1.6 }}>
                My Assessments is checking the current family settings.
              </div>
            </div>
          ) : frameworkDetails ? (
            <div
              style={{
                display: "grid",
                gap: 14,
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              }}
            >
              <div style={compactCardStyle}>
                <div style={eyebrowStyle}>Country / region</div>
                <strong style={{ color: "#0f172a", fontSize: 16 }}>
                  {frameworkDetails.countryLabel}
                </strong>
              </div>
              <div style={compactCardStyle}>
                <div style={eyebrowStyle}>Curriculum framework</div>
                <strong style={{ color: "#0f172a", fontSize: 16 }}>
                  {frameworkDetails.frameworkLabel}
                </strong>
              </div>
              <div style={compactCardStyle}>
                <div style={eyebrowStyle}>Authority / jurisdiction</div>
                <strong style={{ color: "#0f172a", fontSize: 16 }}>
                  {frameworkDetails.authorityLabel}
                </strong>
              </div>
              <div style={helperCardStyle}>
                <strong style={{ color: "#0f172a" }}>Framework mapping note</strong>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  {frameworkDetails.settingsHint}
                </div>
              </div>
            </div>
          ) : (
            <div style={helperCardStyle}>
              <strong style={{ color: "#0f172a" }}>
                Framework details will connect to My Settings as this assessment layer develops.
              </strong>
              <div style={{ color: "#475569", lineHeight: 1.6 }}>
                The goal is one MyLearna assessment pathway that can report against the
                framework selected in My Settings.
              </div>
            </div>
          )}
        </section>

        <section style={cardStyle}>
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={eyebrowStyle}>Subject view</div>
              <h2 style={{ margin: 0, color: "#0f172a" }}>My Mathematics and My English</h2>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                Switch between the two prototype trackers to see how a universal
                assessment view could later sit alongside My Curriculum, My Reports, and
                My Outputs.
              </p>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {(Object.values(SUBJECTS) as AssessmentSubject[]).map((subject) => {
                const active = subject.key === selectedSubjectKey;

                return (
                  <button
                    key={subject.key}
                    type="button"
                    onClick={() => setSelectedSubjectKey(subject.key)}
                    aria-pressed={active}
                    style={{
                      border: active ? "1px solid #1d4ed8" : "1px solid #dbeafe",
                      background: active ? "#eff6ff" : "#ffffff",
                      color: active ? "#1d4ed8" : "#0f172a",
                      borderRadius: 14,
                      padding: "12px 16px",
                      cursor: "pointer",
                      display: "grid",
                      gap: 4,
                      minWidth: 190,
                      textAlign: "left",
                    }}
                  >
                    <strong style={{ fontSize: 16 }}>{subject.title}</strong>
                    <span style={{ color: active ? "#1d4ed8" : "#64748b", fontSize: 13 }}>
                      {subject.helper}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section style={cardStyle}>
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={eyebrowStyle}>Status legend</div>
              <h2 style={{ margin: 0, color: "#0f172a" }}>Parent-friendly assessment statuses</h2>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                This prototype uses calm language for assessed skill confidence. A later
                scoring model can sit behind the same tracker without changing how the
                page feels to families.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gap: 14,
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              }}
            >
              {ASSESSMENT_STATUSES.map((status) => {
                const meta = STATUS_META[status];

                return (
                  <article
                    key={status}
                    style={{
                      border: `1px solid ${meta.border}`,
                      borderRadius: 16,
                      background: meta.fill,
                      padding: 16,
                      display: "grid",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 999,
                          background: meta.dot,
                          border: `1px solid ${meta.border}`,
                          flexShrink: 0,
                        }}
                      />
                      <strong style={{ color: meta.text }}>{status}</strong>
                    </div>
                    <div style={{ color: "#475569", lineHeight: 1.6 }}>{meta.helper}</div>
                    <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>
                      {meta.scoringHint}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section style={cardStyle}>
          <div style={{ display: "grid", gap: 18 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                alignItems: "flex-start",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "grid", gap: 8, maxWidth: 760 }}>
                <div style={eyebrowStyle}>Visual tracker</div>
                <h2 style={{ margin: 0, color: "#0f172a" }}>{selectedSubject.title}</h2>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                  {selectedSubject.helper}. This first view uses static demo statuses only
                  so families can see how the tracker could feel before assessment checks
                  and saved results are introduced.
                </p>
              </div>

              <div style={{ ...helperCardStyle, minWidth: 240, maxWidth: 320 }}>
                <strong style={{ color: "#0f172a" }}>Prototype note</strong>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  {selectedSubject.prototypeCopy}
                </div>
                <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                  No assessment data is being saved in this prototype.
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 14,
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              }}
            >
              <div style={summaryCardStyle}>
                <div style={eyebrowStyle}>Skill areas</div>
                <strong style={{ color: "#0f172a", fontSize: 24 }}>
                  {selectedSubject.rows.length}
                </strong>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  Universal skill areas in this prototype view
                </div>
              </div>
              <div style={summaryCardStyle}>
                <div style={eyebrowStyle}>Stages</div>
                <strong style={{ color: "#0f172a", fontSize: 24 }}>
                  {ASSESSMENT_STAGES.length}
                </strong>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  Foundation to Lower Secondary
                </div>
              </div>
              <div style={summaryCardStyle}>
                <div style={eyebrowStyle}>Secure or strong</div>
                <strong style={{ color: "#0f172a", fontSize: 24 }}>
                  {statusTotals.Secure + statusTotals.Strong}
                </strong>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  Cells showing settled or stronger confidence
                </div>
              </div>
              <div style={summaryCardStyle}>
                <div style={eyebrowStyle}>Not assessed yet</div>
                <strong style={{ color: "#0f172a", fontSize: 24 }}>
                  {statusTotals["Not assessed yet"]}
                </strong>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  Areas where checks could be added later
                </div>
              </div>
            </div>

            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 18,
                background: "#f8fafc",
                padding: 14,
                overflowX: "auto",
              }}
            >
              <div style={{ minWidth: 920, display: "grid", gap: 10 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "240px repeat(5, minmax(120px, 1fr))",
                    gap: 10,
                    alignItems: "stretch",
                  }}
                >
                  <div
                    style={{
                      ...compactCardStyle,
                      position: "sticky",
                      left: 0,
                      zIndex: 2,
                      background: "#ffffff",
                    }}
                  >
                    <div style={eyebrowStyle}>Universal skill area</div>
                    <strong style={{ color: "#0f172a" }}>{selectedSubject.title}</strong>
                    <div style={{ color: "#64748b", lineHeight: 1.5 }}>
                      {selectedSubject.helper}
                    </div>
                  </div>

                  {ASSESSMENT_STAGES.map((stage) => (
                    <div
                      key={stage}
                      style={{
                        ...compactCardStyle,
                        alignContent: "center",
                        justifyItems: "start",
                        background: "#ffffff",
                      }}
                    >
                      <div style={eyebrowStyle}>Stage</div>
                      <strong style={{ color: "#0f172a", fontSize: 15 }}>{stage}</strong>
                    </div>
                  ))}
                </div>

                {selectedSubject.rows.map((row) => (
                  <div
                    key={row.skillArea}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "240px repeat(5, minmax(120px, 1fr))",
                      gap: 10,
                      alignItems: "stretch",
                    }}
                  >
                    <div
                      style={{
                        ...compactCardStyle,
                        position: "sticky",
                        left: 0,
                        zIndex: 1,
                        background: "#ffffff",
                        justifyContent: "center",
                      }}
                    >
                      <strong style={{ color: "#0f172a", fontSize: 15 }}>{row.skillArea}</strong>
                      <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
                        Universal skill area
                      </div>
                    </div>

                    {ASSESSMENT_STAGES.map((stage) => {
                      const status = row.stages[stage];
                      const meta = STATUS_META[status];

                      return (
                        <div
                          key={`${row.skillArea}-${stage}`}
                          style={{
                            border: `1px solid ${meta.border}`,
                            borderRadius: 16,
                            background: meta.fill,
                            padding: 14,
                            minHeight: 90,
                            display: "grid",
                            gap: 8,
                            alignContent: "start",
                            boxShadow: "0 4px 10px rgba(15,23,42,0.03)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            <span
                              aria-hidden="true"
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: 999,
                                background: meta.dot,
                                flexShrink: 0,
                              }}
                            />
                            <strong style={{ color: meta.text, fontSize: 13 }}>
                              {meta.cellLabel}
                            </strong>
                          </div>
                          <div style={{ color: "#475569", fontSize: 12, lineHeight: 1.5 }}>
                            {status}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section style={cardStyle}>
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={eyebrowStyle}>Coming later</div>
              <h2 style={{ margin: 0, color: "#0f172a" }}>Future assessment actions</h2>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                These are the next pieces planned for the assessment layer once the
                visual tracker is in place.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gap: 14,
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              }}
            >
              <article style={compactCardStyle}>
                <div style={eyebrowStyle}>Assessment checks</div>
                <strong style={{ color: "#0f172a", fontSize: 18 }}>
                  Start assessment checks
                </strong>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  Short skill checks will help update the tracker and create evidence for
                  reports.
                </div>
                <div>
                  <button type="button" style={disabledButtonStyle} disabled>
                    Coming later
                  </button>
                </div>
              </article>

              <article style={compactCardStyle}>
                <div style={eyebrowStyle}>Assessment exports</div>
                <strong style={{ color: "#0f172a", fontSize: 18 }}>
                  Assessment result exports
                </strong>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  Export assessment summaries that can support reports, curriculum
                  coverage, and portfolio review.
                </div>
                <div>
                  <button type="button" style={disabledButtonStyle} disabled>
                    Coming later
                  </button>
                </div>
              </article>

              <article style={compactCardStyle}>
                <div style={eyebrowStyle}>Framework mapping</div>
                <strong style={{ color: "#0f172a", fontSize: 18 }}>Framework crosswalk</strong>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  Assessment results will later be mapped to the selected curriculum
                  framework in My Settings.
                </div>
                <div>
                  <button type="button" style={disabledButtonStyle} disabled>
                    Coming later
                  </button>
                </div>
              </article>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function CleanAssessmentsWorkspace() {
  return (
    <CleanFamilyWorkspaceProvider>
      <AssessmentsWorkspaceBody />
    </CleanFamilyWorkspaceProvider>
  );
}
