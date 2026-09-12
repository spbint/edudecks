"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { useAuthUser } from "@/app/components/AuthUserProvider";
import CleanFirstRunSetupGate from "@/app/components/clean/setup/CleanFirstRunSetupGate";
import { useMobileCompanion } from "@/app/components/clean/design-v2/useMobileCompanion";
import CleanMiniCalendarNavigator from "@/app/components/clean/CleanMiniCalendarNavigator";
import { CleanFeedbackPrompt } from "@/app/components/clean/CleanPersonalisationCards";
import { useCleanFamilyWorkspace } from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import {
  GuidanceSetupNextAction,
} from "@/app/components/clean/guidance/GuidanceToggle";
import {
  createCleanCalendarItem,
  listCleanCalendarItems,
  updateCleanCalendarItem,
} from "@/lib/clean/calendar/client";
import type { CleanCalendarItem } from "@/lib/clean/calendar/types";
import {
  listCleanEvidenceEntries,
  subscribeToCleanEvidenceChanges,
} from "@/lib/clean/evidence/client";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import { normalizeCleanErrorMessage } from "@/lib/clean/family/client";
import {
  listCleanProgramSegments,
  listCleanPrograms,
} from "@/lib/clean/programs/client";
import type {
  CleanProgram,
  CleanProgramSegment,
} from "@/lib/clean/programs/types";
import { listCleanLearningPeriods } from "@/lib/clean/terms/client";
import {
  buildCleanPlanningCacheKey,
  clearCleanPlanningCalendarItemsRequest,
  getOrCreateCleanPlanningCalendarItemsRequest,
  readCleanPlanningCalendarItems,
  writeCleanPlanningCalendarItems,
} from "@/lib/clean/planning/cache";
import {
  deriveCleanMyDayPresentationState,
  type CleanMyDayPresentationState,
} from "@/lib/clean/setup/setupStatus";
import { trackProductEvent } from "@/lib/clean/analytics/productAnalytics";
import { PUBLIC_PATHWAYS_ENABLED } from "@/lib/clean/publicVisibility";
import { buildLearnerContextHref } from "@/lib/clean/learners/learnerContextHref";
import {
  addPathwayStepToLearningQueue,
  addCustomLearningResource,
  createCustomLearningOnDeck,
  hasLearningQueueItemForStep,
  listLearningQueueItems,
  moveLearningQueueItem,
  removeLearningQueueItem,
  removeCustomLearningResource,
} from "@/lib/clean/onDeck/client";
import { isAllowedResourcePdf, openCustomLearningPdf, resourceFileSizeLabel, uploadCustomLearningPdf } from "@/lib/clean/onDeck/resourceFiles";
import {
  resolveOnDeckItem,
  sortLearningQueueItems,
  type LearningQueueItem,
  type OnDeckResolvedItem,
} from "@/lib/clean/onDeck/learningQueue";
import {
  beginCleanPlanningTiming,
  recordCleanPlanningMilestone,
} from "@/lib/clean/performance/planningTiming";
import { withCleanPlanningTimeout } from "@/lib/clean/planning/withTimeout";
import { getCleanDayCoreState } from "@/lib/clean/planning/dayCoreState";
import {
  getRecoverableLearningItems,
  type RecoverableLearningItem,
} from "@/lib/clean/recovery/recoverMyWeek";
import {
  clearLearnerHelpRequest,
  listActiveLearnerHelpRequests,
} from "@/lib/clean/learnerHelp/client";
import type { LearnerHelpRequest } from "@/lib/clean/learnerHelp/types";

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #f8fafc 0%, #fdfefe 45%, #f8fafc 100%)",
  padding: "clamp(14px, 3vw, 22px) clamp(10px, 3vw, 16px) 36px",
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 980,
  margin: "0 auto",
  display: "grid",
  gap: 14,
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  background: "#ffffff",
  padding: 18,
  boxShadow: "0 8px 22px rgba(15,23,42,0.04)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
};

const compactInputStyle: React.CSSProperties = {
  ...inputStyle,
  width: "min(260px, 100%)",
  minHeight: 40,
  padding: "9px 12px",
  fontSize: 13,
  background: "#ffffff",
  color: "#0f172a",
  lineHeight: 1.3,
};

const secondaryButtonStyle: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  borderRadius: 10,
  padding: "9px 12px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const overviewPillStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 10px",
  borderRadius: 999,
  border: "1px solid #dbeafe",
  background: "#ffffff",
  color: "#334155",
  fontSize: 13,
  fontWeight: 600,
};

const blockMetaPillStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "5px 9px",
  borderRadius: 999,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  color: "#475569",
  fontSize: 12,
  fontWeight: 600,
};

