"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthUser } from "@/app/components/AuthUserProvider";
import { useCleanFamilyWorkspace } from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import { listCleanCalendarItems, updateCleanCalendarItem } from "@/lib/clean/calendar/client";
import type { CleanCalendarItem } from "@/lib/clean/calendar/types";
import { normalizeCleanErrorMessage } from "@/lib/clean/family/client";
import { listLearningQueueItems, moveLearningQueueItem } from "@/lib/clean/onDeck/client";
import { resolveOnDeckItem, sortLearningQueueItems, type LearningQueueItem } from "@/lib/clean/onDeck/learningQueue";
import { trackProductEvent } from "@/lib/clean/analytics/productAnalytics";
import { getLearnerViewTodayItems, sortLearnerViewTodayItems } from "@/lib/clean/learnerView/learnerView";

const pageStyle: React.CSSProperties = { minHeight: "100vh", background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 56%, #f8fafc 100%)", padding: "24px 16px 48px" };
const wrapStyle: React.CSSProperties = { width: "min(760px, 100%)", margin: "0 auto", display: "grid", gap: 18 };
const cardStyle: React.CSSProperties = { border: "1px solid #e2e8f0", borderRadius: 18, background: "#ffffff", padding: 18, display: "grid", gap: 12, boxShadow: "0 8px 22px rgba(15,23,42,0.04)" };
const actionStyle: React.CSSProperties = { minHeight: 46, borderRadius: 12, padding: "10px 14px", fontSize: 14, fontWeight: 800, cursor: "pointer" };

function todayDate() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function timeLabel(value: string | null) {
  if (!value) return "Any time";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function CleanLearnerViewWorkspace() {
  const workspace = useCleanFamilyWorkspace();
  const { user } = useAuthUser();
  const searchParams = useSearchParams();
  const selectedLearnerId = searchParams.get("learner_id") || "";
  const today = todayDate();
  const [calendarItems, setCalendarItems] = useState<CleanCalendarItem[]>([]);
  const [queueItems, setQueueItems] = useState<LearningQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyItemId, setBusyItemId] = useState("");

  const learner = workspace.learners.find((entry) => entry.id === selectedLearnerId) || null;
  const learnerName = learner?.preferredName || learner?.firstName || "Learner";
  const parentHref = selectedLearnerId ? `/my-day?learner_id=${encodeURIComponent(selectedLearnerId)}` : "/my-day";

  const load = useCallback(async () => {
    if (!workspace.profile || !selectedLearnerId) {
      setCalendarItems([]);
      setQueueItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [items, queue] = await Promise.all([
        listCleanCalendarItems(workspace.profile.id, { fromDate: today, toDate: today }),
        listLearningQueueItems(workspace.profile.id, selectedLearnerId),
      ]);
      setCalendarItems(items);
      setQueueItems(queue);
    } catch (reason) {
      setError(normalizeCleanErrorMessage(reason, "We could not load this learner view just now."));
    } finally {
      setLoading(false);
    }
  }, [selectedLearnerId, today, workspace.profile]);

  useEffect(() => { void load(); }, [load]);

  const todayItems = useMemo(
    () => sortLearnerViewTodayItems(getLearnerViewTodayItems(calendarItems, selectedLearnerId, today)),
    [calendarItems, selectedLearnerId, today],
  );
  const resolvedQueue = useMemo(
    () => sortLearningQueueItems(queueItems).map((item) => resolveOnDeckItem(item, "/my-pathways")),
    [queueItems],
  );

  async function toggleDone(item: CleanCalendarItem) {
    if (!workspace.profile || busyItemId === item.id) return;
    setBusyItemId(item.id);
    setError(null);
    try {
      await updateCleanCalendarItem(workspace.profile.id, item.id, { completedAt: item.completedAt ? null : new Date().toISOString() });
      trackProductEvent("learner_item_completed", { subjectKey: item.learningArea || null, completed: !item.completedAt }, user?.id);
      await load();
    } catch (reason) {
      setError(normalizeCleanErrorMessage(reason, "We could not update this activity just now."));
    } finally {
      setBusyItemId("");
    }
  }

  async function chooseNext(itemId: string) {
    if (!workspace.profile || busyItemId === itemId) return;
    const currentIndex = resolvedQueue.findIndex((entry) => entry.item.id === itemId);
    if (currentIndex <= 0) return;
    setBusyItemId(itemId);
    setError(null);
    try {
      let nextItems = queueItems;
      for (let index = currentIndex; index > 0; index -= 1) {
        nextItems = await moveLearningQueueItem(workspace.profile.id, selectedLearnerId, itemId, "up");
      }
      setQueueItems(nextItems);
      trackProductEvent("learner_on_deck_chosen_next", { subjectKey: resolvedQueue[currentIndex]?.item.subjectKey || null, onDeckCount: queueItems.length }, user?.id);
    } catch (reason) {
      setError(normalizeCleanErrorMessage(reason, "We could not choose this learning next."));
    } finally {
      setBusyItemId("");
    }
  }

  if (!selectedLearnerId || !learner) {
    return <main style={pageStyle}><div style={wrapStyle}><header style={cardStyle}><strong style={{ color: "#17204b", fontSize: 22 }}>Learner View</strong><p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>Choose a learner from My Day before opening Learner View.</p><Link href="/my-day" style={{ ...actionStyle, display: "inline-flex", alignItems: "center", justifyContent: "center", width: "fit-content", background: "#17204b", color: "#ffffff", textDecoration: "none" }}>Back to parent view</Link></header></div></main>;
  }

  return (
    <main style={pageStyle} aria-labelledby="learner-view-title">
      <div style={wrapStyle}>
        <header style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "grid", gap: 5 }}>
            <div style={{ color: "#2563eb", fontSize: 13, fontWeight: 850, letterSpacing: "0.08em", textTransform: "uppercase" }}>MyLearna</div>
            <h1 id="learner-view-title" style={{ margin: 0, color: "#17204b", fontSize: 30, lineHeight: 1.1 }}>{learnerName}</h1>
          </div>
          <Link href={parentHref} onClick={() => trackProductEvent("learner_view_exited", {}, user?.id)} style={{ ...actionStyle, display: "inline-flex", alignItems: "center", textDecoration: "none", color: "#17204b", background: "#ffffff", border: "1px solid #cbd5e1" }}>Back to parent view</Link>
        </header>

        {error ? <section role="alert" style={{ ...cardStyle, color: "#b91c1c" }}>{error}</section> : null}
        {loading ? <section style={cardStyle} aria-live="polite">Loading today&apos;s learning...</section> : null}
        {!loading ? <>
          <section aria-labelledby="learner-today-title" style={cardStyle}>
            <div style={{ display: "grid", gap: 5 }}><p style={{ margin: 0, color: "#2563eb", fontSize: 12, fontWeight: 850, letterSpacing: "0.08em", textTransform: "uppercase" }}>Today</p><h2 id="learner-today-title" style={{ margin: 0, color: "#17204b", fontSize: 22 }}>What are you learning today?</h2></div>
            {!todayItems.length ? <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>Nothing is scheduled for today.</p> : <div style={{ display: "grid", gap: 10 }}>{todayItems.map((item) => <article key={item.id} style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 14, display: "grid", gap: 10, opacity: item.completedAt ? 0.72 : 1 }}><div style={{ display: "grid", gap: 5 }}><div style={{ color: "#64748b", fontSize: 13, fontWeight: 750 }}>{timeLabel(item.startsAt)}{item.learningArea ? ` · ${item.learningArea}` : ""}</div><h3 style={{ margin: 0, color: "#17204b", fontSize: 17 }}>{item.title}</h3>{item.completedAt ? <span role="status" style={{ color: "#166534", fontWeight: 800 }}>✓ Done</span> : null}</div><button type="button" onClick={() => void toggleDone(item)} disabled={busyItemId === item.id} aria-label={item.completedAt ? `Mark ${item.title} not done` : `Mark ${item.title} done`} style={{ ...actionStyle, width: "fit-content", color: "#166534", background: "#f0fdf4", border: "1px solid #bbf7d0", opacity: busyItemId === item.id ? 0.6 : 1 }}>{busyItemId === item.id ? "Saving..." : item.completedAt ? "Undo" : "Done"}</button></article>)}</div>}
          </section>

          <section aria-labelledby="learner-on-deck-title" style={cardStyle}>
            <div style={{ display: "grid", gap: 5 }}><p style={{ margin: 0, color: "#2563eb", fontSize: 12, fontWeight: 850, letterSpacing: "0.08em", textTransform: "uppercase" }}>On Deck</p><h2 id="learner-on-deck-title" style={{ margin: 0, color: "#17204b", fontSize: 22 }}>Choose what&apos;s next</h2><p style={{ margin: 0, color: "#64748b", lineHeight: 1.5 }}>Learning that is ready when you are.</p></div>
            {!resolvedQueue.length ? <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>Nothing else is in focus right now.</p> : <div style={{ display: "grid", gap: 10 }}>{resolvedQueue.map((resolved) => <article key={resolved.item.id} style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 14, display: "grid", gap: 9 }}><div style={{ display: "grid", gap: 5 }}><div style={{ color: "#64748b", fontSize: 13, fontWeight: 750 }}>{resolved.subjectLabel}{resolved.worksheetAvailable ? " · Worksheet available" : ""}</div><h3 style={{ margin: 0, color: "#17204b", fontSize: 17 }}>{resolved.title}</h3>{resolved.pathwayLabel || resolved.stageLabel ? <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>{[resolved.pathwayLabel, resolved.stageLabel].filter(Boolean).join(" / ")}</p> : null}</div><button type="button" onClick={() => void chooseNext(resolved.item.id)} disabled={busyItemId === resolved.item.id || resolved.item.position === 0} aria-label={`Do ${resolved.title} next`} style={{ ...actionStyle, width: "fit-content", color: "#ffffff", background: "#6c4df6", border: "1px solid #6c4df6", opacity: busyItemId === resolved.item.id || resolved.item.position === 0 ? 0.6 : 1 }}>{resolved.item.position === 0 ? "✓ Next" : busyItemId === resolved.item.id ? "Saving..." : "Do this next"}</button></article>)}</div>}
          </section>
        </> : null}
      </div>
    </main>
  );
}
