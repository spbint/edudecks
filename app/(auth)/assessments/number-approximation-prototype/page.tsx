import type { Metadata } from "next";
import CleanNumberAssessmentPlayer from "@/app/components/clean/CleanNumberAssessmentPlayer";

export const metadata: Metadata = {
  title: "Number Approximation Assessment Prototype | MyLearna",
  description:
    "A local-only MyLearna assessment prototype for approximation, estimation, and error reasoning.",
};

export default function NumberApproximationPrototypePage() {
  return <CleanNumberAssessmentPlayer />;
}
