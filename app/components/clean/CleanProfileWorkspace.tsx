"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useCleanFamilyWorkspace } from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import CleanPageIntroVideo from "@/app/components/clean/CleanPageIntroVideo";
import CleanPageGuidance from "@/app/components/clean/CleanPageGuidance";
import V2LoadingState from "@/app/components/clean/design-v2/V2LoadingState";
import {
  GuidanceGettingStartedCard,
  GuidancePageAction,
  GuidanceSetupProgress,
  GuidanceSetupNextAction,
} from "@/app/components/clean/guidance/GuidanceToggle";
import { useGuidance } from "@/app/components/clean/guidance/GuidanceProvider";
import {
  CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE,
  createCleanFamilyProfile,
  normalizeCleanErrorMessage,
} from "@/lib/clean/family/client";
import {
  getSignupCountryLabel,
  getSignupJurisdictionLabel,
  readSignupPrefill,
  type SignupPrefill,
} from "@/lib/signupPrefill";
import {
  createCleanLearner,
  deleteCleanLearner,
  setDefaultCleanLearner,
  updateCleanLearner,
} from "@/lib/clean/learners/client";
import type { Learner } from "@/lib/clean/learners/types";
import { PAGE_INTRO_VIDEOS } from "@/lib/clean/pageIntroVideos";

const shellStyle: React.CSSProperties = {
  minHeight: "auto",
  background: "transparent",
  padding: 0,
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 960,
  margin: "0 auto",
  display: "grid",
  gap: 20,
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #E7EAF2",
  borderRadius: 20,
  background: "#ffffff",
  padding: "clamp(16px, 3vw, 22px)",
  boxShadow: "0 8px 24px rgba(23,32,75,0.06)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
};

