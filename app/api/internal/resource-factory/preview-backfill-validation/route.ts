import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { renderResourceFactoryWorksheetPreviewPng } from "@/lib/resourceFactory/pdfPreview.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALIDATION_RESOURCE_ID = "MYL-AUTO-AI-FRAC-5A8F1C9B20";
const SUPABASE_URL = "https://jgllsqixpfypunnstinl.supabase.co";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export async function GET() {
  if (process.env.VERCEL_ENV !== "preview") {
    return new Response("Not found.", { status: 404 });
  }

  const serviceKey = clean(
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
  );
  if (!serviceKey) {
    return NextResponse.json(
      { error: "Preview service-role configuration is unavailable." },
      { status: 503 },
    );
  }

  const admin = createClient(
    clean(process.env.SUPABASE_URL) ||
      clean(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
      SUPABASE_URL,
    serviceKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );

  const resourceResponse = await admin
    .from("marketplace_resources")
    .select("id,handle,metadata")
    .eq("source", "mylearna_agent")
    .eq("external_product_id", VALIDATION_RESOURCE_ID)
    .maybeSingle();

  if (resourceResponse.error || !resourceResponse.data) {
    return NextResponse.json(
      { error: "Validation resource is unavailable." },
      { status: 404 },
    );
  }

  const metadata = asRecord(resourceResponse.data.metadata);
  if (metadata.validation_only !== true) {
    return NextResponse.json(
      { error: "Resource is not a validation resource." },
      { status: 403 },
    );
  }

  const worksheetHref = clean(metadata.worksheet_href);
  if (!worksheetHref) {
    return NextResponse.json(
      { error: "Worksheet PDF URL is unavailable." },
      { status: 409 },
    );
  }

  const jobResponse = await admin
    .from("resource_factory_jobs")
    .select("id")
    .eq("resource_id", VALIDATION_RESOURCE_ID)
    .maybeSingle();

  if (jobResponse.error || !jobResponse.data) {
    return NextResponse.json(
      { error: "Resource Factory job is unavailable." },
      { status: 404 },
    );
  }

  const pdfResponse = await fetch(worksheetHref, { cache: "no-store" });
  if (!pdfResponse.ok) {
    return NextResponse.json(
      { error: "Worksheet PDF could not be read." },
      { status: 502 },
    );
  }

  const pdfBytes = new Uint8Array(await pdfResponse.arrayBuffer());
  const previewBytes = await renderResourceFactoryWorksheetPreviewPng(pdfBytes);
  const handle = clean(resourceResponse.data.handle);
  const bucket =
    clean(process.env.RESOURCE_FACTORY_STORAGE_BUCKET) || "resource-factory-public";
  const objectPath =
    `resource-factory/${jobResponse.data.id}/${handle}-preview.png`;

  const upload = await admin.storage.from(bucket).upload(
    objectPath,
    previewBytes,
    {
      contentType: "image/png",
      cacheControl: "3600",
      upsert: true,
    },
  );

  if (upload.error) {
    return NextResponse.json(
      { error: upload.error.message },
      { status: 500 },
    );
  }

  const previewHref = admin.storage
    .from(bucket)
    .getPublicUrl(objectPath).data.publicUrl;

  const updateResource = await admin
    .from("marketplace_resources")
    .update({
      thumbnail_url: previewHref,
      metadata: {
        ...metadata,
        preview_image_href: previewHref,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", resourceResponse.data.id);

  if (updateResource.error) {
    return NextResponse.json(
      { error: updateResource.error.message },
      { status: 500 },
    );
  }

  await admin
    .from("resource_factory_artifacts")
    .delete()
    .eq("job_id", jobResponse.data.id)
    .eq("artifact_kind", "worksheet_preview_png");

  const artifact = await admin.from("resource_factory_artifacts").insert({
    job_id: jobResponse.data.id,
    artifact_kind: "worksheet_preview_png",
    object_path: objectPath,
    mime_type: "image/png",
    byte_size: previewBytes.byteLength,
  });

  if (artifact.error) {
    return NextResponse.json(
      { error: artifact.error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    resourceId: VALIDATION_RESOURCE_ID,
    previewHref,
    objectPath,
    bytes: previewBytes.byteLength,
  });
}
