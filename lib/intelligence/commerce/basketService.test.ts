import { describe, expect, it, vi } from "vitest";
import { createLearningBasketService } from "@/lib/intelligence/commerce/basketService";
import type { ApprovedPlanRevision } from "@/lib/intelligence/recommendations/types";
import type { CommerceResult, LearningBasket, LearningBasketRepository } from "@/lib/intelligence/commerce/types";

const snapshot = (userId = "user-1"): ApprovedPlanRevision => ({ userId, ideaId: "idea-1", sourceId: "source-1", planId: "plan-1", planType: "lesson", revisionId: "revision-2", revisionNumber: 2, status: "saved", content: {}, provenance: {} as never, approvedAt: "2026-07-24T00:00:00.000Z" });
const commerce = (): CommerceResult => ({ provider: "shopify", status: "ready", products: [{ commerceRecommendationId: "commerce-1", sourceRecommendationId: "r", resourceKey: "paper", product: { provider: "shopify", providerProductId: "product-1", providerVariantId: "variant-1", title: "Paper kit", summary: "", productUrl: "https://shop.example/paper", imageUrl: null, price: { amount: 9.5, currency: "AUD" }, availability: "available", stockStatus: "in_stock", region: "AU", fulfilmentType: "third_party_shopify_seller", resourceKeys: ["paper"], tags: [], educationalCategory: null, priceBand: null, ageStages: [], subjects: [], lastSyncedAt: "", disclosure: "MyLearna may earn revenue." }, required: true, optional: false, matchConfidence: 1, matchReasons: [], priorityRank: 10000, reasonCode: "ESSENTIAL_COMMERCIAL", parentReadableReason: "", engineVersion: "commerce", rulesVersion: "rules", sourcePlan: { planId: "plan-1", revisionId: "revision-2", revisionNumber: 2 }, provenance: { sourceProvenance: {} as never, generatedAt: "" } }], exclusions: [], unmatchedResourceKeys: [], generatedAt: "" });

describe("learning basket service", () => {
  it("stores a server-derived price snapshot and exact approved revision", async () => {
    const saved: LearningBasket = { id: "basket-1", userId: "user-1", planId: "plan-1", revisionId: "revision-2", revisionNumber: 2, status: "active", currency: "AUD", items: [], createdAt: "", updatedAt: "" };
    const repository: LearningBasketRepository = { getForUser: vi.fn(), addItemForUser: vi.fn(async (_user, input) => { expect(input.revisionId).toBe("revision-2"); expect(input.priceSnapshot).toEqual({ amount: 9.5, currency: "AUD" }); return saved; }), removeItemForUser: vi.fn() };
    await createLearningBasketService(repository).addItemForUser("user-1", snapshot(), commerce(), { commerceRecommendationId: "commerce-1", quantity: 1 });
    expect(repository.addItemForUser).toHaveBeenCalledOnce();
  });

  it("rejects cross-user access and arbitrary products", async () => {
    const repository: LearningBasketRepository = { getForUser: vi.fn(), addItemForUser: vi.fn(), removeItemForUser: vi.fn() };
    const service = createLearningBasketService(repository);
    await expect(service.addItemForUser("user-2", snapshot(), commerce(), { commerceRecommendationId: "commerce-1", quantity: 1 })).rejects.toMatchObject({ code: "not_found" });
    await expect(service.addItemForUser("user-1", snapshot(), commerce(), { commerceRecommendationId: "other", quantity: 1 })).rejects.toMatchObject({ code: "invalid_input" });
  });
});
