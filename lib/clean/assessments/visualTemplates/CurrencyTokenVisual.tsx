import React, { useId } from "react";
import type { CurrencyTokenStimulus } from "@/lib/clean/assessments/mylearnaAssessTypes";
import {
  AUSTRALIAN_COIN_SPECIFICATIONS,
  getAustralianCoinRenderedDiameter,
  isAustralianCoinDenomination,
  type AustralianCoinDenomination,
} from "@/lib/clean/assessments/visualTemplates/trustedMathAssetSpecifications";
import { describeCurrencyTokens } from "@/lib/clean/assessments/visualTemplates/visualAccessibility";

type Denomination = CurrencyTokenStimulus["tokens"][number]["denomination"];

const MAX_RENDERED_COIN_PX = 82;

function polygonPoints(sides: number, radius = 47, centre = 50) {
  return Array.from({ length: sides }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / sides;
    return `${centre + Math.cos(angle) * radius},${centre + Math.sin(angle) * radius}`;
  }).join(" ");
}

function CoinShape({
  denomination,
  inset = false,
  ...props
}: {
  denomination: AustralianCoinDenomination;
  inset?: boolean;
} & React.SVGProps<SVGCircleElement | SVGPolygonElement>) {
  const sides = AUSTRALIAN_COIN_SPECIFICATIONS[denomination].sides;
  if (sides === 12) {
    return (
      <polygon
        points={polygonPoints(12, inset ? 39.5 : 47)}
        {...(props as React.SVGProps<SVGPolygonElement>)}
      />
    );
  }
  return (
    <circle
      cx="50"
      cy="50"
      r={inset ? 39.5 : 47}
      {...(props as React.SVGProps<SVGCircleElement>)}
    />
  );
}

function ClassroomCoinMotif({ denomination }: { denomination: AustralianCoinDenomination }) {
  switch (denomination) {
    case "5c":
      return (
        <g fill="none" stroke="currentColor" strokeWidth="2" opacity="0.45">
          <path d="M25 58 Q35 39 58 47 Q70 51 73 63 Q56 69 38 66 Q29 65 25 58Z" />
          {Array.from({ length: 7 }, (_, index) => (
            <line key={index} x1={35 + index * 5} y1={48 - (index % 2) * 3} x2={31 + index * 6} y2={36 - (index % 2) * 2} />
          ))}
        </g>
      );
    case "10c":
      return (
        <g fill="none" stroke="currentColor" strokeWidth="2" opacity="0.42">
          {Array.from({ length: 6 }, (_, index) => (
            <path key={index} d={`M50 63 Q${25 + index * 10} 42 ${28 + index * 8} 25`} />
          ))}
          <path d="M44 65 Q55 55 62 65" />
        </g>
      );
    case "20c":
      return (
        <g fill="none" stroke="currentColor" strokeWidth="2" opacity="0.42">
          <path d="M22 57 Q34 43 52 49 Q67 52 77 44 Q72 62 55 66 Q38 70 22 57Z" />
          <path d="M22 72 Q35 66 48 72 T76 70" />
          <circle cx="61" cy="51" r="1.8" fill="currentColor" />
        </g>
      );
    case "50c":
      return (
        <g fill="none" stroke="currentColor" opacity="0.4">
          <path d="M50 30 L66 37 L62 60 Q50 70 38 60 L34 37Z" strokeWidth="2.4" />
          <path d="M50 34 V62 M39 43 H61" strokeWidth="1.8" />
          <path d="M28 65 Q36 57 40 68 M72 65 Q64 57 60 68" strokeWidth="2" />
        </g>
      );
    case "$1":
      return (
        <g fill="none" stroke="currentColor" strokeWidth="2.1" opacity="0.43">
          {Array.from({ length: 5 }, (_, index) => (
            <path key={index} d={`M${27 + index * 10} ${67 - index * 5} q8 -12 16 -3 q-8 4 -14 13`} />
          ))}
        </g>
      );
    case "$2":
      return (
        <g fill="none" stroke="currentColor" opacity="0.42">
          <ellipse cx="46" cy="51" rx="16" ry="22" strokeWidth="2.1" />
          <path d="M38 48 Q47 42 55 49 M39 61 Q47 65 55 60" strokeWidth="1.7" />
          {[29, 39, 50, 61, 71].map((x, index) => (
            <circle key={x} cx={x} cy={25 + (index % 2) * 4} r="1.8" fill="currentColor" />
          ))}
        </g>
      );
  }
}

