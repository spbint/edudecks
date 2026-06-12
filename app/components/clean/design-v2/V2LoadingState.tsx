import type React from "react";
import { v2Tokens } from "@/app/components/clean/design-v2/MyLearnaAppShellV2";

export default function V2LoadingState({
  title = "Getting things ready",
  body = "Your family workspace is loading.",
}: {
  title?: string;
  body?: string;
}) {
  const shimmerStyle: React.CSSProperties = {
    height: 10,
    borderRadius: 999,
    background: "linear-gradient(90deg, #EEF1F7 0%, #F8FAFD 48%, #EEF1F7 100%)",
  };

  return (
    <section
      style={{
        border: `1px solid ${v2Tokens.border}`,
        borderRadius: 20,
        background: v2Tokens.card,
        boxShadow: v2Tokens.shadow,
        padding: "clamp(16px, 3vw, 24px)",
        display: "grid",
        gap: 14,
      }}
    >
      <div style={{ display: "grid", gap: 6 }}>
        <div
          style={{
            color: v2Tokens.purple,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Loading
        </div>
        <strong style={{ color: v2Tokens.navy, fontSize: 18, fontWeight: 700 }}>{title}</strong>
        <p style={{ margin: 0, color: v2Tokens.slate, lineHeight: 1.6 }}>{body}</p>
      </div>
      <div style={{ display: "grid", gap: 8, maxWidth: 520 }} aria-hidden="true">
        <div style={{ ...shimmerStyle, width: "72%" }} />
        <div style={{ ...shimmerStyle, width: "92%" }} />
        <div style={{ ...shimmerStyle, width: "54%" }} />
      </div>
    </section>
  );
}
