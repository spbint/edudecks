"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";
import CleanPathwayPracticePlayer from "@/app/components/clean/CleanPathwayPracticePlayer";
import WorksheetEvidenceCapture from "@/app/components/clean/pathways/WorksheetEvidenceCapture";
import {
  buildMiniCheckPlayerItems,
  buildPracticePlayerItems,
  countMiniCheckTasks,
  countPracticeTasks,
  type PathwayPracticeActivity,
  type PracticeOutcome,
  type PracticePlayerTaskItem,
} from "@/lib/clean/pathways/practiceActivities";
import type { MathWorksheetResource } from "@/lib/clean/resources/mathWorksheetResources";

type CleanPathwayStepActionRowProps = {
  activity: PathwayPracticeActivity | null;
  assessHref: string;
  captureHref: string;
  practiceHref?: string | null;
  practiceTitle?: string | null;
  familyId?: string;
  learnerId?: string;
  subjectKey?: string;
  subjectTitle?: string;
  strandKey?: string;
  strandTitle?: string;
  stageKey?: string;
  stageTitle?: string;
  pathwayStepId?: string;
  stepKey?: string;
  stepTitle?: string;
  assessmentBankTitle?: string | null;
  exactAssessmentTitle?: string | null;
  autoCheckStatusLabel?: string | null;
  autoCheckStatusScope?: "bank" | "sub-element" | null;
  confidenceStatusLabel?: string | null;
  isExactStepContext?: boolean;
  noAssessmentMessage?: string | null;
  worksheetResource?: MathWorksheetResource | null;
};

const buttonStyle: React.CSSProperties = {
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
  borderRadius: 10,
  padding: "7px 10px",
  fontSize: 13,
  fontWeight: 600,
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
  opacity: 0.72,
  cursor: "default",
};

const chipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 999,
  padding: "5px 9px",
  fontSize: 12,
  fontWeight: 600,
  lineHeight: 1.2,
};

function getCompletedCount(
  items: PracticePlayerTaskItem[],
  completedTaskIds: string[],
) {
  return items.filter((item) => completedTaskIds.includes(item.task.id)).length;
}

function getResumeIndex(
  items: PracticePlayerTaskItem[],
  completedTaskIds: string[],
  currentIndex: number,
) {
  if (!items.length) return 0;

  const currentItem = items[currentIndex];
  if (currentItem && !completedTaskIds.includes(currentItem.task.id)) {
    return currentIndex;
  }

  const firstIncompleteIndex = items.findIndex(
    (item) => !completedTaskIds.includes(item.task.id),
  );
  if (firstIncompleteIndex >= 0) {
    return firstIncompleteIndex;
  }

  return Math.max(0, items.length - 1);
}

function getCompactWorksheetFileName(fileName: string) {
  const stepCode = fileName.match(/S\d{3}/i)?.[0];
  return stepCode ? `${stepCode}.pdf` : fileName;
}

