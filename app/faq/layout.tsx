import type { Metadata } from "next";
import { buildPublicMetadata } from "@/app/lib/publicMetadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "MyLearna FAQ | Homeschool Planning, Portfolios and Reports",
  description:
    "Answers to common questions about MyLearna, including homeschool planning, portfolios, learning evidence, reports, worksheets and beta access.",
  path: "/faq",
});

export default function FAQLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
