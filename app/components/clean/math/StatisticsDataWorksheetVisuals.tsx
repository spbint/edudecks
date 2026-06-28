import React from "react";

type DisplayKind = "after-school" | "pets" | "ice-cream" | "transport" | "rainfall" | "claim";

type CategoryDatum = {
  label: string;
  value: number;
  icon?: string;
  color?: string;
};

const afterSchoolData: CategoryDatum[] = [
  { label: "Sport", value: 12, icon: "ball", color: "#0ea5e9" },
  { label: "Craft", value: 8, icon: "star", color: "#f97316" },
  { label: "Music", value: 6, icon: "note", color: "#8b5cf6" },
  { label: "Reading", value: 4, icon: "book", color: "#22c55e" },
  { label: "Video games", value: 10, icon: "game", color: "#ef4444" },
];

const petsData: CategoryDatum[] = [
  { label: "Dog", value: 6, icon: "dog", color: "#f59e0b" },
  { label: "Cat", value: 5, icon: "cat", color: "#8b5cf6" },
  { label: "Fish", value: 3, icon: "fish", color: "#06b6d4" },
  { label: "Bird", value: 2, icon: "bird", color: "#22c55e" },
  { label: "Other", value: 4, icon: "dot", color: "#64748b" },
];

const iceCreamData: CategoryDatum[] = [
  { label: "Chocolate", value: 10, color: "#92400e" },
  { label: "Vanilla", value: 6, color: "#eab308" },
  { label: "Strawberry", value: 8, color: "#e11d48" },
  { label: "Mint", value: 4, color: "#10b981" },
];

const transportData: CategoryDatum[] = [
  { label: "Car", value: 7, icon: "car", color: "#2563eb" },
  { label: "Bus", value: 5, icon: "bus", color: "#f97316" },
  { label: "Walk", value: 4, icon: "walk", color: "#16a34a" },
  { label: "Bike", value: 2, icon: "bike", color: "#0f766e" },
  { label: "Other", value: 1, icon: "dot", color: "#64748b" },
];

const rainfallData = [
  { label: "Mon", value: 15 },
  { label: "Tue", value: 25 },
  { label: "Wed", value: 40 },
  { label: "Thu", value: 30 },
  { label: "Fri", value: 20 },
  { label: "Sat", value: 15 },
  { label: "Sun", value: 10 },
];

const visualBySuffix: Record<string, DisplayKind> = {
  "001": "after-school",
  "002": "after-school",
  "003": "after-school",
  "004": "after-school",
  "005": "pets",
  "006": "pets",
  "007": "ice-cream",
  "008": "ice-cream",
  "009": "transport",
  "010": "rainfall",
  "011": "rainfall",
  "012": "rainfall",
};

function suffixFromId(id: string) {
  return String(id || "").slice(-3);
}

export function isStatisticsDataStep8Activity(id: string) {
  const value = String(id || "");
  return value.startsWith("statistics-data-step-8-assess-") || value.startsWith("statistics-data-step-8-practice-");
}

function getDisplayKind(id: string): DisplayKind {
  return visualBySuffix[suffixFromId(id)] ?? "claim";
}

const cardStyle: React.CSSProperties = {
  border: "2px solid #bfdbfe",
  borderRadius: 18,
  background: "#ffffff",
  padding: 14,
  display: "grid",
  gap: 12,
  boxShadow: "0 10px 24px rgba(15,23,42,0.07)",
};

const titleStyle: React.CSSProperties = {
  color: "#0f172a",
  fontSize: 16,
  fontWeight: 900,
  lineHeight: 1.2,
};

