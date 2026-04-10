import { supabase } from "@/lib/supabaseClient";

export type LeadershipTrendPoint = { period_start: string; value: number };

export type LeadershipDashboard = {
  kpis: {
    students_total: number;
    evidence_7d_total: number;
    evidence_30d_total: number;
    evidence_30d_delta: number;
    evidence_90d_total: number;
    evidence_90d_delta: number;
    interventions_active: number;
    interventions_created_30d: number;
    interventions_created_30d_delta: number;
    interventions_created_90d: number;
    interventions_created_90d_delta: number;
    reviews_overdue: number;
    classes_at_risk: number;
    on_time_review_rate: number | null;
  };
  trends: {
    evidence_monthly: LeadershipTrendPoint[];
    interventions_created_monthly: LeadershipTrendPoint[];
  };
  class_risk: Array<{
    class_id: string;
    class_name: string;
    students: number;
    evidence_30d: number;
    reviews_due: number;
  }>;
};

export type LeadershipFocusNext = {
  label: string;
  reason: string;
  chip: string;
  href: string;
};

export async function loadLeadershipDashboard() {
  const { data, error } = await supabase.rpc("get_school_leadership_dashboard");
  if (error) throw error;
  return (data ?? null) as LeadershipDashboard | null;
}

export function leadershipMomentum(data: LeadershipDashboard | null) {
  const riskCount = data?.kpis.classes_at_risk ?? 0;
  const overdue = data?.kpis.reviews_overdue ?? 0;

  if (!data?.class_risk.length) {
    return { label: "Still forming", tone: "neutral" as const };
  }
  if (riskCount <= 1 && overdue === 0) {
    return { label: "Steady overview", tone: "success" as const };
  }
  if (riskCount <= 3 && overdue <= 2) {
    return { label: "Watchful rhythm", tone: "info" as const };
  }
  return { label: "Needs attention", tone: "warning" as const };
}

export function leadershipConfidence(data: LeadershipDashboard | null) {
  if (!data) return { label: "Still forming", tone: "neutral" as const };

  const classCount = data.class_risk.length || 1;
  const evidencePerClass = data.kpis.evidence_30d_total / classCount;
  const onTime = data.kpis.on_time_review_rate ?? 0;

  if (evidencePerClass >= 8 && onTime >= 85) {
    return { label: "Confident view", tone: "success" as const };
  }
  if (evidencePerClass >= 4 && onTime >= 65) {
    return { label: "Taking shape", tone: "info" as const };
  }
  return { label: "Partial visibility", tone: "warning" as const };
}

export function buildLeadershipFocusNext(
  data: LeadershipDashboard | null
): LeadershipFocusNext | null {
  if (!data) return null;

  const topClass = data.class_risk[0];
  if (!topClass) {
    return {
      label: "Reconnect school visibility",
      reason: "No class-level risk picture is available yet, so start by refreshing the school view.",
      chip: "Refresh view",
      href: "/leadership",
    };
  }

  if (data.kpis.reviews_overdue > 0) {
    return {
      label: `Check ${topClass.class_name}`,
      reason:
        topClass.reviews_due > 0
          ? `${topClass.reviews_due} review${topClass.reviews_due === 1 ? "" : "s"} are due in this class, so support pressure may drift first here.`
          : "Overdue review pressure is building, and this class is the clearest place to settle it first.",
      chip: "Open class",
      href: `/classes/${topClass.class_id}/leadership`,
    };
  }

  if (topClass.evidence_30d <= Math.max(1, Math.floor(topClass.students / 3))) {
    return {
      label: `Restore visibility in ${topClass.class_name}`,
      reason: `Only ${topClass.evidence_30d} evidence item${topClass.evidence_30d === 1 ? "" : "s"} landed in the last 30 days for ${topClass.students} learners.`,
      chip: "Open class",
      href: `/classes/${topClass.class_id}/leadership`,
    };
  }

  if (data.kpis.interventions_active > 0) {
    return {
      label: "Review support pressure",
      reason: "Active intervention load is visible across the school, so leadership time is best spent where support weight is building.",
      chip: "Open class",
      href: `/classes/${topClass.class_id}/leadership`,
    };
  }

  return {
    label: `Keep ${topClass.class_name} steady`,
    reason: "The school view is calmer right now, so one class-level check-in is enough to keep leadership visibility grounded.",
    chip: "Open class",
    href: `/classes/${topClass.class_id}/leadership`,
  };
}

export function buildLeadershipSnapshot(data: LeadershipDashboard | null) {
  if (!data) return "Refreshing the school view.";

  const classCount = data.class_risk.length;
  if (!classCount) {
    return "No classes are visible in the leadership view yet.";
  }

  const riskCount = data.kpis.classes_at_risk;
  const overdue = data.kpis.reviews_overdue;
  const evidence30 = data.kpis.evidence_30d_total;
  return `${classCount} classes are visible, ${riskCount} need closer attention, ${overdue} review${overdue === 1 ? "" : "s"} are overdue, and ${evidence30} evidence item${evidence30 === 1 ? "" : "s"} landed in the last 30 days.`;
}

export function buildLeadershipSupportPressure(data: LeadershipDashboard | null) {
  if (!data) return "";
  if (data.kpis.reviews_overdue > 0) {
    return `${data.kpis.reviews_overdue} review${data.kpis.reviews_overdue === 1 ? "" : "s"} are overdue across the current school view.`;
  }
  if (data.kpis.interventions_active >= 8) {
    return `${data.kpis.interventions_active} active interventions are open, so support load is worth checking before it spreads.`;
  }
  if (data.kpis.classes_at_risk >= 3) {
    return `${data.kpis.classes_at_risk} classes are carrying visible pressure right now.`;
  }
  return "";
}

export function classIssue(row: LeadershipDashboard["class_risk"][number]) {
  if (row.reviews_due > 0) {
    return `${row.reviews_due} review${row.reviews_due === 1 ? "" : "s"} are due in this class.`;
  }
  if (row.evidence_30d <= Math.max(1, Math.floor(row.students / 3))) {
    return `Recent evidence is thin for a class of ${row.students}.`;
  }
  return "A class-level check-in would help keep visibility steady.";
}

export function classAction(row: LeadershipDashboard["class_risk"][number]) {
  if (row.reviews_due > 0) return "Check review pressure";
  if (row.evidence_30d <= Math.max(1, Math.floor(row.students / 3))) {
    return "Restore visibility";
  }
  return "Open class";
}

export function buildLeadershipActivityNote(data: LeadershipDashboard | null) {
  if (!data) return "";
  if (data.kpis.evidence_30d_delta > 0) {
    return `Recent evidence activity is up ${data.kpis.evidence_30d_delta} on the previous 30-day window.`;
  }
  if (data.kpis.evidence_30d_delta < 0) {
    return `Recent evidence activity is down ${Math.abs(data.kpis.evidence_30d_delta)} on the previous 30-day window.`;
  }
  if (data.kpis.interventions_created_30d_delta > 0) {
    return `Support-plan activity has lifted recently, which may explain some of the current pressure.`;
  }
  return "";
}
