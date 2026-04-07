"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
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

type NavItem = {
  href: string;
  label: string;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const ACTIVE_STUDENT_ID_KEY = "edudecks_active_student_id";
const ACTIVE_CHILD_EVENT = "edudecksActiveChildChanged";

function safe(value: unknown) {
  return String(value ?? "").trim();
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

        const linkResp = await supabase
          .from("parent_student_links")
          .select("student_id")
          .eq("parent_user_id", user.id);

        if (linkResp.error && !isMissingRelationOrColumn(linkResp.error)) {
          throw linkResp.error;
        }

        const studentIds = (linkResp.data ?? [])
          .map((row) => safe(row.student_id))
          .filter(Boolean);

        if (!studentIds.length) {
          return;
        }

        const selects = [
          "id,preferred_name,first_name,surname,family_name,year_level,photo_url",
          "id,preferred_name,first_name,surname,family_name",
          "id,preferred_name,first_name,year_level",
          "id,preferred_name,first_name",
        ];

        let studentRows: FamilyChild[] = [];

        for (const fields of selects) {
          const resp = (await supabase
            .from("students")
            .select(fields)
            .in("id", studentIds)) as { data: FamilyChild[] | null; error: { message: string } | null };
          if (!resp.error) {
            studentRows = (resp.data ?? []) as FamilyChild[];
            break;
          }
          if (!isMissingColumnError(resp.error)) {
            throw resp.error;
          }
        }

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

const PRIMARY_NAV: NavItem[] = [{ href: "/family", label: "Home" }];

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
        zIndex: 20,
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
          }}
        >
          <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              color: "#64748b",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 14,
              color: "#475569",
              marginTop: 4,
            }}
          >
            {subtitle}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <Link href="/capture" style={utilBtn(true)}>
            Quick Capture
          </Link>
          <Link href="/reports" style={utilBtn(false)}>
            Build Report
          </Link>
          <Link href="/reports/library" style={utilBtn(false)}>
            Report Library
          </Link>
          <ChildSwitcher />
          <ProfileMenu />
        </div>
      </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
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

export function FamilyShellSurface({ children }: { children: React.ReactNode }) {
  return (
    <div style={surfaceStyle}>
      <FamilyShellHeader />
      <main style={mainStyle}>{children}</main>
    </div>
  );
}

export default function FamilyTopNavShell({
  children,
  ...heroProps
}: FamilyTopNavShellProps & { children: React.ReactNode }) {
  const shouldRenderHero = !heroProps.hideHero;
  return (
    <FamilyShellSurface>
      {shouldRenderHero ? <FamilyHero {...heroProps} /> : null}
      {children}
    </FamilyShellSurface>
  );
}

export { FamilyHero };
