import type { Metadata } from "next";
import { buildPublicMetadata } from "@/app/lib/publicMetadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "Contact MyLearna | Homeschool Record Keeping Questions",
  description:
    "Contact MyLearna with questions about homeschool record keeping, reporting workflows, early access, or family use.",
  path: "/contact",
});

export default function ContactLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
