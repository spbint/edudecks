"use client";

import React, { useMemo, useState } from "react";
import CleanAppHeader from "@/app/components/clean/CleanAppHeader";
import CleanFamilyWorkspaceProvider, {
  useCleanFamilyWorkspace,
} from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import CleanPageIntroVideo from "@/app/components/clean/CleanPageIntroVideo";
import CleanPageGuidance from "@/app/components/clean/CleanPageGuidance";
import {
  CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE,
  createCleanFamilyProfile,
  normalizeCleanErrorMessage,
} from "@/lib/clean/family/client";
import {
  createCleanLearner,
  deleteCleanLearner,
  setDefaultCleanLearner,
  updateCleanLearner,
} from "@/lib/clean/learners/client";
import type { Learner } from "@/lib/clean/learners/types";
import { PAGE_INTRO_VIDEOS } from "@/lib/clean/pageIntroVideos";

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "clamp(18px, 4vw, 32px) clamp(12px, 4vw, 20px) 48px",
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

const secondaryButtonStyle: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

const dangerButtonStyle: React.CSSProperties = {
  ...secondaryButtonStyle,
  borderColor: "#fecaca",
  color: "#b91c1c",
};

const subtleButtonStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#475569",
  padding: 0,
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

type LearnerDraft = {
  firstName: string;
  preferredName: string;
  surname: string;
  yearLevel: string;
  notes: string;
};

function buildLearnerDraft(learner: Learner): LearnerDraft {
  return {
    firstName: learner.firstName,
    preferredName: learner.preferredName ?? "",
    surname: learner.surname ?? "",
    yearLevel: learner.yearLevel ?? "",
    notes: learner.notes ?? "",
  };
}

function formatLearnerDisplayName(learner: Learner) {
  const givenName = learner.preferredName || learner.firstName;
  const surname = learner.surname?.trim();
  return surname ? `${givenName} ${surname}` : givenName;
}

