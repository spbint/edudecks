"use client";

import React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import AdminLeftNav from "@/app/components/AdminLeftNav";
import StudentHubNav from "@/app/admin/components/StudentHubNav";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export default function StudentSharePage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const studentId = safe(params?.id);
  const returnTo = safe(searchParams?.get("returnTo"));

  const profileHref = returnTo
    ? `/admin/students/${encodeURIComponent(studentId)}?returnTo=${encodeURIComponent(returnTo)}`
    : `/admin/students/${encodeURIComponent(studentId)}`;

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#0f172a",
        fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <AdminLeftNav />

      <main
        style={{
          flex: 1,
          padding: 24,
        }}
      >
        <StudentHubNav studentId={studentId} />

        <div
          style={{
            maxWidth: 1080,
            margin: "0 auto",
            display: "grid",
            gap: 18,
          }}
        >
          <section
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 24,
              padding: 24,
              boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#64748b",
                marginBottom: 10,
              }}
            >
              Student profile
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: 32,
                lineHeight: 1.1,
                fontWeight: 900,
                color: "#0f172a",
              }}
            >
              Share
            </h1>

            <p
              style={{
                margin: "12px 0 0",
                fontSize: 15,
                lineHeight: 1.65,
                color: "#475569",
                maxWidth: 760,
              }}
            >
              This is a safe production placeholder for the student share page so
              the project can complete a valid build. You can replace it later
              with the full sharing workflow once deployment is stable.
            </p>
          </section>

          <section
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 20,
              padding: 20,
              boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
              display: "grid",
              gap: 14,
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              Quick navigation
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href={profileHref} style={styles.primaryButton}>
                Back to student profile
              </Link>

              <Link
                href={`/admin/students/${encodeURIComponent(studentId)}/timeline`}
                style={styles.secondaryButton}
              >
                Open timeline
              </Link>

              <Link
                href={`/admin/students/${encodeURIComponent(studentId)}/portfolio`}
                style={styles.secondaryButton}
              >
                Open portfolio
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  primaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    background: "#2563eb",
    color: "#ffffff",
    border: "1px solid #2563eb",
    borderRadius: 12,
    padding: "10px 14px",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
  },
  secondaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    background: "#ffffff",
    color: "#0f172a",
    border: "1px solid #d1d5db",
    borderRadius: 12,
    padding: "10px 14px",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
  },
};