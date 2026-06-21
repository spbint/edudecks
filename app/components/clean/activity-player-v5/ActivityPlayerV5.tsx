"use client";

import { useMemo, useState } from "react";
import {
  checkActivityV5Answer,
  seededShuffle,
} from "@/app/components/clean/activity-player-v5/answerChecking";
import { ActivityV5InteractionRenderer } from "@/app/components/clean/activity-player-v5/interactionRenderers";
import {
  PlayerPanel,
  PlayerPresentationShell,
  PlayerProgress,
  SymbolicStrip,
  playerButtonStyle,
  playerContentStyle,
  playerHeaderStyle,
} from "@/app/components/clean/activity-player-v5/PlayerPresentationShell";
import type {
  ActivityPlayerV5Props,
  ActivityV5,
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
      <section style={{ padding: 20, color: v5Tokens.navy }}>
        No ActivityPlayer v5 activities available.
      </section>
    );
  }

  if (finished) {
    return (
      <PlayerPresentationShell standalone={chrome === "standalone"} centered>
        <section style={{ width: "min(720px, 100%)", ...playerHeaderStyle }}>
          <p style={{ margin: 0, color: v5Tokens.slate, fontWeight: 720, fontSize: 13 }}>
            Review complete
          </p>
          <h1
            style={{
              margin: 0,
              color: v5Tokens.navy,
              fontSize: "clamp(26px, 4vw, 32px)",
              lineHeight: 1.15,
              fontWeight: 760,
            }}
          >
            Score {score} of {activities.length}
          </h1>
          <p style={{ margin: 0, color: v5Tokens.slate, lineHeight: 1.55, fontSize: 15 }}>
            Use missed items for a quick reteach, then try the visual task again when you are ready.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => {
                setIndex(0);
                setFinished(false);
              }}
              style={playerButtonStyle("primary")}
            >
              Review again
            </button>
            <button type="button" onClick={onComplete} style={playerButtonStyle("secondary")}>
              Finish
            </button>
          </div>
        </section>
      </PlayerPresentationShell>
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
  const symbolicItems = buildSymbolicItems(activity);

  return (
    <PlayerPresentationShell standalone={chrome === "standalone"}>
      <section style={playerContentStyle}>
        <header style={playerHeaderStyle}>
          <PlayerProgress
            current={index + 1}
            total={activities.length}
            progress={progress}
            tone={activity.mode}
          />
          <div style={{ display: "grid", gap: 7 }}>
            <p style={{ margin: 0, color: v5Tokens.slate, fontWeight: 700, fontSize: 13 }}>
              {activity.strand} / {activity.step}
            </p>
            <h1
              style={{
                margin: 0,
                color: v5Tokens.navy,
                fontSize: "clamp(22px, 3vw, 28px)",
                lineHeight: 1.2,
                fontWeight: 760,
              }}
            >
              {activity.prompt}
            </h1>
            {activity.instruction ? (
              <p
                style={{
                  margin: 0,
                  color: v5Tokens.slate,
                  fontSize: 15,
                  lineHeight: 1.45,
                  fontWeight: 560,
                }}
              >
                {activity.instruction}
              </p>
            ) : null}
          </div>
        </header>

        <div
          className="activity-player-v5-layout"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(260px, 320px)",
            gap: 14,
            alignItems: "start",
          }}
        >
          <section style={{ display: "grid", gap: 10 }}>
            <ActivityV5InteractionRenderer
              activity={activity}
              response={response}
              onChange={updateResponse}
              checked={checked}
            />
            <SymbolicStrip items={symbolicItems} />
          </section>

          <aside style={{ display: "grid", gap: 10 }}>
            {answerOptions.length ? (
              <PlayerPanel>
                <strong style={{ color: v5Tokens.navy, fontSize: 14 }}>Choose an answer</strong>
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
                      padding: "10px 12px",
                      minHeight: 42,
                      textAlign: "left",
                      font: "inherit",
                      fontSize: 14,
                      fontWeight: 680,
                      cursor: "pointer",
                    }}
                  >
                    {option}
                  </button>
                ))}
              </PlayerPanel>
            ) : null}

            {activity.mode === "practise" && activity.supportHint ? (
              <PlayerPanel tone="hint">
                <strong style={{ color: v5Tokens.purple, fontSize: 14 }}>Hint</strong>
                <p style={{ margin: 0, color: v5Tokens.slate, lineHeight: 1.5, fontSize: 14 }}>
                  {activity.supportHint}
                </p>
              </PlayerPanel>
            ) : null}

            {result ? (
              <PlayerPanel tone={result.correct ? "success" : "error"}>
                <strong
                  style={{
                    color: result.correct ? v5Tokens.green : v5Tokens.red,
                    fontSize: 14,
                  }}
                >
                  {result.correct ? "Correct" : "Check the model"}
                </strong>
                <p style={{ margin: 0, color: v5Tokens.navy, lineHeight: 1.5, fontSize: 14 }}>
                  {result.message}
                </p>
                {!result.correct ? (
                  <p style={{ margin: 0, color: v5Tokens.slate, lineHeight: 1.5, fontSize: 13 }}>
                    Expected: {result.expectedSummary}
                  </p>
                ) : null}
              </PlayerPanel>
            ) : null}

            <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
              <button
                type="button"
                onClick={() => setIndex((current) => Math.max(0, current - 1))}
                style={playerButtonStyle("secondary")}
                disabled={index === 0}
              >
                Previous
              </button>
              <button type="button" onClick={checked ? next : check} style={playerButtonStyle("primary")}>
                {checked ? (index === activities.length - 1 ? "Finish" : "Next") : "Check"}
              </button>
            </section>
          </aside>
        </div>
      </section>

      <style jsx>{`
        @media (max-width: 860px) {
          .activity-player-v5-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </PlayerPresentationShell>
  );
}

function buildSymbolicItems(activity: ActivityV5) {
  const correct = activity.correctState;
  const items = [
    correct.equationText,
    correct.multiplicationSentence,
    correct.divisionSentence,
    correct.repeatedAdditionSentence,
    formatCoordinateSummary(correct.plottedCoordinates),
    formatTimeSummary(correct.targetHour, correct.targetMinute),
    formatMeasurementSummary(correct.targetLength, correct.unit),
    formatCapacitySummary(correct.targetCapacity, correct.unit),
    formatMassSummary(correct.targetMass, correct.unit),
  ].filter(Boolean) as string[];

  return Array.from(new Set(items)).slice(0, 3);
}

function formatCoordinateSummary(coordinates?: string[]) {
  if (!coordinates?.length) return null;
  return coordinates.length === 1 ? coordinates[0] : coordinates.join(", ");
}

function formatTimeSummary(hour?: number, minute?: number) {
  if (typeof hour !== "number" || typeof minute !== "number") return null;
  return `${hour}:${String(minute).padStart(2, "0")}`;
}

function formatMeasurementSummary(value?: number, unit?: string) {
  if (typeof value !== "number" || !unit || !["cm", "mm", "m"].includes(unit)) return null;
  return `${value} ${unit}`;
}

function formatCapacitySummary(value?: number, unit?: string) {
  if (typeof value !== "number" || !unit || !["mL", "L"].includes(unit)) return null;
  return `${value} ${unit}`;
}

function formatMassSummary(value?: number, unit?: string) {
  if (typeof value !== "number" || !unit || !["g", "kg"].includes(unit)) return null;
  return `${value} ${unit}`;
}
