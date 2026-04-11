"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import CurriculumSetupCard from "@/app/components/CurriculumSetupCard";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import {
  DEFAULT_FAMILY_SETTINGS,
  type FamilySettings,
} from "@/lib/familySettings";
import {
  createLinkedLearner,
  loadFamilyWorkspace,
  removeLinkedLearner,
  saveFamilyWorkspaceSettings,
  setActiveLearnerId,
  setDefaultLearner,
} from "@/lib/familyWorkspace";
import { type ReportDraftStatus } from "@/lib/reportDrafts";
import { hasSupabaseEnv, supabase } from "@/lib/supabaseClient";

type ProfileRow = { is_admin?: boolean | null; full_name?: string | null; name?: string | null };
type ProfileChild = { id: string; name: string; yearLabel: string; connectedAt?: string | null };
type EvidenceEntry = { id: string; student_id: string | null; learning_area?: string | null; created_at?: string | null; note?: string | null; title?: string | null };
type ReportActivity = { id: string; title: string; childName: string; status: ReportDraftStatus; updatedAt?: string | null };
type SavedPlan = { studentId: string; weekKey: string; focusTitle: string; focusSummary: string; updatedAt: string };

const LOCAL_PLAN_KEY = "edudecks_plan";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [settings, setSettings] = useState<FamilySettings>(DEFAULT_FAMILY_SETTINGS);
  const [children, setChildren] = useState<ProfileChild[]>([]);
  const [captures, setCaptures] = useState<EvidenceEntry[]>([]);
  const [reports, setReports] = useState<ReportActivity[]>([]);
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [savingCurriculum, setSavingCurriculum] = useState(false);
  const [busyChildId, setBusyChildId] = useState("");
  const [addName, setAddName] = useState("");
  const [addYear, setAddYear] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function hydrate() {
      setPlans(loadPlannerActivity());

      try {
        const auth = await supabase.auth.getUser();
        const currentUser = auth.data.user;
        const workspace = await loadFamilyWorkspace();
        if (!mounted) return;

        setUser(currentUser ?? null);
        setSettings(workspace.profile);
        setChildren(
          workspace.learners.map((child) => ({
            id: child.id,
            name: child.label,
            yearLabel: child.yearLabel || "",
            connectedAt: child.connectedAt ?? null,
          })),
        );

        if (!hasSupabaseEnv) {
          setError("Supabase is not configured for this preview environment.");
          return;
        }

        if (!currentUser) {
          setError("Sign in to view your family profile.");
          return;
        }

        const profileRow = await fetchProfileRow(currentUser.id);
        if (!mounted) return;
        setProfile(profileRow);

        const ids = workspace.learners.map((child) => child.id);
        const [captureRows, reportRows] = await Promise.all([
          ids.length ? fetchRecentEvidence(ids) : Promise.resolve([]),
          fetchRecentReports(currentUser.id),
        ]);
        if (!mounted) return;
        setCaptures(captureRows);
        setReports(reportRows);
      } catch (err) {
        console.error("Profile load failed", err);
        if (!mounted) return;
        setError("We could not load the family profile right now.");
      }
    }
    void hydrate();
    return () => {
      mounted = false;
    };
  }, []);

  const displayName = useMemo(() => {
    const fromProfile = profile?.full_name || profile?.name;
    const fromUser = safe(user?.user_metadata?.full_name) || safe(user?.user_metadata?.name);
    return fromProfile || fromUser || user?.email || "EduDecks family";
  }, [profile, user]);

  const defaultChild = useMemo(
    () => children.find((child) => child.id === settings.default_child_id) ?? null,
    [children, settings.default_child_id]
  );

  const activity = useMemo(() => {
    return [
      ...captures.map((item) => ({
        id: `capture-${item.id}`,
        kind: "Capture",
        title: lookupChild(item.student_id, children) || "Capture",
        note: `${item.learning_area || "Learning moment"}${item.note || item.title ? `: ${item.note || item.title}` : ""}`,
        date: item.created_at,
        href: "/capture",
      })),
      ...plans.map((item, index) => ({
        id: `plan-${index}`,
        kind: "Planner",
        title: item.focusTitle || "Weekly plan",
        note: `${lookupChild(item.studentId, children) || "Learner"} - ${item.focusSummary || "Planner work saved."}`,
        date: item.updatedAt,
        href: "/planner",
      })),
      ...reports.map((item) => ({
        id: `report-${item.id}`,
        kind: "Report",
        title: item.title,
        note: `${item.childName || "Child"} - ${item.status}`,
        date: item.updatedAt,
        href: "/reports",
      })),
    ]
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
      .slice(0, 6);
  }, [captures, children, plans, reports]);

  async function saveCurriculum() {
    setSavingCurriculum(true);
    setStatus("");
    try {
      const saved = await saveFamilyWorkspaceSettings({ ...settings });
      setSettings(saved);
      setStatus("Curriculum setup saved.");
    } catch (err) {
      console.error("Curriculum save failed", err);
      setStatus("Curriculum setup could not be saved.");
    } finally {
      setSavingCurriculum(false);
    }
  }

  async function setDefaultChild(childId: string) {
    setBusyChildId(childId);
    setStatus("");
    try {
      const saved = await setDefaultLearner(settings, childId);
      setSettings(saved);
      setStatus("Default learner updated.");
    } catch (err) {
      console.error("Default child update failed", err);
      setStatus("Default learner could not be updated.");
    } finally {
      setBusyChildId("");
    }
  }

  async function removeChild(child: ProfileChild) {
    if (typeof window !== "undefined" && !window.confirm(`Remove ${child.name} from this family workspace?`)) return;
    setBusyChildId(child.id);
    setStatus("");
    try {
      if (!user) throw new Error("You must be signed in.");
      await removeLinkedLearner(user.id, child.id);
      const nextChildren = children.filter((item) => item.id !== child.id);
      setChildren(nextChildren);
      if (settings.default_child_id === child.id) {
        const saved = await setDefaultLearner(settings, nextChildren[0]?.id ?? null);
        setSettings(saved);
      } else if (children.length) {
        setActiveLearnerId(nextChildren[0]?.id ?? null);
      }
      setStatus("Learner removed from family links.");
    } catch (err) {
      console.error("Child removal failed", err);
      setStatus("Learner could not be removed.");
    } finally {
      setBusyChildId("");
    }
  }

  async function addLearner() {
    if (!safe(addName)) {
      setStatus("Enter a learner name before adding.");
      return;
    }
    if (!hasSupabaseEnv || !user) {
      setStatus("A signed-in Supabase session is required to add a learner.");
      return;
    }
    setAdding(true);
    setStatus("");
    try {
      const studentId = await createLinkedLearner(user.id, addName, addYear);
      const workspace = await loadFamilyWorkspace();
      const linkedChildren = workspace.learners.map((child) => ({
        id: child.id,
        name: child.label,
        yearLabel: child.yearLabel || "",
        connectedAt: child.connectedAt ?? null,
      }));
      setChildren(linkedChildren);
      if (!settings.default_child_id) {
        const saved = await setDefaultLearner(settings, studentId);
        setSettings(saved);
      } else {
        setActiveLearnerId(studentId);
      }
      setAddName("");
      setAddYear("");
      setStatus("Learner added to the family workspace.");
    } catch (err) {
      console.error("Add learner failed", err);
      setStatus("Learner could not be added.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <FamilyTopNavShell title="EduDecks Family" subtitle="Profile" hideHero={true}>
      <div style={styles.page}>
        <section style={styles.hero}>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={styles.eyebrow}>My profile</div>
            <h1 style={styles.h1}>Keep your family connected</h1>
            <p style={styles.text}>
              This is the family nerve centre for identity, learner links, curriculum defaults, and the recent work shaping your planner, captures, and reports.
            </p>
            <div style={styles.actions}>
              <Link href="/family" style={styles.primaryLink}>Family Home</Link>
              <Link href="/settings" style={styles.secondaryLink}>Settings</Link>
            </div>
            {error ? <div style={styles.warn}>{error}</div> : null}
            {status ? <div style={styles.ok}>{status}</div> : null}
          </div>
          <div style={styles.aside}>
            <div style={styles.avatar}>{initials(displayName)}</div>
            <div style={styles.asideTitle}>{safe(settings.family_display_name) || "Your family"}</div>
            <div style={styles.text}>Signed in as {user?.email || "guest view"} and ready to keep the family workspace steady.</div>
          </div>
        </section>

        <div style={styles.grid2}>
          <section style={styles.card}>
            <div style={styles.sectionTitle}>Family identity</div>
            <IdentityRow label="Family / workspace identity" value={safe(settings.family_display_name) || "Your family"} />
            <IdentityRow label="Signed-in email" value={user?.email || "Not available"} />
            <IdentityRow label="Default child" value={defaultChild ? `${defaultChild.name} (${defaultChild.yearLabel})` : "Not set"} />
            <IdentityRow label="Plan visibility" value="Family plan signals stay visible here for the whole workspace." />
            <IdentityRow label="Account role" value={profile?.is_admin ? "Admin account" : "Family member"} />
          </section>

          <section style={styles.card}>
            <div style={styles.sectionTitle}>Recent activity</div>
            <div style={styles.muted}>Recent captures / planning / report activity</div>
            {activity.length ? activity.map((item) => (
              <Link key={item.id} href={item.href} style={styles.activity}>
                <div>
                  <div style={styles.kind}>{item.kind}</div>
                  <div style={styles.rowTitle}>{item.title}</div>
                  <div style={styles.muted}>{item.note}</div>
                </div>
                <div style={styles.date}>{formatDate(item.date)}</div>
              </Link>
            )) : <div style={styles.empty}>No recent family activity has been saved yet.</div>}
          </section>
        </div>

        <section style={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
            <div>
              <div style={styles.sectionTitle}>Curriculum setup</div>
              <div style={styles.muted}>Use the curriculum selector, then save the setup for planning and reporting.</div>
            </div>
            <button type="button" onClick={saveCurriculum} style={styles.primaryButton} disabled={savingCurriculum}>
              {savingCurriculum ? "Saving..." : "Save curriculum setup"}
            </button>
          </div>
          <CurriculumSetupCard
            value={settings.curriculum_preferences}
            onChange={(curriculum) => setSettings((prev) => ({ ...prev, curriculum_preferences: curriculum }))}
          />
        </section>

        <section style={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
            <div>
              <div style={styles.sectionTitle}>Child & family links</div>
              <div style={styles.muted}>List of learners, default child controls, removal, and a simple add learner form.</div>
            </div>
            <Link href="/children" style={styles.secondaryLink}>Open children workspace</Link>
          </div>
          <div style={styles.grid2}>
            <div style={{ display: "grid", gap: 12 }}>
              {children.length ? children.map((child) => (
                <div key={child.id} style={styles.childCard}>
                  <div>
                    <div style={styles.rowTitle}>{child.name}</div>
                    <div style={styles.muted}>{child.yearLabel || "Year level not set"}</div>
                    <div style={styles.muted}>Connected {formatDate(child.connectedAt)}</div>
                  </div>
                  <div style={styles.actions}>
                    {settings.default_child_id === child.id ? <span style={styles.chip}>Default learner</span> : (
                      <button type="button" onClick={() => void setDefaultChild(child.id)} style={styles.secondaryButton} disabled={busyChildId === child.id}>
                        {busyChildId === child.id ? "Saving..." : "Set default child"}
                      </button>
                    )}
                    <button type="button" onClick={() => void removeChild(child)} style={styles.dangerButton} disabled={busyChildId === child.id}>
                      {busyChildId === child.id ? "Working..." : "Remove child"}
                    </button>
                  </div>
                </div>
              )) : <div style={styles.empty}>No learners are linked yet.</div>}
            </div>

            <div style={styles.childCard}>
              <div style={styles.sectionTitle}>Add learner</div>
              <label style={styles.field}>
                <span style={styles.label}>Learner name</span>
                <input value={addName} onChange={(e) => setAddName(e.target.value)} style={styles.input} placeholder="e.g. Charlotte Brown" />
              </label>
              <label style={styles.field}>
                <span style={styles.label}>Year level</span>
                <input value={addYear} onChange={(e) => setAddYear(e.target.value)} style={styles.input} placeholder="e.g. 4" />
              </label>
              <button type="button" onClick={() => void addLearner()} style={styles.primaryButton} disabled={adding}>
                {adding ? "Adding..." : "Add learner"}
              </button>
            </div>
          </div>
        </section>

        <section style={styles.card}>
          <div style={styles.sectionTitle}>Quick actions</div>
          <div style={styles.quickGrid}>
            <QuickLink href="/family" label="family" />
            <QuickLink href="/settings" label="settings" />
            <QuickLink href="/planner" label="planner" />
            <QuickLink href="/portfolio" label="portfolio" />
            <QuickLink href="/reports" label="reports" />
            <QuickLink href="/calendar" label="calendar" />
          </div>
        </section>
      </div>
    </FamilyTopNavShell>
  );
}

function IdentityRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.identityRow}>
      <div style={styles.label}>{label}</div>
      <div style={styles.rowTitle}>{value}</div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return <Link href={href} style={styles.quickLink}>{label}</Link>;
}

function safe(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function initials(value: string) { return (safe(value).split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("")) || "ED"; }
function lookupChild(id: string | null | undefined, children: ProfileChild[]) { return id ? children.find((child) => child.id === id)?.name ?? null : null; }
function formatDate(value?: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}
function loadPlannerActivity(): SavedPlan[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_PLAN_KEY);
    if (!raw) return [];
    return Object.values(JSON.parse(raw) as Record<string, SavedPlan>).sort(
      (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
    ).slice(0, 3);
  } catch {
    return [];
  }
}

async function fetchProfileRow(userId: string): Promise<ProfileRow | null> {
  const res = await supabase.from("profiles").select("is_admin,full_name,name").eq("id", userId).maybeSingle();
  return res.data ?? null;
}
async function fetchRecentEvidence(studentIds: string[]): Promise<EvidenceEntry[]> {
  const res = await supabase.from("evidence_entries").select("id,student_id,learning_area,created_at,note,title").in("student_id", studentIds).order("created_at", { ascending: false }).limit(4);
  return res.data ?? [];
}
async function fetchRecentReports(userId: string): Promise<ReportActivity[]> {
  const res = await supabase.from("report_drafts").select("id,title,status,child_name,updated_at").eq("user_id", userId).order("updated_at", { ascending: false }).limit(3);
  return (res.data ?? []).map((row) => ({ id: row.id, title: row.title || "Report draft", childName: row.child_name || "Child", status: (row.status as ReportDraftStatus) ?? "draft", updatedAt: row.updated_at }));
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: "grid", gap: 18, paddingBottom: 60 },
  hero: { display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(260px,0.8fr)", gap: 18, border: "1px solid #dbeafe", borderRadius: 24, background: "linear-gradient(180deg,#ffffff 0%,#f8fbff 100%)", padding: 24 },
  card: { border: "1px solid #e5e7eb", borderRadius: 20, background: "#ffffff", padding: 20, display: "grid", gap: 14, boxShadow: "0 12px 28px rgba(15,23,42,0.04)" },
  grid2: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 18, alignItems: "start" },
  eyebrow: { fontSize: 12, fontWeight: 800, letterSpacing: 1.1, textTransform: "uppercase", color: "#64748b" },
  h1: { margin: 0, fontSize: "clamp(2rem,3vw,2.8rem)", lineHeight: 1.05, fontWeight: 900, color: "#0f172a" },
  sectionTitle: { fontSize: 18, fontWeight: 900, color: "#0f172a" },
  rowTitle: { fontSize: 15, fontWeight: 800, color: "#0f172a" },
  text: { fontSize: 14, lineHeight: 1.65, color: "#475569" },
  muted: { fontSize: 13, lineHeight: 1.55, color: "#64748b" },
  actions: { display: "flex", flexWrap: "wrap", gap: 10 },
  primaryLink: { textDecoration: "none", borderRadius: 12, background: "#1d4ed8", color: "#ffffff", padding: "10px 14px", fontWeight: 800, fontSize: 14 },
  secondaryLink: { textDecoration: "none", borderRadius: 12, border: "1px solid #d1d5db", background: "#ffffff", color: "#0f172a", padding: "10px 14px", fontWeight: 800, fontSize: 14 },
  aside: { border: "1px solid #e5e7eb", borderRadius: 20, background: "rgba(255,255,255,0.9)", padding: 18, display: "grid", gap: 10, alignContent: "start" },
  avatar: { width: 56, height: 56, borderRadius: "50%", background: "#dbeafe", color: "#1d4ed8", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 18 },
  asideTitle: { fontSize: 20, fontWeight: 900, color: "#0f172a" },
  ok: { border: "1px solid #bbf7d0", background: "#ecfdf5", color: "#166534", borderRadius: 14, padding: "10px 12px", fontSize: 13 },
  warn: { border: "1px solid #fed7aa", background: "#fff7ed", color: "#9a3412", borderRadius: 14, padding: "10px 12px", fontSize: 13 },
  identityRow: { border: "1px solid #eef2f7", background: "#f8fafc", borderRadius: 14, padding: "12px 14px", display: "grid", gap: 4 },
  activity: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", border: "1px solid #eef2f7", background: "#f8fafc", borderRadius: 14, padding: "12px 14px", textDecoration: "none" },
  kind: { fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1, color: "#64748b" },
  date: { fontSize: 12, color: "#64748b", whiteSpace: "nowrap" },
  primaryButton: { border: "1px solid #1d4ed8", background: "#1d4ed8", color: "#ffffff", borderRadius: 12, padding: "10px 14px", fontWeight: 800, fontSize: 14 },
  secondaryButton: { border: "1px solid #d1d5db", background: "#ffffff", color: "#0f172a", borderRadius: 12, padding: "10px 14px", fontWeight: 800, fontSize: 13 },
  dangerButton: { border: "1px solid #fecdd3", background: "#fff1f2", color: "#be123c", borderRadius: 12, padding: "10px 14px", fontWeight: 800, fontSize: 13 },
  childCard: { border: "1px solid #eef2f7", background: "#f8fafc", borderRadius: 16, padding: 16, display: "grid", gap: 12 },
  chip: { display: "inline-flex", alignItems: "center", padding: "5px 10px", borderRadius: 999, background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8", fontSize: 12, fontWeight: 800 },
  field: { display: "grid", gap: 8 },
  label: { fontSize: 13, fontWeight: 800, color: "#0f172a" },
  input: { width: "100%", borderRadius: 12, border: "1px solid #d1d5db", background: "#ffffff", color: "#0f172a", padding: "10px 12px", fontSize: 14 },
  empty: { border: "1px dashed #cbd5e1", background: "#f8fafc", color: "#475569", borderRadius: 14, padding: "14px 12px", fontSize: 14, lineHeight: 1.6 },
  quickGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12 },
  quickLink: { textDecoration: "none", borderRadius: 14, border: "1px solid #d1d5db", background: "#ffffff", color: "#0f172a", padding: "14px 16px", textAlign: "center", fontWeight: 800, fontSize: 14 },
};
