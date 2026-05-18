"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import BetaV1Badge from "@/app/components/BetaV1Badge";
import CleanAccountMenu from "@/app/components/clean/CleanAccountMenu";
import CleanCommunityNotificationsMenu from "@/app/components/clean/CleanCommunityNotificationsMenu";

type HeaderNavItem = {
  label: string;
  href: string;
  matches: string[];
};

type SuggestFeedbackType =
  | "suggest-improvement"
  | "suggest-tool"
  | "report-problem"
  | "general-feedback";

type SuggestContextItem = {
  key: string;
  label: string;
  matches: string[];
};

const sectionStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 20,
  background: "#ffffff",
  padding: 16,
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
    label: "My Programs",
    href: "/my-programs",
    matches: ["/my-programs", "/clean-my-programs"],
  },
  {
    label: "My Curriculum",
    href: "/my-curriculum",
    matches: ["/my-curriculum", "/clean-my-curriculum"],
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
  {
    label: "My Outputs",
    href: "/my-outputs",
    matches: ["/my-outputs", "/clean-my-outputs"],
  },
];

const communityNavItem: HeaderNavItem = {
  label: "Community",
  href: "/my-community",
  matches: ["/my-community"],
};

const suggestFeedbackOptions: Array<{
  value: SuggestFeedbackType;
  label: string;
  description: string;
}> = [
  {
    value: "suggest-improvement",
    label: "Suggest improvement",
    description: "Share a practical improvement that would make an existing part of MyLearna work better.",
  },
  {
    value: "suggest-tool",
    label: "Suggest a tool",
    description: "Describe a tool or workflow you would like MyLearna to add in the future.",
  },
  {
    value: "report-problem",
    label: "Report a problem",
    description: "Point out something that is getting in the way so the community can help surface it clearly.",
  },
  {
    value: "general-feedback",
    label: "General feedback",
    description: "Share a broader thought about what is helping, what feels unclear, or what should improve next.",
  },
];

const suggestContextItems: SuggestContextItem[] = [
  { key: "my-day", label: "My Day", matches: ["/my-day", "/clean-my-day"] },
  { key: "my-calendar", label: "My Calendar", matches: ["/my-calendar", "/clean-my-calendar"] },
  { key: "my-programs", label: "My Programs", matches: ["/my-programs", "/clean-my-programs"] },
  { key: "my-curriculum", label: "My Curriculum", matches: ["/my-curriculum", "/clean-my-curriculum"] },
  { key: "my-capture", label: "My Capture", matches: ["/my-capture", "/clean-my-capture"] },
  { key: "my-portfolio", label: "My Portfolio", matches: ["/my-portfolio", "/clean-my-portfolio"] },
  { key: "my-reports", label: "My Reports", matches: ["/my-reports", "/clean-my-reports"] },
  { key: "my-outputs", label: "My Outputs", matches: ["/my-outputs", "/clean-my-outputs"] },
  { key: "my-profile", label: "My Profile", matches: ["/my-profile"] },
  { key: "my-settings", label: "My Settings", matches: ["/my-settings"] },
  { key: "my-community", label: "My Community", matches: ["/my-community"] },
];

function matchesPath(pathname: string, candidate: string) {
  return pathname === candidate || pathname.startsWith(`${candidate}/`);
}

function isCurrentMatch(pathname: string, candidates: string[]) {
  return candidates.some((candidate) => matchesPath(pathname, candidate));
}

