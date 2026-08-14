"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuthUser } from "@/app/components/AuthUserProvider";
import V2LoadingState from "@/app/components/clean/design-v2/V2LoadingState";
import CleanLearningMomentShareCard from "@/app/components/clean/CleanLearningMomentShareCard";
import { useCleanFamilyWorkspace } from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import { saveUnifiedLearningCapture } from "@/lib/clean/evidence/unifiedCapture";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import { compressCleanEvidenceImage } from "@/lib/clean/evidence/imagePreparation";
import {
  CLEAN_CAPTURE_FILE_ACCEPT,
  CLEAN_CAPTURE_MAX_FILE_BYTES,
  CLEAN_CAPTURE_MAX_IMAGE_BYTES,
  isSupportedCleanCaptureFile,
} from "@/lib/clean/evidence/attachmentPolicy";
import {
  updateFamilyEvidenceEntryAttachments,
  uploadFamilyEvidenceFiles,
  type UploadedFamilyEvidenceFile,
} from "@/lib/familyEvidence";
import { normalizeCleanErrorMessage } from "@/lib/clean/family/client";
import { setQuickCaptureDraft } from "@/lib/clean/evidence/quickCaptureDraft";
import { trackProductEvent } from "@/lib/clean/analytics/productAnalytics";
import { requestCoachStateRefresh } from "@/lib/clean/coach/coachRefresh";

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
  minHeight: 36,
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

const visuallyHiddenInputStyle: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
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

function safeReturnPath(value: string | null | undefined, fallback: string) {
  const normalized = String(value ?? "").trim();
  return normalized.startsWith("/") && !normalized.startsWith("//") ? normalized : fallback;
}

async function finalisePhotoAttachment(evidenceId: string, uploaded: UploadedFamilyEvidenceFile[]) {
  const result = await updateFamilyEvidenceEntryAttachments({
    evidenceId,
    attachmentUrls: uploaded.map((attachment) => ({
      path: attachment.path,
      name: attachment.label,
      mimeType: attachment.mimeType,
      size: attachment.size,
      kind: attachment.kind,
    })),
    imageUrl: uploaded.find((attachment) => attachment.kind === "image")?.path ?? null,
    fileUrl: uploaded.find((attachment) => attachment.kind === "file")?.path ?? null,
  });

  const storedText = result.attachmentUrls.join("\n");
  const missing = uploaded.find((attachment) => !storedText.includes(attachment.path) && result.imageUrl !== attachment.path);
   if (missing) throw new Error("Evidence attachment update did not confirm the uploaded attachment reference.");
  return result;
}

