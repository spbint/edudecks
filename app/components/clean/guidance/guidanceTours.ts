export type GuidanceTourId = "my-day" | "my-pathways" | "my-capture";

export type GuidanceTourStep = {
  guidanceId: string;
  title: string;
  body: string;
};

export type GuidanceTourDefinition = {
  id: GuidanceTourId;
  steps: GuidanceTourStep[];
};

export const GUIDANCE_TOURS: Record<GuidanceTourId, GuidanceTourDefinition> = {
  "my-day": {
    id: "my-day",
    steps: [
      {
        guidanceId: "my-day-header",
        title: "My Day",
        body: "This page helps you see what is planned for today and what may need attention.",
      },
      {
        guidanceId: "my-day-next-steps",
        title: "Continue where you left off",
        body: "These shortcuts help you move into planning, pathways or evidence capture.",
      },
      {
        guidanceId: "my-day-capture-evidence",
        title: "Capture learning",
        body: "When something meaningful happens, capture it so it can support portfolios and reports later.",
      },
    ],
  },
  "my-pathways": {
    id: "my-pathways",
    steps: [
      {
        guidanceId: "pathways-stage-filter",
        title: "Choose the learning stage",
        body: "Use the stage controls to focus on the part of the pathway that matters now.",
      },
      {
        guidanceId: "pathways-current-step",
        title: "Follow the next step",
        body: "Pathways show possible next learning steps. Use them gently as a guide, not as pressure.",
      },
      {
        guidanceId: "pathways-worksheet-button",
        title: "Open worksheets",
        body: "Some steps include printable worksheets connected to the learning goal.",
      },
      {
        guidanceId: "pathways-practise-assess",
        title: "Practise and assess",
        body: "Digital activities help families practise and check understanding where available.",
      },
    ],
  },
  "my-capture": {
    id: "my-capture",
    steps: [
      {
        guidanceId: "capture-add-evidence",
        title: "Add evidence",
        body: "Capture notes, photos or work samples when learning happens.",
      },
      {
        guidanceId: "capture-learning-area",
        title: "Connect the learning",
        body: "Link evidence to a learner and learning area so it becomes easier to find later.",
      },
      {
        guidanceId: "capture-save",
        title: "Save the moment",
        body: "Small captures can build into useful portfolios and reports over time.",
      },
    ],
  },
};
