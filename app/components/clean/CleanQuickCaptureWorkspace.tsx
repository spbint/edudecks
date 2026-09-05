"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuthUser } from "@/app/components/AuthUserProvider";
import V2LoadingState from "@/app/components/clean/design-v2/V2LoadingState";
import CoreJourneyCue, {
  CoreJourneyHelp,
} from "@/app/components/clean/design-v2/CoreJourneyCue";
import CleanLearningMomentShareCard from "@/app/components/clean/CleanLearningMomentShareCard";
import { useCleanFamilyWorkspace } from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import CleanEvidenceAttachmentControls from "@/app/components/clean/evidence/CleanEvidenceAttachmentControls";
import { saveUnifiedLearningCapture } from "@/lib/clean/evidence/unifiedCapture";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import { useCleanEvidenceAttachments } from "@/lib/clean/evidence/useCleanEvidenceAttachments";
import { captureAttachmentCategory } from "@/lib/clean/evidence/captureAnalytics";
import { normalizeCleanErrorMessage } from "@/lib/clean/family/client";
import { setQuickCaptureDraft } from "@/lib/clean/evidence/quickCaptureDraft";
import {
  clearQuickCaptureSessionDraft,
  getQuickCaptureSessionDraftKey,
  readQuickCaptureSessionDraft,
  writeQuickCaptureSessionDraft,
} from "@/lib/clean/evidence/quickCaptureSessionDraft";
import {
  buildQuickCaptureSuccessHandoff,
  safeQuickCaptureReturnPath,
} from "@/lib/clean/evidence/quickCaptureSuccess";
import {
  trackCoreJourneyEvent,
  trackProductEvent,
} from "@/lib/clean/analytics/productAnalytics";
import {
  attachmentRecoveryMessage,
  captureRecoveryMessage,
  useCaptureNetworkHint,
} from "@/lib/clean/evidence/captureNetworkStatus";

const MAX_CAPTION_LENGTH = 280;

const buttonStyle: React.CSSProperties = {
  minHeight: 44,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 12,
  border: "1px solid #17204b",
  background: "#17204b",
  color: "#ffffff",
  padding: "9px 13px",
  fontSize: 14,
  fontWeight: 800,
  textDecoration: "none",
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  borderColor: "#cbd5e1",
  background: "#ffffff",
  color: "#17204b",
};

const tertiaryButtonStyle: React.CSSProperties = {
  minHeight: 44,
  border: 0,
  background: "transparent",
  color: "#4f46b8",
  padding: "6px 2px",
  fontSize: 14,
  fontWeight: 800,
  textDecoration: "underline",
  textUnderlineOffset: 3,
  cursor: "pointer",
};