function getSuggestContext(pathname: string) {
  return (
    suggestContextItems.find((item) =>
      item.matches.some((candidate) => matchesPath(pathname, candidate)),
    ) ?? {
      key: "current-page",
      label: "Current page",
      matches: [],
    }
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function CleanAppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [outputsOpen, setOutputsOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [selectedFeedbackType, setSelectedFeedbackType] =
    useState<SuggestFeedbackType>("suggest-improvement");
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 220 });
  const outputsRef = useRef<HTMLDivElement | null>(null);
  const outputsButtonRef = useRef<HTMLButtonElement | null>(null);
  const outputsMenuRef = useRef<HTMLDivElement | null>(null);
  const currentSuggestContext = getSuggestContext(pathname);

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
        setSuggestOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function openSuggestionDraft() {
    const params = new URLSearchParams();
    params.set("category", "mylearna-suggestions");
    params.set("feedbackType", selectedFeedbackType);
    params.set("sourcePage", currentSuggestContext.key);
    params.set("compose", "1");

    setSuggestOpen(false);
    router.push(`/my-community?${params.toString()}`);
  }

  return (
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
                  width: "clamp(132px, 19vw, 172px)",
                  maxWidth: "100%",
                  height: "auto",
                  display: "block",
                }}
              />
            </Link>
            <BetaV1Badge compact />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => setSuggestOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 999,
                border: "1px solid #dbeafe",
                background: "#ffffff",
                color: "#0f172a",
                padding: "8px 12px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Suggest improvement
            </button>
            <CleanCommunityNotificationsMenu />
            <CleanAccountMenu />
          </div>
        </div>

        <nav aria-label="App sections" style={{ overflowX: "auto", paddingBottom: 2 }}>
          <div
            style={{
              display: "flex",
              gap: 8,
              minWidth: "max-content",
              flexWrap: "nowrap",
              alignItems: "center",
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
                    padding: "8px 12px",
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: "none",
                    whiteSpace: "nowrap",
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
                  padding: "8px 12px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Outputs
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
                      aria-label="Outputs"
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
                    padding: "8px 12px",
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: "none",
                    whiteSpace: "nowrap",
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

      {suggestOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              role="presentation"
              onClick={() => setSuggestOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15,23,42,0.38)",
                display: "grid",
                placeItems: "center",
                padding: 16,
                zIndex: 90,
              }}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="suggest-improvement-heading"
                onClick={(event) => event.stopPropagation()}
                style={{
                  width: "min(680px, 100%)",
                  border: "1px solid #dbeafe",
                  borderRadius: 22,
                  background: "#ffffff",
                  boxShadow: "0 24px 60px rgba(15,23,42,0.18)",
                  padding: 22,
                  display: "grid",
                  gap: 18,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "grid", gap: 8 }}>
                    <div
                      style={{
                        color: "#1d4ed8",
                        fontSize: 12,
                        fontWeight: 800,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      Help shape MyLearna
                    </div>
                    <h2
                      id="suggest-improvement-heading"
                      style={{ margin: 0, color: "#0f172a", fontSize: 24 }}
                    >
                      Suggest improvement
                    </h2>
                    <p style={{ margin: 0, color: "#475569", fontSize: 14, lineHeight: 1.7 }}>
                      Early users help guide development. Start a suggestion in the MyLearna
                      Community so other families can build on it too.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSuggestOpen(false)}
                    style={{
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#0f172a",
                      borderRadius: 999,
                      padding: "8px 12px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Close
                  </button>
                </div>

                <div
                  style={{
                    border: "1px solid #dbeafe",
                    borderRadius: 16,
                    background: "#f8fbff",
                    padding: 14,
                    display: "grid",
                    gap: 6,
                  }}
                >
                  <strong style={{ color: "#0f172a" }}>Current page</strong>
                  <div style={{ color: "#475569", lineHeight: 1.6 }}>
                    {currentSuggestContext.label}
                  </div>
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  <strong style={{ color: "#0f172a" }}>What would you like to share?</strong>
                  <div
                    style={{
                      display: "grid",
                      gap: 10,
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    }}
                  >
                    {suggestFeedbackOptions.map((option) => {
                      const active = selectedFeedbackType === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setSelectedFeedbackType(option.value)}
                          aria-pressed={active}
                          style={{
                            border: active ? "1px solid #1d4ed8" : "1px solid #dbeafe",
                            background: active ? "#eff6ff" : "#ffffff",
                            color: "#0f172a",
                            borderRadius: 16,
                            padding: 14,
                            textAlign: "left",
                            cursor: "pointer",
                            display: "grid",
                            gap: 6,
                          }}
                        >
                          <strong style={{ color: active ? "#1d4ed8" : "#0f172a" }}>
                            {option.label}
                          </strong>
                          <span style={{ color: "#475569", fontSize: 13, lineHeight: 1.6 }}>
                            {option.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setSuggestOpen(false)}
                    style={{
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#0f172a",
                      borderRadius: 10,
                      padding: "10px 14px",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={openSuggestionDraft}
                    style={{
                      border: "1px solid #0f172a",
                      background: "#0f172a",
                      color: "#ffffff",
                      borderRadius: 10,
                      padding: "10px 14px",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Open suggestion draft
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}
