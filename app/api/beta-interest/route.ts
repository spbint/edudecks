import * as Sentry from "@sentry/nextjs";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  sendOwnerBetaSignupNotification,
  type BetaSignupNotificationInput,
} from "@/lib/betaSignupNotification";

export const runtime = "nodejs";

type BetaInterestStatus =
  | "created"
  | "updated"
  | "already_exists"
  | "validation_error"
  | "server_error";

type BetaInterestPayload = {
  name: string;
  email: string;
  country: string;
  state_or_region: string | null;
  number_of_children: number | null;
  biggest_homeschool_challenge: string;
  currently_homeschooling: boolean | null;
  willing_to_test_free_beta: boolean;
  source: string | null;
  company_website?: string;
};

const MAX_TEXT_LENGTH = 2000;

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
  if (value === null || value === undefined || safe(value) === "") return null;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return Number.NaN;

  return parsed;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function truncateText(value: string) {
  return value.length > MAX_TEXT_LENGTH ? value.slice(0, MAX_TEXT_LENGTH) : value;
}

function json(status: BetaInterestStatus, init?: ResponseInit, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: status === "created" || status === "updated" || status === "already_exists", status, ...extra }, init);
}

function logBetaStatus(status: BetaInterestStatus, reason: string) {
  console.info("beta_interest_submit", { status, reason });
}

function captureBetaFailure(reason: string, error?: unknown) {
  Sentry.captureException(error ?? new Error(`Beta interest submit failed: ${reason}`), {
    tags: {
      feature: "beta-interest-submit",
      reason,
    },
  });
}

function normalizePayload(value: unknown): { payload?: BetaInterestPayload; error?: string } {
  const input = value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};

  if (safe(input.company_website)) {
    return {
      payload: {
        name: "",
        email: "",
        country: "",
        state_or_region: null,
        number_of_children: null,
        biggest_homeschool_challenge: "",
        currently_homeschooling: null,
        willing_to_test_free_beta: false,
        source: null,
        company_website: safe(input.company_website),
      },
    };
  }

  const name = safe(input.name);
  const email = safe(input.email).toLowerCase();
  const country = safe(input.country);
  const numberOfChildren = asNullableNumber(input.number_of_children);
  const challenge = truncateText(safe(input.biggest_homeschool_challenge));
  const currentlyHomeschooling = asNullableBoolean(input.currently_homeschooling);
  const willingToTestFreeBeta = input.willing_to_test_free_beta === true;

  if (!name) return { error: "missing_name" };
  if (!isValidEmail(email)) return { error: "invalid_email" };
  if (!country) return { error: "missing_country" };
  if (Number.isNaN(numberOfChildren)) return { error: "invalid_number_of_children" };
  if (!challenge) return { error: "missing_challenges" };
  if (currentlyHomeschooling === null) return { error: "missing_currently_homeschooling" };
  if (!willingToTestFreeBeta) return { error: "missing_beta_consent" };

  return {
    payload: {
      name,
      email,
      country,
      state_or_region: asNullableString(input.state_or_region),
      number_of_children: numberOfChildren,
      biggest_homeschool_challenge: challenge,
      currently_homeschooling: currentlyHomeschooling,
      willing_to_test_free_beta: willingToTestFreeBeta,
      source: asNullableString(input.source),
    },
  };
}

function createBetaSupabaseClient() {
  const supabaseUrl = safe(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey = safe(
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
  );

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

async function notifyOwner(payload: BetaInterestPayload, submittedAt: string) {
  const notification: BetaSignupNotificationInput = {
    biggest_homeschool_challenge: payload.biggest_homeschool_challenge,
    country: payload.country,
    currently_homeschooling: payload.currently_homeschooling,
    email: payload.email,
    name: payload.name,
    number_of_children: payload.number_of_children,
    source: payload.source,
    state_or_region: payload.state_or_region,
    submitted_at: submittedAt,
    willing_to_test_free_beta: payload.willing_to_test_free_beta,
  };

  try {
    await sendOwnerBetaSignupNotification(notification);
  } catch (error) {
    console.error("Failed to send owner beta signup notification.", {
      reason: "notification_failed",
    });
    Sentry.captureException(error, {
      tags: {
        feature: "beta-signup-owner-notification",
        reason: "notification_failed",
      },
    });
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    logBetaStatus("validation_error", "invalid_json");
    return json("validation_error", { status: 400 }, { reason: "invalid_json" });
  }

  const { payload, error } = normalizePayload(body);

  if (!payload) {
    logBetaStatus("validation_error", error ?? "invalid_payload");
    return json("validation_error", { status: 400 }, { reason: error ?? "invalid_payload" });
  }

  if (payload.company_website) {
    logBetaStatus("already_exists", "honeypot");
    return json("already_exists");
  }

  const supabase = createBetaSupabaseClient();

  if (!supabase) {
    logBetaStatus("server_error", "missing_supabase_service_env");
    captureBetaFailure("missing_supabase_service_env");
    return json("server_error", { status: 500 }, { reason: "configuration" });
  }

  try {
    const existing = await supabase
      .from("beta_interest")
      .select("id")
      .ilike("email", payload.email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing.error) {
      throw existing.error;
    }

    if (existing.data?.id) {
      const update = await supabase
        .from("beta_interest")
        .update({
          name: payload.name,
          country: payload.country,
          state_or_region: payload.state_or_region,
          number_of_children: payload.number_of_children,
          biggest_homeschool_challenge: payload.biggest_homeschool_challenge,
          currently_homeschooling: payload.currently_homeschooling,
          willing_to_test_free_beta: payload.willing_to_test_free_beta,
          source: payload.source,
          status: "new",
        })
        .eq("id", existing.data.id);

      if (update.error) {
        throw update.error;
      }

      logBetaStatus("updated", "existing_email");
      await notifyOwner(payload, new Date().toISOString());
      return json("updated");
    }

    const insert = await supabase.from("beta_interest").insert({
      name: payload.name,
      email: payload.email,
      country: payload.country,
      state_or_region: payload.state_or_region,
      number_of_children: payload.number_of_children,
      biggest_homeschool_challenge: payload.biggest_homeschool_challenge,
      currently_homeschooling: payload.currently_homeschooling,
      willing_to_test_free_beta: payload.willing_to_test_free_beta,
      source: payload.source,
      status: "new",
    });

    if (insert.error) {
      throw insert.error;
    }

    logBetaStatus("created", "inserted");
    await notifyOwner(payload, new Date().toISOString());
    return json("created", { status: 201 });
  } catch (nextError) {
    const errorCode = safe((nextError as { code?: unknown })?.code) || "unknown";
    console.error("beta_interest_submit_failed", {
      status: "server_error",
      reason: errorCode,
    });
    captureBetaFailure(errorCode, nextError);

    return json("server_error", { status: 500 }, { reason: "save_failed" });
  }
}
