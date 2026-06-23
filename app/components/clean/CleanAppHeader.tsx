"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PreviewBadge from "@/app/components/PreviewBadge";
import CleanAccountMenu from "@/app/components/clean/CleanAccountMenu";
import CleanCommunityNotificationsMenu from "@/app/components/clean/CleanCommunityNotificationsMenu";
import CleanPageFeedbackWidget from "@/app/components/clean/CleanPageFeedbackWidget";
import { useAuthUser } from "@/app/components/AuthUserProvider";

type HeaderNavItem = {
  label: string;
  href: string;
  matches: string[];
};

const sectionStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 20,
  background: "#ffffff",
  padding: "clamp(12px, 3vw, 16px)",
  boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
};

const coreNavItems: HeaderNavItem[] = [
  {
    label: "My Day",
    href: "/my-day",
    matches: ["/my-day", "/clean-my-day"],
  },
  {
    label: "My Calendar",
    href: "/my-calendar",
    matches: ["/my-calendar", "/clean-my-calendar"],
  },
  {
    label: "My Pathways",
    href: "/my-pathways",
    matches: ["/my-pathways", "/clean-my-pathways", "/pathways"],
  },
];

const outputNavItems: HeaderNavItem[] = [
  {
    label: "My Capture",
    href: "/my-capture",
    matches: ["/my-capture", "/clean-my-capture"],
  },
  {
    label: "My Portfolio",
    href: "/my-portfolio",
    matches: ["/my-portfolio", "/clean-my-portfolio"],
  },
  {
    label: "My Reports",
    href: "/my-reports",
    matches: ["/my-reports", "/clean-my-reports"],
  },
];

const communityNavItem: HeaderNavItem = {
  label: "My Community",
  href: "/my-community",
  matches: ["/my-community"],
};

const dataNavItem: HeaderNavItem = {
  label: "My Data",
  href: "/my-data",
  matches: ["/my-data", "/my-curriculum", "/clean-my-curriculum"],
};

function matchesPath(pathname: string, candidate: string) {
  return pathname === candidate || pathname.startsWith(`${candidate}/`);
}

