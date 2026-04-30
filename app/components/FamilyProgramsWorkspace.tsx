"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";
import {
  type LearnerOption,
  LearnerSelector,
} from "@/app/components/home/HomeOverviewComponents";
import {
  CurriculumAttachPanel,
  CurriculumTagPills,
} from "@/app/components/curriculum/CurriculumTaggingComponents";
import {
  ProgramGenerationSuccessBanner,
  ProgramGuidedSetupPanel,
  ProgramsGuidedSetupBanner,
  ProgramCalendarAssignmentPanel,
  ProgramEditor,
  ProgramList,
  ProgramSegmentCard,
  type StandardProgramOption,
  type SuggestedProgramPathTerm,
  type SuggestedProgramPathTile,
  BODY,
  H2,
  LABEL,
  META,
} from "@/app/components/programs/ProgramOverviewComponents";
import { resolveEffectiveLearnerLearningConfig } from "@/lib/familyLearningConfig";
import {
  defaultProgram,
  generateProgramIntoCalendar,
  loadFamilyCalendarTemplates,
  loadFamilyPrograms,
  saveFamilyProgram,
  type CalendarTemplate,
  type Program,
  type ProgramSegment,
} from "@/lib/familyPlanningTemplates";
import {
  frameworkPreset,
} from "@/lib/curriculumFrameworks";
import { FAMILY_YEAR_LEVEL_OPTIONS } from "@/lib/familyLearnerYearLevel";

type StandardProgramId = "maths" | "english" | "science" | "hass";

type ProgramSetupDraft = {
  yearLevel: string;
  programId: StandardProgramId;
};

const EMPTY_PROGRAM_SETUP_DRAFT: ProgramSetupDraft = {
  yearLevel: "",
  programId: "maths",
};

const STANDARD_PROGRAMS: Array<{
  id: StandardProgramId;
  title: string;
  subjectTitle: string;
  description: string;
}> = [
  {
    id: "maths",
    title: "Maths",
    subjectTitle: "Maths",
    description: "Number, operations, measurement, data, geometry, patterns, fractions, and review.",
  },
  {
    id: "english",
    title: "English",
    subjectTitle: "English",
    description: "Reading, writing, speaking, vocabulary, and projects.",
  },
  {
    id: "science",
    title: "Science",
    subjectTitle: "Science",
    description: "Inquiry, living things, materials, forces, Earth, and design.",
  },
  {
    id: "hass",
    title: "HASS",
    subjectTitle: "HASS",
    description: "History, geography, community, civics, and inquiry.",
  },
];

type MathsYearPathKey = "foundation" | 1 | 2 | 3 | 4 | 5 | 6;

type MathsYearProfile = {
  label: string;
  countRange: string;
  representation?: string;
  placeValue: string;
  comparing: string;
  addition?: string;
  subtraction?: string;
  operations: string;
  measurement: string;
  data: string;
  geometry: string;
  pattern?: string;
  grouping?: string;
  patterns: string;
  fractions: string;
  money?: string;
  review: string;
};

const MATHS_YEAR_PROFILES: Record<string, MathsYearProfile> = {
  foundation: {
    label: "Foundation",
    countRange: "small collections, oral counting, and numbers to 20",
    placeValue: "teen numbers as ten and some more",
    comparing: "more, less, same, before, and after",
    operations: "joining, taking away, grouping, and sharing with concrete materials",
    measurement: "direct comparisons of length, mass, capacity, duration, and everyday money",
    data: "sorting, asking simple questions, and reading picture displays",
    geometry: "shapes, position, movement, and everyday location language",
    patterns: "repeating patterns, copy-change-continue routines, and counting by ones",
    fractions: "halves through folding, sharing, and everyday objects",
    review: "counting, matching, comparing, and explaining number choices",
  },
  1: {
    label: "Year 1",
    countRange: "small collections and two-digit numbers",
    placeValue: "ones, tens, and teen numbers",
    comparing: "two-digit quantities with everyday language and symbols",
    operations: "addition, subtraction, equal groups, and make-ten strategies",
    measurement: "informal units, days and months, simple time, and coin contexts",
    data: "yes/no questions, categories, tally marks, and simple displays",
    geometry: "2D shapes, 3D objects, turns, direction, and position",
    patterns: "twos, fives, tens, repeated patterns, and simple pattern rules",
    fractions: "halves, coins, and everyday sharing",
    review: "two-digit number sense, facts, patterns, and sharing",
  },
  2: {
    label: "Year 2",
    countRange: "two- and three-digit numbers",
    placeValue: "hundreds, tens, and ones",
    comparing: "three-digit numbers using place value and benchmarks",
    operations: "mental addition, subtraction, arrays, equal groups, and sharing",
    measurement: "length, area, capacity, mass, time, calendars, and money totals",
    data: "collecting data, making displays, and comparing categories",
    geometry: "shape features, symmetry, turns, maps, and simple grids",
    patterns: "skip counting, growing patterns, and rule-based sequences",
    fractions: "halves, quarters, money, and revision",
    review: "place value, mental strategies, equal groups, and fractions",
  },
  3: {
    label: "Year 3",
    countRange: "numbers into the thousands",
    placeValue: "thousands, hundreds, tens, and ones",
    comparing: "larger numbers using place value and efficient benchmarks",
    operations: "efficient addition, subtraction, multiplication, and division strategies",
    measurement: "length, perimeter, mass, capacity, time, money, and unit choice",
    data: "surveys, tables, column graphs, and interpreting displays",
    geometry: "angles, 2D shapes, 3D objects, location, and transformations",
    patterns: "skip counting, multiplication patterns, and number rules",
    fractions: "simple fractions, money, and revision",
    review: "number representation, operations, patterns, and fractions",
  },
  4: {
    label: "Year 4",
    countRange: "larger whole numbers",
    placeValue: "expanded notation and flexible partitioning",
    comparing: "large numbers and decimal-sized quantities",
    operations: "multi-step addition, subtraction, multiplication, and division problems",
    measurement: "perimeter, area, volume, time, money, angles, and unit conversions",
    data: "survey design, tables, displays, chance language, and comparisons",
    geometry: "shape properties, angles, symmetry, transformations, and maps",
    patterns: "multiplicative patterns, factors, multiples, and rules",
    fractions: "fractions, decimals, money, and revision",
    review: "large numbers, operations, fractions, decimals, and reasoning",
  },
  5: {
    label: "Year 5",
    countRange: "large whole numbers and decimals",
    placeValue: "place value across whole numbers and decimals",
    comparing: "whole numbers, decimals, and benchmark fractions",
    operations: "decimal operations, written strategies, factors, multiples, and remainders",
    measurement: "area, volume, time, rates, money, angles, and metric conversions",
    data: "data collection, graph choice, averages, chance, and interpretation",
    geometry: "angles, transformations, coordinates, nets, and shape classification",
    patterns: "factors, multiples, growing patterns, and rule testing",
    fractions: "fractions, decimals, money, and revision",
    review: "decimals, fractions, operations, and flexible strategy choice",
  },
  6: {
    label: "Year 6",
    countRange: "whole numbers, decimals, and fractions",
    placeValue: "renaming numbers across forms",
    comparing: "fractions, decimals, percentages, and large numbers",
    operations: "efficient operations across whole numbers, decimals, fractions, and percentages",
    measurement: "area, volume, time, rates, money, angle, scale, and conversion problems",
    data: "data investigations, graph critique, probability, and evidence-based claims",
    geometry: "coordinates, transformations, angles, nets, and geometric reasoning",
    patterns: "rules, multiples, generalisations, and introductory algebraic thinking",
    fractions: "fractions, decimals, percentages, money, and revision",
    review: "whole-number, fraction, decimal, percentage, and problem-solving fluency",
  },
};

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function setupYearLevel(value: unknown) {
  const yearLevel = clean(value);
  return yearLevel && yearLevel !== "Year band not set" ? yearLevel : "";
}

