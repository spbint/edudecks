"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLeftNav from "@/app/components/AdminLeftNav";
import AdminPageActions from "@/app/components/AdminPageActions";
import { supabase } from "@/lib/supabaseClient";

/* ───────────────────────── TYPES ───────────────────────── */

type ClassRow = {
  id: string;
  name?: string | null;
  year_level?: number | null;
  teacher_name?: string | null;
  room?: string | null;
  [k: string]: any;
};

type StudentRow = {
  id: string;
  class_id?: string | null;
  first_name?: string | null;
  preferred_name?: string | null;
  surname?: string | null;
  family_name?: string | null;
  last_name?: string | null;
  is_ilp?: boolean | null;
  [k: string]: any;
};

type EvidenceEntryRow = {
  id: string;
  student_id?: string | null;
  class_id?: string | null;
  title?: string | null;
  learning_area?: string | null;
  summary?: string | null;
  body?: string | null;
  occurred_on?: string | null;
  created_at?: string | null;
  is_deleted?: boolean | null;
  [k: string]: any;
};

type InterventionRow = {
  id: string;
  student_id?: string | null;
  class_id?: string | null;
  title?: string | null;
  status?: string | null;
  priority?: string | null;
  tier?: string | number | null;
  review_due_on?: string | null;
  review_due_date?: string | null;
  next_review_on?: string | null;
  due_on?: string | null;
  created_at?: string | null;
  [k: string]: any;
};

type ClassHealthRow = {
  class_id: string;
  class_name?: string | null;
  health_score?: number | null;
  students_total?: number | null;
  students_attention?: number | null;
  evidence_fresh_pct?: number | null;
  active_interventions?: number | null;
  overdue_reviews?: number | null;
  [k: string]: any;
};

type ClassPortfolioRow = {
  classId: string;
  classLabel: string;
  teacherName: string;
  room: string;
  studentCount: number;
  ilpCount: number;

  evidenceFreshPct: number;
  evidence30d: number;
  avgEvidenceAge: number;

  activeInterventions: number;
  overdueReviews: number;
  dueSoonReviews: number;

  attentionCount: number;
  invisibleCount: number;
  reportingFragileCount: number;
  authorityFragileCount: number;

  avgRisk: number;
  deploymentScore: number;
  benchmarkPosition: "Above" | "Near" | "Below";
  authorityStatus: "Strong" | "Watch" | "Fragile";
  recommendation: string;
  forecast: "Stable" | "Watch" | "Escalating";
};

type QueueRow = {
  id: string;
  title: string;
  text: string;
  classId: string;
  priority: number;
  tone: "good" | "watch" | "danger" | "info";
};

type AlertRow = {
  id: string;
  text: string;
  tone: "good" | "watch" | "danger" | "info";
};

/* ───────────────────────── HELPERS ───────────────────────── */

function safe(v: any) {
  return String(v ?? "").trim();
}

function fmtYear(y: number | null | undefined) {
  return y == null ? "" : `Year ${y}`;
}

function toDate(v: string | null | undefined) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function daysSince(v: string | null | undefined) {
  const d = toDate(v);
  if (!d) return null;
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - d.getTime()) / 86400000));
}

function daysUntil(v: string | null | undefined) {
  const d = toDate(v);
  if (!d) return null;
  const now = new Date();
  return Math.floor((d.getTime() - now.getTime()) / 86400000);
}

function pickReviewDate(i: InterventionRow) {
  return (
    safe(i.review_due_on) ||
    safe(i.review_due_date) ||
    safe(i.next_review_on) ||
    safe(i.due_on) ||
    safe(i.created_at)
  );
}

function isClosedStatus(status: string | null | undefined) {
  return ["closed", "done", "archived", "completed", "resolved"].includes(
    safe(status).toLowerCase()
  );
}

function isMissingColumnError(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("column") || msg.includes("does not exist");
}

function percent(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return Math.max(0, Math.min(100, Math.round((numerator / denominator) * 100)));
}

