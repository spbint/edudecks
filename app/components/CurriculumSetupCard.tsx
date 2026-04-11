"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CurriculumPreferences } from "@/lib/familySettings";
import {
  CurriculumCountry,
  CurriculumFramework,
  CurriculumLevel,
  CurriculumRegion,
  CurriculumSubject,
  findFrameworkById,
  findLevelLabel,
  findSubjectLabel,
  getRecommendedFrameworkId,
  getRecommendedLevelId,
  loadCurriculumCountries,
  loadCurriculumFrameworks,
  loadCurriculumLevels,
  loadCurriculumRegions,
  loadCurriculumSubjects,
} from "@/lib/curriculum";

type CurriculumSetupCardProps = {
  value: CurriculumPreferences;
  onChange: (curriculum: CurriculumPreferences) => void;
};

const FALLBACK_COUNTRIES = [
  { id: "us", name: "United States" },
  { id: "au", name: "Australia" },
  { id: "uk", name: "United Kingdom" },
  { id: "nz", name: "New Zealand" },
  { id: "ca", name: "Canada" },
  { id: "za", name: "South Africa" },
  { id: "sg", name: "Singapore" },
  { id: "ib", name: "International Baccalaureate" },
] as unknown as CurriculumCountry[];

const FALLBACK_REGIONS = [] as unknown as CurriculumRegion[];

const FALLBACK_FRAMEWORKS = [
  {
    id: "common-core",
    name: "Common Core",
    country_id: "us",
    region_id: undefined,
    subject_ids: ["english", "math", "science", "humanities"],
  },
  {
    id: "acara",
    name: "Australian Curriculum",
    country_id: "au",
    region_id: undefined,
    subject_ids: ["english", "math", "science", "humanities"],
  },
  {
    id: "uk-national",
    name: "National Curriculum",
    country_id: "uk",
    region_id: undefined,
    subject_ids: ["english", "math", "science", "humanities"],
  },
  {
    id: "nz-curriculum",
    name: "New Zealand Curriculum",
    country_id: "nz",
    region_id: undefined,
    subject_ids: ["english", "math", "science", "humanities"],
  },
  {
    id: "canada-general",
    name: "Canadian Curriculum",
    country_id: "ca",
    region_id: undefined,
    subject_ids: ["english", "math", "science", "humanities"],
  },
  {
    id: "caps",
    name: "CAPS",
    country_id: "za",
    region_id: undefined,
    subject_ids: ["english", "math", "science", "humanities"],
  },
  {
    id: "singapore-national",
    name: "Singapore Curriculum",
    country_id: "sg",
    region_id: undefined,
    subject_ids: ["english", "math", "science", "humanities"],
  },
  {
    id: "ib-pyp",
    name: "IB Primary Years Programme",
    country_id: "ib",
    region_id: undefined,
    subject_ids: ["english", "math", "science", "humanities"],
  },
] as unknown as CurriculumFramework[];