function getTodayDate() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function learnerLabel(learner: { firstName: string; preferredName: string | null; surname: string | null }) {
  const givenName = learner.preferredName || learner.firstName || "Learner";
  return learner.surname && learner.surname.toLowerCase() !== givenName.toLowerCase()
    ? `${givenName} ${learner.surname}`
    : givenName;
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export default function CleanQuickCaptureWorkspace() {
  const workspace = useCleanFamilyWorkspace();
  const { user } = useAuthUser();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedLearnerId = searchParams.get("learner_id") || searchParams.get("learnerId") || "";
  const requestedCalendarItemId = searchParams.get("calendar_item_id") || "";
  const requestedProgramId = searchParams.get("program_id") || "";
  const requestedObservedOn = searchParams.get("observed_on") || "";
  const requestedLearningArea = searchParams.get("learning_area") || "";
  const returnPath = safeQuickCaptureReturnPath(searchParams.get("returnTo"));
  const [learnerId, setLearnerId] = useState(requestedLearnerId);
  const [observedOn, setObservedOn] = useState(
    /^\d{4}-\d{2}-\d{2}$/.test(requestedObservedOn) ? requestedObservedOn : getTodayDate,
  );
  const [caption, setCaption] = useState("");
  const [reflection, setReflection] = useState("");
  const [learningArea, setLearningArea] = useState(requestedLearningArea);
  const attachments = useCleanEvidenceAttachments();
  const networkHint = useCaptureNetworkHint();
  const [submitting, setSubmitting] = useState(false);
  const [savePhase, setSavePhase] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [savedEntry, setSavedEntry] = useState<CleanEvidenceEntry | null>(null);
  const [savedPhotoAttached, setSavedPhotoAttached] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState("");
  const [sharingOpen, setSharingOpen] = useState(false);
  const [learningAreaOpen, setLearningAreaOpen] = useState(false);
  const quickCaptureTopRef = useRef<HTMLElement | null>(null);
  const submissionIdRef = useRef("");
  const openedTrackedRef = useRef(false);
  const firstAttachmentTrackedRef = useRef(false);
  const captureSavedRef = useRef(false);
  const captureMeaningfulInputRef = useRef(false);
  const captureAbandonmentTrackedRef = useRef(false);
  const attachmentFinalisedRef = useRef(false);
  const captureHasAttachmentRef = useRef(attachments.hasSelectedAttachments);
  captureHasAttachmentRef.current = attachments.hasSelectedAttachments;
  const restoredDraftKeyRef = useRef<string | null>(null);
  const [restoredDraftNotice, setRestoredDraftNotice] = useState("");

  const sessionDraftKey = useMemo(() => {
    if (!workspace.profile || !user?.id) return null;
    return getQuickCaptureSessionDraftKey({
      userId: user.id,
      familyId: workspace.profile.id,
      calendarItemId: requestedCalendarItemId,
      programId: requestedProgramId,
    });
  }, [requestedCalendarItemId, requestedProgramId, user?.id, workspace.profile]);

  const selectedLearner = useMemo(
    () => workspace.learners.find((learner) => learner.id === learnerId) ?? null,
    [learnerId, workspace.learners],
  );
  const savedLearner = savedEntry
    ? workspace.learners.find((learner) => learner.id === savedEntry.learnerId) ?? null
    : null;
  const savedLearnerLabel = savedLearner ? learnerLabel(savedLearner) : "Your learner";
  const successHandoff = savedEntry
    ? buildQuickCaptureSuccessHandoff({
        evidenceId: savedEntry.id,
        learnerId: savedEntry.learnerId,
        learnerLabel: savedLearnerLabel,
        includeInPortfolio: savedEntry.includeInPortfolio,
        includeInReport: savedEntry.includeInReport,
        returnTo: searchParams.get("returnTo"),
        portfolioPathBase: pathname.startsWith("/clean-my-capture")
          ? "/clean-my-portfolio"
          : "/my-portfolio",
      })
    : null;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!workspace.learners.length) return;
    if (requestedLearnerId && workspace.learners.some((learner) => learner.id === requestedLearnerId)) {
      setLearnerId(requestedLearnerId);
      return;
    }
    if (!workspace.learners.some((learner) => learner.id === learnerId)) {
      setLearnerId(workspace.setupStatus.activeLearnerId || workspace.profile?.defaultLearnerId || workspace.learners[0]?.id || "");
    }
  }, [learnerId, requestedLearnerId, workspace.learners, workspace.profile?.defaultLearnerId, workspace.setupStatus.activeLearnerId]);

  useEffect(() => {
    if (!sessionDraftKey || !workspace.learners.length || restoredDraftKeyRef.current === sessionDraftKey) return;
    const draft = readQuickCaptureSessionDraft(sessionDraftKey);
    restoredDraftKeyRef.current = sessionDraftKey;
    if (!draft) return;
    if (workspace.learners.some((learner) => learner.id === draft.learnerId)) setLearnerId(draft.learnerId);
    if (/^\d{4}-\d{2}-\d{2}$/.test(draft.observedOn)) setObservedOn(draft.observedOn);
    setCaption(draft.caption);
    setReflection(draft.reflection);
    setLearningArea(draft.learningArea);
    if (draft.caption || draft.reflection || draft.learningArea) {
      setRestoredDraftNotice("Your notes were restored. Add the photo again if you still want to attach it.");
    }
  }, [sessionDraftKey, workspace.learners]);

  useEffect(() => {
    if (!sessionDraftKey || savedEntry) return;
    if (!caption && !reflection && !learningArea) return;
    const timeout = window.setTimeout(() => {
      writeQuickCaptureSessionDraft(sessionDraftKey, { learnerId, observedOn, caption, reflection, learningArea });
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [caption, learnerId, learningArea, observedOn, reflection, savedEntry, sessionDraftKey]);

  useEffect(() => {
    if (openedTrackedRef.current) return;
    trackCoreJourneyEvent(
      "quick_capture_opened",
      {
        area: "quick_capture",
        route: pathname,
        hasLearner: Boolean(learnerId),
        sourceSurface: "quick_capture",
        captureMode: "quick",
      },
      user?.id,
    );
    openedTrackedRef.current = true;
  }, [learnerId, pathname, user?.id]);

  useEffect(() => {
    if (!attachments.hasSelectedAttachments || firstAttachmentTrackedRef.current) return;
    trackCoreJourneyEvent(
      "capture_first_attachment_selected",
      {
        area: "quick_capture",
        route: pathname,
        hasAttachment: true,
        sourceSurface: "quick_capture",
        attachmentCategory: captureAttachmentCategory(attachments.selectedFiles),
      },
      user?.id,
    );
    firstAttachmentTrackedRef.current = true;
  }, [attachments.hasSelectedAttachments, attachments.selectedFiles, pathname, user?.id]);

  useEffect(() => {
    return () => {
      if (
        captureAbandonmentTrackedRef.current ||
        captureSavedRef.current ||
        !captureMeaningfulInputRef.current
      ) return;
      trackCoreJourneyEvent(
        "capture_abandoned",
        {
          area: "quick_capture",
          route: pathname,
          sourceSurface: "quick_capture",
          captureMode: "quick",
          hadMeaningfulInput: true,
          isEdit: false,
          hasAttachment: captureHasAttachmentRef.current,
        },
        user?.id,
      );
      captureAbandonmentTrackedRef.current = true;
    };
  }, [pathname, user?.id]);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || savedEntry || !workspace.profile) return;
    const nextCaption = caption.trim().slice(0, MAX_CAPTION_LENGTH);
    if (!selectedLearner && workspace.learners.length) {
      setError("Choose the learner for this learning moment.");
      return;
    }
    if (!attachments.hasSelectedAttachments && !nextCaption) {
      setError("Add a photo or a short caption before saving.");
      return;
    }
    const attachmentValidationError = attachments.validateSelectedAttachments();
    if (attachmentValidationError) {
      setError(attachmentValidationError);
      return;
    }
    if (!learnerId) {
      setError("Add a learner before saving a learning moment.");
      return;
    }

    if (sessionDraftKey) {
      writeQuickCaptureSessionDraft(sessionDraftKey, { learnerId, observedOn, caption, reflection, learningArea });
    }

    setSubmitting(true);
    setSavePhase("Saving learning");
    setError("");
    setStatus("");
    setPhotoUploadError("");
    let persistedEntry: CleanEvidenceEntry | null = null;
    try {
      if (!submissionIdRef.current) {
        submissionIdRef.current = typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `quick-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      }
      const result = await saveUnifiedLearningCapture({
        familyId: workspace.profile.id,
        learnerId,
        learnerContext: {
          familyId: workspace.profile.id,
          selectedLearnerId: learnerId,
          sourceLearnerId: learnerId,
          sourceFamilyId: workspace.profile.id,
          sourceType: "quick-capture",
          sourceId: null,
        },
        availableLearners: workspace.learners,
        activityDate: observedOn,
        title: "Learning moment",
        whatHappened: nextCaption || "Learning moment captured.",
        parentNote: reflection.trim() || null,
        learningArea: learningArea.trim() || null,
        programId: requestedProgramId || null,
        calendarItemId: requestedCalendarItemId || null,
        sourceType: "quick-capture",
        clientSubmissionId: submissionIdRef.current,
        includeInPortfolio: true,
        includeInReport: true,
      });
      persistedEntry = result.entry;
      captureSavedRef.current = true;
      if (sessionDraftKey) clearQuickCaptureSessionDraft(sessionDraftKey);

      trackProductEvent("quick_capture_saved", { area: "quick_capture", route: pathname, hasLearner: true, hasImage: Boolean(attachments.photoFile), hasCaption: Boolean(nextCaption), hasLearningArea: Boolean(learningArea.trim()) }, user?.id);
      trackCoreJourneyEvent(
        "capture_save_succeeded",
        {
          area: "quick_capture",
          route: pathname,
          hasLearner: true,
          hasAttachment: attachments.hasSelectedAttachments,
          includeInPortfolio: result.entry.includeInPortfolio,
          includeInReport: result.entry.includeInReport,
          sourceSurface: "quick_capture",
          captureMode: "quick",
          isEdit: false,
        },
        user?.id,
      );
      if (attachments.hasSelectedAttachments) {
        try {
          const uploaded = await attachments.uploadSelectedAttachments({
            familyProfileId: workspace.profile.id,
            studentId: result.entry.learnerId,
            evidenceId: result.entry.id,
            setPhase: setSavePhase,
          });
          setSavedPhotoAttached(Boolean(uploaded.length));
          if (uploaded.length && !attachmentFinalisedRef.current) {
            trackCoreJourneyEvent(
              "capture_attachment_finalised",
              {
                area: "quick_capture",
                route: pathname,
                sourceSurface: "quick_capture",
                attachmentCategory: captureAttachmentCategory(uploaded),
                isEdit: false,
              },
              user?.id,
            );
            attachmentFinalisedRef.current = true;
          }
        } catch (uploadError) {
          setPhotoUploadError(
            `${uploadError instanceof Error ? uploadError.message : "The learning moment was saved, but the attachment needs another try."} ${attachmentRecoveryMessage(networkHint)}`,
          );
          trackCoreJourneyEvent(
            "capture_attachment_upload_failed",
            {
              area: "quick_capture",
              route: pathname,
              hasAttachment: true,
              failureStage: "upload",
              onlineHint: networkHint,
            },
            user?.id,
          );
        }
      }
      setSavedEntry(result.entry);
      setSavePhase("Learning saved");
      setStatus("");
      // Creating evidence already notifies the Coach refresh subscriber. Keep the
      // receipt local and visible while that secondary workspace refresh runs.
    } catch (saveError) {
      if (persistedEntry) {
        setSavedEntry(persistedEntry);
        setSavePhase("Learning saved");
        setStatus(
          "Learning saved. We could not refresh this page yet; your entered content has not been discarded.",
        );
        trackCoreJourneyEvent(
          "capture_finalise_failed",
          {
            area: "quick_capture",
            route: pathname,
            hasAttachment: attachments.hasSelectedAttachments,
            failureStage: "finalise",
            onlineHint: networkHint,
          },
          user?.id,
        );
        return;
      }
      setSavePhase("");
      setError(
        `${normalizeCleanErrorMessage(saveError, "We could not save this learning moment.")} ${captureRecoveryMessage(networkHint)}`,
      );
      trackProductEvent("quick_capture_save_failed", { area: "quick_capture", route: pathname, hasLearner: Boolean(learnerId), hasImage: Boolean(attachments.photoFile), hasCaption: Boolean(nextCaption) }, user?.id);
      trackCoreJourneyEvent(
        "capture_save_failed",
        {
          area: "quick_capture",
          route: pathname,
          hasLearner: Boolean(learnerId),
          hasAttachment: attachments.hasSelectedAttachments,
          sourceSurface: "quick_capture",
          captureMode: "quick",
          isEdit: false,
          failureStage: "save",
          onlineHint: networkHint,
        },
        user?.id,
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function retryPhotoUpload() {
    if (!savedEntry || !attachments.hasSelectedAttachments || submitting) return;
    setSubmitting(true);
    setPhotoUploadError("");
    trackCoreJourneyEvent(
      "capture_attachment_retry",
      {
        area: "quick_capture",
        route: pathname,
        hasAttachment: true,
        onlineHint: networkHint,
      },
      user?.id,
    );
    try {
      const uploaded = await attachments.uploadSelectedAttachments({
        familyProfileId: workspace.profile?.id ?? "",
        studentId: savedEntry.learnerId,
        evidenceId: savedEntry.id,
        setPhase: setSavePhase,
      });
      setSavedPhotoAttached(Boolean(uploaded.length));
      if (uploaded.length && !attachmentFinalisedRef.current) {
        trackCoreJourneyEvent(
          "capture_attachment_finalised",
          {
            area: "quick_capture",
            route: pathname,
            sourceSurface: "quick_capture",
            attachmentCategory: captureAttachmentCategory(uploaded),
            isEdit: false,
          },
          user?.id,
        );
        attachmentFinalisedRef.current = true;
      }
      setSavePhase("Learning saved");
      setStatus("Attachment attached to the saved learning moment.");
    } catch (retryError) {
      setSavePhase("Learning saved");
      setPhotoUploadError(
        `${retryError instanceof Error ? retryError.message : "The attachment could not be attached yet."} ${attachmentRecoveryMessage(networkHint)}`,
      );
    } finally {
      setSubmitting(false);
    }
  }

  function trackPrimaryHandoff() {
    if (!successHandoff?.portfolioHref) return;
    trackCoreJourneyEvent(
      "view_in_portfolio_selected",
      {
        area: "quick_capture",
        route: pathname,
        destination: "portfolio",
        returnKind: successHandoff.returnKind,
        sourceSurface: "quick_capture",
        hasAttachment: savedPhotoAttached,
      },
      user?.id,
    );
  }

  function addMoreDetail() {
    if (!savedEntry) return;
    setQuickCaptureDraft({ learnerId: savedEntry.learnerId, observedOn: savedEntry.observedOn, caption: caption.trim(), learningArea: learningArea.trim(), photoFile: attachments.photoFile });
    const basePath = pathname.startsWith("/clean-my-capture") ? "/clean-my-capture" : "/my-capture";
    const params = new URLSearchParams({ learner_id: savedEntry.learnerId, observed_on: savedEntry.observedOn, quickDraft: "1", returnTo: returnPath });
    router.push(`${basePath}?${params.toString()}`);
  }

  function captureAnother() {
    if (sessionDraftKey) clearQuickCaptureSessionDraft(sessionDraftKey);
    setSavedEntry(null);
    setSavedPhotoAttached(false);
    setPhotoUploadError("");
    setSharingOpen(false);
    setLearningAreaOpen(false);
    setCaption("");
    setReflection("");
    setLearningArea("");
    attachments.clearSelectedAttachments();
    setObservedOn(getTodayDate());
    setStatus("");
    setError("");
    submissionIdRef.current = "";
    firstAttachmentTrackedRef.current = false;
  }

  if (workspace.loading) return <V2LoadingState title="Preparing Quick Capture" body="Your family learning space is loading." />;
  if (workspace.schemaMissing || workspace.error) return <section style={{ padding: 20 }}><h1>Quick Capture is unavailable</h1><p>{workspace.error || "Learning evidence is temporarily unavailable. Try again shortly."}</p></section>;
  if (!workspace.profile || workspace.requiresFamilyCreation) return <section style={{ padding: 20 }}><h1>Set up your family workspace</h1><p>Create your family profile before saving a learning moment.</p><Link href="/my-profile">Open My Profile</Link></section>;
  if (!workspace.learners.length) return <section style={{ padding: 20 }}><h1>Add a learner first</h1><p>Quick Capture needs a learner so the private record stays in the right family context.</p><Link href="/my-profile">Add a learner</Link></section>;

  if (savedEntry && sharingOpen) {
    return (
      <main
        id="quick-capture-share-step"
        ref={quickCaptureTopRef}
        tabIndex={-1}
        style={{ minHeight: "calc(100dvh - 72px)", paddingBottom: "calc(92px + env(safe-area-inset-bottom, 0px))", display: "grid", alignContent: "start", gap: 16, maxWidth: 760, margin: "0 auto", outline: "none" }}
      >
        <CoreJourneyCue stage="capture" />
        <div style={{ display: "grid", gap: 6 }}>
          <p style={{ margin: 0, color: "#6c4df6", fontSize: 12, fontWeight: 850, letterSpacing: "0.08em", textTransform: "uppercase" }}>Step 2 — Create your share card</p>
          <p style={{ margin: 0, color: "#5b6478", lineHeight: 1.5 }}>Choose what you want to share from this saved learning moment.</p>
        </div>
        <CleanLearningMomentShareCard
          entry={savedEntry}
          learnerLabel={savedLearnerLabel}
          imageUrl={attachments.photoPreviewUrl || null}
          onClose={() => setSharingOpen(false)}
        />
      </main>
    );
  }

  if (savedEntry) {
    return (
      <main
        className="mylearna-quick-capture-receipt"
        ref={quickCaptureTopRef}
        tabIndex={-1}
        style={{ minHeight: "calc(100dvh - 72px)", paddingBottom: "calc(92px + env(safe-area-inset-bottom, 0px))", display: "grid", alignContent: "start", gap: 16, maxWidth: 760, margin: "0 auto", outline: "none" }}
      >
        <style jsx global>{`
          .mylearna-quick-capture-receipt-primary-actions {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 10px;
          }

          .mylearna-quick-capture-receipt-primary-actions > * {
            width: 100%;
            min-height: 44px;
          }

          @media (max-width: 420px) {
            .mylearna-quick-capture-receipt-primary-actions {
              grid-template-columns: minmax(0, 1fr);
            }
          }
        `}</style>
        <CoreJourneyCue stage="capture" />
        <p role="status" aria-live="polite" style={{ margin: 0, color: "#15803d", fontSize: 14, fontWeight: 850 }}>
          {submitting && savePhase ? savePhase : "Learning saved"}
        </p>
        <section style={{ border: "1px solid #bbf7d0", borderRadius: 20, background: "#f0fdf4", padding: "clamp(18px, 5vw, 30px)", display: "grid", gap: 16 }}>
          <div><p style={{ margin: 0, color: "#15803d", fontSize: 12, fontWeight: 850, letterSpacing: "0.08em", textTransform: "uppercase" }}>Step 1 — Learning moment saved</p><h1 style={{ margin: "6px 0 0", color: "#14532d", fontSize: "clamp(28px, 6vw, 42px)" }}>Learning moment saved</h1></div>
          <div style={{ display: "grid", gap: 6, color: "#166534", lineHeight: 1.55 }}>
            <strong>{savedLearnerLabel}</strong>
            <span>{formatDate(savedEntry.observedOn)}</span>
            {caption.trim() ? <span>{caption.trim()}</span> : null}
            {savedPhotoAttached ? <span>Attachment attached</span> : photoUploadError ? <span style={{ color: "#b45309" }}>Attachment still needs attaching</span> : null}
            {successHandoff?.portfolioMessage ? <span>{successHandoff.portfolioMessage}</span> : null}
            {successHandoff?.reportMessage ? <span>{successHandoff.reportMessage}</span> : null}
          </div>
          {photoUploadError ? <div role="alert" style={{ color: "#92400e", lineHeight: 1.5 }}>{photoUploadError} <button type="button" onClick={() => void retryPhotoUpload()} disabled={submitting} style={{ ...secondaryButtonStyle, minHeight: 44, marginTop: 8 }}>{submitting ? savePhase || "Uploading evidence" : "Retry attachment"}</button></div> : null}
          <div style={{ display: "grid", gap: 12 }}>
            <div className="mylearna-quick-capture-receipt-primary-actions">
              {successHandoff?.returnKind !== "other" ? (
                <Link href={successHandoff?.returnHref ?? returnPath} style={buttonStyle}>
                  {successHandoff?.returnLabel ?? "Return"}
                </Link>
              ) : null}
              {successHandoff?.portfolioHref ? (
                <Link
                  href={successHandoff.portfolioHref}
                  style={successHandoff.returnKind === "other" ? buttonStyle : secondaryButtonStyle}
                  onClick={trackPrimaryHandoff}
                >
                  View in Portfolio
                </Link>
              ) : null}
              <button type="button" onClick={() => setSharingOpen(true)} style={secondaryButtonStyle}>Create a share card</button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center" }}>
              <button type="button" onClick={addMoreDetail} style={tertiaryButtonStyle}>New detailed capture</button>
              {successHandoff?.showCaptureAnother ? <button type="button" onClick={captureAnother} style={tertiaryButtonStyle}>Capture another</button> : null}
              {successHandoff?.returnKind === "other" ? <Link href={successHandoff.returnHref} style={tertiaryButtonStyle}>{successHandoff.returnLabel}</Link> : null}
            </div>
          </div>
        </section>
        {status ? <p role="status" style={{ color: "#166534" }}>{status}</p> : null}
      </main>
    );
  }

  return (
    <main className="mylearna-quick-capture-main" ref={quickCaptureTopRef} tabIndex={-1} style={{ minHeight: "calc(100dvh - 72px)", paddingBottom: "calc(112px + env(safe-area-inset-bottom, 0px))", display: "grid", alignContent: "start", gap: 16, maxWidth: 760, margin: "0 auto", outline: "none" }}>
      <style jsx global>{`.mylearna-quick-capture-main fieldset:first-of-type > div { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)) !important; } @media (max-width: 720px) { .mylearna-quick-capture-main { padding-bottom: calc(var(--mylearna-mobile-bottom-nav-height, 62px) + 112px + env(safe-area-inset-bottom, 0px)) !important; } .mylearna-quick-capture-save-bar { position: fixed !important; left: 0; right: 0; bottom: calc(var(--mylearna-mobile-bottom-nav-height, 62px) + env(safe-area-inset-bottom, 0px) + 8px) !important; z-index: 55; display: grid !important; gap: 8px !important; border-radius: 0 !important; padding: 10px max(12px, env(safe-area-inset-left, 0px)) !important; } .mylearna-quick-capture-save-bar > button { width: 100%; } .mylearna-quick-capture-photo-preview { max-height: 34vh !important; } }`}</style>
      <CoreJourneyCue stage="capture" />
      <section style={{ border: "1px solid #e7eaf2", borderRadius: 20, background: "#ffffff", padding: "clamp(16px, 4vw, 26px)", boxShadow: "0 8px 24px rgba(23,32,75,0.05)", display: "grid", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}><div><p style={{ margin: 0, color: "#6c4df6", fontSize: 12, fontWeight: 850, letterSpacing: "0.08em", textTransform: "uppercase" }}>Quick Capture</p><h1 style={{ margin: "6px 0 0", color: "#17204b", fontSize: "clamp(28px, 7vw, 44px)" }}>Quick Capture</h1><p style={{ margin: "10px 0 0", color: "#5b6478", lineHeight: 1.55 }}>Capture a learning moment now. Start a new detailed capture later.</p>{requestedCalendarItemId ? <p role="note" style={{ margin: "8px 0 0", color: "#475569", lineHeight: 1.45 }}>From your planned learning on {formatDate(observedOn)}{learningArea ? ` · ${learningArea}` : ""}</p> : null}</div><Link href={returnPath} style={{ color: "#17204b", fontWeight: 800 }}>Back</Link></div>
        {restoredDraftNotice ? <p role="status" style={{ margin: 0, color: "#475569", lineHeight: 1.45 }}>{restoredDraftNotice}</p> : null}
        <form
          onSubmit={handleSave}
          onChange={() => {
            captureMeaningfulInputRef.current = true;
          }}
          style={{ display: "grid", gap: 14 }}
        >
          <CleanEvidenceAttachmentControls attachments={attachments} disabled={submitting} compact />
          <label style={{ display: "grid", gap: 6 }}><span style={{ color: "#17204b", fontWeight: 800 }}>Learner</span><select aria-label="Choose learner" value={learnerId} onChange={(event) => setLearnerId(event.target.value)} style={{ minHeight: 46, border: "1px solid #cbd5e1", borderRadius: 12, padding: "0 12px", background: "#ffffff", color: "#17204b", fontWeight: 700 }}>{workspace.learners.map((learner) => <option key={learner.id} value={learner.id}>{learnerLabel(learner)}</option>)}</select></label>
          <label style={{ display: "grid", gap: 6 }}><span style={{ color: "#17204b", fontWeight: 800 }}>Learning date</span><input aria-label="Learning date" type="date" value={observedOn} onChange={(event) => setObservedOn(event.target.value)} style={{ minHeight: 46, border: "1px solid #cbd5e1", borderRadius: 12, padding: "0 12px", font: "inherit" }} /></label>
          <label style={{ display: "grid", gap: 6 }}><span style={{ color: "#17204b", fontWeight: 850 }}>What happened? <span style={{ color: "#5b6478", fontWeight: 500 }}>(optional)</span></span><textarea aria-label="Learning moment caption" value={caption} maxLength={MAX_CAPTION_LENGTH} onChange={(event) => setCaption(event.target.value)} rows={4} placeholder="Add a short caption" style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: 12, padding: "10px 12px", font: "inherit", resize: "vertical" }} /><span style={{ color: "#64748b", fontSize: 12 }}>{caption.length}/{MAX_CAPTION_LENGTH}</span></label>
          <label style={{ display: "grid", gap: 6 }}><span style={{ color: "#17204b", fontWeight: 800 }}>Reflection <span style={{ color: "#5b6478", fontWeight: 500 }}>(optional)</span></span><textarea aria-label="Reflection" value={reflection} onChange={(event) => setReflection(event.target.value)} rows={3} placeholder="What stood out or should you remember?" style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: 12, padding: "10px 12px", font: "inherit", resize: "vertical" }} /></label>
          <div style={{ borderTop: "1px solid #eef0f5", paddingTop: 12 }}><button type="button" onClick={() => setLearningAreaOpen((current) => !current)} aria-expanded={learningAreaOpen} style={{ ...tertiaryButtonStyle, textDecoration: "none", padding: 0 }}>{learningAreaOpen ? "Hide learning area" : "Add learning area"}</button>{learningAreaOpen ? <label style={{ display: "grid", gap: 6, marginTop: 10 }}><span style={{ color: "#17204b", fontWeight: 750 }}>Learning area <span style={{ color: "#5b6478", fontWeight: 500 }}>(optional)</span></span><input aria-label="Learning area" value={learningArea} onChange={(event) => setLearningArea(event.target.value)} maxLength={80} placeholder="For example, Science or Art" style={{ minHeight: 46, border: "1px solid #cbd5e1", borderRadius: 12, padding: "0 12px", font: "inherit" }} /></label> : null}</div>
          <div className="mylearna-quick-capture-save-bar" style={{ position: "sticky", bottom: 8, border: "1px solid #ddd6fe", borderRadius: 16, background: "rgba(250,249,255,0.97)", padding: 12, display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", backdropFilter: "blur(12px)" }}><span role="status" aria-live="polite" style={{ color: savePhase ? "#6c4df6" : "#5b6478", fontSize: 13 }}>{savePhase || "Private to your family · Portfolio on · Reports on"}</span><button type="submit" disabled={submitting} style={{ minHeight: 48, border: "1px solid #6c4df6", borderRadius: 12, background: "#6c4df6", color: "#ffffff", padding: "10px 16px", fontSize: 14, fontWeight: 850, cursor: submitting ? "wait" : "pointer", whiteSpace: "nowrap" }}>{submitting ? savePhase || "Saving learning" : "Save learning moment"}</button></div>
          {networkHint === "offline" ? (
            <p role="status" aria-live="polite" style={{ margin: 0, color: "#92400e", lineHeight: 1.5 }}>
              Your device appears offline. Keep this page open; your entries will stay
              here. Reconnect, then choose Save again. Automatic background sync is not
              available.
            </p>
          ) : null}
          {error ? <p role="alert" style={{ margin: 0, color: "#b91c1c", lineHeight: 1.5 }}>{error}</p> : null}
          <CoreJourneyHelp>
            <p>
              A photo or short caption is enough. Reflection and learning area are
              optional. Saved moments stay private to your family and can contribute to
              Portfolio and Reports.
            </p>
          </CoreJourneyHelp>
        </form>
      </section>
    </main>
  );
}
