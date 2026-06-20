"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";
import CleanContentIssueReportButton from "@/app/components/clean/CleanContentIssueReportButton";
import type {
  ActivityPlayerV4Props,
  ActivityPlayerV4Sample,
  ActivityPlayerV4VisualMode,
} from "@/app/components/clean/activity-player-v4/ActivityPlayerV4.types";

const tokens = {
  page: "#F7F9FC",
  card: "#FFFFFF",
  navy: "#17204B",
  slate: "#5B6478",
  purple: "#6C4DF6",
  lavender: "#F2EDFF",
  green: "#2F9D68",
  mint: "#ECFDF4",
  amber: "#F59E0B",
  softAmber: "#FFF7E6",
  red: "#E85D75",
  softRed: "#FFF0F3",
  border: "#E7EAF2",
};

type ObjectKind =
  | "apple"
  | "lemon"
  | "strawberry"
  | "book"
  | "pencil"
  | "coin"
  | "block"
  | "shell"
  | "sticker"
  | "cup"
  | "ticket"
  | "counter";

type ParsedVisual = {
  caption: string;
  numbers: string[];
  groups: number[];
  labels: string[];
  objectKind: ObjectKind;
};

const WORD_NUMBERS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
};

const OBJECT_WORDS: Array<[ObjectKind, string[]]> = [
  ["apple", ["apple", "apples"]],
  ["lemon", ["lemon", "lemons"]],
  ["strawberry", ["strawberry", "strawberries"]],
  ["book", ["book", "books"]],
  ["pencil", ["pencil", "pencils"]],
  ["coin", ["coin", "coins"]],
  ["block", ["block", "blocks"]],
  ["shell", ["shell", "shells"]],
  ["sticker", ["sticker", "stickers", "star"]],
  ["cup", ["cup", "cups"]],
  ["ticket", ["ticket", "tickets"]],
];

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function isRawVisualMetadata(value?: string | null) {
  const text = safe(value);
  return Boolean(
    text.startsWith("early-number|") ||
      /\|(?:caption|groups|labels|numbers)=/i.test(text),
  );
}

function cleanQuestionPrompt(value: string) {
  return safe(value).replace(/^\s*(?:Practise|Practice|Assess|Assessment)\s*:\s*/i, "");
}

function normalize(value: string) {
  return safe(value).toLowerCase().replace(/\s+/g, " ");
}

function isCorrect(sample: ActivityPlayerV4Sample, selected: string | null) {
  return Boolean(selected) && normalize(selected || "") === normalize(sample.expectedAnswer);
}

function extractList(description: string, key: "numbers" | "groups" | "labels") {
  const value = description.match(new RegExp(`${key}=([^|]+)`, "i"))?.[1];
  return value ? value.split(",").map((item) => safe(item)).filter(Boolean) : [];
}

function inferObjectKind(text: string): ObjectKind {
  const lower = text.toLowerCase();
  const match = OBJECT_WORDS.find(([, words]) => words.some((word) => lower.includes(word)));
  return match?.[0] ?? "counter";
}

function parseVisual(description?: string | null): ParsedVisual {
  const text = safe(description);
  const caption = text.match(/caption=([^|]+)/i)?.[1] ?? text;
  const numbers = extractList(text, "numbers");
  const labels = extractList(text, "labels");
  const groups = extractList(text, "groups")
    .map((item) => Number(item.replace(/[^\d.-]/g, "")))
    .filter((item) => Number.isFinite(item));

  return {
    caption,
    numbers,
    groups,
    labels,
    objectKind: inferObjectKind(`${caption} ${labels.join(" ")} ${text}`),
  };
}

function inferCount(value?: string | null) {
  const text = safe(value);
  const digit = text.match(/\b\d+\b/)?.[0];
  if (digit) return Number(digit);

  const lower = text.toLowerCase();
  const word = Object.keys(WORD_NUMBERS).find((key) => new RegExp(`\\b${key}\\b`).test(lower));
  return word ? WORD_NUMBERS[word] : null;
}

function isMathSymbolOption(option: string) {
  return /[\^*/=:$]|sqrt|km|kg|\$|cups?|hours?|h\b/i.test(option);
}

function parseSimpleFraction(value?: string | null) {
  const match = safe(value).match(/^(\d{1,2})\s*\/\s*(\d{1,2})$/);
  if (!match) return null;

  const numerator = Number(match[1]);
  const denominator = Number(match[2]);

  if (
    !Number.isInteger(numerator) ||
    !Number.isInteger(denominator) ||
    denominator <= 0 ||
    denominator > 12 ||
    numerator < 0
  ) {
    return null;
  }

  return {
    numerator: Math.min(numerator, denominator),
    denominator,
  };
}

