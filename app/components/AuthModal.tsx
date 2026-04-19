"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getMagicLinkCooldownRemainingMs,
  getMagicLinkErrorDetails,
  getMagicLinkRetryAfterMs,
  MAGIC_LINK_CLIENT_RESEND_DELAY_MS,
  MAGIC_LINK_RATE_LIMIT_RETRY_DELAY_MS,
  mapMagicLinkError,
  resetMagicLinkClientState,
  sendMagicLink,
} from "@/lib/authMagicLink";
import { clearSignedOutMarker } from "@/lib/familySignOut";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  returnPath?: string;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export default function AuthModal({ open, onClose, returnPath }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const [error, setError] = useState("");
  const [diagnosticCode, setDiagnosticCode] = useState("");
  const [retryBlockedUntil, setRetryBlockedUntil] = useState<number | null>(null);
  const [retryCountdown, setRetryCountdown] = useState(0);

  const resolvedNextPath = useMemo(
    () =>
      returnPath ||
      (typeof window !== "undefined" ? window.location.pathname + window.location.search : "/"),
    [returnPath],
  );
  const normalizedEmail = useMemo(() => safe(email).toLowerCase(), [email]);
  const retryBlocked = retryCountdown > 0;

  useEffect(() => {
    if (!retryBlockedUntil) {
      setRetryCountdown(0);
      return;
    }

    const blockedUntil = retryBlockedUntil;

    function updateCountdown() {
      const nextSeconds = Math.max(0, Math.ceil((blockedUntil - Date.now()) / 1000));
      setRetryCountdown(nextSeconds);

      if (nextSeconds === 0) {
        setRetryBlockedUntil(null);
      }
    }

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [retryBlockedUntil]);

  useEffect(() => {
    if (!normalizedEmail) return;

    const remainingMs = getMagicLinkCooldownRemainingMs(normalizedEmail);
    if (remainingMs > 0) {
      setRetryBlockedUntil(Date.now() + remainingMs);
    }
  }, [normalizedEmail]);

  async function continueWithEmail() {
    if (sendingEmail || retryBlocked) {
      return;
    }

    const nextEmail = safe(email).toLowerCase();

    if (!nextEmail) {
      setError("Add your email first.");
      return;
    }

    setError("");
    setDiagnosticCode("");
    setSendingEmail(true);

    try {
      clearSignedOutMarker();
      resetMagicLinkClientState();
      await sendMagicLink({
        email: nextEmail,
        nextPath: resolvedNextPath,
        source: "auth-modal",
      });

      setRetryBlockedUntil(Date.now() + MAGIC_LINK_CLIENT_RESEND_DELAY_MS);
      setSentEmail(nextEmail);
    } catch (sendError: unknown) {
      const details = getMagicLinkErrorDetails(sendError);
      const retryAfterMs =
        getMagicLinkRetryAfterMs(sendError) ??
        (details.category === "provider_rate_limit"
          ? MAGIC_LINK_RATE_LIMIT_RETRY_DELAY_MS
          : undefined);
      setError(
        mapMagicLinkError(sendError) ||
          "We couldn't send your sign-in link just now. Please try again.",
      );
      setDiagnosticCode(details.diagnosticCode);
      if (retryAfterMs) {
        setRetryBlockedUntil(Date.now() + retryAfterMs);
      }
    } finally {
      setSendingEmail(false);
    }
  }

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
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: 1.1,
                textTransform: "uppercase",
                color: "#64748b",
                marginBottom: 8,
              }}
            >
              Keep your plan
            </div>
            <div
              style={{
                fontSize: 28,
                lineHeight: 1.1,
                fontWeight: 900,
                color: "#0f172a",
              }}
            >
              Continue with your email
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 14,
                lineHeight: 1.6,
                color: "#475569",
              }}
            >
              We’ll send one secure link so you can return safely to where you left off.
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              alignSelf: "start",
              minHeight: 40,
              minWidth: 40,
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "#ffffff",
              color: "#0f172a",
              fontSize: 16,
              fontWeight: 800,
              cursor: "pointer",
            }}
            aria-label="Close"
          >
            x
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gap: 10,
            padding: 14,
            borderRadius: 16,
            border: "1px solid #e5e7eb",
            background: "#f8fafc",
          }}
        >
          <label
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: "#475569",
            }}
          >
            Email address
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError("");
              if (diagnosticCode) setDiagnosticCode("");
            }}
            placeholder="you@example.com"
            autoComplete="email"
            style={{
              width: "100%",
              minHeight: 48,
              borderRadius: 12,
              border: "1px solid #d1d5db",
              background: "#ffffff",
              padding: "12px 14px",
              fontSize: 14,
              color: "#0f172a",
              outline: "none",
              boxSizing: "border-box",
            }}
          />

          <button
            type="button"
            onClick={() => void continueWithEmail()}
            disabled={sendingEmail || retryBlocked}
            style={{
              width: "100%",
              minHeight: 48,
              borderRadius: 12,
              border: "1px solid #2563eb",
              background: "#2563eb",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 800,
              cursor: sendingEmail || retryBlocked ? "not-allowed" : "pointer",
              opacity: sendingEmail || retryBlocked ? 0.7 : 1,
            }}
          >
            {sendingEmail
              ? "Sending..."
              : retryBlocked
                ? `Wait ${retryCountdown}s before retrying`
              : sentEmail
                ? "Resend link"
                : "Continue"}
          </button>

          {sentEmail ? (
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.55,
                color: "#166534",
                fontWeight: 700,
              }}
            >
              Check your email. We sent a secure link to {sentEmail}.
            </div>
          ) : null}
        </div>

        {error ? (
          <div
            style={{
              borderRadius: 12,
              border: "1px solid #fecaca",
              background: "#fff1f2",
              color: "#9f1239",
              padding: "12px 14px",
              fontSize: 13,
              fontWeight: 700,
              lineHeight: 1.55,
            }}
          >
            {error}
            {diagnosticCode ? (
              <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, lineHeight: 1.55 }}>
                Diagnostic: {diagnosticCode}
              </div>
            ) : null}
            {retryBlocked ? (
              <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, lineHeight: 1.55 }}>
                Retry available in about {retryCountdown}s.
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
