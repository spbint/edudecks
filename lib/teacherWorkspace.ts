import { supabase } from "@/lib/supabaseClient";
import type {
  ClassAnalytics,
  ClassRow,
  StudentAttentionItem,
  StudentAnalytics,
} from "@/lib/analytics/types";

export const LAST_TEACHER_CLASS_KEY = "fm_teacher_last_class_v1";
export const TEACHER_CLASS_CHANGED_EVENT = "edudecksTeacherClassChanged";

export type TeacherFocusNext = {
  label: string;
  reason: string;
  chip: string;
  href: string;
};

export type TeacherSupportQueueItem = {
  id: string;
  name: string;
  text: string;
  due: string;
};

export function safe(value: unknown) {
  return String(value ?? "").trim();
}

export async function loadTeacherClasses() {
  const resp = await supabase
    .from("classes")
    .select("id,name,year_level,teacher_name,room")
    .order("year_level", { ascending: true })
    .order("name", { ascending: true });

  if (resp.error) throw resp.error;
  return ((resp.data ?? []) as unknown) as ClassRow[];
}

export function readLastTeacherClassId() {
  if (typeof window === "undefined") return "";
  try {
    return safe(window.localStorage.getItem(LAST_TEACHER_CLASS_KEY));
  } catch {
    return "";
  }
}

export function setTeacherClassId(classId: string) {
  if (typeof window === "undefined" || !classId) return;
  try {
    window.localStorage.setItem(LAST_TEACHER_CLASS_KEY, classId);
    window.dispatchEvent(
      new CustomEvent(TEACHER_CLASS_CHANGED_EVENT, { detail: { classId } })
    );
  } catch {
    // best effort only
  }
}

export function className(row?: ClassRow | null) {
  const name = safe(row?.name);
  return name || "Unnamed class";
}

export function classYear(row?: ClassRow | null) {
  if (!row) return "";
  if (row.year_level == null) return "";
  if (row.year_level === 0) return "Kinder/Prep";
  return `Year ${row.year_level}`;
}

export function studentName(row: StudentAttentionItem) {
  return safe(row.student_name) || "Learner";
}

export function shortDate(value?: string | null) {
  const raw = safe(value);
  if (!raw) return "recently";
  try {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return raw.slice(0, 10);
    return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
  } catch {
    return raw.slice(0, 10);
  }
}

export function classMomentum(score: number) {
  if (score >= 75) {
    return { label: "Steady rhythm", tone: "success" as const };
  }
  if (score >= 55) {
    return { label: "Building visibility", tone: "info" as const };
  }
  return { label: "Needs attention", tone: "warning" as const };
}

export function classConfidence(analytics: ClassAnalytics | null) {
  if (!analytics || !analytics.studentAnalytics.length) {
    return { label: "Still forming", tone: "neutral" as const };
  }

  const avgConfidence = Math.round(
    analytics.studentAnalytics.reduce((sum, row) => sum + row.profileConfidence, 0) /
      analytics.studentAnalytics.length
  );

  if (avgConfidence >= 75) {
    return { label: "Confident view", tone: "success" as const };
  }
  if (avgConfidence >= 55) {
    return { label: "Taking shape", tone: "info" as const };
  }
  return { label: "Partial view", tone: "warning" as const };
}

export function issueForStudent(row: StudentAttentionItem) {
  if (row.overdue_reviews > 0) {
    return row.overdue_reviews === 1
      ? "One support review is overdue."
      : `${row.overdue_reviews} support reviews are overdue.`;
  }
  if ((row.last_evidence_days ?? 999) > 21) {
    return "Recent evidence has gone quiet.";
  }
  if (row.open_interventions > 0) {
    return row.open_interventions === 1
      ? "There is one active support plan to check."
      : `${row.open_interventions} active support plans need a quick look.`;
  }
  if (row.status_label === "Attention") {
    return "Classroom visibility is still thin.";
  }
  if (row.is_ilp) {
    return "Keep ILP visibility current.";
  }
  return "A quick teacher check-in would help.";
}

export function actionForStudent(row: StudentAttentionItem) {
  const text = safe(row.next_action);
  if (!text) return "Open learner";
  if (text.toLowerCase() === "add fresh evidence") return "Add fresh evidence";
  if (text.toLowerCase() === "review support plan") return "Review support plan";
  return text;
}

