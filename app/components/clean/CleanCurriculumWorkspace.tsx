"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import CleanAppHeader from "@/app/components/clean/CleanAppHeader";
import CleanFamilyWorkspaceProvider, {
  useCleanFamilyWorkspace,
} from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import { listCleanEvidenceEntries } from "@/lib/clean/evidence/client";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import {
  CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE,
  normalizeCleanErrorMessage,
} from "@/lib/clean/family/client";
import {
  getAuthorityDisplayValues,
  isBrentAuthorityTemplateActive,
} from "@/lib/clean/authority/brent";

type CoverageStatus = "No evidence yet" | "Evidence started" | "Evidence building";

type CurriculumElementConfig = {
  id: string;
  title: string;
  description: string;
  keywords: string[];
};

type LearningAreaConfig = {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  elements: CurriculumElementConfig[];
};

type AuthorityEvidenceAreaConfig = {
  id: string;
  title: string;
  description: string;
  keywords: string[];
};

type EvidenceMatchSummary = {
  count: number;
  status: CoverageStatus;
  latestEntry: CleanEvidenceEntry | null;
};

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "32px 20px 48px",
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 1120,
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

const helperCardStyle: React.CSSProperties = {
  border: "1px solid #dbeafe",
  borderRadius: 16,
  background: "#f8fbff",
  padding: 16,
  display: "grid",
  gap: 8,
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
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.08em",
  color: "#64748b",
  textTransform: "uppercase",
};

const compactCardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  background: "#f8fafc",
  padding: 16,
  display: "grid",
  gap: 8,
};

const summaryStripStyle: React.CSSProperties = {
  display: "grid",
  gap: 14,
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
};

const summaryCardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  background: "#ffffff",
  padding: 16,
  display: "grid",
  gap: 8,
  boxShadow: "0 6px 18px rgba(15,23,42,0.04)",
};

const frameworkLabelById: Record<string, string> = {
  "australian-curriculum": "Australian Curriculum",
  "state-standards": "State standards",
  "common-core-aligned": "Common Core aligned",
  custom: "Custom",
  "national-curriculum": "National Curriculum",
  "custom-international": "Custom / International",
  "parent-selected-curriculum": "Parent-selected curriculum",
  "international-blended-curriculum": "International / blended curriculum",
};

const countryLabelByCode: Record<string, string> = {
  AU: "Australia",
  US: "United States",
  UK: "United Kingdom",
  INTL: "Other / International",
};

