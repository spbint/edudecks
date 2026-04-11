"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import FamilyTopNavShell, { FamilyCommandLayer } from "@/app/components/FamilyTopNavShell";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  FAMILY_GUIDANCE_SNAPSHOT_EVENT,
  type FamilyGuidanceDebugSnapshot,
} from "@/lib/familyGuidanceEvents";
import {
  withFamilyShellHandoffQuery,
  writeFamilyShellHandoff,
} from "@/lib/familyCommandHandoff";

type ChildRow = {
  id: string;
  preferred_name?: string | null;
  first_name?: string | null;
  surname?: string | null;
  family_name?: string | null;
  last_name?: string | null;
  year_level?: number | null;
  yearLabel?: string | null;
};

type EvidenceRow = {
  id: string;
  student_id?: string | null;
  title?: string | null;
  summary?: string | null;
  note?: string | null;
  learning_area?: string | null;
  occurred_on?: string | null;
  created_at?: string | null;
  image_url?: string | null;
  photo_url?: string | null;
  attachment_urls?: string[] | string | null;
  is_deleted?: boolean | null;
};

declare global {
  interface Window {
    __EDUDECKS_FAMILY_GUIDANCE_SNAPSHOT__?: FamilyGuidanceDebugSnapshot;
  }
}

const ACTIVE_STUDENT_ID_KEY = "edudecks_active_student_id";
const CHILDREN_KEY = "edudecks_children_seed_v1";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function childName(child?: ChildRow | null) {
  if (!child) return "Your learner";
  const first = safe(child.preferred_name || child.first_name);
  const last = safe(child.surname || child.family_name || child.last_name);
  return `${first} ${last}`.trim() || "Your learner";
}

function childYearLabel(child?: ChildRow | null) {
  if (!child) return "";
  if (child.year_level != null && safe(child.year_level)) return `Year ${safe(child.year_level)}`;
  return safe(child.yearLabel);
}

function shortDate(value?: string | null) {
  const s = safe(value);
  if (!s) return "â€”";
  try {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s.slice(0, 10);
    return d.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return s.slice(0, 10);
  }
}

function daysSince(value?: string | null) {
  const s = safe(value);
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
}

