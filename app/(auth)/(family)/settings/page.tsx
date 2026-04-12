"use client";

import dynamic from "next/dynamic";
import React, { useEffect, useMemo, useState } from "react";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";
import {
  type ChildOption,
  DEFAULT_FAMILY_SETTINGS,
  type DefaultChildLanding,
  type EvidencePrivacy,
  type ExperienceMode,
  type FamilySettings,
  type MarketKey,
  type WeekStart,
  persistSettingsToLocalStorage,
} from "@/lib/familySettings";
import { saveFamilyWorkspaceSettings, setActiveLearnerId } from "@/lib/familyWorkspace";

const CurriculumSetupCard = dynamic(
  () => import("@/app/components/CurriculumSetupCard"),
  {
    ssr: false,
    loading: () => (
      <div style={styles.loadingCard}>Loading curriculum and compliance controls...</div>
    ),
  },
);

type StepKey =
  | "curriculum"
  | "platform"
  | "child"
  | "guidance"
  | "notifications";

function marketLabel(key: MarketKey) {
  if (key === "au") return "Australia";
  if (key === "uk") return "United Kingdom";
  return "United States";
}

function modeLabel(key: ExperienceMode) {
  if (key === "family") return "Family";
  if (key === "teacher") return "Teacher";
  return "Leadership";
}

function childLandingLabel(key: DefaultChildLanding) {
  if (key === "dashboard") return "Dashboard";
  if (key === "portfolio") return "Portfolio";
  if (key === "planner") return "Planner";
  return "Reports";
}

function childOptionLabel(child: ChildOption | null | undefined) {
  if (!child) return "Not selected";

  const row = child as ChildOption &
    Partial<{
      name: string | null;
      title: string | null;
      preferred_name: string | null;
      first_name: string | null;
      surname: string | null;
      family_name: string | null;
    }>;

  return (
    row.label ||
    row.name ||
    row.title ||
    [row.preferred_name, row.first_name, row.surname || row.family_name]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    "Not selected"
  );
}

function childOptionYearLabel(child: ChildOption | null | undefined) {
  if (!child) return "";

  const row = child as ChildOption &
    Partial<{
      yearLabel: string | null;
      year_label: string | null;
      year_level: string | number | null;
    }>;

  return row.yearLabel || row.year_label || (row.year_level ? `Year ${row.year_level}` : "");
}

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
  const profileFramework = settings.curriculum_preferences.compliance_profile?.curriculum_framework;
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