function Icon({ type, color = "#2563eb" }: { type?: string; color?: string }) {
  const stroke = "#1f2937";
  if (type === "book") {
    return <rect x="8" y="7" width="18" height="22" rx="3" fill={color} stroke={stroke} strokeWidth="2" />;
  }
  if (type === "note") {
    return (
      <>
        <path d="M18 7v17" stroke={stroke} strokeWidth="3" />
        <path d="M18 7h12v5H18z" fill={color} stroke={stroke} strokeWidth="2" />
        <circle cx="14" cy="25" r="5" fill={color} stroke={stroke} strokeWidth="2" />
      </>
    );
  }
  if (type === "car" || type === "bus") {
    return (
      <>
        <rect x="5" y="12" width="28" height="13" rx="4" fill={color} stroke={stroke} strokeWidth="2" />
        <circle cx="12" cy="27" r="3" fill="#111827" />
        <circle cx="27" cy="27" r="3" fill="#111827" />
      </>
    );
  }
  if (type === "bike") {
    return (
      <>
        <circle cx="11" cy="25" r="6" fill="none" stroke={stroke} strokeWidth="2" />
        <circle cx="28" cy="25" r="6" fill="none" stroke={stroke} strokeWidth="2" />
        <path d="M11 25l8-10 9 10M19 15l-2 10h11" fill="none" stroke={color} strokeWidth="3" />
      </>
    );
  }
  if (type === "fish") {
    return <path d="M7 19c5-8 16-8 21 0-5 8-16 8-21 0Zm21 0 6-5v10z" fill={color} stroke={stroke} strokeWidth="2" />;
  }
  if (type === "bird") {
    return <path d="M8 22c8-14 19-14 24-1-8-3-15-2-24 1Z" fill={color} stroke={stroke} strokeWidth="2" />;
  }
  if (type === "dog" || type === "cat") {
    return (
      <>
        <circle cx="20" cy="18" r="9" fill={color} stroke={stroke} strokeWidth="2" />
        <path d="M12 11l-4-4M28 11l4-4" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
      </>
    );
  }
  if (type === "star") {
    return <path d="M20 5l4 10 10 1-8 7 3 10-9-5-9 5 3-10-8-7 10-1z" fill={color} stroke={stroke} strokeWidth="2" />;
  }
  if (type === "game") {
    return <rect x="6" y="12" width="28" height="16" rx="7" fill={color} stroke={stroke} strokeWidth="2" />;
  }
  return <circle cx="20" cy="20" r="10" fill={color} stroke={stroke} strokeWidth="2" />;
}

function Pictograph({ title, data, keyLabel, unit = 1 }: { title: string; data: CategoryDatum[]; keyLabel: string; unit?: number }) {
  return (
    <div style={cardStyle}>
      <div style={{ ...titleStyle, color: "#075985" }}>{title}</div>
      <div style={{ display: "grid", gap: 7 }}>
        {data.map((item) => {
          const count = Math.ceil(item.value / unit);
          return (
            <div key={item.label} style={{ display: "grid", gridTemplateColumns: "88px 1fr auto", gap: 8, alignItems: "center" }}>
              <strong style={{ color: "#334155", fontSize: 13 }}>{item.label}</strong>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                {Array.from({ length: count }).map((_, index) => (
                  <svg key={`${item.label}-${index}`} viewBox="0 0 40 34" style={{ width: 28, height: 24 }} aria-hidden="true">
                    <Icon type={item.icon} color={item.color} />
                  </svg>
                ))}
              </div>
              <span style={{ color: "#0f172a", fontSize: 12, fontWeight: 800 }}>{item.value}</span>
            </div>
          );
        })}
      </div>
      <div style={{ border: "1px solid #bae6fd", borderRadius: 999, background: "#f0f9ff", color: "#0369a1", padding: "6px 9px", fontSize: 12, fontWeight: 800, width: "fit-content" }}>
        Key: {keyLabel}
      </div>
    </div>
  );
}