const learningAreas: LearningAreaConfig[] = [
  {
    id: "english",
    title: "English",
    description: "Reading, writing, discussion, and making sense of texts over time.",
    keywords: ["english", "literacy", "reading", "writing", "spelling", "vocabulary"],
    elements: [
      {
        id: "reading-comprehension",
        title: "Reading comprehension",
        description: "Understanding what has been read and talking about the meaning.",
        keywords: ["reading", "read", "comprehension", "book", "story", "novel"],
      },
      {
        id: "writing-sentences-and-paragraphs",
        title: "Writing sentences and paragraphs",
        description: "Turning ideas into clear sentences, short responses, and longer pieces.",
        keywords: ["writing", "sentence", "paragraph", "journal", "response", "essay"],
      },
      {
        id: "spelling-and-vocabulary",
        title: "Spelling and vocabulary",
        description: "Growing confidence with words, spelling patterns, and word meaning.",
        keywords: ["spelling", "vocabulary", "word study", "phonics", "dictionary"],
      },
      {
        id: "speaking-and-listening",
        title: "Speaking and listening",
        description: "Explaining ideas, listening carefully, and joining discussion.",
        keywords: ["discussion", "speaking", "listening", "presentation", "conversation"],
      },
      {
        id: "text-response",
        title: "Text response",
        description: "Responding to stories, information texts, and media in a thoughtful way.",
        keywords: ["text response", "response", "character", "theme", "author"],
      },
    ],
  },
  {
    id: "mathematics",
    title: "Mathematics",
    description: "Number sense, patterns, problem solving, and using maths in everyday life.",
    keywords: ["mathematics", "maths", "math", "numeracy", "number", "calculation"],
    elements: [
      {
        id: "number-and-place-value",
        title: "Number and place value",
        description: "Understanding how numbers work and how they are built.",
        keywords: ["number", "place value", "digit", "counting", "numeracy"],
      },
      {
        id: "addition-and-subtraction",
        title: "Addition and subtraction",
        description: "Using addition and subtraction with confidence in practical situations.",
        keywords: ["addition", "subtraction", "add", "subtract", "sum", "difference"],
      },
      {
        id: "multiplication-and-division",
        title: "Multiplication and division",
        description: "Grouping, sharing, and building fluency with multiplication ideas.",
        keywords: ["multiplication", "division", "times tables", "grouping", "sharing"],
      },
      {
        id: "fractions",
        title: "Fractions",
        description: "Working with parts, wholes, and equal sharing.",
        keywords: ["fraction", "half", "quarter", "third", "decimal"],
      },
      {
        id: "measurement",
        title: "Measurement",
        description: "Using length, time, money, mass, and capacity meaningfully.",
        keywords: ["measurement", "measure", "time", "money", "length", "mass", "capacity"],
      },
      {
        id: "shape-and-geometry",
        title: "Shape and geometry",
        description: "Recognising shape, space, direction, and position.",
        keywords: ["shape", "geometry", "angle", "space", "position", "pattern block"],
      },
      {
        id: "statistics-and-data",
        title: "Statistics and data",
        description: "Collecting information, sorting it, and talking about what it shows.",
        keywords: ["data", "graph", "statistics", "survey", "chart", "table"],
      },
    ],
  },
  {
    id: "science",
    title: "Science",
    description: "Curiosity, investigation, observation, and understanding how the world works.",
    keywords: ["science", "experiment", "investigation", "hypothesis", "observation"],
    elements: [
      {
        id: "scientific-investigation",
        title: "Scientific investigation",
        description: "Asking questions, testing ideas, and noticing patterns in results.",
        keywords: ["investigation", "experiment", "hypothesis", "observe", "observation"],
      },
      {
        id: "living-things",
        title: "Living things",
        description: "Exploring plants, animals, habitats, and how living things grow.",
        keywords: ["living things", "animal", "plant", "habitat", "life cycle", "biology"],
      },
      {
        id: "materials",
        title: "Materials",
        description: "Comparing materials and noticing their properties and uses.",
        keywords: ["material", "property", "solid", "liquid", "gas", "matter"],
      },
      {
        id: "forces-and-motion",
        title: "Forces and motion",
        description: "Looking at movement, pushes, pulls, and how things change direction.",
        keywords: ["force", "motion", "push", "pull", "speed", "gravity"],
      },
      {
        id: "earth-and-space",
        title: "Earth and space",
        description: "Learning about weather, seasons, the Earth, and the wider universe.",
        keywords: ["earth", "space", "planet", "weather", "season", "solar system"],
      },
    ],
  },
  {
    id: "humanities-and-social-sciences",
    title: "Humanities and Social Sciences",
    description: "History, geography, civics, inquiry, and understanding community life.",
    keywords: ["history", "geography", "hass", "humanities", "social science", "civics", "community"],
    elements: [],
  },
  {
    id: "the-arts",
    title: "The Arts",
    description: "Creative expression through music, drama, movement, visual art, and making.",
    keywords: ["art", "arts", "music", "drama", "dance", "drawing", "painting", "craft"],
    elements: [],
  },
  {
    id: "technologies-computing",
    title: "Technologies / Computing",
    description: "Digital tools, design thinking, coding, and practical making with technology.",
    keywords: ["technology", "technologies", "computing", "digital", "coding", "robotics", "design"],
    elements: [],
  },
  {
    id: "health-and-physical-education",
    title: "Health and Physical Education",
    description: "Movement, sport, wellbeing, health routines, and staying active.",
    keywords: ["health", "physical", "pe", "sport", "movement", "wellbeing", "exercise"],
    elements: [],
  },
  {
    id: "languages",
    title: "Languages",
    description: "Building confidence in listening, speaking, reading, and writing in another language.",
    keywords: ["language", "languages", "french", "spanish", "japanese", "latin", "german"],
    elements: [],
  },
  {
    id: "life-skills-practical-learning",
    title: "Life Skills / Practical Learning",
    description: "Daily living, independence, practical tasks, and learning that supports real life.",
    keywords: ["life skills", "practical", "cooking", "baking", "money", "chores", "garden", "independence"],
    elements: [],
  },
];

