"use client";

import React, { useMemo, useRef, useState } from "react";
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

export default function AssessmentPlayerV1({ title, items }: AssessmentPlayerV1Props) {
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [submittedResponse, setSubmittedResponse] = useState<MyLearnaAssessmentResponse | null>(null);
  const [responses, setResponses] = useState<MyLearnaAssessmentResponse[]>([]);
  const itemStartedAt = useRef(0);
  const currentItem = items[currentIndex] || null;
  const summary = useMemo(() => summarizeAssessmentAttempt(items, responses), [items, responses]);
  const complete =
    started &&
    !submittedResponse &&
    responses.length === items.length &&
    currentIndex >= items.length - 1 &&
    items.length > 0;

  if (!items.length) {
    return <section style={shellStyle}>No assessment items available.</section>;
  }

  if (!started) {
    return (
      <section style={shellStyle}>
        <div style={{ display: "grid", gap: 8 }}>
          <span style={{ color: "#6C4DF6", fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>
            MyLearna Assess V1
          </span>
          <h2 style={{ margin: 0, color: "#17204B", fontSize: "clamp(26px, 4vw, 38px)" }}>
            {title}
          </h2>
          <p style={{ margin: 0, color: "#5B6478", lineHeight: 1.6 }}>
            Internal proof of concept using structured items and deterministic visuals.
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
          Start assessment
        </button>
      </section>
    );
  }

  if (complete) {
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
            setSelectedOptionIds([]);
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

  return (
    <section style={shellStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <span style={{ color: "#6C4DF6", fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>
            Question {currentIndex + 1} of {items.length}
          </span>
          <strong style={{ color: "#17204B", fontSize: 18 }}>
            You&apos;re checking: {currentItem.skill.name}
          </strong>
        </div>
        <span style={{ color: "#64748b", fontSize: 13, fontWeight: 800 }}>
          {responses.length} of {items.length} complete
        </span>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        <h3 style={{ margin: 0, color: "#17204B", fontSize: "clamp(22px, 4vw, 30px)" }}>
          {currentItem.prompt}
        </h3>
        <AssessmentItemRenderer item={currentItem} />
      </div>

      <fieldset style={{ border: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
        <legend style={{ color: "#5B6478", fontSize: 14, fontWeight: 800, marginBottom: 4 }}>
          Choose one answer
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
                type="radio"
                name={`answer-${currentItem.id}`}
                checked={selected}
                disabled={Boolean(submittedResponse)}
                onChange={() => setSelectedOptionIds([option.id])}
                style={{ width: 20, height: 20, accentColor: "#6C4DF6" }}
              />
              {option.label}
            </label>
          );
        })}
      </fieldset>

      {submittedResponse ? (
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
      ) : null}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {!submittedResponse ? (
          <button
            type="button"
            disabled={!selectedOptionIds.length}
            onClick={() => {
              const response = scoreAssessmentItem(
                currentItem,
                selectedOptionIds,
                Math.max(
                  1,
                  Math.round((Date.now() - (itemStartedAt.current || Date.now())) / 1000),
                ),
              );
              setSubmittedResponse(response);
              setResponses((current) => [...current.filter((item) => item.itemId !== response.itemId), response]);
            }}
            style={{
              ...primaryButtonStyle,
              opacity: selectedOptionIds.length ? 1 : 0.55,
              cursor: selectedOptionIds.length ? "pointer" : "not-allowed",
            }}
          >
            Check answer
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setSubmittedResponse(null);
              setSelectedOptionIds([]);
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
