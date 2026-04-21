"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { CurriculumPreferences } from "@/lib/familySettings";
import {
  buildCanonicalMarketOptions,
  findCanonicalJurisdictionLabel,
  findCanonicalCountryLabel,
  findCanonicalFrameworkLabel,
  loadCanonicalCurriculumFrameworks,
  loadCanonicalCurriculumJurisdictions,
  loadCanonicalCurriculumLevels,
  type CanonicalCurriculumFramework,
  type CanonicalCurriculumJurisdiction,
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
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showUnavailableState, setShowUnavailableState] = useState(false);
  const [draft, setDraft] = useState<CurriculumPreferences>(value);
  const [frameworks, setFrameworks] = useState<CanonicalCurriculumFramework[]>([]);
  const [jurisdictions, setJurisdictions] = useState<CanonicalCurriculumJurisdiction[]>([]);
  const [levels, setLevels] = useState<CanonicalCurriculumLevel[]>([]);
  const [loadingFrameworks, setLoadingFrameworks] = useState(true);
  const [loadingJurisdictions, setLoadingJurisdictions] = useState(false);
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
          "Curriculum options are not available yet for this family. You cannot complete curriculum setup until framework data is available.",
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

  useEffect(() => {
    if (!isEditing || !editorRef.current) return;
    editorRef.current.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [isEditing]);

  useEffect(() => {
    if (!loadingFrameworks && frameworks.length > 0) {
      setShowUnavailableState(false);
    }
  }, [frameworks.length, loadingFrameworks]);

  const marketOptions = useMemo(
    () => buildCanonicalMarketOptions(frameworks),
    [frameworks],
  );

  const frameworkOptions = useMemo(() => {
    const marketId = safe(draft.country_id).toLowerCase();
    if (!marketId) {
      return frameworks;
    }

    return frameworks.filter(
      (framework) => safe(framework.market || framework.country).toLowerCase() === marketId,
    );
  }, [draft.country_id, frameworks]);

  useEffect(() => {
    let active = true;
    const frameworkId = safe(draft.framework_id);

    if (!frameworkId) {
      setJurisdictions([]);
      setLoadingJurisdictions(false);
      return;
    }

    async function loadJurisdictions() {
      setLoadingJurisdictions(true);

      try {
        const rows = await loadCanonicalCurriculumJurisdictions(frameworkId);
        if (!active) return;
        setJurisdictions(rows);
      } catch (error) {
        if (!active) return;
        console.error("loadCanonicalCurriculumJurisdictions failed", error);
        setJurisdictions([]);
      } finally {
        if (!active) return;
        setLoadingJurisdictions(false);
      }
    }

    void loadJurisdictions();
    return () => {
      active = false;
    };
  }, [draft.framework_id]);

  useEffect(() => {
    if (loadingJurisdictions) return;
    if (!draft.framework_id) return;
    if (draft.region_id) return;
    if (jurisdictions.length === 1) {
      updateDraft("region_id", jurisdictions[0]?.id || null);
    }
  }, [draft.framework_id, draft.region_id, jurisdictions, loadingJurisdictions]);

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
  const selectedJurisdiction =
    jurisdictions.find((jurisdiction) => jurisdiction.id === safe(value.region_id)) || null;
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

  function handleMarketChange(marketId: string) {
    updateDraft("country_id", marketId || null);
    updateDraft("framework_id", null);
    updateDraft("level_id", null);
    updateDraft("region_id", null);
    updateDraft("subject_ids", []);
  }

  function handleFrameworkChange(frameworkId: string) {
    const selectedFramework =
      frameworks.find((framework) => framework.id === frameworkId) || null;
    updateDraft("framework_id", frameworkId || null);
    if (selectedFramework) {
      updateDraft("country_id", selectedFramework.market || selectedFramework.country || null);
    }
    updateDraft("level_id", null);
    updateDraft("region_id", null);
    updateDraft("subject_ids", []);
  }

  function handleJurisdictionChange(jurisdictionId: string) {
    updateDraft("region_id", jurisdictionId || null);
  }

  function handleLevelChange(levelId: string) {
    updateDraft("level_id", levelId || null);
  }

  function handleApply() {
    const selectedJurisdiction =
      jurisdictions.find((jurisdiction) => jurisdiction.id === safe(draft.region_id)) || null;
    const selectedLevel =
      levels.find((level) => level.id === safe(draft.level_id)) || null;
    const marketCode = safe(draft.country_id).toLowerCase() || null;

    onChange({
      ...draft,
      region_id: safe(draft.region_id) || null,
      subject_ids: [],
      compliance_profile: {
        country: marketCode,
        state: selectedJurisdiction?.state_code || null,
        curriculum_framework: selectedDraftFramework?.name || null,
        compliance_mode: value.compliance_profile?.compliance_mode || null,
        template_version: value.compliance_profile?.template_version || null,
        required_fields: value.compliance_profile?.required_fields || [],
        recommended_fields: value.compliance_profile?.recommended_fields || [],
        optional_fields: value.compliance_profile?.optional_fields || [],
        custom_labels: {
          ...(value.compliance_profile?.custom_labels || {}),
          market_label: marketCode || "",
          jurisdiction_label: selectedJurisdiction?.name || "",
          level_label: selectedLevel?.level_label || "",
        },
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
    setShowUnavailableState(false);
  }

  function openEditor() {
    setDraft(value);
    setStatusMessage("");
    if (loadingFrameworks || frameworks.length === 0) {
      setIsEditing(false);
      setShowUnavailableState(true);
      return;
    }
    setShowUnavailableState(false);
    setIsEditing(true);
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

        {isEditing ? <span style={cardStyles.editingBadge}>Editing</span> : null}
      </div>

      {statusMessage ? <div style={cardStyles.status}>{statusMessage}</div> : null}
      {loadError ? <div style={cardStyles.loading}>{loadError}</div> : null}

      {isEditing ? (
        frameworks.length > 0 ? (
          <div ref={editorRef} style={cardStyles.form}>
            <Field
              label="Market"
              help="Choose the curriculum market that fits your family."
            >
              <select
                value={draft.country_id ?? ""}
                onChange={(event) => handleMarketChange(event.target.value)}
                style={cardStyles.input}
              >
                <option value="">Select a market</option>
                {marketOptions.map((market) => (
                  <option key={market.id} value={market.id}>
                    {market.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Framework"
              help="Frameworks are loaded from the canonical curriculum catalogue."
            >
              <select
                value={draft.framework_id ?? ""}
                onChange={(event) => handleFrameworkChange(event.target.value)}
                style={cardStyles.input}
              >
                <option value="">Select a framework</option>
                {frameworkOptions.map((framework) => (
                  <option key={framework.id} value={framework.id}>
                    {framework.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Jurisdiction"
              help="Choose the applicable jurisdiction for this framework."
            >
              <select
                value={draft.region_id ?? ""}
                onChange={(event) => handleJurisdictionChange(event.target.value)}
                style={cardStyles.input}
                disabled={!draft.framework_id || loadingJurisdictions}
              >
                <option value="">
                  {loadingJurisdictions ? "Loading jurisdictions..." : "Select a jurisdiction"}
                </option>
                {jurisdictions.map((jurisdiction) => (
                  <option key={jurisdiction.id} value={jurisdiction.id}>
                    {jurisdiction.name}
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
                disabled={!draft.country_id || !draft.framework_id || !draft.region_id || !draft.level_id}
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
        ) : null
      ) : showUnavailableState ? (
        <div ref={editorRef} style={cardStyles.blockedState}>
          <div style={cardStyles.blockedTitle}>Curriculum setup is not available yet</div>
          <p style={cardStyles.blockedText}>
            {loadingFrameworks
              ? "Curriculum options are still loading. Try again in a moment."
              : "Curriculum options are not available yet for this family. You cannot complete curriculum setup until framework data is available."}
          </p>
          <div style={cardStyles.actions}>
            <button type="button" style={cardStyles.linkButton} onClick={handleCancel}>
              Close
            </button>
          </div>
        </div>
      ) : hasSetup ? (
        <div style={cardStyles.summaryBlock}>
          <div style={cardStyles.summary}>
            <Row
              label="Market"
              value={findCanonicalCountryLabel(frameworks, value.country_id)}
            />
            <Row
              label="Framework"
              value={findCanonicalFrameworkLabel(frameworks, value.framework_id)}
            />
            <Row
              label="Jurisdiction"
              value={findCanonicalJurisdictionLabel(jurisdictions, value.region_id)}
            />
            <Row
              label="Level"
              value={selectedLevel?.level_label || safe(value.level_id) || "Not set"}
            />
          </div>

          <div style={cardStyles.actions}>
            <button
              type="button"
              style={cardStyles.primaryButton}
              onClick={openEditor}
            >
              Edit curriculum
            </button>
          </div>
        </div>
      ) : (
        <div style={cardStyles.empty}>
          <p>
            Curriculum has not been configured yet. Set it here so planning, capture, portfolio, and reporting can stay aligned.
          </p>
          <div style={cardStyles.actions}>
            <button
              type="button"
              style={cardStyles.primaryButton}
              onClick={openEditor}
            >
              Set up curriculum
            </button>
          </div>
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
  status: {
    padding: "10px 12px",
    borderRadius: 14,
    background: "#ecfdf5",
    border: "1px solid #bbf7d0",
    color: "#166534",
    fontSize: 13,
  },
  summaryBlock: {
    display: "grid",
    gap: 14,
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
  blockedState: {
    border: "1px solid #dbeafe",
    borderRadius: 16,
    padding: 20,
    background: "#f8fbff",
    display: "grid",
    gap: 10,
  },
  blockedTitle: {
    fontSize: 15,
    fontWeight: 800,
    color: "#0f172a",
  },
  blockedText: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.6,
    color: "#475569",
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
