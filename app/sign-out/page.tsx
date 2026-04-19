"use client";

import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import {
  completeFamilySignOut,
  isFamilySignOutTimeout,
} from "@/lib/familySignOut";

type Status = "pending" | "failed";

export default function SignOutPage() {
  const [status, setStatus] = useState<Status>("pending");
  const [errorMessage, setErrorMessage] = useState("");
  const attemptRef = useRef(0);

  async function runSignOutAttempt() {
    const nextAttempt = attemptRef.current + 1;
    attemptRef.current = nextAttempt;
    setStatus("pending");
    setErrorMessage("");

    try {
      await completeFamilySignOut();
      if (attemptRef.current !== nextAttempt) return;
      window.location.replace("/");
    } catch (error) {
      if (attemptRef.current !== nextAttempt) return;

      console.error("Family sign-out route failed", error);
      setStatus("failed");
      setErrorMessage(
        isFamilySignOutTimeout(error)
          ? "Sign-out took too long. Please try again. If it keeps happening, use Return home and refresh there."
          : "We couldn't sign you out just yet. Please try again.",
      );
    }
  }

  useEffect(() => {
    void runSignOutAttempt();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background: "#f8fafc",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 520,
          borderRadius: 24,
          border: "1px solid #e2e8f0",
          background: "#ffffff",
          boxShadow: "0 18px 40px rgba(15,23,42,0.08)",
          padding: 24,
          display: "grid",
          gap: 16,
        }}
      >
        <div style={{ display: "grid", gap: 8 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              color: "#64748b",
            }}
          >
            Family sign out
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 30,
              lineHeight: 1.15,
              color: "#0f172a",
            }}
          >
            {status === "pending" ? "Signing you out..." : "Sign-out needs attention"}
          </h1>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: "#475569" }}>
            {status === "pending"
              ? "Please wait a moment while we clear this family session."
              : errorMessage}
          </p>
        </div>

        {status === "failed" ? (
          <div
            role="alert"
            style={{
              borderRadius: 16,
              border: "1px solid #fdba74",
              background: "#fff7ed",
              color: "#9a3412",
              padding: "12px 14px",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            {errorMessage}
          </div>
        ) : (
          <div
            aria-hidden
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              border: "3px solid #cbd5e1",
              borderTopColor: "#1d4ed8",
              animation: "spin 1s linear infinite",
            }}
          />
        )}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {status === "failed" ? (
            <button
              type="button"
              onClick={() => void runSignOutAttempt()}
              style={{
                border: "none",
                borderRadius: 12,
                background: "#0f172a",
                color: "#ffffff",
                padding: "11px 14px",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          ) : null}

          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 12,
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#0f172a",
              padding: "11px 14px",
              fontSize: 14,
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            Return home
          </Link>
        </div>
      </section>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </main>
  );
}