const primaryButtonStyle: React.CSSProperties = {
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
  borderRadius: 12,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

const quickAddCardStyle: React.CSSProperties = {
  border: "1px solid #dbeafe",
  borderRadius: 18,
  background: "#f8fbff",
  padding: 18,
  display: "grid",
  gap: 14,
};

const COMMON_LEARNING_AREAS = [
  "English",
  "Mathematics",
  "Science",
  "Humanities and Social Sciences",
  "The Arts",
  "Languages",
  "Health and Physical Education",
  "Technologies",
];

function getTodayDate() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function addDays(dateValue: string, dayOffset: number) {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  date.setDate(date.getDate() + dayOffset);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function getWeekStart(dateValue = getTodayDate()) {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return getTodayDate();
  const weekday = date.getDay();
  const diff = weekday === 0 ? -6 : 1 - weekday;
  date.setDate(date.getDate() + diff);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function formatTodayHeading(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTimeLabel(value: string | null) {
  if (!value) return "Any time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function toTimestampFromDateAndTime(dateValue: string, timeValue: string) {
  const time = String(timeValue ?? "").trim();
  if (!time) return null;
  const localDate = new Date(`${dateValue}T${time}:00`);
  if (Number.isNaN(localDate.getTime())) return null;
  return localDate.toISOString();
}

function downloadPdf(bytes: Uint8Array, filename: string) {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const blob = new Blob([buffer], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.click();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}

function getLearnerLabel(firstName: string, preferredName: string | null) {
  return preferredName || firstName;
}

function getPreviewText(value: string | null, maxLength = 110) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}...`;
}

function isValidDateValue(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime());
}

function AddCustomLearningSection({
  learnerOptions,
  defaultLearnerId,
  compact = false,
  onCreated,
}: {
  learnerOptions: Array<{ value: string; label: string }>;
  defaultLearnerId: string;
  compact?: boolean;
  onCreated: (input: { learnerId: string; title: string; learningArea: string | null; note: string | null; resource: { resourceType: "web_link" | "reference" | "file"; label: string | null; value: string; file?: File | null } | null }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [customLearnerId, setCustomLearnerId] = useState(defaultLearnerId);
  const [title, setTitle] = useState("");
  const [learningArea, setLearningArea] = useState("");
  const [note, setNote] = useState("");
  const [resourceType, setResourceType] = useState<"web_link" | "reference" | "file">("web_link");
  const [resourceLabel, setResourceLabel] = useState("");
  const [resourceValue, setResourceValue] = useState("");
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!customLearnerId || !learnerOptions.some((option) => option.value === customLearnerId)) {
      setCustomLearnerId(defaultLearnerId);
    }
  }, [customLearnerId, defaultLearnerId, learnerOptions]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!customLearnerId) { setError("Choose a learner before adding learning."); return; }
    if (!cleanTitle) { setError("Add a title before putting learning On Deck."); return; }
    setSaving(true);
    setError(null);
    try {
      const hasResource = resourceType === "file" ? Boolean(resourceFile) : Boolean(resourceValue.trim());
      await onCreated({ learnerId: customLearnerId, title: cleanTitle, learningArea: learningArea.trim() || null, note: note.trim() || null, resource: hasResource ? { resourceType, label: resourceLabel.trim() || null, value: resourceValue.trim(), file: resourceFile } : null });
      setTitle(""); setLearningArea(""); setNote(""); setResourceLabel(""); setResourceValue(""); setResourceFile(null); setOpen(false);
    } catch (reason) {
      setError(normalizeCleanErrorMessage(reason, "We could not add this learning to On Deck."));
    } finally { setSaving(false); }
  }

  const input = { ...inputStyle, minHeight: compact ? 42 : 44 };
  return (
    <section aria-labelledby={compact ? "mobile-add-learning-title" : "add-learning-title"} style={{ ...quickAddCardStyle, padding: compact ? 14 : 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <p style={{ margin: 0, color: "#2563eb", fontSize: 12, fontWeight: 850, letterSpacing: "0.08em", textTransform: "uppercase" }}>Add learning</p>
          <h2 id={compact ? "mobile-add-learning-title" : "add-learning-title"} style={{ margin: 0, color: "#17204b", fontSize: compact ? 16 : 20 }}>Bring your own learning into focus.</h2>
        </div>
        <button type="button" onClick={() => { setOpen((value) => !value); setError(null); }} style={secondaryButtonStyle}>{open ? "Close" : "Add learning"}</button>
      </div>
      {open ? <form onSubmit={(event) => void submit(event)} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6, color: "#0f172a", fontSize: 13, fontWeight: 700 }}>Learner<select required aria-label="Learner" value={customLearnerId} onChange={(event) => setCustomLearnerId(event.target.value)} style={input}><option value="">Choose a learner</option>{learnerOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label style={{ display: "grid", gap: 6, color: "#0f172a", fontSize: 13, fontWeight: 700 }}>Title<input required aria-label="Title" value={title} onChange={(event) => setTitle(event.target.value)} style={input} placeholder="Read Chapter 4 — The Hobbit" autoFocus /></label>
        <label style={{ display: "grid", gap: 6, color: "#0f172a", fontSize: 13, fontWeight: 700 }}>Learning area (optional)<input aria-label="Learning area" value={learningArea} onChange={(event) => setLearningArea(event.target.value)} list="clean-my-day-learning-areas" style={input} placeholder="English" /></label>
        <label style={{ display: "grid", gap: 6, color: "#0f172a", fontSize: 13, fontWeight: 700 }}>Note (optional)<textarea aria-label="Note" value={note} onChange={(event) => setNote(event.target.value)} style={{ ...input, minHeight: 76, resize: "vertical" }} placeholder="A short note for this learning" /></label>
        <fieldset style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, display: "grid", gap: 10 }}><legend style={{ padding: "0 4px", color: "#0f172a", fontSize: 13, fontWeight: 700 }}>Resource (optional)</legend><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 650 }}><input type="radio" name={compact ? "mobile-resource-type" : "resource-type"} checked={resourceType === "web_link"} onChange={() => setResourceType("web_link")} /> Web link</label><label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 650 }}><input type="radio" name={compact ? "mobile-resource-type" : "resource-type"} checked={resourceType === "reference"} onChange={() => setResourceType("reference")} /> Book / reference</label></div><label style={{ display: "grid", gap: 6, color: "#0f172a", fontSize: 13, fontWeight: 700 }}>{resourceType === "web_link" ? "URL" : "Book, curriculum or resource"}<input aria-label={resourceType === "web_link" ? "URL" : "Book, curriculum or resource"} value={resourceValue} onChange={(event) => setResourceValue(event.target.value)} style={input} placeholder={resourceType === "web_link" ? "https://example.com/lesson" : "The Hobbit — Chapter 5"} /></label>{resourceType === "web_link" ? <label style={{ display: "grid", gap: 6, color: "#0f172a", fontSize: 13, fontWeight: 700 }}>Label (optional)<input aria-label="Resource label" value={resourceLabel} onChange={(event) => setResourceLabel(event.target.value)} style={input} placeholder="Fractions lesson" /></label> : null}</fieldset>
        <button type="button" onClick={() => setResourceType("file")} style={{ ...secondaryButtonStyle, width: "fit-content" }}>PDF file</button>
        {resourceType === "file" ? <div style={{ display: "grid", gap: 6 }}><label style={{ display: "grid", gap: 6, color: "#0f172a", fontSize: 13, fontWeight: 700 }}>Choose PDF<input type="file" accept="application/pdf,.pdf" onChange={(event) => setResourceFile(event.target.files?.[0] || null)} /></label>{resourceFile ? <span style={{ fontSize: 13, overflowWrap: "anywhere" }}>{resourceFile.name} · {resourceFileSizeLabel(resourceFile.size)}</span> : null}<span style={{ color: "#64748b", fontSize: 12 }}>PDF only · up to 25 MB</span></div> : null}
        {error ? <div role="alert" style={{ color: "#b91c1c", fontSize: 13 }}>{error}</div> : null}
        <button type="submit" disabled={saving} style={{ ...primaryButtonStyle, width: "fit-content" }}>{saving ? "Saving..." : "Put On Deck"}</button>
      </form> : null}
    </section>
  );
}

function CustomResourceControls({
  item,
  onAddResource,
  onRemoveResource,
  onUploadPdf,
}: {
  item: LearningQueueItem;
  onAddResource: (input: { customLearningItemId: string; resourceType: "web_link" | "reference"; label: string | null; value: string }) => Promise<void>;
  onRemoveResource: (resourceId: string) => Promise<void>;
  onUploadPdf: (customLearningItemId: string, file: File) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [resourceType, setResourceType] = useState<"web_link" | "reference">("web_link");
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdf, setPdf] = useState<File | null>(null);
  async function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!item.customLearningItemId || !value.trim()) return;
    setBusy(true); setError(null);
    try { await onAddResource({ customLearningItemId: item.customLearningItemId, resourceType, label: label.trim() || null, value: value.trim() }); setValue(""); setLabel(""); setOpen(false); }
    catch (reason) { setError(normalizeCleanErrorMessage(reason, "We could not add this resource.")); }
    finally { setBusy(false); }
  }
  async function uploadPdf() {
    if (!item.customLearningItemId || !pdf) return;
    setBusy(true); setError(null);
    try { await onUploadPdf(item.customLearningItemId, pdf); setPdf(null); }
    catch (reason) { setError(normalizeCleanErrorMessage(reason, "The PDF could not be uploaded. You can try again from Resources.")); }
    finally { setBusy(false); }
  }
  return <div style={{ display: "grid", gap: 7 }}>
    {item.resources.length ? <div style={{ color: "#64748b", fontSize: 13 }}>{item.resources.length} resource{item.resources.length === 1 ? "" : "s"}</div> : null}
    <details open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary style={{ color: "#1d4ed8", cursor: "pointer", fontSize: 13, fontWeight: 800 }}>Resources</summary>
      <div style={{ display: "grid", gap: 8, paddingTop: 8 }}>
        {item.resources.map((resource) => <div key={resource.id} style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", fontSize: 13 }}><span style={{ overflowWrap: "anywhere" }}>{resource.resourceType === "file" ? resource.resourceFileName || resource.label || "PDF file" : resource.label || resource.referenceText || resource.url}</span><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{resource.resourceType === "file" && resource.resourceFilePath ? <button type="button" onClick={() => void openCustomLearningPdf(resource.resourceFilePath!)} style={{ ...secondaryButtonStyle, minHeight: 36, padding: "6px 9px" }}>Open PDF</button> : null}<button type="button" onClick={() => void onRemoveResource(resource.id)} aria-label={`Remove ${resource.resourceType === "file" ? resource.resourceFileName || "PDF file" : "resource"}`} style={{ ...secondaryButtonStyle, minHeight: 36, padding: "6px 9px" }}>Remove</button></div></div>)}
        <form onSubmit={(event) => void add(event)} style={{ display: "grid", gap: 8, borderTop: "1px solid #e2e8f0", paddingTop: 8 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><label style={{ display: "inline-flex", gap: 5, alignItems: "center", fontSize: 13 }}><input type="radio" name={`resource-type-${item.id}`} checked={resourceType === "web_link"} onChange={() => setResourceType("web_link")} /> Web link</label><label style={{ display: "inline-flex", gap: 5, alignItems: "center", fontSize: 13 }}><input type="radio" name={`resource-type-${item.id}`} checked={resourceType === "reference"} onChange={() => setResourceType("reference")} /> Book / reference</label></div>
          <input aria-label={resourceType === "web_link" ? "Resource URL" : "Resource reference"} value={value} onChange={(event) => setValue(event.target.value)} placeholder={resourceType === "web_link" ? "https://example.com/lesson" : "Book or workbook reference"} style={inputStyle} />
          {resourceType === "web_link" ? <input aria-label="Resource label" value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Label (optional)" style={inputStyle} /> : null}
          {error ? <div role="alert" style={{ color: "#b91c1c", fontSize: 13 }}>{error}</div> : null}
          <button type="submit" disabled={busy || !value.trim()} style={{ ...secondaryButtonStyle, width: "fit-content" }}>{busy ? "Saving..." : "Add resource"}</button>
        </form>
        <div style={{ display: "grid", gap: 8, borderTop: "1px solid #e2e8f0", paddingTop: 8 }}><strong style={{ fontSize: 13 }}>PDF file</strong><label style={{ display: "grid", gap: 5, fontSize: 13 }}>Choose PDF<input type="file" accept="application/pdf,.pdf" onChange={(event) => setPdf(event.target.files?.[0] || null)} /></label>{pdf ? <span style={{ fontSize: 13, color: "#475569", overflowWrap: "anywhere" }}>{pdf.name} · {resourceFileSizeLabel(pdf.size)}</span> : null}<span style={{ fontSize: 12, color: "#64748b" }}>PDF only · up to 25 MB</span>{pdf && !isAllowedResourcePdf(pdf) ? <div role="alert" style={{ color: "#b91c1c", fontSize: 13 }}>Choose a PDF file up to 25 MB.</div> : null}<button type="button" disabled={!pdf || !isAllowedResourcePdf(pdf) || busy} onClick={() => void uploadPdf()} style={{ ...secondaryButtonStyle, width: "fit-content" }}>{busy ? "Uploading..." : "Upload PDF"}</button></div>
      </div>
    </details>
  </div>;
}

function OnDeckSection({
  compact = false,
  items,
  learnerLabelById,
  onMove,
  onRemove,
  pathwaysHref,
  whereWeAreHref,
  selectedLearnerId,
  updatingId,
  userId,
  helpRequests = [],
  onClearHelp,
  onAddResource,
  onRemoveResource,
  onUploadPdf,
}: {
  compact?: boolean;
  items: OnDeckResolvedItem[];
  learnerLabelById: Map<string, string>;
  onMove: (itemId: string, learnerId: string, direction: "up" | "down") => void;
  onRemove: (itemId: string) => void;
  pathwaysHref: string;
  whereWeAreHref: string;
  selectedLearnerId: string;
  updatingId: string;
  userId?: string | null;
  helpRequests?: LearnerHelpRequest[];
  onClearHelp?: (requestId: string) => void;
  onAddResource?: (input: { customLearningItemId: string; resourceType: "web_link" | "reference"; label: string | null; value: string }) => Promise<void>;
  onRemoveResource?: (resourceId: string) => Promise<void>;
  onUploadPdf?: (customLearningItemId: string, file: File) => Promise<void>;
}) {
  const actionStyle: React.CSSProperties = {
    minHeight: compact ? 40 : 42,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    padding: compact ? "8px 10px" : "9px 12px",
    fontSize: compact ? 13 : 14,
    fontWeight: 800,
    textDecoration: "none",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#17204b",
    cursor: "pointer",
  };
  const showReorder = selectedLearnerId && items.length > 1;

  return (
    <section
      aria-labelledby={compact ? "mobile-on-deck-title" : "on-deck-title"}
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: compact ? 16 : 18,
        background: "#ffffff",
        padding: compact ? 14 : 18,
        display: "grid",
        gap: 12,
        boxShadow: compact ? "none" : "0 8px 22px rgba(15,23,42,0.04)",
      }}
    >
      <header style={{ display: "grid", gap: 5 }}>
        <p
          style={{
            margin: 0,
            color: "#2563eb",
            fontSize: 12,
            fontWeight: 850,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          On deck
        </p>
        <h2
          id={compact ? "mobile-on-deck-title" : "on-deck-title"}
          style={{ margin: 0, color: "#17204b", fontSize: compact ? 16 : 20 }}
        >
          Keep the next few pieces of learning in focus.
        </h2>
        <p style={{ margin: 0, color: "#64748b", lineHeight: 1.55, fontSize: 14 }}>
          No dates required.
        </p>
        <Link
          href={whereWeAreHref}
          style={{ color: "#1d4ed8", fontSize: 13, fontWeight: 800, width: "fit-content" }}
        >
          See where we are
        </Link>
      </header>

      {!items.length ? (
        <div style={{ display: "grid", gap: 10 }}>
          <p style={{ margin: 0, color: "#475569", lineHeight: 1.55 }}>
            Keep a few pieces of learning in focus without adding them to the calendar.
          </p>
          <Link href={pathwaysHref} style={{ ...actionStyle, width: "fit-content" }}>
            Choose from Pathways
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {items.slice(0, 8).map((resolved, index) => {
            const { item } = resolved;
            const learnerLabel = learnerLabelById.get(item.learnerId) || "Learner";
            const busy = updatingId === item.id;

            return (
              <article
                key={item.id}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 14,
                  background: resolved.available ? "#fbfdff" : "#f8fafc",
                  padding: 12,
                  display: "grid",
                  gap: 10,
                }}
              >
                <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span style={blockMetaPillStyle}>On deck</span>
                    <span style={blockMetaPillStyle}>{resolved.subjectLabel}</span>
                    {selectedLearnerId ? null : (
                      <span style={blockMetaPillStyle}>{learnerLabel}</span>
                    )}
                    {resolved.worksheetAvailable ? (
                      <span style={blockMetaPillStyle}>Worksheet available</span>
                    ) : null}
                    {!resolved.available ? (
                      <span style={blockMetaPillStyle}>Unavailable</span>
                    ) : null}
                  </div>
                  <h3
                    style={{
                      margin: 0,
                      color: "#17204b",
                      fontSize: compact ? 15 : 16,
                      lineHeight: 1.35,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {resolved.title}
                  </h3>
                  {resolved.pathwayLabel || resolved.stageLabel ? (
                    <p style={{ margin: 0, color: "#64748b", fontSize: 13, lineHeight: 1.45 }}>
                      {[resolved.pathwayLabel, resolved.stageLabel].filter(Boolean).join(" / ")}
                    </p>
                  ) : null}
                  {item.sourceType === "custom_learning" && item.customNote ? (
                    <p style={{ margin: 0, color: "#475569", fontSize: 13, lineHeight: 1.5 }}>{item.customNote}</p>
                  ) : null}
                  {item.sourceType === "custom_learning" && onAddResource && onRemoveResource && onUploadPdf ? <CustomResourceControls item={item} onAddResource={onAddResource} onRemoveResource={onRemoveResource} onUploadPdf={onUploadPdf} /> : null}
                  {helpRequests.filter((request) => request.sourceType === "on_deck_item" && request.sourceId === item.id).map((request) => (
                    <div key={request.id} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", color: "#92400e" }}>
                      <strong>{learnerLabel} needs help</strong>
                      {onClearHelp ? <button type="button" onClick={() => onClearHelp(request.id)} style={{ ...actionStyle, color: "#92400e", borderColor: "#fcd34d", background: "#fffbeb" }}>Got it</button> : null}
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  {resolved.href ? (
                    <Link
                      href={resolved.href}
                      onClick={() =>
                        trackProductEvent(
                          "on_deck_item_opened",
                          {
                            subjectKey: item.subjectKey,
                            strandKey: item.strandKey,
                            stageKey: item.stageKey,
                            stepKey: item.stepKey,
                            pathwayStepId: item.pathwayStepId,
                            position: item.position,
                          },
                          userId,
                        )
                      }
                      style={{ ...actionStyle, borderColor: "#6c4df6", background: "#6c4df6", color: "#ffffff" }}
                    >
                      Open step
                    </Link>
                  ) : null}
                  {showReorder ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onMove(item.id, item.learnerId, "up")}
                        disabled={busy || index === 0}
                        aria-label={`Move ${resolved.title} up`}
                        style={{ ...actionStyle, opacity: busy || index === 0 ? 0.55 : 1 }}
                      >
                        Move up
                      </button>
                      <button
                        type="button"
                        onClick={() => onMove(item.id, item.learnerId, "down")}
                        disabled={busy || index === items.length - 1}
                        aria-label={`Move ${resolved.title} down`}
                        style={{ ...actionStyle, opacity: busy || index === items.length - 1 ? 0.55 : 1 }}
                      >
                        Move down
                      </button>
                    </>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    disabled={busy}
                    style={{ ...actionStyle, opacity: busy ? 0.55 : 1 }}
                  >
                    Remove from deck
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function formatRecoveryDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { weekday: "long" });
}

function RecoverMyWeekSection({
  items,
  onDeckItems,
  onKeepInFocus,
  updatingIds,
  error,
}: {
  items: RecoverableLearningItem[];
  onDeckItems: LearningQueueItem[];
  onKeepInFocus: (item: RecoverableLearningItem) => void;
  updatingIds: Set<string>;
  error: { itemId: string; message: string } | null;
}) {
  const [reviewOpen, setReviewOpen] = useState(false);
  if (!items.length) return null;

  return (
    <section
      aria-labelledby="recover-my-week-title"
      style={{
        border: "1px solid #dbeafe",
        borderRadius: 18,
        background: "#f8fbff",
        padding: 18,
        display: "grid",
        gap: 12,
      }}
    >
      <header style={{ display: "grid", gap: 5 }}>
        <p style={{ margin: 0, color: "#2563eb", fontSize: 12, fontWeight: 850, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Recover my week
        </p>
        <h2 id="recover-my-week-title" style={{ margin: 0, color: "#17204b", fontSize: 20 }}>
          Plans change. Choose what still matters.
        </h2>
        <p style={{ margin: 0, color: "#475569", lineHeight: 1.55, fontSize: 14 }}>
          Review unfinished learning from earlier this week and keep anything important in focus without changing your calendar.
        </p>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <p style={{ margin: 0, color: "#334155", fontSize: 13, fontWeight: 750 }}>
            {items.length} unfinished learning item{items.length === 1 ? "" : "s"} this week
          </p>
          <button
            type="button"
            onClick={() => setReviewOpen((current) => !current)}
            aria-expanded={reviewOpen}
            style={{ ...secondaryButtonStyle, color: "#1d4ed8", borderColor: "#bfdbfe" }}
          >
            {reviewOpen ? "Close review" : "Review unfinished learning"}
          </button>
        </div>
      </header>
      {reviewOpen ? <div style={{ display: "grid", gap: 9 }}>
        {items.map(({ calendarItem, registryItem, reason }) => {
          const updating = updatingIds.has(calendarItem.id);
          const alreadyOnDeck = Boolean(
            registryItem &&
              hasLearningQueueItemForStep(
                onDeckItems,
                calendarItem.learnerId || "",
                registryItem.id,
              ),
          );
          return (
            <article key={calendarItem.id} style={{ border: "1px solid #e2e8f0", borderRadius: 14, background: "#ffffff", padding: 12, display: "grid", gap: 8 }}>
              <div style={{ display: "grid", gap: 4 }}>
                <span style={{ color: "#64748b", fontSize: 12, fontWeight: 750 }}>{formatRecoveryDate(calendarItem.plannedDate)}</span>
                <strong style={{ color: "#17204b", fontSize: 15 }}>{calendarItem.title}</strong>
                <span style={{ color: "#64748b", fontSize: 13 }}>
                  {[calendarItem.learningArea, calendarItem.learnerId ? null : "Whole family"].filter(Boolean).join(" · ") || "Learning"}
                </span>
              </div>
              {reason === "pathway-linked" && registryItem ? (
                <button type="button" onClick={() => onKeepInFocus({ calendarItem, registryItem, reason })} disabled={updating} style={{ ...secondaryButtonStyle, width: "fit-content", color: "#1d4ed8", borderColor: "#bfdbfe", opacity: updating ? 0.6 : 1 }}>
                  {alreadyOnDeck ? "✓ On deck" : updating ? "Saving..." : "Keep in focus"}
                </button>
              ) : (
                <p style={{ margin: 0, color: "#64748b", fontSize: 13, lineHeight: 1.45 }}>
                  {reason === "whole-family" ? "This family activity is shown for review, but is not linked to a specific learner Pathway step." : "This activity isn't linked to a Pathway step yet."}
                </p>
              )}
              {error?.itemId === calendarItem.id ? <span role="alert" style={{ color: "#b91c1c", fontSize: 13 }}>{error.message}</span> : null}
            </article>
          );
        })}
      </div> : null}
    </section>
  );
}

type LearnerViewEntryProps = {
  compact?: boolean;
  learnerOptions: Array<{ value: string; label: string }>;
  selectedLearnerId: string;
};

function LearnerViewEntry({ compact = false, learnerOptions, selectedLearnerId }: LearnerViewEntryProps) {
  if (!learnerOptions.length) return null;
  const selectedLearner = learnerOptions.find((option) => option.value === selectedLearnerId);
  const linkStyle: React.CSSProperties = { minHeight: 44, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 11, padding: "10px 12px", fontSize: 14, fontWeight: 800, textDecoration: "none", border: "1px solid #c4b5fd", background: "#ffffff", color: "#5b21b6" };
  const headingId = compact ? "mobile-learner-view-title" : "learner-view-title";
  const description = "Let a learner see today's work and choose what to do next.";
  const sectionStyle: React.CSSProperties = { border: "1px solid #ddd6fe", borderRadius: 14, background: "#fafaff", padding: compact ? 12 : 14, display: "grid", gap: 8, minWidth: compact ? 0 : 280 };
  if (selectedLearner || learnerOptions.length === 1) {
    const learner = selectedLearner ?? learnerOptions[0]!;
    return <section aria-labelledby={headingId} style={sectionStyle}><div><p style={{ margin: 0, color: "#5b21b6", fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>Learner view</p><p id={headingId} style={{ margin: "4px 0 0", color: "#475569", fontSize: 14 }}>{description}</p></div><Link href={`/learner-view?learner_id=${encodeURIComponent(learner.value)}`} style={{ ...linkStyle, width: "fit-content" }}>{selectedLearner ? `Open ${learner.label}'s learner view` : `Open ${learner.label}'s learner view`}</Link></section>;
  }
  return <section aria-labelledby={headingId} style={sectionStyle}><div><p style={{ margin: 0, color: "#5b21b6", fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>Learner view</p><h2 id={headingId} style={{ margin: "4px 0 0", color: "#17204b", fontSize: compact ? 16 : 18 }}>Who is learning?</h2><p style={{ margin: "4px 0 0", color: "#475569", fontSize: 14 }}>{description}</p></div><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{learnerOptions.map((learner) => <Link key={learner.value} href={`/learner-view?learner_id=${encodeURIComponent(learner.value)}`} style={linkStyle}>{`Open ${learner.label}'s learner view`}</Link>)}</div></section>;
}

type MobileTodayContentProps = {
  calendarHref: string;
  completionError: { itemId: string; message: string } | null;
  completionUpdatingIds: Set<string>;
  dateLabel: string;
  hasLearners: boolean;
  isViewingToday: boolean;
  items: CleanCalendarItem[];
  itemsError: string | null;
  itemsLoading: boolean;
  learnerLabelById: Map<string, string>;
  learnerOptions: Array<{ value: string; label: string }>;
  myDayPresentationState: CleanMyDayPresentationState | null;
  recoverItems: RecoverableLearningItem[];
  recoverOnDeckItems: LearningQueueItem[];
  recoverUpdatingIds: Set<string>;
  recoverError: { itemId: string; message: string } | null;
  onKeepRecoveryInFocus: (item: RecoverableLearningItem) => void;
  onCompletionToggle: (item: CleanCalendarItem) => void;
  onLearnerChange: (learnerId: string) => void;
  onDeckItems: OnDeckResolvedItem[];
  helpRequests: LearnerHelpRequest[];
  onClearHelp: (requestId: string) => void;
  onDeckError: string | null;
  onDeckUpdatingId: string;
  onMoveOnDeckItem: (itemId: string, learnerId: string, direction: "up" | "down") => void;
  onRemoveOnDeckItem: (itemId: string) => void;
  onMoveDay: (offset: number) => void;
  onRetry: () => void;
  onToday: () => void;
  pathwaysHref: string;
  whereWeAreHref: string;
  quickCaptureHref: string;
  selectedLearnerId: string;
  selectedLearnerLabel: string | null;
  setupNextAction: { href: string; label: string } | null;
  workspaceError: string | null;
  workspaceLoading: boolean;
  workspaceNeedsFamily: boolean;
  workspaceSchemaMissing: boolean;
  buildItemCaptureHref: (item: CleanCalendarItem) => string;
  defaultCustomLearningLearnerId: string;
  onCreateCustomLearning: (input: { learnerId: string; title: string; learningArea: string | null; note: string | null; resource: { resourceType: "web_link" | "reference" | "file"; label: string | null; value: string; file?: File | null } | null }) => Promise<void>;
  onAddResource: (input: { customLearningItemId: string; resourceType: "web_link" | "reference"; label: string | null; value: string }) => Promise<void>;
  onRemoveResource: (resourceId: string) => Promise<void>;
  onUploadPdf: (customLearningItemId: string, file: File) => Promise<void>;
};

function MobileTodayContent({
  calendarHref,
  completionError,
  completionUpdatingIds,
  dateLabel,
  hasLearners,
  isViewingToday,
  items,
  itemsError,
  itemsLoading,
  learnerLabelById,
  learnerOptions,
  myDayPresentationState,
  recoverItems,
  recoverOnDeckItems,
  recoverUpdatingIds,
  recoverError,
  onKeepRecoveryInFocus,
  onCompletionToggle,
  onLearnerChange,
  onDeckItems,
  helpRequests,
  onClearHelp,
  onDeckError,
  onDeckUpdatingId,
  onMoveOnDeckItem,
  onRemoveOnDeckItem,
  onMoveDay,
  onRetry,
  onToday,
  pathwaysHref,
  whereWeAreHref,
  quickCaptureHref,
  selectedLearnerId,
  selectedLearnerLabel,
  setupNextAction,
  workspaceError,
  workspaceLoading,
  workspaceNeedsFamily,
  workspaceSchemaMissing,
  buildItemCaptureHref,
  defaultCustomLearningLearnerId,
  onCreateCustomLearning,
  onAddResource,
  onRemoveResource,
  onUploadPdf,
}: MobileTodayContentProps) {
  const hasItems = items.length > 0;
  const mobileCardStyle: React.CSSProperties = {
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    background: "#ffffff",
    padding: 14,
    display: "grid",
    gap: 12,
    minWidth: 0,
  };

  const actionStyle: React.CSSProperties = {
    minHeight: 44,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    padding: "10px 12px",
    fontSize: 14,
    fontWeight: 800,
    textDecoration: "none",
  };

  const helpFor = (sourceId: string) => helpRequests.filter(
    (request) => request.sourceType === "calendar_item" && request.sourceId === sourceId,
  );

  return (
    <main
      className="mylearna-mobile-today"
      aria-labelledby="mobile-today-title"
      style={{ maxWidth: 680, margin: "0 auto", display: "grid", gap: 14, minWidth: 0 }}
    >
      <header style={{ display: "grid", gap: 5 }}>
        <h1 id="mobile-today-title" style={{ margin: 0, color: "#17204b", fontSize: 24, lineHeight: 1.15 }}>
          Today
        </h1>
        <p style={{ margin: 0, color: "#64748b", fontSize: 14, fontWeight: 650 }}>
          {dateLabel}
        </p>
      </header>

      <nav aria-label="Today date navigation" style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8, alignItems: "center" }}>
        <button type="button" onClick={() => onMoveDay(-1)} style={{ ...actionStyle, border: "1px solid #cbd5e1", background: "#ffffff", color: "#17204b" }}>
          Yesterday
        </button>
        <button type="button" onClick={onToday} disabled={isViewingToday} style={{ ...actionStyle, border: "1px solid #bfdbfe", background: isViewingToday ? "#eff6ff" : "#ffffff", color: "#1d4ed8", opacity: isViewingToday ? 0.72 : 1 }}>
          Today
        </button>
        <button type="button" onClick={() => onMoveDay(1)} style={{ ...actionStyle, border: "1px solid #cbd5e1", background: "#ffffff", color: "#17204b" }}>
          Tomorrow
        </button>
      </nav>

      {learnerOptions.length > 1 ? (
        <label style={{ display: "grid", gap: 6, color: "#475569", fontSize: 13, fontWeight: 800 }}>
          Learner
          <select
            aria-label="Choose learner for Today"
            value={selectedLearnerId}
            onChange={(event) => onLearnerChange(event.target.value)}
            style={{ minHeight: 44, border: "1px solid #cbd5e1", borderRadius: 11, background: "#ffffff", padding: "0 12px", color: "#17204b", font: "inherit" }}
          >
            <option value="">All learners</option>
            {learnerOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      ) : selectedLearnerLabel ? (
        <p style={{ margin: 0, color: "#475569", fontSize: 14, fontWeight: 700 }}>{selectedLearnerLabel}</p>
      ) : null}

      <LearnerViewEntry compact learnerOptions={learnerOptions} selectedLearnerId={selectedLearnerId} />

      {workspaceLoading ? (
        <section style={mobileCardStyle} aria-live="polite">Loading today&apos;s learning...</section>
      ) : workspaceSchemaMissing ? (
        <section style={mobileCardStyle}>My Day is not ready yet. Finish family setup, then return to Today.</section>
      ) : workspaceError ? (
        <section style={mobileCardStyle} role="alert">{workspaceError}</section>
      ) : workspaceNeedsFamily ? (
        <section style={mobileCardStyle}>Create your family profile first in <Link href="/my-profile">My Profile</Link>.</section>
      ) : !hasLearners ? (
        <section style={mobileCardStyle}>Add a learner first in <Link href="/my-profile">My Profile</Link>.</section>
      ) : (
        <>
          {myDayPresentationState === "SETUP_INCOMPLETE" && setupNextAction ? (
            <section style={mobileCardStyle}>
              <strong style={{ color: "#17204b" }}>Finish the essential family setup.</strong>
              <Link href={setupNextAction.href} style={{ ...actionStyle, border: "1px solid #cbd5e1", background: "#ffffff", color: "#17204b" }}>
                {setupNextAction.label}
              </Link>
            </section>
          ) : null}
          <section aria-labelledby="mobile-today-learning-title" style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
              <h2 id="mobile-today-learning-title" style={{ margin: 0, color: "#17204b", fontSize: 16, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Today&apos;s learning
              </h2>
              {selectedLearnerLabel ? <span style={{ color: "#64748b", fontSize: 13, fontWeight: 700 }}>{selectedLearnerLabel}</span> : null}
            </div>

            {itemsLoading ? <section style={mobileCardStyle} aria-live="polite">Loading today&apos;s learning...</section> : null}
            {itemsError ? (
              <section style={mobileCardStyle} role="alert">
                <span>{itemsError}</span>
                <button
                  type="button"
                  onClick={onRetry}
                  style={{ ...actionStyle, border: "1px solid #cbd5e1", background: "#ffffff", color: "#17204b" }}
                >
                  Try again
                </button>
              </section>
            ) : null}

            {!itemsLoading && !itemsError && hasItems ? items.map((item) => {
              const learnerLabel = learnerLabelById.get(item.learnerId ?? "") || "Whole family";
              const completed = Boolean(item.completedAt);
              const updating = completionUpdatingIds.has(item.id);

              return (
                <article key={item.id} style={{ ...mobileCardStyle, opacity: completed ? 0.72 : 1 }}>
                  <div style={{ display: "grid", gap: 5, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", color: "#64748b", fontSize: 12, fontWeight: 750 }}>
                      <span>{formatTimeLabel(item.startsAt)}</span>
                      {item.learnerId || learnerOptions.length > 1 ? <span>{learnerLabel}</span> : null}
                      {item.learningArea ? <span>{item.learningArea}</span> : null}
                    </div>
                    <h3 style={{ margin: 0, color: "#17204b", fontSize: 16, lineHeight: 1.35, overflowWrap: "anywhere" }}>{item.title}</h3>
                    {completed ? <span role="status" style={{ color: "#166534", fontSize: 13, fontWeight: 800 }}>Done</span> : null}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 8, alignItems: "center" }}>
                    <Link href={buildItemCaptureHref(item)} style={{ ...actionStyle, minWidth: 0, border: "1px solid #6c4df6", background: "#6c4df6", color: "#ffffff" }}>
                      Capture learning
                    </Link>
                    <button
                      type="button"
                      onClick={() => onCompletionToggle(item)}
                      disabled={updating}
                      aria-label={completed ? `Mark ${item.title} not done` : `Mark ${item.title} done`}
                      style={{ ...actionStyle, border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#166534", whiteSpace: "nowrap", opacity: updating ? 0.6 : 1 }}
                    >
                      {updating ? "Saving..." : completed ? "Undo" : "Done"}
                    </button>
                  </div>
                  {completionError?.itemId === item.id ? <span role="alert" style={{ color: "#b91c1c", fontSize: 13 }}>{completionError.message}</span> : null}
                  {helpFor(item.id).map((request) => <div key={request.id} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", color: "#92400e" }}><strong>{learnerLabelById.get(request.learnerId) || "Learner"} needs help</strong><button type="button" onClick={() => onClearHelp(request.id)} style={{ ...actionStyle, border: "1px solid #fcd34d", background: "#fffbeb", color: "#92400e" }}>Got it</button></div>)}
                </article>
              );
            }) : null}
          </section>

          <RecoverMyWeekSection
            items={recoverItems}
            onDeckItems={recoverOnDeckItems}
            onKeepInFocus={onKeepRecoveryInFocus}
            updatingIds={recoverUpdatingIds}
            error={recoverError}
          />

          <AddCustomLearningSection
            compact
            learnerOptions={learnerOptions}
            defaultLearnerId={defaultCustomLearningLearnerId}
            onCreated={onCreateCustomLearning}
          />

          <OnDeckSection
            compact
            items={onDeckItems}
            helpRequests={helpRequests}
            onClearHelp={onClearHelp}
            onAddResource={onAddResource}
            onRemoveResource={onRemoveResource}
            onUploadPdf={onUploadPdf}
            learnerLabelById={learnerLabelById}
            onMove={onMoveOnDeckItem}
            onRemove={onRemoveOnDeckItem}
            pathwaysHref={pathwaysHref}
            whereWeAreHref={whereWeAreHref}
            selectedLearnerId={selectedLearnerId}
            updatingId={onDeckUpdatingId}
            userId={null}
          />

          {onDeckError ? (
            <section style={mobileCardStyle} role="alert">{onDeckError}</section>
          ) : null}

          {!itemsLoading && !itemsError && !hasItems ? (
            <section style={mobileCardStyle}>
              <strong style={{ color: "#17204b" }}>
                {myDayPresentationState === "READY_FOR_FIRST_VALUE" ? "Nothing scheduled yet." : "Nothing scheduled for today yet."}
              </strong>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.5 }}>
                Learning can still happen today. Capture what you do, then return to your calendar when you want to plan.
              </p>
            </section>
          ) : null}

          <div style={{ display: "grid", gap: 8 }}>
            <Link href={quickCaptureHref} style={{ ...actionStyle, border: "1px solid #6c4df6", background: "#6c4df6", color: "#ffffff" }}>
              + Capture learning
            </Link>
            <Link href={calendarHref} style={{ ...actionStyle, border: "1px solid #cbd5e1", background: "#ffffff", color: "#17204b" }}>
              View calendar
            </Link>
          </div>
        </>
      )}
    </main>
  );
}

function CleanDayWorkspaceBody() {
  const workspace = useCleanFamilyWorkspace();
  const mobileCompanion = useMobileCompanion();
  const { user } = useAuthUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedLearnerId, setSelectedLearnerId] = useState("");
  const [items, setItems] = useState<CleanCalendarItem[]>([]);
  const [evidenceEntries, setEvidenceEntries] = useState<CleanEvidenceEntry[]>([]);
  const [onDeckItems, setOnDeckItems] = useState<LearningQueueItem[]>([]);
  const [onDeckError, setOnDeckError] = useState<string | null>(null);
  const [helpRequests, setHelpRequests] = useState<LearnerHelpRequest[]>([]);
  const [helpError, setHelpError] = useState<string | null>(null);
  const [onDeckUpdatingId, setOnDeckUpdatingId] = useState("");
  const [programs, setPrograms] = useState<CleanProgram[]>([]);
  const [programSegments, setProgramSegments] = useState<CleanProgramSegment[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemsResolvedKey, setItemsResolvedKey] = useState<string | null>(null);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [expandedItemIds, setExpandedItemIds] = useState<string[]>([]);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const [quickAddLearnerId, setQuickAddLearnerId] = useState("");
  const [quickAddTime, setQuickAddTime] = useState("");
  const [quickAddLearningArea, setQuickAddLearningArea] = useState("");
  const [quickAddSubmitting, setQuickAddSubmitting] = useState(false);
  const [quickAddError, setQuickAddError] = useState<string | null>(null);
  const [quickAddMessage, setQuickAddMessage] = useState<string | null>(null);
  const [completionUpdatingIds, setCompletionUpdatingIds] = useState<Set<string>>(() => new Set());
  const completionPendingIdsRef = useRef(new Set<string>());
  const [completionError, setCompletionError] = useState<{
    itemId: string;
    message: string;
  } | null>(null);
  const [dailyPlannerDownloading, setDailyPlannerDownloading] = useState(false);
  const [dayReloadNonce, setDayReloadNonce] = useState(0);
  const [recoveryCalendarItems, setRecoveryCalendarItems] = useState<CleanCalendarItem[]>([]);
  const [recoveryLearningPeriods, setRecoveryLearningPeriods] = useState<Awaited<ReturnType<typeof listCleanLearningPeriods>>>([]);
  const [recoveryUpdatingIds, setRecoveryUpdatingIds] = useState<Set<string>>(() => new Set());
  const [recoveryError, setRecoveryError] = useState<{ itemId: string; message: string } | null>(null);
  const dayRequestGenerationRef = useRef(0);
  const dayPrimaryMilestoneRef = useRef<string | null>(null);
  const daySettledMilestoneRef = useRef<string | null>(null);
  const recoveryShownWeekRef = useRef<string | null>(null);
  const firstValueChoiceTrackedRef = useRef(false);
  const [setupStatusReadyOnce, setSetupStatusReadyOnce] = useState(false);
  const helpRequestSourceKey = `${selectedLearnerId}:${items.map((item) => item.id).join(",")}:${onDeckItems.map((item) => item.id).join(",")}`;

  const today = getTodayDate();
  const dayPathBase = pathname.startsWith("/clean-my-day") ? "/clean-my-day" : "/my-day";
  const calendarPathBase = pathname.startsWith("/clean-my-day")
    ? "/clean-my-calendar"
    : "/my-calendar";
  const capturePathBase = pathname.startsWith("/clean-my-day")
    ? "/clean-my-capture"
    : "/my-capture";
  const pathwaysPathBase = pathname.startsWith("/clean-my-day")
    ? "/clean-my-pathways"
    : "/my-pathways";
  const selectedDate = useMemo(() => {
    const candidate = searchParams.get("date");
    return isValidDateValue(candidate) ? candidate : today;
  }, [searchParams, today]);
  const learnerIdFromQuery = searchParams.get("learner_id") || searchParams.get("learnerId") || "";
  const isViewingToday = selectedDate === today;
  const weekStart = getWeekStart(selectedDate);
  const weekEnd = addDays(weekStart, 6);

  const buildDayPath = useMemo(
    () => (dateValue: string) => (dateValue === today ? dayPathBase : `${dayPathBase}?date=${dateValue}`),
    [dayPathBase, today],
  );

  const buildCaptureHref = useMemo(
    () => (item: CleanCalendarItem, evidenceEntryId?: string | null) => {
      const params = new URLSearchParams();

      if (evidenceEntryId) {
        params.set("evidence_entry_id", evidenceEntryId);
      }

      params.set("calendar_item_id", item.id);
      params.set("observed_on", item.plannedDate);
      params.set("returnTo", buildDayPath(selectedDate));

      if (item.learnerId) {
        params.set("learner_id", item.learnerId);
      }

      if (item.programId) {
        params.set("program_id", item.programId);
      }

      if (item.programSegmentId) {
        params.set("program_segment_id", item.programSegmentId);
      }

      return `${capturePathBase}?${params.toString()}`;
    },
    [buildDayPath, capturePathBase, selectedDate],
  );

  const mobileDayReturnHref = useMemo(
    () => buildLearnerContextHref(buildDayPath(selectedDate), selectedLearnerId),
    [buildDayPath, selectedDate, selectedLearnerId],
  );

  const buildMobileItemCaptureHref = useMemo(
    () => (item: CleanCalendarItem) => {
      const params = new URLSearchParams({
        mode: "quick",
        calendar_item_id: item.id,
        observed_on: item.plannedDate,
        returnTo: mobileDayReturnHref,
      });

      if (item.learnerId) params.set("learner_id", item.learnerId);
      if (item.programId) params.set("program_id", item.programId);
      if (item.learningArea) params.set("learning_area", item.learningArea);
      if (item.title) params.set("activity_title", item.title);

      return `${capturePathBase}?${params.toString()}`;
    },
    [capturePathBase, mobileDayReturnHref],
  );

  const handleLearnerChange = useCallback((nextLearnerId: string) => {
    setSelectedLearnerId(nextLearnerId);
    const params = new URLSearchParams(searchParams.toString());
    if (nextLearnerId) {
      params.set("learner_id", nextLearnerId);
    } else {
      params.delete("learner_id");
    }
    params.delete("learnerId");
    router.replace(`${dayPathBase}${params.toString() ? `?${params.toString()}` : ""}`);
  }, [dayPathBase, router, searchParams]);

  const learnerOptions = useMemo(
    () =>
      workspace.learners.map((learner) => ({
        value: learner.id,
        label: getLearnerLabel(learner.firstName, learner.preferredName),
      })),
    [workspace.learners],
  );

  const visibleItems = useMemo(() => {
    if (!selectedLearnerId) return items;
    return items.filter(
      (item) => item.learnerId === selectedLearnerId || item.learnerId === null,
    );
  }, [items, selectedLearnerId]);

  const sortedVisibleItems = useMemo(
    () =>
      [...visibleItems].sort((left, right) => {
        const leftTime = left.startsAt ?? "";
        const rightTime = right.startsAt ?? "";

        if (leftTime && rightTime) {
          return leftTime.localeCompare(rightTime);
        }

        if (leftTime) return -1;
        if (rightTime) return 1;

        return left.title.localeCompare(right.title);
      }),
    [visibleItems],
  );

  const learnerLabelById = useMemo(
    () => new Map(learnerOptions.map((option) => [option.value, option.label])),
    [learnerOptions],
  );

  const programLabelById = useMemo(
    () => new Map(programs.map((program) => [program.id, program.title])),
    [programs],
  );

  const segmentLabelById = useMemo(
    () => new Map(programSegments.map((segment) => [segment.id, segment.title])),
    [programSegments],
  );

  const evidenceByCalendarItemId = useMemo(() => {
    const grouped = new Map<string, CleanEvidenceEntry>();

    for (const entry of evidenceEntries) {
      if (!entry.calendarItemId || grouped.has(entry.calendarItemId)) continue;
      grouped.set(entry.calendarItemId, entry);
    }

    return grouped;
  }, [evidenceEntries]);

  const reloadEvidence = useCallback(async () => {
    if (!workspace.profile || workspace.schemaMissing || workspace.requiresFamilyCreation) {
      return;
    }

    try {
      const nextEvidenceEntries = await listCleanEvidenceEntries(workspace.profile.id, {
        fromDate: selectedDate,
        toDate: selectedDate,
        limit: 60,
      });
      setEvidenceEntries(nextEvidenceEntries);
    } catch {
      // Evidence is secondary to the day plan; retain the current state on refresh failure.
    }
  }, [selectedDate, workspace.profile, workspace.requiresFamilyCreation, workspace.schemaMissing]);

  const learnersInViewCount = useMemo(
    () => new Set(sortedVisibleItems.map((item) => item.learnerId).filter(Boolean)).size,
    [sortedVisibleItems],
  );

  const nextUpcomingItem = useMemo(
    () => {
      if (!sortedVisibleItems.length) return null;

      if (!isViewingToday) {
        return sortedVisibleItems.find((item) => item.startsAt) ?? sortedVisibleItems[0] ?? null;
      }

      const now = new Date();

      return (
        sortedVisibleItems.find((item) => {
          if (!item.startsAt) return false;
          const startsAt = new Date(item.startsAt);
          return !Number.isNaN(startsAt.getTime()) && startsAt >= now;
        }) ?? null
      );
    },
    [isViewingToday, sortedVisibleItems],
  );

  const selectedLearnerLabel = useMemo(
    () => learnerOptions.find((option) => option.value === selectedLearnerId)?.label ?? null,
    [learnerOptions, selectedLearnerId],
  );

  const overviewSummary = `${sortedVisibleItems.length} learning block${sortedVisibleItems.length === 1 ? "" : "s"}`;
  const overviewFocusLabel = selectedLearnerLabel || (learnersInViewCount ? `${learnersInViewCount} learners` : "Whole family");
  const nextUpSummary = nextUpcomingItem
    ? nextUpcomingItem.startsAt
      ? `${nextUpcomingItem.title} at ${formatTimeLabel(nextUpcomingItem.startsAt)}`
      : nextUpcomingItem.title
    : isViewingToday
      ? "Nothing scheduled yet."
      : "Nothing scheduled for this day yet.";
  const nextUpLabel = isViewingToday ? "Next up" : "Looking ahead";

  const quickAddHeading = isViewingToday
    ? "Add to My Day"
    : "Add to My Day";
  const quickAddLead = isViewingToday
    ? "Add one thing for today. You can plan more whenever you need to."
    : "Add one thing for this day. You can plan more whenever you need to.";
  const accountSetup = workspace.setupStatus;
  const quickCaptureLearnerId = selectedLearnerId || accountSetup.activeLearnerId || "";
  const quickCaptureHref = `${capturePathBase}?mode=quick&returnTo=${encodeURIComponent(buildDayPath(selectedDate))}${quickCaptureLearnerId ? `&learner_id=${encodeURIComponent(quickCaptureLearnerId)}` : ""}`;
  const mobileQuickCaptureHref = `${capturePathBase}?mode=quick&returnTo=${encodeURIComponent(mobileDayReturnHref)}${quickCaptureLearnerId ? `&learner_id=${encodeURIComponent(quickCaptureLearnerId)}` : ""}`;
  const defaultQuickAddLearnerId = useMemo(() => {
    if (selectedLearnerId && workspace.learners.some((learner) => learner.id === selectedLearnerId)) {
      return selectedLearnerId;
    }
    if (accountSetup.activeLearnerId && workspace.learners.some((learner) => learner.id === accountSetup.activeLearnerId)) {
      return accountSetup.activeLearnerId;
    }
    return workspace.learners.length === 1 ? workspace.learners[0]?.id || "" : "";
  }, [accountSetup.activeLearnerId, selectedLearnerId, workspace.learners]);
  const canShowMyDayGuidance =
    !workspace.loading &&
    !workspace.setupLoading &&
    Boolean(workspace.profile) &&
    workspace.learners.length > 0;
  const currentPathwayHref = useMemo(
    () =>
      selectedLearnerId
        ? `${pathwaysPathBase}?learnerId=${encodeURIComponent(selectedLearnerId)}`
        : pathwaysPathBase,
    [pathwaysPathBase, selectedLearnerId],
  );
  const resolvedOnDeckItems = useMemo(
    () =>
      sortLearningQueueItems(onDeckItems).map((item) =>
        resolveOnDeckItem(item, pathwaysPathBase),
      ),
    [onDeckItems, pathwaysPathBase],
  );
  const recoverableLearningItems = useMemo(
    () =>
      getRecoverableLearningItems({
        calendarItems: recoveryCalendarItems.filter(
          (item) => !selectedLearnerId || item.learnerId === selectedLearnerId || item.learnerId === null,
        ),
        today,
        weekStart: getWeekStart(today),
        weekEnd: addDays(getWeekStart(today), 6),
        learningPeriods: recoveryLearningPeriods,
      }),
    [recoveryCalendarItems, recoveryLearningPeriods, selectedLearnerId, today],
  );
  const reloadOnDeckItems = useCallback(async () => {
    if (!workspace.profile || workspace.schemaMissing || workspace.requiresFamilyCreation) {
      setOnDeckItems([]);
      setOnDeckError(null);
      return;
    }

    try {
      const nextItems = await listLearningQueueItems(
        workspace.profile.id,
        selectedLearnerId || null,
      );
      setOnDeckItems(nextItems);
      setOnDeckError(null);
    } catch (error) {
      setOnDeckItems([]);
      setOnDeckError(
        normalizeCleanErrorMessage(error, "We could not load On Deck just now."),
      );
    }
  }, [
    selectedLearnerId,
    workspace.profile,
    workspace.requiresFamilyCreation,
    workspace.schemaMissing,
  ]);

  useEffect(() => {
    let active = true;

    void Promise.resolve().then(async () => {
      if (!active) return;
      await reloadOnDeckItems();
    });

    return () => {
      active = false;
    };
  }, [reloadOnDeckItems]);

  useEffect(() => {
    let active = true;

    async function loadRecoveryItems() {
      if (!workspace.profile || workspace.schemaMissing || workspace.requiresFamilyCreation) {
        setRecoveryCalendarItems([]);
        setRecoveryLearningPeriods([]);
        return;
      }

      try {
        const recoveryWeekStart = getWeekStart(today);
        const recoveryWeekEnd = addDays(recoveryWeekStart, 6);
        const [calendarResult, periodsResult] = await Promise.all([
          listCleanCalendarItems(workspace.profile.id, {
            fromDate: recoveryWeekStart,
            toDate: recoveryWeekEnd,
            limit: 100,
          }),
          listCleanLearningPeriods(workspace.profile.id, { limit: 100 }),
        ]);
        if (!active) return;
        setRecoveryCalendarItems(calendarResult);
        setRecoveryLearningPeriods(periodsResult);
      } catch {
        if (!active) return;
        setRecoveryCalendarItems([]);
        setRecoveryLearningPeriods([]);
      }
    }

    void loadRecoveryItems();
    return () => {
      active = false;
    };
  }, [dayReloadNonce, today, workspace.profile, workspace.requiresFamilyCreation, workspace.schemaMissing]);

  useEffect(() => {
    let active = true;
    async function loadHelpRequests() {
      if (!workspace.profile || workspace.schemaMissing || workspace.requiresFamilyCreation || !selectedLearnerId) {
        setHelpRequests([]);
        return;
      }
      try {
        const requests = await listActiveLearnerHelpRequests(workspace.profile.id);
        if (!active) return;
        const calendarIds = new Set(items.filter((item) => !selectedLearnerId || item.learnerId === selectedLearnerId || item.learnerId === null).map((item) => item.id));
        const queueIds = new Set(onDeckItems.filter((item) => !selectedLearnerId || item.learnerId === selectedLearnerId).map((item) => item.id));
        setHelpRequests(requests.filter((request) => (!selectedLearnerId || request.learnerId === selectedLearnerId) && ((request.sourceType === "calendar_item" && calendarIds.has(request.sourceId)) || (request.sourceType === "on_deck_item" && queueIds.has(request.sourceId)))));
        setHelpError(null);
      } catch (error) {
        if (active) setHelpError(normalizeCleanErrorMessage(error, "We could not load help requests just now."));
      }
    }
    void loadHelpRequests();
    return () => { active = false; };
  }, [helpRequestSourceKey, items, onDeckItems, selectedLearnerId, workspace.profile, workspace.requiresFamilyCreation, workspace.schemaMissing]);
  useEffect(() => {
    if (!workspace.learners.length) {
      setSelectedLearnerId("");
      return;
    }

    setSelectedLearnerId((current) => {
      if (learnerIdFromQuery && workspace.learners.some((learner) => learner.id === learnerIdFromQuery)) {
        return learnerIdFromQuery;
      }
      if (current && workspace.learners.some((learner) => learner.id === current)) {
        return current;
      }

      return "";
    });
  }, [learnerIdFromQuery, workspace.learners]);

  useEffect(() => {
    if (!workspace.setupLoading) setSetupStatusReadyOnce(true);
  }, [workspace.setupLoading]);

  useEffect(() => {
    setExpandedItemIds([]);
  }, [selectedDate]);

  useEffect(() => {
    if (!quickAddOpen) return;

    setQuickAddLearnerId((current) => {
      if (current && learnerOptions.some((option) => option.value === current)) {
        return current;
      }

      return defaultQuickAddLearnerId;
    });
  }, [defaultQuickAddLearnerId, learnerOptions, quickAddOpen]);

  useEffect(() => {
    async function loadItems() {
      if (!workspace.profile || workspace.schemaMissing || workspace.requiresFamilyCreation) {
        dayRequestGenerationRef.current += 1;
        setItems([]);
        setItemsResolvedKey(null);
        setEvidenceEntries([]);
        setPrograms([]);
        setProgramSegments([]);
        return;
      }

      const requestGeneration = ++dayRequestGenerationRef.current;
      const selectedDayDataKey = `${workspace.currentUserId}:${workspace.profile.id}:${selectedDate}`;
      const cacheKey = buildCleanPlanningCacheKey({
        userId: workspace.currentUserId,
        familyId: workspace.profile.id,
        route: "day",
        fromDate: selectedDate,
        toDate: selectedDate,
      });
      const cachedItems = readCleanPlanningCalendarItems(cacheKey);
      setItems(cachedItems ?? []);
      setItemsResolvedKey(cachedItems ? selectedDayDataKey : null);
      setEvidenceEntries([]);
      setItemsLoading(!cachedItems || cachedItems.length === 0);
      setItemsError(null);

      const itemsPromise = getOrCreateCleanPlanningCalendarItemsRequest(
        cacheKey,
        () =>
          listCleanCalendarItems(workspace.profile!.id, {
            fromDate: selectedDate,
            toDate: selectedDate,
            limit: 40,
          }),
      );
      const itemsTiming = beginCleanPlanningTiming({
        operation: "my-day-visible-activities",
        criticality: "page-primary",
        gatesPage: false,
        requestKey: `my-day-visible-activities:${workspace.currentUserId}:${workspace.profile.id}:${selectedDate}`,
      });
      const evidencePromise = listCleanEvidenceEntries(workspace.profile.id, {
        fromDate: selectedDate,
        toDate: selectedDate,
        limit: 60,
      });
      const evidenceTiming = beginCleanPlanningTiming({
        operation: "my-day-recent-learning",
        criticality: "section-secondary",
        gatesPage: false,
        requestKey: `my-day-recent-learning:${workspace.currentUserId}:${workspace.profile.id}:${selectedDate}`,
      });
      const programsPromise = listCleanPrograms(workspace.profile.id, { limit: 50 });
      const programsTiming = beginCleanPlanningTiming({
        operation: "my-day-pathway-enrichment",
        criticality: "section-secondary",
        gatesPage: false,
        requestKey: `my-day-pathway-enrichment:${workspace.currentUserId}:${workspace.profile.id}`,
      });

      try {
        const nextItems = await withCleanPlanningTimeout(
          itemsPromise,
          "My Day calendar items",
        );
        itemsTiming(
          requestGeneration === dayRequestGenerationRef.current ? "success" : "cancelled",
        );
        if (requestGeneration !== dayRequestGenerationRef.current) return;
        writeCleanPlanningCalendarItems(cacheKey, nextItems);
        setItems(nextItems);
        setItemsResolvedKey(selectedDayDataKey);
        setItemsLoading(false);
      } catch (error) {
        itemsTiming("error");
        clearCleanPlanningCalendarItemsRequest(cacheKey);
        if (requestGeneration === dayRequestGenerationRef.current) {
          Sentry.captureException(error, {
            level: "warning",
            tags: { operation: "my-day-visible-activities", surface: "my-day" },
          });
          setItemsError("We couldn't load today's learning. Try again.");
          setItemsResolvedKey(null);
          setItemsLoading(false);
        }
      }

      void (async () => {
        try {
          const [evidenceResult, programsResult] = await Promise.allSettled([
            withCleanPlanningTimeout(evidencePromise, "My Day evidence"),
            withCleanPlanningTimeout(programsPromise, "My Day programs"),
          ]);

          if (requestGeneration !== dayRequestGenerationRef.current) {
            evidenceTiming("cancelled");
            programsTiming("cancelled");
            return;
          }

          if (evidenceResult.status === "fulfilled") {
            evidenceTiming("success");
            setEvidenceEntries(evidenceResult.value);
          } else evidenceTiming("error");

          if (programsResult.status !== "fulfilled") {
            programsTiming("error");
            return;
          }
          programsTiming("success");
          const nextPrograms = programsResult.value;
          setPrograms(nextPrograms);

          const segmentResults = await Promise.allSettled(
            nextPrograms.map((program) =>
              withCleanPlanningTimeout(
                listCleanProgramSegments(workspace.profile!.id, program.id),
                "My Day program details",
              ),
            ),
          );

          if (requestGeneration !== dayRequestGenerationRef.current) {
            programsTiming("cancelled");
            return;
          }

          setProgramSegments(
            segmentResults
              .filter(
                (result): result is PromiseFulfilledResult<CleanProgramSegment[]> =>
                  result.status === "fulfilled",
              )
              .flatMap((result) => result.value),
          );
        } catch {
          evidenceTiming("error");
          programsTiming("error");
          if (requestGeneration === dayRequestGenerationRef.current) {
            setPrograms([]);
            setProgramSegments([]);
          }
        }
      })();
    }

    void loadItems();
  }, [
    dayReloadNonce,
    selectedDate,
    today,
    weekEnd,
    weekStart,
    workspace.currentUserId,
    workspace.profile,
    workspace.requiresFamilyCreation,
    workspace.schemaMissing,
  ]);

  useEffect(() => {
    if (!workspace.profile || workspace.schemaMissing || workspace.requiresFamilyCreation) {
      return;
    }

    return subscribeToCleanEvidenceChanges((detail) => {
      if (detail.familyId !== workspace.profile?.id) return;
      void reloadEvidence();
    });
  }, [reloadEvidence, workspace.profile, workspace.requiresFamilyCreation, workspace.schemaMissing]);

  function toggleExpanded(itemId: string) {
    setExpandedItemIds((current) =>
      current.includes(itemId)
        ? current.filter((value) => value !== itemId)
        : [...current, itemId],
    );
  }

  async function handleCompletionToggle(item: CleanCalendarItem) {
    if (!workspace.profile || completionPendingIdsRef.current.has(item.id)) return;

    const nextCompletedAt = item.completedAt ? null : new Date().toISOString();
    const cacheKey = buildCleanPlanningCacheKey({
      userId: workspace.currentUserId,
      familyId: workspace.profile.id,
      route: "day",
      fromDate: selectedDate,
      toDate: selectedDate,
    });

    const previousItem = item;
    const optimisticItem = { ...item, completedAt: nextCompletedAt };
    setItems((current) => {
      const nextItems = current.map((currentItem) =>
        currentItem.id === item.id ? optimisticItem : currentItem,
      );
      writeCleanPlanningCalendarItems(cacheKey, nextItems);
      return nextItems;
    });
    completionPendingIdsRef.current.add(item.id);
    setCompletionUpdatingIds((current) => new Set(current).add(item.id));
    setCompletionError(null);

    try {
      const updatedItem = await updateCleanCalendarItem(workspace.profile.id, item.id, {
        completedAt: nextCompletedAt,
      });

      setItems((current) => {
        const nextItems = current.map((currentItem) =>
          currentItem.id === updatedItem.id ? updatedItem : currentItem,
        );
        writeCleanPlanningCalendarItems(cacheKey, nextItems);
        return nextItems;
      });
    } catch (error) {
      setItems((current) => {
        const restoredItems = current.map((currentItem) =>
          currentItem.id === item.id ? previousItem : currentItem,
        );
        writeCleanPlanningCalendarItems(cacheKey, restoredItems);
        return restoredItems;
      });
      setCompletionError({
        itemId: item.id,
        message: normalizeCleanErrorMessage(
          error,
          "We could not update this activity's completion status.",
        ),
      });
    } finally {
      completionPendingIdsRef.current.delete(item.id);
      setCompletionUpdatingIds((current) => {
        const next = new Set(current);
        next.delete(item.id);
        return next;
      });
    }
  }

  function openQuickAdd() {
    setQuickAddOpen(true);
    setQuickAddLearnerId(defaultQuickAddLearnerId);
    setQuickAddError(null);
    setQuickAddMessage(null);
  }

  function closeQuickAdd() {
    setQuickAddOpen(false);
    setQuickAddTitle("");
    setQuickAddLearnerId(defaultQuickAddLearnerId);
    setQuickAddTime("");
    setQuickAddLearningArea("");
    setQuickAddError(null);
  }

  async function handleQuickAddSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!workspace.profile) {
      setQuickAddError("My Day is not ready for quick add yet.");
      return;
    }

    const title = String(quickAddTitle ?? "").trim();
    if (!title) {
      setQuickAddError("Add an activity before saving to My Day.");
      return;
    }

    setQuickAddSubmitting(true);
    setQuickAddError(null);
    setQuickAddMessage(null);

    try {
      const createdItem = await createCleanCalendarItem(workspace.profile.id, {
        title,
        plannedDate: selectedDate,
        learnerId: quickAddLearnerId || null,
        startsAt: toTimestampFromDateAndTime(selectedDate, quickAddTime),
        learningArea: String(quickAddLearningArea ?? "").trim() || null,
        programId: null,
        sourceType: "manual",
      });

      trackProductEvent(
        "calendar_block_created",
        {
          area: "my_day",
          route: pathname,
          hasLearner: Boolean(quickAddLearnerId),
          hasLearningArea: Boolean(quickAddLearningArea),
          hasStartTime: Boolean(quickAddTime),
          blockType: "manual",
        },
        user?.id,
      );
      setItems((current) => [...current, createdItem]);
      setExpandedItemIds([createdItem.id]);
      setQuickAddMessage("Added to My Day.");
      setQuickAddTitle("");
      setQuickAddTime("");
      setQuickAddLearningArea("");
      setQuickAddOpen(false);
    } catch (error) {
      setQuickAddError(
        normalizeCleanErrorMessage(error, "We could not add this quick block."),
      );
    } finally {
      setQuickAddSubmitting(false);
    }
  }

  async function handleCreateCustomLearning(input: {
    learnerId: string;
    title: string;
    learningArea: string | null;
    note: string | null;
    resource: { resourceType: "web_link" | "reference" | "file"; label: string | null; value: string; file?: File | null } | null;
  }) {
    if (!workspace.profile) throw new Error("My Day is not ready for custom learning yet.");
    const textResource = input.resource?.resourceType === "web_link" || input.resource?.resourceType === "reference"
      ? { resourceType: input.resource.resourceType, label: input.resource.label, value: input.resource.value }
      : null;
    const queueId = await createCustomLearningOnDeck({
      familyId: workspace.profile.id,
      learnerId: input.learnerId,
      title: input.title,
      learningArea: input.learningArea,
      note: input.note,
      resource: textResource,
    });
    if (input.resource?.resourceType === "file" && input.resource.file) {
      const createdItems = await listLearningQueueItems(workspace.profile.id, input.learnerId);
      const createdItem = createdItems.find((item) => item.id === queueId);
      if (!createdItem?.customLearningItemId) throw new Error("Learning was added, but the PDF could not be attached. You can try again from Resources.");
      try {
        await handleUploadCustomPdf(createdItem.customLearningItemId, input.resource.file);
      } catch {
        throw new Error("Learning was added, but the PDF could not be uploaded. You can try again from Resources.");
      }
    }
    trackProductEvent("custom_learning_created", {
      sourceType: "custom_learning",
      learningArea: input.learningArea,
      hasNote: Boolean(input.note),
      resourceType: input.resource?.resourceType || null,
      resourceCountBucket: input.resource ? "1" : "0",
      surface: "my_day",
    }, user?.id);
    await reloadOnDeckItems();
    trackProductEvent("custom_learning_put_on_deck", {
      sourceType: "custom_learning",
      learningArea: input.learningArea,
      hasNote: Boolean(input.note),
      resourceType: input.resource?.resourceType || null,
      resourceCountBucket: input.resource ? "1" : "0",
      surface: "my_day",
    }, user?.id);
  }

  async function handleAddCustomResource(input: { customLearningItemId: string; resourceType: "web_link" | "reference"; label: string | null; value: string }) {
    if (!workspace.profile) return;
    await addCustomLearningResource({ familyId: workspace.profile.id, ...input });
    await reloadOnDeckItems();
    trackProductEvent("custom_resource_added", { resourceType: input.resourceType, surface: "my_day", resourceCountBucket: "1" }, user?.id);
  }

  async function handleRemoveCustomResource(resourceId: string) {
    if (!workspace.profile) return;
    await removeCustomLearningResource(workspace.profile.id, resourceId);
    await reloadOnDeckItems();
    trackProductEvent("custom_resource_removed", { surface: "my_day" }, user?.id);
  }

  async function handleUploadCustomPdf(customLearningItemId: string, file: File) {
    if (!workspace.profile) return;
    trackProductEvent("custom_resource_file_upload_started", { sizeBucket: file.size < 1024 * 1024 ? "under_1mb" : file.size <= 5 * 1024 * 1024 ? "1_to_5mb" : file.size <= 15 * 1024 * 1024 ? "5_to_15mb" : "15_to_25mb", surface: "my_day" }, user?.id);
    try {
      await uploadCustomLearningPdf({ familyId: workspace.profile.id, customLearningItemId, file });
      await reloadOnDeckItems();
      trackProductEvent("custom_resource_file_uploaded", { surface: "my_day" }, user?.id);
    } catch (error) {
      trackProductEvent("custom_resource_file_upload_failed", { surface: "my_day" }, user?.id);
      throw error;
    }
  }

  async function handleRemoveOnDeckItem(itemId: string) {
    if (!workspace.profile) return;
    const item = onDeckItems.find((entry) => entry.id === itemId) || null;
    setOnDeckUpdatingId(itemId);
    setOnDeckError(null);
    try {
      await removeLearningQueueItem(workspace.profile.id, itemId);
      setOnDeckItems((current) => current.filter((entry) => entry.id !== itemId));
      if (item) {
        trackProductEvent(
          "on_deck_item_removed",
          {
            subjectKey: item.subjectKey,
            strandKey: item.strandKey,
            stageKey: item.stageKey,
            stepKey: item.stepKey,
            pathwayStepId: item.pathwayStepId,
          },
          user?.id,
        );
      }
    } catch (error) {
      setOnDeckError(
        normalizeCleanErrorMessage(error, "We could not remove this On Deck item."),
      );
    } finally {
      setOnDeckUpdatingId("");
    }
  }

  async function handleClearHelp(requestId: string) {
    if (!workspace.profile) return;
    try {
      await clearLearnerHelpRequest(workspace.profile.id, requestId);
      setHelpRequests((current) => current.filter((request) => request.id !== requestId));
      trackProductEvent("parent_help_acknowledged", { actorType: "parent" }, user?.id);
    } catch (error) {
      setHelpError(normalizeCleanErrorMessage(error, "We could not clear this help request just now."));
    }
  }

  async function handleMoveOnDeckItem(
    itemId: string,
    learnerId: string,
    direction: "up" | "down",
  ) {
    if (!workspace.profile) return;
    setOnDeckUpdatingId(itemId);
    setOnDeckError(null);
    try {
      const nextItems = await moveLearningQueueItem(
        workspace.profile.id,
        learnerId,
        itemId,
        direction,
      );
      if (selectedLearnerId) {
        setOnDeckItems(nextItems);
      } else {
        await reloadOnDeckItems();
      }
      const movedItem = nextItems.find((entry) => entry.id === itemId) || null;
      trackProductEvent(
        "on_deck_item_reordered",
        {
          subjectKey: movedItem?.subjectKey || null,
          source: "on_deck",
          position: movedItem?.position ?? null,
        },
        user?.id,
      );
    } catch (error) {
      setOnDeckError(
        normalizeCleanErrorMessage(error, "We could not update the On Deck order."),
      );
    } finally {
      setOnDeckUpdatingId("");
    }
  }

  async function handleKeepRecoveryInFocus(recoveryItem: RecoverableLearningItem) {
    if (!workspace.profile || !recoveryItem.registryItem || !recoveryItem.calendarItem.learnerId) return;

    const itemId = recoveryItem.calendarItem.id;
    setRecoveryUpdatingIds((current) => new Set(current).add(itemId));
    setRecoveryError(null);

    try {
      const result = await addPathwayStepToLearningQueue({
        familyId: workspace.profile.id,
        learnerId: recoveryItem.calendarItem.learnerId,
        registryItem: recoveryItem.registryItem,
      });
      await reloadOnDeckItems();
      trackProductEvent(
        "recover_week_item_put_on_deck",
        {
          subjectKey: recoveryItem.registryItem.subjectKey,
          hasPathwayContext: true,
          queueSize: result.item ? result.item.position + 1 : null,
        },
        user?.id,
      );
    } catch (error) {
      setRecoveryError({
        itemId,
        message: normalizeCleanErrorMessage(error, "We could not keep this learning in focus."),
      });
    } finally {
      setRecoveryUpdatingIds((current) => {
        const next = new Set(current);
        next.delete(itemId);
        return next;
      });
    }
  }

  async function handleDailyPlannerDownload() {
    if (!workspace.profile) return;

    setDailyPlannerDownloading(true);
    setItemsError(null);

    try {
      const {
        buildCleanDailyPlannerPdfFilename,
        buildCleanWeeklyPlannerEntriesFromCalendarItems,
        generateCleanDailyPlannerPdfBytes,
      } = await import("@/lib/clean/outputs/weeklyPlanner");
      const entries = buildCleanWeeklyPlannerEntriesFromCalendarItems(sortedVisibleItems, {
        learnerLabelById,
        programLabelById,
        segmentLabelById,
      });
      const pdfBytes = await generateCleanDailyPlannerPdfBytes({
        familyName: workspace.profile.displayName || null,
        learnerLabel: selectedLearnerLabel,
        plannedDate: selectedDate,
        entries,
      });

      downloadPdf(
        pdfBytes,
        buildCleanDailyPlannerPdfFilename(workspace.profile.displayName || null, selectedDate),
      );
      trackProductEvent(
        "daily_plan_pdf_downloaded",
        {
          area: "my_day",
          route: pathname,
          viewType: "day",
        },
        user?.id,
      );
      setQuickAddMessage("Daily planner downloaded.");
    } catch (error) {
      setItemsError(
        normalizeCleanErrorMessage(
          error,
          "Could not create today's planner. Please try again.",
        ),
      );
    } finally {
      setDailyPlannerDownloading(false);
    }
  }

  const readyForDay = !workspace.loading && (setupStatusReadyOnce || !workspace.setupLoading) && !workspace.schemaMissing && !workspace.requiresFamilyCreation;
  const hasPlannedItemsForSelectedDate = items.length > 0;
  const dayPrimaryKey = workspace.profile
    ? `${workspace.currentUserId}:${workspace.profile.id}:${selectedDate}`
    : null;
  const dayDataResolved = Boolean(readyForDay && !itemsLoading && !itemsError && dayPrimaryKey && itemsResolvedKey === dayPrimaryKey);
  const myDayPresentationState: CleanMyDayPresentationState | null = dayDataResolved
    ? deriveCleanMyDayPresentationState({
        setupStatus: accountSetup,
        hasPlannedItemsForSelectedDate,
      })
    : null;
  const dayCoreState = getCleanDayCoreState({
    readyForDay,
    itemsLoading,
    itemsError,
    dayPrimaryKey,
    itemsResolvedKey,
    presentationState: myDayPresentationState,
  });

  useEffect(() => {
    if (myDayPresentationState !== "READY_FOR_FIRST_VALUE" || firstValueChoiceTrackedRef.current) return;
    firstValueChoiceTrackedRef.current = true;
    trackProductEvent(
      "first_value_choice_viewed",
      { area: "my_day", route: pathname, presentation: "today_first_value" },
      user?.id,
    );
  }, [myDayPresentationState, pathname, user?.id]);

  function trackFirstValueChoice(destination: "add-today" | "capture" | "plan-master-week") {
    trackProductEvent(
      "first_value_choice_selected",
      { area: "my_day", route: pathname, presentation: "today_first_value", destination },
      user?.id,
    );
  }

  useEffect(() => {
    if (!readyForDay || !workspace.profile || !dayPrimaryKey) return;
    if (dayPrimaryMilestoneRef.current === dayPrimaryKey) return;
    dayPrimaryMilestoneRef.current = dayPrimaryKey;
    recordCleanPlanningMilestone({
      operation: "my-day-primary-content",
      criticality: "page-primary",
      gatesPage: false,
    });
  }, [dayPrimaryKey, readyForDay, workspace.profile]);

  useEffect(() => {
    if (!user?.id) return;
    recordCleanPlanningMilestone({
      operation: "my-day-route-mounted",
      criticality: "page-primary",
      gatesPage: false,
    });
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !dayPrimaryKey || itemsLoading) return;
    if (daySettledMilestoneRef.current === dayPrimaryKey) return;
    daySettledMilestoneRef.current = dayPrimaryKey;
    recordCleanPlanningMilestone({
      operation: "my-day-fully-settled",
      criticality: "page-primary",
      gatesPage: false,
    });
  }, [dayPrimaryKey, itemsLoading, user?.id]);

  useEffect(() => {
    const recoveryWeek = getWeekStart(today);
    if (!user?.id || !recoverableLearningItems.length || recoveryShownWeekRef.current === recoveryWeek) return;
    recoveryShownWeekRef.current = recoveryWeek;
    trackProductEvent(
      "recover_week_shown",
      {
        itemCount: Math.min(recoverableLearningItems.length, 8),
        learnerScope: selectedLearnerId ? "learner" : "family",
      },
      user.id,
    );
  }, [recoverableLearningItems.length, selectedLearnerId, today, user?.id]);

  function renderQuickAddForm() {
    if (!quickAddOpen) return null;

    return (
      <form
        className="mylearna-day-quick-add-form"
        onSubmit={(event) => void handleQuickAddSubmit(event)}
        style={quickAddCardStyle}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ display: "grid", gap: 6 }}>
            <strong style={{ color: "#0f172a", fontSize: 18, letterSpacing: "-0.02em" }}>{quickAddHeading}</strong>
            <p style={{ margin: 0, color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>{quickAddLead}</p>
          </div>
          <button type="button" onClick={closeQuickAdd} style={secondaryButtonStyle} disabled={quickAddSubmitting}>Cancel</button>
        </div>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ color: "#0f172a", fontSize: 13, fontWeight: 700 }}>Activity</span>
            <input value={quickAddTitle} onChange={(event) => setQuickAddTitle(event.target.value)} style={inputStyle} placeholder="Read-aloud, maths, nature walk" autoFocus />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ color: "#0f172a", fontSize: 13, fontWeight: 700 }}>Who is this for?</span>
            <select value={quickAddLearnerId} onChange={(event) => setQuickAddLearnerId(event.target.value)} style={inputStyle}>
              <option value="">Whole family</option>
              {learnerOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ color: "#0f172a", fontSize: 13, fontWeight: 700 }}>Time (optional)</span>
            <input type="time" value={quickAddTime} onChange={(event) => setQuickAddTime(event.target.value)} style={inputStyle} />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ color: "#0f172a", fontSize: 13, fontWeight: 700 }}>Learning area (optional)</span>
            <input value={quickAddLearningArea} onChange={(event) => setQuickAddLearningArea(event.target.value)} list="clean-my-day-learning-areas" style={inputStyle} placeholder="Optional" />
          </label>
        </div>
        {quickAddError ? <div role="alert" style={{ color: "#b91c1c", fontSize: 13 }}>{quickAddError}</div> : null}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button type="submit" disabled={quickAddSubmitting} style={primaryButtonStyle}>{quickAddSubmitting ? "Adding..." : "Add to My Day"}</button>
          <Link href={calendarPathBase} style={{ color: "#1d4ed8", fontWeight: 700, fontSize: 14 }}>Open My Calendar instead</Link>
        </div>
      </form>
    );
  }

  if (mobileCompanion) {
    return (
      <div style={shellStyle}>
        <MobileTodayContent
          calendarHref={calendarPathBase}
          completionError={completionError}
          completionUpdatingIds={completionUpdatingIds}
          dateLabel={formatTodayHeading(selectedDate)}
          hasLearners={workspace.learners.length > 0}
          isViewingToday={isViewingToday}
          items={sortedVisibleItems}
          itemsError={itemsError}
          itemsLoading={itemsLoading}
          learnerLabelById={learnerLabelById}
          learnerOptions={learnerOptions}
          myDayPresentationState={myDayPresentationState}
          recoverItems={recoverableLearningItems}
          recoverOnDeckItems={onDeckItems}
          recoverUpdatingIds={recoveryUpdatingIds}
          recoverError={recoveryError}
          onKeepRecoveryInFocus={(item) => void handleKeepRecoveryInFocus(item)}
          onDeckItems={resolvedOnDeckItems}
          helpRequests={helpRequests}
          onClearHelp={(requestId) => void handleClearHelp(requestId)}
          onAddResource={(input) => handleAddCustomResource(input)}
          onRemoveResource={(resourceId) => handleRemoveCustomResource(resourceId)}
          onUploadPdf={(customLearningItemId, file) => handleUploadCustomPdf(customLearningItemId, file)}
          onDeckError={onDeckError}
          onDeckUpdatingId={onDeckUpdatingId}
          onCompletionToggle={(item) => void handleCompletionToggle(item)}
          onLearnerChange={handleLearnerChange}
          onMoveOnDeckItem={(itemId, learnerId, direction) =>
            void handleMoveOnDeckItem(itemId, learnerId, direction)
          }
          onMoveDay={(offset) => router.push(buildDayPath(addDays(selectedDate, offset)))}
          onRemoveOnDeckItem={(itemId) => void handleRemoveOnDeckItem(itemId)}
          onRetry={() => setDayReloadNonce((current) => current + 1)}
          onToday={() => router.push(buildDayPath(today))}
          pathwaysHref={currentPathwayHref}
          whereWeAreHref={buildLearnerContextHref("/my-learna", selectedLearnerId)}
          quickCaptureHref={mobileQuickCaptureHref}
          selectedLearnerId={selectedLearnerId}
          selectedLearnerLabel={selectedLearnerLabel}
          setupNextAction={myDayPresentationState === "SETUP_INCOMPLETE" ? accountSetup.nextAction : null}
          workspaceError={workspace.error}
          workspaceLoading={workspace.loading && !workspace.profile}
          workspaceNeedsFamily={workspace.requiresFamilyCreation}
          workspaceSchemaMissing={workspace.schemaMissing}
          buildItemCaptureHref={buildMobileItemCaptureHref}
          defaultCustomLearningLearnerId={defaultQuickAddLearnerId}
          onCreateCustomLearning={handleCreateCustomLearning}
        />
      </div>
    );
  }

  return (
    <div style={shellStyle}>
      <div className={`mylearna-day-shell mylearna-day-shell-${myDayPresentationState?.toLowerCase() ?? "loading"}`} style={wrapStyle}>
        <style jsx global>{`
          @media (max-width: 640px) {
            .mylearna-day-header {
              padding: 18px !important;
            }

            .mylearna-day-getting-started,
            .mylearna-day-continue-card {
              display: none !important;
            }

            .mylearna-day-intro-full,
            .mylearna-day-overview-summary,
            .mylearna-day-timeline-helper {
              display: none !important;
            }

            .mylearna-day-intro-short {
              display: inline !important;
            }

            .mylearna-day-plan-card {
              padding: 12px !important;
            }

            .mylearna-day-overview-card {
              border-radius: 16px !important;
              padding: 16px !important;
              gap: 12px !important;
            }

            .mylearna-day-overview-card h2 {
              font-size: 22px !important;
              letter-spacing: 0 !important;
            }

            .mylearna-day-header-capture {
              min-height: 44px !important;
              border: 1px solid #cbd5e1 !important;
              background: #ffffff !important;
              color: #17204b !important;
            }

            .mylearna-day-progress-panel {
              padding: 12px !important;
              border-radius: 14px !important;
            }

            .mylearna-day-progress-panel button,
            .mylearna-day-actions button,
            .mylearna-day-actions a {
              min-height: 44px !important;
            }

            .mylearna-day-next-step-card {
              padding: 12px !important;
            }

            .mylearna-day-actions {
              width: 100% !important;
              display: grid !important;
              grid-template-columns: 1fr !important;
            }
          }

          .mylearna-day-intro-short {
            display: none;
          }

          .mylearna-day-shell-loading .mylearna-day-mature-top {
            display: none !important;
          }

          .mylearna-day-essential-navigator {
            display: none;
          }

          @media (min-width: 768px) {
            .mylearna-day-essential-navigator {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 10px;
              flex-wrap: wrap;
              padding: 10px 12px;
              border: 1px solid #e2e8f0;
              border-radius: 14px;
              background: #ffffff;
            }

            .mylearna-day-internal-navigator {
              display: none !important;
            }
          }

          @media (min-width: 901px) {
            .mylearna-day-overview-card,
            .mylearna-day-legacy-toolbar {
              display: none !important;
            }
          }

          @media (min-width: 768px) {
            .mylearna-day-mature-content-setup_incomplete,
            .mylearna-day-mature-content-ready_for_first_value {
              display: none !important;
            }

            .mylearna-day-shell-setup_incomplete .mylearna-day-mature-top,
            .mylearna-day-shell-ready_for_first_value .mylearna-day-mature-top,
            .mylearna-day-shell-returning_empty .mylearna-day-mature-top {
              display: none !important;
            }

          }

          @media (max-width: 767px) {
            .mylearna-day-mature-content-populated_day {
              display: contents;
            }
          }

          .mylearna-day-mature-content-setup_incomplete,
          .mylearna-day-mature-content-ready_for_first_value {
            display: none !important;
          }
        `}</style>
        {dayCoreState === "error" ? (
          <section
            data-testid="my-day-primary-error-state"
            style={{ ...cardStyle, color: "#475569" }}
            role="alert"
          >
            <p style={{ margin: 0 }}>We couldn&apos;t load today&apos;s learning. Try again.</p>
            <button type="button" onClick={() => setDayReloadNonce((current) => current + 1)} style={{ ...secondaryButtonStyle, width: "fit-content" }}>
              Try again
            </button>
          </section>
        ) : null}
        {dayCoreState === "loading" ? (
          <section
            data-testid="my-day-primary-loading-state"
            style={{ ...cardStyle, color: "#475569" }}
            aria-live="polite"
          >
            Loading this day&apos;s plan...
          </section>
        ) : null}
        {helpError ? <section role="alert" style={{ ...cardStyle, color: "#92400e" }}>We could not load help requests just now.</section> : null}
        {readyForDay && (myDayPresentationState === "RETURNING_EMPTY" || myDayPresentationState === "POPULATED_DAY") ? (
          <nav className="mylearna-day-essential-navigator" aria-label="My Day date navigation">
            <button type="button" onClick={() => router.push(buildDayPath(addDays(selectedDate, -1)))} style={secondaryButtonStyle} aria-label="Go to previous day">
              ‹ Previous day
            </button>
            <div style={{ display: "grid", gap: 2, justifyItems: "center", color: "#17204b", fontWeight: 800 }}>
              <CleanMiniCalendarNavigator
                selectedDate={selectedDate}
                today={today}
                onSelectDate={(dateValue) => router.push(buildDayPath(dateValue))}
                onToday={() => router.push(buildDayPath(today))}
                ariaLabel={`Choose date, ${formatTodayHeading(selectedDate)}`}
              />
              {!isViewingToday ? <span style={{ color: "#64748b", fontSize: 12, fontWeight: 600 }}>Today is available in the date picker</span> : null}
            </div>
            <button type="button" onClick={() => router.push(buildDayPath(addDays(selectedDate, 1)))} style={secondaryButtonStyle} aria-label="Go to next day">
              Next day ›
            </button>
          </nav>
        ) : null}
        {canShowMyDayGuidance && myDayPresentationState === "SETUP_INCOMPLETE" ? (
          <CleanFirstRunSetupGate currentStep="day" />
        ) : null}

        {workspace.loading && !workspace.profile && user?.id ? (
          <section
            style={cardStyle}
            role="region"
            aria-label="My Day primary content"
            data-testid="my-day-primary-loading-shell"
          >
            <div style={{ display: "grid", gap: 10 }}>
              <span
                style={{
                  color: "#64748b",
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Today
              </span>
              <h2 style={{ margin: 0, color: "#0f172a" }}>Today&apos;s plan</h2>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                Your family workspace is connecting. This page is ready for today&apos;s plan
                and will fill in the learner details as they arrive.
              </p>
              <div
                style={{
                  minHeight: 84,
                  border: "1px solid #dbeafe",
                  borderRadius: 14,
                  background: "#f8fbff",
                  padding: 14,
                  display: "grid",
                  gap: 6,
                }}
                aria-live="polite"
              >
                <strong style={{ color: "#0f172a" }}>{formatTodayHeading(selectedDate)}</strong>
                <span style={{ color: "#64748b" }}>Today&apos;s learning blocks will appear here.</span>
              </div>
              <button type="button" style={primaryButtonStyle} disabled>
                Add learning
              </button>
            </div>
          </section>
        ) : null}

        {!workspace.loading && workspace.schemaMissing ? (
          <section style={cardStyle}>
            <strong style={{ display: "block", marginBottom: 8 }}>My Day is not ready yet.</strong>
            <p style={{ margin: 0, color: "#475569" }}>
              Finish the family setup first, then come back here for today&apos;s flow.
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
            <p style={{ margin: 0, color: "#475569" }}>
              Create your family profile first on <Link href="/my-profile">My Profile</Link>.
            </p>
          </section>
        ) : null}

        {readyForDay && !workspace.learners.length ? (
          <section style={cardStyle}>
            <p style={{ margin: 0, color: "#475569" }}>
              Add a learner first on <Link href="/my-profile">My Profile</Link> before using My Day.
            </p>
          </section>
        ) : null}

        {dayCoreState === "ready" && myDayPresentationState ? (
          <>
            {myDayPresentationState === "SETUP_INCOMPLETE" || myDayPresentationState === "READY_FOR_FIRST_VALUE" ? <section
              className={`mylearna-day-first-value mylearna-day-first-value-${myDayPresentationState.toLowerCase()}`}
              aria-labelledby="my-day-activation-title"
              style={{ display: "grid", gap: 12, padding: "clamp(18px, 4vw, 28px)", border: "1px solid #dbeafe", borderRadius: 18, background: "#f8fbff", boxShadow: "0 8px 22px rgba(15,23,42,0.04)" }}
            >
              <p style={{ margin: 0, color: "#2563eb", fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                My Day
              </p>
              {myDayPresentationState === "SETUP_INCOMPLETE" ? (
                <>
                  <h1 id="my-day-activation-title" style={{ margin: 0, color: "#17204b", fontSize: 28 }}>Let&apos;s get MyLearna ready for your family.</h1>
                  <Link href={accountSetup.nextAction.href} style={primaryButtonStyle}>{accountSetup.nextAction.label}</Link>
                  {accountSetup.hasLearner ? (
                    <Link href={quickCaptureHref} style={{ ...secondaryButtonStyle, textDecoration: "none", width: "fit-content" }}>
                      Capture something you already did
                    </Link>
                  ) : null}
                </>
              ) : null}
              {myDayPresentationState === "READY_FOR_FIRST_VALUE" ? (
                <>
                  <h1 id="my-day-activation-title" style={{ margin: 0, color: "#17204b", fontSize: 28 }}>{isViewingToday ? "What are you learning today?" : "What are you learning on this day?"}</h1>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>Add one thing to get started. You can plan more whenever you need to.</p>
                  <div style={{ display: "grid", gap: 10, width: "min(100%, 480px)" }}>
                    <button type="button" onClick={() => { trackFirstValueChoice("add-today"); openQuickAdd(); }} style={primaryButtonStyle}>{isViewingToday ? "Add something for today" : "Add something for this day"}</button>
                    <Link href={quickCaptureHref} onClick={() => trackFirstValueChoice("capture")} style={{ ...secondaryButtonStyle, textDecoration: "none", textAlign: "center" }}>Capture something you already did</Link>
                    <Link href={calendarPathBase} onClick={() => trackFirstValueChoice("plan-master-week")} style={{ color: "#1d4ed8", fontWeight: 700, fontSize: 14 }}>Plan our Master Week</Link>
                  </div>
                </>
              ) : null}
              {false ? (
                <>
                  <h1 id="my-day-activation-title" style={{ margin: 0, color: "#17204b", fontSize: 28 }}>{isViewingToday ? "Nothing scheduled for today yet." : "Nothing scheduled for this day yet."}</h1>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>{isViewingToday ? "Add something for today, capture learning that already happened, or open My Calendar." : "Add something for this day, capture learning that already happened, or open My Calendar."}</p>
                  <button type="button" onClick={openQuickAdd} style={{ ...primaryButtonStyle, width: "fit-content" }}>{isViewingToday ? "Add something for today" : "Add something for this day"}</button>
                  <Link href={quickCaptureHref} style={{ ...secondaryButtonStyle, textDecoration: "none", width: "fit-content" }}>
                    Capture something you already did
                  </Link>
                  <Link href={calendarPathBase} style={{ ...secondaryButtonStyle, textDecoration: "none", width: "fit-content" }}>Open My Calendar →</Link>
                </>
              ) : null}
              {myDayPresentationState !== "SETUP_INCOMPLETE" ? renderQuickAddForm() : null}
              {quickAddMessage ? <div role="status" style={{ color: "#166534", fontSize: 13, fontWeight: 700 }}>{quickAddMessage}</div> : null}
            </section> : null}
            {workspace.learners.length ? <div className={`mylearna-day-mature-content mylearna-day-mature-content-${myDayPresentationState.toLowerCase()}${quickAddOpen ? " mylearna-day-quick-add-open" : ""}`}>
            <section
              className="mylearna-day-plan-card"
              data-guidance-id="my-day-today-plan"
              style={{
                ...cardStyle,
                padding: 18,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gap: 16,
                }}
              >
                <header
                  className="mylearna-day-desktop-task-header"
                  data-testid="my-day-desktop-task-first"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "end",
                    gap: 18,
                    flexWrap: "wrap",
                    paddingBottom: 2,
                  }}
                >
                  <div style={{ display: "grid", gap: 5, minWidth: 0 }}>
                    <p style={{ margin: 0, color: "#64748b", fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      My Day
                    </p>
                    <h1 style={{ margin: 0, color: "#17204b", fontSize: 28, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
                      {isViewingToday ? "Today’s learning" : "Learning for this day"}
                    </h1>
                    <p style={{ margin: 0, color: "#475569", fontWeight: 650 }}>
                      {formatTodayHeading(selectedDate)}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "end", gap: 10, flexWrap: "wrap" }}>
                    <label style={{ display: "grid", gap: 5, color: "#64748b", fontSize: 12, fontWeight: 800 }}>
                      Viewing
                      <select
                        aria-label="Learner or family view"
                        value={selectedLearnerId}
                        onChange={(event) => handleLearnerChange(event.target.value)}
                        style={compactInputStyle}
                      >
                        <option value="" style={{ background: "#ffffff", color: "#0f172a" }}>All family</option>
                        {learnerOptions.map((option) => (
                          <option key={option.value} value={option.value} style={{ background: "#ffffff", color: "#0f172a" }}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <LearnerViewEntry learnerOptions={learnerOptions} selectedLearnerId={selectedLearnerId} />
                    <Link href={quickCaptureHref} style={{ ...primaryButtonStyle, textDecoration: "none" }}>
                      Capture learning
                    </Link>
                  </div>
                </header>
                <div
                  className="mylearna-day-overview-card"
                  style={{
                    border: "1px solid #dbeafe",
                    borderRadius: 20,
                    background: "linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)",
                    padding: 22,
                    display: "grid",
                    gap: 18,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 16,
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ display: "grid", gap: 8, flex: "1 1 280px", minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          letterSpacing: "0.08em",
                          color: "#64748b",
                          textTransform: "uppercase",
                        }}
                      >
                        {isViewingToday ? "Today’s flow" : "Family day"}
                      </div>
                      <h2
                        style={{
                          margin: 0,
                          color: "#0f172a",
                          fontSize: 30,
                          lineHeight: 1.08,
                          letterSpacing: "-0.03em",
                        }}
                      >
                        {isViewingToday ? "Learning blocks for today" : "Learning blocks for this day"}
                      </h2>
                      <p className="mylearna-day-overview-summary" style={{ margin: 0, color: "#475569", fontSize: 15, lineHeight: 1.75 }}>
                        {overviewSummary}
                      </p>
                      <p style={{ margin: 0, color: "#0f172a", fontWeight: 700, fontSize: 15 }}>
                        {nextUpLabel}: {nextUpSummary}
                      </p>
                    </div>
                    <div
                      className="mylearna-day-progress-panel"
                      data-guidance-id="my-day-progress-summary"
                      style={{
                        display: "grid",
                        gap: 8,
                        flex: "1 1 240px",
                        minWidth: 0,
                        padding: 14,
                        borderRadius: 16,
                        background: "rgba(255,255,255,0.9)",
                        border: "1px solid #dbeafe",
                      }}
                    >
                      <label
                        style={{
                          color: "#64748b",
                          fontSize: 12,
                          fontWeight: 800,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                        }}
                      >
                        Day
                      </label>
                      <div className="mylearna-day-internal-navigator" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          style={secondaryButtonStyle}
                          onClick={() => router.push(buildDayPath(addDays(selectedDate, -1)))}
                        >
                          Previous day
                        </button>
                        <button
                          type="button"
                          style={{
                            ...secondaryButtonStyle,
                            background: isViewingToday ? "#eff6ff" : "#ffffff",
                            borderColor: isViewingToday ? "#93c5fd" : "#cbd5e1",
                            color: isViewingToday ? "#1d4ed8" : "#0f172a",
                            cursor: isViewingToday ? "default" : "pointer",
                          }}
                          onClick={() => router.push(buildDayPath(today))}
                          disabled={isViewingToday}
                        >
                          Today
                        </button>
                        <button
                          type="button"
                          style={secondaryButtonStyle}
                          onClick={() => router.push(buildDayPath(addDays(selectedDate, 1)))}
                        >
                          Next day
                        </button>
                      </div>
                      <label
                        style={{
                          color: "#64748b",
                          fontSize: 12,
                          fontWeight: 800,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                        }}
                      >
                        View
                      </label>
                      <select
                        value={selectedLearnerId}
                        onChange={(event) => handleLearnerChange(event.target.value)}
                        style={compactInputStyle}
                      >
                        <option value="" style={{ background: "#ffffff", color: "#0f172a" }}>
                          All family
                        </option>
                        {learnerOptions.map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                            style={{ background: "#ffffff", color: "#0f172a" }}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span
                      style={{
                        ...overviewPillStyle,
                        padding: "9px 12px",
                        fontSize: 14,
                        fontWeight: 800,
                        color: "#0f172a",
                        background: "#eff6ff",
                        borderColor: "#bfdbfe",
                      }}
                    >
                      {formatTodayHeading(selectedDate)}
                    </span>
                    <span style={overviewPillStyle}>{overviewFocusLabel}</span>
                    <span style={overviewPillStyle}>
                      {sortedVisibleItems.length} block{sortedVisibleItems.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div
                    className="mylearna-day-next-step-card"
                    style={{
                      border: "1px solid #dbeafe",
                      borderRadius: 18,
                      background: "rgba(248,251,255,0.92)",
                      padding: 16,
                      display: "grid",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        color: "#64748b",
                        fontSize: 12,
                        fontWeight: 800,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      Today&apos;s next step
                    </div>
                    <div style={{ color: "#334155", fontWeight: 700, lineHeight: 1.55 }}>
                      Add a learning block, then capture what happens.
                    </div>
                  </div>
                </div>

                <div
                  className="mylearna-day-legacy-toolbar"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 14,
                    alignItems: "flex-end",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "grid", gap: 6 }}>
                    <strong style={{ color: "#0f172a", fontSize: 20, letterSpacing: "-0.02em" }}>
                      Family timeline
                    </strong>
                    <p className="mylearna-day-timeline-helper" style={{ margin: 0, color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>
                      Learning blocks stay small until you open the details.
                    </p>
                  </div>
                  <div className="mylearna-day-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <button type="button" onClick={openQuickAdd} style={primaryButtonStyle}>
                      Add a quick block
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDailyPlannerDownload()}
                      style={secondaryButtonStyle}
                      disabled={dailyPlannerDownloading}
                    >
                      {dailyPlannerDownloading ? "Preparing..." : "Print today's plan"}
                    </button>
                    <Link
                      href={calendarPathBase}
                      style={{ color: "#1d4ed8", fontWeight: 700, fontSize: 14 }}
                    >
                      Open My Calendar
                    </Link>
                  </div>
                </div>

                {renderQuickAddForm()}

                {quickAddMessage ? (
                  <div role="status" style={{ color: "#166534", fontSize: 13, fontWeight: 700 }}>
                    {quickAddMessage}
                  </div>
                ) : null}

                {itemsLoading ? (
                  <p style={{ marginTop: 0, marginBottom: 0, color: "#475569" }}>
                    Loading this day&apos;s flow...
                  </p>
                ) : null}
                {itemsError ? (
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <p style={{ marginTop: 0, marginBottom: 0, color: "#b91c1c" }}>
                      {itemsError}
                    </p>
                    <button
                      type="button"
                      style={secondaryButtonStyle}
                      onClick={() => setDayReloadNonce((current) => current + 1)}
                    >
                      Try again
                    </button>
                  </div>
                ) : null}

                {!itemsLoading && !itemsError && !visibleItems.length ? (
                  <div
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 18,
                      background: "#fbfdff",
                      padding: 20,
                      display: "grid",
                      gap: 14,
                    }}
                  >
                    <div style={{ display: "grid", gap: 6 }}>
                      <strong style={{ color: "#0f172a", fontSize: 17, letterSpacing: "-0.01em" }}>
                        {hasPlannedItemsForSelectedDate && selectedLearnerLabel
                          ? `Nothing planned for ${selectedLearnerLabel} on this day yet.`
                          : isViewingToday
                            ? "Nothing scheduled for today yet."
                            : "Nothing scheduled for this day yet."}
                      </strong>
                      <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                        {hasPlannedItemsForSelectedDate && selectedLearnerLabel
                          ? `Try the full family view, add one quick block here, or open My Calendar to adjust ${
                              isViewingToday ? "today" : "this day"
                            }.`
                          : `Add one quick block here when you want to plan immediately, or open My Calendar for the fuller planning view.`}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button type="button" onClick={openQuickAdd} style={primaryButtonStyle}>
                        {quickAddOpen ? "Quick add is open above" : "Add a quick block"}
                      </button>
                      <Link
                        href={calendarPathBase}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px solid #cbd5e1",
                          background: "#ffffff",
                          color: "#0f172a",
                          borderRadius: 10,
                          padding: "10px 14px",
                          fontSize: 14,
                          fontWeight: 700,
                          textDecoration: "none",
                        }}
                      >
                        Open My Calendar
                      </Link>
                      <Link href={quickCaptureHref} style={{ ...secondaryButtonStyle, textDecoration: "none" }}>
                        Capture something you already did
                      </Link>
                    </div>
                  </div>
                ) : null}

                {!itemsLoading && visibleItems.length ? (
                <div
                  style={{
                    display: "grid",
                    gap: 10,
                    position: "relative",
                  }}
                >
                  {sortedVisibleItems.map((item) => {
                    const learnerLabel =
                      learnerLabelById.get(item.learnerId ?? "") || "Whole family";
                    const expanded = expandedItemIds.includes(item.id);
                    const capturedEvidence =
                      evidenceByCalendarItemId.get(item.id) ?? null;
                    const programLabel = item.programId
                      ? programLabelById.get(item.programId) ?? null
                      : null;
                    const segmentLabel = item.programSegmentId
                      ? segmentLabelById.get(item.programSegmentId) ?? null
                      : null;
                    const notesPreview = getPreviewText(item.description);

                    return (
                      <div
                        key={item.id}
                        style={{
                          border: expanded ? "1px solid #cfe3ff" : "1px solid #e2e8f0",
                          borderRadius: 18,
                          background: expanded ? "#ffffff" : "#fcfdff",
                          padding: 0,
                          display: "grid",
                          overflow: "hidden",
                          boxShadow: expanded
                            ? "0 10px 24px rgba(15,23,42,0.05)"
                            : "0 4px 14px rgba(15,23,42,0.03)",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => toggleExpanded(item.id)}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 14,
                            alignItems: "flex-start",
                            padding: 14,
                            background: expanded ? "#f8fbff" : "#fcfdff",
                            border: "none",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          <div
                            style={{
                              minWidth: 88,
                              display: "grid",
                              gap: 4,
                              color: "#1d4ed8",
                              fontWeight: 800,
                              flexShrink: 0,
                              alignSelf: "stretch",
                              padding: "10px 12px",
                              borderRadius: 14,
                              background: expanded ? "#dbeafe" : "#eff6ff",
                            }}
                          >
                            <span>{formatTimeLabel(item.startsAt)}</span>
                            {item.endsAt ? (
                              <span style={{ color: "#94a3b8", fontWeight: 700 }}>
                                to {formatTimeLabel(item.endsAt)}
                              </span>
                            ) : null}
                          </div>
                          <div style={{ display: "grid", gap: 8, flex: 1 }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 12,
                                flexWrap: "wrap",
                                alignItems: "center",
                              }}
                            >
                              <strong style={{ color: "#0f172a", fontSize: 16 }}>{item.title}</strong>
                              <span style={{ color: "#64748b", fontSize: 13, fontWeight: 700 }}>
                                {expanded ? "Hide details" : "Show details"}
                              </span>
                            </div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              <span style={blockMetaPillStyle}>{learnerLabel}</span>
                              {item.learningArea ? (
                                <span style={blockMetaPillStyle}>{item.learningArea}</span>
                              ) : null}
                              {programLabel ? (
                                <span style={blockMetaPillStyle}>{`Program: ${programLabel}`}</span>
                              ) : null}
                              {segmentLabel ? (
                                <span style={blockMetaPillStyle}>{`Week / segment: ${segmentLabel}`}</span>
                              ) : null}
                              {capturedEvidence ? (
                                <span style={blockMetaPillStyle}>✓ Learning captured</span>
                              ) : null}
                            </div>
                            <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                              {notesPreview ?? "Open for notes and capture."}
                            </div>
                          </div>
                        </button>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            flexWrap: "wrap",
                            padding: "0 14px 12px",
                          }}
                        >
                          {item.completedAt ? (
                            <>
                              <span
                                role="status"
                                style={{ color: "#166534", fontSize: 13, fontWeight: 800 }}
                              >
                                ✓ Completed
                              </span>
                              <button
                                type="button"
                                onClick={() => void handleCompletionToggle(item)}
                                disabled={completionUpdatingIds.has(item.id)}
                                aria-label={`Mark ${item.title} not complete`}
                                style={{
                                  ...secondaryButtonStyle,
                                  padding: "7px 10px",
                                  color: "#475569",
                                  fontSize: 12,
                                  opacity: completionUpdatingIds.has(item.id) ? 0.6 : 1,
                                }}
                              >
                                {completionUpdatingIds.has(item.id)
                                  ? "Updating..."
                                  : "Mark not complete"}
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void handleCompletionToggle(item)}
                              disabled={completionUpdatingIds.has(item.id)}
                              aria-label={`Mark ${item.title} complete`}
                              style={{
                                ...secondaryButtonStyle,
                                padding: "7px 10px",
                                color: "#166534",
                                borderColor: "#bbf7d0",
                                background: "#f0fdf4",
                                fontSize: 12,
                                opacity: completionUpdatingIds.has(item.id) ? 0.6 : 1,
                              }}
                            >
                              {completionUpdatingIds.has(item.id)
                                ? "Updating..."
                                : "○ Mark complete"}
                            </button>
                          )}
                          {completionError?.itemId === item.id ? (
                            <span role="alert" style={{ color: "#b91c1c", fontSize: 13 }}>
                              {completionError.message}
                            </span>
                          ) : null}
                        </div>

                        {expanded ? (
                          <div
                            style={{
                              borderTop: "1px solid #e2e8f0",
                              background: "#fbfdff",
                              padding: 14,
                              display: "grid",
                              gap: 10,
                            }}
                          >
                            <div style={{ color: "#64748b", fontSize: 12, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                              Details
                            </div>
                            {item.description ? (
                              <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                                {item.description}
                              </p>
                            ) : (
                              <p style={{ margin: 0, color: "#64748b" }}>
                                No extra notes yet for this learning block.
                              </p>
                            )}
                            {programLabel || segmentLabel ? (
                              <div style={{ color: "#475569", lineHeight: 1.6 }}>
                                {programLabel ? `Program: ${programLabel}` : ""}
                                {programLabel && segmentLabel ? " - " : ""}
                                {segmentLabel ? `Week / segment: ${segmentLabel}` : ""}
                              </div>
                            ) : null}
                            {capturedEvidence ? (
                              <div style={{ color: "#0f766e", fontWeight: 700 }}>
                                ✓ Learning captured
                              </div>
                            ) : null}
                            <div
                              data-guidance-id="my-day-capture-evidence"
                              style={{ display: "flex", gap: 14, flexWrap: "wrap" }}
                            >
                              {capturedEvidence ? (
                                <Link
                                  href={buildCaptureHref(item, capturedEvidence.id)}
                                  style={{ color: "#1d4ed8", fontWeight: 700 }}
                                >
                                  View capture
                                </Link>
                              ) : (
                                <Link
                                  href={buildCaptureHref(item)}
                                  style={{ color: "#1d4ed8", fontWeight: 700 }}
                                >
                                  Quick Capture
                                </Link>
                              )}
                              {helpRequests.filter((request) => request.sourceType === "calendar_item" && request.sourceId === item.id).map((request) => (
                                <div key={request.id} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", color: "#92400e" }}>
                                  <strong>{learnerLabelById.get(request.learnerId) || "Learner"} needs help</strong>
                                  <button type="button" onClick={() => void handleClearHelp(request.id)} style={{ ...secondaryButtonStyle, padding: "7px 10px", color: "#92400e", borderColor: "#fcd34d", background: "#fffbeb" }}>Got it</button>
                                </div>
                              ))}
                              <Link
                                href={calendarPathBase}
                                style={{ color: "#1d4ed8", fontWeight: 700 }}
                              >
                                Open in My Calendar
                              </Link>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
                <details className="mylearna-day-secondary-actions" style={{ borderTop: "1px solid #e2e8f0", paddingTop: 12 }}>
                  <summary style={{ width: "fit-content", minHeight: 40, display: "flex", alignItems: "center", color: "#334155", cursor: "pointer", fontSize: 14, fontWeight: 800 }}>
                    Plan and organise
                  </summary>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", paddingTop: 10 }}>
                    <button type="button" onClick={openQuickAdd} style={secondaryButtonStyle}>
                      Add a quick block
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDailyPlannerDownload()}
                      style={secondaryButtonStyle}
                      disabled={dailyPlannerDownloading}
                    >
                      {dailyPlannerDownloading ? "Preparing..." : "Print today's plan"}
                    </button>
                    <Link href={calendarPathBase} style={{ ...secondaryButtonStyle, textDecoration: "none" }}>
                      Open My Calendar
                    </Link>
                  </div>
                </details>
                <datalist id="clean-my-day-learning-areas">
                  {COMMON_LEARNING_AREAS.map((area) => (
                    <option key={area} value={area} />
                  ))}
                </datalist>
              </div>
            </section>

            <RecoverMyWeekSection
              items={recoverableLearningItems}
              onDeckItems={onDeckItems}
              onKeepInFocus={(item) => void handleKeepRecoveryInFocus(item)}
              updatingIds={recoveryUpdatingIds}
              error={recoveryError}
            />

            <AddCustomLearningSection
              learnerOptions={learnerOptions}
              defaultLearnerId={defaultQuickAddLearnerId}
              onCreated={handleCreateCustomLearning}
            />

            <OnDeckSection
              items={resolvedOnDeckItems}
              helpRequests={helpRequests}
              onClearHelp={(requestId) => void handleClearHelp(requestId)}
              onAddResource={(input) => handleAddCustomResource(input)}
              onRemoveResource={(resourceId) => handleRemoveCustomResource(resourceId)}
              onUploadPdf={handleUploadCustomPdf}
              learnerLabelById={learnerLabelById}
              onMove={(itemId, learnerId, direction) =>
                void handleMoveOnDeckItem(itemId, learnerId, direction)
              }
              onRemove={(itemId) => void handleRemoveOnDeckItem(itemId)}
              pathwaysHref={currentPathwayHref}
              whereWeAreHref={buildLearnerContextHref("/my-learna", selectedLearnerId)}
              selectedLearnerId={selectedLearnerId}
              updatingId={onDeckUpdatingId}
              userId={user?.id}
            />

            {onDeckError ? (
              <div role="alert" style={{ color: "#b91c1c", fontSize: 13, fontWeight: 800 }}>
                {onDeckError}
              </div>
            ) : null}

            {PUBLIC_PATHWAYS_ENABLED ? <section data-guidance-id="my-day-next-pathways" style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ display: "grid", gap: 6, maxWidth: 620 }}>
                  <p style={{ margin: 0, color: "#2563eb", fontWeight: 800, fontSize: 13 }}>
                    Next step
                  </p>
                  <h2 style={{ margin: 0, color: "#0f172a", fontSize: 20 }}>
                    Explore My Pathways
                  </h2>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                    Find the next step, worksheet, practise or assess option.
                  </p>
                  <GuidanceSetupNextAction
                    stepId="day"
                    nextHref="/my-pathways"
                    label="Continue to My Pathways"
                    helperText="My Day has been reviewed. Continue to explore learning pathways."
                  />
                </div>
                <Link href={currentPathwayHref} style={{ ...secondaryButtonStyle, textDecoration: "none" }}>
                  Open My Pathways
                </Link>
              </div>
            </section> : null}

            <CleanFeedbackPrompt pageName="My Day" />
            </div> : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function CleanDayWorkspace() {
  return <CleanDayWorkspaceBody />;
}