function FractionStripVisual({
  numerator,
  denominator,
  mode,
}: {
  numerator: number;
  denominator: number;
  mode: ActivityPlayerV4VisualMode;
}) {
  const compact = mode === "compact";
  const height = compact ? 18 : mode === "feedback" ? 24 : 34;

  return (
    <div
      aria-label={`${numerator}/${denominator}`}
      style={{
        width: "100%",
        maxWidth: compact ? 92 : 220,
        minHeight: compact ? 28 : 48,
        display: "grid",
        alignItems: "center",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${denominator}, minmax(0, 1fr))`,
          gap: 2,
          border: `1px solid ${tokens.border}`,
          borderRadius: compact ? 8 : 12,
          background: "#FFFFFF",
          padding: compact ? 3 : 5,
          height,
          overflow: "hidden",
        }}
      >
        {Array.from({ length: denominator }, (_, index) => (
          <span
            key={index}
            style={{
              borderRadius: compact ? 4 : 6,
              background: index < numerator ? tokens.purple : "#EEF2F7",
              border: `1px solid ${index < numerator ? tokens.purple : tokens.border}`,
              minWidth: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ObjectGlyph({
  kind,
  size,
  index,
}: {
  kind: ObjectKind;
  size: number;
  index: number;
}) {
  const radius = Math.max(4, size / 2);
  const baseStyle = {
    width: size,
    height: size,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flex: "0 0 auto",
  } as const;

  if (kind === "coin") {
    return (
      <span aria-hidden="true" style={{ ...baseStyle, borderRadius: 999, background: "#FDE68A", border: "1px solid #F59E0B" }} />
    );
  }

  if (kind === "ticket") {
    return (
      <span
        aria-hidden="true"
        style={{
          ...baseStyle,
          width: size * 1.28,
          borderRadius: 4,
          background: "#EEF2FF",
          border: `1px solid ${tokens.purple}`,
        }}
      />
    );
  }

  if (kind === "book") {
    return (
      <span
        aria-hidden="true"
        style={{
          ...baseStyle,
          width: size * 0.82,
          borderRadius: 3,
          background: index % 2 ? "#DBEAFE" : tokens.lavender,
          border: `1px solid ${tokens.border}`,
        }}
      />
    );
  }

  if (kind === "pencil") {
    return (
      <span
        aria-hidden="true"
        style={{
          ...baseStyle,
          width: size * 1.45,
          height: Math.max(6, size * 0.34),
          borderRadius: 999,
          background: "#FDE68A",
          border: "1px solid #F59E0B",
        }}
      />
    );
  }

  if (kind === "block") {
    return (
      <span aria-hidden="true" style={{ ...baseStyle, borderRadius: 5, background: "#DBEAFE", border: `1px solid ${tokens.border}` }} />
    );
  }

  if (kind === "cup") {
    return (
      <span
        aria-hidden="true"
        style={{
          ...baseStyle,
          width: size * 0.9,
          height: size * 0.82,
          borderRadius: "4px 4px 8px 8px",
          background: "#E0F2FE",
          border: `1px solid ${tokens.border}`,
        }}
      />
    );
  }

  if (kind === "lemon") {
    return (
      <span
        aria-hidden="true"
        style={{
          ...baseStyle,
          borderRadius: `${radius}px ${radius + 5}px`,
          background: "#FDE047",
          border: "1px solid #EAB308",
          transform: "rotate(-18deg)",
        }}
      />
    );
  }

  if (kind === "strawberry") {
    return (
      <span
        aria-hidden="true"
        style={{
          ...baseStyle,
          borderRadius: "55% 55% 65% 65%",
          background: "#F87171",
          border: "1px solid #E85D75",
        }}
      />
    );
  }

  if (kind === "apple") {
    return (
      <span
        aria-hidden="true"
        style={{
          ...baseStyle,
          borderRadius: "48% 48% 55% 55%",
          background: "#FCA5A5",
          border: "1px solid #E85D75",
        }}
      />
    );
  }

  if (kind === "shell") {
    return (
      <span aria-hidden="true" style={{ ...baseStyle, borderRadius: "60% 40% 55% 45%", background: "#FDEDD3", border: `1px solid ${tokens.border}` }} />
    );
  }

  if (kind === "sticker") {
    return (
      <span aria-hidden="true" style={{ ...baseStyle, borderRadius: 999, background: tokens.softAmber, border: "1px solid #F59E0B" }} />
    );
  }

  return (
    <span aria-hidden="true" style={{ ...baseStyle, borderRadius: 999, background: tokens.purple }} />
  );
}

function CounterGroupVisual({
  count,
  mode,
  kind,
}: {
  count: number;
  mode: ActivityPlayerV4VisualMode;
  kind: ObjectKind;
}) {
  const compact = mode === "compact";
  const feedback = mode === "feedback";
  const size = compact ? 9 : feedback ? 12 : 18;
  const gap = compact ? 4 : feedback ? 6 : 10;
  const visibleCount = Math.max(0, Math.min(count, compact ? 12 : 24));

  return (
    <div
      aria-label={`${count} ${kind === "counter" ? "counters" : kind}`}
      style={{
        width: "100%",
        minHeight: compact ? 32 : feedback ? 42 : 118,
        maxHeight: compact ? 66 : feedback ? 78 : 170,
        border: `1px solid ${tokens.border}`,
        borderRadius: compact ? 10 : 16,
        background: compact ? "#F8FAFC" : "#FFFFFF",
        display: "grid",
        placeItems: "center",
        padding: compact ? 5 : feedback ? 9 : 16,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap,
          maxWidth: compact ? 82 : 220,
        }}
      >
        {Array.from({ length: visibleCount }, (_, index) => (
          <ObjectGlyph key={index} kind={kind} size={size} index={index} />
        ))}
      </div>
    </div>
  );
}

function NumberChipVisual({
  values,
  mode,
  caption,
}: {
  values: string[];
  mode: ActivityPlayerV4VisualMode;
  caption: string;
}) {
  const compact = mode === "compact";
  const feedback = mode === "feedback";

  return (
    <div
      aria-label={caption || values.join(", ")}
      style={{
        border: `1px solid ${tokens.border}`,
        borderRadius: compact ? 10 : 16,
        background: compact ? "#F8FAFC" : "#FFFFFF",
        padding: compact ? 5 : feedback ? 9 : 14,
        display: "flex",
        flexWrap: "wrap",
        gap: compact ? 4 : 8,
        alignItems: "center",
        justifyContent: compact ? "center" : "flex-start",
        maxHeight: compact ? 62 : undefined,
        overflow: "hidden",
      }}
    >
      {values.slice(0, compact ? 4 : 12).map((value, index) => (
        <span
          key={`${value}-${index}`}
          style={{
            border: `1px solid ${tokens.border}`,
            borderRadius: 999,
            background: compact ? "#FFFFFF" : tokens.lavender,
            color: tokens.navy,
            padding: compact ? "2px 6px" : "6px 10px",
            fontSize: compact ? 11 : 14,
            fontWeight: 600,
            lineHeight: 1.2,
            whiteSpace: "nowrap",
          }}
        >
          {value}
        </span>
      ))}
    </div>
  );
}

function SimpleTableVisual({
  values,
  mode,
  caption,
}: {
  values: string[];
  mode: ActivityPlayerV4VisualMode;
  caption: string;
}) {
  const compact = mode === "compact";
  const rows = values.filter(Boolean);

  if (compact) {
    return (
      <div
        aria-label={caption || rows.join(", ")}
        style={{
          border: `1px solid ${tokens.border}`,
          borderRadius: 10,
          background: "#F8FAFC",
          padding: 5,
          display: "grid",
          gap: 3,
          maxHeight: 66,
          overflow: "hidden",
        }}
      >
        {rows.slice(0, 3).map((row, index) => {
          const [left, right] = row.includes(":") ? row.split(":") : [row, ""];
          return (
            <div
              key={`${row}-${index}`}
              style={{
                display: "grid",
                gridTemplateColumns: right ? "1fr 1fr" : "1fr",
                gap: 3,
              }}
            >
              <span style={{ borderRadius: 5, background: "#FFFFFF", padding: "2px 4px", fontSize: 10, color: tokens.navy }}>{left}</span>
              {right ? <span style={{ borderRadius: 5, background: "#FFFFFF", padding: "2px 4px", fontSize: 10, color: tokens.navy }}>{right}</span> : null}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      aria-label={caption || rows.join(", ")}
      style={{
        border: `1px solid ${tokens.border}`,
        borderRadius: 16,
        background: "#FFFFFF",
        padding: 14,
        display: "grid",
        gap: 10,
      }}
    >
      {caption ? <div style={{ color: tokens.slate, fontSize: 13, fontWeight: 600 }}>{caption}</div> : null}
      <div style={{ display: "grid", gap: 6 }}>
        {rows.slice(0, 5).map((row, index) => {
          const [left, right] = row.includes(":") ? row.split(":") : [row, ""];
          return (
            <div
              key={`${row}-${index}`}
              style={{
                display: "grid",
                gridTemplateColumns: right ? "minmax(0, 1fr) minmax(0, 1fr)" : "1fr",
                gap: 6,
                alignItems: "center",
              }}
            >
              <span style={{ borderRadius: 10, background: "#F8FAFC", border: `1px solid ${tokens.border}`, padding: "7px 9px", fontSize: 13, color: tokens.navy }}>
                {left}
              </span>
              {right ? (
                <span style={{ borderRadius: 10, background: "#F8FAFC", border: `1px solid ${tokens.border}`, padding: "7px 9px", fontSize: 13, color: tokens.navy }}>
                  {right}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function hasAny(text: string, words: string[]) {
  const lower = text.toLowerCase();
  return words.some((word) => lower.includes(word));
}

function WorksheetPanel({
  caption,
  mode,
  children,
}: {
  caption: string;
  mode: ActivityPlayerV4VisualMode;
  children: React.ReactNode;
}) {
  const compact = mode === "compact";
  if (compact) return null;

  return (
    <div
      style={{
        border: `1px solid ${tokens.border}`,
        borderRadius: mode === "feedback" ? 14 : 18,
        background: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)",
        padding: mode === "feedback" ? 10 : 16,
        display: "grid",
        gap: mode === "feedback" ? 8 : 12,
      }}
    >
      {caption ? (
        <div style={{ color: tokens.slate, fontSize: 13, fontWeight: 650 }}>
          {caption}
        </div>
      ) : null}
      {children}
    </div>
  );
}

function ShapeGlyph({ shape, size = 54 }: { shape: string; size?: number }) {
  const lower = shape.toLowerCase();
  const base: React.CSSProperties = {
    width: size,
    height: size,
    display: "inline-block",
    border: `2px solid ${tokens.navy}`,
    background: tokens.lavender,
  };

  if (lower.includes("triangle")) {
    return (
      <span
        aria-label="triangle"
        style={{
          width: 0,
          height: 0,
          borderLeft: `${size / 2}px solid transparent`,
          borderRight: `${size / 2}px solid transparent`,
          borderBottom: `${size}px solid ${tokens.purple}`,
          display: "inline-block",
        }}
      />
    );
  }

  if (lower.includes("circle") || lower.includes("sphere")) {
    return <span aria-label={lower.includes("sphere") ? "sphere" : "circle"} style={{ ...base, borderRadius: 999 }} />;
  }

  if (lower.includes("rectangle") || lower.includes("door") || lower.includes("window")) {
    return <span aria-label="rectangle" style={{ ...base, width: size * 1.35, borderRadius: 8 }} />;
  }

  if (lower.includes("cube")) {
    return (
      <span
        aria-label="cube"
        style={{
          width: size,
          height: size,
          display: "inline-block",
          borderRadius: 8,
          background: "linear-gradient(135deg, #DBEAFE 0%, #EEF2FF 55%, #C7D2FE 56%)",
          border: `2px solid ${tokens.navy}`,
          boxShadow: "8px 8px 0 #CBD5E1",
        }}
      />
    );
  }

  if (lower.includes("cylinder")) {
    return (
      <span
        aria-label="cylinder"
        style={{
          width: size * 0.9,
          height: size * 1.15,
          borderRadius: "50% / 16%",
          background: "linear-gradient(90deg, #E0F2FE, #FFFFFF, #BAE6FD)",
          border: `2px solid ${tokens.navy}`,
          display: "inline-block",
        }}
      />
    );
  }

  if (lower.includes("pyramid")) {
    return (
      <span
        aria-label="pyramid"
        style={{
          width: 0,
          height: 0,
          borderLeft: `${size / 2}px solid transparent`,
          borderRight: `${size / 2}px solid transparent`,
          borderBottom: `${size}px solid #FDE68A`,
          filter: "drop-shadow(0 0 0 #17204B)",
          display: "inline-block",
        }}
      />
    );
  }

  return <span aria-label="square" style={{ ...base, borderRadius: 8 }} />;
}

