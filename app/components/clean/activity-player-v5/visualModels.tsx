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
  if (shape.startsWith("arrow-")) {
    const direction = shape.replace("arrow-", "");
    const rotation =
      direction === "right" ? 90 : direction === "down" ? 180 : direction === "left" ? 270 : 0;
    return (
      <span
        style={{
          width: size,
          height: size,
          display: "inline-grid",
          placeItems: "center",
          transform: `rotate(${rotation}deg)`,
        }}
      >
        <span
          style={{
            width: 0,
            height: 0,
            borderLeft: `${size * 0.32}px solid transparent`,
            borderRight: `${size * 0.32}px solid transparent`,
            borderBottom: `${size * 0.72}px solid ${v5Tokens.purple}`,
          }}
        />
      </span>
    );
  }

  if (shape.startsWith("angle-")) {
    const wide = shape === "angle-obtuse";
    const narrow = shape === "angle-acute";
    return (
      <span
        style={{
          width: size,
          height: size,
          position: "relative",
          display: "inline-block",
        }}
      >
        <span
          style={{
            position: "absolute",
            left: size * 0.18,
            bottom: size * 0.2,
            width: size * 0.62,
            height: 5,
            borderRadius: 999,
            background: v5Tokens.navy,
          }}
        />
        <span
          style={{
            position: "absolute",
            left: size * 0.18,
            bottom: size * 0.2,
            width: size * 0.62,
            height: 5,
            borderRadius: 999,
            background: v5Tokens.navy,
            transformOrigin: "left center",
            transform: `rotate(${wide ? -135 : narrow ? -38 : -90}deg)`,
          }}
        />
      </span>
    );
  }

  if (shape === "star") {
    return (
      <span
        style={{
          width: size,
          height: size,
          clipPath:
            "polygon(50% 0%, 61% 35%, 98% 35%, 68% 56%, 79% 91%, 50% 70%, 21% 91%, 32% 56%, 2% 35%, 39% 35%)",
          background: v5Tokens.amber,
          border: `3px solid ${v5Tokens.navy}`,
          display: "inline-block",
        }}
      />
    );
  }

  if (shape === "tree") {
    return (
      <span style={{ display: "inline-grid", justifyItems: "center", width: size }}>
        <span
          style={{
            width: 0,
            height: 0,
            borderLeft: `${size * 0.38}px solid transparent`,
            borderRight: `${size * 0.38}px solid transparent`,
            borderBottom: `${size * 0.7}px solid ${v5Tokens.green}`,
          }}
        />
        <span style={{ width: size * 0.18, height: size * 0.24, background: "#9A6B3F" }} />
      </span>
    );
  }

  if (shape === "house") {
    return (
      <span style={{ display: "inline-grid", justifyItems: "center", width: size }}>
        <span
          style={{
            width: 0,
            height: 0,
            borderLeft: `${size * 0.46}px solid transparent`,
            borderRight: `${size * 0.46}px solid transparent`,
            borderBottom: `${size * 0.42}px solid ${v5Tokens.red}`,
          }}
        />
        <span
          style={{
            width: size * 0.72,
            height: size * 0.5,
            border: `3px solid ${v5Tokens.navy}`,
            background: v5Tokens.blue,
            display: "inline-block",
          }}
        />
      </span>
    );
  }

  if (shape === "pond") {
    return (
      <span
        style={{
          width: size,
          height: size * 0.62,
          borderRadius: "52% 44% 56% 48%",
          border: `3px solid ${v5Tokens.navy}`,
          background: "#BAE6FD",
          display: "inline-block",
        }}
      />
    );
  }

  if (shape === "bed" || shape === "wall" || shape === "block") {
    return <span style={{ width: size * 1.25, height: size * 0.56, border: `3px solid ${v5Tokens.navy}`, background: shape === "wall" ? "#E2E8F0" : v5Tokens.blue, borderRadius: 10, display: "inline-block" }} />;
  }

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
