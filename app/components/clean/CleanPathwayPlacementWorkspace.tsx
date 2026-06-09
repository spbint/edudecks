"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";
import CleanAppHeader from "@/app/components/clean/CleanAppHeader";
import CleanFamilyWorkspaceProvider, {
  useCleanFamilyWorkspace,
} from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import { DETAILED_SUBJECT_CONFIGS } from "@/lib/clean/pathways/detailedSubjectConfigs";
import type { Learner } from "@/lib/clean/learners/types";
import { inferPathwayStageFromYearLevel } from "@/lib/clean/pathways/mathematicsNumberPrototype";
import {
  getPathwayStepsByStrand,
  type PathwayStepRegistryItem,
} from "@/lib/clean/pathways/pathwayStepRegistry";
import {
  DEFAULT_PATHWAY_SUBJECT_KEY,
  PATHWAY_SUBJECTS,
  type PathwaySubjectKey,
} from "@/lib/clean/pathways/pathwaySubjects";
import {
  readPathwayPlacement,
  savePathwayPlacement,
} from "@/lib/clean/pathways/pathwayPlacement";

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "clamp(14px, 3vw, 24px) clamp(10px, 3vw, 18px) 40px",
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 980,
  margin: "0 auto",
  display: "grid",
  gap: 16,
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  background: "#ffffff",
  padding: 18,
  boxShadow: "0 4px 14px rgba(15,23,42,0.035)",
};

const optionGridStyle: React.CSSProperties = {
  display: "grid",
  gap: 10,
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
};