function isCurrentMatch(pathname: string, candidates: string[]) {
  return candidates.some((candidate) => matchesPath(pathname, candidate));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function CleanAppHeader() {
  const pathname = usePathname();
  const { user } = useAuthUser();
  const [outputsOpen, setOutputsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 220 });
  const outputsRef = useRef<HTMLDivElement | null>(null);
  const outputsButtonRef = useRef<HTMLButtonElement | null>(null);
  const outputsMenuRef = useRef<HTMLDivElement | null>(null);

  const outputsCurrent = isCurrentMatch(
    pathname,
    outputNavItems.flatMap((item) => item.matches),
  );

  useLayoutEffect(() => {
    if (!outputsOpen) return;

    function updateMenuPosition() {
      const button = outputsButtonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const width = Math.min(220, Math.max(200, window.innerWidth - 24));
      const left = clamp(rect.left, 12, Math.max(12, window.innerWidth - width - 12));
      const top = rect.bottom + 10;

      setMenuPosition({ top, left, width });
    }

    updateMenuPosition();

    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [outputsOpen]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      const clickedTrigger = outputsRef.current?.contains(target);
      const clickedMenu = outputsMenuRef.current?.contains(target);

      if (!clickedTrigger && !clickedMenu) {
        setOutputsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOutputsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <>
      <section style={sectionStyle}>
        <div style={{ display: "grid", gap: 14 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
                minWidth: 0,
                flex: "1 1 220px",
              }}
            >
              <Link
                href="/my-day"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  textDecoration: "none",
                  color: "#0f172a",
                  minWidth: 0,
                }}
              >
                <Image
                  src="/branding/MyLearna Logo.png"
                  alt="MyLearna"
                  width={1916}
                  height={821}
                  priority
                  style={{
                    width: "clamp(116px, 30vw, 172px)",
                    maxWidth: "100%",
                    height: "auto",
                    display: "block",
                  }}
                />
              </Link>
              <PreviewBadge compact />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 12,
                flexWrap: "wrap",
                flex: "1 1 260px",
              }}
            >
              <CleanCommunityNotificationsMenu />
              <CleanAccountMenu email={user?.email ?? null} redirectTo="/start-free" />
            </div>
          </div>

          <nav
            aria-label="App sections"
            style={{
              overflowX: "auto",
              paddingBottom: 4,
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "thin",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 8,
                minWidth: "max-content",
                flexWrap: "nowrap",
                alignItems: "center",
                scrollSnapType: "x proximity",
              }}
            >
              {coreNavItems.map((item) => {
                const isCurrent = isCurrentMatch(pathname, item.matches);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isCurrent ? "page" : undefined}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 999,
                      border: isCurrent ? "1px solid #1d4ed8" : "1px solid #dbeafe",
                      background: isCurrent ? "#eff6ff" : "#ffffff",
                      color: isCurrent ? "#1d4ed8" : "#334155",
                      padding: "10px 14px",
                      minHeight: 40,
                      fontSize: 13,
                      fontWeight: 700,
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                      scrollSnapAlign: "start",
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <div ref={outputsRef} style={{ position: "relative", flexShrink: 0 }}>
                <button
                  ref={outputsButtonRef}
                  type="button"
                  onClick={() => setOutputsOpen((current) => !current)}
                  aria-haspopup="menu"
                  aria-expanded={outputsOpen}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    borderRadius: 999,
                    border: outputsCurrent ? "1px solid #1d4ed8" : "1px solid #dbeafe",
                    background: outputsCurrent ? "#eff6ff" : "#ffffff",
                    color: outputsCurrent ? "#1d4ed8" : "#334155",
                    padding: "10px 14px",
                    minHeight: 40,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    scrollSnapAlign: "start",
                  }}
                >
                  Evidence & Reports
                  <span
                    aria-hidden="true"
                    style={{
                      fontSize: 11,
                      transform: outputsOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 120ms ease",
                    }}
                  >
                    v
                  </span>
                </button>

                {outputsOpen && typeof document !== "undefined"
                  ? createPortal(
                      <div
                        ref={outputsMenuRef}
                        role="menu"
                        aria-label="Evidence and reports"
                        style={{
                          position: "fixed",
                          left: menuPosition.left,
                          top: menuPosition.top,
                          width: menuPosition.width,
                          border: "1px solid #e2e8f0",
                          borderRadius: 18,
                          background: "#ffffff",
                          boxShadow: "0 20px 40px rgba(15,23,42,0.12)",
                          padding: 10,
                          display: "grid",
                          gap: 6,
                          zIndex: 80,
                        }}
                      >
                        {outputNavItems.map((item) => {
                          const isCurrent = isCurrentMatch(pathname, item.matches);

                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              role="menuitem"
                              onClick={() => setOutputsOpen(false)}
                              style={{
                                display: "block",
                                borderRadius: 12,
                                padding: "10px 12px",
                                textDecoration: "none",
                                background: isCurrent ? "#eff6ff" : "#ffffff",
                                color: isCurrent ? "#1d4ed8" : "#0f172a",
                                fontSize: 14,
                                fontWeight: 700,
                              }}
                            >
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>,
                      document.body,
                    )
                  : null}
              </div>

              {(() => {
                const isCurrent = isCurrentMatch(pathname, dataNavItem.matches);

                return (
                  <Link
                    href={dataNavItem.href}
                    aria-current={isCurrent ? "page" : undefined}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 999,
                      border: isCurrent ? "1px solid #1d4ed8" : "1px solid #dbeafe",
                      background: isCurrent ? "#eff6ff" : "#ffffff",
                      color: isCurrent ? "#1d4ed8" : "#334155",
                      padding: "10px 14px",
                      minHeight: 40,
                      fontSize: 13,
                      fontWeight: 700,
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                      scrollSnapAlign: "start",
                    }}
                  >
                    {dataNavItem.label}
                  </Link>
                );
              })()}

              {(() => {
                const isCurrent = isCurrentMatch(pathname, communityNavItem.matches);

                return (
                  <Link
                    href={communityNavItem.href}
                    aria-current={isCurrent ? "page" : undefined}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 999,
                      border: isCurrent ? "1px solid #1d4ed8" : "1px solid #dbeafe",
                      background: isCurrent ? "#eff6ff" : "#ffffff",
                      color: isCurrent ? "#1d4ed8" : "#334155",
                      padding: "10px 14px",
                      minHeight: 40,
                      fontSize: 13,
                      fontWeight: 700,
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                      scrollSnapAlign: "start",
                    }}
                  >
                    {communityNavItem.label}
                  </Link>
                );
              })()}
            </div>
          </nav>

          {/* TODO: if outputs grows further, split reports and exports more clearly in the header. */}
        </div>
      </section>

      <CleanPageFeedbackWidget />
    </>
  );
}
