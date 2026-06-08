import * as Sentry from "@sentry/nextjs";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getAuthenticatedRouteUser } from "@/lib/auth/serverRouteAuth";
import { sendNewUserNotification } from "@/lib/newUserNotification";

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

export async function POST(request: Request) {
  const user = await getAuthenticatedRouteUser();

  if (!user) {
    return NextResponse.json({ ok: false, status: "unauthenticated" }, { status: 401 });
  }

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

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  try {
    await sendNewUserNotification({
      createdAt: user.created_at ?? null,
      email: user.email ?? null,
      referrer: safe(body.referrer) || null,
      source: safe(body.source) || null,
      userId: user.id,
    });

    const sentAt = new Date().toISOString();
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...latestAppMetadata,
        mylearna_signup_notification_sent_at: sentAt,
      },
    });

    if (error) {
      throw error;
    }

    console.info("new_user_notification_sent", { status: "sent" });
    return NextResponse.json({ ok: true, status: "sent" });
  } catch (error) {
    console.error("new_user_notification_failed", { reason: "send_or_mark_failed" });
    Sentry.captureException(error, {
      tags: {
        feature: "new-user-notification",
        reason: "send_or_mark_failed",
      },
    });

    return NextResponse.json({ ok: false, status: "send_failed" }, { status: 500 });
  }
}
