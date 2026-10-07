import type { Metadata } from "next";
import Link from "next/link";
import type React from "react";
import AssessmentAccessGate from "@/app/components/clean/assessment-lab/AssessmentAccessGate";
import { CurrencyTokenVisual } from "@/lib/clean/assessments/visualTemplates/CurrencyTokenVisual";
import { NUMBER_OPERATIONS_ASSET_APPROVALS } from "@/lib/clean/assessments/placement/numberOperationsAssetApprovals";

export const metadata: Metadata = {
  title: "Currency Asset Review | MyLearna",
  description:
    "Staff-only approval record for the Australian currency schematic used by the Number & Operations starting-point utility.",
  robots: { index: false, follow: false },
};

const approval = NUMBER_OPERATIONS_ASSET_APPROVALS.find(
  (candidate) => candidate.id === "australian-currency-schematic-v1",
);

const panel: React.CSSProperties = {
  border: "1px solid #E1E6F0",
  borderRadius: 18,
  background: "#FFFFFF",
  padding: 16,
  display: "grid",
  gap: 10,
};

function CoinProof({
  title,
  width,
  tokens,
}: {
  title: string;
  width: 390 | 430;
  tokens: Array<{
    denomination:
      | "5c"
      | "10c"
      | "20c"
      | "50c"
      | "$1"
      | "$2"
      | "$5"
      | "$10"
      | "$20"
      | "$50"
      | "$100";
  }>;
}) {
  return (
    <section style={{ ...panel, width: "100%", maxWidth: width, boxSizing: "border-box" }}>
      <strong style={{ color: "#17204B" }}>{title}</strong>
      <small style={{ color: "#64748B" }}>{width}px review frame</small>
      <CurrencyTokenVisual
        data={{ layout: "row", tokens }}
        altText={`Australian coin review set: ${tokens
          .map((token) => token.denomination)
          .join(", ")}.`}
      />
    </section>
  );
}

export default function MathsStartingPointCurrencyAssetReviewPage() {
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
            maxWidth: 980,
            margin: "0 auto",
            display: "grid",
            gap: 18,
          }}
        >
          <section style={panel}>
            <span
              style={{
                color: "#92400E",
                fontSize: 12,
                fontWeight: 900,
                textTransform: "uppercase",
              }}
            >
              Staff-only trusted asset review
            </span>
            <h1 style={{ margin: 0, color: "#17204B" }}>
              Australian currency schematic v1
            </h1>
            <p style={{ margin: 0, color: "#4B5563", lineHeight: 1.6 }}>
              This asset is <strong>{approval?.status || "pending-review"}</strong> after
              human visual review. This asset-level decision does not approve
              customer release or enable any release gate.
            </p>
            <nav aria-label="Trusted asset QA shortcuts" style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <Link href="/assessments/maths-starting-point/visual-review#historical-qa-77">Historical QA 77</Link>
              <Link href="/assessments/maths-starting-point/visual-review#historical-qa-79">Historical QA 79</Link>
              <Link href="/assessments/maths-starting-point/visual-review#historical-qa-141">Historical QA 141</Link>
              <Link href="/assessments/maths-starting-point/visual-review#all-base-ten-visuals">All base-ten visuals</Link>
              <Link href="/assessments/maths-starting-point/visual-review#all-currency-visuals">All currency visuals</Link>
            </nav>
          </section>

          <section style={panel}>
            <strong style={{ color: "#17204B" }}>Approval criteria</strong>
            <ol style={{ margin: 0, paddingLeft: 20, color: "#4B5563", lineHeight: 1.6 }}>
              {(approval?.reviewCriteria || []).map((criterion) => (
                <li key={criterion}>{criterion}</li>
              ))}
            </ol>
          </section>

          <div style={{ display: "grid", gap: 16 }}>
            <CoinProof
              title="All coin denominations · 390px"
              width={390}
              tokens={[
                { denomination: "5c" },
                { denomination: "10c" },
                { denomination: "20c" },
                { denomination: "50c" },
                { denomination: "$1" },
                { denomination: "$2" },
              ]}
            />
            <CoinProof
              title="All coin denominations · 430px"
              width={430}
              tokens={[
                { denomination: "5c" },
                { denomination: "10c" },
                { denomination: "20c" },
                { denomination: "50c" },
                { denomination: "$1" },
                { denomination: "$2" },
              ]}
            />
            <CoinProof
              title="P1 face-value item · 390px"
              width={390}
              tokens={[
                { denomination: "50c" },
                { denomination: "$1" },
                { denomination: "$2" },
              ]}
            />
            <CoinProof
              title="P2 ordering item · 390px"
              width={390}
              tokens={[
                { denomination: "$2" },
                { denomination: "20c" },
                { denomination: "$1" },
                { denomination: "50c" },
              ]}
            />
            <CoinProof
              title="P2 counting item · 390px"
              width={390}
              tokens={[
                { denomination: "20c" },
                { denomination: "$1" },
                { denomination: "20c" },
                { denomination: "50c" },
                { denomination: "20c" },
              ]}
            />
          </div>

          <section style={{ ...panel, background: "#FFFDF5", borderColor: "#F5D08A" }}>
            <strong style={{ color: "#92400E" }}>Review outcome is not changed here</strong>
            <span style={{ color: "#6B4F1D", lineHeight: 1.55 }}>
              This page displays the recorded human asset decision. It does not mutate
              the approval registry, customer release gates or persistence state.
            </span>
          </section>
        </div>
      </main>
    </AssessmentAccessGate>
  );
}
