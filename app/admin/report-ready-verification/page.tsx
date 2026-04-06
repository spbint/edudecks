import AdminLeftNav from "@/app/components/AdminLeftNav";
import AdminShell from "../components/AdminShell";
import { fetchAdminStudents } from "@/lib/admin/studentRoster";
import { loadAssessmentEngine } from "@/lib/assessmentEngine";
import { buildReadinessReport, ReadinessStatus } from "@/lib/reporting/readiness";

type SearchParams = {
  student?: string;
  frameworkId?: string;
};

function statusTone(status: ReadinessStatus) {
  switch (status) {
    case "Ready":
      return "text-emerald-700 bg-emerald-50 border-emerald-100";
    case "Nearly Ready":
      return "text-sky-700 bg-sky-50 border-sky-100";
    case "Partial":
      return "text-amber-700 bg-amber-50 border-amber-100";
    default:
      return "text-rose-700 bg-rose-50 border-rose-100";
  }
}

export default async function ReportReadyVerificationPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const students = await fetchAdminStudents();
  if (!students.length) {
    return (
      <div className="flex min-h-screen">
        <AdminLeftNav />
        <div className="flex-1">
          <AdminShell
            title="Report ready verification"
            subtitle="No student roster yet"
            backHref="/admin"
          >
            <div className="dash-alert">Add students before reviewing report readiness.</div>
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

  const assessment = await loadAssessmentEngine({
    studentId: validStudentId,
    frameworkId: searchParams?.frameworkId,
  });

  const selectedStudent = students.find((student) => student.id === validStudentId);
  const readiness = buildReadinessReport(assessment);

  return (
    <div className="flex min-h-screen">
      <AdminLeftNav />
      <div className="flex-1">
        <AdminShell
          title="Report ready verification"
          subtitle="Clarity, reassurance, and capture guidance"
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
              {searchParams?.frameworkId ? (
                <input type="hidden" name="frameworkId" value={searchParams.frameworkId} />
              ) : null}
              <button type="submit" className="dash-btn-primary">
                Refresh readiness
              </button>
            </form>
            {fallbackUsed ? (
              <div className="mt-3 dash-alert">
                Student ID <span className="font-black">{requestedStudentId}</span> not found; showing{" "}
                <span className="font-black">{selectedStudent?.displayName}</span>.
              </div>
            ) : null}
          </section>

          <section className="dash-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-black text-slate-500">Overall readiness</div>
                <div className="text-3xl font-black text-slate-900">{readiness.overallStatus}</div>
                <div className="text-sm font-extrabold text-slate-600">
                  {readiness.reportReady ? "Report ready" : "Needs more attention"}
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 px-4 py-2 text-xs font-black uppercase tracking-wide text-slate-500">
                {selectedStudent?.displayName}
              </div>
            </div>
            <p className="mt-3 text-sm font-extrabold text-slate-600">{readiness.explanation}</p>
          </section>

          <section className="dash-card">
            <div className="text-sm font-black text-slate-900">Subject readiness</div>
            {readiness.subjectReadiness.length === 0 ? (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs font-black text-slate-500">
                No subject judgements available yet.
              </div>
            ) : (
              <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {readiness.subjectReadiness.map((subject) => (
                  <div
                    key={subject.subjectName}
                    className="rounded-2xl border border-slate-200 bg-white/90 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs uppercase tracking-wide text-slate-500">
                        {subject.subjectName}
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-black ${statusTone(subject.status)}`}>
                        {subject.status}
                      </span>
                    </div>
                    <div className="mt-3 text-[11px] font-black text-slate-600">
                      Evidence: {subject.evidenceCount} · Recent signals: {subject.recentEvidenceCount}
                    </div>
                    <div className="mt-2 text-[11px] text-slate-600">{subject.assessmentSummary}</div>
                    <p className="mt-2 text-[12px] text-slate-500">{subject.explanation}</p>
                    <div className="mt-3 text-[12px] font-black text-slate-800">Next capture</div>
                    <p className="text-[11px] text-slate-600">{subject.nextCapture}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="dash-card">
            <div className="text-sm font-black text-slate-900">Biggest evidence gaps</div>
            {readiness.evidenceGaps.length === 0 ? (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs font-black text-slate-500">
                No gaps detected; every standard has at least one signal.
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {readiness.evidenceGaps.map((gap) => (
                  <div
                    key={gap.standardId}
                    className="rounded-xl border border-slate-200 bg-white/80 p-3 text-sm font-extrabold text-slate-700"
                  >
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                      {gap.subjectName}
                    </div>
                    <div className="text-sm font-black text-slate-900">{gap.officialCode}</div>
                    <div className="text-[11px] text-slate-600">{gap.title}</div>
                    <div className="mt-2 text-[11px] text-slate-500">{gap.reason}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="dash-card">
            <div className="text-sm font-black text-slate-900">Next capture guidance</div>
            <ul className="mt-3 space-y-2 text-sm font-extrabold text-slate-700">
              {readiness.captureGuidance.map((tip) => (
                <li key={tip} className="list-disc pl-5">
                  {tip}
                </li>
              ))}
            </ul>
          </section>
        </AdminShell>
      </div>
    </div>
  );
}
