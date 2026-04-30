"use client";

import Link from "next/link";
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
  if (!behaviour) return "Optional support";
  if (behaviour.portfolioModeEnabled) return "Portfolio support";
  if (behaviour.strictGateEnabled) return "Required before export";
  return "Recommended";
}

function requiredCopy(model: ReportsBuilderModel | null) {
  const ruleSet = model?.ruleSet as { requiresLearningPlan?: boolean | null } | null;
  const requiresSubjects =
    model?.ruleSet?.requiresSubjectList === true ||
    model?.ruleSet?.requiresYearlyPlan === true ||
    ruleSet?.requiresLearningPlan === true;
  if (requiresSubjects) return behaviorLabel(model);
  return "Optional support";
}

function requirementTone(model: ReportsBuilderModel | null) {
  const ruleSet = model?.ruleSet as { requiresLearningPlan?: boolean | null } | null;
  const requiresSubjects =
    model?.ruleSet?.requiresSubjectList === true ||
    model?.ruleSet?.requiresYearlyPlan === true ||
    ruleSet?.requiresLearningPlan === true;
  if (!requiresSubjects) {
    return "border-slate-200 bg-slate-50 text-slate-600";
  }
  if (model?.jurisdictionBehaviour?.strictGateEnabled) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (model?.jurisdictionBehaviour?.portfolioModeEnabled) {
    return "border-slate-200 bg-slate-50 text-slate-600";
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

type SubjectRow = Record<string, unknown>;
type PlanRow = Record<string, unknown>;

type SubjectsPlanComplianceCardProps = {
  learner: FamilyLearner | null;
  reportsModel: ReportsBuilderModel | null;
  familyProfileId: string | null;
  jurisdictionId: string | null;
  registrationCycleId: string | null;
  userId: string | null;
  onSaved?: () => Promise<void> | void;
  loading?: boolean;
};

function rowLabel(row: Record<string, unknown>) {
  return (
    safe(row.label) ||
    safe(row.title) ||
    safe(row.name) ||
    safe(row.subject_name) ||
    safe(row.subject) ||
    safe(row.goal) ||
    safe(row.description)
  );
}

async function loadLearningPlans(
  learnerId: string,
  familyProfileId: string | null,
  jurisdictionId: string | null,
  registrationCycleId: string | null,
) {
  const attempts = [
    () => {
      let query = supabase.from("learning_plans").select("*").eq("learner_id", learnerId);
      if (familyProfileId) query = query.eq("family_id", familyProfileId);
      if (jurisdictionId) query = query.eq("jurisdiction_id", jurisdictionId);
      if (registrationCycleId) query = query.eq("registration_cycle_id", registrationCycleId);
      return query.order("updated_at", { ascending: false }).limit(10);
    },
    () =>
      supabase
        .from("learning_plans")
        .select("*")
        .eq("learner_id", learnerId)
        .order("updated_at", { ascending: false })
        .limit(10),
  ];

  let lastError: unknown = null;

  for (const attempt of attempts) {
    const response = await attempt();
    if (!response.error) {
      return Array.isArray(response.data) ? (response.data as PlanRow[]) : [];
    }

    lastError = response.error;
    if (!isMissingColumnError(response.error)) {
      throw response.error;
    }
  }

  throw lastError ?? new Error("The learning plan table could not be queried.");
}

async function loadRowsByPlanIds(
  table: string,
  planIds: string[],
  registrationCycleId: string | null,
  familyProfileId: string | null,
  jurisdictionId: string | null,
) {
  if (!planIds.length) {
    return [] as Record<string, unknown>[];
  }

  const attempts = [
    () => {
      let query = supabase.from(table).select("*").in("plan_id", planIds);
      if (familyProfileId) query = query.eq("family_id", familyProfileId);
      if (jurisdictionId) query = query.eq("jurisdiction_id", jurisdictionId);
      if (registrationCycleId) query = query.eq("registration_cycle_id", registrationCycleId);
      return query;
    },
    () => supabase.from(table).select("*").in("plan_id", planIds),
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
      return data as Record<string, unknown>[];
    }

    lastError = response.error;
    if (!isMissingColumnError(response.error)) {
      throw response.error;
    }
  }

  throw lastError ?? new Error(`The ${table} table could not be queried.`);
}

function behaviorSummary(model: ReportsBuilderModel | null) {
  if (!model?.effectiveJurisdiction?.code) {
    return "Set your jurisdiction to enable compliance tracking.";
  }
  if (model.jurisdictionBehaviour?.strictGateEnabled) {
    return "Required before this record can be treated as authority-ready.";
  }
  if (model.jurisdictionBehaviour?.portfolioModeEnabled) {
    return "Portfolio support that keeps the record grounded without adding pressure.";
  }
  return "Recommended for this jurisdiction's record-keeping.";
}

export function SubjectsPlanComplianceCard({
  learner,
  reportsModel,
  familyProfileId,
  jurisdictionId,
  registrationCycleId,
  userId,
  onSaved,
  loading = false,
}: SubjectsPlanComplianceCardProps) {
  const [planRows, setPlanRows] = useState<PlanRow[]>([]);
  const [areasRows, setAreasRows] = useState<Record<string, unknown>[]>([]);
  const [goalRows, setGoalRows] = useState<Record<string, unknown>[]>([]);
  const [schoolYearLabel, setSchoolYearLabel] = useState(currentAcademicYear());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [tableUnavailable, setTableUnavailable] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const hasJurisdiction = Boolean(reportsModel?.effectiveJurisdiction?.code);
  const ruleSet = reportsModel?.ruleSet as { requiresLearningPlan?: boolean | null } | null;
  const required = useMemo(
    () =>
      reportsModel?.ruleSet?.requiresSubjectList === true ||
      reportsModel?.ruleSet?.requiresYearlyPlan === true ||
      ruleSet?.requiresLearningPlan === true,
    [reportsModel],
  );
  const requiredText = useMemo(() => requiredCopy(reportsModel), [reportsModel]);

  const planCount = planRows.length;
  const areaCount = areasRows.length;
  const goalCount = goalRows.length;
  const previewItems = useMemo(
    () =>
      [...areasRows, ...goalRows]
        .map((row) => rowLabel(row))
        .filter(Boolean)
        .slice(0, 4),
    [areasRows, goalRows],
  );

  const summaryText = useMemo(() => {
    if (!learner) return "Select a learner to view learning plans and subject coverage.";
    if (!hasJurisdiction) return "Set your jurisdiction to enable compliance tracking.";
    if (tableUnavailable) return "Subject tracking is not available in this setup yet.";
    if (planCount > 0 || areaCount > 0 || goalCount > 0) {
      return "Learning plans and subject coverage are visible and ready for refinement.";
    }
    if (!required) {
      return "This is optional support, but adding a simple plan still helps the record feel grounded.";
    }
    return "Learning plan and subject tracking have not been started yet.";
  }, [areaCount, goalCount, hasJurisdiction, learner, planCount, required, tableUnavailable]);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      if (!learner) {
        if (mounted) {
          setPlanRows([]);
          setAreasRows([]);
          setGoalRows([]);
          setTableUnavailable(false);
        }
        return;
      }

      if (mounted) {
        setError("");
        setMessage("");
      }

      try {
        const plans = await loadLearningPlans(
          learner.id,
          familyProfileId,
          jurisdictionId,
          registrationCycleId,
        );
        const planIds = plans.map((row) => safe(row.id)).filter(Boolean);

        const [areas, goals] = await Promise.all([
          loadRowsByPlanIds(
            "plan_learning_areas",
            planIds,
            registrationCycleId,
            familyProfileId,
            jurisdictionId,
          ),
          loadRowsByPlanIds(
            "plan_goals",
            planIds,
            registrationCycleId,
            familyProfileId,
            jurisdictionId,
          ),
        ]);

        if (!mounted) return;

        setPlanRows(plans);
        setAreasRows(areas);
        setGoalRows(goals);
        setTableUnavailable(false);
        setSchoolYearLabel(
          safe((plans[0] as Record<string, unknown> | undefined)?.school_year_label) ||
            safe((plans[0] as Record<string, unknown> | undefined)?.academic_year) ||
            currentAcademicYear(),
        );
      } catch (err) {
        if (!mounted) return;
        setPlanRows([]);
        setAreasRows([]);
        setGoalRows([]);
        setTableUnavailable(true);
        setError("Subject tracking is not available in this setup yet.");
      }
    }

    void hydrate();

    return () => {
      mounted = false;
    };
  }, [familyProfileId, jurisdictionId, learner?.id, refreshTick, registrationCycleId]);

  async function handleRefreshAndOpenPlan() {
    setRefreshTick((current) => current + 1);
    await onSaved?.();
  }

  const showOptionalNote = !required && hasJurisdiction;

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
          className={`inline-flex rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] ${requirementTone(reportsModel)}`}
        >
          {requiredText}
        </span>
      </div>

      <div className="grid gap-2 rounded-[16px] border border-white/80 bg-white/80 p-4 text-sm leading-6 text-slate-600">
        <div className="font-semibold text-slate-950">{behaviorSummary(reportsModel)}</div>
        <div>
          Current plan count: <span className="font-semibold text-slate-950">{planCount}</span>
        </div>
        <div>
          Learning areas / subjects:{" "}
          <span className="font-semibold text-slate-950">{areaCount}</span>
        </div>
        <div>
          Goals: <span className="font-semibold text-slate-950">{goalCount}</span>
        </div>
        {previewItems.length ? (
          <div className="flex flex-wrap gap-2">
            {previewItems.map((item) => (
              <span
                key={item}
                className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600"
              >
                {item}
              </span>
            ))}
          </div>
        ) : null}
        {showOptionalNote ? (
          <div className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">
            This is optional support in your current setup, but a simple plan still helps the readiness engine stay grounded.
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 rounded-[16px] border border-slate-200 bg-white/80 p-4 text-sm leading-6 text-slate-600">
        <div className="font-semibold text-slate-950">Calendar workflow</div>
        <div>
          School year:{" "}
          <span className="font-semibold text-slate-950">{schoolYearLabel || "Not set"}</span>
        </div>
        <div>
          Existing plan records:{" "}
          <span className="font-semibold text-slate-950">{planCount}</span>
        </div>
        <div>
          Current calendar route:{" "}
          <span className="font-semibold text-slate-950">/my-calendar</span>
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
            ? "Open My Calendar once sign-in is available"
            : !hasJurisdiction
              ? "Set your jurisdiction first"
              : behaviorLabel(reportsModel)}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/my-calendar"
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            onClick={() => void handleRefreshAndOpenPlan()}
          >
            Open My Calendar
          </Link>
        </div>
      </div>

      {tableUnavailable ? (
        <div className="rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
          Subject logging tables are not fully available yet, so the card is staying in a calm read-only mode.
        </div>
      ) : null}
    </article>
  );
}
