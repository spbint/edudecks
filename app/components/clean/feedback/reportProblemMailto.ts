export const MYLEARNA_SUPPORT_EMAIL = "support@mylearna.com";

export type ReportProblemMailtoOptions = {
  subject: string;
  type: "Question" | "Page" | "Activity";
  category: string;
  message: string;
  context: Array<[string, unknown]>;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export function buildReportProblemBody(options: ReportProblemMailtoOptions) {
  const contextLines = options.context
    .map(([label, value]) => [label, safe(value)] as const)
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${value}`);

  return [
    "MyLearna report",
    "",
    `Type: ${options.type}`,
    `Category: ${options.category}`,
    "Message:",
    safe(options.message) || "[No message provided]",
    "",
    "Context:",
    ...contextLines,
  ].join("\n");
}

export function buildReportProblemMailto(options: ReportProblemMailtoOptions) {
  const body = buildReportProblemBody(options);
  const params = new URLSearchParams({
    subject: options.subject,
    body,
  });

  return {
    body,
    href: `mailto:${MYLEARNA_SUPPORT_EMAIL}?${params.toString()}`,
  };
}
