"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChildOption,
  DEFAULT_FAMILY_SETTINGS,
  DefaultChildLanding,
  EvidencePrivacy,
  ExperienceMode,
  FamilySettings,
  MarketKey,
  WeekStart,
  getCurrentUserId,
  loadChildrenFromLocalStorage,
  loadFamilyProfile,
  loadSettingsFromLocalStorage,
  persistSettingsToLocalStorage,
  rowToSettings,
  upsertFamilyProfile,
} from "@/lib/familySettings";

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
    [
      row.preferred_name,
      row.first_name,
      row.surname || row.family_name,
    ]
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

  return (
    row.yearLabel ||
    row.year_label ||
    (row.year_level ? `Year ${row.year_level}` : "")
  );
}

export default function FamilySettingsPage() {
  const [settings, setSettings] = useState<FamilySettings>(DEFAULT_FAMILY_SETTINGS);
  const [initialSettings, setInitialSettings] = useState<FamilySettings>(DEFAULT_FAMILY_SETTINGS);
  const [children, setChildren] = useState<ChildOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string>("");
  const [hydrated, setHydrated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [storageMode, setStorageMode] = useState<"database" | "local">("local");
  const [loadError, setLoadError] = useState<string>("");
  const [saveError, setSaveError] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      const seededChildren = loadChildrenFromLocalStorage();
      const localSettings = loadSettingsFromLocalStorage();

      const localMerged: FamilySettings = {
        ...DEFAULT_FAMILY_SETTINGS,
        ...localSettings,
        default_child_id: localSettings.default_child_id || seededChildren[0]?.id || null,
      };

      if (!mounted) return;

      setChildren(seededChildren);
      setSettings(localMerged);
      setInitialSettings(localMerged);

      const currentUserId = await getCurrentUserId();

      if (!mounted) return;

      setUserId(currentUserId);

      if (!currentUserId) {
        setStorageMode("local");
        setHydrated(true);
        return;
      }

      let data: any = null;

      try {
        data = await loadFamilyProfile();
      } catch {
        if (!mounted) return;
        setStorageMode("local");
        setLoadError(
          "Database profile could not be loaded, so local settings are being used."
        );
        setHydrated(true);
        return;
      }

      if (!mounted) return;

      if (!data) {
        setStorageMode("database");
        setHydrated(true);
        return;
      }

      const dbSettings: FamilySettings = {
        ...DEFAULT_FAMILY_SETTINGS,
        ...rowToSettings(data),
        default_child_id:
          data.default_child_id || localMerged.default_child_id || seededChildren[0]?.id || null,
      };

      setStorageMode("database");
      setSettings(dbSettings);
      setInitialSettings(dbSettings);
      persistSettingsToLocalStorage(dbSettings);
      setHydrated(true);
    }

    hydrate();

    return () => {
      mounted = false;
    };
  }, []);

  const isDirty = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(initialSettings);
  }, [settings, initialSettings]);

  const preferredAuthorityHref = useMemo(() => {
    if (settings.preferred_market === "au") return "/authority-au";
    if (settings.preferred_market === "uk") return "/authority-uk";
    return "/authority-us";
  }, [settings.preferred_market]);

  const readinessTone = useMemo(() => {
    if (settings.show_authority_guidance && settings.experience_mode === "family") {
      return {
        label: "Guided family mode",
        text: "Families will see simpler guidance, calmer explanations, and authority-ready prompts where helpful.",
        chipBg: "#ecfdf5",
        chipBorder: "#a7f3d0",
        chipText: "#166534",
      };
    }

    if (settings.experience_mode === "teacher") {
      return {
        label: "Teacher detail mode",
        text: "Pages can surface more working detail while still using the family design language.",
        chipBg: "#ecfeff",
        chipBorder: "#a5f3fc",
        chipText: "#0c4a6e",
      };
    }

    return {
      label: "Leadership overview mode",
      text: "Settings lean toward summary, oversight, and wider organisational clarity.",
      chipBg: "#fff7ed",
      chipBorder: "#fed7aa",
      chipText: "#9a3412",
    };
  }, [settings.show_authority_guidance, settings.experience_mode]);

  function update<K extends keyof FamilySettings>(key: K, value: FamilySettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setSaveError("");

    try {
      persistSettingsToLocalStorage(settings);

      if (!userId) {
        setStorageMode("local");
        setInitialSettings(settings);
        setSavedAt(new Date().toLocaleString());
        return;
      }

      let data: any = null;

      try {
        data = await upsertFamilyProfile(settings);
      } catch {
        setStorageMode("local");
        setSaveError(
          "Settings were saved locally, but the family profile could not be updated in the database."
        );
        setInitialSettings(settings);
        setSavedAt(new Date().toLocaleString());
        return;
      }

      const merged: FamilySettings = {
        ...DEFAULT_FAMILY_SETTINGS,
        ...rowToSettings(data),
        default_child_id: data?.default_child_id || settings.default_child_id || null,
      };

      setStorageMode("database");
      setSettings(merged);
      setInitialSettings(merged);
      persistSettingsToLocalStorage(merged);
      setSavedAt(new Date().toLocaleString());
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    const fallback: FamilySettings = {
      ...DEFAULT_FAMILY_SETTINGS,
      default_child_id: children[0]?.id || null,
    };
    setSettings(fallback);
  }

  if (!hydrated) {
    return (
      <main style={shellStyles.app}>
        <div style={shellStyles.wrap}>
          <div style={shellStyles.loadingCard}>Loading family settings…</div>
        </div>
      </main>
    );
  }

  return (
    <main style={shellStyles.app}>
      <div style={shellStyles.wrap}>
        <div style={shellStyles.topNav}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <Link href="/family" style={shellStyles.brand}>
              EduDecks Family
            </Link>
            <span style={shellStyles.navDivider}>/</span>
            <span style={shellStyles.navCurrent}>Settings</span>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/family" style={shellStyles.secondaryButton}>
              Back to dashboard
            </Link>
            <Link href={preferredAuthorityHref} style={shellStyles.secondaryButton}>
              Market authority view
            </Link>
          </div>
        </div>

        <section style={shellStyles.hero}>
          <div style={{ display: "grid", gap: 14 }}>
            <div style={shellStyles.eyebrow}>Family settings</div>
            <h1 style={shellStyles.h1}>Family controls and defaults</h1>
            <p style={shellStyles.heroText}>
              Set the default experience for your household, choose how children open into the
              platform, control reporting and planner behaviour, and shape how calm or detailed the
              system feels from day to day.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <span
                style={{
                  ...shellStyles.chip,
                  background: readinessTone.chipBg,
                  borderColor: readinessTone.chipBorder,
                  color: readinessTone.chipText,
                }}
              >
                {readinessTone.label}
              </span>
              <span style={shellStyles.chipMuted}>
                Preferred market: {marketLabel(settings.preferred_market)}
              </span>
              <span style={shellStyles.chipMuted}>
                Default child view: {childLandingLabel(settings.default_child_landing)}
              </span>
              <span style={shellStyles.chipMuted}>
                Storage: {storageMode === "database" ? "Durable database profile" : "Local device fallback"}
              </span>
            </div>

            {loadError ? <div style={shellStyles.warningBanner}>{loadError}</div> : null}
            {saveError ? <div style={shellStyles.warningBanner}>{saveError}</div> : null}
          </div>

          <div style={shellStyles.heroAside}>
            <div style={shellStyles.heroAsideLabel}>Current settings posture</div>
            <div style={shellStyles.heroAsideTitle}>{readinessTone.label}</div>
            <div style={shellStyles.heroAsideText}>{readinessTone.text}</div>
            <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
              <div style={shellStyles.summaryRow}>
                <span style={shellStyles.summaryKey}>Market</span>
                <span style={shellStyles.summaryValue}>{marketLabel(settings.preferred_market)}</span>
              </div>
              <div style={shellStyles.summaryRow}>
                <span style={shellStyles.summaryKey}>Mode</span>
                <span style={shellStyles.summaryValue}>{modeLabel(settings.experience_mode)}</span>
              </div>
              <div style={shellStyles.summaryRow}>
                <span style={shellStyles.summaryKey}>Default child</span>
                <span style={shellStyles.summaryValue}>
                  {childOptionLabel(children.find((c) => c.id === settings.default_child_id))}
                </span>
              </div>
              <div style={shellStyles.summaryRow}>
                <span style={shellStyles.summaryKey}>Profile storage</span>
                <span style={shellStyles.summaryValue}>
                  {storageMode === "database" ? "Database-backed" : "Local fallback"}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section style={shellStyles.metricsGrid}>
          <MetricCard
            label="Experience mode"
            value={modeLabel(settings.experience_mode)}
            note="Controls the default depth and emphasis of the interface."
          />
          <MetricCard
            label="Planner behaviour"
            value={settings.planner_auto_carry_forward ? "Carry forward on" : "Carry forward off"}
            note="Defines how unfinished weekly activity rolls into the next cycle."
          />
          <MetricCard
            label="Authority support"
            value={settings.show_authority_guidance ? "Guidance on" : "Guidance off"}
            note="Adds reassurance and readiness framing for family users."
          />
          <MetricCard
            label="Notifications"
            value={
              [
                settings.notifications_weekly_digest,
                settings.notifications_readiness_alerts,
                settings.notifications_planner_nudges,
              ].filter(Boolean).length + " active"
            }
            note="Weekly digests, readiness alerts, and planner nudges."
          />
        </section>

        <div style={shellStyles.mainGrid}>
          <div style={{ display: "grid", gap: 18 }}>
            <section style={shellStyles.card}>
              <div style={shellStyles.sectionHeader}>
                <div>
                  <div style={shellStyles.sectionEyebrow}>Platform defaults</div>
                  <div style={shellStyles.sectionTitle}>Market and experience mode</div>
                </div>
              </div>

              <div style={shellStyles.formGrid}>
                <Field label="Family display name" help="Used in family-facing summaries and future shared views.">
                  <input
                    value={settings.family_display_name}
                    onChange={(e) => update("family_display_name", e.target.value)}
                    style={shellStyles.input}
                    placeholder="Your family"
                  />
                </Field>

                <Field label="Preferred market" help="Sets the authority lens and future market-specific guidance.">
                  <select
                    value={settings.preferred_market}
                    onChange={(e) => update("preferred_market", e.target.value as MarketKey)}
                    style={shellStyles.input}
                  >
                    <option value="au">Australia</option>
                    <option value="uk">United Kingdom</option>
                    <option value="us">United States</option>
                  </select>
                </Field>

                <Field label="Experience mode" help="Family keeps the calmest interface. Teacher and leadership allow more operational detail.">
                  <div style={shellStyles.segmentWrap}>
                    {(["family", "teacher", "leadership"] as ExperienceMode[]).map((mode) => {
                      const active = settings.experience_mode === mode;
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => update("experience_mode", mode)}
                          style={{
                            ...shellStyles.segmentButton,
                            ...(active ? shellStyles.segmentButtonActive : {}),
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
                    style={shellStyles.input}
                  >
                    <option value="monday">Monday</option>
                    <option value="sunday">Sunday</option>
                  </select>
                </Field>
              </div>
            </section>

            <section style={shellStyles.card}>
              <div style={shellStyles.sectionHeader}>
                <div>
                  <div style={shellStyles.sectionEyebrow}>Child defaults</div>
                  <div style={shellStyles.sectionTitle}>Default child behaviour</div>
                </div>
              </div>

              <div style={shellStyles.formGrid}>
                <Field label="Default child" help="The child selected first when family pages open.">
                  <select
                    value={settings.default_child_id ?? ""}
                    onChange={(e) => update("default_child_id", e.target.value || null)}
                    style={shellStyles.input}
                  >
                    <option value="">No child selected</option>
                    {children.map((child) => (
                      <option key={child.id} value={child.id}>
                        {childOptionLabel(child)}
                        {childOptionYearLabel(child) ? ` · ${childOptionYearLabel(child)}` : ""}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Default child landing view" help="Controls where the system opens once a child context is chosen.">
                  <select
                    value={settings.default_child_landing}
                    onChange={(e) =>
                      update("default_child_landing", e.target.value as DefaultChildLanding)
                    }
                    style={shellStyles.input}
                  >
                    <option value="dashboard">Dashboard</option>
                    <option value="portfolio">Portfolio</option>
                    <option value="planner">Planner</option>
                    <option value="reports">Reports</option>
                  </select>
                </Field>

                <ToggleRow
                  title="Open last viewed child automatically"
                  description="When enabled, the family workspace returns to the most recently used child context."
                  checked={settings.auto_open_last_child}
                  onChange={(value) => update("auto_open_last_child", value)}
                />

                <ToggleRow
                  title="Use compact mode on family pages"
                  description="Tightens spacing slightly for users who want more information on screen."
                  checked={settings.compact_mode}
                  onChange={(value) => update("compact_mode", value)}
                />
              </div>
            </section>

            <section style={shellStyles.card}>
              <div style={shellStyles.sectionHeader}>
                <div>
                  <div style={shellStyles.sectionEyebrow}>Family-level controls</div>
                  <div style={shellStyles.sectionTitle}>Guidance, privacy, and planner defaults</div>
                </div>
              </div>

              <div style={shellStyles.stack}>
                <ToggleRow
                  title="Show advanced insights"
                  description="Adds more detailed analytics and richer explanatory signals on family surfaces."
                  checked={settings.show_advanced_insights}
                  onChange={(value) => update("show_advanced_insights", value)}
                />

                <ToggleRow
                  title="Show authority guidance"
                  description="Adds calm readiness language and clearer next-step prompts for compliance-related pages."
                  checked={settings.show_authority_guidance}
                  onChange={(value) => update("show_authority_guidance", value)}
                />

                <ToggleRow
                  title="Carry unfinished planner items forward"
                  description="Helpful for families who roll weekly plans over rather than resetting them."
                  checked={settings.planner_auto_carry_forward}
                  onChange={(value) => update("planner_auto_carry_forward", value)}
                />

                <ToggleRow
                  title="Show weekends in planner"
                  description="Useful for flexible or family-led schedules that include weekend learning."
                  checked={settings.planner_show_weekend}
                  onChange={(value) => update("planner_show_weekend", value)}
                />

                <Field label="Default evidence privacy" help="Sets the default visibility for newly captured evidence.">
                  <select
                    value={settings.evidence_privacy_default}
                    onChange={(e) =>
                      update("evidence_privacy_default", e.target.value as EvidencePrivacy)
                    }
                    style={shellStyles.input}
                  >
                    <option value="private">Private</option>
                    <option value="family">Family only</option>
                    <option value="shared">Shareable</option>
                  </select>
                </Field>

                <Field label="Default report tone" help="Preselects the reporting voice that best suits your household.">
                  <select
                    value={settings.report_tone_default}
                    onChange={(e) =>
                      update(
                        "report_tone_default",
                        e.target.value as "family-summary" | "authority-ready" | "progress-review"
                      )
                    }
                    style={shellStyles.input}
                  >
                    <option value="family-summary">Family summary</option>
                    <option value="authority-ready">Authority ready</option>
                    <option value="progress-review">Progress review</option>
                  </select>
                </Field>

                <Field label="Portfolio print style" help="Lets you choose a softer showcase feel or a more formal presentation layout later.">
                  <div style={shellStyles.segmentWrap}>
                    {(["calm", "formal"] as Array<"calm" | "formal">).map((styleKey) => {
                      const active = settings.portfolio_print_style === styleKey;
                      return (
                        <button
                          key={styleKey}
                          type="button"
                          onClick={() => update("portfolio_print_style", styleKey)}
                          style={{
                            ...shellStyles.segmentButton,
                            ...(active ? shellStyles.segmentButtonActive : {}),
                          }}
                        >
                          {styleKey === "calm" ? "Calm showcase" : "Formal print"}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </div>
            </section>

            <section style={shellStyles.card}>
              <div style={shellStyles.sectionHeader}>
                <div>
                  <div style={shellStyles.sectionEyebrow}>Notifications</div>
                  <div style={shellStyles.sectionTitle}>Helpful nudges and reassurance</div>
                </div>
              </div>

              <div style={shellStyles.stack}>
                <ToggleRow
                  title="Weekly digest"
                  description="A compact summary of recent evidence, planner movement, and reporting momentum."
                  checked={settings.notifications_weekly_digest}
                  onChange={(value) => update("notifications_weekly_digest", value)}
                />

                <ToggleRow
                  title="Readiness alerts"
                  description="Shows when evidence coverage or reporting readiness starts to drift."
                  checked={settings.notifications_readiness_alerts}
                  onChange={(value) => update("notifications_readiness_alerts", value)}
                />

                <ToggleRow
                  title="Planner nudges"
                  description="Provides gentle prompts when the next week has not yet been shaped."
                  checked={settings.notifications_planner_nudges}
                  onChange={(value) => update("notifications_planner_nudges", value)}
                />
              </div>
            </section>
          </div>

          <aside style={{ display: "grid", gap: 18 }}>
            <section style={shellStyles.card}>
              <div style={shellStyles.sideTitle}>Settings impact preview</div>
              <div style={shellStyles.sideText}>
                These defaults now form part of the family profile object and can be reused across
                the wider B2C experience.
              </div>

              <div style={shellStyles.previewStack}>
                <PreviewRow
                  label="Market lens"
                  value={`Primary guidance will lean toward ${marketLabel(settings.preferred_market)} reporting expectations.`}
                />
                <PreviewRow
                  label="Default route"
                  value={`Selected child contexts open into ${childLandingLabel(settings.default_child_landing)} first.`}
                />
                <PreviewRow
                  label="Family feel"
                  value={
                    settings.show_advanced_insights
                      ? "Pages can reveal richer analysis where helpful."
                      : "Pages stay calmer and simpler by default."
                  }
                />
                <PreviewRow
                  label="Planner posture"
                  value={
                    settings.planner_auto_carry_forward
                      ? "Unfinished weekly items can carry forward."
                      : "Each planner cycle starts fresh unless edited manually."
                  }
                />
              </div>
            </section>

            <section style={shellStyles.card}>
              <div style={shellStyles.sideTitle}>Recommended next connections</div>
              <div style={shellStyles.actionList}>
                <Link href="/family" style={shellStyles.actionLink}>
                  Review Family Dashboard
                </Link>
                <Link href="/portfolio" style={shellStyles.actionLink}>
                  Check portfolio showcase mode
                </Link>
                <Link href="/reports" style={shellStyles.actionLink}>
                  Confirm report defaults
                </Link>
                <Link href={preferredAuthorityHref} style={shellStyles.actionLink}>
                  Open preferred authority market
                </Link>
              </div>
            </section>

            <section
              style={{
                ...shellStyles.card,
                background: "#fffaf0",
                borderColor: "#fde68a",
              }}
            >
              <div style={{ ...shellStyles.sideTitle, color: "#92400e" }}>Now unlocked structurally</div>
              <div style={{ ...shellStyles.sideText, color: "#92400e" }}>
                Because this page is now tied to a family profile object, it is ready to inform:
              </div>
              <div style={shellStyles.premiumList}>
                <span style={shellStyles.premiumItem}>family dashboard defaults</span>
                <span style={shellStyles.premiumItem}>planner defaults</span>
                <span style={shellStyles.premiumItem}>report defaults</span>
                <span style={shellStyles.premiumItem}>portfolio behaviour</span>
                <span style={shellStyles.premiumItem}>future premium controls</span>
              </div>
            </section>
          </aside>
        </div>
      </div>

      <div style={shellStyles.stickyBar}>
        <div style={{ display: "grid", gap: 4 }}>
          <div style={shellStyles.stickyTitle}>
            {isDirty ? "You have unsaved family settings changes." : "Family settings are up to date."}
          </div>
          <div style={shellStyles.stickySub}>
            {savedAt
              ? `Last saved ${savedAt}`
              : storageMode === "database"
              ? "Save to persist these settings into the family profile."
              : "Save will persist locally until signed-in database storage is available."}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" onClick={handleReset} style={shellStyles.secondaryButton}>
            Reset to defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{
              ...shellStyles.primaryButton,
              opacity: saving ? 0.7 : 1,
              cursor: saving ? "wait" : "pointer",
            }}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save family settings"}
          </button>
        </div>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div style={shellStyles.metricCard}>
      <div style={shellStyles.metricLabel}>{label}</div>
      <div style={shellStyles.metricValue}>{value}</div>
      <div style={shellStyles.metricNote}>{note}</div>
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
    <label style={{ display: "grid", gap: 8 }}>
      <div style={shellStyles.fieldLabel}>{label}</div>
      {children}
      {help ? <div style={shellStyles.fieldHelp}>{help}</div> : null}
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
    <div style={shellStyles.toggleRow}>
      <div style={{ display: "grid", gap: 4 }}>
        <div style={shellStyles.toggleTitle}>{title}</div>
        <div style={shellStyles.toggleDescription}>{description}</div>
      </div>

      <button
        type="button"
        aria-pressed={checked}
        onClick={() => onChange(!checked)}
        style={{
          ...shellStyles.toggle,
          justifyContent: checked ? "flex-end" : "flex-start",
          background: checked ? "#2563eb" : "#e5e7eb",
        }}
      >
        <span style={shellStyles.toggleKnob} />
      </button>
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={shellStyles.previewRow}>
      <div style={shellStyles.previewLabel}>{label}</div>
      <div style={shellStyles.previewValue}>{value}</div>
    </div>
  );
}

const shellStyles: Record<string, React.CSSProperties> = {
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

  topNav: {
    position: "sticky",
    top: 12,
    zIndex: 20,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    background: "rgba(255,255,255,0.88)",
    backdropFilter: "blur(14px)",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: "12px 14px",
    boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
  },

  brand: {
    color: "#2563eb",
    fontWeight: 900,
    fontSize: 14,
    textDecoration: "none",
  },

  navDivider: {
    color: "#94a3b8",
    fontSize: 14,
  },

  navCurrent: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: 700,
  },

  hero: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.7fr) minmax(300px, 0.9fr)",
    gap: 18,
    background:
      "linear-gradient(135deg, rgba(79,124,240,0.08) 0%, rgba(139,124,246,0.08) 100%)",
    border: "1px solid #bfdbfe",
    borderRadius: 26,
    padding: "28px 24px",
    boxShadow: "0 18px 50px rgba(15, 23, 42, 0.06)",
  },

  eyebrow: {
    fontSize: 12,
    lineHeight: 1.2,
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
    lineHeight: 1.7,
    color: "#475569",
    maxWidth: 840,
  },

  chip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 800,
    border: "1px solid transparent",
  },

  chipMuted: {
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

  heroAside: {
    background: "rgba(255,255,255,0.82)",
    border: "1px solid #dbeafe",
    borderRadius: 20,
    padding: 18,
    boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
    display: "grid",
    alignContent: "start",
  },

  heroAsideLabel: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 1.05,
    textTransform: "uppercase",
    color: "#64748b",
    marginBottom: 8,
  },

  heroAsideTitle: {
    fontSize: 18,
    lineHeight: 1.25,
    fontWeight: 900,
    color: "#0f172a",
    marginBottom: 8,
  },

  heroAsideText: {
    fontSize: 13,
    lineHeight: 1.6,
    color: "#475569",
  },

  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    padding: "8px 0",
    borderTop: "1px solid #e5e7eb",
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

  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 14,
  },

  metricCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
    display: "grid",
    gap: 6,
  },

  metricLabel: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 1.05,
    textTransform: "uppercase",
    color: "#64748b",
  },

  metricValue: {
    fontSize: 18,
    lineHeight: 1.25,
    fontWeight: 900,
    color: "#0f172a",
  },

  metricNote: {
    fontSize: 13,
    lineHeight: 1.5,
    color: "#64748b",
  },

  mainGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.55fr) minmax(300px, 0.8fr)",
    gap: 18,
    alignItems: "start",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 20,
    boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
    display: "grid",
    gap: 16,
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },

  sectionEyebrow: {
    fontSize: 12,
    lineHeight: 1.2,
    fontWeight: 800,
    letterSpacing: 1.05,
    textTransform: "uppercase",
    color: "#64748b",
    marginBottom: 6,
  },

  sectionTitle: {
    fontSize: 18,
    lineHeight: 1.25,
    fontWeight: 900,
    color: "#0f172a",
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
    transition: "all 0.2s ease",
  },

  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "#ffffff",
    boxShadow: "0 2px 8px rgba(15,23,42,0.18)",
  },

  sideTitle: {
    fontSize: 16,
    lineHeight: 1.3,
    fontWeight: 900,
    color: "#0f172a",
  },

  sideText: {
    fontSize: 13,
    lineHeight: 1.6,
    color: "#64748b",
  },

  previewStack: {
    display: "grid",
    gap: 12,
  },

  previewRow: {
    display: "grid",
    gap: 4,
    padding: "12px 0",
    borderTop: "1px solid #e5e7eb",
  },

  previewLabel: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 1.05,
    textTransform: "uppercase",
    color: "#64748b",
  },

  previewValue: {
    fontSize: 13,
    lineHeight: 1.6,
    color: "#334155",
  },

  actionList: {
    display: "grid",
    gap: 10,
  },

  actionLink: {
    textDecoration: "none",
    color: "#2563eb",
    fontSize: 14,
    fontWeight: 700,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #dbeafe",
    background: "#eff6ff",
  },

  premiumList: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },

  premiumItem: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #fde68a",
    background: "#ffffff",
    fontSize: 12,
    fontWeight: 800,
    color: "#92400e",
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
