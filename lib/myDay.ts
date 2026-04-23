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

export type MyDayBlockStatus = "captured" | "next" | "planned" | "overdue";

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

export type MyDayProgress = {
  capturedCount: number;
  totalCount: number;
  note: string;
};

export type MyDayRecentCapture = {
  id: string;
  title: string;
  timeLabel: string;
};

export type MyDayNextStep = {
  title: string;
  note: string;
  href: string;
  cta: string;
  secondaryHref?: string;
  secondaryCta?: string;
};

export type MyDayView = {
  blocks: MyDayBlockItem[];
  summary: MyDaySummary;
  progress: MyDayProgress;
  nextUp: MyDayBlockItem | null;
  recentCaptures: MyDayRecentCapture[];
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

function timeLabel(value?: string | null) {
  const clean = safe(value);
  if (!clean) return "Recently captured";

  const direct = new Date(clean);
  if (!Number.isNaN(direct.getTime())) {
    return direct.toLocaleTimeString("en-AU", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const fallback = new Date(`${clean}T12:00:00`);
  if (!Number.isNaN(fallback.getTime())) {
    return fallback.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
    });
  }

  return "Recently captured";
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

function blockMoment(date: string, time: string) {
  const match = safe(time).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(hours, minutes, 0, 0);
  return parsed;
}

function isOverdueMoment(moment: Date | null, now: Date) {
  if (!moment) return false;
  return moment.getTime() < now.getTime();
}

export function buildMyDayView(input: {
  date: string;
  learnerId: string;
  blocks: FamilyCalendarBlockEntry[];
  programs: Program[];
  evidenceRows: MyDayEvidenceRow[];
  now?: Date;
}): MyDayView {
  const now = input.now ?? new Date();
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

  const nextScheduledBlock = sortedBlocks.find((block) => {
    const linkedEvidence = evidenceByBlock.get(block.id) ?? [];
    if (linkedEvidence.length > 0) return false;
    const moment = blockMoment(input.date, block.time);
    return moment ? moment.getTime() >= now.getTime() : !block.time;
  }) ?? null;

  const firstOverdueUncapturedBlock = sortedBlocks.find((block) => {
    const linkedEvidence = evidenceByBlock.get(block.id) ?? [];
    if (linkedEvidence.length > 0) return false;
    return isOverdueMoment(blockMoment(input.date, block.time), now);
  }) ?? null;

  const nextBlockId =
    nextScheduledBlock?.id ??
    firstOverdueUncapturedBlock?.id ??
    sortedBlocks.find((block) => (evidenceByBlock.get(block.id) ?? []).length === 0)?.id ??
    null;

  const blocks = sortedBlocks.map((block) => {
    const linkedEvidence = evidenceByBlock.get(block.id) ?? [];
    const program = block.programId ? programMap.get(block.programId) ?? null : null;
    const segment = program?.segments.find((item) => item.id === block.programSegmentId) ?? null;
    const moment = blockMoment(block.date, block.time);
    const status: MyDayBlockStatus =
      linkedEvidence.length > 0
        ? "captured"
        : isOverdueMoment(moment, now)
          ? "overdue"
          : block.id === nextBlockId
            ? "next"
            : "planned";

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
  const overdueCount = blocks.filter((block) => block.status === "overdue").length;
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

  const progress: MyDayProgress = {
    capturedCount,
    totalCount: blocks.length,
    note:
      !blocks.length
        ? "Add the first live block in My Plan to give today some shape."
        : overdueCount >= 2 && capturedCount === 0
          ? "A few blocks have already passed without capture. One learning moment will settle the day."
        : capturedCount === 0
          ? "Nothing has been captured yet for today's blocks."
        : capturedCount >= blocks.length
            ? "Every scheduled block has supporting evidence."
            : `${capturedCount} of ${blocks.length} blocks already have supporting evidence.`,
  };

  const nextUp =
    blocks.find((block) => block.id === nextScheduledBlock?.id) ??
    blocks.find((block) => block.id === firstOverdueUncapturedBlock?.id) ??
    null;
  const recentCaptures: MyDayRecentCapture[] = [...input.evidenceRows]
    .sort((a, b) => safe(b.occurred_on || b.created_at).localeCompare(safe(a.occurred_on || a.created_at)))
    .slice(0, 3)
    .map((row) => ({
      id: row.id,
      title: safe(row.title) || safe(row.summary) || "Learning moment",
      timeLabel: timeLabel(row.created_at || row.occurred_on),
    }));

  const nextUncaptured = nextUp ?? blocks.find((block) => block.evidenceCount === 0) ?? null;
  const nextStep: MyDayNextStep = !blocks.length
    ? {
        title: "Shape today in My Plan",
        note: "There is nothing scheduled yet, so the clearest next step is to add one live block for today.",
        href: `/my-plan?date=${encodeURIComponent(input.date)}`,
        cta: "Shape today in My Plan",
      }
    : capturedCount >= blocks.length && blocks.length > 0
    ? {
        title: "Today's learning is already captured",
        note: "Everything scheduled for today has supporting evidence. You can review the story now or open the live plan for what comes next.",
        href: `/my-portfolio?learner=${encodeURIComponent(input.learnerId)}`,
        cta: "View My Portfolio",
        secondaryHref: `/my-plan?date=${encodeURIComponent(input.date)}`,
        secondaryCta: "Open My Plan",
      }
    : overdueCount >= 2 && capturedCount === 0
    ? {
        title: "Capture one moment to settle the day",
        note: "A few planned blocks have already passed. One quick capture will make today's flow feel current again.",
        href: `/capture?learner=${encodeURIComponent(input.learnerId)}&date=${encodeURIComponent(input.date)}`,
        cta: "Capture now",
      }
    : capturedCount === 0 && nextUncaptured
    ? {
        title: `Capture the first moment from ${nextUncaptured.title}`,
        note: "Today's blocks are ready. Capture the first completed moment so the day starts feeling active.",
        href: `/capture?learner=${encodeURIComponent(input.learnerId)}&date=${encodeURIComponent(input.date)}&block=${encodeURIComponent(nextUncaptured.id)}`,
        cta: "Capture now",
      }
    : nextUncaptured
      ? {
        title: `Keep going with ${nextUncaptured.title}`,
        note: "Part of today is already recorded. Continue with the next block or capture the next learning moment.",
        href: `/my-plan?date=${encodeURIComponent(input.date)}`,
        cta: "Continue in My Plan",
      }
      : {
          title: "Shape today in My Plan",
          note: "There is nothing scheduled yet, so the clearest next step is to add one live block for today.",
          href: `/my-plan?date=${encodeURIComponent(input.date)}`,
          cta: "Shape today in My Plan",
        };

  return { blocks, summary, progress, nextUp, recentCaptures, nextStep };
}