function normalizeArea(value?: string | null) {
  const raw = safe(value).toLowerCase();
  if (!raw) return "";
  if (raw.includes("liter") || raw.includes("reading") || raw.includes("writing") || raw.includes("english")) {
    return "Literacy";
  }
  if (raw.includes("math") || raw.includes("num")) return "Numeracy";
  if (raw.includes("science")) return "Science";
  if (raw.includes("history") || raw.includes("geography") || raw.includes("human")) return "Humanities";
  if (raw.includes("art") || raw.includes("music") || raw.includes("drama")) return "The Arts";
  if (raw.includes("health") || raw.includes("pe") || raw.includes("wellbeing")) return "Health";
  if (raw.includes("tech")) return "Technologies";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function evidenceStamp(row: EvidenceRow) {
  return safe(row.occurred_on) || safe(row.created_at);
}

function evidenceThumb(row: EvidenceRow) {
  return safe(row.photo_url || row.image_url);
}

function readSeedChildren(): ChildRow[] {
  if (typeof window === "undefined") return [];
  const raw = parseJson<any[]>(window.localStorage.getItem(CHILDREN_KEY), []);
  return raw.map((child) => ({
    id: safe(child?.id),
    preferred_name: safe(child?.preferred_name || child?.first_name || child?.name) || null,
    first_name: safe(child?.first_name) || null,
    surname: safe(child?.surname || child?.family_name || child?.last_name) || null,
    family_name: safe(child?.family_name) || null,
    last_name: safe(child?.last_name) || null,
    year_level: Number.isFinite(Number(child?.year_level)) ? Number(child?.year_level) : null,
    yearLabel: safe(child?.yearLabel || child?.year_label) || null,
  })).filter((child) => child.id);
}

async function loadLinkedChildren() {
  const seedChildren = readSeedChildren();
  const authResp = await supabase.auth.getUser();
  const userId = authResp.data.user?.id;
  if (!userId) return seedChildren;

  const linksResp = await supabase
    .from("parent_student_links")
    .select("student_id,sort_order,created_at")
    .eq("parent_user_id", userId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (linksResp.error) return seedChildren;
  const ids = ((linksResp.data ?? []) as Array<{ student_id?: string | null }>)
    .map((row) => safe(row.student_id))
    .filter(Boolean);
  if (!ids.length) return seedChildren;

  const selects = [
    "id,preferred_name,first_name,surname,family_name,last_name,year_level,yearLabel",
    "id,preferred_name,first_name,surname,family_name,last_name,year_level",
    "id,preferred_name,first_name,surname,last_name,year_level",
    "id,preferred_name,first_name,surname,last_name",
    "id,first_name,surname,last_name",
  ];

  for (const select of selects) {
    const resp = await supabase.from("students").select(select).in("id", ids);
    if (!resp.error) {
      const rows = ((resp.data ?? []) as unknown) as ChildRow[];
      return ids
        .map((id) => rows.find((row) => safe(row.id) === id))
        .filter(Boolean) as ChildRow[];
    }
  }

  return seedChildren;
}

async function loadEvidenceForChild(childId: string) {
  const selects = [
    "id,student_id,title,summary,note,learning_area,occurred_on,created_at,image_url,photo_url,attachment_urls,is_deleted",
    "id,student_id,title,summary,note,learning_area,occurred_on,created_at,image_url,photo_url,is_deleted",
    "id,student_id,title,summary,note,learning_area,occurred_on,created_at,is_deleted",
  ];

  for (const select of selects) {
    const resp = await supabase
      .from("evidence_entries")
      .select(select)
      .eq("student_id", childId)
      .eq("is_deleted", false)
      .order("occurred_on", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (!resp.error) return ((resp.data ?? []) as unknown) as EvidenceRow[];
  }

  return [];
}

function shellChip(label?: string, tone: "neutral" | "info" | "warning" | "success" = "neutral"): React.CSSProperties {
  const tones = {
    neutral: { bg: "#f8fafc", fg: "#475569", bd: "#e2e8f0" },
    info: { bg: "#eff6ff", fg: "#1d4ed8", bd: "#bfdbfe" },
    warning: { bg: "#fff7ed", fg: "#c2410c", bd: "#fdba74" },
    success: { bg: "#ecfdf5", fg: "#047857", bd: "#86efac" },
  };
  const toneSet = tones[tone];
  return {
    display: label ? "inline-flex" : "none",
    alignItems: "center",
    minHeight: 30,
    padding: "0 10px",
    borderRadius: 999,
    border: `1px solid ${toneSet.bd}`,
    background: toneSet.bg,
    color: toneSet.fg,
    fontSize: 12,
    fontWeight: 800,
    lineHeight: 1.2,
    whiteSpace: "nowrap",
  };
}

function snapshotTone(label?: string): "neutral" | "info" | "warning" | "success" {
  const lower = safe(label).toLowerCase();
  if (!lower) return "neutral";
  if (lower.includes("ready") || lower.includes("healthy")) return "success";
  if (lower.includes("not ready") || lower.includes("attention") || lower.includes("starting")) return "warning";
  if (lower.includes("taking shape") || lower.includes("building") || lower.includes("close")) return "info";
  return "neutral";
}

export default function FamilyPage() {
  const pathname = usePathname();
  const [children, setChildren] = useState<ChildRow[]>([]);
  const [activeChildId, setActiveChildId] = useState("");
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<FamilyGuidanceDebugSnapshot | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSnapshot(window.__EDUDECKS_FAMILY_GUIDANCE_SNAPSHOT__ || null);

    function handleSnapshot(event: Event) {
      const detail = (event as CustomEvent<FamilyGuidanceDebugSnapshot>).detail;
      if (!detail) return;
      setSnapshot(detail);
    }

    window.addEventListener(FAMILY_GUIDANCE_SNAPSHOT_EVENT, handleSnapshot as EventListener);
    return () => {
      window.removeEventListener(FAMILY_GUIDANCE_SNAPSHOT_EVENT, handleSnapshot as EventListener);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      setLoading(true);
      const linkedChildren = await loadLinkedChildren();
      if (!mounted) return;
      setChildren(linkedChildren);

      const storedId =
        typeof window !== "undefined" ? safe(window.localStorage.getItem(ACTIVE_STUDENT_ID_KEY)) : "";
      const nextActiveId =
        linkedChildren.find((child) => safe(child.id) === storedId)?.id ||
        linkedChildren[0]?.id ||
        "";

      setActiveChildId(nextActiveId);

      if (nextActiveId) {
        const rows = await loadEvidenceForChild(nextActiveId);
        if (!mounted) return;
        setEvidence(rows);
      } else {
        setEvidence([]);
      }

      setLoading(false);
    }

    void hydrate();
    return () => {
      mounted = false;
    };
  }, []);

  const activeChild = useMemo(
    () => children.find((child) => safe(child.id) === safe(activeChildId)) || children[0] || null,
    [activeChildId, children]
  );

  const recentEvidence = useMemo(() => evidence.slice(0, 5), [evidence]);
  const weeklyEvidence = useMemo(
    () => evidence.filter((row) => (daysSince(evidenceStamp(row)) ?? 99) <= 7),
    [evidence]
  );
  const areaBreadth = useMemo(
    () => new Set(weeklyEvidence.map((row) => normalizeArea(row.learning_area)).filter(Boolean)).size,
    [weeklyEvidence]
  );
  const latestEvidenceDays = useMemo(
    () => (evidence.length ? daysSince(evidenceStamp(evidence[0])) : null),
    [evidence]
  );

  const weeklySnapshot = useMemo(() => {
    if (!activeChild) {
      return "Add a child to begin building a calm learning record.";
    }
    if (!evidence.length) {
      return `${childName(activeChild)} does not have any saved learning yet. One small capture is enough to get the week moving.`;
    }

    const freshnessText =
      latestEvidenceDays == null
        ? "Freshness is still unclear."
        : latestEvidenceDays === 0
        ? "Latest capture was today."
        : latestEvidenceDays === 1
        ? "Latest capture was yesterday."
        : `Latest capture was ${latestEvidenceDays} days ago.`;

    if (!weeklyEvidence.length) {
      return `${childName(activeChild)} already has ${evidence.length} saved learning ${evidence.length === 1 ? "moment" : "moments"}, but nothing has been captured this week yet. ${freshnessText}`;
    }

    if (areaBreadth <= 1) {
      return `${weeklyEvidence.length} learning ${weeklyEvidence.length === 1 ? "moment" : "moments"} captured this week, with the mix still fairly focused in one area. ${freshnessText}`;
    }

    return `${weeklyEvidence.length} learning ${weeklyEvidence.length === 1 ? "moment" : "moments"} this week across ${areaBreadth} ${areaBreadth === 1 ? "area" : "areas"}. ${freshnessText}`;
  }, [activeChild, areaBreadth, evidence.length, latestEvidenceDays, weeklyEvidence.length]);

  const continueCard = useMemo(() => {
    if (!snapshot?.bestNextMove || !snapshot?.bestNextHref) return null;
    const href = snapshot.bestNextHandoff
      ? withFamilyShellHandoffQuery(snapshot.bestNextHref, snapshot.bestNextHandoff)
      : snapshot.bestNextHref;

    return {
      href,
      label: snapshot.bestNextMove,
      reason: snapshot.bestNextSuggestion || snapshot.bestNextWhy || "Continue with the next calm step.",
      chip: snapshot.bestNextActionLabel || "Open next",
      onClick() {
        writeFamilyShellHandoff(snapshot.bestNextHandoff || null);
      },
    };
  }, [snapshot]);

  const gentleNudge = useMemo(() => {
    const text = safe(snapshot?.reassuranceDetail);
    if (!text) return "";
    const reason = safe(snapshot?.bestNextWhy).toLowerCase();
    if (reason && reason.includes(text.toLowerCase())) return "";
    return text;
  }, [snapshot?.bestNextWhy, snapshot?.reassuranceDetail]);

  const crossChildNote = useMemo(() => {
    const text = safe(snapshot?.crossChildDetail);
    if (!text || children.length < 2) return "";
    return text;
  }, [children.length, snapshot?.crossChildDetail]);

  return (
    <FamilyTopNavShell
      title="EduDecks Family"
      subtitle="Family Home"
      hideHero={true}
    >
      <div style={{ display: "grid", gap: 18 }}>
        <FamilyCommandLayer pathname={pathname} />

        <section
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 22,
            background: "#ffffff",
            padding: 22,
            boxShadow: "0 12px 30px rgba(15,23,42,0.05)",
            display: "grid",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "start" }}>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: "#64748b" }}>
                Family Home
              </div>
              <div style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)", fontWeight: 900, lineHeight: 1.05, color: "#0f172a" }}>
                {activeChild ? childName(activeChild) : "Your family learning home"}
              </div>
              <div style={{ fontSize: 15, lineHeight: 1.6, color: "#475569", maxWidth: 760 }}>
                {activeChild
                  ? `${childYearLabel(activeChild) || "Year level"} in view. This home page keeps the next calm move, recent learning, and weekly rhythm easy to scan.`
                  : "Select a child from the shell switcher to see the clearest next move and recent learning."}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {snapshot?.momentumLabel ? <span style={shellChip(snapshot.momentumLabel, snapshotTone(snapshot.momentumLabel))}>{snapshot.momentumLabel}</span> : null}
            {snapshot?.readinessConfidenceLabel ? (
              <span style={shellChip(snapshot.readinessConfidenceLabel, snapshotTone(snapshot.readinessConfidenceLabel))}>
                {snapshot.readinessConfidenceLabel}
              </span>
            ) : null}
            {snapshot?.focusLabel ? <span style={shellChip(snapshot.focusLabel, "neutral")}>{snapshot.focusLabel}</span> : null}
            {childYearLabel(activeChild) ? <span style={shellChip(childYearLabel(activeChild), "neutral")}>{childYearLabel(activeChild)}</span> : null}
          </div>
        </section>

        {continueCard ? (
          <section
            style={{
              border: "1px solid #dbeafe",
              background: "linear-gradient(180deg, #f8fbff 0%, #eff6ff 100%)",
              borderRadius: 20,
              padding: 20,
              display: "grid",
              gap: 10,
              boxShadow: "0 12px 30px rgba(15,23,42,0.04)",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: "#64748b" }}>
              Continue next
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "start" }}>
              <div style={{ display: "grid", gap: 6, maxWidth: 720 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>{continueCard.label}</div>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: "#334155" }}>{continueCard.reason}</div>
              </div>
              <Link
                href={continueCard.href}
                onClick={continueCard.onClick}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 34,
                  padding: "0 12px",
                  borderRadius: 999,
                  background: "#1d4ed8",
                  color: "#ffffff",
                  textDecoration: "none",
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 0.3,
                  textTransform: "uppercase",
                  boxShadow: "0 10px 22px rgba(29,78,216,0.18)",
                }}
              >
                {continueCard.chip}
              </Link>
            </div>
          </section>
        ) : null}

        <section
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 20,
            background: "#ffffff",
            padding: 18,
            boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
            display: "grid",
            gap: 8,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: "#64748b" }}>
            Weekly snapshot
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.65, color: "#334155" }}>
            {loading ? "Building this week's snapshotâ€¦" : weeklySnapshot}
          </div>
        </section>

        <section
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 20,
            background: "#ffffff",
            padding: 18,
            boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
            display: "grid",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: "#64748b" }}>
                Recent learning
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
                The last few learning moments shaping the story
              </div>
            </div>
            <Link href="/portfolio" style={{ color: "#1d4ed8", fontSize: 13, fontWeight: 800, textDecoration: "none" }}>
              Open portfolio
            </Link>
          </div>

          {recentEvidence.length ? (
            <div style={{ display: "grid", gap: 12 }}>
              {recentEvidence.map((row) => (
                <Link
                  key={row.id}
                  href={`/portfolio?highlightEvidenceId=${row.id}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: evidenceThumb(row) ? "64px minmax(0,1fr)" : "minmax(0,1fr)",
                    gap: 12,
                    alignItems: "center",
                    border: "1px solid #eef2f7",
                    borderRadius: 16,
                    padding: 12,
                    textDecoration: "none",
                    color: "#0f172a",
                    background: "#ffffff",
                  }}
                >
                  {evidenceThumb(row) ? (
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 12,
                        backgroundImage: `url(${evidenceThumb(row)})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundColor: "#e2e8f0",
                      }}
                    />
                  ) : null}
                  <div style={{ display: "grid", gap: 4 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                      {safe(row.title) || safe(row.summary) || safe(row.note) || "Untitled learning moment"}
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.55, color: "#475569" }}>
                      {normalizeArea(row.learning_area) || "Learning"} · {shortDate(evidenceStamp(row))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 14, lineHeight: 1.6, color: "#64748b" }}>
              No recent learning has been saved yet. One small capture is enough to start the record.
            </div>
          )}
        </section>

        {gentleNudge ? (
          <section
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 18,
              background: "#f8fafc",
              padding: "14px 16px",
              fontSize: 13,
              lineHeight: 1.6,
              color: "#475569",
            }}
          >
            <span style={{ fontWeight: 800, color: "#0f172a" }}>Gentle nudge:</span> {gentleNudge}
          </section>
        ) : null}

        {crossChildNote ? (
          <section
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 18,
              background: "#ffffff",
              padding: "14px 16px",
              fontSize: 13,
              lineHeight: 1.6,
              color: "#475569",
            }}
          >
            <span style={{ fontWeight: 800, color: "#0f172a" }}>Across the family:</span> {crossChildNote}
          </section>
        ) : null}
      </div>
    </FamilyTopNavShell>
  );
}