const FALLBACK_LEVELS = [
  {
    id: "k",
    label: "Kindergarten / Prep",
    sort: 0,
    framework_ids: FALLBACK_FRAMEWORKS.map((f) => f.id),
  },
  {
    id: "year-1",
    label: "Year 1 / Grade 1",
    sort: 1,
    framework_ids: FALLBACK_FRAMEWORKS.map((f) => f.id),
  },
  {
    id: "year-2",
    label: "Year 2 / Grade 2",
    sort: 2,
    framework_ids: FALLBACK_FRAMEWORKS.map((f) => f.id),
  },
  {
    id: "year-3",
    label: "Year 3 / Grade 3",
    sort: 3,
    framework_ids: FALLBACK_FRAMEWORKS.map((f) => f.id),
  },
  {
    id: "year-4",
    label: "Year 4 / Grade 4",
    sort: 4,
    framework_ids: FALLBACK_FRAMEWORKS.map((f) => f.id),
  },
  {
    id: "year-5",
    label: "Year 5 / Grade 5",
    sort: 5,
    framework_ids: FALLBACK_FRAMEWORKS.map((f) => f.id),
  },
  {
    id: "year-6",
    label: "Year 6 / Grade 6",
    sort: 6,
    framework_ids: FALLBACK_FRAMEWORKS.map((f) => f.id),
  },
  {
    id: "year-7",
    label: "Year 7 / Grade 7",
    sort: 7,
    framework_ids: FALLBACK_FRAMEWORKS.map((f) => f.id),
  },
  {
    id: "year-8",
    label: "Year 8 / Grade 8",
    sort: 8,
    framework_ids: FALLBACK_FRAMEWORKS.map((f) => f.id),
  },
  {
    id: "year-9",
    label: "Year 9 / Grade 9",
    sort: 9,
    framework_ids: FALLBACK_FRAMEWORKS.map((f) => f.id),
  },
  {
    id: "year-10",
    label: "Year 10 / Grade 10",
    sort: 10,
    framework_ids: FALLBACK_FRAMEWORKS.map((f) => f.id),
  },
  {
    id: "year-11",
    label: "Year 11 / Grade 11",
    sort: 11,
    framework_ids: FALLBACK_FRAMEWORKS.map((f) => f.id),
  },
  {
    id: "year-12",
    label: "Year 12 / Grade 12",
    sort: 12,
    framework_ids: FALLBACK_FRAMEWORKS.map((f) => f.id),
  },
] as unknown as CurriculumLevel[];

const FALLBACK_SUBJECTS = [
  {
    id: "english",
    label: "English / Language Arts",
    framework_ids: FALLBACK_FRAMEWORKS.map((f) => f.id),
  },
  {
    id: "math",
    label: "Mathematics",
    framework_ids: FALLBACK_FRAMEWORKS.map((f) => f.id),
  },
  {
    id: "science",
    label: "Science",
    framework_ids: FALLBACK_FRAMEWORKS.map((f) => f.id),
  },
  {
    id: "humanities",
    label: "Humanities",
    framework_ids: FALLBACK_FRAMEWORKS.map((f) => f.id),
  },
  {
    id: "arts",
    label: "Arts",
    framework_ids: FALLBACK_FRAMEWORKS.map((f) => f.id),
  },
  {
    id: "health",
    label: "Health & PE",
    framework_ids: FALLBACK_FRAMEWORKS.map((f) => f.id),
  },
] as unknown as CurriculumSubject[];

