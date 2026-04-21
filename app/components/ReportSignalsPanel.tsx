"use client";

type Props = {
  studentId?: string;
  studentName?: string;
};

export default function ReportSignalsPanel({ studentId, studentName }: Props) {
  if (!studentId) return null;

  return (
    <section
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 24,
        background: "#ffffff",
        padding: 24,
        boxShadow: "0 15px 32px rgba(15,23,42,0.08)",
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 900,
          letterSpacing: 1,
          color: "#64748b",
          textTransform: "uppercase",
        }}
      >
        Report signals
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 24,
          fontWeight: 900,
          color: "#0f172a",
        }}
      >
        Temporarily unavailable
      </div>
      <p style={{ marginTop: 10, fontSize: 14, color: "#475569" }}>
        Reporting guidance for {studentName ?? "this learner"} is temporarily unavailable during
        rebuild.
      </p>
    </section>
  );
}