export default function CleanPathwayStepActionRow({
  activity,
  assessHref,
  captureHref,
  practiceHref,
  practiceTitle,
  familyId = "",
  learnerId = "",
  subjectKey = "",
  subjectTitle = "Mathematics",
  strandKey = "",
  strandTitle = "Mathematics",
  stageKey = "",
  stageTitle = "",
  pathwayStepId = "",
  stepKey = "",
  stepTitle = "",
  exactAssessmentTitle,
  isExactStepContext = false,
  worksheetResource,
}: CleanPathwayStepActionRowProps) {
  const practiceItems = useMemo(
    () => (activity ? buildPracticePlayerItems(activity) : []),
    [activity],
  );
  const miniCheckItems = useMemo(
    () => (activity ? buildMiniCheckPlayerItems(activity) : []),
    [activity],
  );
  const practiceTaskTotal = useMemo(
    () => (activity ? countPracticeTasks(activity) : 0),
    [activity],
  );
  const miniCheckTaskTotal = useMemo(
    () => (activity ? countMiniCheckTasks(activity) : 0),
    [activity],
  );

  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [practicePlayerOpen, setPracticePlayerOpen] = useState(false);
  const [miniCheckPlayerOpen, setMiniCheckPlayerOpen] = useState(false);
  const [practicePlayerIndex, setPracticePlayerIndex] = useState(0);
  const [miniCheckPlayerIndex, setMiniCheckPlayerIndex] = useState(0);
  const [hasVisitedMiniCheck, setHasVisitedMiniCheck] = useState(false);
  const [miniCheckOutcome, setMiniCheckOutcome] =
    useState<PracticeOutcome>("not_started");

  const completedPracticeTaskCount = getCompletedCount(practiceItems, completedTaskIds);
  const completedMiniCheckCount = getCompletedCount(miniCheckItems, completedTaskIds);

  function updateResponse(taskId: string, value: string) {
    setResponses((current) => ({
      ...current,
      [taskId]: value,
    }));
  }

  function markTaskComplete(taskId: string) {
    setCompletedTaskIds((current) =>
      current.includes(taskId) ? current : [...current, taskId],
    );
  }

  function openPracticePlayer() {
    if (!activity) return;
    setPracticePlayerIndex((current) =>
      getResumeIndex(practiceItems, completedTaskIds, current),
    );
    setPracticePlayerOpen(true);
  }

  function openMiniCheckPlayer() {
    if (!activity) return;
    setHasVisitedMiniCheck(true);
    setMiniCheckPlayerIndex((current) =>
      getResumeIndex(miniCheckItems, completedTaskIds, current),
    );
    setMiniCheckPlayerOpen(true);
  }

  function handlePracticeBack() {
    setPracticePlayerIndex((current) => Math.max(0, current - 1));
  }

  function handlePracticeNext() {
    const currentItem = practiceItems[practicePlayerIndex];
    if (!currentItem) return;

    markTaskComplete(currentItem.task.id);
    if (practicePlayerIndex >= practiceItems.length - 1) {
      setPracticePlayerOpen(false);
      return;
    }

    setPracticePlayerIndex((current) => current + 1);
  }

  function handleMiniCheckBack() {
    setMiniCheckPlayerIndex((current) => Math.max(0, current - 1));
  }

  function handleMiniCheckNext() {
    const currentItem = miniCheckItems[miniCheckPlayerIndex];
    if (!currentItem) return;

    markTaskComplete(currentItem.task.id);
    if (miniCheckPlayerIndex >= miniCheckItems.length - 1) {
      setMiniCheckPlayerOpen(false);
      return;
    }

    setMiniCheckPlayerIndex((current) => current + 1);
  }

  return (
    <>
      {worksheetResource ? (
        <WorksheetEvidenceCapture
          familyId={familyId}
          learnerId={learnerId}
          subjectKey={subjectKey}
          subjectTitle={subjectTitle}
          strandKey={strandKey}
          strandTitle={strandTitle}
          stageKey={stageKey}
          stageTitle={stageTitle}
          pathwayStepId={pathwayStepId || worksheetResource.pathwayStepId}
          stepKey={stepKey || worksheetResource.stepKey}
          stepTitle={stepTitle || worksheetResource.pathwayStepTitle || worksheetResource.title}
          worksheetResource={worksheetResource}
        />
      ) : null}

      <div
        data-guidance-id="pathways-practise-assess"
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          alignItems: "center",
          marginTop: worksheetResource ? 10 : 0,
        }}
      >
        {worksheetResource ? (
          <span
            style={{
              color: "#64748b",
              fontSize: 12,
              fontWeight: 800,
              marginRight: 2,
            }}
          >
            Optional digital tools:
          </span>
        ) : null}
        {activity ? (
          <>
            {practiceHref ? (
              <Link
                data-guidance-id="pathways-practise-button"
                href={practiceHref}
                style={{ ...buttonStyle, padding: "7px 10px", fontSize: 12 }}
                title={
                  practiceTitle
                    ? `Practise ${practiceTitle}.`
                    : "Open exact practice for this pathway step."
                }
              >
                Practise
              </Link>
            ) : (
              <button
                data-guidance-id="pathways-practise-button"
                type="button"
                onClick={openPracticePlayer}
                style={{ ...buttonStyle, padding: "7px 10px", fontSize: 12 }}
                aria-label="Open practice for this pathway step"
              >
                Practise
              </button>
            )}
            {!isExactStepContext ? (
              <button
                type="button"
                onClick={openMiniCheckPlayer}
                style={{ ...secondaryButtonStyle, padding: "7px 10px", fontSize: 12 }}
                aria-label="Open mini assessment for this pathway step"
              >
                Mini-assess
              </button>
            ) : null}
          </>
        ) : practiceHref ? (
          <>
            <Link
              data-guidance-id="pathways-practise-button"
              href={practiceHref}
              style={{ ...buttonStyle, padding: "7px 10px", fontSize: 12 }}
              title={
                practiceTitle
                  ? `Practise ${practiceTitle}.`
                  : "Practise this pathway step."
              }
            >
              Practise
            </Link>
            {!isExactStepContext ? (
              <button
                type="button"
                style={{ ...disabledButtonStyle, padding: "7px 10px", fontSize: 12 }}
                disabled
                title="Mini assessment for this pathway step is coming later."
                aria-label="Mini assessment for this pathway step is coming later"
              >
                Mini-assess
              </button>
            ) : null}
          </>
        ) : (
          <>
            <button
              type="button"
              style={{ ...disabledButtonStyle, padding: "7px 10px", fontSize: 12 }}
              disabled
              title="Practice is coming soon for this pathway step."
              aria-label="Practice is coming soon for this pathway step"
            >
              Practise
            </button>
            {!isExactStepContext ? (
              <button
                type="button"
                style={{ ...disabledButtonStyle, padding: "7px 10px", fontSize: 12 }}
                disabled
                title="Mini assessment for this pathway step is coming later."
                aria-label="Mini assessment for this pathway step is coming later"
              >
                Mini-assess
              </button>
            ) : null}
          </>
        )}

        {assessHref ? (
          <Link
            data-guidance-id="pathways-assess-button"
            href={assessHref}
            style={{ ...secondaryButtonStyle, padding: "7px 10px", fontSize: 12 }}
            title={
              exactAssessmentTitle
                ? `Assess understanding with ${exactAssessmentTitle}.`
                : "Assess understanding for this pathway step."
            }
            aria-label="Assess this pathway step"
          >
            {exactAssessmentTitle ? "Start assessment" : "Assess"}
          </Link>
        ) : (
          <button
            data-guidance-id="pathways-assess-button"
            type="button"
            style={{ ...disabledButtonStyle, padding: "7px 10px", fontSize: 12 }}
            disabled
            title="Assessment is coming soon for this step."
            aria-label="Assessment is coming soon for this pathway step"
          >
            Assess
          </button>
        )}
        <Link
          data-guidance-id="pathways-next-capture"
          href={captureHref}
          style={{ ...buttonStyle, padding: "7px 10px", fontSize: 12 }}
          title="Open My Capture with this pathway step already connected."
          aria-label="Capture evidence for this pathway step"
        >
          Capture
        </Link>
        {worksheetResource ? (
          <Link
            data-guidance-id="pathways-worksheet-button"
            href={worksheetResource.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              ...secondaryButtonStyle,
              padding: "7px 10px",
              fontSize: 12,
              gap: 6,
            }}
            title={`Open ${worksheetResource.fileName}`}
            aria-label={`Open worksheet for ${worksheetResource.title}`}
          >
            <span>Worksheet</span>
            <span style={{ color: "#64748b", fontWeight: 700 }}>
              {getCompactWorksheetFileName(worksheetResource.fileName)}
            </span>
          </Link>
        ) : null}
      </div>

      {activity ? (
        <details style={{ marginTop: 2 }}>
          <summary style={{ cursor: "pointer", color: "#64748b", fontSize: 12, fontWeight: 800 }}>
            Practice progress
          </summary>
          <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span
              style={{
                ...chipStyle,
                border: "1px solid #dbeafe",
                background: "#f8fbff",
                color: "#1d4ed8",
              }}
            >
              {completedPracticeTaskCount}/{practiceTaskTotal} practise tasks
            </span>
            <span
              style={{
                ...chipStyle,
                border: "1px solid #ccfbf1",
                background: "#f0fdfa",
                color: "#0f766e",
              }}
            >
              {completedMiniCheckCount}/{miniCheckTaskTotal} mini assessment tasks
            </span>
            {miniCheckOutcome !== "not_started" ? (
              <span
                style={{
                  ...chipStyle,
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  color: "#475569",
                }}
              >
                Mini assessment outcome:{" "}
                <strong style={{ color: "#0f172a", marginLeft: 6 }}>
                  {miniCheckOutcome === "needs_support"
                    ? "Needs support"
                    : miniCheckOutcome === "secure"
                      ? "Secure"
                      : "Developing"}
                </strong>
              </span>
            ) : null}
            </div>

            {hasVisitedMiniCheck ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ color: "#475569", fontSize: 12, fontWeight: 700 }}>
                Mini assessment outcome:
              </span>
              {([
                ["secure", "Secure"],
                ["developing", "Developing"],
                ["needs_support", "Needs support"],
              ] as const).map(([value, label]) => {
                const selected = miniCheckOutcome === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMiniCheckOutcome(value)}
                    style={{
                      border: `1px solid ${selected ? "#0f172a" : "#cbd5e1"}`,
                      background: selected ? "#0f172a" : "#ffffff",
                      color: selected ? "#ffffff" : "#0f172a",
                      borderRadius: 999,
                      padding: "7px 10px",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
              </div>
            ) : null}
          </div>
        </details>
      ) : null}

      {activity ? (
        <CleanPathwayPracticePlayer
          open={practicePlayerOpen}
          mode="practice"
          title={activity.title}
          items={practiceItems}
          currentIndex={practicePlayerIndex}
          responses={responses}
          completedTaskIds={completedTaskIds}
          onClose={() => setPracticePlayerOpen(false)}
          onBack={handlePracticeBack}
          onNext={handlePracticeNext}
          onResponseChange={updateResponse}
        />
      ) : null}

      {activity ? (
        <CleanPathwayPracticePlayer
          open={miniCheckPlayerOpen}
          mode="mini_check"
          title={`${activity.title} / Mini Assessment`}
          items={miniCheckItems}
          currentIndex={miniCheckPlayerIndex}
          responses={responses}
          completedTaskIds={completedTaskIds}
          onClose={() => setMiniCheckPlayerOpen(false)}
          onBack={handleMiniCheckBack}
          onNext={handleMiniCheckNext}
          onResponseChange={updateResponse}
        />
      ) : null}
    </>
  );
}
