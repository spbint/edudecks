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
  type ReportAssemblyArtifact,
  type ReportAssemblySupportingRecord,
  type ReportAssemblyWorkspace,
} from "@/lib/reportAssembly";
import {
  currentPeriodRangeLabel,
  loadReportsBuilderModel,
  reportingModeLabel,
  type ReportsBuilderModel,
} from "@/lib/reporting";

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

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      if (!activeLearner) {
        if (mounted) {
          setModel(null);
          setReadiness(null);
          setAssembly(null);
        }
        return;
      }

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

      if (mounted) {
        setModel(next);
        setReadiness(readinessResult);
        setAssembly(assemblyResult);
      }
    }

    void hydrate();

    return () => {
      mounted = false;
    };
  }, [activeLearner, searchParams, workspace.profile, workspace.userId]);

  if (!activeLearner) {
    return (
      <EmptyState
        title="Choose a learner first"
        message="The report assembly workspace needs one learner in focus before it can resolve the correct reporting context."
      />
    );
  }

  if (!model || !readiness || !assembly) {
    return <div className="h-64 animate-pulse rounded-[24px] bg-slate-100" />;
  }

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

  return (
    <div className="grid gap-5 pb-14">
      {model.softWarning || assembly.softWarning ? (
        <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-7 text-amber-800">
          {[model.softWarning, assembly.softWarning].filter(Boolean).join(" ")}
        </div>
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
              Locale / tone
            </div>
            <div className="mt-2 text-sm font-bold text-slate-950">
              {model.reportDocument.localeCode} / {model.reportDocument.spellingStyle}
            </div>
            <div className="text-[13px] text-slate-500">{model.reportDocument.toneProfile}</div>
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
            This workspace is assembled from the current reporting period, stored learner records, and the active jurisdiction rule set. It shows what is already in place and what still needs attention before the draft is dependable.
          </p>
        </div>
        <aside className="grid gap-3 rounded-[22px] border border-slate-200 bg-slate-50/80 p-5">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              Next action
            </div>
            <div className="mt-2 text-[16px] font-bold text-slate-950">
              {readiness.nextAction || "Continue reviewing the draft structure"}
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
              {assembly.sections.map((section) => (
                <div
                  key={section.id}
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
                    <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                      {section.status}
                    </span>
                  </div>
                  <div className="text-sm leading-7 text-slate-600">
                    {section.hasContent
                      ? section.contentPreview
                      : section.scaffoldOnly
                        ? section.contentPreview
                        : "This section exists, but no content has been assembled into it yet."}
                  </div>
                </div>
              ))}
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

          {assembly.artifactItems.length ? (
            <div className="grid gap-3">
              {assembly.artifactItems.map((item: ReportAssemblyArtifact) => (
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
                  <div className="mt-1 text-sm leading-6 text-slate-600">
                    {item.note || "This artifact contributes directly to the current jurisdiction requirements."}
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

          {assembly.missingItems.length ? (
            <div className="grid gap-2">
              {assembly.missingItems.map((item) => (
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
              {readiness.nextAction || "Continue assembling sections from the linked records"}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
