"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { loadFamilyProfile } from "@/lib/familySettings";
import { listReportDrafts, type ReportDraftRow } from "@/lib/reportDrafts";
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
  priority?: number;
};

type EvidenceSignalRow = {
  id: string;
  student_id?: string | null;
  learning_area?: string | null;
  created_at?: string | null;
  occurred_on?: string | null;
};

const ACTIVE_STUDENT_ID_KEY = "edudecks_active_student_id";
const ACTIVE_CHILD_EVENT = "edudecksActiveChildChanged";

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

function priorityWeight(tone: CommandTone) {
  if (tone === "warning") return 3;
  if (tone === "info") return 2;
  if (tone === "success") return 1;
  return 0;
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
      if (typeof window !== "undefined") {
        console.log(
          `[ChildSwitcher] render on ${window.location.pathname} | children=${children.length} | active=${activeChildId}`
        );
      }
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
  const [activeChildVersion, setActiveChildVersion] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    function handleActiveChildChanged() {
      setActiveChildVersion((value) => value + 1);
    }

    window.addEventListener(ACTIVE_CHILD_EVENT, handleActiveChildChanged as EventListener);
    window.addEventListener("storage", handleActiveChildChanged);
    return () => {
      window.removeEventListener(ACTIVE_CHILD_EVENT, handleActiveChildChanged as EventListener);
      window.removeEventListener("storage", handleActiveChildChanged);
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
          setSignals({
            "/capture": {
              tone: "warning",
              label: "No child selected",
              suggestion: "Add a child first so EduDecks can guide the next step.",
              priority: 100,
            },
            "/planner": {
              tone: "info",
              label: "Start with setup",
              suggestion: "Create a child profile before planning the next learning step.",
              priority: 70,
            },
            "/portfolio": {
              tone: "neutral",
              label: "Waiting for learning",
              priority: 10,
            },
            "/reports": {
              tone: "neutral",
              label: "Nothing to report yet",
              priority: 10,
            },
            "/authority/readiness": {
              tone: "neutral",
              label: "Readiness comes later",
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
        const childDrafts = drafts.filter(
          (draft) => safe(draft.student_id || draft.child_id) === activeChild.id
        );
        const latestDraft = childDrafts[0] ?? null;
        const selectedEvidenceCount = latestDraft?.selected_evidence_ids?.length ?? 0;

        const nextSignals: Record<string, CommandSignal> = {};

        if (!rows.length) {
          nextSignals["/capture"] = {
            tone: "warning",
            label: "Needs a first entry",
            suggestion: `Capture one small learning moment for ${childName}.`,
            priority: 100,
          };
        } else if (!weeklyRows.length) {
          nextSignals["/capture"] = {
            tone: "info",
            label: "Quiet this week",
            suggestion: `Add one fresh moment for ${childName} this week.`,
            priority: 82,
          };
        } else if (!weeklyAreas.has("science")) {
          nextSignals["/capture"] = {
            tone: "info",
            label: "No science yet",
            suggestion: `Add one science example while the week is still open.`,
            priority: 68,
          };
        } else {
          nextSignals["/capture"] = {
            tone: "success",
            label: "Fresh evidence",
            suggestion: `${childName} has current evidence flowing this week.`,
            priority: 18,
          };
        }

        if (!rows.length) {
          nextSignals["/planner"] = {
            tone: "neutral",
            label: "Plan after first capture",
            priority: 12,
          };
        } else if (recentAreas.size < 2) {
          nextSignals["/planner"] = {
            tone: "info",
            label: "Coverage is light",
            suggestion: `Plan one ${titleCaseArea(missingFocusArea || "science")} learning moment next.`,
            priority: 76,
          };
        } else if (!weeklyRows.length) {
          nextSignals["/planner"] = {
            tone: "info",
            label: "Next step needed",
            suggestion: `Open planner and choose one simple session for ${childName}.`,
            priority: 64,
          };
        } else {
          nextSignals["/planner"] = {
            tone: "success",
            label: "Plan is moving",
            suggestion: "Use planner when you want to shape the next stretch of learning.",
            priority: 16,
          };
        }

        if (!rows.length) {
          nextSignals["/portfolio"] = {
            tone: "neutral",
            label: "Portfolio is waiting",
            priority: 10,
          };
        } else if ((daysSince(rows[0]?.occurred_on || rows[0]?.created_at) ?? 999) > 21) {
          nextSignals["/portfolio"] = {
            tone: "info",
            label: "Story feels dated",
            suggestion: `Add one fresh piece so the portfolio stays current.`,
            priority: 58,
          };
        } else if (recentAreas.size < 2) {
          nextSignals["/portfolio"] = {
            tone: "info",
            label: "Thin spread",
            suggestion: `One more area would make ${childName}'s learning story feel broader.`,
            priority: 52,
          };
        } else {
          nextSignals["/portfolio"] = {
            tone: "success",
            label: "Story is building",
            suggestion: "Portfolio is ready when you want to review the learning journey.",
            priority: 14,
          };
        }

        if (!latestDraft) {
          nextSignals["/reports"] = {
            tone: "info",
            label: "No draft yet",
            suggestion: `Turn ${childName}'s evidence into a first report draft.`,
            priority: rows.length >= 3 ? 74 : 42,
          };
        } else if (selectedEvidenceCount < 3) {
          nextSignals["/reports"] = {
            tone: "warning",
            label: "Draft is still light",
            suggestion: "Add one or two stronger examples before building the report.",
            priority: 72,
          };
        } else if (!weeklyRows.length) {
          nextSignals["/reports"] = {
            tone: "info",
            label: "Refresh before building",
            suggestion: "A fresh entry would make the report feel more current.",
            priority: 60,
          };
        } else {
          nextSignals["/reports"] = {
            tone: "success",
            label: "Ready to build",
            suggestion: "Enough current evidence is in place to move into reporting.",
            priority: 46,
          };
        }

        if (familyProfile?.show_authority_guidance === false) {
          nextSignals["/authority/readiness"] = {
            tone: "neutral",
            label: "Guidance is off",
            suggestion: "Turn readiness guidance on in settings when you want a calmer submission view.",
            priority: 20,
          };
        } else if (!latestDraft) {
          nextSignals["/authority/readiness"] = {
            tone: "neutral",
            label: "Early stage",
            suggestion: "Create a report draft before checking authority readiness.",
            priority: 15,
          };
        } else if (selectedEvidenceCount < 3 || recentAreas.size < 2) {
          nextSignals["/authority/readiness"] = {
            tone: "warning",
            label: "Not ready yet",
            suggestion: "Strengthen evidence breadth before moving into authority readiness.",
            priority: 40,
          };
        } else {
          nextSignals["/authority/readiness"] = {
            tone: "success",
            label: "Building readiness",
            suggestion: "You can review readiness calmly and decide whether to prepare an authority pack.",
            priority: 44,
          };
        }

        setSignals(nextSignals);
      } catch (error) {
        console.error("Family command guidance failed", error);
        if (mounted) {
          setSignals({});
        }
      }
    }

    hydrateSignals();
    return () => {
      mounted = false;
    };
  }, [activeChildVersion]);

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
      return {
        href: item.href,
        score: (signal?.priority ?? 0) + priorityWeight(signal?.tone ?? "neutral"),
      };
    }).sort((left, right) => right.score - left.score);

    return ranked[0]?.score ? ranked[0].href : null;
  }, [signals]);

  const recommendedItem = COMMAND_ITEMS.find((item) => item.href === recommendedHref) ?? null;
  const recommendedSignal = recommendedHref ? signals[recommendedHref] : null;

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
            }}
          >
            Move from capture to planning, portfolio, reports, and readiness without losing context.
          </div>
          {recommendedItem && recommendedSignal?.suggestion ? (
            <div
              style={{
                marginTop: 8,
                fontSize: 13,
                lineHeight: 1.5,
                color: "#334155",
              }}
            >
              <span style={{ fontWeight: 800, color: "#0f172a" }}>Next best step:</span>{" "}
              {recommendedItem.label}. {recommendedSignal.suggestion}
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
          return (
            <Link
              key={item.href}
              href={item.href}
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
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.log(`[FamilyShellHeader] active on ${pathname}`);
    }
  }, [pathname]);

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const name = "FamilyShellSurface";
      console.log(`[${name}] ${shellId.current} active on ${pathname}`);
    }
  }, [pathname]);

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
    if (typeof window !== "undefined") {
      console.log(
        `[FamilyTopNavShell] mounted on ${window.location.pathname} | hero=${shouldRenderHero}`
      );
    }
  }, [shouldRenderHero]);

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
