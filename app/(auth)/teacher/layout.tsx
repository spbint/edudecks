import type { ReactNode } from "react";

import TeacherTopNavShell from "@/app/components/TeacherTopNavShell";

export default function TeacherLayout({ children }: { children: ReactNode }) {
  return <TeacherTopNavShell>{children}</TeacherTopNavShell>;
}
