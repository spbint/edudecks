import type { ApprovedPlanRevision } from "@/lib/intelligence/recommendations/types";
import type { CommerceProductCandidate, CommerceResult, LearningBasket, LearningBasketRepository } from "@/lib/intelligence/commerce/types";

export class LearningBasketServiceError extends Error {
  readonly code: "not_found" | "invalid_input" | "persistence";

  constructor(code: LearningBasketServiceError["code"], message: string) {
    super(message);
    this.name = "LearningBasketServiceError";
    this.code = code;
  }
}

export interface LearningBasketService {
  addItemForUser(userId: string, snapshot: ApprovedPlanRevision, commerce: CommerceResult, input: { commerceRecommendationId: string; quantity: number }): Promise<LearningBasket>;
}

export function createLearningBasketService(repository: LearningBasketRepository): LearningBasketService {
  return {
    async addItemForUser(userId, snapshot, commerce, input) {
      if (!userId.trim() || snapshot.userId !== userId) throw new LearningBasketServiceError("not_found", "That approved plan is not available.");
      if (commerce.status !== "ready") throw new LearningBasketServiceError("invalid_input", "The Shopify catalogue is not available right now.");
      if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 50) throw new LearningBasketServiceError("invalid_input", "Choose a quantity between 1 and 50.");
      const candidate = commerce.products.find((item) => item.commerceRecommendationId === input.commerceRecommendationId) as CommerceProductCandidate | undefined;
      if (!candidate || candidate.product.availability !== "available") throw new LearningBasketServiceError("invalid_input", "That product is no longer eligible for this approved learning plan.");
      try {
        return await repository.addItemForUser(userId, {
          planId: snapshot.planId,
          revisionId: snapshot.revisionId,
          revisionNumber: snapshot.revisionNumber,
          resourceKey: candidate.resourceKey,
          provider: "shopify",
          providerProductId: candidate.product.providerProductId,
          providerVariantId: candidate.product.providerVariantId,
          title: candidate.product.title,
          quantity: input.quantity,
          priceSnapshot: candidate.product.price,
          productUrl: candidate.product.productUrl,
          fulfilmentType: candidate.product.fulfilmentType,
          status: "active",
        });
      } catch (error) {
        throw new LearningBasketServiceError("persistence", error instanceof Error ? error.message : "We could not update your learning basket.");
      }
    },
  };
}
