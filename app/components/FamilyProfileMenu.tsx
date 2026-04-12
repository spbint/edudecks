"use client";

import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type FamilyProfileMenuProps = {
  mobile?: boolean;
  familyName?: string;
  email?: string;
  defaultLearner?: string;
  curriculum?: string;
};

export default function FamilyProfileMenu({
  mobile,
  familyName = "EduDecks Family",
  email = "seanbint@live.com",
  defaultLearner = "Ava",
  curriculum = "Australian Curriculum v9",
}: FamilyProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!open) return;
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const initials = familyName
    .split(" ")
    .filter(Boolean)
    .map((chunk) => chunk[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);

    try {
      await supabase.auth.signOut();
      window.location.href = "/";
      return;
    } catch (error) {
      console.error("FamilyProfileMenu sign out failed", error);
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div
      ref={menuRef}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        zIndex: open ? 120 : 40,
      }}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          borderRadius: 999,
          border: "1px solid #d1d5db",
          padding: mobile ? "6px 10px" : "8px 12px",
          background: "#ffffff",
          cursor: "pointer",
          minWidth: mobile ? 0 : 160,
          fontSize: 14,
          fontWeight: 700,
          color: "#0f172a",
          boxShadow: "0 8px 20px rgba(15,23,42,0.05)",
        }}
      >
        <span
          style={{
            width: mobile ? 32 : 36,
            height: mobile ? 32 : 36,
            borderRadius: "50%",
            background: "#eef2ff",
            color: "#1d4ed8",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {initials || "ED"}
        </span>
        {!mobile ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span>{familyName}</span>
            <span aria-hidden style={{ fontSize: 12 }}>
              v
            </span>
          </span>
        ) : (
          <span aria-hidden style={{ fontSize: 12 }}>
            v
          </span>
        )}
      </button>

      {open ? (
        <div
          role="menu"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            width: 320,
            borderRadius: 18,
            border: "1px solid #e5e7eb",
            background: "#ffffff",
            boxShadow: "0 16px 40px rgba(15,23,42,0.2)",
            padding: 16,
            display: "grid",
            gap: 10,
            zIndex: 120,
          }}
        >
          <div style={{ display: "grid", gap: 4 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{familyName}</div>
            <div style={{ fontSize: 12, color: "#475569", wordBreak: "break-all" }}>{email}</div>
          </div>

          <div
            style={{
              borderTop: "1px solid #f1f5f9",
              paddingTop: 10,
              display: "grid",
              gap: 8,
            }}
          >
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                background: "#f8fafc",
                display: "grid",
                gap: 4,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                Default learner
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{defaultLearner}</div>
            </div>
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                background: "#f8fafc",
                display: "grid",
                gap: 4,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                Curriculum
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{curriculum}</div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 10, display: "grid", gap: 6 }}>
            {[
              { label: "My profile", href: "/profile" },
              { label: "Family Home", href: "/family" },
              { label: "Settings", href: "/settings" },
              { label: "Curriculum setup", href: "/settings#curriculum" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                style={{
                  textDecoration: "none",
                  padding: "10px 12px",
                  borderRadius: 12,
                  color: "#0f172a",
                  fontWeight: 700,
                  background: "#f8fafc",
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            style={{
              marginTop: 10,
              borderRadius: 12,
              border: "none",
              padding: "10px 12px",
              fontWeight: 700,
              fontSize: 14,
              background: "#1d4ed8",
              color: "#ffffff",
              cursor: signingOut ? "not-allowed" : "pointer",
            }}
          >
            {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
