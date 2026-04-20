"use client";

import dynamic from "next/dynamic";
import React, { useEffect, useMemo, useState } from "react";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";
import {
  DEFAULT_FAMILY_SETTINGS,
  type FamilySettings,
  persistSettingsToLocalStorage,
} from "@/lib/familySettings";
import { saveFamilyWorkspaceSettings } from "@/lib/familyWorkspace";

const CurriculumSetupCard = dynamic(
  () => import("@/app/components/CurriculumSetupCard"),
  {
    ssr: false,
    loading: () => (
      <div style={styles.loadingCard}>
        Loading curriculum and compliance controls...
      </div>
    ),
  },
);

function curriculumCountryLabel(settings: FamilySettings) {
  const profileCountry = settings.curriculum_preferences.compliance_profile?.country;
  if (profileCountry === "au") return "Australia";
  if (profileCountry === "uk") return "United Kingdom";
  if (profileCountry === "us") return "United States";

  const raw = String(settings.curriculum_preferences.country_id ?? "").trim();
  if (raw === "au") return "Australia";
  if (raw === "uk") return "United Kingdom";
  if (raw === "us") return "United States";
  return raw || "Not set";
}

function curriculumFrameworkLabel(settings: FamilySettings) {
  const profileFramework =
    settings.curriculum_preferences.compliance_profile?.curriculum_framework;
  if (profileFramework) return profileFramework;

  const raw = String(settings.curriculum_preferences.framework_id ?? "").trim();
  if (!raw) return "Not set";
  if (/acara|australian/i.test(raw)) return "Australian Curriculum / ACARA";
  if (/common-core/i.test(raw)) return "Common Core";
  return raw;
}

function curriculumStateLabel(settings: FamilySettings) {
  const state = settings.curriculum_preferences.compliance_profile?.state;
  if (!state) return "Not set";
  return (
    {
      act: "Australian Capital Territory",
      nsw: "New South Wales",
      nt: "Northern Territory",
      qld: "Queensland",
      sa: "South Australia",
      tas: "Tasmania",
      vic: "Victoria",
      wa: "Western Australia",
    }[state] || state
  );
}

