import type { Metadata } from "next";
import { buildPublicMetadata } from "@/app/lib/publicMetadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "Why MyLearna Exists for Homeschool Record Keeping | MyLearna",
  description:
    "Learn why MyLearna was built for homeschooling families who want calmer record keeping, evidence tracking, curriculum planning, and report preparation.",
  path: "/about",
});

export default function AboutLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
