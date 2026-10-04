import type { Metadata } from "next";
import Link from "next/link";
import AssessmentAccessGate from "@/app/components/clean/assessment-lab/AssessmentAccessGate";
import MathsStartingPointWorkspace from "@/app/components/clean/assessment-starting-point/MathsStartingPointWorkspace";

export const metadata: Metadata = {
  title: "Number & Operations Starting Point | MyLearna",
  description:
    "A staff-gated preview of MyLearna's parent-facing Number & Operations starting-point utility.",
  robots: { index: false, follow: false },
};

export default function MathsStartingPointPage() {
  return (
    <AssessmentAccessGate mode="lab">
      <main
        style={{
          minHeight: "100vh",
          background: "#F7F8FC",
          padding: "clamp(18px, 4vw, 42px)",
        }}
      >
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            display: "grid",
            gap: 20,
          }}
        >
          <section
            style={{
              border: "1px solid #DDE4EE",
              borderRadius: 24,
              background: "#FFFFFF",
              padding: "clamp(20px, 4vw, 32px)",
              display: "grid",
              gap: 10,
            }}
          >
            <span
              style={{
                color: "#166534",
                fontSize: 12,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: ".05em",
              }}
            >
              Staff preview · future parent utility
            </span>
            <h1
              style={{
                margin: 0,
                color: "#17204B",
                fontSize: "clamp(32px, 5vw, 48px)",
              }}
            >
              Find a useful starting point in Number & Operations
            </h1>
            <p
              style={{
                margin: 0,
                maxWidth: 780,
                color: "#4B5563",
                lineHeight: 1.65,
                fontSize: 16,
              }}
            >
              MyLearna checks several parts of Number and Operations separately,
              then turns the result into practical next learning rather than one
              overall maths score.
            </p>
            <Link
              href="/assessments/maths-starting-point/asset-review"
              style={{
                width: "fit-content",
                color: "#92400E",
                fontSize: 13,
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              Staff: review pending Australian currency schematic
            </Link>
          </section>
          <MathsStartingPointWorkspace />
        </div>
      </main>
    </AssessmentAccessGate>
  );
}
