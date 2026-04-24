import { supabase } from "@/lib/supabaseClient";
import {
  getRequiredArtifactSeeds,
  jurisdictionDisplayLabel,
  resolveJurisdictionComplianceProfile,
  type JurisdictionComplianceProfile,
} from "@/lib/jurisdictionCompliance";
import {
  buildJurisdictionBehaviour,
  type JurisdictionBehaviour,
} from "@/lib/jurisdictionEngine";

type QueryClient = Pick<typeof supabase, "from">;

export type ComplianceReadinessItemStatus =
  | "complete"
  | "in_progress"
  | "missing";

export type ComplianceReadiness = {
  learnerId: string;
  learnerName: string;

  jurisdictionCode: string | null;
  jurisdictionName: string | null;

  status: "ready" | "warning" | "not_ready";
  score: number;

  summary: string;
  nextAction: string | null;

  completedCount: number;
  totalCount: number;

  items: {
    artifactType: string;
    label: string;
    status: ComplianceReadinessItemStatus;
  }[];

  strengths: string[];
  warnings: string[];
  missing: string[];
};

type LoadComplianceReadinessInput = {
  learnerId: string;
  today?: Date | string;
  client?: QueryClient;
};

type LearnerRow = {
  id: string;
  family_id: string | null;
  first_name: string | null;
  last_name: string | null;
  preferred_name: string | null;
};

type FamilySettingsRow = {
  family_id?: string | null;
  country_code?: string | null;
  state_code?: string | null;
};

type LearnerSettingsRow = {
  learner_id?: string | null;
  jurisdiction_override_country?: string | null;
  jurisdiction_override_state?: string | null;
};

type JurisdictionRow = {
  id?: string | null;
  code?: string | null;
  name?: string | null;
  label?: string | null;
  country_code?: string | null;
  state_code?: string | null;
};

type RuleSetRow = {
  id?: string | null;
  jurisdiction_id?: string | null;
  jurisdiction_code?: string | null;
  effective_from?: string | null;
  effective_to?: string | null;
  status?: string | null;
  name?: string | null;
  title?: string | null;
  compliance_level?: string | null;
  compliance_mode?: string | null;
  compliance_ui_mode?: string | null;
  report_requirement_mode?: string | null;
  regulatory_family?: string | null;
  report_required?: boolean | null;
  requires_notification?: boolean | null;
  requires_notification_annual?: boolean | null;
  requires_attendance_tracking?: boolean | null;
  requires_instruction_hours?: boolean | null;
  required_instruction_hours_per_year?: number | null;
  required_instruction_days_per_year?: number | null;
  requires_subject_list?: boolean | null;
  requires_yearly_plan?: boolean | null;
  requires_quarterly_reports?: boolean | null;
  requires_annual_assessment?: boolean | null;
  requires_standardized_testing?: boolean | null;
  requires_professional_evaluation?: boolean | null;
  requires_portfolio?: boolean | null;
  requires_work_samples?: boolean | null;
  requires_parent_qualification_check?: boolean | null;
  requires_immunization_record_or_exemption?: boolean | null;
  requires_submission_to_authority?: boolean | null;
  export_should_be_blocked_when_incomplete?: boolean | null;
  allows_portfolio_instead_of_testing?: boolean | null;
  allows_evaluation_instead_of_testing?: boolean | null;
};

type RequiredArtifactRow = {
  id?: string | null;
  rule_set_id?: string | null;
  jurisdiction_rule_set_id?: string | null;
  artifact_type?: string | null;
  code?: string | null;
  slug?: string | null;
  label?: string | null;
  name?: string | null;
  short_note?: string | null;
  note?: string | null;
  required_frequency?: string | null;
  frequency?: string | null;
  display_order?: number | null;
};

type RegistrationCycleRow = {
  id?: string | null;
  learner_id?: string | null;
  status?: string | null;
  name?: string | null;
  label?: string | null;
  start_date?: string | null;
  end_date?: string | null;
};

type ReportingPeriodRow = {
  id?: string | null;
  registration_cycle_id?: string | null;
  learner_id?: string | null;
  status?: string | null;
  label?: string | null;
  name?: string | null;
  period_type?: string | null;
  start_date?: string | null;
  end_date?: string | null;
};

type PlanRow = {
  id?: string | null;
  status?: string | null;
  date_start?: string | null;
  date_end?: string | null;
};

type ExperienceRow = {
  id?: string | null;
  plan_id?: string | null;
  experience_date?: string | null;
};

type EvidenceRow = {
  id?: string | null;
  experience_id?: string | null;
  plan_id?: string | null;
  captured_at?: string | null;
};

type ReportDocumentRow = {
  id?: string | null;
  reporting_period_id?: string | null;
  learner_id?: string | null;
  status?: string | null;
};

type ReviewRow = {
  id?: string | null;
  learner_id?: string | null;
  review_date?: string | null;
  status?: string | null;
};

type ConcernRow = {
  id?: string | null;
  learner_id?: string | null;
  status?: string | null;
};

type RegistrationConditionRow = {
  id?: string | null;
  learner_id?: string | null;
  status?: string | null;
};

type HomeschoolNotificationRow = {
  id?: string | null;
  learner_id?: string | null;
  registration_cycle_id?: string | null;
  notification_type?: string | null;
  submitted_at?: string | null;
  due_date?: string | null;
  status?: string | null;
};

type AttendanceHourRow = {
  id?: string | null;
  learner_id?: string | null;
  registration_cycle_id?: string | null;
  recorded_date?: string | null;
  instructional_hours?: number | string | null;
  school_day?: boolean | string | null;
};

type AttendanceSummaryRow = {
  id?: string | null;
  learner_id?: string | null;
  registration_cycle_id?: string | null;
  academic_year?: string | null;
  total_days?: number | string | null;
  days?: number | string | null;
  instructional_days?: number | string | null;
  total_hours?: number | string | null;
  hours?: number | string | null;
  instructional_hours?: number | string | null;
};

type SubjectLogRow = {
  id?: string | null;
  learner_id?: string | null;
  registration_cycle_id?: string | null;
  academic_year?: string | null;
  subject_name?: string | null;
  subject?: string | null;
  title?: string | null;
  name?: string | null;
  label?: string | null;
  log_text?: string | null;
};

