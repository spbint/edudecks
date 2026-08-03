"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuthUser } from "@/app/components/AuthUserProvider";
import {
  FAMILY_EVIDENCE_STORAGE_BUCKET,
} from "@/lib/familyEvidence";
import { supabase } from "@/lib/supabaseClient";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import {
  buildLearningMomentShareFilename,
  buildLearningMomentShareText,
  canUseNativeLearningMomentShare,
  LEARNING_MOMENT_INVITATION_URL,
  renderLearningMomentShareCard,
  sanitizePublicCaption,
  type LearningMomentShareFormat,
} from "@/lib/clean/evidence/learningMomentShareCard";
import { trackProductEvent } from "@/lib/clean/analytics/productAnalytics";

type CleanLearningMomentShareCardProps = {
  entry: Pick<CleanEvidenceEntry, "whatHappened" | "learningArea">;
  learnerLabel?: string | null;
  imageUrl?: string | null;
  imageStoragePath?: string | null;
  onClose?: () => void;
  showTrigger?: boolean;
};

const buttonStyle: React.CSSProperties = {
  minHeight: 44,
  borderRadius: 12,
  border: "1px solid #17204b",
  background: "#17204b",
  color: "#ffffff",
  padding: "9px 13px",
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  borderColor: "#cbd5e1",
  background: "#ffffff",
  color: "#17204b",
};

const checklist = [
  "No school name, uniform or address is visible.",
  "No location or routine is revealed.",
  "I have permission from anyone shown.",
  "I am comfortable sharing this outside MyLearna.",
] as const;

function copyText(value: string) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);

  return new Promise<void>((resolve, reject) => {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      if (!document.execCommand("copy")) throw new Error("Copy was not available.");
      resolve();
    } catch (error) {
      reject(error);
    } finally {
      document.body.removeChild(textarea);
    }
  });
}

