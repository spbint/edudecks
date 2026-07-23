import type { Metadata } from "next";
import CleanLearnaWorkspace from "@/app/components/clean/CleanLearnaWorkspace";

export const metadata: Metadata = {
  title: "My Learna | MyLearna",
  description: "A calm parent-facing view of saved learning, current focus and helpful next steps.",
};

export default function MyLearnaPage() {
  return <CleanLearnaWorkspace />;
}
