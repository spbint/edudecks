import React from "react";
import type { PlaceValueBlocksStimulus } from "@/lib/clean/assessments/mylearnaAssessTypes";
import { describePlaceValueBlocks } from "@/lib/clean/assessments/visualTemplates/visualAccessibility";
import { clampInteger } from "@/lib/clean/assessments/visualTemplates/visualUtils";

function BlockLabel({ children }: { children: React.ReactNode }) {
  return <span style={{ color: "#64748b", fontSize: 12, fontWeight: 850 }}>{children}</span>;
}

export function PlaceValueBlocksVisual({
  data,
  altText,
}: {
  data: PlaceValueBlocksStimulus;
  altText?: string;
}) {
  const thousands = clampInteger(data.thousands || 0, 0, 9, 0);
  const hundreds = clampInteger(data.hundreds || 0, 0, 9, 0);
  const tens = clampInteger(data.tens || 0, 0, 9, 0);
  const ones = clampInteger(data.ones || 0, 0, 9, 0);
  const label = altText || describePlaceValueBlocks({ ...data, thousands, hundreds, tens, ones });

  return (
    <div
      role="img"
      aria-label={label}
      style={{
        border: "1px solid #D9D0FF",
        borderRadius: 22,
        background: "#ffffff",
        padding: 18,
        display: "grid",
        gap: 16,
      }}
    >
      {thousands ? (
        <div style={{ display: "grid", gap: 8 }}>
          <BlockLabel>Thousands</BlockLabel>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Array.from({ length: thousands }, (_, index) => (
              <div
                key={index}
                data-testid="place-value-thousand"
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 12,
                  background: "#EDE9FE",
                  border: "2px solid #6C4DF6",
                  display: "grid",
                  placeItems: "center",
                  color: "#5B3BE8",
                  fontWeight: 900,
                }}
              >
                1000
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {hundreds ? (
        <div style={{ display: "grid", gap: 8 }}>
          <BlockLabel>Hundreds</BlockLabel>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Array.from({ length: hundreds }, (_, index) => (
              <svg key={index} data-testid="place-value-hundred" viewBox="0 0 70 70" width="54" height="54">
                <rect x="4" y="4" width="62" height="62" rx="8" fill="#EDE9FE" stroke="#6C4DF6" strokeWidth="2" />
                {Array.from({ length: 9 }, (_, line) => (
                  <React.Fragment key={line}>
                    <line x1={10 + line * 6} y1="4" x2={10 + line * 6} y2="66" stroke="#B9A8FF" strokeWidth="1" />
                    <line x1="4" y1={10 + line * 6} x2="66" y2={10 + line * 6} stroke="#B9A8FF" strokeWidth="1" />
                  </React.Fragment>
                ))}
              </svg>
            ))}
          </div>
        </div>
      ) : null}
      {tens ? (
        <div style={{ display: "grid", gap: 8 }}>
          <BlockLabel>Tens</BlockLabel>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Array.from({ length: tens }, (_, index) => (
              <div
                key={index}
                data-testid="place-value-ten"
                style={{
                  width: 16,
                  height: 76,
                  borderRadius: 8,
                  border: "2px solid #2F9D68",
                  background: "repeating-linear-gradient(to bottom, #DCFCE7 0 7px, #BBF7D0 7px 8px)",
                }}
              />
            ))}
          </div>
        </div>
      ) : null}
      <div style={{ display: "grid", gap: 8 }}>
        <BlockLabel>Ones</BlockLabel>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Array.from({ length: ones }, (_, index) => (
            <div
              key={index}
              data-testid="place-value-one"
              style={{
                width: 22,
                height: 22,
                borderRadius: 7,
                border: "2px solid #F59E0B",
                background: "#FEF3C7",
              }}
            />
          ))}
          {!thousands && !hundreds && !tens && !ones ? (
            <span style={{ color: "#64748b", fontWeight: 800 }}>No blocks shown</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
