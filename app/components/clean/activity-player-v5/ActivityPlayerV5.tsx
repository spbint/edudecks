"use client";

import { useMemo, useState } from "react";
import {
  checkActivityV5Answer,
  seededShuffle,
} from "@/app/components/clean/activity-player-v5/answerChecking";
import { ActivityV5InteractionRenderer } from "@/app/components/clean/activity-player-v5/interactionRenderers";
import type {
  ActivityPlayerV5Props,
  ActivityV5CheckResult,
  ActivityV5ResponseState,
} from "@/app/components/clean/activity-player-v5/types";
import { v5Tokens } from "@/app/components/clean/activity-player-v5/visualModels";

function emptyResponse(): ActivityV5ResponseState {
  return {};
}

export default function ActivityPlayerV5({
  activities,
  chrome = "standalone",
  onSubmitAnswer,
  onComplete,
}: ActivityPlayerV5Props) {
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, ActivityV5ResponseState>>({});
  const [results, setResults] = useState<Record<string, ActivityV5CheckResult>>({});
  const [finished, setFinished] = useState(false);

  const activity = activities[index];
  const response = activity ? responses[activity.id] ?? emptyResponse() : emptyResponse();
  const result = activity ? results[activity.id] : null;
  const checked = Boolean(result);
  const progress = activities.length ? ((index + 1) / activities.length) * 100 : 0;
  const score = useMemo(
    () => Object.values(results).filter((candidate) => candidate.correct).length,
    [results],
  );

  if (!activities.length) {
    return (
      <section style={{ padding: 24, color: v5Tokens.navy }}>
        No ActivityPlayer v5 activities available.
      </section>
    );
  }

  if (finished) {
    return (
      <main style={{ minHeight: chrome === "standalone" ? "100vh" : undefined, background: v5Tokens.page, padding: 24, display: "grid", placeItems: "center" }}>
        <section style={{ width: "min(780px, 100%)", border: `1px solid ${v5Tokens.border}`, borderRadius: 28, background: "#FFFFFF", padding: 28, display: "grid", gap: 16, boxShadow: "0 18px 42px rgba(23,32,75,0.08)" }}>
          <p style={{ margin: 0, color: v5Tokens.slate, fontWeight: 800 }}>ActivityPlayer v5 summary</p>
          <h1 style={{ margin: 0, color: v5Tokens.navy, fontSize: 34 }}>Score {score} of {activities.length}</h1>
          <p style={{ margin: 0, color: v5Tokens.slate, lineHeight: 1.6 }}>
            Missed activities can be retried immediately in practise mode. Assessment mode keeps the same visual task board with less scaffolding.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" onClick={() => { setIndex(0); setFinished(false); }} style={primaryButton()}>
              Review again
            </button>
            <button type="button" onClick={onComplete} style={secondaryButton()}>
              Finish
            </button>
          </div>
        </section>
      </main>
    );
  }

  const updateResponse = (next: ActivityV5ResponseState) => {
    if (!activity) return;
    setResponses((current) => ({ ...current, [activity.id]: next }));
    if (results[activity.id]) {
      setResults((current) => {
        const clone = { ...current };
        delete clone[activity.id];
        return clone;
      });
    }
  };

  const check = () => {
    if (!activity) return;
    const nextResult = checkActivityV5Answer(activity, response);
    setResults((current) => ({ ...current, [activity.id]: nextResult }));
    onSubmitAnswer?.({
      activity,
      response,
      correct: nextResult.correct,
      index,
    });
  };

  const next = () => {
    if (index >= activities.length - 1) {
      setFinished(true);
      return;
    }
    setIndex((current) => current + 1);
  };

  const answerOptions = activity.answerOptions?.length
    ? seededShuffle(activity.answerOptions, activity.randomisationSeed ?? activity.id)
    : [];

  return (
    <main
      style={{
        minHeight: chrome === "standalone" ? "100vh" : undefined,
        background: v5Tokens.page,
        padding: 18,
      }}
    >
      <section
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          display: "grid",
          gap: 18,
        }}
      >
        <header style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <p style={{ margin: "0 0 5px", color: v5Tokens.slate, fontWeight: 800, fontSize: 13 }}>
                {activity.strand} · {activity.step} · {activity.mode}
              </p>
              <h1 style={{ margin: 0, color: v5Tokens.navy, fontSize: "clamp(24px, 4vw, 38px)", lineHeight: 1.1 }}>
                {activity.prompt}
              </h1>
            </div>
            <span style={{ color: v5Tokens.slate, fontWeight: 800 }}>
              {index + 1} of {activities.length}
            </span>
          </div>
          <div style={{ height: 7, borderRadius: 999, background: "#E9ECF5", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: activity.mode === "assess" ? v5Tokens.green : v5Tokens.purple }} />
          </div>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 360px)", gap: 18, alignItems: "start" }}>
          <section style={{ display: "grid", gap: 12 }}>
            <p style={{ margin: 0, color: v5Tokens.slate, fontSize: 16, lineHeight: 1.55, fontWeight: 650 }}>
              {activity.instruction}
            </p>
            <ActivityV5InteractionRenderer
              activity={activity}
              response={response}
              onChange={updateResponse}
              checked={checked}
            />
          </section>

          <aside style={{ display: "grid", gap: 12 }}>
            {answerOptions.length ? (
              <section style={panelStyle()}>
                <strong style={{ color: v5Tokens.navy }}>Answer choices</strong>
                {answerOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => updateResponse({ ...response, selectedOption: option })}
                    style={{
                      border: `1px solid ${response.selectedOption === option ? v5Tokens.purple : v5Tokens.border}`,
                      borderRadius: 14,
                      background: response.selectedOption === option ? v5Tokens.lavender : "#FFFFFF",
                      color: v5Tokens.navy,
                      padding: "11px 12px",
                      textAlign: "left",
                      font: "inherit",
                      fontWeight: 700,
                    }}
                  >
                    {option}
                  </button>
                ))}
              </section>
            ) : null}

            {activity.mode === "practise" && activity.supportHint ? (
              <section style={panelStyle()}>
                <strong style={{ color: v5Tokens.purple }}>Hint</strong>
                <p style={{ margin: 0, color: v5Tokens.slate, lineHeight: 1.55 }}>{activity.supportHint}</p>
              </section>
            ) : null}

            {result ? (
              <section
                style={{
                  ...panelStyle(),
                  borderColor: result.correct ? v5Tokens.green : v5Tokens.red,
                  background: result.correct ? v5Tokens.mint : v5Tokens.softRed,
                }}
              >
                <strong style={{ color: result.correct ? v5Tokens.green : v5Tokens.red }}>
                  {result.correct ? "Correct" : "Check the model"}
                </strong>
                <p style={{ margin: 0, color: v5Tokens.navy, lineHeight: 1.55 }}>{result.message}</p>
                {!result.correct ? (
                  <p style={{ margin: 0, color: v5Tokens.slate, lineHeight: 1.55 }}>
                    Expected: {result.expectedSummary}
                  </p>
                ) : null}
              </section>
            ) : null}

            <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button type="button" onClick={() => setIndex((current) => Math.max(0, current - 1))} style={secondaryButton()} disabled={index === 0}>
                Previous
              </button>
              <button type="button" onClick={checked ? next : check} style={primaryButton()}>
                {checked ? (index === activities.length - 1 ? "Finish" : "Next") : "Check"}
              </button>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

function panelStyle() {
  return {
    border: `1px solid ${v5Tokens.border}`,
    borderRadius: 20,
    background: "#FFFFFF",
    padding: 16,
    display: "grid",
    gap: 10,
    boxShadow: "0 12px 30px rgba(23,32,75,0.055)",
  } satisfies React.CSSProperties;
}

function primaryButton() {
  return {
    border: 0,
    borderRadius: 999,
    background: v5Tokens.purple,
    color: "#FFFFFF",
    padding: "12px 16px",
    font: "inherit",
    fontWeight: 800,
    cursor: "pointer",
  } satisfies React.CSSProperties;
}

function secondaryButton() {
  return {
    border: `1px solid ${v5Tokens.border}`,
    borderRadius: 999,
    background: "#FFFFFF",
    color: v5Tokens.navy,
    padding: "12px 16px",
    font: "inherit",
    fontWeight: 800,
    cursor: "pointer",
  } satisfies React.CSSProperties;
}
