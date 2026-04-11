import type { ReactNode } from "react";
import FamilyWorkflowStrip from "@/app/components/FamilyWorkflowStrip";

export default function CalendarLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <FamilyWorkflowStrip current="calendar" />
      {children}
    </>
  );
}