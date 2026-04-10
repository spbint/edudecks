"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { loadFamilyProfile } from "@/lib/familySettings";
import { listReportDrafts, type ReportDraftRow } from "@/lib/reportDrafts";
import {
  buildFamilyShellHandoff,
  withFamilyShellHandoffQuery,
  writeFamilyShellHandoff,
} from "@/lib/familyCommandHandoff";
import {
  publishFamilyGuidanceSnapshot,
  trackFamilyGuidanceEvent,
} from "@/lib/familyGuidanceEvents";
import FamilyGuidanceDebugPanel from "./FamilyGuidanceDebugPanel";
import ProfileMenu from "./ProfileMenu";

type FamilyShellHeaderProps = {
  title?: string;
  subtitle?: string;
};

export type FamilyHeroProps = {
  heroTitle?: string;
  heroText?: string;
  heroAsideTitle?: string;
  heroAsideText?: string;
  workflowHelperText?: string;
  workflowCurrentHref?: string;
  hideHero?: boolean;
  hideHeroAside?: boolean;
};

type FamilyTopNavShellProps = FamilyShellHeaderProps & FamilyHeroProps;

const DEFAULT_SHELL_CONFIG: FamilyTopNavShellProps = {
  title: "EduDecks Family",
  subtitle: "Homeschool-first learning flow",
};

type FamilyShellConfigContextValue = {
  setConfig: (config: FamilyTopNavShellProps | null) => void;
};

const FamilyShellConfigContext = createContext<FamilyShellConfigContextValue | null>(null);

type NavItem = {
  href: string;
  label: string;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

type CommandItem = {
  href: string;
  label: string;
  detail: string;
};

type CommandTone = "neutral" | "info" | "warning" | "success";

type CommandSignal = {
  tone: CommandTone;
  label?: string;
  suggestion?: string;
  why?: string;
  blocker?: string;
  priority?: number;
};

type MomentumState = {
  label: string;
  detail: string;
  tone: CommandTone;
};

type ReadinessConfidenceState = {
  label: string;
  detail: string;
  tone: CommandTone;
};

type CrossChildNote = {
  label: string;
  detail: string;
  tone: CommandTone;
};

type ReassuranceNote = {
  label: string;
  detail: string;
  tone: CommandTone;
};

type WorkspaceFocus =
  | "build-weekly-record"
  | "round-out-portfolio"
  | "prepare-report"
  | "prepare-authority";

type FocusState = {
  key: WorkspaceFocus;
  label: string;
  detail: string;
};

type ContinuitySnapshot = {
  childId: string;
  capturedAt: number;
  weeklyCount: number;
  recentAreaCount: number;
  draftEvidenceCount: number;
  lastEvidenceDays: number;
};

type RecentActionMap = Partial<Record<"capture" | "planner" | "portfolio" | "reports" | "authority", number>>;

type EvidenceSignalRow = {
  id: string;
  student_id?: string | null;
  learning_area?: string | null;
  created_at?: string | null;
  occurred_on?: string | null;
};

const ACTIVE_STUDENT_ID_KEY = "edudecks_active_student_id";
const ACTIVE_CHILD_EVENT = "edudecksActiveChildChanged";
const COMMAND_MEMORY_KEY = "edudecks_family_command_memory_v1";
const COMMAND_COOLDOWN_MS = 1000 * 60 * 30;
const WORKSPACE_FOCUS_KEY = "edudecks_family_workspace_focus_v1";
const CONTINUITY_MEMORY_KEY = "edudecks_family_continuity_v1";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function asDateValue(value: string | null | undefined) {
  const raw = safe(value);
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function daysSince(value: string | null | undefined) {
  const parsed = asDateValue(value);
  if (!parsed) return null;
  const diff = Date.now() - parsed.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function normalizeArea(value: string | null | undefined) {
  const raw = safe(value).toLowerCase();
  if (!raw) return "";
  if (
    raw.includes("liter") ||
    raw.includes("reading") ||
    raw.includes("writing") ||
    raw.includes("english")
  ) {
    return "literacy";
  }
  if (raw.includes("math") || raw.includes("numer")) return "numeracy";
  if (raw.includes("science")) return "science";
  if (raw.includes("history") || raw.includes("geography") || raw.includes("human")) return "humanities";
  if (raw.includes("art") || raw.includes("music") || raw.includes("drama")) return "arts";
  if (raw.includes("health") || raw.includes("pe") || raw.includes("sport")) return "health";
  if (raw.includes("technolog")) return "technologies";
  if (raw.includes("language")) return "languages";
  return raw;
}

function titleCaseArea(value: string) {
  if (!value) return "another area";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function firstMissingPriorityArea(areaSet: Set<string>) {
  return ["science", "numeracy", "literacy", "humanities"].find((area) => !areaSet.has(area)) || "";
}

function dominantArea(rows: EvidenceSignalRow[]) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const area = normalizeArea(row.learning_area);
    if (!area) continue;
    counts.set(area, (counts.get(area) ?? 0) + 1);
  }

  let chosen = "";
  let chosenCount = 0;
  for (const [area, count] of counts.entries()) {
    if (count > chosenCount) {
      chosen = area;
      chosenCount = count;
    }
  }

  return { area: chosen, count: chosenCount, distinct: counts.size };
}

function evidenceDayKey(row: EvidenceSignalRow) {
  const parsed = asDateValue(row.occurred_on || row.created_at);
  if (!parsed) return "";
  return parsed.toISOString().slice(0, 10);
}

function recentDayBuckets(rows: EvidenceSignalRow[]) {
  const buckets = new Set<string>();
  for (const row of rows) {
    const key = evidenceDayKey(row);
    if (key) buckets.add(key);
  }
  return buckets;
}

function priorityWeight(tone: CommandTone) {
  if (tone === "warning") return 3;
  if (tone === "info") return 2;
  if (tone === "success") return 1;
  return 0;
}

function getCommandKeyForHref(href: string): keyof RecentActionMap | null {
  if (href.startsWith("/capture")) return "capture";
  if (href.startsWith("/planner")) return "planner";
  if (href.startsWith("/portfolio")) return "portfolio";
  if (href.startsWith("/reports")) return "reports";
  if (href.startsWith("/authority")) return "authority";
  return null;
}

function readRecentActionMemory(): RecentActionMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(COMMAND_MEMORY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const next: RecentActionMap = {};
    for (const key of ["capture", "planner", "portfolio", "reports", "authority"] as const) {
      const value = parsed[key];
      if (typeof value === "number" && Number.isFinite(value)) {
        next[key] = value;
      }
    }
    return next;
  } catch {
    return {};
  }
}

function writeRecentActionMemory(next: RecentActionMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(COMMAND_MEMORY_KEY, JSON.stringify(next));
}

function wasRecentAction(timestamp?: number) {
  if (!timestamp) return false;
  return Date.now() - timestamp < COMMAND_COOLDOWN_MS;
}

function focusFromPathname(pathname: string): WorkspaceFocus | null {
  if (pathname.startsWith("/capture") || pathname.startsWith("/planner")) return "build-weekly-record";
  if (pathname.startsWith("/portfolio")) return "round-out-portfolio";
  if (pathname.startsWith("/reports")) return "prepare-report";
  if (pathname.startsWith("/authority")) return "prepare-authority";
  return null;
}

function readWorkspaceFocus(): WorkspaceFocus | null {
  if (typeof window === "undefined") return null;
  const raw = safe(window.localStorage.getItem(WORKSPACE_FOCUS_KEY));
  if (
    raw === "build-weekly-record" ||
    raw === "round-out-portfolio" ||
    raw === "prepare-report" ||
    raw === "prepare-authority"
  ) {
    return raw;
  }
  return null;
}

function writeWorkspaceFocus(focus: WorkspaceFocus) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WORKSPACE_FOCUS_KEY, focus);
}

function readContinuitySnapshots(): ContinuitySnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CONTINUITY_MEMORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({
        childId: safe(item?.childId),
        capturedAt: typeof item?.capturedAt === "number" ? item.capturedAt : 0,
        weeklyCount: typeof item?.weeklyCount === "number" ? item.weeklyCount : 0,
        recentAreaCount: typeof item?.recentAreaCount === "number" ? item.recentAreaCount : 0,
        draftEvidenceCount: typeof item?.draftEvidenceCount === "number" ? item.draftEvidenceCount : 0,
        lastEvidenceDays: typeof item?.lastEvidenceDays === "number" ? item.lastEvidenceDays : 999,
      }))
      .filter((item) => item.childId);
  } catch {
    return [];
  }
}

function writeContinuitySnapshot(snapshot: ContinuitySnapshot) {
  if (typeof window === "undefined") return;
  const existing = readContinuitySnapshots().filter((item) => item.childId !== snapshot.childId);
  const next = [snapshot, ...existing].slice(0, 12);
  window.localStorage.setItem(CONTINUITY_MEMORY_KEY, JSON.stringify(next));
}

function isMissingColumnError(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && msg.includes("column");
}

