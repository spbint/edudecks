import { familyTheme } from "./familyTheme";

/** Shared MyLearna primitives with a small retail mapping for public storefronts. */
export const mylearnaBrandTokens = {
  fontFamily: familyTheme.font.family,
  navy: "#17204B",
  ink: "#24304F",
  slate: "#5B6478",
  muted: "#66708C",
  page: "#F7F9FC",
  surface: "#FFFFFF",
  warmSurface: "#FFF8F2",
  border: "#E7EAF2",
  warmBorder: "#E6D8C8",
  accent: "#E06B42",
  accentStrong: "#C65331",
  accentSoft: "#F6D3A5",
  focus: "#5E8CF5",
  radiusSm: "10px",
  radiusMd: "14px",
  radiusLg: "18px",
  radiusXl: "24px",
  shadowCard: "0 10px 30px rgba(15, 23, 42, 0.06)",
  shadowRaised: "0 16px 34px rgba(23, 32, 75, 0.12)",
} as const;

export type MyLearnaBrandTokens = typeof mylearnaBrandTokens;