const primaryButtonStyle: React.CSSProperties = {
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
  borderRadius: 12,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const secondaryButtonStyle: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  borderRadius: 12,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const eyebrowStyle: React.CSSProperties = {
  color: "#2563eb",
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

type PlacementStep = "learner" | "subject" | "strand" | "manual" | "recommendation";

function getLearnerLabel(learner: Learner | null) {
  if (!learner) return "No learner selected";
  return learner.preferredName || learner.firstName;
}

function getValidSubjectKey(value: string | null): PathwaySubjectKey {
  const subject = PATHWAY_SUBJECTS.find(
    (candidate) => candidate.key === value && candidate.status === "detailed",
  );
  return subject?.key || DEFAULT_PATHWAY_SUBJECT_KEY;
}

function getDefaultStrandKey(subjectKey: PathwaySubjectKey) {
  return DETAILED_SUBJECT_CONFIGS[subjectKey]?.defaultStrandKey || "";
}

function chooseGentleStartingStep(
  steps: PathwayStepRegistryItem[],
  learner: Learner | null,
) {
  if (!steps.length) return null;
  const stageKey = inferPathwayStageFromYearLevel(learner?.yearLevel);
  return (
    steps.find((step) => step.stageKey === stageKey) ||
    steps.find((step) => step.stageOrder >= 2) ||
    steps[0] ||
    null
  );
}

function buildPathwaysHref(
  basePath: string,
  input: {
    learnerId: string;
    subjectKey: PathwaySubjectKey;
    strandKey: string;
    pathwayStepId?: string | null;
  },
) {
  const params = new URLSearchParams();
  if (input.learnerId) params.set("learnerId", input.learnerId);
  params.set("subjectKey", input.subjectKey);
  params.set("strandKey", input.strandKey);
  if (input.pathwayStepId) params.set("pathwayStepId", input.pathwayStepId);
  params.set("placement", "1");
  return `${basePath}?${params.toString()}`;
}

function ChoiceButton({
  selected,
  title,
  body,
  onClick,
}: {
  selected: boolean;
  title: string;
  body?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      style={{
        border: selected ? "1px solid #2563eb" : "1px solid #e2e8f0",
        background: selected ? "#eff6ff" : "#ffffff",
        borderRadius: 14,
        padding: 14,
        display: "grid",
        gap: 6,
        textAlign: "left",
        cursor: "pointer",
        boxShadow: selected
          ? "0 8px 18px rgba(37,99,235,0.1)"
          : "0 3px 10px rgba(15,23,42,0.03)",
      }}
    >
      <strong style={{ color: "#0f172a", fontSize: 15 }}>{title}</strong>
      {body ? (
        <span style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>{body}</span>
      ) : null}
    </button>
  );
}

function CleanPathwayPlacementWorkspaceBody() {
  const workspace = useCleanFamilyWorkspace();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathwaysPathBase = pathname.startsWith("/clean-my-pathways")
    ? "/clean-my-pathways"
    : "/my-pathways";
  const profilePathBase = pathname.startsWith("/clean-my-pathways")
    ? "/clean-my-profile"
    : "/my-profile";

  const supportedSubjects = PATHWAY_SUBJECTS.filter((subject) => subject.status === "detailed");
  const initialSubjectKey = getValidSubjectKey(searchParams.get("subjectKey"));
  const [selectedLearnerId, setSelectedLearnerId] = useState(
    () => searchParams.get("learnerId") || "",
  );
  const [selectedSubjectKey, setSelectedSubjectKey] =
    useState<PathwaySubjectKey>(initialSubjectKey);
  const [selectedStrandKey, setSelectedStrandKey] = useState(
    () => searchParams.get("strandKey") || getDefaultStrandKey(initialSubjectKey),
  );
  const [selectedStepId, setSelectedStepId] = useState(
    () => searchParams.get("pathwayStepId") || "",
  );
  const [step, setStep] = useState<PlacementStep>(() =>
    searchParams.get("mode") === "manual" ? "manual" : "learner",
  );
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [selectionSource, setSelectionSource] = useState<
    "suggested" | "manual" | "moved_forward" | "moved_back"
  >(
    searchParams.get("mode") === "manual" ? "manual" : "suggested",
  );

  const effectiveSelectedLearnerId =
    selectedLearnerId || (workspace.learners.length === 1 ? workspace.learners[0]?.id || "" : "");
  const selectedLearner =
    workspace.learners.find((learner) => learner.id === effectiveSelectedLearnerId) || null;
  const selectedSubject =
    supportedSubjects.find((subject) => subject.key === selectedSubjectKey) ||
    supportedSubjects[0];
  const selectedSubjectConfig = DETAILED_SUBJECT_CONFIGS[selectedSubjectKey] || null;
  const strandOptions = selectedSubjectConfig?.domainCards || [];
  const selectedStrand =
    strandOptions.find((strand) => strand.key === selectedStrandKey) || strandOptions[0] || null;
  const effectiveSelectedStrandKey = selectedStrand?.key || "";
  const pathwaySteps = effectiveSelectedStrandKey
    ? getPathwayStepsByStrand(selectedSubjectKey, effectiveSelectedStrandKey)
    : [];
  const selectedPathwayStep =
    pathwaySteps.find((candidate) => candidate.id === selectedStepId) || null;
  const gentleStartingStep = chooseGentleStartingStep(pathwaySteps, selectedLearner);
  const existingPlacement =
    selectedLearner && effectiveSelectedStrandKey
      ? readPathwayPlacement(
          selectedLearner.id,
          selectedSubjectKey,
          effectiveSelectedStrandKey,
        )
      : null;
  const shouldShowExistingPlacementNotice = Boolean(
    existingPlacement && !selectedStepId && step === "strand",
  );
  const selectedLearnerLabel = getLearnerLabel(selectedLearner);
  const canContinueLearner = Boolean(selectedLearner);
  const canContinueSubject = Boolean(selectedSubject);
  const canContinueStrand = Boolean(selectedStrand);
  const canSavePlacement = Boolean(selectedLearner && selectedStrand && selectedPathwayStep);
  const selectedStepIndex = pathwaySteps.findIndex(
    (candidate) => candidate.id === (selectedPathwayStep?.id || selectedStepId),
  );
  const previousPathwayStep = selectedStepIndex > 0 ? pathwaySteps[selectedStepIndex - 1] : null;
  const nextPathwayStep =
    selectedStepIndex >= 0 && selectedStepIndex < pathwaySteps.length - 1
      ? pathwaySteps[selectedStepIndex + 1]
      : null;
  const targetPathwaysHref = buildPathwaysHref(pathwaysPathBase, {
    learnerId: selectedLearner?.id || "",
    subjectKey: selectedSubjectKey,
    strandKey: selectedStrand?.key || selectedStrandKey,
    pathwayStepId: selectedPathwayStep?.id || selectedStepId,
  });

  function continueFromLearner() {
    if (!canContinueLearner) return;
    setStep("subject");
  }

  function continueFromSubject() {
    if (!canContinueSubject) return;
    setStep("strand");
  }

  function showSuggestedStep() {
    if (!canContinueStrand) return;
    setSelectedStepId((current) => current || gentleStartingStep?.id || "");
    setSelectionSource("suggested");
    setStep("recommendation");
  }

  function openManualChoice() {
    setSelectedStepId((current) => current || gentleStartingStep?.id || "");
    setSelectionSource("manual");
    setStep("manual");
  }

  function showRecommendation() {
    if (!selectedStepId && gentleStartingStep) {
      setSelectedStepId(gentleStartingStep.id);
    }
    setStep("recommendation");
  }

  function saveAndContinue() {
    if (!selectedLearner || !selectedStrand || !selectedPathwayStep) return;
    savePathwayPlacement({
      learnerId: selectedLearner.id,
      subjectKey: selectedSubjectKey,
      strandKey: selectedStrand.key,
      pathwayStepId: selectedPathwayStep.id,
      method: selectionSource,
    });
    setSavedMessage("Starting point saved.");
  }

  function continueToPathways() {
    saveAndContinue();
    router.push(targetPathwaysHref);
  }

  function checkAnotherStrand() {
    setSelectedStepId("");
    setSavedMessage(null);
    setStep("strand");
  }

  function moveToAdjacentStep(
    nextStep: PathwayStepRegistryItem | null,
    source: "moved_forward" | "moved_back",
  ) {
    if (!nextStep) return;
    setSelectedStepId(nextStep.id);
    setSelectionSource(source);
    setSavedMessage(null);
  }

  return (
    <div style={shellStyle}>
      <div style={wrapStyle}>
        <CleanAppHeader />

        <section style={{ ...cardStyle, display: "grid", gap: 10 }}>
          <div style={eyebrowStyle}>Pathway entry</div>
          <h1 style={{ margin: 0, color: "#0f172a", fontSize: 30 }}>
            Start a learning pathway
          </h1>
          <p style={{ margin: 0, color: "#475569", lineHeight: 1.7, maxWidth: 720 }}>
            Choose one learner and one strand. MyLearna will suggest a starting step,
            then you can move forward, try an earlier step, or choose manually.
          </p>
        </section>

        {workspace.loading ? (
          <section style={cardStyle}>Loading your family...</section>
        ) : null}

        {!workspace.loading && workspace.requiresFamilyCreation ? (
          <section style={cardStyle}>
            <strong style={{ color: "#0f172a" }}>Create your family profile first.</strong>
            <p style={{ color: "#475569", lineHeight: 1.6 }}>
              Add your family and learner details before choosing a pathway starting point.
            </p>
            <Link href={profilePathBase} style={primaryButtonStyle}>
              Go to My Profile
            </Link>
          </section>
        ) : null}

        {!workspace.loading && !workspace.requiresFamilyCreation && !workspace.learners.length ? (
          <section style={cardStyle}>
            <strong style={{ color: "#0f172a" }}>Add a learner first.</strong>
            <p style={{ color: "#475569", lineHeight: 1.6 }}>
              MyLearna needs a learner before it can suggest a pathway starting point.
            </p>
            <Link href={profilePathBase} style={primaryButtonStyle}>
              Add learner on My Profile
            </Link>
          </section>
        ) : null}

        {!workspace.loading && workspace.learners.length ? (
          <>
            {step === "learner" ? (
              <section style={{ ...cardStyle, display: "grid", gap: 14 }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <h2 style={{ margin: 0, color: "#0f172a" }}>
                    Who are we starting with?
                  </h2>
                  <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6 }}>
                    Choose one learner. You can start other learners later.
                  </p>
                </div>
                <div style={optionGridStyle}>
                  {workspace.learners.map((learner) => (
                    <ChoiceButton
                      key={learner.id}
                      selected={learner.id === selectedLearnerId}
                      title={getLearnerLabel(learner)}
                      body={learner.yearLevel ? `Year / grade: ${learner.yearLevel}` : undefined}
                      onClick={() => setSelectedLearnerId(learner.id)}
                    />
                  ))}
                </div>
                <div>
                  <button
                    type="button"
                    disabled={!canContinueLearner}
                    onClick={continueFromLearner}
                    style={{
                      ...primaryButtonStyle,
                      opacity: canContinueLearner ? 1 : 0.55,
                    }}
                  >
                    Continue
                  </button>
                </div>
              </section>
            ) : null}

            {step === "subject" ? (
              <section style={{ ...cardStyle, display: "grid", gap: 14 }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <h2 style={{ margin: 0, color: "#0f172a" }}>Choose a subject</h2>
                  <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6 }}>
                    Start with a subject that has pathway steps ready now.
                  </p>
                </div>
                <div style={optionGridStyle}>
                  {supportedSubjects.map((subject) => (
                    <ChoiceButton
                      key={subject.key}
                      selected={subject.key === selectedSubjectKey}
                      title={subject.title}
                      body={
                        subject.key === "mathematics"
                          ? "Recommended first subject"
                          : subject.description
                      }
                      onClick={() => {
                        setSelectedSubjectKey(subject.key);
                        setSelectedStrandKey(getDefaultStrandKey(subject.key));
                        setSelectedStepId("");
                      }}
                    />
                  ))}
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button type="button" onClick={() => setStep("learner")} style={secondaryButtonStyle}>
                    Back
                  </button>
                  <button type="button" onClick={continueFromSubject} style={primaryButtonStyle}>
                    Continue
                  </button>
                </div>
              </section>
            ) : null}

            {step === "strand" ? (
              <section style={{ ...cardStyle, display: "grid", gap: 14 }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <h2 style={{ margin: 0, color: "#0f172a" }}>
                    Choose a strand
                  </h2>
                  <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6 }}>
                    Start with one strand. You can come back and choose another later.
                  </p>
                </div>
                <div style={optionGridStyle}>
                  {strandOptions.map((strand) => (
                    <ChoiceButton
                      key={strand.key}
                      selected={strand.key === selectedStrandKey}
                      title={strand.title}
                      body={strand.description}
                      onClick={() => {
                        setSelectedStrandKey(strand.key);
                        setSelectedStepId("");
                      }}
                    />
                  ))}
                </div>
                {shouldShowExistingPlacementNotice && existingPlacement && selectedStrand ? (
                  <div
                    style={{
                      border: "1px solid #bfdbfe",
                      background: "#eff6ff",
                      borderRadius: 14,
                      padding: 14,
                      display: "grid",
                      gap: 10,
                    }}
                  >
                    <strong style={{ color: "#0f172a" }}>
                      {selectedLearnerLabel} already has a starting point for this strand.
                    </strong>
                    <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                      You can keep the current starting point or update it.
                    </p>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <Link
                        href={buildPathwaysHref(pathwaysPathBase, {
                          learnerId: selectedLearner?.id || "",
                          subjectKey: selectedSubjectKey,
                          strandKey: selectedStrand.key,
                          pathwayStepId: existingPlacement.pathwayStepId,
                        })}
                        style={secondaryButtonStyle}
                      >
                        Keep current starting point
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStepId(existingPlacement.pathwayStepId);
                          openManualChoice();
                        }}
                        style={primaryButtonStyle}
                      >
                        Update starting point
                      </button>
                    </div>
                  </div>
                ) : null}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button type="button" onClick={() => setStep("subject")} style={secondaryButtonStyle}>
                    Back
                  </button>
                  <button type="button" onClick={showSuggestedStep} style={primaryButtonStyle}>
                    Show starting step
                  </button>
                  <button type="button" onClick={openManualChoice} style={secondaryButtonStyle}>
                    Choose a step manually
                  </button>
                </div>
              </section>
            ) : null}

            {step === "manual" ? (
              <section style={{ ...cardStyle, display: "grid", gap: 14 }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={eyebrowStyle}>Manual starting point</div>
                  <h2 style={{ margin: 0, color: "#0f172a" }}>
                    Choose a step for {selectedLearnerLabel}
                  </h2>
                  <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6 }}>
                    Pick a starting step for {selectedStrand?.title || "this strand"}.
                    This does not label the learner; it only tells MyLearna where to open the pathway.
                  </p>
                </div>
                <div style={{ display: "grid", gap: 8, maxHeight: 460, overflow: "auto" }}>
                  {pathwaySteps.map((candidate) => (
                    <ChoiceButton
                      key={candidate.id}
                      selected={candidate.id === selectedStepId}
                      title={candidate.stepTitle}
                      body={`${candidate.stageTitle}: ${candidate.stepDescription}`}
                      onClick={() => setSelectedStepId(candidate.id)}
                    />
                  ))}
                </div>
                {!pathwaySteps.length ? (
                  <p style={{ margin: 0, color: "#b91c1c" }}>
                    This strand does not have pathway steps connected yet.
                  </p>
                ) : null}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button type="button" onClick={() => setStep("strand")} style={secondaryButtonStyle}>
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={!selectedStepId}
                    onClick={() => {
                      setSelectionSource("manual");
                      showRecommendation();
                    }}
                    style={{
                      ...primaryButtonStyle,
                      opacity: selectedStepId ? 1 : 0.55,
                    }}
                  >
                    Review starting point
                  </button>
                </div>
              </section>
            ) : null}

            {step === "recommendation" ? (
              <section style={{ ...cardStyle, display: "grid", gap: 14 }}>
                <div style={eyebrowStyle}>Start here</div>
                <h2 style={{ margin: 0, color: "#0f172a" }}>
                  Start here
                </h2>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                  Based on the learner profile and this strand, this is a sensible
                  place to begin. You can move forward or back at any time.
                </p>
                {selectedPathwayStep ? (
                  <div
                    style={{
                      border: "1px solid #bfdbfe",
                      background: "#eff6ff",
                      borderRadius: 16,
                      padding: 16,
                      display: "grid",
                      gap: 8,
                    }}
                  >
                    <strong style={{ color: "#0f172a", fontSize: 18 }}>
                      {selectedPathwayStep.stepTitle}
                    </strong>
                    <span style={{ color: "#1d4ed8", fontWeight: 800 }}>
                      {selectedPathwayStep.stageTitle}
                    </span>
                    <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                      {selectedPathwayStep.stepDescription}
                    </p>
                  </div>
                ) : null}
                <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6 }}>
                  This is a starting point, not a grade label. Start here, try this,
                  and adjust as you go.
                </p>
                {savedMessage ? (
                  <div role="status" style={{ color: "#166534", fontWeight: 800 }}>
                    {savedMessage}
                  </div>
                ) : null}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    disabled={!canSavePlacement}
                    onClick={continueToPathways}
                    style={{
                      ...primaryButtonStyle,
                      opacity: canSavePlacement ? 1 : 0.55,
                    }}
                  >
                    Start this step
                  </button>
                  <button
                    type="button"
                    disabled={!nextPathwayStep}
                    onClick={() => moveToAdjacentStep(nextPathwayStep, "moved_forward")}
                    style={{
                      ...secondaryButtonStyle,
                      opacity: nextPathwayStep ? 1 : 0.55,
                    }}
                  >
                    Too easy - move forward
                  </button>
                  <button
                    type="button"
                    disabled={!previousPathwayStep}
                    onClick={() => moveToAdjacentStep(previousPathwayStep, "moved_back")}
                    style={{
                      ...secondaryButtonStyle,
                      opacity: previousPathwayStep ? 1 : 0.55,
                    }}
                  >
                    Too hard - try an earlier step
                  </button>
                  <button type="button" onClick={openManualChoice} style={secondaryButtonStyle}>
                    Choose a different step
                  </button>
                  <button type="button" onClick={checkAnotherStrand} style={secondaryButtonStyle}>
                    Choose another strand
                  </button>
                </div>
                {!nextPathwayStep && selectedStepIndex >= 0 ? (
                  <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
                    You&apos;re at the end of this strand for now.
                  </p>
                ) : null}
                {!previousPathwayStep && selectedStepIndex >= 0 ? (
                  <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
                    This is the first step in this strand.
                  </p>
                ) : null}
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function CleanPathwayPlacementWorkspace() {
  return (
    <CleanFamilyWorkspaceProvider>
      <CleanPathwayPlacementWorkspaceBody />
    </CleanFamilyWorkspaceProvider>
  );
}
