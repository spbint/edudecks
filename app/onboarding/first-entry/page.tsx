"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type ChildForm = {
  childName: string;
  age: string;
  yearLevel: string;
  location: string;
  startDate: string;
};

type FirstEntryForm = {
  title: string;
  summary: string;
  learningArea: string;
  evidenceType: string;
  occurredOn: string;
};

const CHILD_STORAGE_KEY = "edudecks_onboarding_child";
const ENTRY_STORAGE_KEY = "edudecks_onboarding_first_entry";
const COMPLETE_KEY = "edudecks_onboarding_complete";
const STUDENT_ID_KEY = "edudecks_onboarding_student_id";
const FIRST_ENTRY_ID_KEY = "edudecks_onboarding_first_entry_id";

const S = {
  shell: {
    minHeight: "100vh",
    background: "#f6f7fb",
    padding: 24,
  } as React.CSSProperties,

  wrap: {
    maxWidth: 920,
    margin: "40px auto",
  } as React.CSSProperties,

  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    padding: 28,
    boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
  } as React.CSSProperties,

  subtle: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  } as React.CSSProperties,

  h1: {
    margin: "8px 0 0 0",
    fontSize: 34,
    lineHeight: 1.08,
    fontWeight: 950,
    color: "#0f172a",
  } as React.CSSProperties,

  lead: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 1.6,
    color: "#475569",
    fontWeight: 700,
  } as React.CSSProperties,

  progress: {
    marginTop: 18,
    display: "flex",
    gap: 10,
    alignItems: "center",
  } as React.CSSProperties,

  stepDotOn: {
    width: 12,
    height: 12,
    borderRadius: 999,
    background: "#111827",
  } as React.CSSProperties,

  stepDotOff: {
    width: 12,
    height: 12,
    borderRadius: 999,
    background: "#d1d5db",
  } as React.CSSProperties,

  grid2: {
    display: "grid",
    gridTemplateColumns: "1.15fr 0.85fr",
    gap: 16,
    marginTop: 22,
    alignItems: "start",
  } as React.CSSProperties,

  fieldStack: {
    display: "grid",
    gap: 14,
  } as React.CSSProperties,

  field: {
    display: "grid",
    gap: 8,
  } as React.CSSProperties,

  label: {
    fontSize: 12,
    fontWeight: 900,
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  } as React.CSSProperties,

  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid #dbe1ea",
    background: "#fff",
    color: "#0f172a",
    fontSize: 15,
    fontWeight: 700,
    outline: "none",
  } as React.CSSProperties,

  textarea: {
    width: "100%",
    minHeight: 160,
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid #dbe1ea",
    background: "#fff",
    color: "#0f172a",
    fontSize: 15,
    fontWeight: 700,
    outline: "none",
    resize: "vertical",
  } as React.CSSProperties,

  helper: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 700,
    lineHeight: 1.45,
  } as React.CSSProperties,

  sideCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: 16,
  } as React.CSSProperties,

  sideTitle: {
    fontSize: 16,
    fontWeight: 950,
    color: "#0f172a",
  } as React.CSSProperties,

  sideText: {
    marginTop: 8,
    color: "#475569",
    fontWeight: 700,
    lineHeight: 1.55,
    fontSize: 14,
  } as React.CSSProperties,

  chipList: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  } as React.CSSProperties,

  chip: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 10px",
    borderRadius: 999,
    border: "1px solid #dbe1ea",
    background: "#fff",
    color: "#0f172a",
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
  } as React.CSSProperties,

  box: {
    marginTop: 18,
    padding: 14,
    borderRadius: 16,
    border: "1px solid #dbeafe",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontWeight: 800,
    lineHeight: 1.5,
  } as React.CSSProperties,

  preview: {
    marginTop: 18,
    padding: 16,
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    background: "#fff",
  } as React.CSSProperties,

  previewTitle: {
    fontSize: 17,
    fontWeight: 950,
    color: "#0f172a",
  } as React.CSSProperties,

  previewText: {
    marginTop: 10,
    color: "#334155",
    fontWeight: 700,
    lineHeight: 1.6,
  } as React.CSSProperties,

  row: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: 24,
  } as React.CSSProperties,

  btn: {
    padding: "12px 16px",
    borderRadius: 14,
    border: "1px solid #dbe1ea",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 900,
    cursor: "pointer",
  } as React.CSSProperties,

  btnPrimary: {
    padding: "12px 16px",
    borderRadius: 14,
    border: "1px solid #111827",
    background: "#111827",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  } as React.CSSProperties,

  info: {
    marginTop: 14,
    borderRadius: 14,
    border: "1px solid #bfdbfe",
    background: "#eff6ff",
    padding: 12,
    color: "#1d4ed8",
    fontWeight: 900,
  } as React.CSSProperties,

  err: {
    marginTop: 14,
    borderRadius: 14,
    border: "1px solid #fecaca",
    background: "#fff1f2",
    padding: 12,
    color: "#9f1239",
    fontWeight: 900,
  } as React.CSSProperties,
};

