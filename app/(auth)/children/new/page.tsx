"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";

const ACTIVE_STUDENT_ID_KEY = "edudecks_active_student_id";

/* ================= HELPERS ================= */

function safe(v: any) {
  return String(v ?? "").trim();
}

function splitName(fullName: string) {
  const clean = safe(fullName);
  if (!clean) return { first_name: "", surname: "" };
  const parts = clean.split(/\s+/).filter(Boolean);
  return {
    first_name: parts[0] || "",
    surname: parts.slice(1).join(" "),
  };
}

async function withStepTimeout<T>(promise: Promise<T>, label: string, ms = 12000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`${label} timed out. Please try again.`));
        }, ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function stageErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  const text = String(error ?? "").trim();
  return text || fallback;
}

/* ================= DATABASE ================= */

async function createStudentRecord(userId: string, childName: string, yearLevel: string) {
  const nameBits = splitName(childName);
  const yearNum = Number(safe(yearLevel));
  const usableYear = Number.isFinite(yearNum) ? yearNum : null;

  const payload = {
    user_id: userId,
    first_name: nameBits.first_name || safe(childName),
    preferred_name: nameBits.first_name || safe(childName),
    surname: nameBits.surname || null,
    year_level: usableYear,
  };

  const r = await supabase.from("students").insert(payload).select("id").single();
  if (r.error) throw r.error;
  return r.data.id as string;
}

async function linkStudent(userId: string, studentId: string) {
  const r = await supabase.from("parent_student_links").upsert(
    {
      parent_user_id: userId,
      student_id: studentId,
      relationship_label: "child",
      sort_order: 0,
    },
    { onConflict: "parent_user_id,student_id" }
  );

  if (r.error) throw r.error;
}

/* ================= PAGE ================= */

export default function AddChildPage() {
  const router = useRouter();

  const [childName, setChildName] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [saveStep, setSaveStep] = useState("");
  const [saveTrace, setSaveTrace] = useState<string[]>([]);

  async function reportStep(message: string) {
    console.log(`[AddChildPage] ${message}`);
    setSaveStep(message);
    setSaveTrace((prev) => [...prev, message]);
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  async function saveChild() {
    if (!safe(childName)) {
      setErr("Please enter a name.");
      return;
    }

    setSaving(true);
    setErr("");
    setSaveStep("");
    setSaveTrace([]);

    try {
      await reportStep("submit started");

      const authResp = await withStepTimeout(supabase.auth.getUser(), "Fetching signed-in user");
      const user = authResp.data.user;
      if (!user) throw new Error("You must be signed in.");
      await reportStep("auth user fetched");

      await reportStep("student insert started");
      const id = await withStepTimeout(
        createStudentRecord(user.id, childName, yearLevel),
        "Creating child record"
      );
      await reportStep(`student insert finished (${id})`);

      await reportStep("parent_student_links insert started");
      await withStepTimeout(
        linkStudent(user.id, id),
        "Linking child to your family"
      );
      await reportStep("parent_student_links insert finished");

      await reportStep("navigation started");
      localStorage.setItem(ACTIVE_STUDENT_ID_KEY, id);
      router.replace("/family");
      setTimeout(() => {
        if (typeof window !== "undefined" && window.location.pathname === "/children/new") {
          console.log("[AddChildPage] navigation fallback started");
          setSaveTrace((prev) => [...prev, "navigation fallback started"]);
          setSaveStep("navigation fallback started");
          window.location.assign("/family");
        }
      }, 800);
    } catch (e: any) {
      const message = stageErrorMessage(e, "Add child failed.");
      console.error("[AddChildPage] submit failed", e);
      setErr(message);
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

        {err && (
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
        )}

        {saving && saveStep ? (
          <div
            style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              padding: 10,
              borderRadius: 12,
              color: "#1d4ed8",
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            {saveStep}
          </div>
        ) : null}

        {(saving || saveTrace.length) && (
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              padding: 12,
              borderRadius: 12,
              color: "#334155",
              fontSize: 13,
              lineHeight: 1.5,
              marginBottom: 12,
              whiteSpace: "pre-wrap",
            }}
          >
            {saveTrace.length ? saveTrace.join("\n") : "Waiting to start..."}
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => router.push("/children")}
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
            onClick={saveChild}
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
            {saving ? "Saving…" : "Add child"}
          </button>
        </div>
      </section>
    </FamilyTopNavShell>
  );
}