function CleanProfileWorkspaceBody() {
  const workspace = useCleanFamilyWorkspace();
  const [familyName, setFamilyName] = useState("");
  const [learnerFirstName, setLearnerFirstName] = useState("");
  const [learnerPreferredName, setLearnerPreferredName] = useState("");
  const [learnerYearLevel, setLearnerYearLevel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingLearnerId, setEditingLearnerId] = useState<string | null>(null);
  const [editingLearnerDraft, setEditingLearnerDraft] = useState<LearnerDraft | null>(null);
  const [learnerActionId, setLearnerActionId] = useState<string | null>(null);

  const defaultLearnerLabel = useMemo(() => {
    if (!workspace.profile?.defaultLearnerId) return null;
    const learner = workspace.learners.find(
      (item) => item.id === workspace.profile?.defaultLearnerId,
    );
    return learner ? formatLearnerDisplayName(learner) : null;
  }, [workspace.learners, workspace.profile?.defaultLearnerId]);

  const setupContextReady = Boolean(
    workspace.profile?.countryCode && workspace.profile?.curriculumFrameworkId,
  );

  const guidanceItems = useMemo(() => {
    if (workspace.requiresFamilyCreation) {
      return [
        {
          key: "why",
          label: "Why this matters",
          title: "Everything starts with one family record",
          description:
            "Your family profile gives MyLearna the shared home base for learners, planning, capture, reports, and outputs.",
        },
        {
          key: "start",
          label: "What to do first",
          title: "Create a simple family name",
          description:
            "A short label such as Smith family is enough. You can keep this practical and update it later if needed.",
          actionHref: "#create-family-profile",
          actionLabel: "Create family profile",
        },
        {
          key: "example",
          label: "Good example",
          title: "Keep the first setup light",
          description:
            "Example: Smith family, then add one learner such as Maya. Preferred name and year level can stay optional.",
        },
      ];
    }

    return [
      {
        key: "why",
        label: "Why this matters",
        title: "Learners and defaults flow through the rest of MyLearna",
        description:
          "The names you set here appear across planning, pathways, capture, portfolio, reports, and outputs.",
      },
      {
        key: "start",
        label: "What to do first",
        title: workspace.learners.length
          ? "Keep one learner ready to use first"
          : "Add the first learner you plan for",
        description: workspace.learners.length
          ? "If one child usually comes first, set them as the default learner so planning and evidence choices feel quicker."
          : "Start with a first name, then add a preferred name or year level only if that helps your records.",
        actionHref: workspace.learners.length ? "#learners" : "#add-learner",
        actionLabel: workspace.learners.length ? "Review learners" : "Add learner",
      },
      {
        key: "example",
        label: "Good example",
        title: "A good learner record stays simple",
        description:
          "Example: Maya, preferred name optional, Year 4 optional. Add notes only when they will genuinely help you later.",
      },
      {
        key: "next",
        label: "Next best step",
        title: setupContextReady
          ? "Move into planning once this looks right"
          : "Finish family settings after learners are ready",
        description: setupContextReady
          ? "Once names and the default learner feel right, head to My Day or My Pathways and start using the learning workflow."
          : "After learner details are in place, open My Settings to choose country, curriculum, and reporting context.",
        actionHref: setupContextReady ? "/my-day" : "/my-settings",
        actionLabel: setupContextReady ? "Open My Day" : "Open My Settings",
      },
    ];
  }, [setupContextReady, workspace.learners.length, workspace.requiresFamilyCreation]);
  const familyDisplayName = String(workspace.profile?.displayName ?? "").trim();
  const profileHeading = familyDisplayName ? `${familyDisplayName} profile` : "My Profile";

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
    setLearnerActionId(learnerId);
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
      setLearnerActionId(null);
    }
  }

  function handleStartLearnerEdit(learner: Learner) {
    setEditingLearnerId(learner.id);
    setEditingLearnerDraft(buildLearnerDraft(learner));
    setMessage(null);
    setError(null);
  }

  function handleCancelLearnerEdit() {
    setEditingLearnerId(null);
    setEditingLearnerDraft(null);
  }

  async function handleSaveLearnerEdit(learnerId: string) {
    if (!workspace.profile || !editingLearnerDraft) return;

    setSubmitting(true);
    setLearnerActionId(learnerId);
    setMessage(null);
    setError(null);

    try {
      await updateCleanLearner(workspace.profile.id, learnerId, {
        firstName: editingLearnerDraft.firstName,
        preferredName: editingLearnerDraft.preferredName || null,
        surname: editingLearnerDraft.surname || null,
        yearLevel: editingLearnerDraft.yearLevel || null,
        notes: editingLearnerDraft.notes || null,
      });
      setEditingLearnerId(null);
      setEditingLearnerDraft(null);
      setMessage("Learner updated.");
      await workspace.reload();
    } catch (nextError) {
      setError(
        normalizeCleanErrorMessage(
          nextError,
          "We could not update the learner.",
        ),
      );
    } finally {
      setSubmitting(false);
      setLearnerActionId(null);
    }
  }

  async function handleDeleteLearner(learner: Learner) {
    if (!workspace.profile) return;

    const confirmed = window.confirm(
      "Delete this learner? This may also remove this learner's clean programs, calendar items, evidence, portfolio highlights, and reports. This cannot be undone.",
    );

    if (!confirmed) return;

    setSubmitting(true);
    setLearnerActionId(learner.id);
    setMessage(null);
    setError(null);

    try {
      await deleteCleanLearner(workspace.profile.id, learner.id);
      if (editingLearnerId === learner.id) {
        setEditingLearnerId(null);
        setEditingLearnerDraft(null);
      }
      setMessage("Learner deleted.");
      await workspace.reload();
    } catch (nextError) {
      setError(
        normalizeCleanErrorMessage(
          nextError,
          "We could not delete the learner.",
        ),
      );
    } finally {
      setSubmitting(false);
      setLearnerActionId(null);
    }
  }

  return (
    <div style={shellStyle}>
      <div style={wrapStyle}>
        <CleanAppHeader />

        <CleanPageIntroVideo
          config={PAGE_INTRO_VIDEOS.myProfile}
          promptTitle="New to My Profile?"
          promptDescription="Watch a quick guide to see how family and learner details help MyLearna organise records clearly."
        />

        <section style={cardStyle}>
          <div style={{ display: "grid", gap: 8 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.08em",
                color: "#64748b",
                textTransform: "uppercase",
              }}
            >
              Family details
            </div>
            <h1 style={{ margin: 0, fontSize: 28, color: "#0f172a" }}>{profileHeading}</h1>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              Keep family details and learner information together here.
            </p>
          </div>
        </section>

        <CleanPageGuidance
          title="Set up the family basics once, then let the rest of MyLearna build from there"
          copy="My Profile is where you make the learner list feel clear and usable before you start planning, capturing evidence, or building reports."
          items={guidanceItems}
        />

        {workspace.loading ? (
          <section style={cardStyle}>Loading clean family workspace...</section>
        ) : null}

        {!workspace.loading && workspace.schemaMissing ? (
          <section style={cardStyle}>
            <strong style={{ display: "block", marginBottom: 8 }}>
              {CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE}
            </strong>
            <p style={{ margin: 0, color: "#475569" }}>
              Family details are not ready on this install yet.
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
          <section id="create-family-profile" style={cardStyle}>
            <h2 style={{ marginTop: 0, color: "#0f172a" }}>Create family profile</h2>
            <p style={{ color: "#475569", lineHeight: 1.6 }}>
              No family profile exists yet. Start with a simple family name so MyLearna has a shared home for learners and records.
            </p>
            <form onSubmit={handleCreateFamilyProfile} style={{ display: "grid", gap: 12 }}>
              <input
                value={familyName}
                onChange={(event) => setFamilyName(event.target.value)}
                placeholder="Example: Smith family"
                style={inputStyle}
              />
              <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6 }}>
                Keep this practical. You can change it later if you want a different family label.
              </p>
              <div>
                <button type="submit" style={buttonStyle} disabled={submitting}>
                  {submitting ? "Creating..." : "Create family profile"}
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
                <div id="learners" style={{ display: "grid", gap: 12 }}>
                  {workspace.learners.map((learner) => {
                    const isDefault = workspace.profile?.defaultLearnerId === learner.id;
                    const isEditing = editingLearnerId === learner.id;
                    const isBusy = submitting && learnerActionId === learner.id;

                    return (
                      <div
                        key={learner.id}
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: 14,
                          padding: 14,
                          display: "grid",
                          gap: 12,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                          <div>
                            <strong>{formatLearnerDisplayName(learner)}</strong>
                            {learner.yearLevel ? (
                              <span style={{ color: "#64748b" }}> - {learner.yearLevel}</span>
                            ) : null}
                          </div>
                        </div>

                        {isEditing && editingLearnerDraft ? (
                          <div style={{ display: "grid", gap: 10 }}>
                            <input
                              value={editingLearnerDraft.firstName}
                              onChange={(event) =>
                                setEditingLearnerDraft((current) =>
                                  current
                                    ? { ...current, firstName: event.target.value }
                                    : current,
                                )
                              }
                              placeholder="Example: Maya"
                              style={inputStyle}
                            />
                            <input
                              value={editingLearnerDraft.preferredName}
                              onChange={(event) =>
                                setEditingLearnerDraft((current) =>
                                  current
                                    ? { ...current, preferredName: event.target.value }
                                    : current,
                                )
                              }
                              placeholder="Preferred name (optional)"
                              style={inputStyle}
                            />
                            <input
                              value={editingLearnerDraft.surname}
                              onChange={(event) =>
                                setEditingLearnerDraft((current) =>
                                  current
                                    ? { ...current, surname: event.target.value }
                                    : current,
                                )
                              }
                              placeholder="Surname (optional)"
                              style={inputStyle}
                            />
                            <input
                              value={editingLearnerDraft.yearLevel}
                              onChange={(event) =>
                                setEditingLearnerDraft((current) =>
                                  current
                                    ? { ...current, yearLevel: event.target.value }
                                    : current,
                                )
                              }
                              placeholder="Example: Year 4 / Grade 3"
                              style={inputStyle}
                            />
                            <textarea
                              value={editingLearnerDraft.notes}
                              onChange={(event) =>
                                setEditingLearnerDraft((current) =>
                                  current
                                    ? { ...current, notes: event.target.value }
                                    : current,
                                )
                              }
                              placeholder="Optional notes that help you remember this learner's context"
                              style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
                            />
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                              <button
                                type="button"
                                style={buttonStyle}
                                disabled={isBusy}
                                onClick={() => void handleSaveLearnerEdit(learner.id)}
                              >
                                {isBusy ? "Saving..." : "Save"}
                              </button>
                              <button
                                type="button"
                                style={secondaryButtonStyle}
                                disabled={isBusy}
                                onClick={handleCancelLearnerEdit}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                              <button
                                type="button"
                                style={secondaryButtonStyle}
                                disabled={submitting}
                                onClick={() => handleStartLearnerEdit(learner)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                style={dangerButtonStyle}
                                disabled={isBusy}
                                onClick={() => void handleDeleteLearner(learner)}
                              >
                                {isBusy ? "Deleting..." : "Delete"}
                              </button>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                              <div style={{ color: "#64748b", fontSize: 13 }}>
                                {isDefault ? "Default learner" : "Optional default learner"}
                              </div>
                              {isDefault ? (
                                <span style={{ color: "#1d4ed8", fontSize: 13, fontWeight: 700 }}>
                                  Default learner
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  style={subtleButtonStyle}
                                  disabled={isBusy}
                                  onClick={() => void handleSetDefaultLearner(learner.id)}
                                >
                                  Make default
                                </button>
                              )}
                            </div>

                            <details>
                              <summary style={{ color: "#64748b", fontSize: 12, cursor: "pointer" }}>
                                Debug details
                              </summary>
                              <div style={{ color: "#64748b", fontSize: 12, marginTop: 8 }}>
                                Learner ID: {learner.id}
                              </div>
                            </details>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  style={{
                    border: "1px dashed #cbd5e1",
                    borderRadius: 14,
                    padding: 14,
                    display: "grid",
                    gap: 8,
                  }}
                >
                  <strong style={{ color: "#0f172a" }}>Start with one learner</strong>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                    No learners exist yet in the clean workspace. Add one first name now, then
                    come back later for extra detail only if it helps.
                  </p>
                  <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6 }}>
                    Good first example: Maya, preferred name optional, Year 4 optional.
                  </p>
                </div>
              )}
            </section>

            <section id="add-learner" style={cardStyle}>
              <h2 style={{ marginTop: 0, color: "#0f172a" }}>Add learner</h2>
              <p style={{ marginTop: 0, color: "#475569", lineHeight: 1.6 }}>
                Add only what helps right now. A first name is enough to begin planning.
              </p>
              <form onSubmit={handleAddLearner} style={{ display: "grid", gap: 12 }}>
                <input
                  value={learnerFirstName}
                  onChange={(event) => setLearnerFirstName(event.target.value)}
                  placeholder="Example: Maya"
                  style={inputStyle}
                />
                <input
                  value={learnerPreferredName}
                  onChange={(event) => setLearnerPreferredName(event.target.value)}
                  placeholder="Preferred name, if different"
                  style={inputStyle}
                />
                <input
                  value={learnerYearLevel}
                  onChange={(event) => setLearnerYearLevel(event.target.value)}
                  placeholder="Example: Year 4 / Grade 3"
                  style={inputStyle}
                />
                <div>
                  <button type="submit" style={buttonStyle} disabled={submitting}>
                    {submitting ? "Saving..." : "Add learner"}
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
