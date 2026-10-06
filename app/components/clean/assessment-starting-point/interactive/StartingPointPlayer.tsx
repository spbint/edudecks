"use client";

import dynamic from "next/dynamic";
import React, { useEffect, useMemo, useRef, useState } from "react";
import type {
  MyLearnaAssessmentItem,
  MyLearnaAssessmentResponse,
} from "@/lib/clean/assessments/mylearnaAssessTypes";
import {
  adaptAssessmentItemForStartingPointPlayer,
  scoreStartingPointPlayerAnswer,
  type StartingPointPlayerAnswer,
} from "@/lib/clean/assessments/interactivePlayer/startingPointPlayerContract";
import styles from "./StartingPointPlayer.module.css";

const PhaserAssessmentStage = dynamic(() => import("./PhaserAssessmentStage"), {
  ssr: false,
  loading: () => <div className={styles.loading} role="status">Preparing question…</div>,
});

type StartingPointPlayerProps = {
  item: MyLearnaAssessmentItem;
  progress?: { current: number; total: number };
  onResponse?: (response: MyLearnaAssessmentResponse) => void;
  onPause?: () => void;
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
  onPause,
  onUsePracticalObservation,
}: StartingPointPlayerProps) {
  const model = useMemo(() => adaptAssessmentItemForStartingPointPlayer(item), [item]);
  const startedAtRef = useRef<number | null>(null);
  const [accessibleOrder, setAccessibleOrder] = useState(() => model.options.map((option) => option.id));
  const [accessibleSelection, setAccessibleSelection] = useState<string[]>([]);
  const [accessibleValue, setAccessibleValue] = useState("");
  const progressPercent = Math.max(0, Math.min(100, (progress.current / Math.max(1, progress.total)) * 100));

  useEffect(() => {
    startedAtRef.current = Date.now();
  }, [model.itemId, model.itemVersion]);

  useEffect(() => {
    document.body.classList.add("starting-point-player-active");
    return () => document.body.classList.remove("starting-point-player-active");
  }, []);

  function submit(answer: StartingPointPlayerAnswer) {
    const response = scoreStartingPointPlayerAnswer({
      item,
      answer,
      timeSpentSeconds: Math.max(1, Math.round((Date.now() - (startedAtRef.current ?? Date.now())) / 1000)),
    });
    onResponse?.(response);
  }

  function submitAccessible() {
    submit({
      itemId: model.itemId,
      itemVersion: model.itemVersion,
      selectedOptionIds: item.response.type === "ordering" ? accessibleOrder : accessibleSelection,
      ...(item.response.type === "short-answer" ? { responseValue: accessibleValue } : {}),
    });
  }

  return (
    <section className={styles.shell} data-starting-point-player data-item-id={item.id}>
      <div className={styles.topline}>
        <span className={styles.questionCount}>Question {progress.current} of {progress.total}</span>
        <button className={styles.pause} type="button" onClick={() => onPause ? onPause() : window.history.back()}>Pause &amp; exit</button>
      </div>
      <div className={styles.progressTrack} aria-hidden="true">
        <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
      </div>
      <header className={styles.questionHeader}>
        <span className={styles.eyebrow}>Maths question</span>
        <h2 className={styles.prompt}>{model.prompt}</h2>
      </header>

      <PhaserAssessmentStage key={`${model.itemId}:${model.itemVersion}`} model={model} onSubmit={submit} />

      <details className={styles.accessibleFallback}>
        <summary>{item.response.type === "ordering" ? "Use keyboard controls" : "Need another way to answer?"}</summary>
        <div className={styles.fallbackBody}>
          {item.response.type === "short-answer" ? (
            <label className={styles.fallbackLabel}>Your answer
              <input className={styles.fallbackInput} inputMode="decimal" autoComplete="off" value={accessibleValue} onChange={(event) => setAccessibleValue(event.target.value)} />
            </label>
          ) : item.response.type === "ordering" ? (
            <div className={styles.orderList} role="list" aria-label="Current order">
              {accessibleOrder.map((optionId, index) => {
                const option = model.options.find((candidate) => candidate.id === optionId);
                if (!option) return null;
                return <div className={styles.orderRow} role="listitem" key={optionId}>
                  <strong>{index + 1}</strong><span>{option.label}</span>
                  <button type="button" disabled={index === 0} onClick={() => setAccessibleOrder((current) => moveOption(current, optionId, -1))}>Move up</button>
                  <button type="button" disabled={index === accessibleOrder.length - 1} onClick={() => setAccessibleOrder((current) => moveOption(current, optionId, 1))}>Move down</button>
                </div>;
              })}
            </div>
          ) : (
            <div className={styles.fallbackChoices} role="group" aria-label="Answer choices">
              {model.options.map((option) => <button key={option.id} type="button" aria-pressed={accessibleSelection.includes(option.id)} onClick={() => setAccessibleSelection(model.allowsMultiple ? (current => current.includes(option.id) ? current.filter((id) => id !== option.id) : [...current, option.id])(accessibleSelection) : [option.id])}>{option.label}</button>)}
            </div>
          )}
          <button className={styles.fallbackSubmit} type="button" onClick={submitAccessible} disabled={item.response.type === "short-answer" ? !accessibleValue.trim() : item.response.type !== "ordering" && accessibleSelection.length === 0}>Continue</button>
        </div>
      </details>

      {model.requiresPracticalAlternative ? (
        <details className={styles.practical}>
          <summary>Can’t use this visual? Use a practical observation instead.</summary>
          <div className={styles.practicalBody}>
            <p>Leave this question unanswered and use the practical observation guidance. No electronic result will be inferred.</p>
            <button type="button" onClick={onUsePracticalObservation}>Open practical observation</button>
          </div>
        </details>
      ) : null}
    </section>
  );
}
