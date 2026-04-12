"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CurriculumPreferences } from "@/lib/familySettings";
import type {
  CurriculumCountry,
  CurriculumFramework,
  CurriculumLevel,
  CurriculumRegion,
  CurriculumSubject,
} from "@/lib/curriculum";
import {
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
import {
  AUSTRALIA_STATE_OPTIONS,
  buildComplianceProfileFromTemplate,
  getAustraliaComplianceTemplate,
  getComplianceFieldDefinition,
  resetComplianceProfileToAuthorityDefaults,
  type ComplianceFieldDefinition,
  type ComplianceProfile,
} from "@/lib/curriculumCompliance";

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
  { id: "ca-state", name: "California", country_id: "us" },
  { id: "fl", name: "Florida", country_id: "us" },
  { id: "ny", name: "New York", country_id: "us" },
  { id: "tx", name: "Texas", country_id: "us" },
] as unknown as CurriculumRegion[];

const FALLBACK_FRAMEWORKS = [
  { id: "common-core", name: "Common Core", country_id: "us", region_id: undefined, subject_ids: ["english", "math", "science"] },
  { id: "acara", name: "Australian Curriculum", country_id: "au", region_id: undefined, subject_ids: ["english", "math", "science"] },
  { id: "uk-national", name: "National Curriculum", country_id: "uk", region_id: undefined, subject_ids: ["english", "math", "science"] },
  { id: "nz-curriculum", name: "New Zealand Curriculum", country_id: "nz", region_id: undefined, subject_ids: ["english", "math", "science"] },
  { id: "canada-general", name: "Canadian Curriculum", country_id: "ca", region_id: undefined, subject_ids: ["english", "math", "science"] },
  { id: "caps", name: "CAPS", country_id: "za", region_id: undefined, subject_ids: ["english", "math", "science"] },
  { id: "singapore-national", name: "Singapore Curriculum", country_id: "sg", region_id: undefined, subject_ids: ["english", "math", "science"] },
  { id: "ib-pyp", name: "IB Primary Years Programme", country_id: "ib", region_id: undefined, subject_ids: ["english", "math", "science"] },
] as unknown as CurriculumFramework[];

const FALLBACK_LEVELS = [
  { id: "year-1", label: "Year 1 / Grade 1", sort: 1, framework_ids: ["common-core", "acara", "uk-national", "nz-curriculum", "canada-general", "caps", "singapore-national", "ib-pyp"] },
  { id: "year-2", label: "Year 2 / Grade 2", sort: 2, framework_ids: ["common-core", "acara", "uk-national", "nz-curriculum", "canada-general", "caps", "singapore-national", "ib-pyp"] },
  { id: "year-3", label: "Year 3 / Grade 3", sort: 3, framework_ids: ["common-core", "acara", "uk-national", "nz-curriculum", "canada-general", "caps", "singapore-national", "ib-pyp"] },
  { id: "year-4", label: "Year 4 / Grade 4", sort: 4, framework_ids: ["common-core", "acara", "uk-national", "nz-curriculum", "canada-general", "caps", "singapore-national", "ib-pyp"] },
  { id: "year-5", label: "Year 5 / Grade 5", sort: 5, framework_ids: ["common-core", "acara", "uk-national", "nz-curriculum", "canada-general", "caps", "singapore-national", "ib-pyp"] },
] as unknown as CurriculumLevel[];

const FALLBACK_SUBJECTS = [
  { id: "english", label: "English Language Arts", framework_ids: ["common-core", "acara", "uk-national", "nz-curriculum", "canada-general", "caps", "singapore-national", "ib-pyp"] },
  { id: "math", label: "Mathematics", framework_ids: ["common-core", "acara", "uk-national", "nz-curriculum", "canada-general", "caps", "singapore-national", "ib-pyp"] },
  { id: "science", label: "Science", framework_ids: ["common-core", "acara", "uk-national", "nz-curriculum", "canada-general", "caps", "singapore-national", "ib-pyp"] },
] as unknown as CurriculumSubject[];

