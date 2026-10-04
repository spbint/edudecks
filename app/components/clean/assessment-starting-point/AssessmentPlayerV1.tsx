"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type {
  MyLearnaAssessmentItem,
  MyLearnaAssessmentResponse,
} from "@/lib/clean/assessments/mylearnaAssessTypes";
import {
  scoreAssessmentItem,
  summarizeAssessmentAttempt,
} from "@/lib/clean/assessments/mylearnaAssessScoring";
import { AssessmentStimulus } from "@/lib/clean/assessments/visualTemplates";

type AssessmentPlayerV1Props = {
  title: string;
  items: MyLearnaAssessmentItem[];
  mode?: "practice" | "placement";
  presentation?: "staff" | "parent";
  autoStart?: boolean;
  onUsePracticalObservation?: () => void;
  onComplete?: (responses: MyLearnaAssessmentResponse[]) => void;
};

const shellStyle: React.CSSProperties = {
  border: "1px solid #E7EAF2",
  borderRadius: 24,
  background: "#ffffff",
  padding: "clamp(18px, 4vw, 30px)",
  boxShadow: "0 18px 44px rgba(23,32,75,0.08)",
  display: "grid",
  gap: 20,
};

const primaryButtonStyle: React.CSSProperties = {
  border: "1px solid #6C4DF6",
  background: "#6C4DF6",
  color: "#ffffff",
  borderRadius: 14,
  minHeight: 46,
  padding: "10px 16px",
  fontSize: 15,
  fontWeight: 850,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  ...primaryButtonStyle,
  border: "1px solid #E7EAF2",
  background: "#ffffff",
  color: "#17204B",
};

function AssessmentItemRenderer({ item }: { item: MyLearnaAssessmentItem }) {
  return <AssessmentStimulus stimulus={item.stimulus} />;
}

export function getShortAnswerInputMode(
  item: MyLearnaAssessmentItem | null | undefined,
): React.InputHTMLAttributes<HTMLInputElement>["inputMode"] {
  if (!item || item.response.type !== "short-answer") return undefined;
  const canonical = String(item.response.correctValue ?? "").trim();
  const numericLike = /^[-+]?(?:\d{1,3}(?:,\d{3})*|\d+)?(?:\.\d+)?$/.test(
    canonical,
  );
  return numericLike ? "decimal" : "text";
}

export function requiresPracticalObservationAlternative(
  item: MyLearnaAssessmentItem | null | undefined,
) {
  return Boolean(
    item?.analytics?.tags?.some((tag) =>
      tag.includes("accessible-form-required"),
    ),
  );
}

function initialOptionOrder(item: MyLearnaAssessmentItem | null | undefined) {
  return item?.response.type === "ordering"
    ? (item.response.options || []).map((option) => option.id)
    : [];
}

function moveOrderedOption(
  current: string[],
  optionId: string,
  direction: -1 | 1,
) {
  const index = current.indexOf(optionId);
  if (index < 0) return current;
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= current.length) return current;

  const next = [...current];
  [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
  return next;
}


