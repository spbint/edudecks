"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type SignOutButtonProps = {
  redirectTo?: string;
  label?: string;
  style?: React.CSSProperties;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export default function SignOutButton({
  redirectTo = "/",
  label = "Sign out",
  style,
}: SignOutButtonProps) {
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    if (busy) return;
    setBusy(true);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out failed", error);
      }
    } catch (error) {
      console.error("Sign out failed", error);
    } finally {
      const target = safe(redirectTo) || "/";
      window.location.assign(target);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleSignOut()}
      disabled={busy}
      style={{
        minHeight: 42,
        borderRadius: 12,
        border: "1px solid #d1d5db",
        background: "#ffffff",
        color: "#0f172a",
        padding: "10px 14px",
        fontSize: 14,
        fontWeight: 800,
        cursor: busy ? "not-allowed" : "pointer",
        opacity: busy ? 0.75 : 1,
        ...style,
      }}
    >
      {busy ? "Signing out..." : label}
    </button>
  );
}
