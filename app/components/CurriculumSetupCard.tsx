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

async function withTimeout<T>(
  promise: Promise<T>,
  label: string,
  ms = 5000,
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

function safe(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalize(value: unknown) {
  return safe(value).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function inferCountryKey(value: unknown) {
  const v = normalize(value);

  if (
    v === "us" ||
    v === "usa" ||
    v === "unitedstates" ||
    v === "unitedstatesofamerica"
  ) {
    return "us";
  }

  if (v === "au" || v === "australia") return "au";
  if (v === "uk" || v === "unitedkingdom" || v === "england") return "uk";
  if (v === "nz" || v === "newzealand") return "nz";
  if (v === "ca" || v === "canada") return "ca";
  if (v === "za" || v === "southafrica") return "za";
  if (v === "sg" || v === "singapore") return "sg";
  if (v === "ib" || v === "internationalbaccalaureate") return "ib";

  return "";
}

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

const FALLBACK_REGIONS = [
  { id: "al", name: "Alabama", country_id: "us" },
  { id: "ak", name: "Alaska", country_id: "us" },
  { id: "az", name: "Arizona", country_id: "us" },
  { id: "ar", name: "Arkansas", country_id: "us" },
  { id: "ca-state", name: "California", country_id: "us" },
  { id: "co", name: "Colorado", country_id: "us" },
  { id: "ct", name: "Connecticut", country_id: "us" },
  { id: "de", name: "Delaware", country_id: "us" },
  { id: "dc", name: "District of Columbia", country_id: "us" },
  { id: "fl", name: "Florida", country_id: "us" },
  { id: "ga", name: "Georgia", country_id: "us" },
  { id: "hi", name: "Hawaii", country_id: "us" },
  { id: "id", name: "Idaho", country_id: "us" },
  { id: "il", name: "Illinois", country_id: "us" },
  { id: "in", name: "Indiana", country_id: "us" },
  { id: "ia", name: "Iowa", country_id: "us" },
  { id: "ks", name: "Kansas", country_id: "us" },
  { id: "ky", name: "Kentucky", country_id: "us" },
  { id: "la", name: "Louisiana", country_id: "us" },
  { id: "me", name: "Maine", country_id: "us" },
  { id: "md", name: "Maryland", country_id: "us" },
  { id: "ma", name: "Massachusetts", country_id: "us" },
  { id: "mi", name: "Michigan", country_id: "us" },
  { id: "mn", name: "Minnesota", country_id: "us" },
  { id: "ms", name: "Mississippi", country_id: "us" },
  { id: "mo", name: "Missouri", country_id: "us" },
  { id: "mt", name: "Montana", country_id: "us" },
  { id: "ne", name: "Nebraska", country_id: "us" },
  { id: "nv", name: "Nevada", country_id: "us" },
  { id: "nh", name: "New Hampshire", country_id: "us" },
  { id: "nj", name: "New Jersey", country_id: "us" },
  { id: "nm", name: "New Mexico", country_id: "us" },
  { id: "ny", name: "New York", country_id: "us" },
  { id: "nc", name: "North Carolina", country_id: "us" },
  { id: "nd", name: "North Dakota", country_id: "us" },
  { id: "oh", name: "Ohio", country_id: "us" },
  { id: "ok", name: "Oklahoma", country_id: "us" },
  { id: "or", name: "Oregon", country_id: "us" },
  { id: "pa", name: "Pennsylvania", country_id: "us" },
  { id: "ri", name: "Rhode Island", country_id: "us" },
  { id: "sc", name: "South Carolina", country_id: "us" },
  { id: "sd", name: "South Dakota", country_id: "us" },
  { id: "tn", name: "Tennessee", country_id: "us" },
  { id: "tx", name: "Texas", country_id: "us" },
  { id: "ut", name: "Utah", country_id: "us" },
  { id: "vt", name: "Vermont", country_id: "us" },
  { id: "va", name: "Virginia", country_id: "us" },
  { id: "wa", name: "Washington", country_id: "us" },
  { id: "wv", name: "West Virginia", country_id: "us" },
  { id: "wi", name: "Wisconsin", country_id: "us" },
  { id: "wy", name: "Wyoming", country_id: "us" },
] as unknown as CurriculumRegion[];

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
    framework_ids: FALLBACK_FRAMEWORKS.map((f) => String(f.id)),
  },
  {
    id: "year-1",
    label: "Year 1 / Grade 1",
    sort: 1,
    framework_ids: FALLBACK_FRAMEWORKS.map((f) => String(f.id)),
  },
  {
    id: "year-2",
    label: "Year 2 / Grade 2",
    sort: 2,
    framework_ids: FALLBACK_FRAMEWORKS.map((f) => String(f.id)),
  },
  {
    id: "year-3",
    label: "Year 3 / Grade 3",
    sort: 3,
    framework_ids: FALLBACK_FRAMEWORKS.map((f) => String(f.id)),
  },
  {
    id: "year-4",
    label: "Year 4 / Grade 4",
    sort: 4,
    framework_ids: FALLBACK_FRAMEWORKS.map((f) => String(f.id)),
  },
  {
    id: "year-5",
    label: "Year 5 / Grade 5",
    sort: 5,
    framework_ids: FALLBACK_FRAMEWORKS.map((f) => String(f.id)),
  },
  {
    id: "year-6",
    label: "Year 6 / Grade 6",
    sort: 6,
    framework_ids: FALLBACK_FRAMEWORKS.map((f) => String(f.id)),
  },
  {
    id: "year-7",
    label: "Year 7 / Grade 7",
    sort: 7,
    framework_ids: FALLBACK_FRAMEWORKS.map((f) => String(f.id)),
  },
  {
    id: "year-8",
    label: "Year 8 / Grade 8",
    sort: 8,
    framework_ids: FALLBACK_FRAMEWORKS.map((f) => String(f.id)),
  },
  {
    id: "year-9",
    label: "Year 9 / Grade 9",
    sort: 9,
    framework_ids: FALLBACK_FRAMEWORKS.map((f) => String(f.id)),
  },
  {
    id: "year-10",
    label: "Year 10 / Grade 10",
    sort: 10,
    framework_ids: FALLBACK_FRAMEWORKS.map((f) => String(f.id)),
  },
  {
    id: "year-11",
    label: "Year 11 / Grade 11",
    sort: 11,
    framework_ids: FALLBACK_FRAMEWORKS.map((f) => String(f.id)),
  },
  {
    id: "year-12",
    label: "Year 12 / Grade 12",
    sort: 12,
    framework_ids: FALLBACK_FRAMEWORKS.map((f) => String(f.id)),
  },
] as unknown as CurriculumLevel[];

const FALLBACK_SUBJECTS = [
  {
    id: "english",
    label: "English Language Arts",
    framework_ids: FALLBACK_FRAMEWORKS.map((f) => String(f.id)),
  },
  {
    id: "math",
    label: "Mathematics",
    framework_ids: FALLBACK_FRAMEWORKS.map((f) => String(f.id)),
  },
  {
    id: "science",
    label: "Science",
    framework_ids: FALLBACK_FRAMEWORKS.map((f) => String(f.id)),
  },
  {
    id: "humanities",
    label: "Humanities",
    framework_ids: FALLBACK_FRAMEWORKS.map((f) => String(f.id)),
  },
  {
    id: "arts",
    label: "Arts",
    framework_ids: FALLBACK_FRAMEWORKS.map((f) => String(f.id)),
  },
  {
    id: "health",
    label: "Health & PE",
    framework_ids: FALLBACK_FRAMEWORKS.map((f) => String(f.id)),
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
          withTimeout(loadCurriculumCountries(), "load curriculum countries"),
          withTimeout(loadCurriculumRegions(), "load curriculum regions"),
          withTimeout(loadCurriculumFrameworks(), "load curriculum frameworks"),
          withTimeout(loadCurriculumLevels(), "load curriculum levels"),
          withTimeout(loadCurriculumSubjects(), "load curriculum subjects"),
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

        setCountries(
          loadedCountries.length > 0 ? loadedCountries : FALLBACK_COUNTRIES,
        );
        setRegions(
          loadedRegions.length > 0
            ? loadedRegions
            : FALLBACK_REGIONS,
        );
        setFrameworks(
          loadedFrameworks.length > 0 ? loadedFrameworks : FALLBACK_FRAMEWORKS,
        );
        setLevels(loadedLevels.length > 0 ? loadedLevels : FALLBACK_LEVELS);
        setSubjects(
          loadedSubjects.length > 0 ? loadedSubjects : FALLBACK_SUBJECTS,
        );

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

  const selectedCountry = countries.find(
    (country) => String(country.id) === String(draft.country_id ?? ""),
  );

  const selectedCountryKey = useMemo(() => {
    return inferCountryKey(selectedCountry?.name || draft.country_id);
  }, [selectedCountry?.name, draft.country_id]);

  const fallbackRegionOptions = useMemo(() => {
    return FALLBACK_REGIONS.filter(
      (region) => inferCountryKey(region.country_id) === selectedCountryKey,
    );
  }, [selectedCountryKey]);

  const liveRegionOptions = useMemo(() => {
    return regions.filter((region) => {
      if (!draft.country_id) return false;
      return String(region.country_id) === String(draft.country_id);
    });
  }, [draft.country_id, regions]);

  const regionOptions =
    liveRegionOptions.length > 0 ? liveRegionOptions : fallbackRegionOptions;

  const fallbackFrameworkOptions = useMemo(() => {
    return FALLBACK_FRAMEWORKS.filter(
      (framework) =>
        inferCountryKey(framework.country_id) === selectedCountryKey,
    );
  }, [selectedCountryKey]);

  const liveFrameworkOptions = useMemo(() => {
    return frameworks.filter((framework) => {
      if (!draft.country_id) return true;

      if (String(framework.country_id) === String(draft.country_id)) {
        if (draft.region_id && framework.region_id) {
          return String(framework.region_id) === String(draft.region_id);
        }
        return true;
      }

      return false;
    });
  }, [draft.country_id, draft.region_id, frameworks]);

  const frameworkOptions = useMemo(() => {
    if (!draft.country_id) {
      return frameworks.length > 0 ? frameworks : FALLBACK_FRAMEWORKS;
    }

    if (liveFrameworkOptions.length > 0) {
      return liveFrameworkOptions;
    }

    return fallbackFrameworkOptions;
  }, [
    draft.country_id,
    frameworks,
    liveFrameworkOptions,
    fallbackFrameworkOptions,
  ]);

  const levelOptions = useMemo(() => {
    const activeLevels = levels.length > 0 ? levels : FALLBACK_LEVELS;
    return activeLevels
      .filter(
        (level) =>
          !draft.framework_id ||
          (level.framework_ids || []).includes(String(draft.framework_id)),
      )
      .slice()
      .sort((a, b) => Number(a.sort) - Number(b.sort));
  }, [draft.framework_id, levels]);

  const subjectOptions = useMemo(() => {
    const activeSubjects = subjects.length > 0 ? subjects : FALLBACK_SUBJECTS;
    return activeSubjects.filter(
      (subject) =>
        (subject.framework_ids || []).length === 0 ||
        !draft.framework_id ||
        (subject.framework_ids || []).includes(String(draft.framework_id)),
    );
  }, [draft.framework_id, subjects]);

  const selectedRegion = regionOptions.find(
    (region) => String(region.id) === String(value.region_id ?? ""),
  );

  const selectedFramework =
    frameworkOptions.find(
      (framework) => String(framework.id) === String(value.framework_id ?? ""),
    ) || findFrameworkById(value.framework_id);

  const selectedLevelLabel =
    levelOptions.find((level) => String(level.id) === String(value.level_id ?? ""))
      ?.label || findLevelLabel(value.level_id);

  const selectedSubjectNames = value.subject_ids
    .map((id) => {
      const found = subjectOptions.find(
        (subject) => String(subject.id) === String(id),
      );
      return found?.label || findSubjectLabel(id);
    })
    .filter(Boolean);

  const hasSetup = Boolean(
    value.country_id || value.framework_id || value.level_id,
  );

  const headerButtonLabel = hasSetup
    ? "Edit curriculum setup"
    : "Set up curriculum";

  const recommendedFrameworkId = useMemo(() => {
    const recommended = getRecommendedFrameworkId(
      draft.country_id,
      draft.region_id,
    );
    if (recommended) return recommended;
    if (selectedCountryKey === "us") return "common-core";
    return frameworkOptions[0]?.id ?? null;
  }, [
    draft.country_id,
    draft.region_id,
    frameworkOptions,
    selectedCountryKey,
  ]);

  const recommendedFramework = useMemo(() => {
    return (
      frameworkOptions.find(
        (framework) => String(framework.id) === String(recommendedFrameworkId),
      ) || null
    );
  }, [frameworkOptions, recommendedFrameworkId]);

  const recommendedLevelId = useMemo(() => {
    const recommended = getRecommendedLevelId(
      recommendedFramework?.id ?? null,
    );
    if (recommended) return recommended;
    return levelOptions[0]?.id ?? null;
  }, [levelOptions, recommendedFramework]);

  const recommendedLevelLabel =
    levelOptions.find(
      (level) => String(level.id) === String(recommendedLevelId ?? ""),
    )?.label || findLevelLabel(recommendedLevelId);

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
    const country =
      countries.find((item) => String(item.id) === String(id)) ||
      FALLBACK_COUNTRIES.find((item) => String(item.id) === String(id));

    const countryKey = inferCountryKey(country?.name || id);
    const defaultFrameworkId =
      countryKey === "us"
        ? "common-core"
        : FALLBACK_FRAMEWORKS.find(
            (framework) => inferCountryKey(framework.country_id) === countryKey,
          )?.id ?? null;

    updateDraft("country_id", id || null);
    updateDraft("framework_id", defaultFrameworkId);
    updateDraft("region_id", null);
    updateDraft("level_id", null);
    updateDraft("subject_ids", []);
  }

  function handleFrameworkChange(id: string) {
    updateDraft("framework_id", id || null);
    updateDraft("region_id", null);
    updateDraft("level_id", null);
    updateDraft("subject_ids", []);
  }

  function handleRegionChange(id: string) {
    updateDraft("region_id", id || null);
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
      framework_id: recommendedFramework.id,
      region_id: prev.region_id,
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
                    <option key={String(country.id)} value={String(country.id)}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="Framework"
                help="For the United States, this will default to Common Core."
              >
                <select
                  value={draft.framework_id ?? ""}
                  onChange={(event) => handleFrameworkChange(event.target.value)}
                  style={cardStyles.input}
                  disabled={!draft.country_id}
                >
                  <option value="">Select a framework</option>
                  {frameworkOptions.map((framework) => (
                    <option
                      key={String(framework.id)}
                      value={String(framework.id)}
                    >
                      {framework.name}
                    </option>
                  ))}
                </select>
              </Field>

              {selectedCountryKey === "us" ? (
                <Field
                  label="State curriculum (optional)"
                  help="If your homeschool reporting aligns more closely to a particular US state, choose it here."
                >
                  <select
                    value={draft.region_id ?? ""}
                    onChange={(event) => handleRegionChange(event.target.value)}
                    style={cardStyles.input}
                    disabled={!draft.framework_id}
                  >
                    <option value="">No specific state selected</option>
                    {regionOptions.map((region) => (
                      <option key={String(region.id)} value={String(region.id)}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : regionOptions.length > 0 ? (
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
                      <option key={String(region.id)} value={String(region.id)}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : null}

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
                    <option key={String(level.id)} value={String(level.id)}>
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
                      const selected = draft.subject_ids.includes(String(subject.id));
                      return (
                        <label
                          key={String(subject.id)}
                          style={{
                            ...cardStyles.subjectChip,
                            ...(selected ? cardStyles.subjectChipActive : {}),
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => handleSubjectToggle(String(subject.id))}
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
              {selectedFramework ? (
                <Row label="Framework" value={selectedFramework.name} />
              ) : null}
              {selectedRegion ? (
                <Row
                  label={selectedCountryKey === "us" ? "State curriculum" : "State / region"}
                  value={selectedRegion.name}
                />
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