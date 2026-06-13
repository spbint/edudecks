import {
  RESEND_API_URL,
  resolveMylearnaEmailFrom,
  resolveResendApiKey,
  resolveSupportEmail,
} from "@/lib/email/resendConfig";

type NewUserNotificationInput = {
  createdAt: string | null;
  email: string | null;
  referrer: string | null;
  source: string | null;
  userId: string;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function formatValue(value: unknown) {
  const text = safe(value);
  return text || "Not provided";
}

function buildPlainTextBody(input: NewUserNotificationInput) {
  return [
    "A new MyLearna user has signed up.",
    "",
    `Email: ${formatValue(input.email)}`,
    `User ID: ${formatValue(input.userId)}`,
    `Created: ${formatValue(input.createdAt)}`,
    `Source: ${formatValue(input.source)}`,
    `Referrer: ${formatValue(input.referrer)}`,
  ].join("\n");
}

export async function sendNewUserNotification(input: NewUserNotificationInput) {
  const apiKey = resolveResendApiKey();
  const supportEmail = resolveSupportEmail();
  const fromEmail = resolveMylearnaEmailFrom();

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY for new user notification.");
  }

  if (!fromEmail) {
    throw new Error("Missing RESEND_FROM or FROM_EMAIL for new user notification.");
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: supportEmail,
      subject: "New MyLearna sign-up",
      text: buildPlainTextBody(input),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Resend new user notification failed with ${response.status}: ${errorText}`,
    );
  }
}

export type { NewUserNotificationInput };
