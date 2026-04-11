"use client";

import Link from "next/link";
import React, { useState } from "react";

/* ───────────────────────── TYPES ───────────────────────── */

type Step = {
  n: number;
  label: string;
  target: string;
};

/* ───────────────────────── COMPONENT ───────────────────────── */

export default function CalendarPage() {
  const [input, setInput] = useState("");

  const steps: Step[] = [
    { n: 1, label: "Home", target: "/family" },
    { n: 2, label: "Calendar", target: "/calendar" },
    { n: 3, label: "Capture", target: "/capture" },
    { n: 4, label: "Portfolio", target: "/portfolio" },
  ];

  const handleAdd = () => {
    if (!input.trim()) return;
    console.log("Saved learning block:", input);
    setInput("");
  };

  return (
    <div style={{ display: "flex", gap: 24, padding: 24 }}>
      {/* ───────── LEFT RAIL ───────── */}
      <div
        style={{
          width: 80,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "sticky",
          top: 120,
          height: "fit-content",
        }}
      >
        {steps.map((step, i) => {
          const isActive = step.label === "Calendar";
          const isLast = i === steps.length - 1;

          return (
            <React.Fragment key={step.n}>
              <Link
                href={step.target}
                style={{
                  textDecoration: "none",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  marginBottom: isLast ? 0 : 16,
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: isActive ? "#111827" : "#e5e7eb",
                    color: isActive ? "#fff" : "#111827",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  {step.n}
                </div>
                <span
                  style={{
                    fontSize: 11,
                    marginTop: 6,
                    color: isActive ? "#111827" : "#6b7280",
                  }}
                >
                  {step.label}
                </span>
              </Link>

              {!isLast && (
                <div
                  style={{
                    width: 2,
                    height: 28,
                    background: "#e5e7eb",
                    marginBottom: 8,
                  }}
                />
              )}
            </React.Fragment>
          );
        })}

        {/* SAVE BUTTON */}
        <button
          onClick={() => console.log("Saved week")}
          style={{
            marginTop: 24,
            background: "#111827",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "8px 10px",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Save
        </button>
      </div>

      {/* ───────── MAIN CONTENT ───────── */}
      <div style={{ flex: 1, maxWidth: 1100 }}>
        {/* HERO */}
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <h1 style={{ fontSize: 28, marginBottom: 8 }}>
            Plan visually for your learner
          </h1>
          <p style={{ color: "#6b7280" }}>
            Keep your rhythm visible across the week. Add one small moment to
            begin.
          </p>
        </div>

        {/* INPUT */}
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            display: "flex",
            gap: 12,
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add a simple learning moment..."
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
            }}
          />

          <button
            onClick={handleAdd}
            style={{
              background: "#111827",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 16px",
              cursor: "pointer",
            }}
          >
            Add
          </button>
        </div>

        {/* WEEK GRID */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 16,
          }}
        >
          {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => (
            <div
              key={day}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 12,
              }}
            >
              <h4 style={{ marginBottom: 8 }}>{day}</h4>

              <div
                style={{
                  background: "#fef3c7",
                  padding: 8,
                  borderRadius: 6,
                  fontSize: 12,
                  marginBottom: 12,
                }}
              >
                A gentle note for today…
              </div>

              <button
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 6,
                  border: "1px solid #e5e7eb",
                  marginBottom: 6,
                }}
              >
                + Add block
              </button>

              <button
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 6,
                  border: "none",
                  background: "#111827",
                  color: "#fff",
                }}
              >
                Capture
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}