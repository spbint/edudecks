import { describe, expect, it } from "vitest";
import {
  getPathwaySubjectAvailabilityOption,
  getPathwaySubjectAvailabilityOptions,
  hasRegisteredCustomerPathwaysContent,
  isCustomerPathwaySubjectActive,
  type PathwaySubjectContentConfig,
} from "@/lib/clean/pathways/pathwaySubjectAvailability";
import {
  PATHWAY_SUBJECTS,
  type PathwaySubjectDefinition,
} from "@/lib/clean/pathways/pathwaySubjects";
import { DETAILED_SUBJECT_CONFIGS } from "@/lib/clean/pathways/detailedSubjectConfigs";

const subjectByTitle = new Map(PATHWAY_SUBJECTS.map((subject) => [subject.title, subject]));

function subject(title: string) {
  const item = subjectByTitle.get(title);
  if (!item) throw new Error(`Missing pathway subject "${title}".`);
  return item;
}

describe("customer pathway subject availability", () => {
  it("keeps Mathematics and English selectable for live customer Pathways content", () => {
    expect(
      isCustomerPathwaySubjectActive(subject("Mathematics"), DETAILED_SUBJECT_CONFIGS.mathematics),
    ).toBe(true);
    expect(
      isCustomerPathwaySubjectActive(subject("English"), DETAILED_SUBJECT_CONFIGS.english),
    ).toBe(true);
  });

  it.each([
    "Science",
    "Humanities & Social Sciences",
    "Technologies",
    "The Arts",
    "Health & Physical Education",
  ])("keeps %s visible as in development and unavailable", (title) => {
    const option = getPathwaySubjectAvailabilityOption(
      subject(title),
      DETAILED_SUBJECT_CONFIGS[subject(title).key],
    );

    expect(option.selectable).toBe(false);
    expect(option.availability).toBe("in-development");
    expect(option.customerLabel).toBe(`${title} — In development`);
    expect(option.screenReaderLabel).toBe(`${title}, in development, unavailable`);
  });

  it("keeps future subject definitions intact while excluding them from active customer subjects", () => {
    const options = getPathwaySubjectAvailabilityOptions(PATHWAY_SUBJECTS, DETAILED_SUBJECT_CONFIGS);
    const activeTitles = options
      .filter((option) => option.selectable)
      .map((option) => option.subject.title);
    const futureDefinitions = options
      .filter((option) => !option.selectable)
      .map((option) => option.subject.title);

    expect(activeTitles).toEqual(["Mathematics", "English"]);
    expect(futureDefinitions).toEqual([
      "Science",
      "Humanities & Social Sciences",
      "Technologies",
      "The Arts",
      "Health & Physical Education",
    ]);
    expect(futureDefinitions.every((title) => subject(title).futureStrands.length > 0)).toBe(true);
  });

  it("can become active when real customer-ready Pathways content is registered", () => {
    const science = subject("Science");
    const customerReadyScience: PathwaySubjectDefinition = {
      ...science,
      customerPathwaysAvailability: "live",
    };
    const config: PathwaySubjectContentConfig = {
      domainCards: [{ key: "scientific-inquiry-and-investigation" }],
      workspaceBuilders: {
        "scientific-inquiry-and-investigation": () => ({}),
      },
    };

    expect(hasRegisteredCustomerPathwaysContent(config)).toBe(true);
    expect(isCustomerPathwaySubjectActive(customerReadyScience, config)).toBe(true);
  });
});
