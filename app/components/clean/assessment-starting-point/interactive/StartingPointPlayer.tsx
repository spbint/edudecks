"use client";

import dynamic from "next/dynamic";
import React, { useMemo, useRef, useState } from "react";
import type {
  MyLearnaAssessmentItem,
  MyLearnaAssessmentResponse,
} from "@/lib/clean/assessments/mylearnaAssessTypes";
import {
  adaptAssessmentItemForStartingPointPlayer,
  scoreStartingPointPlayerAnswer,
} from "@/lib/clean/assessments/interactivePlayer/startingPointPlayerContract";
import styles from "./StartingPointPlayer.module.css";

const PhaserAssessmentStage = dynamic(
  () => import("./PhaserAssessmentStage"),
  {
    ssr: false,
    loading: () => (
      <div role="status" style={{ minHeight: 180, display: "grid", placeItems: "center" }}>
        Preparing question…
      </div>
    ),
  },
);

type StartingPointPlayerProps = {
  item: MyLearnaAssessmentItem;
  progress?: { current: number; total: number };
  onResponse?: (response: MyLearnaAssessmentResponse) => void;
  onUsePracticalObservation?: () => void;
};

function moveOption(ids: string[], optionId: string, direction: -1 | 1) {
  const currentIndex = ids.indexOf(optionId);
  const nextIndex = Math.max(0, Math.min(ids.length - 1, currentIndex + direction));
  if (currentIndex < 0 || currentIndex === nextIndex) return ids;
  const next = [...ids];
  next.splice(currentIndex, 1);
  next.splice(nextIndex, 0, optionId);
  return next;
}

export default function StartingPointPlayer({
  item,
  progress = { current: 1, total: 1 },
  onResponse,
  onUsePracticalObservation,
}: StartingPointPlayerProps) {
  const model = useMemo(() => adaptAssessmentItemForStartingPointPlayer(item), [item]);
  const startedAtRef = useRef<number | null>(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>(
    item.response.type === "ordering" ? model.options.map((option) => option.id) : [],
  );
  const [responseValue, setResponseValue] = useState("");
  const [recorded, setRecorded] = useState(false);
  const [practicalChosen, setPracticalChosen] = useState(false);

  const needsTextEntry = item.response.type === "short-answer";
  const ready = needsTextEntry
    ? Boolean(responseValue.trim())
    : item.response.type === "ordering"
      ? selectedOptionIds.length === model.options.length
      : selectedOptionIds.length > 0;
  const progressPercent = Math.max(
    0,
    Math.min(100, (progress.current / Math.max(1, progress.total)) * 100),
  );

  function selectOption(optionId: string) {
    startedAtRef.current ??= Date.now();
    setRecorded(false);
    setSelectedOptionIds((current) =>
      model.allowsMultiple
        ? current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId]
        : [optionId],
    );
  }

  return (
    <section className={styles.shell} data-starting-point-player data-item-id={item.id}>
      <div className={styles.progressTrack} aria-label={`Question ${progress.current} of ${progress.total}`}>
        <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
      </div>

      <header style={{ display: "grid", gap: 8 }}>
        <span className={styles.eyebrow}>Maths question</span>
        <h2 className={styles.prompt}>{model.prompt}</h2>
      </header>

      <div className={styles.stage}>
        <PhaserAssessmentStage
          model={model}
          selectedOptionIds={selectedOptionIds}
          onSelectOption={selectOption}
          onOrderChange={(optionIds) => {
            startedAtRef.current ??= Date.now();
            setSelectedOptionIds(optionIds);
          }}
        />
      </div>

      {needsTextEntry ? (
        <label>
          <span className={styles.eyebrow}>Your answer</span>
          <input
            className={styles.numberInput}
            aria-label="Your answer"
            inputMode="decimal"
            autoComplete="off"
            value={responseValue}
            onChange={(event) => {
              startedAtRef.current ??= Date.now();
              setRecorded(false);
              setResponseValue(event.target.value);
            }}
          />
        </label>
      ) : item.response.type === "ordering" ? (
        <details className={styles.keyboardFallback}>
          <summary>Use keyboard move controls</summary>
          <div className={styles.orderList} role="list" aria-label="Current order">
            {selectedOptionIds.map((optionId, index) => {
              const option = model.options.find((candidate) => candidate.id === optionId);
              if (!option) return null;
              return (
                <div className={styles.orderRow} role="listitem" key={optionId}>
                  <strong>{index + 1}</strong>
                  <span>{option.label}</span>
                  <button className={styles.moveButton} type="button" disabled={index === 0} onClick={() => {
                    startedAtRef.current ??= Date.now();
                    setSelectedOptionIds((current) => moveOption(current, optionId, -1));
                  }}>
                    Move up
                  </button>
                  <button className={styles.moveButton} type="button" disabled={index === selectedOptionIds.length - 1} onClick={() => {
                    startedAtRef.current ??= Date.now();
                    setSelectedOptionIds((current) => moveOption(current, optionId, 1));
                  }}>
                    Move down
                  </button>
                </div>
              );
            })}
          </div>
        </details>
      ) : (
        <div className={styles.choices} role="group" aria-label="Answer choices">
          {model.options.map((option) => {
            const selected = selectedOptionIds.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={selected}
                className={`${styles.choice} ${selected ? styles.choiceSelected : ""}`}
                onClick={() => selectOption(option.id)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}

      <div className={styles.actions}>
        <button
          className={styles.primary}
          type="button"
          disabled={!ready || practicalChosen}
          onClick={() => {
            const response = scoreStartingPointPlayerAnswer({
              item,
              answer: {
                itemId: model.itemId,
                itemVersion: model.itemVersion,
                selectedOptionIds,
                ...(needsTextEntry ? { responseValue } : {}),
              },
              timeSpentSeconds: Math.max(
                1,
                Math.round(
                  (Date.now() - (startedAtRef.current ?? Date.now())) / 1000,
                ),
              ),
            });
            setRecorded(true);
            onResponse?.(response);
          }}
        >
          Continue
        </button>
      </div>

      <div className={styles.status} role="status" aria-live="polite">
        {recorded ? "Response recorded. No result is shown during the check." : practicalChosen ? "This question is left open for a practical observation." : ""}
      </div>

      {model.requiresPracticalAlternative ? (
        <aside className={styles.practical}>
          <span>If this visual is not accessible, leave this question open rather than guessing.</span>
          <button
            className={styles.secondary}
            type="button"
            onClick={() => {
              setPracticalChosen(true);
              onUsePracticalObservation?.();
            }}
          >
            Use a practical observation instead
          </button>
        </aside>
      ) : null}
    </section>
  );
}
