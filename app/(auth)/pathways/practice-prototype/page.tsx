import type { Metadata } from "next";
import CleanPathwayPracticeWorkspace from "@/app/components/clean/CleanPathwayPracticeWorkspace";
import { makeNumbersTo10Practice } from "@/lib/clean/pathways/practiceActivities";

export const metadata: Metadata = {
  title: "Pathway Practice Prototype | MyLearna",
  description:
    "A first MyLearna practice and assessment vertical slice attached to one canonical pathway step.",
};

export default function PathwayPracticePrototypePage() {
  return <CleanPathwayPracticeWorkspace activity={makeNumbersTo10Practice} />;
}