function defaultYearLevel(value: unknown) {
  return setupYearLevel(value) || "3";
}

function yearLevelOptionLabel(value: string) {
  if (value === "Foundation") return "Foundation";
  if (/^\d+$/.test(value)) return `Year ${value}`;
  if (/^year\s+\d+$/i.test(value)) return value.replace(/^year/i, "Year");
  if (value === "K") return "Kindergarten";
  return value;
}

function yearPathKeyFromLabel(value: string): MathsYearPathKey | null {
  const label = clean(value).toLowerCase().replace(/^year\s+/, "");
  if (["foundation", "prep", "k", "kindergarten", "pre-k"].includes(label)) {
    return "foundation";
  }
  const year = Number(label);
  return Number.isInteger(year) && year >= 1 && year <= 6
    ? (year as MathsYearPathKey)
    : null;
}

function buildYearLevelOptions(prefillYearLevel: string) {
  const values = [
    setupYearLevel(prefillYearLevel),
    "Foundation",
    ...FAMILY_YEAR_LEVEL_OPTIONS,
  ].filter(Boolean);
  return Array.from(new Set(values)).map((value) => ({
    id: value,
    label: yearLevelOptionLabel(value),
  }));
}

function prefilledProgramSetupDraft(yearBand?: string | null): ProgramSetupDraft {
  return {
    ...EMPTY_PROGRAM_SETUP_DRAFT,
    yearLevel: defaultYearLevel(yearBand),
  };
}

