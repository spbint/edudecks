"use client";

import React, { useEffect, useMemo, useState } from "react";
import CleanAccountMenu from "@/app/components/clean/CleanAccountMenu";
import CleanFamilyWorkspaceProvider, {
  useCleanFamilyWorkspace,
} from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import {
  CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE,
  normalizeCleanErrorMessage,
  updateCleanFamilyProfile,
} from "@/lib/clean/family/client";
import type { FamilyProfile } from "@/lib/clean/family/types";

type SelectOption = {
  value: string;
  label: string;
  description?: string;
};

type SettingsDraft = {
  countryCode: string;
  jurisdictionCode: string;
  curriculumFrameworkId: string;
  reportingMode: string;
  weekStart: string;
  privacyDefault: string;
  exportStyle: string;
};

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "32px 20px 48px",
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 960,
  margin: "0 auto",
  display: "grid",
  gap: 20,
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  background: "#ffffff",
  padding: 20,
  boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
  background: "#ffffff",
};

const buttonStyle: React.CSSProperties = {
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

const COUNTRY_OPTIONS: SelectOption[] = [
  { value: "AU", label: "Australia" },
  { value: "US", label: "United States" },
  { value: "UK", label: "United Kingdom" },
  { value: "INTL", label: "Other / International" },
];

const AUSTRALIA_JURISDICTIONS: SelectOption[] = [
  { value: "ACT", label: "ACT" },
  { value: "NSW", label: "NSW" },
  { value: "NT", label: "NT" },
  { value: "QLD", label: "QLD" },
  { value: "SA", label: "SA" },
  { value: "TAS", label: "TAS" },
  { value: "VIC", label: "VIC" },
  { value: "WA", label: "WA" },
];

const UNITED_STATES_JURISDICTIONS: SelectOption[] = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
];

const UNITED_KINGDOM_JURISDICTIONS: SelectOption[] = [
  { value: "england", label: "England" },
  { value: "scotland", label: "Scotland" },
  { value: "wales", label: "Wales" },
  { value: "northern-ireland", label: "Northern Ireland" },
];

const AUSTRALIA_CURRICULUM_OPTIONS: SelectOption[] = [
  { value: "australian-curriculum", label: "Australian Curriculum" },
];

const UNITED_STATES_CURRICULUM_OPTIONS: SelectOption[] = [
  { value: "state-standards", label: "State standards" },
  { value: "common-core-aligned", label: "Common Core aligned" },
  { value: "custom", label: "Custom" },
];

const UNITED_KINGDOM_CURRICULUM_OPTIONS: SelectOption[] = [
  { value: "national-curriculum", label: "National Curriculum" },
  { value: "custom", label: "Custom" },
];

const INTERNATIONAL_CURRICULUM_OPTIONS: SelectOption[] = [
  { value: "custom-international", label: "Custom / International" },
  { value: "parent-selected-curriculum", label: "Parent-selected curriculum" },
  {
    value: "international-blended-curriculum",
    label: "International / blended curriculum",
  },
];

const GENERAL_REPORTING_OPTIONS: SelectOption[] = [
  { value: "family-summary", label: "Family summary" },
  { value: "progress-review", label: "Progress review" },
  { value: "compliance-support", label: "Compliance support" },
];

const INTERNATIONAL_REPORTING_OPTIONS: SelectOption[] = [
  {
    value: "standard-learning-portfolio-report",
    label: "Standard learning portfolio report",
    description:
      "Use a flexible report format suitable for families who want a clear learning record.",
  },
  { value: "progress-review", label: "Progress review" },
  { value: "compliance-support", label: "Compliance support" },
];

const WEEK_START_OPTIONS: SelectOption[] = [
  { value: "monday", label: "Monday" },
  { value: "sunday", label: "Sunday" },
];

const PRIVACY_OPTIONS: SelectOption[] = [
  { value: "family", label: "Family" },
  { value: "private", label: "Private by default" },
];

const EXPORT_STYLE_OPTIONS: SelectOption[] = [
  { value: "calm", label: "Simple" },
  { value: "detailed", label: "Detailed" },
];

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function getJurisdictionOptions(countryCode: string) {
  if (countryCode === "AU") return AUSTRALIA_JURISDICTIONS;
  if (countryCode === "US") return UNITED_STATES_JURISDICTIONS;
  if (countryCode === "UK") return UNITED_KINGDOM_JURISDICTIONS;
  return [];
}