const learningAreaOptions = [
  "English",
  "Mathematics",
  "Science",
  "Humanities",
  "Technologies",
  "The Arts",
  "Health & Physical Education",
  "Languages",
  "Faith / Biblical Studies",
  "Life Skills / Practical Learning",
];

const evidenceTypeOptions = [
  "Observation",
  "Work sample",
  "Project",
  "Discussion",
  "Excursion",
  "Photo evidence",
  "Assessment",
  "General evidence",
];

function safe(v: any) {
  return String(v ?? "").trim();
}

function splitName(fullName: string) {
  const clean = safe(fullName);
  if (!clean) return { first_name: "", surname: "" };
  const parts = clean.split(/\s+/).filter(Boolean);
  return {
    first_name: parts[0] || "",
    surname: parts.slice(1).join(" "),
  };
}

function isMissingColumnError(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && msg.includes("column");
}

async function createStudentRecord(child: ChildForm) {
  const nameBits = splitName(child.childName);

  const payloadVariants: Array<Record<string, any>> = [
    {
      first_name: nameBits.first_name || safe(child.childName),
      preferred_name: nameBits.first_name || safe(child.childName),
      surname: nameBits.surname || null,
      class_id: null,
      is_ilp: false,
    },
    {
      first_name: nameBits.first_name || safe(child.childName),
      preferred_name: nameBits.first_name || safe(child.childName),
      family_name: nameBits.surname || null,
      class_id: null,
      is_ilp: false,
    },
    {
      first_name: nameBits.first_name || safe(child.childName),
      preferred_name: nameBits.first_name || safe(child.childName),
      class_id: null,
      is_ilp: false,
    },
    {
      first_name: nameBits.first_name || safe(child.childName),
      preferred_name: nameBits.first_name || safe(child.childName),
    },
  ];

  for (const payload of payloadVariants) {
    const r = await supabase.from("students").insert(payload).select("id").single();
    if (!r.error && r.data?.id) return r.data.id as string;
    if (!isMissingColumnError(r.error)) throw r.error;
  }

  throw new Error("Could not create student record.");
}

async function linkStudentToCurrentParent(studentId: string) {
  const authResp = await supabase.auth.getUser();
  const userId = authResp.data.user?.id;
  if (!userId) return;

  const r = await supabase.from("parent_student_links").upsert(
    {
      parent_user_id: userId,
      student_id: studentId,
      relationship_label: "child",
      sort_order: 0,
    },
    { onConflict: "parent_user_id,student_id" }
  );

  if (r.error) throw r.error;
}

async function createEvidenceRecord(studentId: string, form: FirstEntryForm) {
  const payloadVariants: Array<Record<string, any>> = [
    {
      student_id: studentId,
      class_id: null,
      title: safe(form.title) || "First learning entry",
      summary: safe(form.summary),
      body: safe(form.summary),
      learning_area: safe(form.learningArea) || null,
      evidence_type: safe(form.evidenceType) || "General evidence",
      occurred_on: safe(form.occurredOn) || null,
      is_deleted: false,
      visibility: "private",
    },
    {
      student_id: studentId,
      class_id: null,
      title: safe(form.title) || "First learning entry",
      summary: safe(form.summary),
      learning_area: safe(form.learningArea) || null,
      evidence_type: safe(form.evidenceType) || "General evidence",
      occurred_on: safe(form.occurredOn) || null,
      is_deleted: false,
      visibility: "private",
    },
    {
      student_id: studentId,
      class_id: null,
      title: safe(form.title) || "First learning entry",
      summary: safe(form.summary),
      learning_area: safe(form.learningArea) || null,
      occurred_on: safe(form.occurredOn) || null,
      is_deleted: false,
    },
    {
      student_id: studentId,
      title: safe(form.title) || "First learning entry",
      summary: safe(form.summary),
      learning_area: safe(form.learningArea) || null,
      occurred_on: safe(form.occurredOn) || null,
    },
  ];

  for (const payload of payloadVariants) {
    const r = await supabase.from("evidence_entries").insert(payload).select("id").single();
    if (!r.error && r.data?.id) return r.data.id as string;
    if (!isMissingColumnError(r.error)) throw r.error;
  }

  throw new Error("Could not create first evidence entry.");
}

