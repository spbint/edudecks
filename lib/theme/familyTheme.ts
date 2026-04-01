export const familyTheme = {
  font: {
    family:
      'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  },

  colors: {
    bgApp: "#f6f8fc",
    bgSurface: "#ffffff",
    bgSoft: "#f8fafc",

    borderSoft: "#e5e7eb",
    borderMid: "#d1d5db",

    textStrong: "#0f172a",
    textMain: "#1f2937",
    textMuted: "#64748b",
    textFaint: "#94a3b8",

    brandPrimary: "#4f7cf0",
    brandPrimaryStrong: "#2563eb",
    brandPrimarySoft: "#eff6ff",
    brandPrimaryBorder: "#bfdbfe",

    brandSecondary: "#8b7cf6",
    brandSecondarySoft: "#f5f3ff",
    brandSecondaryBorder: "#ddd6fe",

    successBg: "#ecfdf5",
    successBorder: "#a7f3d0",
    successText: "#166534",

    warningBg: "#fff7ed",
    warningBorder: "#fed7aa",
    warningText: "#9a3412",

    dangerBg: "#fff1f2",
    dangerBorder: "#fecdd3",
    dangerText: "#be123c",

    infoBg: "#ecfeff",
    infoBorder: "#a5f3fc",
    infoText: "#0c4a6e",

    premiumBg: "#fffaf0",
    premiumBorder: "#fde68a",
    premiumText: "#92400e",
  },

  radius: {
    sm: 10,
    md: 14,
    lg: 18,
    xl: 26,
    pill: 999,
  },

  shadow: {
    card: "0 10px 30px rgba(15,23,42,0.04)",
    hero: "0 18px 50px rgba(15,23,42,0.06)",
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 28,
    section: 32,
    page: 40,
  },

  type: {
    display: {
      fontSize: 34,
      lineHeight: 1.1,
      fontWeight: 900,
    },
    h1: {
      fontSize: 28,
      lineHeight: 1.15,
      fontWeight: 900,
    },
    h2: {
      fontSize: 18,
      lineHeight: 1.25,
      fontWeight: 900,
    },
    h3: {
      fontSize: 15,
      lineHeight: 1.3,
      fontWeight: 800,
    },
    body: {
      fontSize: 14,
      lineHeight: 1.6,
      fontWeight: 400,
    },
    small: {
      fontSize: 13,
      lineHeight: 1.5,
      fontWeight: 400,
    },
    label: {
      fontSize: 12,
      lineHeight: 1.2,
      fontWeight: 800,
      letterSpacing: 1.1,
      textTransform: "uppercase" as const,
    },
  },

  maxWidth: 1320,
} as const;

export type FamilyTheme = typeof familyTheme;