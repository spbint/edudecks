type NewUserNotificationInput = {
  createdAt: string | null;
  email: string | null;
  referrer: string | null;
  source: string | null;
  userId: string;
};

const RESEND_API_URL = "https://api.resend.com/emails";

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
  const apiKey = safe(process.env.RESEND_API_KEY);
  const ownerEmail = safe(
    process.env.ADMIN_SIGNUP_NOTIFY_EMAIL ||
      process.env.OWNER_SIGNUP_ALERT_EMAIL ||
      "sean@mylearna.com",
  );
  const fromEmail = safe(process.env.FROM_EMAIL);

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY for new user notification.");
  }

  if (!fromEmail) {
    throw new Error("Missing FROM_EMAIL for new user notification.");
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: ownerEmail,
      subject: "New MyLearna user signed up",
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
