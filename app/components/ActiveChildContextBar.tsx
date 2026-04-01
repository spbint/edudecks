"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  useActiveStudent,
  activeStudentDisplayName,
} from "@/app/hooks/useActiveStudent";

const S = {
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    background: "#fff",
    padding: 16,
    marginBottom: 14,
  } as React.CSSProperties,

  row: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
  } as React.CSSProperties,

  left: {
    display: "grid",
    gap: 6,
  } as React.CSSProperties,

  subtle: {
    color: "#6b7280",
    fontSize: 11,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  } as React.CSSProperties,

  title: {
    fontSize: 18,
    fontWeight: 950,
    color: "#0f172a",
    lineHeight: 1.2,
  } as React.CSSProperties,

  text: {
    color: "#475569",
    fontWeight: 700,
    fontSize: 13,
    lineHeight: 1.45,
  } as React.CSSProperties,

  chipRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 6,
  } as React.CSSProperties,

  chip: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #dbe1ea",
    background: "#fff",
    color: "#0f172a",
    fontSize: 12,
    fontWeight: 900,
  } as React.CSSProperties,

  btnRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  } as React.CSSProperties,

  btn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #dbe1ea",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 900,
    cursor: "pointer",
  } as React.CSSProperties,

  info: {
    marginTop: 10,
    borderRadius: 12,
    border: "1px solid #bfdbfe",
    background: "#eff6ff",
    padding: 10,
    color: "#1d4ed8",
    fontWeight: 900,
  } as React.CSSProperties,

  warn: {
    marginTop: 10,
    borderRadius: 12,
    border: "1px solid #fde68a",
    background: "#fffbeb",
    padding: 10,
    color: "#92400e",
    fontWeight: 900,
  } as React.CSSProperties,
};

type Props = {
  showOpenProfile?: boolean;
  showOpenPortfolio?: boolean;
  showAddEvidence?: boolean;
};

export default function ActiveChildContextBar({
  showOpenProfile = true,
  showOpenPortfolio = true,
  showAddEvidence = true,
}: Props) {
  const router = useRouter();
  const { busy, err, student } = useActiveStudent();

  if (busy) {
    return <div style={S.info}>Loading active child…</div>;
  }

  if (!student) {
    return (
      <div style={S.warn}>
        No active child selected yet. Go to the parent dashboard or children page and choose a child first.
      </div>
    );
  }

  return (
    <div style={S.card}>
      <div style={S.row}>
        <div style={S.left}>
          <div style={S.subtle}>Active Child Context</div>
          <div style={S.title}>{activeStudentDisplayName(student)}</div>
          <div style={S.text}>
            Actions on this page can be guided by the currently selected learner.
          </div>

          <div style={S.chipRow}>
            {student.year_level != null ? <span style={S.chip}>Year {student.year_level}</span> : null}
            {student.is_ilp ? <span style={S.chip}>ILP</span> : null}
            <span style={S.chip}>{student.id.slice(0, 8)}</span>
          </div>
        </div>

        <div style={S.btnRow}>
          {showAddEvidence ? (
            <button
              style={S.btn}
              onClick={() =>
                router.push(`/admin/evidence-entry?studentId=${encodeURIComponent(student.id)}`)
              }
            >
              + Add evidence
            </button>
          ) : null}

          {showOpenProfile ? (
            <button
              style={S.btn}
              onClick={() => router.push(`/admin/students/${encodeURIComponent(student.id)}`)}
            >
              Open profile
            </button>
          ) : null}

          {showOpenPortfolio ? (
            <button
              style={S.btn}
              onClick={() =>
                router.push(`/admin/students/${encodeURIComponent(student.id)}/portfolio`)
              }
            >
              Open portfolio
            </button>
          ) : null}

          <button style={S.btn} onClick={() => router.push("/children")}>
            Switch child
          </button>
        </div>
      </div>

      {err ? <div style={S.warn}>{err}</div> : null}
    </div>
  );
}