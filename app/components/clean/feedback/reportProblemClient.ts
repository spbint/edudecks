export type ReportProblemType = "question" | "page";

export type ReportProblemPayload = {
  type: ReportProblemType;
  category: string;
  message: string;
  context?: Record<string, unknown>;
  company?: string;
};

export type ReportProblemResult =
  | { ok: true }
  | {
      ok: false;
      reason: "configuration" | "validation" | "network" | "unknown";
      message: string;
    };

const CONFIGURATION_ERROR_MESSAGE =
  "Email reporting is not configured yet. Please contact support@mylearna.com.";
const GENERIC_ERROR_MESSAGE =
  "Sorry, we could not send the report. Please try again.";

export async function submitReportProblem(
  payload: ReportProblemPayload,
): Promise<ReportProblemResult> {
  try {
    const response = await fetch("/api/feedback/report-problem", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const body = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
    };

    if (response.ok && body.ok) {
      return { ok: true };
    }

    if (body.error === "email_not_configured") {
      return {
        ok: false,
        reason: "configuration",
        message: CONFIGURATION_ERROR_MESSAGE,
      };
    }

    if (response.status === 400) {
      return {
        ok: false,
        reason: "validation",
        message: body.error || "Choose a category and add a short message.",
      };
    }

    return {
      ok: false,
      reason: "unknown",
      message: GENERIC_ERROR_MESSAGE,
    };
  } catch {
    return {
      ok: false,
      reason: "network",
      message: GENERIC_ERROR_MESSAGE,
    };
  }
}
