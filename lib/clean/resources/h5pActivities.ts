export type H5PActivityStatus = "prototype" | "coming-soon";

export type H5PActivity = {
  id: string;
  title: string;
  displayCategory: string;
  subject: string;
  strand: string;
  description: string;
  provider: "H5P";
  embedUrl: string;
  estimatedMinutes: number;
  premiumOnly: boolean;
  status: H5PActivityStatus;
};

export const H5P_ACTIVITIES = [
  {
    id: "arithmetic-quiz-h5p-6725",
    title: "Arithmetic Quiz",
    displayCategory: "Fluency Practice",
    subject: "Mathematics",
    strand: "Number",
    description: "A short interactive arithmetic quiz for building number fluency.",
    provider: "H5P",
    embedUrl: "https://h5p.org/h5p/embed/6725",
    estimatedMinutes: 5,
    premiumOnly: true,
    status: "prototype",
  },
] as const satisfies readonly H5PActivity[];

export function getH5PActivityById(activityId: string) {
  return H5P_ACTIVITIES.find((activity) => activity.id === activityId) ?? null;
}