function getCurriculumOptions(countryCode: string) {
  if (countryCode === "AU") return AUSTRALIA_CURRICULUM_OPTIONS;
  if (countryCode === "US") return UNITED_STATES_CURRICULUM_OPTIONS;
  if (countryCode === "UK") return UNITED_KINGDOM_CURRICULUM_OPTIONS;
  if (countryCode === "INTL") return INTERNATIONAL_CURRICULUM_OPTIONS;
  return [];
}

function getReportingOptions(countryCode: string) {
  return countryCode === "INTL"
    ? INTERNATIONAL_REPORTING_OPTIONS
    : GENERAL_REPORTING_OPTIONS;
}

function defaultReportingMode(countryCode: string) {
  return countryCode === "INTL"
    ? "standard-learning-portfolio-report"
    : "family-summary";
}

function decodeReportingModeForForm(
  countryCode: string | null,
  reportingMode: string | null,
) {
  if (countryCode === "INTL" && reportingMode === "family-summary") {
    return "standard-learning-portfolio-report";
  }

  return safe(reportingMode) || defaultReportingMode(safe(countryCode));
}

function encodeReportingModeForSave(reportingMode: string) {
  if (reportingMode === "standard-learning-portfolio-report") {
    return "family-summary";
  }

  return reportingMode;
}

function normalizeDraft(nextDraft: SettingsDraft) {
  const countryCode = safe(nextDraft.countryCode);
  const curriculumOptions = getCurriculumOptions(countryCode);
  const reportingOptions = getReportingOptions(countryCode);
  const needsFixedJurisdiction = countryCode === "AU" || countryCode === "US" || countryCode === "UK";

  const curriculumFrameworkId = curriculumOptions.some(
    (option) => option.value === nextDraft.curriculumFrameworkId,
  )
    ? nextDraft.curriculumFrameworkId
    : curriculumOptions[0]?.value ?? "";

  const reportingMode = reportingOptions.some(
    (option) => option.value === nextDraft.reportingMode,
  )
    ? nextDraft.reportingMode
    : defaultReportingMode(countryCode);

  return {
    ...nextDraft,
    countryCode,
    jurisdictionCode: needsFixedJurisdiction ? nextDraft.jurisdictionCode : safe(nextDraft.jurisdictionCode),
    curriculumFrameworkId,
    reportingMode,
    weekStart: safe(nextDraft.weekStart) || "monday",
    privacyDefault: safe(nextDraft.privacyDefault) || "family",
    exportStyle: safe(nextDraft.exportStyle) || "calm",
  };
}

function buildDraft(profile: FamilyProfile): SettingsDraft {
  return normalizeDraft({
    countryCode: safe(profile.countryCode),
    jurisdictionCode: safe(profile.jurisdictionCode),
    curriculumFrameworkId: safe(profile.curriculumFrameworkId),
    reportingMode: decodeReportingModeForForm(
      profile.countryCode,
      profile.reportingMode,
    ),
    weekStart: safe(profile.weekStart) || "monday",
    privacyDefault: safe(profile.privacyDefault) || "family",
    exportStyle: safe(profile.exportStyle) || "calm",
  });
}

function getOptionLabel(
  options: SelectOption[],
  value: string | null | undefined,
  fallback = "Not set",
) {
  const match = options.find((option) => option.value === value);
  return match?.label || safe(value) || fallback;
}

function getCountryLabel(countryCode: string | null) {
  return getOptionLabel(COUNTRY_OPTIONS, countryCode);
}

function getJurisdictionLabel(countryCode: string | null, jurisdictionCode: string | null) {
  if (!safe(jurisdictionCode)) return "Not set";
  return getOptionLabel(getJurisdictionOptions(safe(countryCode)), jurisdictionCode, safe(jurisdictionCode));
}

function getCurriculumLabel(countryCode: string | null, curriculumFrameworkId: string | null) {
  return getOptionLabel(
    getCurriculumOptions(safe(countryCode)),
    curriculumFrameworkId,
  );
}

