"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";
import CleanPathwayPracticePlayer from "@/app/components/clean/CleanPathwayPracticePlayer";
import {
  buildMiniCheckPlayerItems,
  buildPracticePlayerItems,
  countMiniCheckTasks,
  countPracticeTasks,
  type PathwayPracticeActivity,
  type PracticeOutcome,
  type PracticePlayerTaskItem,
} from "@/lib/clean/pathways/practiceActivities";

type CleanPathwayStepActionRowProps = {
  activity: PathwayPracticeActivity | null;
  assessHref: string;
  captureHref: string;
  practiceHref?: string | null;
  practiceTitle?: string | null;
  assessmentBankTitle?: string | null;
  exactAssessmentTitle?: string | null;
  autoCheckStatusLabel?: string | null;
  autoCheckStatusScope?: "bank" | "sub-element" | null;
  noAssessmentMessage?: string | null;
};

const buttonStyle: React.CSSProperties = {
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
  borderRadius: 9,
  padding: "8px 11px",
  fontSize: 13,
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
  opacity: 0.72,
  cursor: "default",
};

const chipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 999,
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 700,
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

export default function CleanPathwayStepActionRow({
  activity,
  assessHref,
  captureHref,
  practiceHref,
  practiceTitle,
  assessmentBankTitle,
  exactAssessmentTitle,
  autoCheckStatusLabel,
  autoCheckStatusScope,
  noAssessmentMessage,
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
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "stretch" }}>
        <div
          style={{
            flex: "1 1 100%",
            color: "#334155",
            fontSize: 13,
            fontWeight: 800,
            lineHeight: 1.4,
          }}
        >
          What would you like to do next?
        </div>
        {assessmentBankTitle ? (
          <div
            style={{
              flex: "1 1 100%",
              border: "1px solid #dbeafe",
              borderRadius: 12,
              background: "#f8fbff",
              padding: "9px 11px",
              display: "grid",
              gap: 4,
              color: "#334155",
              fontSize: 13,
              lineHeight: 1.45,
            }}
          >
            <div>
              Auto-checked assessment:{" "}
              <strong style={{ color: "#0f172a" }}>
                {exactAssessmentTitle || assessmentBankTitle}
              </strong>
            </div>
            {practiceTitle ? (
              <div>
                Practice available:{" "}
                <strong style={{ color: "#0f172a" }}>{practiceTitle}</strong>
              </div>
            ) : null}
            {assessmentBankTitle && exactAssessmentTitle ? (
              <div>
                Part of: <strong style={{ color: "#0f172a" }}>{assessmentBankTitle}</strong>
              </div>
            ) : null}
            <div>
              Latest auto-check result:{" "}
              <strong style={{ color: "#0f172a" }}>
                {autoCheckStatusLabel || "Not checked yet"}
              </strong>
              {autoCheckStatusScope === "sub-element"
                ? " for this focus"
                : autoCheckStatusScope === "bank"
                  ? " for this bank"
                  : ""}
            </div>
            <div style={{ color: "#64748b" }}>
              Confidence has not been changed automatically.
            </div>
          </div>
        ) : noAssessmentMessage ? (
          <div
            style={{
              flex: "1 1 100%",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              background: "#ffffff",
              padding: "9px 11px",
              color: "#64748b",
              fontSize: 13,
              lineHeight: 1.45,
            }}
          >
            {noAssessmentMessage}
          </div>
        ) : null}
        {activity ? (
          <>
            {practiceHref ? (
              <Link
                href={practiceHref}
                style={{ ...buttonStyle, flex: "1 1 120px" }}
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
                type="button"
                onClick={openPracticePlayer}
                style={{ ...buttonStyle, flex: "1 1 120px" }}
                aria-label="Open practice for this pathway step"
              >
                {completedPracticeTaskCount ? "Resume practise" : "Practise"}
              </button>
            )}
            <button
              type="button"
              onClick={openMiniCheckPlayer}
              style={{ ...secondaryButtonStyle, flex: "1 1 120px" }}
              aria-label="Open mini check for this pathway step"
            >
              {completedMiniCheckCount ? "Resume mini-check" : "Mini-check"}
            </button>
          </>
        ) : practiceHref ? (
          <>
            <Link
              href={practiceHref}
              style={{ ...buttonStyle, flex: "1 1 120px" }}
              title={
                practiceTitle
                  ? `Practise ${practiceTitle}.`
                  : "Open exact practice for this pathway step."
              }
            >
              Practise
            </Link>
            <button
              type="button"
              style={{ ...disabledButtonStyle, flex: "1 1 120px" }}
              disabled
              title="Mini Check for this pathway step is coming later."
              aria-label="Mini Check for this pathway step is coming later"
            >
              Mini-check
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              style={{ ...disabledButtonStyle, flex: "1 1 120px" }}
              disabled
              title="CRA practice for this pathway step is coming later."
              aria-label="Practice for this pathway step is coming later"
            >
              Practise
            </button>
            <button
              type="button"
              style={{ ...disabledButtonStyle, flex: "1 1 120px" }}
              disabled
              title="Mini Check for this pathway step is coming later."
              aria-label="Mini Check for this pathway step is coming later"
            >
              Mini-check
            </button>
          </>
        )}

        {assessHref ? (
          <Link
            href={assessHref}
            style={{ ...secondaryButtonStyle, flex: "1 1 120px" }}
            title={
              exactAssessmentTitle
                ? `Uses the ${exactAssessmentTitle} step assessment.`
                : assessmentBankTitle
                ? `Uses the ${assessmentBankTitle} assessment family.`
                : "Check understanding for this pathway step."
            }
            aria-label="Assess this pathway step"
          >
            {exactAssessmentTitle ? "Assess" : "Check understanding"}
          </Link>
        ) : (
          <button
            type="button"
            style={{ ...disabledButtonStyle, flex: "1 1 120px" }}
            disabled
            title={noAssessmentMessage || "Assessment for this step is coming later."}
          aria-label="No auto-checked assessment is available for this pathway step"
        >
            Assess
          </button>
        )}
        <Link
          href={captureHref}
          style={{ ...buttonStyle, flex: "1 1 140px" }}
          title="Open My Capture with this pathway step already connected."
          aria-label="Capture evidence for this pathway step"
        >
          Capture evidence
        </Link>
      </div>

      {activity ? (
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span
              style={{
                ...chipStyle,
                border: "1px solid #dbeafe",
                background: "#f8fbff",
                color: "#1d4ed8",
              }}
            >
              {completedPracticeTaskCount}/{practiceTaskTotal} practice tasks
            </span>
            <span
              style={{
                ...chipStyle,
                border: "1px solid #ccfbf1",
                background: "#f0fdfa",
                color: "#0f766e",
              }}
            >
              {completedMiniCheckCount}/{miniCheckTaskTotal} mini check tasks
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
                Mini Check outcome:{" "}
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
                Mini Check outcome:
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
          title={`${activity.title} / Mini Check`}
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
