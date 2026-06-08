export type GuidanceTourId =
  | "my-profile"
  | "my-settings"
  | "my-calendar"
  | "my-day"
  | "my-pathways"
  | "my-capture"
  | "my-portfolio"
  | "my-reports"
  | "my-outputs";

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
  "my-profile": {
    id: "my-profile",
    steps: [
      {
        guidanceId: "profile-family-details",
        title: "Start with your family",
        body: "Add the basic family details first. This helps MyLearna organise planning, evidence, portfolios and reports.",
      },
      {
        guidanceId: "profile-add-learner",
        title: "Add a learner",
        body: "Add your child or learner so plans and evidence can be connected to the right person.",
      },
      {
        guidanceId: "profile-learner-details",
        title: "Add learner details",
        body: "Keep this simple. You can add age, year level, stage or other useful context where available.",
      },
      {
        guidanceId: "profile-save-profile",
        title: "Save your profile",
        body: "Save the profile before moving on. You can return later to adjust details.",
      },
      {
        guidanceId: "profile-next-settings",
        title: "Next step: Settings",
        body: "After your profile is ready, choose your country, curriculum and reporting context in My Settings.",
      },
    ],
  },
  "my-settings": {
    id: "my-settings",
    steps: [
      {
        guidanceId: "settings-country-region",
        title: "Choose your country or region",
        body: "Your country and region help MyLearna organise planning and reporting context in a way that makes sense for your family.",
      },
      {
        guidanceId: "settings-curriculum",
        title: "Choose curriculum or learning context",
        body: "Choose the curriculum or broad learning context you want MyLearna to use when organising records.",
      },
      {
        guidanceId: "settings-reporting-context",
        title: "Choose reporting context",
        body: "If reporting context is available, choose the option that best matches how you want records prepared.",
      },
      {
        guidanceId: "settings-week-start",
        title: "Choose planning preferences",
        body: "Set the week start and simple planning preferences so My Calendar and My Day feel natural.",
      },
      {
        guidanceId: "settings-guidance-toggle",
        title: "Control guidance",
        body: "Guidance can be turned on or off here whenever you feel confident.",
      },
      {
        guidanceId: "settings-save",
        title: "Save settings",
        body: "Save your settings before moving into weekly planning.",
      },
      {
        guidanceId: "settings-next-calendar",
        title: "Next step: plan the week",
        body: "After settings are ready, use My Calendar to create a simple weekly plan.",
      },
    ],
  },
  "my-calendar": {
    id: "my-calendar",
    steps: [
      {
        guidanceId: "calendar-week-view",
        title: "This is your weekly planning space",
        body: "Use My Calendar to set a simple weekly rhythm that can change as family life changes.",
      },
      {
        guidanceId: "calendar-add-plan",
        title: "Add a simple learning plan",
        body: "Start with one or two learning blocks. You do not need to plan the whole week perfectly.",
      },
      {
        guidanceId: "calendar-learning-block",
        title: "Keep the week flexible",
        body: "Learning blocks are small pieces of the week. Move or adjust them when real life changes.",
      },
      {
        guidanceId: "calendar-save-plan",
        title: "Save the plan",
        body: "Save the useful parts of your plan so My Day can help you focus on what is happening now.",
      },
      {
        guidanceId: "calendar-next-day",
        title: "Next step: check My Day",
        body: "Once a simple plan exists, open My Day to see today’s learning view.",
      },
    ],
  },
  "my-day": {
    id: "my-day",
    steps: [
      {
        guidanceId: "my-day-header",
        title: "My Day shows what matters today",
        body: "This is the calm daily view for today’s plan, useful next actions and evidence capture.",
      },
      {
        guidanceId: "my-day-today-plan",
        title: "Review today’s plan",
        body: "Use this area to see the blocks planned for today and what might need attention.",
      },
      {
        guidanceId: "my-day-next-steps",
        title: "Continue with the next helpful action",
        body: "These shortcuts help you move into planning, pathways or evidence capture without hunting around.",
      },
      {
        guidanceId: "my-day-capture-evidence",
        title: "Capture meaningful learning",
        body: "When something useful happens, capture it so it can support portfolios and reports later.",
      },
      {
        guidanceId: "my-day-progress-summary",
        title: "Use My Day gently",
        body: "My Day is a guide, not pressure. Use it to decide what matters now and what can wait.",
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
        title: "Review the current pathway step",
        body: "Pathways show possible next learning steps. Use them gently as a guide, not as pressure.",
      },
      {
        guidanceId: "pathways-step-card",
        title: "Open a step card",
        body: "Each step card shows the learning focus, evidence ideas and available actions.",
      },
      {
        guidanceId: "pathways-worksheet-button",
        title: "Open worksheets",
        body: "Some steps include printable worksheets connected to the learning goal.",
      },
      {
        guidanceId: "pathways-practise-button",
        title: "Use practise for supported learning",
        body: "Practise activities help the learner work with a skill before you decide whether to check understanding.",
      },
      {
        guidanceId: "pathways-assess-button",
        title: "Use assess when ready",
        body: "Assessment is available for some steps when you want a clearer check of understanding.",
      },
      {
        guidanceId: "pathways-progress-status",
        title: "Progress is a guide",
        body: "Status labels are there to help you make decisions, not to create pressure.",
      },
      {
        guidanceId: "pathways-next-capture",
        title: "Next step: capture evidence",
        body: "After a learning activity, capture a short note so the work can support portfolio and reporting later.",
      },
    ],
  },
  "my-capture": {
    id: "my-capture",
    steps: [
      {
        guidanceId: "capture-add-evidence",
        title: "Capture turns learning into evidence",
        body: "Use this form when you want to record something meaningful that happened during learning.",
      },
      {
        guidanceId: "capture-learner-select",
        title: "Choose the learner",
        body: "Choose the learner so this evidence is connected to the right child.",
      },
      {
        guidanceId: "capture-learning-area",
        title: "Connect the learning",
        body: "Link evidence to a learning area so it becomes easier to find later.",
      },
      {
        guidanceId: "capture-evidence-type",
        title: "Choose the kind of evidence",
        body: "Keep it simple. A note, observation or work sample is enough to start building records.",
      },
      {
        guidanceId: "capture-note-field",
        title: "Add a short note",
        body: "Write what happened, what you noticed, or what the learner may need next.",
      },
      {
        guidanceId: "capture-save",
        title: "Save the evidence",
        body: "Small captures can build into useful portfolios and reports over time.",
      },
      {
        guidanceId: "capture-next-portfolio",
        title: "Next step: review it in Portfolio",
        body: "After evidence is captured, My Portfolio helps you choose what is worth keeping for reports.",
      },
    ],
  },
  "my-portfolio": {
    id: "my-portfolio",
    steps: [
      {
        guidanceId: "portfolio-review-progress",
        title: "Your portfolio grows over time",
        body: "Portfolio is where captured evidence becomes a clearer story of progress.",
      },
      {
        guidanceId: "portfolio-evidence-list",
        title: "Review captured evidence",
        body: "Look through evidence and choose the strongest examples for portfolio and reporting.",
      },
      {
        guidanceId: "portfolio-filter-learner",
        title: "Filter by learner or learning area",
        body: "Filters help you find the right evidence as your records grow.",
      },
      {
        guidanceId: "portfolio-evidence-card",
        title: "Choose useful evidence",
        body: "Evidence cards help you decide what belongs in the portfolio and what can stay as a simple note.",
      },
      {
        guidanceId: "portfolio-reflection-note",
        title: "Add reflection where useful",
        body: "A short parent reflection can make evidence easier to understand later.",
      },
      {
        guidanceId: "portfolio-next-reports",
        title: "Next step: preview reports",
        body: "When you have useful evidence, My Reports can help turn it into a clearer learning record.",
      },
    ],
  },
  "my-reports": {
    id: "my-reports",
    steps: [
      {
        guidanceId: "reports-preview-output",
        title: "Reports are easier with evidence",
        body: "Reports become easier when planning, capture and portfolio evidence have built up over time.",
      },
      {
        guidanceId: "reports-date-range",
        title: "Choose the reporting period",
        body: "Choose the learner and reporting period so the record lines up with the right part of the year.",
      },
      {
        guidanceId: "reports-evidence-summary",
        title: "Preview the learning summary",
        body: "Review the evidence summary before sending the record to outputs.",
      },
      {
        guidanceId: "reports-preview",
        title: "Preview the learning record",
        body: "Use the preview to check what the report will communicate.",
      },
      {
        guidanceId: "reports-generate-output",
        title: "Generate an output when ready",
        body: "When the record is ready, send it to My Outputs for download or saving.",
      },
    ],
  },
  "my-outputs": {
    id: "my-outputs",
    steps: [
      {
        guidanceId: "outputs-download-share",
        title: "Download or save records",
        body: "My Outputs helps you prepare clearer records and summaries from learning you have already organised.",
      },
    ],
  },
};
