"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { V2Card, V2PageHeader, v2Tokens } from "@/app/components/clean/design-v2/MyLearnaAppShellV2";
import { useCleanFamilyWorkspace } from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import type { LearningPlanType } from "@/lib/intelligence/plans/types";
import type { PlanLibraryEntry } from "@/lib/intelligence/plans/library";

export default function PlanDetailWorkspace({ planType, planId }: { planType: LearningPlanType; planId: string }) {
  const [entry, setEntry] = useState<PlanLibraryEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scheduleMessage, setScheduleMessage] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [wholeFamily, setWholeFamily] = useState(false);
  const [learnerId, setLearnerId] = useState("");
  const [scheduleBusy, setScheduleBusy] = useState(false);
  const workspace = useCleanFamilyWorkspace();
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const response = await fetch(`/api/intelligence/plans/${planType}/${encodeURIComponent(planId)}`, { cache: "no-store" }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error); setEntry(payload as PlanLibraryEntry); }
    catch { setError("We could not open this plan right now."); }
    finally { setLoading(false); }
  }, [planId, planType]);
  useEffect(() => { void load(); }, [load]);
  if (loading) return <V2Card><p>Loading plan…</p></V2Card>;
  if (error || !entry) return <V2Card><div role="alert">{error || "Plan not found."} <button type="button" onClick={() => void load()}>Try again</button></div></V2Card>;
  const content = entry.content;
  async function schedule() {
    setScheduleBusy(true); setScheduleMessage("");
    try {
      const response = await fetch(`/api/intelligence/plans/${planType}/${encodeURIComponent(planId)}/schedule`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ plannedDate: scheduleDate, wholeFamily, learnerIds: wholeFamily ? [] : learnerId ? [learnerId] : [] }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "We could not schedule this plan.");
      setScheduleMessage(`Scheduled ${payload.created ?? 0} learning item${payload.created === 1 ? "" : "s"}.`);
      setScheduleOpen(false);
    } catch (error) { setScheduleMessage(error instanceof Error ? error.message : "We could not schedule this plan."); }
    finally { setScheduleBusy(false); }
  }
  return <div style={{ display: "grid", gap: 18 }}>
    <V2PageHeader eyebrow={entry.planType === "lesson" ? "Lesson plan" : "Unit plan"} title={content.title || entry.plan.title} subtitle={`${entry.displayStatus} · Version ${entry.plan.version}`} />
    <V2Card><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}><Link href="/my-plans" style={{ minHeight: 44, display: "inline-flex", alignItems: "center", ...{ border: `1px solid ${v2Tokens.border}`, borderRadius: 11, padding: "9px 13px", color: v2Tokens.navy, textDecoration: "none" } }}>Back to My Plans</Link>{entry.reviewHref ? <Link href={entry.reviewHref} style={{ minHeight: 44, display: "inline-flex", alignItems: "center", border: `1px solid ${v2Tokens.border}`, borderRadius: 11, padding: "9px 13px", color: v2Tokens.navy, textDecoration: "none" }}>Edit plan</Link> : null}<button type="button" onClick={() => window.print()} style={{ minHeight: 44, border: `1px solid ${v2Tokens.border}`, borderRadius: 11, padding: "9px 13px", background: "#fff", color: v2Tokens.navy, fontWeight: 700 }}>Print</button><button type="button" onClick={() => setScheduleOpen((value) => !value)} style={{ minHeight: 44, border: `1px solid ${v2Tokens.purple}`, borderRadius: 11, padding: "9px 13px", background: v2Tokens.purple, color: "#fff", fontWeight: 700 }}>Schedule</button></div>{scheduleOpen ? <div style={{ marginTop: 14, display: "grid", gap: 10, maxWidth: 520 }}><label style={{ display: "grid", gap: 5 }}>Date<input type="date" value={scheduleDate} onChange={(event) => setScheduleDate(event.target.value)} style={{ minHeight: 44, padding: 10, border: `1px solid ${v2Tokens.border}`, borderRadius: 10 }} /></label><label style={{ display: "flex", gap: 8, alignItems: "center", minHeight: 44 }}><input type="checkbox" checked={wholeFamily} onChange={(event) => setWholeFamily(event.target.checked)} /> Whole family</label>{!wholeFamily ? <label style={{ display: "grid", gap: 5 }}>Learner<select value={learnerId} onChange={(event) => setLearnerId(event.target.value)} style={{ minHeight: 44, padding: 10, border: `1px solid ${v2Tokens.border}`, borderRadius: 10 }}><option value="">Choose a learner</option>{workspace.learners.map((learner) => <option key={learner.id} value={learner.id}>{learner.preferredName || learner.firstName} {learner.surname || ""}</option>)}</select></label> : null}<button type="button" disabled={scheduleBusy || !scheduleDate || (!wholeFamily && !learnerId)} onClick={() => void schedule()} style={{ minHeight: 44, border: 0, borderRadius: 10, background: v2Tokens.purple, color: "#fff", fontWeight: 800 }}>{scheduleBusy ? "Scheduling…" : "Schedule this version"}</button></div> : null}{scheduleMessage ? <p role="status" style={{ color: v2Tokens.slate }}>{scheduleMessage} <Link href="/my-calendar">Open My Calendar</Link></p> : null}</V2Card>
    <V2Card><div style={{ display: "grid", gap: 18 }}><p style={{ margin: 0, color: v2Tokens.slate }}>{content.overview}</p><div><strong>Learning intentions</strong><ul>{content.learningIntentions.map((item, i) => <li key={i}>{item}</li>)}</ul></div><div><strong>Success criteria</strong><ul>{content.successCriteria.map((item, i) => <li key={i}>{item}</li>)}</ul></div><div><strong>Preparation and materials</strong><ul>{[...content.preparation, ...content.resourceRequirements.map((item) => item.name)].map((item, i) => <li key={i}>{item}</li>)}</ul></div><div><strong>Sequence</strong><ol>{content.sequence.map((item, i) => <li key={i}><strong>{item.title}</strong><div>{item.activity}</div></li>)}</ol></div><div><strong>Evidence prompts</strong><ul>{content.evidencePrompts.map((item, i) => <li key={i}>{item}</li>)}</ul></div><div><strong>Safety and supervision</strong><ul>{content.safetySupervisionNotes.map((item, i) => <li key={i}>{item}</li>)}</ul></div>{entry.sourceUrl ? <p><a href={entry.sourceUrl} target="_blank" rel="noreferrer noopener">Open original source</a></p> : null}</div></V2Card>
  </div>;
}