function ShapeModelVisual({ caption, mode }: { caption: string; mode: ActivityPlayerV4VisualMode }) {
  const shapes = ["square", "circle", "triangle", "rectangle", "cube", "sphere", "cylinder", "pyramid"].filter((shape) =>
    caption.toLowerCase().includes(shape),
  );
  const resolved = shapes.length ? shapes : ["circle", "square", "triangle", "rectangle"];

  return (
    <WorksheetPanel caption={caption} mode={mode}>
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "end", justifyContent: "center", minHeight: 118 }}>
        {resolved.slice(0, 6).map((shape) => (
          <div key={shape} style={{ display: "grid", gap: 8, justifyItems: "center", color: tokens.slate, fontSize: 12, fontWeight: 650 }}>
            <ShapeGlyph shape={shape} />
            <span>{shape}</span>
          </div>
        ))}
      </div>
    </WorksheetPanel>
  );
}

function CoordinateGridVisual({ caption, mode }: { caption: string; mode: ActivityPlayerV4VisualMode }) {
  const labels = ["A", "B", "C", "D"];
  const objects = [
    { label: "house", col: 0, row: 0 },
    { label: "school", col: 2, row: 0 },
    { label: "park", col: 1, row: 2 },
    { label: "shop", col: 3, row: 1 },
    { label: "library", col: 0, row: 3 },
    { label: "pond", col: 3, row: 3 },
  ];

  return (
    <WorksheetPanel caption={caption} mode={mode}>
      <div style={{ display: "grid", gridTemplateColumns: "34px repeat(4, minmax(42px, 1fr))", gap: 4, alignItems: "stretch" }}>
        <span />
        {labels.map((label) => (
          <span key={label} style={{ textAlign: "center", color: tokens.slate, fontSize: 12, fontWeight: 700 }}>{label}</span>
        ))}
        {[1, 2, 3, 4].map((row) => (
          <React.Fragment key={row}>
            <span style={{ display: "grid", placeItems: "center", color: tokens.slate, fontSize: 12, fontWeight: 700 }}>{row}</span>
            {labels.map((label, col) => {
              const object = objects.find((item) => item.col === col && item.row === row - 1);
              return (
                <span
                  key={`${label}${row}`}
                  style={{
                    minHeight: 42,
                    border: `1px solid ${tokens.border}`,
                    borderRadius: 8,
                    background: object ? tokens.lavender : "#FFFFFF",
                    display: "grid",
                    placeItems: "center",
                    color: tokens.navy,
                    fontSize: 11,
                    fontWeight: 650,
                  }}
                >
                  {object?.label ?? ""}
                </span>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </WorksheetPanel>
  );
}

function RouteVisual({ caption, mode }: { caption: string; mode: ActivityPlayerV4VisualMode }) {
  return (
    <WorksheetPanel caption={caption} mode={mode}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(38px, 1fr))", gap: 5 }}>
        {Array.from({ length: 25 }, (_, index) => {
          const row = Math.floor(index / 5);
          const col = index % 5;
          const isRoute = (row === 3 && col >= 1 && col <= 3) || (col === 3 && row >= 1 && row <= 3) || (row === 1 && col === 2);
          return (
            <span
              key={index}
              style={{
                minHeight: 36,
                borderRadius: 8,
                border: `1px solid ${tokens.border}`,
                background: isRoute ? "#DBEAFE" : "#FFFFFF",
                display: "grid",
                placeItems: "center",
                color: tokens.navy,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {row === 3 && col === 1 ? "start" : row === 1 && col === 2 ? "finish" : isRoute ? "->" : ""}
            </span>
          );
        })}
      </div>
    </WorksheetPanel>
  );
}

function TransformationVisual({ caption, mode }: { caption: string; mode: ActivityPlayerV4VisualMode }) {
  const flip = caption.toLowerCase().includes("flip") || caption.toLowerCase().includes("mirror") || caption.toLowerCase().includes("reflect");
  const rotate = caption.toLowerCase().includes("rotate") || caption.toLowerCase().includes("turn");

  return (
    <WorksheetPanel caption={caption} mode={mode}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 54px 1fr", gap: 14, alignItems: "center" }}>
        <div style={{ minHeight: 96, border: `1px solid ${tokens.border}`, borderRadius: 14, background: "#FFFFFF", display: "grid", placeItems: "center" }}>
          <ShapeGlyph shape="triangle" size={52} />
        </div>
        <div style={{ textAlign: "center", color: tokens.purple, fontSize: 28, fontWeight: 800 }}>
          {flip ? "mirror" : rotate ? "turn" : "slide"}
        </div>
        <div style={{ minHeight: 96, border: `1px solid ${tokens.border}`, borderRadius: 14, background: "#FFFFFF", display: "grid", placeItems: "center" }}>
          <span style={{ transform: flip ? "scaleX(-1)" : rotate ? "rotate(90deg)" : "translateX(8px)", display: "inline-block" }}>
            <ShapeGlyph shape="triangle" size={52} />
          </span>
        </div>
      </div>
    </WorksheetPanel>
  );
}

function AngleVisual({ caption, mode }: { caption: string; mode: ActivityPlayerV4VisualMode }) {
  const lower = caption.toLowerCase();
  const acute = lower.includes("acute") || lower.includes("smaller");
  const obtuse = lower.includes("obtuse") || lower.includes("larger");
  const angle = acute ? 42 : obtuse ? 128 : 90;

  return (
    <WorksheetPanel caption={caption} mode={mode}>
      <div style={{ minHeight: 132, display: "grid", placeItems: "center" }}>
        <div style={{ width: 150, height: 110, position: "relative" }}>
          <span style={{ position: "absolute", left: 28, bottom: 28, width: 100, height: 5, background: tokens.navy, borderRadius: 999 }} />
          <span
            style={{
              position: "absolute",
              left: 28,
              bottom: 28,
              width: 98,
              height: 5,
              background: tokens.purple,
              borderRadius: 999,
              transformOrigin: "left center",
              transform: `rotate(-${angle}deg)`,
            }}
          />
          <span style={{ position: "absolute", left: 21, bottom: 21, width: 18, height: 18, borderRadius: 999, background: tokens.purple }} />
          <span style={{ position: "absolute", left: 50, bottom: 44, color: tokens.slate, fontSize: 12, fontWeight: 800 }}>
            {acute ? "acute" : obtuse ? "obtuse" : "right angle"}
          </span>
        </div>
      </div>
    </WorksheetPanel>
  );
}

function MeasurementToolVisual({ caption, mode }: { caption: string; mode: ActivityPlayerV4VisualMode }) {
  const lower = caption.toLowerCase();
  const clock = lower.includes("clock") || lower.includes("o'clock") || lower.includes("time");
  const jug = lower.includes("jug") || lower.includes("litre") || lower.includes("ml") || lower.includes("capacity");
  const scale = lower.includes("scale") || lower.includes("kg") || lower.includes("mass");

  return (
    <WorksheetPanel caption={caption} mode={mode}>
      {clock ? (
        <div style={{ display: "grid", placeItems: "center", minHeight: 128 }}>
          <div style={{ width: 112, height: 112, borderRadius: 999, border: `4px solid ${tokens.navy}`, background: "#FFFFFF", position: "relative" }}>
            <span style={{ position: "absolute", top: 10, left: 0, right: 0, textAlign: "center", fontWeight: 800 }}>12</span>
            <span style={{ position: "absolute", right: 12, top: 44, fontWeight: 800 }}>3</span>
            <span style={{ position: "absolute", bottom: 8, left: 0, right: 0, textAlign: "center", fontWeight: 800 }}>6</span>
            <span style={{ position: "absolute", left: 12, top: 44, fontWeight: 800 }}>9</span>
            <span style={{ position: "absolute", width: 4, height: 36, background: tokens.purple, left: 54, top: 20, transformOrigin: "bottom" }} />
            <span style={{ position: "absolute", width: 34, height: 4, background: tokens.purple, left: 54, top: 54, transformOrigin: "left" }} />
          </div>
        </div>
      ) : jug ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "end" }}>
          {[60, 90].map((height, index) => (
            <div key={height} style={{ display: "grid", gap: 6, justifyItems: "center" }}>
              <div style={{ width: 72, height: 112, border: `3px solid ${tokens.navy}`, borderRadius: "8px 8px 14px 14px", display: "flex", alignItems: "end", padding: 4, background: "#FFFFFF" }}>
                <span style={{ display: "block", width: "100%", height, borderRadius: 8, background: "#BAE6FD" }} />
              </div>
              <span style={{ color: tokens.slate, fontSize: 12, fontWeight: 700 }}>{index ? "1 L" : "500 mL"}</span>
            </div>
          ))}
        </div>
      ) : scale ? (
        <div style={{ display: "grid", placeItems: "center", minHeight: 128 }}>
          <div style={{ width: 150, height: 92, borderRadius: 18, border: `3px solid ${tokens.navy}`, background: "#FFFFFF", display: "grid", placeItems: "center" }}>
            <div style={{ width: 76, height: 40, borderRadius: "40px 40px 0 0", border: `2px solid ${tokens.border}`, borderBottom: 0, display: "grid", placeItems: "center", color: tokens.navy, fontWeight: 800 }}>kg</div>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ height: 36, borderRadius: 8, background: "#FDE68A", border: `2px solid ${tokens.navy}`, display: "grid", gridTemplateColumns: "repeat(10, 1fr)" }}>
            {Array.from({ length: 10 }, (_, index) => (
              <span key={index} style={{ borderLeft: index ? `1px solid ${tokens.navy}` : 0, color: tokens.navy, fontSize: 10, paddingLeft: 2 }}>{index}</span>
            ))}
          </div>
          <div style={{ height: 14, borderRadius: 999, background: "#FCA5A5", border: `1px solid ${tokens.red}` }} />
        </div>
      )}
    </WorksheetPanel>
  );
}

function NumberLineVisual({ caption, mode }: { caption: string; mode: ActivityPlayerV4VisualMode }) {
  return (
    <WorksheetPanel caption={caption} mode={mode}>
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ height: 54, position: "relative", margin: "0 8px" }}>
          <span style={{ position: "absolute", left: 0, right: 0, top: 26, height: 3, borderRadius: 999, background: tokens.navy }} />
          {Array.from({ length: 11 }, (_, index) => (
            <span key={index} style={{ position: "absolute", left: `${index * 10}%`, top: 18, transform: "translateX(-50%)", display: "grid", justifyItems: "center", gap: 4 }}>
              <span style={{ width: 2, height: 18, background: tokens.navy }} />
              <span style={{ color: tokens.slate, fontSize: 11, fontWeight: 700 }}>{index * 10}</span>
            </span>
          ))}
          <span style={{ position: "absolute", left: "30%", top: 4, width: "30%", height: 22, borderTop: `3px solid ${tokens.purple}`, borderRadius: "50% 50% 0 0" }} />
        </div>
      </div>
    </WorksheetPanel>
  );
}

function MoneyVisual({ caption, mode }: { caption: string; mode: ActivityPlayerV4VisualMode }) {
  return (
    <WorksheetPanel caption={caption} mode={mode}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
        {["10c", "20c", "50c", "$1", "$5"].map((label) => (
          <span
            key={label}
            style={{
              minWidth: label.includes("$5") ? 72 : 54,
              height: label.includes("$5") ? 38 : 54,
              borderRadius: label.includes("$5") ? 8 : 999,
              border: `2px solid ${tokens.navy}`,
              background: label.includes("$") ? "#DCFCE7" : "#FDE68A",
              display: "grid",
              placeItems: "center",
              color: tokens.navy,
              fontWeight: 800,
            }}
          >
            {label}
          </span>
        ))}
      </div>
    </WorksheetPanel>
  );
}

function FloorPlanVisual({ caption, mode }: { caption: string; mode: ActivityPlayerV4VisualMode }) {
  const rooms = [
    { label: "bed", area: "1 / 1 / 3 / 3", color: "#DBEAFE" },
    { label: "desk", area: "1 / 3 / 2 / 5", color: tokens.lavender },
    { label: "rug", area: "3 / 2 / 5 / 4", color: "#DCFCE7" },
    { label: "door", area: "4 / 4 / 5 / 5", color: "#FDE68A" },
  ];

  return (
    <WorksheetPanel caption={caption} mode={mode}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(44px, 1fr))", gridTemplateRows: "repeat(4, 44px)", gap: 5 }}>
        {Array.from({ length: 16 }, (_, index) => (
          <span key={index} style={{ border: `1px solid ${tokens.border}`, borderRadius: 8, background: "#FFFFFF" }} />
        ))}
        {rooms.map((room) => (
          <span
            key={room.label}
            style={{
              gridArea: room.area,
              border: `2px solid ${tokens.navy}`,
              borderRadius: 10,
              background: room.color,
              display: "grid",
              placeItems: "center",
              color: tokens.navy,
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            {room.label}
          </span>
        ))}
      </div>
    </WorksheetPanel>
  );
}

function ArrayOrPlaceValueVisual({ caption, mode }: { caption: string; mode: ActivityPlayerV4VisualMode }) {
  const placeValue = hasAny(caption, ["place value", "hundreds", "tens", "ones", "partition"]);
  return (
    <WorksheetPanel caption={caption} mode={mode}>
      {placeValue ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            ["Hundreds", 1],
            ["Tens", 4],
            ["Ones", 6],
          ].map(([label, count]) => (
            <div key={label} style={{ display: "grid", gap: 8, justifyItems: "center" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3, justifyContent: "center", minHeight: 58 }}>
                {Array.from({ length: Number(count) }, (_, index) => (
                  <span key={index} style={{ width: label === "Hundreds" ? 44 : label === "Tens" ? 10 : 14, height: label === "Hundreds" ? 44 : 44, background: "#DBEAFE", border: `1px solid ${tokens.navy}`, borderRadius: 3 }} />
                ))}
              </div>
              <span style={{ color: tokens.slate, fontSize: 12, fontWeight: 700 }}>{label}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 32px)", gridAutoRows: "32px", gap: 7, justifyContent: "center" }}>
          {Array.from({ length: 12 }, (_, index) => (
            <span key={index} style={{ borderRadius: 8, border: `1px solid ${tokens.navy}`, background: index % 4 < 3 ? "#DBEAFE" : tokens.lavender }} />
          ))}
        </div>
      )}
    </WorksheetPanel>
  );
}

function NetVisual({ caption, mode }: { caption: string; mode: ActivityPlayerV4VisualMode }) {
  const cells = [
    [1, 2],
    [2, 1],
    [2, 2],
    [2, 3],
    [2, 4],
    [3, 2],
  ];

  return (
    <WorksheetPanel caption={caption} mode={mode}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 46px)", gridTemplateRows: "repeat(3, 46px)", gap: 4, justifyContent: "center" }}>
        {Array.from({ length: 12 }, (_, index) => {
          const row = Math.floor(index / 4) + 1;
          const col = (index % 4) + 1;
          const active = cells.some(([cellRow, cellCol]) => cellRow === row && cellCol === col);
          return (
            <span
              key={index}
              style={{
                borderRadius: 6,
                border: active ? `2px solid ${tokens.navy}` : `1px dashed ${tokens.border}`,
                background: active ? tokens.lavender : "transparent",
              }}
            />
          );
        })}
      </div>
    </WorksheetPanel>
  );
}

