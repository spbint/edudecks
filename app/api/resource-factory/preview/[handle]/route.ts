import { NextResponse } from "next/server";

import { getPublishedAgentMarketplaceResourceByHandle } from "@/lib/resourceFactory/marketplace.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ handle: string }> },
) {
  const resource = await getPublishedAgentMarketplaceResourceByHandle(
    (await context.params).handle,
  );
  if (!resource) {
    return new Response("Resource not found.", { status: 404 });
  }

  const previewHref =
    clean(resource.metadata.preview_image_href) || resource.thumbnailUrl;
  if (!previewHref) {
    return new Response("Worksheet preview is not available.", { status: 404 });
  }

  try {
    const url = new URL(previewHref);
    if (url.protocol !== "https:") {
      throw new Error("Preview URL must use HTTPS.");
    }

    const response = NextResponse.redirect(url, 307);
    response.headers.set("cache-control", "public, max-age=300");
    return response;
  } catch {
    return new Response("Worksheet preview is not available.", { status: 404 });
  }
}
