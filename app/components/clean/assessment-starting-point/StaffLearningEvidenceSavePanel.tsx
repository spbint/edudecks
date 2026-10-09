"use client";

import Link from "next/link";
import { useState } from "react";
import type { NumberOperationsBaselinePersistenceDraft } from "@/lib/clean/assessments/placement/numberOperationsPersistenceDraft";
import type { StaffLearningEvidenceSavedAttempt } from "@/lib/clean/educationalIntelligence/persistence/staffLearningEvidenceSmoke";

type SaveResponse = {
  ok: boolean;
  error?: string;
  target?: { branchName: string; projectRef: string };
  saved?: StaffLearningEvidenceSavedAttempt;
};

const panel = {
  border: "2px solid #166534",
  borderRadius: 20,
  background: "#F0FDF4",
  padding: "clamp(18px, 4vw, 26px)",
  display: "grid",
  gap: 12,
} as const;

export default function StaffLearningEvidenceSavePanel({
  familyId,
  learnerId,
  attemptId,
  attemptKind,
  draft,
}: {
  familyId: string;
  learnerId: string;
  attemptId: string;
  attemptKind: "initial" | "recheck";
  draft: NumberOperationsBaselinePersistenceDraft;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SaveResponse | null>(null);

  async function save() {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(
        "/api/internal/assessment-lab/learning-evidence",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            operation: "save-starting-point",
            familyId,
            learnerId,
            attemptId,
            attemptKind,
            draft,
          }),
        },
      );
      const body = (await response.json().catch(() => null)) as SaveResponse | null;
      if (!response.ok || !body?.ok || !body.saved) {
        throw new Error(body?.error || "The staff test result could not be saved.");
      }
      setResult(body);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The staff test result could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  const historyHref = `/assessments/maths-starting-point/results-preview?${new URLSearchParams({
    familyId,
    learnerId,
    source: "intelligence-staging",
  }).toString()}`;
  const recheckHref = `/assessments/maths-starting-point?${new URLSearchParams({
    learnerId,
    attemptKind: "recheck",
  }).toString()}`;

  return (
    <section style={panel} aria-labelledby="staff-ei-save-title">
      <span
        style={{
          color: "#166534",
          fontSize: 12,
          fontWeight: 900,
          letterSpacing: ".045em",
          textTransform: "uppercase",
        }}
      >
        Staff-only · non-production persistence
      </span>
      <h2 id="staff-ei-save-title" style={{ margin: 0, color: "#17204B" }}>
        Save this validated {attemptKind === "recheck" ? "recheck" : "original"} result
      </h2>
      <p style={{ margin: 0, color: "#365347", lineHeight: 1.6 }}>
        The server will rescore and replay the assessment evidence before saving five
        canonical continuum records atomically to intelligence-staging. Customer
        persistence, Portfolio inclusion and Pathways mutation remain off.
      </p>
      <button
        type="button"
        onClick={() => void save()}
        disabled={saving}
        style={{
          width: "fit-content",
          minHeight: 44,
          border: 0,
          borderRadius: 12,
          background: saving ? "#94A3B8" : "#166534",
          color: "#FFFFFF",
          padding: "9px 14px",
          font: "inherit",
          fontWeight: 850,
          cursor: saving ? "wait" : "pointer",
        }}
      >
        {saving
          ? "Validating and saving…"
          : result?.saved
            ? "Retry the same canonical save"
            : "Save staff test result"}
      </button>
      {error ? (
        <p role="alert" style={{ margin: 0, color: "#991B1B", fontWeight: 750 }}>
          {error}
        </p>
      ) : null}
      {result?.saved && result.target ? (
        <div role="status" style={{ display: "grid", gap: 8, color: "#244438" }}>
          <strong>
            {result.saved.reused
              ? "Idempotent retry confirmed — no duplicate was created."
              : `Saved one attempt with ${result.saved.resultCount} canonical results.`}
          </strong>
          <span>
            Target: {result.target.branchName} ({result.target.projectRef}) · Review: {result.saved.reviewDefaults.reviewState} · Confirmation: {result.saved.reviewDefaults.confirmationState} · Portfolio: {result.saved.reviewDefaults.portfolioInclusion}
          </span>
          <span>{result.saved.provenanceSummary}</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <Link href={historyHref} style={{ color: "#14532D", fontWeight: 850 }}>
              Leave and reopen My Results
            </Link>
            {attemptKind === "initial" ? (
              <Link href={recheckHref} style={{ color: "#14532D", fontWeight: 850 }}>
                Run a genuine recheck
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
