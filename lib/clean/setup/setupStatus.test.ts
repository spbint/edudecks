import { describe, expect, it } from "vitest";
import {
  deriveCleanSetupStatus,
  derivePlanningSetupStatus,
  getCleanFamilyDisplayName,
  isValidCleanLiveWeekBlock,
  isValidCleanTemplateBlock,
  countValidCleanWeeklyBlocks,
  resolveCleanActiveLearner,
} from "@/lib/clean/setup/setupStatus";
import type { CleanAcademicYear, CleanLearningPeriod } from "@/lib/clean/terms/types";
import type { FamilyProfile } from "@/lib/clean/family/types";
import type { Learner } from "@/lib/clean/learners/types";

const academicYear: CleanAcademicYear = {
  id: "year-1",
  familyId: "family-1",
  title: "2026 Learning Year",
  countryCode: "AU",
  jurisdictionCode: "TAS",
  startsOn: "2026-01-01",
  endsOn: "2026-12-31",
  weekStart: "monday",
  notes: null,
  createdByUserId: "user-1",
  createdAt: null,
  updatedAt: null,
};

function period(overrides: Partial<CleanLearningPeriod>): CleanLearningPeriod {
  return {
    id: "period-1",
    familyId: "family-1",
    academicYearId: "year-1",
    title: "Term 1",
    periodType: "term",
    startsOn: "2026-02-01",
    endsOn: "2026-04-01",
    isBreak: false,
    notes: null,
    createdByUserId: "user-1",
    createdAt: null,
    updatedAt: null,
    ...overrides,
  };
}

describe("derivePlanningSetupStatus", () => {
  it("does not count breaks as learning periods", () => {
    const status = derivePlanningSetupStatus({
      academicYears: [academicYear],
      learningPeriods: [
        period({
          id: "break-1",
          title: "Term 1 Holidays",
          periodType: "break",
          startsOn: "2026-04-02",
          endsOn: "2026-04-14",
          isBreak: true,
        }),
      ],
      selectedAcademicYearId: "year-1",
      today: "2026-04-05",
    });

    expect(status.hasLearningYear).toBe(true);
    expect(status.hasLearningPeriod).toBe(false);
    expect(status.hasBreaks).toBe(true);
    expect(status.learningPeriodCount).toBe(0);
    expect(status.breakCount).toBe(1);
    expect(status.activeLearningPeriod).toBeNull();
    expect(status.currentBreakPeriod?.title).toBe("Term 1 Holidays");
  });

  it("selects the active period only from genuine teaching periods", () => {
    const status = derivePlanningSetupStatus({
      academicYears: [academicYear],
      learningPeriods: [
        period({ id: "term-1", title: "Term 1" }),
        period({
          id: "break-1",
          title: "Term 1 Holidays",
          periodType: "break",
          startsOn: "2026-04-02",
          endsOn: "2026-04-14",
          isBreak: true,
        }),
      ],
      selectedAcademicYearId: "year-1",
      today: "2026-03-01",
    });

    expect(status.hasLearningPeriod).toBe(true);
    expect(status.learningPeriodCount).toBe(1);
    expect(status.breakCount).toBe(1);
    expect(status.activeLearningPeriod?.title).toBe("Term 1");
    expect(status.currentBreakPeriod).toBeNull();
  });
});

const profile: FamilyProfile = {
  id: "family-1",
  createdByUserId: "user-1",
  displayName: "River family",
  countryCode: "AU",
  jurisdictionCode: "TAS",
  curriculumFrameworkId: "australian-curriculum",
  reportingMode: "family-summary",
  weekStart: "monday",
  privacyDefault: "family",
  exportStyle: "calm",
  defaultLearnerId: null,
  createdAt: null,
  updatedAt: null,
};

function learner(id: string, firstName: string): Learner {
  return {
    id,
    familyId: "family-1",
    firstName,
    preferredName: null,
    surname: null,
    yearLevel: null,
    notes: null,
    createdByUserId: "user-1",
    createdAt: null,
    updatedAt: null,
  };
}

