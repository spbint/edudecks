import { NextRequest, NextResponse } from "next/server";
import { getServerAuthClient } from "@/lib/auth/serverRouteAuth";
import { completeMicrosoftCalendarConnection } from "@/lib/clean/calendar-integrations/microsoftConnectionService";
import { microsoftCalendarSettingsReturnUrl } from "@/lib/clean/calendar-integrations/microsoftOAuth";
import { authorizeCalendarIntegrationManager } from "@/lib/clean/calendar-integrations/serverAuthorization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirect(result: "connected" | "error") {
  try {
    const response = NextResponse.redirect(
      microsoftCalendarSettingsReturnUrl(result),
      303,
    );
    response.headers.set("cache-control", "private, no-store");
    response.headers.set("referrer-policy", "no-referrer");
    return response;
  } catch {
    return new NextResponse("Microsoft Calendar is not configured.", {
      status: 503,
      headers: {
        "cache-control": "private, no-store",
        "referrer-policy": "no-referrer",
      },
    });
  }
}

export async function GET(request: NextRequest) {
  const state = String(request.nextUrl.searchParams.get("state") ?? "").trim();
  const code = String(request.nextUrl.searchParams.get("code") ?? "").trim();
  const providerError = request.nextUrl.searchParams.get("error");
  if (
    providerError ||
    !/^[A-Za-z0-9_-]{43}$/.test(state) ||
    !code ||
    code.length > 4096
  ) {
    return redirect("error");
  }

  try {
    const supabase = await getServerAuthClient();
    const userResponse = await supabase.auth.getUser();
    const user = userResponse.data.user;
    if (userResponse.error || !user) return redirect("error");

    await completeMicrosoftCalendarConnection({
      state,
      code,
      authenticatedUserId: user.id,
      authorizeFamily: async (familyId, expectedUserId) => {
        const authorized = await authorizeCalendarIntegrationManager(familyId);
        if (authorized.context.userId !== expectedUserId) {
          throw new Error("calendar_oauth_user_mismatch");
        }
      },
    });
    return redirect("connected");
  } catch {
    return redirect("error");
  }
}
