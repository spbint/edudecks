"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { completeFamilySignOut } from "@/lib/familySignOut";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function buildInitials(email?: string | null) {
  const localPart = safe(email).split("@")[0] || "me";
  const letters = localPart.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2).toUpperCase();
  return letters || "ME";
}

export default function CleanAccountMenu({
  email,
  redirectTo = "/start-free",
}: {
  email?: string | null;
  redirectTo?: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const initials = useMemo(() => buildInitials(email), [email]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleSignOut() {
    if (busy) return;

    setBusy(true);
    setError(null);
    const target = safe(redirectTo) || "/start-free";
    const fallback = window.setTimeout(() => {
      window.location.assign(target);
    }, 5000);

    try {
      await completeFamilySignOut();
      window.clearTimeout(fallback);
      window.location.assign(target);
    } catch (nextError) {
      window.clearTimeout(fallback);
      console.warn("[auth] sign-out failed", {
        message: safe((nextError as { message?: unknown })?.message),
      });
      window.location.assign(target);
    }
  }

  const menuButtonStyle: React.CSSProperties = {
    border: "1px solid #E7EAF2",
    borderRadius: 999,
    background: "#ffffff",
    padding: "3px 8px 3px 3px",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(23,32,75,0.04)",
  };

  const menuItemStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    border: "none",
    background: "#ffffff",
    padding: "10px 12px",
    borderRadius: 12,
    textDecoration: "none",
    color: "#0f172a",
    fontSize: 14,
    fontWeight: 700,
    textAlign: "left",
    cursor: "pointer",
  };

  return (
    <div
      ref={wrapRef}
      className="mylearna-account-menu"
      style={{
        position: "relative",
        justifySelf: "end",
      }}
    >
      <style jsx global>{`
        @media (max-width: 900px) {
          .mylearna-account-menu-label {
            display: none !important;
          }

          .mylearna-account-menu-button {
            width: 38px !important;
            height: 38px !important;
            padding: 2px !important;
            justify-content: center !important;
          }

          .mylearna-account-menu-button-avatar {
            width: 32px !important;
            height: 32px !important;
          }

          .mylearna-account-menu-panel {
            position: fixed !important;
            left: 10px !important;
            right: 10px !important;
            top: auto !important;
            bottom: calc(78px + env(safe-area-inset-bottom, 0px)) !important;
            width: auto !important;
            max-height: min(420px, calc(100dvh - 132px)) !important;
            overflow-y: auto !important;
            padding: 12px !important;
            border-radius: 20px !important;
            box-shadow: 0 22px 54px rgba(15, 23, 42, 0.18) !important;
            z-index: 70 !important;
          }

          .mylearna-account-menu-backdrop {
            display: block !important;
            position: fixed !important;
            inset: 0 !important;
            background: rgba(15, 23, 42, 0.24) !important;
            z-index: 69 !important;
          }

          .mylearna-account-menu-item {
            min-height: 46px !important;
            font-size: 16px !important;
          }
        }
      `}</style>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open account menu"
        className="mylearna-account-menu-button"
        style={menuButtonStyle}
      >
        <span
          aria-hidden="true"
          className="mylearna-account-menu-button-avatar"
          style={{
            width: 34,
            height: 34,
            borderRadius: 999,
            background: "#F2EDFF",
            color: "#6C4DF6",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 800,
            border: "1px solid #D9D0FF",
            flexShrink: 0,
          }}
        >
          {initials}
        </span>
        <span className="mylearna-account-menu-label" style={{ display: "grid", gap: 1, textAlign: "left", maxWidth: 142 }}>
          <span style={{ color: "#17204B", fontSize: 13, fontWeight: 650 }}>Account</span>
          <span
            style={{
              color: "#5B6478",
              fontSize: 11,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {email || "Profile"}
          </span>
        </span>
      </button>

      {open ? (
        <div
          className="mylearna-account-menu-backdrop"
          aria-hidden="true"
          onClick={() => setOpen(false)}
          style={{ display: "none" }}
        />
      ) : null}

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="My Account menu"
          className="mylearna-account-menu-panel"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 10px)",
            width: 240,
            border: "1px solid #e2e8f0",
            borderRadius: 18,
            background: "#ffffff",
            boxShadow: "0 20px 40px rgba(15,23,42,0.12)",
            padding: 10,
            display: "grid",
            gap: 6,
            zIndex: 50,
          }}
          >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "2px 4px 8px" }}>
            <strong style={{ color: "#17204B", fontSize: 16 }}>Account</strong>
            <button
              type="button"
              aria-label="Close account menu"
              onClick={() => setOpen(false)}
              style={{ border: "none", background: "transparent", color: "#5B6478", minWidth: 44, minHeight: 44, fontSize: 20, cursor: "pointer" }}
            >
              &times;
            </button>
          </div>
          {email ? (
            <div
              style={{
                padding: "8px 10px 10px",
                borderBottom: "1px solid #e2e8f0",
                color: "#475569",
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              Signed in as
              <div style={{ color: "#0f172a", fontWeight: 700, marginTop: 2 }}>{email}</div>
            </div>
          ) : null}

          <Link href="/my-profile" className="mylearna-account-menu-item" style={menuItemStyle} onClick={() => setOpen(false)}>
            My Profile
          </Link>
          <Link href="/my-settings" className="mylearna-account-menu-item" style={menuItemStyle} onClick={() => setOpen(false)}>
            My Settings
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => void handleSignOut()}
            disabled={busy}
            className="mylearna-account-menu-item"
            style={{
              ...menuItemStyle,
              color: "#b91c1c",
              opacity: busy ? 0.7 : 1,
              cursor: busy ? "not-allowed" : "pointer",
            }}
          >
            {busy ? "Signing out..." : "Sign out"}
          </button>

          {error ? (
            <div
              role="alert"
              style={{
                borderTop: "1px solid #fee2e2",
                padding: "8px 10px 2px",
                color: "#b91c1c",
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              {error}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
