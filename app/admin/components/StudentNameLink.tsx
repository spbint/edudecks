"use client";

import React from "react";
import { useStudentQuickView } from "@/app/admin/components/StudentQuickViewProvider";

type Props = {
  studentId: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export function StudentNameLink({ studentId, children, className, style }: Props) {
  const { openStudent } = useStudentQuickView();

  return (
    <button
      type="button"
      className={className}
      style={{
        border: "none",
        background: "transparent",
        padding: 0,
        margin: 0,
        cursor: "pointer",
        color: "inherit",
        font: "inherit",
        textAlign: "left",
        ...style,
      }}
      onClick={() => openStudent(studentId)}
      title="Open student quick view"
    >
      {children}
    </button>
  );
}

export default StudentNameLink;