import type { Metadata } from "next";
import { buildPublicMetadata } from "@/app/lib/publicMetadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "Compare Homeschool Planning and Reporting Workflows | MyLearna",
  description:
    "See how MyLearna compares with spreadsheets, notes apps, and generic tools for homeschool planning, evidence tracking, portfolios, and reports.",
  path: "/compare",
});

export default function CompareLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
