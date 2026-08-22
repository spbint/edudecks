"use client";

import { useEffect, useMemo, useState } from "react";
import { buildFounderActions, type FounderAction } from "@/lib/clean/founder/founderActions";
import type { FounderDashboardData } from "@/lib/clean/founder/founderDashboard";
import styles from "./FounderDashboardV2.module.css";
import actionStyles from "./FounderActions.module.css";

const STORAGE_KEY = "mylearna:founder-actions:v1";
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000;
const MAX_VISIBLE_ACTIONS = 5;

type Decision = {
  state: "done" | "dismissed" | "snoozed";
  until?: number;
  updatedAt: number;
};

type Decisions = Record<string, Decision>;

function loadDecisions(): Decisions {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? parsed as Decisions : {};
  } catch {
    return {};
  }
}

function mailto(action: FounderAction) {
  if (!action.family.email || !action.emailDraft) return null;
  const subject = encodeURIComponent(action.emailDraft.subject);
  const body = encodeURIComponent(action.emailDraft.body);
  return `mailto:${encodeURIComponent(action.family.email)}?subject=${subject}&body=${body}`;
}

function confidenceClass(confidence: FounderAction["confidence"]) {
  if (confidence === "Worth doing now") return actionStyles.confidenceNow;
  if (confidence === "Opportunity") return actionStyles.confidenceOpportunity;
  return actionStyles.confidenceWatch;
}

function isHidden(decision: Decision | undefined) {
  if (!decision) return false;
  if (decision.state === "snoozed" && decision.until && decision.until <= Date.now()) return false;
  return true;
}

function ActionCard({
  action,
  onDecision,
}: {
  action: FounderAction;
  onDecision: (actionId: string, decision: Decision) => void;
}) {
  const emailHref = mailto(action);
  return <article className={actionStyles.actionCard}>
    <div className={actionStyles.actionTopline}>
      <span className={`${actionStyles.confidence} ${confidenceClass(action.confidence)}`}>{action.confidence}</span>
      <span className={actionStyles.familyName}>{action.family.displayName}</span>
    </div>
    <h3>{action.title}</h3>
    <p className={actionStyles.summary}>{action.summary}</p>
    <p className={actionStyles.why}>{action.why}</p>

    <details className={actionStyles.evidence}>
      <summary>View evidence</summary>
      <ul>{action.evidence.map((item) => <li key={item}>{item}</li>)}</ul>
    </details>

    <div className={actionStyles.actionButtons}>
      {emailHref ? <a className={actionStyles.primaryAction} href={emailHref}>Draft personal email</a> : null}
      <button type="button" onClick={() => onDecision(action.id, { state: "done", updatedAt: Date.now() })}>Done</button>
      <button type="button" onClick={() => onDecision(action.id, { state: "snoozed", until: Date.now() + SNOOZE_MS, updatedAt: Date.now() })}>Snooze 3 days</button>
      <button type="button" className={actionStyles.dismissAction} onClick={() => onDecision(action.id, { state: "dismissed", updatedAt: Date.now() })}>Dismiss</button>
    </div>
  </article>;
}

export default function FounderActions({ data }: { data: FounderDashboardData }) {
  const actions = useMemo(() => buildFounderActions(data, new Date(data.generatedAt), 25), [data]);
  const [decisions, setDecisions] = useState<Decisions>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setDecisions(loadDecisions());
    setHydrated(true);
  }, []);

  const eligibleActions = actions.filter((action) => !isHidden(decisions[action.id]));
  const visibleActions = eligibleActions.slice(0, MAX_VISIBLE_ACTIONS);
  const hiddenCount = actions.filter((action) => isHidden(decisions[action.id])).length;

  function saveDecision(actionId: string, decision: Decision) {
    setDecisions((current) => {
      const next = { ...current, [actionId]: decision };
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function resetDecisions() {
    setDecisions({});
    try { window.localStorage.removeItem(STORAGE_KEY); } catch {}
  }

  const count = visibleActions.length;
  return <section className={styles.section} aria-labelledby="founder-actions-title">
    <div className={styles.sectionHeading}>
      <div>
        <p className={styles.eyebrow}>What should I do next?</p>
        <h2 id="founder-actions-title">Founder Actions</h2>
      </div>
      <p className={styles.sectionHint}>Rule-based from real customer signals. Nothing is sent automatically.</p>
    </div>

    <div className={actionStyles.actionIntro}>
      <div>
        <strong>{count === 0 ? "Nothing urgent right now" : `${count} ${count === 1 ? "thing" : "things"} worth your attention`}</strong>
        <span>Focused on welcome, setup help, first-value friction, going quiet, and useful feedback opportunities.</span>
      </div>
      {hydrated && hiddenCount > 0 ? <button type="button" className={actionStyles.resetButton} onClick={resetDecisions}>Reset {hiddenCount} hidden {hiddenCount === 1 ? "action" : "actions"}</button> : null}
    </div>

    {visibleActions.length > 0 ? <div className={actionStyles.actionGrid}>{visibleActions.map((action) => <ActionCard key={action.id} action={action} onDecision={saveDecision} />)}</div> : <div className={styles.softEmpty}>No current customer signal is strong enough to become a Founder Action. Keep using the behaviour dashboard as the evidence base.</div>}

    <p className={actionStyles.storageNote}>Done, snoozed and dismissed decisions are stored only in this browser for now.</p>
  </section>;
}
