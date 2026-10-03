import React from "react";
import type { CurrencyTokenStimulus } from "@/lib/clean/assessments/mylearnaAssessTypes";
import { describeCurrencyTokens } from "@/lib/clean/assessments/visualTemplates/visualAccessibility";

type Denomination = CurrencyTokenStimulus["tokens"][number]["denomination"];

// Royal Australian Mint nominal specifications. The renderer uses only geometry,
// relative size and denomination labels; it does not reproduce coin artwork.
// https://www.ramint.gov.au/collect/national-coin-collection/circulating-coins
const COIN_DIAMETER_MM: Partial<Record<Denomination, number>> = {
  "5c": 19.41,
  "10c": 23.6,
  "20c": 28.65,
  "50c": 31.65,
  "$1": 25,
  "$2": 20.5,
};

function isNote(denomination: Denomination) {
  return denomination.startsWith("$") && Number(denomination.slice(1)) >= 5;
}

function dodecagonPoints(size: number) {
  const radius = size / 2 - 2;
  const center = size / 2;
  return Array.from({ length: 12 }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / 12;
    return `${center + Math.cos(angle) * radius},${center + Math.sin(angle) * radius}`;
  }).join(" ");
}

function CoinToken({ denomination }: { denomination: Denomination }) {
  const diameterMm = COIN_DIAMETER_MM[denomination] || 24;
  const size = Math.round(diameterMm * 2.35);
  const gold = denomination === "$1" || denomination === "$2";
  const fill = gold ? "#F3E7B3" : "#EEF2F7";
  const fontSize = Math.max(12, Math.round(size * 0.29));

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      style={{ display: "block", overflow: "visible" }}
    >
      {denomination === "50c" ? (
        <polygon
          points={dodecagonPoints(size)}
          fill={fill}
          stroke="#17204B"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      ) : (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 2}
          fill={fill}
          stroke="#17204B"
          strokeWidth="2.5"
        />
      )}
      <text
        x="50%"
        y="52%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize={fontSize}
        fontWeight="800"
        fill="#17204B"
      >
        {denomination}
      </text>
    </svg>
  );
}

function NoteToken({ denomination }: { denomination: Denomination }) {
  return (
    <div
      aria-hidden="true"
      style={{
        minWidth: 92,
        minHeight: 48,
        border: "2px solid #17204B",
        borderRadius: 10,
        background: "#F8FAFC",
        display: "grid",
        placeItems: "center",
        padding: "6px 12px",
        color: "#17204B",
        fontWeight: 900,
        fontSize: 18,
      }}
    >
      {denomination}
    </div>
  );
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
          flexWrap: data.layout === "row" ? "nowrap" : "wrap",
          justifyContent: "center",
          alignItems: "center",
          gap: 18,
          minHeight: 92,
          overflowX: data.layout === "row" ? "auto" : "visible",
        }}
      >
        {tokens.map((token, index) => (
          <div
            key={`${token.denomination}-${index}`}
            data-testid="currency-token"
            data-denomination={token.denomination}
            style={{
              minWidth: 82,
              minHeight: 82,
              display: "grid",
              placeItems: "center",
            }}
          >
            {isNote(token.denomination) ? (
              <NoteToken denomination={token.denomination} />
            ) : (
              <CoinToken denomination={token.denomination} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