function isMissingRelationOrColumn(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && (msg.includes("column") || msg.includes("relation"));
}

function isActive(pathname: string, href: string) {
  if (href === "/family") return pathname === "/family";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function navBtn(active: boolean): React.CSSProperties {
  return {
    border: active ? "1px solid #2563eb" : "1px solid #d1d5db",
    background: active ? "#2563eb" : "#fff",
    color: active ? "#fff" : "#111827",
    borderRadius: 12,
    padding: "10px 14px",
    fontWeight: 700,
    fontSize: 14,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    whiteSpace: "nowrap",
    boxShadow: active ? "0 10px 24px rgba(37,99,235,0.18)" : "none",
  };
}

function utilBtn(primary = false): React.CSSProperties {
  return {
    border: `1px solid ${primary ? "#2563eb" : "#d1d5db"}`,
    background: primary ? "#2563eb" : "#fff",
    color: primary ? "#fff" : "#111827",
    borderRadius: 12,
    padding: "10px 14px",
    fontWeight: 700,
    fontSize: 14,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    whiteSpace: "nowrap",
    boxShadow: primary ? "0 10px 24px rgba(37,99,235,0.18)" : "none",
  };
}

function sectionLabel(): React.CSSProperties {
  return {
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: "#64748b",
    marginBottom: 8,
  };
}

type FamilyChild = {
  id: string;
  preferred_name?: string | null;
  first_name?: string | null;
  surname?: string | null;
  family_name?: string | null;
  year_level?: number | null;
  photo_url?: string | null;
};

function childDisplayName(child: FamilyChild) {
  const first = safe(child.preferred_name || child.first_name);
  const sur = safe(child.surname || child.family_name);
  return `${first}${sur ? ` ${sur}` : ""}`.trim() || "Child";
}

function renderChildAvatar(child: FamilyChild, size: number = 32) {
  if (child.photo_url) {
    return (
      <img
        src={child.photo_url}
        alt={`${childDisplayName(child)} photo`}
        width={size}
        height={size}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover" }}
      />
    );
  }

  const initials = childDisplayName(child)
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#eef2ff",
        color: "#1d4ed8",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size / 2.5,
      }}
    >
      {initials}
    </span>
  );
}

async function loadLinkedChildrenForUser(userId: string): Promise<FamilyChild[]> {
  const linkResp = await supabase
    .from("parent_student_links")
    .select("student_id")
    .eq("parent_user_id", userId);

  if (linkResp.error && !isMissingRelationOrColumn(linkResp.error)) {
    throw linkResp.error;
  }

  const studentIds = (linkResp.data ?? [])
    .map((row) => safe(row.student_id))
    .filter(Boolean);

  if (!studentIds.length) {
    return [];
  }

  const selects = [
    "id,preferred_name,first_name,surname,family_name,year_level,photo_url",
    "id,preferred_name,first_name,surname,family_name",
    "id,preferred_name,first_name,year_level",
    "id,preferred_name,first_name",
  ];

  for (const fields of selects) {
    const resp = (await supabase
      .from("students")
      .select(fields)
      .in("id", studentIds)) as { data: FamilyChild[] | null; error: { message: string } | null };

    if (!resp.error) {
      return (resp.data ?? []) as FamilyChild[];
    }

    if (!isMissingColumnError(resp.error)) {
      throw resp.error;
    }
  }

  return [];
}

function ChildSwitcher() {
  const [children, setChildren] = useState<FamilyChild[]>([]);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function fetchChildren() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const studentRows = await loadLinkedChildrenForUser(user.id);

        if (mounted && studentRows.length) {
          setChildren(studentRows);
        }
      } catch (error) {
        console.error("Child switcher load failed", error);
      }
    }

    fetchChildren();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!children.length) return;
    if (typeof window === "undefined") return;

    const storedId = localStorage.getItem(ACTIVE_STUDENT_ID_KEY);
    const matched = children.find((child) => child.id === storedId);
    const chosen = matched ?? children[0];
    setActiveChildId(chosen.id);
    broadcastActiveChild(chosen.id);
  }, [children]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePhotoUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ childId: string; photoUrl?: string }>).detail;
      if (!detail?.childId) return;
      setChildren((prev) =>
        prev.map((child) =>
          child.id === detail.childId
            ? { ...child, photo_url: detail.photoUrl ?? child.photo_url }
            : child
        )
      );
    };

    window.addEventListener("childPhotoUpdated", handlePhotoUpdate as EventListener);
    return () => {
      window.removeEventListener("childPhotoUpdated", handlePhotoUpdate as EventListener);
    };
  }, []);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!open) return;
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [open]);

    const currentChild = children.find((child) => child.id === activeChildId) ?? children[0];

  if (!currentChild) return null;

  function handleSelect(child: FamilyChild) {
    setActiveChildId(child.id);
    broadcastActiveChild(child.id);
    setOpen(false);
    router.push(`/children/${child.id}`);
  }

  function broadcastActiveChild(childId: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(ACTIVE_STUDENT_ID_KEY, childId);
    window.dispatchEvent(
      new CustomEvent(ACTIVE_CHILD_EVENT, { detail: { childId } })
    );
  }

  return (
    <div ref={switcherRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          borderRadius: 999,
          border: "1px solid #d1d5db",
          background: "#ffffff",
          padding: "8px 14px",
          fontWeight: 700,
          fontSize: 13,
          color: "#0f172a",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          boxShadow: open ? "0 12px 30px rgba(15,23,42,0.18)" : "none",
        }}
      >
        {renderChildAvatar(currentChild, 28)}
        <span style={{ display: "inline-flex", flexDirection: "column", lineHeight: 1.2, textAlign: "left" }}>
          <span style={{ fontSize: 14 }}>{childDisplayName(currentChild)}</span>
          {currentChild.year_level ? (
            <span style={{ fontSize: 11, color: "#475569" }}>Year {currentChild.year_level}</span>
          ) : (
            <span style={{ fontSize: 11, color: "#475569" }}>All children</span>
          )}
        </span>
        <span aria-hidden style={{ fontSize: 12 }}>
          ▾
        </span>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: 46,
            right: 0,
            width: 220,
            borderRadius: 16,
            border: "1px solid #e5e7eb",
            background: "#ffffff",
            boxShadow: "0 15px 40px rgba(15,23,42,0.15)",
            padding: 10,
            display: "grid",
            gap: 6,
            zIndex: 30,
          }}
        >
          {children.map((child) => (
            <button
              key={child.id}
              type="button"
              onClick={() => handleSelect(child)}
              style={{
                background: child.id === currentChild.id ? "#eff6ff" : "#ffffff",
                border: "none",
                borderRadius: 12,
                padding: "10px 12px",
                textAlign: "left",
                cursor: "pointer",
                display: "flex",
                gap: 10,
                alignItems: "center",
              }}
            >
              {renderChildAvatar(child, 26)}
              <span style={{ display: "inline-flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{childDisplayName(child)}</span>
                <span style={{ fontSize: 12, color: "#475569" }}>
                  {child.year_level ? `Year ${child.year_level}` : "Learning record"}
                </span>
              </span>
            </button>
          ))}
          <Link
            href="/children"
            style={{
              fontSize: 12,
              color: "#0f172a",
              fontWeight: 700,
              textDecoration: "none",
              padding: "8px 12px",
              borderTop: "1px solid #e5e7eb",
            }}
          >
            All children
          </Link>
        </div>
      )}
    </div>
  );
}

