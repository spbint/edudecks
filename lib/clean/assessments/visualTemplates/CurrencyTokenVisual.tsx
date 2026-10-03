import React from "react";
import type { CurrencyTokenStimulus } from "@/lib/clean/assessments/mylearnaAssessTypes";
import { describeCurrencyTokens } from "@/lib/clean/assessments/visualTemplates/visualAccessibility";

function isNote(denomination: CurrencyTokenStimulus["tokens"][number]["denomination"]) {
  return denomination.startsWith("$") && Number(denomination.slice(1)) >= 5;
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
          display: "grid",
          gridTemplateColumns:
            data.layout === "row"
              ? `repeat(${Math.max(1, tokens.length)}, minmax(54px, 1fr))`
              : "repeat(auto-fit, minmax(72px, 1fr))",
          gap: 12,
          alignItems: "center",
        }}
      >
        {tokens.map((token, index) => {
          const note = isNote(token.denomination);
          return (
            <div
              key={`${token.denomination}-${index}`}
              data-testid="currency-token"
              data-denomination={token.denomination}
              style={{
                minHeight: note ? 56 : 64,
                border: "2px solid #17204B",
                borderRadius: note ? 12 : 999,
                background: note ? "#F8FAFC" : "#F3F0FF",
                display: "grid",
                placeItems: "center",
                padding: note ? "8px 14px" : 8,
                color: "#17204B",
                fontWeight: 900,
                fontSize: note ? 18 : 17,
                letterSpacing: "-0.01em",
              }}
            >
              {token.denomination}
            </div>
          );
        })}
      </div>
    </div>
  );
}