export default function OnboardingFirstEntryPage() {
  const router = useRouter();

  const [child, setChild] = useState<ChildForm>({
    childName: "",
    age: "",
    yearLevel: "",
    location: "",
    startDate: "",
  });

  const [form, setForm] = useState<FirstEntryForm>({
    title: "",
    summary: "",
    learningArea: "",
    evidenceType: "General evidence",
    occurredOn: "",
  });

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    try {
      const childRaw = window.localStorage.getItem(CHILD_STORAGE_KEY);
      if (childRaw) {
        const parsed = JSON.parse(childRaw);
        setChild((prev) => ({ ...prev, ...parsed }));
      }
    } catch {}

    try {
      const entryRaw = window.localStorage.getItem(ENTRY_STORAGE_KEY);
      if (entryRaw) {
        const parsed = JSON.parse(entryRaw);
        setForm((prev) => ({ ...prev, ...parsed }));
      }
    } catch {}
  }, []);

  function update<K extends keyof FirstEntryForm>(key: K, value: FirstEntryForm[K]) {
    const next = { ...form, [key]: value };
    setForm(next);
    try {
      window.localStorage.setItem(ENTRY_STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }

  function choosePrompt(title: string, summary: string, learningArea = "", evidenceType = "General evidence") {
    const next = {
      ...form,
      title,
      summary,
      learningArea,
      evidenceType,
    };
    setForm(next);
    try {
      window.localStorage.setItem(ENTRY_STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }

  async function finishOnboarding() {
    setSaving(true);
    setErr("");
    setMsg("");

    try {
      window.localStorage.setItem(CHILD_STORAGE_KEY, JSON.stringify(child));
      window.localStorage.setItem(ENTRY_STORAGE_KEY, JSON.stringify(form));

      let studentId = window.localStorage.getItem(STUDENT_ID_KEY);
      if (!safe(studentId)) {
        studentId = await createStudentRecord(child);
        window.localStorage.setItem(STUDENT_ID_KEY, studentId);
      }

      await linkStudentToCurrentParent(studentId!);

      let firstEntryId = window.localStorage.getItem(FIRST_ENTRY_ID_KEY);
      if (!safe(firstEntryId)) {
        firstEntryId = await createEvidenceRecord(studentId!, form);
        window.localStorage.setItem(FIRST_ENTRY_ID_KEY, firstEntryId);
      }

      window.localStorage.setItem(
        COMPLETE_KEY,
        JSON.stringify({
          completedAt: new Date().toISOString(),
          studentId,
          firstEntryId,
          child,
          firstEntry: form,
        })
      );

      setMsg("Your child profile and first evidence entry have been created.");
      router.push("/welcome");
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  }

  const previewName = useMemo(() => {
    return child.childName?.trim() || "Your child";
  }, [child.childName]);

  return (
    <div style={S.shell}>
      <div style={S.wrap}>
        <div style={S.card}>
          <div style={S.subtle}>Step 3 of 3</div>
          <h1 style={S.h1}>Add your first learning entry</h1>
          <div style={S.lead}>
            This is the moment EduDecks becomes useful. Start with one real thing{" "}
            {previewName} has learned, created, practised, discussed, or explored.
          </div>

          <div style={S.progress}>
            <div style={S.stepDotOn} />
            <div style={S.stepDotOn} />
            <div style={S.stepDotOn} />
          </div>

          <div style={S.grid2}>
            <div style={S.fieldStack}>
              <div style={S.field}>
                <label style={S.label}>Entry title</label>
                <input
                  style={S.input}
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="e.g. Built a model volcano"
                />
                <div style={S.helper}>
                  Keep it simple. Think of this like naming a memory of learning.
                </div>
              </div>

              <div style={S.field}>
                <label style={S.label}>What happened?</label>
                <textarea
                  style={S.textarea}
                  value={form.summary}
                  onChange={(e) => update("summary", e.target.value)}
                  placeholder={`Example: ${previewName} completed a hands-on science activity exploring chemical reactions. They mixed safe ingredients, observed bubbling and change, and explained what they noticed in their own words.`}
                />
                <div style={S.helper}>
                  Write naturally. You do not need formal teacher language.
                </div>
              </div>

              <div style={S.field}>
                <label style={S.label}>Learning area</label>
                <select
                  style={S.input}
                  value={form.learningArea}
                  onChange={(e) => update("learningArea", e.target.value)}
                >
                  <option value="">Choose a learning area</option>
                  {learningAreaOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div style={S.field}>
                <label style={S.label}>Evidence type</label>
                <select
                  style={S.input}
                  value={form.evidenceType}
                  onChange={(e) => update("evidenceType", e.target.value)}
                >
                  {evidenceTypeOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div style={S.field}>
                <label style={S.label}>Date</label>
                <input
                  style={S.input}
                  type="date"
                  value={form.occurredOn}
                  onChange={(e) => update("occurredOn", e.target.value)}
                />
              </div>
            </div>

            <div>
              <div style={S.sideCard}>
                <div style={S.sideTitle}>Need an easy starting point?</div>
                <div style={S.sideText}>
                  Choose one of these prompts. They are designed to feel more like
                  real family learning and less like school paperwork.
                </div>

                <div style={S.chipList}>
                  <button
                    style={S.chip}
                    onClick={() =>
                      choosePrompt(
                        "Finished a reading task",
                        `${previewName} read and responded to a text, showing growing confidence in comprehension and discussion.`,
                        "English",
                        "Work sample"
                      )
                    }
                  >
                    Reading
                  </button>

                  <button
                    style={S.chip}
                    onClick={() =>
                      choosePrompt(
                        "Worked on a maths activity",
                        `${previewName} practised number skills and explained their thinking while solving problems.`,
                        "Mathematics",
                        "Work sample"
                      )
                    }
                  >
                    Maths
                  </button>

                  <button
                    style={S.chip}
                    onClick={() =>
                      choosePrompt(
                        "Completed a science investigation",
                        `${previewName} explored a scientific idea through observation, discussion, and hands-on activity.`,
                        "Science",
                        "Project"
                      )
                    }
                  >
                    Science
                  </button>

                  <button
                    style={S.chip}
                    onClick={() =>
                      choosePrompt(
                        "Created an artwork",
                        `${previewName} planned and created an artwork, showing imagination, care, and personal expression.`,
                        "The Arts",
                        "Work sample"
                      )
                    }
                  >
                    Art
                  </button>

                  <button
                    style={S.chip}
                    onClick={() =>
                      choosePrompt(
                        "Participated in a practical life activity",
                        `${previewName} took part in a practical learning experience and showed growing independence and problem-solving.`,
                        "Life Skills / Practical Learning",
                        "Observation"
                      )
                    }
                  >
                    Life skills
                  </button>

                  <button
                    style={S.chip}
                    onClick={() =>
                      choosePrompt(
                        "Visited a new place and learned from it",
                        `${previewName} learned through an experience outside the home, asking questions and making connections to their learning.`,
                        "Humanities",
                        "Excursion"
                      )
                    }
                  >
                    Excursion
                  </button>
                </div>
              </div>

              <div style={S.box}>
                You are not trying to prove everything today. You are simply
                starting a clear and trustworthy learning record.
              </div>

              <div style={S.preview}>
                <div style={S.previewTitle}>Live preview</div>
                <div style={S.previewText}>
                  <strong>{form.title || "Your entry title will appear here"}</strong>
                </div>
                <div style={S.previewText}>
                  {form.summary || "Your learning summary will appear here as you type."}
                </div>
                <div style={S.chipList}>
                  {form.learningArea ? <span style={S.chip}>{form.learningArea}</span> : null}
                  {form.evidenceType ? <span style={S.chip}>{form.evidenceType}</span> : null}
                  {form.occurredOn ? <span style={S.chip}>{form.occurredOn}</span> : null}
                </div>
              </div>
            </div>
          </div>

          {msg ? <div style={S.info}>{msg}</div> : null}
          {err ? <div style={S.err}>{err}</div> : null}

          <div style={S.row}>
            <button style={S.btn} onClick={() => router.push("/onboarding/child")} disabled={saving}>
              Back
            </button>
            <button style={S.btnPrimary} onClick={finishOnboarding} disabled={saving}>
              {saving ? "Creating your record…" : "Finish onboarding"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}