const emptyCounts = {
  learningYears: 0,
  teachingPeriods: 0,
  breaks: 0,
  pathways: 0,
  evidence: 0,
  portfolioItems: 0,
  reports: 0,
};

describe("resolveCleanActiveLearner", () => {
  it("uses a valid route learner before remembered and default learners", () => {
    const learners = [learner("learner-1", "Ari"), learner("learner-2", "Bea")];

    expect(
      resolveCleanActiveLearner({
        learners,
        routeLearnerId: "learner-2",
        rememberedLearnerId: "learner-1",
      })?.id,
    ).toBe("learner-2");
  });

  it("does not silently choose the first learner when multiple learners exist", () => {
    const learners = [learner("learner-1", "Ari"), learner("learner-2", "Bea")];

    expect(
      resolveCleanActiveLearner({
        learners,
        rememberedLearnerId: "missing",
      }),
    ).toBeNull();
  });

  it("uses the only learner when exactly one learner exists", () => {
    const learners = [learner("learner-1", "Ari")];

    expect(resolveCleanActiveLearner({ learners })?.id).toBe("learner-1");
  });
});

describe("deriveCleanSetupStatus", () => {
  it("advances a new family through the real setup sequence", () => {
    const profileWithoutSettings = { ...profile, countryCode: "", jurisdictionCode: "" };
    const first = deriveCleanSetupStatus({
      profile: null,
      learners: [],
      activeLearner: null,
      counts: emptyCounts,
    });
    expect(first.nextAction).toMatchObject({
      type: "create-family-profile",
      href: "/my-profile",
    });

    const afterProfile = deriveCleanSetupStatus({
      profile: profileWithoutSettings,
      learners: [],
      activeLearner: null,
      counts: emptyCounts,
    });
    expect(afterProfile.nextAction).toMatchObject({
      type: "add-learner",
      href: "/my-profile",
    });

    const activeLearner = learner("learner-1", "Ari");
    const afterLearner = deriveCleanSetupStatus({
      profile: profileWithoutSettings,
      learners: [activeLearner],
      activeLearner,
      counts: emptyCounts,
    });
    expect(afterLearner.nextAction).toMatchObject({
      type: "save-learning-settings",
      href: "/my-settings",
    });

    const afterSettings = deriveCleanSetupStatus({
      profile,
      learners: [activeLearner],
      activeLearner,
      counts: { ...emptyCounts, learningYears: 1 },
    });
    expect(afterSettings.nextAction).toMatchObject({
      type: "add-teaching-period",
      href: "/my-calendar",
    });
  });

  it("backfills setup completion from real records", () => {
    const status = deriveCleanSetupStatus({
      profile,
      learners: [learner("learner-1", "Ari")],
      activeLearner: learner("learner-1", "Ari"),
      counts: {
        learningYears: 1,
        teachingPeriods: 1,
        breaks: 1,
        pathways: 1,
        evidence: 1,
        portfolioItems: 1,
        reports: 1,
      },
    });

    expect(status.hasFamilyProfile).toBe(true);
    expect(status.hasLearner).toBe(true);
    expect(status.hasLearningSettings).toBe(true);
    expect(status.hasLearningYear).toBe(true);
    expect(status.hasTeachingPeriod).toBe(true);
    expect(status.hasPathway).toBe(true);
    expect(status.hasEvidence).toBe(true);
    expect(status.hasPortfolioItem).toBe(true);
    expect(status.hasReport).toBe(true);
  });

  it("recommends continuing a pathway when a pathway exists and evidence does not", () => {
    const activeLearner = learner("learner-1", "Ari");
    const status = deriveCleanSetupStatus({
      profile,
      learners: [activeLearner],
      activeLearner,
      counts: {
        ...emptyCounts,
        learningYears: 1,
        teachingPeriods: 1,
        weeklyBlocks: 1,
        pathways: 1,
      },
    });

    expect(status.nextAction.type).toBe("continue-pathway");
    expect(status.nextAction.label).not.toContain("Choose");
  });

  it("does not treat breaks as teaching periods", () => {
    const activeLearner = learner("learner-1", "Ari");
    const status = deriveCleanSetupStatus({
      profile,
      learners: [activeLearner],
      activeLearner,
      counts: {
        ...emptyCounts,
        learningYears: 1,
        breaks: 1,
      },
    });

    expect(status.hasLearningYear).toBe(true);
    expect(status.hasTeachingPeriod).toBe(false);
    expect(status.nextAction.type).toBe("add-teaching-period");
  });

  it("keeps weekly planning as a real mandatory setup stage", () => {
    const activeLearner = learner("learner-1", "Ari");
    const status = deriveCleanSetupStatus({
      profile,
      learners: [activeLearner],
      activeLearner,
      counts: {
        ...emptyCounts,
        learningYears: 1,
        teachingPeriods: 1,
      },
    });

    expect(status.hasWeeklyBlock).toBe(false);
    expect(status.nextAction).toMatchObject({
      type: "add-weekly-block",
      label: "Add your first weekly learning block",
    });

    const complete = deriveCleanSetupStatus({
      profile,
      learners: [activeLearner],
      activeLearner,
      counts: {
        ...emptyCounts,
        learningYears: 1,
        teachingPeriods: 1,
        weeklyBlocks: 1,
      },
    });

    expect(complete.hasWeeklyBlock).toBe(true);
  });

  it("uses a neutral family display fallback", () => {
    expect(getCleanFamilyDisplayName(null)).toBe("Your family's learning week");
    expect(getCleanFamilyDisplayName({ ...profile, displayName: "" })).toBe(
      "Your family's learning week",
    );
  });
});

