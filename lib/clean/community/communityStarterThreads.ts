import type {
  CommunityCategory,
  CommunityPost,
  CommunityThread,
} from "@/lib/clean/community/types";

export const STARTER_COMMUNITY_AUTHOR_ID = "starter:mylearna-team";
export const STARTER_COMMUNITY_THREAD_PREFIX = "starter-thread:";
export const STARTER_COMMUNITY_POST_PREFIX = "starter-post:";

export type StarterCommunityThread = CommunityThread & {
  starterBadge: "Starter discussion" | "MyLearna prompt";
};

export type StarterCommunityPost = CommunityPost & {
  starterAuthorLabel: "Example response" | "MyLearna Team";
};

function starterThread(
  id: string,
  category: CommunityCategory,
  title: string,
  body: string,
  starterBadge: StarterCommunityThread["starterBadge"] = "Starter discussion",
): StarterCommunityThread {
  return {
    id: `${STARTER_COMMUNITY_THREAD_PREFIX}${id}`,
    authorUserId: STARTER_COMMUNITY_AUTHOR_ID,
    category,
    title,
    body,
    linkUrl: null,
    status: "open",
    createdAt: null,
    updatedAt: null,
    starterBadge,
  };
}

function starterReply(
  threadId: string,
  index: number,
  starterAuthorLabel: StarterCommunityPost["starterAuthorLabel"],
  body: string,
): StarterCommunityPost {
  return {
    id: `${STARTER_COMMUNITY_POST_PREFIX}${threadId}:${index}`,
    threadId: `${STARTER_COMMUNITY_THREAD_PREFIX}${threadId}`,
    authorUserId: `${STARTER_COMMUNITY_AUTHOR_ID}:${starterAuthorLabel.toLowerCase().replace(/\s+/g, "-")}`,
    body,
    status: "open",
    createdAt: null,
    updatedAt: null,
    starterAuthorLabel,
  };
}

export const COMMUNITY_STARTER_THREADS: StarterCommunityThread[] = [
  starterThread(
    "weekly-planning",
    "general",
    "What would make weekly homeschool planning easier?",
    "Weekly planning can be one of the hardest parts of homeschooling, especially when family life changes quickly. What would help you plan your week more easily - reusable routines, subject blocks, reminders, a simple checklist, or something else?",
  ),
  starterThread(
    "helpful-resource",
    "resources",
    "Share one homeschool resource that has genuinely helped you",
    "Share one resource, website, book, curriculum, tool, group, or idea that has genuinely helped your homeschool. Please only share public links and avoid private drives, copyrighted downloads, or anything with children's private information.",
  ),
  starterThread(
    "affordable-programs",
    "curriculum",
    "Where do you currently find affordable homeschool programs or resources?",
    "Many families are trying to balance quality, cost, and simplicity. Where do you usually find affordable homeschool programs, unit ideas, printables, books, or learning materials?",
  ),
  starterThread(
    "natural-evidence",
    "reporting",
    "What evidence do you collect without creating extra work?",
    "Record keeping can become overwhelming if it turns into a second job. What kinds of learning evidence do you naturally collect during the week - photos, notes, finished work, conversations, projects, reading logs, or something else?",
    "MyLearna prompt",
  ),
  starterThread(
    "reporting-rules",
    "state-country",
    "Which reporting rules are hardest to understand in your state or country?",
    "Different countries, states, and regions ask homeschool families to keep different records. What part of the reporting or registration process feels hardest to understand?",
  ),
  starterThread(
    "simpler-before-wider-use",
    "mylearna-suggestions",
    "What should MyLearna make simpler for new families?",
    "Your feedback can shape MyLearna. What should be simpler, clearer, smaller, faster, or easier to understand for families starting out?",
    "MyLearna prompt",
  ),
  starterThread(
    "structure-flexibility",
    "general",
    "How do you balance structure with flexibility?",
    "Some families love a clear plan. Others need room for appointments, younger children, co-ops, part-time work, or unexpected interruptions. How do you balance structure and flexibility in your homeschool week?",
  ),
  starterThread(
    "yearly-report",
    "reporting",
    "What would you want included in a yearly homeschool report?",
    "If you had to generate a yearly homeschool summary or portfolio, what would you want it to include? Curriculum coverage, learning notes, photos, samples of work, attendance, reflections, goals, or something else?",
    "MyLearna prompt",
  ),
  starterThread(
    "stuck-writing-maths-reading",
    "curriculum",
    "What helps when a child gets stuck on writing, maths, or reading?",
    "Many homeschool families hit moments where a child gets stuck or loses confidence. What strategies, routines, resources, or adjustments have helped in your home?",
  ),
  starterThread(
    "low-cost-home-activities",
    "resources",
    "What low-cost learning activities work well at home?",
    "Some of the best learning does not require expensive resources. What low-cost activities, household materials, games, outings, or routines have worked well for your family?",
  ),
];