export default function CurriculumSetupCard({
  value,
  onChange,
}: CurriculumSetupCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<CurriculumPreferences>(value);
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadMessage, setLoadMessage] = useState("");
  const [countries, setCountries] = useState<CurriculumCountry[]>([]);
  const [regions, setRegions] = useState<CurriculumRegion[]>([]);
  const [frameworks, setFrameworks] = useState<CurriculumFramework[]>([]);
  const [levels, setLevels] = useState<CurriculumLevel[]>([]);
  const [subjects, setSubjects] = useState<CurriculumSubject[]>([]);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setLoadMessage("");

      try {
        const settled = await Promise.allSettled([
          loadCurriculumCountries(),
          loadCurriculumRegions(),
          loadCurriculumFrameworks(),
          loadCurriculumLevels(),
          loadCurriculumSubjects(),
        ]);

        if (!active) return;

        const [
          countryResult,
          regionResult,
          frameworkResult,
          levelResult,
          subjectResult,
        ] = settled;

        const loadedCountries =
          countryResult.status === "fulfilled" ? countryResult.value : [];
        const loadedRegions =
          regionResult.status === "fulfilled" ? regionResult.value : [];
        const loadedFrameworks =
          frameworkResult.status === "fulfilled" ? frameworkResult.value : [];
        const loadedLevels =
          levelResult.status === "fulfilled" ? levelResult.value : [];
        const loadedSubjects =
          subjectResult.status === "fulfilled" ? subjectResult.value : [];

        const nextCountries =
          loadedCountries.length > 0 ? loadedCountries : FALLBACK_COUNTRIES;
        const nextRegions =
          loadedRegions.length > 0 ? loadedRegions : FALLBACK_REGIONS;
        const nextFrameworks =
          loadedFrameworks.length > 0 ? loadedFrameworks : FALLBACK_FRAMEWORKS;
        const nextLevels =
          loadedLevels.length > 0 ? loadedLevels : FALLBACK_LEVELS;
        const nextSubjects =
          loadedSubjects.length > 0 ? loadedSubjects : FALLBACK_SUBJECTS;

        setCountries(nextCountries);
        setRegions(nextRegions);
        setFrameworks(nextFrameworks);
        setLevels(nextLevels);
        setSubjects(nextSubjects);

        if (
          loadedCountries.length === 0 ||
          loadedFrameworks.length === 0 ||
          loadedLevels.length === 0
        ) {
          setLoadMessage(
            "Live curriculum data could not be loaded right now, so built-in fallback options are being shown.",
          );
        } else if (settled.some((result) => result.status === "rejected")) {
          setLoadMessage(
            "Some curriculum lists could not be loaded, so fallback options are being shown where needed.",
          );
        }
      } catch (error) {
        if (!active) return;
        console.error("Curriculum setup load failed", error);
        setCountries(FALLBACK_COUNTRIES);
        setRegions(FALLBACK_REGIONS);
        setFrameworks(FALLBACK_FRAMEWORKS);
        setLevels(FALLBACK_LEVELS);
        setSubjects(FALLBACK_SUBJECTS);
        setLoadMessage(
          "Curriculum data could not be loaded right now, so built-in fallback options are being shown.",
        );
      } finally {
        if (!active) return;
        setLoading(false);
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const hasSetup = Boolean(
    value.country_id || value.framework_id || value.level_id,
  );

  const headerButtonLabel = hasSetup
    ? "Edit curriculum setup"
    : "Set up curriculum";

  const selectedCountry = countries.find(
    (country) => country.id === value.country_id,
  );
  const selectedRegion = regions.find((region) => region.id === value.region_id);
  const selectedFramework =
    frameworks.find((framework) => framework.id === value.framework_id) ||
    findFrameworkById(value.framework_id);
  const selectedLevelLabel =
    levels.find((level) => level.id === value.level_id)?.label ||
    findLevelLabel(value.level_id);
  const selectedSubjectNames = value.subject_ids
    .map((id) => {
      const found = subjects.find((subject) => subject.id === id);
      return found?.label || findSubjectLabel(id);
    })
    .filter(Boolean);

  const regionOptions = useMemo(
    () => regions.filter((region) => region.country_id === draft.country_id),
    [draft.country_id, regions],
  );

  const frameworkOptions = useMemo(() => {
    return frameworks.filter((framework) => {
      if (!draft.country_id) return true;
      if (framework.country_id !== draft.country_id) return false;
      if (draft.region_id && framework.region_id) {
        return framework.region_id === draft.region_id;
      }
      return draft.region_id ? framework.region_id === undefined : true;
    });
  }, [draft.country_id, draft.region_id, frameworks]);

  const levelOptions = useMemo(() => {
    return levels
      .filter(
        (level) =>
          !draft.framework_id || level.framework_ids.includes(draft.framework_id),
      )
      .slice()
      .sort((a, b) => a.sort - b.sort);
  }, [draft.framework_id, levels]);

  const subjectOptions = useMemo(() => {
    return subjects.filter(
      (subject) =>
        (subject.framework_ids || []).length === 0 ||
        !draft.framework_id ||
        subject.framework_ids.includes(draft.framework_id),
    );
  }, [draft.framework_id, subjects]);

  const recommendedFrameworkId = useMemo(() => {
    const recommended = getRecommendedFrameworkId(
      draft.country_id,
      draft.region_id,
    );
    if (recommended) return recommended;
    return frameworkOptions[0]?.id ?? null;
  }, [draft.country_id, draft.region_id, frameworkOptions]);

  const recommendedFramework = useMemo(() => {
    return (
      frameworks.find((framework) => framework.id === recommendedFrameworkId) ||
      frameworkOptions[0] ||
      null
    );
  }, [frameworkOptions, frameworks, recommendedFrameworkId]);

  const recommendedLevelId = useMemo(() => {
    const recommended = getRecommendedLevelId(recommendedFramework?.id ?? null);
    if (recommended) return recommended;
    return levelOptions[0]?.id ?? null;
  }, [levelOptions, recommendedFramework]);

  const recommendedLevelLabel =
    levels.find((level) => level.id === recommendedLevelId)?.label ||
    findLevelLabel(recommendedLevelId);

  function updateDraft<K extends keyof CurriculumPreferences>(
    key: K,
    valueToSet: CurriculumPreferences[K],
  ) {
    setDraft((prev) => ({
      ...prev,
      [key]: valueToSet,
    }));
  }

  function handleCountryChange(id: string) {
    updateDraft("country_id", id || null);
    updateDraft("region_id", null);
    updateDraft("framework_id", null);
    updateDraft("level_id", null);
    updateDraft("subject_ids", []);
  }

  function handleRegionChange(id: string) {
    updateDraft("region_id", id || null);
    updateDraft("framework_id", null);
    updateDraft("level_id", null);
    updateDraft("subject_ids", []);
  }

  function handleFrameworkChange(id: string) {
    updateDraft("framework_id", id || null);
    updateDraft("level_id", null);
    updateDraft("subject_ids", []);
  }

  function handleLevelChange(id: string) {
    updateDraft("level_id", id || null);
  }

  function handleSubjectToggle(subjectId: string) {
    updateDraft(
      "subject_ids",
      draft.subject_ids.includes(subjectId)
        ? draft.subject_ids.filter((id) => id !== subjectId)
        : [...draft.subject_ids, subjectId],
    );
  }

  function handleApply() {
    onChange(draft);
    setIsEditing(false);
    setStatusMessage("Curriculum setup updated for planning and reporting.");
    window.setTimeout(() => {
      setStatusMessage("");
    }, 4000);
  }

  function handleCancel() {
    setDraft(value);
    setIsEditing(false);
  }

  function applyRecommendedSetup() {
    if (!recommendedFramework) return;

    setDraft((prev) => ({
      ...prev,
      country_id: prev.country_id || recommendedFramework.country_id,
      region_id: recommendedFramework.region_id ?? prev.region_id,
      framework_id: recommendedFramework.id,
      level_id: recommendedLevelId ?? prev.level_id,
      subject_ids:
        recommendedFramework.subject_ids?.length > 0
          ? recommendedFramework.subject_ids
          : prev.subject_ids,
    }));
  }

  return (
    <section id="curriculum-setup" style={cardStyles.card}>
      <div style={cardStyles.header}>
        <div>
          <div style={cardStyles.eyebrow}>Curriculum setup</div>
          <div style={cardStyles.title}>Curriculum setup</div>
          <p style={cardStyles.description}>
            Choose the learning framework that best matches your child’s context.
            You can keep this simple and change it later.
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
            >
              {headerButtonLabel}
            </button>
          )}
        </div>
      </div>

      {statusMessage ? <div style={cardStyles.status}>{statusMessage}</div> : null}
      {loadMessage ? <div style={cardStyles.loading}>{loadMessage}</div> : null}

      {isEditing ? (
        <div>
          {loading ? (
            <div style={cardStyles.loading}>Loading curriculum data…</div>
          ) : (
            <div style={cardStyles.form}>
              <Field
                label="Country"
                help="Choose the country your learning and reporting context best fits."
              >
                <select
                  value={draft.country_id ?? ""}
                  onChange={(event) => handleCountryChange(event.target.value)}
                  style={cardStyles.input}
                >
                  <option value="">Select a country</option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </Field>

              {regionOptions.length > 0 ? (
                <Field
                  label="State / region"
                  help="Some countries use state or regional frameworks. If you are unsure, you can skip this for now."
                >
                  <select
                    value={draft.region_id ?? ""}
                    onChange={(event) => handleRegionChange(event.target.value)}
                    style={cardStyles.input}
                  >
                    <option value="">Skip for now</option>
                    {regionOptions.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : null}

              <Field
                label="Framework"
                help="We’ll suggest the simplest starting framework for your setup."
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
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="Year level / grade band"
                help="Choose the level that best matches your child right now. You can update this anytime."
              >
                <select
                  value={draft.level_id ?? ""}
                  onChange={(event) => handleLevelChange(event.target.value)}
                  style={cardStyles.input}
                  disabled={!draft.framework_id}
                >
                  <option value="">Select a level</option>
                  {levelOptions.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </Field>

              {subjectOptions.length > 0 ? (
                <Field
                  label="Learning areas (optional)"
                  help="You can narrow the setup to the areas you want to focus on first."
                >
                  <div style={cardStyles.subjectGrid}>
                    {subjectOptions.map((subject) => {
                      const selected = draft.subject_ids.includes(subject.id);
                      return (
                        <label
                          key={subject.id}
                          style={{
                            ...cardStyles.subjectChip,
                            ...(selected ? cardStyles.subjectChipActive : {}),
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => handleSubjectToggle(subject.id)}
                            style={cardStyles.checkbox}
                          />
                          {subject.label}
                        </label>
                      );
                    })}
                  </div>
                </Field>
              ) : null}

              {recommendedFramework ? (
                <div style={cardStyles.recommendation}>
                  <div style={{ fontWeight: 600 }}>
                    Recommended
                    {selectedCountry ? ` for ${selectedCountry.name}` : ""}:
                    <span style={{ marginLeft: 6 }}>{recommendedFramework.name}</span>
                  </div>
                  {recommendedLevelLabel ? (
                    <div style={cardStyles.recommendationSub}>
                      Suggested level: {recommendedLevelLabel}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    style={cardStyles.recommendButton}
                    onClick={applyRecommendedSetup}
                  >
                    Use recommended setup
                  </button>
                </div>
              ) : null}

              <div style={cardStyles.actions}>
                <button
                  type="button"
                  style={cardStyles.primaryButton}
                  onClick={handleApply}
                  disabled={!draft.country_id || !draft.framework_id}
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
          )}
        </div>
      ) : (
        <div>
          {hasSetup ? (
            <div style={cardStyles.summary}>
              <Row label="Country" value={selectedCountry?.name ?? "Not set yet"} />
              {selectedRegion ? (
                <Row label="State / region" value={selectedRegion.name} />
              ) : null}
              {selectedFramework ? (
                <Row label="Framework" value={selectedFramework.name} />
              ) : null}
              {selectedLevelLabel ? (
                <Row label="Year level" value={selectedLevelLabel} />
              ) : null}
              {selectedSubjectNames.length > 0 ? (
                <Row
                  label="Learning areas"
                  value={selectedSubjectNames.join(" · ")}
                />
              ) : null}
            </div>
          ) : (
            <div style={cardStyles.empty}>
              <p>
                Set your curriculum once so EduDecks can organise planning,
                capture, and reports more clearly.
              </p>
              <button
                type="button"
                style={cardStyles.secondaryButton}
                onClick={() => {
                  setDraft(value);
                  setIsEditing(true);
                }}
                disabled={loading}
              >
                Set up curriculum
              </button>
            </div>
          )}
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
  subjectGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 8,
  },
  subjectChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    padding: "6px 12px",
    background: "#f8fafc",
    fontSize: 13,
    cursor: "pointer",
  },
  subjectChipActive: {
    borderColor: "#1d4ed8",
    background: "#e0e7ff",
    color: "#1d4ed8",
  },
  checkbox: {
    width: 14,
    height: 14,
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 10,
  },
  recommendation: {
    border: "1px solid #e0e7ff",
    borderRadius: 16,
    padding: 16,
    background: "#f8fafc",
    display: "grid",
    gap: 6,
  },
  recommendationSub: {
    fontSize: 13,
    color: "#475569",
  },
  recommendButton: {
    justifySelf: "start",
    marginTop: 4,
    background: "#ffffff",
    border: "1px solid #c7d2fe",
    borderRadius: 12,
    color: "#3730a3",
    fontWeight: 700,
    padding: "8px 14px",
    fontSize: 13,
    cursor: "pointer",
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