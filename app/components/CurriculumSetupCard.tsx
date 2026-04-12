"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { CurriculumPreferences } from "@/lib/familySettings";
import {
  buildCanonicalCountryOptions,
  findCanonicalCountryLabel,
  findCanonicalFrameworkLabel,
  loadCanonicalCurriculumFrameworks,
  loadCanonicalCurriculumLevels,
  type CanonicalCurriculumFramework,
  type CanonicalCurriculumLevel,
} from "@/lib/curriculumCatalog";

type CurriculumSetupCardProps = {
  value: CurriculumPreferences;
  onChange: (curriculum: CurriculumPreferences) => void;
};

function safe(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export default function CurriculumSetupCard({
  value,
  onChange,
}: CurriculumSetupCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<CurriculumPreferences>(value);
  const [frameworks, setFrameworks] = useState<CanonicalCurriculumFramework[]>([]);
  const [levels, setLevels] = useState<CanonicalCurriculumLevel[]>([]);
  const [loadingFrameworks, setLoadingFrameworks] = useState(true);
  const [loadingLevels, setLoadingLevels] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadFrameworks() {
      setLoadingFrameworks(true);
      setLoadError("");

      try {
        const rows = await loadCanonicalCurriculumFrameworks();
        if (!active) return;
        setFrameworks(rows);
      } catch (error) {
        if (!active) return;
        console.error("loadCanonicalCurriculumFrameworks failed", error);
        setFrameworks([]);
        setLoadError(
          "Curriculum frameworks are not available yet. Add framework rows to the canonical curriculum tables to configure this family.",
        );
      } finally {
        if (!active) return;
        setLoadingFrameworks(false);
      }
    }

    void loadFrameworks();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isEditing) {
      setDraft(value);
    }
  }, [value, isEditing]);

  const countryOptions = useMemo(
    () => buildCanonicalCountryOptions(frameworks),
    [frameworks],
  );

  const frameworkOptions = useMemo(() => {
    const countryId = safe(draft.country_id).toLowerCase();
    if (!countryId) return [] as CanonicalCurriculumFramework[];

    return frameworks.filter(
      (framework) => safe(framework.country).toLowerCase() === countryId,
    );
  }, [draft.country_id, frameworks]);

  useEffect(() => {
    let active = true;
    const frameworkId = safe(draft.framework_id);

    if (!frameworkId) {
      setLevels([]);
      setLoadingLevels(false);
      return;
    }

    async function loadLevels() {
      setLoadingLevels(true);

      try {
        const rows = await loadCanonicalCurriculumLevels(frameworkId);
        if (!active) return;
        setLevels(rows);
      } catch (error) {
        if (!active) return;
        console.error("loadCanonicalCurriculumLevels failed", error);
        setLevels([]);
      } finally {
        if (!active) return;
        setLoadingLevels(false);
      }
    }

    void loadLevels();
    return () => {
      active = false;
    };
  }, [draft.framework_id]);

  const selectedFramework =
    frameworks.find((framework) => framework.id === safe(value.framework_id)) || null;
  const selectedLevel =
    levels.find((level) => level.id === safe(value.level_id)) || null;
  const selectedDraftFramework =
    frameworks.find((framework) => framework.id === safe(draft.framework_id)) || null;

  const hasSetup = Boolean(
    safe(value.country_id) || safe(value.framework_id) || safe(value.level_id),
  );

  function updateDraft<K extends keyof CurriculumPreferences>(
    key: K,
    nextValue: CurriculumPreferences[K],
  ) {
    setDraft((prev) => ({
      ...prev,
      [key]: nextValue,
    }));
  }

  function handleCountryChange(countryId: string) {
    updateDraft("country_id", countryId || null);
    updateDraft("framework_id", null);
    updateDraft("level_id", null);
    updateDraft("region_id", null);
    updateDraft("subject_ids", []);
  }

  function handleFrameworkChange(frameworkId: string) {
    updateDraft("framework_id", frameworkId || null);
    updateDraft("level_id", null);
    updateDraft("region_id", null);
    updateDraft("subject_ids", []);
  }

  function handleLevelChange(levelId: string) {
    updateDraft("level_id", levelId || null);
  }

  function handleApply() {
    onChange({
      ...draft,
      region_id: null,
      subject_ids: [],
      compliance_profile: {
        country: safe(draft.country_id).toLowerCase() || null,
        state: value.compliance_profile?.state || null,
        curriculum_framework: selectedDraftFramework?.name || null,
        compliance_mode: value.compliance_profile?.compliance_mode || null,
        template_version: value.compliance_profile?.template_version || null,
        required_fields: value.compliance_profile?.required_fields || [],
        recommended_fields: value.compliance_profile?.recommended_fields || [],
        optional_fields: value.compliance_profile?.optional_fields || [],
        custom_labels: value.compliance_profile?.custom_labels || {},
        last_reviewed_at: value.compliance_profile?.last_reviewed_at || null,
      },
    });
    setIsEditing(false);
    setStatusMessage("Curriculum setup updated for this family.");
    window.setTimeout(() => setStatusMessage(""), 4000);
  }

  function handleCancel() {
    setDraft(value);
    setIsEditing(false);
  }

  return (
    <section id="curriculum-setup" style={cardStyles.card}>
      <div style={cardStyles.header}>
        <div>
          <div style={cardStyles.eyebrow}>Curriculum setup</div>
          <div style={cardStyles.title}>Curriculum setup</div>
          <p style={cardStyles.description}>
            Choose the family&apos;s curriculum framework and level from the live curriculum mapper data.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {isEditing ? (
            <span style={cardStyles.editingBadge}>Editing</span>
          ) : (
            <button
              type="button"
              style={cardStyles.primaryButton}
              onClick={() => {
                setDraft(value);
                setIsEditing(true);
              }}
              disabled={loadingFrameworks || frameworks.length === 0}
            >
              {hasSetup ? "Edit curriculum setup" : "Set up curriculum"}
            </button>
          )}
        </div>
      </div>

      {statusMessage ? <div style={cardStyles.status}>{statusMessage}</div> : null}
      {loadError ? <div style={cardStyles.loading}>{loadError}</div> : null}

      {isEditing ? (
        loadingFrameworks ? (
          <div style={cardStyles.loading}>Loading curriculum frameworks...</div>
        ) : frameworks.length === 0 ? (
          <div style={cardStyles.empty}>
            <p>
              No canonical curriculum frameworks are available yet. Seed the curriculum tables first, then return here to choose the family framework.
            </p>
          </div>
        ) : (
          <div style={cardStyles.form}>
            <Field
              label="Country"
              help="Choose the country that matches your family learning context."
            >
              <select
                value={draft.country_id ?? ""}
                onChange={(event) => handleCountryChange(event.target.value)}
                style={cardStyles.input}
              >
                <option value="">Select a country</option>
                {countryOptions.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Framework"
              help="Frameworks are loaded from the canonical curriculum mapper tables."
            >
              <select
                value={draft.framework_id ?? ""}
                onChange={(event) => handleFrameworkChange(event.target.value)}
                style={cardStyles.input}
                disabled={!draft.country_id}
              >
                <option value="">Select a framework</option>
                {frameworkOptions.map((framework) => (
                  <option key={framework.id} value={framework.id}>
                    {framework.name}
                    {framework.version ? ` (${framework.version})` : ""}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Level"
              help="Levels are loaded from the selected framework."
            >
              <select
                value={draft.level_id ?? ""}
                onChange={(event) => handleLevelChange(event.target.value)}
                style={cardStyles.input}
                disabled={!draft.framework_id || loadingLevels}
              >
                <option value="">
                  {loadingLevels ? "Loading levels..." : "Select a level"}
                </option>
                {levels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.level_label}
                  </option>
                ))}
              </select>
            </Field>

            {!loadingLevels && draft.framework_id && levels.length === 0 ? (
              <div style={cardStyles.loading}>
                No levels are available yet for the selected framework.
              </div>
            ) : null}

            <div style={cardStyles.actions}>
              <button
                type="button"
                style={cardStyles.primaryButton}
                onClick={handleApply}
                disabled={!draft.country_id || !draft.framework_id || !draft.level_id}
              >
                Save curriculum setup
              </button>
              <button
                type="button"
                style={cardStyles.linkButton}
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        )
      ) : hasSetup ? (
        <div style={cardStyles.summary}>
          <Row
            label="Country"
            value={findCanonicalCountryLabel(frameworks, value.country_id)}
          />
          <Row
            label="Framework"
            value={findCanonicalFrameworkLabel(frameworks, value.framework_id)}
          />
          <Row
            label="Level"
            value={selectedLevel?.level_label || safe(value.level_id) || "Not set"}
          />
        </div>
      ) : (
        <div style={cardStyles.empty}>
          <p>
            Set your family curriculum so planning, capture, portfolio, and reporting can stay aligned.
          </p>
          <button
            type="button"
            style={cardStyles.secondaryButton}
            onClick={() => {
              setDraft(value);
              setIsEditing(true);
            }}
            disabled={loadingFrameworks || frameworks.length === 0}
          >
            Set up curriculum
          </button>
        </div>
      )}

      <div style={cardStyles.note}>
        Used to organise planning · captured learning · reports
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={cardStyles.summaryRow}>
      <span style={cardStyles.summaryLabel}>{label}</span>
      <span style={cardStyles.summaryValue}>{value}</span>
    </div>
  );
}

