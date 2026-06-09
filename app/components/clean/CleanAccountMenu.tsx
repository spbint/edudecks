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

    try {
      await completeFamilySignOut();
      window.location.replace(redirectTo);
    } catch (nextError) {
      console.warn("[auth] sign-out failed", {
        message: safe((nextError as { message?: unknown })?.message),
      });
      setError("We couldn't sign you out just yet. Please try again.");
      setBusy(false);
    }
  }

  const menuButtonStyle: React.CSSProperties = {
    border: "1px solid #dbeafe",
    borderRadius: 999,
    background: "#ffffff",
    padding: "8px 10px",
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
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
      style={{
        position: "relative",
        justifySelf: "end",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        style={menuButtonStyle}
      >
        <span
          aria-hidden="true"
          style={{
            width: 34,
            height: 34,
            borderRadius: 999,
            background: "#eff6ff",
            color: "#1d4ed8",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 900,
            border: "1px solid #bfdbfe",
            flexShrink: 0,
          }}
        >
          {initials}
        </span>
        <span style={{ display: "grid", gap: 2, textAlign: "left" }}>
          <span style={{ color: "#0f172a", fontSize: 14, fontWeight: 800 }}>My Account</span>
          <span style={{ color: "#64748b", fontSize: 12 }}>
            {email || "Profile and settings"}
          </span>
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="My Account menu"
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

          <Link href="/my-profile" style={menuItemStyle} onClick={() => setOpen(false)}>
            My Profile
          </Link>
          <Link href="/my-settings" style={menuItemStyle} onClick={() => setOpen(false)}>
            My Settings
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => void handleSignOut()}
            disabled={busy}
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
