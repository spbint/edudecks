"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type React from "react";
import {
  NUMBER_POWERS_ROOTS_PRACTICE_MODULE,
  getNumberPracticeModuleById,
  type NumberPracticeModule,
  type NumberPracticeSection,
  type NumberPracticeTask,
} from "@/lib/clean/practice/numberPowersRootsPracticeModules";
import { getNumberAssessmentBankByKey } from "@/lib/clean/assessments/numberAssessmentBanks";

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "clamp(18px, 4vw, 32px) clamp(12px, 4vw, 20px) 48px",
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 1120,
  margin: "0 auto",
  display: "grid",
  gap: 18,
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 20,
  background: "#ffffff",
  padding: "clamp(18px, 3vw, 24px)",
  boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
};

const highlightCardStyle: React.CSSProperties = {
  ...cardStyle,
  border: "1px solid #bfdbfe",
  background: "linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)",
};

const compactCardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  background: "#f8fafc",
  padding: 14,
  display: "grid",
  gap: 8,
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
  borderRadius: 12,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 800,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const secondaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
};

const chipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 999,
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 800,
  lineHeight: 1.2,
  border: "1px solid #dbeafe",
  background: "#eff6ff",
  color: "#1d4ed8",
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function buildSectionHref(moduleId: string, sectionId: string, sourceAssessmentBand: string, sourceSubElement: string) {
  const params = new URLSearchParams({ moduleId, sectionId });

  if (sourceAssessmentBand) {
    params.set("sourceAssessmentBand", sourceAssessmentBand);
  }

  if (sourceSubElement) {
    params.set("sourceSubElement", sourceSubElement);
  }

  return `/practice/number-targeted?${params.toString()}`;
}

function findSection(practiceModule: NumberPracticeModule, sectionId: string) {
  return (
    practiceModule.sections.find((section) => section.id === sectionId) || null
  );
}

function TaskCard({ task, index }: { task: NumberPracticeTask; index: number }) {
  return (
    <div style={compactCardStyle}>
      <div style={eyebrowStyle}>Task {index + 1}</div>
      <div style={{ color: "#0f172a", fontSize: 17, fontWeight: 800 }}>
        {task.title}
      </div>
      <div style={{ color: "#334155", lineHeight: 1.6 }}>{task.prompt}</div>
      {task.options?.length ? (
        <div style={{ display: "grid", gap: 6 }}>
          {task.options.map((option) => (
            <div
              key={option}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                background: "#ffffff",
                padding: "8px 10px",
                color: "#334155",
              }}
            >
              {option}
            </div>
          ))}
        </div>
      ) : null}
      {task.supportPrompt ? (
        <div style={{ color: "#475569", lineHeight: 1.5 }}>
          <strong>Support:</strong> {task.supportPrompt}
        </div>
      ) : null}
      {task.workedSolution ? (
        <details>
          <summary style={{ cursor: "pointer", fontWeight: 800, color: "#1e3a8a" }}>
            Show worked solution
          </summary>
          <div style={{ marginTop: 8, color: "#334155", lineHeight: 1.6 }}>
            {task.workedSolution}
          </div>
        </details>
      ) : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {task.misconceptionTargets.map((target) => (
          <span key={target} style={chipStyle}>
            {target}
          </span>
        ))}
      </div>
      {task.relatedAssessmentItemIds?.length ? (
        <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
          Related assessment items: {task.relatedAssessmentItemIds.join(", ")}
        </div>
      ) : null}
    </div>
  );
}

