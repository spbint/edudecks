"use client";

import { useMemo, useState } from "react";
import { getCaptureLearningEvidenceFixtures } from "@/lib/clean/educationalIntelligence/capture/captureLearningEvidenceFixtures";
import {
  CAPTURED_EVIDENCE_REVIEW_STATES,
  linkCapturedEvidenceToConstruct,
  type CapturedEvidenceReviewState,
  type CapturedLearningEvidenceV1,
} from "@/lib/clean/educationalIntelligence/capture/capturedLearningEvidence";
import { projectLearningEvidenceTimeline } from "@/lib/clean/educationalIntelligence/capture/learningEvidenceTimeline";
import type { StaffCaptureEvidenceHistory } from "@/lib/clean/educationalIntelligence/capture/staffCaptureLearningEvidence";

const panel = {
  border: "1px solid #DDE4EE",
  borderRadius: 20,
  background: "#FFFFFF",
  padding: "clamp(18px, 4vw, 28px)",
  minWidth: 0,
} as const;

function formatSource(value: string) {
  return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function PersistedTimeline({ history }: { history: StaffCaptureEvidenceHistory }) {
  const constructIds = [...new Set(history.timeline.map((event) => event.constructId))];
  return (
    <section
      aria-labelledby="persisted-capture-history-heading"
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr)",
        gap: 14,
        minWidth: 0,
      }}
    >
      <header style={{ ...panel, display: "grid", gap: 8 }}>
        <span style={{ color: "#166534", fontSize: 12, fontWeight: 900, letterSpacing: ".045em", textTransform: "uppercase" }}>
          Genuine intelligence-staging reload
        </span>
        <h3 id="persisted-capture-history-heading" style={{ margin: 0, color: "#17204B" }}>
          Multi-source history for {history.learner.displayName}
        </h3>
        <p style={{ margin: 0, color: "#4B5563", lineHeight: 1.55 }}>
          {history.evidence.length} persisted Capture records and {history.timeline.length} timeline events were reloaded server-side from {history.target.branchName}. Capture events remain evidence-only and carry no developmental judgement.
        </p>
      </header>
      {constructIds.map((constructId) => {
        const events = history.timeline.filter((event) => event.constructId === constructId);
        return (
          <article key={constructId} style={{ ...panel, display: "grid", gap: 10 }}>
            <h4 style={{ margin: 0, color: "#17204B" }}>{events[0]?.continuumId?.replaceAll("-", " ") ?? "Learning construct"}</h4>
            {events.map((event) => (
              <div key={event.id} style={{ borderLeft: event.sourceLane === "structured-assessment" ? "4px solid #5B3BE8" : "4px solid #0F766E", paddingLeft: 12, display: "grid", gap: 3 }}>
                <strong>{event.sourceLabel}</strong>
                <span style={{ color: "#64748B", fontSize: 14 }}>{event.occurredAt.slice(0, 10)} · {event.sourceLane === "structured-assessment" ? "Structured evidence" : "Authentic evidence"}</span>
                <span style={{ color: "#334155", fontSize: 14 }}>
                  {event.assessmentInterpretation
                    ? `Canonical interpretation: ${formatSource(event.assessmentInterpretation.developmentalStatus)}`
                    : `Evidence relevance: ${formatSource(event.provenance.reviewState ?? "unreviewed")} · No developmental judgement`}
                </span>
              </div>
            ))}
          </article>
        );
      })}
    </section>
  );
}

