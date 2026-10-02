export type EmailAuthDelivery = "magic-link" | "otp-code";

export function getEmailAuthDelivery(): EmailAuthDelivery {
  const configured = (process.env.NEXT_PUBLIC_MYLEARNA_EMAIL_AUTH_MODE || "").trim().toLowerCase();
  return configured === "magic-link" ? "magic-link" : "otp-code";
}
