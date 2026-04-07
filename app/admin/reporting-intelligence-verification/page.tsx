import AdminLeftNav from "@/app/components/AdminLeftNav";
import AdminShell from "../components/AdminShell";
import { loadAssessmentEngine } from "@/lib/assessmentEngine";
import { fetchAdminStudents } from "@/lib/admin/studentRoster";
import { generateReportingIntelligence, ReportingMode } from "@/lib/reporting/intelligence";

function isMissingCurriculumStandardsError(err: unknown) {
  const code = (err as any)?.code;
  const message = String((err as any)?.message ?? err ?? "").toLowerCase();
  return (
    (typeof code === "string" && code === "PGRST205") ||
    message.includes("curriculum_standards")
  );
}

function MissingStandardsFallback({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex min-h-screen">
      <AdminLeftNav />
      <div className="flex-1">
        <AdminShell title={title} subtitle={subtitle} backHref="/admin">
          <div className="dash-alert">
            Required curriculum metadata is missing. Create the <code>curriculum_standards</code>{" "}
            table or import the schema before using this page.
          </div>
        </AdminShell>
      </div>
    </div>
  );
}

type SearchParams = {
  student?: string;
  mode?: ReportingMode;
  frameworkId?: string;
};

const MODES: { label: string; value: ReportingMode }[] = [
  { label: "Parent friendly", value: "parent_friendly" },
  { label: "Teacher professional", value: "teacher_professional" },
  { label: "Authority ready (concise)", value: "authority_ready_concise" },
];

export default async function ReportingIntelligenceVerificationPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const students = await fetchAdminStudents();
  if (students.length === 0) {
    return (
      <div className="flex min-h-screen">
        <AdminLeftNav />
        <div className="flex-1">
          <AdminShell
            title="Reporting intelligence verification"
            subtitle="No students available yet"
            backHref="/admin"
          >
            <div className="dash-alert">Add some students before verifying reporting text.</div>
          </AdminShell>
        </div>
      </div>
    );
  }

  const requestedStudentId = searchParams?.student;
  const validStudentId =
    requestedStudentId && students.some((student) => student.id === requestedStudentId)
      ? requestedStudentId
      : students[0].id;
  const fallbackUsed = Boolean(requestedStudentId && requestedStudentId !== validStudentId);

  const requestedMode = searchParams?.mode;
  const selectedMode = requestedMode && MODES.some((option) => option.value === requestedMode)
    ? requestedMode
    : "parent_friendly";

  let assessment;
  try {
    assessment = await loadAssessmentEngine({
      studentId: validStudentId,
      frameworkId: searchParams?.frameworkId,
    });
  } catch (err) {
    if (isMissingCurriculumStandardsError(err)) {
      return (
        <MissingStandardsFallback
          title="Reporting intelligence verification"
          subtitle="Curriculum standards schema missing"
        />
      );
    }
    throw err;
  }

  const selectedStudent = students.find((student) => student.id === validStudentId);
  const narrative = generateReportingIntelligence(
    assessment,
    selectedStudent?.displayName ?? "Student",
    selectedMode
  );

  return (
    <div className="flex min-h-screen">
      <AdminLeftNav />
      <div className="flex-1">
        <AdminShell
          title="Reporting intelligence verification"
          subtitle="Preview parent / teacher / authority summaries"
          backHref="/admin"
        >
          <section className="dash-card">
            <form method="get" className="flex flex-wrap items-center gap-3">
              <label className="flex flex-col text-xs font-black text-slate-500">
                Student
                <select
                  name="student"
                  defaultValue={validStudentId}
                  className="dash-input mt-1 text-sm font-black"
                >
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.displayName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col text-xs font-black text-slate-500">
                Mode
                <select
                  name="mode"
                  defaultValue={selectedMode}
                  className="dash-input mt-1 text-sm font-black"
                >
                  {MODES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              {searchParams?.frameworkId ? (
                <input type="hidden" name="frameworkId" value={searchParams.frameworkId} />
              ) : null}

              <button type="submit" className="dash-btn-primary">
                Refresh language
              </button>
            </form>
            {fallbackUsed ? (
              <div className="mt-3 dash-alert">
                Student ID <span className="font-black">{requestedStudentId}</span> not found;
                showing <span className="font-black">{selectedStudent?.displayName}</span>.
              </div>
            ) : null}
          </section>

          <section className="dash-card grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div>
              <div className="text-sm font-black text-slate-900">Overall summary</div>
              <p className="mt-2 text-sm font-extrabold text-slate-700">{narrative.overallSummary}</p>
            </div>
            <div>
              <div className="text-sm font-black text-slate-900">Evidence readiness</div>
              <p className="mt-2 text-sm font-extrabold text-slate-700">
                {narrative.evidenceReadinessNote}
              </p>
            </div>
          </section>

          <section className="dash-card grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div>
              <div className="text-sm font-black text-slate-900">Strengths</div>
              <ul className="mt-2 space-y-2 text-sm font-extrabold text-slate-700">
                {narrative.strengths.map((line) => (
                  <li key={line} className="list-disc pl-5">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-sm font-black text-slate-900">Areas for growth</div>
              <ul className="mt-2 space-y-2 text-sm font-extrabold text-slate-700">
                {narrative.areasForGrowth.map((line) => (
                  <li key={line} className="list-disc pl-5">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="dash-card">
            <div className="text-sm font-black text-slate-900">Next steps</div>
            <ul className="mt-2 space-y-2 text-sm font-extrabold text-slate-700">
              {narrative.nextSteps.map((line) => (
                <li key={line} className="list-disc pl-5">
                  {line}
                </li>
              ))}
            </ul>
          </section>

          <section className="dash-card space-y-4">
            <div className="text-sm font-black text-slate-900">Subject insights</div>
            {narrative.subjectInsights.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-black text-slate-500">
                No subject summaries are available yet.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {narrative.subjectInsights.map((insight) => (
                  <div
                    key={`${insight.subjectName}-${insight.summary}`}
                    className="rounded-2xl border border-slate-200 bg-white/70 p-3 text-sm font-extrabold text-slate-700"
                  >
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                      {insight.subjectName}
                    </div>
                    <p className="mt-2 text-slate-800">{insight.summary}</p>
                    <p className="mt-2 text-[11px] text-slate-600">Strengths: {insight.strengths}</p>
                    <p className="text-[11px] text-slate-600">Growth: {insight.growth}</p>
                    <p className="text-[11px] text-slate-600">Next steps: {insight.nextSteps}</p>
                    <p className="text-[11px] text-slate-600">Readiness note: {insight.evidenceReadiness}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </AdminShell>
      </div>
    </div>
  );
}
