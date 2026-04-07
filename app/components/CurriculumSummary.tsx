"use client";

import Link from "next/link";
import React, { useMemo } from "react";
import {
  CurriculumPreferences,
  DEFAULT_FAMILY_SETTINGS,
  loadSettingsFromLocalStorage,
} from "@/lib/familySettings";
import {
  findCountryLabel,
  findFrameworkById,
  findLevelLabel,
} from "@/lib/curriculum";

type CurriculumSummaryVariant = "badge" | "card";

type CurriculumSummaryProps = {
  variant?: CurriculumSummaryVariant;
  title?: string;
  description?: string;
  helperText?: string;
  prefix?: string;
  emptyMessage?: string;
  includeCTA?: boolean;
  linkLabel?: string;
  linkHref?: string;
  preferences?: CurriculumPreferences;
};

const DEFAULT_BADGE_PREFIX = "Aligned to";

export default function CurriculumSummary({
  variant = "badge",
  title,
  description,
  helperText,
  prefix,
  emptyMessage,
  includeCTA,
  linkLabel,
  linkHref = "/settings",
  preferences,
}: CurriculumSummaryProps) {
  const effectivePreferences = useMemo(() => {
    if (preferences) return preferences;
    if (typeof window === "undefined") {
      return DEFAULT_FAMILY_SETTINGS.curriculum_preferences;
    }
    return loadSettingsFromLocalStorage().curriculum_preferences;
  }, [preferences]);

  const countryLabel = findCountryLabel(effectivePreferences.country_id);
  const framework = findFrameworkById(effectivePreferences.framework_id);
  const levelLabel = findLevelLabel(effectivePreferences.level_id);

  const summaryParts = [
    countryLabel,
    framework?.name,
    levelLabel,
  ].filter(Boolean) as string[];
  const summaryText = summaryParts.join(" • ");
  const hasSummary = summaryParts.length > 0;

  const badgeText = hasSummary
    ? summaryText
    : emptyMessage ||
      "Choose your learning framework in Settings to keep planning, capture, and reports connected.";

  const showCtaForBadge = includeCTA ?? false;
  const showCtaForCard = includeCTA ?? true;
  const showCta = variant === "card" ? showCtaForCard : showCtaForBadge;

  if (variant === "card") {
    return (
      <section style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <div style={styles.cardTitle}>{title || "Your learning framework"}</div>
            {description ? (
              <div style={styles.cardDescription}>{description}</div>
            ) : null}
          </div>
          {showCta ? (
            <Link href={linkHref} style={styles.link}>
              {linkLabel || "Change in Settings"}
            </Link>
          ) : null}
        </div>

        <div style={styles.cardSummary}>
          {hasSummary ? (
            <span style={styles.cardSummaryText}>{summaryText}</span>
          ) : (
            <span style={styles.cardEmpty}>{badgeText}</span>
          )}
        </div>

        {helperText ? <div style={styles.cardHelper}>{helperText}</div> : null}
      </section>
    );
  }

  return (
    <div style={styles.badge}>
      <div style={styles.badgeLine}>
        <span style={styles.badgePrefix}>{prefix || DEFAULT_BADGE_PREFIX}</span>
        <span style={styles.badgeValue}>{badgeText}</span>
      </div>
      {helperText ? <div style={styles.badgeHelper}>{helperText}</div> : null}
      {showCta ? (
        <Link href={linkHref} style={styles.badgeLink}>
          {linkLabel || "Change in Settings"}
        </Link>
      ) : null}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    borderRadius: 18,
    border: "1px solid #e0e7ff",
    background: "#ffffff",
    padding: 18,
    boxShadow: "0 10px 40px rgba(15,23,42,0.08)",
    display: "grid",
    gap: 8,
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 900,
    color: "#0f172a",
  },
  cardDescription: {
    marginTop: 4,
    fontSize: 14,
    color: "#475569",
    maxWidth: 520,
  },
  cardSummary: {
    fontSize: 14,
    color: "#0f172a",
    minHeight: 24,
  },
  cardSummaryText: {
    fontWeight: 800,
  },
  cardEmpty: {
    color: "#64748b",
    fontWeight: 600,
  },
  cardHelper: {
    fontSize: 13,
    color: "#475569",
  },
  link: {
    background: "#1d4ed8",
    color: "#ffffff",
    borderRadius: 999,
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 700,
    textDecoration: "none",
  },
  badge: {
    borderRadius: 16,
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    padding: "12px 16px",
    display: "grid",
    gap: 6,
  },
  badgeLine: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
    alignItems: "baseline",
  },
  badgePrefix: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#475569",
  },
  badgeValue: {
    fontSize: 14,
    fontWeight: 800,
    color: "#0f172a",
  },
  badgeHelper: {
    fontSize: 12,
    color: "#64748b",
  },
  badgeLink: {
    fontSize: 12,
    fontWeight: 700,
    color: "#1d4ed8",
    textDecoration: "none",
  },
};

