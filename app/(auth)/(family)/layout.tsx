"use client";

import React from "react";
import { FamilyShellSurface } from "@/app/components/FamilyTopNavShell";

export default function FamilyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FamilyShellSurface>{children}</FamilyShellSurface>;
}
