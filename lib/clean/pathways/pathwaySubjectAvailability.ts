import type {
  PathwaySubjectDefinition,
  PathwaySubjectKey,
} from "@/lib/clean/pathways/pathwaySubjects";

export type PathwaySubjectContentConfig = {
  domainCards: ReadonlyArray<{ key: string }>;
  workspaceBuilders: Partial<Record<string, unknown>>;
};

export type PathwaySubjectAvailability = "active" | "in-development";

export type PathwaySubjectAvailabilityOption = {
  subject: PathwaySubjectDefinition;
  availability: PathwaySubjectAvailability;
  selectable: boolean;
  customerLabel: string;
  screenReaderLabel: string;
};

export function hasRegisteredCustomerPathwaysContent(
  config: PathwaySubjectContentConfig | null | undefined,
) {
  return Boolean(
    config?.domainCards.some(
      (domain) => typeof config.workspaceBuilders[domain.key] === "function",
    ),
  );
}

export function isCustomerPathwaySubjectActive(
  subject: PathwaySubjectDefinition,
  config: PathwaySubjectContentConfig | null | undefined,
) {
  return (
    subject.customerPathwaysAvailability === "live" &&
    hasRegisteredCustomerPathwaysContent(config)
  );
}

export function getPathwaySubjectAvailabilityOption(
  subject: PathwaySubjectDefinition,
  config: PathwaySubjectContentConfig | null | undefined,
): PathwaySubjectAvailabilityOption {
  const selectable = isCustomerPathwaySubjectActive(subject, config);
  const availability: PathwaySubjectAvailability = selectable ? "active" : "in-development";

  return {
    subject,
    availability,
    selectable,
    customerLabel: selectable ? subject.title : `${subject.title} — In development`,
    screenReaderLabel: selectable
      ? subject.title
      : `${subject.title}, in development, unavailable`,
  };
}

export function getPathwaySubjectAvailabilityOptions(
  subjects: readonly PathwaySubjectDefinition[],
  configs: Partial<Record<PathwaySubjectKey, PathwaySubjectContentConfig>>,
) {
  return subjects.map((subject) =>
    getPathwaySubjectAvailabilityOption(subject, configs[subject.key]),
  );
}
