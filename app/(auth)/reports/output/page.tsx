"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";
import type {
  ComplianceReadiness,
  ComplianceReadinessItemStatus,
} from "@/lib/complianceReadiness";
import {
  loadReadinessForReportAssembly,
  loadReportAssemblyWorkspace,
  type ReportAssemblySupportingRecord,
  type ReportAssemblyWorkspace,
} from "@/lib/reportAssembly";
import {
  loadReportEvidenceMapping,
  type ArtifactMappingResult,
  type ReportEvidenceMapping,
} from "@/lib/reportEvidenceMapping";
import {
  loadReportSectionAutofill,
  type ReportSectionAutofillModel,
  type ReportSectionStarterBlock,
} from "@/lib/reportSectionAutofill";
import {
  appendStarterToSection,
  applyStarterToSection,
  dismissStarterForSection,
  insertStarterAtTop,
  replaceSectionContent,
} from "@/lib/reportSectionActions";
import {
  buildReportCompletionValidation,
  type ReportCompletionValidation,
  type ReportGateStatus,
  type ReportValidationIssue,
} from "@/lib/reportCompletionGate";
import {
  buildReportExportFilename,
} from "@/lib/reportExport";
import {
  loadReportExportHistory,
  summarizeReportExportHistoryEntry,
  type ReportExportHistoryEntry,
} from "@/lib/reportExportHistory";
import {
  currentPeriodRangeLabel,
  loadReportsBuilderModel,
  reportIntentLabel,
  reportIntentSentence,
  saveReportDocumentIntent,
  reportingModeLabel,
  type ReportIntent,
  type ReportsBuilderModel,
} from "@/lib/reporting";
import { supabase } from "@/lib/supabaseClient";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function readinessTone(status: ComplianceReadiness["status"]) {
  if (status === "ready") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "warning") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function artifactTone(status: ComplianceReadinessItemStatus) {
  if (status === "complete") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "in_progress") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function supportTone(tone: ReportAssemblySupportingRecord["tone"]) {
  if (tone === "ready") return "border-emerald-200 bg-emerald-50/70";
  if (tone === "warning") return "border-amber-200 bg-amber-50/70";
  return "border-slate-200 bg-slate-50/70";
}