function guessArea(raw: string | null | undefined) {
  const x = safe(raw).toLowerCase();

  if (x.includes("math")) return "Maths";

  if (
    x.includes("liter") ||
    x.includes("reading") ||
    x.includes("writing") ||
    x.includes("english")
  ) {
    return "Literacy";
  }

  if (x.includes("science")) return "Science";

  if (
    x.includes("well") ||
    x.includes("pastoral") ||
    x.includes("social") ||
    x.includes("behaviour") ||
    x.includes("behavior")
  ) {
    return "Wellbeing";
  }

  if (
    x.includes("human") ||
    x.includes("history") ||
    x.includes("geography") ||
    x.includes("hass")
  ) {
    return "Humanities";
  }

  return "Other";
}

function benchmarkPosition(avgRisk: number): "Above" | "Near" | "Below" {
  if (avgRisk <= 25) return "Above";
  if (avgRisk <= 45) return "Near";
  return "Below";
}

function authorityTone(status: "Strong" | "Watch" | "Fragile") {
  if (status === "Strong") return { bg: "#ecfdf5", bd: "#a7f3d0", fg: "#166534" };
  if (status === "Watch") return { bg: "#fffbeb", bd: "#fde68a", fg: "#92400e" };
  return { bg: "#fff1f2", bd: "#fecaca", fg: "#9f1239" };
}

function forecastTone(status: "Stable" | "Watch" | "Escalating") {
  if (status === "Stable") return { bg: "#ecfdf5", bd: "#a7f3d0", fg: "#166534" };
  if (status === "Watch") return { bg: "#fffbeb", bd: "#fde68a", fg: "#92400e" };
  return { bg: "#fff1f2", bd: "#fecaca", fg: "#9f1239" };
}

function toneCard(
  tone: "good" | "watch" | "danger" | "info"
): React.CSSProperties {
  if (tone === "danger") return { borderColor: "#fecaca", background: "#fff1f2" };
  if (tone === "watch") return { borderColor: "#fde68a", background: "#fffbeb" };
  if (tone === "info") return { borderColor: "#bfdbfe", background: "#eff6ff" };
  return { borderColor: "#a7f3d0", background: "#ecfdf5" };
}

function ClassesPageFallback() {
  return (
    <div style={S.shell}>
      <AdminLeftNav />
      <main style={S.main}>
        <div style={S.ok}>Loading classes board…</div>
      </main>
    </div>
  );
}

/* ───────────────────────── PAGE ───────────────────────── */

