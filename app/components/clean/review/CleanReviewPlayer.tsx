"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  checkActivityV5Answer,
} from "@/app/components/clean/activity-player-v5/answerChecking";
import {
  formatMyReviewV5Response,
  myReviewQuestionToActivityV5,
} from "@/app/components/clean/activity-player-v5/adapters/myReviewV5Adapter";
import { ActivityV5InteractionRenderer } from "@/app/components/clean/activity-player-v5/interactionRenderers";
import type {
  ActivityV5CheckResult,
  ActivityV5ResponseState,
} from "@/app/components/clean/activity-player-v5/types";
import { v2Tokens } from "@/app/components/clean/design-v2/MyLearnaAppShellV2";
import {
  checkMathsReviewAnswer,
  type MathsReviewQuestion,
  type MathsReviewVisualMetadata,
} from "@/lib/clean/review/mathsReviewGenerator";

export type MathsReviewPlayerResult = {
  question: MathsReviewQuestion;
  response: string;
  correct: boolean;
};

type PlayerMode = "learner" | "display";

type CleanReviewPlayerProps = {
  questions: MathsReviewQuestion[];
  onExit: () => void;
  onReviewAgain: () => void;
};

const neutralButtonStyle: React.CSSProperties = {
  minHeight: 44,
  borderRadius: 999,
  border: `1px solid ${v2Tokens.border}`,
  background: "#FFFFFF",
  color: v2Tokens.navy,
  fontWeight: 800,
  padding: "10px 16px",
  cursor: "pointer",
};

const primaryButtonStyle: React.CSSProperties = {
  ...neutralButtonStyle,
  border: 0,
  background: v2Tokens.purple,
  color: "#FFFFFF",
  boxShadow: "0 14px 28px rgba(108,77,246,0.18)",
};

function getDisplayParts(question: MathsReviewQuestion) {
  const prompt = question.prompt.trim();
  const patterns: Array<[RegExp, (match: RegExpMatchArray) => { lead: string; problem: string }]> = [
    [/^What number comes one after (-?\d+)\?$/i, (match) => ({ lead: "What number comes one after?", problem: match[1] })],
    [/^What number comes one before (-?\d+)\?$/i, (match) => ({ lead: "What number comes one before?", problem: match[1] })],
    [/^What number is (.+) (-?\d+)\?$/i, (match) => ({ lead: `What number is ${match[1]}?`, problem: match[2] })],
    [/^Double (-?\d+)\.$/i, (match) => ({ lead: "Double", problem: match[1] })],
    [/^Halve (-?\d+)\.$/i, (match) => ({ lead: "Halve", problem: match[1] })],
    [/^Is (-?\d+) odd or even\?$/i, (match) => ({ lead: "Odd or even?", problem: match[1] })],
    [/^(.+) = \?$/i, (match) => ({ lead: "Find the answer.", problem: match[1] })],
  ];

  for (const [pattern, build] of patterns) {
    const match = prompt.match(pattern);
    if (match) return build(match);
  }

  return { lead: prompt, problem: "" };
}

function resultForQuestion(results: MathsReviewPlayerResult[], question: MathsReviewQuestion) {
  return results.find((result) => result.question.id === question.id) ?? null;
}

function hasV5Response(response: ActivityV5ResponseState) {
  return Boolean(
    response.numberLineValue !== undefined ||
      response.rows !== undefined ||
      response.columns !== undefined ||
      response.hundreds !== undefined ||
      response.tens !== undefined ||
      response.ones !== undefined ||
      response.shadedParts !== undefined ||
      response.denominator !== undefined ||
      response.measuredLength !== undefined ||
      response.hour !== undefined ||
      response.minute !== undefined ||
      response.moneyTotal !== undefined ||
      response.selectedBalance !== undefined ||
      response.unknownValue !== undefined ||
      response.leftTotal !== undefined ||
      response.rightTotal !== undefined ||
      response.selectedObjectIds?.length ||
      response.plottedCoordinates?.length,
  );
}

