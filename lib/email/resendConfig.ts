const RESEND_API_URL = "https://api.resend.com/emails";
const DEFAULT_SUPPORT_EMAIL = "support@mylearna.com";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export function resolveResendApiKey() {
  return safe(process.env.RESEND_API_KEY);
}

export function resolveMylearnaEmailFrom() {
  return safe(process.env.RESEND_FROM || process.env.FROM_EMAIL);
}

export function resolveSupportEmail() {
  return safe(process.env.SUPPORT_EMAIL) || DEFAULT_SUPPORT_EMAIL;
}

export { DEFAULT_SUPPORT_EMAIL, RESEND_API_URL };
