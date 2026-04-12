import type { ReactNode } from "react";

// Dormant route layer: preserved for future teacher workflows, not part of the live family-first product.
import TeacherTopNavShell from "@/app/components/TeacherTopNavShell";

export default function TeacherLayout({ children }: { children: ReactNode }) {
  return <TeacherTopNavShell>{children}</TeacherTopNavShell>;
}
