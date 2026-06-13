const RESEND_API_URL = "https://api.resend.com/emails";
const SUPPORT_REPORT_RECIPIENT = "support@mylearna.com";

export type SupportReportType = "question" | "page";

export type SupportReportEmailInput = {
  type: SupportReportType;
  category: string;
  message: string;
  context?: Record<string, unknown>;
};

export class SupportReportEmailConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupportReportEmailConfigurationError";
  }
}

function safe(value: unknown) {
  return String(value ?? "").trim();
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
  const apiKey = safe(process.env.RESEND_API_KEY);
  const fromEmail = safe(process.env.FROM_EMAIL);

  if (!apiKey) {
    throw new SupportReportEmailConfigurationError(
      "Missing RESEND_API_KEY for support report email.",
    );
  }

  if (!fromEmail) {
    throw new SupportReportEmailConfigurationError(
      "Missing FROM_EMAIL for support report email.",
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
      to: SUPPORT_REPORT_RECIPIENT,
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

export { SUPPORT_REPORT_RECIPIENT };
