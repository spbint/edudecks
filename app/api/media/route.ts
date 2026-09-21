import { NextResponse } from "next/server";
import { getAuthenticatedRouteUser, getServerAuthClient } from "@/lib/auth/serverRouteAuth";
import {
  FamilyMediaManagerError,
  removeManagedFamilyMedia,
} from "@/lib/clean/media/mediaManager";
import {
  createMediaManagerAdminClient,
  createSupabaseFamilyMediaRemovalRepository,
  loadFamilyMediaManager,
} from "@/lib/clean/media/mediaManager.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: unknown) {
  return String(value ?? "").trim();
}

const noStore = { "cache-control": "no-store" };

export async function GET(request: Request) {
  const user = await getAuthenticatedRouteUser();
  if (!user) {
    return NextResponse.json(
      { code: "media_authentication_required", error: "Sign in to manage family media." },
      { status: 401, headers: noStore },
    );
  }

  const familyId = clean(new URL(request.url).searchParams.get("familyId"));
  if (!familyId) {
    return NextResponse.json(
      { code: "media_family_required", error: "Choose a family before managing media." },
      { status: 400, headers: noStore },
    );
  }

  try {
    const payload = await loadFamilyMediaManager({
      familyId,
      userId: user.id,
      authenticatedClient: await getServerAuthClient(),
      adminClient: createMediaManagerAdminClient(),
    });
    return NextResponse.json(payload, { headers: noStore });
  } catch (error) {
    const forbidden = error instanceof Error && error.message === "family_media_forbidden";
    return NextResponse.json(
      {
        code: forbidden ? "media_family_forbidden" : "media_manager_unavailable",
        error: forbidden
          ? "This family media library is unavailable."
          : "Family media is temporarily unavailable. Text learning records are unaffected.",
      },
      { status: forbidden ? 403 : 503, headers: noStore },
    );
  }
}

export async function DELETE(request: Request) {
  const user = await getAuthenticatedRouteUser();
  if (!user) {
    return NextResponse.json(
      { code: "media_authentication_required", error: "Sign in to manage family media." },
      { status: 401, headers: noStore },
    );
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const familyId = clean(body?.familyId);
  const assetId = clean(body?.assetId);
  if (!familyId || !assetId) {
    return NextResponse.json(
      { code: "media_item_required", error: "This media item is unavailable." },
      { status: 400, headers: noStore },
    );
  }

  try {
    const adminClient = createMediaManagerAdminClient();
    const result = await removeManagedFamilyMedia({
      familyId,
      assetId,
      userId: user.id,
      repository: createSupabaseFamilyMediaRemovalRepository({
        authenticatedClient: await getServerAuthClient(),
        adminClient,
      }),
    });
    return NextResponse.json(result, { headers: noStore });
  } catch (error) {
    if (error instanceof FamilyMediaManagerError) {
      return NextResponse.json(
        { code: error.code, error: error.message },
        { status: error.status, headers: noStore },
      );
    }
    return NextResponse.json(
      {
        code: "media_manager_unavailable",
        error: "This media file could not be removed right now. The learning record remains safe.",
      },
      { status: 503, headers: noStore },
    );
  }
}
