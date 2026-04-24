"use client";

import React from "react";
import Link from "next/link";
import {
  COUNTRY_OPTIONS,
  FRAMEWORK_OPTIONS,
  frameworkOptionById,
  jurisdictionOptionsForCountry,
} from "@/lib/curriculumFrameworks";
import type {
  AcademicStructureType,
  FamilyCountry,
  ReportingMode,
} from "@/lib/familySettings";
import type { FamilyLearner } from "@/lib/familyWorkspace";

export const LABEL_STYLE =
  "text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500";
export const SECTION_TITLE_STYLE =
  "text-[18px] font-bold tracking-tight text-slate-950";
export const CARD_TITLE_STYLE =
  "text-[15px] font-semibold text-slate-950";
export const BODY_STYLE = "text-[14px] leading-6 text-slate-600";
export const META_STYLE = "text-[13px] leading-5 text-slate-500";
export const INPUT_STYLE =
  "w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-900 outline-none transition focus:border-blue-200 focus:ring-4 focus:ring-blue-100";

type FamilyLearningSetupCardProps = {
  title: string;
  note: string;
  children: React.ReactNode;
};

type FrameworkSelectorProps = {
  country: FamilyCountry | "";
  frameworkId: string;
  onChange: (value: string) => void;
};

type JurisdictionSelectorProps = {
  country: FamilyCountry | "";
  frameworkId: string;
  jurisdictionId: string;
  onChange: (value: string) => void;
};

type ReportingModeSelectorProps = {
  value: ReportingMode;
  onChange: (value: ReportingMode) => void;
};

type AcademicStructureSelectorProps = {
  type: AcademicStructureType;
  cycleCount: number | null;
  weeksPerCycle: number | null;
  onTypeChange: (value: AcademicStructureType) => void;
  onCycleCountChange: (value: number | null) => void;
  onWeeksPerCycleChange: (value: number | null) => void;
};

type LearnerCurriculumSettingsCardProps = {
  learner: FamilyLearner;
  familyCountry: FamilyCountry | "";
  familyFrameworkId: string;
  familyJurisdictionId: string;
  familyReportingMode: ReportingMode;
  onPatch: (
    learnerId: string,
    patch: {
      yearBand?: string | null;
      curriculum_framework_id?: string | null;
      curriculum_jurisdiction_id?: string | null;
      reporting_mode?: string | null;
    },
  ) => void;
};

export function FamilyLearningSetupCard({
  title,
  note,
  children,
}: FamilyLearningSetupCardProps) {
  return (
    <section className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
      <div className="grid gap-1.5">
        <div className={LABEL_STYLE}>Learning setup</div>
        <h2 className={SECTION_TITLE_STYLE}>{title}</h2>
        <p className={BODY_STYLE}>{note}</p>
      </div>
      {children}
    </section>
  );
}

export function Field({
  label,
  children,
  note,
}: {
  label: string;
  children: React.ReactNode;
  note?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className={LABEL_STYLE}>{label}</span>
      {children}
      {note ? <span className={META_STYLE}>{note}</span> : null}
    </label>
  );
}