function BarGraph() {
  return (
    <div style={cardStyle}>
      <div style={{ ...titleStyle, color: "#9a3412" }}>Ice Cream Flavours</div>
      <div style={{ display: "grid", gap: 8 }}>
        {iceCreamData.map((item) => (
          <div key={item.label} style={{ display: "grid", gridTemplateColumns: "92px 1fr 28px", gap: 8, alignItems: "center" }}>
            <strong style={{ color: "#334155", fontSize: 12 }}>{item.label}</strong>
            <div style={{ height: 22, borderRadius: 999, background: "#f1f5f9", overflow: "hidden" }}>
              <div style={{ width: `${item.value * 9}%`, height: "100%", borderRadius: 999, background: item.color }} />
            </div>
            <span style={{ color: "#0f172a", fontSize: 12, fontWeight: 900 }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RainfallGraph() {
  const points = rainfallData.map((item, index) => ({
    ...item,
    x: 24 + index * 38,
    y: 116 - item.value * 2.4,
  }));
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  return (
    <div style={cardStyle}>
      <div style={{ ...titleStyle, color: "#166534" }}>Weekly Rainfall (mm)</div>
      <svg viewBox="0 0 280 150" role="img" aria-label="Line graph for weekly rainfall" style={{ width: "100%", maxHeight: 190 }}>
        <line x1="24" y1="18" x2="24" y2="116" stroke="#94a3b8" strokeWidth="2" />
        <line x1="24" y1="116" x2="260" y2="116" stroke="#94a3b8" strokeWidth="2" />
        {[10, 20, 30, 40].map((value) => (
          <g key={value}>
            <line x1="24" x2="260" y1={116 - value * 2.4} y2={116 - value * 2.4} stroke="#e2e8f0" />
            <text x="2" y={120 - value * 2.4} fontSize="9" fill="#64748b">{value}</text>
          </g>
        ))}
        <polyline points={line} fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="5" fill="#ffffff" stroke="#2563eb" strokeWidth="3" />
            <text x={point.x} y="137" textAnchor="middle" fontSize="10" fill="#334155" fontWeight="700">{point.label}</text>
          </g>
        ))}
      </svg>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(92px, 1fr))", gap: 6 }}>
        {[
          ["Maximum", "40 mm"],
          ["Minimum", "10 mm"],
          ["Range", "30 mm"],
          ["Total", "155 mm"],
          ["Mean", "22 mm"],
        ].map(([label, value]) => (
          <div key={label} style={{ border: "1px solid #bbf7d0", borderRadius: 10, background: "#f0fdf4", padding: 7 }}>
            <div style={{ color: "#166534", fontSize: 11, fontWeight: 800 }}>{label}</div>
            <div style={{ color: "#0f172a", fontSize: 15, fontWeight: 900 }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Reminder() {
  return (
    <div style={{ ...cardStyle, borderColor: "#fed7aa", background: "#fff7ed" }}>
      <div style={{ ...titleStyle, color: "#9a3412" }}>Data claim reminder</div>
      <div style={{ color: "#334155", lineHeight: 1.45, fontSize: 14 }}>
        A data claim is a statement based on information shown in the display. A strong claim names the evidence.
      </div>
      <div style={{ border: "1px solid #fdba74", borderRadius: 12, background: "#ffffff", padding: 10, color: "#7c2d12", fontWeight: 800 }}>
        Example: More students chose sport than reading.
      </div>
    </div>
  );
}

export function renderStatisticsDataStep8PromptVisual(id: string) {
  if (!isStatisticsDataStep8Activity(id)) return null;
  const kind = getDisplayKind(id);
  if (kind === "after-school") {
    return <Pictograph title="Favourite After-School Activity" data={afterSchoolData} keyLabel="1 ball = 2 students" unit={2} />;
  }
  if (kind === "pets") {
    return <Pictograph title="Pets in the Class" data={petsData} keyLabel="1 icon = 1 student" />;
  }
  if (kind === "ice-cream") return <BarGraph />;
  if (kind === "transport") {
    return <Pictograph title="Transport to School" data={transportData} keyLabel="1 icon = 1 student" />;
  }
  if (kind === "rainfall") return <RainfallGraph />;
  return <Reminder />;
}

export function renderStatisticsDataStep8OptionCard({
  option,
  selected = false,
}: {
  option: string;
  selected?: boolean;
}) {
  const text = String(option || "").trim();
  if (!text) return null;
  const lower = text.toLowerCase();
  const label =
    lower.includes("?") || lower.startsWith("which") || lower.startsWith("how")
      ? "Question"
      : lower.includes("more") || lower.includes("most") || lower.includes("least") || lower.includes("same")
        ? "Claim"
        : /^\d/.test(lower)
          ? "Value"
          : "Choice";

  return (
    <div
      style={{
        border: `2px solid ${selected ? "#2563eb" : "#bfdbfe"}`,
        borderRadius: 16,
        background: selected ? "#eff6ff" : "#ffffff",
        color: "#172554",
        minHeight: 112,
        padding: 12,
        display: "grid",
        placeItems: "center",
        gap: 8,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: text.length > 54 ? 13 : text.length > 28 ? 15 : 20, fontWeight: 900, lineHeight: 1.18 }}>
        {text}
      </div>
      <div style={{ border: "1px solid #bae6fd", borderRadius: 999, background: "#f0f9ff", color: "#0369a1", padding: "4px 8px", fontSize: 11, fontWeight: 900 }}>
        {label}
      </div>
    </div>
  );
}
