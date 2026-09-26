import "server-only";

import { createClient } from "@supabase/supabase-js";

export type AgentMarketplaceResource = {
  id: string;
  externalProductId: string;
  handle: string;
  title: string;
  thumbnailUrl: string;
  primaryCollection: string;
  subcollection: string;
  resourceFormat: string;
  metadata: Record<string, unknown>;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function createMarketplaceAdminClient() {
  const url = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = clean(
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
  );
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function mapResource(row: Record<string, unknown>): AgentMarketplaceResource {
  return {
    id: clean(row.id),
    externalProductId: clean(row.external_product_id),
    handle: clean(row.handle),
    title: clean(row.title),
    thumbnailUrl: clean(row.thumbnail_url),
    primaryCollection: clean(row.primary_collection),
    subcollection: clean(row.subcollection),
    resourceFormat: clean(row.resource_format),
    metadata: asRecord(row.metadata),
  };
}

const SELECT =
  "id,external_product_id,handle,title,thumbnail_url,primary_collection,subcollection,resource_format,metadata";

export async function listPublishedAgentMarketplaceResources(options?: {
  limit?: number;
}): Promise<AgentMarketplaceResource[]> {
  const admin = createMarketplaceAdminClient();
  if (!admin) return [];

  const limit = Math.max(1, Math.min(100, options?.limit ?? 24));
  const response = await admin
    .from("marketplace_resources")
    .select(SELECT)
    .eq("source", "mylearna_agent")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (response.error) {
    console.error("Unable to load agent Marketplace resources.", response.error);
    return [];
  }

  return (response.data ?? []).map((row) =>
    mapResource(row as unknown as Record<string, unknown>),
  );
}

export async function getPublishedAgentMarketplaceResourceByHandle(
  handle: string,
): Promise<AgentMarketplaceResource | null> {
  const cleanHandle = clean(handle);
  if (!cleanHandle) return null;

  const admin = createMarketplaceAdminClient();
  if (!admin) return null;

  const response = await admin
    .from("marketplace_resources")
    .select(SELECT)
    .eq("source", "mylearna_agent")
    .eq("is_active", true)
    .eq("handle", cleanHandle)
    .maybeSingle();

  if (response.error || !response.data) return null;
  return mapResource(response.data as unknown as Record<string, unknown>);
}
