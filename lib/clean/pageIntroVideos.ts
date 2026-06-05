export type PageIntroVideoConfig = {
  pageKey: string;
  title: string;
  shortTitle: string;
  description: string;
  youtubeId: string;
  youtubeUrl?: string;
};

export const PAGE_INTRO_VIDEOS = {
  myDay: {
    pageKey: "my-day",
    title: "My Day walkthrough",
    shortTitle: "My Day guide",
    description:
      "See how My Day helps you view today's learning, add quick blocks and connect daily learning to evidence capture.",
    youtubeId: "6kBGR6t24Ig",
  },
  myPathways: {
    pageKey: "my-pathways",
    title: "My Pathways walkthrough",
    shortTitle: "My Pathways guide",
    description:
      "See how My Pathways helps you follow learning steps, practise, assess and capture evidence.",
    youtubeId: "AFb1Ija6jdw",
  },
  myCapture: {
    pageKey: "my-capture",
    title: "My Capture walkthrough",
    shortTitle: "My Capture guide",
    description:
      "See how to capture notes, photos, observations and work samples as learning evidence.",
    youtubeId: "edAUA_ACNxM",
  },
  myPortfolio: {
    pageKey: "my-portfolio",
    title: "My Portfolio walkthrough",
    shortTitle: "My Portfolio guide",
    description:
      "See how to choose strong evidence and build a meaningful learning portfolio over time.",
    youtubeId: "FK_R4bloi58",
  },
  myData: {
    pageKey: "my-data",
    title: "My Data walkthrough",
    shortTitle: "My Data guide",
    description:
      "See how My Data brings learning activity, evidence, strengths, focus areas and reporting readiness together.",
    youtubeId: "T931VlJu17c",
  },
  myReports: {
    pageKey: "my-reports",
    title: "My Reports walkthrough",
    shortTitle: "My Reports guide",
    description:
      "See how My Reports helps prepare clear learning summaries from planning, evidence and portfolio records.",
    youtubeId: "B-pEkfflaEo",
  },
  myOutputs: {
    pageKey: "my-outputs",
    title: "My Outputs walkthrough",
    shortTitle: "My Outputs guide",
    description:
      "See how My Outputs helps preview and download records, reports and portfolio summaries.",
    youtubeId: "G8-2u-xD0mk",
  },
  myProfile: {
    pageKey: "my-profile",
    title: "My Profile walkthrough",
    shortTitle: "My Profile guide",
    description:
      "See how to set up family and learner details so MyLearna can organise learning records clearly.",
    youtubeId: "2lbBTIn-WJ4",
  },
  mySettings: {
    pageKey: "my-settings",
    title: "My Settings walkthrough",
    shortTitle: "My Settings guide",
    description:
      "See how to choose region, curriculum and reporting settings for your homeschool context.",
    youtubeId: "ANZyNxECmYY",
  },
  myCalendarWeeklyPlanner: {
    pageKey: "my-calendar-weekly-planner",
    title: "My Calendar - Weekly planner walkthrough",
    shortTitle: "Weekly planner guide",
    description:
      "See how to plan weekly learning blocks and organise the rhythm of your homeschool week.",
    youtubeId: "NW-l9Ak6ay8",
  },
  myCalendarTermTimes: {
    pageKey: "my-calendar-term-times",
    title: "My Calendar - Setting term times walkthrough",
    shortTitle: "Term times guide",
    description:
      "See how to set term dates and organise the structure of your learning year.",
    youtubeId: "czcTB4-jV24",
  },
} satisfies Record<string, PageIntroVideoConfig>;

export function getPageIntroVideoEmbedUrl(config: PageIntroVideoConfig) {
  const youtubeId = config.youtubeId.trim();
  if (!youtubeId) return "";
  return `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`;
}
