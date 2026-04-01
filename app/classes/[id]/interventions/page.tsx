"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ClassLeftNav from "@/app/components/ClassLeftNav";

type QueueRow = {
  intervention_id: string;
  class_id: string;
  title: string;
  status: "open" | "closed" | string;
  priority: "low" | "medium" | "high" | string;
  due_on: string | null;
  next_review_on: string | null;
  last_reviewed_at: string | null;
  student_count: number;
  days_since_review: number | null;
  is_overdue: boolean;
  review_due: boolean;
  created_at: string;
};

type ClassRow = { name: string | null; year_level: number | null };

function fmtDate(d: string | null) {
  if (!d) return "—";
  return d.slice(0, 10);
}

function addDaysISO(days: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function pill(text: string, tone: "muted" | "warn" | "danger" | "ok" = "muted") {
  const bg =
    tone === "danger"
      ? "#fff1f2"
      : tone === "warn"
      ? "#fff7ed"
      : tone === "ok"
      ? "#ecfdf5"
      : "#f3f4f6";
  const bd =
    tone === "danger"
      ? "#fecdd3"
      : tone === "warn"
      ? "#fed7aa"
      : tone === "ok"
      ? "#a7f3d0"
      : "#e5e7eb";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 999,
        border: `1px solid ${bd}`,
        background: bg,
        fontSize: 12,
        fontWeight: 900,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

export default function ClassInterventionsPage() {
  const params = useParams();
  const router = useRouter();
  const classId = (params?.id as string) || "";

  const [cls, setCls] = useState<ClassRow | null>(null);
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");

  const [search, setSearch] = useState("");
  const [showClosed, setShowClosed] = useState(false);

  // Create intervention form
  const [creating, setCreating] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createNotes, setCreateNotes] = useState("");
  const [createPriority, setCreatePriority] = useState<"low" | "medium" | "high">("medium");
  const [createDueOn, setCreateDueOn] = useState<string>("");
  const [createNextReviewDays, setCreateNextReviewDays] = useState<number>(14);

  const load = async () => {
    if (!classId) return;

    setLoading(true);
    setErr("");

    // class header
    const { data: cData } = await supabase
      .from("classes")
      .select("name, year_level")
      .eq("id", classId)
      .maybeSingle();
    setCls((cData ?? null) as ClassRow | null);

    // queue RPC
    const { data, error } = await supabase.rpc("get_class_interventions_queue", {
      p_class_id: classId,
      p_review_due_days: 14,
    });

    if (error) {
      setErr(error.message);
      setRows([]);
      setLoading(false);
      return;
    }

    setRows(((data ?? []) as QueueRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  const title =
    cls?.name ?? (cls?.year_level != null ? `Year ${cls.year_level}` : "Class");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = rows.filter((r) => (showClosed ? true : r.status !== "closed"));
    if (!q) return base;
    return base.filter((r) => (r.title ?? "").toLowerCase().includes(q));
  }, [rows, search, showClosed]);

  const overdue = filtered.filter((r) => r.status === "open" && r.is_overdue);
  const reviewDue = filtered.filter(
    (r) => r.status === "open" && r.review_due && !r.is_overdue
  );
  const openLater = filtered.filter(
    (r) => r.status === "open" && !r.is_overdue && !r.review_due
  );
  const closed = rows.filter((r) => r.status === "closed");

  const createIntervention = async () => {
    const t = createTitle.trim();
    if (!t) {
      setErr("Title is required.");
      return;
    }
    if (!classId) {
      setErr("Missing classId.");
      return;
    }

    setCreating(true);
    setErr("");

    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) throw new Error(userErr.message);
      if (!user) throw new Error("You must be signed in to create an intervention.");

      const nextReviewOn = addDaysISO(Math.max(0, Number(createNextReviewDays) || 0));

      // NOTE: we include created_by_user_id because your interventions rows show this column.
      // If your RLS requires it, this fixes “new row violates RLS policy”.
      const payload: any = {
        class_id: classId,
        title: t,
        notes: createNotes.trim() ? createNotes.trim() : null,
        priority: createPriority,
        status: "open",
        due_on: createDueOn ? createDueOn : null,
        next_review_on: nextReviewOn,
        created_by_user_id: user.id,
        started_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("interventions")
        .insert(payload)
        .select("id")
        .single();

      if (error) throw new Error(error.message);

      // reset form
      setCreateTitle("");
      setCreateNotes("");
      setCreatePriority("medium");
      setCreateDueOn("");
      setCreateNextReviewDays(14);

      // refresh queue + open detail
      await load();
      if (data?.id) router.push(`/interventions/${data.id}`);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to create intervention.");
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <main style={{ padding: 24 }}>Loading interventions…</main>;
  if (err) return <main style={{ padding: 24, color: "red" }}>{err}</main>;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <ClassLeftNav classId={classId} />

      <main style={{ flex: 1, padding: 24, maxWidth: 1200 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: "#777" }}>CLASSES · INTERVENTIONS</div>
            <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>{title}</div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
              Review due = overdue by date OR not reviewed recently.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href={`/classes/${classId}`} style={{ fontWeight: 900 }}>
              ← Back to Overview
            </Link>
            <button onClick={load} style={btn}>
              Refresh
            </button>
          </div>
        </div>

        {err ? (
          <div style={{ marginTop: 12, color: "red", fontWeight: 900, fontSize: 12 }}>{err}</div>
        ) : null}

        {/* Create intervention */}
        <section style={{ ...panel, marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 900 }}>Create intervention</div>
            {pill("Creates + opens detail →", "muted")}
          </div>

          <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 160px 180px", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>Title</div>
              <input
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                placeholder="e.g., Monitor reading fluency (4 weeks)"
                style={input}
              />
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>Priority</div>
              <select
                value={createPriority}
                onChange={(e) => setCreatePriority(e.target.value as any)}
                style={{ ...input, background: "#fff", fontWeight: 900 }}
              >
                <option value="low">LOW</option>
                <option value="medium">MEDIUM</option>
                <option value="high">HIGH</option>
              </select>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>Due date (optional)</div>
              <input
                type="date"
                value={createDueOn}
                onChange={(e) => setCreateDueOn(e.target.value)}
                style={input}
              />
            </div>
          </div>

          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 220px", gap: 12, alignItems: "end" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>Notes (optional)</div>
              <textarea
                value={createNotes}
                onChange={(e) => setCreateNotes(e.target.value)}
                placeholder="Goal, plan, evidence to watch…"
                rows={4}
                style={{ ...input, resize: "vertical" }}
              />
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>Review cycle</div>
              <select
                value={String(createNextReviewDays)}
                onChange={(e) => setCreateNextReviewDays(Number(e.target.value))}
                style={{ ...input, background: "#fff", fontWeight: 900 }}
              >
                <option value="7">Next review in 7 days</option>
                <option value="14">Next review in 14 days</option>
                <option value="21">Next review in 21 days</option>
                <option value="28">Next review in 28 days</option>
              </select>

              <button onClick={createIntervention} style={{ ...btnPrimary, width: "100%", marginTop: 10 }} disabled={creating}>
                {creating ? "Creating…" : "Create + open →"}
              </button>

              <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
                Tip: You can link students inside the intervention detail page next.
              </div>
            </div>
          </div>
        </section>

        {/* Controls */}
        <section style={{ ...panel, marginTop: 14 }}>
          <div
            style={{
              width: "100%",
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search interventions…"
              style={{ ...input, width: 320 }}
            />
            <label
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                fontWeight: 900,
                fontSize: 12,
              }}
            >
              <input
                type="checkbox"
                checked={showClosed}
                onChange={(e) => setShowClosed(e.target.checked)}
              />
              Show closed
            </label>
            <span style={{ fontSize: 12, color: "#666" }}>
              Showing <strong>{filtered.length}</strong> items
            </span>
          </div>
        </section>

        <Section
          title="Overdue"
          hint="Past due date (open)"
          empty="Nothing overdue 🎉"
          rows={overdue}
          tone="danger"
        />
        <Section
          title="Review due"
          hint="Time to check progress (open)"
          empty="No reviews due right now."
          rows={reviewDue}
          tone="warn"
        />
        <Section
          title="Open (later)"
          hint="Not due yet"
          empty="No open interventions."
          rows={openLater}
          tone="muted"
        />

        {showClosed ? (
          <Section
            title="Closed"
            hint="Historical"
            empty="No closed interventions."
            rows={closed}
            tone="ok"
          />
        ) : null}
      </main>
    </div>
  );

  function Section({
    title,
    hint,
    empty,
    rows,
    tone,
  }: {
    title: string;
    hint: string;
    empty: string;
    rows: QueueRow[];
    tone: "muted" | "warn" | "danger" | "ok";
  }) {
    return (
      <section style={{ marginTop: 14 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 16 }}>{title}</div>
          <div style={{ fontSize: 12, color: "#666" }}>{hint}</div>
        </div>

        {rows.length === 0 ? (
          <div style={{ ...panel, marginTop: 10, color: "#666" }}>{empty}</div>
        ) : (
          <div style={{ ...panel, marginTop: 10, padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#fafafa", fontSize: 12, color: "#666" }}>
                  <th style={{ textAlign: "left", padding: 12 }}>Intervention</th>
                  <th style={{ padding: 12 }}>Priority</th>
                  <th style={{ padding: 12 }}>Students</th>
                  <th style={{ padding: 12 }}>Due</th>
                  <th style={{ padding: 12 }}>Last review</th>
                  <th style={{ padding: 12 }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const due = fmtDate(r.due_on);
                  const last = r.last_reviewed_at ? fmtDate(r.last_reviewed_at) : "—";
                  const reviewDueBadge =
                    r.status === "open" && (r.is_overdue || r.review_due)
                      ? pill("Review due", r.is_overdue ? "danger" : "warn")
                      : null;

                  return (
                    <tr key={r.intervention_id} style={{ borderTop: "1px solid #eee" }}>
                      <td style={{ padding: 12 }}>
                        <div
                          style={{
                            fontWeight: 900,
                            display: "flex",
                            gap: 10,
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <Link
                            href={`/interventions/${r.intervention_id}`}
                            style={{ textDecoration: "none", color: "#111" }}
                          >
                            {r.title}
                          </Link>

                          {reviewDueBadge}
                        </div>

                        <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                          Status: <strong>{r.status}</strong> · Created: {fmtDate(r.created_at)}
                          {r.days_since_review != null ? ` · ${r.days_since_review}d since review` : ""}
                        </div>
                      </td>

                      <td style={{ padding: 12, textAlign: "center" }}>
                        {pill(
                          String(r.priority).toUpperCase(),
                          tone === "danger" ? "danger" : tone === "warn" ? "warn" : "muted"
                        )}
                      </td>

                      <td style={{ padding: 12, textAlign: "center", fontWeight: 900 }}>
                        {r.student_count}
                      </td>

                      <td style={{ padding: 12, textAlign: "center" }}>{due}</td>

                      <td style={{ padding: 12, textAlign: "center" }}>{last}</td>

                      <td style={{ padding: 12, textAlign: "right" }}>
                        <Link href={`/interventions/${r.intervention_id}`} style={{ ...btnLink }}>
                          Open →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    );
  }
}

const panel: React.CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 16,
  padding: 14,
  background: "#fff",
};

const input: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #ddd",
  width: "100%",
};

const btn: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #ddd",
  fontWeight: 900,
  cursor: "pointer",
  background: "#fff",
};

const btnPrimary: React.CSSProperties = {
  ...btn,
  background: "#111",
  color: "#fff",
};

const btnLink: React.CSSProperties = {
  display: "inline-flex",
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #ddd",
  fontWeight: 900,
  textDecoration: "none",
  color: "#111",
  background: "#fff",
};
