import type { CSSProperties, ReactNode } from "react";

export const v5Tokens = {
  page: "#F7F9FC",
  card: "#FFFFFF",
  navy: "#17204B",
  slate: "#5B6478",
  border: "#E7EAF2",
  purple: "#6C4DF6",
  lavender: "#F2EDFF",
  green: "#2F9D68",
  mint: "#ECFDF4",
  amber: "#F59E0B",
  softAmber: "#FFF7E6",
  red: "#E85D75",
  softRed: "#FFF0F3",
  blue: "#DBEAFE",
};

export function ModelBoard({
  children,
  label,
  style,
}: {
  children: ReactNode;
  label?: string;
  style?: CSSProperties;
}) {
  return (
    <section
      aria-label={label}
      style={{
        border: `1px solid ${v5Tokens.border}`,
        borderRadius: 22,
        background: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)",
        padding: 18,
        display: "grid",
        gap: 14,
        minHeight: 320,
        ...style,
      }}
    >
      {children}
    </section>
  );
}

export function ShapeIcon({ shape, size = 70 }: { shape: string; size?: number }) {
  const base: CSSProperties = {
    width: size,
    height: size,
    border: `3px solid ${v5Tokens.navy}`,
    background: v5Tokens.lavender,
    display: "inline-block",
  };

  if (shape === "circle" || shape === "sphere") {
    return <span style={{ ...base, borderRadius: 999 }} />;
  }

  if (shape === "triangle") {
    return (
      <span
        style={{
          width: 0,
          height: 0,
          borderLeft: `${size / 2}px solid transparent`,
          borderRight: `${size / 2}px solid transparent`,
          borderBottom: `${size}px solid ${v5Tokens.purple}`,
          display: "inline-block",
        }}
      />
    );
  }

  if (shape === "rectangle") {
    return <span style={{ ...base, width: size * 1.45, borderRadius: 10 }} />;
  }

  if (shape === "cube") {
    return (
      <span
        style={{
          ...base,
          borderRadius: 10,
          background: "linear-gradient(135deg, #DBEAFE 0%, #EEF2FF 55%, #C7D2FE 56%)",
          boxShadow: "10px 10px 0 #CBD5E1",
        }}
      />
    );
  }

  if (shape === "cylinder") {
    return (
      <span
        style={{
          ...base,
          width: size * 0.86,
          height: size * 1.15,
          borderRadius: "50% / 16%",
          background: "linear-gradient(90deg, #E0F2FE, #FFFFFF, #BAE6FD)",
        }}
      />
    );
  }

  return <span style={{ ...base, borderRadius: 10 }} />;
}

export function GridBoard({
  size = 5,
  children,
  label,
}: {
  size?: number;
  children?: ReactNode;
  label?: string;
}) {
  return (
    <div
      aria-label={label}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${size}, minmax(52px, 1fr))`,
        gap: 7,
        width: "100%",
        maxWidth: 560,
        justifySelf: "center",
      }}
    >
      {children}
    </div>
  );
}

export function GridCell({
  active,
  selected,
  children,
  onClick,
  onDrop,
  onDragOver,
}: {
  active?: boolean;
  selected?: boolean;
  children?: ReactNode;
  onClick?: () => void;
  onDrop?: React.DragEventHandler<HTMLButtonElement>;
  onDragOver?: React.DragEventHandler<HTMLButtonElement>;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onDrop={onDrop}
      onDragOver={onDragOver}
      style={{
        minHeight: 54,
        borderRadius: 12,
        border: `2px solid ${selected ? v5Tokens.green : active ? v5Tokens.purple : v5Tokens.border}`,
        background: selected ? v5Tokens.mint : active ? v5Tokens.lavender : "#FFFFFF",
        color: v5Tokens.navy,
        display: "grid",
        placeItems: "center",
        font: "inherit",
        fontSize: 12,
        fontWeight: 800,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {children}
    </button>
  );
}

export function ClockFace({ hour = 3, minute = 0 }: { hour?: number; minute?: number }) {
  const minuteDegrees = minute * 6;
  const hourDegrees = (hour % 12) * 30 + minute * 0.5;

  return (
    <div style={{ display: "grid", placeItems: "center" }}>
      <div style={{ width: 190, height: 190, borderRadius: 999, border: `5px solid ${v5Tokens.navy}`, background: "#FFFFFF", position: "relative" }}>
        {[12, 3, 6, 9].map((label) => (
          <span
            key={label}
            style={{
              position: "absolute",
              ...(label === 12 ? { top: 12, left: 0, right: 0, textAlign: "center" } : {}),
              ...(label === 3 ? { right: 16, top: 78 } : {}),
              ...(label === 6 ? { bottom: 10, left: 0, right: 0, textAlign: "center" } : {}),
              ...(label === 9 ? { left: 16, top: 78 } : {}),
              fontWeight: 900,
              color: v5Tokens.navy,
            }}
          >
            {label}
          </span>
        ))}
        <span style={{ position: "absolute", left: 91, top: 48, width: 7, height: 48, background: v5Tokens.purple, borderRadius: 999, transformOrigin: "bottom", transform: `rotate(${hourDegrees}deg)` }} />
        <span style={{ position: "absolute", left: 92, top: 26, width: 5, height: 70, background: v5Tokens.green, borderRadius: 999, transformOrigin: "bottom", transform: `rotate(${minuteDegrees}deg)` }} />
        <span style={{ position: "absolute", left: 83, top: 83, width: 22, height: 22, borderRadius: 999, background: v5Tokens.navy }} />
      </div>
    </div>
  );
}
