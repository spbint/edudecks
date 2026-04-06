import AdminLeftNav from "@/app/components/AdminLeftNav";
import AdminShell from "../components/AdminShell";
import { loadAssessmentEngine } from "@/lib/assessmentEngine";
import { AdminStudentInfo, fetchAdminStudents } from "@/lib/admin/studentRoster";

type SearchParams = {
  student?: string;
  frameworkId?: string;
};

type StrandSummaryRow = {
  strandName: string;
  secure: number;
  developing: number;
  emerging: number;
  insufficient: number;
  total: number;
  averageScore: number;
};

function formatDays(days: number | null) {
  if (days == null) return "unknown";
  if (days === 0) return "today";
  return `${days} day${days === 1 ? "" : "s"}`;
}

export default async function AssessmentVerificationPage({
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
          <AdminShell title="Assessment verification" subtitle="No students yet" backHref="/admin">
            <div className="dash-alert">There are no students in the roster yet.</div>
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
  const studentClass = assessment.classes.find((cls) => cls.id === selectedStudent?.classId);
  const selectedFramework =
    (searchParams?.frameworkId &&
      assessment.frameworks.find((framework) => framework.id === searchParams.frameworkId)) ??
    assessment.frameworks[0];

  const headline = assessment.headline;

  const strandMap = new Map<string, StrandSummaryRow & { scoreTotal: number }>();

  for (const standard of assessment.standards) {
    const name = standard.strandName || "Unassigned strand";
    if (!strandMap.has(name)) {
      strandMap.set(name, {
        strandName: name,
        secure: 0,
        developing: 0,
        emerging: 0,
        insufficient: 0,
        total: 0,
        averageScore: 0,
        scoreTotal: 0,
      });
    }
    const row = strandMap.get(name)!;
    row.total += 1;
    row.scoreTotal += standard.judgementScore;

    if (standard.judgement === "Secure") row.secure += 1;
    else if (standard.judgement === "Developing") row.developing += 1;
    else if (standard.judgement === "Emerging") row.emerging += 1;
    else row.insufficient += 1;
  }

  const strandSummaries = Array.from(strandMap.values())
    .map((withTotal) => ({
      strandName: withTotal.strandName,
      secure: withTotal.secure,
      developing: withTotal.developing,
      emerging: withTotal.emerging,
      insufficient: withTotal.insufficient,
      total: withTotal.total,
      averageScore: withTotal.total
        ? Math.round(withTotal.scoreTotal / withTotal.total)
        : 0,
    }))
    .sort(
      (a, b) =>
        b.averageScore - a.averageScore || b.total - a.total || a.strandName.localeCompare(b.strandName)
    );

  const freshnessValues = assessment.standards
    .map((row) => row.freshnessDays)
    .filter((value): value is number => typeof value === "number");
  const freshestDays =
    freshnessValues.length > 0 ? Math.min(...freshnessValues) : null;

  const needsEvidenceStandard = assessment.standards.find(
    (row) => row.evidenceCount === 0 && row.assessmentCount === 0
  );

  const explanationLines = [
    `Based on ${headline.evidenceLinkedCount} standards with evidence links and ${headline.assessmentLinkedCount} with assessments, the calculation averages ${Math.round(
      headline.averageScore
    )} points across ${assessment.standards.length} standards.`,
    freshestDays != null
      ? `The freshest linked signal is ${formatDays(freshestDays)} old, showing recency is part of the judgement.`
      : "Signal dates are pending, so freshness cannot be summarised yet.",
    `Subject rollups below prove the engine is aggregating across ${assessment.subjectSummaries.length} learning areas. No ranking language is used; each judgement stands on its own signals.`,
  ];

  const sampleStandards = assessment.standards.slice(0, 5);

  return (
    <div className="flex min-h-screen">
      <AdminLeftNav />
      <div className="flex-1">
        <AdminShell
          title="Assessment verification"
          subtitle="Inspect the engine’s judgements, recency, strands, and standards"
          backHref="/admin"
        >
          <section className="dash-card">
            <form method="get" className="flex flex-wrap items-center gap-3">
              <label className="flex flex-col text-xs font-black text-slate-500">
                Select student
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
                Refresh
              </button>
            </form>
            {fallbackUsed ? (
              <div className="mt-3 dash-alert">
                Student ID <span className="font-black">{requestedStudentId}</span> not found; showing{" "}
                <span className="font-black">{selectedStudent?.displayName}</span> instead.
              </div>
            ) : null}
          </section>

          <section className="dash-card">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <div className="text-xs font-black text-slate-500">Student summary</div>
                <div className="mt-2 text-2xl font-black text-slate-900">
                  {selectedStudent?.displayName}
                </div>
                <div className="text-sm font-extrabold text-slate-500">
                  {studentClass?.name ? `${studentClass.name}` : "Unassigned class"}
                  {studentClass?.year_level != null ? ` · Year ${studentClass.year_level}` : ""}
                  {selectedFramework ? ` · Frame: ${selectedFramework.name}` : ""}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <div className="text-[11px] font-black text-slate-400">Secure</div>
                <div className="text-2xl font-black text-slate-900">{headline.secureCount}</div>
              </div>
              <div>
                <div className="text-[11px] font-black text-slate-400">Developing</div>
                <div className="text-2xl font-black text-slate-900">{headline.developingCount}</div>
              </div>
              <div>
                <div className="text-[11px] font-black text-slate-400">Emerging</div>
                <div className="text-2xl font-black text-slate-900">{headline.emergingCount}</div>
              </div>
              <div>
                <div className="text-[11px] font-black text-slate-400">Needs Evidence</div>
                <div className="text-2xl font-black text-slate-900">{headline.insufficientCount}</div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-[11px] font-extrabold text-slate-500">
              <span>{headline.evidenceLinkedCount} standards with evidence</span>
              <span>{headline.assessmentLinkedCount} standards with assessments</span>
              <span>Average score {Math.round(headline.averageScore)}</span>
            </div>
          </section>

          <section className="dash-card">
            <div className="text-xs font-black text-slate-500">Explainability checks</div>
            <ul className="mt-2 space-y-2 text-sm font-extrabold text-slate-700">
              {explanationLines.map((line) => (
                <li key={line} className="list-disc pl-5">
                  {line}
                </li>
              ))}
            </ul>
          </section>

          <section className="dash-card grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div>
              <div className="text-sm font-black text-slate-900">Subject rollups</div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full border-separate border-spacing-0 text-left text-[13px]">
                  <thead>
                    <tr className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                      <th className="pb-2 pr-3">Subject</th>
                      <th className="pb-2 pr-3">Secure</th>
                      <th className="pb-2 pr-3">Developing</th>
                      <th className="pb-2 pr-3">Emerging</th>
                      <th className="pb-2 pr-3">Needs Evidence</th>
                      <th className="pb-2 pr-3">Avg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessment.subjectSummaries.map((subject) => (
                      <tr
                        key={subject.subjectName}
                        className="border-t border-slate-100 text-slate-700"
                      >
                        <td className="py-2 pr-3">{subject.subjectName}</td>
                        <td className="py-2 pr-3">{subject.secureCount}</td>
                        <td className="py-2 pr-3">{subject.developingCount}</td>
                        <td className="py-2 pr-3">{subject.emergingCount}</td>
                        <td className="py-2 pr-3">{subject.insufficientCount}</td>
                        <td className="py-2 pr-3">{Math.round(subject.averageScore)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <div className="text-sm font-black text-slate-900">Strand rollups</div>
              <div className="mt-3 space-y-3">
                {strandSummaries.slice(0, 6).map((row) => (
                  <div
                    key={row.strandName}
                    className="rounded-xl border border-slate-200 bg-white/70 p-3 text-sm font-extrabold text-slate-700"
                  >
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                      {row.strandName}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 text-[11px] font-black text-slate-600">
                      <span>Secure {row.secure}</span>
                      <span>Developing {row.developing}</span>
                      <span>Emerging {row.emerging}</span>
                      <span>Needs Evidence {row.insufficient}</span>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-500">
                      Avg score {row.averageScore} · {row.total} standards
                    </div>
                  </div>
                ))}
                {strandSummaries.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-black text-slate-500">
                    No strand rollups yet (standards are still loading).
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="dash-card grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div>
              <div className="text-sm font-black text-slate-900">
                {needsEvidenceStandard ? "Standard needing evidence" : "Sample standards"}
              </div>
              <div className="mt-3 space-y-4">
                {(needsEvidenceStandard ? [needsEvidenceStandard] : sampleStandards).map((standard) => (
                  <div key={standard.standardId} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-[13px] font-black text-slate-900">{standard.officialCode}</div>
                    <div className="text-sm font-extrabold text-slate-600">{standard.title}</div>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-black text-slate-500">
                      <span>{standard.subjectName}</span>
                      <span>{standard.strandName}</span>
                      <span>{standard.levelLabel}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-[11px] font-bold text-slate-700">
                      <span>Judgement: {standard.evidenceCount + standard.assessmentCount === 0 ? "Needs Evidence" : standard.judgement}</span>
                      <span>Confidence: {standard.confidence}</span>
                      <span>Freshness: {formatDays(standard.freshnessDays)}</span>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-600">
                      {standard.rationale}
                    </div>
                    <div className="mt-2 text-[11px] font-black text-slate-800">
                      Next step: {standard.nextStep}
                    </div>
                    <div className="mt-2 text-[11px] text-slate-500">
                      Evidence: {standard.evidenceCount} · Assessments: {standard.assessmentCount} · Latest evidence {standard.latestEvidenceDate ?? "—"} · Latest assessment {standard.latestAssessmentDate ?? "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 text-sm font-black text-slate-800">
                Evidence dedication
                <div className="mt-2 text-xs font-extrabold text-slate-500">
                  {headline.evidenceLinkedCount} standards rely on evidence, {headline.assessmentLinkedCount} on assessments only, and {headline.insufficientCount} need evidence to move off Insufficient.
                </div>
              </div>
              {selectedFramework ? (
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 text-sm font-black text-slate-800">
                  Framework context
                  <div className="mt-2 text-xs font-extrabold text-slate-500">
                    {selectedFramework.name} ({selectedFramework.code}) · {selectedFramework.id}
                  </div>
                </div>
              ) : null}
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 text-sm font-black text-slate-800">
                Recency
                <div className="mt-2 text-xs font-extrabold text-slate-500">
                  {freshestDays != null
                    ? `${freshestDays} day${freshestDays === 1 ? "" : "s"} since the freshest linked signal.`
                    : "No dates captured yet."}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 text-sm font-black text-slate-800">
                Needs evidence status
                <div className="mt-2 text-xs font-extrabold text-slate-500">
                  {needsEvidenceStandard
                    ? `${needsEvidenceStandard.title} (${needsEvidenceStandard.officialCode}) is currently labelled Needs Evidence; it has no linked evidence or assessment yet.`
                    : "No standards are currently on Needs Evidence."}
                </div>
              </div>
            </div>
          </section>
        </AdminShell>
      </div>
    </div>
  );
}