function buildBaseComplianceProfile(
  draft: CurriculumPreferences,
  explicitState?: string | null,
): ComplianceProfile {
  const existing = draft.compliance_profile;
  const state = explicitState ?? existing?.state ?? null;

  if (inferCountryKey(draft.country_id) !== "au") {
    return {
      country: draft.country_id,
      state: null,
      curriculum_framework: draft.framework_id,
      compliance_mode: null,
      template_version: null,
      required_fields: [],
      recommended_fields: [],
      optional_fields: [],
      custom_labels: existing?.custom_labels ?? {},
      last_reviewed_at: existing?.last_reviewed_at ?? null,
    };
  }

  const template = getAustraliaComplianceTemplate(state);
  if (!template) {
    return {
      country: draft.country_id,
      state,
      curriculum_framework: draft.framework_id,
      compliance_mode: null,
      template_version: null,
      required_fields: [],
      recommended_fields: [],
      optional_fields: [],
      custom_labels: existing?.custom_labels ?? {},
      last_reviewed_at: existing?.last_reviewed_at ?? null,
    };
  }

  return {
    country: draft.country_id,
    state,
    curriculum_framework: draft.framework_id,
    compliance_mode: template.compliance_mode,
    template_version: template.template_version,
    required_fields: template.required_fields,
    recommended_fields: existing?.state === state ? existing.recommended_fields : template.recommended_fields,
    optional_fields: existing?.state === state ? existing.optional_fields : template.optional_fields,
    custom_labels: existing?.custom_labels ?? {},
    last_reviewed_at: existing?.last_reviewed_at ?? null,
  };
}

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

        const loadedCountries = settled[0].status === "fulfilled" ? settled[0].value : [];
        const loadedRegions = settled[1].status === "fulfilled" ? settled[1].value : [];
        const loadedFrameworks = settled[2].status === "fulfilled" ? settled[2].value : [];
        const loadedLevels = settled[3].status === "fulfilled" ? settled[3].value : [];
        const loadedSubjects = settled[4].status === "fulfilled" ? settled[4].value : [];

        setCountries(loadedCountries.length > 0 ? loadedCountries : FALLBACK_COUNTRIES);
        setRegions(loadedRegions.length > 0 ? loadedRegions : FALLBACK_REGIONS);
        setFrameworks(loadedFrameworks.length > 0 ? loadedFrameworks : FALLBACK_FRAMEWORKS);
        setLevels(loadedLevels.length > 0 ? loadedLevels : FALLBACK_LEVELS);
        setSubjects(loadedSubjects.length > 0 ? loadedSubjects : FALLBACK_SUBJECTS);

        if (settled.some((result) => result.status === "rejected")) {
          setLoadMessage(
            "Some curriculum lists could not be loaded right now, so EduDecks is using built-in options where needed.",
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
          "Curriculum data could not be loaded right now, so EduDecks is using built-in options.",
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

  const regionOptions = useMemo(() => {
    const live = regions.filter((region) =>
      draft.country_id ? String(region.country_id) === String(draft.country_id) : false,
    );
    if (live.length > 0) return live;

    return FALLBACK_REGIONS.filter(
      (region) => inferCountryKey(region.country_id) === selectedCountryKey,
    );
  }, [draft.country_id, regions, selectedCountryKey]);

  const frameworkOptions = useMemo(() => {
    const live = frameworks.filter((framework) => {
      if (!draft.country_id) return true;
      if (String(framework.country_id) !== String(draft.country_id)) return false;
      if (draft.region_id && framework.region_id) {
        return String(framework.region_id) === String(draft.region_id);
      }
      return true;
    });
    if (live.length > 0) return live;

    return FALLBACK_FRAMEWORKS.filter(
      (framework) => inferCountryKey(framework.country_id) === selectedCountryKey,
    );
  }, [draft.country_id, draft.region_id, frameworks, selectedCountryKey]);

  const levelOptions = useMemo(() => {
    const live = levels
      .filter((level) => !draft.framework_id || (level.framework_ids || []).includes(String(draft.framework_id)))
      .slice()
      .sort((a, b) => Number(a.sort) - Number(b.sort));
    if (live.length > 0) return live;

    return FALLBACK_LEVELS
      .filter((level) => !draft.framework_id || (level.framework_ids || []).includes(String(draft.framework_id)))
      .slice()
      .sort((a, b) => Number(a.sort) - Number(b.sort));
  }, [draft.framework_id, levels]);

  const subjectOptions = useMemo(() => {
    const live = subjects.filter(
      (subject) =>
        !draft.framework_id ||
        (subject.framework_ids || []).length === 0 ||
        (subject.framework_ids || []).includes(String(draft.framework_id)),
    );
    if (live.length > 0) return live;

    return FALLBACK_SUBJECTS.filter(
      (subject) =>
        !draft.framework_id ||
        (subject.framework_ids || []).length === 0 ||
        (subject.framework_ids || []).includes(String(draft.framework_id)),
    );
  }, [draft.framework_id, subjects]);

  const complianceProfile = useMemo(
    () => buildBaseComplianceProfile(draft),
    [draft],
  );

  const australiaTemplate = useMemo(
    () =>
      selectedCountryKey === "au"
        ? getAustraliaComplianceTemplate(complianceProfile.state)
        : null,
    [complianceProfile.state, selectedCountryKey],
  );

  const selectedFramework =
    frameworkOptions.find(
      (framework) => String(framework.id) === String(value.framework_id ?? ""),
    ) || findFrameworkById(value.framework_id);

  const selectedRegion = regionOptions.find(
    (region) => String(region.id) === String(value.region_id ?? ""),
  );

  const selectedLevelLabel =
    levelOptions.find((level) => String(level.id) === String(value.level_id ?? ""))?.label ||
    findLevelLabel(value.level_id);

  const selectedSubjectNames = value.subject_ids
    .map((id) => {
      const found = subjectOptions.find((subject) => String(subject.id) === String(id));
      return found?.label || findSubjectLabel(id);
    })
    .filter(Boolean);

  const hasSetup = Boolean(value.country_id || value.framework_id || value.level_id);
  const headerButtonLabel = hasSetup ? "Edit curriculum setup" : "Set up curriculum";

  const recommendedFrameworkId = useMemo(() => {
    const recommended = getRecommendedFrameworkId(draft.country_id, draft.region_id);
    if (recommended) return recommended;
    if (selectedCountryKey === "us") return "common-core";
    return frameworkOptions[0]?.id ?? null;
  }, [draft.country_id, draft.region_id, frameworkOptions, selectedCountryKey]);

  const recommendedFramework = useMemo(() => {
    return (
      frameworkOptions.find(
        (framework) => String(framework.id) === String(recommendedFrameworkId),
      ) || null
    );
  }, [frameworkOptions, recommendedFrameworkId]);

  const recommendedLevelId = useMemo(() => {
    const recommended = getRecommendedLevelId(recommendedFramework?.id ?? null);
    if (recommended) return recommended;
    return levelOptions[0]?.id ?? null;
  }, [levelOptions, recommendedFramework]);

  const recommendedLevelLabel =
    levelOptions.find((level) => String(level.id) === String(recommendedLevelId ?? ""))?.label ||
    findLevelLabel(recommendedLevelId);

  const requiredFieldDefinitions = useMemo(
    () =>
      complianceProfile.required_fields.map((fieldId) =>
        getComplianceFieldDefinition(fieldId, "required"),
      ),
    [complianceProfile.required_fields],
  );

  const recommendedFieldDefinitions = useMemo(
    () =>
      complianceProfile.recommended_fields.map((fieldId) =>
        getComplianceFieldDefinition(fieldId, "recommended"),
      ),
    [complianceProfile.recommended_fields],
  );

  const optionalFieldDefinitions = useMemo(
    () =>
      complianceProfile.optional_fields.map((fieldId) =>
        getComplianceFieldDefinition(fieldId, "optional"),
      ),
    [complianceProfile.optional_fields],
  );

  const previewFieldDefinitions = useMemo(
    () => [
      ...requiredFieldDefinitions,
      ...recommendedFieldDefinitions,
      ...optionalFieldDefinitions.filter(
        (field) =>
          !requiredFieldDefinitions.some((item) => item.id === field.id) &&
          !recommendedFieldDefinitions.some((item) => item.id === field.id),
      ),
    ],
    [optionalFieldDefinitions, recommendedFieldDefinitions, requiredFieldDefinitions],
  );

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
      FALLBACK_FRAMEWORKS.find((framework) => inferCountryKey(framework.country_id) === countryKey)?.id ??
      null;
    const defaultLevelId =
      FALLBACK_LEVELS.find((level) =>
        (level.framework_ids || []).includes(String(defaultFrameworkId)),
      )?.id ?? null;

    setDraft((prev) => {
      const nextDraft: CurriculumPreferences = {
        ...prev,
        country_id: id || null,
        region_id: null,
        framework_id: defaultFrameworkId,
        level_id: defaultLevelId,
        subject_ids: [],
      };

      nextDraft.compliance_profile =
        countryKey === "au"
          ? buildComplianceProfileFromTemplate({
              country: nextDraft.country_id,
              state: null,
              curriculumFramework: nextDraft.framework_id,
            })
          : buildBaseComplianceProfile(nextDraft, null);

      return nextDraft;
    });
  }

  function handleRegionChange(id: string) {
    updateDraft("region_id", id || null);
  }

  function handleFrameworkChange(id: string) {
    const defaultLevelId =
      FALLBACK_LEVELS.find((level) =>
        (level.framework_ids || []).includes(String(id)),
      )?.id ?? null;

    setDraft((prev) => {
      const nextDraft: CurriculumPreferences = {
        ...prev,
        framework_id: id || null,
        level_id: defaultLevelId,
        subject_ids: [],
      };

      nextDraft.compliance_profile =
        inferCountryKey(nextDraft.country_id) === "au" && prev.compliance_profile?.state
          ? {
              ...buildBaseComplianceProfile(nextDraft, prev.compliance_profile.state),
              recommended_fields: prev.compliance_profile.recommended_fields,
              optional_fields: prev.compliance_profile.optional_fields,
              custom_labels: prev.compliance_profile.custom_labels,
              last_reviewed_at: prev.compliance_profile.last_reviewed_at,
            }
          : buildBaseComplianceProfile(nextDraft, prev.compliance_profile?.state ?? null);

      return nextDraft;
    });
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

  function updateComplianceProfile(nextProfile: CurriculumPreferences["compliance_profile"]) {
    updateDraft("compliance_profile", nextProfile);
  }

  function handleAustraliaStateChange(stateId: string) {
    updateComplianceProfile(
      buildComplianceProfileFromTemplate({
        country: draft.country_id,
        state: stateId || null,
        curriculumFramework: draft.framework_id,
      }),
    );
  }

  function handleRecommendedFieldToggle(fieldId: string) {
    const nextRecommended = complianceProfile.recommended_fields.includes(fieldId)
      ? complianceProfile.recommended_fields.filter((id) => id !== fieldId)
      : [...complianceProfile.recommended_fields, fieldId];

    updateComplianceProfile({
      ...complianceProfile,
      recommended_fields: nextRecommended,
      last_reviewed_at: new Date().toISOString(),
    });
  }

  function handleOptionalFieldToggle(fieldId: string) {
    const nextOptional = complianceProfile.optional_fields.includes(fieldId)
      ? complianceProfile.optional_fields.filter((id) => id !== fieldId)
      : [...complianceProfile.optional_fields, fieldId];

    updateComplianceProfile({
      ...complianceProfile,
      optional_fields: nextOptional,
      last_reviewed_at: new Date().toISOString(),
    });
  }

  function handleResetComplianceDefaults() {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "Reset this authority template back to the default Australian compliance fields?",
      )
    ) {
      return;
    }

    updateComplianceProfile(resetComplianceProfileToAuthorityDefaults(complianceProfile));
  }

  function handleApply() {
    onChange({
      ...draft,
      compliance_profile: {
        ...complianceProfile,
        last_reviewed_at: new Date().toISOString(),
      },
    });
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

    setDraft((prev) => {
      const nextDraft: CurriculumPreferences = {
        ...prev,
        country_id: prev.country_id || recommendedFramework.country_id,
        framework_id: recommendedFramework.id,
        level_id: recommendedLevelId ?? prev.level_id,
        subject_ids:
          recommendedFramework.subject_ids?.length > 0
            ? recommendedFramework.subject_ids
            : prev.subject_ids,
      };

      nextDraft.compliance_profile = buildBaseComplianceProfile(nextDraft, prev.compliance_profile?.state ?? null);
      return nextDraft;
    });
  }

  return (
    <section id="curriculum-setup" style={cardStyles.card}>
      <div style={cardStyles.header}>
        <div>
          <div style={cardStyles.eyebrow}>Curriculum setup</div>
          <div style={cardStyles.title}>Curriculum setup</div>
          <p style={cardStyles.description}>
            Choose the learning framework and, for Australian families, the authority
            reporting structure that should guide later report output.
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
            <div style={cardStyles.loading}>Loading curriculum data...</div>
          ) : (
            <div style={cardStyles.form}>
              <SectionCard
                title="1. Jurisdiction"
                description="Choose the reporting context that should shape planning and later report structure."
              >
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

                {selectedCountryKey === "au" ? (
                  <Field
                    label="State / Territory"
                    help="This chooses the Australian homeschool compliance template."
                  >
                    <select
                      value={complianceProfile.state ?? ""}
                      onChange={(event) => handleAustraliaStateChange(event.target.value)}
                      style={cardStyles.input}
                      disabled={!draft.country_id}
                    >
                      <option value="">Select a state or territory</option>
                      {AUSTRALIA_STATE_OPTIONS.map((state) => (
                        <option key={state.id} value={state.id}>
                          {state.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                ) : selectedCountryKey === "us" ? (
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
                    help="Some countries use state or regional frameworks. You can skip this if you are unsure."
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
                  label="Curriculum framework"
                  help="The curriculum framework remains separate from the authority reporting mode."
                >
                  <select
                    value={draft.framework_id ?? ""}
                    onChange={(event) => handleFrameworkChange(event.target.value)}
                    style={cardStyles.input}
                    disabled={!draft.country_id}
                  >
                    <option value="">Select a framework</option>
                    {frameworkOptions.map((framework) => (
                      <option key={String(framework.id)} value={String(framework.id)}>
                        {framework.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  label="Year level / grade band"
                  help="Choose the level that best matches your child right now."
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
                    help="These help narrow the family setup without changing the authority template."
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

                <div style={cardStyles.inlineSummary}>
                  <InlineSummary
                    label="Compliance mode"
                    value={complianceProfile.compliance_mode || "Select an Australian state to load a compliance mode"}
                  />
                  <InlineSummary
                    label="Framework"
                    value={draft.framework_id ? selectedFramework?.name || "Selected" : "Not chosen yet"}
                  />
                </div>

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
              </SectionCard>

              <SectionCard
                title="2. Authority template summary"
                description="This is the compliance structure EduDecks will carry forward into report output."
              >
                {australiaTemplate ? (
                  <div style={cardStyles.summaryList}>
                    <InlineSummary label="Template type" value={australiaTemplate.template_type} />
                    <InlineSummary label="Submission rhythm" value={australiaTemplate.submission_rhythm} />
                    <InlineSummary
                      label="Key required elements"
                      value={australiaTemplate.key_required_elements.join(" - ")}
                    />
                    <div style={cardStyles.authorityNote}>{australiaTemplate.authority_note}</div>
                  </div>
                ) : (
                  <div style={cardStyles.loading}>
                    Select Australia and a state or territory to load the correct authority template.
                  </div>
                )}
              </SectionCard>

              <SectionCard
                title="3. Required fields"
                description="These fields are enabled automatically and locked because the authority template depends on them."
              >
                {requiredFieldDefinitions.length > 0 ? (
                  <div style={cardStyles.fieldList}>
                    {requiredFieldDefinitions.map((field) => (
                      <ComplianceFieldRow
                        key={field.id}
                        field={field}
                        badgeLabel="Required by authority"
                        badgeStyle={cardStyles.requiredBadge}
                        checked
                        locked
                      />
                    ))}
                  </div>
                ) : (
                  <div style={cardStyles.loading}>
                    Required authority fields will appear here after you choose an Australian state or territory.
                  </div>
                )}
              </SectionCard>

              <SectionCard
                title="4. Recommended fields"
                description="These fields are enabled by default and can be removed when you want a lighter family report."
              >
                {recommendedFieldDefinitions.length > 0 ? (
                  <div style={cardStyles.fieldList}>
                    {recommendedFieldDefinitions.map((field) => (
                      <ComplianceFieldRow
                        key={field.id}
                        field={field}
                        badgeLabel="EduDecks recommended"
                        badgeStyle={cardStyles.recommendedBadge}
                        checked={complianceProfile.recommended_fields.includes(field.id)}
                        onToggle={() => handleRecommendedFieldToggle(field.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div style={cardStyles.loading}>
                    Recommended fields will appear once an authority template is active.
                  </div>
                )}
              </SectionCard>

              <SectionCard
                title="5. Optional fields"
                description="These fields are kept parent-controlled and start unchecked unless you choose them."
              >
                {optionalFieldDefinitions.length > 0 ? (
                  <div style={cardStyles.fieldList}>
                    {optionalFieldDefinitions.map((field) => (
                      <ComplianceFieldRow
                        key={field.id}
                        field={field}
                        badgeLabel="Optional"
                        badgeStyle={cardStyles.optionalBadge}
                        checked={complianceProfile.optional_fields.includes(field.id)}
                        onToggle={() => handleOptionalFieldToggle(field.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div style={cardStyles.loading}>
                    Optional fields will appear here when a template or curriculum profile has been chosen.
                  </div>
                )}
              </SectionCard>

              <SectionCard
                title="6. Save + preview"
                description="Preview the report structure that will later render in Report Output, then save the setup."
              >
                <div style={cardStyles.previewCard}>
                  <div style={cardStyles.previewTitle}>Preview report structure</div>
                  <div style={cardStyles.previewList}>
                    {previewFieldDefinitions.length > 0 ? (
                      previewFieldDefinitions.map((field) => (
                        <div key={field.id} style={cardStyles.previewItem}>
                          <span>{field.label}</span>
                          <span style={cardStyles.previewTier}>
                            {field.tier === "required"
                              ? "Required"
                              : field.tier === "recommended"
                                ? "Recommended"
                                : "Optional"}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div style={cardStyles.previewEmpty}>
                        Choose a jurisdiction and authority template to preview the structure.
                      </div>
                    )}
                  </div>
                </div>

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
                    style={cardStyles.secondaryButton}
                    onClick={handleResetComplianceDefaults}
                    disabled={!australiaTemplate}
                  >
                    Reset to authority defaults
                  </button>
                  <button
                    type="button"
                    style={cardStyles.linkButton}
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                </div>
              </SectionCard>
            </div>
          )}
        </div>
      ) : (
        <div>
          {hasSetup ? (
            <div style={cardStyles.summary}>
              <Row label="Country" value={selectedCountry?.name ?? "Not set yet"} />
              {selectedFramework ? <Row label="Framework" value={selectedFramework.name} /> : null}
              {selectedRegion ? (
                <Row
                  label={selectedCountryKey === "us" ? "State curriculum" : "State / region"}
                  value={selectedRegion.name}
                />
              ) : null}
              {selectedCountryKey === "au" && complianceProfile.state ? (
                <Row
                  label="State / territory"
                  value={
                    AUSTRALIA_STATE_OPTIONS.find((state) => state.id === complianceProfile.state)?.label ||
                    complianceProfile.state
                  }
                />
              ) : null}
              {complianceProfile.compliance_mode ? (
                <Row label="Compliance mode" value={complianceProfile.compliance_mode} />
              ) : null}
              {selectedLevelLabel ? <Row label="Year level" value={selectedLevelLabel} /> : null}
              {selectedSubjectNames.length > 0 ? (
                <Row label="Learning areas" value={selectedSubjectNames.join(" - ")} />
              ) : null}
              {complianceProfile.template_version ? (
                <Row label="Template version" value={complianceProfile.template_version} />
              ) : null}
            </div>
          ) : (
            <div style={cardStyles.empty}>
              <p>
                Set your curriculum once so EduDecks can organise planning, capture,
                reporting, and Australian authority compliance more clearly.
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
        Used to organise planning - captured learning - reports
      </div>
    </section>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section style={cardStyles.sectionCard}>
      <div style={cardStyles.sectionHeader}>
        <div style={cardStyles.sectionTitle}>{title}</div>
        <div style={cardStyles.sectionDescription}>{description}</div>
      </div>
      <div style={cardStyles.sectionBody}>{children}</div>
    </section>
  );
}

function InlineSummary({ label, value }: { label: string; value: string }) {
  return (
    <div style={cardStyles.inlineSummaryCard}>
      <div style={cardStyles.inlineSummaryLabel}>{label}</div>
      <div style={cardStyles.inlineSummaryValue}>{value}</div>
    </div>
  );
}

function ComplianceFieldRow({
  field,
  badgeLabel,
  badgeStyle,
  checked,
  locked,
  onToggle,
}: {
  field: ComplianceFieldDefinition;
  badgeLabel: string;
  badgeStyle: React.CSSProperties;
  checked: boolean;
  locked?: boolean;
  onToggle?: () => void;
}) {
  return (
    <label style={{ ...cardStyles.complianceField, ...(locked ? cardStyles.complianceFieldLocked : {}) }}>
      <div style={cardStyles.complianceFieldLeft}>
        <input
          type="checkbox"
          checked={checked}
          disabled={locked}
          onChange={onToggle}
          style={cardStyles.checkbox}
        />
        <div>
          <div style={cardStyles.complianceFieldTitle}>{field.label}</div>
          <div style={cardStyles.complianceFieldDescription}>{field.description}</div>
        </div>
      </div>
      <span style={{ ...cardStyles.fieldBadge, ...badgeStyle }}>{badgeLabel}</span>
    </label>
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
  sectionCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    background: "#fcfdff",
    padding: 18,
    display: "grid",
    gap: 16,
  },
  sectionHeader: {
    display: "grid",
    gap: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 800,
    color: "#0f172a",
  },
  sectionDescription: {
    fontSize: 13,
    lineHeight: 1.6,
    color: "#64748b",
  },
  sectionBody: {
    display: "grid",
    gap: 14,
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
    textAlign: "right",
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
    border: "1px solid #cbd5e1",
    padding: "10px 12px",
    fontSize: 14,
    background: "#ffffff",
    color: "#0f172a",
  },
  subjectGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
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
    marginTop: 8,
  },
  recommendation: {
    border: "1px solid #dbeafe",
    borderRadius: 16,
    padding: 16,
    background: "#f8fbff",
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
  inlineSummary: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 10,
  },
  inlineSummaryCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 14,
    background: "#ffffff",
    display: "grid",
    gap: 6,
  },
  inlineSummaryLabel: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: "#64748b",
  },
  inlineSummaryValue: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a",
  },
  summaryList: {
    display: "grid",
    gap: 10,
  },
  authorityNote: {
    borderRadius: 14,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    padding: 14,
    fontSize: 13,
    lineHeight: 1.7,
    color: "#475569",
  },
  fieldList: {
    display: "grid",
    gap: 10,
  },
  complianceField: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 14,
    background: "#ffffff",
  },
  complianceFieldLocked: {
    background: "#f8fafc",
  },
  complianceFieldLeft: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
  },
  complianceFieldTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a",
  },
  complianceFieldDescription: {
    fontSize: 12,
    lineHeight: 1.6,
    color: "#64748b",
    marginTop: 2,
  },
  fieldBadge: {
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 0.4,
    whiteSpace: "nowrap",
  },
  requiredBadge: {
    background: "#dbeafe",
    color: "#1d4ed8",
  },
  recommendedBadge: {
    background: "#ecfdf5",
    color: "#166534",
  },
  optionalBadge: {
    background: "#f8fafc",
    color: "#475569",
  },
  previewCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 16,
    background: "#ffffff",
    display: "grid",
    gap: 12,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: "#0f172a",
  },
  previewList: {
    display: "grid",
    gap: 8,
  },
  previewItem: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: "10px 0",
    borderBottom: "1px solid #f1f5f9",
    fontSize: 13,
    color: "#0f172a",
  },
  previewTier: {
    color: "#64748b",
    fontWeight: 700,
  },
  previewEmpty: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 1.6,
  },
};