function FractionDecimalModelVisual({ caption, mode }: { caption: string; mode: ActivityPlayerV4VisualMode }) {
  const percent = caption.toLowerCase().includes("percent") || caption.includes("%");
  const hundred = caption.toLowerCase().includes("hundred") || caption.includes("/100") || percent;
  const cells = hundred ? 100 : 10;
  const shaded = hundred ? 50 : 5;

  return (
    <WorksheetPanel caption={caption} mode={mode}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${hundred ? 10 : 10}, minmax(12px, 1fr))`,
          gap: 3,
          maxWidth: hundred ? 240 : 260,
          justifySelf: "center",
          width: "100%",
        }}
      >
        {Array.from({ length: cells }, (_, index) => (
          <span
            key={index}
            style={{
              aspectRatio: "1 / 1",
              borderRadius: 3,
              background: index < shaded ? tokens.purple : "#EEF2F7",
              border: `1px solid ${index < shaded ? tokens.purple : tokens.border}`,
            }}
          />
        ))}
      </div>
    </WorksheetPanel>
  );
}

function WorksheetModelVisual({
  description,
  mode,
}: {
  description?: string | null;
  mode: ActivityPlayerV4VisualMode;
}) {
  const text = safe(description);
  if (!text || mode === "compact") return null;
  const lower = text.toLowerCase();

  if (hasAny(lower, ["fraction", "decimal", "percent", "tenths", "hundredths", "/10", "/100", "%", "half", "quarter", "hundred grid"])) {
    return <FractionDecimalModelVisual caption={text} mode={mode} />;
  }

  if (hasAny(lower, ["number line", "numberline", "round", "jump"])) {
    return <NumberLineVisual caption={text} mode={mode} />;
  }

  if (hasAny(lower, ["angle", "acute", "obtuse", "right angle"])) {
    return <AngleVisual caption={text} mode={mode} />;
  }

  if (hasAny(lower, ["floor plan", "layout", "bedroom", "classroom", "playground", "park planner", "garden layout", "room"])) {
    return <FloorPlanVisual caption={text} mode={mode} />;
  }

  if (hasAny(lower, ["net", "fold", "faces", "edges", "corners"])) {
    return <NetVisual caption={text} mode={mode} />;
  }

  if (hasAny(lower, ["slide", "flip", "turn", "rotate", "rotation", "mirror", "reflect", "transformation"])) {
    return <TransformationVisual caption={text} mode={mode} />;
  }

  if (hasAny(lower, ["map", "coordinate", "grid", "compass", "north", "south", "east", "west"])) {
    return <CoordinateGridVisual caption={text} mode={mode} />;
  }

  if (hasAny(lower, ["route", "path", "follow", "directions", "move", "left", "right", "up", "down"])) {
    return <RouteVisual caption={text} mode={mode} />;
  }

  if (hasAny(lower, ["ruler", "measure", "cm", "metre", "meter", "litre", "liter", "ml", "clock", "time", "kg", "mass", "scale", "capacity", "jug"])) {
    return <MeasurementToolVisual caption={text} mode={mode} />;
  }

  if (hasAny(lower, ["coin", "money", "$", "cents", "price", "cost", "shopping"])) {
    return <MoneyVisual caption={text} mode={mode} />;
  }

  if (hasAny(lower, ["array", "groups", "equal groups", "place value", "hundreds", "tens", "ones", "partition", "blocks"])) {
    return <ArrayOrPlaceValueVisual caption={text} mode={mode} />;
  }

  if (hasAny(lower, ["shape", "circle", "square", "triangle", "rectangle", "cube", "sphere", "cylinder", "pyramid", "face", "edge", "corner", "net", "symmetry", "layout", "floor plan", "room", "architecture", "structure"])) {
    return <ShapeModelVisual caption={text} mode={mode} />;
  }

  return null;
}

function TextVisual({
  text,
  mode,
}: {
  text: string;
  mode: ActivityPlayerV4VisualMode;
}) {
  if (mode === "compact") return null;

  return (
    <div
      style={{
        border: `1px solid ${tokens.border}`,
        borderRadius: mode === "feedback" ? 14 : 16,
        background: "#F8FAFC",
        color: tokens.slate,
        padding: mode === "feedback" ? 10 : 14,
        fontSize: mode === "feedback" ? 13 : 14,
        lineHeight: 1.5,
      }}
    >
      {text}
    </div>
  );
}

function MathVisualRendererV4({
  description,
  option,
  mode,
  kind,
}: {
  description?: string | null;
  option?: string;
  mode: ActivityPlayerV4VisualMode;
  kind?: ActivityPlayerV4Sample["visualKind"];
}) {
  const parsed = parseVisual(description);
  const optionCount = inferCount(option);
  const supportCount = inferCount(parsed.caption || description);
  const resolvedKind = kind ?? (parsed.numbers.some((value) => value.includes(":")) ? "table" : "text");
  const objectKind = parsed.objectKind;
  const compact = mode === "compact";

  const worksheetVisual = WorksheetModelVisual({ description, mode });
  if (worksheetVisual) return worksheetVisual;

  if (compact && option) {
    const fraction = parseSimpleFraction(option);
    if (fraction) {
      return (
        <FractionStripVisual
          numerator={fraction.numerator}
          denominator={fraction.denominator}
          mode={mode}
        />
      );
    }

    if ((resolvedKind === "dots" || resolvedKind === "objects") && optionCount !== null && optionCount >= 0 && optionCount <= 12) {
      return <CounterGroupVisual count={optionCount} mode={mode} kind={objectKind} />;
    }

    if (resolvedKind === "table" && parsed.numbers.length) {
      return <SimpleTableVisual values={parsed.numbers} mode={mode} caption={parsed.caption} />;
    }

    if (resolvedKind === "numbers" && isMathSymbolOption(option)) {
      return <NumberChipVisual values={[option]} mode={mode} caption={option} />;
    }

    if (/^\s*\d+(\.\d+)?\s*$/.test(option) && Number(option) <= 12) {
      return <CounterGroupVisual count={Number(option)} mode={mode} kind="counter" />;
    }

    return null;
  }

  if (resolvedKind === "table" && parsed.numbers.length) {
    return <SimpleTableVisual values={parsed.numbers} mode={mode} caption={parsed.caption} />;
  }

  if (parsed.groups.length) {
    return (
      <div style={{ display: "grid", gap: mode === "feedback" ? 8 : 10 }}>
        {parsed.caption ? <div style={{ color: tokens.slate, fontSize: 13, fontWeight: 600 }}>{parsed.caption}</div> : null}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: 8 }}>
          {parsed.groups.slice(0, 6).map((count, index) => (
            <div key={`${count}-${index}`} style={{ display: "grid", gap: 5 }}>
              <CounterGroupVisual count={count} mode={mode} kind={objectKind} />
              {parsed.labels[index] ? (
                <span style={{ color: tokens.slate, fontSize: 12, textAlign: "center" }}>{parsed.labels[index]}</span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if ((resolvedKind === "dots" || resolvedKind === "objects") && supportCount !== null && supportCount >= 0 && supportCount <= 12) {
    return <CounterGroupVisual count={supportCount} mode={mode} kind={objectKind} />;
  }

  if (parsed.numbers.length) {
    return <NumberChipVisual values={parsed.numbers} mode={mode} caption={parsed.caption} />;
  }

  if (!description) return null;

  return <TextVisual text={parsed.caption} mode={mode} />;
}

function ActivityProgress({
  current,
  total,
  mode,
}: {
  current: number;
  total: number;
  mode: ActivityPlayerV4Sample["mode"];
}) {
  const progress = total ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;
  const color = mode === "assess" ? tokens.green : tokens.purple;

  return (
    <div style={{ display: "grid", gap: 7 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          color: tokens.slate,
          fontSize: 12,
          fontWeight: 550,
        }}
      >
        <span>Question {current} of {total}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div style={{ height: 5, borderRadius: 999, background: "#E9ECF5", overflow: "hidden" }}>
        <div style={{ width: `${progress}%`, height: "100%", background: color, borderRadius: 999 }} />
      </div>
    </div>
  );
}

function AnswerOptionV4({
  label,
  option,
  selected,
  submitted,
  correct,
  visualDescription,
  visualKind,
  onSelect,
}: {
  label: string;
  option: string;
  selected: boolean;
  submitted: boolean;
  correct: boolean;
  visualDescription?: string | null;
  visualKind?: ActivityPlayerV4Sample["visualKind"];
  onSelect: () => void;
}) {
  const borderColor = submitted && selected ? (correct ? tokens.green : tokens.red) : selected ? tokens.purple : tokens.border;
  const background = submitted && selected ? (correct ? tokens.mint : tokens.softRed) : selected ? tokens.lavender : "#FFFFFF";
  const stateLabel = submitted && selected ? (correct ? "Correct" : "Try again") : selected ? "Selected" : "";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${label}. ${option}${stateLabel ? `. ${stateLabel}` : ""}`}
      style={{
        minHeight: 54,
        border: `1px solid ${borderColor}`,
        borderRadius: 14,
        background,
        color: tokens.navy,
        padding: "9px 10px",
        display: "grid",
        gridTemplateColumns: "24px minmax(0, 1fr)",
        alignItems: "center",
        gap: 8,
        textAlign: "left",
        font: "inherit",
        cursor: "pointer",
        boxShadow: "none",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 22,
          height: 22,
          borderRadius: 999,
          border: `1px solid ${borderColor}`,
          background: "#FFFFFF",
          color: selected ? borderColor : tokens.slate,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 650,
        }}
      >
        {label}
      </span>
      <span style={{ display: "grid", gap: 6, minWidth: 0 }}>
        <span style={{ fontSize: 14, lineHeight: 1.32, fontWeight: 550 }}>{option}</span>
        <MathVisualRendererV4
          description={visualDescription}
          option={option}
          mode="compact"
          kind={visualKind}
        />
      </span>
    </button>
  );
}