type ArtifactEvaluationContext = {
  planCount: number;
  linkedPlanCount: number;
  subjectLogCount: number;
  experienceCount: number;
  linkedExperienceCount: number;
  evidenceCount: number;
  linkedEvidenceCount: number;
  reportDocumentCount: number;
  reviewCount: number;
  notificationCount: number;
  submittedNotificationCount: number;
  attendanceDays: number;
  attendanceHours: number;
  openConcernCount: number;
  activeConditionCount: number;
  complianceProfile: JurisdictionComplianceProfile;
  behaviour: JurisdictionBehaviour;
};

type NormalizedArtifact = {
  artifactType: string;
  label: string;
  status: ComplianceReadinessItemStatus;
};

const EMPTY_READINESS: ComplianceReadiness = {
  learnerId: "",
  learnerName: "Learner",
  jurisdictionCode: null,
  jurisdictionName: null,
  status: "not_ready",
  score: 0,
  summary: "Compliance readiness could not be evaluated yet.",
  nextAction: null,
  completedCount: 0,
  totalCount: 0,
  items: [],
  strengths: [],
  warnings: [],
  missing: [],
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function toLower(value: unknown) {
  return safe(value).toLowerCase();
}

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isMissingColumnError(error: unknown) {
  const message = safe((error as { message?: unknown })?.message).toLowerCase();
  return (
    message.includes("does not exist") ||
    message.includes("column") ||
    message.includes("schema cache")
  );
}

function asDate(value: unknown) {
  const clean = safe(value);
  if (!clean) return null;
  const parsed = new Date(clean);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function asObject(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function startOfDay(value: Date) {
  const copy = new Date(value);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function resolveToday(input?: Date | string) {
  if (input instanceof Date) return startOfDay(input);
  if (typeof input === "string") {
    const parsed = asDate(input);
    if (parsed) return startOfDay(parsed);
  }
  return startOfDay(new Date());
}

function inferLearnerName(row: LearnerRow | null) {
  if (!row) return "Learner";
  const preferred = safe(row.preferred_name);
  if (preferred) return preferred;
  const full = [safe(row.first_name), safe(row.last_name)].filter(Boolean).join(" ");
  return full || "Learner";
}

function buildJurisdictionCode(countryCode: string, stateCode: string) {
  const country = safe(countryCode).toUpperCase();
  const state = safe(stateCode).toUpperCase();
  if (!country || !state) return null;
  return `${country}-${state}`;
}

function buildJurisdictionName(code: string | null) {
  return jurisdictionDisplayLabel(code) || null;
}

function maybeBetween(
  value: string | null | undefined,
  startDate: Date | null,
  endDate: Date | null,
) {
  const parsed = asDate(value);
  if (!parsed) return false;
  if (startDate && parsed < startDate) return false;
  if (endDate && parsed > endDate) return false;
  return true;
}

function periodContains(
  row: { start_date?: string | null; end_date?: string | null },
  today: Date,
) {
  const startDate = asDate(row.start_date);
  const endDate = asDate(row.end_date);
  if (startDate && today < startDate) return false;
  if (endDate && today > endDate) return false;
  return true;
}

function sortRowsByStartDateDescending<
  T extends { start_date?: string | null; effective_from?: string | null },
>(rows: T[]) {
  return [...rows].sort((left, right) => {
    const leftTime =
      asDate(left.start_date)?.getTime() ??
      asDate(left.effective_from)?.getTime() ??
      0;
    const rightTime =
      asDate(right.start_date)?.getTime() ??
      asDate(right.effective_from)?.getTime() ??
      0;
    return rightTime - leftTime;
  });
}

async function many<T>(
  db: QueryClient,
  table: string,
  configure: (query: ReturnType<typeof db.from>) => any,
) {
  const response = await configure(db.from(table));
  if (response.error) throw response.error;
  return Array.isArray(response.data) ? response.data : [];
}

async function maybeSingle<T>(
  db: QueryClient,
  table: string,
  configure: (query: ReturnType<typeof db.from>) => any,
) {
  const response = await configure(db.from(table));
  if (response.error) throw response.error;
  return response.data ?? null;
}

async function loadLearner(db: QueryClient, learnerId: string) {
  return maybeSingle<LearnerRow>(db, "learners", (query) =>
    query
      .select("id,family_id,first_name,last_name,preferred_name")
      .eq("id", learnerId)
      .maybeSingle(),
  );
}

async function loadFamilySettings(db: QueryClient, familyId: string) {
  return maybeSingle<FamilySettingsRow>(db, "family_settings", (query) =>
    query
      .select("family_id,country_code,state_code")
      .eq("family_id", familyId)
      .maybeSingle(),
  );
}

async function loadLearnerSettings(db: QueryClient, learnerId: string) {
  return maybeSingle<LearnerSettingsRow>(db, "learner_settings", (query) =>
    query
      .select("learner_id,jurisdiction_override_country,jurisdiction_override_state")
      .eq("learner_id", learnerId)
      .maybeSingle(),
  );
}

async function resolveJurisdictionRow(
  db: QueryClient,
  countryCode: string,
  stateCode: string,
): Promise<JurisdictionRow | null> {
  const code = buildJurisdictionCode(countryCode, stateCode);

  try {
    const byPair = await maybeSingle<JurisdictionRow>(db, "jurisdictions", (query) =>
      query
        .select("id,code,name,label,country_code,state_code")
        .eq("country_code", safe(countryCode).toUpperCase())
        .eq("state_code", safe(stateCode).toUpperCase())
        .maybeSingle(),
    );
    if (byPair) return byPair;
  } catch {
    // try code lookup next
  }

  if (!code) return null;

  try {
    const byCode = await maybeSingle<JurisdictionRow>(db, "jurisdictions", (query) =>
      query
        .select("id,code,name,label,country_code,state_code")
        .eq("code", code)
        .maybeSingle(),
    );
    if (byCode) return byCode;
  } catch {
    return {
      code,
      name: buildJurisdictionName(code),
      country_code: safe(countryCode).toUpperCase(),
      state_code: safe(stateCode).toUpperCase(),
    };
  }

  return {
    code,
    name: buildJurisdictionName(code),
    country_code: safe(countryCode).toUpperCase(),
    state_code: safe(stateCode).toUpperCase(),
  };
}

async function loadCurrentRuleSet(
  db: QueryClient,
  jurisdiction: JurisdictionRow | null,
  today: Date,
): Promise<RuleSetRow | null> {
  if (!jurisdiction) return null;
  const jurisdictionId = safe(jurisdiction.id);
  const jurisdictionCode = safe(jurisdiction.code);

  try {
    const rows = await many<RuleSetRow>(db, "jurisdiction_rule_sets", (query) => {
      let next = query.select("*");
      if (jurisdictionId) {
        next = next.eq("jurisdiction_id", jurisdictionId);
      } else if (jurisdictionCode) {
        next = next.eq("jurisdiction_code", jurisdictionCode);
      }
      return next.order("effective_from", { ascending: false });
    });

    const active = sortRowsByStartDateDescending(
      rows.filter((row: RuleSetRow) => {
        const effectiveTo = asDate(row.effective_to);
        return !effectiveTo || effectiveTo >= today;
      }),
    );
    return active[0] ?? rows[0] ?? null;
  } catch {
    return null;
  }
}

type AttendanceSummary = {
  days: number;
  hours: number;
  records: number;
};

async function loadRequiredArtifacts(
  db: QueryClient,
  ruleSetId: string,
): Promise<RequiredArtifactRow[]> {
  if (!ruleSetId) return [] as RequiredArtifactRow[];

  try {
    const rows = await many<RequiredArtifactRow>(db, "jurisdiction_required_artifacts", (query) =>
      query
        .select("id,rule_set_id,jurisdiction_rule_set_id,artifact_type,code,slug,label,name,short_note,note,required_frequency,frequency,display_order")
        .or(`rule_set_id.eq.${ruleSetId},jurisdiction_rule_set_id.eq.${ruleSetId}`)
        .order("display_order", { ascending: true }),
    );
    return rows;
  } catch {
    return [];
  }
}

async function loadRegistrationCycles(
  db: QueryClient,
  learnerId: string,
): Promise<RegistrationCycleRow[]> {
  try {
    return await many<RegistrationCycleRow>(db, "registration_cycles", (query) =>
      query
        .select("id,learner_id,status,name,label,start_date,end_date")
        .eq("learner_id", learnerId)
        .order("start_date", { ascending: false }),
    );
  } catch {
    return [];
  }
}

function selectCurrentCycle(rows: RegistrationCycleRow[], today: Date) {
  const current = rows.find((row: RegistrationCycleRow) => periodContains(row, today));
  return current ?? sortRowsByStartDateDescending(rows)[0] ?? null;
}

async function loadReportingPeriods(
  db: QueryClient,
  learnerId: string,
  cycleId: string | null,
): Promise<ReportingPeriodRow[]> {
  try {
    let rows = await many<ReportingPeriodRow>(db, "reporting_periods", (query) => {
      let next = query.select("id,registration_cycle_id,learner_id,status,label,name,period_type,start_date,end_date");
      if (cycleId) {
        next = next.eq("registration_cycle_id", cycleId);
      } else {
        next = next.eq("learner_id", learnerId);
      }
      return next.order("start_date", { ascending: false });
    });

    if (!rows.length && cycleId) {
      rows = await many<ReportingPeriodRow>(db, "reporting_periods", (query) =>
        query
          .select("id,registration_cycle_id,learner_id,status,label,name,period_type,start_date,end_date")
          .eq("learner_id", learnerId)
          .order("start_date", { ascending: false }),
      );
    }

    return rows;
  } catch {
    return [];
  }
}

function selectCurrentPeriod(rows: ReportingPeriodRow[], today: Date) {
  const current = rows.find((row: ReportingPeriodRow) => periodContains(row, today));
  return current ?? sortRowsByStartDateDescending(rows)[0] ?? null;
}

async function loadPlans(
  db: QueryClient,
  learnerId: string,
  startDate: Date | null,
  endDate: Date | null,
): Promise<PlanRow[]> {
  try {
    const rows = await many<PlanRow>(db, "learning_plans", (query) =>
      query
        .select("id,status,date_start,date_end")
        .eq("learner_id", learnerId),
    );

    return rows.filter((row: PlanRow) => {
      const planStart = asDate(row.date_start);
      const planEnd = asDate(row.date_end);
      if (!startDate && !endDate) return true;
      if (startDate && planEnd && planEnd < startDate) return false;
      if (endDate && planStart && planStart > endDate) return false;
      return true;
    });
  } catch {
    return [];
  }
}

async function loadExperiences(
  db: QueryClient,
  learnerId: string,
  startDate: Date | null,
  endDate: Date | null,
): Promise<ExperienceRow[]> {
  try {
    const rows = await many<ExperienceRow>(db, "learning_experiences", (query) =>
      query
        .select("id,plan_id,experience_date")
        .eq("learner_id", learnerId),
    );

    return rows.filter((row: ExperienceRow) =>
      maybeBetween(row.experience_date, startDate, endDate),
    );
  } catch {
    return [];
  }
}

async function loadEvidence(
  db: QueryClient,
  learnerId: string,
  startDate: Date | null,
  endDate: Date | null,
): Promise<EvidenceRow[]> {
  try {
    const rows = await many<EvidenceRow>(db, "evidence_items", (query) =>
      query
        .select("id,experience_id,plan_id,captured_at")
        .eq("learner_id", learnerId),
    );

    return rows.filter((row: EvidenceRow) =>
      maybeBetween(row.captured_at, startDate, endDate),
    );
  } catch {
    return [];
  }
}

async function loadNotificationSummary(
  db: QueryClient,
  learnerId: string,
  cycle: RegistrationCycleRow | null,
) {
  try {
    const configure = (query: ReturnType<typeof db.from>) => {
      let next = query
        .select("id,learner_id,registration_cycle_id,notification_type,submitted_at,due_date,status")
        .eq("learner_id", learnerId);

      if (cycle?.id) {
        next = next.eq("registration_cycle_id", cycle.id);
      }

      return next;
    };

    let rows: HomeschoolNotificationRow[] = [];

    try {
      rows = await many<HomeschoolNotificationRow>(db, "homeschool_notifications", configure);
    } catch (error) {
      if (!cycle?.id || !isMissingColumnError(error)) {
        throw error;
      }

      rows = await many<HomeschoolNotificationRow>(db, "homeschool_notifications", (query) =>
        query
          .select("id,learner_id,notification_type,submitted_at,due_date,status")
          .eq("learner_id", learnerId),
      );
    }

    const submitted = rows.filter((row) => {
      const status = toLower(row.status);
      return (
        Boolean(safe(row.submitted_at)) ||
        status === "submitted" ||
        status === "acknowledged" ||
        status === "filed" ||
        status === "complete" ||
        status === "completed"
      );
    }).length;

    return {
      total: rows.length,
      submitted,
    };
  } catch {
    return { total: 0, submitted: 0 };
  }
}

function summarizeAttendanceHourRows(rows: AttendanceHourRow[]): AttendanceSummary {
  const days = rows.filter((row) => {
    const schoolDay = row.school_day;
    const recordedDate = safe(row.recorded_date);
    return Boolean(schoolDay === true || schoolDay === "true" || recordedDate);
  }).length;

  const hours = rows.reduce(
    (sum, row) => sum + toNumber(row.instructional_hours),
    0,
  );

  return {
    days,
    hours,
    records: rows.length,
  };
}

function summarizeAttendanceSummaryRows(rows: AttendanceSummaryRow[]): AttendanceSummary {
  const days = rows.reduce(
    (max, row) =>
      Math.max(
        max,
        toNumber(row.total_days),
        toNumber(row.days),
        toNumber(row.instructional_days),
      ),
    0,
  );

  const hours = rows.reduce(
    (max, row) =>
      Math.max(
        max,
        toNumber(row.total_hours),
        toNumber(row.hours),
        toNumber(row.instructional_hours),
      ),
    0,
  );

  return {
    days,
    hours,
    records: rows.length,
  };
}

async function loadAttendanceHourSummary(
  db: QueryClient,
  learnerId: string,
  cycle: RegistrationCycleRow | null,
): Promise<AttendanceSummary> {
  try {
    if (cycle?.id) {
      try {
        const rows: AttendanceHourRow[] = await many<AttendanceHourRow>(db, "attendance_hour_logs", (query) =>
          query
            .select("id,learner_id,registration_cycle_id,recorded_date,instructional_hours,school_day")
            .eq("learner_id", learnerId)
            .eq("registration_cycle_id", cycle.id),
        );

        return summarizeAttendanceHourRows(rows);
      } catch (error) {
        if (!isMissingColumnError(error)) {
          throw error;
        }
      }
    }

    const rows: AttendanceHourRow[] = await many<AttendanceHourRow>(db, "attendance_hour_logs", (query) =>
      query
        .select("id,learner_id,recorded_date,instructional_hours,school_day")
        .eq("learner_id", learnerId),
    );

    return summarizeAttendanceHourRows(rows);
  } catch {
    return { days: 0, hours: 0, records: 0 };
  }
}

async function loadAttendanceManualSummary(
  db: QueryClient,
  learnerId: string,
  cycle: RegistrationCycleRow | null,
): Promise<AttendanceSummary> {
  try {
    if (cycle?.id) {
      try {
        const rows: AttendanceSummaryRow[] = await many<AttendanceSummaryRow>(db, "homeschool_attendance_summaries", (query) =>
          query
            .select("id,learner_id,registration_cycle_id,academic_year,total_days,days,instructional_days,total_hours,hours,instructional_hours")
            .eq("learner_id", learnerId)
            .eq("registration_cycle_id", cycle.id),
        );

        return summarizeAttendanceSummaryRows(rows);
      } catch (error) {
        if (!isMissingColumnError(error)) {
          throw error;
        }
      }
    }

    const rows: AttendanceSummaryRow[] = await many<AttendanceSummaryRow>(db, "homeschool_attendance_summaries", (query) =>
      query
        .select("id,learner_id,academic_year,total_days,days,instructional_days,total_hours,hours,instructional_hours")
        .eq("learner_id", learnerId),
    );

    return summarizeAttendanceSummaryRows(rows);
  } catch {
    return { days: 0, hours: 0, records: 0 };
  }
}

async function loadAttendanceSummary(
  db: QueryClient,
  learnerId: string,
  cycle: RegistrationCycleRow | null,
): Promise<AttendanceSummary> {
  const [logSummary, manualSummary] = await Promise.all([
    loadAttendanceHourSummary(db, learnerId, cycle),
    loadAttendanceManualSummary(db, learnerId, cycle),
  ]);

  return {
    days: Math.max(logSummary.days, manualSummary.days),
    hours: Math.max(logSummary.hours, manualSummary.hours),
    records: logSummary.records + manualSummary.records,
  };
}

async function loadSubjectLogCount(
  db: QueryClient,
  learnerId: string,
  cycle: RegistrationCycleRow | null,
): Promise<number> {
  try {
    if (cycle?.id) {
      try {
        const rows = await many<SubjectLogRow>(db, "homeschool_instruction_subject_logs", (query) =>
          query
            .select("id,learner_id,registration_cycle_id")
            .eq("learner_id", learnerId)
            .eq("registration_cycle_id", cycle.id),
        );

        return rows.length;
      } catch (error) {
        if (!isMissingColumnError(error)) {
          throw error;
        }
      }
    }

    const rows = await many<SubjectLogRow>(db, "homeschool_instruction_subject_logs", (query) =>
      query
        .select("id,learner_id")
        .eq("learner_id", learnerId),
    );

    return rows.length;
  } catch {
    return 0;
  }
}

async function loadReportDocuments(
  db: QueryClient,
  learnerId: string,
  periodId: string | null,
): Promise<ReportDocumentRow[]> {
  try {
    let rows = await many<ReportDocumentRow>(db, "report_documents", (query) => {
      let next = query.select("id,reporting_period_id,learner_id,status");
      if (periodId) {
        next = next.eq("reporting_period_id", periodId);
      }
      return next.eq("learner_id", learnerId);
    });

    if (!rows.length && periodId) {
      rows = await many<ReportDocumentRow>(db, "report_documents", (query) =>
        query
          .select("id,reporting_period_id,learner_id,status")
          .eq("reporting_period_id", periodId),
      );
    }

    return rows;
  } catch {
    return [];
  }
}

async function loadReviews(
  db: QueryClient,
  learnerId: string,
  startDate: Date | null,
  endDate: Date | null,
): Promise<ReviewRow[]> {
  try {
    const rows = await many<ReviewRow>(db, "reviews", (query) =>
      query
        .select("id,learner_id,review_date,status")
        .eq("learner_id", learnerId),
    );
    return rows.filter((row: ReviewRow) => maybeBetween(row.review_date, startDate, endDate));
  } catch {
    return [];
  }
}

async function loadConcerns(db: QueryClient, learnerId: string): Promise<ConcernRow[]> {
  try {
    return await many<ConcernRow>(db, "concerns", (query) =>
      query
        .select("id,learner_id,status")
        .eq("learner_id", learnerId),
    );
  } catch {
    return [];
  }
}

async function loadRegistrationConditions(
  db: QueryClient,
  learnerId: string,
): Promise<RegistrationConditionRow[]> {
  try {
    return await many<RegistrationConditionRow>(db, "registration_conditions", (query) =>
      query
        .select("id,learner_id,status")
        .eq("learner_id", learnerId),
    );
  } catch {
    return [];
  }
}

function normalizeArtifactType(row: RequiredArtifactRow) {
  return (
    safe(row.artifact_type) ||
    safe(row.code) ||
    safe(row.slug) ||
    "artifact"
  );
}

function normalizeArtifactLabel(row: RequiredArtifactRow) {
  return safe(row.label) || safe(row.name) || "Required artifact";
}

function evaluateArtifactStatus(
  artifactType: string,
  ctx: ArtifactEvaluationContext,
): ComplianceReadinessItemStatus {
  const key = toLower(artifactType);
  const documentationMode =
    ctx.behaviour.portfolioModeEnabled ||
    ctx.behaviour.reportRequirementMode === "not_required";

  if (documentationMode) {
    if (key.includes("attendance") || key.includes("hour") || key.includes("day")) {
      return ctx.attendanceDays > 0 || ctx.attendanceHours > 0 ? "complete" : "in_progress";
    }
    if (key.includes("notification") || key.includes("notice")) {
      return ctx.notificationCount > 0 ? "complete" : "in_progress";
    }
    if (key.includes("assessment") || key.includes("evaluation") || key.includes("testing")) {
      return ctx.reviewCount > 0 || ctx.reportDocumentCount > 0 ? "complete" : "in_progress";
    }
    if (key.includes("subject")) {
      return ctx.subjectLogCount > 0 || ctx.planCount > 0 || ctx.linkedPlanCount > 0
        ? "complete"
        : "in_progress";
    }
    if (key.includes("plan") || key.includes("program")) {
      return ctx.planCount > 0 || ctx.linkedPlanCount > 0 ? "complete" : "in_progress";
    }
    if (key.includes("portfolio")) {
      return ctx.linkedEvidenceCount > 0 ? "complete" : "in_progress";
    }
    if (key.includes("report")) {
      return ctx.reportDocumentCount > 0 || ctx.linkedEvidenceCount > 0 || ctx.linkedPlanCount > 0
        ? "complete"
        : "in_progress";
    }
  }

  if (key.includes("subject")) {
    if (ctx.subjectLogCount > 0) return "complete";
    if (ctx.planCount > 0 || ctx.linkedPlanCount > 0) return "in_progress";
    return documentationMode ? "in_progress" : "missing";
  }

  if (key.includes("plan") || key.includes("program")) {
    if (ctx.linkedPlanCount > 0) return "complete";
    if (ctx.planCount > 0 || ctx.subjectLogCount > 0) return "in_progress";
    return "missing";
  }

  if (key.includes("experience")) {
    if (ctx.linkedExperienceCount > 0) return "complete";
    if (ctx.experienceCount > 0) return "in_progress";
    return "missing";
  }

  if (
    key.includes("evidence") ||
    key.includes("sample") ||
    key.includes("record")
  ) {
    if (ctx.linkedEvidenceCount > 0) return "complete";
    if (ctx.evidenceCount > 0) return "in_progress";
    return "missing";
  }

  if (key.includes("report")) {
    if (documentationMode) return "complete";
    if (ctx.reportDocumentCount > 0) return "complete";
    if (ctx.linkedEvidenceCount > 0 || ctx.linkedPlanCount > 0) return "in_progress";
    return "missing";
  }

  if (key.includes("notification") || key.includes("notice")) {
    if (ctx.submittedNotificationCount > 0) return "complete";
    if (ctx.notificationCount > 0) return "in_progress";
    return documentationMode ? "in_progress" : "missing";
  }

  if (key.includes("attendance") || key.includes("hour") || key.includes("day")) {
    if (ctx.complianceProfile.requiredInstructionDaysPerYear != null) {
      if (ctx.attendanceDays >= ctx.complianceProfile.requiredInstructionDaysPerYear) return "complete";
      if (ctx.attendanceDays > 0) return "in_progress";
      return documentationMode ? "in_progress" : "missing";
    }
    if (ctx.complianceProfile.requiredInstructionHoursPerYear != null) {
      if (ctx.attendanceHours >= ctx.complianceProfile.requiredInstructionHoursPerYear) return "complete";
      if (ctx.attendanceHours > 0) return "in_progress";
      return documentationMode ? "in_progress" : "missing";
    }
    return documentationMode
      ? ctx.attendanceDays > 0 || ctx.attendanceHours > 0
        ? "in_progress"
        : "in_progress"
      : ctx.attendanceDays > 0 || ctx.attendanceHours > 0
        ? "in_progress"
        : "missing";
  }

  if (key.includes("assessment") || key.includes("evaluation") || key.includes("testing")) {
    if (ctx.reviewCount > 0) return "complete";
    if (ctx.reportDocumentCount > 0 || ctx.linkedEvidenceCount > 0) return "in_progress";
    return documentationMode ? "in_progress" : "missing";
  }

  if (key.includes("review")) {
    if (ctx.reviewCount > 0) return "complete";
    if (ctx.reportDocumentCount > 0) return "in_progress";
    return documentationMode ? "in_progress" : "missing";
  }

  if (key.includes("concern")) {
    return ctx.openConcernCount === 0 ? "complete" : "in_progress";
  }

  if (key.includes("condition")) {
    return ctx.activeConditionCount === 0 ? "complete" : "in_progress";
  }

  if (ctx.linkedEvidenceCount > 0 || ctx.linkedPlanCount > 0 || ctx.reportDocumentCount > 0) {
    return "in_progress";
  }

  return documentationMode ? "in_progress" : "missing";
}

function buildSummary(
  status: ComplianceReadiness["status"],
  jurisdictionName: string | null,
  strengths: string[],
  warnings: string[],
  missing: string[],
  behaviour: JurisdictionBehaviour,
  attendance: AttendanceSummary,
  notificationCount: number,
) {
  const jurisdiction = jurisdictionName || "current";
  const posture = behaviour.summaryText;

  if (status === "ready") {
    const attendanceNote =
      behaviour.enforceAttendanceCompletion && (attendance.days > 0 || attendance.hours > 0)
        ? ` Attendance tracking is visible, and ${notificationCount > 0 ? "notification activity" : "family records"} are in place.`
        : "";
    return `${posture} Compliance readiness for ${jurisdiction} is in a strong position. The core planning, evidence, and reporting records are in place for this learner.${attendanceNote}`;
  }

  if (status === "warning") {
    if (warnings.length) {
      return `${posture} Compliance readiness for ${jurisdiction} is mixed. Some core records are present, but there are still issues that need attention before the record is dependable.`;
    }
    return `${posture} Compliance readiness for ${jurisdiction} is underway. Some required artifacts exist, but the learner record is not complete yet.`;
  }

  if (missing.length) {
    return `${posture} Compliance readiness for ${jurisdiction} is not ready yet. Core compliance artifacts are still missing for this learner.`;
  }

  return `${posture} Compliance readiness for ${jurisdiction} could not be established yet.`;
}

function buildNextAction(
  jurisdictionCode: string | null,
  missingItems: string[],
  warningItems: string[],
  behaviour: JurisdictionBehaviour,
  attendance: AttendanceSummary,
  notificationCount: number,
) {
  if (!jurisdictionCode) {
    return "Confirm the learner jurisdiction settings";
  }

  if (behaviour.portfolioModeEnabled || behaviour.reportRequirementMode === "not_required") {
    if (missingItems.some((item: string) => toLower(item).includes("portfolio") || toLower(item).includes("sample"))) {
      return "Add one more portfolio sample to keep the documentation visible.";
    }
    if (attendance.days === 0 && attendance.hours === 0 && behaviour.enforceAttendanceCompletion) {
      return "Add the first attendance or hours record for this cycle.";
    }
    if (notificationCount === 0 && behaviour.enforceNotificationCompletion) {
      return "Confirm the required notice or filing status.";
    }
    return "Keep the portfolio broad and current, then export the documentation when it feels complete.";
  }

  if (missingItems.some((item: string) => toLower(item).includes("plan") || toLower(item).includes("program"))) {
    return "Create or update the current learning plan";
  }

  if (missingItems.some((item: string) => toLower(item).includes("experience"))) {
    return "Record a linked learning experience";
  }

  if (missingItems.some((item: string) => toLower(item).includes("evidence") || toLower(item).includes("sample"))) {
    return "Capture linked learning evidence";
  }

  if (missingItems.some((item: string) => toLower(item).includes("report"))) {
    return "Open reports to generate the current draft";
  }

  if (missingItems.some((item: string) => toLower(item).includes("review"))) {
    return "Add the current review record";
  }

  if (warningItems.some((item: string) => toLower(item).includes("concern"))) {
    return "Review active concerns";
  }

  if (warningItems.some((item: string) => toLower(item).includes("condition"))) {
    return "Review registration conditions";
  }

  if (attendance.days === 0 && attendance.hours === 0 && behaviour.enforceAttendanceCompletion) {
    return "Add attendance or instructional hours for the current cycle";
  }

  if (notificationCount === 0 && behaviour.enforceNotificationCompletion) {
    return "Confirm the notice or filing required by this state";
  }

  return null;
}

function computeScore(
  items: NormalizedArtifact[],
  openConcernCount: number,
  activeConditionCount: number,
) {
  if (!items.length) {
    const penalty = Math.min(30, openConcernCount * 10 + activeConditionCount * 10);
    return Math.max(0, 20 - penalty);
  }

  const totalWeight = items.length * 100;
  const earned = items.reduce((sum, item) => {
    if (item.status === "complete") return sum + 100;
    if (item.status === "in_progress") return sum + 50;
    return sum;
  }, 0);

  const baseScore = Math.round((earned / totalWeight) * 100);
  const penalty = Math.min(30, openConcernCount * 10 + activeConditionCount * 10);
  return Math.max(0, Math.min(100, baseScore - penalty));
}

function deriveOverallStatus(
  items: NormalizedArtifact[],
  openConcernCount: number,
  activeConditionCount: number,
): ComplianceReadiness["status"] {
  const completed = items.filter((item: NormalizedArtifact) => item.status === "complete").length;
  const missing = items.filter((item: NormalizedArtifact) => item.status === "missing").length;

  if (items.length > 0 && missing === 0 && openConcernCount === 0 && activeConditionCount === 0) {
    return "ready";
  }

  if (completed > 0 || openConcernCount > 0 || activeConditionCount > 0) {
    return "warning";
  }

  return "not_ready";
}

export async function loadComplianceReadiness(
  input: LoadComplianceReadinessInput,
): Promise<ComplianceReadiness> {
  const learnerId = safe(input.learnerId);
  if (!learnerId) {
    return {
      ...EMPTY_READINESS,
      summary: "A learner is required before compliance readiness can be evaluated.",
    };
  }

  const today = resolveToday(input.today);
  const db = input.client ?? supabase;

  try {
    const learner = await loadLearner(db, learnerId);
    if (!learner) {
      return {
        ...EMPTY_READINESS,
        learnerId,
        summary: "The learner could not be found in the current family workspace.",
      };
    }

    const learnerName = inferLearnerName(learner);
    const familyId = safe(learner.family_id);

    const [familySettings, learnerSettings] = await Promise.all([
      familyId ? loadFamilySettings(db, familyId) : Promise.resolve(null),
      loadLearnerSettings(db, learnerId),
    ]);

    const countryCode =
      safe(learnerSettings?.jurisdiction_override_country) ||
      safe(familySettings?.country_code);
    const stateCode =
      safe(learnerSettings?.jurisdiction_override_state) ||
      safe(familySettings?.state_code);

    const jurisdiction = countryCode && stateCode
      ? await resolveJurisdictionRow(db, countryCode, stateCode)
      : null;

    const jurisdictionCode =
      safe(jurisdiction?.code) ||
      buildJurisdictionCode(countryCode, stateCode);
    const jurisdictionName =
      safe(jurisdiction?.name) ||
      safe(jurisdiction?.label) ||
      buildJurisdictionName(jurisdictionCode);

    const ruleSet = await loadCurrentRuleSet(db, jurisdiction, today);
    const jurisdictionProfile = resolveJurisdictionComplianceProfile({
      countryCode,
      stateCode,
      jurisdictionCode,
      jurisdictionName,
      complianceLevel: ruleSet?.compliance_level,
      complianceMode: ruleSet?.compliance_mode,
      complianceUiMode: ruleSet?.compliance_ui_mode,
      reportRequirementMode: ruleSet?.report_requirement_mode,
      regulatoryFamily: ruleSet?.regulatory_family,
      reportRequired: ruleSet?.report_required,
      requiresNotification: ruleSet?.requires_notification,
      requiresNotificationAnnual: ruleSet?.requires_notification_annual,
      requiresAttendanceTracking: ruleSet?.requires_attendance_tracking,
      requiresInstructionHours: ruleSet?.requires_instruction_hours,
      requiredInstructionHoursPerYear: ruleSet?.required_instruction_hours_per_year,
      requiredInstructionDaysPerYear: ruleSet?.required_instruction_days_per_year,
      requiresSubjectList: ruleSet?.requires_subject_list,
      requiresYearlyPlan: ruleSet?.requires_yearly_plan,
      requiresQuarterlyReports: ruleSet?.requires_quarterly_reports,
      requiresAnnualAssessment: ruleSet?.requires_annual_assessment,
      requiresStandardizedTesting: ruleSet?.requires_standardized_testing,
      requiresProfessionalEvaluation: ruleSet?.requires_professional_evaluation,
      requiresPortfolio: ruleSet?.requires_portfolio,
      requiresWorkSamples: ruleSet?.requires_work_samples,
      requiresParentQualificationCheck: ruleSet?.requires_parent_qualification_check,
      requiresImmunizationRecordOrExemption: ruleSet?.requires_immunization_record_or_exemption,
      requiresSubmissionToAuthority: ruleSet?.requires_submission_to_authority,
      exportShouldBeBlockedWhenIncomplete: ruleSet?.export_should_be_blocked_when_incomplete,
      allowsPortfolioInsteadOfTesting: ruleSet?.allows_portfolio_instead_of_testing,
      allowsEvaluationInsteadOfTesting: ruleSet?.allows_evaluation_instead_of_testing,
    });

    const behaviour = buildJurisdictionBehaviour({
      jurisdictionId: safe(jurisdiction?.id) || null,
      jurisdictionCode,
      jurisdictionName,
      countryCode,
      complianceLevel: jurisdictionProfile.complianceLevel,
      complianceMode: jurisdictionProfile.complianceMode,
      complianceUiMode: jurisdictionProfile.complianceUiMode,
      reportRequirementMode: jurisdictionProfile.reportRequirementMode,
      reportRequired: jurisdictionProfile.reportRequired,
      requiresNotification: jurisdictionProfile.requiresNotification,
      requiresNotificationAnnual: jurisdictionProfile.requiresNotificationAnnual,
      requiresAttendanceTracking: jurisdictionProfile.requiresAttendanceTracking,
      requiresInstructionHours: jurisdictionProfile.requiresInstructionHours,
      requiredInstructionHoursPerYear: jurisdictionProfile.requiredInstructionHoursPerYear,
      requiredInstructionDaysPerYear: jurisdictionProfile.requiredInstructionDaysPerYear,
      requiresAnnualAssessment: jurisdictionProfile.requiresAnnualAssessment,
      exportShouldBeBlockedWhenIncomplete: jurisdictionProfile.exportShouldBeBlockedWhenIncomplete,
      allowsPortfolioInsteadOfTesting: jurisdictionProfile.allowsPortfolioInsteadOfTesting,
      allowsEvaluationInsteadOfTesting: jurisdictionProfile.allowsEvaluationInsteadOfTesting,
    });

    const requiredArtifacts = await loadRequiredArtifacts(db, safe(ruleSet?.id));

    const registrationCycles = await loadRegistrationCycles(db, learnerId);
    const currentCycle = selectCurrentCycle(registrationCycles, today);
    const cycleStartDate = asDate(currentCycle?.start_date);
    const cycleEndDate = asDate(currentCycle?.end_date);

    const reportingPeriods = await loadReportingPeriods(
      db,
      learnerId,
      safe(currentCycle?.id) || null,
    );
    const currentPeriod = selectCurrentPeriod(reportingPeriods, today);

    const [
      plans,
      experiences,
      evidenceItems,
      reportDocuments,
      reviews,
      concerns,
      registrationConditions,
      notificationSummary,
      attendance,
      subjectLogCount,
    ] = await Promise.all([
      loadPlans(db, learnerId, cycleStartDate, cycleEndDate),
      loadExperiences(db, learnerId, cycleStartDate, cycleEndDate),
      loadEvidence(db, learnerId, cycleStartDate, cycleEndDate),
      loadReportDocuments(db, learnerId, safe(currentPeriod?.id) || null),
      loadReviews(db, learnerId, cycleStartDate, cycleEndDate),
      loadConcerns(db, learnerId),
      loadRegistrationConditions(db, learnerId),
      loadNotificationSummary(db, learnerId, currentCycle),
      loadAttendanceSummary(db, learnerId, currentCycle),
      loadSubjectLogCount(db, learnerId, currentCycle),
    ]);

    const linkedPlanCount = plans.filter((plan) => {
      const planId = safe(plan.id);
      if (!planId) return false;
      return (
        experiences.some((experience) => safe(experience.plan_id) === planId) ||
        evidenceItems.some((item: EvidenceRow) => safe(item.plan_id) === planId)
      );
    }).length;

    const linkedExperienceCount = experiences.filter((experience) => {
      const experienceId = safe(experience.id);
      if (!experienceId) return false;
      return evidenceItems.some((item: EvidenceRow) => safe(item.experience_id) === experienceId);
    }).length;

    const linkedEvidenceCount = evidenceItems.filter(
      (item) => safe(item.plan_id) || safe(item.experience_id),
    ).length;

    const openConcernCount = concerns.filter((row: ConcernRow) => {
      const status = toLower(row.status);
      return status === "" || status === "open" || status === "active" || status === "pending";
    }).length;

    const activeConditionCount = registrationConditions.filter((row: RegistrationConditionRow) => {
      const status = toLower(row.status);
      return status === "" || status === "open" || status === "active" || status === "pending";
    }).length;

    const ctx: ArtifactEvaluationContext = {
      planCount: plans.length,
      linkedPlanCount,
      subjectLogCount,
      experienceCount: experiences.length,
      linkedExperienceCount,
      evidenceCount: evidenceItems.length,
      linkedEvidenceCount,
      reportDocumentCount: reportDocuments.length,
      reviewCount: reviews.length,
      notificationCount: notificationSummary.total,
      submittedNotificationCount: notificationSummary.submitted,
      attendanceDays: attendance.days,
      attendanceHours: attendance.hours,
      openConcernCount,
      activeConditionCount,
      complianceProfile: jurisdictionProfile,
      behaviour,
    };

    const normalizedArtifacts: NormalizedArtifact[] = requiredArtifacts.length
      ? requiredArtifacts.map((row: RequiredArtifactRow) => {
          const artifactType = normalizeArtifactType(row);
          return {
            artifactType,
            label: normalizeArtifactLabel(row),
            status: evaluateArtifactStatus(artifactType, ctx),
          };
        })
      : [
          {
            artifactType: "learning_plan",
            label: "Learning plan",
            status: evaluateArtifactStatus("learning_plan", ctx),
          },
          {
            artifactType: "evidence_items",
            label: "Evidence record",
            status: evaluateArtifactStatus("evidence_items", ctx),
          },
          {
            artifactType: "report_document",
            label: "Report draft",
            status: evaluateArtifactStatus("report_document", ctx),
          },
        ];

    const completedCount = normalizedArtifacts.filter((item: NormalizedArtifact) => item.status === "complete").length;
    const totalCount = normalizedArtifacts.length;

    const strengths: string[] = [];
    const warnings: string[] = [];
    const missing: string[] = [];

    if (jurisdictionCode && jurisdictionName) {
      strengths.push(`Jurisdiction resolved as ${jurisdictionName}.`);
    } else {
      missing.push("Jurisdiction settings are missing.");
    }

    if (safe(ruleSet?.id)) {
      strengths.push("A current jurisdiction rule set is available.");
    } else {
      warnings.push("No current jurisdiction rule set was found.");
    }

    if (safe(currentCycle?.id)) {
      strengths.push("A registration cycle is on file.");
    } else {
      missing.push("No registration cycle was found for this learner.");
    }

    if (safe(currentPeriod?.id)) {
      strengths.push("A reporting period is available.");
    } else {
      warnings.push("No reporting period was found for the current cycle.");
    }

    if (linkedPlanCount > 0) {
      strengths.push("Planning is linked to recorded learning.");
    } else if (plans.length > 0) {
      warnings.push("Plans exist, but they are not yet clearly linked to recorded learning.");
    }

    if (subjectLogCount > 0) {
      strengths.push("Subject tracking is visible for this learner.");
    }

    if (linkedEvidenceCount > 0) {
      strengths.push("Evidence is linked to planning or learning experiences.");
    } else if (evidenceItems.length > 0) {
      warnings.push("Evidence exists, but it is not clearly linked back to planning or learning experiences.");
    }

    if (behaviour.enforceNotificationCompletion) {
      if (notificationSummary.submitted > 0) {
        strengths.push("Required notification has been submitted.");
      } else if (notificationSummary.total > 0) {
        warnings.push("A required notification record still needs attention.");
      } else {
        missing.push("Notification record is missing.");
      }
    } else if (notificationSummary.total > 0) {
      strengths.push("Notification tracking is visible for this jurisdiction.");
    }

    if (behaviour.enforceAttendanceCompletion) {
      if (attendance.days > 0 || attendance.hours > 0) {
        strengths.push("Attendance or instructional hours are being tracked.");
      } else {
        missing.push(
          jurisdictionProfile.requiredInstructionDaysPerYear != null
            ? "Attendance days are missing."
            : "Instructional hours are missing.",
        );
      }
    } else if (attendance.records > 0) {
      strengths.push("Attendance records are available for family reference.");
    }

    if (reportDocuments.length > 0) {
      strengths.push("A report document exists for the current reporting flow.");
    }

    if (reviews.length > 0) {
      strengths.push("A review record exists for the current cycle.");
    }

    if (openConcernCount > 0) {
      warnings.push(
        `${openConcernCount} active concern${openConcernCount === 1 ? "" : "s"} need review.`,
      );
    }

    if (activeConditionCount > 0) {
      warnings.push(
        `${activeConditionCount} registration condition${activeConditionCount === 1 ? "" : "s"} remain active.`,
      );
    }

    normalizedArtifacts.forEach((item) => {
      if (item.status === "missing") {
        missing.push(item.label);
      } else if (item.status === "in_progress") {
        warnings.push(`${item.label} is still in progress.`);
      }
    });

    const status = deriveOverallStatus(
      normalizedArtifacts,
      openConcernCount,
      activeConditionCount,
    );
    const score = computeScore(
      normalizedArtifacts,
      openConcernCount,
      activeConditionCount,
    );

    return {
      learnerId,
      learnerName,
      jurisdictionCode,
      jurisdictionName,
      status,
      score,
      summary: buildSummary(
        status,
        jurisdictionName,
        strengths,
        warnings,
        missing,
        behaviour,
        attendance,
        notificationSummary.submitted,
      ),
      nextAction: buildNextAction(
        jurisdictionCode,
        missing,
        warnings,
        behaviour,
        attendance,
        notificationSummary.submitted,
      ),
      completedCount,
      totalCount,
      items: normalizedArtifacts,
      strengths,
      warnings,
      missing,
    };
  } catch (error) {
    const detail = safe(asObject(error).message) || safe(error);
    return {
      ...EMPTY_READINESS,
      learnerId,
      summary: detail
        ? `Compliance readiness could not be evaluated cleanly. ${detail}`
        : "Compliance readiness could not be evaluated cleanly.",
      warnings: detail ? [detail] : [],
    };
  }
}