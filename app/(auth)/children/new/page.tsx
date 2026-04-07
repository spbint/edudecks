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

/* ================= DATABASE ================= */

async function createStudentRecord(childName: string, yearLevel: string) {
  const nameBits = splitName(childName);
  const yearNum = Number(safe(yearLevel));
  const usableYear = Number.isFinite(yearNum) ? yearNum : null;

  const payload = {
    first_name: nameBits.first_name || safe(childName),
    preferred_name: nameBits.first_name || safe(childName),
    surname: nameBits.surname || null,
    year_level: usableYear,
  };

  const r = await supabase.from("students").insert(payload).select("id").single();
  if (r.error) throw r.error;
  return r.data.id as string;
}

async function linkStudent(studentId: string) {
  const authResp = await supabase.auth.getUser();
  const userId = authResp.data.user?.id;
  if (!userId) throw new Error("You must be signed in.");

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

  async function saveChild() {
    if (!safe(childName)) {
      setErr("Please enter a name.");
      return;
    }

    setSaving(true);
    setErr("");

    try {
      const id = await createStudentRecord(childName, yearLevel);
      await linkStudent(id);
      localStorage.setItem(ACTIVE_STUDENT_ID_KEY, id);

      router.push("/family");
    } catch (e: any) {
      setErr(String(e?.message ?? e));
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