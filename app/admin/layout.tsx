import React from "react";
// Dormant route layer: preserved for future school/admin workflows, not part of the live family-first product.
import StudentQuickViewProvider from "@/app/admin/components/StudentQuickViewProvider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <StudentQuickViewProvider>{children}</StudentQuickViewProvider>;
}
