"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import SignOutButton from "@/app/components/SignOutButton";
import { PremiumPlan, getPremiumPlanFromStorage } from "@/lib/premiumUpgradeEngine";
import { FamilyProfileRow, loadFamilyProfile } from "@/lib/familySettings";
import { ReportDraftStatus } from "@/lib/reportDrafts";
import { hasSupabaseEnv, supabase } from "@/lib/supabaseClient";

type ProfileRow = {
  is_admin?: boolean | null;
  full_name?: string | null;
  name?: string | null;
  avatar_url?: string | null;
};

type ProfileChild = {
  id: string;
  name: string;
  yearLabel: string;
  connectedAt?: string | null;
};

type EvidenceEntry = {
  id: string;
  student_id: string | null;
  learning_area?: string | null;
  occurred_on?: string | null;
  created_at?: string | null;
  note?: string | null;
  title?: string | null;
};

type ReportActivity = {
  id: string;
  title: string;
  childName: string;
  status: ReportDraftStatus;
  updatedAt?: string | null;
};

const MAX_RECENT_ACTIVITY = 4;

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profileRow, setProfileRow] = useState<ProfileRow | null>(null);
  const [familyProfile, setFamilyProfile] = useState<FamilyProfileRow | null>(null);
  const [children, setChildren] = useState<ProfileChild[]>([]);
  const [recentEvidence, setRecentEvidence] = useState<EvidenceEntry[]>([]);
  const [recentReports, setRecentReports] = useState<ReportActivity[]>([]);
  const [plan, setPlan] = useState<PremiumPlan>("free");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setPlan(getPremiumPlanFromStorage());
  }, []);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      if (!hasSupabaseEnv) {
        if (!mounted) return;
        setError("Supabase is not configured for this preview environment.");
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase.auth.getUser();
        const currentUser = data.user;
        if (!mounted) return;
        if (!currentUser) {
          setError("Sign in to view your profile.");
          setLoading(false);
          return;
        }

        setUser(currentUser);

        const [profile, familyRow] = await Promise.all([
          fetchProfileRow(currentUser.id),
          loadFamilyProfile(),
        ]);

        if (!mounted) return;
        setProfileRow(profile);
        setFamilyProfile(familyRow);

        const connected = await loadLinkedChildren(currentUser.id);
        if (!mounted) return;
        setChildren(connected);

        const childIds = connected.map((child) => child.id);
        const [evidenceRows, reportRows] = await Promise.all([
          childIds.length ? fetchRecentEvidence(childIds) : Promise.resolve([]),
          fetchRecentReports(currentUser.id),
        ]);

        if (!mounted) return;
        setRecentEvidence(evidenceRows);
        setRecentReports(reportRows);
      } catch (err) {
        console.error("Profile page load failed", err);
        if (!mounted) return;
        setError("We could not load your profile right now. Try again shortly.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    hydrate();

    return () => {
      mounted = false;
    };
  }, []);

  const roleLabel = profileRow?.is_admin ? "Admin" : "Family member";
  const displayName = useMemo(() => {
    if (!user && !profileRow) return "EduDecks user";
    const source =
      profileRow?.full_name ||
      profileRow?.name ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name;
    return typeof source === "string" && source.trim().length > 0
      ? source
      : user?.email || "EduDecks user";
  }, [profileRow, user]);

  const defaultChild = useMemo(() => {
    if (!familyProfile) return null;
    return children.find((child) => child.id === familyProfile.default_child_id) ?? null;
  }, [children, familyProfile]);

  const evidenceByChild = useMemo(() => {
    const map: Record<string, EvidenceEntry[]> = {};
    recentEvidence.forEach((entry) => {
      const studentId = entry.student_id;
      if (!studentId) return;
      if (!map[studentId]) map[studentId] = [];
      map[studentId].push(entry);
    });
    return map;
  }, [recentEvidence]);

  const evidenceNote = (childId: string) => {
    const entries = evidenceByChild[childId] ?? [];
    if (!entries.length) {
      return "No captures yet";
    }
    const latest = entries[0];
    return `Latest capture ${formatDate(latest.created_at)}`;
  };

  const planLabel = plan === "premium" ? "EduDecks Premium" : "Family free plan";
  const planDescription =
    plan === "premium"
      ? "Premium is active across this family."
      : "Stay calm with the free plan. Upgrade anytime for richer reporting together.";

  return (
    <FamilyTopNavShell
      hideHero
      workflowCurrentHref="/profile"
      workflowHelperText="View your identity, family links, and account status."
    >
      <div style={profileStyles.page}>
        <section style={profileStyles.headerCard}>
          <div>
            <div style={profileStyles.sectionEyebrow}>My profile</div>
            <h1 style={profileStyles.headerTitle}>Keep your family connected</h1>
            <p style={profileStyles.headerText}>
              This page summarises who is signed in, the learners you are connected to, and the
              plan that powers your quiet, calm homeschooling workflow.
            </p>
          </div>
          <div style={profileStyles.identityChip}>
            <div style={profileStyles.avatar}>
              {displayName
                .split(" ")
                .filter(Boolean)
                .map((chunk) => chunk[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div style={{ display: "grid", gap: 4 }}>
              <div style={profileStyles.displayName}>{displayName}</div>
              <div style={profileStyles.roleLabel}>{roleLabel}</div>
              {user?.email ? (
                <div style={profileStyles.emailText}>{user.email}</div>
              ) : null}
            </div>
          </div>
          <div style={profileStyles.defaultChildRow}>
            <span style={profileStyles.subtleText}>Default child:</span>
            <strong style={{ fontSize: 14, color: "#0f172a" }}>
              {defaultChild ? `${defaultChild.name} (${defaultChild.yearLabel})` : "Not set"}
            </strong>
          </div>
          {error ? (
            <div style={profileStyles.errorBanner}>{error}</div>
          ) : null}
        </section>

        <div style={profileStyles.sectionGrid}>
          <section style={profileStyles.card}>
            <div style={profileStyles.sectionHeader}>
              <div>
                <div style={profileStyles.sectionTitle}>Child & family links</div>
                <div style={profileStyles.sectionText}>
                  These learners stay connected to your planner, capture, and reporting work.
                </div>
              </div>
              <Link href="/children" style={profileStyles.secondaryLink}>
                Manage children
              </Link>
            </div>

            {loading ? (
              <div style={profileStyles.placeholderText}>Loading child data…</div>
            ) : children.length ? (
              <div style={profileStyles.childGrid}>
                {children.map((child) => (
                  <div key={child.id} style={profileStyles.childCard}>
                    <div style={profileStyles.childName}>{child.name}</div>
                    <div style={profileStyles.childMeta}>{child.yearLabel}</div>
                    <div style={profileStyles.childMeta}>{evidenceNote(child.id)}</div>
                    {child.connectedAt ? (
                      <div style={profileStyles.subtleText}>
                        Connected on {formatDate(child.connectedAt)}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div style={profileStyles.placeholder}>
                No linked children yet. Connect a learner so capture, reporting, and planning stay
                aligned.
              </div>
            )}
          </section>

          <section style={profileStyles.card}>
            <div style={profileStyles.sectionHeader}>
              <div>
                <div style={profileStyles.sectionTitle}>Subscription & plan</div>
                <div style={profileStyles.sectionText}>
                  This plan label helps EduDecks shape premium prompts and confidence-building
                  nudges.
                </div>
              </div>
              <Link href="/pricing" style={profileStyles.secondaryLink}>
                View plans
              </Link>
            </div>

            <div style={profileStyles.planTitle}>{planLabel}</div>
            <div style={profileStyles.planDescription}>{planDescription}</div>
            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/settings" style={profileStyles.primaryAction}>
                Adjust settings
              </Link>
              <Link href="/settings?section=curriculum" style={profileStyles.secondaryAction}>
                Edit curriculum setup
              </Link>
            </div>
          </section>
        </div>

        <section style={profileStyles.card}>
          <div style={profileStyles.sectionHeader}>
            <div>
              <div style={profileStyles.sectionTitle}>Recent activity</div>
              <div style={profileStyles.sectionText}>
                These are the latest captures and reports that help you keep the story calm and
                organised.
              </div>
            </div>
          </div>

          <div style={profileStyles.activityGrid}>
            <div>
              <div style={profileStyles.activityLabel}>Recent captures</div>
              {recentEvidence.length ? (
                recentEvidence.map((entry) => (
                  <div key={entry.id} style={profileStyles.activityRow}>
                    <div style={{ display: "grid", gap: 4 }}>
                      <strong style={{ fontSize: 15, color: "#0f172a" }}>
                        {lookupChildName(entry.student_id, children) || "Capture"}
                      </strong>
                      <span style={profileStyles.subtleText}>
                        {entry.learning_area || "Learning moment"} · {formatDate(entry.created_at)}
                      </span>
                      <span style={profileStyles.activityNote}>{entry.note || entry.title || ""}</span>
                    </div>
                    <Link href="/capture" style={profileStyles.inlineLink}>
                      View capture
                    </Link>
                  </div>
                ))
              ) : (
                <div style={profileStyles.placeholder}>
                  No captures yet. Add a calm learning moment and it will appear here.
                </div>
              )}
            </div>

            <div>
              <div style={profileStyles.activityLabel}>Recent report drafts</div>
              {recentReports.length ? (
                recentReports.map((report) => (
                  <div key={report.id} style={profileStyles.activityRow}>
                    <div style={{ display: "grid", gap: 4 }}>
                      <strong style={{ fontSize: 15, color: "#0f172a" }}>{report.title}</strong>
                      <span style={profileStyles.subtleText}>
                        {report.childName || "Child"} · {report.status}
                      </span>
                      <span style={profileStyles.subtleText}>
                        Last updated {formatDate(report.updatedAt)}
                      </span>
                    </div>
                    <Link href="/reports" style={profileStyles.inlineLink}>
                      Open reports
                    </Link>
                  </div>
                ))
              ) : (
                <div style={profileStyles.placeholder}>
                  No report drafts yet. Save one when you are ready and it will appear here.
                </div>
              )}
            </div>
          </div>
        </section>

        <section style={profileStyles.card}>
          <div style={profileStyles.sectionHeader}>
            <div>
              <div style={profileStyles.sectionTitle}>Quick actions</div>
              <div style={profileStyles.sectionText}>
                Access the areas where you change your profile, curriculum, or sign out.
              </div>
            </div>
          </div>

          <div style={profileStyles.quickActions}>
            <Link href="/settings" style={profileStyles.quickLink}>
              Go to settings
            </Link>
            <Link href="/settings?section=curriculum" style={profileStyles.quickLink}>
              Curriculum setup
            </Link>
            <Link href="/family" style={profileStyles.quickLink}>
              Family snapshot
            </Link>
            <SignOutButton label="Sign out" />
          </div>

          <div style={profileStyles.usedNote}>
            This setup quietly organises planning, captured learning, and reporting across EduDecks.
          </div>
        </section>
      </div>
    </FamilyTopNavShell>
  );
}

function lookupChildName(studentId: string | null, children: ProfileChild[]) {
  if (!studentId) return null;
  return children.find((child) => child.id === studentId)?.name ?? null;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const candidate = new Date(value);
  if (Number.isNaN(candidate.getTime())) return value.slice(0, 10);
  return candidate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function fetchProfileRow(userId: string): Promise<ProfileRow | null> {
  const { data } = await supabase
    .from("profiles")
    .select("is_admin,full_name,name,avatar_url")
    .eq("id", userId)
    .maybeSingle();
  return data ?? null;
}

async function loadLinkedChildren(userId: string): Promise<ProfileChild[]> {
  const { data: links } = await supabase
    .from("parent_student_links")
    .select("student_id,created_at")
    .eq("parent_user_id", userId)
    .order("created_at", { ascending: true });

  if (!links?.length) return [];
  const orderedIds: string[] = [];
  const seen = new Set<string>();

  links.forEach((link) => {
    const studentId = link.student_id;
    if (!studentId || seen.has(studentId)) return;
    seen.add(studentId);
    orderedIds.push(studentId);
  });

  if (!orderedIds.length) return [];

  const { data: students } = await supabase
    .from("students")
    .select("id,preferred_name,first_name,surname,family_name,year_level")
    .in("id", orderedIds);

  if (!students?.length) return [];

  const studentMap = new Map<string, typeof students[0]>();
  students.forEach((student) => {
    if (student?.id) {
      studentMap.set(student.id, student);
    }
  });

  return orderedIds
    .map((id) => {
      const student = studentMap.get(id);
      if (!student) return null;
      const name =
        safeName(student.preferred_name) ||
        [safeName(student.first_name), safeName(student.surname), safeName(student.family_name)]
          .filter(Boolean)
          .join(" ")
          .trim() ||
        "Unnamed child";
      const yearLabel = Number.isFinite(Number(student.year_level))
        ? `Year ${student.year_level}`
        : "Year level";
      const linkRow = links.find((row) => row.student_id === id);
      return {
        id,
        name,
        yearLabel,
        connectedAt: linkRow?.created_at ?? null,
      };
    })
    .filter((child): child is ProfileChild => Boolean(child));
}

async function fetchRecentEvidence(studentIds: string[]): Promise<EvidenceEntry[]> {
  const { data } = await supabase
    .from("evidence_entries")
    .select("id,student_id,learning_area,occurred_on,created_at,note,title")
    .in("student_id", studentIds)
    .order("created_at", { ascending: false })
    .limit(MAX_RECENT_ACTIVITY);

  return data ?? [];
}

async function fetchRecentReports(userId: string): Promise<ReportActivity[]> {
  const { data } = await supabase
    .from("report_drafts")
    .select("id,title,status,child_name,updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(3);

  if (!data?.length) return [];

  return data.map((row) => ({
    id: row.id,
    title: row.title || "Report draft",
    childName: row.child_name || "Child",
    status: (row.status as ReportDraftStatus) ?? "draft",
    updatedAt: row.updated_at,
  }));
}

function safeName(value: string | undefined | null) {
  if (!value) return "";
  return value.trim();
}

const profileStyles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 1120,
    margin: "0 auto",
    display: "grid",
    gap: 18,
    paddingBottom: 60,
  },

  headerCard: {
    borderRadius: 20,
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    padding: "28px 32px",
    display: "grid",
    gap: 14,
    position: "relative",
    overflow: "hidden",
  },

  sectionEyebrow: {
    fontSize: 12,
    lineHeight: 1.2,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontWeight: 800,
    color: "#64748b",
  },

  headerTitle: {
    margin: 0,
    fontSize: 28,
    fontWeight: 900,
    color: "#0f172a",
  },

  headerText: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.7,
    color: "#475569",
  },

  identityChip: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    justifyContent: "space-between",
    flexWrap: "wrap",
  },

  avatar: {
    width: 54,
    height: 54,
    borderRadius: "50%",
    background: "#dbeafe",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    fontWeight: 900,
    color: "#1d4ed8",
  },

  displayName: {
    fontSize: 18,
    fontWeight: 900,
  },

  roleLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: "#2563eb",
  },

  emailText: {
    fontSize: 13,
    color: "#475569",
  },

  errorBanner: {
    marginTop: 10,
    padding: "10px 14px",
    borderRadius: 12,
    background: "#fff7ed",
    border: "1px solid #fde68a",
    color: "#92400e",
    fontSize: 13,
  },

  sectionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 18,
  },

  card: {
    borderRadius: 20,
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    padding: 24,
    display: "grid",
    gap: 16,
    boxShadow: "0 18px 50px rgba(15,23,42,0.06)",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 900,
    color: "#0f172a",
  },

  sectionText: {
    fontSize: 13,
    color: "#475569",
    maxWidth: 500,
  },

  secondaryLink: {
    textDecoration: "none",
    padding: "8px 12px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "#f8fafc",
    fontWeight: 700,
    color: "#0f172a",
    fontSize: 13,
  },

  childGrid: {
    display: "grid",
    gap: 12,
  },

  childCard: {
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    padding: 14,
    background: "#fdfdfd",
    display: "grid",
    gap: 6,
  },

  childName: {
    fontSize: 16,
    fontWeight: 900,
    color: "#0f172a",
  },

  childMeta: {
    fontSize: 13,
    color: "#475569",
  },

  subtleText: {
    fontSize: 12,
    color: "#64748b",
  },

  defaultChildRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },

  placeholder: {
    fontSize: 14,
    color: "#475569",
    padding: "14px 12px",
    borderRadius: 12,
    border: "1px dashed #cbd5f5",
    background: "#f8fafc",
  },

  placeholderText: {
    fontSize: 14,
    color: "#475569",
    fontStyle: "italic",
  },

  planTitle: {
    fontSize: 20,
    fontWeight: 900,
    color: "#0f172a",
  },

  planDescription: {
    fontSize: 14,
    color: "#475569",
  },

  primaryAction: {
    textDecoration: "none",
    borderRadius: 12,
    border: "none",
    background: "#2563eb",
    color: "#ffffff",
    padding: "10px 16px",
    fontWeight: 700,
    fontSize: 14,
  },

  secondaryAction: {
    textDecoration: "none",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#0f172a",
    padding: "10px 16px",
    fontWeight: 700,
    fontSize: 14,
  },

  activityGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 16,
  },

  activityLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: "#64748b",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 10,
  },

  activityRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    marginBottom: 10,
  },

  activityNote: {
    fontSize: 14,
    color: "#475569",
  },

  inlineLink: {
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 700,
    color: "#2563eb",
  },

  quickActions: {
    display: "grid",
    gap: 10,
    marginTop: 10,
  },

  quickLink: {
    textDecoration: "none",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    padding: "10px 14px",
    fontWeight: 700,
    color: "#0f172a",
    background: "#ffffff",
    display: "inline-flex",
    justifyContent: "center",
    width: "100%",
    maxWidth: 260,
  },

  usedNote: {
    marginTop: 14,
    fontSize: 12,
    color: "#475569",
    opacity: 0.85,
  },
};