export default function CleanQuickCaptureWorkspace() {
  const workspace = useCleanFamilyWorkspace();
  const { user } = useAuthUser();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedLearnerId = searchParams.get("learner_id") || searchParams.get("learnerId") || "";
  const returnPath = safeReturnPath(searchParams.get("returnTo"), "/my-day");
  const [learnerId, setLearnerId] = useState(requestedLearnerId);
  const [observedOn, setObservedOn] = useState(getTodayDate);
  const [caption, setCaption] = useState("");
  const [reflection, setReflection] = useState("");
  const [learningArea, setLearningArea] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceFileName, setEvidenceFileName] = useState("");
  const [fileSelectionMessage, setFileSelectionMessage] = useState("No file attached yet.");
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
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const libraryInputRef = useRef<HTMLInputElement | null>(null);
  const submissionIdRef = useRef("");

  const selectedLearner = useMemo(
    () => workspace.learners.find((learner) => learner.id === learnerId) ?? null,
    [learnerId, workspace.learners],
  );
  const savedLearner = savedEntry
    ? workspace.learners.find((learner) => learner.id === savedEntry.learnerId) ?? null
    : null;
  const savedLearnerLabel = savedLearner ? learnerLabel(savedLearner) : "Your learner";

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

  useEffect(() => () => {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
  }, [photoPreviewUrl]);

  useEffect(() => {
    trackProductEvent("quick_capture_opened", { area: "quick_capture", route: pathname, hasLearner: Boolean(learnerId) }, user?.id);
  }, [learnerId, pathname, user?.id]);

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setError("");
    setStatus("");
    if (file && !file.type.startsWith("image/")) {
      setError("Choose an image file for this learning moment.");
      return;
    }
    if (file && file.size > CLEAN_CAPTURE_MAX_IMAGE_BYTES) {
      setError("Choose an image smaller than 10 MB.");
      return;
    }
    setPhotoFile(file);
    setPhotoPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : "";
    });
    if (file) trackProductEvent("quick_capture_photo_selected", { area: "quick_capture", route: pathname, hasImage: true }, user?.id);
    event.currentTarget.value = "";
  }

  function handleEvidenceFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setError("");
    setStatus("");
    if (file && !isSupportedCleanCaptureFile(file)) {
      setError("Choose a PDF, document, or common image file.");
      event.currentTarget.value = "";
      return;
    }
    if (file && file.size > CLEAN_CAPTURE_MAX_FILE_BYTES) {
      setError("Choose a file smaller than 25 MB.");
      event.currentTarget.value = "";
      return;
    }
    setEvidenceFile(file);
    setEvidenceFileName(file?.name ?? "");
    setFileSelectionMessage(file ? "File attached and ready to save." : "No file was selected.");
    event.currentTarget.value = "";
  }

  function removeEvidenceFile() {
    setEvidenceFile(null);
    setEvidenceFileName("");
    setFileSelectionMessage("No file attached yet.");
  }

  function removePhoto() {
    setPhotoFile(null);
    setPhotoPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return "";
    });
    setPhotoUploadError("");
    setError("");
  }

  function replacePhoto() {
    libraryInputRef.current?.click();
  }

  async function uploadEvidenceFiles(entry: CleanEvidenceEntry, files: File[]) {
    if (!workspace.profile) throw new Error("Family workspace is required before uploading attachments.");
    setSavePhase("Uploading attachments...");
    const preparedFiles = await Promise.all(
      files.map((file) => (file.type.startsWith("image/") ? compressCleanEvidenceImage(file) : file)),
    );
    const uploadResult = await uploadFamilyEvidenceFiles({
      familyProfileId: workspace.profile.id,
      studentId: entry.learnerId,
      evidenceId: entry.id,
      files: preparedFiles,
    });
    if (uploadResult.failed.length) {
      throw new Error(uploadResult.failed.map((failure) => `${failure.name}: ${failure.message}`).join(" "));
    }
    setSavePhase("Finalising attachments...");
    await finalisePhotoAttachment(entry.id, uploadResult.uploaded);
    return uploadResult.uploaded;
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || savedEntry || !workspace.profile) return;
    const nextCaption = caption.trim().slice(0, MAX_CAPTION_LENGTH);
    if (!selectedLearner && workspace.learners.length) {
      setError("Choose the learner for this learning moment.");
      return;
    }
    if (!photoFile && !evidenceFile && !nextCaption) {
      setError("Add a photo or a short caption before saving.");
      return;
    }
    if (evidenceFile && !isSupportedCleanCaptureFile(evidenceFile)) {
      setError("Choose a PDF, document, or common image file.");
      return;
    }
    if (evidenceFile && evidenceFile.size > CLEAN_CAPTURE_MAX_FILE_BYTES) {
      setError("Choose a file smaller than 25 MB.");
      return;
    }
    if (!learnerId) {
      setError("Add a learner before saving a learning moment.");
      return;
    }

    setSubmitting(true);
    setSavePhase("Saving learning moment...");
    setError("");
    setStatus("");
    setPhotoUploadError("");
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
        sourceType: "quick-capture",
        clientSubmissionId: submissionIdRef.current,
        includeInPortfolio: true,
        includeInReport: true,
      });

      setSavedEntry(result.entry);
      trackProductEvent("quick_capture_saved", { area: "quick_capture", route: pathname, hasLearner: true, hasImage: Boolean(photoFile), hasCaption: Boolean(nextCaption), hasLearningArea: Boolean(learningArea.trim()) }, user?.id);
      const filesToUpload = [photoFile, evidenceFile].filter(Boolean) as File[];
      if (filesToUpload.length) {
        try {
          const uploaded = await uploadEvidenceFiles(result.entry, filesToUpload);
          setSavedPhotoAttached(Boolean(uploaded.length));
        } catch (uploadError) {
          setPhotoUploadError(uploadError instanceof Error ? uploadError.message : "The learning moment was saved, but the attachment needs another try.");
          trackProductEvent("quick_capture_save_failed", { area: "quick_capture", route: pathname, hasLearner: true, hasImage: Boolean(photoFile), hasFile: Boolean(evidenceFile) }, user?.id);
        }
      }
      setSavePhase("");
      setStatus("");
      await workspace.reload();
      requestCoachStateRefresh("evidence-created", { refreshAlreadyApplied: true });
    } catch (saveError) {
      setError(normalizeCleanErrorMessage(saveError, "We could not save this learning moment. Try again."));
      trackProductEvent("quick_capture_save_failed", { area: "quick_capture", route: pathname, hasLearner: Boolean(learnerId), hasImage: Boolean(photoFile), hasCaption: Boolean(nextCaption) }, user?.id);
    } finally {
      setSubmitting(false);
      setSavePhase("");
    }
  }

  async function retryPhotoUpload() {
    const filesToUpload = [photoFile, evidenceFile].filter(Boolean) as File[];
    if (!savedEntry || !filesToUpload.length || submitting) return;
    setSubmitting(true);
    setPhotoUploadError("");
    try {
      await uploadEvidenceFiles(savedEntry, filesToUpload);
      setSavedPhotoAttached(true);
      setStatus("Attachment attached to the saved learning moment.");
    } catch (retryError) {
      setPhotoUploadError(retryError instanceof Error ? retryError.message : "The attachment could not be attached yet.");
    } finally {
      setSubmitting(false);
      setSavePhase("");
    }
  }

  function addMoreDetail() {
    if (!savedEntry) return;
    setQuickCaptureDraft({ learnerId: savedEntry.learnerId, observedOn: savedEntry.observedOn, caption: caption.trim(), learningArea: learningArea.trim(), photoFile });
    const basePath = pathname.startsWith("/clean-my-capture") ? "/clean-my-capture" : "/my-capture";
    const params = new URLSearchParams({ learner_id: savedEntry.learnerId, observed_on: savedEntry.observedOn, quickDraft: "1", returnTo: returnPath });
    router.push(`${basePath}?${params.toString()}`);
  }

  function captureAnother() {
    setSavedEntry(null);
    setSavedPhotoAttached(false);
    setPhotoUploadError("");
    setSharingOpen(false);
    setLearningAreaOpen(false);
    setCaption("");
    setReflection("");
    setLearningArea("");
    setPhotoFile(null);
    setPhotoPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return "";
    });
    setEvidenceFile(null);
    setEvidenceFileName("");
    setFileSelectionMessage("No file attached yet.");
    setObservedOn(getTodayDate());
    setStatus("");
    setError("");
    submissionIdRef.current = "";
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
        <div style={{ display: "grid", gap: 6 }}>
          <p style={{ margin: 0, color: "#6c4df6", fontSize: 12, fontWeight: 850, letterSpacing: "0.08em", textTransform: "uppercase" }}>Step 2 — Create your share card</p>
          <p style={{ margin: 0, color: "#5b6478", lineHeight: 1.5 }}>Choose what you want to share from this saved learning moment.</p>
        </div>
        <CleanLearningMomentShareCard
          entry={savedEntry}
          learnerLabel={savedLearnerLabel}
          imageUrl={photoPreviewUrl || null}
          onClose={() => setSharingOpen(false)}
        />
      </main>
    );
  }

  if (savedEntry) {
    return (
      <main
        ref={quickCaptureTopRef}
        tabIndex={-1}
        style={{ minHeight: "calc(100dvh - 72px)", paddingBottom: "calc(92px + env(safe-area-inset-bottom, 0px))", display: "grid", alignContent: "start", gap: 16, maxWidth: 760, margin: "0 auto", outline: "none" }}
      >
        <section style={{ border: "1px solid #bbf7d0", borderRadius: 20, background: "#f0fdf4", padding: "clamp(18px, 5vw, 30px)", display: "grid", gap: 16 }}>
          <div><p style={{ margin: 0, color: "#15803d", fontSize: 12, fontWeight: 850, letterSpacing: "0.08em", textTransform: "uppercase" }}>Step 1 — Learning moment saved</p><h1 style={{ margin: "6px 0 0", color: "#14532d", fontSize: "clamp(28px, 6vw, 42px)" }}>Learning moment saved</h1></div>
          <div style={{ display: "grid", gap: 6, color: "#166534", lineHeight: 1.55 }}>
            <strong>{savedLearnerLabel}</strong>
            <span>{formatDate(savedEntry.observedOn)}</span>
            {caption.trim() ? <span>{caption.trim()}</span> : null}
            {savedPhotoAttached ? <span>Attachment attached</span> : photoUploadError ? <span style={{ color: "#b45309" }}>Attachment still needs attaching</span> : null}
            <span>Added to Portfolio</span>
            <span>Included in Reports</span>
          </div>
          {photoUploadError ? <div role="alert" style={{ color: "#92400e", lineHeight: 1.5 }}>{photoUploadError} <button type="button" onClick={() => void retryPhotoUpload()} disabled={submitting} style={{ ...secondaryButtonStyle, minHeight: 38, marginTop: 8 }}>{submitting ? "Trying again..." : "Try attachment again"}</button></div> : null}
          <div style={{ display: "grid", gap: 12 }}>
            <button type="button" onClick={() => setSharingOpen(true)} style={buttonStyle}>Create a share card</button>
            <Link href={`/my-portfolio?learner_id=${encodeURIComponent(savedEntry.learnerId)}&latestEvidenceId=${encodeURIComponent(savedEntry.id)}&source=my-capture`} style={secondaryButtonStyle}>View in Portfolio</Link>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center" }}>
              <button type="button" onClick={addMoreDetail} style={tertiaryButtonStyle}>Add more detail</button>
              <button type="button" onClick={captureAnother} style={tertiaryButtonStyle}>Capture another moment</button>
              <Link href={returnPath} style={tertiaryButtonStyle}>Return</Link>
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
      <section style={{ border: "1px solid #e7eaf2", borderRadius: 20, background: "#ffffff", padding: "clamp(16px, 4vw, 26px)", boxShadow: "0 8px 24px rgba(23,32,75,0.05)", display: "grid", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}><div><p style={{ margin: 0, color: "#6c4df6", fontSize: 12, fontWeight: 850, letterSpacing: "0.08em", textTransform: "uppercase" }}>Quick Capture</p><h1 style={{ margin: "6px 0 0", color: "#17204b", fontSize: "clamp(28px, 7vw, 44px)" }}>Quick Capture</h1><p style={{ margin: "10px 0 0", color: "#5b6478", lineHeight: 1.55 }}>Capture a learning moment now. Add more detail later.</p></div><Link href={returnPath} style={{ color: "#17204b", fontWeight: 800 }}>Back</Link></div>
        <form onSubmit={handleSave} style={{ display: "grid", gap: 14 }}>
          <fieldset style={{ display: "grid", gap: 10, border: 0, padding: 0, margin: 0 }}><legend style={{ color: "#17204b", fontWeight: 850, padding: 0 }}>Add evidence <span style={{ color: "#5b6478", fontWeight: 500, fontSize: 13 }}>(optional)</span></legend><div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}><button type="button" onClick={() => cameraInputRef.current?.click()} style={{ ...secondaryButtonStyle, minHeight: 64, borderColor: "#c4b5fd", background: "#faf9ff" }}>Take a photo</button><button type="button" onClick={() => libraryInputRef.current?.click()} style={{ ...secondaryButtonStyle, minHeight: 64 }}>Choose photo</button><label style={{ ...secondaryButtonStyle, minHeight: 64, display: "inline-flex", textAlign: "center" }}>Upload file<input aria-label="Upload a file" type="file" accept={CLEAN_CAPTURE_FILE_ACCEPT} onChange={handleEvidenceFileChange} style={visuallyHiddenInputStyle} /></label></div><input ref={cameraInputRef} id="quick-capture-camera-input" aria-label="Take a photo" type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} style={visuallyHiddenInputStyle} /><input ref={libraryInputRef} id="quick-capture-library-input" aria-label="Choose a photo from your library" type="file" accept="image/*" onChange={handlePhotoChange} style={visuallyHiddenInputStyle} />{photoPreviewUrl ? <div style={{ display: "grid", gap: 8 }}><img className="mylearna-quick-capture-photo-preview" src={photoPreviewUrl} alt="Selected learning moment" style={{ width: "100%", maxHeight: 320, objectFit: "contain", borderRadius: 14, background: "#f8fafc" }} /><div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}><button type="button" onClick={replacePhoto} style={tertiaryButtonStyle}>Replace photo</button><button type="button" onClick={removePhoto} style={tertiaryButtonStyle}>Remove photo</button></div></div> : null}{evidenceFile ? <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", border: "1px solid #dbeafe", borderRadius: 12, padding: 10, background: "#eff6ff" }}><strong style={{ color: "#1d4ed8", fontSize: 13 }}>File attached: {evidenceFileName}</strong><span style={{ color: "#64748b", fontSize: 12 }}>{fileSelectionMessage}</span><button type="button" onClick={removeEvidenceFile} style={tertiaryButtonStyle}>Remove file</button></div> : <span style={{ color: "#64748b", fontSize: 13 }}>A photo or file is optional. You can save a caption-only moment.</span>}</fieldset>
          <label style={{ display: "grid", gap: 6 }}><span style={{ color: "#17204b", fontWeight: 800 }}>Learner</span><select aria-label="Choose learner" value={learnerId} onChange={(event) => setLearnerId(event.target.value)} style={{ minHeight: 46, border: "1px solid #cbd5e1", borderRadius: 12, padding: "0 12px", background: "#ffffff", color: "#17204b", fontWeight: 700 }}>{workspace.learners.map((learner) => <option key={learner.id} value={learner.id}>{learnerLabel(learner)}</option>)}</select></label>
          <label style={{ display: "grid", gap: 6 }}><span style={{ color: "#17204b", fontWeight: 800 }}>Learning date</span><input aria-label="Learning date" type="date" value={observedOn} onChange={(event) => setObservedOn(event.target.value)} style={{ minHeight: 46, border: "1px solid #cbd5e1", borderRadius: 12, padding: "0 12px", font: "inherit" }} /></label>
          <label style={{ display: "grid", gap: 6 }}><span style={{ color: "#17204b", fontWeight: 850 }}>What happened? <span style={{ color: "#5b6478", fontWeight: 500 }}>(optional)</span></span><textarea aria-label="Learning moment caption" value={caption} maxLength={MAX_CAPTION_LENGTH} onChange={(event) => setCaption(event.target.value)} rows={4} placeholder="Add a short caption" style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: 12, padding: "10px 12px", font: "inherit", resize: "vertical" }} /><span style={{ color: "#64748b", fontSize: 12 }}>{caption.length}/{MAX_CAPTION_LENGTH}</span></label>
          <label style={{ display: "grid", gap: 6 }}><span style={{ color: "#17204b", fontWeight: 800 }}>Reflection <span style={{ color: "#5b6478", fontWeight: 500 }}>(optional)</span></span><textarea aria-label="Reflection" value={reflection} onChange={(event) => setReflection(event.target.value)} rows={3} placeholder="What stood out or should you remember?" style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: 12, padding: "10px 12px", font: "inherit", resize: "vertical" }} /></label>
          <div style={{ borderTop: "1px solid #eef0f5", paddingTop: 12 }}><button type="button" onClick={() => setLearningAreaOpen((current) => !current)} aria-expanded={learningAreaOpen} style={{ ...tertiaryButtonStyle, textDecoration: "none", padding: 0 }}>{learningAreaOpen ? "Hide learning area" : "Add learning area"}</button>{learningAreaOpen ? <label style={{ display: "grid", gap: 6, marginTop: 10 }}><span style={{ color: "#17204b", fontWeight: 750 }}>Learning area <span style={{ color: "#5b6478", fontWeight: 500 }}>(optional)</span></span><input aria-label="Learning area" value={learningArea} onChange={(event) => setLearningArea(event.target.value)} maxLength={80} placeholder="For example, Science or Art" style={{ minHeight: 46, border: "1px solid #cbd5e1", borderRadius: 12, padding: "0 12px", font: "inherit" }} /></label> : null}</div>
          <div className="mylearna-quick-capture-save-bar" style={{ position: "sticky", bottom: 8, border: "1px solid #ddd6fe", borderRadius: 16, background: "rgba(250,249,255,0.97)", padding: 12, display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", backdropFilter: "blur(12px)" }}><span role="status" style={{ color: savePhase ? "#6c4df6" : "#5b6478", fontSize: 13 }}>{savePhase || "Private to your family · Portfolio on · Reports on"}</span><button type="submit" disabled={submitting} style={{ minHeight: 48, border: "1px solid #6c4df6", borderRadius: 12, background: "#6c4df6", color: "#ffffff", padding: "10px 16px", fontSize: 14, fontWeight: 850, cursor: submitting ? "wait" : "pointer", whiteSpace: "nowrap" }}>{submitting ? savePhase || "Saving..." : "Save learning moment"}</button></div>
          {error ? <p role="alert" style={{ margin: 0, color: "#b91c1c", lineHeight: 1.5 }}>{error}</p> : null}
        </form>
      </section>
    </main>
  );
}