export default function CleanLearningMomentShareCard({
  entry,
  learnerLabel,
  imageUrl,
  imageStoragePath,
  onClose,
  showTrigger = false,
}: CleanLearningMomentShareCardProps) {
  const { user } = useAuthUser();
  const [format, setFormat] = useState<LearningMomentShareFormat>("story");
  const [publicCaption, setPublicCaption] = useState(() => sanitizePublicCaption(entry.whatHappened));
  const [includeLearnerName, setIncludeLearnerName] = useState(false);
  const [includeLearningArea, setIncludeLearningArea] = useState(false);
  const [includeHashtag, setIncludeHashtag] = useState(true);
  const [confirmed, setConfirmed] = useState<boolean[]>(() => checklist.map(() => false));
  const [resolvedImageSource, setResolvedImageSource] = useState(imageUrl || null);
  const [cardUrl, setCardUrl] = useState("");
  const [cardFile, setCardFile] = useState<File | null>(null);
  const [nativeShareSupported, setNativeShareSupported] = useState(false);
  const [working, setWorking] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(!showTrigger);

  const allConfirmed = confirmed.every(Boolean);
  const shareText = useMemo(
    () => buildLearningMomentShareText({ caption: publicCaption, includeHashtag }),
    [includeHashtag, publicCaption],
  );

  useEffect(() => {
    let cancelled = false;
    setResolvedImageSource(imageUrl || null);
    if (!imageUrl && imageStoragePath) {
      supabase.storage
        .from(FAMILY_EVIDENCE_STORAGE_BUCKET)
        .createSignedUrl(imageStoragePath, 10 * 60)
        .then(({ data }) => {
          if (!cancelled) setResolvedImageSource(data?.signedUrl || null);
        })
        .catch(() => {
          if (!cancelled) setResolvedImageSource(null);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [imageStoragePath, imageUrl]);

  useEffect(() => {
    if (!open) return;
    trackProductEvent(
      "share_card_opened",
      { area: "sharing", route: "/my-capture", hasImage: Boolean(resolvedImageSource) },
      user?.id,
    );
  }, [open, resolvedImageSource, user?.id]);

  useEffect(() => {
    setNativeShareSupported(
      canUseNativeLearningMomentShare(typeof navigator === "undefined" ? null : navigator, cardFile),
    );
  }, [cardFile]);

  useEffect(() => () => {
    if (cardUrl) URL.revokeObjectURL(cardUrl);
  }, [cardUrl]);

  function updateConfirmation(index: number, value: boolean) {
    setConfirmed((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
    setError("");
  }

  async function createCard() {
    if (!allConfirmed) {
      setError("Confirm each sharing check before creating the card.");
      return;
    }

    setWorking(true);
    setError("");
    setStatus("Creating share card...");
    try {
      const blob = await renderLearningMomentShareCard({
        format,
        imageSource: resolvedImageSource,
        publicCaption,
        learnerLabel,
        learningArea: entry.learningArea,
        includeLearnerName,
        includeLearningArea,
        includeHashtag,
      });
      const nextFile = new File([blob], buildLearningMomentShareFilename(format), { type: "image/png" });
      const nextUrl = URL.createObjectURL(nextFile);
      setCardUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return nextUrl;
      });
      setCardFile(nextFile);
      setStatus("Share card ready. MyLearna does not track what happens after you share externally.");
      trackProductEvent(
        "share_card_created",
        {
          area: "sharing",
          route: "/my-capture",
          format,
          hasImage: Boolean(resolvedImageSource),
          hasCaption: Boolean(publicCaption.trim()),
          includeLearnerName,
          includeLearningArea,
          includeHashtag,
        },
        user?.id,
      );
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "The share card could not be created.");
      setStatus("");
    } finally {
      setWorking(false);
    }
  }

  async function handleNativeShare() {
    if (!cardFile || !canUseNativeLearningMomentShare(navigator, cardFile)) return;
    setError("");
    trackProductEvent(
      "native_share_opened",
      { area: "sharing", route: "/my-capture", format, hasImage: Boolean(resolvedImageSource) },
      user?.id,
    );
    try {
      await navigator.share({
        files: [cardFile],
        text: shareText,
        title: "MyLearna learning moment",
      });
      setStatus("The share sheet closed. Check your chosen app to confirm what you shared.");
    } catch (shareError) {
      if ((shareError as DOMException)?.name === "AbortError") return;
      setError("Native sharing was unavailable. You can download the card or copy the caption and link.");
    }
  }

  function handleDownload() {
    if (!cardUrl) return;
    const anchor = document.createElement("a");
    anchor.href = cardUrl;
    anchor.download = buildLearningMomentShareFilename(format);
    anchor.rel = "noopener";
    anchor.click();
    trackProductEvent("share_card_downloaded", { area: "sharing", route: "/my-capture", format }, user?.id);
    setStatus("Share card downloaded.");
  }

  async function handleCopy() {
    try {
      await copyText(shareText);
      trackProductEvent("share_link_copied", { area: "sharing", route: "/my-capture", format }, user?.id);
      setStatus("Caption and MyLearna link copied.");
    } catch {
      setError("Copy was not available. You can select the text below instead.");
    }
  }

  if (showTrigger && !open) {
    return <button type="button" style={secondaryButtonStyle} onClick={() => setOpen(true)}>Create a share card</button>;
  }

  return (
    <section
      role="dialog"
      aria-labelledby="learning-moment-share-title"
      style={{ border: "1px solid #ddd6fe", borderRadius: 18, background: "#faf9ff", padding: 18, display: "grid", gap: 16 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div style={{ display: "grid", gap: 5 }}>
          <p style={{ margin: 0, color: "#6c4df6", fontSize: 12, fontWeight: 850, letterSpacing: "0.08em", textTransform: "uppercase" }}>MyLearna Moment</p>
          <h2 id="learning-moment-share-title" style={{ margin: 0, color: "#17204b", fontSize: 22 }}>Create a share card</h2>
          <p style={{ margin: 0, color: "#5b6478", lineHeight: 1.5 }}>Preview exactly what will leave MyLearna. Sharing externally is always your choice.</p>
        </div>
        {onClose || showTrigger ? <button type="button" onClick={() => { setOpen(false); onClose?.(); }} style={secondaryButtonStyle}>Close</button> : null}
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <strong style={{ color: "#17204b" }}>Format</strong>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(["story", "post"] as const).map((option) => (
            <button key={option} type="button" onClick={() => setFormat(option)} style={{ ...secondaryButtonStyle, borderColor: format === option ? "#6c4df6" : "#cbd5e1", background: format === option ? "#f2edff" : "#ffffff" }}>
              {option === "story" ? "Story · 9:16" : "Post · 1:1"}
            </button>
          ))}
        </div>
      </div>

      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ color: "#17204b", fontWeight: 800 }}>Public caption (optional)</span>
        <textarea value={publicCaption} maxLength={180} onChange={(event) => setPublicCaption(event.target.value)} rows={3} style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: 10, padding: "10px 12px", font: "inherit", resize: "vertical" }} />
      </label>

      <div style={{ display: "grid", gap: 8 }}>
        <strong style={{ color: "#17204b" }}>Optional fields</strong>
        <label><input type="checkbox" checked={includeLearnerName} onChange={(event) => setIncludeLearnerName(event.target.checked)} /> Include learner first name or initial</label>
        <label><input type="checkbox" checked={includeLearningArea} onChange={(event) => setIncludeLearningArea(event.target.checked)} /> Include general learning area</label>
        <label><input type="checkbox" checked={includeHashtag} onChange={(event) => setIncludeHashtag(event.target.checked)} /> Include #MyLearnaMoment</label>
      </div>

      <div style={{ display: "grid", gap: 8, borderTop: "1px solid #e7eaf2", paddingTop: 14 }}>
        <strong style={{ color: "#17204b" }}>Before sharing:</strong>
        {checklist.map((item, index) => (
          <label key={item} style={{ display: "flex", gap: 8, alignItems: "flex-start", color: "#334155", lineHeight: 1.45 }}>
            <input type="checkbox" checked={confirmed[index] ?? false} onChange={(event) => updateConfirmation(index, event.target.checked)} />
            <span>{item}</span>
          </label>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" style={buttonStyle} onClick={() => void createCard()} disabled={!allConfirmed || working}>{working ? "Creating..." : "Create share card"}</button>
        {cardFile && nativeShareSupported ? <button type="button" style={secondaryButtonStyle} onClick={() => void handleNativeShare()}>Share from device</button> : null}
        {cardFile ? <button type="button" style={secondaryButtonStyle} onClick={handleDownload}>Download share card</button> : null}
        {cardFile ? <button type="button" style={secondaryButtonStyle} onClick={() => void handleCopy()}>Copy caption and link</button> : null}
      </div>

      {cardUrl ? <div style={{ display: "grid", gap: 8 }}><strong style={{ color: "#17204b" }}>Preview</strong><img src={cardUrl} alt="Preview of the MyLearna share card" style={{ width: "min(100%, 360px)", maxHeight: 520, objectFit: "contain", borderRadius: 14, border: "1px solid #ddd6fe", background: "#ffffff" }} /></div> : null}
      {cardFile ? <p style={{ margin: 0, color: "#5b6478", fontSize: 13, lineHeight: 1.5 }}>Share link: {LEARNING_MOMENT_INVITATION_URL}</p> : null}
      {status ? <p role="status" style={{ margin: 0, color: "#166534", lineHeight: 1.5 }}>{status}</p> : null}
      {error ? <p role="alert" style={{ margin: 0, color: "#b91c1c", lineHeight: 1.5 }}>{error}</p> : null}
    </section>
  );
}
