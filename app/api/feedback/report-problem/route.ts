import { NextResponse } from "next/server";
import {
  sendSupportReportEmail,
  SupportReportEmailConfigurationError,
  type SupportReportType,
} from "@/lib/email/sendSupportReportEmail";

export const runtime = "nodejs";

const MAX_MESSAGE_LENGTH = 2000;
const MAX_CONTEXT_KEYS = 40;
const MAX_CONTEXT_VALUE_LENGTH = 500;

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function isReportType(value: unknown): value is SupportReportType {
  return value === "question" || value === "page";
}

function normalizeContext(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .slice(0, MAX_CONTEXT_KEYS)
      .map(([key, entryValue]) => [
        safe(key).slice(0, 80),
        safe(entryValue).slice(0, MAX_CONTEXT_VALUE_LENGTH),
      ])
      .filter(([key, entryValue]) => key && entryValue),
  );
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid report request." },
      { status: 400 },
    );
  }

  if (safe(body.company) || safe(body.website)) {
    return NextResponse.json({ ok: true, status: "sent" });
  }

  const type = body.type;
  const category = safe(body.category);
  const message = safe(body.message).slice(0, MAX_MESSAGE_LENGTH);

  if (!isReportType(type)) {
    return NextResponse.json(
      { ok: false, error: "Choose a valid report type." },
      { status: 400 },
    );
  }

  if (!category || !message) {
    return NextResponse.json(
      { ok: false, error: "Choose a category and add a short message." },
      { status: 400 },
    );
  }

  try {
    await sendSupportReportEmail({
      type,
      category,
      message,
      context: normalizeContext(body.context),
    });

    return NextResponse.json({ ok: true, status: "sent" });
  } catch (error) {
    if (error instanceof SupportReportEmailConfigurationError) {
      console.error("support_report_email_configuration_error", {
        message: error.message,
      });
      return NextResponse.json(
        { ok: false, error: "email_not_configured" },
        { status: 500 },
      );
    }

    console.error("support_report_email_failed", {
      message: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { ok: false, error: "send_failed" },
      { status: 500 },
    );
  }
}
