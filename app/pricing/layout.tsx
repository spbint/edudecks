import type { Metadata } from "next";
import { buildPublicMetadata } from "@/app/lib/publicMetadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "Homeschool Record Keeping Pricing | MyLearna",
  description:
    "See MyLearna pricing for homeschool record keeping, planning, portfolio building, and reporting. Start free and grow as your family record develops.",
  path: "/pricing",
});

export default function PricingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