function AdminClassesIndexPageInner() {
  const router = useRouter();

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [evidenceEntries, setEvidenceEntries] = useState<EvidenceEntryRow[]>([]);
  const [interventions, setInterventions] = useState<InterventionRow[]>([]);
  const [classHealthRows, setClassHealthRows] = useState<ClassHealthRow[]>([]);

  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<
    "deployment" | "risk" | "name" | "freshness" | "authority"
  >("deployment");
  const [filterMode, setFilterMode] = useState<
    "all" | "watch" | "fragile" | "stable"
  >("all");

  async function loadClasses() {
    const tries = [
      "id,name,year_level,teacher_name,room",
      "id,name,year_level,room",
      "id,name,year_level",
      "id,name",
    ];

    for (const sel of tries) {
      const r = await supabase
        .from("classes")
        .select(sel)
        .order("year_level", { ascending: true })
        .order("name", { ascending: true });

      if (!r.error) {
        setClasses(((r.data as any[]) ?? []) as ClassRow[]);
        return;
      }
      if (!isMissingColumnError(r.error)) throw r.error;
    }

    setClasses([]);
  }

  async function loadStudents() {
    const tries = [
      "id,class_id,first_name,preferred_name,surname,family_name,last_name,is_ilp",
      "id,class_id,first_name,preferred_name,surname,family_name,is_ilp",
      "id,class_id,first_name,preferred_name,surname,is_ilp",
      "id,class_id,first_name,preferred_name,is_ilp",
    ];

    for (const sel of tries) {
      const r = await supabase.from("students").select(sel).limit(30000);
      if (!r.error) {
        setStudents(((r.data as any[]) ?? []) as StudentRow[]);
        return;
      }
      if (!isMissingColumnError(r.error)) throw r.error;
    }

    setStudents([]);
  }

  async function loadEvidence() {
    const tries = [
      "id,student_id,class_id,title,learning_area,summary,body,occurred_on,created_at,is_deleted",
      "id,student_id,class_id,title,learning_area,occurred_on,created_at,is_deleted",
      "id,student_id,class_id,learning_area,occurred_on,created_at,is_deleted",
    ];

    for (const sel of tries) {
      const r = await supabase
        .from("evidence_entries")
        .select(sel)
        .eq("is_deleted", false)
        .limit(30000);

      if (!r.error) {
        setEvidenceEntries(((r.data as any[]) ?? []) as EvidenceEntryRow[]);
        return;
      }
      if (!isMissingColumnError(r.error)) throw r.error;
    }

    setEvidenceEntries([]);
  }

  async function loadInterventions() {
    const tries = [
      "id,student_id,class_id,title,status,priority,tier,review_due_on,review_due_date,next_review_on,due_on,created_at",
      "id,student_id,class_id,title,status,priority,review_due_on,review_due_date,next_review_on,due_on,created_at",
      "*",
    ];

    for (const sel of tries) {
      const r = await supabase.from("interventions").select(sel).limit(20000);
      if (!r.error) {
        setInterventions(((r.data as any[]) ?? []) as InterventionRow[]);
        return;
      }
      if (!isMissingColumnError(r.error)) throw r.error;
    }

    setInterventions([]);
  }

  async function loadClassHealth() {
    const r = await supabase.from("v_class_health_v1").select("*");
    if (r.error) {
      if (isMissingColumnError(r.error)) {
        setClassHealthRows([]);
        return;
      }
      throw r.error;
    }
    setClassHealthRows(((r.data as any[]) ?? []) as ClassHealthRow[]);
  }

  async function loadAll() {
    setBusy(true);
    setErr(null);
    try {
      await Promise.all([
        loadClasses(),
        loadStudents(),
        loadEvidence(),
        loadInterventions(),
        loadClassHealth(),
      ]);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const portfolioRows = useMemo<ClassPortfolioRow[]>(() => {
    return classes.map((klass) => {
      const classStudents = students.filter(
        (s) => safe(s.class_id) === safe(klass.id)
      );
      const classEvidence = evidenceEntries.filter(
        (e) => safe(e.class_id) === safe(klass.id)
      );
      const classInterventions = interventions.filter(
        (i) => safe(i.class_id) === safe(klass.id)
      );
      const health = classHealthRows.find(
        (h) => safe(h.class_id) === safe(klass.id)
      );

      const studentCount = classStudents.length;
      const ilpCount = classStudents.filter((s) => !!s.is_ilp).length;

      const evidence30d = classEvidence.filter((e) => {
        const d = daysSince(safe(e.occurred_on) || safe(e.created_at));
        return d != null && d <= 30;
      }).length;

      const avgEvidenceAge = classEvidence.length
        ? Math.round(
            classEvidence.reduce(
              (sum, e) =>
                sum +
                (daysSince(safe(e.occurred_on) || safe(e.created_at)) ?? 0),
              0
            ) / classEvidence.length
          )
        : 999;

      const activeInterventions = classInterventions.filter(
        (i) => !isClosedStatus(i.status)
      ).length;
      const overdueReviews = classInterventions.filter((i) => {
        if (isClosedStatus(i.status)) return false;
        const d = daysSince(pickReviewDate(i));
        return d != null && d > 0;
      }).length;
      const dueSoonReviews = classInterventions.filter((i) => {
        if (isClosedStatus(i.status)) return false;
        const d = daysUntil(pickReviewDate(i));
        return d != null && d >= 0 && d <= 14;
      }).length;

      const studentFreshSet = new Set(
        classEvidence
          .filter((e) => {
            const d = daysSince(safe(e.occurred_on) || safe(e.created_at));
            return d != null && d <= 30;
          })
          .map((e) => safe(e.student_id))
      );

      const evidenceFreshPct =
        Math.round(
          Number(
            health?.evidence_fresh_pct ??
              percent(studentFreshSet.size, Math.max(1, studentCount))
          )
        ) || 0;

      let attentionCount = 0;
      let invisibleCount = 0;
      let reportingFragileCount = 0;
      let authorityFragileCount = 0;
      let riskAccumulator = 0;

      for (const s of classStudents) {
        const se = classEvidence.filter(
          (e) => safe(e.student_id) === safe(s.id)
        );
        const si = classInterventions.filter(
          (i) =>
            safe(i.student_id) === safe(s.id) && !isClosedStatus(i.status)
        );

        const lastEvidenceDays = se.length
          ? daysSince(safe(se[0]?.occurred_on) || safe(se[0]?.created_at))
          : null;

        const evidence30 = se.filter((e) => {
          const d = daysSince(safe(e.occurred_on) || safe(e.created_at));
          return d != null && d <= 30;
        }).length;

        const evidencePrev30 = se.filter((e) => {
          const d = daysSince(safe(e.occurred_on) || safe(e.created_at));
          return d != null && d > 30 && d <= 60;
        }).length;

        const momentum = evidence30 - evidencePrev30;

        const overdue = si.filter((i) => {
          const d = daysSince(pickReviewDate(i));
          return d != null && d > 0;
        }).length;

        const areas = [
          "Literacy",
          "Maths",
          "Science",
          "Wellbeing",
          "Humanities",
          "Other",
        ];
        const missingAreaCount = areas.filter(
          (area) =>
            se.filter((e) => guessArea(e.learning_area) === area).length === 0
        ).length;
        const narrativeCount = se.filter(
          (e) => safe(e.summary) || safe(e.body)
        ).length;

        const invisibleRisk =
          se.length === 0 || lastEvidenceDays == null || lastEvidenceDays > 45;
        const reportingFragile =
          evidence30 === 0 ||
          lastEvidenceDays == null ||
          lastEvidenceDays > 30 ||
          missingAreaCount >= 2;
        const authorityFragile =
          reportingFragile || narrativeCount < 2 || overdue > 0 || invisibleRisk;

        if (overdue > 0 || reportingFragile) attentionCount += 1;
        if (invisibleRisk) invisibleCount += 1;
        if (reportingFragile) reportingFragileCount += 1;
        if (authorityFragile) authorityFragileCount += 1;

        let risk = 0;
        if (invisibleRisk) risk += 24;
        if (reportingFragile) risk += 22;
        if (authorityFragile) risk += 14;
        risk += overdue * 12;
        risk += si.length * 5;
        if (momentum < 0) risk += 10;
        if (s.is_ilp) risk += 8;
        riskAccumulator += Math.min(100, risk);
      }

      const avgRisk = studentCount
        ? Math.round(riskAccumulator / studentCount)
        : 0;

      const deploymentScore =
        attentionCount * 10 +
        invisibleCount * 8 +
        reportingFragileCount * 6 +
        overdueReviews * 5 +
        authorityFragileCount * 7;

      const benchmark = benchmarkPosition(avgRisk);

      const authorityStatus: "Strong" | "Watch" | "Fragile" =
        authorityFragileCount >= Math.max(3, Math.ceil(studentCount * 0.4))
          ? "Fragile"
          : authorityFragileCount >= Math.max(2, Math.ceil(studentCount * 0.2))
          ? "Watch"
          : "Strong";

      const forecast: "Stable" | "Watch" | "Escalating" =
        deploymentScore >= 75
          ? "Escalating"
          : deploymentScore >= 45 || overdueReviews >= 3 || dueSoonReviews >= 4
          ? "Watch"
          : "Stable";

      let recommendation = "Stable class — maintain current rhythm.";
      if (deploymentScore >= 75) {
        recommendation = "Deploy support time here first.";
      } else if (reportingFragileCount >= 4) {
        recommendation = "Run evidence push and reporting prep.";
      } else if (overdueReviews >= 3) {
        recommendation =
          "Clear overdue reviews before pressure compounds.";
      } else if (invisibleCount >= 3) {
        recommendation = "Restore visibility with fresh evidence capture.";
      }

      return {
        classId: klass.id,
        classLabel:
          [safe(klass.name), fmtYear(klass.year_level), safe(klass.room)]
            .filter(Boolean)
            .join(" • ") || "Class",
        teacherName: safe(klass.teacher_name) || "—",
        room: safe(klass.room),
        studentCount,
        ilpCount,

        evidenceFreshPct,
        evidence30d,
        avgEvidenceAge,

        activeInterventions,
        overdueReviews,
        dueSoonReviews,

        attentionCount,
        invisibleCount,
        reportingFragileCount,
        authorityFragileCount,

        avgRisk,
        deploymentScore,
        benchmarkPosition: benchmark,
        authorityStatus,
        recommendation,
        forecast,
      };
    });
  }, [classes, students, evidenceEntries, interventions, classHealthRows]);

  const filteredRows = useMemo(() => {
    let rows = [...portfolioRows];

    const q = safe(search).toLowerCase();
    if (q) {
      rows = rows.filter((r) =>
        [r.classLabel, r.teacherName, r.room]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    if (filterMode === "watch") {
      rows = rows.filter(
        (r) => r.forecast === "Watch" || r.forecast === "Escalating"
      );
    }
    if (filterMode === "fragile") {
      rows = rows.filter(
        (r) => r.authorityStatus === "Fragile" || r.reportingFragileCount >= 3
      );
    }
    if (filterMode === "stable") {
      rows = rows.filter(
        (r) => r.forecast === "Stable" && r.authorityStatus === "Strong"
      );
    }

    if (sortMode === "name") {
      rows.sort((a, b) => a.classLabel.localeCompare(b.classLabel));
    } else if (sortMode === "risk") {
      rows.sort((a, b) => b.avgRisk - a.avgRisk);
    } else if (sortMode === "freshness") {
      rows.sort((a, b) => a.evidenceFreshPct - b.evidenceFreshPct);
    } else if (sortMode === "authority") {
      const rank = { Fragile: 3, Watch: 2, Strong: 1 };
      rows.sort(
        (a, b) =>
          rank[b.authorityStatus] -
            rank[a.authorityStatus] || b.deploymentScore - a.deploymentScore
      );
    } else {
      rows.sort((a, b) => b.deploymentScore - a.deploymentScore);
    }

    return rows;
  }, [portfolioRows, search, sortMode, filterMode]);

  const queueRows = useMemo<QueueRow[]>(() => {
    const rows: QueueRow[] = [];

    filteredRows.forEach((r) => {
      if (r.deploymentScore >= 75) {
        rows.push({
          id: `deploy-${r.classId}`,
          title: `${r.classLabel} needs support deployment`,
          text: r.recommendation,
          classId: r.classId,
          priority: r.deploymentScore + 40,
          tone: "danger",
        });
      } else if (r.reportingFragileCount >= 4) {
        rows.push({
          id: `reporting-${r.classId}`,
          title: `${r.classLabel} needs reporting recovery`,
          text: `${r.reportingFragileCount} students are fragile for reporting readiness.`,
          classId: r.classId,
          priority: r.deploymentScore + 20,
          tone: "watch",
        });
      } else if (r.overdueReviews >= 3) {
        rows.push({
          id: `reviews-${r.classId}`,
          title: `${r.classLabel} has review pressure`,
          text: `${r.overdueReviews} overdue reviews are compounding support load.`,
          classId: r.classId,
          priority: r.deploymentScore + 10,
          tone: "watch",
        });
      }
    });

    if (!rows.length) {
      rows.push({
        id: "stable",
        title: "No urgent class deployment issue",
        text: "Current class portfolio looks broadly stable.",
        classId: filteredRows[0]?.classId || "",
        priority: 0,
        tone: "good",
      });
    }

    return rows.sort((a, b) => b.priority - a.priority).slice(0, 8);
  }, [filteredRows]);

  const alerts = useMemo<AlertRow[]>(() => {
    const critical = portfolioRows.filter(
      (r) => r.forecast === "Escalating"
    ).length;
    const fragile = portfolioRows.filter(
      (r) => r.authorityStatus === "Fragile"
    ).length;
    const invisible = portfolioRows.reduce((sum, r) => sum + r.invisibleCount, 0);
    const overdue = portfolioRows.reduce((sum, r) => sum + r.overdueReviews, 0);

    const items: AlertRow[] = [];
    if (critical > 0) {
      items.push({
        id: "critical",
        text: `${critical} classes are escalating.`,
        tone: "danger",
      });
    }
    if (fragile > 0) {
      items.push({
        id: "fragile",
        text: `${fragile} classes have fragile authority posture.`,
        tone: "watch",
      });
    }
    if (invisible > 0) {
      items.push({
        id: "invisible",
        text: `${invisible} invisible-risk learners are spread across classes.`,
        tone: "watch",
      });
    }
    if (overdue > 0) {
      items.push({
        id: "overdue",
        text: `${overdue} overdue reviews are creating class-level pressure.`,
        tone: "danger",
      });
    }
    if (!items.length) {
      items.push({
        id: "clear",
        text: "No major class-portfolio alerts stand out right now.",
        tone: "good",
      });
    }
    return items;
  }, [portfolioRows]);

  const summary = useMemo(() => {
    const totalClasses = portfolioRows.length;
    const totalStudents = portfolioRows.reduce(
      (sum, r) => sum + r.studentCount,
      0
    );
    const escalating = portfolioRows.filter(
      (r) => r.forecast === "Escalating"
    ).length;
    const fragile = portfolioRows.filter(
      (r) => r.authorityStatus === "Fragile"
    ).length;
    const avgFreshness = totalClasses
      ? Math.round(
          portfolioRows.reduce((sum, r) => sum + r.evidenceFreshPct, 0) /
            totalClasses
        )
      : 0;
    const avgRisk = totalClasses
      ? Math.round(
          portfolioRows.reduce((sum, r) => sum + r.avgRisk, 0) / totalClasses
        )
      : 0;

    return {
      totalClasses,
      totalStudents,
      escalating,
      fragile,
      avgFreshness,
      avgRisk,
    };
  }, [portfolioRows]);

  return (
    <div style={S.shell}>
      <AdminLeftNav />

      <main style={S.main}>
        <section style={S.hero}>
          <div style={S.heroTop}>
            <div style={{ flex: 1, minWidth: 320 }}>
              <div style={S.subtle}>Class Portfolio & Deployment Board</div>
              <h1 style={S.h1}>Classes</h1>
              <div style={S.sub}>
                Premium class board for deployment decisions, benchmark comparison,
                authority posture, and opening the right class hub next.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                style={S.btn}
                onClick={() => router.push("/admin/command-centre")}
              >
                Command Centre
              </button>
              <button
                type="button"
                style={S.btn}
                onClick={() => router.push("/admin/leadership")}
              >
                Leadership
              </button>
              <button type="button" style={S.btn} onClick={() => loadAll()}>
                Refresh
              </button>
              <AdminPageActions />
            </div>
          </div>

          <section style={S.controlsCard}>
            <div style={S.controlsGrid}>
              <div>
                <label style={S.controlLabel}>Search</label>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Class, teacher, room..."
                  style={S.input}
                />
              </div>

              <div>
                <label style={S.controlLabel}>Sort</label>
                <select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as any)}
                  style={S.select}
                >
                  <option value="deployment">Deployment score</option>
                  <option value="risk">Average risk</option>
                  <option value="authority">Authority</option>
                  <option value="freshness">Freshness</option>
                  <option value="name">Name</option>
                </select>
              </div>

              <div>
                <label style={S.controlLabel}>Filter</label>
                <select
                  value={filterMode}
                  onChange={(e) => setFilterMode(e.target.value as any)}
                  style={S.select}
                >
                  <option value="all">All classes</option>
                  <option value="watch">Watch / escalating</option>
                  <option value="fragile">Reporting / authority fragile</option>
                  <option value="stable">Stable only</option>
                </select>
              </div>
            </div>
          </section>

          <div style={S.metricGrid}>
            <Metric
              title="Classes"
              value={summary.totalClasses}
              help="Total class portfolios."
            />
            <Metric
              title="Students"
              value={summary.totalStudents}
              help="Students across listed classes."
            />
            <Metric
              title="Escalating"
              value={summary.escalating}
              help="Classes forecast to worsen."
            />
            <Metric
              title="Authority Fragile"
              value={summary.fragile}
              help="Weak documentation posture."
            />
            <Metric
              title="Avg Freshness"
              value={`${summary.avgFreshness}%`}
              help="Class evidence freshness average."
            />
            <Metric
              title="Avg Risk"
              value={summary.avgRisk}
              help="Average class risk position."
            />
          </div>
        </section>

        {busy ? <div style={S.ok}>Refreshing classes board…</div> : null}
        {err ? <div style={S.err}>{err}</div> : null}

        <section style={S.grid2}>
          <Card
            title="Portfolio Alerts"
            help="School-wide class signals worth noticing."
          >
            <div style={S.list}>
              {alerts.map((a) => (
                <div key={a.id} style={{ ...S.item, ...toneCard(a.tone) }}>
                  <div style={S.itemTitle}>{a.text}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card
            title="Deployment Queue"
            help="Where to open the next class hub and act first."
          >
            <div style={S.list}>
              {queueRows.map((q) => (
                <div key={q.id} style={{ ...S.item, ...toneCard(q.tone) }}>
                  <div style={{ ...S.row, justifyContent: "space-between" }}>
                    <div style={S.itemTitle}>{q.title}</div>
                    <span style={S.chipMuted}>Priority {q.priority}</span>
                  </div>
                  <div style={S.itemText}>{q.text}</div>
                  {q.classId ? (
                    <div style={{ marginTop: 8 }}>
                      <button
                        type="button"
                        style={S.btnSmall}
                        onClick={() =>
                          router.push(
                            `/admin/classes/${encodeURIComponent(q.classId)}`
                          )
                        }
                      >
                        Open class hub
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </Card>
        </section>

        <Card
          title="Class Portfolio Table"
          help="Compare deployment pressure, benchmark position, evidence freshness, and authority posture across all classes."
        >
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Class</th>
                  <th style={S.th}>Teacher</th>
                  <th style={S.th}>Students</th>
                  <th style={S.th}>Freshness</th>
                  <th style={S.th}>Risk</th>
                  <th style={S.th}>Forecast</th>
                  <th style={S.th}>Authority</th>
                  <th style={S.th}>Benchmark</th>
                  <th style={S.th}>Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const aTone = authorityTone(row.authorityStatus);
                  const fTone = forecastTone(row.forecast);
                  return (
                    <tr key={row.classId}>
                      <td style={S.td}>
                        <div style={{ fontWeight: 950 }}>{row.classLabel}</div>
                        <div style={{ marginTop: 6 }}>
                          <button
                            type="button"
                            style={S.linkBtn}
                            onClick={() =>
                              router.push(
                                `/admin/classes/${encodeURIComponent(row.classId)}`
                              )
                            }
                          >
                            Open class hub
                          </button>
                        </div>
                      </td>
                      <td style={S.td}>{row.teacherName}</td>
                      <td style={S.td}>
                        {row.studentCount}
                        <div
                          style={{ marginTop: 4, color: "#64748b", fontSize: 12 }}
                        >
                          ILP {row.ilpCount}
                        </div>
                      </td>
                      <td style={S.td}>{row.evidenceFreshPct}%</td>
                      <td style={S.td}>{row.avgRisk}</td>
                      <td style={S.td}>
                        <span
                          style={{
                            ...S.chip,
                            background: fTone.bg,
                            borderColor: fTone.bd,
                            color: fTone.fg,
                          }}
                        >
                          {row.forecast}
                        </span>
                      </td>
                      <td style={S.td}>
                        <span
                          style={{
                            ...S.chip,
                            background: aTone.bg,
                            borderColor: aTone.bd,
                            color: aTone.fg,
                          }}
                        >
                          {row.authorityStatus}
                        </span>
                      </td>
                      <td style={S.td}>{row.benchmarkPosition}</td>
                      <td style={S.td}>
                        <div style={{ fontWeight: 900 }}>{row.recommendation}</div>
                        <div
                          style={{ marginTop: 6, color: "#64748b", fontSize: 12 }}
                        >
                          Attention {row.attentionCount} • Invisible{" "}
                          {row.invisibleCount} • Overdue {row.overdueReviews}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}

export default function AdminClassesIndexPage() {
  return (
    <Suspense fallback={<ClassesPageFallback />}>
      <AdminClassesIndexPageInner />
    </Suspense>
  );
}

/* ───────────────────────── SMALL UI ───────────────────────── */

function Card({
  title,
  help,
  children,
}: {
  title: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <section style={S.card}>
      <div style={S.cardPad}>
        <div style={S.cardTitle}>{title}</div>
        {help ? <div style={S.cardHelp}>{help}</div> : null}
        <div style={{ marginTop: 12 }}>{children}</div>
      </div>
    </section>
  );
}

function Metric({
  title,
  value,
  help,
}: {
  title: string;
  value: React.ReactNode;
  help: string;
}) {
  return (
    <div style={S.metricCard}>
      <div style={S.metricK}>{title}</div>
      <div style={S.metricV}>{value}</div>
      <div style={S.metricS}>{help}</div>
    </div>
  );
}

/* ───────────────────────── STYLES ───────────────────────── */

const S: Record<string, React.CSSProperties> = {
  shell: {
    display: "flex",
    minHeight: "100vh",
    background: "#f6f7fb",
  },
  main: {
    flex: 1,
    maxWidth: 1480,
    width: "100%",
    margin: "0 auto",
    padding: 24,
  },
  hero: {
    background:
      "linear-gradient(135deg, rgba(79,124,240,0.08) 0%, rgba(139,124,246,0.08) 100%)",
    border: "1px solid #d9e2ff",
    borderRadius: 26,
    padding: "28px 24px",
    boxShadow: "0 18px 50px rgba(15, 23, 42, 0.06)",
  },
  heroTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 18,
    flexWrap: "wrap",
    alignItems: "flex-start",
  },
  subtle: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 900,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  h1: {
    margin: "8px 0 0 0",
    fontSize: 38,
    lineHeight: 1.05,
    fontWeight: 950,
    color: "#0f172a",
  },
  sub: {
    marginTop: 8,
    color: "#475569",
    fontWeight: 800,
    lineHeight: 1.5,
    maxWidth: 980,
  },
  row: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  },
  chip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #cbd5e1",
    fontSize: 12,
    fontWeight: 800,
  },
  chipMuted: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    fontSize: 12,
    fontWeight: 800,
    color: "#475569",
  },
  btn: {
    background: "#fff",
    color: "#0f172a",
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "10px 14px",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },
  btnSmall: {
    background: "#fff",
    color: "#0f172a",
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "8px 10px",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
  },
  controlsCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 20,
    marginTop: 18,
    boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
  },
  controlsGrid: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr 1fr",
    gap: 12,
  },
  controlLabel: {
    display: "block",
    marginBottom: 6,
    fontSize: 12,
    fontWeight: 900,
    color: "#64748b",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    background: "#fff",
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    color: "#0f172a",
  },
  select: {
    width: "100%",
    background: "#fff",
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    color: "#0f172a",
  },
  metricGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
    gap: 12,
    marginTop: 18,
  },
  metricCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
  },
  metricK: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  metricV: {
    marginTop: 6,
    fontSize: 28,
    color: "#0f172a",
    fontWeight: 950,
    lineHeight: 1.05,
  },
  metricS: {
    marginTop: 8,
    fontSize: 12,
    color: "#475569",
    fontWeight: 800,
    lineHeight: 1.35,
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    marginTop: 16,
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
    marginTop: 16,
  },
  cardPad: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 950,
    color: "#0f172a",
  },
  cardHelp: {
    marginTop: 6,
    color: "#64748b",
    fontSize: 12,
    fontWeight: 800,
    lineHeight: 1.45,
  },
  list: {
    display: "grid",
    gap: 10,
  },
  item: {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 12,
  },
  itemTitle: {
    fontWeight: 900,
    color: "#0f172a",
    fontSize: 14,
    lineHeight: 1.35,
  },
  itemText: {
    marginTop: 8,
    color: "#475569",
    fontWeight: 800,
    lineHeight: 1.45,
  },
  tableWrap: {
    marginTop: 8,
    overflowX: "auto",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
  },
  th: {
    textAlign: "left",
    padding: "12px 12px",
    fontSize: 12,
    color: "#64748b",
    fontWeight: 900,
    borderBottom: "1px solid #e5e7eb",
    background: "#f8fafc",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "12px 12px",
    fontSize: 13,
    color: "#0f172a",
    fontWeight: 700,
    borderBottom: "1px solid #eef2f7",
    verticalAlign: "top",
  },
  linkBtn: {
    border: "none",
    background: "transparent",
    padding: 0,
    color: "#2563eb",
    fontWeight: 900,
    cursor: "pointer",
    textAlign: "left",
  },
  ok: {
    marginTop: 14,
    borderRadius: 14,
    border: "1px solid #a7f3d0",
    background: "#ecfdf5",
    padding: 12,
    color: "#065f46",
    fontWeight: 900,
    fontSize: 13,
  },
  err: {
    marginTop: 14,
    borderRadius: 14,
    border: "1px solid #fecaca",
    background: "#fff1f2",
    padding: 12,
    color: "#9f1239",
    fontWeight: 900,
    fontSize: 13,
    lineHeight: 1.45,
  },
};