function HintDrawerV4({ hint }: { hint?: string | null }) {
  if (!hint) return null;

  return (
    <details
      style={{
        border: `1px solid ${tokens.border}`,
        borderRadius: 14,
        background: "#FFFFFF",
        padding: "9px 11px",
      }}
    >
      <summary
        style={{
          cursor: "pointer",
          color: tokens.purple,
          fontSize: 13,
          fontWeight: 650,
          lineHeight: 1.35,
        }}
      >
        Need a hint?
      </summary>
      <div style={{ marginTop: 9, color: tokens.navy, fontSize: 13, lineHeight: 1.5 }}>
        {hint}
      </div>
    </details>
  );
}

function getPlayerHint(sample: ActivityPlayerV4Sample, mode: ActivityPlayerV4Sample["mode"]) {
  const hint = safe(sample.hint);
  if (!hint || isRawVisualMetadata(hint)) return null;
  if (mode === "assess") return null;
  return hint;
}

function FeedbackPanelV4({
  correct,
  feedback,
  visualDescription,
  visualKind,
}: {
  correct: boolean;
  feedback?: string | null;
  visualDescription?: string | null;
  visualKind?: ActivityPlayerV4Sample["visualKind"];
}) {
  return (
    <div
      role="status"
      style={{
        border: `1px solid ${correct ? "#BBF7D0" : "#FDE68A"}`,
        borderRadius: 15,
        background: correct ? tokens.mint : tokens.softAmber,
        color: tokens.navy,
        padding: 12,
        display: "grid",
        gap: 8,
      }}
    >
      <strong style={{ color: correct ? tokens.green : tokens.amber, fontSize: 14, fontWeight: 650 }}>
        {correct ? "Good thinking." : "Not quite."}
      </strong>
      {feedback ? <span style={{ fontSize: 13, lineHeight: 1.5 }}>{feedback}</span> : null}
      {visualDescription ? (
        <MathVisualRendererV4 description={visualDescription} mode="feedback" kind={visualKind} />
      ) : null}
    </div>
  );
}

