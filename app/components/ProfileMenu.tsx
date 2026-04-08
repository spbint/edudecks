"use client";

import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuthUser } from "@/app/components/AuthUserProvider";

type ProfileMenuProps = {
  mobile?: boolean;
};

export default function ProfileMenu({ mobile }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { user, profile, loading } = useAuthUser();
  useEffect(() => {
    if (typeof window === "undefined") return;
    const name = "ProfileMenu";
    console.log(
      `[${name}] render on ${window.location.pathname} | user=${!!user} | profile=${!!profile}`
    );
  }, [user, profile]);

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

  if (loading || !user) {
    return null;
  }

  const adminLinks = profile?.is_admin
    ? [
        { label: "Admin dashboard", href: "/admin" },
        { label: "Command centre", href: "/admin/command-centre" },
      ]
    : [];

  const metadata =
    (user.user_metadata as { full_name?: string | null; name?: string | null } | null) ?? {};
  const displayName: string =
    (typeof metadata.full_name === "string" && metadata.full_name) ||
    (typeof metadata.name === "string" && metadata.name) ||
    user.email ||
    "Signed-in user";
  const email = user.email || "";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((chunk) => chunk[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function clearLocalSessionState() {
    if (typeof window === "undefined") return;
    const keys = [
      "edudecks_active_student_id",
      "edudecks_pending_guided_start_action_v1",
    ];
    for (const key of keys) {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    }
  }

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);

    try {
      await supabase.auth.signOut();
      clearLocalSessionState();
      window.location.href = "/";
      return;
    } catch (error) {
      console.error("ProfileMenu sign out failed", error);
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
          minWidth: mobile ? 0 : 130,
          fontSize: 14,
          fontWeight: 700,
          color: "#0f172a",
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
          }}
        >
          {initials || "ED"}
        </span>
        {!mobile ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span>{displayName}</span>
            <span aria-hidden style={{ fontSize: 12 }}>
              ▾
            </span>
          </span>
        ) : (
          <span aria-hidden style={{ fontSize: 12 }}>
            ▾
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            width: 260,
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
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{displayName}</div>
            {email ? (
              <div style={{ fontSize: 12, color: "#475569", wordBreak: "break-all" }}>{email}</div>
            ) : null}
          </div>

          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 10, display: "grid", gap: 6 }}>
            {[
              { label: "My profile", href: "/profile" },
              { label: "Settings", href: "/settings" },
              { label: "Curriculum setup", href: "/settings?section=curriculum" },
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

          {adminLinks.length ? (
            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 10, display: "grid", gap: 6 }}>
              {adminLinks.map((item) => (
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
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ) : null}

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
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}
