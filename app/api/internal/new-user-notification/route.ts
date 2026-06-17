import * as Sentry from "@sentry/nextjs";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getAuthenticatedRouteUser } from "@/lib/auth/serverRouteAuth";
import { sendNewUserNotification } from "@/lib/newUserNotification";
import { createServerSupabaseClient } from "@/lib/supabaseClient";

export const runtime = "nodejs";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function createAdminClient() {
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

function isDuplicateNotificationGuard(error: unknown) {
  return (error as { code?: unknown } | null)?.code === "23505";
}

function sanitizeErrorMessage(error: unknown) {
  const message = safe((error as { message?: unknown } | null)?.message || error);
  return message.slice(0, 500) || "Unknown notification failure.";
}

export async function POST(request: Request) {
  let user = await getAuthenticatedRouteUser();

  if (!user) {
    const authHeader = request.headers.get("authorization") ?? "";
    const token = authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : "";

    if (token) {
      const tokenClient = createServerSupabaseClient(token);
      const tokenUser = await tokenClient.auth.getUser();
      user = tokenUser.data.user ?? null;
    }
  }

  if (!user) {
    return NextResponse.json({ ok: false, status: "unauthenticated" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const source = safe(body.source) || null;
  const referrer = safe(body.referrer) || null;
  const admin = createAdminClient();
  if (!admin) {
    console.error("new_user_notification_failed", { reason: "missing_admin_env" });
    Sentry.captureException(new Error("Missing Supabase admin env for new user notification."), {
      tags: {
        feature: "new-user-notification",
        reason: "missing_admin_env",
      },
    });
    return NextResponse.json({ ok: false, status: "configuration_error" }, { status: 500 });
  }

  const latestUser = await admin.auth.admin.getUserById(user.id);
  if (latestUser.error) {
    console.error("new_user_notification_failed", { reason: "admin_user_lookup_failed" });
    Sentry.captureException(latestUser.error, {
      tags: {
        feature: "new-user-notification",
        reason: "admin_user_lookup_failed",
      },
    });
    return NextResponse.json({ ok: false, status: "lookup_failed" }, { status: 500 });
  }

  const latestAppMetadata = latestUser.data.user?.app_metadata ?? {};
  if (latestAppMetadata.mylearna_signup_notification_sent_at) {
    return NextResponse.json({ ok: true, status: "already_sent" });
  }

  const guardInsert = await admin.from("signup_notifications").insert({
    user_id: user.id,
    notification_type: "new_user_signup",
    source,
    referrer,
    status: "pending",
    attempted_at: new Date().toISOString(),
  });

  if (guardInsert.error) {
    if (isDuplicateNotificationGuard(guardInsert.error)) {
      console.info("new_user_notification_skipped", {
        reason: "duplicate_guard",
        status: "already_sent",
      });
      return NextResponse.json({ ok: true, status: "already_sent" });
    }

    console.error("new_user_notification_failed", {
      reason: "guard_insert_failed",
      code: guardInsert.error.code,
    });
    Sentry.captureException(guardInsert.error, {
      tags: {
        feature: "new-user-notification",
        reason: "guard_insert_failed",
      },
      extra: {
        code: guardInsert.error.code,
      },
    });
    return NextResponse.json({ ok: false, status: "guard_failed" });
  }

  try {
    await sendNewUserNotification({
      createdAt: user.created_at ?? null,
      email: user.email ?? null,
      referrer,
      source,
      userId: user.id,
    });

    const sentAt = new Date().toISOString();
    const markSent = await admin
      .from("signup_notifications")
      .update({
        sent_at: sentAt,
        attempted_at: sentAt,
        status: "sent",
        last_error: null,
      })
      .eq("user_id", user.id)
      .eq("notification_type", "new_user_signup");

    if (markSent.error) {
      console.error("new_user_notification_mark_sent_failed", {
        code: markSent.error.code,
      });
      Sentry.captureException(markSent.error, {
        tags: {
          feature: "new-user-notification",
          reason: "mark_sent_failed",
        },
        extra: {
          code: markSent.error.code,
        },
      });
    }

    const { error } = await admin.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...latestAppMetadata,
        mylearna_signup_notification_sent_at: sentAt,
      },
    });

    if (error) {
      console.error("new_user_notification_metadata_update_failed");
      Sentry.captureException(error, {
        tags: {
          feature: "new-user-notification",
          reason: "metadata_update_failed",
        },
      });
    }

    console.info("new_user_notification_sent", { status: "sent" });
    return NextResponse.json({ ok: true, status: "sent" });
  } catch (error) {
    const errorMessage = sanitizeErrorMessage(error);
    await admin
      .from("signup_notifications")
      .update({
        attempted_at: new Date().toISOString(),
        status: "failed",
        last_error: errorMessage,
      })
      .eq("user_id", user.id)
      .eq("notification_type", "new_user_signup");

    console.error("new_user_notification_failed", { reason: "send_failed" });
    Sentry.captureException(error, {
      tags: {
        feature: "new-user-notification",
        reason: "send_failed",
      },
    });

    return NextResponse.json({ ok: false, status: "send_failed" });
  }
}