const authorityEvidenceAreas: AuthorityEvidenceAreaConfig[] = [
  {
    id: "communication-and-interaction",
    title: "Communication and interaction",
    description: "What supports communication, shared understanding, and interaction with others.",
    keywords: ["communication", "interaction", "conversation", "language support", "social communication"],
  },
  {
    id: "cognition-and-learning",
    title: "Cognition and learning",
    description: "How the learner processes ideas, remembers steps, and approaches learning.",
    keywords: ["cognition", "learning support", "processing", "memory", "thinking"],
  },
  {
    id: "social-emotional-and-mental-health",
    title: "Social, emotional and mental health",
    description: "Emotional regulation, confidence, relationships, and mental wellbeing.",
    keywords: ["emotional", "mental health", "wellbeing", "confidence", "regulation", "anxiety"],
  },
  {
    id: "physical-and-sensory",
    title: "Physical and sensory",
    description: "Physical needs, sensory access, comfort, movement, and adaptations.",
    keywords: ["physical", "sensory", "movement", "motor", "adaptation", "access"],
  },
  {
    id: "progress-against-outcomes",
    title: "Progress against outcomes",
    description: "What the evidence is beginning to show about progress over time.",
    keywords: ["outcome", "progress", "goal", "target", "review"],
  },
  {
    id: "young-person-views",
    title: "Young person views",
    description: "The learner's own voice about what is working, what matters, and what they hope for.",
    keywords: ["young person", "learner voice", "what i like", "aspiration", "hope"],
  },
  {
    id: "parent-carer-views",
    title: "Parent / carer views",
    description: "Family observations, concerns, and what support feels most useful.",
    keywords: ["parent", "carer", "family view", "concern", "support needed"],
  },
  {
    id: "next-support-planning",
    title: "Next support planning",
    description: "Next steps, support ideas, and what to keep building next.",
    keywords: ["next step", "support plan", "review note", "future outcome"],
  },
];

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function formatEvidenceTitle(entry: CleanEvidenceEntry) {
  return safe(entry.title) || safe(entry.whatHappened).slice(0, 72) || "Untitled evidence";
}

function formatLatestEvidenceLine(entry: CleanEvidenceEntry | null, emptyText = "No evidence linked yet.") {
  return entry ? formatEvidenceTitle(entry) : emptyText;
}

function getEvidenceItemLabel(count: number) {
  return `${count} evidence ${count === 1 ? "item" : "items"}`;
}

function evidenceSortValue(entry: CleanEvidenceEntry) {
  return Date.parse(`${entry.observedOn}T00:00:00`) || Date.parse(entry.updatedAt || "") || 0;
}

function getCoverageStatus(count: number): CoverageStatus {
  if (count <= 0) return "No evidence yet";
  if (count <= 2) return "Evidence started";
  return "Evidence building";
}

function coverageBadgeStyle(status: CoverageStatus): React.CSSProperties {
  if (status === "Evidence building") {
    return {
      border: "1px solid #bfdbfe",
      background: "#eff6ff",
      color: "#1d4ed8",
    };
  }

  if (status === "Evidence started") {
    return {
      border: "1px solid #c7d2fe",
      background: "#eef2ff",
      color: "#4338ca",
    };
  }

  return {
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    color: "#64748b",
  };
}

function getLearnerLabel(firstName: string, preferredName: string | null) {
  return preferredName || firstName;
}

function buildEvidenceSearchText(entry: CleanEvidenceEntry) {
  return [
    safe(entry.learningArea),
    safe(entry.title),
    safe(entry.whatHappened),
    safe(entry.reflection),
  ]
    .join(" ")
    .toLowerCase();
}

function matchesAnyKeyword(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
}

function buildMatchSummary(entries: CleanEvidenceEntry[]): EvidenceMatchSummary {
  const sortedEntries = [...entries].sort((left, right) => evidenceSortValue(right) - evidenceSortValue(left));
  return {
    count: sortedEntries.length,
    status: getCoverageStatus(sortedEntries.length),
    latestEntry: sortedEntries[0] ?? null,
  };
}

