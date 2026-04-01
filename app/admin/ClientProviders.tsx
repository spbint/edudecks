"use client";

import React from "react";
import StudentQuickViewProvider from "@/app/admin/components/StudentQuickViewProvider";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StudentQuickViewProvider>
      {children}
    </StudentQuickViewProvider>
  );
}