function slugify(value: string) {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function makePathTile(input: {
  programId?: StandardProgramId;
  yearKey: MathsYearPathKey;
  term: number;
  week: number;
  title: string;
  description: string;
  strandLabel?: string | null;
  curriculumCode?: string | null;
}): SuggestedProgramPathTile {
  const programId = input.programId || "maths";
  return {
    id: `${programId}-${input.yearKey}-term-${input.term}-week-${input.week}-${slugify(input.title)}`,
    term: input.term,
    week: input.week,
    title: input.title,
    description: input.description,
    strandLabel: input.strandLabel || null,
    curriculumCode: input.curriculumCode || null,
  };
}

function codeAt(outcomes: Array<{ code: string; label: string }>, index: number) {
  return clean(outcomes[index]?.code) || clean(outcomes[0]?.code) || null;
}

function buildMathsNumberYearPath(input: {
  yearKey: MathsYearPathKey;
  strandLabel: string;
  strandOutcomes: Array<{ code: string; label: string }>;
}): SuggestedProgramPathTerm[] {
  const profile = MATHS_YEAR_PROFILES[input.yearKey] ?? MATHS_YEAR_PROFILES[3];
  const strandLabel = input.strandLabel || "Number";
  const terms = [
    {
      term: 1,
      tiles: [
        makePathTile({
          yearKey: input.yearKey,
          term: 1,
          week: 1,
          title: "Number sense",
          description: `Represent, count, and compare ${profile.countRange}.`,
          strandLabel,
          curriculumCode: codeAt(input.strandOutcomes, 0),
        }),
        makePathTile({
          yearKey: input.yearKey,
          term: 1,
          week: 2,
          title: "Counting routines",
          description: `Build fluent forward, backward, and skip-counting routines for ${profile.label}.`,
          strandLabel,
          curriculumCode: codeAt(input.strandOutcomes, 0),
        }),
        makePathTile({
          yearKey: input.yearKey,
          term: 1,
          week: 3,
          title: "Representing quantities",
          description: `Show numbers with ${profile.representation}.`,
          strandLabel,
          curriculumCode: codeAt(input.strandOutcomes, 0),
        }),
        makePathTile({
          yearKey: input.yearKey,
          term: 1,
          week: 4,
          title: "Place value",
          description: `Build confidence with ${profile.placeValue}.`,
          strandLabel,
          curriculumCode: codeAt(input.strandOutcomes, 0),
        }),
        makePathTile({
          yearKey: input.yearKey,
          term: 1,
          week: 5,
          title: "Comparing numbers",
          description: `Compare ${profile.comparing}.`,
          strandLabel,
          curriculumCode: codeAt(input.strandOutcomes, 0),
        }),
        makePathTile({
          yearKey: input.yearKey,
          term: 1,
          week: 6,
          title: "Ordering numbers",
          description: "Order values and explain the position of each number.",
          strandLabel,
          curriculumCode: codeAt(input.strandOutcomes, 0),
        }),
        makePathTile({
          yearKey: input.yearKey,
          term: 1,
          week: 7,
          title: "Number lines",
          description: "Use open and marked number lines to locate and estimate values.",
          strandLabel,
          curriculumCode: codeAt(input.strandOutcomes, 0),
        }),
        makePathTile({
          yearKey: input.yearKey,
          term: 1,
          week: 8,
          title: "Estimating quantities",
          description: "Make sensible estimates and check them against real quantities.",
          strandLabel,
          curriculumCode: codeAt(input.strandOutcomes, 0),
        }),
        makePathTile({
          yearKey: input.yearKey,
          term: 1,
          week: 9,
          title: "Number stories",
          description: "Use drawings, models, and words to explain number situations.",
          strandLabel,
          curriculumCode: codeAt(input.strandOutcomes, 0),
        }),
        makePathTile({
          yearKey: input.yearKey,
          term: 1,
          week: 10,
          title: "Term 1 review",
          description: `Read, write, make, and explain ${profile.countRange}.`,
          strandLabel,
          curriculumCode: codeAt(input.strandOutcomes, 0),
        }),
      ],
    },
    {
      term: 2,
      tiles: [
        makePathTile({
          yearKey: input.yearKey,
          term: 2,
          week: 11,
          title: "Addition strategies",
          description: `Practise ways to ${profile.addition}.`,
          strandLabel,
          curriculumCode: codeAt(input.strandOutcomes, 1),
        }),
        makePathTile({
          yearKey: input.yearKey,
          term: 2,
          week: 12,
          title: "Known facts",
          description: "Build fast recall from doubles, near doubles, and friendly numbers.",
          strandLabel,
          curriculumCode: codeAt(input.strandOutcomes, 1),
        }),
        makePathTile({
          yearKey: input.yearKey,
          term: 2,
          week: 13,
          title: "Bridging strategies",
          description: "Bridge through useful benchmarks to make calculations easier.",
          strandLabel,
          curriculumCode: codeAt(input.strandOutcomes, 1),
        }),
        makePathTile({
          yearKey: input.yearKey,
          term: 2,
          week: 14,
          title: "Flexible addition",
          description: "Choose from counting on, partitioning, compensation, and known facts.",
          strandLabel,
          curriculumCode: codeAt(input.strandOutcomes, 1),
        }),
        makePathTile({
          yearKey: input.yearKey,
          term: 2,
          week: 15,
          title: "Subtraction strategies",
          description: `Model and explain how to ${profile.subtraction}.`,
          strandLabel,
          curriculumCode: codeAt(input.strandOutcomes, 1),
        }),
        makePathTile({
          yearKey: input.yearKey,
          term: 2,
          week: 16,
          title: "Finding the difference",
          description: "Compare quantities by counting up, counting back, or using benchmarks.",
          strandLabel,
          curriculumCode: codeAt(input.strandOutcomes, 1),
        }),
        makePathTile({
          yearKey: input.yearKey,
          term: 2,
          week: 17,
          title: "Inverse operations",
          description: "Connect addition and subtraction as related strategies.",
          strandLabel,
          curriculumCode: codeAt(input.strandOutcomes, 1),
        }),
        makePathTile({
          yearKey: input.yearKey,
          term: 2,
          week: 18,
          title: "Mixed operation choices",
          description: "Decide whether a story needs addition, subtraction, or comparison.",
          strandLabel,
          curriculumCode: codeAt(input.strandOutcomes, 1),
        }),
        makePathTile({
          yearKey: input.yearKey,
          term: 2,
          week: 19,
          title: "Problem-solving models",
          description: "Represent number problems with diagrams, equations, and explanations.",
          strandLabel,
          curriculumCode: codeAt(input.strandOutcomes, 1),
        }),
        makePathTile({
          yearKey: input.yearKey,
          term: 2,
          week: 20,
          title: "Term 2 review",
          description: "Consolidate facts, strategies, and written explanations.",
          strandLabel,
          curriculumCode: codeAt(input.strandOutcomes, 1),
        }),
      ],
    },
    {
      term: 3,
      tiles: [
        makePathTile({
          yearKey: input.yearKey,
          term: 3,
          week: 21,
          title: "Patterns and skip counting",
          description: `Work with ${profile.pattern}.`,
          strandLabel,
          curriculumCode: codeAt(input.strandOutcomes, 1),
        }),
        makePathTile({
          yearKey: input.yearKey,
          term: 3,
          week: 22,
          title: "Pattern rules",
          description: "Describe what changes, what repeats, and what comes next.",
          strandLabel,
          curriculumCode: codeAt(input.strandOutcomes, 1),
        }),
        makePathTile({
          yearKey: input.yearKey,
          term: 3,
          week: 23,
          title: "Grouping",
          description: `Represent ${profile.grouping}.`,
          strandLabel,
          curriculumCode: codeAt(input.strandOutcomes, 1),
        }),
        makePathTile({
          yearKey: input.yearKey,
          term: 3,
          week: 24,
          title: "Arrays and models",
          description: "Use rows, columns, diagrams, and materials to show equal groups.",
          strandLabel,
          curriculumCode: codeAt(input.strandOutcomes, 1),
        }),
        makePathTile({
          yearKey: input.yearKey,
          term: 3,
          week: 25,
          title: "Sharing",
          description: "Use fair shares and equal groups to explain division ideas.",
          strandLabel,
          curriculumCode: codeAt(input.strandOutcomes, 1),
        }),
        makePathTile({
          yearKey: input.yearKey,
          term: 3,
          week: 26,
          title: "Grouping for division",
          description: "Find how many groups can be made and explain the leftovers when needed.",
          strandLabel,
          curriculumCode: codeAt(input.strandOutcomes, 1),
        }),
        makePathTile({
          yearKey: input.yearKey,
          term: 3,
          week: 27,
          title: "Multiplication language",
          description: "Connect repeated addition, equal groups, and multiplication sentences.",
          strandLabel,
          curriculumCode: codeAt(input.strandOutcomes, 1),
        }),
        makePathTile({
          yearKey: input.yearKey,
          term: 3,
          week: 28,
          title: "Division language",
          description: "Connect sharing, grouping, and division sentences.",
          strandLabel,
          curriculumCode: codeAt(input.strandOutcomes, 1),
        }),
        makePathTile({
          yearKey: input.yearKey,
          term: 3,
          week: 29,
          title: "Pattern problem solving",
          description: "Use patterns and equal groups to solve and explain problems.",
          strandLabel,
          curriculumCode: codeAt(input.strandOutcomes, 1),
        }),
        makePathTile({
          yearKey: input.yearKey,
          term: 3,
          week: 30,
          title: "Term 3 review",
          description: "Connect counting patterns with grouping and sharing.",
          strandLabel,
          curriculumCode: codeAt(input.strandOutcomes, 1),
        }),
      ],
    },
    {
      term: 4,
      tiles: [
        makePathTile({
          yearKey: input.yearKey,
          term: 4,
          week: 31,
          title: "Fractions in context",
          description: `Represent ${profile.fractions}.`,
          strandLabel,
          curriculumCode: codeAt(input.strandOutcomes, 2),
        }),
        makePathTile({
          yearKey: input.yearKey,
          term: 4,
          week: 32,
          title: "Fraction representations",
          description: "Use parts of wholes, collections, drawings, and number lines where useful.",
          strandLabel,
          curriculumCode: codeAt(input.strandOutcomes, 2),
        }),
        makePathTile({
          yearKey: input.yearKey,
          term: 4,
          week: 33,
          title: "Money and number decisions",
          description: `Work with ${profile.money}.`,
          strandLabel,
          curriculumCode: codeAt(input.strandOutcomes, 2),
        }),
        makePathTile({
          yearKey: input.yearKey,
          term: 4,
          week: 34,
          title: "Estimating and checking",
          description: "Estimate first, calculate, then check whether the result makes sense.",
          strandLabel,
          curriculumCode: codeAt(input.strandOutcomes, 2),
        }),
        makePathTile({
          yearKey: input.yearKey,
          term: 4,
          week: 35,
          title: "Mixed number problems",
          description: "Choose useful strategies across the year pathway.",
          strandLabel,
        }),
        makePathTile({
          yearKey: input.yearKey,
          term: 4,
          week: 36,
          title: "Strategy choice",
          description: "Compare methods and choose an efficient strategy for each problem.",
          strandLabel,
        }),
        makePathTile({
          yearKey: input.yearKey,
          term: 4,
          week: 37,
          title: "Fluency practice",
          description: "Strengthen accuracy and confidence with core number facts.",
          strandLabel,
        }),
        makePathTile({
          yearKey: input.yearKey,
          term: 4,
          week: 38,
          title: "Real-world number project",
          description: "Apply number skills in a practical investigation or family context.",
          strandLabel,
        }),
        makePathTile({
          yearKey: input.yearKey,
          term: 4,
          week: 39,
          title: "Year consolidation",
          description: `Review ${profile.review}.`,
          strandLabel,
        }),
        makePathTile({
          yearKey: input.yearKey,
          term: 4,
          week: 40,
          title: "Next-year bridge",
          description: "Identify secure skills, support needs, and the next learning move.",
          strandLabel,
        }),
      ],
    },
  ];

  return terms.map((term) => ({
    id: `maths-${input.yearKey}-number-term-${term.term}`,
    term: term.term,
    label: `Term ${term.term}`,
    tiles: term.tiles,
  }));
}

type MathsPathWeekTemplate = {
  title: string;
  strandLabel: "Number" | "Operations" | "Measurement" | "Data" | "Geometry" | "Patterns" | "Fractions" | "Review";
  describe: (profile: MathsYearProfile) => string;
};

const MATHS_YEAR_PATH_TERMS: Array<{
  term: number;
  weeks: MathsPathWeekTemplate[];
}> = [
  {
    term: 1,
    weeks: [
      {
        title: "Number sense",
        strandLabel: "Number",
        describe: (profile) => `Represent, count, and compare ${profile.countRange}.`,
      },
      {
        title: "Place value",
        strandLabel: "Number",
        describe: (profile) => `Build confidence with ${profile.placeValue}.`,
      },
      {
        title: "Comparing and ordering",
        strandLabel: "Number",
        describe: (profile) => `Order and compare ${profile.comparing}.`,
      },
      {
        title: "Addition foundations",
        strandLabel: "Operations",
        describe: (profile) => `Start efficient work with ${profile.operations}.`,
      },
      {
        title: "Subtraction foundations",
        strandLabel: "Operations",
        describe: (profile) => `Model take-away, difference, and inverse thinking through ${profile.operations}.`,
      },
      {
        title: "Measurement benchmarks",
        strandLabel: "Measurement",
        describe: (profile) => `Use practical benchmarks for ${profile.measurement}.`,
      },
      {
        title: "Shape and position",
        strandLabel: "Geometry",
        describe: (profile) => `Describe, sort, and compare ${profile.geometry}.`,
      },
      {
        title: "Data questions",
        strandLabel: "Data",
        describe: (profile) => `Ask useful questions and begin ${profile.data}.`,
      },
      {
        title: "Patterns and rules",
        strandLabel: "Patterns",
        describe: (profile) => `Build and explain ${profile.patterns}.`,
      },
      {
        title: "Term 1 review",
        strandLabel: "Review",
        describe: (profile) => `Consolidate ${profile.countRange}, early operations, measurement, data, and shape work.`,
      },
    ],
  },
  {
    term: 2,
    weeks: [
      {
        title: "Mental addition",
        strandLabel: "Operations",
        describe: (profile) => `Choose mental and modelled strategies for ${profile.operations}.`,
      },
      {
        title: "Mental subtraction",
        strandLabel: "Operations",
        describe: (profile) => `Use counting back, counting up, partitioning, or written models for ${profile.operations}.`,
      },
      {
        title: "Number lines",
        strandLabel: "Number",
        describe: (profile) => `Locate, estimate, and reason with ${profile.countRange} on number lines.`,
      },
      {
        title: "Time and calendars",
        strandLabel: "Measurement",
        describe: (profile) => `Connect time, duration, and calendar thinking within ${profile.measurement}.`,
      },
      {
        title: "Length, mass, and capacity",
        strandLabel: "Measurement",
        describe: (profile) => `Measure, compare, estimate, and explain choices for ${profile.measurement}.`,
      },
      {
        title: "Collecting data",
        strandLabel: "Data",
        describe: (profile) => `Plan a small investigation, gather data, and organise results through ${profile.data}.`,
      },
      {
        title: "Interpreting displays",
        strandLabel: "Data",
        describe: (profile) => `Read displays, compare categories, and make claims from ${profile.data}.`,
      },
      {
        title: "Geometry features",
        strandLabel: "Geometry",
        describe: (profile) => `Name features, compare shapes, and reason with ${profile.geometry}.`,
      },
      {
        title: "Pattern problem solving",
        strandLabel: "Patterns",
        describe: (profile) => `Use ${profile.patterns} to predict, explain, and solve problems.`,
      },
      {
        title: "Term 2 review",
        strandLabel: "Review",
        describe: (profile) => `Review operations, number lines, measurement, data, geometry, and patterns for ${profile.label}.`,
      },
    ],
  },
  {
    term: 3,
    weeks: [
      {
        title: "Grouping and arrays",
        strandLabel: "Operations",
        describe: (profile) => `Represent equal groups, arrays, sharing, and related operations through ${profile.operations}.`,
      },
      {
        title: "Multiplication thinking",
        strandLabel: "Operations",
        describe: (profile) => `Connect repeated groups, factors, models, and efficient strategies for ${profile.operations}.`,
      },
      {
        title: "Division thinking",
        strandLabel: "Operations",
        describe: (profile) => `Use sharing, grouping, remainders where useful, and inverse thinking for ${profile.operations}.`,
      },
      {
        title: "Fractions as equal parts",
        strandLabel: "Fractions",
        describe: (profile) => `Represent ${profile.fractions}.`,
      },
      {
        title: "Fractions on number lines",
        strandLabel: "Fractions",
        describe: (profile) => `Place fraction ideas alongside whole-number and decimal thinking for ${profile.label}.`,
      },
      {
        title: "Money and practical number",
        strandLabel: "Number",
        describe: (profile) => `Use number sense and operations in practical money, estimating, and checking contexts.`,
      },
      {
        title: "Angles and transformations",
        strandLabel: "Geometry",
        describe: (profile) => `Explore location, movement, angles, and transformations through ${profile.geometry}.`,
      },
      {
        title: "Location and mapping",
        strandLabel: "Geometry",
        describe: (profile) => `Use position, coordinates, direction, or mapping language within ${profile.geometry}.`,
      },
      {
        title: "Growing patterns",
        strandLabel: "Patterns",
        describe: (profile) => `Extend, describe, and test rules in ${profile.patterns}.`,
      },
      {
        title: "Term 3 review",
        strandLabel: "Review",
        describe: (profile) => `Connect operations, fractions, geometry, money contexts, and ${profile.patterns}.`,
      },
    ],
  },
  {
    term: 4,
    weeks: [
      {
        title: "Fractions and decimals",
        strandLabel: "Fractions",
        describe: (profile) => `Connect equivalent forms and practical models for ${profile.fractions}.`,
      },
      {
        title: "Measurement project",
        strandLabel: "Measurement",
        describe: (profile) => `Plan, measure, record, and explain a practical task using ${profile.measurement}.`,
      },
      {
        title: "Chance and data decisions",
        strandLabel: "Data",
        describe: (profile) => `Use data and chance language to compare outcomes and justify decisions.`,
      },
      {
        title: "Multi-step operations",
        strandLabel: "Operations",
        describe: (profile) => `Choose efficient strategies for multi-step problems involving ${profile.operations}.`,
      },
      {
        title: "Mixed number reasoning",
        strandLabel: "Number",
        describe: (profile) => `Use place value, estimation, and comparison across ${profile.comparing}.`,
      },
      {
        title: "Geometry investigation",
        strandLabel: "Geometry",
        describe: (profile) => `Investigate, draw, build, or classify ideas from ${profile.geometry}.`,
      },
      {
        title: "Pattern investigation",
        strandLabel: "Patterns",
        describe: (profile) => `Create a pattern investigation and explain the rule behind ${profile.patterns}.`,
      },
      {
        title: "Applied maths project",
        strandLabel: "Review",
        describe: (profile) => `Apply number, operations, measurement, data, geometry, and fractions in one project.`,
      },
      {
        title: "Year consolidation",
        strandLabel: "Review",
        describe: (profile) => `Review ${profile.review}.`,
      },
      {
        title: "Next-year bridge",
        strandLabel: "Review",
        describe: () => "Identify secure skills, support needs, and the next learning move.",
      },
    ],
  },
];

function buildBalancedMathsYearPath(input: {
  yearKey: MathsYearPathKey;
}): SuggestedProgramPathTerm[] {
  const profile = MATHS_YEAR_PROFILES[input.yearKey] ?? MATHS_YEAR_PROFILES[3];

  return MATHS_YEAR_PATH_TERMS.map((term) => ({
    id: `maths-${input.yearKey}-term-${term.term}`,
    term: term.term,
    label: `Term ${term.term}`,
    tiles: term.weeks.map((week, weekIndex) =>
      makePathTile({
        programId: "maths",
        yearKey: input.yearKey,
        term: term.term,
        week: (term.term - 1) * 10 + weekIndex + 1,
        title: week.title,
        description: week.describe(profile),
        strandLabel: week.strandLabel,
      }),
    ),
  }));
}

const STANDARD_PROGRAM_TERM_THEMES: Record<Exclude<StandardProgramId, "maths">, Array<{
  strandLabel: string;
  focus: string;
  weeks: string[];
}>> = {
  english: [
    {
      strandLabel: "Reading",
      focus: "Build steady reading, comprehension, vocabulary, and discussion routines.",
      weeks: [
        "Reading routines",
        "Choosing texts",
        "Vocabulary in context",
        "Main ideas",
        "Character and setting",
        "Sequencing events",
        "Making predictions",
        "Asking questions",
        "Reading response",
        "Term 1 reading review",
      ],
    },
    {
      strandLabel: "Writing",
      focus: "Move from sentence control into planned paragraphs and short compositions.",
      weeks: [
        "Sentence craft",
        "Planning ideas",
        "Narrative structure",
        "Description",
        "Informative writing",
        "Paragraph building",
        "Editing routines",
        "Publishing choices",
        "Sharing writing",
        "Term 2 writing review",
      ],
    },
    {
      strandLabel: "Text study",
      focus: "Compare text types and connect reading evidence to written responses.",
      weeks: [
        "Text features",
        "Author choices",
        "Compare texts",
        "Evidence in answers",
        "Opinion writing",
        "Research notes",
        "Summarising",
        "Presentation planning",
        "Oral sharing",
        "Term 3 text review",
      ],
    },
    {
      strandLabel: "Communication",
      focus: "Consolidate reading, writing, editing, speaking, and reflection.",
      weeks: [
        "Independent reading",
        "Writing project",
        "Draft and revise",
        "Conventions check",
        "Audience and purpose",
        "Presentation practice",
        "Portfolio piece",
        "Reading reflection",
        "Year review",
        "Next-year bridge",
      ],
    },
  ],
  science: [
    {
      strandLabel: "Inquiry",
      focus: "Start with questions, observing closely, and recording what changes.",
      weeks: [
        "Science questions",
        "Observation skills",
        "Sorting and grouping",
        "Simple tests",
        "Recording results",
        "Patterns in data",
        "Drawing conclusions",
        "Explaining evidence",
        "Inquiry report",
        "Term 1 inquiry review",
      ],
    },
    {
      strandLabel: "Living things",
      focus: "Explore living things, needs, habitats, change, and relationships.",
      weeks: [
        "Living and non-living",
        "Needs for life",
        "Habitats",
        "Life cycles",
        "Adaptations",
        "Food chains",
        "Human impacts",
        "Field observation",
        "Living things project",
        "Term 2 life review",
      ],
    },
    {
      strandLabel: "Materials and forces",
      focus: "Investigate materials, movement, pushes, pulls, and design choices.",
      weeks: [
        "Material properties",
        "Changing materials",
        "Pushes and pulls",
        "Movement",
        "Friction",
        "Simple machines",
        "Design challenge",
        "Test and improve",
        "Explain a design",
        "Term 3 physical review",
      ],
    },
    {
      strandLabel: "Earth and space",
      focus: "Connect Earth, sky, weather, resources, and end-of-year inquiry.",
      weeks: [
        "Earth materials",
        "Weather patterns",
        "Day and night",
        "Seasons",
        "Water cycle",
        "Natural resources",
        "Sustainability",
        "Science investigation",
        "Year review",
        "Next-year bridge",
      ],
    },
  ],
  hass: [
    {
      strandLabel: "People and place",
      focus: "Begin with family, local places, maps, and community routines.",
      weeks: [
        "Family stories",
        "Local places",
        "Map skills",
        "Directions and symbols",
        "Community helpers",
        "Needs and wants",
        "Rules and fairness",
        "Local inquiry",
        "Community presentation",
        "Term 1 review",
      ],
    },
    {
      strandLabel: "History",
      focus: "Explore change, continuity, sources, and personal or local history.",
      weeks: [
        "Past and present",
        "Timelines",
        "Using sources",
        "Family history",
        "Local history",
        "Significant people",
        "Change over time",
        "History questions",
        "History project",
        "Term 2 review",
      ],
    },
    {
      strandLabel: "Geography",
      focus: "Study environments, places, resources, weather, and human choices.",
      weeks: [
        "Natural features",
        "Built features",
        "Weather and climate",
        "Resources",
        "Caring for places",
        "Comparing places",
        "Using data",
        "Map project",
        "Geography presentation",
        "Term 3 review",
      ],
    },
    {
      strandLabel: "Civics and inquiry",
      focus: "Connect decision making, community participation, evidence, and review.",
      weeks: [
        "Community decisions",
        "Rights and responsibilities",
        "Groups and roles",
        "Simple economics",
        "Inquiry planning",
        "Collecting evidence",
        "Explaining findings",
        "Action project",
        "Year review",
        "Next-year bridge",
      ],
    },
  ],
};

function buildGenericStandardYearPath(input: {
  programId: Exclude<StandardProgramId, "maths">;
  yearKey: MathsYearPathKey;
}): SuggestedProgramPathTerm[] {
  return STANDARD_PROGRAM_TERM_THEMES[input.programId].map((term, termIndex) => ({
    id: `${input.programId}-${input.yearKey}-term-${termIndex + 1}`,
    term: termIndex + 1,
    label: `Term ${termIndex + 1}`,
    tiles: term.weeks.map((title, weekIndex) =>
      makePathTile({
        programId: input.programId,
        yearKey: input.yearKey,
        term: termIndex + 1,
        week: termIndex * 10 + weekIndex + 1,
        title,
        description: term.focus,
        strandLabel: term.strandLabel,
      }),
    ),
  }));
}

function buildStandardProgramPathTerms(input: {
  yearLevel: string;
  programId: StandardProgramId;
}) {
  const yearKey = yearPathKeyFromLabel(input.yearLevel);
  if (!yearKey) return [];
  if (input.programId === "maths") {
    return buildBalancedMathsYearPath({ yearKey });
  }
  return buildGenericStandardYearPath({ programId: input.programId, yearKey });
}

function buildDraftProgram(input: {
  familyId: string;
  learnerId?: string | null;
  frameworkId: string;
  jurisdictionId?: string | null;
  periodLabel: string;
  programTitle: string;
  subjectTitle: string;
  pathTiles: SuggestedProgramPathTile[];
}): Program {
  const subjectTitle = clean(input.subjectTitle) || "General";
  const base = defaultProgram({
    familyId: input.familyId,
    learnerId: input.learnerId || null,
    frameworkId: input.frameworkId,
    jurisdictionId: input.jurisdictionId || null,
    subjectId: subjectTitle,
    periodLabel: input.periodLabel,
  });
  const createdAt = Date.now();

  return {
    ...base,
    title: clean(input.programTitle) || "New program",
    subjectId: subjectTitle,
    durationCount: Math.max(input.pathTiles.length, 1),
    segmentType: "sequence",
    curriculumOutcomeIds: [],
    segments: input.pathTiles.map((tile, index) => ({
      id: `segment-${createdAt}-${index + 1}`,
      programId: base.id,
      order: index + 1,
      title: tile.title,
      notes: `Term ${tile.term}, week ${tile.week}: ${tile.description}`,
      curriculumOutcomeIds: [],
      evidencePrompts: [],
      assessmentIntents: [],
      suggestedPlanBlocks: [],
    })),
  };
}

function ymd(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function friendlyProgramsMessage(kind: "load" | "save" | "generate") {
  if (kind === "load") {
    return "My Programs could not load. You can keep shaping a draft here.";
  }
  if (kind === "save") {
    return "Your program could not be saved just yet. Keep editing, then save again.";
  }
  return "Generation is not ready yet. Check learner, slot, segment, and start date.";
}

const DETAIL_CHIP =
  "inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.12em]";

function detailStatus(input: {
  hasLearner: boolean;
  hasSegments: boolean;
  hasCalendarTemplate: boolean;
  hasSlot: boolean;
  hasStartDate: boolean;
  generationReady: boolean;
}) {
  if (!input.hasLearner) {
    return { label: "Choose learner", tone: "border-slate-200 bg-slate-50 text-slate-600" };
  }
  if (!input.hasSegments) {
    return { label: "Needs segment", tone: "border-amber-200 bg-amber-50 text-amber-700" };
  }
  if (!input.hasCalendarTemplate || !input.hasSlot) {
    return { label: "Needs slot", tone: "border-blue-200 bg-blue-50 text-blue-700" };
  }
  if (!input.hasStartDate) {
    return { label: "Needs date", tone: "border-violet-200 bg-violet-50 text-violet-700" };
  }
  if (input.generationReady) {
    return { label: "Ready", tone: "border-emerald-200 bg-emerald-50 text-emerald-700" };
  }
  return { label: "Draft workspace", tone: "border-slate-200 bg-slate-50 text-slate-600" };
}

function generationGuidance(input: {
  hasLearner: boolean;
  hasSegments: boolean;
  hasCalendarTemplate: boolean;
  hasSlot: boolean;
  hasStartDate: boolean;
}) {
  if (!input.hasLearner) return "Choose a learner";
  if (!input.hasSegments) return "Add at least one segment";
  if (!input.hasCalendarTemplate || !input.hasSlot) return "Choose a calendar slot";
  if (!input.hasStartDate) return "Choose a start date";
  return "Ready. Generate this program into My Calendar.";
}

export default function FamilyProgramsWorkspace() {
  const router = useRouter();
  const { workspace, activeLearner, loading: workspaceLoading, setActiveLearner } = useFamilyWorkspace();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [templates, setTemplates] = useState<CalendarTemplate[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [editingCurriculumSegmentId, setEditingCurriculumSegmentId] = useState<string | null>(null);
  const [assignmentTemplateId, setAssignmentTemplateId] = useState("");
  const [assignmentSlotId, setAssignmentSlotId] = useState("");
  const [assignmentStartDate, setAssignmentStartDate] = useState(ymd(new Date()));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [lastGeneratedCount, setLastGeneratedCount] = useState(0);
  const [showGenerationSuccess, setShowGenerationSuccess] = useState(false);
  const [showNewProgramGuide, setShowNewProgramGuide] = useState(false);
  const [selectedProgramPathTileIds, setSelectedProgramPathTileIds] = useState<string[]>([]);
  const [programSetupDraft, setProgramSetupDraft] =
    useState<ProgramSetupDraft>(EMPTY_PROGRAM_SETUP_DRAFT);

  const learnerOptions: LearnerOption[] = workspace.learners.map((learner) => ({
    id: learner.id,
    label: learner.label,
    note: learner.yearLabel || "Learner",
  }));

  const learningConfig = resolveEffectiveLearnerLearningConfig(workspace.profile, activeLearner);
  const preset = frameworkPreset(
    learningConfig.country === "us" || learningConfig.country === "uk"
      ? learningConfig.country
      : "au",
  );
  const programSetupYearLevelOptions = useMemo(
    () => buildYearLevelOptions(learningConfig.yearBand),
    [learningConfig.yearBand],
  );
  const selectedStandardProgram =
    STANDARD_PROGRAMS.find((program) => program.id === programSetupDraft.programId) ??
    STANDARD_PROGRAMS[0]!;
  const selectedProgramYearLabel = yearLevelOptionLabel(programSetupDraft.yearLevel) || "Year X";
  const standardProgramOptions: StandardProgramOption[] = useMemo(
    () =>
      STANDARD_PROGRAMS.map((program) => ({
        id: program.id,
        title: program.title,
        yearLabel: selectedProgramYearLabel,
        description: program.description,
      })),
    [selectedProgramYearLabel],
  );
  const programPathTerms = useMemo(
    () =>
      buildStandardProgramPathTerms({
        yearLevel: programSetupDraft.yearLevel,
        programId: programSetupDraft.programId,
      }),
    [programSetupDraft.programId, programSetupDraft.yearLevel],
  );
  const programPathTiles = useMemo(
    () => programPathTerms.flatMap((term) => term.tiles),
    [programPathTerms],
  );
  const selectedProgramPathTiles = useMemo(
    () =>
      programPathTiles.filter((tile) =>
        selectedProgramPathTileIds.includes(tile.id),
      ),
    [programPathTiles, selectedProgramPathTileIds],
  );
  const canCreateProgramDraft = Boolean(
    programSetupDraft.yearLevel &&
      selectedStandardProgram &&
      selectedProgramPathTiles.length,
  );
  const programSetupPrefillLabel = setupYearLevel(learningConfig.yearBand)
    ? "Prefilled from learner"
    : "";

  useEffect(() => {
    if (showNewProgramGuide) return;
    setSelectedProgramPathTileIds([]);
    setProgramSetupDraft(prefilledProgramSetupDraft(learningConfig.yearBand));
  }, [learningConfig.yearBand, showNewProgramGuide]);

  useEffect(() => {
    const validIds = new Set(programPathTiles.map((tile) => tile.id));
    setSelectedProgramPathTileIds((current) =>
      current.filter((tileId) => validIds.has(tileId)),
    );
  }, [programPathTiles]);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      if (!workspace.profile.id) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [nextPrograms, nextTemplates] = await Promise.all([
          loadFamilyPrograms({ familyId: workspace.profile.id }),
          loadFamilyCalendarTemplates({ familyId: workspace.profile.id }),
        ]);
        if (!mounted) return;

        const filteredPrograms = nextPrograms.filter(
          (program) => !program.learnerId || program.learnerId === activeLearner?.id,
        );

        setPrograms(filteredPrograms);
        setTemplates(nextTemplates);
        setSelectedProgramId(filteredPrograms[0]?.id || "");
        setAssignmentTemplateId(nextTemplates[0]?.id || "");
      } catch {
        if (!mounted) return;
        setError(friendlyProgramsMessage("load"));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void hydrate();
    return () => {
      mounted = false;
    };
  }, [
    activeLearner?.id,
    learningConfig.academicStructureType,
    learningConfig.frameworkId,
    learningConfig.jurisdictionId,
    workspace.profile.id,
  ]);

  const selectedProgram = useMemo(
    () => programs.find((program) => program.id === selectedProgramId) ?? null,
    [programs, selectedProgramId],
  );
  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === assignmentTemplateId) ?? null,
    [assignmentTemplateId, templates],
  );
  const selectedSlot = selectedTemplate?.slots.find((slot) => slot.id === assignmentSlotId) ?? null;
  const hasCalendarTemplate = templates.some((template) => template.slots.length > 0);
  const hasLearnerSelected = Boolean(activeLearner?.id);
  const hasProgramSegments = Boolean(selectedProgram?.segments.length);
  const hasCalendarSlot = Boolean(selectedSlot);
  const hasStartDate = Boolean(assignmentStartDate);
  const generationReady = Boolean(
    selectedProgram &&
      assignmentTemplateId &&
      assignmentSlotId &&
      assignmentStartDate &&
      hasCalendarTemplate &&
      hasLearnerSelected &&
      hasProgramSegments,
  );

  const selectedSegment =
    selectedProgram?.segments.find((segment) => segment.id === selectedSegmentId) ?? null;
  const selectedStatus = detailStatus({
    hasLearner: hasLearnerSelected,
    hasSegments: hasProgramSegments,
    hasCalendarTemplate,
    hasSlot: hasCalendarSlot,
    hasStartDate,
    generationReady,
  });
  const currentGuidance = generationGuidance({
    hasLearner: hasLearnerSelected,
    hasSegments: hasProgramSegments,
    hasCalendarTemplate,
    hasSlot: hasCalendarSlot,
    hasStartDate,
  });
  const saveStateLabel = saving
    ? "Saving"
    : workspace.storageMode === "local"
      ? "Saved locally"
      : status
        ? "Saved"
        : "Draft workspace";

  useEffect(() => {
    if (!selectedProgram) {
      setSelectedSegmentId(null);
      return;
    }
    if (!selectedSegmentId || !selectedProgram.segments.some((segment) => segment.id === selectedSegmentId)) {
      setSelectedSegmentId(selectedProgram.segments[0]?.id || null);
    }
    if (selectedProgram.scheduleMapping?.calendarTemplateSlotId) {
      setAssignmentSlotId(selectedProgram.scheduleMapping.calendarTemplateSlotId);
    }
    if (selectedProgram.scheduleMapping?.startDate) {
      setAssignmentStartDate(selectedProgram.scheduleMapping.startDate);
    }
  }, [selectedProgram, selectedSegmentId]);

  useEffect(() => {
    const template = templates.find((item) => item.id === assignmentTemplateId) ?? null;
    if (!template) return;
    if (!assignmentSlotId || !template.slots.some((slot) => slot.id === assignmentSlotId)) {
      setAssignmentSlotId(template.slots[0]?.id || "");
    }
  }, [assignmentSlotId, assignmentTemplateId, templates]);

  function openNewProgramGuide() {
    setSelectedProgramId("");
    setSelectedSegmentId(null);
    setEditingCurriculumSegmentId(null);
    setShowNewProgramGuide(true);
    setStatus("");
    setError("");
    setSelectedProgramPathTileIds([]);
    setProgramSetupDraft(prefilledProgramSetupDraft(learningConfig.yearBand));
  }

  function handleSelectProgram(programId: string) {
    setSelectedProgramId(programId);
    setShowNewProgramGuide(false);
    setError("");
  }

  function handleYearLevelChange(value: string) {
    setSelectedProgramPathTileIds([]);
    setProgramSetupDraft((current) => ({
      ...current,
      yearLevel: value,
    }));
  }

  function handleSelectStandardProgram(programId: string) {
    const nextProgramId = STANDARD_PROGRAMS.some((program) => program.id === programId)
      ? (programId as StandardProgramId)
      : "maths";
    setSelectedProgramPathTileIds([]);
    setProgramSetupDraft((current) => ({
      ...current,
      programId: nextProgramId,
    }));
  }

  function toggleProgramPathTile(tileId: string) {
    const selected = selectedProgramPathTileIds.includes(tileId);
    const nextTileIds = selected
      ? selectedProgramPathTileIds.filter((currentTileId) => currentTileId !== tileId)
      : [...selectedProgramPathTileIds, tileId];
    setSelectedProgramPathTileIds(nextTileIds);
  }

  function toggleProgramPathTerm(termId: string) {
    const term = programPathTerms.find((item) => item.id === termId);
    if (!term) return;
    const termTileIds = term.tiles.map((tile) => tile.id);
    const allTermSelected = termTileIds.every((tileId) => selectedProgramPathTileIds.includes(tileId));
    const nextTileIds = allTermSelected
      ? selectedProgramPathTileIds.filter((tileId) => !termTileIds.includes(tileId))
      : Array.from(new Set([...selectedProgramPathTileIds, ...termTileIds]));
    setSelectedProgramPathTileIds(nextTileIds);
  }

  function toggleProgramPathYear() {
    const allTileIds = programPathTiles.map((tile) => tile.id);
    const allYearSelected = allTileIds.length > 0 && allTileIds.every((tileId) => selectedProgramPathTileIds.includes(tileId));
    const nextTileIds = allYearSelected ? [] : allTileIds;
    setSelectedProgramPathTileIds(nextTileIds);
  }

  function handleCreateProgram() {
    if (!canCreateProgramDraft) {
      return;
    }

    const next = buildDraftProgram({
      familyId: workspace.profile.id,
      learnerId: activeLearner?.id || null,
      frameworkId: learningConfig.frameworkId,
      jurisdictionId: learningConfig.jurisdictionId,
      periodLabel: learningConfig.academicStructureType === "semesters" ? "Semester 1" : "Term 1",
      programTitle: `${selectedStandardProgram.title} - ${selectedProgramYearLabel}`,
      subjectTitle: selectedStandardProgram.subjectTitle,
      pathTiles: selectedProgramPathTiles,
    });
    setPrograms((current) => [next, ...current]);
    setSelectedProgramId(next.id);
    setSelectedSegmentId(null);
    setShowNewProgramGuide(false);
    setStatus("Next step: Place into My Calendar");
    setError("");
  }

  function updateProgram(nextProgram: Program) {
    setPrograms((current) =>
      current.map((program) => (program.id === nextProgram.id ? nextProgram : program)),
    );
  }

  function updateSegment(nextSegment: ProgramSegment) {
    if (!selectedProgram) return;
    updateProgram({
      ...selectedProgram,
      segments: selectedProgram.segments.map((segment) =>
        segment.id === nextSegment.id ? nextSegment : segment,
      ),
    });
  }

  function addSegment() {
    if (!selectedProgram) return;
    const nextSegment: ProgramSegment = {
      id: `segment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      programId: selectedProgram.id,
      order: selectedProgram.segments.length + 1,
      title: `Segment ${selectedProgram.segments.length + 1}`,
      notes: "",
      curriculumOutcomeIds: [],
      evidencePrompts: [],
      assessmentIntents: [],
      suggestedPlanBlocks: [],
    };
    updateProgram({
      ...selectedProgram,
      segments: [...selectedProgram.segments, nextSegment],
      durationCount: selectedProgram.segments.length + 1,
    });
    setSelectedSegmentId(nextSegment.id);
  }

  async function handleSaveProgram() {
    if (!selectedProgram) return;
    setSaving(true);
    setStatus("");
    setError("");
    try {
      const nextProgram: Program = {
        ...selectedProgram,
        learnerId: activeLearner?.id || selectedProgram.learnerId || null,
        frameworkId: learningConfig.frameworkId,
        jurisdictionId: learningConfig.jurisdictionId,
        scheduleMapping:
          assignmentTemplateId && assignmentSlotId && assignmentStartDate
            ? {
                id: selectedProgram.scheduleMapping?.id || `mapping-${Date.now()}`,
                programId: selectedProgram.id,
                calendarTemplateSlotId: assignmentSlotId,
                placementMode: "sequential",
                startDate: assignmentStartDate,
              }
            : null,
      };
      const saved = await saveFamilyProgram(nextProgram);
      updateProgram(saved);
      setStatus("Program saved.");
    } catch {
      setError(friendlyProgramsMessage("save"));
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerate() {
    if (!selectedProgram || !activeLearner?.id || !workspace.userId) return;
    const template = templates.find((item) => item.id === assignmentTemplateId) ?? null;
    if (!template || !assignmentSlotId || !assignmentStartDate) return;

    setGenerating(true);
    setStatus("");
    setError("");

    try {
      const nextProgram: Program = {
        ...selectedProgram,
        learnerId: activeLearner.id,
        frameworkId: learningConfig.frameworkId,
        jurisdictionId: learningConfig.jurisdictionId,
        scheduleMapping: {
          id: selectedProgram.scheduleMapping?.id || `mapping-${Date.now()}`,
          programId: selectedProgram.id,
          calendarTemplateSlotId: assignmentSlotId,
          placementMode: "sequential",
          startDate: assignmentStartDate,
        },
      };
      const saved = await saveFamilyProgram(nextProgram);
      updateProgram(saved);
      const generated = await generateProgramIntoCalendar({
        familyProfileId: workspace.profile.id,
        learnerId: activeLearner.id,
        createdByUserId: workspace.userId,
        program: saved,
        template,
        slotId: assignmentSlotId,
        startDate: assignmentStartDate,
      });
      setLastGeneratedCount(generated.length);
      setShowGenerationSuccess(true);
      setStatus(`${generated.length} block${generated.length === 1 ? "" : "s"} generated into My Calendar.`);
    } catch {
      setError(friendlyProgramsMessage("generate"));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <FamilyTopNavShell
      subtitle="My Programs"
      heroTitle="My Programs"
      heroText="Build longer learning sequences, then place them into the live week."
      heroAsideTitle="Program planner"
      heroAsideText="Select a program, shape its segments, then place it into My Calendar."
    >
      <div className="grid gap-5 pb-14">
        {showGenerationSuccess ? (
          <ProgramGenerationSuccessBanner
            count={lastGeneratedCount}
            onOpenPlan={() => router.push(`/my-calendar?date=${encodeURIComponent(assignmentStartDate)}`)}
            onStayHere={() => setShowGenerationSuccess(false)}
          />
        ) : null}

        <LearnerSelector
          familyName={workspace.profile.family_display_name || "Your family"}
          learners={learnerOptions}
          activeLearnerId={activeLearner?.id}
          onSelectLearner={setActiveLearner}
          state={workspaceLoading ? "loading" : activeLearner ? "live" : "empty"}
        />

        {!workspaceLoading && !activeLearner ? (
          <ProgramsGuidedSetupBanner
            title="Choose a learner"
            note="Generation unlocks after a learner is selected."
          />
        ) : null}

        {loading ? (
          <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
            <div className={BODY}>Loading programs...</div>
          </section>
        ) : (
          <div id="programs-workspace" className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
            <div className="xl:sticky xl:top-4 xl:self-start">
              <ProgramList
                programs={programs}
                selectedProgramId={selectedProgram?.id}
                onSelect={handleSelectProgram}
                onCreate={openNewProgramGuide}
              />
            </div>

            {!selectedProgram ? (
              showNewProgramGuide ? (
                <ProgramGuidedSetupPanel
                  yearLevelOptions={programSetupYearLevelOptions}
                  selectedYearLevel={programSetupDraft.yearLevel}
                  programOptions={standardProgramOptions}
                  selectedProgramId={programSetupDraft.programId}
                  programPathTerms={programPathTerms}
                  selectedProgramPathTileIds={selectedProgramPathTileIds}
                  onYearLevelChange={handleYearLevelChange}
                  onSelectProgram={handleSelectStandardProgram}
                  onToggleProgramPathTile={toggleProgramPathTile}
                  onToggleProgramPathTerm={toggleProgramPathTerm}
                  onToggleProgramPathYear={toggleProgramPathYear}
                  onCreateDraft={handleCreateProgram}
                  onCancel={() => {
                    setShowNewProgramGuide(false);
                    setError("");
                  }}
                  canCreateDraft={canCreateProgramDraft}
                  prefillLabel={programSetupPrefillLabel}
                />
              ) : (
                <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
                  <div className={LABEL}>Selected program</div>
                  <h2 className="mt-2 text-[24px] font-black leading-tight text-slate-950">
                    No program selected
                  </h2>
                  <p className={`mt-2 ${BODY}`}>Create or select a program.</p>
                </section>
              )
            ) : (
              <section className="grid gap-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="grid gap-1.5">
                  <div className={LABEL}>Selected program</div>
                  <h2 className="text-[24px] font-black leading-tight text-slate-950">
                    {selectedProgram?.title || "No program selected"}
                  </h2>
                  <div className={META}>
                    {[selectedProgram?.subjectId, selectedProgram?.periodLabel].filter(Boolean).join(" - ") ||
                      "Create or select a program."}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`${DETAIL_CHIP} ${selectedStatus.tone}`}>{selectedStatus.label}</span>
                  <span className={`${DETAIL_CHIP} border-slate-200 bg-slate-50 text-slate-600`}>
                    {selectedProgram?.segments.length || 0} segment{selectedProgram?.segments.length === 1 ? "" : "s"}
                  </span>
                  <span className={`${DETAIL_CHIP} border-slate-200 bg-slate-50 text-slate-600`}>
                    {selectedSlot?.label || "No slot"}
                  </span>
                </div>
              </div>

              <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)]">
                <div className="grid gap-5">
                  <ProgramEditor program={selectedProgram} onChange={updateProgram} />

                  <section className="grid gap-4 rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="grid gap-1.5">
                        <div className={LABEL}>Segments</div>
                        <h2 className={H2}>Sequence rows</h2>
                      </div>
                      <button
                        type="button"
                        onClick={addSegment}
                        disabled={!selectedProgram}
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Add segment
                      </button>
                    </div>

                    <div className="grid gap-3">
                      {(selectedProgram?.segments || []).map((segment) => (
                        <ProgramSegmentCard
                          key={segment.id}
                          segment={segment}
                          hasSlot={hasCalendarSlot}
                          onChange={updateSegment}
                          onAttachCurriculum={setEditingCurriculumSegmentId}
                        />
                      ))}
                      {selectedProgram && !selectedProgram.segments.length ? (
                        <div className="rounded-[18px] border border-dashed border-slate-200 bg-white px-4 py-5">
                          <div className={H2}>No segments yet</div>
                          <div className={`mt-1 ${META}`}>Add at least one segment</div>
                        </div>
                      ) : null}
                    </div>
                  </section>
                </div>

                <div className="grid gap-5">
                  {selectedSegment ? (
                    <section className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
                      <div className="grid gap-1.5">
                        <div className={LABEL}>Outcome mapping</div>
                        <h2 className={H2}>Link standards later</h2>
                      </div>
                      <CurriculumTagPills
                        preset={preset}
                        outcomeIds={selectedSegment.curriculumOutcomeIds}
                        emptyLabel="No linked standards yet"
                      />
                      {editingCurriculumSegmentId === selectedSegment.id ? (
                        <CurriculumAttachPanel
                          preset={preset}
                          selectedOutcomeIds={selectedSegment.curriculumOutcomeIds}
                          onApply={(outcomeIds) => {
                            updateSegment({ ...selectedSegment, curriculumOutcomeIds: outcomeIds });
                            setEditingCurriculumSegmentId(null);
                          }}
                          onCancel={() => setEditingCurriculumSegmentId(null)}
                          state="derived"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingCurriculumSegmentId(selectedSegment.id)}
                          className="inline-flex w-fit items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          {selectedSegment.curriculumOutcomeIds.length ? "Edit standards" : "Link standards"}
                        </button>
                      )}
                    </section>
                  ) : (
                    <section className="rounded-[24px] border border-dashed border-slate-200 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.03)]">
                      <div className={LABEL}>Outcome mapping</div>
                      <h2 className={`mt-2 ${H2}`}>Select a segment</h2>
                    </section>
                  )}

                  <ProgramCalendarAssignmentPanel
                    templates={templates}
                    selectedTemplateId={assignmentTemplateId}
                    selectedSlotId={assignmentSlotId}
                    startDate={assignmentStartDate}
                    onTemplateChange={setAssignmentTemplateId}
                    onSlotChange={setAssignmentSlotId}
                    onStartDateChange={setAssignmentStartDate}
                    onGenerate={() => void handleGenerate()}
                    generating={generating}
                    generationReady={generationReady}
                    hasLearner={hasLearnerSelected}
                    hasSegments={hasProgramSegments}
                  />

                  <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className={LABEL}>Save state</div>
                        <div className={`mt-2 ${H2}`}>Place when ready</div>
                      </div>
                      <span className={`${DETAIL_CHIP} border-slate-200 bg-slate-50 text-slate-600`}>
                        {saveStateLabel}
                      </span>
                    </div>
                    <div className={`mt-3 ${error ? "text-[14px] text-rose-600" : META}`}>
                      {error || status || currentGuidance}
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={() => void handleSaveProgram()}
                        disabled={saving || !selectedProgram}
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving ? "Saving..." : "Save program"}
                      </button>
                    </div>
                  </section>
                </div>
              </div>
              </section>
            )}
          </div>
        )}
      </div>
    </FamilyTopNavShell>
  );
}
