"use client";

import React, { useState } from "react";

type SignOutButtonProps = {
  redirectTo?: string;
  label?: string;
  style?: React.CSSProperties;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export default function SignOutButton({
  redirectTo = "/sign-out",
  label = "Sign out",
  style,
}: SignOutButtonProps) {
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    if (busy) return;
    setBusy(true);

    const target = safe(redirectTo) || "/sign-out";
    window.location.assign(target);
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
