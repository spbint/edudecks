"use client";

import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";

type FamilyProfileMenuProps = {
  mobile?: boolean;
  familyName?: string;
  email?: string;
  defaultLearner?: string;
};

export default function FamilyProfileMenu({
  mobile,
  familyName = "MyLearna Family",
  email = "hello@mylearna.com",
  defaultLearner = "No learner selected",
}: FamilyProfileMenuProps) {
  const [open, setOpen] = useState(false);
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

  function handleSignOut() {
    setOpen(false);
    window.location.assign("/sign-out");
  }

  return (
    <div
      ref={menuRef}
      style={{ position: "relative", display: "inline-flex", alignItems: "center", zIndex: open ? 120 : 40 }}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        style={styles.trigger(mobile)}
      >
        <span style={styles.avatar(mobile)}>{initials || "ML"}</span>
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
        <div role="menu" style={styles.menu}>
          <div style={{ display: "grid", gap: 4 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{familyName}</div>
            <div style={{ fontSize: 12, color: "#475569", wordBreak: "break-all" }}>{email}</div>
          </div>

          <div style={styles.infoSection}>
            <div style={styles.infoCard}>
              <div style={styles.infoLabel}>Current learner</div>
              <div style={styles.infoValue}>{defaultLearner}</div>
            </div>
          </div>

          <div style={styles.linkSection}>
            {[
              { label: "My Profile", href: "/profile" },
              { label: "My Family", href: "/family" },
              { label: "My Settings", href: "/settings" },
              { label: "My Subscription", href: "/pricing" },
            ].map((item) => (
              <Link key={item.label} href={item.href} onClick={() => setOpen(false)} style={styles.link}>
                {item.label}
              </Link>
            ))}
          </div>

          <button type="button" onClick={handleSignOut} style={styles.signOut}>
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

const styles = {
  trigger: (mobile?: boolean): React.CSSProperties => ({
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
  }),
  avatar: (mobile?: boolean): React.CSSProperties => ({
    width: mobile ? 32 : 36,
    height: mobile ? 32 : 36,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #eff6ff 0%, #f5f3ff 60%, #ecfdf5 100%)",
    color: "#1e3a8a",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 800,
    flexShrink: 0,
  }),
  menu: {
    position: "absolute",
    right: 0,
    top: "calc(100% + 8px)",
    width: 320,
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    boxShadow: "0 22px 52px rgba(15,23,42,0.14)",
    padding: 16,
    display: "grid",
    gap: 10,
    zIndex: 120,
  } satisfies React.CSSProperties,
  infoSection: {
    borderTop: "1px solid #f1f5f9",
    paddingTop: 10,
    display: "grid",
    gap: 8,
  } satisfies React.CSSProperties,
  infoCard: {
    padding: "10px 12px",
    borderRadius: 12,
    background: "#f8fafc",
    display: "grid",
    gap: 4,
  } satisfies React.CSSProperties,
  infoLabel: {
    fontSize: 11,
    fontWeight: 800,
    color: "#64748b",
    textTransform: "uppercase",
  } satisfies React.CSSProperties,
  infoValue: {
    fontSize: 13,
    fontWeight: 700,
    color: "#0f172a",
  } satisfies React.CSSProperties,
  linkSection: {
    borderTop: "1px solid #f1f5f9",
    paddingTop: 10,
    display: "grid",
    gap: 6,
  } satisfies React.CSSProperties,
  link: {
    textDecoration: "none",
    padding: "10px 12px",
    borderRadius: 12,
    color: "#0f172a",
    fontWeight: 700,
    background: "#f8fafc",
  } satisfies React.CSSProperties,
  signOut: {
    marginTop: 10,
    borderRadius: 12,
    border: "none",
    padding: "10px 12px",
    fontWeight: 700,
    fontSize: 14,
    background: "#0f172a",
    color: "#ffffff",
    cursor: "pointer",
  } satisfies React.CSSProperties,
};