function normalizeSectionKey(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function blockTone(type: ReportSectionStarterBlock["type"]) {
  if (type === "warning") return "border-amber-200 bg-amber-50/80";
  if (type === "next_step") return "border-blue-100 bg-blue-50/80";
  if (type === "prompt") return "border-violet-100 bg-violet-50/70";
  return "border-slate-200 bg-white";
}

function renderStarterBlock(block: ReportSectionStarterBlock, key: string) {
  const listClassName =
    block.type === "bullet_list" ||
    block.type === "record_list" ||
    block.type === "count_list";

  return (
    <div
      key={key}
      className={cx("grid gap-2 rounded-[14px] border px-3 py-3", blockTone(block.type))}
    >
      {block.title ? (
        <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          {block.title}
        </div>
      ) : null}
      {listClassName ? (
        <ul className="grid gap-1 text-[13px] leading-6 text-slate-700">
          {block.lines.map((line) => (
            <li key={`${key}-${line}`}>{line}</li>
          ))}
        </ul>
      ) : (
        <div className="grid gap-1 text-[13px] leading-6 text-slate-700">
          {block.lines.map((line) => (
            <div key={`${key}-${line}`}>{line}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function gateTone(status: ReportGateStatus) {
  if (status === "ready_for_export") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "blocked") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function issueTone(type: ReportValidationIssue["type"]) {
  if (type === "blocker") return "border-rose-200 bg-rose-50 text-rose-700";
  if (type === "warning") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function issueActionLabel(issue: ReportValidationIssue) {
  return issue.actionLabel || "Fix this";
}

function issueActionHref(issue: ReportValidationIssue) {
  return issue.actionTarget || null;
}

function sectionStatusTone(status: ReportCompletionValidation["sectionStates"][number]["supportStatus"]) {
  if (status === "strong") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "partial") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "weak") return "border-orange-200 bg-orange-50 text-orange-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function exportHistoryTone(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "ready_for_export") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (normalized === "blocked") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function shortHash(value: string | null) {
  const clean = String(value ?? "").trim();
  if (!clean) return "Not captured";
  if (clean.length <= 16) return clean;
  return `${clean.slice(0, 10)}...${clean.slice(-8)}`;
}

function historyLabels(entry: ReportExportHistoryEntry) {
  const summary = summarizeReportExportHistoryEntry(entry);
  return {
    exportedAt: summary.exportedAtLabel,
    validation: summary.validationLabel,
    exporter: summary.exporterLabel,
  };
}

function complianceModeSentence(validation: ReportCompletionValidation) {
  if (validation.reportIntent === "portfolio") {
    return "This export is treated as a documentation record, not a required submission.";
  }

  if (validation.jurisdictionBehaviour.strictGateEnabled) {
    return "Required before this report can be exported.";
  }

  if (validation.jurisdictionBehaviour.portfolioModeEnabled) {
    return "Optional for your records, but helpful for documentation.";
  }

  return "Recommended for a complete record in this jurisdiction.";
}

function complianceStatusTone(isComplete: boolean, isAttentionNeeded: boolean) {
  if (isComplete) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (isAttentionNeeded) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function intentTone(intent: ReportIntent, active: boolean) {
  if (active) return "border-slate-950 bg-slate-950 text-white";
  if (intent === "portfolio") return "border-slate-200 bg-white text-slate-700 hover:bg-slate-50";
  return "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100";
}

function complianceRecordLabel(status: string | null | undefined, fallback: string) {
  const normalized = String(status ?? "").trim().toLowerCase();
  if (!normalized) return fallback;
  if (normalized === "submitted" || normalized === "acknowledged") return "Ready";
  if (normalized === "not_required" || normalized === "waived") return "Not required";
  if (normalized === "draft" || normalized === "due") return "In progress";
  return normalized.replace(/_/g, " ");
}

function complianceSummaryLabel(model: ReportsBuilderModel, validation: ReportCompletionValidation) {
  const requiredNotification = Boolean(model.requiresNotification);
  const notificationSubmitted =
    model.notificationSummary.submitted > 0 ||
    ["submitted", "acknowledged", "not_required", "waived"].includes(
      String(model.notificationSummary.latestStatus ?? "").toLowerCase(),
    );
  const attendanceStarted =
    model.attendanceSummary.records > 0 ||
    model.attendanceSummary.days > 0 ||
    model.attendanceSummary.hours > 0;
  const planCoverage = model.planCount > 0 || model.subjectLogCount > 0;

  return {
    notification: requiredNotification
      ? notificationSubmitted
        ? "Notification submitted"
        : model.notificationSummary.total > 0
          ? "Notification in progress"
          : "Needs attention"
      : "No formal notification required",
    attendance: Boolean(model.requiresAttendanceTracking)
      ? attendanceStarted
        ? `${model.attendanceSummary.days} days and ${model.attendanceSummary.hours} hours recorded`
        : "Attendance tracking is still empty"
      : "Attendance tracking optional",
    plan: Boolean(model.ruleSet?.requiresYearlyPlan || model.ruleSet?.requiresSubjectList)
      ? planCoverage
        ? `${model.planCount} plan${model.planCount === 1 ? "" : "s"} and ${model.subjectLogCount} subject log${model.subjectLogCount === 1 ? "" : "s"}`
        : "Plan and subject coverage still need attention"
      : "Plan tracking is optional",
    behavior: complianceModeSentence(validation),
  };
}

function ComplianceContextPanel({
  model,
  readiness,
  validation,
}: {
  model: ReportsBuilderModel;
  readiness: ComplianceReadiness;
  validation: ReportCompletionValidation;
}) {
  const summary = complianceSummaryLabel(model, validation);
  const notificationSubmitted =
    model.notificationSummary.submitted > 0 ||
    ["submitted", "acknowledged", "not_required", "waived"].includes(
      String(model.notificationSummary.latestStatus ?? "").toLowerCase(),
    );
  const attendanceStarted =
    model.attendanceSummary.records > 0 ||
    model.attendanceSummary.days > 0 ||
    model.attendanceSummary.hours > 0;
  const planCoverage = model.planCount > 0 || model.subjectLogCount > 0;
  const readyTone = readiness.status === "ready";
  const attentionTone =
    readiness.status === "warning" || validation.status === "blocked" || validation.blockers.length > 0;

  return (
    <section className="grid gap-4 rounded-[26px] border border-blue-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.99)_0%,rgba(239,246,255,0.94)_58%,rgba(248,250,252,0.97)_100%)] p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)] lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="grid gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-1.5">
            <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Compliance context
            </div>
            <h2 className="text-[24px] font-black tracking-tight text-slate-950">
              Inputs reflected in reporting
            </h2>
          </div>
          <span
            className={cx(
              "inline-flex rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em]",
              complianceStatusTone(readyTone, attentionTone),
            )}
          >
            {validation.complianceModeLabel}
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[18px] border border-white/80 bg-white/85 p-4">
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              Notification
            </div>
            <div className="mt-2 text-[15px] font-bold text-slate-950">
              {summary.notification}
            </div>
            <div className="mt-1 text-sm leading-6 text-slate-600">
              {model.notificationSummary.latestStatus
                ? `Status: ${complianceRecordLabel(model.notificationSummary.latestStatus, "Not started")}`
                : "No saved notification record yet"}
            </div>
          </div>

          <div className="rounded-[18px] border border-white/80 bg-white/85 p-4">
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              Attendance
            </div>
            <div className="mt-2 text-[15px] font-bold text-slate-950">
              {summary.attendance}
            </div>
            <div className="mt-1 text-sm leading-6 text-slate-600">
              {model.attendanceSummary.records > 0
                ? `${model.attendanceSummary.records} summary record${model.attendanceSummary.records === 1 ? "" : "s"}`
                : "No attendance summary has been saved yet"}
            </div>
          </div>

          <div className="rounded-[18px] border border-white/80 bg-white/85 p-4">
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              Plan / subjects
            </div>
            <div className="mt-2 text-[15px] font-bold text-slate-950">
              {summary.plan}
            </div>
            <div className="mt-1 text-sm leading-6 text-slate-600">
              {model.planCount > 0
                ? `${model.planCount} learning plan${model.planCount === 1 ? "" : "s"} in view`
                : "No plan has been captured yet"}
            </div>
          </div>

          <div className="rounded-[18px] border border-white/80 bg-white/85 p-4">
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              Behaviour mode
            </div>
            <div className="mt-2 text-[15px] font-bold text-slate-950">
              {validation.complianceModeLabel}
            </div>
            <div className="mt-1 text-sm leading-6 text-slate-600">
              {summary.behavior}
            </div>
          </div>

          <div className="rounded-[18px] border border-white/80 bg-white/85 p-4">
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              Report intent
            </div>
            <div className="mt-2 text-[15px] font-bold text-slate-950">
              {reportIntentLabel(model.reportIntent)}
            </div>
            <div className="mt-1 text-sm leading-6 text-slate-600">
              {reportIntentSentence(model.reportIntent)}
            </div>
          </div>
        </div>

        <div className="rounded-[20px] border border-slate-200 bg-white/80 px-4 py-4 text-sm leading-7 text-slate-600">
          {validation.jurisdictionBehaviour.reportsText}
        </div>
      </div>

      <aside className="grid gap-3 rounded-[22px] border border-white/80 bg-white/88 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
            Readiness
          </div>
          <div className="mt-2 text-[34px] font-black tracking-tight text-slate-950">
            {readiness.score}
          </div>
        </div>
        <div className="text-sm leading-6 text-slate-600">{readiness.summary}</div>
        <div
          className={cx(
            "inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em]",
            readinessTone(readiness.status),
          )}
        >
          {readiness.status.replace("_", " ")}
        </div>
      </aside>
    </section>
  );
}

function CompletionGateCard({
  validation,
}: {
  validation: ReportCompletionValidation;
}) {
  const topBlockers = validation.blockers.slice(0, 3);
  const topWarnings = validation.warnings.slice(0, 3);
  const completedSections = validation.sectionStates
    .filter((section) => section.status === "complete")
    .slice(0, 4);
  const incompleteSections = validation.sectionStates
    .filter((section) => section.blocking)
    .slice(0, 4);

  return (
    <section id="report-completion-gate" className="grid gap-4 rounded-[26px] border border-blue-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.99)_0%,rgba(238,245,255,0.94)_58%,rgba(248,250,252,0.97)_100%)] p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)] lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="grid gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-1.5">
            <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Completion gate
            </div>
            <h2 className="text-[24px] font-black tracking-tight text-slate-950">
              Pre-export authority validation
            </h2>
          </div>
          <span
            className={cx(
              "inline-flex rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em]",
              gateTone(validation.status),
            )}
          >
            {validation.status.replace("_", " ")}
          </span>
        </div>

        <p className="max-w-[820px] text-sm leading-7 text-slate-600">
          {validation.summary}
        </p>
        <div className="rounded-[18px] border border-white/80 bg-white/80 px-4 py-4 text-sm leading-7 text-slate-600">
          {validation.jurisdictionBehaviour.reportsText}
        </div>
        <div className="inline-flex w-fit rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700">
          {validation.complianceModeLabel}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[18px] border border-slate-200 bg-white/80 px-4 py-4">
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              Sections complete
            </div>
            <div className="mt-2 text-[24px] font-black text-slate-950">
              {validation.completedSectionCount}/{validation.totalSectionCount || 0}
            </div>
          </div>
          <div className="rounded-[18px] border border-slate-200 bg-white/80 px-4 py-4">
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              Required artifacts
            </div>
            <div className="mt-2 text-[24px] font-black text-slate-950">
              {validation.completedArtifactCount}/{validation.totalArtifactCount || 0}
            </div>
          </div>
          <div className="rounded-[18px] border border-slate-200 bg-white/80 px-4 py-4">
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              Gate score
            </div>
            <div className="mt-2 text-[24px] font-black text-slate-950">
              {validation.score}
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-2 rounded-[20px] border border-slate-200 bg-white px-4 py-4">
            <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Blocking issues
            </div>
            {topBlockers.length ? (
              <div className="grid gap-2">
                {topBlockers.map((issue) => (
                  <div
                    key={`${issue.code}-${issue.label}`}
                    className={cx("rounded-[14px] border px-3 py-3 text-sm leading-6", issueTone(issue.type))}
                  >
                    <div className="font-bold text-slate-950">{issue.label}</div>
                    <div className="mt-1">{issue.detail}</div>
                    {issueActionHref(issue) ? (
                      <div className="mt-3">
                        <Link
                          href={issueActionHref(issue)!}
                          className="inline-flex items-center justify-center rounded-full bg-slate-950 px-3 py-2 text-[12px] font-bold text-white transition hover:bg-slate-800"
                        >
                          {issueActionLabel(issue)}
                        </Link>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[14px] border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm leading-6 text-emerald-800">
                No blocking issues are currently detected.
              </div>
            )}
          </div>

          <div className="grid gap-2 rounded-[20px] border border-slate-200 bg-white px-4 py-4">
            <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Warnings and notes
            </div>
            {topWarnings.length ? (
              <div className="grid gap-2">
                {topWarnings.map((issue) => (
                  <div
                    key={`${issue.code}-${issue.label}`}
                    className={cx("rounded-[14px] border px-3 py-3 text-sm leading-6", issueTone(issue.type))}
                  >
                    <div className="font-bold text-slate-950">{issue.label}</div>
                    <div className="mt-1">{issue.detail}</div>
                    {issueActionHref(issue) ? (
                      <div className="mt-3">
                        <Link
                          href={issueActionHref(issue)!}
                          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-2 text-[12px] font-bold text-slate-900 transition hover:bg-slate-50"
                        >
                          {issueActionLabel(issue)}
                        </Link>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-600">
                No current warnings are preventing export readiness.
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-3 rounded-[20px] border border-slate-200 bg-slate-50/80 px-4 py-4">
          <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Section status
          </div>
          <div className="flex flex-wrap gap-2">
            {completedSections.length ? (
              completedSections.map((section) => (
                <span
                  key={section.sectionKey}
                  className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-700"
                >
                  {section.title}
                </span>
              ))
            ) : (
              <span className="text-sm leading-6 text-slate-600">
                No sections have cleared the gate yet.
              </span>
            )}
          </div>
          {incompleteSections.length ? (
            <div className="flex flex-wrap gap-2">
              {incompleteSections.map((section) => (
                <span
                  key={section.sectionKey}
                  className={cx(
                    "inline-flex rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em]",
                    sectionStatusTone(section.supportStatus),
                  )}
                >
                  {section.title}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <aside className="grid gap-3 rounded-[22px] border border-white/80 bg-white/88 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
            Next action
          </div>
          <div className="mt-2 text-[16px] font-bold text-slate-950">
            {validation.nextAction || "Continue strengthening the draft"}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
            Jurisdiction
          </div>
          <div className="mt-2 text-sm font-bold text-slate-950">
            {validation.jurisdictionCode || "Not resolved"}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
            Report document
          </div>
          <div className="mt-2 text-sm font-bold text-slate-950">
            {validation.reportDocumentId ? "Draft present" : "Not available"}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
            Reporting period
          </div>
          <div className="mt-2 text-sm font-bold text-slate-950">
            {validation.reportingPeriodId ? "Resolved" : "Not available"}
          </div>
        </div>
      </aside>
    </section>
  );
}

function ExportGateCard({
  validation,
  canExport,
  exportMessage,
  exportError,
  exportBusy,
  onOpenPrintable,
  onDownloadHtml,
}: {
  validation: ReportCompletionValidation;
  canExport: boolean;
  exportMessage: string;
  exportError: string;
  exportBusy: "open" | "download" | "";
  onOpenPrintable: () => void;
  onDownloadHtml: () => void;
}) {
  const blockers = validation.blockers.slice(0, 3);
  const exportSentence = complianceModeSentence(validation);

  return (
    <section
      id="report-export"
      className="grid gap-4 rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)] lg:grid-cols-[minmax(0,1fr)_280px]"
    >
      <div className="grid gap-4">
        <div className="grid gap-1.5">
          <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Validated export
          </div>
          <h2 className="text-[24px] font-black tracking-tight text-slate-950">
            Printable HTML export
          </h2>
        </div>
        <p className="max-w-[820px] text-sm leading-7 text-slate-600">
          Export is only available after the completion gate confirms the report is ready. The printable export reflects the saved draft content already assembled in the report workspace.
        </p>
        <div className="rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm leading-7 text-slate-600">
          {validation.jurisdictionBehaviour.portfolioText}
        </div>
        <div className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700">
          {validation.complianceModeLabel}
        </div>
        <div className="inline-flex w-fit rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700">
          {reportIntentLabel(validation.reportIntent)}
        </div>
        <div className="rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm leading-7 text-slate-600">
          {exportSentence}
        </div>

        {exportError ? (
          <div className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm leading-7 text-rose-800">
            {exportError}
          </div>
        ) : null}

        {exportMessage ? (
          <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-7 text-emerald-800">
            {exportMessage}
          </div>
        ) : null}

        {!canExport ? (
          <div className="grid gap-3 rounded-[20px] border border-amber-200 bg-amber-50/80 px-4 py-4">
            <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Export blocked
            </div>
            <div className="text-sm leading-7 text-slate-700">
              The report completion gate is not yet ready for export.
            </div>
            {blockers.length ? (
              <div className="grid gap-2">
                {blockers.map((issue) => (
                  <div
                    key={`${issue.code}-${issue.label}`}
                    className="rounded-[14px] border border-rose-200 bg-rose-50 px-3 py-3 text-sm leading-6 text-rose-700"
                  >
                    <div className="font-bold text-slate-950">{issue.label}</div>
                    <div className="mt-1">{issue.detail}</div>
                    {issueActionHref(issue) ? (
                      <div className="mt-3">
                        <Link
                          href={issueActionHref(issue)!}
                          className="inline-flex items-center justify-center rounded-full bg-slate-950 px-3 py-2 text-[12px] font-bold text-white transition hover:bg-slate-800"
                        >
                          {issueActionLabel(issue)}
                        </Link>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-[20px] border border-emerald-200 bg-emerald-50/80 px-4 py-4 text-sm leading-7 text-emerald-800">
            The report is ready for export. The buttons below will produce a printable HTML version from the persisted draft content.
          </div>
        )}
      </div>

      <aside className="grid gap-3 rounded-[22px] border border-white/80 bg-slate-50/80 p-5">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
            Next export action
          </div>
          <div className="mt-2 text-[16px] font-bold text-slate-950">
            {canExport ? "Open printable export" : "Resolve gate blockers first"}
          </div>
        </div>

        <button
          type="button"
          disabled={!canExport || Boolean(exportBusy)}
          onClick={onOpenPrintable}
          className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {exportBusy === "open" ? "Opening export..." : "Open printable export"}
        </button>

        <button
          type="button"
          disabled={!canExport || Boolean(exportBusy)}
          onClick={onDownloadHtml}
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {exportBusy === "download" ? "Downloading..." : "Download HTML"}
        </button>

        <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-600">
          This export stays tied to the saved report draft and the validation gate. It does not bypass the completion check.
        </div>
      </aside>
    </section>
  );
}

function ExportHistoryCard({
  reportDocumentId,
  history,
  loading,
  error,
}: {
  reportDocumentId: string;
  history: ReportExportHistoryEntry[];
  loading: boolean;
  error: string;
}) {
  const latest = history[0] || null;

  return (
    <section className="grid gap-4 rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
      <div className="grid gap-1.5">
        <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Export history
        </div>
        <h2 className="text-[24px] font-black tracking-tight text-slate-950">
          Audit trail for validated exports
        </h2>
        <p className="max-w-[820px] text-sm leading-7 text-slate-600">
          Every successful server-validated export is recorded here. The history is tied to this report document and shows when it left the platform, who exported it, and which validation state it passed under.
        </p>
      </div>

      {error ? (
        <div className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm leading-7 text-rose-800">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600">
          Loading export history...
        </div>
      ) : latest ? (
        <div className="grid gap-3 rounded-[20px] border border-emerald-200 bg-emerald-50/60 px-4 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="grid gap-1">
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                Last exported
              </div>
              <div className="text-[16px] font-bold text-slate-950">
                {historyLabels(latest).exportedAt}
              </div>
            </div>
            <span
              className={cx(
                "inline-flex rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em]",
                exportHistoryTone(latest.validationStatus),
              )}
            >
              {historyLabels(latest).validation}
            </span>
          </div>

          <div className="grid gap-3 text-sm leading-7 text-slate-700 md:grid-cols-2">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                Exported by
              </div>
              <div className="mt-1 font-semibold text-slate-950">
                {historyLabels(latest).exporter}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                Format
              </div>
              <div className="mt-1 font-semibold text-slate-950">
                {latest.exportFormat.toUpperCase()}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                Learner
              </div>
              <div className="mt-1 font-semibold text-slate-950">{latest.learnerId}</div>
            </div>
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                Jurisdiction
              </div>
              <div className="mt-1 font-semibold text-slate-950">
                {latest.jurisdictionCode || "Not recorded"}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                Section count
              </div>
              <div className="mt-1 font-semibold text-slate-950">
                {latest.sectionCount ?? 0}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                Report document
              </div>
              <div className="mt-1 font-semibold text-slate-950">
                {reportDocumentId}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                Validation score
              </div>
              <div className="mt-1 font-semibold text-slate-950">
                {latest.validationScore ?? 0}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                File name
              </div>
              <div className="mt-1 font-semibold text-slate-950">
                {latest.filename || "Not recorded"}
              </div>
            </div>
          </div>

          <div className="grid gap-1 rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-600">
            <div>
              Content hash: <span className="font-semibold text-slate-950">{shortHash(latest.contentHash)}</span>
            </div>
            <div>
              Report context: <span className="font-semibold text-slate-950">{latest.reportingPeriodId || "Reporting period not recorded"}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-4 text-sm leading-7 text-slate-600">
          No validated exports have been recorded for this report yet.
        </div>
      )}

      {history.length ? (
        <div className="grid gap-3">
          {history.map((entry) => {
            const labels = historyLabels(entry);
            return (
              <div
                key={entry.id}
                className="grid gap-3 rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="grid gap-1">
                    <div className="text-[15px] font-bold text-slate-950">
                      {entry.filename || "Validated report export"}
                    </div>
                    <div className="text-[13px] leading-6 text-slate-500">
                      {labels.exportedAt} - {labels.exporter}
                    </div>
                  </div>
                  <span
                    className={cx(
                      "inline-flex rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em]",
                      exportHistoryTone(entry.validationStatus),
                    )}
                  >
                    {labels.validation}
                  </span>
                </div>

                <div className="grid gap-2 text-[13px] leading-6 text-slate-700 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <span className="font-semibold text-slate-500">Format:</span>{" "}
                    {entry.exportFormat.toUpperCase()}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">Learner:</span>{" "}
                    {entry.learnerId}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">Jurisdiction:</span>{" "}
                    {entry.jurisdictionCode || "Not recorded"}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">Sections:</span>{" "}
                    {entry.sectionCount ?? 0}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">Validation score:</span>{" "}
                    {entry.validationScore ?? 0}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">Report ID:</span>{" "}
                    {entry.reportDocumentId}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">Hash:</span>{" "}
                    {shortHash(entry.contentHash)}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">Phase:</span>{" "}
                    {entry.exportPhase.replace("_", " ")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function EmptyState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <section className="grid gap-4 rounded-[24px] border border-dashed border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
      <div className="grid gap-1.5">
        <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Report output
        </div>
        <h2 className="text-[18px] font-bold tracking-tight text-slate-950">{title}</h2>
      </div>
      <p className="max-w-[760px] text-sm leading-7 text-slate-600">{message}</p>
      <div>
        <Link
          href="/reports"
          className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
        >
          Back to reports
        </Link>
      </div>
    </section>
  );
}

export default function ReportsOutputPage() {
  const searchParams = useSearchParams();
  const { workspace, activeLearner } = useFamilyWorkspace();
  const [model, setModel] = useState<ReportsBuilderModel | null>(null);
  const [readiness, setReadiness] = useState<ComplianceReadiness | null>(null);
  const [assembly, setAssembly] = useState<ReportAssemblyWorkspace | null>(null);
  const [mapping, setMapping] = useState<ReportEvidenceMapping | null>(null);
  const [autofill, setAutofill] = useState<ReportSectionAutofillModel | null>(null);
  const [validation, setValidation] = useState<ReportCompletionValidation | null>(null);
  const [exportHistory, setExportHistory] = useState<ReportExportHistoryEntry[]>([]);
  const [exportHistoryLoading, setExportHistoryLoading] = useState(false);
  const [exportHistoryError, setExportHistoryError] = useState("");
  const [exportBusy, setExportBusy] = useState<"open" | "download" | "">("");
  const [exportMessage, setExportMessage] = useState("");
  const [exportError, setExportError] = useState("");
  const [dismissedSections, setDismissedSections] = useState<Record<string, boolean>>({});
  const [sectionPending, setSectionPending] = useState<Record<string, string>>({});
  const [sectionErrors, setSectionErrors] = useState<Record<string, string>>({});
  const [refreshTick, setRefreshTick] = useState(0);
  const [intentSaving, setIntentSaving] = useState<ReportIntent | "">("");
  const [intentMessage, setIntentMessage] = useState("");
  const [intentError, setIntentError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      if (!activeLearner) {
        if (mounted) {
          setModel(null);
          setReadiness(null);
          setAssembly(null);
          setMapping(null);
          setAutofill(null);
          setValidation(null);
          setExportHistory([]);
          setExportHistoryLoading(false);
          setExportHistoryError("");
          setExportBusy("");
          setExportMessage("");
          setExportError("");
          setDismissedSections({});
          setSectionPending({});
          setSectionErrors({});
        }
        return;
      }

      setExportHistoryLoading(true);
      setExportHistoryError("");

      try {
        const next = await loadReportsBuilderModel({
          profile: workspace.profile,
          learner: activeLearner,
          userId: workspace.userId,
          mode: "ensure",
          preferredDocumentId:
            searchParams.get("documentId") ||
            searchParams.get("docId") ||
            searchParams.get("draftId"),
        });
        const readinessResult = await loadReadinessForReportAssembly(activeLearner.id);
        const assemblyResult = await loadReportAssemblyWorkspace({
          model: next,
          readiness: readinessResult,
        });
        const mappingResult = await loadReportEvidenceMapping({
          model: next,
        });
        const autofillResult = await loadReportSectionAutofill({
          model: next,
          mapping: mappingResult,
        });
        const validationResult = buildReportCompletionValidation({
          model: next,
          readiness: readinessResult,
          assembly: assemblyResult,
          mapping: mappingResult,
          autofill: autofillResult,
        });
        let historyResult: ReportExportHistoryEntry[] = [];
        if (next.reportDocument?.id) {
          try {
            historyResult = await loadReportExportHistory({
              reportDocumentId: next.reportDocument.id,
              client: supabase,
              limit: 8,
            });
          } catch (error) {
            if (mounted) {
              setExportHistoryError(
                error instanceof Error
                  ? error.message
                  : "Export history could not be loaded right now.",
              );
            }
          }
        }

        if (mounted) {
          setModel(next);
          setReadiness(readinessResult);
          setAssembly(assemblyResult);
          setMapping(mappingResult);
          setAutofill(autofillResult);
          setValidation(validationResult);
          setExportHistory(historyResult);
          setExportBusy("");
          setExportMessage("");
          setExportError("");
          setDismissedSections({});
          setSectionPending({});
          setSectionErrors({});
        }
      } catch (error) {
        if (mounted) {
          setExportHistoryError(
            error instanceof Error
              ? error.message
              : "The report workspace could not be loaded right now.",
          );
        }
      } finally {
        if (mounted) {
          setExportHistoryLoading(false);
        }
      }
    }

    void hydrate();

    return () => {
      mounted = false;
    };
  }, [activeLearner, refreshTick, searchParams, workspace.profile, workspace.userId]);

  async function handleReportIntentChange(nextIntent: ReportIntent) {
    if (!model?.reportDocument?.id || intentSaving) return;

    setIntentSaving(nextIntent);
    setIntentMessage("");
    setIntentError("");

    try {
      const saved = await saveReportDocumentIntent(model.reportDocument.id, nextIntent);
      const resolvedIntent = saved?.reportIntent || nextIntent;

      setModel((current) =>
        current
          ? {
              ...current,
              reportIntent: resolvedIntent,
            }
          : current,
      );
      setValidation((current) =>
        current
          ? {
              ...current,
              reportIntent: resolvedIntent,
            }
          : current,
      );
      setIntentMessage(`${reportIntentLabel(resolvedIntent)} saved.`);
      setRefreshTick((current) => current + 1);
    } catch (error) {
      setIntentError(
        error instanceof Error ? error.message : "The report intent could not be saved right now.",
      );
    } finally {
      setIntentSaving("");
    }
  }

  if (!activeLearner) {
    return (
      <EmptyState
        title="Choose a learner first"
        message="The report assembly workspace needs one learner in focus before it can resolve the correct reporting context."
      />
    );
  }

  if (!model || !readiness || !assembly || !mapping || !autofill) {
    return <div className="h-64 animate-pulse rounded-[24px] bg-slate-100" />;
  }

  const reportDocumentId = validation?.reportDocumentId || model.reportDocument?.id || "";
  const canExport = validation?.status === "ready_for_export" && Boolean(reportDocumentId);

  if (!model.reportDocument) {
    return (
      <EmptyState
        title={model.reportingPeriod ? "No report draft is ready yet" : "No reporting period is ready yet"}
        message={
          model.reportingPeriod
            ? "A current report document could not be created for this learner yet. Return to the reports builder to review the jurisdiction, cycle, and next recommended step."
            : "This learner does not yet have a current reporting period in view. Return to the reports builder to confirm the registration cycle and reporting setup."
        }
      />
    );
  }

  const fallbackExportTitle = model.reportDocument.title || "report-export";

  async function getAccessToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || "";
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function openPrintableHtml(html: string) {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    if (win) {
      win.focus();
      return true;
    }
    return false;
  }

  async function fetchValidatedExport(mode: "open" | "download") {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error("A signed-in session is required before export can run.");
    }

    const url = new URL("/api/report/export", window.location.origin);
    url.searchParams.set("reportDocumentId", reportDocumentId);
    url.searchParams.set("mode", mode);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      let message = "The report could not be exported right now.";
      try {
        const payload = (await response.json()) as {
          error?: string;
          validation?: { summary?: string; blockers?: Array<{ label?: string; detail?: string }> };
        };
        message = payload.error || payload.validation?.summary || message;

        if (payload.validation?.blockers?.length) {
          const blockerText = payload.validation.blockers
            .map((item) => [item.label, item.detail].filter(Boolean).join(": "))
            .filter(Boolean)
            .join(" ");
          if (blockerText) {
            message = `${message} ${blockerText}`.trim();
          }
        }
      } catch {
        // keep the fallback message
      }
      throw new Error(message);
    }

    const filename =
      response.headers.get("x-report-export-filename") ||
      buildReportExportFilename({
        reportTitle: fallbackExportTitle,
      } as any);

    return {
      html: await response.text(),
      filename,
      disposition: response.headers.get("content-disposition") || "",
    };
  }

  async function handlePrintableExport(mode: "open" | "download") {
    if (!canExport || exportBusy) return;

    setExportBusy(mode);
    setExportMessage("");
    setExportError("");

    try {
      const { html, filename } = await fetchValidatedExport(mode);

      if (mode === "download") {
        downloadBlob(new Blob([html], { type: "text/html;charset=utf-8" }), filename);
        setExportMessage("Printable HTML export downloaded successfully.");
      } else {
        if (!openPrintableHtml(html)) {
          throw new Error("The browser blocked the printable export window.");
        }
        setExportMessage("Printable HTML export opened in a new tab.");
      }

      try {
        const refreshed = await loadReportExportHistory({
          reportDocumentId,
          client: supabase,
          limit: 8,
        });
        setExportHistory(refreshed);
        setExportHistoryError("");
      } catch (refreshError) {
        setExportHistoryError(
          refreshError instanceof Error
            ? refreshError.message
            : "Export history could not be refreshed after export.",
        );
      }
    } catch (error) {
      setExportError(
        error instanceof Error
          ? error.message
          : "The printable export could not be created right now.",
      );
    } finally {
      setExportBusy("");
    }
  }

  async function runSectionAction(input: {
    sectionId: string;
    title: string;
    order: number;
    blocks: ReportSectionStarterBlock[];
    currentContent: string;
    action:
      | "use_starter"
      | "append_starter"
      | "insert_at_top"
      | "replace_section";
  }) {
    const activeModel = model;
    const sectionKey = normalizeSectionKey(input.title);
    if (!activeModel?.reportDocument) return;

    setSectionPending((current) => ({ ...current, [sectionKey]: input.action }));
    setSectionErrors((current) => ({ ...current, [sectionKey]: "" }));

    try {
      const common = {
        reportDocumentId: activeModel.reportDocument.id,
        sectionId: input.sectionId,
        title: input.title,
        order: input.order,
        starterBlocks: input.blocks,
        existingContent: input.currentContent,
      };

      const updated =
        input.action === "append_starter"
          ? await appendStarterToSection(common)
          : input.action === "insert_at_top"
            ? await insertStarterAtTop(common)
            : input.action === "replace_section"
              ? await replaceSectionContent(common)
              : await applyStarterToSection(common);

      const nextAssembly = {
        ...assembly!,
        sections: assembly!.sections.map((section) =>
          normalizeSectionKey(section.title) === sectionKey
            ? {
                ...section,
                id: updated.id || section.id,
                status: updated.status || "in_progress",
                contentPreview: updated.content,
                hasContent: Boolean(updated.content),
                sourceMode: updated.sourceMode || section.sourceMode,
                scaffoldOnly: false,
              }
            : section,
        ),
      };

      const nextAutofill = {
        ...autofill!,
        sections: autofill!.sections.map((section) =>
          section.sectionKey === sectionKey
            ? {
                ...section,
                status:
                  input.action === "replace_section" || input.action === "use_starter"
                    ? "in_progress"
                    : section.status === "missing"
                      ? "in_progress"
                      : section.status,
              }
            : section,
        ),
      };

      setAssembly(nextAssembly);
      setAutofill(nextAutofill);
      setValidation(
        buildReportCompletionValidation({
          model: activeModel,
          readiness: readiness!,
          assembly: nextAssembly,
          mapping: mapping!,
          autofill: nextAutofill,
        }),
      );
    } catch (error) {
      setSectionErrors((current) => ({
        ...current,
        [sectionKey]:
          error instanceof Error
            ? error.message
            : "This section could not be updated right now.",
      }));
    } finally {
      setSectionPending((current) => {
        const next = { ...current };
        delete next[sectionKey];
        return next;
      });
    }
  }

  return (
    <div className="grid gap-5 pb-14">
      {model.softWarning || assembly.softWarning ? (
        <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-7 text-amber-800">
          {[model.softWarning, assembly.softWarning].filter(Boolean).join(" ")}
        </div>
      ) : null}

      <section className="grid gap-4 rounded-[26px] border border-blue-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.99)_0%,rgba(239,246,255,0.94)_58%,rgba(248,250,252,0.97)_100%)] p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)] lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid gap-3">
          <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Report intent
          </div>
          <h2 className="text-[24px] font-black tracking-tight text-slate-950">
            Choose authority-ready or portfolio mode
          </h2>
          <p className="max-w-[760px] text-sm leading-7 text-slate-600">
            {reportIntentSentence(model.reportIntent)}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => void handleReportIntentChange("authority")}
              disabled={Boolean(intentSaving) || !model.reportDocument?.id}
              className={cx(
                "inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60",
                intentTone("authority", model.reportIntent === "authority"),
              )}
            >
              {intentSaving === "authority" ? "Saving..." : reportIntentLabel("authority")}
            </button>
            <button
              type="button"
              onClick={() => void handleReportIntentChange("portfolio")}
              disabled={Boolean(intentSaving) || !model.reportDocument?.id}
              className={cx(
                "inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60",
                intentTone("portfolio", model.reportIntent === "portfolio"),
              )}
            >
              {intentSaving === "portfolio" ? "Saving..." : reportIntentLabel("portfolio")}
            </button>
          </div>
          {intentMessage ? (
            <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-7 text-emerald-800">
              {intentMessage}
            </div>
          ) : null}
          {intentError ? (
            <div className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-7 text-rose-800">
              {intentError}
            </div>
          ) : null}
        </div>
        <aside className="grid gap-3 rounded-[22px] border border-white/80 bg-white/88 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
            Current mode
          </div>
          <div className="text-[18px] font-bold tracking-tight text-slate-950">
            {reportIntentLabel(model.reportIntent)}
          </div>
          <div className="text-sm leading-6 text-slate-600">
            {model.reportIntent === "portfolio"
              ? "Missing formal artifacts are treated as recommendations first."
              : "Required artifacts remain blockers where the jurisdiction says they should."}
          </div>
        </aside>
      </section>

      {validation ? <CompletionGateCard validation={validation} /> : null}

      {validation ? (
        <ExportGateCard
          validation={validation}
          canExport={Boolean(canExport)}
          exportMessage={exportMessage}
          exportError={exportError}
          exportBusy={exportBusy}
          onOpenPrintable={() => void handlePrintableExport("open")}
          onDownloadHtml={() => void handlePrintableExport("download")}
        />
      ) : null}

      {validation ? (
        <ExportHistoryCard
          reportDocumentId={reportDocumentId}
          history={exportHistory}
          loading={exportHistoryLoading}
          error={exportHistoryError}
        />
      ) : null}

      <section className="grid gap-4 rounded-[26px] border border-blue-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(239,246,255,0.92)_58%,rgba(248,250,252,0.96)_100%)] p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)] lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="grid gap-4">
          <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Report assembly workspace
          </div>
          <h1 className="text-[28px] font-black tracking-tight text-slate-950">
            {assembly.headerTitle}
          </h1>
          <div className="grid gap-3 text-sm leading-7 text-slate-600 sm:grid-cols-2">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Learner</div>
              <div className="mt-1 text-[15px] font-bold text-slate-950">{activeLearner.label}</div>
            </div>
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Jurisdiction</div>
              <div className="mt-1 text-[15px] font-bold text-slate-950">
                {model.effectiveJurisdiction?.label || readiness.jurisdictionName || "Not resolved"}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Reporting context</div>
              <div className="mt-1 text-[15px] font-bold text-slate-950">{reportingModeLabel(model)}</div>
            </div>
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Reporting period</div>
              <div className="mt-1 text-[15px] font-bold text-slate-950">
                {model.reportingPeriod?.label || "Current reporting period"}
              </div>
              <div className="text-[13px] text-slate-500">{currentPeriodRangeLabel(model)}</div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 rounded-[22px] border border-white/80 bg-white/85 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              Report status
            </div>
            <div className="mt-2 inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-slate-700">
              {model.reportDocument.status || "draft"}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              Readiness
            </div>
            <div className={cx("mt-2 inline-flex rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em]", readinessTone(readiness.status))}>
              {readiness.status.replace("_", " ")}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              Readiness score
            </div>
            <div className="mt-2 text-[24px] font-black text-slate-950">
              {readiness.score}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              Mapping focus
            </div>
            <div className="mt-2 text-sm font-bold text-slate-950">
              {mapping.strongestAreas.length
                ? mapping.strongestAreas.join(", ")
                : "No strong artifact matches yet"}
            </div>
            <div className="text-[13px] text-slate-500">
              {mapping.weakAreas.length
                ? `Still weak: ${mapping.weakAreas.join(", ")}`
                : "No weak areas are currently flagged."}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)] lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="grid gap-2">
          <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Readiness summary
          </div>
          <h2 className="text-[24px] font-black tracking-tight text-slate-950">
            {readiness.summary}
          </h2>
          <p className="max-w-[760px] text-sm leading-7 text-slate-600">
            This workspace is assembled from the current reporting period, stored learner records, and the active jurisdiction rule set. It now also maps concrete plans, experiences, evidence, pairs, and reviews to each artifact and section.
          </p>
        </div>
        <aside className="grid gap-3 rounded-[22px] border border-slate-200 bg-slate-50/80 p-5">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              Next action
            </div>
            <div className="mt-2 text-[16px] font-bold text-slate-950">
              {mapping.nextAction || readiness.nextAction || "Continue reviewing the draft structure"}
            </div>
          </div>
          <Link
            href="/reports"
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Back to reports
          </Link>
        </aside>
      </section>

      {validation ? (
        <ComplianceContextPanel
          model={model}
          readiness={readiness}
          validation={validation}
        />
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
          <div className="grid gap-1.5">
            <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Sections
            </div>
            <h2 className="text-[18px] font-bold tracking-tight text-slate-950">
              Section scaffold
            </h2>
            <p className="text-sm leading-7 text-slate-600">
              {assembly.sections.some((section) => section.scaffoldOnly)
                ? "Your report draft has been created. Sections are ready to be assembled next."
                : "These sections reflect the current draft structure for this reporting period."}
            </p>
          </div>

          {assembly.sections.length ? (
            <div className="grid gap-3">
              {assembly.sections.map((section) => {
                const sectionKey = normalizeSectionKey(section.title);
                const sectionMap =
                  mapping.sections.find((item) => item.title === section.title) ||
                  mapping.sections.find((item) => item.sectionKey === sectionKey);
                const sectionAutofill =
                  autofill.sections.find((item) => item.title === section.title) ||
                  autofill.sections.find((item) => item.sectionKey === sectionKey);
                const sectionStatus = sectionMap?.status || "missing";
                const starterDismissed = Boolean(dismissedSections[sectionKey]);
                const pendingAction = sectionPending[sectionKey];
                const sectionError = sectionErrors[sectionKey];
                const canMutate =
                  Boolean(sectionAutofill?.blocks.length) &&
                  !section.locked &&
                  !pendingAction;

                return (
                  <div
                    key={section.id}
                    id={`report-section-${sectionKey}`}
                    className="grid gap-2 rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="grid gap-1">
                        <div className="text-[15px] font-bold text-slate-950">{section.title}</div>
                        <div className="text-[13px] leading-6 text-slate-500">
                          {section.sourceMode
                            ? `Source: ${section.sourceMode}`
                            : section.scaffoldOnly
                              ? "Jurisdiction scaffold"
                              : "Existing report section"}
                          {section.locked ? " - Locked" : ""}
                        </div>
                      </div>
                      <span className={cx("inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em]", artifactTone(sectionStatus))}>
                        {sectionStatus.replace("_", " ")}
                      </span>
                    </div>
                    <div className="text-sm leading-7 text-slate-600">
                      {section.hasContent
                        ? section.contentPreview
                        : section.scaffoldOnly
                          ? section.contentPreview
                          : "This section exists, but no content has been assembled into it yet."}
                    </div>
                    {sectionMap ? (
                      <div className="grid gap-1 rounded-[14px] border border-slate-200 bg-white px-3 py-3">
                        <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Mapping support
                        </div>
                        <div className="text-[13px] leading-6 text-slate-600">
                          {sectionMap.supportingEvidenceCount} evidence item{sectionMap.supportingEvidenceCount === 1 ? "" : "s"} and {sectionMap.supportingPlanCount} plan{sectionMap.supportingPlanCount === 1 ? "" : "s"} currently support this section.
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {sectionMap.supportedArtifactTypes.length ? (
                            sectionMap.supportedArtifactTypes.map((artifactType) => (
                              <span
                                key={`${section.id}-${artifactType}`}
                                className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600"
                              >
                                {artifactType}
                              </span>
                            ))
                          ) : (
                            <span className="text-[12px] text-slate-500">
                              No required artifacts are mapped to this section yet.
                            </span>
                          )}
                        </div>
                        {sectionMap.notes.length ? (
                          <div className="text-[13px] leading-6 text-slate-500">
                            {sectionMap.notes[0]}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    {sectionAutofill && !starterDismissed ? (
                      <div className="grid gap-3 rounded-[14px] border border-slate-200 bg-white px-3 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="grid gap-1">
                            <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                              Structured starter autofill
                            </div>
                            <div className="text-[13px] leading-6 text-slate-600">
                              {sectionAutofill.canAutofill
                                ? "These starter blocks are assembled from current learner records and can be refined into the draft."
                                : "Current records are still too light for a strong starter block, so the section stays in guided scaffold mode."}
                            </div>
                          </div>
                          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                            {sectionAutofill.confidence} confidence
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                          <span>Plans {sectionAutofill.sourceCounts.plans}</span>
                          <span>Experiences {sectionAutofill.sourceCounts.experiences}</span>
                          <span>Evidence {sectionAutofill.sourceCounts.evidence}</span>
                          <span>Pairs {sectionAutofill.sourceCounts.pairs}</span>
                          <span>Reviews {sectionAutofill.sourceCounts.reviews}</span>
                        </div>
                        <div className="grid gap-2">
                          {sectionAutofill.blocks.map((block, index) =>
                            renderStarterBlock(
                              block,
                              `${section.id}-starter-${index + 1}`,
                            ),
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {!section.hasContent ? (
                            <button
                              type="button"
                              disabled={!canMutate}
                              onClick={() =>
                                void runSectionAction({
                                  sectionId: section.id,
                                  title: section.title,
                                  order: section.order,
                                  blocks: sectionAutofill.blocks,
                                  currentContent: section.contentPreview,
                                  action: "use_starter",
                                })
                              }
                              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {pendingAction === "use_starter" ? "Using starter..." : "Use starter"}
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                disabled={!canMutate}
                                onClick={() =>
                                  void runSectionAction({
                                    sectionId: section.id,
                                    title: section.title,
                                    order: section.order,
                                    blocks: sectionAutofill.blocks,
                                    currentContent: section.contentPreview,
                                    action: "append_starter",
                                  })
                                }
                                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {pendingAction === "append_starter" ? "Appending..." : "Append starter"}
                              </button>
                              <button
                                type="button"
                                disabled={!canMutate}
                                onClick={() =>
                                  void runSectionAction({
                                    sectionId: section.id,
                                    title: section.title,
                                    order: section.order,
                                    blocks: sectionAutofill.blocks,
                                    currentContent: section.contentPreview,
                                    action: "insert_at_top",
                                  })
                                }
                                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {pendingAction === "insert_at_top" ? "Inserting..." : "Insert at top"}
                              </button>
                              <button
                                type="button"
                                disabled={!canMutate}
                                onClick={() => {
                                  if (!window.confirm("Replace the current section draft with the structured starter content?")) {
                                    return;
                                  }

                                  void runSectionAction({
                                    sectionId: section.id,
                                    title: section.title,
                                    order: section.order,
                                    blocks: sectionAutofill.blocks,
                                    currentContent: section.contentPreview,
                                    action: "replace_section",
                                  });
                                }}
                                className="inline-flex items-center justify-center rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {pendingAction === "replace_section" ? "Replacing..." : "Replace section"}
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            disabled={Boolean(pendingAction)}
                            onClick={() =>
                              setDismissedSections((current) => ({
                                ...current,
                                [dismissStarterForSection(sectionKey)]: true,
                              }))
                            }
                            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Dismiss suggestions
                          </button>
                        </div>
                        {section.locked ? (
                          <div className="rounded-[12px] border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] leading-6 text-amber-800">
                            This section is locked, so starter content cannot be promoted here.
                          </div>
                        ) : null}
                        {sectionError ? (
                          <div className="rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] leading-6 text-rose-800">
                            {sectionError}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    {sectionAutofill && starterDismissed ? (
                      <div className="rounded-[14px] border border-slate-200 bg-white px-3 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-[13px] leading-6 text-slate-600">
                            Structured starter suggestions are hidden for this section.
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setDismissedSections((current) => ({
                                ...current,
                                [sectionKey]: false,
                              }))
                            }
                            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
                          >
                            Show suggestions
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-5 text-sm leading-7 text-slate-600">
              Your report draft has been created. Sections are ready to be assembled next.
            </div>
          )}
        </article>

        <aside className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
          <div className="grid gap-1.5">
            <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Required artifacts
            </div>
            <h2 className="text-[18px] font-bold tracking-tight text-slate-950">
              What still needs support
            </h2>
          </div>

          {mapping.artifacts.length ? (
            <div className="grid gap-3">
              {mapping.artifacts.map((item: ArtifactMappingResult) => (
                <div
                  key={`${item.artifactType}-${item.label}`}
                  className="rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-[15px] font-bold text-slate-950">{item.label}</div>
                    <span className={cx("inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em]", artifactTone(item.status))}>
                      {item.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    <span>Confidence {item.confidence}</span>
                    <span>Plans {item.supportingCounts.plans}</span>
                    <span>Experiences {item.supportingCounts.experiences}</span>
                    <span>Evidence {item.supportingCounts.evidence}</span>
                    <span>Pairs {item.supportingCounts.pairs}</span>
                    <span>Reviews {item.supportingCounts.reviews}</span>
                  </div>
                  <div className="mt-2 grid gap-1 text-sm leading-6 text-slate-600">
                    {item.notes.map((note) => (
                      <div key={`${item.artifactType}-${note}`}>{note}</div>
                    ))}
                  </div>
                  {item.suggestedNextAction ? (
                    <div className="mt-2 rounded-[14px] border border-blue-100 bg-blue-50/70 px-3 py-2 text-[13px] leading-6 text-slate-700">
                      Next: {item.suggestedNextAction}
                    </div>
                  ) : null}
                  <div className="mt-2 text-[12px] text-slate-500">
                    {item.supportingIds?.length
                      ? `Linked records: ${item.supportingIds.join(", ")}`
                      : "No directly linked records have been identified yet."}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-5 text-sm leading-7 text-slate-600">
              No jurisdiction-specific artifact list is available for this learner yet.
            </div>
          )}
        </aside>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
          <div className="grid gap-1.5">
            <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Supporting records
            </div>
            <h2 className="text-[18px] font-bold tracking-tight text-slate-950">
              What this report is built from
            </h2>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {assembly.supportingRecords.map((item) => (
              <div
                key={item.label}
                className={cx("grid gap-1 rounded-[18px] border px-4 py-4", supportTone(item.tone))}
              >
                <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                  {item.label}
                </div>
                <div className="text-[24px] font-black text-slate-950">{item.value}</div>
                <div className="text-sm leading-6 text-slate-600">{item.note}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-3 rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-4">
            <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Linked pack items
            </div>
            {assembly.packItems.length ? (
              <div className="grid gap-3">
                {assembly.packItems.map((item) => (
                  <div key={item.id} className="rounded-[16px] border border-slate-200 bg-white px-4 py-3">
                    <div className="text-[15px] font-bold text-slate-950">{item.label}</div>
                    {item.note ? (
                      <div className="mt-1 text-sm leading-6 text-slate-600">{item.note}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm leading-7 text-slate-600">
                No supporting pack items have been linked to this draft yet.
              </div>
            )}
          </div>
        </article>

        <aside className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
          <div className="grid gap-1.5">
            <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Missing items
            </div>
            <h2 className="text-[18px] font-bold tracking-tight text-slate-950">
              What still needs attention
            </h2>
          </div>

          {mapping.weakAreas.length ? (
            <div className="grid gap-2">
              {mapping.weakAreas.map((item) => (
                <div
                  key={item}
                  className="rounded-[16px] border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm leading-6 text-slate-700"
                >
                  {item}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-7 text-emerald-800">
              No immediate missing items are blocking this draft right now.
            </div>
          )}

          <div className="rounded-[18px] border border-blue-100 bg-blue-50/70 px-4 py-4">
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              Next best action
            </div>
            <div className="mt-2 text-[16px] font-bold text-slate-950">
              {mapping.nextAction || readiness.nextAction || "Continue assembling sections from the linked records"}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
