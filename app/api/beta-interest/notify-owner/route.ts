import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import {
  sendOwnerBetaSignupNotification,
  type BetaSignupNotificationInput,
} from "@/lib/betaSignupNotification";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function asNullableString(value: unknown) {
  const text = safe(value);
  return text || null;
}

function asNullableBoolean(value: unknown) {
  if (value === true || value === false) return value;
  return null;
}

function asNullableNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

function normalizePayload(value: unknown): BetaSignupNotificationInput {
  const payload = value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};

  return {
    biggest_homeschool_challenge: safe(payload.biggest_homeschool_challenge),
    country: safe(payload.country),
    currently_homeschooling: asNullableBoolean(payload.currently_homeschooling),
    email: safe(payload.email).toLowerCase(),
    name: safe(payload.name),
    number_of_children: asNullableNumber(payload.number_of_children),
    source: asNullableString(payload.source),
    state_or_region: asNullableString(payload.state_or_region),
    submitted_at: safe(payload.submitted_at) || new Date().toISOString(),
    willing_to_test_free_beta: payload.willing_to_test_free_beta === true,
  };
}

export async function POST(request: Request) {
  let payload: BetaSignupNotificationInput;

  try {
    payload = normalizePayload(await request.json());
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid notification payload." },
      { status: 400 },
    );
  }

  try {
    await sendOwnerBetaSignupNotification(payload);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to send owner beta signup notification.", error);
    Sentry.captureException(error, {
      tags: {
        feature: "beta-signup-owner-notification",
      },
    });

    return NextResponse.json({ ok: false });
  }
}