function AustralianCoin({ denomination }: { denomination: AustralianCoinDenomination }) {
  const gradientId = `coin-${useId().replace(/:/g, "")}`;
  const specification = AUSTRALIAN_COIN_SPECIFICATIONS[denomination];
  const size = getAustralianCoinRenderedDiameter(denomination, MAX_RENDERED_COIN_PX);
  const gold = specification.alloy === "gold";
  const faceStops = gold
    ? ["#FFF3B0", "#D7A52A", "#F6D66B"]
    : ["#FFFFFF", "#AEB8C4", "#E9EEF3"];

  return (
    <div
      data-testid="currency-token"
      data-asset-kind="australian-coin"
      data-denomination={denomination}
      data-diameter-mm={specification.diameterMm}
      data-coin-sides={specification.sides}
      style={{ width: size, height: size, flex: "0 0 auto" }}
      title={`${denomination} Australian coin · relative diameter ${specification.diameterMm} mm`}
    >
      <svg aria-hidden="true" viewBox="0 0 100 100" width="100%" height="100%" style={{ display: "block", overflow: "visible" }}>
        <defs>
          <radialGradient id={gradientId} cx="34%" cy="27%" r="76%">
            <stop offset="0%" stopColor={faceStops[0]} />
            <stop offset="58%" stopColor={faceStops[1]} />
            <stop offset="100%" stopColor={faceStops[2]} />
          </radialGradient>
        </defs>
        <ellipse cx="52" cy="96" rx="39" ry="5" fill="#0F172A" opacity="0.14" />
        <CoinShape denomination={denomination} fill={gold ? "#9B6B0B" : "#66717F"} transform="translate(0 2)" />
        <CoinShape denomination={denomination} fill={`url(#${gradientId})`} stroke={gold ? "#7C5508" : "#53606E"} strokeWidth="2.2" />
        <CoinShape denomination={denomination} inset fill="none" stroke={gold ? "#9A6B0E" : "#7D8995"} strokeWidth="1.3" strokeDasharray={denomination === "50c" ? undefined : "2.2 1.8"} />
        <g style={{ color: gold ? "#704B08" : "#46515D" }}>
          <ClassroomCoinMotif denomination={denomination} />
        </g>
        <text x="50" y="18" textAnchor="middle" fill={gold ? "#654507" : "#3D4854"} fontFamily="Arial, sans-serif" fontWeight="700" fontSize="7.5" letterSpacing="0.7">
          AUSTRALIA
        </text>
        <text x="50" y="58" textAnchor="middle" fill="#17204B" stroke={gold ? "#FBE7A0" : "#F8FAFC"} strokeWidth="3.4" paintOrder="stroke" fontFamily="Arial, sans-serif" fontWeight="900" fontSize={denomination.length > 2 ? "24" : "28"} letterSpacing="-1">
          {denomination}
        </text>
      </svg>
    </div>
  );
}

function AustralianNote({ denomination }: { denomination: Denomination }) {
  return (
    <div
      data-testid="currency-token"
      data-asset-kind="australian-note"
      data-denomination={denomination}
      style={{
        width: 108,
        height: 54,
        flex: "0 0 auto",
        border: "2px solid #315C49",
        borderRadius: 8,
        background: "linear-gradient(135deg, #E9F7EE, #BDE5C9)",
        display: "grid",
        placeItems: "center",
        color: "#173D2E",
        fontSize: 18,
        fontWeight: 900,
        boxSizing: "border-box",
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
  const allCoins = data.tokens.every((token) =>
    isAustralianCoinDenomination(token.denomination),
  );
  const label = allCoins && altText
    ? altText
        .replace(/Australian money tokens/gi, "Australian coins")
        .replace(/money tokens/gi, "coins")
        .replace(/\btokens\b/gi, "coins")
    : altText || describeCurrencyTokens(data);
  const tokens = data.tokens.slice(0, 30);

  return (
    <div
      role="img"
      aria-label={label}
      data-testid="trusted-australian-currency-visual"
      style={{
        width: "100%",
        boxSizing: "border-box",
        border: "1px solid #D7DEE8",
        borderRadius: 20,
        background: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)",
        padding: "clamp(12px, 4vw, 18px)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px 14px",
          alignItems: "center",
          justifyContent: data.layout === "row" ? "center" : "flex-start",
        }}
      >
        {tokens.map((token, index) => (
          isAustralianCoinDenomination(token.denomination) ? (
            <AustralianCoin key={`${token.denomination}-${index}`} denomination={token.denomination} />
          ) : (
            <AustralianNote key={`${token.denomination}-${index}`} denomination={token.denomination} />
          )
        ))}
      </div>
    </div>
  );
}
