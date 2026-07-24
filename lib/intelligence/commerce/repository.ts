import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import type { CommerceEvent, CommerceEventRepository, CommerceMappingRepository, CommerceResourceMapping, LearningBasket, LearningBasketItem, LearningBasketRepository } from "@/lib/intelligence/commerce/types";

export class CommerceRepositoryError extends Error {
  readonly code: "persistence" | "not_found";

  constructor(code: CommerceRepositoryError["code"], message: string) {
    super(message);
    this.name = "CommerceRepositoryError";
    this.code = code;
  }
}

type QueryClient = Pick<SupabaseClient, "from">;

function text(value: unknown) { return typeof value === "string" ? value : String(value ?? ""); }
function record(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function errorMessage(error: unknown, fallback: string) {
  const message = error && typeof error === "object" && "message" in error ? text((error as { message?: unknown }).message) : "";
  return new CommerceRepositoryError("persistence", message || fallback);
}
function assertUser(userId: string) { if (!userId.trim()) throw new CommerceRepositoryError("not_found", "A signed-in user is required."); }

function toMapping(row: Record<string, unknown>): CommerceResourceMapping {
  return {
    id: text(row.id), resourceKey: text(row.resource_key), provider: "shopify", providerProductId: text(row.provider_product_id), providerVariantId: text(row.provider_variant_id) || null,
    status: text(row.status) as CommerceResourceMapping["status"], matchConfidence: Number(row.match_confidence) || 0, preferred: row.preferred === true, paused: row.paused === true,
    notes: text(row.notes), createdByUserId: text(row.created_by_user_id) || null, approvedByUserId: text(row.approved_by_user_id) || null, createdAt: text(row.created_at), updatedAt: text(row.updated_at),
  };
}

export function createSupabaseCommerceMappingRepository(client: QueryClient = supabase): CommerceMappingRepository {
  return {
    async listForResourceKeys(resourceKeys) {
      if (!resourceKeys.length) return [];
      const response = await client.from("intelligence_commerce_resource_mappings").select("id,resource_key,provider,provider_product_id,provider_variant_id,status,match_confidence,preferred,paused,notes,created_by_user_id,approved_by_user_id,created_at,updated_at").eq("provider", "shopify").in("resource_key", resourceKeys);
      if (response.error) throw errorMessage(response.error, "We could not load commerce mappings.");
      return ((response.data ?? []) as Record<string, unknown>[]).map(toMapping);
    },
    async listAll() {
      const response = await client.from("intelligence_commerce_resource_mappings").select("id,resource_key,provider,provider_product_id,provider_variant_id,status,match_confidence,preferred,paused,notes,created_by_user_id,approved_by_user_id,created_at,updated_at").eq("provider", "shopify").order("updated_at", { ascending: false });
      if (response.error) throw errorMessage(response.error, "We could not load commerce mappings.");
      return ((response.data ?? []) as Record<string, unknown>[]).map(toMapping);
    },
    async upsertForAdmin(input) {
      const response = await client.from("intelligence_commerce_resource_mappings").upsert({
        resource_key: input.resourceKey, provider: input.provider, provider_product_id: input.providerProductId, provider_variant_id: input.providerVariantId,
        status: input.status, match_confidence: input.matchConfidence, preferred: input.preferred, paused: input.paused, notes: input.notes,
        created_by_user_id: input.createdByUserId, approved_by_user_id: input.approvedByUserId,
      }, { onConflict: "resource_key,provider,provider_product_id,provider_variant_id" }).select("id,resource_key,provider,provider_product_id,provider_variant_id,status,match_confidence,preferred,paused,notes,created_by_user_id,approved_by_user_id,created_at,updated_at").single();
      if (response.error || !response.data) throw errorMessage(response.error, "We could not save the commerce mapping.");
      return toMapping(response.data as Record<string, unknown>);
    },
  };
}

const basketColumns = "id,user_id,plan_id,revision_id,revision_number,status,currency,created_at,updated_at";
const itemColumns = "id,basket_id,resource_key,provider,provider_product_id,provider_variant_id,title,quantity,price_amount,currency,product_url,fulfilment_type,status,created_at,updated_at";

function toItem(row: Record<string, unknown>): LearningBasketItem {
  return { id: text(row.id), basketId: text(row.basket_id), resourceKey: text(row.resource_key), provider: "shopify", providerProductId: text(row.provider_product_id), providerVariantId: text(row.provider_variant_id), title: text(row.title), quantity: Number(row.quantity) || 1, priceSnapshot: { amount: Number(row.price_amount) || 0, currency: text(row.currency) || "AUD" }, productUrl: text(row.product_url), fulfilmentType: text(row.fulfilment_type) as LearningBasketItem["fulfilmentType"], status: text(row.status) as LearningBasketItem["status"], createdAt: text(row.created_at), updatedAt: text(row.updated_at) };
}

function toBasket(row: Record<string, unknown>, items: LearningBasketItem[]): LearningBasket {
  return { id: text(row.id), userId: text(row.user_id), planId: text(row.plan_id), revisionId: text(row.revision_id), revisionNumber: Number(row.revision_number) || 0, status: text(row.status) as LearningBasket["status"], currency: text(row.currency) || "AUD", items, createdAt: text(row.created_at), updatedAt: text(row.updated_at) };
}

async function itemsFor(client: QueryClient, basketId: string) {
  const response = await client.from("intelligence_learning_basket_items").select(itemColumns).eq("basket_id", basketId).eq("status", "active").order("created_at", { ascending: true });
  if (response.error) throw errorMessage(response.error, "We could not load basket items.");
  return ((response.data ?? []) as Record<string, unknown>[]).map(toItem);
}

export function createSupabaseLearningBasketRepository(client: QueryClient = supabase): LearningBasketRepository {
  return {
    async getForUser(userId, planId, revisionId) {
      assertUser(userId);
      const response = await client.from("intelligence_learning_baskets").select(basketColumns).eq("user_id", userId).eq("plan_id", planId).eq("revision_id", revisionId).eq("status", "active").maybeSingle();
      if (response.error) throw errorMessage(response.error, "We could not load your learning basket.");
      if (!response.data) return null;
      return toBasket(response.data as Record<string, unknown>, await itemsFor(client, text((response.data as Record<string, unknown>).id)));
    },
    async addItemForUser(userId, input) {
      assertUser(userId);
      const existing = await this.getForUser(userId, input.planId, input.revisionId);
      let basketRow: Record<string, unknown>;
      if (existing) basketRow = { id: existing.id, user_id: existing.userId, plan_id: existing.planId, revision_id: existing.revisionId, revision_number: existing.revisionNumber, status: existing.status, currency: existing.currency, created_at: existing.createdAt, updated_at: existing.updatedAt };
      else {
        const created = await client.from("intelligence_learning_baskets").insert({ user_id: userId, plan_id: input.planId, revision_id: input.revisionId, revision_number: input.revisionNumber, status: "active", currency: input.priceSnapshot.currency }).select(basketColumns).single();
        if (created.error || !created.data) throw errorMessage(created.error, "We could not create your learning basket.");
        basketRow = created.data as Record<string, unknown>;
      }
      const basketId = text(basketRow.id);
      const existingItem = await client.from("intelligence_learning_basket_items").select(itemColumns).eq("basket_id", basketId).eq("resource_key", input.resourceKey).eq("provider_product_id", input.providerProductId).eq("provider_variant_id", input.providerVariantId).eq("status", "active").maybeSingle();
      if (existingItem.error) throw errorMessage(existingItem.error, "We could not check your basket.");
      if (existingItem.data) {
        const updated = await client.from("intelligence_learning_basket_items").update({ quantity: Number((existingItem.data as Record<string, unknown>).quantity) + input.quantity, price_amount: input.priceSnapshot.amount, currency: input.priceSnapshot.currency }).eq("id", text((existingItem.data as Record<string, unknown>).id)).eq("basket_id", basketId).select(itemColumns).single();
        if (updated.error || !updated.data) throw errorMessage(updated.error, "We could not update your basket item.");
      } else {
        const inserted = await client.from("intelligence_learning_basket_items").insert({ basket_id: basketId, resource_key: input.resourceKey, provider: input.provider, provider_product_id: input.providerProductId, provider_variant_id: input.providerVariantId, title: input.title, quantity: input.quantity, price_amount: input.priceSnapshot.amount, currency: input.priceSnapshot.currency, product_url: input.productUrl, fulfilment_type: input.fulfilmentType, status: input.status }).select(itemColumns).single();
        if (inserted.error || !inserted.data) throw errorMessage(inserted.error, "We could not add that product to your basket.");
      }
      return toBasket(basketRow, await itemsFor(client, basketId));
    },
    async removeItemForUser(userId, basketId, itemId) {
      assertUser(userId);
      const basket = await client.from("intelligence_learning_baskets").select(basketColumns).eq("id", basketId).eq("user_id", userId).maybeSingle();
      if (basket.error || !basket.data) throw new CommerceRepositoryError("not_found", "That learning basket is not available.");
      const removed = await client.from("intelligence_learning_basket_items").update({ status: "removed" }).eq("id", itemId).eq("basket_id", basketId);
      if (removed.error) throw errorMessage(removed.error, "We could not remove that basket item.");
      return toBasket(basket.data as Record<string, unknown>, await itemsFor(client, basketId));
    },
  };
}

function toEvent(row: Record<string, unknown>): CommerceEvent {
  return { id: text(row.id), userId: text(row.user_id), planId: text(row.plan_id), revisionId: text(row.revision_id), revisionNumber: Number(row.revision_number) || 0, eventType: text(row.event_type) as CommerceEvent["eventType"], provider: "shopify", productId: text(row.product_id) || null, resourceKey: text(row.resource_key) || null, metadata: record(row.metadata) as CommerceEvent["metadata"], createdAt: text(row.created_at) };
}

export function createSupabaseCommerceEventRepository(client: QueryClient = supabase): CommerceEventRepository {
  return {
    async recordForUser(userId, input) {
      assertUser(userId);
      const response = await client.from("intelligence_commerce_events").insert({ user_id: userId, plan_id: input.planId, revision_id: input.revisionId, revision_number: input.revisionNumber, event_type: input.eventType, provider: input.provider, product_id: input.productId, resource_key: input.resourceKey, metadata: input.metadata }).select("id,user_id,plan_id,revision_id,revision_number,event_type,provider,product_id,resource_key,metadata,created_at").single();
      if (response.error || !response.data) throw errorMessage(response.error, "We could not record that commerce event.");
      return toEvent(response.data as Record<string, unknown>);
    },
  };
}
