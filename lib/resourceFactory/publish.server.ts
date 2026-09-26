import "server-only";

import { createClient } from "@supabase/supabase-js";

import { buildResourceFactoryMarketplaceProjection } from "@/lib/resourceFactory/marketplaceProjection";
import type {
  ResourceFactoryQaReport,
  ResourceFactoryWorksheetSpec,
} from "@/lib/resourceFactory/types";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function createAdminClient() {
  const url = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = clean(
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
  );
  if (!url || !key) {
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

async function uploadPdf(input: {
  path: string;
  bytes: Uint8Array;
}) {
  const admin = createAdminClient();
  const bucket = bucketName();
  const upload = await admin.storage.from(bucket).upload(input.path, input.bytes, {
    contentType: "application/pdf",
    cacheControl: "3600",
    upsert: true,
  });
  if (upload.error) {
    throw new Error(`Resource Factory upload failed: ${upload.error.message}`);
  }
  return admin.storage.from(bucket).getPublicUrl(input.path).data.publicUrl;
}

export async function publishResourceFactoryRun(input: {
  jobId: string;
  spec: ResourceFactoryWorksheetSpec;
  qa: ResourceFactoryQaReport;
  worksheetPdf: Uint8Array;
  answerPdf: Uint8Array;
}) {
  const safeSlug = input.spec.slug.replace(/[^a-z0-9-]+/gi, "-").replace(/^-+|-+$/g, "");
  const root = `resource-factory/${input.jobId}`;
  const worksheetHref = await uploadPdf({
    path: `${root}/${safeSlug}.pdf`,
    bytes: input.worksheetPdf,
  });
  const answersHref = await uploadPdf({
    path: `${root}/${safeSlug}-answers.pdf`,
    bytes: input.answerPdf,
  });

  const pinterestImageUrl =
    `${appUrl()}/api/resource-factory/pinterest/${encodeURIComponent(input.spec.slug)}`;

  const projection = buildResourceFactoryMarketplaceProjection({
    spec: input.spec,
    qa: input.qa,
    active: true,
    assets: {
      worksheetHref,
      answersHref,
      thumbnailUrl: pinterestImageUrl,
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
    throw new Error(`Resource Factory Marketplace publish failed: ${response.error.message}`);
  }

  return {
    marketplaceResourceId: response.data.id as string,
    handle: response.data.handle as string,
    detailHref: `${appUrl()}/marketplace/worksheets/${encodeURIComponent(input.spec.slug)}`,
    worksheetHref,
    answersHref,
    pinterestImageUrl,
  };
}
