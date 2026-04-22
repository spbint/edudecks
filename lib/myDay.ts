import type { FamilyCalendarBlockEntry } from "@/lib/familyPlanner";
import type { Program } from "@/lib/familyPlanningTemplates";

export type MyDayEvidenceRow = {
  id: string;
  occurred_on?: string | null;
  created_at?: string | null;
  title?: string | null;
  summary?: string | null;
  evidence_type?: string | null;
  linked_learning_plan_item_id?: string | null;
};

export type MyDayBlockStatus = "captured" | "next" | "planned";

export type MyDayBlockItem = {
  id: string;
  title: string;
  date: string;
  subject: string;
  note: string;
  time: string;
  curriculumOutcomeIds: string[];
  sourceType: "manual" | "generated";
  programTitle: string | null;
  programSegmentTitle: string | null;
  sourceLabel: string;
  evidenceCount: number;
  latestEvidenceLabel: string | null;
  status: MyDayBlockStatus;
};

export type MyDaySummary = {
  plannedCount: number;
  capturedCount: number;
  evidenceTodayCount: number;
  dailyStatus: string;
  dailyNote: string;
};

export type MyDayNextStep = {
  title: string;
  note: string;
  href: string;
  cta: string;
};

export type MyDayView = {
  blocks: MyDayBlockItem[];
  summary: MyDaySummary;
  nextStep: MyDayNextStep;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function dateLabel(value?: string | null) {
  const parsed = new Date(safe(value));
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

function timeSortValue(block: FamilyCalendarBlockEntry, index: number) {
  const raw = safe(block.time);
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return 10_000 + index;
  return Number(match[1]) * 60 + Number(match[2]);
}

function sourceLabel(block: FamilyCalendarBlockEntry) {
  if (block.time) return block.sourceType === "generated" ? "Scheduled from template" : "Scheduled today";
  return block.sourceType === "generated" ? "Generated from My Programs" : "Added in My Plan";
}

function latestEvidenceLabel(rows: MyDayEvidenceRow[]) {
  const sorted = [...rows].sort((a, b) => safe(b.occurred_on || b.created_at).localeCompare(safe(a.occurred_on || a.created_at)));
  return dateLabel(sorted[0]?.occurred_on || sorted[0]?.created_at);
}

export function buildMyDayView(input: {
  date: string;
  learnerId: string;
  blocks: FamilyCalendarBlockEntry[];
  programs: Program[];
  evidenceRows: MyDayEvidenceRow[];
}): MyDayView {
  const programMap = new Map(input.programs.map((program) => [program.id, program]));
  const evidenceToday = input.evidenceRows.filter((row) => safe(row.occurred_on) === input.date);
  const evidenceByBlock = new Map<string, MyDayEvidenceRow[]>();

  input.evidenceRows.forEach((row) => {
    const linkedId = safe(row.linked_learning_plan_item_id);
    if (!linkedId) return;
    evidenceByBlock.set(linkedId, [...(evidenceByBlock.get(linkedId) ?? []), row]);
  });

  const sortedBlocks = input.blocks
    .map((block, index) => ({ block, index }))
    .sort((a, b) => timeSortValue(a.block, a.index) - timeSortValue(b.block, b.index))
    .map((item) => item.block);
  const nextBlockId = sortedBlocks.find((block) => (evidenceByBlock.get(block.id) ?? []).length === 0)?.id ?? null;

  const blocks = sortedBlocks.map((block) => {
    const linkedEvidence = evidenceByBlock.get(block.id) ?? [];
    const program = block.programId ? programMap.get(block.programId) ?? null : null;
    const segment = program?.segments.find((item) => item.id === block.programSegmentId) ?? null;
    const status: MyDayBlockStatus =
      linkedEvidence.length > 0 ? "captured" : block.id === nextBlockId ? "next" : "planned";

    return {
      id: block.id,
      title: safe(block.title) || "Learning block",
      date: block.date,
      subject: safe(block.subject) || "Learning",
      note: safe(block.note),
      time: safe(block.time),
      curriculumOutcomeIds: block.curriculumOutcomeIds ?? [],
      sourceType: block.sourceType ?? "manual",
      programTitle: program ? safe(program.title) : null,
      programSegmentTitle: segment ? safe(segment.title) : null,
      sourceLabel: sourceLabel(block),
      evidenceCount: linkedEvidence.length,
      latestEvidenceLabel: latestEvidenceLabel(linkedEvidence),
      status,
    };
  });

  const capturedCount = blocks.filter((block) => block.evidenceCount > 0).length;
  const summary: MyDaySummary = {
    plannedCount: blocks.length,
    capturedCount,
    evidenceTodayCount: evidenceToday.length,
    dailyStatus:
      !blocks.length
        ? "Ready to plan"
        : capturedCount >= blocks.length && blocks.length > 0
          ? "On track"
          : capturedCount > 0
            ? "Ready to continue"
            : "Ready to begin",
    dailyNote:
      !blocks.length
        ? "Nothing is scheduled for today yet."
        : capturedCount >= blocks.length && blocks.length > 0
          ? "Today's scheduled learning already has evidence attached."
          : capturedCount > 0
            ? "Some of today's learning already has evidence attached."
            : "Today's learning flow is ready to begin.",
  };

  const nextUncaptured = blocks.find((block) => block.evidenceCount === 0) ?? null;
  const nextStep: MyDayNextStep = nextUncaptured
    ? {
        title: `Continue ${nextUncaptured.title}`,
        note: "Open the live plan or capture evidence from the next scheduled block.",
        href: `/my-plan?date=${encodeURIComponent(input.date)}`,
        cta: "Continue in My Plan",
      }
    : blocks.length
      ? {
          title: "Capture today's learning",
          note: "Add one more learning moment if you want today's record to feel fuller.",
          href: `/capture?learner=${encodeURIComponent(input.learnerId)}&date=${encodeURIComponent(input.date)}`,
          cta: "Capture a moment",
        }
      : {
          title: "Plan today in My Calendar",
          note: "Start by placing one learning block into today or shaping the next week.",
          href: "/my-calendar",
          cta: "Open My Calendar",
        };

  return { blocks, summary, nextStep };
}