export function CountrySelector({
  value,
  onChange,
}: {
  value: FamilyCountry | "";
  onChange: (value: FamilyCountry | "") => void;
}) {
  const safeValue = COUNTRY_OPTIONS.some((option) => option.id === value) ? value : "";

  return (
    <select
      className={INPUT_STYLE}
      value={safeValue}
      onChange={(event) => onChange(event.target.value as FamilyCountry | "")}
    >
      <option value="">Select a country</option>
      {COUNTRY_OPTIONS.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function FrameworkSelector({
  country,
  frameworkId,
  onChange,
}: FrameworkSelectorProps) {
  const options = FRAMEWORK_OPTIONS.filter((option) => option.country === country);
  const safeFrameworkId = options.some((option) => option.id === frameworkId)
    ? frameworkId
    : "";

  return (
    <select
      className={INPUT_STYLE}
      value={safeFrameworkId}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">
        {options.length ? "Select a framework" : "Select a country first"}
      </option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function JurisdictionSelector({
  country,
  frameworkId,
  jurisdictionId,
  onChange,
}: JurisdictionSelectorProps) {
  const options = jurisdictionOptionsForCountry(country);
  const safeJurisdictionId = options.some((option) => option.id === jurisdictionId)
    ? jurisdictionId
    : "";
  const label = frameworkOptionById(frameworkId)?.jurisdictionLabel || "Jurisdiction";
  const placeholder =
    country === "us"
      ? "Select a state"
      : country === "au"
        ? "Select a state or territory"
        : options.length
          ? `Select ${label.toLowerCase()}`
          : "Select a country first";

  return (
    <div className="grid gap-2">
      <div className={LABEL_STYLE}>{label}</div>
      <select
        className={INPUT_STYLE}
        value={safeJurisdictionId}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ReportingModeSelector({
  value,
  onChange,
}: ReportingModeSelectorProps) {
  const options: Array<{ id: ReportingMode; label: string }> = [
    { id: "family-summary", label: "Family summary" },
    { id: "progress-review", label: "Progress review" },
    { id: "authority-ready", label: "Authority-ready" },
    { id: "plain-language", label: "Plain language" },
    { id: "formal", label: "More formal" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`rounded-[18px] border px-4 py-3 text-left transition ${
              active
                ? "border-blue-200 bg-blue-50 shadow-[0_0_0_4px_rgba(59,130,246,0.08)]"
                : "border-slate-200 bg-slate-50 hover:bg-slate-100"
            }`}
          >
            <div className={CARD_TITLE_STYLE}>{option.label}</div>
          </button>
        );
      })}
    </div>
  );
}

export function AcademicStructureSelector({
  type,
  cycleCount,
  weeksPerCycle,
  onTypeChange,
  onCycleCountChange,
  onWeeksPerCycleChange,
}: AcademicStructureSelectorProps) {
  const options: Array<{ id: AcademicStructureType; label: string }> = [
    { id: "terms", label: "Terms" },
    { id: "semesters", label: "Semesters" },
    { id: "trimesters", label: "Trimesters" },
    { id: "flexible", label: "Flexible" },
  ];

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {options.map((option) => {
          const active = option.id === type;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onTypeChange(option.id)}
              className={`rounded-[18px] border px-4 py-3 text-left transition ${
                active
                  ? "border-blue-200 bg-blue-50 shadow-[0_0_0_4px_rgba(59,130,246,0.08)]"
                  : "border-slate-200 bg-slate-50 hover:bg-slate-100"
              }`}
            >
              <div className={CARD_TITLE_STYLE}>{option.label}</div>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Cycle count">
          <input
            className={INPUT_STYLE}
            inputMode="numeric"
            value={cycleCount ?? ""}
            onChange={(event) =>
              onCycleCountChange(event.target.value ? Number(event.target.value) : null)
            }
          />
        </Field>
        <Field label="Weeks per cycle">
          <input
            className={INPUT_STYLE}
            inputMode="numeric"
            value={weeksPerCycle ?? ""}
            onChange={(event) =>
              onWeeksPerCycleChange(event.target.value ? Number(event.target.value) : null)
            }
          />
        </Field>
      </div>
    </div>
  );
}

export function LearnerCurriculumSettingsCard({
  learner,
  familyCountry,
  familyFrameworkId,
  familyJurisdictionId,
  familyReportingMode,
  onPatch,
}: LearnerCurriculumSettingsCardProps) {
  const learnerCountry = familyCountry;
  const frameworkOptions = FRAMEWORK_OPTIONS.filter((option) => option.country === learnerCountry);
  const frameworkId = frameworkOptions.some((option) => option.id === learner.curriculum_framework_id)
    ? learner.curriculum_framework_id || familyFrameworkId
    : familyFrameworkId;
  const jurisdictionOptions = jurisdictionOptionsForCountry(learnerCountry);
  const jurisdictionId = jurisdictionOptions.some((option) => option.id === learner.curriculum_jurisdiction_id)
    ? learner.curriculum_jurisdiction_id || familyJurisdictionId
    : familyJurisdictionId;
  const reportingMode = (learner.reporting_mode || familyReportingMode) as ReportingMode;

  return (
    <article className="grid gap-4 rounded-[22px] border border-slate-200 bg-slate-50/70 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <div className={CARD_TITLE_STYLE}>{learner.label}</div>
          <div className={META_STYLE}>{learner.yearLabel || "Year band not set"}</div>
        </div>
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Learner
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Year band">
          <input
            className={INPUT_STYLE}
            value={learner.year_band || learner.yearLabel || ""}
            onChange={(event) =>
              onPatch(learner.id, { yearBand: event.target.value || null })
            }
            placeholder="Year 3-4"
          />
        </Field>
        <Field label="Reporting override">
          <select
            className={INPUT_STYLE}
            value={reportingMode}
            onChange={(event) =>
              onPatch(learner.id, { reporting_mode: event.target.value || null })
            }
          >
            <option value={familyReportingMode}>Use family default</option>
            <option value="family-summary">Family summary</option>
            <option value="progress-review">Progress review</option>
            <option value="authority-ready">Authority-ready</option>
            <option value="plain-language">Plain language</option>
            <option value="formal">More formal</option>
          </select>
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Curriculum framework">
          <FrameworkSelector
            country={learnerCountry}
            frameworkId={frameworkId}
            onChange={(value) =>
              onPatch(learner.id, { curriculum_framework_id: value })
            }
          />
        </Field>
        <JurisdictionSelector
          country={learnerCountry}
          frameworkId={frameworkId}
          jurisdictionId={jurisdictionId}
          onChange={(value) =>
            onPatch(learner.id, { curriculum_jurisdiction_id: value })
          }
        />
      </div>
    </article>
  );
}

export function SettingsSaveBar({
  status,
  error,
  onSave,
  saving,
}: {
  status?: string;
  error?: string;
  onSave: () => void;
  saving?: boolean;
}) {
  return (
    <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-slate-200 bg-white/95 px-5 py-4 shadow-[0_18px_34px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="grid gap-1">
        <div className={CARD_TITLE_STYLE}>Save learning settings</div>
        <div className={error ? "text-[13px] text-rose-600" : META_STYLE}>
          {error || status || "Family defaults and learner overrides will shape planning, curriculum, and reports."}
        </div>
      </div>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {saving ? "Saving..." : "Save setup"}
      </button>
    </div>
  );
}

export function CurriculumSetupEmptyState() {
  return (
    <section className="grid gap-3 rounded-[24px] border border-dashed border-slate-200 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.03)]">
      <div className={LABEL_STYLE}>Learning settings</div>
      <h2 className={SECTION_TITLE_STYLE}>Set your family’s curriculum and reporting setup</h2>
      <p className={BODY_STYLE}>
        Start with one family default, then adjust a learner only where it really helps.
      </p>
    </section>
  );
}

export function SetupSummaryCard({
  title,
  note,
  href,
  cta,
}: {
  title: string;
  note: string;
  href: string;
  cta: string;
}) {
  return (
    <article className="grid gap-3 rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
      <div className={CARD_TITLE_STYLE}>{title}</div>
      <div className={BODY_STYLE}>{note}</div>
      <Link
        href={href}
        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-100"
      >
        {cta}
      </Link>
    </article>
  );
}
