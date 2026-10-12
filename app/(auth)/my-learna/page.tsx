import type { Metadata } from "next";
import CleanLearnaWorkspace from "@/app/components/clean/CleanLearnaWorkspace";

export const metadata: Metadata = {
  title: "My Learna | MyLearna",
  description: "Understand what current evidence suggests, what remains unknown and what to do next for each learner.",
};

export default function MyLearnaPage() {
  return <CleanLearnaWorkspace />;
}
