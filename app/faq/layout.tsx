import type { Metadata } from "next";
import { buildPublicMetadata } from "@/app/lib/publicMetadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "Homeschool Record Keeping FAQ | MyLearna",
  description:
    "Answers to common questions about MyLearna, including homeschool record keeping, evidence tracking, reporting, privacy, and flexible learning styles.",
  path: "/faq",
});

export default function FAQLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
