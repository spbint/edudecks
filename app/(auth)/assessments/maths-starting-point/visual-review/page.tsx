import type { Metadata } from "next";
import Link from "next/link";
import React from "react";
import AssessmentAccessGate from "@/app/components/clean/assessment-lab/AssessmentAccessGate";
import {
  getTrustedMathAssetCoverage,
  type TrustedCurrencyVisualAuditEntry,
} from "@/lib/clean/assessments/interactivePlayer/trustedMathAssetCoverage";
import type { CurrencyTokenStimulus } from "@/lib/clean/assessments/mylearnaAssessTypes";
import { AssessmentStimulus } from "@/lib/clean/assessments/visualTemplates/AssessmentStimulus";
import { CurrencyTokenVisual } from "@/lib/clean/assessments/visualTemplates/CurrencyTokenVisual";

export const metadata: Metadata = {
  title: "Starting Point Trusted Asset Review | MyLearna",
  description:
    "Staff-only 390px and 430px review of every active base-ten and Australian-currency visual in the Number & Operations starting-point utility.",
  robots: { index: false, follow: false },
};

const panel: React.CSSProperties = {
  border: "1px solid #E1E6F0",
  borderRadius: 18,
  background: "#FFFFFF",
  padding: 16,
  display: "grid",
  gap: 10,
  boxSizing: "border-box",
};

const coverage = getTrustedMathAssetCoverage();
const historicalQaByItemId = new Map<string, number>(
  coverage.historicalQa.map((reference) => [
    reference.itemId,
    reference.qaNumber,
  ]),
);

function CurrencyAuditVisual({ entry }: { entry: TrustedCurrencyVisualAuditEntry }) {
  if (entry.source === "canonical-stimulus") {
    return <AssessmentStimulus stimulus={entry.item.stimulus} />;
  }

  return (
    <CurrencyTokenVisual
      data={{
        layout: "row",
        tokens: entry.denominations.map((denomination) => ({
          denomination: denomination as CurrencyTokenStimulus["tokens"][number]["denomination"],
        })),
      }}
      altText={`${entry.denominations.length} Australian coins are shown for the presentation-only counting stimulus.`}
    />
  );
}

function ReviewFrame({
  title,
  itemId,
  prompt,
  source,
  frameWidth,
  anchorId,
  children,
}: {
  title: string;
  itemId: string;
  prompt: string;
  source: string;
  frameWidth: 390 | 430;
  anchorId?: string;
  children: React.ReactNode;
}) {
  return (
    <article
      id={anchorId}
      style={{
        ...panel,
        width: "100%",
        maxWidth: frameWidth,
        margin: "0 auto",
        contentVisibility: "auto",
        containIntrinsicSize: "520px",
      }}
    >
      <small style={{ color: "#64748B", fontWeight: 800 }}>
        {frameWidth}px phone review frame · {source}
      </small>
      <div style={{ display: "grid", gap: 3 }}>
        <strong style={{ color: "#17204B" }}>{title}</strong>
        <span style={{ color: "#64748B", fontSize: 12 }}>{itemId}</span>
      </div>
      <p style={{ margin: 0, color: "#17204B", lineHeight: 1.6 }}>{prompt}</p>
      {children}
    </article>
  );
}

function SectionHeading({ id, title, detail }: { id: string; title: string; detail: string }) {
  return (
    <header id={id} style={{ ...panel, scrollMarginTop: 16 }}>
      <h2 style={{ margin: 0, color: "#17204B" }}>{title}</h2>
      <p style={{ margin: 0, color: "#4B5563", lineHeight: 1.6 }}>{detail}</p>
    </header>
  );
}