async function withTimeout<T>(
  promise: Promise<T>,
  label: string,
  ms = 30000,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`${label} timed out after ${ms}ms.`));
        }, ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export default function FamilySettingsPage() {
  const {
    workspace,
    loading: workspaceLoading,
    error: workspaceError,
    setWorkspacePatch,
    setActiveLearner,
  } = useFamilyWorkspace();

  const [settings, setSettings] = useState<FamilySettings>(() => ({
    ...DEFAULT_FAMILY_SETTINGS,
    ...workspace.profile,
    default_child_id: workspace.profile.default_child_id || workspace.learners[0]?.id || null,
  }));
  const [initialSettings, setInitialSettings] = useState<FamilySettings>(() => ({
    ...DEFAULT_FAMILY_SETTINGS,
    ...workspace.profile,
    default_child_id: workspace.profile.default_child_id || workspace.learners[0]?.id || null,
  }));
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState("");
  const [storageMode, setStorageMode] = useState<"database" | "local">("local");
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [hasPendingEdits, setHasPendingEdits] = useState(false);

  useEffect(() => {
    const nextSettings: FamilySettings = {
      ...DEFAULT_FAMILY_SETTINGS,
      ...workspace.profile,
      default_child_id: workspace.profile.default_child_id || workspace.learners[0]?.id || null,
    };

    setStorageMode(workspace.storageMode);
    setLoadError(workspaceError);

    if (!hasPendingEdits) {
      setSettings(nextSettings);
      setInitialSettings(nextSettings);
    }
  }, [workspace, workspaceError, hasPendingEdits]);

  const isDirty = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(initialSettings),
    [settings, initialSettings],
  );

  function update<K extends keyof FamilySettings>(key: K, value: FamilySettings[K]) {
    setHasPendingEdits(true);
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    const startedAt = Date.now();
    setSaving(true);
    setSaveError("");

    try {
      persistSettingsToLocalStorage(settings);

      const saved = await withTimeout(
        saveFamilyWorkspaceSettings(settings),
        "settings save",
      );

      const merged: FamilySettings = {
        ...DEFAULT_FAMILY_SETTINGS,
        ...saved,
        default_child_id:
          saved.default_child_id || settings.default_child_id || workspace.learners[0]?.id || null,
      };

      setStorageMode("database");
      setSettings(merged);
      setInitialSettings(merged);
      setWorkspacePatch({
        profile: saved,
        storageMode: "database",
        userId: workspace.userId,
      });
      persistSettingsToLocalStorage(merged);
      if (merged.default_child_id) {
        setActiveLearner(merged.default_child_id);
      }
      setHasPendingEdits(false);
      setSavedAt(new Date().toLocaleString());
    } catch (err) {
      console.error("settings.handleSave error", {
        durationMs: Date.now() - startedAt,
        err,
      });

      const message =
        err instanceof Error && err.message
          ? err.message
          : "The curriculum settings could not be updated in the database.";

      setStorageMode(workspace.storageMode);
      setHasPendingEdits(true);
      setSavedAt("");
      setSaveError(`Database save failed: ${message}`);
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setSettings((prev) => ({
      ...prev,
      curriculum_preferences: DEFAULT_FAMILY_SETTINGS.curriculum_preferences,
    }));
    setHasPendingEdits(true);
    setSavedAt("");
    setSaveError("");
  }

  return (
    <FamilyTopNavShell title="EduDecks Family" subtitle="Settings" hideHero={true}>
      <main style={styles.app}>
        <div style={styles.wrap}>
          <section style={styles.hero}>
            <div style={{ display: "grid", gap: 12 }}>
              <div style={styles.eyebrow}>Curriculum settings</div>
              <h1 style={styles.h1}>Define your family&apos;s curriculum setup</h1>
              <p style={styles.heroText}>
                Keep planning, capture, portfolio, and reporting aligned with the curriculum
                framework and compliance context your family uses.
              </p>

              <div style={styles.heroChips}>
                <span style={styles.chip}>
                  Country: {curriculumCountryLabel(settings)}
                </span>
                <span style={styles.chip}>
                  Framework: {curriculumFrameworkLabel(settings)}
                </span>
                <span style={styles.chip}>
                  Compliance:{" "}
                  {settings.curriculum_preferences.compliance_profile?.compliance_mode || "Not set"}
                </span>
              </div>

              {workspaceLoading ? (
                <div style={styles.inlineNote}>
                  Refreshing the latest curriculum settings in the background...
                </div>
              ) : null}
              {loadError ? <div style={styles.warningBanner}>{loadError}</div> : null}
              {saveError ? <div style={styles.warningBanner}>{saveError}</div> : null}
            </div>
          </section>

          <section id="curriculum" style={styles.curriculumCard}>
            <div style={styles.curriculumHeader}>
              <div style={styles.eyebrow}>Curriculum</div>
              <h2 style={styles.sectionTitle}>Curriculum setup</h2>
              <p style={styles.helperText}>
                Set the framework, jurisdiction, and compliance settings that should anchor your
                family workspace.
              </p>
            </div>

            {savedAt && !saveError ? (
              <div style={styles.successBanner}>
                Curriculum settings were saved to your family profile.
              </div>
            ) : null}

            <CurriculumSetupCard
              value={settings.curriculum_preferences}
              onChange={(curriculum_preferences) =>
                update("curriculum_preferences", curriculum_preferences)
              }
            />

            <div style={styles.savedSummary}>
              <SummaryRow label="Country" value={curriculumCountryLabel(settings)} />
              <SummaryRow label="State / territory" value={curriculumStateLabel(settings)} />
              <SummaryRow
                label="Curriculum framework"
                value={curriculumFrameworkLabel(settings)}
              />
              <SummaryRow
                label="Compliance mode"
                value={
                  settings.curriculum_preferences.compliance_profile?.compliance_mode || "Not set"
                }
              />
            </div>
          </section>
        </div>

        <div style={styles.stickyBar}>
          <div style={{ display: "grid", gap: 4 }}>
            <div style={styles.stickyTitle}>
              {saveError
                ? "Curriculum settings could not be saved to the database."
                : isDirty
                  ? "You have unsaved curriculum changes."
                  : savedAt
                    ? "Curriculum settings were saved successfully."
                    : "Curriculum settings are up to date."}
            </div>
            <div style={styles.stickySub}>
              {saveError
                ? saveError
                : savedAt
                  ? `Last saved ${savedAt}`
                  : storageMode === "database"
                    ? "These settings stay in sync across planning, capture, portfolio, and reports."
                    : "Changes will stay local until signed-in database storage is available."}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" onClick={handleReset} style={styles.secondaryButton}>
              Reset curriculum defaults
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{
                ...styles.primaryButton,
                opacity: saving || (!isDirty && !saveError) ? 0.7 : 1,
                cursor: saving ? "wait" : !isDirty && !saveError ? "default" : "pointer",
              }}
              disabled={saving || (!isDirty && !saveError)}
            >
              {saving ? "Saving..." : "Save curriculum settings"}
            </button>
          </div>
        </div>
      </main>
    </FamilyTopNavShell>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.summaryRow}>
      <div style={styles.summaryKey}>{label}</div>
      <div style={styles.summaryValue}>{value}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: "100vh",
    background: "#f6f8fc",
    color: "#1f2937",
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    paddingBottom: 120,
  },
  wrap: {
    maxWidth: 960,
    margin: "0 auto",
    padding: 24,
    display: "grid",
    gap: 18,
  },
  loadingCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 24,
    boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
    fontSize: 14,
    color: "#64748b",
  },
  hero: {
    background: "linear-gradient(135deg, rgba(79,124,240,0.08) 0%, rgba(139,124,246,0.05) 100%)",
    border: "1px solid #dbeafe",
    borderRadius: 24,
    padding: "22px 22px",
    display: "grid",
    gap: 12,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: "#64748b",
  },
  h1: {
    margin: 0,
    fontSize: 28,
    lineHeight: 1.15,
    fontWeight: 900,
    color: "#0f172a",
  },
  heroText: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.65,
    color: "#475569",
    maxWidth: 720,
  },
  heroChips: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 800,
    background: "#ffffff",
    border: "1px solid #dbeafe",
    color: "#334155",
  },
  inlineNote: {
    fontSize: 13,
    color: "#64748b",
  },
  warningBanner: {
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    color: "#9a3412",
    borderRadius: 14,
    padding: "10px 12px",
    fontSize: 13,
    lineHeight: 1.5,
    fontWeight: 600,
  },
  successBanner: {
    background: "#ecfdf5",
    border: "1px solid #bbf7d0",
    color: "#166534",
    borderRadius: 14,
    padding: "10px 12px",
    fontSize: 13,
    lineHeight: 1.5,
    fontWeight: 600,
  },
  curriculumCard: {
    background: "#ffffff",
    border: "1px solid #bfdbfe",
    borderRadius: 18,
    boxShadow: "0 14px 36px rgba(37,99,235,0.08)",
    display: "grid",
    gap: 16,
    padding: 18,
  },
  curriculumHeader: {
    display: "grid",
    gap: 6,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 900,
    color: "#0f172a",
  },
  helperText: {
    margin: 0,
    fontSize: 13,
    lineHeight: 1.6,
    color: "#64748b",
  },
  savedSummary: {
    display: "grid",
    gap: 0,
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    background: "#f8fafc",
    padding: "4px 14px",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    padding: "10px 0",
    borderBottom: "1px solid #e5e7eb",
  },
  summaryKey: {
    fontSize: 13,
    color: "#64748b",
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: 800,
    color: "#0f172a",
    textAlign: "right",
  },
  stickyBar: {
    position: "fixed",
    left: 20,
    right: 20,
    bottom: 20,
    zIndex: 30,
    maxWidth: 960,
    margin: "0 auto",
    background: "rgba(255,255,255,0.94)",
    backdropFilter: "blur(14px)",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: "14px 16px",
    boxShadow: "0 18px 50px rgba(15,23,42,0.12)",
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    alignItems: "center",
    flexWrap: "wrap",
  },
  stickyTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: "#0f172a",
  },
  stickySub: {
    fontSize: 12,
    color: "#64748b",
  },
  primaryButton: {
    background: "#2563eb",
    color: "#ffffff",
    border: "1px solid #2563eb",
    borderRadius: 10,
    padding: "10px 14px",
    fontWeight: 700,
    fontSize: 14,
    textDecoration: "none",
  },
  secondaryButton: {
    background: "#ffffff",
    color: "#1f2937",
    border: "1px solid #d1d5db",
    borderRadius: 10,
    padding: "10px 14px",
    fontWeight: 700,
    fontSize: 14,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
};
