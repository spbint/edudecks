"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { buildAuthCallbackUrl } from "@/lib/authRedirect";

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
  const [sendingGoogle, setSendingGoogle] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const [error, setError] = useState("");

  const resolvedCallbackUrl = useMemo(
    () => buildAuthCallbackUrl(returnPath || (typeof window !== "undefined" ? window.location.pathname + window.location.search : "/")),
    [returnPath]
  );

  async function continueWithGoogle() {
    setError("");
    setSendingGoogle(true);

    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: resolvedCallbackUrl,
        },
      });

      if (authError) {
        throw authError;
      }
    } catch {
      setError("Something went wrong - try again.");
      setSendingGoogle(false);
    }
  }

  async function continueWithEmail() {
    const nextEmail = safe(email).toLowerCase();

    if (!nextEmail) {
      setError("Add your email first.");
      return;
    }

    setError("");
    setSendingEmail(true);

    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: nextEmail,
        options: {
          emailRedirectTo: resolvedCallbackUrl,
        },
      });

      if (authError) {
        throw authError;
      }

      setSentEmail(nextEmail);
    } catch {
      setError("Something went wrong - try again.");
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
              Save your progress
            </div>
            <div
              style={{
                marginTop: 8,
              fontSize: 14,
              lineHeight: 1.6,
              color: "#475569",
            }}
          >
              Create a free account to keep your learning plan and return safely to where you left off.
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

        <button
          type="button"
          onClick={() => void continueWithGoogle()}
          disabled={sendingGoogle || sendingEmail}
          style={{
            width: "100%",
            minHeight: 52,
            borderRadius: 14,
            border: "1px solid #2563eb",
            background: "#2563eb",
            color: "#ffffff",
            fontSize: 15,
            fontWeight: 900,
            cursor: sendingGoogle || sendingEmail ? "not-allowed" : "pointer",
            opacity: sendingGoogle || sendingEmail ? 0.7 : 1,
          }}
        >
          {sendingGoogle ? "Continuing..." : "Continue with Google"}
        </button>

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
            Email me a code
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            disabled={sendingGoogle || sendingEmail}
            style={{
              width: "100%",
              minHeight: 48,
              borderRadius: 12,
              border: "1px solid #d1d5db",
              background: "#ffffff",
              color: "#0f172a",
              fontSize: 14,
              fontWeight: 800,
              cursor: sendingGoogle || sendingEmail ? "not-allowed" : "pointer",
              opacity: sendingGoogle || sendingEmail ? 0.7 : 1,
            }}
          >
            {sendingEmail ? "Sending..." : "Email me a code"}
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
              Check your email for a secure sign-in link.
              {` `}
              We sent it to {sentEmail}.
              {` `}
              It will bring you back to EduDecks to continue saving your progress.
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
          </div>
        ) : null}
      </div>
    </div>
  );
}
