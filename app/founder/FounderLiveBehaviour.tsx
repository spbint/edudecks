"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  FounderLiveBehaviourData,
  FounderLiveSession,
  FounderLiveTimelineItem,
} from "@/lib/clean/founder/founderLiveBehaviour";
import styles from "./FounderLiveBehaviour.module.css";

const POLL_MS = 30_000;

function formatClock(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-AU", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Australia/Hobart",
  }).format(date);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Unavailable";
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Australia/Hobart",
  }).format(date);
}

function formatDuration(seconds: number) {
  if (seconds < 60) return seconds <= 0 ? "<1 min" : `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (minutes < 60) return remainder ? `${minutes}m ${remainder}s` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function ago(value: string) {
  const ms = Date.now() - Date.parse(value);
  if (!Number.isFinite(ms) || ms < 0) return "just now";
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${Math.max(1, seconds)}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function dwell(item: FounderLiveTimelineItem) {
  if (item.kind !== "page" || !item.estimatedPageSeconds) return null;
  return `~${formatDuration(item.estimatedPageSeconds)}`;
}

function SessionDetail({ session }: { session: FounderLiveSession }) {
  return <div className={styles.sessionDetail}>
    {session.bottlenecks.length ? <div className={styles.frictionBox}>
      <strong>CHECK — Potential friction</strong>
      {session.bottlenecks.map((item) => <div key={`${item.kind}-${item.title}`} className={styles.frictionItem}>
        <span>{item.title}</span>
        <p>{item.detail}</p>
      </div>)}
    </div> : null}

    <div className={styles.timelineHeader}>
      <strong>Tracked session timeline</strong>
      <span>{session.eventCount} tracked {session.eventCount === 1 ? "event" : "events"}</span>
    </div>
    <ol className={styles.timeline}>
      {session.events.map((item, index) => <li key={`${item.occurredAt}-${item.event}-${index}`}>
        <time dateTime={item.occurredAt}>{formatClock(item.occurredAt)}</time>
        <span className={`${styles.kindBadge} ${styles[`kind_${item.kind.replace("-", "_")}`]}`}>{item.kind === "sign-in" ? "Sign in" : item.kind}</span>
        <div className={styles.timelineCopy}>
          <strong>{item.label}</strong>
          <span>{item.route && item.kind === "page" ? item.route : null}</span>
        </div>
        {dwell(item) ? <span className={styles.dwell} title="Estimated between recorded page movements, not exact attention time.">{dwell(item)}</span> : null}
      </li>)}
    </ol>
    {session.timelineTruncated ? <p className={styles.disclaimer}>This unusually long session is truncated in the drilldown.</p> : null}
  </div>;
}

export default function FounderLiveBehaviour({
  initialActiveNowCount,
  initiallyAvailable,
}: {
  initialActiveNowCount: number;
  initiallyAvailable: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<FounderLiveBehaviourData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/founder/live", {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error("Live activity could not be refreshed.");
      const data = await response.json() as FounderLiveBehaviourData;
      setSnapshot(data);
      setError(null);
    } catch {
      setError("Live activity is temporarily unavailable. The rest of Founder is unaffected.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void refresh();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, POLL_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [open, refresh]);

  const activeCount = snapshot?.activeNow.length ?? initialActiveNowCount;
  const available = snapshot?.available ?? initiallyAvailable;
  const selectedSession = useMemo(
    () => snapshot?.recentSessions.find((session) => session.id === selectedSessionId) ?? null,
    [selectedSessionId, snapshot],
  );

  if (!open) {
    return <button type="button" className={styles.launcher} onClick={() => setOpen(true)} aria-expanded="false">
      <span className={`${styles.liveDot} ${available ? styles.liveDotOn : styles.liveDotOff}`} aria-hidden="true" />
      <span className={styles.launcherCopy}>
        <span>Live activity</span>
        <strong>{available ? `${activeCount} ${activeCount === 1 ? "family" : "families"} active now` : "Activity connection unavailable"}</strong>
      </span>
      <span className={styles.openHint}>Open</span>
    </button>;
  }

  return <aside className={styles.panel} role="dialog" aria-modal="false" aria-label="Founder live activity">
    <div className={styles.panelHeader}>
      <div>
        <div className={styles.liveHeading}><span className={`${styles.liveDot} ${available ? styles.liveDotOn : styles.liveDotOff}`} aria-hidden="true" /><span>Live activity</span></div>
        <h2>What families are doing now</h2>
        <p>Auto-refreshes every 30 seconds while this panel is open.</p>
      </div>
      <div className={styles.headerButtons}>
        <button type="button" className={styles.refreshButton} onClick={() => void refresh()} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button>
        <button type="button" className={styles.closeButton} aria-label="Close live activity" onClick={() => setOpen(false)}>×</button>
      </div>
    </div>

    {error ? <div className={styles.errorBox}>{error}</div> : null}
    {!snapshot && loading ? <div className={styles.loadingBox}>Loading current family activity…</div> : null}

    {snapshot ? <>
      <div className={styles.summaryGrid}>
        <div><strong>{snapshot.activeNow.length}</strong><span>active now</span></div>
        <div><strong>{snapshot.last30Minutes.sessions}</strong><span>sessions · 30 min</span></div>
        <div><strong>{snapshot.last30Minutes.pageMovements}</strong><span>page movements</span></div>
        <div><strong>{snapshot.last30Minutes.meaningfulActions}</strong><span>meaningful actions</span></div>
      </div>

      <section className={styles.block}>
        <div className={styles.blockHeader}><div><span className={styles.eyebrow}>Right now</span><h3>Active families</h3></div><span>{formatClock(snapshot.generatedAt)}</span></div>
        {snapshot.activeNow.length ? <div className={styles.activeList}>{snapshot.activeNow.map((family) => <div className={styles.activeRow} key={family.userId}>
          <span className={styles.personDot} aria-hidden="true" />
          <div><strong>{family.displayName}</strong><span>{family.currentLocation}</span></div>
          <time dateTime={family.lastSeenAt}>{ago(family.lastSeenAt)}</time>
        </div>)}</div> : <div className={styles.empty}>No genuine family account has recorded activity in the last five minutes.</div>}
      </section>

      <section className={styles.block}>
        <div className={styles.blockHeader}><div><span className={styles.eyebrow}>Potential bottlenecks</span><h3>Patterns worth reviewing</h3></div></div>
        {snapshot.signals.length ? <div className={styles.signalList}>{snapshot.signals.map((signal) => <article key={signal.kind} className={styles.signalCard}>
          <span className={styles.eyebrow}>INVESTIGATE</span>
          <div><strong>{signal.title}</strong><span>{signal.occurrences} observed {signal.occurrences === 1 ? "session" : "sessions"} · {signal.families.length} {signal.families.length === 1 ? "family" : "families"}</span></div>
          <p>{signal.detail}</p>
          <small>{signal.families.join(", ")}</small>
        </article>)}</div> : <div className={styles.empty}>No clear friction pattern is currently visible in the recent tracked sessions.</div>}
      </section>

      <section className={styles.block}>
        <div className={styles.blockHeader}><div><span className={styles.eyebrow}>Behaviour drilldown</span><h3>Recent family sessions</h3></div><span>Last 7 days</span></div>
        {snapshot.recentSessions.length ? <div className={styles.sessionList}>{snapshot.recentSessions.map((session) => <div key={session.id} className={`${styles.sessionCard} ${selectedSessionId === session.id ? styles.sessionCardOpen : ""}`}>
          <button type="button" className={styles.sessionButton} aria-expanded={selectedSessionId === session.id} onClick={() => setSelectedSessionId((current) => current === session.id ? null : session.id)}>
            <div className={styles.sessionPerson}>
              <strong>{session.displayName}</strong>
              <span>{session.email && session.email !== session.displayName ? session.email : formatDateTime(session.startedAt)}</span>
            </div>
            <div className={styles.sessionMeta}><strong>{session.activeNow ? "Live" : formatDuration(session.durationSeconds)}</strong><span>{session.currentLocation} · {session.eventCount} events</span></div>
            <span className={styles.chevron}>{selectedSessionId === session.id ? "−" : "+"}</span>
          </button>
          {selectedSessionId === session.id && selectedSession ? <SessionDetail session={selectedSession} /> : null}
        </div>)}</div> : <div className={styles.empty}>No tracked family sessions are available in the last seven days.</div>}
      </section>

      <p className={styles.disclaimer}>This view reconstructs tracked navigation and meaningful product actions only. Page time is estimated between recorded page movements. Raw click capture and session replay are not enabled here.</p>
    </> : null}
  </aside>;
}
