"use client";

import React, { useMemo, useState } from "react";
import CleanFamilyWorkspaceProvider, {
  useCleanFamilyWorkspace,
} from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import {
  CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE,
  createCleanFamilyProfile,
  normalizeCleanErrorMessage,
} from "@/lib/clean/family/client";
import {
  createCleanLearner,
  setDefaultCleanLearner,
} from "@/lib/clean/learners/client";

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "32px 20px 48px",
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 960,
  margin: "0 auto",
  display: "grid",
  gap: 20,
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  background: "#ffffff",
  padding: 20,
  boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
};

const buttonStyle: React.CSSProperties = {
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

function CleanProfileWorkspaceBody() {
  const workspace = useCleanFamilyWorkspace();
  const [familyName, setFamilyName] = useState("");
  const [learnerFirstName, setLearnerFirstName] = useState("");
  const [learnerPreferredName, setLearnerPreferredName] = useState("");
  const [learnerYearLevel, setLearnerYearLevel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const defaultLearnerLabel = useMemo(() => {
    if (!workspace.profile?.defaultLearnerId) return null;

    return (
      workspace.learners.find((learner) => learner.id === workspace.profile?.defaultLearnerId)
        ?.preferredName ||
      workspace.learners.find((learner) => learner.id === workspace.profile?.defaultLearnerId)
        ?.firstName ||
      null
    );
  }, [workspace.learners, workspace.profile?.defaultLearnerId]);

  async function handleCreateFamilyProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      await createCleanFamilyProfile({
        displayName: familyName,
      });
      setFamilyName("");
      setMessage("Clean family profile created.");
      await workspace.reload();
    } catch (nextError) {
      setError(
        normalizeCleanErrorMessage(
          nextError,
          "We could not create the clean family profile.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddLearner(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!workspace.profile) return;

    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      await createCleanLearner(workspace.profile.id, {
        firstName: learnerFirstName,
        preferredName: learnerPreferredName || null,
        yearLevel: learnerYearLevel || null,
      });
      setLearnerFirstName("");
      setLearnerPreferredName("");
      setLearnerYearLevel("");
      setMessage("Learner added to the clean family workspace.");
      await workspace.reload();
    } catch (nextError) {
      setError(
        normalizeCleanErrorMessage(
          nextError,
          "We could not add the learner to the clean family workspace.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSetDefaultLearner(learnerId: string) {
    if (!workspace.profile) return;

    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      await setDefaultCleanLearner(workspace.profile.id, learnerId);
      setMessage("Default learner updated.");
      await workspace.reload();
    } catch (nextError) {
      setError(
        normalizeCleanErrorMessage(
          nextError,
          "We could not update the default learner.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={shellStyle}>
      <div style={wrapStyle}>
        <section style={cardStyle}>
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: "#64748b", textTransform: "uppercase" }}>
              Clean rebuild scaffold
            </div>
            <h1 style={{ margin: 0, fontSize: 28, color: "#0f172a" }}>My Profile</h1>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              This isolated route uses only the clean family schema draft and never writes on page load.
            </p>
          </div>
        </section>

        {workspace.loading ? (
          <section style={cardStyle}>Loading clean family workspace…</section>
        ) : null}

        {!workspace.loading && workspace.schemaMissing ? (
          <section style={cardStyle}>
            <strong style={{ display: "block", marginBottom: 8 }}>{CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE}</strong>
            <p style={{ margin: 0, color: "#475569" }}>
              The clean rebuild service only talks to the new family-only schema. It will not fall back to legacy tables.
            </p>
          </section>
        ) : null}

        {!workspace.loading && !workspace.schemaMissing && workspace.error ? (
          <section style={cardStyle}>
            <strong style={{ display: "block", marginBottom: 8 }}>Workspace error</strong>
            <p style={{ margin: 0, color: "#475569" }}>{workspace.error}</p>
          </section>
        ) : null}

        {!workspace.loading && !workspace.schemaMissing && workspace.requiresFamilyCreation ? (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, color: "#0f172a" }}>Create family profile</h2>
            <p style={{ color: "#475569", lineHeight: 1.6 }}>
              No clean family profile exists yet. Creation is explicit and happens only when you submit this form.
            </p>
            <form onSubmit={handleCreateFamilyProfile} style={{ display: "grid", gap: 12 }}>
              <input
                value={familyName}
                onChange={(event) => setFamilyName(event.target.value)}
                placeholder="Family display name"
                style={inputStyle}
              />
              <div>
                <button type="submit" style={buttonStyle} disabled={submitting}>
                  {submitting ? "Creating…" : "Create family profile"}
                </button>
              </div>
            </form>
          </section>
        ) : null}

        {!workspace.loading && !workspace.schemaMissing && workspace.profile ? (
          <>
            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, color: "#0f172a" }}>Family profile</h2>
              <div style={{ display: "grid", gap: 8, color: "#334155" }}>
                <div>
                  <strong>Name:</strong> {workspace.profile.displayName}
                </div>
                <div>
                  <strong>Family ID:</strong> {workspace.profile.id}
                </div>
                <div>
                  <strong>Reporting mode:</strong> {workspace.profile.reportingMode}
                </div>
                <div>
                  <strong>Week start:</strong> {workspace.profile.weekStart}
                </div>
                <div>
                  <strong>Default learner:</strong> {defaultLearnerLabel || "Not set"}
                </div>
                <div>
                  <strong>Members loaded:</strong> {workspace.members.length}
                </div>
              </div>
            </section>

            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, color: "#0f172a" }}>Learners</h2>
              {workspace.learners.length ? (
                <div style={{ display: "grid", gap: 12 }}>
                  {workspace.learners.map((learner) => {
                    const label = learner.preferredName || learner.firstName;
                    const isDefault = workspace.profile?.defaultLearnerId === learner.id;

                    return (
                      <div
                        key={learner.id}
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: 14,
                          padding: 14,
                          display: "grid",
                          gap: 8,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                          <div>
                            <strong>{label}</strong>
                            {learner.yearLevel ? (
                              <span style={{ color: "#64748b" }}> · {learner.yearLevel}</span>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            style={{
                              ...buttonStyle,
                              background: isDefault ? "#1d4ed8" : "#0f172a",
                              borderColor: isDefault ? "#1d4ed8" : "#0f172a",
                            }}
                            disabled={submitting || isDefault}
                            onClick={() => void handleSetDefaultLearner(learner.id)}
                          >
                            {isDefault ? "Default learner" : "Set default"}
                          </button>
                        </div>
                        <div style={{ color: "#64748b", fontSize: 13 }}>{learner.id}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ margin: 0, color: "#475569" }}>
                  No learners exist yet in the clean workspace. This is an honest empty state, not a fallback.
                </p>
              )}
            </section>

            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, color: "#0f172a" }}>Add learner</h2>
              <form onSubmit={handleAddLearner} style={{ display: "grid", gap: 12 }}>
                <input
                  value={learnerFirstName}
                  onChange={(event) => setLearnerFirstName(event.target.value)}
                  placeholder="First name"
                  style={inputStyle}
                />
                <input
                  value={learnerPreferredName}
                  onChange={(event) => setLearnerPreferredName(event.target.value)}
                  placeholder="Preferred name (optional)"
                  style={inputStyle}
                />
                <input
                  value={learnerYearLevel}
                  onChange={(event) => setLearnerYearLevel(event.target.value)}
                  placeholder="Year level (optional)"
                  style={inputStyle}
                />
                <div>
                  <button type="submit" style={buttonStyle} disabled={submitting}>
                    {submitting ? "Saving…" : "Add learner"}
                  </button>
                </div>
              </form>
            </section>
          </>
        ) : null}

        {message ? (
          <section style={cardStyle}>
            <p style={{ margin: 0, color: "#0f766e" }}>{message}</p>
          </section>
        ) : null}

        {error ? (
          <section style={cardStyle}>
            <p style={{ margin: 0, color: "#b91c1c" }}>{error}</p>
          </section>
        ) : null}
      </div>
    </div>
  );
}

export default function CleanProfileWorkspace() {
  return (
    <CleanFamilyWorkspaceProvider>
      <CleanProfileWorkspaceBody />
    </CleanFamilyWorkspaceProvider>
  );
}