describe("weekly planning source validation", () => {
  it("counts only valid live-week blocks for the authorised family", () => {
    const valid = {
      id: "live-1",
      familyId: "family-1",
      title: "Maths practice",
      plannedDate: "2026-08-06",
    };
    expect(isValidCleanLiveWeekBlock(valid, "family-1")).toBe(true);
    expect(isValidCleanLiveWeekBlock({ ...valid, familyId: "family-2" }, "family-1")).toBe(false);
    expect(isValidCleanLiveWeekBlock({ ...valid, title: "" }, "family-1")).toBe(false);
    expect(isValidCleanLiveWeekBlock({ ...valid, plannedDate: "2026-02-31" }, "family-1")).toBe(false);
  });

  it("counts only valid active-template block records", () => {
    const valid = {
      id: "template-block-1",
      familyId: "family-1",
      masterTemplateId: "template-1",
      weekday: 1,
      title: "Maths practice",
    };
    expect(isValidCleanTemplateBlock(valid, "family-1")).toBe(true);
    expect(isValidCleanTemplateBlock({ ...valid, weekday: 8 }, "family-1")).toBe(false);
    expect(isValidCleanTemplateBlock({ ...valid, familyId: "family-2" }, "family-1")).toBe(false);
  });

  it("treats live-week and active-template planning as one completion signal", () => {
    const templateBlock = {
      id: "template-block-1",
      familyId: "family-1",
      masterTemplateId: "template-1",
      weekday: 1,
      title: "Maths practice",
    };
    const liveBlock = {
      id: "live-1",
      familyId: "family-1",
      title: "Reading",
      plannedDate: "2026-08-06",
    };
    expect(countValidCleanWeeklyBlocks({ familyId: "family-1", liveWeekBlocks: [], templateBlocks: [] })).toBe(0);
    expect(countValidCleanWeeklyBlocks({ familyId: "family-1", liveWeekBlocks: [], templateBlocks: [templateBlock] })).toBe(1);
    expect(countValidCleanWeeklyBlocks({ familyId: "family-1", liveWeekBlocks: [liveBlock], templateBlocks: [] })).toBe(1);
    expect(countValidCleanWeeklyBlocks({ familyId: "family-1", liveWeekBlocks: [liveBlock], templateBlocks: [templateBlock] })).toBe(2);
    expect(countValidCleanWeeklyBlocks({ familyId: "family-1", liveWeekBlocks: [{ ...liveBlock, familyId: "family-2" }], templateBlocks: [] })).toBe(0);
  });
});