function ReviewVisualModel({ visual }: { visual?: MathsReviewVisualMetadata }) {
  if (!visual) return null;

  const boardStyle: React.CSSProperties = {
    width: "min(680px, 100%)",
    margin: "0 auto",
    border: `1px solid ${v2Tokens.border}`,
    borderRadius: 24,
    background: "#F8FAFC",
    padding: 18,
    display: "grid",
    gap: 12,
    justifyItems: "center",
  };

  if (visual.visualModel === "ten_frame") {
    const filled = Math.max(0, Math.min(10, Number(visual.targetValue ?? 0)));
    return (
      <div style={boardStyle} aria-label="Ten frame visual">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 54px)", gap: 8 }}>
          {Array.from({ length: 10 }, (_, index) => (
            <span
              key={index}
              style={{
                width: 54,
                height: 54,
                borderRadius: 14,
                border: `2px solid ${v2Tokens.navy}`,
                background: index < filled ? v2Tokens.purple : "#FFFFFF",
              }}
            />
          ))}
        </div>
        <span style={{ color: v2Tokens.slate, fontSize: 13, fontWeight: 800 }}>{visual.note}</span>
      </div>
    );
  }

  if (visual.visualModel === "array_board") {
    const rows = Math.max(1, Math.min(12, visual.rows ?? 3));
    const columns = Math.max(1, Math.min(12, visual.columns ?? 4));
    return (
      <div style={boardStyle} aria-label="Array visual">
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 28px)`, gap: 7 }}>
          {Array.from({ length: rows * columns }, (_, index) => (
            <span key={index} style={{ width: 28, height: 28, borderRadius: 9, background: v2Tokens.purple }} />
          ))}
        </div>
        <span style={{ color: v2Tokens.slate, fontSize: 13, fontWeight: 800 }}>
          {rows} rows x {columns} columns
        </span>
      </div>
    );
  }

  if (visual.visualModel === "place_value_blocks") {
    const value = Math.max(0, Math.floor(Number(visual.targetValue ?? 0)));
    const hundreds = Math.floor(value / 100);
    const tens = Math.floor((value % 100) / 10);
    const ones = value % 10;
    return (
      <div style={boardStyle} aria-label="Place value blocks visual">
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
          {[
            ["Hundreds", hundreds],
            ["Tens", tens],
            ["Ones", ones],
          ].map(([label, count]) => (
            <div key={String(label)} style={{ display: "grid", gap: 8, justifyItems: "center" }}>
              <strong style={{ color: v2Tokens.navy }}>{label}</strong>
              <span style={{ borderRadius: 16, background: "#FFFFFF", border: `1px solid ${v2Tokens.border}`, padding: "12px 16px", fontSize: 28, fontWeight: 900 }}>
                {String(count)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (visual.visualModel === "fraction_bar") {
    const denominator = Math.max(2, visual.denominator ?? 4);
    const shaded = Math.max(0, Math.min(denominator, visual.shadedParts ?? 1));
    return (
      <div style={boardStyle} aria-label="Fraction bar visual">
        <div style={{ width: "min(460px, 100%)", display: "grid", gridTemplateColumns: `repeat(${denominator}, 1fr)`, gap: 5 }}>
          {Array.from({ length: denominator }, (_, index) => (
            <span
              key={index}
              style={{
                minHeight: 76,
                borderRadius: 12,
                border: `2px solid ${v2Tokens.navy}`,
                background: index < shaded ? v2Tokens.purple : "#FFFFFF",
              }}
            />
          ))}
        </div>
        <strong style={{ color: v2Tokens.navy }}>{shaded}/{denominator}</strong>
      </div>
    );
  }

  if (visual.visualModel === "clock_face") {
    const hour = visual.hour ?? 3;
    const minute = visual.minute ?? 0;
    const minuteDegrees = minute * 6;
    const hourDegrees = (hour % 12) * 30 + minute * 0.5;
    return (
      <div style={boardStyle} aria-label="Clock visual">
        <div style={{ width: 190, height: 190, borderRadius: 999, border: `5px solid ${v2Tokens.navy}`, background: "#FFFFFF", position: "relative" }}>
          {[12, 3, 6, 9].map((label) => (
            <span key={label} style={{ position: "absolute", ...(label === 12 ? { top: 12, left: 0, right: 0, textAlign: "center" } : {}), ...(label === 3 ? { right: 16, top: 78 } : {}), ...(label === 6 ? { bottom: 10, left: 0, right: 0, textAlign: "center" } : {}), ...(label === 9 ? { left: 16, top: 78 } : {}), fontWeight: 900, color: v2Tokens.navy }}>
              {label}
            </span>
          ))}
          <span style={{ position: "absolute", left: 91, top: 48, width: 7, height: 48, background: v2Tokens.purple, borderRadius: 999, transformOrigin: "bottom", transform: `rotate(${hourDegrees}deg)` }} />
          <span style={{ position: "absolute", left: 92, top: 26, width: 5, height: 70, background: v2Tokens.green, borderRadius: 999, transformOrigin: "bottom", transform: `rotate(${minuteDegrees}deg)` }} />
          <span style={{ position: "absolute", left: 83, top: 83, width: 22, height: 22, borderRadius: 999, background: v2Tokens.navy }} />
        </div>
      </div>
    );
  }

  if (visual.visualModel === "shape_board" || visual.visualModel === "money_board") {
    const labels = visual.labels?.length ? visual.labels : [String(visual.targetValue ?? "model")];
    return (
      <div style={boardStyle} aria-label={`${visual.visualModel} visual`}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
          {labels.slice(0, 6).map((label) => (
            <span key={label} style={{ borderRadius: visual.visualModel === "money_board" ? 999 : 16, border: `2px solid ${v2Tokens.navy}`, background: "#FFFFFF", color: v2Tokens.navy, padding: "14px 18px", fontSize: 20, fontWeight: 900 }}>
              {label}
            </span>
          ))}
        </div>
        <span style={{ color: v2Tokens.slate, fontSize: 13, fontWeight: 800 }}>{visual.note}</span>
      </div>
    );
  }

  if (visual.visualModel === "coordinate_grid") {
    const target = String(visual.targetValue ?? "");
    return (
      <div style={boardStyle} aria-label="Coordinate grid visual">
        <div style={{ display: "grid", gridTemplateColumns: "34px repeat(4, 54px)", gap: 7 }}>
          <span />
          {["A", "B", "C", "D"].map((col) => <strong key={col} style={{ textAlign: "center", color: v2Tokens.slate }}>{col}</strong>)}
          {[1, 2, 3, 4].map((row) => (
            <React.Fragment key={row}>
              <strong style={{ display: "grid", placeItems: "center", color: v2Tokens.slate }}>{row}</strong>
              {["A", "B", "C", "D"].map((col) => {
                const coord = `${col}${row}`;
                return (
                  <span key={coord} style={{ minHeight: 54, borderRadius: 12, border: `2px solid ${coord === target ? v2Tokens.purple : v2Tokens.border}`, background: coord === target ? v2Tokens.lavender : "#FFFFFF", display: "grid", placeItems: "center", color: v2Tokens.navy, fontWeight: 850 }}>
                    {coord}
                  </span>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  const values = visual.values?.length ? visual.values : [0, Number(visual.targetValue ?? 10)];
  const min = Math.min(...values, 0);
  const max = Math.max(...values, Number(visual.targetValue ?? 10), 10);
  return (
    <div style={boardStyle} aria-label="Number line visual">
      <div style={{ width: "100%", position: "relative", height: 84 }}>
        <span style={{ position: "absolute", left: 14, right: 14, top: 42, height: 4, borderRadius: 999, background: v2Tokens.navy }} />
        {[min, Math.round((min + max) / 2), max].map((value) => (
          <span key={value} style={{ position: "absolute", left: value === min ? 8 : value === max ? "calc(100% - 28px)" : "50%", top: 54, color: v2Tokens.navy, fontWeight: 850 }}>
            {value}
          </span>
        ))}
        {values.slice(0, 5).map((value, index) => (
          <span key={`${value}-${index}`} style={{ position: "absolute", left: `${max === min ? 50 : ((value - min) / (max - min)) * 92 + 4}%`, top: 22, transform: "translateX(-50%)", width: 18, height: 18, borderRadius: 999, background: v2Tokens.purple }} />
        ))}
      </div>
      <span style={{ color: v2Tokens.slate, fontSize: 13, fontWeight: 800 }}>{visual.note}</span>
    </div>
  );
}

export default function CleanReviewPlayer({ questions, onExit, onReviewAgain }: CleanReviewPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [response, setResponse] = useState("");
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [results, setResults] = useState<MathsReviewPlayerResult[]>([]);
  const [finished, setFinished] = useState(false);
  const [mode, setMode] = useState<PlayerMode>("learner");
  const [v5Responses, setV5Responses] = useState<Record<string, ActivityV5ResponseState>>({});
  const [v5CheckResult, setV5CheckResult] = useState<ActivityV5CheckResult | null>(null);

  const currentQuestion = questions[currentIndex] ?? null;
  const v5Activity = useMemo(
    () => (currentQuestion ? myReviewQuestionToActivityV5(currentQuestion) : null),
    [currentQuestion],
  );
  const currentV5Response = currentQuestion ? v5Responses[currentQuestion.id] ?? {} : {};
  const displayParts = currentQuestion ? getDisplayParts(currentQuestion) : { lead: "", problem: "" };
  const progressPercent = questions.length ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const canCheck = mode === "display" || (v5Activity ? hasV5Response(currentV5Response) : response.trim().length > 0);

  const summary = useMemo(() => {
    const correctCount = results.filter((result) => result.correct).length;
    const incorrectCount = questions.length - correctCount;
    const missedFocusAreas = Array.from(
      new Set(results.filter((result) => !result.correct).map((result) => result.question.bankLabel)),
    );
    return { correctCount, incorrectCount, missedFocusAreas };
  }, [questions.length, results]);

  function recordResult(question: MathsReviewQuestion, nextResponse: string, correct: boolean) {
    setResults((current) => {
      const withoutQuestion = current.filter((result) => result.question.id !== question.id);
      return [...withoutQuestion, { question, response: nextResponse, correct }];
    });
  }

  function showOrCheckAnswer() {
    if (!currentQuestion || checked || !canCheck) return;
    if (mode === "display") {
      setResponse(currentQuestion.answer);
      setIsCorrect(true);
      setChecked(true);
      setV5CheckResult(null);
      recordResult(currentQuestion, currentQuestion.answer, true);
      return;
    }

    if (v5Activity) {
      const result = checkActivityV5Answer(v5Activity, currentV5Response);
      const formattedResponse = formatMyReviewV5Response(currentV5Response);
      setV5CheckResult(result);
      setResponse(formattedResponse);
      setIsCorrect(result.correct);
      setChecked(true);
      recordResult(currentQuestion, formattedResponse, result.correct);
      return;
    }

    const correct = checkMathsReviewAnswer(currentQuestion, response);
    setV5CheckResult(null);
    setIsCorrect(correct);
    setChecked(true);
    recordResult(currentQuestion, response, correct);
  }

  function loadQuestionState(nextIndex: number) {
    const nextQuestion = questions[nextIndex];
    const recorded = nextQuestion ? resultForQuestion(results, nextQuestion) : null;
    setCurrentIndex(nextIndex);
    setResponse(recorded?.response ?? "");
    setChecked(Boolean(recorded));
    setIsCorrect(recorded?.correct ?? null);
    setV5CheckResult(null);
  }

  function goNext() {
    if (!currentQuestion) return;
    if (!checked) {
      recordResult(currentQuestion, response, false);
    }
    if (currentIndex >= questions.length - 1) {
      setFinished(true);
      return;
    }
    loadQuestionState(currentIndex + 1);
  }

  function goPrevious() {
    if (currentIndex <= 0) return;
    loadQuestionState(currentIndex - 1);
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onExit();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrevious();
      }
      if (event.key === "Enter") {
        event.preventDefault();
        showOrCheckAnswer();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (!currentQuestion) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Maths review player"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        background: "linear-gradient(180deg, #F7F9FC 0%, #EEF4FF 100%)",
        color: v2Tokens.navy,
        display: "grid",
        gridTemplateRows: "auto minmax(0, 1fr) auto",
        padding: "clamp(14px, 2.8vw, 32px)",
      }}
    >
      <header style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            <span style={{ color: v2Tokens.slate, fontSize: 14, fontWeight: 800 }}>
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span
              style={{
                borderRadius: 999,
                background: "#FFFFFF",
                border: `1px solid ${v2Tokens.border}`,
                color: v2Tokens.purple,
                padding: "6px 11px",
                fontSize: 13,
                fontWeight: 850,
              }}
            >
              {currentQuestion.bankLabel}
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <div
              aria-label="Review mode"
              style={{
                display: "inline-flex",
                border: `1px solid ${v2Tokens.border}`,
                borderRadius: 999,
                background: "#FFFFFF",
                padding: 4,
              }}
            >
              {(["learner", "display"] as const).map((candidate) => (
                <button
                  key={candidate}
                  type="button"
                  onClick={() => {
                    setMode(candidate);
                    setResponse("");
                    setChecked(false);
                    setIsCorrect(null);
                    setV5CheckResult(null);
                  }}
                  style={{
                    border: 0,
                    borderRadius: 999,
                    background: mode === candidate ? v2Tokens.lavender : "transparent",
                    color: mode === candidate ? v2Tokens.purple : v2Tokens.slate,
                    padding: "7px 10px",
                    fontSize: 12,
                    fontWeight: 850,
                    cursor: "pointer",
                    textTransform: "capitalize",
                  }}
                >
                  {candidate}
                </button>
              ))}
            </div>
            <button type="button" onClick={onExit} style={neutralButtonStyle}>
              Exit review
            </button>
          </div>
        </div>
        <div style={{ height: 9, borderRadius: 999, background: "#DDE6F4", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progressPercent}%`, background: v2Tokens.purple }} />
        </div>
      </header>

      <main
        className="mylearna-review-player-stage"
        style={{
          minHeight: 0,
          display: "grid",
          placeItems: "center",
          padding: "clamp(18px, 5vw, 58px) 0",
        }}
      >
        {finished ? (
          <section
            style={{
              width: "min(920px, 100%)",
              borderRadius: 32,
              border: `1px solid ${v2Tokens.border}`,
              background: "rgba(255,255,255,0.96)",
              boxShadow: "0 24px 70px rgba(23,32,75,0.13)",
              padding: "clamp(24px, 5vw, 54px)",
              display: "grid",
              gap: 22,
              textAlign: "center",
            }}
          >
            <div>
              <div style={{ color: v2Tokens.purple, fontSize: 13, fontWeight: 900, textTransform: "uppercase" }}>
                Review complete
              </div>
              <h1 style={{ margin: "8px 0 0", color: v2Tokens.navy, fontSize: "clamp(42px, 10vw, 88px)", lineHeight: 1 }}>
                {summary.correctCount}/{questions.length}
              </h1>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
              <span style={{ borderRadius: 999, background: v2Tokens.mint, color: "#176B45", padding: "9px 13px", fontWeight: 850 }}>
                Correct {summary.correctCount}
              </span>
              <span style={{ borderRadius: 999, background: v2Tokens.softRed, color: "#9F2440", padding: "9px 13px", fontWeight: 850 }}>
                Incorrect {summary.incorrectCount}
              </span>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              <h2 style={{ margin: 0, color: v2Tokens.navy, fontSize: 18 }}>Missed focus areas</h2>
              {summary.missedFocusAreas.length ? (
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
                  {summary.missedFocusAreas.map((area) => (
                    <span
                      key={area}
                      style={{
                        borderRadius: 999,
                        background: v2Tokens.softAmber,
                        color: "#9A5B00",
                        padding: "8px 11px",
                        fontSize: 13,
                        fontWeight: 850,
                      }}
                    >
                      {area}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, color: v2Tokens.slate }}>No missed focus areas in this session.</p>
              )}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
              <button type="button" onClick={onReviewAgain} style={primaryButtonStyle}>
                Review again
              </button>
              <button type="button" onClick={onExit} style={neutralButtonStyle}>
                Back to builder
              </button>
            </div>
          </section>
        ) : (
          <section
            style={{
              width: "min(1040px, 100%)",
              minHeight: "min(620px, 72vh)",
              borderRadius: 36,
              border: `1px solid ${v2Tokens.border}`,
              background: "rgba(255,255,255,0.97)",
              boxShadow: "0 24px 70px rgba(23,32,75,0.13)",
              padding: "clamp(26px, 6vw, 72px)",
              display: "grid",
              gap: "clamp(18px, 4vw, 34px)",
              alignContent: "center",
              textAlign: "center",
            }}
          >
            <div style={{ display: "grid", gap: 12 }}>
              <p
                style={{
                  margin: 0,
                  color: v2Tokens.slate,
                  fontSize: "clamp(24px, 5vw, 48px)",
                  lineHeight: 1.15,
                  fontWeight: 800,
                }}
              >
                {displayParts.lead}
              </p>
              {displayParts.problem ? (
                <div
                  style={{
                    color: v2Tokens.navy,
                    fontSize: "clamp(72px, 16vw, 178px)",
                    lineHeight: 0.95,
                    fontWeight: 950,
                    letterSpacing: 0,
                  }}
                >
                  {displayParts.problem}
                </div>
              ) : null}
              {v5Activity ? (
                <div style={{ width: "min(760px, 100%)", margin: "0 auto" }}>
                  <ActivityV5InteractionRenderer
                    activity={v5Activity}
                    response={currentV5Response}
                    checked={checked}
                    onChange={(nextResponse) => {
                      setV5Responses((current) => ({
                        ...current,
                        [currentQuestion.id]: nextResponse,
                      }));
                      setResponse(formatMyReviewV5Response(nextResponse));
                      setChecked(false);
                      setIsCorrect(null);
                      setV5CheckResult(null);
                    }}
                  />
                </div>
              ) : (
                <ReviewVisualModel visual={currentQuestion.visual} />
              )}
              {currentQuestion.visualHint ? (
                <p style={{ margin: 0, color: v2Tokens.slate, fontSize: 16, lineHeight: 1.5 }}>{currentQuestion.visualHint}</p>
              ) : null}
            </div>

            {!v5Activity && currentQuestion.type === "choice" && currentQuestion.choices ? (
              <div className="mylearna-review-player-choice-grid">
                {currentQuestion.choices.map((choice) => {
                  const selected = response === choice;
                  return (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => setResponse(choice)}
                      disabled={checked || mode === "display"}
                      style={{
                        minHeight: 64,
                        borderRadius: 18,
                        border: `1px solid ${selected ? v2Tokens.purple : v2Tokens.border}`,
                        background: selected ? v2Tokens.lavender : "#FFFFFF",
                        color: v2Tokens.navy,
                        fontSize: "clamp(20px, 3vw, 32px)",
                        fontWeight: 900,
                        cursor: checked || mode === "display" ? "default" : "pointer",
                      }}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>
            ) : !v5Activity && mode === "learner" ? (
              <label
                style={{
                  display: "grid",
                  gap: 10,
                  width: "min(420px, 100%)",
                  margin: "0 auto",
                  color: v2Tokens.slate,
                  fontSize: 13,
                  fontWeight: 900,
                  textAlign: "left",
                }}
              >
                Answer
                <input
                  value={response}
                  onChange={(event) => setResponse(event.target.value)}
                  disabled={checked}
                  autoFocus
                  inputMode="text"
                  style={{
                    minHeight: 66,
                    borderRadius: 18,
                    border: `1px solid ${v2Tokens.border}`,
                    background: "#FFFFFF",
                    color: v2Tokens.navy,
                    padding: "10px 16px",
                    fontSize: 30,
                    fontWeight: 850,
                    textAlign: "center",
                  }}
                  placeholder="Type answer"
                />
              </label>
            ) : null}

            {checked ? (
              <div
                role="status"
                style={{
                  width: "min(680px, 100%)",
                  margin: "0 auto",
                  borderRadius: 22,
                  border: `1px solid ${isCorrect ? "#BDEFD4" : "#FFD0DA"}`,
                  background: isCorrect ? v2Tokens.mint : v2Tokens.softRed,
                  color: isCorrect ? "#176B45" : "#9F2440",
                  padding: "16px 18px",
                  fontSize: "clamp(17px, 2.4vw, 24px)",
                  fontWeight: 850,
                  lineHeight: 1.35,
                }}
              >
                {mode === "display"
                  ? `Answer: ${currentQuestion.answer}`
                  : v5CheckResult
                    ? v5CheckResult.message
                    : isCorrect
                    ? "Correct."
                    : `Not quite. The answer is ${currentQuestion.answer}.`}
                <div style={{ fontSize: 15, fontWeight: 650, marginTop: 6 }}>
                  {v5CheckResult && !v5CheckResult.correct
                    ? `Expected: ${v5CheckResult.expectedSummary}`
                    : currentQuestion.explanation}
                </div>
              </div>
            ) : null}
          </section>
        )}
      </main>

      <footer
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button type="button" onClick={goPrevious} disabled={currentIndex === 0 || finished} style={neutralButtonStyle}>
            Previous
          </button>
          {!finished ? (
            <button
              type="button"
              onClick={showOrCheckAnswer}
              disabled={!canCheck || checked}
              style={{
                ...primaryButtonStyle,
                opacity: !canCheck || checked ? 0.58 : 1,
                cursor: !canCheck || checked ? "not-allowed" : "pointer",
              }}
            >
              {mode === "display" ? "Show answer" : "Check"}
            </button>
          ) : null}
          <button type="button" onClick={goNext} disabled={finished} style={neutralButtonStyle}>
            {currentIndex >= questions.length - 1 ? "Finish" : "Next"}
          </button>
        </div>
        <div style={{ color: v2Tokens.slate, fontSize: 12, fontWeight: 700 }}>
          Shortcuts: Left/Right arrows, Enter, Escape
        </div>
      </footer>

      <style jsx global>{`
        .mylearna-review-player-choice-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          width: min(760px, 100%);
          margin: 0 auto;
        }

        @media (max-width: 760px) {
          .mylearna-review-player-choice-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-height: 720px) {
          .mylearna-review-player-stage {
            padding-top: 14px !important;
            padding-bottom: 14px !important;
          }
        }
      `}</style>
    </div>
  );
}
