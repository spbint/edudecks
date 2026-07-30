"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { V2Card, V2PageHeader, v2Tokens } from "@/app/components/clean/design-v2/MyLearnaAppShellV2";
import type { PlanLibraryEntry } from "@/lib/intelligence/plans/library";

type Filter = "all" | "lesson" | "unit";
type Status = "all" | "Draft" | "Ready to use" | "Archived";

const button: React.CSSProperties = { minHeight: 44, border: `1px solid ${v2Tokens.border}`, borderRadius: 11, padding: "9px 13px", background: "#fff", color: v2Tokens.navy, font: "inherit", fontWeight: 700, textDecoration: "none", cursor: "pointer" };

export default function MyPlansWorkspace() {
  const [plans, setPlans] = useState<PlanLibraryEntry[]>([]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<Filter>("all");
  const [status, setStatus] = useState<Status>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/intelligence/plans", { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "We could not load your plans.");
      setPlans(Array.isArray(payload.plans) ? payload.plans : []);
    } catch { setError("We could not load your plans right now. Please try again."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return plans.filter((entry) => {
      if (type !== "all" && entry.planType !== type) return false;
      if (status !== "all" && entry.displayStatus !== status) return false;
      if (!needle) return true;
      return [entry.content.title, entry.content.subjects.join(" "), entry.sourceTitle, entry.sourceProvider].some((value) => String(value ?? "").toLowerCase().includes(needle));
    });
  }, [plans, query, status, type]);

  async function mutate(entry: PlanLibraryEntry, action: "archive" | "restore" | "duplicate") {
    const response = await fetch(`/api/intelligence/plans/${entry.planType}/${entry.plan.id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action }) });
    if (response.ok) await load();
  }

  return <div style={{ display: "grid", gap: 18 }}>
    <V2PageHeader eyebrow="Plan" title="My Plans" subtitle="Your editable lesson and unit plan library. Ready-to-use plans can be scheduled without approval." />
    <V2Card>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) repeat(2, minmax(130px, 180px))", gap: 10 }}>
        <label style={{ display: "grid", gap: 5, color: v2Tokens.navy, fontWeight: 700 }}>Search<input aria-label="Search plans" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Title, subject or source" style={{ ...button, fontWeight: 500, textAlign: "left" }} /></label>
        <label style={{ display: "grid", gap: 5, color: v2Tokens.navy, fontWeight: 700 }}>Type<select aria-label="Filter plan type" value={type} onChange={(e) => setType(e.target.value as Filter)} style={button}><option value="all">All plans</option><option value="lesson">Lesson</option><option value="unit">Unit</option></select></label>
        <label style={{ display: "grid", gap: 5, color: v2Tokens.navy, fontWeight: 700 }}>Status<select aria-label="Filter plan status" value={status} onChange={(e) => setStatus(e.target.value as Status)} style={button}><option value="all">All statuses</option><option>Draft</option><option>Ready to use</option><option>Archived</option></select></label>
      </div>
    </V2Card>
    {error ? <V2Card><div role="alert" style={{ color: "#9f1239" }}>{error} <button type="button" onClick={() => void load()} style={button}>Try again</button></div></V2Card> : null}
    {loading ? <V2Card><p style={{ margin: 0, color: v2Tokens.slate }}>Loading your plans…</p></V2Card> : null}
    {!loading && !error && !filtered.length ? <V2Card><h2 style={{ marginTop: 0 }}>No plans found</h2><p style={{ color: v2Tokens.slate }}>Save an idea and generate a lesson or unit plan to see it here.</p><Link href="/my-ideas" style={{ ...button, display: "inline-flex", alignItems: "center" }}>Open My Ideas</Link></V2Card> : null}
    <div style={{ display: "grid", gap: 12 }}>
      {filtered.map((entry) => <V2Card key={`${entry.planType}-${entry.plan.id}`}>
        <article style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><div><span style={{ color: v2Tokens.slate, fontSize: 12, fontWeight: 800, letterSpacing: ".08em" }}>{entry.planType === "lesson" ? "LESSON PLAN" : "UNIT PLAN"}</span><h2 style={{ margin: "4px 0 0", color: v2Tokens.navy, fontSize: 20 }}>{entry.content.title || entry.plan.title}</h2></div><strong style={{ color: entry.displayStatus === "Ready to use" ? "#166534" : v2Tokens.slate }}>{entry.displayStatus}</strong></div>
          <p style={{ margin: 0, color: v2Tokens.slate, lineHeight: 1.5 }}>{entry.content.overview}</p>
          <span style={{ color: v2Tokens.slate, fontSize: 13 }}>{entry.content.subjects.join(", ")} · {entry.content.ageStage} · Version {entry.plan.version}</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}><Link href={entry.detailHref} style={{ ...button, background: v2Tokens.purple, borderColor: v2Tokens.purple, color: "#fff" }}>Open plan</Link>{entry.reviewHref ? <Link href={entry.reviewHref} style={button}>Continue editing</Link> : null}{entry.displayStatus === "Ready to use" ? <Link href={`${entry.detailHref}?schedule=1`} style={button}>Schedule</Link> : null}{entry.displayStatus === "Archived" ? <button type="button" onClick={() => void mutate(entry, "restore")} style={button}>Restore</button> : <button type="button" onClick={() => void mutate(entry, "archive")} style={button}>Archive</button>}<button type="button" onClick={() => void mutate(entry, "duplicate")} style={button}>Duplicate</button></div>
        </article>
      </V2Card>)}
    </div>
  </div>;
}