export default function CaptureLearningEvidencePreview({
  persistedHistory = null,
}: {
  persistedHistory?: StaffCaptureEvidenceHistory | null;
}) {
  const fixture = useMemo(() => getCaptureLearningEvidenceFixtures(), []);
  const [capturedEvidence, setCapturedEvidence] = useState<CapturedLearningEvidenceV1[]>(
    () => fixture.capturedEvidence,
  );
  const [selectedEvidenceId, setSelectedEvidenceId] = useState(
    "fixture-capture-unlinked-note",
  );
  const [selectedConstructIds, setSelectedConstructIds] = useState<string[]>([]);
  const [reviewState, setReviewState] = useState<CapturedEvidenceReviewState>("unreviewed");
  const [message, setMessage] = useState("");
  const timeline = useMemo(
    () =>
      projectLearningEvidenceTimeline({
        learnerId: fixture.learnerId,
        assessmentResults: fixture.assessmentResults,
        capturedEvidence,
      }),
    [capturedEvidence, fixture.assessmentResults, fixture.learnerId],
  );
  const continua = fixture.constructChoices.map((choice) => ({
    id: choice.continuumId ?? choice.constructId,
    label: choice.constructName.replace(/\s+(?:P\d+.*|unresolved)$/i, ""),
    construct: choice,
  }));

  function toggleConstruct(constructId: string) {
    setSelectedConstructIds((current) =>
      current.includes(constructId)
        ? current.filter((candidate) => candidate !== constructId)
        : [...current, constructId],
    );
  }

  function saveFixtureLinks() {
    const evidence = capturedEvidence.find(
      (candidate) => candidate.evidenceId === selectedEvidenceId,
    );
    if (!evidence || !selectedConstructIds.length) {
      setMessage("Choose captured evidence and at least one canonical construct.");
      return;
    }
    let linked = evidence;
    for (const constructId of selectedConstructIds) {
      const construct = fixture.constructChoices.find(
        (candidate) => candidate.constructId === constructId,
      );
      if (!construct) continue;
      linked = linkCapturedEvidenceToConstruct({
        evidence: linked,
        construct,
        actorId: fixture.actorId,
        assignedAt: "2026-11-04T03:00:00.000Z",
        familyId: fixture.familyId,
        learnerId: fixture.learnerId,
        reviewState,
      });
    }
    setCapturedEvidence((current) =>
      current.map((candidate) =>
        candidate.evidenceId === linked.evidenceId ? linked : candidate,
      ),
    );
    setMessage(
      `Fixture link saved for ${selectedConstructIds.length} ${selectedConstructIds.length === 1 ? "construct" : "constructs"}. No assessment judgement was created.`,
    );
  }

  return (
    <section
      aria-labelledby="capture-evidence-heading"
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr)",
        gap: 18,
        minWidth: 0,
      }}
    >
      {persistedHistory ? <PersistedTimeline history={persistedHistory} /> : null}
      <header style={{ ...panel, display: "grid", gap: 9 }}>
        <span style={{ color: "#7C3AED", fontSize: 12, fontWeight: 900, letterSpacing: ".045em", textTransform: "uppercase" }}>
          Protected staff lab · fixture-only linking
        </span>
        <h2 id="capture-evidence-heading" style={{ margin: 0, color: "#17204B" }}>
          Capture → Learning Evidence Bridge
        </h2>
        <p style={{ margin: 0, color: "#4B5563", lineHeight: 1.6 }}>
          Link authentic evidence to a canonical construct for review. A link means
          evidence is available; it does not create a developmental status,
          recommendation, Portfolio decision or Pathways change.
        </p>
      </header>

      <section
        aria-labelledby="manual-link-heading"
        style={{
          ...panel,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr)",
          gap: 16,
        }}
      >
        <h3 id="manual-link-heading" style={{ margin: 0, color: "#17204B" }}>
          Manual construct association
        </h3>
        <label style={{ display: "grid", gap: 6, minWidth: 0, maxWidth: 520 }}>
          <strong>Learner</strong>
          <select aria-label="Learner" value={fixture.learnerId} disabled style={{ width: "100%", minWidth: 0, minHeight: 44, border: "1px solid #CBD5E1", borderRadius: 10, padding: "8px 10px", background: "#F8FAFC" }}>
            <option value={fixture.learnerId}>{fixture.learnerLabel} (synthetic)</option>
          </select>
        </label>
        <label style={{ display: "grid", gap: 6, minWidth: 0, maxWidth: 520 }}>
          <strong>Captured evidence</strong>
          <select value={selectedEvidenceId} onChange={(event) => setSelectedEvidenceId(event.target.value)} style={{ width: "100%", minWidth: 0, minHeight: 44, border: "1px solid #CBD5E1", borderRadius: 10, padding: "8px 10px", background: "#FFFFFF" }}>
            {capturedEvidence.map((evidence) => (
              <option key={evidence.evidenceId} value={evidence.evidenceId}>
                {fixture.labelsByEvidenceId[evidence.evidenceId]} · {formatSource(evidence.sourceType)}
              </option>
            ))}
          </select>
        </label>
        <fieldset style={{ minWidth: 0, border: 0, padding: 0, margin: 0, display: "grid", gap: 8 }}>
          <legend style={{ fontWeight: 850, marginBottom: 8 }}>Canonical Number &amp; Operations constructs</legend>
          {continua.map((continuum) => (
            <label key={continuum.construct.constructId} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <input type="checkbox" checked={selectedConstructIds.includes(continuum.construct.constructId)} onChange={() => toggleConstruct(continuum.construct.constructId)} style={{ width: 18, height: 18, marginTop: 2 }} />
              <span><strong>{continuum.label}</strong><br /><small style={{ color: "#64748B" }}>Canonical construct and mapping reference retained</small></span>
            </label>
          ))}
        </fieldset>
        <label style={{ display: "grid", gap: 6, minWidth: 0, maxWidth: 360 }}>
          <strong>Evidence relevance review</strong>
          <select value={reviewState} onChange={(event) => setReviewState(event.target.value as CapturedEvidenceReviewState)} style={{ width: "100%", minWidth: 0, minHeight: 44, border: "1px solid #CBD5E1", borderRadius: 10, padding: "8px 10px", background: "#FFFFFF" }}>
            {CAPTURED_EVIDENCE_REVIEW_STATES.map((state) => (
              <option key={state} value={state}>{formatSource(state)}</option>
            ))}
          </select>
        </label>
        <button type="button" onClick={saveFixtureLinks} style={{ width: "fit-content", minHeight: 44, border: 0, borderRadius: 10, background: "#5B3BE8", color: "#FFFFFF", padding: "9px 16px", fontWeight: 850, cursor: "pointer" }}>
          Save fixture association
        </button>
        <p role="status" aria-live="polite" style={{ margin: 0, color: message.startsWith("Choose") ? "#991B1B" : "#166534", fontWeight: 750 }}>
          {message}
        </p>
      </section>

      <section
        aria-labelledby="multi-source-heading"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr)",
          gap: 14,
          minWidth: 0,
        }}
      >
        <div style={panel}>
          <h3 id="multi-source-heading" style={{ margin: 0, color: "#17204B" }}>
            Learning history · structured and authentic evidence
          </h3>
          <p style={{ margin: "8px 0 0", color: "#4B5563", lineHeight: 1.55 }}>
            Sources are shown separately. Assessment interpretation remains
            authoritative for assessment-to-assessment comparison.
          </p>
        </div>
        {continua.map((continuum) => {
          const events = timeline.filter((event) => event.continuumId === continuum.id);
          return (
            <article key={continuum.id} style={{ ...panel, display: "grid", gap: 12 }}>
              <h4 style={{ margin: 0, color: "#17204B", fontSize: 18 }}>{continuum.label}</h4>
              {events.length ? events.map((event) => (
                <div key={event.id} style={{ borderLeft: event.sourceLane === "structured-assessment" ? "4px solid #5B3BE8" : "4px solid #0F766E", paddingLeft: 12, display: "grid", gap: 3 }}>
                  <strong>{event.sourceLabel}</strong>
                  <span style={{ color: "#64748B", fontSize: 14 }}>{event.occurredAt.slice(0, 10)} · {event.sourceLane === "structured-assessment" ? "Structured evidence" : "Authentic evidence"}</span>
                  <span style={{ color: "#334155", fontSize: 14 }}>
                    {event.assessmentInterpretation
                      ? `Canonical interpretation: ${formatSource(event.assessmentInterpretation.developmentalStatus)}`
                      : `Evidence relevance: ${formatSource(event.provenance.reviewState ?? "unreviewed")} · No developmental judgement`}
                  </span>
                </div>
              )) : <p style={{ margin: 0, color: "#64748B" }}>No linked evidence in this fixture.</p>}
            </article>
          );
        })}
      </section>
    </section>
  );
}
