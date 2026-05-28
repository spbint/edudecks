import type { Metadata } from "next";
import CleanNumberAssessmentPlayer from "@/app/components/clean/CleanNumberAssessmentPlayer";

export const metadata: Metadata = {
  title: "Number Assessment | MyLearna",
  description:
    "A MyLearna Number assessment session with switchable upper Number focus areas.",
};

export default function NumberApproximationPrototypePage() {
  return <CleanNumberAssessmentPlayer />;
}