const buttonStyle: React.CSSProperties = {
  border: "1px solid #6C4DF6",
  background: "#6C4DF6",
  color: "#ffffff",
  borderRadius: 14,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  border: "1px solid #E7EAF2",
  background: "#ffffff",
  color: "#17204B",
  borderRadius: 14,
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

function formatLearnerYearLevel(yearLevel: string | null | undefined) {
  const clean = String(yearLevel ?? "").trim();
  if (!clean) return "";
  if (/^(year|grade)\b/i.test(clean)) return clean;
  return `Year/Grade ${clean}`;
}

function titleCaseSlug(value: string | null | undefined) {
  const clean = String(value ?? "").trim();
  if (!clean) return "Not set";
  return clean
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function CleanProfileWorkspaceBody() {
  const workspace = useCleanFamilyWorkspace();
  const { enabled: guidanceEnabled, setupStatus } = useGuidance();
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
  const [signupPrefill, setSignupPrefill] = useState<SignupPrefill | null>(null);
  const [showExtraLearnerForm, setShowExtraLearnerForm] = useState(false);
  const signupPrefillApplied = useRef(false);

  useEffect(() => {
    const prefill = readSignupPrefill();
    setSignupPrefill(prefill);

    if (signupPrefillApplied.current) return;

    if (
      prefill?.fullName &&
      workspace.requiresFamilyCreation &&
      !familyName.trim()
    ) {
      signupPrefillApplied.current = true;
      setFamilyName(`${prefill.fullName}'s family`);
    }
  }, [familyName, workspace.requiresFamilyCreation]);

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
  const expectedLearnerCount =
    typeof signupPrefill?.numberOfChildren === "number" && signupPrefill.numberOfChildren > 0
      ? signupPrefill.numberOfChildren
      : null;
  const learnerTargetMet = Boolean(
    expectedLearnerCount && workspace.learners.length >= expectedLearnerCount,
  );
  const shouldShowAddLearnerForm = !learnerTargetMet || showExtraLearnerForm;
  const suggestedDefaultLearner =
    workspace.learners.length && !workspace.profile?.defaultLearnerId
      ? workspace.learners[0]
      : null;
  const showDeveloperDetails = process.env.NODE_ENV !== "production";
  const profileSetupTask = workspace.requiresFamilyCreation
    ? "Create family profile"
    : learnerTargetMet
      ? "Review learners and continue to Settings"
      : workspace.learners.length
        ? "Continue to Settings"
        : "Add your first learner";

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
  const firstSetupMode =
    guidanceEnabled && (setupStatus === "not_started" || setupStatus === "active");

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
      setMessage("Family profile created.");
      await workspace.reload();
    } catch (nextError) {
      setError(
        normalizeCleanErrorMessage(
          nextError,
          "We could not create your family profile.",
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
      const createdLearner = await createCleanLearner(workspace.profile.id, {
        firstName: learnerFirstName,
        preferredName: learnerPreferredName || null,
        yearLevel: learnerYearLevel || null,
      });
      if (!workspace.profile.defaultLearnerId) {
        await setDefaultCleanLearner(workspace.profile.id, createdLearner.id);
      }
      setLearnerFirstName("");
      setLearnerPreferredName("");
      setLearnerYearLevel("");
      setShowExtraLearnerForm(false);
      setMessage(
        workspace.profile.defaultLearnerId
          ? "Learner added to your family."
          : "Learner added and set as the default learner.",
      );
      await workspace.reload();
    } catch (nextError) {
      setError(
        normalizeCleanErrorMessage(
          nextError,
          "We could not add the learner to your family.",
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
      "Delete this learner? This may also remove this learner's programs, calendar items, evidence, portfolio highlights, and reports. This cannot be undone.",
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
        <style jsx global>{`
          @media (max-width: 720px) {
            .mylearna-profile-intro {
              padding: 16px !important;
            }

            .mylearna-profile-intro p,
            .mylearna-profile-guidance,
            .mylearna-profile-summary {
              display: none !important;
            }

            .mylearna-profile-form-card,
            .mylearna-profile-learners-card {
              padding: 14px !important;
            }

            .mylearna-profile-form-card button,
            .mylearna-profile-learners-card button,
            .mylearna-profile-learners-card a {
              min-height: 44px !important;
            }
          }
        `}</style>
        {!firstSetupMode ? (
          <CleanPageIntroVideo
            config={PAGE_INTRO_VIDEOS.myProfile}
            promptTitle="New to My Profile?"
            promptDescription="See how family details keep learning organised."
          />
        ) : null}

        <section className="mylearna-profile-intro" style={cardStyle}>
          <div style={{ display: "grid", gap: 8 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.04em",
                color: "#64748b",
              }}
            >
              Family details
            </div>
            <h1 style={{ margin: 0, fontSize: 26, color: "#17204B", fontWeight: 650 }}>{profileHeading}</h1>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              Keep family details and learner information together here.
            </p>
            <div>
              {!firstSetupMode ? <GuidancePageAction tourId="my-profile" /> : null}
            </div>
          </div>
        </section>

        <GuidanceSetupProgress
          stepId="profile"
          title="Let's get MyLearna ready for your family."
          body="Add your family and learner details once."
          task={profileSetupTask}
        />

        {!firstSetupMode ? (
          <div className="mylearna-profile-guidance">
            <GuidanceGettingStartedCard />
          </div>
        ) : null}

        {!firstSetupMode ? (
          <div className="mylearna-profile-guidance">
            <CleanPageGuidance
              title="Family basics"
              copy="Keep learners clear before planning, capture, and reports."
              items={guidanceItems}
            />
          </div>
        ) : null}

        {signupPrefill &&
        !workspace.loading &&
        !workspace.schemaMissing &&
        (!workspace.profile || !workspace.learners.length) ? (
          <section style={{ ...cardStyle, borderColor: "#bfdbfe", background: "#f8fbff" }}>
            <h2 style={{ marginTop: 0, color: "#0f172a" }}>Signup details noted</h2>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              We can use your signup details to make setup easier, but MyLearna will not
              create learner records automatically.
            </p>
            {signupPrefill.country || signupPrefill.stateOrRegion ? (
              <p style={{ margin: "10px 0 0", color: "#475569", lineHeight: 1.6 }}>
                {signupPrefill.country ? (
                  <>
                    <strong>Country:</strong> {getSignupCountryLabel(signupPrefill.country)}
                  </>
                ) : null}
                {signupPrefill.country && signupPrefill.stateOrRegion ? " · " : ""}
                {signupPrefill.stateOrRegion ? (
                  <>
                    <strong>State or region:</strong>{" "}
                    {getSignupJurisdictionLabel(
                      signupPrefill.country,
                      signupPrefill.stateOrRegion,
                    )}
                  </>
                ) : null}
              </p>
            ) : null}
            {typeof signupPrefill.numberOfChildren === "number" && signupPrefill.numberOfChildren > 0 ? (
              <p style={{ margin: "10px 0 0", color: "#1d4ed8", fontWeight: 800, lineHeight: 1.6 }}>
                {workspace.learners.length >= signupPrefill.numberOfChildren
                  ? `You've added ${workspace.learners.length} of ${signupPrefill.numberOfChildren} learners.`
                  : `You told us you have ${signupPrefill.numberOfChildren} ${
                      signupPrefill.numberOfChildren === 1 ? "child" : "children"
                    }. Add each learner when you are ready.`}
              </p>
            ) : null}
          </section>
        ) : null}

        {workspace.loading ? (
          <V2LoadingState
            title="Preparing your profile"
            body="We are loading your family profile and learner details."
          />
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
          <section
            className="mylearna-profile-form-card"
            id="create-family-profile"
            data-guidance-id="profile-family-details"
            style={cardStyle}
          >
            <h2 style={{ marginTop: 0, color: "#0f172a" }}>Create family profile</h2>
            <p style={{ color: "#475569", lineHeight: 1.6 }}>
              No family profile exists yet. Start with a simple family name so MyLearna has a shared home for learners and records.
            </p>
            <form onSubmit={handleCreateFamilyProfile} style={{ display: "grid", gap: 12 }}>
              <div data-guidance-id="profile-family-name">
                <input
                  value={familyName}
                  onChange={(event) => setFamilyName(event.target.value)}
                  placeholder="Example: Smith family"
                  style={inputStyle}
                />
              </div>
              <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6 }}>
                Keep this practical. You can change it later if you want a different family label.
              </p>
              <div data-guidance-id="profile-save-profile">
                <button type="submit" style={buttonStyle} disabled={submitting}>
                  {submitting ? "Creating..." : "Create family profile"}
                </button>
              </div>
            </form>
          </section>
        ) : null}

        {!workspace.loading && !workspace.schemaMissing && workspace.profile ? (
          <>
            <section className="mylearna-profile-summary" data-guidance-id="profile-family-details" style={cardStyle}>
              <h2 style={{ marginTop: 0, color: "#0f172a" }}>Family profile</h2>
              <div style={{ display: "grid", gap: 8, color: "#334155" }}>
                <div>
                  <strong>Name:</strong> {workspace.profile.displayName}
                </div>
                <div>
                  <strong>Reporting mode:</strong>{" "}
                  {titleCaseSlug(workspace.profile.reportingMode)}
                </div>
                <div>
                  <strong>Week start:</strong> {titleCaseSlug(workspace.profile.weekStart)}
                </div>
                <div>
                  <strong>Default learner:</strong>{" "}
                  {defaultLearnerLabel ||
                    (workspace.learners.length
                      ? "Choose one learner below to make planning quicker."
                      : "Add a learner first.")}
                </div>
              </div>
            </section>

            <section className="mylearna-profile-learners-card" data-guidance-id="profile-learner-details" style={cardStyle}>
              <h2 style={{ marginTop: 0, color: "#0f172a" }}>Learners</h2>
              {expectedLearnerCount ? (
                <p style={{ marginTop: 0, color: "#1d4ed8", fontWeight: 800, lineHeight: 1.6 }}>
                  {learnerTargetMet
                    ? `You've added ${workspace.learners.length} of ${expectedLearnerCount} learners.`
                    : `You've added ${workspace.learners.length} of ${expectedLearnerCount} learners.`}
                </p>
              ) : null}
              {suggestedDefaultLearner ? (
                <div
                  style={{
                    border: "1px solid #bfdbfe",
                    borderRadius: 14,
                    background: "#eff6ff",
                    padding: 14,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "grid", gap: 4 }}>
                    <strong style={{ color: "#0f172a" }}>Choose a default learner</strong>
                    <span style={{ color: "#475569", lineHeight: 1.5 }}>
                      This makes planning and evidence forms quicker to use.
                    </span>
                  </div>
                  <button
                    type="button"
                    style={secondaryButtonStyle}
                    disabled={submitting}
                    onClick={() => void handleSetDefaultLearner(suggestedDefaultLearner.id)}
                  >
                    Set {formatLearnerDisplayName(suggestedDefaultLearner)} as default
                  </button>
                </div>
              ) : null}
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
                              <span style={{ color: "#64748b" }}>
                                {" "}
                                - {formatLearnerYearLevel(learner.yearLevel)}
                              </span>
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

                            {showDeveloperDetails ? (
                            <details>
                              <summary style={{ color: "#64748b", fontSize: 12, cursor: "pointer" }}>
                                Debug details
                              </summary>
                              <div style={{ color: "#64748b", fontSize: 12, marginTop: 8 }}>
                                Learner ID: {learner.id}
                              </div>
                            </details>
                            ) : null}
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
                    No learners exist yet. Add one first name now, then
                    come back later for extra detail only if it helps.
                  </p>
                  <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6 }}>
                    Good first example: Maya, preferred name optional, Year 4 optional.
                  </p>
                </div>
              )}
            </section>

            {shouldShowAddLearnerForm ? (
            <section id="add-learner" data-guidance-id="profile-add-learner" style={cardStyle}>
              <h2 style={{ marginTop: 0, color: "#0f172a" }}>Add learner</h2>
              <p style={{ marginTop: 0, color: "#475569", lineHeight: 1.6 }}>
                Add only what helps right now. A first name is enough to begin planning.
              </p>
              <form onSubmit={handleAddLearner} style={{ display: "grid", gap: 12 }}>
                <div data-guidance-id="profile-learner-first-name" style={{ display: "grid", gap: 6 }}>
                  <label style={{ color: "#334155", fontSize: 13, fontWeight: 800 }}>
                    Learner first name
                  </label>
                  <input
                    value={learnerFirstName}
                    onChange={(event) => {
                      setLearnerFirstName(event.target.value);
                      if (error?.toLowerCase().includes("learner first name")) {
                        setError(null);
                      }
                    }}
                    placeholder="Example: Maya"
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  <label style={{ color: "#334155", fontSize: 13, fontWeight: 800 }}>
                    Preferred name, if different
                  </label>
                  <input
                    value={learnerPreferredName}
                    onChange={(event) => setLearnerPreferredName(event.target.value)}
                    placeholder="Preferred name, if different"
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  <label style={{ color: "#334155", fontSize: 13, fontWeight: 800 }}>
                    Year / grade level
                  </label>
                  <input
                    value={learnerYearLevel}
                    onChange={(event) => setLearnerYearLevel(event.target.value)}
                    placeholder="Example: Year 4 / Grade 3"
                    style={inputStyle}
                  />
                </div>
                <div data-guidance-id="profile-add-learner-button">
                  <button type="submit" style={buttonStyle} disabled={submitting}>
                    {submitting ? "Saving..." : "Add learner"}
                  </button>
                </div>
              </form>
            </section>
            ) : (
              <section id="add-learner" data-guidance-id="profile-add-learner" style={cardStyle}>
                <h2 style={{ marginTop: 0, color: "#0f172a" }}>Learners are ready for now</h2>
                <p style={{ marginTop: 0, color: "#475569", lineHeight: 1.6 }}>
                  You&apos;ve added the number of learners you told us about. You can add another
                  learner later if your setup changes.
                </p>
                <button
                  type="button"
                  style={secondaryButtonStyle}
                  onClick={() => setShowExtraLearnerForm(true)}
                >
                  Add another learner if needed
                </button>
              </section>
            )}

            <section data-guidance-id="profile-next-settings" style={cardStyle}>
              <h2 style={{ marginTop: 0, color: "#0f172a" }}>Next step: My Settings</h2>
              <p style={{ marginTop: 0, color: "#475569", lineHeight: 1.6 }}>
                After your profile is ready, choose your country, curriculum and reporting
                context in My Settings.
              </p>
              {setupStatus === "active" ? (
                <GuidanceSetupNextAction
                  stepId="profile"
                  nextHref="/my-settings"
                  label="Continue to My Settings"
                  helperText="Family profile is started. Continue when you are ready to choose your learning settings."
                />
              ) : (
                <Link href="/my-settings" style={buttonStyle}>
                  Open My Settings
                </Link>
              )}
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
  return <CleanProfileWorkspaceBody />;
}