function stepSummary(step: StepKey, settings: FamilySettings, children: ChildOption[]) {
  if (step === "curriculum") {
    return `${curriculumCountryLabel(settings)} • ${curriculumStateLabel(settings)} • ${settings.curriculum_preferences.compliance_profile?.compliance_mode || "Compliance mode not set"}`;
  }
  if (step === "platform") {
    return `${marketLabel(settings.preferred_market)} • ${modeLabel(settings.experience_mode)} • Week starts ${settings.week_start}`;
  }
  if (step === "child") {
    return `${childOptionLabel(children.find((c) => c.id === settings.default_child_id))} • ${childLandingLabel(settings.default_child_landing)}`;
  }
  if (step === "guidance") {
    return `${settings.show_authority_guidance ? "Authority guidance on" : "Authority guidance off"} • ${settings.planner_auto_carry_forward ? "Carry forward on" : "Carry forward off"}`;
  }
  return [
    settings.notifications_weekly_digest ? "Weekly digest" : null,
    settings.notifications_readiness_alerts ? "Readiness alerts" : null,
    settings.notifications_planner_nudges ? "Planner nudges" : null,
  ]
    .filter(Boolean)
    .join(" • ") || "No reminders selected";
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
  const [openStep, setOpenStep] = useState<StepKey>("curriculum");

  const children = useMemo<ChildOption[]>(
    () =>
      workspace.learners.map((learner) => ({
        id: learner.id,
        label: learner.label,
        yearLabel: learner.yearLabel || "",
        year_level: learner.year_level ?? null,
        connectedAt: learner.connectedAt ?? null,
      })),
    [workspace.learners],
  );

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

  const guideSteps: Array<{ key: StepKey; number: string; label: string }> = [
    { key: "curriculum", number: "1", label: "Curriculum" },
    { key: "platform", number: "2", label: "Platform" },
    { key: "child", number: "3", label: "Child" },
    { key: "guidance", number: "4", label: "Guidance" },
    { key: "notifications", number: "5", label: "Notifications" },
  ];

  function update<K extends keyof FamilySettings>(key: K, value: FamilySettings[K]) {
    setHasPendingEdits(true);
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    const startedAt = Date.now();
    console.info("settings.handleSave start", {
      startedAt: new Date(startedAt).toISOString(),
      settings,
    });
    setSaving(true);
    setSaveError("");

    try {
      persistSettingsToLocalStorage(settings);
      console.info("settings.handleSave local snapshot stored", {
        durationMs: Date.now() - startedAt,
      });

      console.info("settings.handleSave DB request start", {
        durationMs: Date.now() - startedAt,
      });

      const saved = await withTimeout(
        saveFamilyWorkspaceSettings(settings),
        "settings save",
      );

      console.info("settings.handleSave DB request success", {
        durationMs: Date.now() - startedAt,
        saved,
      });

      const merged: FamilySettings = {
        ...DEFAULT_FAMILY_SETTINGS,
        ...saved,
        default_child_id: saved.default_child_id || settings.default_child_id || children[0]?.id || null,
      };

      console.info("settings.handleSave workspace patch start", {
        durationMs: Date.now() - startedAt,
      });

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
      console.info("settings.handleSave workspace patch success", {
        durationMs: Date.now() - startedAt,
      });
    } catch (err) {
      console.error("settings.handleSave error", {
        durationMs: Date.now() - startedAt,
        err,
      });
      const message =
        err instanceof Error && err.message
          ? err.message
          : "The family profile could not be updated in the database.";

      if (settings.default_child_id) {
        setActiveLearnerId(settings.default_child_id);
      }

      setStorageMode(workspace.storageMode);
      setHasPendingEdits(true);
      setSavedAt("");
      setSaveError(`Database save failed: ${message}`);
    } finally {
      console.info("settings.handleSave final saving state cleared", {
        durationMs: Date.now() - startedAt,
      });
      setSaving(false);
    }
  }

  function handleReset() {
    const fallback: FamilySettings = {
      ...DEFAULT_FAMILY_SETTINGS,
      default_child_id: children[0]?.id || null,
    };
    setSettings(fallback);
    setHasPendingEdits(true);
  }

  function toggleStep(step: StepKey) {
    if (step === "curriculum") {
      setOpenStep("curriculum");
      return;
    }
    setOpenStep((current) => (current === step ? "curriculum" : step));
  }

  return (
    <FamilyTopNavShell title="EduDecks Family" subtitle="Settings" hideHero={true}>
      <main style={styles.app}>
        <div style={styles.wrap}>
          <section style={styles.hero}>
            <div style={{ display: "grid", gap: 12 }}>
              <div style={styles.eyebrow}>Family settings</div>
              <h1 style={styles.h1}>Set up your family workspace in order</h1>
              <p style={styles.heroText}>
                Start with curriculum and compliance, then shape how the family uses EduDecks day to day.
              </p>

              <div style={styles.heroChips}>
                <span style={styles.chip}>Market: {marketLabel(settings.preferred_market)}</span>
                <span style={styles.chip}>
                  Default child: {childOptionLabel(children.find((c) => c.id === settings.default_child_id))}
                </span>
                <span style={styles.chip}>
                  Storage: {storageMode === "database" ? "Database-backed" : "Local fallback"}
                </span>
              </div>

              {workspaceLoading ? <div style={styles.inlineNote}>Refreshing the latest family settings in the background...</div> : null}
              {loadError ? <div style={styles.warningBanner}>{loadError}</div> : null}
              {saveError ? <div style={styles.warningBanner}>{saveError}</div> : null}
            </div>
          </section>

          <div style={styles.flowLayout}>
            <aside style={styles.rail} aria-label="Settings setup guide">
              <div style={styles.railLine} />
              {guideSteps.map((step) => {
                const active = openStep === step.key;
                return (
                  <a
                    key={step.key}
                    href={step.key === "curriculum" ? "/settings#curriculum" : `#${step.key}`}
                    onClick={() => setOpenStep(step.key)}
                    style={{
                      ...styles.railItem,
                      ...(active ? styles.railItemActive : {}),
                    }}
                  >
                    <span style={{ ...styles.railDot, ...(active ? styles.railDotActive : {}) }}>
                      {step.number}
                    </span>
                    <span style={styles.railLabel}>{step.label}</span>
                  </a>
                );
              })}
            </aside>

            <div style={styles.contentStack}>
              <StepSection
                id="curriculum"
                step="Step 1"
                title="Set up your curriculum"
                summary={stepSummary("curriculum", settings, children)}
                open={true}
                primary
              >
                <div style={styles.helperText}>
                  Set the reporting structure for your family first. Later planning, capture, and reporting will follow this setup.
                </div>

                {savedAt && !saveError ? (
                  <div style={styles.successBanner}>Curriculum and compliance settings were saved to your family profile.</div>
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
                  <SummaryRow label="Curriculum framework" value={curriculumFrameworkLabel(settings)} />
                  <SummaryRow
                    label="Compliance mode"
                    value={settings.curriculum_preferences.compliance_profile?.compliance_mode || "Not set"}
                  />
                </div>
              </StepSection>

              <StepSection
                id="platform"
                step="Step 2"
                title="How your family uses EduDecks"
                summary={stepSummary("platform", settings, children)}
                open={openStep === "platform"}
                onToggle={() => toggleStep("platform")}
              >
                <div style={styles.formGrid}>
                  <Field label="Preferred market" help="Sets the main authority lens for the family workspace.">
                    <select
                      value={settings.preferred_market}
                      onChange={(e) => update("preferred_market", e.target.value as MarketKey)}
                      style={styles.input}
                    >
                      <option value="au">Australia</option>
                      <option value="uk">United Kingdom</option>
                      <option value="us">United States</option>
                    </select>
                  </Field>

                  <Field label="Experience mode" help="Family keeps the calmest view.">
                    <div style={styles.segmentWrap}>
                      {(["family", "teacher", "leadership"] as ExperienceMode[]).map((mode) => {
                        const active = settings.experience_mode === mode;
                        return (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => update("experience_mode", mode)}
                            style={{
                              ...styles.segmentButton,
                              ...(active ? styles.segmentButtonActive : {}),
                            }}
                          >
                            {modeLabel(mode)}
                          </button>
                        );
                      })}
                    </div>
                  </Field>

                  <Field label="Week starts on" help="Used in planner and weekly schedule views.">
                    <select
                      value={settings.week_start}
                      onChange={(e) => update("week_start", e.target.value as WeekStart)}
                      style={styles.input}
                    >
                      <option value="monday">Monday</option>
                      <option value="sunday">Sunday</option>
                    </select>
                  </Field>
                </div>
              </StepSection>

              <StepSection
                id="child"
                step="Step 3"
                title="Default child experience"
                summary={stepSummary("child", settings, children)}
                open={openStep === "child"}
                onToggle={() => toggleStep("child")}
              >
                <div style={styles.formGrid}>
                  <Field label="Default child" help="The child selected first when family pages open.">
                    <select
                      value={settings.default_child_id ?? ""}
                      onChange={(e) => update("default_child_id", e.target.value || null)}
                      style={styles.input}
                    >
                      <option value="">No child selected</option>
                      {children.map((child) => (
                        <option key={child.id} value={child.id}>
                          {childOptionLabel(child)}
                          {childOptionYearLabel(child) ? ` - ${childOptionYearLabel(child)}` : ""}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Default child landing view" help="Controls where the workspace opens first.">
                    <select
                      value={settings.default_child_landing}
                      onChange={(e) =>
                        update("default_child_landing", e.target.value as DefaultChildLanding)
                      }
                      style={styles.input}
                    >
                      <option value="dashboard">Dashboard</option>
                      <option value="portfolio">Portfolio</option>
                      <option value="planner">Planner</option>
                      <option value="reports">Reports</option>
                    </select>
                  </Field>
                </div>

                <div style={styles.stack}>
                  <ToggleRow
                    title="Open last viewed child automatically"
                    description="Return to the most recently used child context."
                    checked={settings.auto_open_last_child}
                    onChange={(value) => update("auto_open_last_child", value)}
                  />

                  <ToggleRow
                    title="Use compact mode"
                    description="Tightens spacing slightly for families who want more on screen."
                    checked={settings.compact_mode}
                    onChange={(value) => update("compact_mode", value)}
                  />
                </div>
              </StepSection>

              <StepSection
                id="guidance"
                step="Step 4"
                title="Guidance and planning behaviour"
                summary={stepSummary("guidance", settings, children)}
                open={openStep === "guidance"}
                onToggle={() => toggleStep("guidance")}
              >
                <div style={styles.stack}>
                  <ToggleRow
                    title="Show advanced insights"
                    description="Reveal richer analysis where it helps."
                    checked={settings.show_advanced_insights}
                    onChange={(value) => update("show_advanced_insights", value)}
                  />
                  <ToggleRow
                    title="Show authority guidance"
                    description="Keep compliance prompts visible and calm."
                    checked={settings.show_authority_guidance}
                    onChange={(value) => update("show_authority_guidance", value)}
                  />
                  <ToggleRow
                    title="Carry unfinished planner items forward"
                    description="Roll unfinished weekly items into the next cycle."
                    checked={settings.planner_auto_carry_forward}
                    onChange={(value) => update("planner_auto_carry_forward", value)}
                  />
                  <ToggleRow
                    title="Show weekends in planner"
                    description="Useful for flexible family-led schedules."
                    checked={settings.planner_show_weekend}
                    onChange={(value) => update("planner_show_weekend", value)}
                  />
                </div>

                <div style={styles.formGrid}>
                  <Field label="Default evidence privacy" help="Sets the default visibility for new evidence.">
                    <select
                      value={settings.evidence_privacy_default}
                      onChange={(e) =>
                        update("evidence_privacy_default", e.target.value as EvidencePrivacy)
                      }
                      style={styles.input}
                    >
                      <option value="private">Private</option>
                      <option value="family">Family only</option>
                      <option value="shared">Shareable</option>
                    </select>
                  </Field>

                  <Field label="Default report tone" help="Choose the reporting voice that fits your family.">
                    <select
                      value={settings.report_tone_default}
                      onChange={(e) =>
                        update(
                          "report_tone_default",
                          e.target.value as "family-summary" | "authority-ready" | "progress-review",
                        )
                      }
                      style={styles.input}
                    >
                      <option value="family-summary">Family summary</option>
                      <option value="authority-ready">Authority ready</option>
                      <option value="progress-review">Progress review</option>
                    </select>
                  </Field>

                  <Field label="Portfolio print style" help="Choose a softer showcase feel or a more formal print style.">
                    <div style={styles.segmentWrap}>
                      {(["calm", "formal"] as Array<"calm" | "formal">).map((styleKey) => {
                        const active = settings.portfolio_print_style === styleKey;
                        return (
                          <button
                            key={styleKey}
                            type="button"
                            onClick={() => update("portfolio_print_style", styleKey)}
                            style={{
                              ...styles.segmentButton,
                              ...(active ? styles.segmentButtonActive : {}),
                            }}
                          >
                            {styleKey === "calm" ? "Calm showcase" : "Formal print"}
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                </div>
              </StepSection>

              <StepSection
                id="notifications"
                step="Step 5"
                title="Notifications and reminders"
                summary={stepSummary("notifications", settings, children)}
                open={openStep === "notifications"}
                onToggle={() => toggleStep("notifications")}
              >
                <div style={styles.stack}>
                  <ToggleRow
                    title="Weekly digest"
                    description="A compact summary of recent family activity."
                    checked={settings.notifications_weekly_digest}
                    onChange={(value) => update("notifications_weekly_digest", value)}
                  />
                  <ToggleRow
                    title="Readiness alerts"
                    description="Surface when evidence coverage or reporting readiness drifts."
                    checked={settings.notifications_readiness_alerts}
                    onChange={(value) => update("notifications_readiness_alerts", value)}
                  />
                  <ToggleRow
                    title="Planner nudges"
                    description="Provide gentle prompts when the next week has not been shaped."
                    checked={settings.notifications_planner_nudges}
                    onChange={(value) => update("notifications_planner_nudges", value)}
                  />
                </div>
              </StepSection>
            </div>
          </div>
        </div>

        <div style={styles.stickyBar}>
          <div style={{ display: "grid", gap: 4 }}>
            <div style={styles.stickyTitle}>
              {saveError
                ? "Family settings could not be saved to the database."
                : isDirty
                  ? "You have unsaved family settings changes."
                  : savedAt
                    ? "Family settings were saved successfully."
                    : "All family settings are saved."}
            </div>
            <div style={styles.stickySub}>
              {saveError
                ? saveError
                : savedAt
                ? `Last saved ${savedAt}`
                : storageMode === "database"
                  ? "Changes made here will stay in sync across the family workspace."
                  : "Changes will stay local until signed-in database storage is available."}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" onClick={handleReset} style={styles.secondaryButton}>
              Reset to defaults
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
              {saving ? "Saving..." : "Save family settings"}
            </button>
          </div>
        </div>
      </main>
    </FamilyTopNavShell>
  );
}

function StepSection({
  id,
  step,
  title,
  summary,
  open,
  children,
  onToggle,
  primary,
}: {
  id: string;
  step: string;
  title: string;
  summary: string;
  open: boolean;
  children: React.ReactNode;
  onToggle?: () => void;
  primary?: boolean;
}) {
  return (
    <section
      id={id}
      style={{
        ...styles.stepCard,
        ...(primary ? styles.stepCardPrimary : {}),
        scrollMarginTop: 112,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={!onToggle}
        style={{
          ...styles.stepHeader,
          cursor: onToggle ? "pointer" : "default",
        }}
      >
        <div style={{ display: "grid", gap: 4, textAlign: "left" }}>
          <div style={styles.stepEyebrow}>{step}</div>
          <div style={styles.stepTitle}>{title}</div>
          <div style={styles.stepSummary}>{summary}</div>
        </div>
        {onToggle ? <div style={styles.stepToggle}>{open ? "Hide" : "Show"}</div> : null}
      </button>

      {open ? <div style={styles.stepBody}>{children}</div> : null}
    </section>
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
    <label style={{ display: "grid", gap: 8 }}>
      <div style={styles.fieldLabel}>{label}</div>
      {children}
      {help ? <div style={styles.fieldHelp}>{help}</div> : null}
    </label>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div style={styles.toggleRow}>
      <div style={{ display: "grid", gap: 4 }}>
        <div style={styles.toggleTitle}>{title}</div>
        <div style={styles.toggleDescription}>{description}</div>
      </div>

      <button
        type="button"
        aria-pressed={checked}
        onClick={() => onChange(!checked)}
        style={{
          ...styles.toggle,
          justifyContent: checked ? "flex-end" : "flex-start",
          background: checked ? "#2563eb" : "#e5e7eb",
        }}
      >
        <span style={styles.toggleKnob} />
      </button>
    </div>
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
    maxWidth: 1320,
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
    maxWidth: 820,
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
  flowLayout: {
    display: "grid",
    gridTemplateColumns: "140px minmax(0, 1fr)",
    gap: 24,
    alignItems: "start",
  },
  rail: {
    position: "sticky",
    top: 110,
    display: "grid",
    gap: 12,
    alignContent: "start",
    paddingTop: 8,
  },
  railLine: {
    position: "absolute",
    left: 17,
    top: 14,
    bottom: 14,
    width: 2,
    background: "#e2e8f0",
  },
  railItem: {
    position: "relative",
    zIndex: 1,
    display: "grid",
    gridTemplateColumns: "34px 1fr",
    gap: 10,
    alignItems: "center",
    textDecoration: "none",
    color: "#64748b",
  },
  railItemActive: {
    color: "#0f172a",
  },
  railDot: {
    width: 34,
    height: 34,
    borderRadius: 999,
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 800,
  },
  railDotActive: {
    background: "#eff6ff",
    borderColor: "#93c5fd",
    color: "#1d4ed8",
  },
  railLabel: {
    fontSize: 13,
    fontWeight: 700,
  },
  contentStack: {
    display: "grid",
    gap: 16,
  },
  stepCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
    overflow: "hidden",
  },
  stepCardPrimary: {
    borderColor: "#bfdbfe",
    boxShadow: "0 14px 36px rgba(37,99,235,0.08)",
  },
  stepHeader: {
    width: "100%",
    border: "none",
    background: "transparent",
    padding: "18px 18px",
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    alignItems: "center",
  },
  stepEyebrow: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 1.05,
    textTransform: "uppercase",
    color: "#64748b",
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 900,
    color: "#0f172a",
  },
  stepSummary: {
    fontSize: 13,
    lineHeight: 1.6,
    color: "#64748b",
  },
  stepToggle: {
    fontSize: 13,
    fontWeight: 800,
    color: "#2563eb",
    whiteSpace: "nowrap",
  },
  stepBody: {
    display: "grid",
    gap: 16,
    padding: "0 18px 18px",
  },
  helperText: {
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
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 16,
  },
  stack: {
    display: "grid",
    gap: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: 800,
    color: "#0f172a",
  },
  fieldHelp: {
    fontSize: 12,
    lineHeight: 1.5,
    color: "#64748b",
  },
  input: {
    width: "100%",
    background: "#ffffff",
    border: "1px solid #d1d5db",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    color: "#1f2937",
    outline: "none",
  },
  segmentWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  segmentButton: {
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#334155",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
  },
  segmentButtonActive: {
    background: "#eff6ff",
    color: "#2563eb",
    border: "1px solid #bfdbfe",
  },
  toggleRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: 14,
    alignItems: "center",
    padding: 14,
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    background: "#f8fafc",
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: "#0f172a",
  },
  toggleDescription: {
    fontSize: 13,
    lineHeight: 1.5,
    color: "#64748b",
  },
  toggle: {
    width: 52,
    minWidth: 52,
    height: 30,
    borderRadius: 999,
    border: "none",
    padding: 4,
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "#ffffff",
    boxShadow: "0 2px 8px rgba(15,23,42,0.18)",
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
    maxWidth: 1320,
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
