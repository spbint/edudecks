"use server";

import Link from "next/link";
import {
  buildFriendlyLabel,
  getAnchorStandardsForStandard,
  getCurriculumFrameworkByCode,
  listCurriculumLevels,
  listCurriculumStandards,
  listCurriculumStrands,
  listCurriculumSubjects,
  getStandardsForNormalizedGrade,
} from "@/lib/curriculum";

export default async function CurriculumVerificationPage() {
  const framework = await getCurriculumFrameworkByCode("common-core");
  const subjects = framework ? await listCurriculumSubjects(framework.id) : [];
  const levels = framework ? await listCurriculumLevels(framework.id) : [];
  const strands = framework ? await listCurriculumStrands(framework.id) : [];
  const anchors = framework
    ? await listCurriculumStandards({
        frameworkCode: "common-core",
        isAnchor: true,
      })
    : [];
  const grade9Standards = await getStandardsForNormalizedGrade("common-core", "Grade 9");
  const grade10Standards = await getStandardsForNormalizedGrade("common-core", "Grade 10");
  const anchorMap = grade9Standards[0]
    ? await getAnchorStandardsForStandard(grade9Standards[0].id)
    : [];

  return (
    <main style={{ padding: 32, fontFamily: "Inter, system-ui, sans-serif", color: "#0f172a" }}>
      <section style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 900 }}>Common Core ELA verification</div>
        <p style={{ color: "#475569", marginTop: 8 }}>
          This page exercises the curriculum query layer to confirm the seeded Common Core
          structure, the 9–10 band mapping, anchor relationships, and the literacy-in-other-subjects
          standards.
        </p>
        <div style={{ marginTop: 12 }}>
          <Link href="/admin" style={{ color: "#2563eb", fontWeight: 700 }}>
            ← Return to admin
          </Link>
        </div>
      </section>

      <section
        style={{
          borderRadius: 20,
          background: "#fff",
          border: "1px solid #e5e7eb",
          padding: 20,
          marginBottom: 20,
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 18 }}>Framework</div>
        <div style={{ marginTop: 8 }}>
          {framework ? (
            <>
              <div>{framework.name}</div>
              <div style={{ color: "#475569" }}>
                {buildFriendlyLabel({
                  frameworkName: framework.name,
                  levelLabel: "Grades 9–10 (official band)",
                })}
              </div>
            </>
          ) : (
            <em>Framework missing</em>
          )}
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18 }}>
        <InfoCard title="Subjects" items={subjects.map((subject) => subject.name)} />
        <InfoCard title="Levels (normalized)" items={levels.map((level) => level.normalized_level_label)} />
        <InfoCard
          title="Strands"
          items={strands.slice(0, 6).map((strand) => `${strand.code} — ${strand.name}`)}
          note={`${strands.length} total strands`}
        />
      </section>

      <section style={{ marginTop: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 900 }}>Sample queries</div>
        <div style={{ display: "grid", gap: 16, marginTop: 12 }}>
          <QueryCard title="Grade 9 → official 9–10 band" items={grade9Standards} labelField="official_code" />
          <QueryCard title="Grade 10 → official 9–10 band" items={grade10Standards} labelField="official_code" />
          <QueryCard title="Anchor relationships (first Grade 9 standard)" items={anchorMap} labelField="official_code" />
          <QueryCard
            title="Literacy in History/Social Studies"
            items={await listCurriculumStandards({
              frameworkCode: "common-core",
              subjectCode: "ela-history",
            })}
            labelField="official_code"
          />
          <QueryCard
            title="Literacy in Science/Technical Subjects"
            items={await listCurriculumStandards({
              frameworkCode: "common-core",
              subjectCode: "ela-science",
            })}
            labelField="official_code"
          />
        </div>
      </section>
    </main>
  );
}

function InfoCard({ title, items, note }: { title: string; items: string[]; note?: string }) {
  return (
    <section
      style={{
        borderRadius: 18,
        border: "1px solid #e5e7eb",
        padding: 16,
        background: "#ffffff",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>
      <ul style={{ paddingLeft: 18, margin: 0, color: "#475569" }}>
        {items.length ? (
          items.slice(0, 8).map((item) => <li key={item}>{item}</li>)
        ) : (
          <li>
            <em>None</em>
          </li>
        )}
      </ul>
      {note ? <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>{note}</div> : null}
    </section>
  );
}

function QueryCard({
  title,
  items,
  labelField,
}: {
  title: string;
  items: CurriculumStandard[];
  labelField: "official_code" | "title";
}) {
  return (
    <section
      style={{
        borderRadius: 18,
        border: "1px solid #e5e7eb",
        padding: 16,
        background: "#fff",
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 8 }}>{title}</div>
      {items.length ? (
        <ul style={{ margin: 0, paddingLeft: 18, color: "#0f172a" }}>
          {items.slice(0, 5).map((item) => (
            <li key={item.id}>
              <strong>{item[labelField]}</strong>
              <div style={{ fontSize: 12, color: "#475569" }}>{item.title}</div>
            </li>
          ))}
        </ul>
      ) : (
        <div style={{ color: "#475569" }}>
          <em>No results</em>
        </div>
      )}
    </section>
  );
}