function FamilyCommandLayer({ pathname }: { pathname: string }) {
  const [signals, setSignals] = useState<Record<string, CommandSignal>>({});
  const [momentum, setMomentum] = useState<MomentumState | null>(null);
  const [confidence, setConfidence] = useState<ReadinessConfidenceState | null>(null);
  const [focus, setFocus] = useState<FocusState | null>(null);
  const [crossChildNote, setCrossChildNote] = useState<CrossChildNote | null>(null);
  const [reassuranceNote, setReassuranceNote] = useState<ReassuranceNote | null>(null);
  const [activeChildVersion, setActiveChildVersion] = useState(0);
  const [feedbackVersion, setFeedbackVersion] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const commandKey = getCommandKeyForHref(pathname);
    if (!commandKey) return;
    const memory = readRecentActionMemory();
    memory[commandKey] = Date.now();
    writeRecentActionMemory(memory);
    const focusKey = focusFromPathname(pathname);
    if (focusKey) {
      writeWorkspaceFocus(focusKey);
    }
    setFeedbackVersion((value) => value + 1);

    const settleTimer = window.setTimeout(() => {
      setFeedbackVersion((value) => value + 1);
    }, 1500);

    return () => {
      window.clearTimeout(settleTimer);
    };
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    function handleActiveChildChanged() {
      setActiveChildVersion((value) => value + 1);
    }

    function handleVisibilityRefresh() {
      setFeedbackVersion((value) => value + 1);
    }

    window.addEventListener(ACTIVE_CHILD_EVENT, handleActiveChildChanged as EventListener);
    window.addEventListener("storage", handleActiveChildChanged);
    window.addEventListener("focus", handleVisibilityRefresh);
    document.addEventListener("visibilitychange", handleVisibilityRefresh);
    return () => {
      window.removeEventListener(ACTIVE_CHILD_EVENT, handleActiveChildChanged as EventListener);
      window.removeEventListener("storage", handleActiveChildChanged);
      window.removeEventListener("focus", handleVisibilityRefresh);
      document.removeEventListener("visibilitychange", handleVisibilityRefresh);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function hydrateSignals() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (mounted) setSignals({});
          if (mounted) {
            setMomentum({
              label: "Starting point",
              detail: "The workspace becomes more useful once a child is active.",
              tone: "neutral",
            });
            setConfidence({
              label: "Not ready yet",
              detail: "A usable evidence base starts once a child is active and learning is captured.",
              tone: "neutral",
            });
            setCrossChildNote(null);
            setReassuranceNote(null);
          }
          return;
        }

        const [familyProfile, children, drafts] = await Promise.all([
          loadFamilyProfile().catch(() => null),
          loadLinkedChildrenForUser(user.id).catch(() => [] as FamilyChild[]),
          listReportDrafts().catch(() => [] as ReportDraftRow[]),
        ]);

        if (!mounted) return;

        const storedChildId =
          typeof window !== "undefined" ? safe(window.localStorage.getItem(ACTIVE_STUDENT_ID_KEY)) : "";
        const activeChild =
          children.find((child) => child.id === storedChildId) ||
          children.find((child) => child.id === safe(familyProfile?.default_child_id)) ||
          children[0] ||
          null;

        if (!activeChild) {
          setMomentum({
            label: "Starting point",
            detail: "Add a child to begin building a steady learning record.",
            tone: "warning",
          });
          setConfidence({
            label: "Not ready yet",
            detail: "Add a child first so the evidence base can begin to take shape.",
            tone: "warning",
          });
          setCrossChildNote(null);
          setReassuranceNote(null);
          setSignals({
            "/capture": {
              tone: "warning",
              label: "No child selected",
              suggestion: "Add a child first so the next step has somewhere to land.",
              why: "There is no active child in the workspace yet.",
              priority: 100,
            },
            "/planner": {
              tone: "info",
              label: "Begin with setup",
              suggestion: "Create a child profile before planning the next step.",
              why: "Planning works best once a child profile exists.",
              priority: 70,
            },
            "/portfolio": {
              tone: "neutral",
              label: "Waiting for evidence",
              blocker: "Portfolio becomes useful after the first captured learning moment.",
              priority: 10,
            },
            "/reports": {
              tone: "neutral",
              label: "Nothing to report yet",
              blocker: "Reports need real evidence before they become worthwhile.",
              priority: 10,
            },
            "/authority/readiness": {
              tone: "neutral",
              label: "Readiness comes later",
              blocker: "Authority readiness only makes sense once evidence and a draft exist.",
              priority: 10,
            },
          });
          return;
        }

        const { data: evidenceRows, error: evidenceError } = await supabase
          .from("evidence")
          .select("id,student_id,learning_area,created_at,occurred_on")
          .eq("student_id", activeChild.id)
          .order("created_at", { ascending: false })
          .limit(120);

        if (evidenceError && !isMissingRelationOrColumn(evidenceError)) {
          throw evidenceError;
        }

        const siblingEvidenceRows =
          children.length > 1
            ? await supabase
                .from("evidence")
                .select("id,student_id,learning_area,created_at,occurred_on")
                .in(
                  "student_id",
                  children.map((child) => child.id)
                )
                .order("created_at", { ascending: false })
                .limit(320)
            : { data: [] as EvidenceSignalRow[], error: null as any };

        if (siblingEvidenceRows.error && !isMissingRelationOrColumn(siblingEvidenceRows.error)) {
          throw siblingEvidenceRows.error;
        }

        if (!mounted) return;

        const childName = safe(activeChild.preferred_name || activeChild.first_name) || "Your child";
        const rows = (evidenceRows ?? []) as EvidenceSignalRow[];
        const weeklyRows = rows.filter((row) => (daysSince(row.occurred_on || row.created_at) ?? 999) <= 7);
        const recentRows = rows.filter((row) => (daysSince(row.occurred_on || row.created_at) ?? 999) <= 21);
        const recentAreas = new Set(
          recentRows
            .map((row) => normalizeArea(row.learning_area))
            .filter(Boolean)
        );
        const weeklyAreas = new Set(
          weeklyRows
            .map((row) => normalizeArea(row.learning_area))
            .filter(Boolean)
        );
        const missingFocusArea = ["science", "numeracy", "literacy", "humanities"].find(
          (area) => !recentAreas.has(area)
        );
        const weeklyMissingArea = firstMissingPriorityArea(weeklyAreas);
        const recentMissingArea = firstMissingPriorityArea(recentAreas);
        const weeklyDominant = dominantArea(weeklyRows);
        const recentDominant = dominantArea(recentRows);
        const narrowRecentBalance = recentRows.length >= 3 && recentAreas.size <= 1;
        const narrowWeeklyBalance = weeklyRows.length >= 2 && weeklyAreas.size <= 1;
        const weeklyActiveDays = recentDayBuckets(weeklyRows).size;
        const recentActiveDays = recentDayBuckets(recentRows).size;
        const lastEvidenceDays = daysSince(rows[0]?.occurred_on || rows[0]?.created_at) ?? 999;
        const quietAfterBurst = rows.length >= 4 && weeklyRows.length === 0 && lastEvidenceDays > 7;
        const burstyRecentPattern = recentRows.length >= 4 && recentActiveDays <= 2;
        const steadyWeeklyPattern = weeklyRows.length >= 2 && weeklyActiveDays >= 2;
        const pickingUpAgain = weeklyRows.length >= 1 && lastEvidenceDays <= 3 && !steadyWeeklyPattern;
        const childDrafts = drafts.filter(
          (draft) => safe(draft.student_id || draft.child_id) === activeChild.id
        );
        const latestDraft = childDrafts[0] ?? null;
        const selectedEvidenceCount = latestDraft?.selected_evidence_ids?.length ?? 0;
        const recentActionMemory = readRecentActionMemory();
        const recentCaptureAction =
          wasRecentAction(recentActionMemory.capture) ||
          (daysSince(rows[0]?.occurred_on || rows[0]?.created_at) ?? 999) === 0;
        const recentPlannerAction = wasRecentAction(recentActionMemory.planner);
        const recentPortfolioAction = wasRecentAction(recentActionMemory.portfolio);
        const recentReportAction =
          wasRecentAction(recentActionMemory.reports) ||
          (daysSince(latestDraft?.updated_at) ?? 999) === 0;
        const recentAuthorityAction = wasRecentAction(recentActionMemory.authority);
        const readinessGuidanceOn = familyProfile?.show_authority_guidance !== false;
        const immediateActionPulse =
          recentCaptureAction || recentPlannerAction || recentPortfolioAction || recentReportAction || recentAuthorityAction;
        const previousSnapshot = readContinuitySnapshots().find((item) => item.childId === activeChild.id) ?? null;
        const groupedEvidence = new Map<string, EvidenceSignalRow[]>();
        ((siblingEvidenceRows.data ?? []) as EvidenceSignalRow[]).forEach((row) => {
          const studentId = safe(row.student_id);
          if (!studentId) return;
          const existing = groupedEvidence.get(studentId) ?? [];
          existing.push(row);
          groupedEvidence.set(studentId, existing);
        });
        const storedFocus = readWorkspaceFocus();
        const inferredFocus: WorkspaceFocus =
          storedFocus ||
          (readinessGuidanceOn &&
          latestDraft &&
          selectedEvidenceCount >= 3 &&
          recentAreas.size >= 2 &&
          (steadyWeeklyPattern || weeklyRows.length >= 1)
            ? "prepare-authority"
            : latestDraft
            ? "prepare-report"
            : narrowRecentBalance || recentAreas.size < 2
            ? "round-out-portfolio"
            : "build-weekly-record");

        let nextMomentum: MomentumState = {
          label: "Starting point",
          detail: `${childName}'s learning record is just beginning to take shape.`,
          tone: "neutral",
        };

        let nextConfidence: ReadinessConfidenceState = {
          label: "Not ready yet",
          detail: "Your evidence base is still taking shape.",
          tone: "neutral",
        };

        let nextFocus: FocusState = {
          key: inferredFocus,
          label: "Build weekly record",
          detail: "Keep the weekly learning record calm and current.",
        };
        let nextCrossChildNote: CrossChildNote | null = null;
        let nextReassuranceNote: ReassuranceNote | null = null;
        const continuityImproved =
          previousSnapshot &&
          (weeklyRows.length > previousSnapshot.weeklyCount ||
            recentAreas.size > previousSnapshot.recentAreaCount ||
            selectedEvidenceCount > previousSnapshot.draftEvidenceCount ||
            lastEvidenceDays < previousSnapshot.lastEvidenceDays);
        const continuityStrengthenedBreadth =
          previousSnapshot && recentAreas.size > previousSnapshot.recentAreaCount;
        const continuityStrengthenedDraft =
          previousSnapshot && selectedEvidenceCount > previousSnapshot.draftEvidenceCount;

        if (!rows.length) {
          nextMomentum = {
            label: "Starting point",
            detail: `${childName} needs a first captured learning moment.`,
            tone: "warning",
          };
        } else if (recentCaptureAction && weeklyRows.length > 0 && !quietAfterBurst) {
          nextMomentum = {
            label: "Fresh step taken",
            detail: "A new learning moment has just moved the record forward.",
            tone: "success",
          };
        } else if (recentReportAction && latestDraft) {
          nextMomentum = {
            label: "Recent progress",
            detail: "Your latest report changes are in place. Let them settle, then decide what comes next.",
            tone: "success",
          };
        } else if (quietAfterBurst) {
          nextMomentum = {
            label: "Finding rhythm",
            detail: "There was an earlier burst of activity. A steadier weekly rhythm would help now.",
            tone: "info",
          };
        } else if (burstyRecentPattern) {
          nextMomentum = {
            label: "Building rhythm",
            detail: "Learning is being captured, but it is still arriving in clumps rather than a steady rhythm.",
            tone: "info",
          };
        } else if (pickingUpAgain) {
          nextMomentum = {
            label: "Picking up again",
            detail: continuityImproved
              ? "Things are moving again this week, and the record is already looking steadier."
              : "Things are moving again this week. A little consistency now will help the record settle.",
            tone: "success",
          };
        } else if (!latestDraft || recentAreas.size < 2 || !weeklyRows.length) {
          nextMomentum = {
            label: "Building momentum",
            detail: continuityImproved
              ? "Evidence is building in a stronger direction now. A couple of steady next steps should help it hold."
              : "Evidence is forming. One or two well-placed next steps should help it settle.",
            tone: "info",
          };
        } else if (selectedEvidenceCount < 3 || !weeklyAreas.size) {
          nextMomentum = {
            label: "Taking shape",
            detail: "The story is taking shape. A little more evidence should strengthen reporting confidence.",
            tone: "info",
          };
        } else if (familyProfile?.show_authority_guidance === false) {
          nextMomentum = {
            label: "Healthy place",
            detail: "Evidence and reporting appear to be in a good place. Turn readiness guidance on when you want it.",
            tone: "success",
          };
        } else {
          nextMomentum = {
            label: "Healthy place",
            detail: "Evidence, draft quality, and readiness posture appear to be in a steady place.",
            tone: "success",
          };
        }

        if (!rows.length) {
          nextConfidence = {
            label: "Not ready yet",
            detail: "Your evidence base is still taking shape.",
            tone: "warning",
          };
        } else if (recentReportAction && latestDraft && selectedEvidenceCount >= 2) {
          nextConfidence = {
            label: "Taking shape",
            detail: continuityStrengthenedDraft
              ? "Recent report work has moved this forward in a noticeable way."
              : "Recent report work has moved this forward. One more steady step should clarify the next move.",
            tone: "success",
          };
        } else if (!latestDraft || selectedEvidenceCount < 2) {
          nextConfidence = {
            label: "Taking shape",
            detail: continuityStrengthenedBreadth
              ? "This is broadening into a more usable record."
              : narrowRecentBalance
              ? "You have activity, but a little more breadth would make this stronger."
              : burstyRecentPattern
              ? "You have evidence building, and a steadier rhythm would make it more usable."
              : "You have evidence building, but the reporting base is still forming.",
            tone: "info",
          };
        } else if (
          selectedEvidenceCount >= 2 &&
          recentAreas.size >= 2 &&
          (weeklyRows.length > 0 || lastEvidenceDays <= 10)
        ) {
          nextConfidence = {
            label: "Close to usable",
            detail: quietAfterBurst
              ? "One fresh capture would make this feel more reliable for reporting."
              : narrowRecentBalance
              ? "A little more breadth would make this stronger."
              : "This is looking close to usable for reporting.",
            tone: "info",
          };
        }

        if (
          latestDraft &&
          selectedEvidenceCount >= 3 &&
          recentAreas.size >= 2 &&
          (steadyWeeklyPattern || weeklyRows.length >= 1) &&
          readinessGuidanceOn
        ) {
          nextConfidence = {
            label: "Ready to review",
            detail: "This looks ready for a calm review pass.",
            tone: "success",
          };
        } else if (
          latestDraft &&
          selectedEvidenceCount >= 3 &&
          recentAreas.size >= 2 &&
          (steadyWeeklyPattern || weeklyRows.length >= 1)
        ) {
          nextConfidence = {
            label: "Close to usable",
            detail: "Reporting looks usable now. Turn readiness guidance on when you want a review posture.",
            tone: "success",
          };
        }

        if (inferredFocus === "build-weekly-record") {
          nextFocus = {
            key: inferredFocus,
            label: "Build weekly record",
            detail: "Keep the weekly learning record calm, current, and easy to maintain.",
          };
        } else if (inferredFocus === "round-out-portfolio") {
          nextFocus = {
            key: inferredFocus,
            label: "Round out portfolio",
            detail: "A broader recent mix will make the learning story stronger.",
          };
        } else if (inferredFocus === "prepare-report") {
          nextFocus = {
            key: inferredFocus,
            label: "Prepare report",
            detail: "Shape the evidence base into something ready to use in reporting.",
          };
        } else {
          nextFocus = {
            key: inferredFocus,
            label: "Prepare readiness",
            detail: "Steady the evidence base for a calmer readiness review.",
          };
        }

        if (recentCaptureAction && inferredFocus !== "prepare-authority") {
          nextFocus = {
            key: "build-weekly-record",
            label: "Build weekly record",
            detail: "A fresh capture is already in place. Let it lead the next calm step.",
          };
        } else if (recentReportAction && latestDraft) {
          nextFocus = {
            key: "prepare-report",
            label: "Prepare report",
            detail: "Recent report work is already in motion. The next step can build from there.",
          };
        } else if (recentAuthorityAction && readinessGuidanceOn) {
          nextFocus = {
            key: "prepare-authority",
            label: "Prepare readiness",
            detail: "Recent readiness work is already in motion. Return when you want the next formal step.",
          };
        }

        const activeChildFeelsHealthy =
          nextConfidence.label === "Ready to review" ||
          (nextConfidence.label === "Close to usable" && steadyWeeklyPattern && !narrowRecentBalance);

        if (activeChildFeelsHealthy && !nextCrossChildNote) {
          nextReassuranceNote = {
            label: "Healthy place",
            detail:
              nextConfidence.label === "Ready to review"
                ? `${childName}'s record looks ready for a calm review pass.`
                : continuityImproved
                ? `${childName}'s record looks stronger than it did recently.`
                : `${childName}'s record appears to be in a healthy place for now.`,
            tone: "success",
          };
        } else if (recentCaptureAction && weeklyRows.length > 0) {
          nextReassuranceNote = {
            label: "Fresh progress",
            detail: continuityImproved
              ? "That recent capture has already built on the progress from earlier."
              : "That recent capture has already moved the record forward.",
            tone: "success",
          };
        } else if (recentReportAction && latestDraft) {
          nextReassuranceNote = {
            label: "Recent progress",
            detail: continuityStrengthenedDraft
              ? "Your latest report changes have made the draft noticeably stronger."
              : "Your latest report changes are already helping the story take shape.",
            tone: "success",
          };
        } else if (pickingUpAgain && !quietAfterBurst) {
          nextReassuranceNote = {
            label: "Good to see",
            detail: continuityImproved
              ? "Things have picked up again this week, and that improvement is already visible."
              : "Things have picked up again this week. That movement matters.",
            tone: "success",
          };
        } else if (steadyWeeklyPattern && recentAreas.size >= 2) {
          nextReassuranceNote = {
            label: "Steady progress",
            detail: continuityStrengthenedBreadth
              ? "Recent evidence is looking broader and more settled now."
              : "Recent evidence is current and reasonably rounded.",
            tone: "success",
          };
        }

        if (children.length > 1) {
          const siblingSummaries = children
            .filter((child) => child.id !== activeChild.id)
            .map((child) => {
              const childRows = groupedEvidence.get(child.id) ?? [];
              const childRecentRows = childRows.filter(
                (row) => (daysSince(row.occurred_on || row.created_at) ?? 999) <= 21
              );
              const childWeeklyRows = childRows.filter(
                (row) => (daysSince(row.occurred_on || row.created_at) ?? 999) <= 7
              );
              const childRecentAreas = new Set(
                childRecentRows.map((row) => normalizeArea(row.learning_area)).filter(Boolean)
              );
              const childDraft = drafts.find(
                (draft) => safe(draft.student_id || draft.child_id) === child.id
              );
              return {
                child,
                lastDays: daysSince(childRows[0]?.occurred_on || childRows[0]?.created_at) ?? 999,
                weeklyCount: childWeeklyRows.length,
                recentCount: childRecentRows.length,
                recentAreaCount: childRecentAreas.size,
                draftEvidenceCount: childDraft?.selected_evidence_ids?.length ?? 0,
              };
            });

          const staleSibling = siblingSummaries.find(
            (item) => item.recentCount === 0 || item.lastDays > 21
          );
          const quietSibling = siblingSummaries.find(
            (item) => item.weeklyCount === 0 && item.lastDays <= 21
          );
          const reviewSibling = siblingSummaries.find(
            (item) =>
              item.draftEvidenceCount >= 3 &&
              item.recentAreaCount >= 2 &&
              item.weeklyCount >= 1
          );

          if (
            reviewSibling &&
            nextConfidence.label !== "Ready to review" &&
            inferredFocus !== "prepare-authority"
          ) {
            nextCrossChildNote = {
              label: "Another child may be closer",
              detail: `${childDisplayName(reviewSibling.child)} may be closer to a review pass.`,
              tone: "info",
            };
          } else if (staleSibling && nextMomentum.tone === "success") {
            nextCrossChildNote = {
              label: "Another child may need a check-in",
              detail: `${childDisplayName(staleSibling.child)} looks quieter right now.`,
              tone: "info",
            };
          } else if (quietSibling && nextMomentum.tone !== "warning") {
            nextCrossChildNote = {
              label: "Another record is quieter",
              detail: `${childDisplayName(quietSibling.child)} has not had a recent check-in this week.`,
              tone: "neutral",
            };
          }
        }

        const nextSignals: Record<string, CommandSignal> = {};

        if (!rows.length) {
          nextSignals["/capture"] = {
            tone: "warning",
            label: "Start the record",
            suggestion: `Capture one small learning moment for ${childName}.`,
            why: `There is no saved evidence for ${childName} yet.`,
            priority: 100,
          };
        } else if (!weeklyRows.length) {
          nextSignals["/capture"] = {
            tone: "info",
            label: "Quiet this week",
            suggestion: `Add one fresh moment for ${childName} this week.`,
            why: quietAfterBurst
              ? "There was earlier activity, but the recent rhythm has gone quiet."
              : "Nothing has been captured this week yet.",
            blocker: quietAfterBurst
              ? "A steadier weekly rhythm will make later planning and reporting feel easier."
              : undefined,
            priority:
              (recentCaptureAction ? 50 : quietAfterBurst ? 88 : 82) +
              (inferredFocus === "build-weekly-record" ? 8 : 0),
          };
        } else if (narrowWeeklyBalance && weeklyMissingArea) {
          nextSignals["/capture"] = {
            tone: "info",
            label: "Try a wider mix",
            suggestion: `Add one ${titleCaseArea(weeklyMissingArea)} example so this week feels more rounded.`,
            why:
              weeklyDominant.area && weeklyDominant.count > 1
                ? `Recent learning is concentrated in ${titleCaseArea(weeklyDominant.area)}.`
                : "Recent learning is concentrated in one area.",
            blocker: "A broader mix will make later reporting and portfolio review feel stronger.",
            priority: (recentCaptureAction ? 38 : 74) + (inferredFocus === "round-out-portfolio" ? 8 : 0),
          };
        } else if (burstyRecentPattern) {
          nextSignals["/capture"] = {
            tone: "info",
            label: "Steady the rhythm",
            suggestion: steadyWeeklyPattern
              ? "Things are starting to settle. Keep one or two calm captures flowing this week."
              : "Add one small learning moment on a different day this week to build consistency.",
            why: "Recent evidence is arriving in clumps rather than a steady rhythm.",
            blocker: "A little consistency now will strengthen reporting later.",
            priority: recentCaptureAction ? 28 : 66,
          };
        } else if (!weeklyAreas.has("science")) {
          nextSignals["/capture"] = {
            tone: "info",
            label: recentCaptureAction ? "Fresh step taken" : "No science yet",
            suggestion: recentCaptureAction
              ? "You just captured something. The next step can widen the spread when it feels natural."
              : `Add one science example while the week is still open.`,
            why: recentCaptureAction
              ? "Recent capture activity already improved momentum."
              : "There is no recent science evidence yet.",
            priority: recentCaptureAction ? 34 : 68,
          };
        } else {
          nextSignals["/capture"] = {
            tone: "success",
            label: steadyWeeklyPattern ? "Steady rhythm" : "Fresh evidence",
            suggestion: steadyWeeklyPattern
              ? `${childName} has a healthy capture rhythm building this week.`
              : `${childName} has current evidence flowing this week.`,
            why: steadyWeeklyPattern
              ? "Recent learning is landing across more than one day this week."
              : "Recent learning has already been captured.",
            priority: steadyWeeklyPattern ? 22 : 18,
          };
        }

        if (!rows.length) {
          nextSignals["/planner"] = {
            tone: "neutral",
            label: "Plan after first capture",
            why: "A plan will be more useful once some learning is captured.",
            blocker: "Planner is more useful after the first real learning moment is captured.",
            priority: 12,
          };
        } else if (recentAreas.size < 2) {
          nextSignals["/planner"] = {
            tone: "info",
            label: "Coverage is still light",
            suggestion: recentPlannerAction
              ? "You have already looked ahead recently. Come back when you are ready to widen the next step."
              : `Plan one ${titleCaseArea(recentMissingArea || missingFocusArea || "science")} learning moment next.`,
            why: recentPlannerAction
              ? "Planner was opened recently, so the shell is easing off repeated prompts."
              : "Recent evidence is still concentrated in too few areas.",
            priority: recentPlannerAction ? 44 : 76,
          };
        } else if (!weeklyRows.length) {
          nextSignals["/planner"] = {
            tone: "info",
            label: "Reset the next step",
            suggestion: recentPlannerAction
              ? "You have already checked the planner recently. Let the current plan settle first."
              : `Open planner and choose one simple session for ${childName}.`,
            why: quietAfterBurst
              ? "A quiet patch after earlier activity is a good time to reset the rhythm."
              : recentPlannerAction
              ? "Recent planner activity suggests this step has already been considered."
              : "There has not been a recent learning update to guide the next stretch.",
            priority: recentPlannerAction ? 32 : 64,
          };
        } else {
          nextSignals["/planner"] = {
            tone: "success",
            label: "Plan is moving",
            suggestion: "Use planner when you want to shape the next stretch of learning.",
            why: "Current evidence already gives you enough context to plan calmly.",
            priority: 16,
          };
        }

        if (!rows.length) {
          nextSignals["/portfolio"] = {
            tone: "neutral",
            label: "Portfolio can wait",
            why: "Portfolio becomes useful after the first captured evidence.",
            blocker: "There is not enough evidence yet for a useful portfolio review.",
            priority: 10,
          };
        } else if ((daysSince(rows[0]?.occurred_on || rows[0]?.created_at) ?? 999) > 21) {
          nextSignals["/portfolio"] = {
            tone: "info",
            label: "Story feels dated",
            suggestion: recentPortfolioAction
              ? "You reviewed the portfolio recently. A fresh entry can wait until the next learning moment appears."
              : `Add one fresh piece so the portfolio stays current.`,
            why: recentPortfolioAction
              ? "Portfolio was just reviewed, so the shell is not pushing it again."
              : "The latest portfolio evidence is getting old.",
            blocker: "Portfolio review is less useful until there is a fresher learning moment.",
            priority: recentPortfolioAction ? 24 : 58,
          };
        } else if (burstyRecentPattern) {
          nextSignals["/portfolio"] = {
            tone: "info",
            label: "A steadier rhythm will help",
            suggestion: recentPortfolioAction
              ? "You reviewed the portfolio recently. Let the next few captures build a steadier record."
              : "A steadier weekly rhythm will make the portfolio story feel more convincing.",
            why: "The evidence record is active, but still uneven across recent days.",
            blocker: "Portfolio review will feel stronger once the recent rhythm is steadier.",
            priority: recentPortfolioAction ? 18 : 40,
          };
        } else if (narrowRecentBalance || recentAreas.size < 2) {
          nextSignals["/portfolio"] = {
            tone: "info",
            label: "Breadth is still light",
            suggestion: recentPortfolioAction
              ? "The portfolio was just reviewed. Broader coverage can build gradually from the next few captures."
              : `Try one ${titleCaseArea(recentMissingArea || "different")} subject this week to round out the record.`,
            why: recentPortfolioAction
              ? "Recent portfolio review means this prompt can soften for now."
              : recentDominant.area && recentDominant.count > 1
              ? `Recent learning is concentrated in ${titleCaseArea(recentDominant.area)}.`
              : "Recent learning is concentrated in one area.",
            blocker: "A broader mix will strengthen the portfolio story before deeper review.",
            priority: (recentPortfolioAction ? 22 : 60) + (inferredFocus === "round-out-portfolio" ? 10 : 0),
          };
        } else {
          nextSignals["/portfolio"] = {
            tone: "success",
            label: "Story is building",
            suggestion: "Portfolio is ready when you want to review the learning journey.",
            why: "There is enough current evidence to review the story so far.",
            priority: 14,
          };
        }

        if (!latestDraft) {
          nextSignals["/reports"] = {
            tone: "info",
            label: "No draft yet",
            suggestion: recentReportAction
              ? "You have been in reports recently. Give the latest changes a moment before returning."
              : `Turn ${childName}'s evidence into a first report draft.`,
            why: recentReportAction
              ? "Recent report activity suggests you have already started this step."
              : "Evidence exists, but there is no saved report draft yet.",
            blocker:
              rows.length < 2
                ? "Reports will feel stronger once a little more evidence is captured."
                : narrowRecentBalance
                ? "Reports will feel stronger once recent evidence covers more than one area."
                : undefined,
            priority:
              (recentReportAction ? 26 : narrowRecentBalance ? 58 : rows.length >= 3 ? 74 : 42) +
              (inferredFocus === "prepare-report" ? 10 : 0),
          };
        } else if (selectedEvidenceCount < 3 || narrowRecentBalance) {
          nextSignals["/reports"] = {
            tone: "warning",
            label: narrowRecentBalance ? "Draft needs wider evidence" : "Draft is still light",
            suggestion: recentReportAction
              ? "Your draft was updated recently. The next move is to let the evidence catch up."
              : narrowRecentBalance
              ? `Add one ${titleCaseArea(recentMissingArea || "different")} subject before building the report.`
              : "Add one or two stronger examples before building the report.",
            why: recentReportAction
              ? "A draft already exists and was touched recently, so the shell is shifting away from repeating report setup."
              : narrowRecentBalance
              ? "A broader mix will strengthen reporting."
              : "Your report draft needs a little more evidence first.",
            blocker: narrowRecentBalance
              ? "Reporting is still blocked by narrow recent coverage."
              : "Report building is still blocked by thin evidence selection.",
            priority:
              (recentReportAction ? 48 : narrowRecentBalance ? 70 : 72) +
              (inferredFocus === "prepare-report" ? 8 : 0),
          };
        } else if (!weeklyRows.length) {
          nextSignals["/reports"] = {
            tone: "info",
            label: "Refresh before building",
            suggestion: recentReportAction
              ? "The report was just reviewed. A fresh capture is the calmer next move now."
              : "A fresh entry would make the report feel more current.",
            why: quietAfterBurst
              ? "A quieter patch has opened after earlier activity."
              : recentReportAction
              ? "Recent report work means capture may now be the better follow-through step."
              : "The report can be stronger with one recent learning moment.",
            blocker: "Reporting will feel more trustworthy after one fresh capture.",
            priority: recentReportAction ? 30 : quietAfterBurst ? 68 : 60,
          };
        } else if (burstyRecentPattern) {
          nextSignals["/reports"] = {
            tone: "info",
            label: "Steady things before reporting",
            suggestion: recentReportAction
              ? "You have already been in reports. Let a steadier capture rhythm build before returning."
              : "A little consistency now will strengthen reporting later.",
            why: "Evidence exists, but recent activity is still uneven.",
            blocker: "Reporting will feel more grounded once the capture rhythm is steadier.",
            priority: recentReportAction ? 22 : 54,
          };
        } else {
          nextSignals["/reports"] = {
            tone: "success",
            label: "Ready to build",
            suggestion: "Enough current evidence is in place to move into reporting.",
            why:
              nextConfidence.label === "Ready to review"
                ? "This looks ready for a review pass."
                : "The draft and evidence set are both in a steady place now.",
            priority:
              (nextConfidence.label === "Ready to review" ? 52 : 46) +
              (inferredFocus === "prepare-report" ? 8 : 0),
          };
        }

        if (familyProfile?.show_authority_guidance === false) {
          nextSignals["/authority/readiness"] = {
            tone: "neutral",
            label: "Guidance is off",
            suggestion: "Turn readiness guidance on in settings when you want a calmer review view.",
            why: "Authority guidance is currently switched off in settings.",
            blocker: "Turn readiness guidance on before using authority readiness as a next step.",
            priority: 20,
          };
        } else if (!latestDraft) {
          nextSignals["/authority/readiness"] = {
            tone: "neutral",
            label: "Early stage",
            suggestion: "Create a report draft before checking authority readiness.",
            why: "Readiness becomes useful once a report draft exists.",
            blocker: "Authority readiness is blocked until a report draft exists.",
            priority: 15,
          };
        } else if (selectedEvidenceCount < 3 || recentAreas.size < 2) {
          nextSignals["/authority/readiness"] = {
            tone: "warning",
            label: "Not ready yet",
            suggestion: recentAuthorityAction
              ? "You checked readiness recently. The next move is still to strengthen the evidence first."
              : "Strengthen evidence breadth before moving into authority readiness.",
            why: recentAuthorityAction
              ? "Recent readiness review means the shell is easing off repeated authority prompts."
              : "Evidence breadth is still too light for a confident readiness check.",
            blocker:
              selectedEvidenceCount < 3
                ? "Authority readiness is blocked until the draft has stronger evidence behind it."
                : burstyRecentPattern
                ? "Authority readiness is blocked until the evidence rhythm feels steadier."
                : narrowRecentBalance
                ? "Authority readiness is blocked until recent evidence is broader."
                : "Authority readiness is blocked until evidence breadth is stronger.",
            priority:
              (recentAuthorityAction ? 24 : narrowRecentBalance ? 36 : 40) +
              (inferredFocus === "prepare-authority" ? 10 : 0),
          };
        } else {
          nextSignals["/authority/readiness"] = {
            tone: "success",
            label: "Ready for a check",
            suggestion: recentAuthorityAction
              ? "You reviewed readiness recently. Return when you want to prepare the formal pack."
              : "You can review readiness calmly and decide whether to prepare an authority pack.",
            why: recentAuthorityAction
              ? "Recent readiness activity means there is no need to repeat the same prompt immediately."
              : nextConfidence.label === "Ready to review"
              ? "This evidence base looks ready for a review pass."
              : "Draft quality and evidence breadth are strong enough to review readiness.",
            priority:
              (recentAuthorityAction ? 20 : nextConfidence.label === "Ready to review" ? 48 : 44) +
              (inferredFocus === "prepare-authority" ? 10 : 0),
          };
        }

        setMomentum(nextMomentum);
        setConfidence(nextConfidence);
        setFocus(nextFocus);
        setCrossChildNote(nextCrossChildNote);
        setReassuranceNote(nextReassuranceNote);
        setSignals(nextSignals);
        writeContinuitySnapshot({
          childId: activeChild.id,
          capturedAt: Date.now(),
          weeklyCount: weeklyRows.length,
          recentAreaCount: recentAreas.size,
          draftEvidenceCount: selectedEvidenceCount,
          lastEvidenceDays,
        });
      } catch (error) {
        console.error("Family command guidance failed", error);
        if (mounted) {
          setSignals({});
          setMomentum(null);
          setConfidence(null);
          setFocus(null);
          setCrossChildNote(null);
          setReassuranceNote(null);
        }
      }
    }

    hydrateSignals();
    return () => {
      mounted = false;
    };
  }, [activeChildVersion, pathname, feedbackVersion]);

  function toneStyle(tone: CommandTone): React.CSSProperties {
    if (tone === "warning") {
      return { background: "#fff7ed", color: "#c2410c", border: "1px solid #fdba74" };
    }
    if (tone === "success") {
      return { background: "#ecfdf5", color: "#047857", border: "1px solid #86efac" };
    }
    if (tone === "info") {
      return { background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" };
    }
    return { background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" };
  }

  const recommendedHref = useMemo(() => {
    const ranked = COMMAND_ITEMS.map((item) => {
      const signal = signals[item.href];
      const blockerPenalty = signal?.blocker ? 18 : 0;
      return {
        href: item.href,
        score:
          (signal?.priority ?? 0) +
          priorityWeight(signal?.tone ?? "neutral") -
          blockerPenalty,
      };
    }).sort((left, right) => right.score - left.score);

    return ranked[0]?.score ? ranked[0].href : null;
  }, [signals]);

  const recommendedItem = COMMAND_ITEMS.find((item) => item.href === recommendedHref) ?? null;
  const recommendedSignal = recommendedHref ? signals[recommendedHref] : null;
  const recommendedHandoff = recommendedItem
    ? buildFamilyShellHandoff(recommendedItem.href, recommendedSignal)
    : null;
  const recommendedActionLabel = recommendedItem
    ? recommendedItem.href === "/capture"
      ? "Do this now"
      : recommendedItem.href === "/planner"
      ? "Open this next"
      : recommendedItem.href === "/portfolio"
      ? "Review this next"
      : recommendedItem.href === "/reports"
      ? "Build from here"
      : "Check this next"
    : "";
  const showConfidence =
    Boolean(confidence) &&
    !(
      confidence?.label === momentum?.label ||
      (confidence?.label === "Ready to review" && momentum?.label === "Healthy place")
    );
  const showFocus =
    Boolean(focus) &&
    !(recommendedItem && focus?.label.toLowerCase().includes(recommendedItem.label.toLowerCase())) &&
    !(
      focus?.key === "build-weekly-record" &&
      recommendedHref === "/capture"
    ) &&
    !(
      focus?.key === "prepare-report" &&
      recommendedHref === "/reports"
    ) &&
    !(
      focus?.key === "prepare-authority" &&
      recommendedHref === "/authority/readiness"
    );
  const showCrossChildNote =
    Boolean(crossChildNote) &&
    !(momentum?.tone === "warning" && recommendedSignal?.tone === "warning");
  const showReassurance =
    Boolean(reassuranceNote) &&
    !(momentum?.tone === "warning" || recommendedSignal?.tone === "warning") &&
    !(
      reassuranceNote?.label === "Healthy place" &&
      momentum?.label === "Healthy place"
    ) &&
    !(
      reassuranceNote?.detail &&
      confidence?.detail &&
      reassuranceNote.detail === confidence.detail
    );
  const showRecommendationWhy =
    Boolean(recommendedSignal?.why) &&
    recommendedSignal?.why !== momentum?.detail &&
    recommendedSignal?.why !== confidence?.detail &&
    recommendedSignal?.why !== reassuranceNote?.detail;
  const showRecommendationBlocker =
    Boolean(recommendedSignal?.blocker) &&
    recommendedSignal?.blocker !== recommendedSignal?.why;

  useEffect(() => {
    publishFamilyGuidanceSnapshot({
      pathname,
      bestNextMove: recommendedItem?.label,
      bestNextSuggestion: recommendedSignal?.suggestion,
      bestNextActionLabel: recommendedActionLabel,
      bestNextWhy: recommendedSignal?.why,
      bestNextBlocker: recommendedSignal?.blocker,
      bestNextHref: recommendedItem?.href,
      bestNextHandoff: recommendedHandoff || undefined,
      momentumLabel: momentum?.label,
      readinessConfidenceLabel: confidence?.label,
      focusLabel: focus?.label,
      reassuranceLabel: reassuranceNote?.label,
      reassuranceDetail: reassuranceNote?.detail,
      crossChildLabel: crossChildNote?.label,
      crossChildDetail: crossChildNote?.detail,
    });
  }, [
    confidence?.label,
    crossChildNote?.detail,
    crossChildNote?.label,
    focus?.label,
    momentum?.label,
    pathname,
    recommendedActionLabel,
    recommendedHandoff,
    recommendedItem?.href,
    recommendedItem?.label,
    recommendedSignal?.blocker,
    recommendedSignal?.suggestion,
    recommendedSignal?.why,
    reassuranceNote?.detail,
    reassuranceNote?.label,
  ]);

  return (
    <section
      aria-label="Family command bar"
      style={{
        border: "1px solid #dbeafe",
        background: "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)",
        borderRadius: 20,
        padding: 16,
        display: "grid",
        gap: 14,
        position: "relative",
        zIndex: 15,
        boxShadow: "0 18px 40px rgba(15,23,42,0.06)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "baseline",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: 1.1,
              textTransform: "uppercase",
              color: "#64748b",
              marginBottom: 6,
            }}
          >
            Family command layer
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: "#0f172a",
              maxWidth: 760,
              lineHeight: 1.35,
            }}
          >
            Move from capture to planning, portfolio, reporting, and readiness without losing the thread.
          </div>
          {momentum ? (
            <div
              style={{
                marginTop: 8,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  ...toneStyle(momentum.tone),
                  borderRadius: 999,
                  padding: "4px 8px",
                  fontSize: 11,
                  fontWeight: 800,
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                }}
              >
                {momentum.label}
              </span>
              <span
                style={{
                  fontSize: 12,
                  lineHeight: 1.45,
                  color: "#64748b",
                }}
              >
                {momentum.detail}
              </span>
            </div>
          ) : null}
          {showConfidence && confidence ? (
            <div
              style={{
                marginTop: 8,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  ...toneStyle(confidence.tone),
                  borderRadius: 999,
                  padding: "4px 8px",
                  fontSize: 11,
                  fontWeight: 800,
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                }}
              >
                {confidence.label}
              </span>
              <span
                style={{
                  fontSize: 12,
                  lineHeight: 1.45,
                  color: "#64748b",
                }}
              >
                {confidence.detail}
              </span>
            </div>
          ) : null}
          {showFocus && focus ? (
            <div
              style={{
                marginTop: 8,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  ...toneStyle("neutral"),
                  borderRadius: 999,
                  padding: "4px 8px",
                  fontSize: 11,
                  fontWeight: 800,
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                }}
              >
                {focus.label}
              </span>
              <span
                style={{
                  fontSize: 12,
                  lineHeight: 1.45,
                  color: "#64748b",
                }}
              >
                {focus.detail}
              </span>
            </div>
          ) : null}
          {showCrossChildNote && crossChildNote ? (
            <div
              style={{
                marginTop: 8,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  ...toneStyle(crossChildNote.tone),
                  borderRadius: 999,
                  padding: "4px 8px",
                  fontSize: 11,
                  fontWeight: 800,
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                }}
              >
                {crossChildNote.label}
              </span>
              <span
                style={{
                  fontSize: 12,
                  lineHeight: 1.45,
                  color: "#64748b",
                }}
              >
                {crossChildNote.detail}
              </span>
            </div>
          ) : null}
          {showReassurance && reassuranceNote ? (
            <div
              style={{
                marginTop: 8,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  ...toneStyle(reassuranceNote.tone),
                  borderRadius: 999,
                  padding: "4px 8px",
                  fontSize: 11,
                  fontWeight: 800,
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                }}
              >
                {reassuranceNote.label}
              </span>
              <span
                style={{
                  fontSize: 12,
                  lineHeight: 1.45,
                  color: "#64748b",
                }}
              >
                {reassuranceNote.detail}
              </span>
            </div>
          ) : null}
          {recommendedItem && recommendedSignal?.suggestion ? (
            <div
              style={{
                marginTop: 8,
                display: "grid",
                gap: 4,
                maxWidth: 760,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: "#334155",
                }}
              >
                <span style={{ fontWeight: 800, color: "#0f172a" }}>Best next move:</span>{" "}
                {recommendedItem.label}. {recommendedSignal.suggestion}
              </div>
              {showRecommendationWhy && recommendedSignal.why ? (
                <div
                  style={{
                    fontSize: 12,
                    lineHeight: 1.45,
                    color: "#64748b",
                  }}
                >
                  Why this now: {recommendedSignal.why}
                </div>
              ) : null}
              {showRecommendationBlocker && recommendedSignal.blocker ? (
                <div
                  style={{
                    fontSize: 12,
                    lineHeight: 1.45,
                    color: "#64748b",
                  }}
                >
                  Before that: {recommendedSignal.blocker}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        <Link href="/family" style={utilBtn(false)}>
          Workspace Home
        </Link>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
        }}
      >
        {COMMAND_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const signal = signals[item.href];
          const recommended = item.href === recommendedHref;
          const commandHref =
            recommended && recommendedHandoff
              ? withFamilyShellHandoffQuery(item.href, recommendedHandoff)
              : item.href;
          return (
            <Link
              key={item.href}
              href={commandHref}
              onClick={() => {
                if (recommended) {
                  trackFamilyGuidanceEvent({
                    name: "recommended_card_clicked",
                    intent: recommendedHandoff?.intent,
                    sourceHref: pathname,
                    destinationHref: recommendedHandoff?.href || item.href,
                    pathname,
                  });
                  writeFamilyShellHandoff(recommendedHandoff);
                }
              }}
              style={{
                border: recommended
                  ? "1px solid #1d4ed8"
                  : active
                  ? "1px solid #2563eb"
                  : "1px solid #dbeafe",
                background: recommended
                  ? "linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)"
                  : active
                  ? "#dbeafe"
                  : "rgba(255,255,255,0.94)",
                borderRadius: 16,
                padding: "14px 16px",
                textDecoration: "none",
                color: "#0f172a",
                display: "grid",
                gap: 8,
                minHeight: 112,
                boxShadow: recommended
                  ? "0 16px 32px rgba(29,78,216,0.18)"
                  : active
                  ? "0 14px 30px rgba(37,99,235,0.15)"
                  : "none",
              }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }}>
                  <div style={{ display: "grid", gap: 6 }}>
                    <span
                      style={{
                        fontSize: 15,
                      fontWeight: 800,
                      color: active || recommended ? "#1d4ed8" : "#0f172a",
                    }}
                    >
                      {item.label}
                    </span>
                    {recommended ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 11,
                            fontWeight: 800,
                            letterSpacing: 0.4,
                            textTransform: "uppercase",
                            color: "#1d4ed8",
                          }}
                        >
                          <span
                            aria-hidden
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: "#1d4ed8",
                              display: "inline-block",
                            }}
                          />
                          Recommended now
                        </span>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minHeight: 28,
                            padding: "0 10px",
                            borderRadius: 999,
                            background: "#1d4ed8",
                            color: "#ffffff",
                            fontSize: 11,
                            fontWeight: 800,
                            letterSpacing: 0.3,
                            textTransform: "uppercase",
                            boxShadow: "0 10px 22px rgba(29,78,216,0.22)",
                          }}
                        >
                          {recommendedActionLabel}
                        </span>
                      </div>
                    ) : null}
                  </div>
                {signal?.label ? (
                  <span
                    style={{
                      ...toneStyle(signal.tone),
                      borderRadius: 999,
                      padding: "4px 8px",
                      fontSize: 11,
                      fontWeight: 800,
                      lineHeight: 1.2,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {signal.label}
                  </span>
                ) : null}
              </div>
              <span
                style={{
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: "#475569",
                }}
              >
                {signal?.suggestion || item.detail}
              </span>
              {recommended && signal?.why ? (
                <span
                  style={{
                    fontSize: 12,
                    lineHeight: 1.45,
                    color: "#64748b",
                  }}
                >
                  {signal.why}
                </span>
              ) : null}
              {recommended && signal?.blocker ? (
                <span
                  style={{
                    fontSize: 12,
                    lineHeight: 1.45,
                    color: "#64748b",
                  }}
                >
                  {signal.blocker}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

const PRIMARY_NAV: NavItem[] = [{ href: "/family", label: "Home" }];

const COMMAND_ITEMS: CommandItem[] = [
  {
    href: "/capture",
    label: "Capture Evidence",
    detail: "Save a learning moment while it is still fresh.",
  },
  {
    href: "/planner",
    label: "Open Planner",
    detail: "See what is coming up and shape the next learning step.",
  },
  {
    href: "/portfolio",
    label: "Go to Portfolio",
    detail: "Review the story your evidence is building over time.",
  },
  {
    href: "/reports",
    label: "Build Report",
    detail: "Turn captured evidence into a clear family report.",
  },
  {
    href: "/authority/readiness",
    label: "Check Readiness",
    detail: "Confirm what is ready for authority review and export.",
  },
];

const SECTIONS: NavSection[] = [
  {
    title: "Workflow",
    items: [
      { href: "/capture", label: "Capture" },
      { href: "/portfolio", label: "Portfolio" },
      { href: "/reports", label: "Reports" },
      { href: "/reports/library", label: "Report Library" },
      { href: "/reports/output", label: "Output" },
    ],
  },
  {
    title: "Planning",
    items: [
      { href: "/goals", label: "Goals" },
      { href: "/planner", label: "Planner" },
    ],
  },
  {
    title: "Authority",
    items: [
      { href: "/authority", label: "Authority Hub" },
      { href: "/authority/readiness", label: "Readiness" },
      { href: "/authority/builder", label: "Pack Builder" },
      { href: "/authority/export", label: "Pack Export" },
    ],
  },
  {
    title: "System",
    items: [{ href: "/settings", label: "Settings" }],
  },
];

function FamilyShellHeader({ title = "EduDecks Family", subtitle = "Homeschool-first learning flow" }: FamilyShellHeaderProps) {
  const pathname = usePathname();

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        background: "rgba(255,255,255,0.9)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid #e5e7eb",
        zIndex: 40,
        overflow: "visible",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "16px 20px",
          display: "grid",
          gap: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            position: "relative",
            zIndex: 20,
          }}
        >
          <div
            style={{
              marginRight: 24,
              display: "grid",
              gap: 6,
            }}
          >
          <div
            style={{
              fontSize: 90,
              fontWeight: 900,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              color: "#0f172a",
              lineHeight: 1,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 15,
              color: "#334155",
              fontWeight: 600,
            }}
          >
            {subtitle}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <ChildSwitcher />
          <ProfileMenu />
        </div>
      </div>

        <FamilyCommandLayer pathname={pathname} />
        <FamilyGuidanceDebugPanel />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", position: "relative", zIndex: 10 }}>
          {PRIMARY_NAV.map((item) => (
            <Link key={item.href} href={item.href} style={navBtn(isActive(pathname, item.href))}>
              {item.label}
            </Link>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
            position: "relative",
            zIndex: 10,
          }}
        >
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <div style={sectionLabel()}>{section.title}</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {section.items.map((item) => (
                  <Link key={item.href} href={item.href} style={navBtn(isActive(pathname, item.href))}>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}

function FamilyHero({
  heroTitle = "Build confidence from everyday learning",
  heroText = "Capture learning simply, stay aware of coverage, and move from evidence to reporting without the school-dashboard feel.",
  heroAsideTitle = "Family Snapshot",
  heroAsideText = "A calm, clear command view for family learning.",
  workflowHelperText,
  workflowCurrentHref,
  hideHeroAside = false,
}: FamilyHeroProps) {
  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: hideHeroAside ? "1fr" : "minmax(0, 1.3fr) minmax(280px, 0.7fr)",
        gap: 20,
        marginBottom: 20,
      }}
    >
      <div
        style={{
          border: "1px solid #dbeafe",
          background: "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(239,246,255,0.96) 100%)",
          borderRadius: 24,
          padding: 24,
          boxShadow: "0 20px 50px rgba(15,23,42,0.06)",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: 1.1,
            textTransform: "uppercase",
            color: "#64748b",
            marginBottom: 10,
          }}
        >
          Family workspace
        </div>
        <div
          style={{
            fontSize: 34,
            lineHeight: 1.08,
            fontWeight: 900,
            color: "#0f172a",
            marginBottom: 12,
          }}
        >
          {heroTitle}
        </div>
        <div
          style={{
            fontSize: 15,
            lineHeight: 1.7,
            color: "#334155",
            maxWidth: 820,
          }}
        >
          {heroText}
        </div>
        {workflowHelperText ? (
          <div
            style={{
              marginTop: 18,
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              alignItems: "center",
              fontSize: 13,
              color: "#475569",
            }}
          >
            <span style={{ maxWidth: 680 }}>{workflowHelperText}</span>
            {workflowCurrentHref ? (
              <Link
                href={workflowCurrentHref}
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#1d4ed8",
                  textDecoration: "none",
                }}
              >
                Go to workflow
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>

      {!hideHeroAside ? (
        <aside
          style={{
            border: "1px solid #e5e7eb",
            background: "#ffffff",
            borderRadius: 24,
            padding: 20,
            boxShadow: "0 20px 50px rgba(15,23,42,0.05)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: 1.1,
              textTransform: "uppercase",
              color: "#64748b",
              marginBottom: 10,
            }}
          >
            {heroAsideTitle}
          </div>
          <div
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: "#475569",
            }}
          >
            {heroAsideText}
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 16,
            }}
          >
            <Link href="/portfolio" style={utilBtn(false)}>
              Portfolio
            </Link>
            <Link href="/planner" style={utilBtn(false)}>
              Planner
            </Link>
          </div>
        </aside>
      ) : null}
    </section>
  );
}

const surfaceStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #f8fafc 0%, #eff6ff 100%)",
  color: "#0f172a",
};

