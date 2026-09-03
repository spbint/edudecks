import type { Metadata } from "next";
import { buildPublicMetadata } from "@/app/lib/publicMetadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "MyLearna Homeschool Pricing | Free to Use",
  description:
    "MyLearna Homeschool is free to use for planning, capturing learning, portfolio building, and reporting. No subscription or credit card required.",
  path: "/pricing",
});

export default function PricingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