function CurriculumWorkspaceBody() {
  const workspace = useCleanFamilyWorkspace();
  const pathname = usePathname();
  const [selectedLearnerId, setSelectedLearnerId] = useState("");
  const [entries, setEntries] = useState<CleanEvidenceEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [entriesError, setEntriesError] = useState<string | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState("");
  const [showAuthorityAreas, setShowAuthorityAreas] = useState(false);

  const capturePathBase = pathname.startsWith("/clean-my-curriculum")
    ? "/clean-my-capture"
    : "/my-capture";
  const brentModeActive = useMemo(
    () => isBrentAuthorityTemplateActive(workspace.profile),
    [workspace.profile],
  );
  const authorityDisplayValues = useMemo(
    () => getAuthorityDisplayValues(workspace.profile),
    [workspace.profile],
  );

  const learnerOptions = useMemo(
    () =>
      workspace.learners.map((learner) => ({
        value: learner.id,
        label: getLearnerLabel(learner.firstName, learner.preferredName),
      })),
    [workspace.learners],
  );

  useEffect(() => {
    if (!workspace.learners.length) {
      setSelectedLearnerId("");
      return;
    }

    const currentIsValid = workspace.learners.some((learner) => learner.id === selectedLearnerId);
    if (currentIsValid) return;

    const defaultLearnerId = workspace.profile?.defaultLearnerId;
    const defaultIsValid = defaultLearnerId
      ? workspace.learners.some((learner) => learner.id === defaultLearnerId)
      : false;

    setSelectedLearnerId(defaultIsValid ? defaultLearnerId || "" : workspace.learners[0]?.id || "");
  }, [selectedLearnerId, workspace.learners, workspace.profile?.defaultLearnerId]);

  const reloadEntries = useCallback(async () => {
    if (!workspace.profile || !selectedLearnerId) {
      setEntries([]);
      return;
    }

    setEntriesLoading(true);
    setEntriesError(null);
    try {
      const nextEntries = await listCleanEvidenceEntries(workspace.profile.id, {
        learnerId: selectedLearnerId,
        limit: 250,
      });
      setEntries(nextEntries);
    } catch (error) {
      setEntries([]);
      setEntriesError(
        normalizeCleanErrorMessage(
          error,
          "We could not load curriculum evidence just now.",
        ),
      );
    } finally {
      setEntriesLoading(false);
    }
  }, [selectedLearnerId, workspace.profile]);

  useEffect(() => {
    if (!workspace.profile || workspace.schemaMissing || workspace.requiresFamilyCreation) {
      setEntries([]);
      return;
    }

    if (!selectedLearnerId) return;
    void reloadEntries();
  }, [
    reloadEntries,
    selectedLearnerId,
    workspace.profile,
    workspace.requiresFamilyCreation,
    workspace.schemaMissing,
  ]);

  const frameworkLabel = useMemo(() => {
    const frameworkId = safe(workspace.profile?.curriculumFrameworkId);
    return frameworkLabelById[frameworkId] || "Broad homeschool curriculum map";
  }, [workspace.profile?.curriculumFrameworkId]);

  const countryAuthorityLabel = useMemo(() => {
    if (
      authorityDisplayValues.countryCode === "UK" &&
      (safe(authorityDisplayValues.nationLabel) !== "Not set" ||
        safe(authorityDisplayValues.localAuthorityLabel) !== "Not set")
    ) {
      return [
        authorityDisplayValues.countryLabel,
        authorityDisplayValues.nationLabel,
        authorityDisplayValues.localAuthorityLabel,
      ]
        .filter((value) => safe(value) && value !== "Not set")
        .join(" / ");
    }

    const countryCode = safe(workspace.profile?.countryCode);
    const jurisdictionCode = safe(workspace.profile?.jurisdictionCode);
    const countryLabel = countryLabelByCode[countryCode] || countryCode;

    if (!countryLabel && !jurisdictionCode) {
      return "Framework details will connect to My Settings in a later pass.";
    }

    return [countryLabel, jurisdictionCode].filter(Boolean).join(" / ");
  }, [
    authorityDisplayValues.countryLabel,
    authorityDisplayValues.countryCode,
    authorityDisplayValues.localAuthorityLabel,
    authorityDisplayValues.nationLabel,
    workspace.profile?.countryCode,
    workspace.profile?.jurisdictionCode,
  ]);

  const selectedLearner = useMemo(
    () =>
      workspace.learners.find((learner) => learner.id === selectedLearnerId) ?? null,
    [selectedLearnerId, workspace.learners],
  );

  const areaSummaries = useMemo(() => {
    return learningAreas.map((area) => {
      const matchedEntries = entries.filter((entry) =>
        matchesAnyKeyword(buildEvidenceSearchText(entry), area.keywords),
      );
      const summary = buildMatchSummary(matchedEntries);

      return {
        area,
        matchedEntries,
        ...summary,
      };
    });
  }, [entries]);

  useEffect(() => {
    if (!areaSummaries.length) {
      setSelectedAreaId("");
      return;
    }

    const hasCurrentSelection = areaSummaries.some((item) => item.area.id === selectedAreaId);
    if (hasCurrentSelection) return;

    const firstWithEvidence = areaSummaries.find((item) => item.count > 0);
    setSelectedAreaId(firstWithEvidence?.area.id || areaSummaries[0]?.area.id || "");
  }, [areaSummaries, selectedAreaId]);

  const selectedAreaSummary =
    areaSummaries.find((item) => item.area.id === selectedAreaId) ?? areaSummaries[0] ?? null;

  const selectedAreaElementSummaries = useMemo(() => {
    if (!selectedAreaSummary) return [];

    return selectedAreaSummary.area.elements.map((element) => {
      const matchedEntries = selectedAreaSummary.matchedEntries.filter((entry) =>
        matchesAnyKeyword(buildEvidenceSearchText(entry), element.keywords),
      );
      return {
        element,
        ...buildMatchSummary(matchedEntries),
      };
    });
  }, [selectedAreaSummary]);

  const authorityAreaSummaries = useMemo(() => {
    return authorityEvidenceAreas.map((area) => {
      const matchedEntries = entries.filter((entry) =>
        matchesAnyKeyword(buildEvidenceSearchText(entry), area.keywords),
      );
      return {
        area,
        ...buildMatchSummary(matchedEntries),
      };
    });
  }, [entries]);

  const learningAreasWithEvidenceCount = useMemo(
    () => areaSummaries.filter((summary) => summary.count > 0).length,
    [areaSummaries],
  );

  const areasToRevisitCount = useMemo(
    () => areaSummaries.filter((summary) => summary.count === 0).length,
    [areaSummaries],
  );

  const authorityAreasWithEvidenceCount = useMemo(
    () => authorityAreaSummaries.filter((summary) => summary.count > 0).length,
    [authorityAreaSummaries],
  );

  useEffect(() => {
    if (brentModeActive) {
      setShowAuthorityAreas(true);
    }
  }, [brentModeActive]);

  function buildCaptureHref(learningAreaLabel: string, curriculumElementId: string) {
    const params = new URLSearchParams();
    if (selectedLearnerId) {
      params.set("learner_id", selectedLearnerId);
    }
    params.set("learningArea", learningAreaLabel);
    params.set("curriculumElement", curriculumElementId);
    return `${capturePathBase}?${params.toString()}`;
  }

  return (
    <div style={shellStyle}>
      <div style={wrapStyle}>
        <CleanAppHeader />

        <section style={{ ...cardStyle, padding: 24 }}>
          <div style={{ display: "grid", gap: 18 }}>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={eyebrowStyle}>Learning areas and evidence</div>
              <h1 style={{ margin: 0, fontSize: 30, color: "#0f172a" }}>My Curriculum</h1>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.7, fontSize: 16 }}>
                See what learning areas are being covered, where evidence is building, and where you may want to capture more.
              </p>
              <p style={{ margin: 0, color: "#64748b", lineHeight: 1.7 }}>
                This is a supporting layer. It does not replace My Capture, My Portfolio, My Reports, or My Outputs.
              </p>
            </div>

            <div style={helperCardStyle}>
              <strong style={{ color: "#0f172a" }}>What does this learning show?</strong>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                Use My Curriculum to connect everyday learning with curriculum areas, reporting expectations, and your child&apos;s learning record.
              </p>
            </div>

            {!workspace.loading &&
            !workspace.schemaMissing &&
            !workspace.requiresFamilyCreation &&
            workspace.profile &&
            workspace.learners.length ? (
              <div
                style={{
                  display: "grid",
                  gap: 14,
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                }}
              >
                <div style={compactCardStyle}>
                  <div style={eyebrowStyle}>Current framework</div>
                  <strong style={{ color: "#0f172a", fontSize: 16 }}>{frameworkLabel}</strong>
                  <div style={{ color: "#475569", lineHeight: 1.6 }}>
                    Country / authority:{" "}
                    {countryAuthorityLabel || "Framework details will connect to My Settings in a later pass."}
                  </div>
                  <div style={{ color: "#64748b", lineHeight: 1.6 }}>Status: Foundation view</div>
                  {!safe(workspace.profile.countryCode) || !safe(workspace.profile.curriculumFrameworkId) ? (
                    <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                      Framework details will connect to My Settings in a later pass.
                    </div>
                  ) : null}
                </div>

                <div style={compactCardStyle}>
                  <div style={eyebrowStyle}>Current learner</div>
                  <label style={{ color: "#334155", fontWeight: 700 }}>
                    Viewing learning record for
                  </label>
                  <select
                    value={selectedLearnerId}
                    onChange={(event) => setSelectedLearnerId(event.target.value)}
                    style={inputStyle}
                  >
                    {learnerOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                    Coverage stays exploratory here. Your capture and portfolio workflow remains unchanged.
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {workspace.loading ? <section style={cardStyle}>Loading curriculum view...</section> : null}

        {!workspace.loading && workspace.schemaMissing ? (
          <section style={cardStyle}>
            <strong style={{ display: "block", marginBottom: 8 }}>
              {CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE}
            </strong>
            <p style={{ margin: 0, color: "#475569" }}>
              My Curriculum uses the clean family workspace and evidence records.
            </p>
          </section>
        ) : null}

        {!workspace.loading && !workspace.schemaMissing && workspace.error ? (
          <section style={cardStyle}>
            <strong style={{ display: "block", marginBottom: 8 }}>Workspace error</strong>
            <p style={{ margin: 0, color: "#475569" }}>{workspace.error}</p>
          </section>
        ) : null}

        {!workspace.loading && !workspace.schemaMissing && workspace.requiresFamilyCreation ? (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, color: "#0f172a" }}>Create family profile first</h2>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              My Curriculum needs the family workspace first. Set up My Profile before using this page.
            </p>
          </section>
        ) : null}

        {!workspace.loading &&
        !workspace.schemaMissing &&
        !workspace.requiresFamilyCreation &&
        !workspace.learners.length ? (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, color: "#0f172a" }}>Add a learner first</h2>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              Add a learner before using curriculum coverage. My Curriculum is designed to help you understand one learner&apos;s evidence and coverage at a time.
            </p>
            <div style={{ marginTop: 16 }}>
              <Link href="/my-profile" style={buttonStyle}>
                Open My Profile
              </Link>
            </div>
          </section>
        ) : null}

        {!workspace.loading &&
        !workspace.schemaMissing &&
        !workspace.requiresFamilyCreation &&
        workspace.profile &&
        workspace.learners.length ? (
          <>
            {entriesError ? (
              <section style={helperCardStyle}>
                <strong style={{ color: "#0f172a" }}>Evidence loading note</strong>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>{entriesError}</p>
              </section>
            ) : null}

            <section style={summaryStripStyle}>
              <div style={summaryCardStyle}>
                <div style={{ color: "#64748b", fontSize: 13, fontWeight: 700 }}>
                  Learning areas with evidence
                </div>
                <div style={{ color: "#0f172a", fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
                  {learningAreasWithEvidenceCount}
                </div>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  Evidence building across {learningAreas.length} broad learning areas.
                </div>
              </div>

              <div style={summaryCardStyle}>
                <div style={{ color: "#64748b", fontSize: 13, fontWeight: 700 }}>
                  Evidence entries linked
                </div>
                <div style={{ color: "#0f172a", fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
                  {entriesLoading ? "..." : entries.length}
                </div>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  {entries.length
                    ? "Ready for reports as evidence continues to build."
                    : "Foundation view while evidence begins to build."}
                </div>
              </div>

              <div style={summaryCardStyle}>
                <div style={{ color: "#64748b", fontSize: 13, fontWeight: 700 }}>
                  Areas to revisit
                </div>
                <div style={{ color: "#0f172a", fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
                  {areasToRevisitCount}
                </div>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  Learning areas with no evidence yet for this learner.
                </div>
              </div>

              <div style={summaryCardStyle}>
                <div style={{ color: "#64748b", fontSize: 13, fontWeight: 700 }}>
                  Authority evidence areas
                </div>
                <div style={{ color: "#0f172a", fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
                  {brentModeActive ? authorityAreasWithEvidenceCount : authorityEvidenceAreas.length}
                </div>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  {brentModeActive
                    ? "Evidence building for authority-aligned reporting support."
                    : "Available when you need authority-aligned review support."}
                </div>
              </div>
            </section>

            <section style={cardStyle}>
              <div style={{ display: "grid", gap: 12, marginBottom: 18 }}>
                <div style={eyebrowStyle}>Coverage map</div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "flex-end",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "grid", gap: 8 }}>
                    <h2 style={{ margin: 0, color: "#0f172a" }}>Learning area coverage</h2>
                    <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                      Scan the broad learning areas first, then open one area to decide where you may want to capture more.
                    </p>
                  </div>

                  {selectedLearner ? (
                    <div
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 999,
                        padding: "8px 12px",
                        background: "#f8fafc",
                        color: "#475569",
                        lineHeight: 1.6,
                      }}
                    >
                      Viewing{" "}
                      <strong style={{ color: "#0f172a" }}>
                        {getLearnerLabel(selectedLearner.firstName, selectedLearner.preferredName)}
                      </strong>
                    </div>
                  ) : null}
                </div>
              </div>

              {entriesLoading ? (
                <div style={{ color: "#64748b", lineHeight: 1.6 }}>Loading evidence coverage...</div>
              ) : null}

              <div
                style={{
                  display: "grid",
                  gap: 14,
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                }}
              >
                {areaSummaries.map((summary) => (
                  <article
                    key={summary.area.id}
                    style={{
                      border: summary.area.id === selectedAreaId ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
                      borderRadius: 16,
                      padding: 14,
                      background: summary.area.id === selectedAreaId ? "#f8fbff" : "#ffffff",
                      display: "grid",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        alignItems: "flex-start",
                      }}
                    >
                      <div style={{ display: "grid", gap: 6 }}>
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <strong style={{ color: "#0f172a", fontSize: 16 }}>{summary.area.title}</strong>
                          {summary.area.id === selectedAreaId ? (
                            <span
                              style={{
                                border: "1px solid #bfdbfe",
                                background: "#eff6ff",
                                color: "#1d4ed8",
                                borderRadius: 999,
                                padding: "4px 8px",
                                fontSize: 11,
                                fontWeight: 800,
                              }}
                            >
                              Selected area
                            </span>
                          ) : null}
                        </div>
                        <div style={{ color: "#64748b", lineHeight: 1.5, fontSize: 14 }}>
                          {summary.area.description}
                        </div>
                      </div>
                      <span
                        style={{
                          ...coverageBadgeStyle(summary.status),
                          borderRadius: 999,
                          padding: "6px 10px",
                          fontSize: 12,
                          fontWeight: 800,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {summary.status}
                      </span>
                    </div>

                    <div style={{ display: "grid", gap: 4, color: "#475569", lineHeight: 1.6 }}>
                      <div>
                        <strong style={{ color: "#0f172a" }}>{getEvidenceItemLabel(summary.count)}</strong>
                      </div>
                      <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
                        Latest evidence: {formatLatestEvidenceLine(summary.latestEntry)}
                      </div>
                    </div>

                    <button
                      type="button"
                      style={summary.area.id === selectedAreaId ? buttonStyle : secondaryButtonStyle}
                      onClick={() => setSelectedAreaId(summary.area.id)}
                    >
                      View area
                    </button>
                  </article>
                ))}
              </div>
            </section>

            {selectedAreaSummary ? (
              <section style={cardStyle}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 18,
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    marginBottom: 20,
                  }}
                >
                  <div style={{ display: "grid", gap: 10, maxWidth: 720 }}>
                    <div style={eyebrowStyle}>Selected area</div>
                    <h2 style={{ margin: 0, color: "#0f172a" }}>
                      Area detail: {selectedAreaSummary.area.title}
                    </h2>
                    <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                      Look across the elements below to see where evidence is already forming and where you may want to capture more.
                    </p>
                    <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                      {selectedAreaSummary.area.description}
                    </div>
                  </div>

                  <div style={{ ...compactCardStyle, minWidth: 240, maxWidth: 320 }}>
                    <span
                      style={{
                        ...coverageBadgeStyle(selectedAreaSummary.status),
                        borderRadius: 999,
                        padding: "6px 10px",
                        fontSize: 12,
                        fontWeight: 800,
                        justifySelf: "start",
                      }}
                    >
                      {selectedAreaSummary.status}
                    </span>
                    <div style={{ color: "#0f172a", fontWeight: 800 }}>
                      {getEvidenceItemLabel(selectedAreaSummary.count)}
                    </div>
                    <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                      Latest evidence: {formatLatestEvidenceLine(selectedAreaSummary.latestEntry)}
                    </div>
                    <Link
                      href={buildCaptureHref(
                        selectedAreaSummary.area.title,
                        selectedAreaSummary.area.id,
                      )}
                      style={buttonStyle}
                    >
                      Capture evidence
                    </Link>
                  </div>
                </div>

                {selectedAreaElementSummaries.length ? (
                  <div
                    style={{
                      display: "grid",
                      gap: 14,
                      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    }}
                  >
                    {selectedAreaElementSummaries.map((summary) => (
                      <article
                        key={summary.element.id}
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: 16,
                          padding: 16,
                          display: "grid",
                          gap: 12,
                          background: "#ffffff",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                          <strong style={{ color: "#0f172a", fontSize: 16 }}>{summary.element.title}</strong>
                          <span
                            style={{
                              ...coverageBadgeStyle(summary.status),
                              borderRadius: 999,
                              padding: "6px 10px",
                              fontSize: 12,
                              fontWeight: 800,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {summary.status}
                          </span>
                        </div>

                        <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                          {summary.element.description}
                        </div>

                        <div style={{ display: "grid", gap: 4, color: "#475569", lineHeight: 1.6 }}>
                          <div>
                            <strong style={{ color: "#0f172a" }}>{getEvidenceItemLabel(summary.count)}</strong>
                          </div>
                          <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
                            Latest evidence: {formatLatestEvidenceLine(summary.latestEntry)}
                          </div>
                        </div>

                        <Link
                          href={buildCaptureHref(selectedAreaSummary.area.title, summary.element.id)}
                          style={buttonStyle}
                        >
                          Capture evidence
                        </Link>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div style={helperCardStyle}>
                    <strong style={{ color: "#0f172a" }}>Foundation view</strong>
                    <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                      This area will gain more detailed curriculum elements in a later pass. For now, capture evidence using the broad learning area.
                    </p>
                    <div>
                      <Link
                        href={buildCaptureHref(selectedAreaSummary.area.title, selectedAreaSummary.area.id)}
                        style={buttonStyle}
                      >
                        Capture evidence
                      </Link>
                    </div>
                  </div>
                )}
              </section>
            ) : null}

            <section style={{ ...cardStyle, background: "#fcfdff" }}>
              <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={eyebrowStyle}>Reporting support</div>
                    <h2 style={{ margin: 0, color: "#0f172a" }}>Authority / support evidence areas</h2>
                  </div>
                  <span
                    style={{
                      border: brentModeActive ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
                      background: brentModeActive ? "#eff6ff" : "#f8fafc",
                      color: brentModeActive ? "#1d4ed8" : "#64748b",
                      borderRadius: 999,
                      padding: "6px 10px",
                      fontSize: 12,
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {brentModeActive ? "Active for this family" : "Available when selected in My Settings"}
                  </span>
                </div>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                  These areas help you see how evidence can support authority-aligned review and reporting expectations without changing the core family workflow.
                </p>
              </div>

              {brentModeActive ? (
                <div style={{ ...helperCardStyle, marginBottom: 16 }}>
                  <strong style={{ color: "#0f172a" }}>Authority pathway active</strong>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                    Brent-aligned reporting support is active for this family, so these areas are shown as part of the evidence map.
                  </p>
                </div>
              ) : null}

              {!brentModeActive && !showAuthorityAreas ? (
                <div style={helperCardStyle}>
                  <strong style={{ color: "#0f172a" }}>Available when selected in My Settings</strong>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                    Open these areas when you want to explore how evidence can support authority-aligned review and reporting expectations.
                  </p>
                  <div>
                    <button
                      type="button"
                      style={secondaryButtonStyle}
                      onClick={() => setShowAuthorityAreas(true)}
                    >
                      Show support areas
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {!brentModeActive ? (
                    <div style={{ marginBottom: 16 }}>
                      <button
                        type="button"
                        style={secondaryButtonStyle}
                        onClick={() => setShowAuthorityAreas(false)}
                      >
                        Hide support areas
                      </button>
                    </div>
                  ) : null}

                  <div
                    style={{
                      display: "grid",
                      gap: 14,
                      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    }}
                  >
                    {authorityAreaSummaries.map((summary) => (
                      <article
                        key={summary.area.id}
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: 16,
                          padding: 16,
                          display: "grid",
                          gap: 12,
                          background: "#ffffff",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                          <strong style={{ color: "#0f172a", fontSize: 16 }}>{summary.area.title}</strong>
                          <span
                            style={{
                              ...coverageBadgeStyle(summary.status),
                              borderRadius: 999,
                              padding: "6px 10px",
                              fontSize: 12,
                              fontWeight: 800,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {summary.status}
                          </span>
                        </div>

                        <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                          {summary.area.description}
                        </div>

                        <div style={{ display: "grid", gap: 4, color: "#475569", lineHeight: 1.6 }}>
                          <div>
                            <strong style={{ color: "#0f172a" }}>{getEvidenceItemLabel(summary.count)}</strong>
                          </div>
                          <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
                            Latest evidence: {formatLatestEvidenceLine(summary.latestEntry)}
                          </div>
                        </div>

                        <Link
                          href={buildCaptureHref("Authority evidence", summary.area.id)}
                          style={secondaryButtonStyle}
                        >
                          Capture evidence
                        </Link>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </section>

            <section style={cardStyle}>
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <div>
                    <h2 style={{ margin: 0, color: "#0f172a" }}>Curriculum Coverage PDF</h2>
                    <p style={{ margin: "8px 0 0", color: "#475569", lineHeight: 1.6 }}>
                      Export a curriculum coverage record showing learning areas, evidence links, and areas to revisit. Useful for reporting, review, and portfolio preparation.
                    </p>
                  </div>
                  <span
                    style={{
                      border: "1px solid #c7d2fe",
                      background: "#eef2ff",
                      color: "#4338ca",
                      borderRadius: 999,
                      padding: "6px 10px",
                      fontSize: 12,
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Coming later
                  </span>
                </div>
                <div style={helperCardStyle}>
                  <strong style={{ color: "#0f172a" }}>Coming later</strong>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                    Curriculum coverage export will arrive in a later pass once the evidence view and area mapping have settled into a stronger family workflow.
                  </p>
                </div>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function CleanCurriculumWorkspace() {
  return (
    <CleanFamilyWorkspaceProvider>
      <CurriculumWorkspaceBody />
    </CleanFamilyWorkspaceProvider>
  );
}
