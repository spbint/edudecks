import type { Metadata } from "next";
import { buildPublicMetadata } from "@/app/lib/publicMetadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "Start Free with MyLearna | Homeschool Records and Reports",
  description:
    "Create a free MyLearna account to begin homeschool record keeping, evidence capture, portfolio building, and report preparation at your own pace.",
  path: "/start-free",
});

export default function StartFreeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
