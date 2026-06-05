import type { Metadata } from "next";
import DemoShell from "@/components/demo/DemoShell";
import { buildPublicMetadata } from "@/app/lib/publicMetadata";

const demoDescription =
  "Explore a fictional U.S. homeschool family demo and see how MyLearna connects planning, learning pathways, evidence, portfolios, data, reports and outputs.";

export const metadata: Metadata = buildPublicMetadata({
  title: "MyLearna Demo | Homeschool Planning, Evidence and Reports",
  description: demoDescription,
  path: "/demo",
});

export default function DemoPage() {
  return <DemoShell />;
}
