import Link from "next/link";
import ActivityPlayerV4 from "@/app/components/clean/activity-player-v4/ActivityPlayerV4";
import type { ActivityPlayerV4Sample } from "@/app/components/clean/activity-player-v4/ActivityPlayerV4.types";
import { NUMBER_STEP_1_RECOGNISE_SMALL_QUANTITIES_ASSESSMENT_ITEMS } from "@/lib/clean/assessments/numberStep1RecogniseSmallQuantitiesAssessmentItems";
import { RATIO_PROPORTIONAL_REASONING_STEP_ASSESSMENTS } from "@/lib/clean/assessments/ratioProportionalReasoningStepAssessmentRegistry";
import { NUMBER_POWERS_ROOTS_PRACTICE_MODULE } from "@/lib/clean/practice/numberPowersRootsPracticeModules";

export const metadata = {
  title: "Activity Player V4 Lab | MyLearna",
  robots: {
    index: false,
    follow: false,
  },
};

function firstMultipleChoicePracticeTask() {
  return (
    NUMBER_POWERS_ROOTS_PRACTICE_MODULE.sections
      .flatMap((section) => section.tasks)
      .find((task) => task.taskType === "multiple_choice" && task.options?.length)
  );
}

function ratioAssessmentItem() {
  return (
    RATIO_PROPORTIONAL_REASONING_STEP_ASSESSMENTS
      .flatMap((assessment) => assessment.items)
      .find((item) => item.title === "Table row check") ??
    RATIO_PROPORTIONAL_REASONING_STEP_ASSESSMENTS.flatMap((assessment) => assessment.items)[0]
  );
}

function buildSamples(): ActivityPlayerV4Sample[] {
  const earlyItem = NUMBER_STEP_1_RECOGNISE_SMALL_QUANTITIES_ASSESSMENT_ITEMS[0];
  const reasoningTask = firstMultipleChoicePracticeTask();
  const ratioItem = ratioAssessmentItem();

  const samples: Array<ActivityPlayerV4Sample | null> = [
    earlyItem
      ? {
          id: earlyItem.id,
          label: "Early visual item",
          mode: "assess",
          source: "Existing Number assessment item",
          stepLabel: "Step 1 - Assess",
          title: earlyItem.title,
          prompt: earlyItem.prompt,
          options: earlyItem.options ?? [],
          expectedAnswer: earlyItem.expectedAnswer ?? "",
          hint: earlyItem.visualSupport?.description ?? null,
          feedback: earlyItem.workedSolution ?? null,
          visualDescription: earlyItem.visualSupport?.description ?? null,
          visualKind: "dots",
        }
      : null,
    reasoningTask
      ? {
          id: reasoningTask.id,
          label: "Reasoning item",
          mode: "practice",
          source: "Existing Powers and roots practice task",
          stepLabel: "Powers and roots - Practise",
          title: reasoningTask.title,
          prompt: reasoningTask.prompt,
          options: reasoningTask.options ?? [],
          expectedAnswer: reasoningTask.expectedAnswer ?? "",
          hint: reasoningTask.supportPrompt ?? null,
          feedback: reasoningTask.workedSolution ?? null,
          visualDescription: reasoningTask.visualSupport?.description ?? null,
          visualKind: "numbers",
        }
      : null,
    ratioItem
      ? {
          id: ratioItem.id,
          label: "Higher-level item",
          mode: "assess",
          source: "Existing Ratio assessment item",
          stepLabel: "Ratio - Assess",
          title: ratioItem.title,
          prompt: ratioItem.prompt,
          options: ratioItem.options ?? [],
          expectedAnswer: ratioItem.expectedAnswer ?? "",
          hint: ratioItem.visualSupport?.description ?? null,
          feedback: ratioItem.workedSolution ?? null,
          visualDescription: ratioItem.visualSupport?.description ?? null,
          visualKind: "table",
        }
      : null,
  ];

  return samples.filter((sample): sample is ActivityPlayerV4Sample => Boolean(sample && sample.options.length));
}

function ProductionGuard() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F7F9FC",
        color: "#17204B",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <section
        style={{
          maxWidth: 560,
          border: "1px solid #E7EAF2",
          borderRadius: 22,
          background: "#FFFFFF",
          padding: 24,
          display: "grid",
          gap: 12,
          boxShadow: "0 14px 36px rgba(23,32,75,0.065)",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 24 }}>Activity Player V4 lab is not available here</h1>
        <p style={{ margin: 0, color: "#5B6478", lineHeight: 1.6 }}>
          This route is reserved for local design review and is disabled in production builds.
        </p>
        <Link href="/my-pathways" style={{ color: "#6C4DF6", fontWeight: 650 }}>
          Back to My Pathways
        </Link>
      </section>
    </main>
  );
}

export default function ActivityPlayerV4LabPage() {
  if (process.env.NODE_ENV === "production") {
    return <ProductionGuard />;
  }

  return <ActivityPlayerV4 samples={buildSamples()} />;
}