export function buildTeacherFocusNext(analytics: ClassAnalytics | null): TeacherFocusNext | null {
  if (!analytics) return null;

  const topStudent = analytics.attentionList[0];
  if (!analytics.students.length) {
    return {
      label: "Connect your first class",
      reason: "This dashboard becomes useful once students are visible here.",
      chip: "Open students",
      href: "/students",
    };
  }

  if (!analytics.evidence.length) {
    return {
      label: "Capture fresh class evidence",
      reason: "There is no recent class evidence yet, so visibility is still too thin.",
      chip: "Go to capture",
      href: "/capture",
    };
  }

  if (analytics.overdueReviewCount > 0 && topStudent) {
    return {
      label: `Review ${studentName(topStudent)}`,
      reason: issueForStudent(topStudent),
      chip: "Open learner",
      href: `/students/${topStudent.student_id}`,
    };
  }

  if (topStudent && topStudent.status_label !== "Stable") {
    return {
      label: `Check ${studentName(topStudent)}`,
      reason: issueForStudent(topStudent),
      chip: "Open learner",
      href: `/students/${topStudent.student_id}`,
    };
  }

  if (analytics.openInterventionCount > 0) {
    return {
      label: "Review support queue",
      reason: "There is active support work in the class that is worth checking before it drifts.",
      chip: "Check queue",
      href: "/teacher",
    };
  }

  return {
    label: "Keep class visibility steady",
    reason: "The class is in a calmer place right now, so one fresh capture is enough to keep momentum.",
    chip: "Capture next",
    href: "/capture",
  };
}

export function buildTeacherSnapshot(analytics: ClassAnalytics | null) {
  if (!analytics) {
    return "Choose a class to start the teacher view.";
  }

  if (!analytics.students.length) {
    return `${className(analytics.klass)} does not have any visible students yet.`;
  }

  if (!analytics.evidence.length) {
    return `${className(analytics.klass)} has ${analytics.students.length} students, but no class evidence has been captured yet. Start with one or two priority learners.`;
  }

  const attentionCount = analytics.attentionList.filter((row) => row.status_label === "Attention").length;
  const watchCount = analytics.attentionList.filter((row) => row.status_label === "Watch").length;
  const freshCoverage = analytics.evidenceCoverage.filter((row) => row.days <= 14).length;

  return `${className(analytics.klass)} has ${analytics.students.length} students, ${attentionCount} needing close attention, ${watchCount} worth watching, and ${freshCoverage} coverage areas with reasonably fresh evidence.`;
}

export function buildTeacherGentleNudge(analytics: ClassAnalytics | null) {
  if (!analytics) return "";
  if (!analytics.students.length) return "";
  if (!analytics.evidence.length) {
    return "One fresh evidence example from a priority learner is enough to make the week feel more visible.";
  }
  const topStudent = analytics.attentionList[0];
  if (topStudent && (topStudent.last_evidence_days ?? 0) > 21) {
    return `${studentName(topStudent)} has been quiet for a while. A quick check-in could settle the class picture.`;
  }
  if (analytics.overdueReviewCount > 0) {
    return "A short support-plan review now will usually make the rest of the week feel easier to manage.";
  }
  return "";
}

export function buildTeacherSupportQueue(
  analytics: ClassAnalytics | null
): TeacherSupportQueueItem[] {
  if (!analytics) return [];

  const studentMap = new Map<string, StudentAnalytics>();
  analytics.studentAnalytics.forEach((row) => {
    if (row.student?.id) studentMap.set(row.student.id, row);
  });

  return analytics.attentionList
    .filter((row) => row.open_interventions > 0 || row.overdue_reviews > 0)
    .slice(0, 4)
    .map((row) => {
      const detail = studentMap.get(row.student_id);
      const reviewDate =
        detail?.overdueReviews[0]?.review_due_on ||
        detail?.overdueReviews[0]?.review_due_date ||
        detail?.openInterventions[0]?.next_review_on ||
        detail?.openInterventions[0]?.due_on ||
        null;

      return {
        id: row.student_id,
        name: studentName(row),
        text:
          row.overdue_reviews > 0
            ? `${row.overdue_reviews} review${row.overdue_reviews === 1 ? "" : "s"} overdue`
            : `${row.open_interventions} active support plan${row.open_interventions === 1 ? "" : "s"}`,
        due: reviewDate ? `Check by ${shortDate(reviewDate)}` : "Worth checking soon",
      };
    });
}
