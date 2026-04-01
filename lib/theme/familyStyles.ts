import type { CSSProperties } from "react";
import { familyTheme as t } from "./familyTheme";

export type FamilyTone =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "premium";

function toneMap(tone: FamilyTone) {
  if (tone === "secondary") {
    return {
      bg: t.colors.brandSecondarySoft,
      bd: t.colors.brandSecondaryBorder,
      fg: t.colors.brandSecondary,
    };
  }
  if (tone === "success") {
    return {
      bg: t.colors.successBg,
      bd: t.colors.successBorder,
      fg: t.colors.successText,
    };
  }
  if (tone === "warning") {
    return {
      bg: t.colors.warningBg,
      bd: t.colors.warningBorder,
      fg: t.colors.warningText,
    };
  }
  if (tone === "danger") {
    return {
      bg: t.colors.dangerBg,
      bd: t.colors.dangerBorder,
      fg: t.colors.dangerText,
    };
  }
  if (tone === "info") {
    return {
      bg: t.colors.infoBg,
      bd: t.colors.infoBorder,
      fg: t.colors.infoText,
    };
  }
  if (tone === "premium") {
    return {
      bg: t.colors.premiumBg,
      bd: t.colors.premiumBorder,
      fg: t.colors.premiumText,
    };
  }

  return {
    bg: t.colors.brandPrimarySoft,
    bd: t.colors.brandPrimaryBorder,
    fg: t.colors.brandPrimaryStrong,
  };
}

export const familyStyles = {
  page(): CSSProperties {
    return {
      minHeight: "100vh",
      background: t.colors.bgApp,
      color: t.colors.textStrong,
      fontFamily: t.font.family,
    };
  },

  pageInner(): CSSProperties {
    return {
      maxWidth: t.maxWidth,
      margin: "0 auto",
      padding: "24px",
    };
  },

  stickyTop(): CSSProperties {
    return {
      position: "sticky",
      top: 0,
      zIndex: 20,
      background: "rgba(246,248,252,0.9)",
      backdropFilter: "blur(8px)",
      borderBottom: `1px solid ${t.colors.borderSoft}`,
    };
  },

  topBar(): CSSProperties {
    return {
      maxWidth: t.maxWidth,
      margin: "0 auto",
      padding: "16px 24px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap",
    };
  },

  card(): CSSProperties {
    return {
      background: t.colors.bgSurface,
      border: `1px solid ${t.colors.borderSoft}`,
      borderRadius: t.radius.lg,
      padding: 20,
      boxShadow: t.shadow.card,
    };
  },

  softCard(): CSSProperties {
    return {
      background: t.colors.bgSoft,
      border: `1px solid ${t.colors.borderSoft}`,
      borderRadius: t.radius.md,
      padding: 16,
    };
  },

  hero(): CSSProperties {
    return {
      borderRadius: t.radius.xl,
      background:
        "linear-gradient(135deg, rgba(79,124,240,0.08) 0%, rgba(139,124,246,0.08) 100%)",
      border: `1px solid ${t.colors.brandPrimaryBorder}`,
      boxShadow: t.shadow.hero,
      padding: "28px 24px",
    };
  },

  label(): CSSProperties {
    return {
      ...t.type.label,
      color: t.colors.textMuted,
      marginBottom: 6,
    };
  },

  display(): CSSProperties {
    return {
      ...t.type.display,
      color: t.colors.textStrong,
      marginBottom: 12,
    };
  },

  h1(): CSSProperties {
    return {
      ...t.type.h1,
      color: t.colors.textStrong,
      marginBottom: 8,
    };
  },

  h2(): CSSProperties {
    return {
      ...t.type.h2,
      color: t.colors.textStrong,
      marginBottom: 10,
    };
  },

  h3(): CSSProperties {
    return {
      ...t.type.h3,
      color: t.colors.textStrong,
      marginBottom: 6,
    };
  },

  body(): CSSProperties {
    return {
      ...t.type.body,
      color: t.colors.textMain,
    };
  },

  small(): CSSProperties {
    return {
      ...t.type.small,
      color: t.colors.textMuted,
    };
  },

  mutedLink(): CSSProperties {
    return {
      color: t.colors.textMuted,
      textDecoration: "none",
      fontSize: 14,
      fontWeight: 700,
    };
  },

  input(minWidth = 160): CSSProperties {
    return {
      border: `1px solid ${t.colors.borderMid}`,
      borderRadius: t.radius.sm,
      padding: "10px 12px",
      background: t.colors.bgSurface,
      color: t.colors.textMain,
      minWidth,
      fontFamily: t.font.family,
      fontSize: 14,
    };
  },

  textarea(): CSSProperties {
    return {
      border: `1px solid ${t.colors.borderMid}`,
      borderRadius: t.radius.sm,
      padding: "12px 14px",
      background: t.colors.bgSurface,
      color: t.colors.textMain,
      width: "100%",
      minHeight: 110,
      resize: "vertical",
      fontFamily: t.font.family,
      fontSize: 14,
      lineHeight: 1.6,
    };
  },

  button(primary = false): CSSProperties {
    return {
      border: `1px solid ${
        primary ? t.colors.brandPrimaryStrong : t.colors.borderMid
      }`,
      background: primary ? t.colors.brandPrimaryStrong : t.colors.bgSurface,
      color: primary ? "#ffffff" : t.colors.textMain,
      borderRadius: t.radius.sm,
      padding: "10px 14px",
      fontWeight: 700,
      fontSize: 14,
      cursor: "pointer",
      textDecoration: "none",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      fontFamily: t.font.family,
    };
  },

  miniButton(): CSSProperties {
    return {
      border: `1px solid ${t.colors.borderMid}`,
      background: t.colors.bgSurface,
      color: t.colors.textMain,
      borderRadius: t.radius.sm,
      padding: "8px 10px",
      fontWeight: 700,
      fontSize: 12,
      cursor: "pointer",
      fontFamily: t.font.family,
    };
  },

  pill(tone: FamilyTone = "primary"): CSSProperties {
    const c = toneMap(tone);
    return {
      fontSize: 12,
      fontWeight: 800,
      borderRadius: t.radius.pill,
      padding: "6px 10px",
      background: c.bg,
      color: c.fg,
      border: `1px solid ${c.bd}`,
      whiteSpace: "nowrap",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
    };
  },

  statCard(tone: FamilyTone = "primary"): CSSProperties {
    const c = toneMap(tone);
    return {
      background: c.bg,
      border: `1px solid ${c.bd}`,
      borderRadius: t.radius.lg,
      padding: 18,
    };
  },

  autoFitCards(min = 240): CSSProperties {
    return {
      display: "grid",
      gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`,
      gap: 16,
    };
  },

  splitMain(): CSSProperties {
    return {
      display: "grid",
      gridTemplateColumns: "minmax(0, 1.35fr) minmax(320px, 0.95fr)",
      gap: 20,
      alignItems: "start",
    };
  },
};