function getReportingModeLabel(countryCode: string | null, reportingMode: string | null) {
  const formValue = decodeReportingModeForForm(countryCode, reportingMode);
  return getOptionLabel(getReportingOptions(safe(countryCode)), formValue);
}

function hasMyDayContext(profile: FamilyProfile | null) {
  if (!profile) return false;

  const countryCode = safe(profile.countryCode);
  const curriculumFrameworkId = safe(profile.curriculumFrameworkId);
  const jurisdictionCode = safe(profile.jurisdictionCode);

  if (!countryCode || !curriculumFrameworkId) {
    return false;
  }

  if (countryCode === "INTL") {
    return true;
  }

  return Boolean(jurisdictionCode);
}

function CleanSettingsWorkspaceBody() {
  const workspace = useCleanFamilyWorkspace();
  const [draft, setDraft] = useState<SettingsDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspace.profile) {
      setDraft(null);
      return;
    }

    setDraft(buildDraft(workspace.profile));
  }, [workspace.profile]);

  const jurisdictionOptions = useMemo(
    () => getJurisdictionOptions(draft?.countryCode || ""),
    [draft?.countryCode],
  );

  const curriculumOptions = useMemo(
    () => getCurriculumOptions(draft?.countryCode || ""),
    [draft?.countryCode],
  );

  const reportingOptions = useMemo(
    () => getReportingOptions(draft?.countryCode || ""),
    [draft?.countryCode],
  );

  const myDayContextReady = useMemo(
    () => hasMyDayContext(workspace.profile),
    [workspace.profile],
  );

  function updateCountry(countryCode: string) {
    setDraft((current) => {
      if (!current) return current;

      const nextCountryCode = safe(countryCode);
      const requiresFixedJurisdiction =
        nextCountryCode === "AU" ||
        nextCountryCode === "US" ||
        nextCountryCode === "UK";

      return normalizeDraft({
        ...current,
        countryCode: nextCountryCode,
        jurisdictionCode: requiresFixedJurisdiction ? "" : "",
      });
    });
  }

  function resetDraft() {
    if (!workspace.profile) return;
    setDraft(buildDraft(workspace.profile));
    setMessage(null);
    setError(null);
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!workspace.profile || !draft) return;

    const countryCode = safe(draft.countryCode);
    const jurisdictionCode = safe(draft.jurisdictionCode);

    if (!countryCode) {
      setError("Choose your country first.");
      setMessage(null);
      return;
    }

    if (
      (countryCode === "AU" || countryCode === "US" || countryCode === "UK") &&
      !jurisdictionCode
    ) {
      setError("Choose your state or jurisdiction before saving.");
      setMessage(null);
      return;
    }

    if (!safe(draft.curriculumFrameworkId)) {
      setError("Choose a curriculum framework before saving.");
      setMessage(null);
      return;
    }

    if (!safe(draft.reportingMode)) {
      setError("Choose a reporting mode before saving.");
      setMessage(null);
      return;
    }

    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      await updateCleanFamilyProfile(workspace.profile.id, {
        countryCode,
        jurisdictionCode: jurisdictionCode || null,
        curriculumFrameworkId: safe(draft.curriculumFrameworkId) || null,
        reportingMode: encodeReportingModeForSave(draft.reportingMode),
        weekStart: safe(draft.weekStart) || "monday",
        privacyDefault: safe(draft.privacyDefault) || "family",
        exportStyle: safe(draft.exportStyle) || "calm",
      });

      setMessage("Family settings updated.");
      await workspace.reload();
    } catch (nextError) {
      setError(
        normalizeCleanErrorMessage(
          nextError,
          "We could not update your family settings.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={shellStyle}>
      <div style={wrapStyle}>
        <section style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "grid", gap: 8, flex: 1, minWidth: 220 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  color: "#64748b",
                  textTransform: "uppercase",
                }}
              >
                Family settings
              </div>
              <h1 style={{ margin: 0, fontSize: 28, color: "#0f172a" }}>My Settings</h1>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                Set your family location, curriculum direction, reporting context, and day-to-day preferences here.
              </p>
              <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6 }}>
                My Profile stays focused on family and learner details.
              </p>
            </div>
            <CleanAccountMenu />
          </div>
        </section>

        {workspace.loading ? <section style={cardStyle}>Loading family settings...</section> : null}

        {!workspace.loading && workspace.schemaMissing ? (
          <section style={cardStyle}>
            <strong style={{ display: "block", marginBottom: 8 }}>
              {CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE}
            </strong>
            <p style={{ margin: 0, color: "#475569" }}>
              This settings editor only uses the clean family profile fields.
            </p>
          </section>
        ) : null}

        {!workspace.loading && !workspace.schemaMissing && workspace.requiresFamilyCreation ? (
          <section style={cardStyle}>
            <p style={{ margin: 0, color: "#475569" }}>
              Create a family profile first. Settings live with the family profile.
            </p>
          </section>
        ) : null}

        {!workspace.loading && !workspace.schemaMissing && workspace.profile ? (
          <>
            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, color: "#0f172a" }}>Current family settings</h2>
              <p style={{ marginTop: 0, color: "#475569", lineHeight: 1.6 }}>
                These settings shape how MyLearna frames planning, portfolios, and reports for your family.
              </p>
              <div style={{ display: "grid", gap: 10, color: "#334155" }}>
                <div>
                  <strong>Country:</strong> {getCountryLabel(workspace.profile.countryCode)}
                </div>
                <div>
                  <strong>State / jurisdiction:</strong>{" "}
                  {getJurisdictionLabel(
                    workspace.profile.countryCode,
                    workspace.profile.jurisdictionCode,
                  )}
                </div>
                <div>
                  <strong>Curriculum framework:</strong>{" "}
                  {getCurriculumLabel(
                    workspace.profile.countryCode,
                    workspace.profile.curriculumFrameworkId,
                  )}
                </div>
                <div>
                  <strong>Reporting mode:</strong>{" "}
                  {getReportingModeLabel(
                    workspace.profile.countryCode,
                    workspace.profile.reportingMode,
                  )}
                </div>
                <div>
                  <strong>Week start:</strong>{" "}
                  {getOptionLabel(WEEK_START_OPTIONS, workspace.profile.weekStart)}
                </div>
                <div>
                  <strong>Privacy default:</strong>{" "}
                  {getOptionLabel(PRIVACY_OPTIONS, workspace.profile.privacyDefault)}
                </div>
                <div>
                  <strong>Export style:</strong>{" "}
                  {getOptionLabel(EXPORT_STYLE_OPTIONS, workspace.profile.exportStyle)}
                </div>
              </div>
            </section>

            {draft ? (
              <section style={cardStyle}>
                <h2 style={{ marginTop: 0, color: "#0f172a" }}>Edit family settings</h2>
                <p style={{ marginTop: 0, color: "#475569", lineHeight: 1.6 }}>
                  Keep this simple: choose your family context, how you want weeks to start, and how MyLearna should frame reports.
                </p>

                <form onSubmit={handleSave} style={{ display: "grid", gap: 18 }}>
                  <div style={{ display: "grid", gap: 8 }}>
                    <label style={{ color: "#334155", fontWeight: 700 }}>Country</label>
                    <select
                      value={draft.countryCode}
                      onChange={(event) => updateCountry(event.target.value)}
                      style={inputStyle}
                      disabled={saving}
                    >
                      <option value="">Choose country</option>
                      {COUNTRY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: "grid", gap: 8 }}>
                    <label style={{ color: "#334155", fontWeight: 700 }}>
                      State / jurisdiction
                    </label>
                    {draft.countryCode === "INTL" ? (
                      <>
                        <input
                          value={draft.jurisdictionCode}
                          onChange={(event) =>
                            setDraft((current) =>
                              current
                                ? { ...current, jurisdictionCode: event.target.value }
                                : current,
                            )
                          }
                          placeholder="Not specified"
                          style={inputStyle}
                          disabled={saving}
                        />
                        <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6 }}>
                          Leave this blank if you do not need a state or regional label.
                        </p>
                      </>
                    ) : (
                      <select
                        value={draft.jurisdictionCode}
                        onChange={(event) =>
                          setDraft((current) =>
                            current
                              ? { ...current, jurisdictionCode: event.target.value }
                              : current,
                          )
                        }
                        style={inputStyle}
                        disabled={saving || !draft.countryCode}
                      >
                        <option value="">Choose state / jurisdiction</option>
                        {jurisdictionOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div style={{ display: "grid", gap: 8 }}>
                    <label style={{ color: "#334155", fontWeight: 700 }}>
                      Curriculum framework
                    </label>
                    <select
                      value={draft.curriculumFrameworkId}
                      onChange={(event) =>
                        setDraft((current) =>
                          current
                            ? { ...current, curriculumFrameworkId: event.target.value }
                            : current,
                        )
                      }
                      style={inputStyle}
                      disabled={saving || !draft.countryCode}
                    >
                      <option value="">Choose curriculum framework</option>
                      {curriculumOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: "grid", gap: 8 }}>
                    <label style={{ color: "#334155", fontWeight: 700 }}>
                      Reporting mode
                    </label>
                    <select
                      value={draft.reportingMode}
                      onChange={(event) =>
                        setDraft((current) =>
                          current
                            ? { ...current, reportingMode: event.target.value }
                            : current,
                        )
                      }
                      style={inputStyle}
                      disabled={saving || !draft.countryCode}
                    >
                      {reportingOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {draft.countryCode === "INTL" ? (
                      <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                        Use a flexible report format suitable for families who want a clear learning record. This does not make legal or regulatory claims.
                      </p>
                    ) : (
                      <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6 }}>
                        Detailed state or country compliance rules come later. This setting only shapes the report style for now.
                      </p>
                    )}
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: 16,
                    }}
                  >
                    <div style={{ display: "grid", gap: 8 }}>
                      <label style={{ color: "#334155", fontWeight: 700 }}>Week start</label>
                      <select
                        value={draft.weekStart}
                        onChange={(event) =>
                          setDraft((current) =>
                            current ? { ...current, weekStart: event.target.value } : current,
                          )
                        }
                        style={inputStyle}
                        disabled={saving}
                      >
                        {WEEK_START_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: "grid", gap: 8 }}>
                      <label style={{ color: "#334155", fontWeight: 700 }}>
                        Privacy default
                      </label>
                      <select
                        value={draft.privacyDefault}
                        onChange={(event) =>
                          setDraft((current) =>
                            current
                              ? { ...current, privacyDefault: event.target.value }
                              : current,
                          )
                        }
                        style={inputStyle}
                        disabled={saving}
                      >
                        {PRIVACY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: "grid", gap: 8 }}>
                      <label style={{ color: "#334155", fontWeight: 700 }}>
                        Export style
                      </label>
                      <select
                        value={draft.exportStyle}
                        onChange={(event) =>
                          setDraft((current) =>
                            current ? { ...current, exportStyle: event.target.value } : current,
                          )
                        }
                        style={inputStyle}
                        disabled={saving}
                      >
                        {EXPORT_STYLE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button type="submit" style={buttonStyle} disabled={saving}>
                      {saving ? "Saving..." : "Save settings"}
                    </button>
                    <button
                      type="button"
                      style={secondaryButtonStyle}
                      disabled={saving}
                      onClick={resetDraft}
                    >
                      Reset
                    </button>
                  </div>
                </form>
              </section>
            ) : null}

            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, color: "#0f172a" }}>My Day setup status</h2>
              <p style={{ marginTop: 0, color: "#475569", lineHeight: 1.6 }}>
                {myDayContextReady
                  ? "Country, curriculum, and reporting context are ready for My Day guidance."
                  : "Finish country, state or jurisdiction, and curriculum settings to complete this part of setup."}
              </p>
            </section>
          </>
        ) : null}

        {message ? (
          <section style={cardStyle}>
            <p style={{ margin: 0, color: "#0f766e" }}>{message}</p>
          </section>
        ) : null}

        {error ? (
          <section style={cardStyle}>
            <p style={{ margin: 0, color: "#b91c1c" }}>{error}</p>
          </section>
        ) : null}
      </div>
    </div>
  );
}

export default function CleanSettingsWorkspace() {
  return (
    <CleanFamilyWorkspaceProvider>
      <CleanSettingsWorkspaceBody />
    </CleanFamilyWorkspaceProvider>
  );
}
