"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";
import {
  currentPeriodRangeLabel,
  loadReportsBuilderModel,
  reportingModeLabel,
  type ReportsBuilderModel,
} from "@/lib/reporting";

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

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
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

      if (mounted) {
        setModel(next);
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
        message="The report document viewer needs one learner in focus before it can open the current reporting period."
      />
    );
  }

  if (!model) {
    return <div className="h-64 animate-pulse rounded-[24px] bg-slate-100" />;
  }

  if (!model.reportDocument) {
    return (
      <EmptyState
        title="No report draft is ready yet"
        message="A current report document could not be created for this learner yet. Return to the reports builder to review the jurisdiction, cycle, and next recommended step."
      />
    );
  }

  return (
    <div className="grid gap-5 pb-14">
      {model.softWarning ? (
        <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-7 text-amber-800">
          {model.softWarning}
        </div>
      ) : null}

      <section className="grid gap-4 rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)] lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="grid gap-3">
          <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Current draft
          </div>
          <h1 className="text-[28px] font-black tracking-tight text-slate-950">
            {model.reportDocument.title}
          </h1>
          <div className="grid gap-2 text-sm leading-7 text-slate-600">
            <div>
              {model.effectiveJurisdiction?.label || "Jurisdiction not resolved"} - {reportingModeLabel(model)}
            </div>
            <div>
              {model.reportingPeriod?.label || "Current reporting period"} - {currentPeriodRangeLabel(model)}
            </div>
          </div>
        </div>

        <div className="grid gap-3 rounded-[22px] border border-slate-200 bg-slate-50/80 p-5">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              Status
            </div>
            <div className="mt-2 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
              {model.reportDocument.status || "draft"}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              Locale
            </div>
            <div className="mt-2 text-sm font-bold text-slate-950">
              {model.reportDocument.localeCode} / {model.reportDocument.spellingStyle}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              Tone profile
            </div>
            <div className="mt-2 text-sm font-bold text-slate-950">
              {model.reportDocument.toneProfile}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
          <div className="grid gap-1.5">
            <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Sections
            </div>
            <h2 className="text-[18px] font-bold tracking-tight text-slate-950">
              Report sections
            </h2>
          </div>

          {model.reportDocument.sections.length ? (
            <div className="grid gap-3">
              {model.reportDocument.sections.map((section) => (
                <div
                  key={section.id}
                  className="grid gap-2 rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-[15px] font-bold text-slate-950">{section.title}</div>
                    <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                      {section.status}
                    </span>
                  </div>
                  <div className="text-sm leading-7 text-slate-600">
                    {section.content || "This section has been created, but no content has been added yet."}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-5 text-sm leading-7 text-slate-600">
              This report draft has been created, but no sections have been added yet.
            </div>
          )}
        </article>

        <aside className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
          <div className="grid gap-1.5">
            <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Linked items
            </div>
            <h2 className="text-[18px] font-bold tracking-tight text-slate-950">
              Pack items
            </h2>
          </div>

          {model.reportDocument.linkedPackItems.length ? (
            <div className="grid gap-3">
              {model.reportDocument.linkedPackItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-4"
                >
                  <div className="text-[15px] font-bold text-slate-950">{item.label}</div>
                  {item.note ? (
                    <div className="mt-1 text-sm leading-6 text-slate-600">{item.note}</div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-5 text-sm leading-7 text-slate-600">
              No pack items have been linked to this report document yet.
            </div>
          )}

          <Link
            href="/reports"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
          >
            Back to reports
          </Link>
        </aside>
      </section>
    </div>
  );
}
