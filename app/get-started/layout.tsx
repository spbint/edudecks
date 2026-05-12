import type { Metadata } from "next";
import { buildPublicMetadata } from "@/app/lib/publicMetadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "How to Start Homeschool Record Keeping with Confidence | MyLearna",
  description:
    "Learn how to start homeschool record keeping with a simple planning, evidence capture, portfolio, and reporting workflow.",
  path: "/get-started",
});

export default function GetStartedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
