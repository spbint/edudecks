import React from "react";
import AuthRouteGuard from "@/app/components/AuthRouteGuard";

export default function CleanRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthRouteGuard>{children}</AuthRouteGuard>;
}
