import "server-only";

import { createClient } from "@supabase/supabase-js";

import { buildResourceFactoryMarketplaceProjection } from "@/lib/resourceFactory/marketplaceProjection";
import { renderResourceFactoryWorksheetPreviewPng } from "@/lib/resourceFactory/pdfPreview.server";
import type {
  ResourceFactoryQaReport,
  ResourceFactoryWorksheetSpec,
} from "@/lib/resourceFactory/types";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

const MYLEARNA_HOMESCHOOL_SUPABASE_URL =
  "https://jgllsqixpfypunnstinl.supabase.co";

function createAdminClient() {
  const url =
    clean(process.env.SUPABASE_URL) ||
    clean(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
    MYLEARNA_HOMESCHOOL_SUPABASE_URL;
  const key = clean(
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
  );
  if (!key) {
    throw new Error("Resource Factory requires Supabase service-role configuration.");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function bucketName() {
  return clean(process.env.RESOURCE_FACTORY_STORAGE_BUCKET) || "resource-factory-public";
}

function appUrl() {
  return (clean(process.env.MYLEARNA_APP_URL) || "https://www.mylearna.com").replace(/\/$/, "");
}

export function resourceFactoryAutoPublishEnabled() {
  return clean(process.env.RESOURCE_FACTORY_AUTO_PUBLISH).toLowerCase() === "true";
}

export function resourceFactoryAutoPromoteEnabled() {
  return clean(process.env.RESOURCE_FACTORY_AUTO_PROMOTE).toLowerCase() === "true";
}

async function uploadAsset(input: {
  path: string;
  bytes: Uint8Array;
  contentType: "application/pdf" | "image/png";
}) {
  const admin = createAdminClient();
  const bucket = bucketName();
  const upload = await admin.storage.from(bucket).upload(input.path, input.bytes, {
    contentType: input.contentType,
    cacheControl: "3600",
    upsert: true,
  });
  if (upload.error) {
    throw new Error(`Resource Factory upload failed: ${upload.error.message}`);
  }

  return {
    objectPath: input.path,
    href: admin.storage.from(bucket).getPublicUrl(input.path).data.publicUrl,
    byteSize: input.bytes.byteLength,
  };
}

async function persistArtifacts(input: {
  jobId: string;
  worksheet: { objectPath: string; byteSize: number };
  answers: { objectPath: string; byteSize: number };
  preview: { objectPath: string; byteSize: number };
}) {
  const admin = createAdminClient();
  const kinds = ["worksheet_pdf", "answers_pdf", "worksheet_preview_png"];

  const removed = await admin
    .from("resource_factory_artifacts")
    .delete()
    .eq("job_id", input.jobId)
    .in("artifact_kind", kinds);
  if (removed.error) {
    throw new Error(
      `Resource Factory artifact cleanup failed: ${removed.error.message}`,
    );
  }

  const inserted = await admin.from("resource_factory_artifacts").insert([
    {
      job_id: input.jobId,
      artifact_kind: "worksheet_pdf",
      object_path: input.worksheet.objectPath,
      mime_type: "application/pdf",
      byte_size: input.worksheet.byteSize,
    },
    {
      job_id: input.jobId,
      artifact_kind: "answers_pdf",
      object_path: input.answers.objectPath,
      mime_type: "application/pdf",
      byte_size: input.answers.byteSize,
    },
    {
      job_id: input.jobId,
      artifact_kind: "worksheet_preview_png",
      object_path: input.preview.objectPath,
      mime_type: "image/png",
      byte_size: input.preview.byteSize,
    },
  ]);
  if (inserted.error) {
    throw new Error(
      `Resource Factory artifact write failed: ${inserted.error.message}`,
    );
  }
}

export async function publishResourceFactoryRun(input: {
  jobId: string;
  spec: ResourceFactoryWorksheetSpec;
  qa: ResourceFactoryQaReport;
  worksheetPdf: Uint8Array;
  answerPdf: Uint8Array;
  active?: boolean;
}) {
  const safeSlug = input.spec.slug
    .replace(/[^a-z0-9-]+/gi, "-")
    .replace(/^-+|-+$/g, "");
  const root = `resource-factory/${input.jobId}`;

  const previewPng = await renderResourceFactoryWorksheetPreviewPng(
    input.worksheetPdf,
  );

  const worksheet = await uploadAsset({
    path: `${root}/${safeSlug}.pdf`,
    bytes: input.worksheetPdf,
    contentType: "application/pdf",
  });
  const answers = await uploadAsset({
    path: `${root}/${safeSlug}-answers.pdf`,
    bytes: input.answerPdf,
    contentType: "application/pdf",
  });
  const preview = await uploadAsset({
    path: `${root}/${safeSlug}-preview.png`,
    bytes: previewPng,
    contentType: "image/png",
  });

  const pinterestImageUrl =
    `${appUrl()}/api/resource-factory/pinterest/${encodeURIComponent(input.spec.slug)}`;
  const active = input.active ?? resourceFactoryAutoPublishEnabled();

  const projection = buildResourceFactoryMarketplaceProjection({
    spec: input.spec,
    qa: input.qa,
    active,
    assets: {
      worksheetHref: worksheet.href,
      answersHref: answers.href,
      thumbnailUrl: preview.href,
      previewImageHref: preview.href,
      pinterestImageUrls: [pinterestImageUrl],
    },
  });

  const admin = createAdminClient();
  const response = await admin
    .from("marketplace_resources")
    .upsert(projection, { onConflict: "source,external_product_id" })
    .select("id,handle")
    .single();

  if (response.error) {
    throw new Error(
      `Resource Factory Marketplace publish failed: ${response.error.message}`,
    );
  }

  await persistArtifacts({
    jobId: input.jobId,
    worksheet,
    answers,
    preview,
  });

  return {
    marketplaceResourceId: response.data.id as string,
    handle: response.data.handle as string,
    active,
    detailHref: `${appUrl()}/marketplace/worksheets/${encodeURIComponent(input.spec.slug)}`,
    worksheetHref: worksheet.href,
    answersHref: answers.href,
    previewImageUrl: preview.href,
    pinterestImageUrl,
    metadata: projection.metadata,
  };
}
