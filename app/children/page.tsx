"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import {
  loadFamilyProfile,
  DEFAULT_FAMILY_PROFILE,
  type FamilyProfileRow as FamilyProfile,
} from "@/lib/familySettings";

type Child = {
  id: string;
  preferred_name?: string | null;
  first_name?: string | null;
  surname?: string | null;
  year_level?: number | null;
  created_at?: string | null;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export default function ChildrenPage() {
  const [profile, setProfile] = useState<FamilyProfile>(DEFAULT_FAMILY_PROFILE);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void init();
  }, []);

  async function init() {
    const p = await loadFamilyProfile();
    setProfile(p);

    try {
      const authResp = await supabase.auth.getUser();
      const userId = authResp.data.user?.id;

      if (!userId) {
        setChildren([]);
        return;
      }

      const linksResp = await supabase
        .from("parent_student_links")
        .select("student_id,sort_order,created_at")
        .eq("parent_user_id", userId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (linksResp.error) {
        console.error(linksResp.error);
        setChildren([]);
        return;
      }

      const links = ((linksResp.data ?? []) as Array<{
        student_id: string;
        sort_order?: number | null;
        created_at?: string | null;
      }>).filter((row) => safe(row.student_id));

      if (!links.length) {
        setChildren([]);
        return;
      }

      const ids = links.map((row) => row.student_id);
      const studentsResp = await supabase
        .from("students")
        .select("id,preferred_name,first_name,surname,year_level,created_at")
        .in("id", ids);

      if (studentsResp.error) {
        console.error(studentsResp.error);
        setChildren([]);
        return;
      }

      const students = ((studentsResp.data ?? []) as Child[]).filter((row) => safe(row.id));
      const orderedChildren = ids
        .map((id) => students.find((student) => student.id === id) || null)
        .filter((value): value is Child => value !== null);

      setChildren(orderedChildren);
    } finally {
      setLoading(false);
    }
  }

  async function setDefaultChild(id: string) {
    const updated = {
      ...profile,
      default_child_id: id,
    };

    await supabase.from("family_profiles").upsert(updated, { onConflict: "id" });
    setProfile(updated);
  }

  async function deleteChild(id: string) {
    if (!confirm("Remove this child from the family workspace?")) return;

    const authResp = await supabase.auth.getUser();
    const userId = authResp.data.user?.id;
    if (!userId) {
      alert("You must be signed in.");
      return;
    }

    const { error } = await supabase
      .from("parent_student_links")
      .delete()
      .eq("parent_user_id", userId)
      .eq("student_id", id);

    if (error) {
      alert("Remove failed");
      return;
    }

    setChildren((current) => current.filter((c) => c.id !== id));
  }

  if (loading) {
    return (
      <main style={styles.app}>
        <div style={styles.wrap}>Loading children...</div>
      </main>
    );
  }

  return (
    <main style={styles.app}>
      <div style={styles.wrap}>
        <div style={styles.header}>
          <div>
            <div style={styles.eyebrow}>Family</div>
            <h1 style={styles.h1}>Children</h1>
            <div style={styles.sub}>Manage children in your family learning workspace</div>
          </div>

          <Link href="/children/new" style={styles.primaryButton}>
            Add child
          </Link>
        </div>

        {children.length === 0 && (
          <div style={styles.emptyCard}>
            <div style={styles.emptyTitle}>No children added yet</div>
            <div style={styles.emptyText}>
              Start by adding your first child to begin building your family learning workspace.
            </div>
            <Link href="/children/new" style={styles.primaryButton}>
              Add your first child
            </Link>
          </div>
        )}

        <div style={styles.grid}>
          {children.map((c) => {
            const name = c.preferred_name || c.first_name || "Unnamed child";
            const isDefault = profile.default_child_id === c.id;

            return (
              <div key={c.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <div style={styles.cardTitle}>{name}</div>
                    {c.year_level ? <div style={styles.year}>Year {c.year_level}</div> : null}
                  </div>

                  {isDefault ? <span style={styles.defaultChip}>Default</span> : null}
                </div>

                <div style={styles.actions}>
                  <Link href={`/children/${c.id}`} style={styles.secondaryButton}>
                    Open
                  </Link>

                  {!isDefault ? (
                    <button style={styles.secondaryButton} onClick={() => void setDefaultChild(c.id)}>
                      Set default
                    </button>
                  ) : null}

                  <button style={styles.dangerButton} onClick={() => void deleteChild(c.id)}>
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: "100vh",
    background: "#f6f8fc",
    paddingBottom: 80,
  },
  wrap: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: 24,
    display: "grid",
    gap: 18,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 800,
    textTransform: "uppercase",
    color: "#64748b",
  },
  h1: {
    margin: 0,
    fontSize: 26,
    fontWeight: 900,
    color: "#0f172a",
  },
  sub: {
    fontSize: 14,
    color: "#64748b",
  },
  grid: {
    display: "grid",
    gap: 16,
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 18,
    display: "grid",
    gap: 12,
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 900,
  },
  year: {
    fontSize: 13,
    color: "#64748b",
  },
  defaultChip: {
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    color: "#166534",
  },
  actions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  primaryButton: {
    background: "#2563eb",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 10,
    textDecoration: "none",
    fontWeight: 700,
  },
  secondaryButton: {
    background: "#fff",
    border: "1px solid #d1d5db",
    padding: "8px 12px",
    borderRadius: 10,
    fontWeight: 700,
    cursor: "pointer",
  },
  dangerButton: {
    background: "#fff1f2",
    border: "1px solid #fecdd3",
    color: "#be123c",
    padding: "8px 12px",
    borderRadius: 10,
    fontWeight: 700,
    cursor: "pointer",
  },
  emptyCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 40,
    textAlign: "center",
    display: "grid",
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 900,
  },
  emptyText: {
    color: "#64748b",
  },
};