export const COMMUNITY_STARTER_REPLIES: StarterCommunityPost[] = [
  starterReply(
    "weekly-planning",
    1,
    "Example response",
    "A simple weekly rhythm can help: literacy and maths most mornings, project work twice a week, and a lighter catch-up day at the end of the week.",
  ),
  starterReply(
    "weekly-planning",
    2,
    "MyLearna Team",
    "This is the kind of feedback that can help shape how MyLearna supports planning without making it feel heavy.",
  ),
  starterReply(
    "helpful-resource",
    1,
    "Example response",
    "It helps when people include the age or stage it worked for, and why it was useful.",
  ),
  starterReply(
    "helpful-resource",
    2,
    "MyLearna Team",
    "Over time, this could become a useful place for families to discover practical, parent-tested resources.",
  ),
  starterReply(
    "affordable-programs",
    1,
    "Example response",
    "Local libraries, second-hand book groups, and free curriculum samples can be helpful starting points.",
  ),
  starterReply(
    "affordable-programs",
    2,
    "MyLearna Team",
    "Please avoid sharing copyrighted files directly. Public links and general recommendations are best.",
  ),
  starterReply(
    "natural-evidence",
    1,
    "Example response",
    "A quick photo plus one short parent note can often capture more than a long written record.",
  ),
  starterReply(
    "natural-evidence",
    2,
    "MyLearna Team",
    "This is central to MyLearna's purpose: helping families capture real learning without adding unnecessary workload.",
  ),
  starterReply(
    "reporting-rules",
    1,
    "MyLearna Team",
    "Please share general experiences only. Community discussion is not legal advice.",
  ),
  starterReply(
    "reporting-rules",
    2,
    "Example response",
    "It can help to know what other families track across the year, even when the exact rules differ.",
  ),
  starterReply(
    "simpler-before-wider-use",
    1,
    "Example response",
    "It would help if the next step was always obvious after adding a plan, capturing evidence, or previewing a report.",
  ),
  starterReply(
    "simpler-before-wider-use",
    2,
    "MyLearna Team",
    "Practical suggestions are very welcome, especially anything that reduces overwhelm for new families.",
  ),
  starterReply(
    "structure-flexibility",
    1,
    "Example response",
    "A weekly plan with flexible blocks can be easier to keep than a strict hour-by-hour timetable.",
  ),
  starterReply(
    "structure-flexibility",
    2,
    "MyLearna Team",
    "This is helpful for shaping how planning tools should work for real family life.",
  ),
  starterReply(
    "yearly-report",
    1,
    "Example response",
    "A good report should be clear enough for a reviewer, but still feel like it represents the child's real learning.",
  ),
  starterReply(
    "yearly-report",
    2,
    "MyLearna Team",
    "This feedback can help improve MyLearna Outputs and reporting tools.",
  ),
  starterReply(
    "stuck-writing-maths-reading",
    1,
    "Example response",
    "Shorter tasks, oral answers first, and breaking work into smaller steps can make a big difference.",
  ),
  starterReply(
    "stuck-writing-maths-reading",
    2,
    "MyLearna Team",
    "Please keep replies practical, kind, and family-safe.",
  ),
  starterReply(
    "low-cost-home-activities",
    1,
    "Example response",
    "Cooking, shopping lists, measuring, gardening, library visits, and nature walks can all create strong learning evidence.",
  ),
  starterReply(
    "low-cost-home-activities",
    2,
    "MyLearna Team",
    "These kinds of examples may also help families think about what to capture in MyLearna Portfolio.",
  ),
];

export function isStarterCommunityThreadId(threadId: string) {
  return threadId.startsWith(STARTER_COMMUNITY_THREAD_PREFIX);
}

export function isStarterCommunityPostId(postId: string) {
  return postId.startsWith(STARTER_COMMUNITY_POST_PREFIX);
}

export function getStarterThreadBadge(threadId: string) {
  return COMMUNITY_STARTER_THREADS.find((thread) => thread.id === threadId)?.starterBadge ?? null;
}

export function getStarterPostAuthorLabel(postId: string) {
  return (
    COMMUNITY_STARTER_REPLIES.find((reply) => reply.id === postId)?.starterAuthorLabel ?? null
  );
}

export function getStarterRepliesForThread(threadId: string) {
  return COMMUNITY_STARTER_REPLIES.filter((reply) => reply.threadId === threadId);
}
