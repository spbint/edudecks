import type { Metadata } from "next";
import DemoShell from "@/components/demo/DemoShell";
import { buildPublicMetadata } from "@/app/lib/publicMetadata";

const demoDescription =
  "Explore a fictional homeschool family and see how MyLearna connects learning evidence, clear next steps, Capture, Portfolio and reports.";

export const metadata: Metadata = buildPublicMetadata({
  title: "MyLearna Demo | Understand Learning and What Comes Next",
  description: demoDescription,
  path: "/demo",
});

export default function DemoPage() {
  return <DemoShell />;
}