export default function MathsStartingPointVisualReviewPage() {
  const otherCanonicalVisuals = coverage.activeItems.filter(
    (entry) =>
      entry.item.stimulus.type !== "none" &&
      entry.item.stimulus.type !== "place-value-blocks" &&
      entry.item.stimulus.type !== "currency-tokens",
  );

  return (
    <AssessmentAccessGate mode="lab">
      <main style={{ minHeight: "100vh", background: "#F7F8FC", padding: "clamp(18px, 4vw, 42px)" }}>
        <div style={{ maxWidth: 980, margin: "0 auto", display: "grid", gap: 18 }}>
          <section style={panel}>
            <span style={{ color: "#92400E", fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>
              Staff-only trusted mathematical asset QA
            </span>
            <h1 style={{ margin: 0, color: "#17204B" }}>Base-ten and Australian currency visuals</h1>
            <p style={{ margin: 0, color: "#4B5563", lineHeight: 1.6 }}>
              This read-only surface covers every active initial-placement and fresh-recheck use of the trusted asset families at 390px and 430px. It does not alter item status, scorer behaviour, routing, asset approval, release gates or customer visibility.
            </p>
            <nav aria-label="Trusted asset QA shortcuts" style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
              <Link href="#historical-qa-77">Historical QA 77</Link>
              <Link href="#historical-qa-79">Historical QA 79</Link>
              <Link href="#historical-qa-141">Historical QA 141</Link>
              <Link href="#all-base-ten-visuals">All base-ten visuals</Link>
              <Link href="#all-currency-visuals">All currency visuals</Link>
            </nav>
          </section>

          <SectionHeading
            id="all-base-ten-visuals"
            title={`All active base-ten visuals · ${coverage.baseTenVisuals.length}`}
            detail="The three historical rejects are the complete active base-ten family: two counting-process items and one Number & place value item. Each is shown in both required phone frames."
          />
          {coverage.baseTenVisuals.flatMap((entry) => {
            const qaNumber = historicalQaByItemId.get(entry.item.id);
            return ([390, 430] as const).map((frameWidth) => (
              <ReviewFrame
                key={`${entry.item.id}-${frameWidth}`}
                anchorId={frameWidth === 390 && qaNumber ? `historical-qa-${qaNumber}` : undefined}
                title={qaNumber ? `Historical QA ${qaNumber}` : "Base-ten visual"}
                itemId={entry.item.id}
                prompt={entry.item.prompt}
                source={`${entry.coverage.form} · ${entry.coverage.progressionTarget}`}
                frameWidth={frameWidth}
              >
                <AssessmentStimulus stimulus={entry.item.stimulus} />
              </ReviewFrame>
            ));
          })}

          <SectionHeading
            id="all-currency-visuals"
            title={`All active currency visuals · ${coverage.currencyVisuals.length}`}
            detail="This includes six canonical coin stimuli and five presentation-only repeated-coin stimuli across Understanding Money. All use the same trusted Australian coin specification."
          />
          {coverage.currencyVisuals.flatMap((entry) =>
            ([390, 430] as const).map((frameWidth) => (
              <ReviewFrame
                key={`${entry.item.id}-${entry.source}-${frameWidth}`}
                title={entry.source === "canonical-stimulus" ? "Canonical coin stimulus" : "Presentation-only repeated coins"}
                itemId={entry.item.id}
                prompt={entry.item.prompt}
                source={`${entry.coverage.form} · ${entry.coverage.progressionTarget}`}
                frameWidth={frameWidth}
              >
                <CurrencyAuditVisual entry={entry} />
              </ReviewFrame>
            )),
          )}

          <SectionHeading
            id="other-score-bearing-visuals"
            title={`Other active canonical visuals · ${otherCanonicalVisuals.length}`}
            detail="Retained for regression review; these are outside this base-ten and currency remediation batch."
          />
          {otherCanonicalVisuals.map((entry) => (
            <ReviewFrame
              key={entry.item.id}
              title={entry.item.stimulus.type}
              itemId={entry.item.id}
              prompt={entry.item.prompt}
              source={`${entry.coverage.form} · ${entry.coverage.progressionTarget}`}
              frameWidth={390}
            >
              <AssessmentStimulus stimulus={entry.item.stimulus} />
            </ReviewFrame>
          ))}

          <section style={{ ...panel, borderColor: "#CFE3D5", background: "#F7FCF8" }}>
            <strong style={{ color: "#166534" }}>Review outcome is recorded elsewhere</strong>
            <span style={{ color: "#4B5563", lineHeight: 1.55 }}>
              Currency is human visually approved at the asset level. This route cannot publish items, enable persistence, enable customer release, or begin real-route integration.
            </span>
          </section>
        </div>
      </main>
    </AssessmentAccessGate>
  );
}
