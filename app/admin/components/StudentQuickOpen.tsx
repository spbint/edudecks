"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useStudentQuickView } from "@/app/admin/components/StudentQuickViewProvider";

type StudentQuickOpenProps = {
  studentId: string;
  label: string;
  ilp?: boolean;
  returnTo?: string;
  fullHref?: string;
  showFullButton?: boolean;
  muted?: boolean;
  size?: "sm" | "md";
};

const S = {
  wrap: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    minWidth: 0,
  } as React.CSSProperties,

  nameBtnMd: {
    border: "none",
    background: "transparent",
    padding: 0,
    margin: 0,
    color: "#0f172a",
    fontWeight: 950,
    cursor: "pointer",
    textAlign: "left",
    fontSize: 15,
    lineHeight: 1.25,
    minWidth: 0,
  } as React.CSSProperties,

  nameBtnSm: {
    border: "none",
    background: "transparent",
    padding: 0,
    margin: 0,
    color: "#0f172a",
    fontWeight: 900,
    cursor: "pointer",
    textAlign: "left",
    fontSize: 13,
    lineHeight: 1.2,
    minWidth: 0,
  } as React.CSSProperties,

  nameBtnMutedMd: {
    border: "none",
    background: "transparent",
    padding: 0,
    margin: 0,
    color: "#334155",
    fontWeight: 900,
    cursor: "pointer",
    textAlign: "left",
    fontSize: 15,
    lineHeight: 1.25,
    minWidth: 0,
  } as React.CSSProperties,

  nameBtnMutedSm: {
    border: "none",
    background: "transparent",
    padding: 0,
    margin: 0,
    color: "#475569",
    fontWeight: 900,
    cursor: "pointer",
    textAlign: "left",
    fontSize: 13,
    lineHeight: 1.2,
    minWidth: 0,
  } as React.CSSProperties,

  miniBtn: {
    padding: "5px 9px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 900,
    cursor: "pointer",
    fontSize: 11,
    lineHeight: 1.1,
    whiteSpace: "nowrap",
  } as React.CSSProperties,

  chip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 8px",
    borderRadius: 999,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    color: "#475569",
    fontSize: 11,
    fontWeight: 900,
    whiteSpace: "nowrap",
  } as React.CSSProperties,
};

export default function StudentQuickOpen({
  studentId,
  label,
  ilp = false,
  returnTo,
  fullHref,
  showFullButton = false,
  muted = false,
  size = "md",
}: StudentQuickOpenProps) {
  const router = useRouter();
  const { openStudent } = useStudentQuickView();

  const buttonStyle =
    size === "sm"
      ? muted
        ? S.nameBtnMutedSm
        : S.nameBtnSm
      : muted
      ? S.nameBtnMutedMd
      : S.nameBtnMd;

  return (
    <span style={S.wrap}>
      <button
        type="button"
        style={buttonStyle}
        onClick={() => openStudent(studentId, { returnTo })}
        title="Open student quick view"
      >
        {label}
      </button>

      {ilp ? <span style={S.chip}>ILP</span> : null}

      {showFullButton ? (
        <button
          type="button"
          style={S.miniBtn}
          onClick={() =>
            router.push(fullHref || `/admin/students/${encodeURIComponent(studentId)}`)
          }
          title="Open full student profile"
        >
          Full profile
        </button>
      ) : null}
    </span>
  );
}