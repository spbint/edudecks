import type { Metadata } from "next";
import { buildPublicMetadata } from "@/app/lib/publicMetadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "MyLearna vs AI Planners, Homeschool Planners & Spreadsheets",
  description:
    "Compare MyLearna with AI planners, homeschool planners, spreadsheets and notes. See how MyLearna connects real learning to evidence, portfolios and reports without replacing the tools your family already uses.",
  path: "/compare",
});

export default function CompareLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