function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={cardStyles.field}>
      <div style={cardStyles.fieldLabel}>{label}</div>
      {children}
      {help ? <div style={cardStyles.fieldHelp}>{help}</div> : null}
    </div>
  );
}

const cardStyles: Record<string, React.CSSProperties> = {
  card: {
    background: "#ffffff",
    border: "1px solid #e4e7ec",
    borderRadius: 18,
    padding: 22,
    boxShadow: "0 12px 40px rgba(15,23,42,0.06)",
    display: "grid",
    gap: 18,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: "#64748b",
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 900,
    margin: 0,
  },
  description: {
    margin: "4px 0 0",
    fontSize: 14,
    lineHeight: 1.6,
    color: "#475569",
  },
  primaryButton: {
    background: "#1d4ed8",
    border: "1px solid #1d4ed8",
    color: "#ffffff",
    borderRadius: 12,
    padding: "10px 18px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  linkButton: {
    background: "transparent",
    border: "none",
    color: "#1d4ed8",
    fontWeight: 700,
    padding: "10px 12px",
    cursor: "pointer",
    fontSize: 14,
  },
  secondaryButton: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "10px 16px",
    fontSize: 14,
    fontWeight: 700,
    color: "#1f2937",
    cursor: "pointer",
  },
  status: {
    padding: "10px 12px",
    borderRadius: 14,
    background: "#ecfdf5",
    border: "1px solid #bbf7d0",
    color: "#166534",
    fontSize: 13,
  },
  summary: {
    display: "grid",
    gap: 10,
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    padding: "10px 0",
    borderBottom: "1px solid #f1f5f9",
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: "#6b7280",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 800,
    color: "#0f172a",
  },
  empty: {
    border: "1px dashed #d1d5db",
    borderRadius: 16,
    padding: 20,
    textAlign: "center",
    color: "#475569",
    background: "#fdfdfd",
    display: "grid",
    gap: 12,
  },
  note: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.1,
    color: "#94a3b8",
  },
  form: {
    display: "grid",
    gap: 16,
  },
  field: {
    display: "grid",
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: "#0f172a",
  },
  fieldHelp: {
    fontSize: 12,
    color: "#64748b",
  },
  input: {
    width: "100%",
    borderRadius: 12,
    border: "1px solid #cbd5f5",
    padding: "10px 12px",
    fontSize: 14,
    background: "#ffffff",
    color: "#0f172a",
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 10,
  },
  loading: {
    padding: "12px 14px",
    borderRadius: 14,
    background: "#f8fafc",
    border: "1px solid #e0e7ff",
    color: "#475569",
    fontSize: 13,
  },
  editingBadge: {
    background: "#e0f2fe",
    color: "#0f172a",
    borderRadius: 999,
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 700,
  },
};