const mainStyle: React.CSSProperties = {
  maxWidth: 1280,
  margin: "0 auto",
  padding: 20,
};

export function FamilyShellSurface({
  children,
  shellConfig,
}: {
  children: React.ReactNode;
  shellConfig?: FamilyTopNavShellProps;
}) {
  const pathname = usePathname();
  const shellId = React.useRef(Math.random().toString(36).slice(2, 8));
  const [registeredConfig, setRegisteredConfig] = useState<FamilyTopNavShellProps | null>(null);
  const activeConfig = registeredConfig ?? shellConfig ?? DEFAULT_SHELL_CONFIG;

  return (
    <FamilyShellConfigContext.Provider value={{ setConfig: setRegisteredConfig }}>
      <div style={surfaceStyle}>
        <div
          style={{
            background: "#fefefe",
            borderBottom: "1px solid #fde68a",
            padding: "2px 8px",
            fontSize: 12,
            color: "#92400e",
            textAlign: "center",
          }}
        >
          Debug: shell {shellId.current} {process.env.NODE_ENV}
        </div>
        <FamilyShellHeader title={activeConfig.title} subtitle={activeConfig.subtitle} />
        <main style={mainStyle}>
          {!activeConfig.hideHero ? <FamilyHero {...activeConfig} /> : null}
          {children}
        </main>
      </div>
    </FamilyShellConfigContext.Provider>
  );
}

export default function FamilyTopNavShell({
  children,
  ...heroProps
}: FamilyTopNavShellProps & { children: React.ReactNode }) {
  const shellContext = useContext(FamilyShellConfigContext);
  const shouldRenderHero = !heroProps.hideHero;

  useEffect(() => {
    if (!shellContext) return;
    shellContext.setConfig(heroProps);
    return () => shellContext.setConfig(null);
  }, [heroProps, shellContext]);

  if (shellContext) {
    return <>{children}</>;
  }

  return (
    <FamilyShellSurface shellConfig={heroProps}>
      {children}
    </FamilyShellSurface>
  );
}

export { FamilyHero };