export default function ActivityPlayerV4({
  samples,
  chrome = "standalone",
  previewLabel = "Activity Player V4 lab",
  showQuestionPicker = false,
  onSubmitAnswer,
  onComplete,
  allowNotSure = false,
  onNotSure,
}: ActivityPlayerV4Props) {
  const [sampleIndex, setSampleIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const sample = samples[sampleIndex] ?? samples[0];
  const answerLabels = useMemo(() => ["A", "B", "C", "D", "E", "F"], []);

  function moveToSample(index: number) {
    setSampleIndex(index);
    setSelected(null);
    setSubmitted(false);
  }

  if (!sample) {
    return null;
  }

  const effectiveMode = sample.mode;
  const displayPrompt = cleanQuestionPrompt(sample.prompt);
  const playerHint = getPlayerHint(sample, effectiveMode);
  const selectedCorrect = isCorrect(sample, selected);
  const hasNext = sampleIndex < samples.length - 1;
  const standalone = chrome === "standalone";

  return (
    <div style={{ minHeight: standalone ? "100vh" : "auto", background: tokens.page, color: tokens.navy }}>
      <style jsx global>{`
        @media (max-width: 860px) {
          .activity-v4-canvas-grid {
            grid-template-columns: 1fr !important;
          }
          .activity-v4-header {
            align-items: flex-start !important;
            flex-direction: column !important;
          }
          .activity-v4-answer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      {standalone ? (
        <header
          className="activity-v4-header"
          style={{
            minHeight: 58,
            borderBottom: `1px solid ${tokens.border}`,
            background: "rgba(247,249,252,0.94)",
            backdropFilter: "blur(14px)",
            padding: "10px clamp(12px, 3vw, 24px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <Link
            href="/my-pathways"
            style={{
              color: tokens.navy,
              textDecoration: "none",
              border: `1px solid ${tokens.border}`,
              background: "#FFFFFF",
              borderRadius: 999,
              padding: "8px 11px",
              fontSize: 13,
              fontWeight: 650,
            }}
          >
            &larr; Back to My Pathways
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
            <span
              style={{
                borderRadius: 999,
                background: effectiveMode === "assess" ? tokens.mint : tokens.lavender,
                color: effectiveMode === "assess" ? tokens.green : tokens.purple,
                padding: "4px 9px",
                fontSize: 12,
                fontWeight: 650,
              }}
            >
              {effectiveMode === "assess" ? "Assess" : "Practise"}
            </span>
            <span style={{ color: tokens.slate, fontSize: 13 }}>{sample.stepLabel}</span>
          </div>
          <div style={{ color: tokens.slate, fontSize: 13 }}>{previewLabel}</div>
        </header>
      ) : null}

      <main style={{ padding: standalone ? "clamp(14px, 4vw, 32px)" : 0 }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gap: 14 }}>
          <section
            style={{
              border: `1px solid ${tokens.border}`,
              borderRadius: 22,
              background: tokens.card,
              boxShadow: "0 14px 36px rgba(23,32,75,0.065)",
              padding: "clamp(14px, 2.6vw, 22px)",
              display: "grid",
              gap: 16,
            }}
          >
            <ActivityProgress current={sampleIndex + 1} total={samples.length} mode={effectiveMode} />

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
              {showQuestionPicker ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {samples.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => moveToSample(index)}
                    style={{
                      border: `1px solid ${index === sampleIndex ? tokens.purple : tokens.border}`,
                      background: index === sampleIndex ? tokens.lavender : "#FFFFFF",
                      color: index === sampleIndex ? tokens.purple : tokens.slate,
                      borderRadius: 999,
                      padding: "7px 10px",
                      fontSize: 12,
                      fontWeight: 650,
                      cursor: "pointer",
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    borderRadius: 999,
                    background: effectiveMode === "assess" ? tokens.mint : tokens.lavender,
                    color: effectiveMode === "assess" ? tokens.green : tokens.purple,
                    padding: "7px 10px",
                    fontSize: 12,
                    fontWeight: 650,
                  }}
                >
                  {effectiveMode === "assess" ? "Assess" : "Practice"}
                </span>
                <span style={{ color: tokens.slate, fontSize: 13 }}>
                  {effectiveMode === "assess"
                    ? "Show what you can do for this step."
                    : "Try the question, then check your answer."}
                </span>
              </div>
              )}
            </div>

            <div
              className="activity-v4-canvas-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1.12fr) minmax(340px, 0.88fr)",
                gap: 18,
                alignItems: "start",
              }}
            >
              <div style={{ display: "grid", gap: 13 }}>
                <div style={{ color: tokens.slate, fontSize: 13, fontWeight: 600 }}>
                  {sample.source}
                </div>
                <h1
                  style={{
                    margin: 0,
                    color: tokens.navy,
                    fontSize: "clamp(22px, 3vw, 30px)",
                    lineHeight: 1.16,
                    fontWeight: 650,
                  }}
                >
                  {displayPrompt}
                </h1>
                <MathVisualRendererV4
                  description={sample.visualDescription}
                  mode="full"
                  kind={sample.visualKind}
                />
              </div>

              <aside style={{ display: "grid", gap: 11 }}>
                <div
                  className="activity-v4-answer-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: sample.options.length <= 4 ? "repeat(2, minmax(0, 1fr))" : "1fr",
                    gap: 9,
                  }}
                >
                  {sample.options.map((option, index) => (
                    <AnswerOptionV4
                      key={`${sample.id}-${option}`}
                      label={answerLabels[index] ?? String(index + 1)}
                      option={option}
                      selected={selected === option}
                      submitted={submitted}
                      correct={normalize(option) === normalize(sample.expectedAnswer)}
                      visualDescription={sample.visualDescription}
                      visualKind={sample.visualKind}
                      onSelect={() => {
                        setSelected(option);
                        setSubmitted(false);
                      }}
                    />
                  ))}
                </div>

                <HintDrawerV4 hint={playerHint} />

                {submitted ? (
                  <FeedbackPanelV4
                    correct={selectedCorrect}
                    feedback={sample.feedback}
                    visualDescription={sample.visualDescription}
                    visualKind={sample.visualKind}
                  />
                ) : null}

                <div style={{ display: "flex", flexWrap: "wrap", gap: 9, justifyContent: "space-between", alignItems: "center" }}>
                  <CleanContentIssueReportButton
                    context={{
                      mode: effectiveMode === "assess" ? "assessment" : "practice",
                      stepTitle: sample.title,
                      itemId: effectiveMode === "assess" ? sample.id : null,
                      taskId: effectiveMode === "practice" ? sample.id : null,
                      prompt: displayPrompt,
                      responseType: "multiple_choice",
                      visualSupport: sample.visualDescription
                        ? { type: "context_card", description: sample.visualDescription }
                        : {},
                      context: {
                        player: "activity-player-v4",
                        previewLabel,
                        source: sample.source,
                        visualKind: sample.visualKind,
                        questionIndex: sampleIndex + 1,
                        questionCount: samples.length,
                      },
                    }}
                  />
                  {allowNotSure && !submitted ? (
                    <button
                      type="button"
                      onClick={() => {
                        onNotSure?.({ sample, index: sampleIndex });
                        if (hasNext) {
                          moveToSample(sampleIndex + 1);
                        } else {
                          onComplete?.();
                        }
                      }}
                      style={{
                        border: `1px solid ${tokens.border}`,
                        background: "#FFFFFF",
                        color: tokens.slate,
                        borderRadius: 12,
                        padding: "10px 14px",
                        fontSize: 14,
                        fontWeight: 650,
                        cursor: "pointer",
                      }}
                    >
                      Not sure yet
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={!selected}
                    onClick={() => {
                      if (!submitted) {
                        onSubmitAnswer?.({
                          sample,
                          selectedAnswer: selected || "",
                          correct: selectedCorrect,
                          index: sampleIndex,
                        });
                        setSubmitted(true);
                        return;
                      }
                      if (hasNext) {
                        moveToSample(sampleIndex + 1);
                      } else {
                        if (onComplete) {
                          onComplete();
                        } else {
                          setSelected(null);
                          setSubmitted(false);
                          setSampleIndex(0);
                        }
                      }
                    }}
                    style={{
                      border: "1px solid #17204B",
                      background: selected ? "#17204B" : "#E7EAF2",
                      color: selected ? "#FFFFFF" : tokens.slate,
                      borderRadius: 12,
                      padding: "10px 14px",
                      fontSize: 14,
                      fontWeight: 650,
                      cursor: selected ? "pointer" : "not-allowed",
                    }}
                  >
                    {!submitted
                      ? "Submit answer"
                      : hasNext
                        ? "Next question"
                        : effectiveMode === "assess"
                          ? "View result"
                          : onComplete
                            ? "Finish practice"
                            : "Restart practice"}
                  </button>
                </div>
              </aside>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
