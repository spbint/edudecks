import {
  RESEND_API_URL,
  resolveMylearnaEmailFrom,
  resolveResendApiKey,
  resolveSupportEmail,
} from "@/lib/email/resendConfig";

export type SupportReportType = "question" | "page";

export type SupportReportEmailInput = {
  type: SupportReportType;
  category: string;
  message: string;
  context?: Record<string, unknown>;
};

export class SupportReportEmailConfigurationError extends Error {
  missingConfig: "RESEND_API_KEY" | "sender";

  constructor(
    message: string,
    missingConfig: "RESEND_API_KEY" | "sender",
  ) {
    super(message);
    this.name = "SupportReportEmailConfigurationError";
    this.missingConfig = missingConfig;
  }
}

function formatType(type: SupportReportType) {
  return type === "question" ? "Question" : "Page";
}

function formatContextValue(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function buildPlainTextBody(input: SupportReportEmailInput) {
  const contextEntries = Object.entries(input.context ?? {})
    .map(([key, value]) => [key, formatContextValue(value)] as const)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}: ${value}`);

  return [
    "MyLearna report",
    "",
    `Type: ${formatType(input.type)}`,
    `Category: ${input.category}`,
    "",
    "Message:",
    input.message,
    "",
    "Context:",
    ...contextEntries,
  ].join("\n");
}

export async function sendSupportReportEmail(input: SupportReportEmailInput) {
  const apiKey = resolveResendApiKey();
  const fromEmail = resolveMylearnaEmailFrom();
  const supportEmail = resolveSupportEmail();

  if (!apiKey) {
    throw new SupportReportEmailConfigurationError(
      "Missing RESEND_API_KEY for support report email.",
      "RESEND_API_KEY",
    );
  }

  if (!fromEmail) {
    throw new SupportReportEmailConfigurationError(
      "Missing RESEND_FROM or FROM_EMAIL for support report email.",
      "sender",
    );
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
      subject:
        input.type === "question"
          ? "MyLearna question report"
          : "MyLearna page report",
      text: buildPlainTextBody(input),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Resend support report failed with ${response.status}: ${errorText}`,
    );
  }
}