export default function AssessmentPlayerV1({
  title,
  items,
  mode = "practice",
  presentation = "staff",
  autoStart = false,
  onUsePracticalObservation,
  onComplete,
}: AssessmentPlayerV1Props) {
  const parentPresentation = presentation === "parent";
  const [started, setStarted] = useState(autoStart);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [textValue, setTextValue] = useState("");
  const [submittedResponse, setSubmittedResponse] = useState<MyLearnaAssessmentResponse | null>(null);
  const [responses, setResponses] = useState<MyLearnaAssessmentResponse[]>([]);
  const itemStartedAt = useRef(autoStart ? Date.now() : 0);
  const currentItem = items[currentIndex] || null;
  const summary = useMemo(() => summarizeAssessmentAttempt(items, responses), [items, responses]);
  const complete =
    started &&
    !submittedResponse &&
    responses.length === items.length &&
    currentIndex >= items.length - 1 &&
    items.length > 0;

  useEffect(() => {
    if (complete && !(parentPresentation && mode === "placement")) {
      onComplete?.(responses);
    }
  }, [complete, mode, onComplete, parentPresentation, responses]);

  useEffect(() => {
    if (!currentItem) return;
    setSelectedOptionIds(initialOptionOrder(currentItem));
    setTextValue("");
    setSubmittedResponse(null);
  }, [currentItem?.id]);

  if (!items.length) {
    return <section style={shellStyle}>No assessment items available.</section>;
  }

  if (!started) {
    return (
      <section style={shellStyle}>
        <div style={{ display: "grid", gap: 8 }}>
          <span style={{ color: "#6C4DF6", fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>
            {parentPresentation ? "Maths check" : "MyLearna Assess V1"}
          </span>
          <h2 style={{ margin: 0, color: "#17204B", fontSize: "clamp(26px, 4vw, 38px)" }}>
            {title}
          </h2>
          <p style={{ margin: 0, color: "#5B6478", lineHeight: 1.6 }}>
            {parentPresentation && mode === "placement"
              ? "Answer these questions as naturally as possible. MyLearna uses them to decide whether it has enough evidence or needs to ask a little more."
              : mode === "placement"
                ? "Placement-check mode records responses without showing correctness during the check."
                : "Internal proof of concept using structured items and deterministic visuals."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            itemStartedAt.current = Date.now();
            setStarted(true);
          }}
          style={primaryButtonStyle}
        >
          {parentPresentation ? "Start this area" : "Start assessment"}
        </button>
      </section>
    );
  }

  if (complete) {
    if (mode === "placement") {
      return (
        <section style={shellStyle}>
          <span style={{ color: "#2F9D68", fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>
            {parentPresentation ? "This set is complete" : "Check complete"}
          </span>
          <h2 style={{ margin: 0, color: "#17204B", fontSize: "clamp(24px, 4vw, 34px)" }}>
            {parentPresentation
              ? "MyLearna is deciding what evidence is useful next."
              : "Responses recorded for routing."}
          </h2>
          <p style={{ margin: 0, color: "#5B6478", lineHeight: 1.6 }}>
            {parentPresentation
              ? "No score is shown because this check is finding a starting point, not giving a test mark."
              : "No percentage or correctness feedback is shown in placement mode."}
          </p>
        </section>
      );
    }

    return (
      <section style={shellStyle}>
        <span style={{ color: "#2F9D68", fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>
          Assessment complete
        </span>
        <h2 style={{ margin: 0, color: "#17204B", fontSize: "clamp(24px, 4vw, 34px)" }}>
          You answered {summary.correctItems} of {summary.totalItems} correctly.
        </h2>
        <strong style={{ color: "#17204B", fontSize: 28 }}>{summary.percentage}%</strong>
        <div style={{ display: "grid", gap: 10 }}>
          {summary.skillSummaries.map((skill) => (
            <div key={skill.skillId} style={{ border: "1px solid #E7EAF2", borderRadius: 16, padding: 14 }}>
              <strong style={{ color: "#17204B" }}>{skill.skillName}</strong>
              <div style={{ color: "#5B6478", marginTop: 4 }}>
                {skill.correct} of {skill.total} correct
              </div>
            </div>
          ))}
        </div>
        <div style={{ border: "1px solid #D9D0FF", borderRadius: 16, background: "#F8F5FF", padding: 14 }}>
          <strong style={{ color: "#17204B" }}>Suggested next step</strong>
          <div style={{ color: "#5B6478", marginTop: 4 }}>{summary.suggestedNextStep}</div>
        </div>
        <button
          type="button"
          onClick={() => {
            setCurrentIndex(0);
            setResponses([]);
            setSubmittedResponse(null);
            setSelectedOptionIds(initialOptionOrder(items[0]));
            setTextValue("");
            itemStartedAt.current = Date.now();
          }}
          style={secondaryButtonStyle}
        >
          Run again
        </button>
      </section>
    );
  }

  if (!currentItem) return null;

  const selectedFeedback = currentItem.response.options?.find((option) =>
    selectedOptionIds.includes(option.id),
  )?.feedback;
  const isShortAnswer = currentItem.response.type === "short-answer";
  const isMultiSelect = currentItem.response.type === "multiple-choice";
  const isOrdering = currentItem.response.type === "ordering";
  const responseReady = isShortAnswer
    ? Boolean(textValue.trim())
    : isOrdering
      ? selectedOptionIds.length > 1 &&
        selectedOptionIds.length === (currentItem.response.options || []).length
      : Boolean(selectedOptionIds.length);

  return (
    <section style={shellStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <span style={{ color: "#6C4DF6", fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>
            {parentPresentation
              ? "Maths question"
              : `Question ${currentIndex + 1} of ${items.length}`}
          </span>
          {!parentPresentation ? (
            <strong style={{ color: "#17204B", fontSize: 18 }}>
              You&apos;re checking: {currentItem.skill.name}
            </strong>
          ) : null}
        </div>
        {!parentPresentation ? (
          <span style={{ color: "#64748b", fontSize: 13, fontWeight: 800 }}>
            {responses.length} of {items.length} complete
          </span>
        ) : null}
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        <h3 style={{ margin: 0, color: "#17204B", fontSize: "clamp(22px, 4vw, 30px)" }}>
          {currentItem.prompt}
        </h3>
        <AssessmentItemRenderer item={currentItem} />
      </div>

      {parentPresentation &&
      onUsePracticalObservation &&
      requiresPracticalObservationAlternative(currentItem) ? (
        <aside
          style={{
            border: "1px solid #F5D08A",
            borderRadius: 16,
            background: "#FFFDF5",
            padding: 14,
            display: "grid",
            gap: 8,
          }}
        >
          <strong style={{ color: "#92400E" }}>
            This question depends on seeing a visual collection.
          </strong>
          <span style={{ color: "#6B4F1D", lineHeight: 1.55 }}>
            If that visual is not accessible for your learner, MyLearna can leave
            this part open and use a practical observation instead. It will not
            guess a placement from inaccessible evidence.
          </span>
          <button
            type="button"
            onClick={onUsePracticalObservation}
            style={{
              ...secondaryButtonStyle,
              width: "fit-content",
            }}
          >
            Use a practical observation instead
          </button>
        </aside>
      ) : null}

      {isShortAnswer ? (
        <label style={{ display: "grid", gap: 8 }}>
          <span style={{ color: "#5B6478", fontSize: 14, fontWeight: 800 }}>Enter your answer</span>
          <input
            aria-label="Answer"
            value={textValue}
            disabled={Boolean(submittedResponse)}
            inputMode={getShortAnswerInputMode(currentItem)}
            autoComplete="off"
            onChange={(event) => setTextValue(event.target.value)}
            style={{
              minHeight: 52,
              border: "1px solid #CDD3E1",
              borderRadius: 14,
              padding: "10px 14px",
              color: "#17204B",
              fontSize: 20,
              fontWeight: 800,
              background: submittedResponse ? "#F8FAFC" : "#ffffff",
            }}
          />
        </label>
      ) : isOrdering ? (
        <div
          role="group"
          aria-label="Order these values"
          style={{ display: "grid", gap: 10 }}
        >
          <div style={{ color: "#5B6478", fontSize: 14, fontWeight: 800 }}>
            Put the values in order. Use the move controls; drag-and-drop is not required.
          </div>
          {selectedOptionIds.map((optionId, index) => {
            const option = currentItem.response.options?.find(
              (candidate) => candidate.id === optionId,
            );
            if (!option) return null;
            const label = option.label || String(option.value ?? "");
            return (
              <div
                key={option.id}
                style={{
                  border: "1px solid #E7EAF2",
                  borderRadius: 14,
                  background: "#ffffff",
                  padding: "10px 12px",
                  display: "grid",
                  gridTemplateColumns: "34px minmax(0, 1fr)",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <strong
                  aria-label={"Position " + (index + 1)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 999,
                    display: "grid",
                    placeItems: "center",
                    background: "#F3F0FF",
                    color: "#5B3BE8",
                  }}
                >
                  {index + 1}
                </strong>
                <span style={{ color: "#17204B", fontSize: 18, fontWeight: 850 }}>
                  {label}
                </span>
                <div
                  style={{
                    gridColumn: "1 / -1",
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                    paddingLeft: 44,
                  }}
                >
                  <button
                    type="button"
                    aria-label={"Move " + label + " up"}
                    disabled={Boolean(submittedResponse) || index === 0}
                    onClick={() =>
                      setSelectedOptionIds((current) =>
                        moveOrderedOption(current, option.id, -1),
                      )
                    }
                    style={secondaryButtonStyle}
                  >
                    Move up
                  </button>
                  <button
                    type="button"
                    aria-label={"Move " + label + " down"}
                    disabled={
                      Boolean(submittedResponse) ||
                      index === selectedOptionIds.length - 1
                    }
                    onClick={() =>
                      setSelectedOptionIds((current) =>
                        moveOrderedOption(current, option.id, 1),
                      )
                    }
                    style={secondaryButtonStyle}
                  >
                    Move down
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <fieldset style={{ border: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
          <legend style={{ color: "#5B6478", fontSize: 14, fontWeight: 800, marginBottom: 4 }}>
            {isMultiSelect ? "Select every answer that applies" : "Choose one answer"}
          </legend>
          {currentItem.response.options?.map((option) => {
            const selected = selectedOptionIds.includes(option.id);
            return (
              <label
                key={option.id}
                style={{
                  border: selected ? "2px solid #6C4DF6" : "1px solid #E7EAF2",
                  borderRadius: 16,
                  background: selected ? "#F8F5FF" : "#ffffff",
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  color: "#17204B",
                  fontSize: 18,
                  fontWeight: 850,
                  cursor: submittedResponse ? "default" : "pointer",
                }}
              >
                <input
                  type={isMultiSelect ? "checkbox" : "radio"}
                  name={`answer-${currentItem.id}`}
                  checked={selected}
                  disabled={Boolean(submittedResponse)}
                  onChange={() =>
                    setSelectedOptionIds((current) =>
                      isMultiSelect
                        ? current.includes(option.id)
                          ? current.filter((id) => id !== option.id)
                          : [...current, option.id]
                        : [option.id],
                    )
                  }
                  style={{ width: 20, height: 20, accentColor: "#6C4DF6" }}
                />
                {option.label}
              </label>
            );
          })}
        </fieldset>
      )}

      {submittedResponse ? (
        mode === "placement" ? (
          parentPresentation ? null : (
            <div
              role="status"
              style={{
                border: "1px solid #D9D0FF",
                borderRadius: 18,
                background: "#F8F5FF",
                padding: 16,
                color: "#17204B",
              }}
            >
              <strong>Response recorded.</strong>
            </div>
          )
        ) : (
          <div
            role="status"
            style={{
              border: submittedResponse.correct ? "1px solid #bbf7d0" : "1px solid #fed7aa",
              borderRadius: 18,
              background: submittedResponse.correct ? "#f0fdf4" : "#fff7ed",
              padding: 16,
              display: "grid",
              gap: 6,
            }}
          >
            <strong style={{ color: submittedResponse.correct ? "#166534" : "#c2410c" }}>
              {submittedResponse.correct ? currentItem.feedback.correct : currentItem.feedback.incorrect}
            </strong>
            {!submittedResponse.correct && currentItem.feedback.hint ? (
              <span style={{ color: "#5B6478" }}>{currentItem.feedback.hint}</span>
            ) : null}
            {selectedFeedback ? <span style={{ color: "#5B6478" }}>{selectedFeedback}</span> : null}
          </div>
        )
      ) : null}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {!submittedResponse ? (
          <button
            type="button"
            disabled={!responseReady}
            onClick={() => {
              const response = scoreAssessmentItem(
                currentItem,
                selectedOptionIds,
                Math.max(
                  1,
                  Math.round((Date.now() - (itemStartedAt.current || Date.now())) / 1000),
                ),
                isShortAnswer ? textValue : undefined,
              );
              const nextResponses = [
                ...responses.filter((item) => item.itemId !== response.itemId),
                response,
              ];
              setResponses(nextResponses);

              if (parentPresentation && mode === "placement") {
                if (currentIndex >= items.length - 1) {
                  setSubmittedResponse(null);
                  onComplete?.(nextResponses);
                } else {
                  setSubmittedResponse(null);
                  setSelectedOptionIds([]);
                  setTextValue("");
                  setCurrentIndex((current) =>
                    Math.min(items.length - 1, current + 1),
                  );
                  itemStartedAt.current = Date.now();
                }
                return;
              }

              setSubmittedResponse(response);
            }}
            style={{
              ...primaryButtonStyle,
              opacity: responseReady ? 1 : 0.55,
              cursor: responseReady ? "pointer" : "not-allowed",
            }}
          >
            {parentPresentation && mode === "placement"
              ? "Continue"
              : "Check answer"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setSubmittedResponse(null);
              setSelectedOptionIds([]);
              setTextValue("");
              setCurrentIndex((current) => Math.min(items.length - 1, current + 1));
              itemStartedAt.current = Date.now();
            }}
            style={primaryButtonStyle}
          >
            {currentIndex >= items.length - 1 ? "View summary" : "Next question"}
          </button>
        )}
      </div>
    </section>
  );
}
