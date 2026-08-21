"use client";

import { useState } from "react";
import { completeFamilySignOut } from "@/lib/familySignOut";

export default function FounderSignOutButton() {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await completeFamilySignOut();
        } finally {
          window.location.assign("/founder/login");
        }
      }}
      style={{ border: "1px solid rgba(255,255,255,0.35)", borderRadius: 999, padding: "0.45rem 0.8rem", background: "transparent", color: "inherit", font: "inherit", cursor: busy ? "wait" : "pointer" }}
    >
      {busy ? "Signing out..." : "Sign out"}
    </button>
  );
}