function SectionOverview({
  practiceModule,
  sourceAssessmentBand,
  sourceSubElement,
}: {
  practiceModule: NumberPracticeModule;
  sourceAssessmentBand: string;
  sourceSubElement: string;
}) {
  return (
    <div style={cardStyle}>
      <div style={eyebrowStyle}>Choose a practice section</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
          marginTop: 12,
        }}
      >
        {practiceModule.sections.map((section) => (
          <Link
            key={section.id}
            href={buildSectionHref(
              practiceModule.id,
              section.id,
              sourceAssessmentBand,
              sourceSubElement,
            )}
            style={{
              ...compactCardStyle,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div style={{ color: "#0f172a", fontWeight: 800 }}>
              {section.title}
            </div>
            <div style={{ color: "#475569", lineHeight: 1.5 }}>
              {section.learnerGoal}
            </div>
            <div style={{ color: "#1d4ed8", fontWeight: 800 }}>
              Open section
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SelectedSection({
  section,
}: {
  section: NumberPracticeSection;
}) {
  return (
    <div style={highlightCardStyle}>
      <div style={eyebrowStyle}>Recommended section</div>
      <h2 style={{ margin: 0, color: "#0f172a", fontSize: "clamp(24px, 4vw, 34px)" }}>
        {section.title}
      </h2>
      <div style={{ color: "#334155", lineHeight: 1.6, fontSize: 16 }}>
        {section.learnerGoal}
      </div>
      <div style={{ display: "grid", gap: 12, marginTop: 8 }}>
        {section.tasks.map((task, index) => (
          <TaskCard key={task.id} task={task} index={index} />
        ))}
      </div>
    </div>
  );
}

export default function CleanNumberTargetedPracticeViewer() {
  const searchParams = useSearchParams();
  const requestedModuleId = safe(searchParams.get("moduleId"));
  const requestedSectionId = safe(searchParams.get("sectionId"));
  const sourceAssessmentBand = safe(searchParams.get("sourceAssessmentBand"));
  const sourceSubElement = safe(searchParams.get("sourceSubElement"));
  const practiceModule =
    getNumberPracticeModuleById(requestedModuleId) ||
    (!requestedModuleId ? NUMBER_POWERS_ROOTS_PRACTICE_MODULE : null);
  const selectedSection = practiceModule && requestedSectionId
    ? findSection(practiceModule, requestedSectionId)
    : null;
  const sourceBank = sourceAssessmentBand
    ? getNumberAssessmentBankByKey(
        sourceAssessmentBand as Parameters<typeof getNumberAssessmentBankByKey>[0],
      )
    : null;
  const unsupportedModule = requestedModuleId && !practiceModule;

  return (
    <main style={shellStyle}>
      <div style={wrapStyle}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <Link href="/assessments/number-approximation-prototype" style={secondaryButtonStyle}>
            Return to assessment
          </Link>
        </div>

        {unsupportedModule ? (
          <div style={cardStyle}>
            <div style={eyebrowStyle}>Practice not connected</div>
            <h1 style={{ margin: "8px 0", color: "#0f172a" }}>
              This practice module is not connected yet.
            </h1>
            <div style={{ color: "#475569", lineHeight: 1.6 }}>
              The assessment recommendation was received, but this prototype only
              supports the Powers and roots practice module for now.
            </div>
          </div>
        ) : null}

        {practiceModule ? (
          <>
            <section style={cardStyle}>
              <div style={eyebrowStyle}>MyLearna targeted practice</div>
              <h1
                style={{
                  margin: "8px 0",
                  color: "#0f172a",
                  fontSize: "clamp(30px, 5vw, 46px)",
                  lineHeight: 1.05,
                }}
              >
                {practiceModule.title}
              </h1>
              <div style={{ color: "#334155", lineHeight: 1.7, fontSize: 16 }}>
                {practiceModule.description}
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 14,
                }}
              >
                <span style={chipStyle}>{practiceModule.subjectKey}</span>
                <span style={chipStyle}>{practiceModule.strandKey}</span>
                <span style={chipStyle}>{practiceModule.stageKey}</span>
                <span style={chipStyle}>{practiceModule.progressionBandKey}</span>
              </div>
              {sourceAssessmentBand || sourceSubElement ? (
                <div
                  style={{
                    marginTop: 14,
                    border: "1px solid #dbeafe",
                    borderRadius: 14,
                    background: "#f8fbff",
                    padding: 12,
                    color: "#334155",
                    lineHeight: 1.6,
                  }}
                >
                  Recommended from assessment
                  {sourceBank ? `: ${sourceBank.title}` : ""}
                  {sourceSubElement ? `, ${sourceSubElement}` : ""}.
                </div>
              ) : null}
            </section>

            <section style={highlightCardStyle}>
              <div style={eyebrowStyle}>Learn card</div>
              <div style={{ color: "#0f172a", fontWeight: 800, fontSize: 18 }}>
                {practiceModule.learnCard.bigIdea}
              </div>
              <div style={{ color: "#334155", lineHeight: 1.6 }}>
                <strong>Worked example:</strong>{" "}
                {practiceModule.learnCard.workedExample}
              </div>
              <div style={{ color: "#475569", lineHeight: 1.6 }}>
                <strong>Parent tip:</strong> {practiceModule.learnCard.parentTip}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {practiceModule.learnCard.keyLanguage.map((term) => (
                  <span key={term} style={chipStyle}>
                    {term}
                  </span>
                ))}
              </div>
            </section>

            {requestedSectionId && !selectedSection ? (
              <div style={cardStyle}>
                <div style={eyebrowStyle}>Section not found</div>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  That practice section is not connected yet. Choose another
                  section from the module overview.
                </div>
              </div>
            ) : null}

            {selectedSection ? (
              <SelectedSection section={selectedSection} />
            ) : (
              <SectionOverview
                practiceModule={practiceModule}
                sourceAssessmentBand={sourceAssessmentBand}
                sourceSubElement={sourceSubElement}
              />
            )}

            <section style={cardStyle}>
              <div style={eyebrowStyle}>Mini check preview</div>
              <div style={{ color: "#475569", lineHeight: 1.6 }}>
                After practice, use these mini-check prompts to see whether the
                focus is ready for reassessment.
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 10,
                  marginTop: 12,
                }}
              >
                {practiceModule.miniCheck.map((task, index) => (
                  <TaskCard key={task.id} task={task} index={index} />
                ))}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
