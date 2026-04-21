"use client";

import React from "react";

type TemporaryUnavailableCardProps = {
  title: string;
  message?: string;
};

export default function TemporaryUnavailableCard({
  title,
  message = "This area is being refreshed and will be available again soon.",
}: TemporaryUnavailableCardProps) {
  return (
    <section style={styles.card}>
      <div style={styles.eyebrow}>Temporarily unavailable</div>
      <h1 style={styles.title}>{title}</h1>
      <p style={styles.message}>{message}</p>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    background: "#ffffff",
    padding: 24,
    boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
    display: "grid",
    gap: 10,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#64748b",
  },
  title: {
    margin: 0,
    fontSize: 28,
    lineHeight: 1.15,
    fontWeight: 900,
    color: "#0f172a",
  },
  message: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.7,
    color: "#475569",
    maxWidth: 720,
  },
};
