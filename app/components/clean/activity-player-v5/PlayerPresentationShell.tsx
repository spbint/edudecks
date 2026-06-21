import type { CSSProperties, ReactNode } from "react";
import { v5Tokens } from "@/app/components/clean/activity-player-v5/visualModels";

export function PlayerProgress({
  current,
  total,
  progress,
  tone = "practise",
}: {
  current: number;
  total: number;
  progress: number;
  tone?: "practise" | "assess";
}) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          color: v5Tokens.slate,
          fontSize: 13,
          fontWeight: 720,
        }}
      >
        <span>
          Question {current} of {total}
        </span>
        <span style={modeBadgeStyle(tone)}>{tone === "assess" ? "Assess" : "Practise"}</span>
      </div>
      <div style={progressTrackStyle}>
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: tone === "assess" ? v5Tokens.green : v5Tokens.purple,
          }}
        />
      </div>
    </div>
  );
}

export function SymbolicStrip({ items }: { items: string[] }) {
  if (!items.length) return null;

  return (
    <div
      aria-label="Mathematical notation"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        alignItems: "center",
      }}
    >
      {items.map((item) => (
        <span
          key={item}
          style={{
            border: `1px solid ${v5Tokens.border}`,
            borderRadius: 999,
            background: "#FFFFFF",
            color: v5Tokens.navy,
            padding: "7px 11px",
            fontSize: 14,
            fontWeight: 760,
            lineHeight: 1.2,
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export function PlayerPanel({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "hint" | "success" | "error";
}) {
  const toneStyles =
    tone === "success"
      ? { borderColor: "rgba(47,157,104,0.35)", background: v5Tokens.mint }
      : tone === "error"
        ? { borderColor: "rgba(232,93,117,0.35)", background: v5Tokens.softRed }
        : tone === "hint"
          ? { borderColor: "rgba(108,77,246,0.2)", background: "#FBFAFF" }
          : {};

  return (
    <section
      style={{
        border: `1px solid ${v5Tokens.border}`,
        borderRadius: 18,
        background: "#FFFFFF",
        padding: 14,
        display: "grid",
        gap: 10,
        boxShadow: "0 8px 20px rgba(23,32,75,0.04)",
        ...toneStyles,
      }}
    >
      {children}
    </section>
  );
}

export function playerButtonStyle(variant: "primary" | "secondary" = "primary") {
  return {
    border: variant === "primary" ? 0 : `1px solid ${v5Tokens.border}`,
    borderRadius: 999,
    background: variant === "primary" ? v5Tokens.purple : "#FFFFFF",
    color: variant === "primary" ? "#FFFFFF" : v5Tokens.navy,
    padding: "10px 14px",
    minHeight: 42,
    font: "inherit",
    fontSize: 14,
    fontWeight: 760,
    cursor: "pointer",
    boxShadow: variant === "primary" ? "0 8px 16px rgba(108,77,246,0.16)" : "none",
  } satisfies CSSProperties;
}

export function modeBadgeStyle(mode: "practise" | "assess") {
  return {
    borderRadius: 999,
    border: `1px solid ${mode === "assess" ? "rgba(47,157,104,0.3)" : "rgba(108,77,246,0.24)"}`,
    background: mode === "assess" ? v5Tokens.mint : v5Tokens.lavender,
    color: mode === "assess" ? v5Tokens.green : v5Tokens.purple,
    padding: "5px 9px",
    fontSize: 12,
    fontWeight: 760,
    lineHeight: 1,
  } satisfies CSSProperties;
}

export const playerShellStyle = {
  minHeight: "100%",
  background: v5Tokens.page,
  padding: "clamp(14px, 2.4vw, 24px)",
} satisfies CSSProperties;

export const playerContentStyle = {
  maxWidth: 1040,
  margin: "0 auto",
  display: "grid",
  gap: 14,
} satisfies CSSProperties;

export const playerHeaderStyle = {
  border: `1px solid ${v5Tokens.border}`,
  borderRadius: 20,
  background: "#FFFFFF",
  padding: "clamp(16px, 2.2vw, 22px)",
  display: "grid",
  gap: 12,
  boxShadow: "0 8px 24px rgba(23,32,75,0.045)",
} satisfies CSSProperties;

export const progressTrackStyle = {
  height: 6,
  borderRadius: 999,
  background: "#E9ECF5",
  overflow: "hidden",
} satisfies CSSProperties;
