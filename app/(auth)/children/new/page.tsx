"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import {
  DEFAULT_FAMILY_SETTINGS,
  persistSettingsToLocalStorage,
} from "@/lib/familySettings";
import {
  createLinkedLearner,
  loadLearnersFromLocalCache,
  persistLearnersToLocalCache,
  setActiveLearnerId,
} from "@/lib/familyWorkspace";
import { hasSupabaseEnv, supabase } from "@/lib/supabaseClient";

function safe(v: unknown) {
  return String(v ?? "").trim();
}

async function getSessionUserId() {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    const response = await Promise.race([
      supabase.auth.getSession(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error("Something went wrong while saving. Please try again."));
        }, 8000);
      }),
    ]);

    return response.data.session?.user?.id ?? null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export default function AddChildPage() {
  const router = useRouter();
  const [childName, setChildName] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function saveChild() {
    if (!safe(childName)) {
      setErr("Please enter a name.");
      return;
    }

    setSaving(true);
    setErr("");

    try {
      const userId = await getSessionUserId();

      if (userId && hasSupabaseEnv) {
        const learner = await createLinkedLearner(userId, childName, yearLevel);
        setActiveLearnerId(learner.id);
        router.replace("/family");
        router.refresh();
        return;
      }

      const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const existingLearners = loadLearnersFromLocalCache();
      persistLearnersToLocalCache([
        ...existingLearners,
        {
          id: localId,
          label: safe(childName),
          yearLabel: safe(yearLevel) ? `Year ${safe(yearLevel)}` : "",
          year_level: safe(yearLevel) ? Number(safe(yearLevel)) || null : null,
          connectedAt: new Date().toISOString(),
        },
      ]);

      const nextSettings = {
        ...DEFAULT_FAMILY_SETTINGS,
        default_child_id: localId,
      };
      persistSettingsToLocalStorage(nextSettings);
      setActiveLearnerId(localId);
      router.replace("/family");
      router.refresh();
    } catch (e: unknown) {
      const message = String((e as { message?: unknown })?.message ?? e ?? "").trim();
      setErr(message || "Something went wrong while saving. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FamilyTopNavShell
      title="EduDecks Family"
      subtitle="Add Child"
      heroTitle="Add a learner to your household"
      heroText="Start with just a name. You can refine details later."
      heroAsideTitle="Tip"
      heroAsideText="Most families begin with one child and expand over time."
    >
      <section
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 20,
          padding: 24,
          background: "#ffffff",
          maxWidth: 640,
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: 800 }}>Child name</label>
          <input
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            placeholder="e.g. Charlotte Brown"
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid #dbe1ea",
              marginTop: 6,
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: 800 }}>Year level (optional)</label>
          <input
            value={yearLevel}
            onChange={(e) => setYearLevel(e.target.value)}
            placeholder="e.g. 4"
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid #dbe1ea",
              marginTop: 6,
            }}
          />
        </div>

        {err ? (
          <div
            style={{
              background: "#fff1f2",
              border: "1px solid #fecaca",
              padding: 10,
              borderRadius: 12,
              color: "#9f1239",
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            {err}
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => {
              window.location.href = "/children";
            }}
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "#ffffff",
              fontWeight: 800,
              cursor: "pointer",
            }}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            onClick={() => void saveChild()}
            disabled={saving}
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: "1px solid #2563eb",
              background: "#2563eb",
              color: "#fff",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {saving ? "Saving..." : "Add child"}
          </button>
        </div>
      </section>
    </FamilyTopNavShell>
  );
}
