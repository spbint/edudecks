"use client";

import { useMemo } from "react";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  returnPath?: string;
};

export default function AuthModal({ open, onClose, returnPath }: AuthModalProps) {
  const loginHref = useMemo(() => {
    const next = returnPath || "/";
    return `/login?next=${encodeURIComponent(next)}`;
  }, [returnPath]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        background: "rgba(15,23,42,0.52)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          borderRadius: 24,
          border: "1px solid #e5e7eb",
          background: "#ffffff",
          boxShadow: "0 30px 80px rgba(15,23,42,0.22)",
          padding: 20,
          display: "grid",
          gap: 14,
        }}
      >
        <div style={{ display: "grid", gap: 8 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: 1.1,
              textTransform: "uppercase",
              color: "#64748b",
            }}
          >
            Sign in required
          </div>
          <div
            style={{
              fontSize: 28,
              lineHeight: 1.1,
              fontWeight: 900,
              color: "#0f172a",
            }}
          >
            Continue on the login page
          </div>
          <div
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              color: "#475569",
            }}
          >
            EduDecks now uses one password-first login flow. Continue there, then come back to finish what you were doing.
          </div>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <a
            href={loginHref}
            style={{
              width: "100%",
              minHeight: 48,
              borderRadius: 12,
              border: "1px solid #2563eb",
              background: "#2563eb",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 800,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Go to login
          </a>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: "100%",
              minHeight: 48,
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "#ffffff",
              color: "#0f172a",
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
