import React from "react";
import type { CurrencyTokenStimulus } from "@/lib/clean/assessments/mylearnaAssessTypes";
import { describeCurrencyTokens } from "@/lib/clean/assessments/visualTemplates/visualAccessibility";

type Denomination = CurrencyTokenStimulus["tokens"][number]["denomination"];

const COIN_DIAMETER_MM: Partial<Record<Denomination, number>> = {
  "5c": 19.41,
  "10c": 23.6,
  "20c": 28.65,
  "50c": 31.65,
  "$1": 25,
  "$2": 20.5,
};

const MAX_COIN_DIAMETER_MM = 31.65;
const MAX_RENDERED_COIN_PX = 72;

function isNote(denomination: Denomination) {
  return denomination.startsWith("$") && Number(denomination.slice(1)) >= 5;
}

function coinSize(denomination: Denomination) {
  const diameter = COIN_DIAMETER_MM[denomination] || MAX_COIN_DIAMETER_MM;
  return Math.round((diameter / MAX_COIN_DIAMETER_MM) * MAX_RENDERED_COIN_PX);
}

function tokenShape(denomination: Denomination) {
  if (denomination === "50c") {
    return {
      borderRadius: 0,
      clipPath:
        "polygon(50% 0%, 75% 6.7%, 93.3% 25%, 100% 50%, 93.3% 75%, 75% 93.3%, 50% 100%, 25% 93.3%, 6.7% 75%, 0% 50%, 6.7% 25%, 25% 6.7%)",
    };
  }
  return { borderRadius: 999, clipPath: "none" };
}

function tokenBackground(denomination: Denomination) {
  return denomination === "$1" || denomination === "$2" ? "#F7E7B2" : "#EEF2F7";
}

export function CurrencyTokenVisual({
  data,
  altText,
}: {
  data: CurrencyTokenStimulus;
  altText?: string;
}) {
  const label = altText || describeCurrencyTokens(data);
  const tokens = data.tokens.slice(0, 30);

  return (
    <div
      role="img"
      aria-label={label}
      style={{
        border: "1px solid #D9D0FF",
        borderRadius: 22,
        background: "#ffffff",
        padding: 18,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 14,
          alignItems: "center",
          justifyContent: data.layout === "row" ? "center" : "flex-start",
        }}
      >
        {tokens.map((token, index) => {
          const note = isNote(token.denomination);
          const diameterMm = COIN_DIAMETER_MM[token.denomination] || null;
          const size = note ? 76 : coinSize(token.denomination);
          const shape = note
            ? { borderRadius: 10, clipPath: "none" }
            : tokenShape(token.denomination);

          return (
            <div
              key={`${token.denomination}-${index}`}
              data-testid="currency-token"
              data-denomination={token.denomination}
              data-diameter-mm={diameterMm || undefined}
              style={{
                width: note ? 100 : size,
                height: note ? 54 : size,
                flex: "0 0 auto",
                border: "2px solid #17204B",
                borderRadius: shape.borderRadius,
                clipPath: shape.clipPath,
                background: note ? "#F8FAFC" : tokenBackground(token.denomination),
                display: "grid",
                placeItems: "center",
                color: "#17204B",
                fontWeight: 900,
                fontSize: note ? 18 : Math.max(13, Math.round(size * 0.28)),
                letterSpacing: "-0.01em",
                boxSizing: "border-box",
              }}
              title={
                diameterMm
                  ? `${token.denomination} schematic token · relative diameter ${diameterMm} mm`
                  : `${token.denomination} schematic money token`
              }
            >
              {token.denomination}
            </div>
          );
        })}
      </div>
    </div>
  );
}
