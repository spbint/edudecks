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

function toDateInput(value: string | null | undefined) {
  const clean = safe(value);
  if (!clean) return "";

  const date = new Date(clean);
  if (Number.isNaN(date.getTime())) {
    return clean.slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
}

function fromDateInput(value: string) {
  const clean = safe(value);
  return clean || null;
}

function behaviorLabel(model: ReportsBuilderModel | null) {
  const behaviour = model?.jurisdictionBehaviour;
  if (!behaviour) return "Optional record";
  if (behaviour.portfolioModeEnabled) return "Portfolio support";
  if (behaviour.strictGateEnabled) return "Required before readiness";
  return "Recommended";
}

function ruleRequiresNotification(model: ReportsBuilderModel | null) {
  const ruleSet = model?.ruleSet as { requiresWithdrawalNotice?: boolean | null } | null;
  return (
    model?.ruleSet?.requiresNotification === true ||
    model?.ruleSet?.requiresNotificationAnnual === true ||
    ruleSet?.requiresWithdrawalNotice === true
  );
}

function requirementCopy(model: ReportsBuilderModel | null) {
  if (!ruleRequiresNotification(model)) return "Optional record";
  return behaviorLabel(model);
}

function requirementTone(model: ReportsBuilderModel | null) {
  if (!ruleRequiresNotification(model)) {
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

function statusTone(status: string, model: ReportsBuilderModel | null) {
  if (status === "acknowledged" || status === "submitted") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "not_required" || status === "waived" || status === "archived") {
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

type NotificationRow = Record<string, unknown>;

type NotificationComplianceCardProps = {
  learner: FamilyLearner | null;
  reportsModel: ReportsBuilderModel | null;
  familyProfileId: string | null;
  jurisdictionId: string | null;
  registrationCycleId: string | null;
  userId: string | null;
  onSaved?: () => Promise<void> | void;
  loading?: boolean;
};

function normalizeStatus(value: unknown) {
  const status = safe(value).toLowerCase();
  if (
    status === "draft" ||
    status === "due" ||
    status === "submitted" ||
    status === "acknowledged" ||
    status === "not_required" ||
    status === "waived" ||
    status === "rejected" ||
    status === "archived"
  ) {
    return status;
  }
  return "not_started";
}

function displayStatus(status: string, required: boolean) {
  if (status === "submitted" || status === "acknowledged") return "Ready";
  if (status === "not_required" || status === "waived" || status === "archived") {
    return required ? "Optional record" : "Not required";
  }
  if (status === "due") return "Needs attention";
  if (status === "draft") return "In progress";
  return required ? "Needs attention" : "Not started";
}

function describeRequirement(model: ReportsBuilderModel | null) {
  if (!ruleRequiresNotification(model)) {
    return "Notification tracking is optional for this learner's current jurisdiction setup.";
  }

  if (model?.jurisdictionBehaviour?.strictGateEnabled) {
    return "Required before this record can be treated as authority-ready.";
  }

  if (model?.jurisdictionBehaviour?.portfolioModeEnabled) {
    return "Useful portfolio support, unless your rule set says otherwise.";
  }

  return "Recommended for this jurisdiction's record-keeping.";
}

function currentMessage(
  status: string,
  required: boolean,
  hasJurisdiction: boolean,
  tableUnavailable: boolean,
) {
  if (!hasJurisdiction) {
    return "Set your jurisdiction to enable compliance tracking.";
  }
  if (tableUnavailable) {
    return "Notification tracking is not available in this setup yet.";
  }
  if (status === "submitted" || status === "acknowledged") {
    return "The notification record looks up to date.";
  }
  if (status === "draft" || status === "due") {
    return "A notification record is in progress and still needs a final step.";
  }
  if (!required) {
    return "This record is optional for your current setup, but it can still be helpful to keep on file.";
  }
  return "This notification record still needs attention.";
}

async function loadLatestNotification(
  learnerId: string,
  familyProfileId: string | null,
  jurisdictionId: string | null,
  registrationCycleId: string | null,
) {
  const attempts = [
    () => {
      let query: any = supabase
        .from("homeschool_notifications")
        .select("*")
        .eq("learner_id", learnerId)
        .order("updated_at", { ascending: false })
        .limit(1);
      if (familyProfileId) query = query.eq("family_id", familyProfileId);
      if (jurisdictionId) query = query.eq("jurisdiction_id", jurisdictionId);
      if (registrationCycleId) query = query.eq("registration_cycle_id", registrationCycleId);
      return query.maybeSingle();
    },
    () => {
      let query: any = supabase
        .from("homeschool_notifications")
        .select("*")
        .eq("learner_id", learnerId)
        .order("submitted_at", { ascending: false })
        .limit(1);
      if (familyProfileId) query = query.eq("family_id", familyProfileId);
      if (jurisdictionId) query = query.eq("jurisdiction_id", jurisdictionId);
      if (registrationCycleId) query = query.eq("registration_cycle_id", registrationCycleId);
      return query.maybeSingle();
    },
    () => {
      let query: any = supabase
        .from("homeschool_notifications")
        .select("*")
        .eq("learner_id", learnerId)
        .limit(1);
      if (familyProfileId) query = query.eq("family_id", familyProfileId);
      if (jurisdictionId) query = query.eq("jurisdiction_id", jurisdictionId);
      if (registrationCycleId) query = query.eq("registration_cycle_id", registrationCycleId);
      return query.maybeSingle();
    },
  ];

  let lastError: unknown = null;

  for (const attempt of attempts) {
    const response = await attempt();
    if (!response.error) {
      return response.data as NotificationRow | null;
    }

    lastError = response.error;
    if (!isMissingColumnError(response.error)) {
      throw response.error;
    }
  }

  throw lastError ?? new Error("The notification table could not be queried.");
}

async function writeNotificationRecord(
  existingId: string | null,
  payloads: NotificationRow[],
) {
  let lastError: unknown = null;

  for (const payload of payloads) {
    const response = existingId
      ? await supabase
          .from("homeschool_notifications")
          .update(payload)
          .eq("id", existingId)
      : await supabase.from("homeschool_notifications").insert(payload);

    if (!response.error) {
      return;
    }

    lastError = response.error;
    if (!isMissingColumnError(response.error)) {
      throw response.error;
    }
  }

  throw lastError ?? new Error("The notification record could not be saved.");
}

export function NotificationComplianceCard({
  learner,
  reportsModel,
  familyProfileId,
  jurisdictionId,
  registrationCycleId,
  userId,
  onSaved,
  loading = false,
}: NotificationComplianceCardProps) {
  const [record, setRecord] = useState<NotificationRow | null>(null);
  const [schoolYearLabel, setSchoolYearLabel] = useState(currentAcademicYear());
  const [notificationType, setNotificationType] = useState("notice_of_intent");
  const [status, setStatus] = useState("not_started");
  const [submittedDate, setSubmittedDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [tableUnavailable, setTableUnavailable] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const hasJurisdiction = Boolean(reportsModel?.effectiveJurisdiction?.code);
  const required = ruleRequiresNotification(reportsModel);
  const requiredText = useMemo(() => requirementCopy(reportsModel), [reportsModel]);
  const currentDisplayStatus = displayStatus(status, required);

  const summaryText = useMemo(() => {
    if (!learner) return "Select a learner to view notification compliance.";
    if (!hasJurisdiction) return "Set your jurisdiction to enable compliance tracking.";
    return currentMessage(status, required, hasJurisdiction, tableUnavailable);
  }, [hasJurisdiction, learner, required, status, tableUnavailable]);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      if (!learner) {
        if (mounted) {
          setRecord(null);
          setTableUnavailable(false);
        }
        return;
      }

      if (mounted) {
        setError("");
        setMessage("");
      }

      try {
        const latest = await loadLatestNotification(
          learner.id,
          familyProfileId,
          jurisdictionId,
          registrationCycleId,
        );
        if (!mounted) return;

        setRecord(latest);
        setTableUnavailable(false);
        setSchoolYearLabel(
          safe(latest?.school_year_label) ||
            safe(latest?.academic_year) ||
            currentAcademicYear(),
        );
        setNotificationType(safe(latest?.notification_type) || "notice_of_intent");
        setStatus(normalizeStatus(latest?.status));
        setSubmittedDate(toDateInput(safe(latest?.submitted_at)));
        setDueDate(toDateInput(safe(latest?.due_date)));
        setNotes(safe(latest?.notes));
      } catch (err) {
        if (!mounted) return;
        setRecord(null);
        setTableUnavailable(true);
        setError("Notification tracking is not available in this setup yet.");
      }
    }

    void hydrate();

    return () => {
      mounted = false;
    };
  }, [familyProfileId, jurisdictionId, learner?.id, refreshTick, registrationCycleId]);

  async function handleSave() {
    if (!learner || !hasJurisdiction) return;
    if (!userId) {
      setError("A signed-in session is required to save notification records.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const payloadBase: NotificationRow = {
      learner_id: learner.id,
      user_id: userId || undefined,
      family_id: familyProfileId || undefined,
      jurisdiction_id: jurisdictionId || undefined,
      registration_cycle_id: registrationCycleId || undefined,
      school_year_label: schoolYearLabel || currentAcademicYear(),
      academic_year: schoolYearLabel || currentAcademicYear(),
      notification_type: notificationType || "notice_of_intent",
      status,
      submitted_at: fromDateInput(submittedDate),
      due_date: fromDateInput(dueDate),
      notes,
    };

    const payloads: NotificationRow[] = [
      payloadBase,
      {
        learner_id: learner.id,
        registration_cycle_id: registrationCycleId || undefined,
        school_year_label: schoolYearLabel || currentAcademicYear(),
        academic_year: schoolYearLabel || currentAcademicYear(),
        notification_type: notificationType || "notice_of_intent",
        status,
        submitted_at: fromDateInput(submittedDate),
        due_date: fromDateInput(dueDate),
        notes,
      },
      {
        learner_id: learner.id,
        notification_type: notificationType || "notice_of_intent",
        status,
        submitted_at: fromDateInput(submittedDate),
        due_date: fromDateInput(dueDate),
        notes,
      },
    ];

    try {
      await writeNotificationRecord(safe(record?.id), payloads);
      setMessage("Notification record saved.");
      setRefreshTick((current) => current + 1);
      await onSaved?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The notification record could not be saved right now.",
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
            Notification
          </div>
          <h3 className="text-[18px] font-bold tracking-tight text-slate-950">
            Notification compliance
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
        <div className="font-semibold text-slate-950">
          {describeRequirement(reportsModel)}
        </div>
        <div>
          Current status: <span className="font-semibold text-slate-950">{currentDisplayStatus}</span>
        </div>
        <div>
          Notification type:{" "}
          <span className="font-semibold text-slate-950">{notificationType || "Not set"}</span>
        </div>
        <div>
          Submitted:{" "}
          <span className="font-semibold text-slate-950">
            {submittedDate ? submittedDate : "Not submitted yet"}
          </span>
        </div>
        <div>
          Due date:{" "}
          <span className="font-semibold text-slate-950">{dueDate || "Not set"}</span>
        </div>
        <div>
          School year:{" "}
          <span className="font-semibold text-slate-950">{schoolYearLabel || "Not set"}</span>
        </div>
        {notes ? (
          <div className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Notes
            </div>
            <div className="mt-1 text-sm leading-6 text-slate-700">{notes}</div>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            School year
          </span>
          <input
            className="w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-900 outline-none transition focus:border-blue-200 focus:ring-4 focus:ring-blue-100"
            value={schoolYearLabel}
            onChange={(event) => setSchoolYearLabel(event.target.value)}
            placeholder={currentAcademicYear()}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Notification type
          </span>
          <input
            className="w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-900 outline-none transition focus:border-blue-200 focus:ring-4 focus:ring-blue-100"
            value={notificationType}
            onChange={(event) => setNotificationType(event.target.value)}
            placeholder="notice_of_intent"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Status
          </span>
          <select
            className="w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-900 outline-none transition focus:border-blue-200 focus:ring-4 focus:ring-blue-100"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="not_started">not_started</option>
            <option value="draft">draft</option>
            <option value="due">due</option>
            <option value="submitted">submitted</option>
            <option value="acknowledged">acknowledged</option>
            <option value="not_required">not_required</option>
            <option value="waived">waived</option>
            <option value="rejected">rejected</option>
            <option value="archived">archived</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Submitted date
          </span>
          <input
            type="date"
            className="w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-900 outline-none transition focus:border-blue-200 focus:ring-4 focus:ring-blue-100"
            value={submittedDate}
            onChange={(event) => setSubmittedDate(event.target.value)}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Due date
          </span>
          <input
            type="date"
            className="w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-900 outline-none transition focus:border-blue-200 focus:ring-4 focus:ring-blue-100"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </label>
      </div>

      <label className="grid gap-2">
        <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Notes
        </span>
        <textarea
          className="min-h-[104px] rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-900 outline-none transition focus:border-blue-200 focus:ring-4 focus:ring-blue-100"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Keep the note calm and practical."
        />
      </label>

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
            : !hasJurisdiction
              ? "Set your jurisdiction first"
              : behaviorLabel(reportsModel)}
        </div>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || !learner || !userId || !hasJurisdiction}
          className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save notification"}
        </button>
      </div>
    </article>
  );
}
