"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import {
  loadFamilyProfile,
  DEFAULT_FAMILY_PROFILE,
  type FamilyProfile,
} from "@/lib/familySettings";

/* ============================================================
   TYPES
   ============================================================ */

type Child = {
  id: string;
  preferred_name?: string | null;
  first_name?: string | null;
  surname?: string | null;
  year_level?: number | null;
  created_at?: string | null;
};

/* ============================================================
   PAGE
   ============================================================ */

export default function ChildrenPage() {
  const [profile, setProfile] =
    useState<FamilyProfile>(DEFAULT_FAMILY_PROFILE);

  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const p = await loadFamilyProfile();
    setProfile(p);

    const { data, error } = await supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
    }

    setChildren(data || []);
    setLoading(false);
  }

  async function setDefaultChild(id: string) {
    const updated = {
      ...profile,
      default_child_id: id,
    };

    await supabase
      .from("family_profiles")
      .upsert(updated, { onConflict: "id" });

    setProfile(updated);
  }

  async function deleteChild(id: string) {
    if (!confirm("Remove this child from the family workspace?"))
      return;

    const { error } = await supabase
      .from("students")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Delete failed");
      return;
    }

    setChildren(children.filter((c) => c.id !== id));
  }

  if (loading) {
    return (
      <main style={styles.app}>
        <div style={styles.wrap}>Loading children…</div>
      </main>
    );
  }

  return (
    <main style={styles.app}>
      <div style={styles.wrap}>
        {/* HEADER */}

        <div style={styles.header}>
          <div>
            <div style={styles.eyebrow}>Family</div>
            <h1 style={styles.h1}>Children</h1>
            <div style={styles.sub}>
              Manage children in your learning workspace
            </div>
          </div>

          <Link href="/children/new" style={styles.primaryButton}>
            Add child
          </Link>
        </div>

        {/* EMPTY STATE */}

        {children.length === 0 && (
          <div style={styles.emptyCard}>
            <div style={styles.emptyTitle}>
              No children added yet
            </div>

            <div style={styles.emptyText}>
              Add a child to begin capturing evidence,
              building portfolios, and creating reports.
            </div>

            <Link href="/children/new" style={styles.primaryButton}>
              Add your first child
            </Link>
          </div>
        )}

        {/* LIST */}

        <div style={styles.grid}>
          {children.map((c) => {
            const name =
              c.preferred_name ||
              c.first_name ||
              "Unnamed child";

            const isDefault =
              profile.default_child_id === c.id;

            return (
              <div key={c.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <div style={styles.cardTitle}>
                      {name}
                    </div>

                    {c.year_level && (
                      <div style={styles.year}>
                        Year {c.year_level}
                      </div>
                    )}
                  </div>

                  {isDefault && (
                    <span style={styles.defaultChip}>
                      Default
                    </span>
                  )}
                </div>

                <div style={styles.actions}>
                  <Link
                    href={`/children/${c.id}`}
                    style={styles.secondaryButton}
                  >
                    Open
                  </Link>

                  {!isDefault && (
                    <button
                      style={styles.secondaryButton}
                      onClick={() => setDefaultChild(c.id)}
                    >
                      Set default
                    </button>
                  )}

                  <button
                    style={styles.dangerButton}
                    onClick={() => deleteChild(c.id)}
                  >
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

/* ============================================================
   STYLES
   ============================================================ */

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
    gridTemplateColumns:
      "repeat(auto-fill, minmax(260px, 1fr))",
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