"use client";

import React, { useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabaseClient";
import type { ReportsBuilderModel } from "@/lib/reporting";
import type { FamilyLearner } from "@/lib/familyWorkspace";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function isMissingColumnError(error: unknown) {
  const message = safe((error as { message?: unknown })?.message).toLowerCase();
  return message.includes("does not exist") || message.includes("column");
}

function currentAcademicYear() {
  return String(new Date().getFullYear());
}

function behaviorLabel(model: ReportsBuilderModel | null) {
  const behaviour = model?.jurisdictionBehaviour;
  if (!behaviour) return "Not required by your current setup";
  if (behaviour.portfolioModeEnabled) return "Optional support";
  if (behaviour.strictGateEnabled) return "Required before export";
  return "Recommended";
}

function requiredCopy(model: ReportsBuilderModel | null) {
  const requiresSubjects =
    model?.ruleSet?.requiresSubjectList === true ||
    model?.ruleSet?.requiresYearlyPlan === true;
  if (requiresSubjects) return behaviorLabel(model);
  return "Not required by your current setup";
}

type SubjectLogRow = Record<string, unknown>;

type SubjectsPlanComplianceCardProps = {
  learner: FamilyLearner | null;
  reportsModel: ReportsBuilderModel | null;
  userId: string | null;
  onSaved?: () => Promise<void> | void;
  loading?: boolean;
};

function statusTone(model: ReportsBuilderModel | null) {
  if (model?.jurisdictionBehaviour?.portfolioModeEnabled) {
    return "border-slate-200 bg-slate-50 text-slate-600";
  }
  if (model?.jurisdictionBehaviour?.strictGateEnabled) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-blue-200 bg-blue-50 text-blue-700";
}

function panelTone(model: ReportsBuilderModel | null) {
  if (model?.jurisdictionBehaviour?.portfolioModeEnabled) {
    return "border-slate-200 bg-slate-50/80";
  }
  if (model?.jurisdictionBehaviour?.strictGateEnabled) {
    return "border-blue-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(239,246,255,0.94)_58%,rgba(248,250,252,0.96)_100%)]";
  }
  return "border-blue-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(243,244,246,0.95)_58%,rgba(248,250,252,0.96)_100%)]";
}

function parseSubjectLines(value: string) {
  return value
    .split(/\r?\n|;/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function loadSubjectLogs(learnerId: string) {
  const attempts = [
    () =>
      supabase
        .from("homeschool_instruction_subject_logs")
        .select("*")
        .eq("learner_id", learnerId)
        .order("updated_at", { ascending: false })
        .limit(10),
    () =>
      supabase
        .from("homeschool_instruction_subject_logs")
        .select("*")
        .eq("learner_id", learnerId)
        .limit(20),
  ];

  let lastError: unknown = null;

  for (const attempt of attempts) {
    const response = await attempt();
    if (!response.error) {
      const data = Array.isArray(response.data)
        ? response.data
        : response.data
          ? [response.data]
          : [];
      return data as SubjectLogRow[];
    }

    lastError = response.error;
    if (!isMissingColumnError(response.error)) {
      throw response.error;
    }
  }

  throw lastError ?? new Error("The subject log table could not be queried.");
}

async function loadLearningPlans(learnerId: string) {
  const attempts = [
    () =>
      supabase
        .from("learning_plans")
        .select("*")
        .eq("learner_id", learnerId)
        .order("updated_at", { ascending: false })
        .limit(10),
    () =>
      supabase
        .from("learning_plans")
        .select("*")
        .eq("learner_id", learnerId)
        .limit(10),
  ];

  let lastError: unknown = null;

  for (const attempt of attempts) {
    const response = await attempt();
    if (!response.error) {
      return Array.isArray(response.data) ? (response.data as Record<string, unknown>[]) : [];
    }

    lastError = response.error;
    if (!isMissingColumnError(response.error)) {
      throw response.error;
    }
  }

  throw lastError ?? new Error("The learning plan table could not be queried.");
}

async function writeSubjectLog(existingId: string | null, payloads: SubjectLogRow[]) {
  let lastError: unknown = null;

  for (const payload of payloads) {
    const response = existingId
      ? await supabase
          .from("homeschool_instruction_subject_logs")
          .update(payload)
          .eq("id", existingId)
      : await supabase.from("homeschool_instruction_subject_logs").insert(payload);

    if (!response.error) {
      return;
    }

    lastError = response.error;
    if (!isMissingColumnError(response.error)) {
      throw response.error;
    }
  }

  throw lastError ?? new Error("The subject log could not be saved.");
}

function readLogSubject(row: SubjectLogRow) {
  return (
    safe(row.subject_name) ||
    safe(row.subject) ||
    safe(row.title) ||
    safe(row.name) ||
    safe(row.label) ||
    safe(row.log_text)
  );
}

export function SubjectsPlanComplianceCard({
  learner,
  reportsModel,
  userId,
  onSaved,
  loading = false,
}: SubjectsPlanComplianceCardProps) {
  const [planRows, setPlanRows] = useState<Record<string, unknown>[]>([]);
  const [subjectRows, setSubjectRows] = useState<SubjectLogRow[]>([]);
  const [academicYear, setAcademicYear] = useState(currentAcademicYear());
  const [subjectEntry, setSubjectEntry] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [tableUnavailable, setTableUnavailable] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const behaviour = reportsModel?.jurisdictionBehaviour ?? null;
  const requiredText = useMemo(() => requiredCopy(reportsModel), [reportsModel]);
  const requiresPlan = reportsModel?.ruleSet?.requiresYearlyPlan === true;
  const requiresSubjectList = reportsModel?.ruleSet?.requiresSubjectList === true;
  const hasPlan = planRows.length > 0;
  const hasSubjects = subjectRows.length > 0;
  const subjectPreview = subjectRows.slice(0, 3).map(readLogSubject).filter(Boolean);

  const summaryText = useMemo(() => {
    if (!learner) return "Select a learner to view learning plans and subject logs.";
    if (tableUnavailable) return "Subject logging is not available in your current setup.";
    if (requiredText === "Not required by your current setup") {
      return "Learning plans and subject logs are visible here, but they are not required by your current setup.";
    }
    if (hasPlan && hasSubjects) {
      return "A learning plan is visible and subject logging has started.";
    }
    if (hasPlan || hasSubjects) {
      return "One part of the plan is visible, but the other still needs attention.";
    }
    return "Learning plan and subject tracking have not been started yet.";
  }, [hasPlan, hasSubjects, learner, requiredText, tableUnavailable]);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      if (!learner) {
        if (mounted) {
          setPlanRows([]);
          setSubjectRows([]);
          setTableUnavailable(false);
        }
        return;
      }

      if (mounted) {
        setError("");
        setMessage("");
      }

      try {
        const [plans, logs] = await Promise.all([
          loadLearningPlans(learner.id),
          loadSubjectLogs(learner.id),
        ]);

        if (!mounted) return;

        setPlanRows(plans);
        setSubjectRows(logs);
        setTableUnavailable(false);
        setAcademicYear(
          safe(logs[0]?.academic_year) || safe(plans[0]?.academic_year) || currentAcademicYear(),
        );
        setSubjectEntry(
          [
            safe(logs[0]?.subject_name),
            safe(logs[0]?.subject),
            safe(logs[0]?.title),
          ]
            .filter(Boolean)
            .join("\n"),
        );
      } catch (err) {
        if (!mounted) return;
        setPlanRows([]);
        setSubjectRows([]);
        setTableUnavailable(true);
        setError(
          err instanceof Error
            ? err.message
            : "Subject logging is not available in your current setup.",
        );
      }
    }

    void hydrate();

    return () => {
      mounted = false;
    };
  }, [learner?.id, refreshTick]);

  async function handleSave() {
    if (!learner) return;
    if (!userId) {
      setError("A signed-in session is required to save subject logs.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const entries = parseSubjectLines(subjectEntry);
    if (!entries.length) {
      setSaving(false);
      setError("Add at least one subject or plan note before saving.");
      return;
    }

    try {
      for (const entry of entries) {
        const existing = subjectRows.find((row) => {
          const currentSubject = readLogSubject(row).toLowerCase();
          const currentYear = safe(row.academic_year).toLowerCase();
          return currentSubject === entry.toLowerCase() && currentYear === (academicYear || currentAcademicYear()).toLowerCase();
        });

        const payloadBase: SubjectLogRow = {
          learner_id: learner.id,
          user_id: userId || undefined,
          academic_year: academicYear || currentAcademicYear(),
          subject_name: entry,
          notes: subjectEntry,
          registration_cycle_id: reportsModel?.registrationCycle?.id ?? undefined,
        };

        const payloads: SubjectLogRow[] = [
          payloadBase,
          {
            learner_id: learner.id,
            academic_year: academicYear || currentAcademicYear(),
            subject: entry,
            notes: subjectEntry,
          },
          {
            learner_id: learner.id,
            academic_year: academicYear || currentAcademicYear(),
            title: entry,
            notes: subjectEntry,
          },
        ];

        await writeSubjectLog(safe(existing?.id), payloads);
      }

      setMessage("Subject log saved.");
      setSubjectEntry("");
      setRefreshTick((current) => current + 1);
      await onSaved?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The subject log could not be saved right now.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <article className="grid gap-4 rounded-[22px] border border-slate-200 bg-white p-5">
        <div className="h-4 w-36 animate-pulse rounded-full bg-slate-200" />
        <div className="h-8 w-56 animate-pulse rounded-full bg-slate-200" />
        <div className="h-4 w-full animate-pulse rounded-full bg-slate-200" />
        <div className="grid gap-3">
          <div className="h-11 animate-pulse rounded-[14px] bg-slate-100" />
          <div className="h-24 animate-pulse rounded-[14px] bg-slate-100" />
        </div>
      </article>
    );
  }

  return (
    <article className={`grid gap-4 rounded-[22px] border p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] ${panelTone(reportsModel)}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Subjects / plan
          </div>
          <h3 className="text-[18px] font-bold tracking-tight text-slate-950">
            Learning plan and subject tracking
          </h3>
          <div className="text-sm leading-6 text-slate-600">{summaryText}</div>
        </div>
        <span
          className={`inline-flex rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] ${statusTone(reportsModel)}`}
        >
          {requiredText}
        </span>
      </div>

      <div className="grid gap-2 rounded-[16px] border border-white/80 bg-white/80 p-4 text-sm leading-6 text-slate-600">
        <div className="font-semibold text-slate-950">
          {requiredText === "Not required by your current setup"
            ? "Learning plan and subject tracking are optional for this learner's current jurisdiction setup."
            : behaviour?.strictGateEnabled
              ? "A missing plan or subject record can hold export readiness back in strict jurisdictions."
              : behaviour?.portfolioModeEnabled
                ? "This is supportive documentation in portfolio mode."
                : "Learning plans and subject tracking are recommended in guided jurisdictions."}
        </div>
        <div>
          Learning plan:{" "}
          <span className="font-semibold text-slate-950">
            {hasPlan ? "Present" : "Not started"}
          </span>
        </div>
        <div>
          Subject logs:{" "}
          <span className="font-semibold text-slate-950">
            {hasSubjects ? "Logged" : "Not started"}
          </span>
        </div>
        {subjectPreview.length ? (
          <div className="flex flex-wrap gap-2">
            {subjectPreview.map((item) => (
              <span
                key={item}
                className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600"
              >
                {item}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 rounded-[16px] border border-slate-200 bg-white/80 p-4 text-sm leading-6 text-slate-600">
        <div className="font-semibold text-slate-950">Requirement check</div>
        <div>
          Yearly plan required:{" "}
          <span className="font-semibold text-slate-950">
            {requiresPlan ? "Yes" : "Not required by your current setup"}
          </span>
        </div>
        <div>
          Subject list required:{" "}
          <span className="font-semibold text-slate-950">
            {requiresSubjectList ? "Yes" : "Not required by your current setup"}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[160px_minmax(0,1fr)]">
        <label className="grid gap-2">
          <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Academic year
          </span>
          <input
            className="w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-900 outline-none transition focus:border-blue-200 focus:ring-4 focus:ring-blue-100"
            value={academicYear}
            onChange={(event) => setAcademicYear(event.target.value)}
            placeholder={currentAcademicYear()}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Subjects or plan note
          </span>
          <textarea
            className="min-h-[118px] w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-900 outline-none transition focus:border-blue-200 focus:ring-4 focus:ring-blue-100"
            value={subjectEntry}
            onChange={(event) => setSubjectEntry(event.target.value)}
            placeholder="Math
Reading
Science"
          />
        </label>
      </div>

      <div className="grid gap-3 rounded-[16px] border border-slate-200 bg-white/80 p-4 text-sm leading-6 text-slate-600">
        <div className="font-semibold text-slate-950">Existing records</div>
        <div>
          Learning plans found:{" "}
          <span className="font-semibold text-slate-950">{planRows.length}</span>
        </div>
        <div>
          Subject log entries:{" "}
          <span className="font-semibold text-slate-950">{subjectRows.length}</span>
        </div>
      </div>

      {message ? (
        <div className="rounded-[16px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[16px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm leading-6 text-slate-600">
          {!userId
            ? "Save unavailable until sign-in"
            : behaviour?.strictGateEnabled
              ? "Required before export"
              : behaviour?.portfolioModeEnabled
                ? "Optional support"
                : "Recommended"}
        </div>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || !learner || !userId}
          className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save subjects"}
        </button>
      </div>
    </article>
  );
}
