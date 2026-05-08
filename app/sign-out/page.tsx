"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { completeFamilySignOut } from "@/lib/familySignOut";

export default function SignOutPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void completeFamilySignOut()
      .then(() => {
        window.location.replace("/login?authMessage=You%20have%20been%20signed%20out.");
      })
      .catch((nextError) => {
        if (!active) return;
        setError(
          (nextError as { message?: string })?.message ||
            "We couldn't sign you out just yet. Please try again.",
        );
      });

    return () => {
      active = false;
    };
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
            Sign out
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 30,
              lineHeight: 1.15,
              color: "#0f172a",
            }}
          >
            Signing you out...
          </h1>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: "#475569" }}>
            {error
              ? "We couldn't finish signing you out yet."
              : "We're signing you out now and sending you back to login."}
          </p>
        </div>

        {error ? (
          <div
            role="alert"
            style={{
              borderRadius: 14,
              border: "1px solid #fecaca",
              background: "#fff1f2",
              color: "#b91c1c",
              padding: 14,
              fontSize: 14,
              lineHeight: 1.6,
              fontWeight: 700,
            }}
          >
            {error}
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

        <Link
          href="/login"
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
          Back to login
        </Link>
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
