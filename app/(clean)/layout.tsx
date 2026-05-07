import React from "react";
import { requireAuthenticatedRoute } from "@/lib/auth/serverRouteAuth";

export default async function CleanRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuthenticatedRoute("/clean-my-day");

  return <>{children}</>;
}
